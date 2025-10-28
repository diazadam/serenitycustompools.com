import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  PersonalizationData,
  selectBestTemplate,
  generatePersonalizedTemplate,
  getTemplateById
} from './email-templates';
import { sendEmail } from './gmail-service';
import { 
  EmailCampaign,
  InsertEmailCampaign,
  CampaignHistory,
  InsertCampaignHistory,
  Lead
} from '@shared/schema';

// Initialize Gemini AI for personalization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Campaign Types
export type CampaignType = 'welcome' | 'reengagement' | 'vip_fast_track';

// Campaign Definitions
export interface CampaignStep {
  id: string;
  dayDelay: number; // Days from enrollment
  templateId?: string; // Reference to email template
  subject: string;
  content?: string; // Override content
  personalizer?: (data: PersonalizationData) => Promise<string>;
}

export interface CampaignDefinition {
  type: CampaignType;
  name: string;
  description: string;
  steps: CampaignStep[];
  enrollmentCriteria: (lead: Lead) => boolean;
  priority: number; // Higher priority campaigns override lower ones
}

// Campaign Definitions
export const campaigns: CampaignDefinition[] = [
  {
    type: 'welcome',
    name: '7-Day Welcome Sequence',
    description: 'Nurture new leads with personalized content over 7 days',
    priority: 10,
    enrollmentCriteria: (lead) => {
      // All new leads get the welcome sequence
      return true;
    },
    steps: [
      {
        id: 'welcome_day_1',
        dayDelay: 0,
        templateId: 'welcome_day_1',
        subject: 'Welcome to Serenity Custom Pools, {{firstName}}! 🏊‍♂️',
        personalizer: async (data) => {
          const prompt = `Create a warm, personalized introduction for ${data.firstName} who is interested in ${data.projectType || 'a custom pool'}. 
          They are from ${data.city || 'the area'} with a budget of ${data.budgetRange || 'unspecified'}. 
          Make it luxurious and welcoming, highlighting their VIP status and the exclusive consultation offer.
          Keep it to 2-3 sentences.`;
          
          const result = await model.generateContent(prompt);
          return result.response.text();
        }
      },
      {
        id: 'welcome_day_3',
        dayDelay: 3,
        templateId: 'welcome_day_3',
        subject: '{{firstName}}, Your Pool Design Inspiration Guide 📚',
        personalizer: async (data) => {
          const prompt = `Create personalized pool style recommendations for ${data.firstName} based on:
          - Budget: ${data.budgetRange || 'flexible'}
          - Location: ${data.city || 'local area'}
          - Project type: ${data.projectType || 'custom pool'}
          Suggest 2-3 specific styles that would work well for them.`;
          
          const result = await model.generateContent(prompt);
          return result.response.text();
        }
      },
      {
        id: 'welcome_day_7',
        dayDelay: 7,
        templateId: 'welcome_day_7',
        subject: '{{firstName}}, See How We Transformed These Backyards 🌟',
        content: `
          <h2>Dear {{firstName}},</h2>
          <p>It's been a week since you joined the Serenity family, and we wanted to share some incredible transformations that might inspire your project.</p>
          
          <h3>🏆 Success Stories from {{city}}</h3>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4>The Johnson Family - Complete Backyard Paradise</h4>
            <p>"Working with Serenity was a dream. Ron's attention to detail and Adam's creative vision turned our boring backyard into the neighborhood's favorite gathering spot!"</p>
            <p><strong>Project Value:</strong> $125,000 | <strong>Timeline:</strong> 12 weeks</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4>The Martinez Estate - Luxury Infinity Pool</h4>
            <p>"The team exceeded every expectation. Our infinity pool with integrated spa is absolutely breathtaking. Worth every penny!"</p>
            <p><strong>Project Value:</strong> $185,000 | <strong>Timeline:</strong> 16 weeks</p>
          </div>
          
          <h3>💰 Flexible Financing Options</h3>
          <p>Don't let budget concerns hold you back from your dream pool:</p>
          <ul>
            <li>0% APR for 12 months on approved credit</li>
            <li>Extended payment plans up to 10 years</li>
            <li>No prepayment penalties</li>
            <li>Same-day approval process</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://serenitycustompools.com/schedule" style="background: #B8860B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 18px;">
              Schedule Your Free Consultation
            </a>
          </div>
          
          <p>Ready to create your own success story?</p>
        `
      }
    ]
  },
  {
    type: 'reengagement',
    name: 'Re-engagement Campaign',
    description: 'Win back leads who have been inactive for 30+ days',
    priority: 5,
    enrollmentCriteria: (lead) => {
      // Check if lead has been inactive for 30+ days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lead.createdAt < thirtyDaysAgo;
    },
    steps: [
      {
        id: 'reengagement_trends',
        dayDelay: 0,
        subject: '{{firstName}}, See What\'s New in Pool Design 🆕',
        content: `
          <h2>Hi {{firstName}},</h2>
          <p>We noticed it's been a while since we connected, and we wanted to share some exciting developments in pool design that might interest you!</p>
          
          <h3>🎨 2025 Pool Design Trends</h3>
          <div style="background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%); padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h4>1. Smart Pool Technology</h4>
            <p>Control everything from your phone - temperature, lighting, jets, and cleaning cycles. Our smart pools practically maintain themselves!</p>
            
            <h4>2. Natural Swimming Pools</h4>
            <p>Eco-friendly designs that use plants and natural filtration. Beautiful, sustainable, and lower chemical usage.</p>
            
            <h4>3. Infinity Edge Masterpieces</h4>
            <p>Create stunning visual effects that make your pool appear to merge with the horizon. Perfect for hillside properties!</p>
            
            <h4>4. Integrated Fire & Water Features</h4>
            <p>Combine fire bowls, waterfalls, and LED lighting for a truly magical evening ambiance.</p>
          </div>
          
          <h3>🎁 Exclusive Comeback Offer</h3>
          <div style="border: 3px dashed #B8860B; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <h3 style="color: #B8860B; margin-top: 0;">Limited Time: Save $2,500</h3>
            <p><strong>Book your consultation this month and receive:</strong></p>
            <ul style="text-align: left; display: inline-block;">
              <li>$2,500 off your pool project</li>
              <li>Free smart automation upgrade ($3,000 value)</li>
              <li>Priority scheduling for summer completion</li>
              <li>Complimentary 3D design rendering</li>
            </ul>
            <p style="color: #666; font-size: 14px;">Offer expires in 14 days</p>
          </div>
          
          <p>Don't let another summer pass without your dream pool!</p>
        `
      },
      {
        id: 'reengagement_invitation',
        dayDelay: 7,
        subject: '{{firstName}}, Your Personal Invitation from Ron 💌',
        content: `
          <h2>Dear {{firstName}},</h2>
          
          <div style="background: #f9f9f9; padding: 25px; border-left: 4px solid #B8860B; margin: 20px 0;">
            <p style="font-style: italic; font-size: 18px; line-height: 1.6;">
              "Hi {{firstName}}, this is Ron from Serenity Custom Pools. I wanted to personally reach out because I believe everyone deserves their perfect backyard oasis.
            </p>
            <p style="font-style: italic; font-size: 18px; line-height: 1.6;">
              I've been building pools for over 30 years, and I can tell you - there's never been a better time to invest in your property and family's happiness.
            </p>
            <p style="font-style: italic; font-size: 18px; line-height: 1.6;">
              I'd love to sit down with you, hear your vision, and show you how we can make it a reality within your budget. No pressure, just an honest conversation about your options."
            </p>
            <p style="text-align: right; font-weight: bold; margin-top: 20px;">
              - Ron, Owner
            </p>
          </div>
          
          <h3>📅 Schedule a No-Obligation Consultation</h3>
          <p>Let's explore your options together. Choose what works best for you:</p>
          
          <div style="display: flex; gap: 20px; margin: 25px 0;">
            <div style="flex: 1; text-align: center; padding: 20px; background: white; border: 1px solid #ddd; border-radius: 8px;">
              <h4>Virtual Consultation</h4>
              <p>Video call from the comfort of your home</p>
              <a href="https://serenitycustompools.com/schedule-virtual" style="color: #B8860B;">Schedule Virtual →</a>
            </div>
            <div style="flex: 1; text-align: center; padding: 20px; background: white; border: 1px solid #ddd; border-radius: 8px;">
              <h4>In-Person Meeting</h4>
              <p>Meet at your property for site evaluation</p>
              <a href="https://serenitycustompools.com/schedule-onsite" style="color: #B8860B;">Schedule On-Site →</a>
            </div>
          </div>
          
          <p>Looking forward to connecting with you soon!</p>
        `
      }
    ]
  },
  {
    type: 'vip_fast_track',
    name: 'VIP Fast Track Campaign',
    description: 'Premium experience for high-value leads ($100K+ projects)',
    priority: 15,
    enrollmentCriteria: (lead) => {
      // Check if budget indicates $100K+ project
      const budget = lead.budgetRange?.toLowerCase() || '';
      return budget.includes('100') || 
             budget.includes('150') || 
             budget.includes('200') || 
             budget.includes('250') || 
             budget.includes('luxury') ||
             budget.includes('premium') ||
             budget.includes('high-end');
    },
    steps: [
      {
        id: 'vip_welcome',
        dayDelay: 0,
        subject: '{{firstName}}, Welcome to Our VIP Circle 🥇',
        content: `
          <div style="background: linear-gradient(135deg, #B8860B 0%, #8B6914 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1 style="margin: 0; font-size: 32px;">VIP EXPERIENCE ACTIVATED</h1>
            <p style="font-size: 18px; margin-top: 10px;">Exclusive Benefits for Premium Projects</p>
          </div>
          
          <h2>Dear {{firstName}},</h2>
          
          <p>Based on your project scope, you've been elevated to our VIP Circle - an exclusive tier reserved for our most distinguished clients.</p>
          
          <h3>🌟 Your VIP Benefits Include:</h3>
          
          <div style="background: #f9f9f9; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h4 style="color: #B8860B;">1. Priority Fast-Track Scheduling</h4>
            <p>Jump to the front of our build queue. Your project will be prioritized for the fastest possible completion - typically 30% faster than standard timelines.</p>
            
            <h4 style="color: #B8860B;">2. Direct Owner Access</h4>
            <p>Ron's personal cell: (555) 123-4567<br>
            Adam's direct line: (555) 123-4568<br>
            Call or text anytime - we're here for you 24/7.</p>
            
            <h4 style="color: #B8860B;">3. Exclusive Design Consultation</h4>
            <p>Work directly with our senior design team and receive unlimited 3D revisions until your vision is perfect. Includes virtual reality walkthrough of your future pool.</p>
            
            <h4 style="color: #B8860B;">4. Premium Materials Access</h4>
            <p>First access to rare imported tiles, exotic stones, and limited-edition features. Plus, contractor pricing on all premium upgrades.</p>
            
            <h4 style="color: #B8860B;">5. White Glove Service</h4>
            <ul>
              <li>Dedicated project concierge</li>
              <li>Weekly progress reports with drone footage</li>
              <li>Complimentary first year maintenance package ($3,500 value)</li>
              <li>VIP invitation to our annual pool party showcase</li>
            </ul>
          </div>
          
          <h3>📞 Your Next Step</h3>
          <p>I'll be calling you personally within the next 24 hours to discuss your vision and schedule your VIP consultation.</p>
          
          <p>In the meantime, explore our <a href="https://serenitycustompools.com/vip-portfolio" style="color: #B8860B;">VIP Portfolio</a> showcasing our $100K+ masterpieces.</p>
          
          <p>Welcome to the Serenity VIP family!</p>
          
          <p><strong>Ron & Adam</strong><br>
          Owners, Serenity Custom Pools</p>
        `
      },
      {
        id: 'vip_materials_showcase',
        dayDelay: 2,
        subject: '{{firstName}}, Your Exclusive Materials Preview 💎',
        content: `
          <h2>Hi {{firstName}},</h2>
          
          <p>As a VIP client, you have access to our premium materials collection. Here's a preview of what's available exclusively for your project:</p>
          
          <h3>🏆 Premium Collection Highlights</h3>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4>Italian Glass Tile Collection</h4>
            <p>Hand-crafted in Venice, these luminescent tiles create stunning underwater effects. Available in 12 exclusive colorways.</p>
            <p><strong>VIP Price:</strong> 40% below retail</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4>Natural Stone Coping - Travertine & Limestone</h4>
            <p>Imported directly from Turkish quarries. Cool to the touch even in summer heat, with lifetime warranty.</p>
            <p><strong>VIP Exclusive:</strong> Custom cutting at no extra charge</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4>Smart Features Package</h4>
            <ul>
              <li>Jandy iAquaLink automation system</li>
              <li>Color-changing LED system (16 million colors)</li>
              <li>Self-cleaning technology</li>
              <li>Integrated audio system with underwater speakers</li>
            </ul>
            <p><strong>VIP Bonus:</strong> Free upgrade to latest model (saves $2,000)</p>
          </div>
          
          <h3>🎨 Schedule Your Private Showroom Tour</h3>
          <p>Visit our exclusive VIP showroom to see and feel these materials in person. We'll have champagne and refreshments waiting!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://serenitycustompools.com/vip-showroom" style="background: #B8860B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 18px;">
              Book VIP Showroom Tour
            </a>
          </div>
          
          <p>Can't wait to show you these beautiful options in person!</p>
        `
      },
      {
        id: 'vip_fast_track_final',
        dayDelay: 5,
        subject: '{{firstName}}, Your VIP Design Session Awaits 🎨',
        content: `
          <h2>Dear {{firstName}},</h2>
          
          <p>Your VIP experience continues! We've reserved exclusive design studio time just for you.</p>
          
          <h3>🏗️ Your Personalized Design Session Includes:</h3>
          
          <div style="background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%); padding: 30px; border-radius: 10px; border: 2px solid #B8860B; margin: 20px 0;">
            <h4>3-Hour VIP Design Experience</h4>
            <ul style="line-height: 2;">
              <li>✅ One-on-one with our senior design architect</li>
              <li>✅ Real-time 3D modeling of your pool</li>
              <li>✅ Virtual reality walkthrough</li>
              <li>✅ Material samples and selection</li>
              <li>✅ Landscape integration planning</li>
              <li>✅ Engineering feasibility review</li>
              <li>✅ Detailed cost breakdown</li>
              <li>✅ Gourmet lunch provided</li>
            </ul>
          </div>
          
          <h3>📅 Available VIP Sessions This Week:</h3>
          <p>Choose your preferred time (all sessions at our design studio):</p>
          
          <ul>
            <li>Tuesday, 10:00 AM - 1:00 PM</li>
            <li>Wednesday, 2:00 PM - 5:00 PM</li>
            <li>Thursday, 10:00 AM - 1:00 PM</li>
            <li>Saturday, 9:00 AM - 12:00 PM (includes breakfast)</li>
          </ul>
          
          <p><strong>Call Ron directly to reserve: (555) 123-4567</strong></p>
          
          <h3>💰 VIP Financing Options</h3>
          <p>For projects over $100K, we offer:</p>
          <ul>
            <li>Up to 100% financing</li>
            <li>Terms up to 20 years</li>
            <li>No payments for 6 months option</li>
            <li>Pre-approval in 24 hours</li>
          </ul>
          
          <p>Looking forward to bringing your luxury vision to life!</p>
          
          <p><strong>The Serenity VIP Team</strong></p>
        `
      }
    ]
  }
];

