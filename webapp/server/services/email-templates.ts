import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI for personalization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'welcome' | 'reengagement' | 'vip' | 'appointment' | 'followup' | 'nurture';
  subject: string;
  htmlBody: string;
  textBody: string;
  placeholders: string[];
  dayDelay?: number; // For sequences
  priority: number;
}

export interface PersonalizationData {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  projectType?: string;
  budgetRange?: string;
  city?: string;
  leadScore?: number;
  lastInteraction?: Date;
  appointmentDate?: Date;
  consultationNotes?: string;
  interests?: string[];
  customData?: Record<string, any>;
}

// Template definitions
const templates: EmailTemplate[] = [
  // Welcome Sequence - Day 1
  {
    id: 'welcome_day_1',
    name: 'Welcome - Immediate',
    category: 'welcome',
    subject: 'Welcome to Serenity Custom Pools, {{firstName}}!',
    htmlBody: `
      <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2c2c2c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Your Pool Journey!</h1>
          <p style="color: #B8860B; font-size: 16px; margin-top: 10px;">Transforming Backyards Into Paradise Since 1994</p>
        </div>
        
        <div style="padding: 30px; background: white; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e3a8a;">Dear {{firstName}},</h2>
          
          <p>Welcome to the Serenity Custom Pools family! We're thrilled you've chosen us to help create your backyard paradise.</p>
          
          {{personalizedIntro}}
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #B8860B; margin-top: 0;">What Happens Next?</h3>
            <ol style="color: #555;">
              <li><strong>Personal Consultation:</strong> Ron or Adam will contact you within 24 hours</li>
              <li><strong>Site Visit:</strong> We'll evaluate your property and discuss your vision</li>
              <li><strong>3D Design:</strong> Receive a custom visualization of your dream pool</li>
              <li><strong>Proposal:</strong> Get transparent pricing with flexible financing options</li>
            </ol>
          </div>
          
          <div style="border: 2px solid #B8860B; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <h3 style="color: #1e3a8a; margin-top: 0;">🎁 Your VIP Benefits</h3>
            <p><strong>Complimentary Design Consultation</strong> - $1,500 Value</p>
            <p><strong>Priority Scheduling</strong> - Jump ahead in our build queue</p>
            <p><strong>Exclusive Pricing</strong> - Special rates for early commitment</p>
          </div>
          
          {{projectDetails}}
          
          <p>In the meantime, <a href="https://serenitycustompools.com/portfolio" style="color: #B8860B;">explore our portfolio</a> for inspiration, or <a href="https://serenitycustompools.com/testimonials" style="color: #B8860B;">read what our clients say</a> about their experience.</p>
          
          <p style="margin-top: 30px;">We can't wait to bring your vision to life!</p>
          
          {{signature}}
        </div>
      </div>
    `,
    textBody: `Welcome {{firstName}}! Content here...`,
    placeholders: ['firstName', 'personalizedIntro', 'projectDetails', 'signature'],
    dayDelay: 0,
    priority: 10
  },
  
  // Welcome Sequence - Day 3
  {
    id: 'welcome_day_3',
    name: 'Welcome - Education',
    category: 'welcome',
    subject: '{{firstName}}, Your Pool Design Inspiration Guide',
    htmlBody: `
      <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
        <h2 style="color: #1e3a8a;">Hi {{firstName}},</h2>
        
        <p>We hope you're as excited as we are about your upcoming pool project!</p>
        
        <p>To help you prepare for your consultation, we've put together some resources that our clients find incredibly helpful:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #B8860B;">📚 Your Pool Planning Resources</h3>
          
          <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 5px;">
            <h4 style="color: #1e3a8a; margin-top: 0;">1. Pool Style Guide</h4>
            <p>{{styleRecommendation}}</p>
            <a href="https://serenitycustompools.com/styles" style="color: #B8860B;">Explore Styles →</a>
          </div>
          
          <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 5px;">
            <h4 style="color: #1e3a8a; margin-top: 0;">2. Feature Wishlist</h4>
            <p>Popular features in {{city}} include:</p>
            <ul style="color: #666;">
              <li>Infinity edges for hillside properties</li>
              <li>Integrated spas with spillovers</li>
              <li>Smart automation systems</li>
              <li>LED lighting with color control</li>
            </ul>
          </div>
          
          <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 5px;">
            <h4 style="color: #1e3a8a; margin-top: 0;">3. Budget Planning</h4>
            <p>{{budgetGuidance}}</p>
            <a href="https://serenitycustompools.com/financing" style="color: #B8860B;">Financing Options →</a>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://serenitycustompools.com/download-guide" style="display: inline-block; background: #B8860B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
            📖 Download Our Complete Pool Guide
          </a>
        </div>
        
        <p><strong>Quick Question:</strong> What's most important to you in your pool project?</p>
        <ul>
          <li>Family fun and entertainment?</li>
          <li>Elegant design and aesthetics?</li>
          <li>Health and fitness features?</li>
          <li>Low maintenance and efficiency?</li>
        </ul>
        <p>Reply to let us know, and we'll tailor our consultation to your priorities!</p>
        
        {{signature}}
      </div>
    `,
    textBody: `Hi {{firstName}}, pool planning resources...`,
    placeholders: ['firstName', 'city', 'styleRecommendation', 'budgetGuidance', 'signature'],
    dayDelay: 3,
    priority: 8
  },
  
  // Welcome Sequence - Day 7
  {
    id: 'welcome_day_7',
    name: 'Welcome - Check In',
    category: 'welcome',
    subject: '{{firstName}}, Ready to Move Forward with Your Pool?',
    htmlBody: `
      <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
        <h2 style="color: #1e3a8a;">Hi {{firstName}},</h2>
        
        <p>It's been a week since you first reached out about your pool project. We wanted to check in and see how your planning is coming along!</p>
        
        {{consultationStatus}}
        
        <div style="background: linear-gradient(to right, #f5f5f5, #fff); padding: 25px; border-left: 4px solid #B8860B; margin: 25px 0;">
          <h3 style="color: #1e3a8a; margin-top: 0;">🌟 This Week's Special Offer</h3>
          <p><strong>Book your consultation this week and receive:</strong></p>
          <ul style="color: #555;">
            <li>Free pool cover with any pool package ($3,500 value)</li>
            <li>Complimentary first-year maintenance plan</li>
            <li>Priority spring installation scheduling</li>
          </ul>
          <p style="font-style: italic; color: #666;">*Offer expires {{expirationDate}}</p>
        </div>
        
        <div style="margin: 30px 0;">
          <h3 style="color: #B8860B;">Common Questions at This Stage:</h3>
          
          <p><strong>Q: How long does the design process take?</strong><br>
          A: Typically 1-2 weeks from consultation to final design approval.</p>
          
          <p><strong>Q: Can we make changes after construction starts?</strong><br>
          A: Yes, though we recommend finalizing major decisions during design to avoid delays.</p>
          
          <p><strong>Q: What about permits?</strong><br>
          A: We handle all permitting - it's included in our service!</p>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <p style="font-size: 18px; color: #1e3a8a; margin-bottom: 20px;">Ready to take the next step?</p>
          <a href="https://serenitycustompools.com/schedule" style="display: inline-block; background: #B8860B; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 18px;">
            Schedule Your Consultation
          </a>
          <p style="margin-top: 15px; color: #666;">Or call us directly: <strong>(678) 300-8949</strong></p>
        </div>
        
        {{signature}}
      </div>
    `,
    textBody: `Hi {{firstName}}, checking in on your pool project...`,
    placeholders: ['firstName', 'consultationStatus', 'expirationDate', 'signature'],
    dayDelay: 7,
    priority: 7
  },
  
  // Re-engagement Template
  {
    id: 'reengagement_cold',
    name: 'Re-engagement - Cold Lead',
    category: 'reengagement',
    subject: '{{firstName}}, Still Dreaming of That Perfect Pool?',
    htmlBody: `
      <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
        <h2 style="color: #1e3a8a;">Hi {{firstName}},</h2>
        
        <p>It's been a while since we last connected about your pool project. We understand that timing is everything when it comes to major home improvements.</p>
        
        <p><strong>The good news?</strong> We're here whenever you're ready, and market conditions have never been better!</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #B8860B; margin-top: 0;">🎯 Why Now Might Be Perfect:</h3>
          <ul style="color: #555;">
            <li>{{marketCondition1}}</li>
            <li>{{marketCondition2}}</li>
            <li>Early booking discounts for next season (up to 15% off)</li>
            <li>New financing options as low as 4.99% APR</li>
          </ul>
        </div>
        
        <div style="border: 2px dashed #B8860B; padding: 20px; border-radius: 8px; margin: 25px 0; background: #fffef5;">
          <h3 style="color: #1e3a8a; margin-top: 0;">🔄 What's Changed Since We Last Spoke:</h3>
          <p>• New infinity edge technology at 30% less cost</p>
          <p>• Smart pool systems that reduce maintenance by 75%</p>
          <p>• Eco-friendly options with solar heating</p>
          <p>• Virtual reality design previews</p>
        </div>
        
        <p>{{personalizedReengagement}}</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <p style="font-size: 16px; color: #666; margin-bottom: 20px;">No pressure - just checking if you're ready to revisit your plans</p>
          <a href="https://serenitycustompools.com/restart" style="display: inline-block; background: #B8860B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            Let's Reconnect
          </a>
        </div>
        
        <p style="color: #666; font-style: italic;">P.S. Even if you're not ready yet, reply to let us know when might be a better time. We'll make a note and reach out then!</p>
        
        {{signature}}
      </div>
    `,
    textBody: `Hi {{firstName}}, still thinking about that pool?...`,
    placeholders: ['firstName', 'marketCondition1', 'marketCondition2', 'personalizedReengagement', 'signature'],
    dayDelay: 30,
    priority: 5
  },
  
  // VIP Template for High-Value Leads
  {
    id: 'vip_high_value',
    name: 'VIP - High Value Lead',
    category: 'vip',
    subject: '{{firstName}}, Your Exclusive VIP Pool Design Experience Awaits',
    htmlBody: `
      <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
        <div style="background: linear-gradient(135deg, #B8860B 0%, #1e3a8a 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 32px;">VIP CLIENT EXPERIENCE</h1>
          <p style="font-size: 18px; margin-top: 10px;">Exclusively for Discerning Homeowners</p>
        </div>
        
        <div style="padding: 30px; background: white; border: 2px solid #B8860B; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e3a8a;">Dear {{firstName}},</h2>
          
          <p>Based on your vision for a {{projectType}}, you've been selected for our exclusive VIP Design Experience.</p>
          
          <div style="background: #fffef5; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #B8860B;">
            <h3 style="color: #B8860B; margin-top: 0; text-align: center;">Your VIP Benefits Include:</h3>
            
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 20px;">
              <div style="width: 48%; margin-bottom: 20px;">
                <h4 style="color: #1e3a8a;">🏆 White Glove Service</h4>
                <p>Direct access to Ron Jones, founder<br>Priority response within 2 hours<br>Dedicated project concierge</p>
              </div>
              
              <div style="width: 48%; margin-bottom: 20px;">
                <h4 style="color: #1e3a8a;">🎨 Premium Design Package</h4>
                <p>Multiple 3D design concepts<br>Virtual reality walkthrough<br>Professional landscape integration</p>
              </div>
              
              <div style="width: 48%; margin-bottom: 20px;">
                <h4 style="color: #1e3a8a;">💰 VIP Pricing & Terms</h4>
                <p>Exclusive pricing (typically 10-15% savings)<br>Flexible payment structures<br>Premium warranty coverage</p>
              </div>
              
              <div style="width: 48%; margin-bottom: 20px;">
                <h4 style="color: #1e3a8a;">⏰ Priority Everything</h4>
                <p>Jump to front of construction queue<br>Expedited permitting<br>First choice of materials</p>
              </div>
            </div>
          </div>
          
          <div style="background: #1e3a8a; color: white; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #B8860B;">For Projects Like Yours ({{estimatedBudget}}+)</h3>
            <p>We recommend starting with a comprehensive property analysis and vision session. This isn't your typical consultation - it's a collaborative design experience where we:</p>
            <ul>
              <li>Conduct detailed site analysis with drone imaging</li>
              <li>Create initial concept sketches on-site</li>
              <li>Discuss premium materials and cutting-edge features</li>
              <li>Develop a phased approach if desired</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <p style="font-size: 18px; color: #1e3a8a; margin-bottom: 20px;">Reserve Your VIP Design Session</p>
            <a href="https://serenitycustompools.com/vip-booking" style="display: inline-block; background: linear-gradient(135deg, #B8860B, #d4a017); color: white; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(184,134,11,0.3);">
              Book VIP Experience
            </a>
            <p style="margin-top: 20px;">Or call our VIP line: <strong>(678) 300-8949 ext. 1</strong></p>
          </div>
          
          <div style="border-top: 2px solid #e0e0e0; margin-top: 40px; padding-top: 25px;">
            <p style="color: #666; font-style: italic; text-align: center;">
              "The difference between ordinary and extraordinary is that little extra."<br>
              - We believe your pool should be nothing short of extraordinary.
            </p>
          </div>
          
          {{signature}}
        </div>
      </div>
    `,
    textBody: `VIP Pool Design Experience for {{firstName}}...`,
    placeholders: ['firstName', 'projectType', 'estimatedBudget', 'signature'],
    priority: 10
  },
  
  // Appointment Reminder Template
  {
    id: 'appointment_reminder',
    name: 'Appointment Reminder',
    category: 'appointment',
    subject: 'Reminder: Your Pool Consultation {{appointmentDay}} at {{appointmentTime}}',
    htmlBody: `
      <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0;">Consultation Reminder</h2>
        </div>
        
        <div style="padding: 30px; background: white; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e3a8a;">Hi {{firstName}},</h2>
          
          <p>This is a friendly reminder about your upcoming pool design consultation:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #B8860B;">
            <h3 style="color: #1e3a8a; margin-top: 0;">📅 Appointment Details</h3>
            <p style="font-size: 18px; margin: 10px 0;"><strong>Date:</strong> {{appointmentDay}}</p>
            <p style="font-size: 18px; margin: 10px 0;"><strong>Time:</strong> {{appointmentTime}}</p>
            <p style="font-size: 18px; margin: 10px 0;"><strong>Location:</strong> {{appointmentLocation}}</p>
            <p style="font-size: 18px; margin: 10px 0;"><strong>Your Designer:</strong> {{designerName}}</p>
          </div>
          
          <h3 style="color: #B8860B;">What to Prepare:</h3>
          <ul style="color: #555;">
            <li>Any inspiration photos or ideas you've collected</li>
            <li>Your property survey (if available)</li>
            <li>HOA guidelines (if applicable)</li>
            <li>Questions about the pool construction process</li>
            <li>Decision makers should attend if possible</li>
          </ul>
          
          <h3 style="color: #B8860B;">What We'll Bring:</h3>
          <ul style="color: #555;">
            <li>Portfolio of our recent projects</li>
            <li>Material and finish samples</li>
            <li>3D design software for live visualization</li>
            <li>Financing information and options</li>
            <li>Project timeline examples</li>
          </ul>
          
          <div style="background: #fffef5; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="color: #B8860B; font-weight: bold; margin-bottom: 15px;">Need to Reschedule?</p>
            <p>No problem! Life happens. Just give us a call at <strong>(678) 300-8949</strong> or <a href="https://serenitycustompools.com/reschedule" style="color: #1e3a8a;">click here to pick a new time</a>.</p>
          </div>
          
          <p>We're looking forward to meeting with you and bringing your pool vision to life!</p>
          
          {{signature}}
        </div>
      </div>
    `,
    textBody: `Appointment reminder for {{firstName}}...`,
    placeholders: ['firstName', 'appointmentDay', 'appointmentTime', 'appointmentLocation', 'designerName', 'signature'],
    priority: 9
  },
  
  // Follow-up After Consultation
  {
    id: 'followup_consultation',
    name: 'Follow-up After Consultation',
    category: 'followup',
    subject: '{{firstName}}, Your Custom Pool Design is Ready!',
    htmlBody: `
      <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
        <h2 style="color: #1e3a8a;">Hi {{firstName}},</h2>
        
        <p>Thank you for taking the time to meet with {{designerName}} yesterday. We're excited about the possibilities for your backyard transformation!</p>
        
        <div style="background: linear-gradient(to right, #f5f5f5, #fff); padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #B8860B; margin-top: 0;">📋 Your Consultation Summary</h3>
          {{consultationSummary}}
        </div>
        
        <div style="background: #1e3a8a; color: white; padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #B8860B;">Your Custom Design Package Includes:</h3>
          <ul>
            <li>3D renderings from multiple angles</li>
            <li>Detailed project specifications</li>
            <li>Materials and finishes selections</li>
            <li>Construction timeline</li>
            <li>Investment breakdown with financing options</li>
          </ul>
          <div style="text-align: center; margin-top: 20px;">
            <a href="{{designLink}}" style="display: inline-block; background: #B8860B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
              View Your Design
            </a>
          </div>
        </div>
        
        <h3 style="color: #B8860B;">Next Steps:</h3>
        <ol style="color: #555;">
          <li><strong>Review:</strong> Take time to review your design with family</li>
          <li><strong>Refine:</strong> We offer unlimited revisions until it's perfect</li>
          <li><strong>Decide:</strong> When you're ready, we'll lock in your pricing</li>
        </ol>
        
        <div style="border: 2px solid #B8860B; padding: 20px; border-radius: 8px; margin: 25px 0; background: #fffef5;">
          <h3 style="color: #1e3a8a; margin-top: 0;">⏰ Limited Time Offer</h3>
          <p><strong>Sign within 7 days and receive:</strong></p>
          <ul style="color: #555;">
            <li>5% early commitment discount</li>
            <li>Free automatic pool cover ($3,500 value)</li>
            <li>Priority scheduling for spring completion</li>
          </ul>
          <p style="font-style: italic; color: #666;">Offer expires: {{offerExpiration}}</p>
        </div>
        
        <p>Do you have any questions about the design or the proposal? I'm here to help make this process as smooth as possible.</p>
        
        <p>You can reach me directly at <strong>(678) 300-8949</strong> or simply reply to this email.</p>
        
        {{signature}}
      </div>
    `,
    textBody: `Follow up after consultation for {{firstName}}...`,
    placeholders: ['firstName', 'designerName', 'consultationSummary', 'designLink', 'offerExpiration', 'signature'],
    priority: 9
  }
];

