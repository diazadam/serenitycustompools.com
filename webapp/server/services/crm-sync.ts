import { storage } from '../storage';
import { 
  listInboxMessages, 
  getMessageDetails, 
  getThread,
  markAsRead,
  applyLabel,
  createLabel,
  sendEmail
} from './gmail-service';
import { parseEmailForLeadData, determineLeadPriority } from './email-parser';
import { calculateLeadScore } from './email-service';
import { autoEnrollLead } from './campaign-scheduler';
import { generateAutoReply, analyzeEmailIntent } from './ai-auto-reply';
import { addToQueue, type AutoReplyQueueItem } from './email-queue';
import type { 
  Lead, 
  EmailThread, 
  EmailActivity, 
  InsertLead, 
  InsertEmailThread, 
  InsertEmailActivity 
} from '@shared/schema';

interface SyncResult {
  newLeads: number;
  updatedLeads: number;
  newThreads: number;
  newActivities: number;
  errors: string[];
}

interface EmailThreadData {
  threadId: string;
  messages: Array<{
    id: string;
    from: string;
    to: string;
    subject: string;
    date: Date;
    textContent: string;
    htmlContent: string;
    isRead: boolean;
  }>;
  participants: string[];
  lastMessageDate: Date;
  messageCount: number;
  unreadCount: number;
}

// Main CRM sync service
export class CRMSyncService {
  private static instance: CRMSyncService;
  private isProcessing = false;
  private lastSyncTime: Date = new Date();

  static getInstance(): CRMSyncService {
    if (!CRMSyncService.instance) {
      CRMSyncService.instance = new CRMSyncService();
    }
    return CRMSyncService.instance;
  }