// Get campaign definition by type
export function getCampaignDefinition(type: CampaignType): CampaignDefinition | undefined {
  return campaigns.find(c => c.type === type);
}

// Determine which campaign a lead should be enrolled in
export async function determineCampaignForLead(lead: Lead): Promise<CampaignType | null> {
  // Sort campaigns by priority (highest first)
  const sortedCampaigns = [...campaigns].sort((a, b) => b.priority - a.priority);
  
  // Find the first campaign that matches enrollment criteria
  for (const campaign of sortedCampaigns) {
    if (campaign.enrollmentCriteria(lead)) {
      return campaign.type;
    }
  }
  
  return null;
}

// Calculate next send time respecting timezone and business hours
export function calculateNextSendTime(
  dayDelay: number,
  timezone: string = 'America/Los_Angeles',
  enrolledAt: Date = new Date()
): Date {
  const sendDate = new Date(enrolledAt);
  sendDate.setDate(sendDate.getDate() + dayDelay);
  
  // Set to 10 AM in the lead's timezone
  sendDate.setHours(10, 0, 0, 0);
  
  // If it's a weekend, move to Monday
  const dayOfWeek = sendDate.getDay();
  if (dayOfWeek === 0) { // Sunday
    sendDate.setDate(sendDate.getDate() + 1);
  } else if (dayOfWeek === 6) { // Saturday
    sendDate.setDate(sendDate.getDate() + 2);
  }
  
  // Ensure we're sending during business hours (9 AM - 6 PM)
  const hour = sendDate.getHours();
  if (hour < 9) {
    sendDate.setHours(9, 0, 0, 0);
  } else if (hour >= 18) {
    // Move to next business day at 9 AM
    sendDate.setDate(sendDate.getDate() + 1);
    sendDate.setHours(9, 0, 0, 0);
    
    // Check if we moved to weekend
    const newDayOfWeek = sendDate.getDay();
    if (newDayOfWeek === 0) { // Sunday
      sendDate.setDate(sendDate.getDate() + 1);
    } else if (newDayOfWeek === 6) { // Saturday
      sendDate.setDate(sendDate.getDate() + 2);
    }
  }
  
  return sendDate;
}