// Generate personalized template using AI
export async function generatePersonalizedTemplate(
  templateId: string,
  personalizationData: PersonalizationData
): Promise<{ subject: string; htmlBody: string; textBody: string }> {
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  // Generate personalizations using AI
  const personalizations = await generateAIPersonalizations(template, personalizationData);
  
  // Replace placeholders
  let subject = template.subject;
  let htmlBody = template.htmlBody;
  let textBody = template.textBody;
  
  for (const [placeholder, value] of Object.entries(personalizations)) {
    const regex = new RegExp(`{{${placeholder}}}`, 'g');
    subject = subject.replace(regex, value);
    htmlBody = htmlBody.replace(regex, value);
    textBody = textBody.replace(regex, value);
  }
  
  return { subject, htmlBody, textBody };
}

// Use AI to generate personalized content for placeholders
async function generateAIPersonalizations(
  template: EmailTemplate,
  data: PersonalizationData
): Promise<Record<string, string>> {
  const personalizations: Record<string, string> = {
    firstName: data.firstName,
    lastName: data.lastName || '',
    signature: `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0; font-weight: bold; color: #1e3a8a;">Best regards,</p>
        <p style="margin: 5px 0;"><strong>The Serenity Custom Pools Team</strong></p>
        <p style="margin: 5px 0; color: #666;">📞 (678) 300-8949 | 📧 info@serenitycustompools.com</p>
      </div>
    `
  };
  
  // Generate AI personalizations for specific fields
  try {
    if (template.placeholders.includes('personalizedIntro')) {
      const intro = await generateIntroduction(data);
      personalizations.personalizedIntro = intro;
    }
    
    if (template.placeholders.includes('projectDetails')) {
      const details = await generateProjectDetails(data);
      personalizations.projectDetails = details;
    }
    
    if (template.placeholders.includes('styleRecommendation')) {
      personalizations.styleRecommendation = await generateStyleRecommendation(data);
    }
    
    if (template.placeholders.includes('budgetGuidance')) {
      personalizations.budgetGuidance = await generateBudgetGuidance(data);
    }
    
    if (template.placeholders.includes('marketCondition1')) {
      personalizations.marketCondition1 = "Material costs have stabilized after recent fluctuations";
      personalizations.marketCondition2 = "Increased availability of premium finishes and features";
    }
    
    if (template.placeholders.includes('personalizedReengagement')) {
      personalizations.personalizedReengagement = await generateReengagement(data);
    }
    
    // Add date-based personalizations
    const now = new Date();
    personalizations.expirationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
    personalizations.appointmentDay = data.appointmentDate?.toLocaleDateString() || 'TBD';
    personalizations.appointmentTime = data.appointmentDate?.toLocaleTimeString() || 'TBD';
    personalizations.appointmentLocation = 'Your Property';
    personalizations.designerName = 'Ron Jones';
    personalizations.city = data.city || 'your area';
    personalizations.projectType = data.projectType || 'luxury pool';
    personalizations.estimatedBudget = extractBudgetNumber(data.budgetRange) || '100,000';
    
  } catch (error) {
    console.error('AI personalization error:', error);
  }
  
  return personalizations;
}

