import type { Express } from "express";
import { storage } from "../storage";
import type { Lead } from "@shared/schema";

export function registerLeadNotificationRoutes(app: Express) {
  // Endpoint to get recent lead notifications for admin
  app.get("/api/admin/lead-notifications", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      
      // Get leads from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentLeads = leads.filter((lead: Lead) => 
        new Date(lead.createdAt).getTime() >= sevenDaysAgo.getTime()
      ).sort((a: Lead, b: Lead) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Format leads for admin view
      const formattedLeads = recentLeads.map((lead: Lead) => ({
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName || ''}`.trim(),
        email: lead.email,
        phone: lead.phone || 'Not provided',
        city: lead.city || 'Not provided',
        budgetRange: lead.budgetRange || 'Not specified',
        projectType: lead.projectType || 'Not specified',
        message: lead.message || '',
        source: lead.source,
        affiliateId: lead.affiliateId || null,
        createdAt: lead.createdAt,
        contactStatus: 'pending', // This could be tracked in the database
        priority: determinePriority(lead.budgetRange)
      }));
      
      res.json({
        success: true,
        notificationEmail: 'adam@serenitypools.com',
        totalLeads: formattedLeads.length,
        leads: formattedLeads,
        summary: {
          today: formattedLeads.filter((l: any) => 
            new Date(l.createdAt).toDateString() === new Date().toDateString()
          ).length,
          thisWeek: formattedLeads.length,
          highPriority: formattedLeads.filter((l: any) => l.priority === 'high').length
        }
      });
    } catch (error) {
      console.error('Error fetching lead notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch lead notifications'
      });
    }
  });
  
  // Endpoint to get notification settings
  app.get("/api/admin/notification-settings", async (req, res) => {
    res.json({
      success: true,
      settings: {
        primaryEmail: 'adam@serenitypools.com',
        ccEmails: [],
        notificationMethod: 'console_log',
        sendGridConfigured: !!process.env.SENDGRID_API_KEY,
        smsConfigured: !!process.env.TWILIO_ACCOUNT_SID,
        webhookUrl: process.env.LEAD_WEBHOOK_URL || null,
        notificationFrequency: 'immediate'
      }
    });
  });
}

function determinePriority(budgetRange?: string | null): 'high' | 'medium' | 'low' {
  if (!budgetRange) return 'medium';
  
  // High priority for budgets over $300k
  if (budgetRange.includes('300') || 
      budgetRange.includes('400') || 
      budgetRange.includes('500') ||
      budgetRange.includes('+')) {
    return 'high';
  }
  
  // Low priority for budgets under $100k
  if (budgetRange.includes('50-100') || 
      budgetRange.includes('Under')) {
    return 'low';
  }
  
  return 'medium';
}