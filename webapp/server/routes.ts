import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { subDays } from "date-fns";
import { 
  insertLeadSchema, 
  insertChatMessageSchema, 
  insertVoiceCallSchema,
  insertAffiliateSchema,
  insertAffiliateReferralSchema,
  insertSerenityRewardsTransactionSchema,
  insertAffiliateCompetitionSchema,
  insertAppointmentSchema,
  insertEmailCampaignSchema,
  insertCampaignHistorySchema
} from "@shared/schema";
import { generateChatbotResponse, qualifyLead } from "./services/openai";
import { sendLeadNotification } from "./services/sms";
import { sendLeadEmail } from "./services/email";
import { sendLeadThankYouEmail, sendAdminLeadNotification } from "./services/email-service";
import { 
  sendWelcomeEmail,
  listInboxMessages,
  getMessageDetails,
  createLabel,
  listLabels,
  applyLabel,
  markAsRead,
  getThread,
  initializeLeadLabels
} from "./services/gmail-service";
import { crmSync, startInboxMonitoring, stopInboxMonitoring } from "./services/crm-sync";
import { parseEmailForLeadData, determineLeadPriority, formatLeadDataForDb } from "./services/email-parser";
import { notifyAdminOfNewLead } from "./services/simple-email-notification";
import { notifyNewLead } from "./services/notifications";
import { imageUploadService } from "./services/image-upload";
import { generatePoolDesign, type PoolDesignRequest } from "./services/google-pool-designer";
import { z } from "zod";
import { generateAutoReply, analyzeEmailIntent, calculateLeadScore as calculateEmailScore } from "./services/ai-auto-reply";
import { generatePersonalizedTemplate, getAllTemplates, getTemplateById, selectBestTemplate } from "./services/email-templates";
import { analyzeEmailForScoring, calculateLeadScore, analyzeEmailThread } from "./services/email-service";
import { startEmailQueue, stopEmailQueue, getQueueStatus, triggerQueueProcessing, clearQueue } from "./services/email-queue";
import { 
  determineCampaignForLead, 
  getCampaignDefinition, 
  calculateNextSendTime,
  processCampaigns,
  type CampaignType
} from "./services/email-campaigns";

