import { 
  listInboxMessages, 
  getMessageDetails, 
  applyLabel, 
  markAsRead,
  listLabels,
  sendEmail
} from './gmail-service';
import { generateAutoReply, analyzeEmailIntent, calculateLeadScore } from './ai-auto-reply';
import { parseEmailForLeadData } from './email-parser';
import { storage } from '../storage';
import { analyzeEmailForScoring, calculateLeadScore as calculateScore } from './email-service';
import { generatePersonalizedTemplate, selectBestTemplate } from './email-templates';

// Queue configuration
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 10; // Process up to 10 emails at a time
const PROCESS_DELAY = 2000; // 2 second delay between processing emails

interface EmailQueueItem {
  messageId: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: Date;
  processed: boolean;
  processingError?: string;
}

interface ProcessingResult {
  messageId: string;
  success: boolean;
  autoReplyGenerated: boolean;
  leadCreated: boolean;
  leadScore?: number;
  labelsApplied: string[];
  error?: string;
}

// In-memory queue for email processing
let emailQueue: EmailQueueItem[] = [];
let isProcessing = false;
let queueTimer: NodeJS.Timeout | null = null;

// Start the email queue processor
export function startEmailQueue(): void {
  if (queueTimer) {
    console.log('Email queue is already running');
    return;
  }

  console.log('Starting email queue processor...');
  
  // Initial check
  checkForNewEmails();
  
  // Set up periodic checking
  queueTimer = setInterval(checkForNewEmails, POLL_INTERVAL);
  
  console.log(`Email queue started. Checking every ${POLL_INTERVAL / 1000} seconds.`);
}

// Stop the email queue processor
export function stopEmailQueue(): void {
  if (queueTimer) {
    clearInterval(queueTimer);
    queueTimer = null;
    console.log('Email queue processor stopped');
  }
}

// Check for new emails and add to queue
async function checkForNewEmails(): Promise<void> {
  if (isProcessing) {
    console.log('Queue is already processing, skipping check');
    return;
  }

  try {
    console.log('Checking for new emails...');
    
    // Query for unread emails that haven't been processed
    const messages = await listInboxMessages(BATCH_SIZE, 'in:inbox is:unread -label:processed');
    
    if (!messages || messages.length === 0) {
      console.log('No new unread emails found');
      return;
    }

    console.log(`Found ${messages.length} unread emails`);
    
    // Add messages to queue
    for (const message of messages) {
      if (!emailQueue.find(item => item.messageId === message.id)) {
        emailQueue.push({
          messageId: message.id,
          threadId: message.threadId,
          from: message.from || '',
          to: message.to || '',
          subject: message.subject || '',
          snippet: message.snippet || '',
          date: message.date ? new Date(message.date) : new Date(),
          processed: false
        });
      }
    }
    
    // Process the queue
    await processEmailQueue();
    
  } catch (error) {
    console.error('Error checking for new emails:', error);
  }
}