// Generate personalized introduction
async function generateIntroduction(data: PersonalizationData): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return `<p>We're excited to help you create the perfect pool for your property${data.city ? ` in ${data.city}` : ''}.</p>`;
  }
  
  try {
    const prompt = `
    Generate a personalized, warm introduction paragraph for a luxury pool company email.
    Customer: ${data.firstName} ${data.lastName || ''}
    Location: ${data.city || 'North Georgia'}
    Project Type: ${data.projectType || 'pool'}
    Budget: ${data.budgetRange || 'not specified'}
    
    Keep it brief (2-3 sentences), professional but warm, and reference their specific interests or location if available.
    Return only the HTML paragraph.
    `;
    
    const result = await model.generateContent(prompt);
    return result.response.text() || `<p>We're excited to work with you!</p>`;
  } catch (error) {
    return `<p>We're excited to help you create the perfect pool for your property.</p>`;
  }
}

// Generate project-specific details
async function generateProjectDetails(data: PersonalizationData): Promise<string> {
  if (!data.projectType && !data.budgetRange) {
    return '';
  }
  
  let details = `<div style="margin-top: 25px; padding: 15px; background: #f9f9f9; border-radius: 5px;">`;
  details += `<h4 style="color: #1e3a8a; margin-top: 0;">Your Project Interest:</h4>`;
  
  if (data.projectType) {
    details += `<p><strong>Project Type:</strong> ${data.projectType.replace(/_/g, ' ')}</p>`;
  }
  
  if (data.budgetRange) {
    details += `<p><strong>Investment Range:</strong> ${data.budgetRange}</p>`;
  }
  
  if (data.city) {
    details += `<p><strong>Location:</strong> ${data.city} - We know this area well!</p>`;
  }
  
  details += `</div>`;
  
  return details;
}