  // Sync entire inbox with CRM
  async syncInbox(maxResults: number = 50): Promise<SyncResult> {
    const result: SyncResult = {
      newLeads: 0,
      updatedLeads: 0,
      newThreads: 0,
      newActivities: 0,
      errors: []
    };

    if (this.isProcessing) {
      result.errors.push('Sync already in progress');
      return result;
    }

    this.isProcessing = true;

    try {
      // Get recent messages from inbox
      const messages = await listInboxMessages(maxResults, 'in:inbox is:unread');

      for (const messageSummary of messages) {
        try {
          // Get full message details
          const messageDetails = await getMessageDetails(messageSummary.id);
          
          // Parse email for lead data
          const leadData = await parseEmailForLeadData(
            messageDetails.textContent || messageDetails.htmlContent || '',
            messageDetails.from,
            messageDetails.subject
          );

          // Find or create lead
          const lead = await this.findOrCreateLead(leadData, messageDetails.from);
          
          if (lead) {
            const isNewLead = !lead.id;
            if (isNewLead) {
              result.newLeads++;
            } else {
              result.updatedLeads++;
            }

            // Process email thread
            const threadData = await this.getOrCreateThread(
              messageSummary.threadId,
              lead.id,
              messageDetails.subject
            );
            
            if (threadData.isNew) {
              result.newThreads++;
            }

            // Create email activity record
            const activity = await this.createEmailActivity(
              lead.id,
              threadData.thread.id,
              messageSummary.id,
              messageDetails
            );
            
            if (activity) {
              result.newActivities++;
            }

            // Update lead status based on interaction
            await this.updateLeadFromEmail(lead.id, messageDetails);

            // Generate and send auto-reply for new incoming emails
            try {
              // Only generate auto-reply for inbound emails (not our own replies)
              if (!messageDetails.from.includes('@serenitycustompools.com')) {
                console.log(`Generating auto-reply for email from ${messageDetails.from}`);
                
                // Extract sender name
                const senderMatch = messageDetails.from.match(/(.*?)<(.+?)>/);
                const senderName = senderMatch ? senderMatch[1].trim() : lead.firstName;
                
                // Generate personalized auto-reply
                const autoReplyData = await generateAutoReply(
                  messageDetails.textContent || messageDetails.htmlContent || '',
                  messageDetails.subject,
                  messageDetails.from,
                  senderName || lead.firstName
                );
                
                // Add auto-reply to queue if confidence is high enough and human review not needed
                if (autoReplyData.confidence > 0.6 && !autoReplyData.suggestHumanReview) {
                  // Add auto-reply to email queue for centralized processing
                  const queueItem: AutoReplyQueueItem = {
                    to: lead.email,
                    subject: autoReplyData.subject,
                    htmlContent: autoReplyData.htmlBody,
                    textContent: autoReplyData.body,
                    threadId: threadData.thread.id,
                    leadId: lead.id,
                    messageType: 'auto-reply',
                    metadata: {
                      intent: autoReplyData.intent.type,
                      confidence: autoReplyData.confidence,
                      leadScore: autoReplyData.leadScore
                    }
                  };
                  
                  const queueResult = await addToQueue(queueItem);
                  
                  if (queueResult.queued) {
                    console.log(`Auto-reply queued for ${lead.email} - Intent: ${autoReplyData.intent.type}, Confidence: ${autoReplyData.confidence}`);
                    
                    // Create activity record for queued email (will be updated when sent)
                    await this.createEmailActivity(
                      lead.id,
                      threadData.thread.id,
                      `auto-reply-queued-${Date.now()}`,
                      {
                        from: 'info@serenitycustompools.com',
                        to: lead.email,
                        subject: autoReplyData.subject,
                        textContent: autoReplyData.body,
                        htmlContent: autoReplyData.htmlBody,
                        date: new Date(),
                        isRead: true
                      }
                    );
                    
                    // Apply auto-reply label
                    await this.syncGmailLabels(messageSummary.id, lead, true);
                  } else {
                    console.error(`Failed to queue auto-reply for ${lead.email}: ${queueResult.error}`);
                  }
                } else {
                  console.log(`Auto-reply skipped - confidence: ${autoReplyData.confidence}, needs review: ${autoReplyData.suggestHumanReview}`);
                }
                
                // Update lead score based on email intent
                if (autoReplyData.leadScore) {
                  await storage.updateLeadScore(lead.id, autoReplyData.leadScore);
                }
              }
            } catch (autoReplyError) {
              console.error('Error generating auto-reply:', autoReplyError);
              // Don't fail the entire process if auto-reply fails
            }

            // Apply Gmail labels based on lead status
            await this.syncGmailLabels(messageSummary.id, lead);

            // Mark message as processed
            await markAsRead(messageSummary.id);
          }
        } catch (error) {
          console.error(`Error processing message ${messageSummary.id}:`, error);
          result.errors.push(`Message ${messageSummary.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('Inbox sync error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.isProcessing = false;
    }

    return result;
  }

  // Find existing lead or create new one
  private async findOrCreateLead(leadData: any, fromEmail: string): Promise<Lead | null> {
    try {
      // First try to find by email
      const leads = await storage.getLeads();
      let lead = leads.find(l => 
        l.email.toLowerCase() === (leadData.email || fromEmail).toLowerCase()
      );

      if (!lead && leadData.phone) {
        // Try to find by phone
        lead = leads.find(l => 
          l.phone && this.normalizePhone(l.phone) === this.normalizePhone(leadData.phone)
        );
      }

      if (!lead) {
        // Create new lead
        const newLeadData: InsertLead = {
          firstName: leadData.firstName || this.extractNameFromEmail(fromEmail),
          lastName: leadData.lastName || '',
          email: leadData.email || fromEmail,
          phone: leadData.phone || '',
          city: leadData.city || '',
          projectType: leadData.projectType || 'pool_installation',
          budgetRange: leadData.budgetRange || '',
          message: leadData.message || '',
          source: 'email',
          metadata: {
            parsedFromEmail: true,
            originalSender: fromEmail,
            confidence: leadData.confidence || 0.5
          }
        };

        lead = await storage.createLead(newLeadData);
        
        // Campaign enrollment now happens automatically in storage.createLead()
      }

      return lead;
    } catch (error) {
      console.error('Error finding/creating lead:', error);
      return null;
    }
  }

  // Get or create email thread
  private async getOrCreateThread(
    gmailThreadId: string, 
    leadId: string, 
    subject: string
  ): Promise<{ thread: EmailThread; isNew: boolean }> {
    try {
      // Check if thread exists
      let thread = await storage.getEmailThreadByGmailId(gmailThreadId);
      let isNew = false;

      if (!thread) {
        // Get full thread details from Gmail
        const gmailThread = await getThread(gmailThreadId);
        const participants = new Set<string>();
        let messageCount = 0;
        let unreadCount = 0;
        let lastMessageDate = new Date(0);

        if (gmailThread && gmailThread.messages) {
          for (const msg of gmailThread.messages) {
            messageCount++;
            
            const headers = msg.payload?.headers || [];
            const from = headers.find(h => h.name === 'From')?.value || '';
            const to = headers.find(h => h.name === 'To')?.value || '';
            
            if (from) participants.add(from);
            if (to) participants.add(to);
            
            if (msg.labelIds?.includes('UNREAD')) {
              unreadCount++;
            }
            
            const msgDate = new Date(parseInt(msg.internalDate || '0'));
            if (msgDate > lastMessageDate) {
              lastMessageDate = msgDate;
            }
          }
        }

        // Create new thread
        const threadData: InsertEmailThread = {
          threadId: gmailThreadId,
          leadId,
          subject,
          lastMessageDate,
          messageCount,
          unreadCount,
          participants: Array.from(participants),
          snippet: gmailThread?.messages?.[0]?.snippet || '',
          labels: gmailThread?.messages?.[0]?.labelIds || [],
          status: 'active'
        };

        thread = await storage.createEmailThread(threadData);
        isNew = true;
      } else {
        // Update existing thread
        await storage.updateEmailThread(thread.id, {
          lastMessageDate: new Date(),
          messageCount: (thread.messageCount || 0) + 1,
          unreadCount: (thread.unreadCount || 0) + 1
        });
      }

      return { thread, isNew };
    } catch (error) {
      console.error('Error managing thread:', error);
      throw error;
    }
  }

  // Create email activity record
  private async createEmailActivity(
    leadId: string,
    threadId: string,
    messageId: string,
    messageDetails: any
  ): Promise<EmailActivity | null> {
    try {
      // Check if activity already exists
      const existing = await storage.getEmailActivityByMessageId(messageId);
      if (existing) {
        return existing;
      }

      const activityData: InsertEmailActivity = {
        leadId,
        threadId,
        messageId,
        activityType: 'received',
        direction: 'inbound',
        fromEmail: messageDetails.from,
        toEmail: messageDetails.to,
        subject: messageDetails.subject,
        textContent: messageDetails.textContent || '',
        htmlContent: messageDetails.htmlContent || '',
        attachments: messageDetails.attachments || [],
        isRead: messageDetails.isRead,
        receivedAt: messageDetails.date
      };

      return await storage.createEmailActivity(activityData);
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  // Update lead based on email interaction
  private async updateLeadFromEmail(leadId: string, messageDetails: any): Promise<void> {
    try {
      const lead = await storage.getLead(leadId);
      if (!lead) return;

      // Calculate lead score based on email content
      const score = await calculateLeadScore({
        subject: messageDetails.subject,
        content: messageDetails.textContent || messageDetails.htmlContent || '',
        sender: messageDetails.from
      });

      // Update lead metadata
      const metadata = lead.metadata || {};
      metadata.lastEmailDate = new Date();
      metadata.emailEngagementScore = score;
      metadata.totalEmailInteractions = (metadata.totalEmailInteractions || 0) + 1;

      // Update lead qualification if score is high
      if (score > 0.7) {
        await storage.updateLeadQualification(leadId, {
          status: 'qualified',
          score,
          lastContactDate: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating lead from email:', error);
    }
  }

  // Sync Gmail labels with lead status
  private async syncGmailLabels(messageId: string, lead: Lead, isAutoReply: boolean = false): Promise<void> {
    try {
      const status = lead.metadata?.status || 'new';
      
      // Create label if it doesn't exist
      const labelName = `CRM/${status}`;
      await createLabel(labelName);

      // Apply label to message
      await applyLabel(messageId, labelName);

      // Add lead name label if available
      if (lead.firstName) {
        const leadLabel = `CRM/Lead/${lead.firstName}_${lead.lastName || ''}`.trim();
        await createLabel(leadLabel);
        await applyLabel(messageId, leadLabel);
      }

      // Add auto-reply label if applicable
      if (isAutoReply) {
        const autoReplyLabel = 'CRM/AutoReplied';
        await createLabel(autoReplyLabel);
        await applyLabel(messageId, autoReplyLabel);
      }
    } catch (error) {
      console.error('Error syncing labels:', error);
    }
  }

  // Send quick reply from CRM
  async sendQuickReply(
    leadId: string, 
    threadId: string, 
    message: string
  ): Promise<boolean> {
    try {
      const lead = await storage.getLead(leadId);
      const thread = await storage.getEmailThreadById(threadId);

      if (!lead || !thread) {
        throw new Error('Lead or thread not found');
      }

      // Implementation would use Gmail API to send reply
      // For now, we'll create an activity record
      const activityData: InsertEmailActivity = {
        leadId,
        threadId,
        messageId: `reply_${Date.now()}`,
        activityType: 'sent',
        direction: 'outbound',
        fromEmail: 'info@serenitypools.com',
        toEmail: lead.email,
        subject: `Re: ${thread.subject}`,
        textContent: message,
        htmlContent: `<p>${message}</p>`,
        sentAt: new Date()
      };

      await storage.createEmailActivity(activityData);
      return true;
    } catch (error) {
      console.error('Error sending quick reply:', error);
      return false;
    }
  }

  // Get email conversations for a lead
  async getLeadEmails(leadId: string): Promise<EmailActivity[]> {
    return await storage.getEmailActivitiesByLead(leadId);
  }

  // Get email threads for a lead
  async getLeadThreads(leadId: string): Promise<EmailThread[]> {
    return await storage.getEmailThreadsByLead(leadId);
  }

  // Get recent email activity feed
  async getActivityFeed(limit: number = 50): Promise<EmailActivity[]> {
    return await storage.getRecentActivities(limit);
  }

  // Helper functions
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').slice(-10);
  }

  private extractNameFromEmail(email: string): string {
    const namePart = email.split('@')[0];
    return namePart.split(/[._-]/)[0] || 'Unknown';
  }
}

// Export singleton instance
export const crmSync = CRMSyncService.getInstance();

// Background monitoring function
export async function startInboxMonitoring(intervalMinutes: number = 2): NodeJS.Timer {
  console.log(`Starting inbox monitoring every ${intervalMinutes} minutes`);
  
  // Initial sync
  crmSync.syncInbox(25);
  
  // Set up interval
  return setInterval(async () => {
    console.log('Running scheduled inbox sync...');
    const result = await crmSync.syncInbox(25);
    console.log('Sync result:', result);
  }, intervalMinutes * 60 * 1000);
}

// Stop monitoring
export function stopInboxMonitoring(timer: NodeJS.Timer): void {
  clearInterval(timer);
  console.log('Inbox monitoring stopped');
}