// Process emails in the queue
async function processEmailQueue(): Promise<void> {
  if (isProcessing || emailQueue.length === 0) {
    return;
  }

  isProcessing = true;
  console.log(`Processing ${emailQueue.length} emails in queue...`);

  const results: ProcessingResult[] = [];
  
  try {
    // Get available labels
    const labels = await listLabels();
    const processedLabel = labels.find(l => l.name === 'processed');
    const autoReplyLabel = labels.find(l => l.name === 'auto-replied');
    
    // Process each email
    for (const queueItem of emailQueue) {
      if (queueItem.processed) {
        continue;
      }

      const result = await processEmail(queueItem, labels);
      results.push(result);
      
      // Mark as processed in queue
      queueItem.processed = true;
      
      // Apply processed label
      if (processedLabel) {
        try {
          await applyLabel(queueItem.messageId, processedLabel.id);
        } catch (error) {
          console.error('Error applying processed label:', error);
        }
      }
      
      // Apply auto-reply label if generated
      if (result.autoReplyGenerated && autoReplyLabel) {
        try {
          await applyLabel(queueItem.messageId, autoReplyLabel.id);
        } catch (error) {
          console.error('Error applying auto-reply label:', error);
        }
      }
      
      // Small delay between processing emails
      await new Promise(resolve => setTimeout(resolve, PROCESS_DELAY));
    }
    
    // Remove processed items from queue
    emailQueue = emailQueue.filter(item => !item.processed);
    
    // Log results
    const successful = results.filter(r => r.success).length;
    const autoReplies = results.filter(r => r.autoReplyGenerated).length;
    const leadsCreated = results.filter(r => r.leadCreated).length;
    
    console.log(`Queue processing complete:
      - Total processed: ${results.length}
      - Successful: ${successful}
      - Auto-replies sent: ${autoReplies}
      - Leads created: ${leadsCreated}
      - Remaining in queue: ${emailQueue.length}`);
    
  } catch (error) {
    console.error('Error processing email queue:', error);
  } finally {
    isProcessing = false;
  }
}

