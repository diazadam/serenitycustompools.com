import { processCampaigns } from './email-campaigns';
import { storage } from '../storage';

// Campaign processor state
let campaignProcessorInterval: NodeJS.Timeout | null = null;
let isProcessing = false;
let lastProcessedAt: Date | null = null;
let processCount = 0;
let errorCount = 0;

// Processor configuration
const PROCESSOR_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
const BUSINESS_HOURS_START = 9; // 9 AM
const BUSINESS_HOURS_END = 18; // 6 PM

interface ProcessorStatus {
  isRunning: boolean;
  isProcessing: boolean;
  lastProcessedAt: Date | null;
  nextRunAt: Date | null;
  processCount: number;
  errorCount: number;
  intervalMs: number;
}

// Check if current time is within business hours for the given timezone
function isBusinessHours(timezone: string = 'America/Los_Angeles'): boolean {
  const now = new Date();
  const hour = now.getHours(); // This gets local server time
  
  // For production, you'd want to use a proper timezone library
  // For now, we'll use a simple check based on server time
  return hour >= BUSINESS_HOURS_START && hour < BUSINESS_HOURS_END;
}

// Check if it's a weekend
function isWeekend(): boolean {
  const now = new Date();
  const day = now.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

// Run the campaign processor
async function runCampaignProcessor(): Promise<void> {
  // Skip if already processing
  if (isProcessing) {
    console.log('Campaign processor is already running, skipping this cycle');
    return;
  }
  
  // Skip weekends unless there are urgent campaigns
  if (isWeekend()) {
    console.log('Skipping campaign processing on weekend');
    return;
  }
  
  // Skip outside business hours
  if (!isBusinessHours()) {
    console.log('Outside business hours, skipping campaign processing');
    return;
  }
  
  isProcessing = true;
  const startTime = Date.now();
  
  try {
    console.log('Starting campaign processor...');
    
    // Process campaigns
    await processCampaigns(
      () => storage.getActiveCampaigns(),
      async (id, data) => { await storage.updateEmailCampaign(id, data); },
      (data) => storage.createCampaignHistory(data),
      (id) => storage.getLead(id).then(lead => lead || null)
    );
    
    processCount++;
    lastProcessedAt = new Date();
    
    const duration = Date.now() - startTime;
    console.log(`Campaign processor completed in ${duration}ms`);
    
  } catch (error) {
    errorCount++;
    console.error('Campaign processor error:', error);
    
    // If too many errors, stop the processor
    if (errorCount > 5) {
      console.error('Too many errors, stopping campaign processor');
      stopCampaignProcessor();
    }
  } finally {
    isProcessing = false;
  }
}

// Start the campaign processor
export function startCampaignProcessor(intervalMs: number = PROCESSOR_INTERVAL): void {
  if (campaignProcessorInterval) {
    console.log('Campaign processor is already running');
    return;
  }
  
  console.log(`Starting campaign processor with interval: ${intervalMs}ms (${intervalMs / 1000 / 60} minutes)`);
  
  // Don't run immediately on start to prevent duplicate emails on server restarts
  // Instead, schedule the first run after a short delay (5 minutes) to allow the system to stabilize
  const initialDelay = 5 * 60 * 1000; // 5 minutes
  console.log(`Scheduling first campaign processor run in ${initialDelay / 1000 / 60} minutes`);
  
  setTimeout(() => {
    runCampaignProcessor();
    
    // Then run on interval
    campaignProcessorInterval = setInterval(() => {
      runCampaignProcessor();
    }, intervalMs);
  }, initialDelay);
  
  // Reset error count when starting
  errorCount = 0;
  
  console.log('Campaign processor scheduled successfully');
}

// Stop the campaign processor
export function stopCampaignProcessor(): void {
  if (campaignProcessorInterval) {
    clearInterval(campaignProcessorInterval);
    campaignProcessorInterval = null;
    console.log('Campaign processor stopped');
  }
}

// Get processor status
export function getCampaignProcessorStatus(): ProcessorStatus {
  let nextRunAt: Date | null = null;
  
  if (campaignProcessorInterval && lastProcessedAt) {
    nextRunAt = new Date(lastProcessedAt.getTime() + PROCESSOR_INTERVAL);
  }
  
  return {
    isRunning: campaignProcessorInterval !== null,
    isProcessing,
    lastProcessedAt,
    nextRunAt,
    processCount,
    errorCount,
    intervalMs: PROCESSOR_INTERVAL
  };
}

// Manually trigger processing
export async function triggerCampaignProcessing(): Promise<void> {
  console.log('Manually triggering campaign processing...');
  await runCampaignProcessor();
}

// Process campaigns for a specific lead immediately
export async function processLeadCampaignNow(leadId: string): Promise<void> {
  console.log(`Processing campaigns for lead ${leadId}...`);
  
  try {
    const campaigns = await storage.getEmailCampaignByLeadId(leadId);
    const activeCampaign = campaigns.find(c => c.status === 'active');
    
    if (!activeCampaign) {
      console.log(`No active campaign found for lead ${leadId}`);
      return;
    }
    
    // Process just this lead's campaign
    await processCampaigns(
      async () => [activeCampaign],
      async (id, data) => { await storage.updateEmailCampaign(id, data); },
      (data) => storage.createCampaignHistory(data),
      (id) => storage.getLead(id).then(lead => lead || null)
    );
    
    console.log(`Campaign processing completed for lead ${leadId}`);
    
  } catch (error) {
    console.error(`Error processing campaign for lead ${leadId}:`, error);
    throw error;
  }
}

// Auto-enroll new leads in appropriate campaigns
export async function autoEnrollLead(leadId: string): Promise<void> {
  try {
    const lead = await storage.getLead(leadId);
    if (!lead) {
      console.error(`Lead ${leadId} not found for auto-enrollment`);
      return;
    }
    
    // Check if already enrolled
    const existingCampaigns = await storage.getEmailCampaignByLeadId(leadId);
    if (existingCampaigns.some(c => c.status === 'active')) {
      console.log(`Lead ${leadId} already has an active campaign`);
      return;
    }
    
    // Import the function locally to avoid circular dependency
    const { determineCampaignForLead, getCampaignDefinition, calculateNextSendTime } = 
      await import('./email-campaigns');
    
    // Determine best campaign
    const campaignType = await determineCampaignForLead(lead);
    if (!campaignType) {
      console.log(`No suitable campaign found for lead ${leadId}`);
      return;
    }
    
    const campaignDef = getCampaignDefinition(campaignType);
    if (!campaignDef) {
      console.error(`Campaign definition not found for type ${campaignType}`);
      return;
    }
    
    // Create the campaign
    const campaign = await storage.createEmailCampaign({
      leadId,
      campaignType,
      totalSteps: campaignDef.steps.length,
      status: 'active',
      nextSendAt: null, // Will be set after sending first email
      timezone: 'America/Los_Angeles',
      enrolledAt: new Date()
    });
    
    console.log(`Lead ${leadId} auto-enrolled in ${campaignDef.name}`);
    
    // Process immediately if during business hours
    if (isBusinessHours() && !isWeekend()) {
      console.log(`Processing first email immediately for lead ${leadId}`);
      await processLeadCampaignNow(leadId);
    } else {
      console.log(`Lead ${leadId} enrolled - will send first email during next business hours`);
    }
    
  } catch (error) {
    console.error(`Error auto-enrolling lead ${leadId}:`, error);
  }
}

// Initialize campaign processor on server start
export function initializeCampaignProcessor(): void {
  // Start the processor
  startCampaignProcessor();
  
  // Also set up cleanup on process exit
  process.on('SIGINT', () => {
    console.log('Shutting down campaign processor...');
    stopCampaignProcessor();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('Shutting down campaign processor...');
    stopCampaignProcessor();
    process.exit(0);
  });
  
  console.log('Campaign processor initialized');
}

// Export for use in other modules
export default {
  startCampaignProcessor,
  stopCampaignProcessor,
  getCampaignProcessorStatus,
  triggerCampaignProcessing,
  processLeadCampaignNow,
  autoEnrollLead,
  initializeCampaignProcessor
};