// Generate style recommendations
async function generateStyleRecommendation(data: PersonalizationData): Promise<string> {
  const styles = {
    'new_pool': 'Modern geometric designs with clean lines are trending in your area',
    'pool_renovation': 'Updating to contemporary finishes can transform your existing pool',
    'luxury': 'Infinity edges and natural stone create a resort-like atmosphere',
    'family': 'Beach entries and play features make pools perfect for all ages'
  };
  
  return styles[data.projectType as keyof typeof styles] || styles['new_pool'];
}

// Generate budget guidance
async function generateBudgetGuidance(data: PersonalizationData): Promise<string> {
  if (data.budgetRange && data.budgetRange.includes('150')) {
    return 'Your budget range allows for premium features like infinity edges, integrated spas, and complete outdoor living spaces.';
  } else if (data.budgetRange && data.budgetRange.includes('100')) {
    return 'Your budget provides excellent options for a beautiful pool with select premium features and quality finishes.';
  } else {
    return 'We offer flexible packages and financing to bring your vision to life within your budget.';
  }
}

// Generate re-engagement message
async function generateReengagement(data: PersonalizationData): Promise<string> {
  const daysSinceContact = data.lastInteraction 
    ? Math.floor((Date.now() - data.lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  
  if (daysSinceContact > 60) {
    return `<p>We know it's been a while, and we respect that major home improvements require careful consideration. If your plans have changed or you'd like to explore new options, we're here to help with fresh ideas and updated pricing.</p>`;
  } else {
    return `<p>We understand you're still considering your options. If you have any questions or would like to revisit your pool plans with our latest designs and features, we'd love to help!</p>`;
  }
}

// Extract budget number from range string
function extractBudgetNumber(budgetRange?: string): string {
  if (!budgetRange) return '100,000';
  
  const match = budgetRange.match(/\d+/g);
  if (match && match.length > 0) {
    const number = parseInt(match[match.length - 1]);
    return (number * (budgetRange.toLowerCase().includes('k') ? 1000 : 1)).toLocaleString();
  }
  
  return '100,000';
}

// Get template by category
export function getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
  return templates.filter(t => t.category === category);
}

// Get all templates
export function getAllTemplates(): EmailTemplate[] {
  return templates;
}

// Get template by ID
export function getTemplateById(id: string): EmailTemplate | undefined {
  return templates.find(t => t.id === id);
}

// Determine which template to use based on lead data and timing
export function selectBestTemplate(
  data: PersonalizationData,
  category?: EmailTemplate['category']
): EmailTemplate | undefined {
  let candidateTemplates = templates;
  
  // Filter by category if specified
  if (category) {
    candidateTemplates = candidateTemplates.filter(t => t.category === category);
  }
  
  // Special logic for VIP templates
  if (data.leadScore && data.leadScore >= 80) {
    const vipTemplate = candidateTemplates.find(t => t.id === 'vip_high_value');
    if (vipTemplate) return vipTemplate;
  }
  
  // Select based on stage in customer journey
  if (data.appointmentDate && data.appointmentDate > new Date()) {
    const reminderTemplate = candidateTemplates.find(t => t.id === 'appointment_reminder');
    if (reminderTemplate) return reminderTemplate;
  }
  
  if (data.consultationNotes) {
    const followupTemplate = candidateTemplates.find(t => t.id === 'followup_consultation');
    if (followupTemplate) return followupTemplate;
  }
  
  // Default to highest priority template in category
  return candidateTemplates.sort((a, b) => b.priority - a.priority)[0];
}