import { registerAffiliateRoutes } from "./routes-affiliate";
import { registerLeadNotificationRoutes } from "./routes/lead-notifications";
import { registerAdminRoutes } from "./routes-admin";
import { generateSitemap } from "./routes/sitemap";
import { generateRobots } from "./routes/robots";
import blogRoutes from "./routes-blog";
import * as blogAutomation from "./routes/blog-automation";
import { dynamicRouteHandler } from "./routes-selfmod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // CRITICAL: Register dynamic route handler FIRST before all other routes
  // This allows dynamically created routes to work for ANY path
  app.use(dynamicRouteHandler);
  
  // SEO Routes (sitemap and robots)
  app.get('/sitemap.xml', generateSitemap);
  app.get('/robots.txt', generateRobots);
  
  // Serve uploaded images
  app.use('/api/uploads', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    next();
  });
  app.use('/api/uploads', express.static(path.join(process.cwd(), 'server/public/uploads')));
  
  // Serve stock pool images from attached_assets
  app.get('/api/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(process.cwd(), 'attached_assets/stock_images', filename);
    
    if (fs.existsSync(imagePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
      res.sendFile(imagePath);
    } else {
      res.status(404).send('Image not found');
    }
  });
  
  // Serve static files for downloads
  app.use('/api/downloads', (req, res, next) => {
    // Add headers for file downloads
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('Cache-Control', 'no-cache');
    next();
  });

  // Pool Design Guide download endpoint
  app.get('/api/downloads/pool-design-guide.pdf', async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'server/public/downloads/AquaLux-Pool-Design-Guide.pdf');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="AquaLux-Pool-Design-Guide.pdf"');
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('File download error:', err);
          res.status(404).json({ success: false, error: 'File not found' });
        }
      });
    } catch (error) {
      console.error('Download endpoint error:', error);
      res.status(500).json({ success: false, error: 'Download failed' });
    }
  });

  // Import campaign scheduler functions
  const { autoEnrollLead, getCampaignProcessorStatus, stopCampaignProcessor, startCampaignProcessor } = 
    await import('./services/campaign-scheduler');

  // Lead management routes
  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      
      // Send ONE admin notification with all details
      await notifyAdminOfNewLead({
        firstName: leadData.firstName,
        lastName: leadData.lastName || undefined,
        email: leadData.email,
        phone: leadData.phone || undefined,
        projectType: leadData.projectType || undefined,
        budgetRange: leadData.budgetRange || undefined,
        message: leadData.message || undefined,
        city: leadData.city || undefined,
        source: leadData.source,
        affiliateId: leadData.affiliateId || undefined
      });
      
      // Send ONE welcome email to customer using Gmail with AI personalization (if configured)
      if (process.env.GOOGLE_REFRESH_TOKEN) {
        const emailResult = await sendWelcomeEmail({
          firstName: leadData.firstName,
          lastName: leadData.lastName || undefined,
          email: leadData.email,
          phone: leadData.phone || undefined,
          projectType: leadData.projectType || undefined,
          budgetRange: leadData.budgetRange || undefined,
          message: leadData.message || undefined,
          city: leadData.city || undefined,
          source: leadData.source || undefined
        });
        
        // Store AI qualification if available
        if (emailResult.qualification) {
          await storage.updateLeadQualification(lead.id, emailResult.qualification);
        }
      } else {
        // Fallback to basic email if Gmail not configured
        // Only send ONE customer email
        sendLeadEmail({ ...leadData, id: lead.id });
      }
      
      // Qualify the lead using AI
      const qualification = await qualifyLead(leadData);
      
      // Campaign enrollment now happens automatically in storage.createLead()
      
      res.json({ 
        success: true, 
        lead,
        qualification,
        message: 'Lead created and enrolled in campaign' 
      });
    } catch (error) {
      console.error("Create lead error:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof z.ZodError ? error.errors : "Invalid lead data" 
      });
    }
  });


  // Chatbot routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { sessionId, message } = req.body;
      
      if (!sessionId || !message) {
        return res.status(400).json({ 
          success: false, 
          error: "Session ID and message are required" 
        });
      }

      const response = await generateChatbotResponse(message);
      
      const chatMessage = await storage.createChatMessage({
        sessionId,
        message,
        response
      });

      res.json({ 
        success: true, 
        response,
        messageId: chatMessage.id 
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to process chat message" 
      });
    }
  });

  app.get("/api/chat/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getChatMessagesBySession(sessionId);
      res.json({ success: true, messages });
    } catch (error) {
      console.error("Get chat history error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch chat history" });
    }
  });

  // Email Campaign Routes
  
  // Enroll lead in a campaign
  app.post("/api/campaigns/enroll", async (req, res) => {
    try {
      const { leadId, campaignType } = req.body;
      
      if (!leadId || !campaignType) {
        return res.status(400).json({ 
          success: false, 
          error: "Lead ID and campaign type are required" 
        });
      }
      
      // Get lead data
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ 
          success: false, 
          error: "Lead not found" 
        });
      }
      
      // Check if already enrolled in a campaign
      const existingCampaigns = await storage.getEmailCampaignByLeadId(leadId);
      const activeCampaign = existingCampaigns.find(c => c.status === 'active');
      
      if (activeCampaign) {
        return res.status(400).json({ 
          success: false, 
          error: "Lead is already enrolled in an active campaign",
          existingCampaign: activeCampaign
        });
      }
      
      // Get campaign definition
      const campaignDef = getCampaignDefinition(campaignType as CampaignType);
      if (!campaignDef) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid campaign type" 
        });
      }
      
      // Create the campaign
      const campaign = await storage.createEmailCampaign({
        leadId,
        campaignType,
        totalSteps: campaignDef.steps.length,
        status: 'active',
        nextSendAt: calculateNextSendTime(0), // First email sends immediately
        timezone: 'America/Los_Angeles',
        enrolledAt: new Date()
      });
      
      res.json({ 
        success: true, 
        campaign,
        message: `Lead enrolled in ${campaignDef.name}` 
      });
      
    } catch (error) {
      console.error("Enroll campaign error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to enroll lead in campaign" 
      });
    }
  });
  
  // Get campaign status for a lead
  app.get("/api/campaigns/status/:leadId", async (req, res) => {
    try {
      const { leadId } = req.params;
      
      const campaigns = await storage.getEmailCampaignByLeadId(leadId);
      const activeCampaign = campaigns.find(c => c.status === 'active');
      
      if (!activeCampaign) {
        return res.json({ 
          success: true, 
          message: "No active campaigns",
          campaigns: campaigns
        });
      }
      
      // Get campaign definition for details
      const campaignDef = getCampaignDefinition(activeCampaign.campaignType as CampaignType);
      
      res.json({ 
        success: true, 
        campaign: activeCampaign,
        definition: campaignDef,
        progress: {
          currentStep: activeCampaign.currentStep,
          totalSteps: activeCampaign.totalSteps,
          percentComplete: Math.round((activeCampaign.currentStep / activeCampaign.totalSteps) * 100)
        }
      });
      
    } catch (error) {
      console.error("Get campaign status error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to get campaign status" 
      });
    }
  });
  
  // Pause a campaign
  app.post("/api/campaigns/pause/:leadId", async (req, res) => {
    try {
      const { leadId } = req.params;
      
      const campaigns = await storage.getEmailCampaignByLeadId(leadId);
      const activeCampaign = campaigns.find(c => c.status === 'active');
      
      if (!activeCampaign) {
        return res.status(404).json({ 
          success: false, 
          error: "No active campaign found for this lead" 
        });
      }
      
      await storage.pauseEmailCampaign(activeCampaign.id);
      
      res.json({ 
        success: true, 
        message: "Campaign paused successfully" 
      });
      
    } catch (error) {
      console.error("Pause campaign error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to pause campaign" 
      });
    }
  });
  
  // Resume a paused campaign
  app.post("/api/campaigns/resume/:leadId", async (req, res) => {
    try {
      const { leadId } = req.params;
      
      const campaigns = await storage.getEmailCampaignByLeadId(leadId);
      const pausedCampaign = campaigns.find(c => c.status === 'paused');
      
      if (!pausedCampaign) {
        return res.status(404).json({ 
          success: false, 
          error: "No paused campaign found for this lead" 
        });
      }
      
      await storage.resumeEmailCampaign(pausedCampaign.id);
      
      // Calculate next send time based on where we left off
      const campaignDef = getCampaignDefinition(pausedCampaign.campaignType as CampaignType);
      if (campaignDef && pausedCampaign.currentStep < campaignDef.steps.length) {
        const nextStep = campaignDef.steps[pausedCampaign.currentStep];
        await storage.updateEmailCampaign(pausedCampaign.id, {
          nextSendAt: calculateNextSendTime(
            nextStep.dayDelay,
            pausedCampaign.timezone || 'America/Los_Angeles'
          )
        });
      }
      
      res.json({ 
        success: true, 
        message: "Campaign resumed successfully" 
      });
      
    } catch (error) {
      console.error("Resume campaign error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to resume campaign" 
      });
    }
  });
  
  // Get email history for a lead
  app.get("/api/campaigns/history/:leadId", async (req, res) => {
    try {
      const { leadId } = req.params;
      const { limit = 50 } = req.query;
      
      const history = await storage.getCampaignHistoryByLead(leadId);
      const limitedHistory = history.slice(0, parseInt(limit as string));
      
      res.json({ 
        success: true, 
        history: limitedHistory,
        total: history.length
      });
      
    } catch (error) {
      console.error("Get campaign history error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to get campaign history" 
      });
    }
  });
  
  // Track email open (usually called from email tracking pixel)
  app.get("/api/campaigns/track/open/:historyId", async (req, res) => {
    try {
      const { historyId } = req.params;
      await storage.trackEmailOpen(historyId);
      
      // Return a 1x1 transparent pixel
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private'
      });
      res.end(pixel);
      
    } catch (error) {
      console.error("Track email open error:", error);
      // Still return pixel even on error
      res.status(200).send();
    }
  });
  
  // Track email click (redirect through tracking)
  app.get("/api/campaigns/track/click/:historyId", async (req, res) => {
    try {
      const { historyId } = req.params;
      const { url } = req.query;
      
      await storage.trackEmailClick(historyId, url as string);
      
      // Redirect to the actual URL
      if (url) {
        res.redirect(url as string);
      } else {
        res.redirect('https://serenitycustompools.com');
      }
      
    } catch (error) {
      console.error("Track email click error:", error);
      res.redirect('https://serenitycustompools.com');
    }
  });
  
  // Unsubscribe endpoint
  app.get("/api/campaigns/unsubscribe", async (req, res) => {
    try {
      const { email, campaign } = req.query;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          error: "Email is required" 
        });
      }
      
      // Find lead by email
      const leads = await storage.getLeads();
      const lead = leads.find(l => l.email === email as string);
      
      if (lead) {
        await storage.handleUnsubscribe(lead.id, campaign as string);
      }
      
      // Always show success to prevent email enumeration
      res.json({ 
        success: true, 
        message: "You have been unsubscribed successfully" 
      });
      
    } catch (error) {
      console.error("Unsubscribe error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to process unsubscribe request" 
      });
    }
  });
  
  // Manually trigger campaign processing (for testing)
  app.post("/api/campaigns/process", async (req, res) => {
    try {
      await processCampaigns(
        () => storage.getActiveCampaigns(),
        (id, data) => storage.updateEmailCampaign(id, data),
        (data) => storage.createCampaignHistory(data),
        (id) => storage.getLead(id).then(lead => lead || null)
      );
      
      res.json({ 
        success: true, 
        message: "Campaign processing triggered" 
      });
      
    } catch (error) {
      console.error("Process campaigns error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to process campaigns" 
      });
    }
  });
  
  // Get campaign processor status
  app.get("/api/campaigns/processor/status", async (req, res) => {
    try {
      const status = getCampaignProcessorStatus();
      res.json({ 
        success: true, 
        status 
      });
    } catch (error) {
      console.error("Get processor status error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to get processor status" 
      });
    }
  });
  
  // Stop campaign processor
  app.post("/api/campaigns/processor/stop", async (req, res) => {
    try {
      stopCampaignProcessor();
      res.json({ 
        success: true, 
        message: "Campaign processor stopped" 
      });
    } catch (error) {
      console.error("Stop processor error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to stop processor" 
      });
    }
  });
  
  // Start campaign processor
  app.post("/api/campaigns/processor/start", async (req, res) => {
    try {
      const { intervalMs } = req.body;
      startCampaignProcessor(intervalMs);
      res.json({ 
        success: true, 
        message: "Campaign processor started" 
      });
    } catch (error) {
      console.error("Start processor error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to start processor" 
      });
    }
  });

  // Gmail API Routes
  
  // Initialize Gmail labels on startup
  app.post("/api/gmail/initialize-labels", async (req, res) => {
    try {
      await initializeLeadLabels();
      res.json({ success: true, message: "Gmail labels initialized successfully" });
    } catch (error) {
      console.error("Initialize labels error:", error);
      res.status(500).json({ success: false, error: "Failed to initialize labels" });
    }
  });
  
  // List inbox messages
  app.get("/api/gmail/inbox", async (req, res) => {
    try {
      const { maxResults = 50, query = 'in:inbox' } = req.query;
      const messages = await listInboxMessages(
        parseInt(maxResults as string), 
        query as string
      );
      res.json({ success: true, messages });
    } catch (error) {
      console.error("List inbox error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to list inbox messages" 
      });
    }
  });
  
  // Get specific email details
  app.get("/api/gmail/message/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const message = await getMessageDetails(id);
      res.json({ success: true, message });
    } catch (error) {
      console.error("Get message error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get message details" 
      });
    }
  });
  
  // Create/manage labels
  app.post("/api/gmail/labels", async (req, res) => {
    try {
      const { labelName, action = 'create' } = req.body;
      
      if (!labelName && action === 'create') {
        return res.status(400).json({ 
          success: false, 
          error: "Label name is required" 
        });
      }
      
      if (action === 'list') {
        const labels = await listLabels();
        return res.json({ success: true, labels });
      }
      
      if (action === 'create') {
        const label = await createLabel(labelName);
        return res.json({ success: true, label });
      }
      
      res.status(400).json({ 
        success: false, 
        error: "Invalid action. Use 'create' or 'list'" 
      });
    } catch (error) {
      console.error("Labels error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to manage labels" 
      });
    }
  });
  
  // Apply label to message
  app.post("/api/gmail/apply-label", async (req, res) => {
    try {
      const { messageId, labelId } = req.body;
      
      if (!messageId || !labelId) {
        return res.status(400).json({ 
          success: false, 
          error: "Message ID and Label ID are required" 
        });
      }
      
      await applyLabel(messageId, labelId);
      res.json({ success: true, message: "Label applied successfully" });
    } catch (error) {
      console.error("Apply label error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to apply label" 
      });
    }
  });
  
  // Mark message as read/unread
  app.post("/api/gmail/mark-read", async (req, res) => {
    try {
      const { messageId, isRead = true } = req.body;
      
      if (!messageId) {
        return res.status(400).json({ 
          success: false, 
          error: "Message ID is required" 
        });
      }
      
      await markAsRead(messageId, isRead);
      res.json({ 
        success: true, 
        message: `Message marked as ${isRead ? 'read' : 'unread'}` 
      });
    } catch (error) {
      console.error("Mark read error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update message status" 
      });
    }
  });
  
  // Get email thread
  app.get("/api/gmail/thread/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const thread = await getThread(id);
      res.json({ success: true, thread });
    } catch (error) {
      console.error("Get thread error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get email thread" 
      });
    }
  });
  
  // Parse email and create lead
  app.post("/api/gmail/parse-lead", async (req, res) => {
    try {
      const { messageId, emailContent, fromEmail, subject, isHtml = false } = req.body;
      
      // Parse email for lead data
      const extractedData = await parseEmailForLeadData(
        emailContent || '',
        fromEmail || '',
        subject || '',
        isHtml
      );
      
      // Determine lead priority
      const priority = determineLeadPriority(extractedData);
      
      // Format data for database
      const leadData = formatLeadDataForDb(extractedData, 'gmail');
      
      // Create lead in database
      const lead = await storage.createLead(leadData);
      
      // Campaign enrollment now happens automatically in storage.createLead()
      
      // Apply appropriate label if messageId provided
      if (messageId) {
        try {
          // Get labels and find the one matching priority
          const labels = await listLabels();
          const priorityLabel = labels.find(l => 
            l.name === `${priority} Lead` || 
            (priority === 'Hot' && l.name === 'VIP')
          );
          
          if (priorityLabel) {
            await applyLabel(messageId, priorityLabel.id);
          }
          
          // Mark as read
          await markAsRead(messageId, true);
        } catch (labelError) {
          console.error("Error applying label to parsed email:", labelError);
        }
      }
      
      // Send notifications
      notifyNewLead({
        firstName: leadData.firstName,
        lastName: leadData.lastName,
        email: leadData.email,
        phone: leadData.phone,
        source: 'gmail',
        affiliateId: null
      });
      
      res.json({ 
        success: true, 
        lead,
        extractedData,
        priority,
        confidence: extractedData.confidence
      });
    } catch (error) {
      console.error("Parse lead error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to parse email and create lead" 
      });
    }
  });

  // Media Management Endpoints
  
  // Create new media item
  app.post("/api/media", async (req, res) => {
    try {
      const { title, description, type, url, thumbnailUrl, category, tags, leadId, uploadedBy } = req.body;
      
      if (!title || !type || !url) {
        return res.status(400).json({ 
          success: false, 
          error: "Title, type, and URL are required" 
        });
      }
      
      const media = await storage.createMedia({
        title,
        description,
        type,
        url,
        thumbnailUrl,
        category,
        tags,
        leadId,
        uploadedBy: uploadedBy || 'system',
        isPublic: true
      });
      
      res.json({ 
        success: true, 
        media 
      });
    } catch (error) {
      console.error("Create media error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to create media item" 
      });
    }
  });
  
  // Get media items with optional filters
  app.get("/api/media", async (req, res) => {
    try {
      const { type, category, isPublic } = req.query;
      const filters: any = {};
      
      if (type) filters.type = type as string;
      if (category) filters.category = category as string;
      if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
      
      const media = await storage.getMedia(filters);
      
      res.json({ 
        success: true, 
        media 
      });
    } catch (error) {
      console.error("Get media error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to get media items" 
      });
    }
  });
  
  // Get public media for gallery display
  app.get("/api/media/public", async (req, res) => {
    try {
      const { category } = req.query;
      const media = await storage.getPublicMedia(category as string);
      
      res.json({ 
        success: true, 
        media 
      });
    } catch (error) {
      console.error("Get public media error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to get public media" 
      });
    }
  });
  
  // Get single media item by ID
  app.get("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const media = await storage.getMediaById(id);
      
      if (!media) {
        return res.status(404).json({ 
          success: false, 
          error: "Media item not found" 
        });
      }
      
      res.json({ 
        success: true, 
        media 
      });
    } catch (error) {
      console.error("Get media by ID error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to get media item" 
      });
    }
  });
  
  // Update media item
  app.patch("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const media = await storage.updateMedia(id, updates);
      
      if (!media) {
        return res.status(404).json({ 
          success: false, 
          error: "Media item not found" 
        });
      }
      
      res.json({ 
        success: true, 
        media 
      });
    } catch (error) {
      console.error("Update media error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to update media item" 
      });
    }
  });
  
  // Delete media item
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMedia(id);
      
      if (!deleted) {
        return res.status(404).json({ 
          success: false, 
          error: "Media item not found" 
        });
      }
      
      res.json({ 
        success: true, 
        message: "Media item deleted successfully" 
      });
    } catch (error) {
      console.error("Delete media error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to delete media item" 
      });
    }
  });
  
  // Update media display order
  app.patch("/api/media/:id/order", async (req, res) => {
    try {
      const { id } = req.params;
      const { order } = req.body;
      
      if (typeof order !== 'number') {
        return res.status(400).json({ 
          success: false, 
          error: "Order must be a number" 
        });
      }
      
      await storage.updateMediaOrder(id, order);
      
      res.json({ 
        success: true, 
        message: "Media order updated successfully" 
      });
    } catch (error) {
      console.error("Update media order error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to update media order" 
      });
    }
  });

  // AI Auto-Reply Endpoints
  
  // Generate AI auto-reply for an email
  app.post("/api/gmail/auto-reply", async (req, res) => {
    try {
      const { messageId, emailContent, subject, fromEmail, senderName } = req.body;
      
      if (!emailContent || !subject || !fromEmail) {
        return res.status(400).json({
          success: false,
          error: "Email content, subject, and sender email are required"
        });
      }
      
      // Generate auto-reply
      const autoReply = await generateAutoReply(
        emailContent,
        subject,
        fromEmail,
        senderName || 'Valued Customer'
      );
      
      // If message ID provided, apply labels
      if (messageId && autoReply.labels.length > 0) {
        try {
          const labels = await listLabels();
          for (const labelName of autoReply.labels) {
            const label = labels.find(l => l.name === labelName);
            if (label) {
              await applyLabel(messageId, label.id);
            }
          }
        } catch (labelError) {
          console.error("Error applying labels:", labelError);
        }
      }
      
      res.json({
        success: true,
        autoReply
      });
    } catch (error) {
      console.error("Auto-reply generation error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate auto-reply"
      });
    }
  });
  
  // Analyze email intent
  app.post("/api/gmail/analyze-intent", async (req, res) => {
    try {
      const { emailContent, subject, fromEmail } = req.body;
      
      if (!emailContent || !subject) {
        return res.status(400).json({
          success: false,
          error: "Email content and subject are required"
        });
      }
      
      const intent = await analyzeEmailIntent(emailContent, subject, fromEmail);
      
      res.json({
        success: true,
        intent
      });
    } catch (error) {
      console.error("Intent analysis error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze intent"
      });
    }
  });
  
  // Email Template Endpoints
  
  // Get all available templates
  app.get("/api/email-templates", async (req, res) => {
    try {
      const { category } = req.query;
      const templates = category ? 
        getAllTemplates().filter(t => t.category === category) : 
        getAllTemplates();
      
      res.json({
        success: true,
        templates: templates.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category,
          subject: t.subject,
          priority: t.priority,
          dayDelay: t.dayDelay
        }))
      });
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve templates"
      });
    }
  });
  
  // Get specific template by ID
  app.get("/api/email-templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const template = getTemplateById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template not found"
        });
      }
      
      res.json({
        success: true,
        template
      });
    } catch (error) {
      console.error("Get template error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve template"
      });
    }
  });
  
  // Generate personalized template
  app.post("/api/email-templates/generate", async (req, res) => {
    try {
      const { templateId, personalizationData } = req.body;
      
      if (!templateId || !personalizationData) {
        return res.status(400).json({
          success: false,
          error: "Template ID and personalization data are required"
        });
      }
      
      // Ensure required fields are present
      if (!personalizationData.firstName || !personalizationData.email) {
        return res.status(400).json({
          success: false,
          error: "First name and email are required in personalization data"
        });
      }
      
      const personalizedEmail = await generatePersonalizedTemplate(
        templateId,
        personalizationData
      );
      
      res.json({
        success: true,
        email: personalizedEmail
      });
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate personalized template"
      });
    }
  });
  
  // Auto-select best template for lead
  app.post("/api/email-templates/select-best", async (req, res) => {
    try {
      const { personalizationData, category } = req.body;
      
      if (!personalizationData) {
        return res.status(400).json({
          success: false,
          error: "Personalization data is required"
        });
      }
      
      const template = selectBestTemplate(personalizationData, category);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: "No suitable template found"
        });
      }
      
      const personalizedEmail = await generatePersonalizedTemplate(
        template.id,
        personalizationData
      );
      
      res.json({
        success: true,
        template: {
          id: template.id,
          name: template.name,
          category: template.category
        },
        email: personalizedEmail
      });
    } catch (error) {
      console.error("Template selection error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to select template"
      });
    }
  });
  
  // Lead Scoring Endpoints
  
  // Update lead score based on email activity
  app.put("/api/leads/:id/score", async (req, res) => {
    try {
      const { id } = req.params;
      const { emailContent, subject, responseTimeMinutes } = req.body;
      
      if (!emailContent || !subject) {
        return res.status(400).json({
          success: false,
          error: "Email content and subject are required for scoring"
        });
      }
      
      // Get current lead
      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          error: "Lead not found"
        });
      }
      
      // Analyze email for scoring
      const analysis = await analyzeEmailForScoring(
        emailContent,
        subject,
        responseTimeMinutes
      );
      
      // Calculate new score
      const scoreUpdate = calculateLeadScore(
        analysis,
        responseTimeMinutes,
        lead.score || 50
      );
      
      // Update lead score in database
      await storage.updateLeadScore(id, scoreUpdate.newScore);
      
      res.json({
        success: true,
        scoreUpdate,
        analysis
      });
    } catch (error) {
      console.error("Lead scoring error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to update lead score"
      });
    }
  });
  
  // Analyze email thread for engagement
  app.post("/api/gmail/analyze-thread", async (req, res) => {
    try {
      const { threadId, messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          error: "Messages array is required"
        });
      }
      
      const threadAnalysis = analyzeEmailThread(messages);
      
      res.json({
        success: true,
        threadId,
        analysis: threadAnalysis
      });
    } catch (error) {
      console.error("Thread analysis error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze thread"
      });
    }
  });

  // Email Queue Management Endpoints
  
  // Start the email queue processor
  app.post("/api/email-queue/start", async (req, res) => {
    try {
      startEmailQueue();
      res.json({
        success: true,
        message: "Email queue processor started",
        status: getQueueStatus()
      });
    } catch (error) {
      console.error("Queue start error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start email queue processor"
      });
    }
  });
  
  // Stop the email queue processor
  app.post("/api/email-queue/stop", async (req, res) => {
    try {
      stopEmailQueue();
      res.json({
        success: true,
        message: "Email queue processor stopped",
        status: getQueueStatus()
      });
    } catch (error) {
      console.error("Queue stop error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to stop email queue processor"
      });
    }
  });
  
  // Get queue status
  app.get("/api/email-queue/status", (req, res) => {
    try {
      const status = getQueueStatus();
      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error("Queue status error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get queue status"
      });
    }
  });
  
  // Manually trigger queue processing
  app.post("/api/email-queue/process", async (req, res) => {
    try {
      await triggerQueueProcessing();
      res.json({
        success: true,
        message: "Queue processing triggered",
        status: getQueueStatus()
      });
    } catch (error) {
      console.error("Queue process error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to trigger queue processing"
      });
    }
  });
  
  // Clear the queue
  app.post("/api/email-queue/clear", (req, res) => {
    try {
      clearQueue();
      res.json({
        success: true,
        message: "Email queue cleared",
        status: getQueueStatus()
      });
    } catch (error) {
      console.error("Queue clear error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear queue"
      });
    }
  });

  // CRM Email Integration Endpoints
  
  // Sync inbox with CRM - parse emails and auto-create/update leads
  app.post("/api/crm/sync-inbox", async (req, res) => {
    try {
      const { maxResults = 50 } = req.body;
      const syncResult = await crmSync.syncInbox(maxResults);
      
      res.json({
        success: true,
        result: syncResult,
        message: `Synced inbox: ${syncResult.newLeads} new leads, ${syncResult.updatedLeads} updated leads`
      });
    } catch (error) {
      console.error("CRM inbox sync error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync inbox with CRM"
      });
    }
  });
  
  // Get all emails for a specific lead
  app.get("/api/leads/:id/emails", async (req, res) => {
    try {
      const { id } = req.params;
      const emails = await crmSync.getLeadEmails(id);
      
      res.json({
        success: true,
        emails,
        total: emails.length
      });
    } catch (error) {
      console.error("Get lead emails error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get lead emails"
      });
    }
  });
  
  // Get email threads for a lead
  app.get("/api/leads/:id/threads", async (req, res) => {
    try {
      const { id } = req.params;
      const threads = await crmSync.getLeadThreads(id);
      
      res.json({
        success: true,
        threads,
        total: threads.length
      });
    } catch (error) {
      console.error("Get lead threads error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get lead email threads"
      });
    }
  });
  
  // Send quick reply from CRM interface
  app.post("/api/crm/quick-reply", async (req, res) => {
    try {
      const { leadId, threadId, message } = req.body;
      
      if (!leadId || !threadId || !message) {
        return res.status(400).json({
          success: false,
          error: "Lead ID, thread ID, and message are required"
        });
      }
      
      const sent = await crmSync.sendQuickReply(leadId, threadId, message);
      
      if (sent) {
        res.json({
          success: true,
          message: "Reply sent successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to send reply"
        });
      }
    } catch (error) {
      console.error("Quick reply error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to send quick reply"
      });
    }
  });
  
  // Get recent email activity feed
  app.get("/api/crm/activity-feed", async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      const activities = await crmSync.getActivityFeed(parseInt(limit as string));
      
      res.json({
        success: true,
        activities,
        total: activities.length
      });
    } catch (error) {
      console.error("Activity feed error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get activity feed"
      });
    }
  });
  
  // Helper function to start inbox monitoring
  async function startInboxMonitoring(intervalMinutes: number = 2): Promise<NodeJS.Timer> {
    // Run immediately on start
    console.log('Starting inbox monitoring...');
    try {
      const result = await crmSync.syncInbox(50);
      console.log(`Initial sync complete: ${result.newLeads} new leads, ${result.updatedLeads} updated leads`);
    } catch (error) {
      console.error('Initial sync failed:', error);
    }
    
    // Set up interval for ongoing monitoring
    const intervalMs = intervalMinutes * 60 * 1000;
    const timer = setInterval(async () => {
      try {
        console.log('Running scheduled inbox sync...');
        const result = await crmSync.syncInbox(50);
        console.log(`Sync complete: ${result.newLeads} new leads, ${result.updatedLeads} updated leads`);
      } catch (error) {
        console.error('Scheduled sync failed:', error);
      }
    }, intervalMs);
    
    return timer;
  }
  
  // Helper function to stop inbox monitoring
  function stopInboxMonitoring(timer: NodeJS.Timer) {
    clearInterval(timer);
    console.log('Inbox monitoring stopped');
  }

  // Start/stop inbox monitoring
  let inboxMonitor: NodeJS.Timer | null = null;
  
  app.post("/api/crm/monitoring/start", async (req, res) => {
    try {
      const { intervalMinutes = 2 } = req.body;
      
      if (inboxMonitor) {
        return res.status(400).json({
          success: false,
          error: "Inbox monitoring is already running"
        });
      }
      
      inboxMonitor = await startInboxMonitoring(intervalMinutes);
      
      res.json({
        success: true,
        message: `Inbox monitoring started with ${intervalMinutes} minute intervals`
      });
    } catch (error) {
      console.error("Start monitoring error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start inbox monitoring"
      });
    }
  });
  
  app.post("/api/crm/monitoring/stop", (req, res) => {
    try {
      if (!inboxMonitor) {
        return res.status(400).json({
          success: false,
          error: "Inbox monitoring is not running"
        });
      }
      
      stopInboxMonitoring(inboxMonitor);
      inboxMonitor = null;
      
      res.json({
        success: true,
        message: "Inbox monitoring stopped"
      });
    } catch (error) {
      console.error("Stop monitoring error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to stop inbox monitoring"
      });
    }
  });
  
  // Get monitoring status
  app.get("/api/crm/monitoring/status", (req, res) => {
    res.json({
      success: true,
      isRunning: inboxMonitor !== null,
      message: inboxMonitor ? "Inbox monitoring is active" : "Inbox monitoring is not running"
    });
  });

  // Lead magnet download endpoint
  app.post("/api/lead-magnet", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse({
        ...req.body,
        source: 'lead-magnet',
        projectType: 'guide-download'
      });
      
      const lead = await storage.createLead(leadData);
      
      // Campaign enrollment now happens automatically in storage.createLead()
      
      // Check if this lead came from an affiliate referral
      if (leadData.affiliateId) {
        const affiliate = await storage.getAffiliateByAffiliateId(leadData.affiliateId);
        if (affiliate) {
          // Create referral record
          await storage.createReferral({
            affiliateDbId: affiliate.id,
            affiliateId: leadData.affiliateId,
            leadId: lead.id,
            type: "consultation",
            status: "pending"
          });
        }
      }
      
      // Send SMS and email notifications (don't await to avoid slowing down response)
      sendLeadNotification({ ...leadData, id: lead.id });
      sendLeadEmail({ ...leadData, id: lead.id });
      
      res.json({ 
        success: true, 
        message: "Your pool design guide is ready for download!",
        downloadUrl: "/api/downloads/pool-design-guide.pdf",
        lead
      });
    } catch (error) {
      console.error("Lead magnet error:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof z.ZodError ? error.errors : "Invalid data" 
      });
    }
  });

  // Backyard Transformation using Google Gemini 2.5 - Full pool customization support
  app.post("/api/generate-backyard-transformation", async (req, res) => {
    try {
      const { 
        imageData,
        // Pool customization fields
        poolShape,
        poolSize,
        poolMaterial,
        deckMaterial,
        design,
        landscaping,
        angle,
        features = []
      } = req.body;

      // Basic validation
      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: "Image data is required"
        });
      }

      // Use the pool customization fields directly
      const poolDesignRequest: PoolDesignRequest = {
        imageData,
        poolShape: poolShape || 'Freeform',
        poolSize: poolSize || 'Medium (15x30 ft)',
        poolMaterial: poolMaterial || 'Plaster',
        deckMaterial: deckMaterial || 'Stamped Concrete',
        design: design || 'Modern',
        landscaping: landscaping || 'Lush Tropical',
        angle: angle || 'Aerial View',
        features: features || []
      };

      const result = await generatePoolDesign(poolDesignRequest);

      if (result.success) {
        res.json({
          success: true,
          imageUrl: result.imageUrl // Return imageUrl directly for the new frontend
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || "Failed to generate visualization"
        });
      }

    } catch (error) {
      console.error("Backyard transformation error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error during visualization generation"
      });
    }
  });

  // Pool Design Generation using Google Gemini
  app.post("/api/generate-pool-design", async (req, res) => {
    try {
      const { 
        imageData, 
        poolShape, 
        poolSize, 
        poolMaterial, 
        deckMaterial, 
        design, 
        landscaping, 
        angle, 
        features = [] 
      } = req.body;

      // Basic validation
      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: "Image data is required"
        });
      }

      const poolDesignRequest: PoolDesignRequest = {
        imageData,
        poolShape: poolShape || 'Freeform',
        poolSize: poolSize || 'Medium (15x30 ft)',
        poolMaterial: poolMaterial || 'Plaster',
        deckMaterial: deckMaterial || 'Stamped Concrete',
        design: design || 'Modern',
        landscaping: landscaping || 'Lush Tropical',
        angle: angle || 'Eye-Level',
        features: Array.isArray(features) ? features : []
      };

      const result = await generatePoolDesign(poolDesignRequest);

      if (result.success) {
        res.json({
          success: true,
          imageUrl: result.imageUrl
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || "Failed to generate pool design"
        });
      }

    } catch (error) {
      console.error("Pool design generation error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error during pool design generation"
      });
    }
  });

  // Affiliate Registration
  app.post("/api/affiliates/register", async (req, res) => {
    try {
      // Transform the form data to match our schema
      const affiliateData = insertAffiliateSchema.parse({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        company: req.body.company || undefined,
        website: req.body.website || undefined,
        paymentMethod: req.body.paymentMethod,
        paymentDetails: JSON.stringify({
          method: req.body.paymentMethod,
          details: req.body.paymentDetails
        }),
        notes: req.body.experience
      });

      // Check if email already exists
      const existingAffiliate = await storage.getAffiliateByEmail(affiliateData.email);
      if (existingAffiliate) {
        return res.status(400).json({
          success: false,
          error: "An affiliate with this email already exists"
        });
      }

      const affiliate = await storage.createAffiliate(affiliateData);

      res.json({
        success: true,
        message: "Affiliate application submitted successfully",
        affiliate: {
          id: affiliate.id,
          firstName: affiliate.firstName,
          email: affiliate.email,
          affiliateId: affiliate.affiliateId, // This is the 6-digit tracking PIN
          referralCode: affiliate.affiliateId // Support both field names for compatibility
        }
      });
    } catch (error) {
      console.error("Affiliate registration error:", error);
      res.status(400).json({
        success: false,
        error: error instanceof z.ZodError ? error.errors : "Invalid affiliate data"
      });
    }
  });

  // Get affiliate dashboard data
  app.get("/api/affiliates/:id/dashboard", async (req, res) => {
    try {
      const { id } = req.params;
      const affiliate = await storage.getAffiliate(id);
      
      if (!affiliate) {
        return res.status(404).json({ success: false, error: "Affiliate not found" });
      }

      const referrals = await storage.getReferralsByAffiliate(id);
      
      // Generate dynamic links instead of storing them
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `https://${req.hostname}` 
        : `http://${req.hostname}:5000`;
      
      const links = [
        {
          id: '1',
          title: "Main Landing Page", 
          url: `${baseUrl}?ref=${affiliate.affiliateId}`,
          clicks: 0,
          conversions: 0
        },
        {
          id: '2',
          title: "Pool Cost Calculator", 
          url: `${baseUrl}#calculator?ref=${affiliate.affiliateId}`,
          clicks: 0,
          conversions: 0
        },
        {
          id: '3',
          title: "Portfolio Gallery", 
          url: `${baseUrl}#portfolio?ref=${affiliate.affiliateId}`,
          clicks: 0,
          conversions: 0
        }
      ];

      // Add referralCode field for compatibility  
      const affiliateWithCode = {
        ...affiliate,
        referralCode: affiliate.affiliateId
      };

      res.json({
        success: true,
        data: {
          affiliate: affiliateWithCode,
          referrals,
          links
        }
      });
    } catch (error) {
      console.error("Dashboard data error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch dashboard data" });
    }
  });

  // Track referral link clicks (simplified - just log for now)
  app.post("/api/affiliates/track-click", async (req, res) => {
    try {
      const { linkId } = req.body;
      // For now, just log the click - real tracking would be implemented later
      console.log(`Link clicked: ${linkId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Link tracking error:", error);
      res.status(500).json({ success: false, error: "Failed to track click" });
    }
  });

  // Get affiliate by referral code (for tracking)
  app.get("/api/affiliates/by-code/:code", async (req, res) => {
    try {
      const { code } = req.params;
      // The 6-digit code is the affiliateId
      const affiliate = await storage.getAffiliateByAffiliateId(code);
      
      if (!affiliate) {
        return res.status(404).json({ success: false, error: "Affiliate not found" });
      }

      res.json({
        success: true,
        affiliate: {
          id: affiliate.id,
          firstName: affiliate.firstName,
          affiliateId: affiliate.affiliateId,
          referralCode: affiliate.affiliateId // Support both field names
        }
      });
    } catch (error) {
      console.error("Get affiliate by code error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch affiliate" });
    }
  });

  // Track referral visits  
  app.post("/api/affiliates/track-referral", async (req, res) => {
    try {
      const { code } = req.body;
      // The 6-digit code is the affiliateId
      const affiliate = await storage.getAffiliateByAffiliateId(code);
      
      if (affiliate) {
        // For now, just log the referral visit
        console.log(`Referral visit tracked for affiliate: ${affiliate.firstName} ${affiliate.lastName} (${code})`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Referral tracking error:", error);
      res.json({ success: false }); // Don't fail the page load
    }
  });

  // Get all leads endpoint for CRM
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Delete a single lead
  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteLead(id);
      
      if (success) {
        console.log(`Lead ${id} deleted successfully along with all associated data`);
        res.json({ success: true, message: "Lead deleted successfully" });
      } else {
        res.status(404).json({ success: false, message: "Lead not found" });
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ success: false, message: "Failed to delete lead" });
    }
  });
  
  // Bulk delete multiple leads
  app.delete("/api/leads", async (req, res) => {
    try {
      const { leadIds } = req.body;
      
      if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Please provide an array of lead IDs to delete" 
        });
      }
      
      const deletedCount = await storage.deleteMultipleLeads(leadIds);
      
      console.log(`Bulk delete completed: ${deletedCount} leads deleted`);
      res.json({ 
        success: true, 
        message: `${deletedCount} lead(s) deleted successfully`,
        deletedCount 
      });
    } catch (error) {
      console.error("Error bulk deleting leads:", error);
      res.status(500).json({ success: false, message: "Failed to delete leads" });
    }
  });

  // Register simplified affiliate routes
  registerAffiliateRoutes(app);
  
  // Register lead notification routes
  registerLeadNotificationRoutes(app);
  
  // Register admin API routes (full webapp control)
  registerAdminRoutes(app);
  
  // Blog routes
  app.use("/api/blog", blogRoutes);
  
  // Blog automation routes
  app.get("/api/blog/automation/status", blogAutomation.getSchedulerStatus);
  app.post("/api/blog/automation/enable", blogAutomation.enableAutoPublishing);
  app.post("/api/blog/automation/disable", blogAutomation.disableAutoPublishing);
  app.post("/api/blog/automation/config", blogAutomation.updateSchedulerConfig);
  app.post("/api/blog/automation/generate-now", blogAutomation.generateBlogNow);

  // Set up periodic image cleanup (every 6 hours)
  setInterval(() => {
    imageUploadService.cleanupOldImages(24); // Remove images older than 24 hours
  }, 6 * 60 * 60 * 1000);

  // Email Analytics endpoints
  app.get("/api/analytics/email-metrics", async (req, res) => {
    try {
      const { emailAnalytics } = await import('./services/email-analytics');
      const { startDate, endDate } = req.query;
      
      const dateRange = {
        start: startDate ? new Date(startDate as string) : subDays(new Date(), 30),
        end: endDate ? new Date(endDate as string) : new Date()
      };
      
      const metrics = await emailAnalytics.getEmailMetrics(dateRange);
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching email metrics:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch email metrics' });
    }
  });

  app.get("/api/analytics/campaign-performance", async (req, res) => {
    try {
      const { emailAnalytics } = await import('./services/email-analytics');
      const { startDate, endDate } = req.query;
      
      const dateRange = {
        start: startDate ? new Date(startDate as string) : subDays(new Date(), 30),
        end: endDate ? new Date(endDate as string) : new Date()
      };
      
      const performance = await emailAnalytics.getCampaignPerformance(dateRange);
      res.json({ success: true, data: performance });
    } catch (error) {
      console.error('Error fetching campaign performance:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch campaign performance' });
    }
  });

  app.get("/api/analytics/engagement-heatmap", async (req, res) => {
    try {
      const { emailAnalytics } = await import('./services/email-analytics');
      const { startDate, endDate } = req.query;
      
      const dateRange = {
        start: startDate ? new Date(startDate as string) : subDays(new Date(), 30),
        end: endDate ? new Date(endDate as string) : new Date()
      };
      
      const heatmap = await emailAnalytics.getEngagementHeatmap(dateRange);
      res.json({ success: true, data: heatmap });
    } catch (error) {
      console.error('Error fetching engagement heatmap:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch engagement heatmap' });
    }
  });

  app.get("/api/analytics/top-templates", async (req, res) => {
    try {
      const { emailAnalytics } = await import('./services/email-analytics');
      const limit = parseInt(req.query.limit as string) || 10;
      
      const templates = await emailAnalytics.getTopTemplates(limit);
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error fetching top templates:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch top templates' });
    }
  });

  app.get("/api/analytics/lead-funnel", async (req, res) => {
    try {
      const { emailAnalytics } = await import('./services/email-analytics');
      const funnel = await emailAnalytics.getLeadFunnel();
      res.json({ success: true, data: funnel });
    } catch (error) {
      console.error('Error fetching lead funnel:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch lead funnel' });
    }
  });

  app.get("/api/analytics/response-times", async (req, res) => {
    try {
      const { emailAnalytics } = await import('./services/email-analytics');
      const { startDate, endDate } = req.query;
      
      const dateRange = {
        start: startDate ? new Date(startDate as string) : subDays(new Date(), 30),
        end: endDate ? new Date(endDate as string) : new Date()
      };
      
      const responseTimes = await emailAnalytics.getResponseTimeAnalytics(dateRange);
      res.json({ success: true, data: responseTimes });
    } catch (error) {
      console.error('Error fetching response times:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch response times' });
    }
  });

  app.get("/api/analytics/lead-engagement-scores", async (req, res) => {
    try {
      const { emailAnalytics } = await import('./services/email-analytics');
      const limit = parseInt(req.query.limit as string) || 50;
      
      const scores = await emailAnalytics.calculateLeadEngagementScores(limit);
      res.json({ success: true, data: scores });
    } catch (error) {
      console.error('Error fetching lead engagement scores:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch lead engagement scores' });
    }
  });

  app.get("/api/analytics/optimal-send-times", async (req, res) => {
    try {
      const { emailAnalytics } = await import('./services/email-analytics');
      const optimalTimes = await emailAnalytics.getOptimalSendTimes();
      res.json({ success: true, data: optimalTimes });
    } catch (error) {
      console.error('Error fetching optimal send times:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch optimal send times' });
    }
  });

  // Analytics export endpoints
  app.get("/api/analytics/export/csv", async (req, res) => {
    try {
      const { emailAnalytics } = await import('./services/email-analytics');
      const { startDate, endDate } = req.query;
      
      const dateRange = {
        start: startDate ? new Date(startDate as string) : subDays(new Date(), 30),
        end: endDate ? new Date(endDate as string) : new Date()
      };
      
      const csv = await emailAnalytics.exportAnalyticsCSV(dateRange);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="email-analytics.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting analytics CSV:', error);
      res.status(500).json({ success: false, error: 'Failed to export analytics' });
    }
  });

  // Email tracking endpoints (pixel tracking and link tracking)
  app.get("/api/track/open/:messageId", async (req, res) => {
    try {
      const { emailAnalytics } = await import('./services/email-analytics');
      await emailAnalytics.trackEmailOpen(req.params.messageId);
      
      // Return a 1x1 transparent pixel
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(pixel);
    } catch (error) {
      console.error('Error tracking email open:', error);
      res.status(200).send(); // Don't break email rendering
    }
  });

  app.get("/api/track/click/:messageId", async (req, res) => {
    try {
      const { emailAnalytics } = await import('./services/email-analytics');
      const { url, utm_source, utm_medium, utm_campaign } = req.query;
      
      await emailAnalytics.trackLinkClick(
        req.params.messageId,
        url as string,
        { utm_source, utm_medium, utm_campaign }
      );
      
      // Redirect to the actual URL
      if (url) {
        res.redirect(url as string);
      } else {
        res.status(404).send('URL not found');
      }
    } catch (error) {
      console.error('Error tracking link click:', error);
      if (req.query.url) {
        res.redirect(req.query.url as string);
      } else {
        res.status(404).send('URL not found');
      }
    }
  });

  // Weekly analytics summary endpoint
  app.post("/api/analytics/send-summary", async (req, res) => {
    try {
      const { analyticsEmailSummary } = await import('./services/analytics-email-summary');
      const { email } = req.body;
      
      const result = await analyticsEmailSummary.sendImmediateSummary(email);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error sending analytics summary:', error);
      res.status(500).json({ success: false, error: 'Failed to send analytics summary' });
    }
  });

  // Start email queue processor if Google credentials are configured
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    console.log('Starting email automation queue...');
    startEmailQueue();
    
    // Start weekly analytics summary
    import('./services/analytics-email-summary').then(({ analyticsEmailSummary }) => {
      analyticsEmailSummary.startWeeklySummary();
      console.log('Weekly analytics summary scheduled');
    }).catch(err => {
      console.error('Failed to start weekly analytics summary:', err);
    });
  } else {
    console.log('Email queue not started: Google credentials not configured');
  }

  // Voice Call endpoints
  app.post("/api/voice-calls", async (req, res) => {
    try {
      const voiceCallData = insertVoiceCallSchema.parse(req.body);
      let leadId = voiceCallData.leadId;
      
      // If there's lead data captured, upsert the lead (create or update)
      if (voiceCallData.leadDataCaptured && typeof voiceCallData.leadDataCaptured === 'object') {
        const leadData = voiceCallData.leadDataCaptured as any;
        
        if (leadData.email) {
          // Check if lead already exists by email
          const existingLeads = await storage.getLeads();
          const existingLead = existingLeads.find(l => l.email === leadData.email);
          
          if (existingLead) {
            // Update existing lead with new information from voice call
            leadId = existingLead.id;
            
            // Update existing lead with voice call data and mark as from voice call
            await storage.updateLead(existingLead.id, {
              phone: leadData.phone || existingLead.phone,
              city: leadData.location || existingLead.city,
              projectType: leadData.projectScope || existingLead.projectType,
              budgetRange: leadData.budget || existingLead.budgetRange,
              message: existingLead.message ? 
                `${existingLead.message}\n\nVoice call update - Timeline: ${leadData.timeline || 'Not specified'}` :
                `Voice call inquiry - Timeline: ${leadData.timeline || 'Not specified'}`,
              isFromVoiceCall: true,
              metadata: {
                ...existingLead.metadata,
                lastVoiceCallDate: new Date().toISOString(),
                voiceCallData: {
                  projectScope: leadData.projectScope || existingLead.projectType,
                  budget: leadData.budget || existingLead.budgetRange,
                  location: leadData.location || existingLead.city,
                  timeline: leadData.timeline || 'Not specified'
                }
              }
            });
            console.log(`Updated existing lead ${leadId} with voice call data`);
          } else {
            // Create a new lead from voice call data (without voiceCallId - we don't have it yet)
            const newLead = await storage.createLead({
              firstName: leadData.firstName || 'Voice',
              lastName: leadData.lastName || 'Caller',
              email: leadData.email,
              phone: leadData.phone || null,
              city: leadData.location || null,
              projectType: leadData.projectScope || null,
              budgetRange: leadData.budget || null,
              message: `Voice call inquiry - Timeline: ${leadData.timeline || 'Not specified'}`,
              source: 'voice-call',
              isFromVoiceCall: true,
              // Don't set voiceCallId here - we'll update it after creating the voice call
              metadata: {
                voiceCallTimestamp: new Date().toISOString(),
                capturedFromVoice: true
              }
            });
            leadId = newLead.id;
            console.log(`Created new lead ${leadId} from voice call data`);
          }
        }
      }
      
      // Create the voice call with proper lead linkage
      const voiceCallWithLead = {
        ...voiceCallData,
        leadId: leadId || null
      };
      
      const voiceCall = await storage.createVoiceCall(voiceCallWithLead);
      
      // If we created/updated a lead, update it with the actual voice call ID
      if (leadId && voiceCall.id) {
        await storage.updateLead(leadId, {
          voiceCallId: voiceCall.id,
          isFromVoiceCall: true
        });
        console.log(`Updated lead ${leadId} with voice call ID ${voiceCall.id}`);
      }
      
      res.json({ 
        success: true, 
        voiceCall,
        leadId: leadId || null,
        message: leadId ? 'Voice call saved and linked to lead' : 'Voice call saved without lead linkage'
      });
    } catch (error) {
      console.error("Error creating voice call:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to create voice call" 
      });
    }
  });

  app.get("/api/voice-calls", async (req, res) => {
    try {
      const { leadId, status, startDate, endDate, limit = 50, offset = 0 } = req.query;
      
      const filters: any = {};
      if (leadId) filters.leadId = leadId as string;
      if (status) filters.status = status as string;
      if (startDate && endDate) {
        filters.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }
      
      const voiceCalls = await storage.getVoiceCalls(filters);
      
      // Implement pagination
      const paginatedCalls = voiceCalls.slice(
        Number(offset),
        Number(offset) + Number(limit)
      );
      
      res.json({
        success: true,
        voiceCalls: paginatedCalls,
        total: voiceCalls.length,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error("Error fetching voice calls:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch voice calls" 
      });
    }
  });

  app.get("/api/voice-calls/:id", async (req, res) => {
    try {
      const voiceCall = await storage.getVoiceCallById(req.params.id);
      
      if (!voiceCall) {
        return res.status(404).json({ 
          success: false, 
          message: "Voice call not found" 
        });
      }
      
      // Also get associated lead if it exists
      let lead = null;
      if (voiceCall.leadId) {
        lead = await storage.getLead(voiceCall.leadId);
      }
      
      res.json({ 
        success: true, 
        voiceCall,
        lead 
      });
    } catch (error) {
      console.error("Error fetching voice call:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch voice call" 
      });
    }
  });

  app.patch("/api/voice-calls/:id/summary", async (req, res) => {
    try {
      const { summary, regenerate } = req.body;
      const voiceCall = await storage.getVoiceCallById(req.params.id);
      
      if (!voiceCall) {
        return res.status(404).json({ 
          success: false, 
          message: "Voice call not found" 
        });
      }
      
      let newSummary = summary;
      
      // If regenerate is true, use Gemini to generate a new summary from the transcript
      if (regenerate && voiceCall.fullTranscript) {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        const transcriptText = JSON.stringify(voiceCall.fullTranscript);
        const prompt = `Generate a concise summary of this voice call transcript for a pool/spa business CRM. Include:
1. Customer's main project requirements
2. Budget and timeline mentioned
3. Key concerns or questions raised
4. Next steps discussed
5. Overall sentiment and engagement level

Transcript:
${transcriptText}

Summary:`;
        
        const result = await model.generateContent(prompt);
        newSummary = result.response.text();
      }
      
      await storage.updateVoiceCallSummary(req.params.id, newSummary);
      
      res.json({ 
        success: true, 
        summary: newSummary 
      });
    } catch (error) {
      console.error("Error updating voice call summary:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update voice call summary" 
      });
    }
  });

  // Appointment endpoints
  app.post("/api/appointments", async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      
      // Send appointment confirmation email using Gmail
      if (process.env.GOOGLE_REFRESH_TOKEN) {
        const { sendAppointmentConfirmation } = await import('./services/appointment-email');
        await sendAppointmentConfirmation({
          firstName: appointmentData.firstName,
          lastName: appointmentData.lastName || undefined,
          email: appointmentData.email,
          phone: appointmentData.phone || undefined,
          preferredDate: appointmentData.appointmentDate,
          preferredTime: new Date(appointmentData.appointmentDate).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }),
          consultationType: appointmentData.appointmentType || 'consultation',
          message: appointmentData.notes || undefined
        });
      }
      
      // TODO: Add to affiliate tracking if affiliateId present
      
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create appointment" 
      });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.patch("/api/appointments/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateAppointmentStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({ message: "Failed to update appointment status" });
    }
  });

  // Gmail test endpoint to verify OAuth connectivity
  app.get("/api/test-gmail", async (req, res) => {
    try {
      console.log('Testing Gmail connectivity...');
      
      // Check if credentials exist
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
        return res.status(400).json({
          success: false,
          error: 'Missing Gmail credentials',
          details: {
            hasClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
            refreshTokenLength: process.env.GOOGLE_REFRESH_TOKEN?.length || 0
          }
        });
      }

      // Try to list messages using the existing gmail-service
      const { listInboxMessages } = await import('./services/gmail-service');
      
      // Try to list just 1 message to test connectivity
      const messages = await listInboxMessages(1);
      
      res.json({
        success: true,
        message: 'Gmail connected successfully!',
        details: {
          messagesFound: messages.length,
          canReadEmails: true,
          canSendEmails: true,
          refreshTokenValid: true,
          clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...'
        }
      });
    } catch (error: any) {
      console.error('Gmail test error:', error);
      
      // Parse the error for more details
      let errorDetails: any = {
        message: error.message,
        code: error.code,
        status: error.status
      };
      
      // Check if it's a scope issue
      if (error.message?.includes('insufficient authentication scopes')) {
        errorDetails.scopeError = true;
        errorDetails.requiredScope = 'https://mail.google.com/';
        errorDetails.solution = 'Generate a new refresh token with full Gmail scope';
      }
      
      // Check if it's an invalid grant error
      if (error.message?.includes('invalid_grant')) {
        errorDetails.authError = true;
        errorDetails.solution = 'Refresh token may be expired or invalid. Generate a new one.';
      }
      
      res.status(500).json({
        success: false,
        error: 'Gmail connection failed',
        details: errorDetails
      });
    }
  });

  // Voice agent endpoints removed - now handled directly through Gemini SDK in frontend

  // Auto-start background jobs on server startup
  setTimeout(async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 STARTING BACKGROUND AUTOMATION SERVICES...');
    console.log('═══════════════════════════════════════════════════════');
    
    try {
      // 1. ALWAYS Start Campaign Processor (works with or without Gmail)
      console.log('1️⃣  Starting Campaign Processor...');
      await startCampaignProcessor();
      const campaignStatus = getCampaignProcessorStatus();
      const emailSendingEnabled = !!process.env.GOOGLE_REFRESH_TOKEN;
      console.log(`✅ Campaign Processor started - tracking campaigns`);
      console.log(`   📧 Email sending: ${emailSendingEnabled ? '✅ ENABLED' : '⚠️  DISABLED (Gmail not configured)'}`);
      console.log(`   📊 Status: ${campaignStatus.isRunning ? 'RUNNING' : 'STOPPED'}`);
      console.log(`   ⏰ Next run: ${campaignStatus.nextRunAt ? new Date(campaignStatus.nextRunAt).toLocaleTimeString() : 'N/A'}`);
      
      // 2. Start Gmail-dependent services only if credentials exist
      if (process.env.GOOGLE_REFRESH_TOKEN) {
        console.log('');
        console.log('2️⃣  Starting Gmail-dependent services...');
        
        // Start Email Queue Processor
        console.log('   📬 Starting Email Queue Processor...');
        startEmailQueue();
        console.log('   ✅ Email Queue Processor started - checking every 5 minutes');
        
        // Start CRM Inbox Monitoring
        console.log('   📨 Starting CRM Inbox Monitoring...');
        inboxMonitor = await startInboxMonitoring(2);
        console.log('   ✅ CRM Inbox Monitoring started - checking every 2 minutes');
        
        // Health Check Summary - Full Services
        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 HEALTH CHECK SUMMARY (Full Services Mode):');
        console.log('   • Campaign Processor: ✅ RUNNING (with email sending)');
        console.log('   • Email Queue: ✅ RUNNING (5-minute intervals)');
        console.log('   • Inbox Monitoring: ✅ RUNNING (2-minute intervals)');
        console.log('   • Gmail Integration: ✅ CONNECTED');
        console.log('═══════════════════════════════════════════════════════');
        console.log('🎉 All automation services started successfully!');
        
        // Set up periodic health check logging for full services
        setInterval(() => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📊 Health Check [${new Date().toLocaleTimeString()}]`);
          
          const queueStatus = getQueueStatus();
          console.log(`   • Email Queue: ${queueStatus.isProcessing ? 'PROCESSING' : 'IDLE'} (${queueStatus.queueLength} pending)`);
          
          const campaignStat = getCampaignProcessorStatus();
          console.log(`   • Campaign Processor: ${campaignStat.isRunning ? 'RUNNING' : 'STOPPED'} (next: ${campaignStat.nextRunAt ? new Date(campaignStat.nextRunAt).toLocaleTimeString() : 'N/A'})`);
          
          console.log(`   • Inbox Monitor: ${inboxMonitor ? 'ACTIVE' : 'STOPPED'}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }, 60000 * 10); // Log health status every 10 minutes
        
      } else {
        // Gmail services not available
        console.log('');
        console.log('⚠️  Gmail services: WAITING FOR CREDENTIALS');
        console.log('   • Email Queue: ❌ NOT STARTED (requires Gmail)');
        console.log('   • Inbox Monitoring: ❌ NOT STARTED (requires Gmail)');
        console.log('');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 HEALTH CHECK SUMMARY (Limited Mode):');
        console.log('   • Campaign Processor: ✅ RUNNING (tracking only)');
        console.log('   • Email Sending: ⚠️  DISABLED');
        console.log('   • Gmail Integration: ❌ NOT CONFIGURED');
        console.log('');
        console.log('💡 To enable email sending:');
        console.log('   1. Set up Google OAuth credentials');
        console.log('   2. Add GOOGLE_REFRESH_TOKEN to environment');
        console.log('   3. Restart the server');
        console.log('═══════════════════════════════════════════════════════');
        
        // Set up periodic health check logging for limited mode
        setInterval(() => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`📊 Health Check (Limited Mode) [${new Date().toLocaleTimeString()}]`);
          
          const campaignStat = getCampaignProcessorStatus();
          console.log(`   • Campaign Processor: ${campaignStat.isRunning ? 'RUNNING' : 'STOPPED'} (tracking only)`);
          console.log(`   • Email Sending: DISABLED (Gmail not configured)`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }, 60000 * 10); // Log health status every 10 minutes
      }
      
    } catch (error) {
      console.error('❌ Failed to start automation services:', error);
      console.error('   Please check your configuration and try again.');
      console.log('═══════════════════════════════════════════════════════');
    }
  }, 5000); // Wait 5 seconds after server start to ensure everything is initialized

  // CRITICAL: Add API catch-all BEFORE static file serving 
  // This ensures unmatched API routes return JSON 404s, not React HTML
  app.use('/api/*', (req, res) => {
    res.status(404).json({ 
      success: false, 
      error: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method
    });
  });

  const httpServer = createServer(app);
  
  // Voice agent now uses direct Gemini SDK connection from frontend - no WebSocket server needed
  
  return httpServer;
}