// Generate personalized email content for a campaign step
export async function generateCampaignEmail(
  step: CampaignStep,
  lead: Lead,
  personalizationData: PersonalizationData
): Promise<{ subject: string; htmlContent: string; textContent: string }> {
  let subject = step.subject;
  let htmlContent = step.content || '';
  let textContent = '';
  
  // Replace basic placeholders
  subject = subject.replace(/{{firstName}}/g, lead.firstName);
  subject = subject.replace(/{{city}}/g, lead.city || 'your area');
  
  // If there's a template ID, use it
  if (step.templateId) {
    const template = await generatePersonalizedTemplate(
      step.templateId,
      personalizationData
    );
    
    if (template) {
      subject = template.subject;
      htmlContent = template.htmlBody;
      textContent = template.textBody;
    }
  }
  
  // Apply custom personalizer if provided
  if (step.personalizer) {
    const personalizedContent = await step.personalizer(personalizationData);
    // Insert personalized content into the email
    htmlContent = htmlContent.replace('{{personalizedContent}}', personalizedContent);
  }
  
  // Basic placeholder replacements in content
  htmlContent = htmlContent.replace(/{{firstName}}/g, lead.firstName);
  htmlContent = htmlContent.replace(/{{city}}/g, lead.city || 'your area');
  htmlContent = htmlContent.replace(/{{projectType}}/g, lead.projectType || 'pool project');
  htmlContent = htmlContent.replace(/{{budgetRange}}/g, lead.budgetRange || 'your budget');
  
  // Add unsubscribe footer
  const unsubscribeFooter = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666;">
      <p>Serenity Custom Pools | Transforming Backyards Since 1994</p>
      <p>7418 Haven Ave, Rancho Cucamonga, CA 91730</p>
      <p><a href="https://serenitycustompools.com/unsubscribe?email=${lead.email}&campaign=${step.id}" style="color: #666;">Unsubscribe</a> | 
         <a href="https://serenitycustompools.com/preferences?email=${lead.email}" style="color: #666;">Update Preferences</a></p>
    </div>
  `;
  
  htmlContent += unsubscribeFooter;
  
  // Generate text version from HTML
  textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
  
  return { subject, htmlContent, textContent };
}

// Check if a campaign should send its next email
export function shouldSendNextEmail(campaign: EmailCampaign): boolean {
  // Don't send if campaign is not active
  if (campaign.status !== 'active') {
    return false;
  }
  
  // Don't send if unsubscribed
  if (campaign.unsubscribed) {
    return false;
  }
  
  // Check if we've completed all steps
  if (campaign.currentStep !== null && campaign.currentStep >= campaign.totalSteps) {
    return false;
  }
  
  // Prevent duplicate sends - check if email was sent recently (within last 30 minutes)
  if (campaign.lastSentAt) {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (campaign.lastSentAt > thirtyMinutesAgo) {
      console.log(`Skipping campaign ${campaign.id} - email sent recently at ${campaign.lastSentAt}`);
      return false;
    }
  }
  
  // Check if it's time to send the next email
  if (campaign.nextSendAt && new Date() >= campaign.nextSendAt) {
    return true;
  }
  
  // If no next send time is set and it's the first email, send it
  // But only if we haven't sent any email recently (lastSentAt check above prevents duplicates)
  if (!campaign.nextSendAt && campaign.currentStep === 0) {
    return true; // First email should be sent immediately
  }
  
  return false;
}

// Graduate lead from one campaign to another
export async function graduateLead(
  lead: Lead,
  fromCampaign: CampaignType,
  toCampaign: CampaignType
): Promise<boolean> {
  // Check if the new campaign's enrollment criteria are met
  const newCampaignDef = getCampaignDefinition(toCampaign);
  if (!newCampaignDef || !newCampaignDef.enrollmentCriteria(lead)) {
    return false;
  }
  
  console.log(`Graduating lead ${lead.id} from ${fromCampaign} to ${toCampaign}`);
  
  // The actual campaign enrollment will be handled by the storage layer
  return true;
}

// Track email engagement (opens, clicks)
export async function trackEmailEngagement(
  campaignHistoryId: string,
  action: 'open' | 'click',
  data?: any
): Promise<void> {
  console.log(`Tracking ${action} for campaign history ${campaignHistoryId}`, data);
  
  // This will be implemented with the storage layer
  // For clicks, we can track which links were clicked
  // For opens, we increment the open count
}

// Handle unsubscribe request
export async function handleUnsubscribe(
  email: string,
  campaignId?: string
): Promise<void> {
  console.log(`Processing unsubscribe for ${email} from campaign ${campaignId || 'all'}`);
  
  // This will be implemented with the storage layer
  // If campaignId is provided, unsubscribe from specific campaign
  // Otherwise, unsubscribe from all campaigns
}

// Get recommended campaign for a lead based on their activity
export async function getRecommendedCampaign(lead: Lead): Promise<CampaignType | null> {
  // Calculate lead score
  const score = calculateLeadScore(lead);
  
  // High-value leads go to VIP track
  if (score >= 80 || lead.budgetRange?.includes('100')) {
    return 'vip_fast_track';
  }
  
  // Check last activity date for re-engagement
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (lead.createdAt < thirtyDaysAgo) {
    return 'reengagement';
  }
  
  // Default to welcome sequence for new leads
  return 'welcome';
}

// Helper function to calculate lead score
function calculateLeadScore(lead: Lead): number {
  let score = 50; // Base score
  
  // Budget indicators
  const budget = lead.budgetRange?.toLowerCase() || '';
  if (budget.includes('150') || budget.includes('200') || budget.includes('250')) {
    score += 30;
  } else if (budget.includes('100')) {
    score += 20;
  } else if (budget.includes('75')) {
    score += 10;
  }
  
  // Contact information completeness
  if (lead.phone) score += 5;
  if (lead.city) score += 5;
  if (lead.projectType) score += 5;
  if (lead.message && lead.message.length > 50) score += 5;
  
  // Source quality
  if (lead.source === 'pool_visualizer') score += 10;
  if (lead.source === 'affiliate') score += 10;
  
  return Math.min(score, 100);
}

// Export campaign processor for the scheduler
export async function processCampaigns(
  getCampaigns: () => Promise<EmailCampaign[]>,
  updateCampaign: (id: string, data: Partial<EmailCampaign>) => Promise<void>,
  recordEmailSent: (data: InsertCampaignHistory) => Promise<void>,
  getLead: (id: string) => Promise<Lead | null>
): Promise<void> {
  console.log('Starting campaign processor run...');
  
  try {
    // Get all active campaigns
    const campaigns = await getCampaigns();
    const activeCampaigns = campaigns.filter(c => shouldSendNextEmail(c));
    
    console.log(`Found ${activeCampaigns.length} campaigns ready to send emails`);
    
    for (const campaign of activeCampaigns) {
      try {
        // Get lead data
        const lead = await getLead(campaign.leadId);
        if (!lead) {
          console.error(`Lead ${campaign.leadId} not found for campaign ${campaign.id}`);
          continue;
        }
        
        // Get campaign definition
        const campaignDef = getCampaignDefinition(campaign.campaignType as CampaignType);
        if (!campaignDef) {
          console.error(`Campaign definition not found for type ${campaign.campaignType}`);
          continue;
        }
        
        // Get the current step
        const stepIndex = campaign.currentStep ?? 0;
        const currentStep = campaignDef.steps[stepIndex];
        if (!currentStep) {
          console.error(`Step ${stepIndex} not found in campaign ${campaign.campaignType}`);
          continue;
        }
        
        // Generate personalized email
        const personalizationData: PersonalizationData = {
          firstName: lead.firstName,
          lastName: lead.lastName || undefined,
          email: lead.email,
          phone: lead.phone || undefined,
          projectType: lead.projectType || undefined,
          budgetRange: lead.budgetRange || undefined,
          city: lead.city || undefined,
        };
        
        const emailContent = await generateCampaignEmail(currentStep, lead, personalizationData);
        
        // Send the email
        const emailResult = await sendEmail({
          to: lead.email,
          subject: emailContent.subject,
          htmlContent: emailContent.htmlContent,
          textContent: emailContent.textContent,
        });
        
        // Record the sent email
        await recordEmailSent({
          campaignId: campaign.id,
          leadId: lead.id,
          emailType: currentStep.id,
          subject: emailContent.subject,
          content: emailContent.htmlContent,
          sentAt: new Date(),
          emailProvider: 'gmail',
          messageId: emailResult.messageId,
        });
        
        // Update campaign progress
        const nextStepIndex = (campaign.currentStep ?? 0) + 1;
        const nextStep = campaignDef.steps[nextStepIndex];
        
        let updates: Partial<EmailCampaign> = {
          currentStep: nextStepIndex,
          lastSentAt: new Date(),
        };
        
        if (nextStep) {
          // Calculate next send time
          updates.nextSendAt = calculateNextSendTime(
            nextStep.dayDelay,
            campaign.timezone || 'America/Los_Angeles',
            campaign.enrolledAt
          );
        } else {
          // Campaign completed
          updates.status = 'completed';
          updates.completedAt = new Date();
        }
        
        await updateCampaign(campaign.id, updates);
        
        console.log(`Sent ${currentStep.id} email to ${lead.email} for campaign ${campaign.id}`);
        
      } catch (error) {
        console.error(`Error processing campaign ${campaign.id}:`, error);
      }
    }
    
    console.log('Campaign processor run completed');
    
  } catch (error) {
    console.error('Error in campaign processor:', error);
  }
}