// Process a single email
async function processEmail(
  queueItem: EmailQueueItem,
  labels: Array<{ id: string; name: string }>
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    messageId: queueItem.messageId,
    success: false,
    autoReplyGenerated: false,
    leadCreated: false,
    labelsApplied: []
  };

  try {
    console.log(`Processing email: ${queueItem.subject} from ${queueItem.from}`);
    
    // Get full message details
    const message = await getMessageDetails(queueItem.messageId);
    const emailContent = message.body || message.snippet || '';
    const subject = message.subject || queueItem.subject;
    const fromEmail = message.from || queueItem.from;
    
    // Extract sender name from email
    const senderMatch = fromEmail.match(/(.*?)<(.+?)>/);
    const senderName = senderMatch ? senderMatch[1].trim() : fromEmail.split('@')[0];
    const senderEmailClean = senderMatch ? senderMatch[2] : fromEmail;
    
    // Step 1: Analyze email intent
    const intent = await analyzeEmailIntent(emailContent, subject, senderEmailClean);
    console.log(`Email intent: ${intent.intent} (confidence: ${intent.confidence})`);
    
    // Step 2: Check if we should create a lead
    if (intent.confidence > 0.5 && !isAutoReply(subject, emailContent)) {
      try {
        // Parse email for lead data
        const extractedData = await parseEmailForLeadData(emailContent);
        
        if (extractedData.email || senderEmailClean) {
          // Check if lead exists
          const existingLead = await storage.getLeadByEmail(extractedData.email || senderEmailClean);
          
          if (!existingLead) {
            // Create new lead
            const leadData = {
              firstName: extractedData.firstName || senderName || 'Unknown',
              lastName: extractedData.lastName,
              email: extractedData.email || senderEmailClean,
              phone: extractedData.phone,
              projectType: extractedData.projectType,
              budgetRange: extractedData.budgetRange,
              message: emailContent.substring(0, 500),
              source: 'gmail-auto',
              city: extractedData.city
            };
            
            const newLead = await storage.createLead(leadData);
            result.leadCreated = true;
            console.log(`Created new lead: ${newLead.id}`);
          } else {
            // Update existing lead's score
            const analysis = await analyzeEmailForScoring(emailContent, subject);
            const scoreUpdate = calculateScore(analysis, 0, existingLead.score || 50);
            
            if (existingLead.id) {
              await storage.updateLeadScore(existingLead.id, scoreUpdate.newScore);
              result.leadScore = scoreUpdate.newScore;
              console.log(`Updated lead score: ${scoreUpdate.newScore}`);
            }
          }
        }
      } catch (error) {
        console.error('Error processing lead data:', error);
      }
    }
    
    // Step 3: Generate and send auto-reply
    if (shouldAutoReply(intent, subject, emailContent)) {
      try {
        const autoReply = await generateAutoReply(
          emailContent,
          subject,
          senderEmailClean,
          senderName
        );
        
        // Send the auto-reply
        await sendEmail({
          to: senderEmailClean,
          subject: autoReply.subject,
          html: autoReply.response,
          threadId: queueItem.threadId
        });
        
        result.autoReplyGenerated = true;
        console.log(`Auto-reply sent to ${senderEmailClean}`);
        
        // Apply intent labels
        for (const labelName of autoReply.labels) {
          const label = labels.find(l => l.name === labelName);
          if (label) {
            await applyLabel(queueItem.messageId, label.id);
            result.labelsApplied.push(labelName);
          }
        }
      } catch (error) {
        console.error('Error generating/sending auto-reply:', error);
      }
    }
    
    // Step 4: Mark as read
    try {
      await markAsRead(queueItem.messageId, true);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
    
    // Step 5: Apply priority label based on intent
    const priorityLabel = getPriorityLabel(intent);
    const label = labels.find(l => l.name === priorityLabel);
    if (label) {
      await applyLabel(queueItem.messageId, label.id);
      result.labelsApplied.push(priorityLabel);
    }
    
    result.success = true;
    
  } catch (error) {
    console.error(`Error processing email ${queueItem.messageId}:`, error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return result;
}

// Determine if we should send an auto-reply
function shouldAutoReply(
  intent: any,
  subject: string,
  content: string
): boolean {
  // Don't reply to auto-generated emails
  if (isAutoReply(subject, content)) {
    return false;
  }
  
  // Check if intent is undefined or missing
  if (!intent || !intent.intent) {
    return false;
  }
  
  // Don't reply to very low confidence intents
  if (intent.confidence < 0.3) {
    return false;
  }
  
  // Don't reply to certain intents
  const noReplyIntents = ['spam', 'newsletter', 'notification', 'auto-reply'];
  if (typeof intent.intent === 'string' && noReplyIntents.includes(intent.intent.toLowerCase())) {
    return false;
  }
  
  // Reply to high-value intents
  const highValueIntents = [
    'pricing_inquiry',
    'appointment_request',
    'project_details',
    'service_area_question',
    'timeline_question',
    'pool_design_question'
  ];
  
  if (highValueIntents.includes(intent.intent)) {
    return true;
  }
  
  // Reply if confidence is high enough
  return intent.confidence > 0.6;
}

// Check if email is an auto-reply
function isAutoReply(subject: string, content: string): boolean {
  const autoReplyIndicators = [
    'auto-reply',
    'automatic reply',
    'out of office',
    'away message',
    'vacation responder',
    'do not reply',
    'noreply@',
    'no-reply@',
    'mailer-daemon'
  ];
  
  const combined = (subject + ' ' + content).toLowerCase();
  return autoReplyIndicators.some(indicator => combined.includes(indicator));
}

// Get priority label based on intent
function getPriorityLabel(intent: any): string {
  const highPriorityIntents = [
    'pricing_inquiry',
    'appointment_request',
    'ready_to_start'
  ];
  
  const mediumPriorityIntents = [
    'project_details',
    'pool_design_question',
    'timeline_question'
  ];
  
  if (highPriorityIntents.includes(intent.intent) && intent.confidence > 0.7) {
    return 'Hot Lead';
  }
  
  if (mediumPriorityIntents.includes(intent.intent) && intent.confidence > 0.5) {
    return 'Warm Lead';
  }
  
  if (intent.confidence > 0.3) {
    return 'Cold Lead';
  }
  
  return 'Info Request';
}

// Get queue status
export function getQueueStatus(): {
  isRunning: boolean;
  isProcessing: boolean;
  queueLength: number;
  processedCount: number;
} {
  const processedCount = emailQueue.filter(item => item.processed).length;
  
  return {
    isRunning: queueTimer !== null,
    isProcessing,
    queueLength: emailQueue.length,
    processedCount
  };
}

// Manually trigger queue processing
export async function triggerQueueProcessing(): Promise<void> {
  console.log('Manually triggering queue processing...');
  await checkForNewEmails();
}

// Clear the queue
export function clearQueue(): void {
  emailQueue = [];
  console.log('Email queue cleared');
}

// Add an auto-reply email to the queue
export interface AutoReplyQueueItem {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  threadId?: string;
  leadId?: string;
  messageType?: string;
  metadata?: {
    intent?: string;
    confidence?: number;
    leadScore?: number;
  };
}

// Store auto-reply data for processing
const autoReplyDataStore = new Map<string, {
  htmlContent: string;
  textContent?: string;
  leadId?: string;
  messageType?: string;
  metadata?: any;
}>();

export async function addToQueue(autoReply: AutoReplyQueueItem): Promise<{ queued: boolean; error?: string }> {
  try {
    // Generate a unique message ID for tracking
    const messageId = `auto-reply-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Add to the email queue
    const queueItem: EmailQueueItem = {
      messageId,
      threadId: autoReply.threadId || '',
      from: 'info@serenitycustompools.com',
      to: autoReply.to,
      subject: autoReply.subject,
      snippet: autoReply.textContent ? autoReply.textContent.substring(0, 100) : '',
      date: new Date(),
      processed: false
    };
    
    // Store the auto-reply data for later processing
    if (!autoReplyDataStore.has(messageId)) {
      autoReplyDataStore.set(messageId, {
        htmlContent: autoReply.htmlContent,
        textContent: autoReply.textContent,
        leadId: autoReply.leadId,
        messageType: autoReply.messageType || 'auto-reply',
        metadata: autoReply.metadata
      });
    }
    
    emailQueue.push(queueItem);
    
    console.log(`Auto-reply added to queue for ${autoReply.to} - Queue size: ${emailQueue.length}`);
    
    // If queue processor is not running, trigger processing
    if (!isProcessing && emailQueue.length > 0) {
      // Use a small delay to batch multiple auto-replies if they come in quickly
      setTimeout(() => processAutoReplyQueue(), 1000);
    }
    
    return { queued: true };
  } catch (error) {
    console.error('Error adding auto-reply to queue:', error);
    return { 
      queued: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Process auto-reply queue items
async function processAutoReplyQueue(): Promise<void> {
  if (isProcessing || emailQueue.length === 0) {
    return;
  }
  
  isProcessing = true;
  console.log(`Processing auto-reply queue with ${emailQueue.length} items...`);
  
  try {
    for (const queueItem of emailQueue) {
      if (queueItem.processed || !queueItem.messageId.startsWith('auto-reply-')) {
        continue;
      }
      
      const autoReplyData = autoReplyDataStore.get(queueItem.messageId);
      if (autoReplyData) {
        try {
          // Send the auto-reply email
          await sendEmail({
            to: queueItem.to,
            subject: queueItem.subject,
            htmlContent: autoReplyData.htmlContent,
            textContent: autoReplyData.textContent
          });
          
          console.log(`Auto-reply sent successfully to ${queueItem.to}`);
          
          // Apply labels if needed
          if (autoReplyData.metadata?.intent) {
            const priorityLabel = getPriorityLabel({
              intent: autoReplyData.metadata.intent,
              confidence: autoReplyData.metadata.confidence || 0.5
            });
            console.log(`Would apply label: ${priorityLabel} (if message ID was available)`);
          }
          
          // Clean up the data store
          autoReplyDataStore.delete(queueItem.messageId);
        } catch (error) {
          console.error(`Failed to send auto-reply to ${queueItem.to}:`, error);
          queueItem.processingError = error instanceof Error ? error.message : 'Send failed';
        }
      }
      
      queueItem.processed = true;
    }
    
    // Remove processed items from queue
    emailQueue = emailQueue.filter(item => !item.processed);
  } finally {
    isProcessing = false;
  }
}