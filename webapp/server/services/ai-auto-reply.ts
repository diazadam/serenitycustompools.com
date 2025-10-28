import { GoogleGenerativeAI } from '@google/generative-ai';
import { getMessageDetails } from './gmail-service';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Gemini 2.5 Flash for higher quotas

export interface EmailIntent {
  type: 'pricing_inquiry' | 'appointment_request' | 'service_area' | 'timeline' | 
        'pool_design' | 'maintenance' | 'general_inquiry' | 'complaint' | 'unknown';
  subType?: string;
  confidence: number;
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'high' | 'medium' | 'low';
}

export interface AutoReplyResponse {
  subject: string;
  body: string;
  htmlBody: string;
  confidence: number;
  suggestHumanReview: boolean;
  intent: EmailIntent;
  labels: string[];
  leadScore?: number;
  personalizations: Record<string, string>;
}

// Analyze email intent using Gemini
export async function analyzeEmailIntent(
  emailContent: string,
  subject: string,
  fromEmail: string
): Promise<EmailIntent> {
  try {
    const prompt = `
    Analyze this email to a luxury pool construction company and determine the sender's intent.
    
    Email From: ${fromEmail}
    Subject: ${subject}
    Content: ${emailContent}
    
    Categorize the intent as one of:
    - pricing_inquiry: Questions about costs, budgets, financing
    - appointment_request: Wants to schedule consultation, meeting, or site visit
    - service_area: Asking if you serve their location
    - timeline: Questions about project duration, availability, scheduling
    - pool_design: Questions about designs, features, customization options
    - maintenance: Pool maintenance, repair, or service questions
    - general_inquiry: General questions about services
    - complaint: Expressing dissatisfaction or issues
    - unknown: Cannot determine clear intent
    
    Also analyze:
    1. Sentiment (positive, neutral, negative)
    2. Urgency level (high, medium, low)
    3. Key phrases that indicate intent
    4. Confidence score (0-1)
    
    Return JSON: {
      type: "intent_type",
      subType: "optional_sub_category",
      confidence: 0.85,
      keywords: ["key", "phrases"],
      sentiment: "positive",
      urgency: "medium"
    }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as EmailIntent;
    }
  } catch (error) {
    console.error('Intent analysis error:', error);
  }

  // Fallback to basic pattern matching
  const lowerContent = (subject + ' ' + emailContent).toLowerCase();
  
  if (lowerContent.includes('price') || lowerContent.includes('cost') || lowerContent.includes('budget')) {
    return {
      type: 'pricing_inquiry',
      confidence: 0.6,
      keywords: ['price', 'cost', 'budget'],
      sentiment: 'neutral',
      urgency: 'medium'
    };
  }
  
  if (lowerContent.includes('appointment') || lowerContent.includes('consultation') || lowerContent.includes('meeting')) {
    return {
      type: 'appointment_request',
      confidence: 0.6,
      keywords: ['appointment', 'consultation'],
      sentiment: 'positive',
      urgency: 'high'
    };
  }
  
  return {
    type: 'unknown',
    confidence: 0.3,
    keywords: [],
    sentiment: 'neutral',
    urgency: 'low'
  };
}

// Generate response based on intent
export async function generateAutoReply(
  emailContent: string,
  subject: string,
  fromEmail: string,
  senderName: string = 'Valued Customer'
): Promise<AutoReplyResponse> {
  // Analyze intent first
  const intent = await analyzeEmailIntent(emailContent, subject, fromEmail);
  
  // Generate personalized response based on intent
  const responseTemplate = await generatePersonalizedResponse(
    intent,
    emailContent,
    senderName
  );
  
  // Determine if human review is needed
  const suggestHumanReview = 
    intent.confidence < 0.7 ||
    intent.type === 'unknown' ||
    intent.type === 'complaint' ||
    intent.urgency === 'high' ||
    responseTemplate.confidence < 0.7;
  
  // Determine labels to apply
  const labels = determineLabels(intent);
  
  // Calculate lead score adjustment
  const leadScore = calculateLeadScore(intent, emailContent);
  
  return {
    ...responseTemplate,
    confidence: Math.min(intent.confidence, responseTemplate.confidence),
    suggestHumanReview,
    intent,
    labels,
    leadScore
  };
}

// Generate personalized response based on intent type
async function generatePersonalizedResponse(
  intent: EmailIntent,
  emailContent: string,
  senderName: string
): Promise<Omit<AutoReplyResponse, 'intent' | 'labels' | 'leadScore' | 'suggestHumanReview'>> {
  
  const companySignature = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0; font-weight: bold; color: #1e3a8a;">Serenity Custom Pools LLC</p>
      <p style="margin: 5px 0; color: #666;">Transforming Backyards Into Paradise Since 1994</p>
      <p style="margin: 5px 0; color: #666;">📞 (678) 300-8949 | 📧 info@serenitycustompools.com</p>
      <p style="margin: 5px 0; color: #666;">🏢 Serving North Georgia & Lake Lanier Area</p>
    </div>
  `;

  switch (intent.type) {
    case 'pricing_inquiry':
      return generatePricingResponse(senderName, emailContent, companySignature);
    
    case 'appointment_request':
      return generateAppointmentResponse(senderName, emailContent, companySignature);
    
    case 'service_area':
      return generateServiceAreaResponse(senderName, emailContent, companySignature);
    
    case 'timeline':
      return generateTimelineResponse(senderName, emailContent, companySignature);
    
    case 'pool_design':
      return generateDesignResponse(senderName, emailContent, companySignature);
    
    case 'maintenance':
      return generateMaintenanceResponse(senderName, emailContent, companySignature);
    
    case 'complaint':
      return generateComplaintResponse(senderName, companySignature);
    
    case 'general_inquiry':
    default:
      return generateGeneralResponse(senderName, emailContent, companySignature);
  }
}

// Pricing inquiry response
async function generatePricingResponse(
  senderName: string,
  emailContent: string,
  signature: string
): Promise<Omit<AutoReplyResponse, 'intent' | 'labels' | 'leadScore' | 'suggestHumanReview'>> {
  const subject = `Re: Your Pool Investment Inquiry - Serenity Custom Pools`;
  
  const htmlBody = `
    <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
      <h2 style="color: #1e3a8a;">Dear ${senderName},</h2>
      
      <p>Thank you for your interest in Serenity Custom Pools! We're excited to help you understand the investment in your dream pool.</p>
      
      <h3 style="color: #B8860B;">Our Typical Investment Ranges:</h3>
      <ul style="color: #555;">
        <li><strong>Essential Elegance Pools:</strong> $65,000 - $95,000<br>
          Perfect for families seeking quality and functionality</li>
        <li><strong>Premium Paradise Pools:</strong> $95,000 - $150,000<br>
          Enhanced features with waterfalls, spas, and premium finishes</li>
        <li><strong>Luxury Estate Pools:</strong> $150,000 - $300,000+<br>
          Fully customized infinity edges, outdoor kitchens, and complete backyard transformations</li>
      </ul>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e3a8a; margin-top: 0;">🎁 Exclusive VIP Consultation Offer</h3>
        <p><strong>Value: $1,500 - Complimentary for qualified projects</strong></p>
        <p>Receive a personalized 3D design visualization of your dream pool, comprehensive project planning, and expert guidance from our master designers.</p>
        <a href="https://serenitycustompools.com/consultation" style="display: inline-block; background: #B8860B; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Schedule Your VIP Consultation</a>
      </div>
      
      <p><strong>Financing Available:</strong> We offer flexible financing options starting at 5.99% APR with terms up to 20 years.</p>
      
      <p>Every project is unique, and we'd love to provide you with a detailed quote based on your specific vision and property. Our team will visit your property, discuss your dreams, and create a custom proposal that fits your budget.</p>
      
      ${signature}
    </div>
  `;
  
  const body = htmlBody.replace(/<[^>]*>/g, ''); // Strip HTML for plain text version
  
  return {
    subject,
    body,
    htmlBody,
    confidence: 0.9,
    personalizations: {
      customerName: senderName,
      inquiryType: 'pricing'
    }
  };
}

// Appointment request response
async function generateAppointmentResponse(
  senderName: string,
  emailContent: string,
  signature: string
): Promise<Omit<AutoReplyResponse, 'intent' | 'labels' | 'leadScore' | 'suggestHumanReview'>> {
  const subject = `Re: Consultation Scheduling - Serenity Custom Pools`;
  
  const htmlBody = `
    <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
      <h2 style="color: #1e3a8a;">Dear ${senderName},</h2>
      
      <p>Wonderful! We're thrilled you're ready to take the next step toward your dream pool.</p>
      
      <p><strong>Ron or Adam from our design team will contact you within 24 hours to schedule your consultation.</strong></p>
      
      <h3 style="color: #B8860B;">What to Expect During Your Consultation:</h3>
      <ul style="color: #555;">
        <li>Complete property evaluation and measurements</li>
        <li>Discussion of your vision, lifestyle, and preferences</li>
        <li>3D design visualization of your pool concept</li>
        <li>Detailed project timeline and phases</li>
        <li>Transparent pricing and financing options</li>
        <li>Q&A session with our master pool designer</li>
      </ul>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e3a8a; margin-top: 0;">📅 Typical Availability</h3>
        <p>We have consultations available:</p>
        <ul>
          <li>Weekdays: 9:00 AM - 6:00 PM</li>
          <li>Saturdays: 10:00 AM - 4:00 PM</li>
          <li>Virtual consultations also available</li>
        </ul>
      </div>
      
      <p><strong>Immediate assistance needed?</strong> Call us directly at <strong>(678) 300-8949</strong></p>
      
      <p>We look forward to bringing your pool dreams to life!</p>
      
      ${signature}
    </div>
  `;
  
  const body = htmlBody.replace(/<[^>]*>/g, '');
  
  return {
    subject,
    body,
    htmlBody,
    confidence: 0.95,
    personalizations: {
      customerName: senderName,
      inquiryType: 'appointment'
    }
  };
}

// Service area response
async function generateServiceAreaResponse(
  senderName: string,
  emailContent: string,
  signature: string
): Promise<Omit<AutoReplyResponse, 'intent' | 'labels' | 'leadScore' | 'suggestHumanReview'>> {
  const subject = `Re: Service Area Confirmation - Serenity Custom Pools`;
  
  const htmlBody = `
    <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
      <h2 style="color: #1e3a8a;">Dear ${senderName},</h2>
      
      <p>Great news! Serenity Custom Pools proudly serves all of North Georgia and the Lake Lanier area.</p>
      
      <h3 style="color: #B8860B;">Our Primary Service Areas Include:</h3>
      <ul style="color: #555;">
        <li><strong>Lake Lanier Communities:</strong> Flowery Branch, Buford, Cumming, Gainesville</li>
        <li><strong>North Atlanta Metro:</strong> Alpharetta, Johns Creek, Milton, Roswell</li>
        <li><strong>Northeast Georgia:</strong> Dawsonville, Dahlonega, Cleveland, Commerce</li>
        <li><strong>Northwest Georgia:</strong> Canton, Woodstock, Ball Ground, Jasper</li>
      </ul>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Local Expertise:</strong> With over 30 years serving North Georgia, we understand the unique terrain, soil conditions, and architectural styles of our region. We've built over 500 luxury pools in your area!</p>
      </div>
      
      <p>Even if your location isn't listed above, please reach out! We often accommodate special projects throughout Georgia.</p>
      
      <p><strong>Ready to get started?</strong> <a href="https://serenitycustompools.com/consultation" style="color: #B8860B;">Schedule your free consultation</a> or call us at (678) 300-8949.</p>
      
      ${signature}
    </div>
  `;
  
  const body = htmlBody.replace(/<[^>]*>/g, '');
  
  return {
    subject,
    body,
    htmlBody,
    confidence: 0.9,
    personalizations: {
      customerName: senderName,
      inquiryType: 'service_area'
    }
  };
}

// Timeline response
async function generateTimelineResponse(
  senderName: string,
  emailContent: string,
  signature: string
): Promise<Omit<AutoReplyResponse, 'intent' | 'labels' | 'leadScore' | 'suggestHumanReview'>> {
  const subject = `Re: Project Timeline Information - Serenity Custom Pools`;
  
  const htmlBody = `
    <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
      <h2 style="color: #1e3a8a;">Dear ${senderName},</h2>
      
      <p>Thank you for your interest in understanding our project timelines. We pride ourselves on efficient project management while never compromising on quality.</p>
      
      <h3 style="color: #B8860B;">Typical Project Timelines:</h3>
      <ul style="color: #555;">
        <li><strong>Design & Permitting:</strong> 2-3 weeks</li>
        <li><strong>Standard Pool Construction:</strong> 8-10 weeks</li>
        <li><strong>Complex/Custom Projects:</strong> 12-16 weeks</li>
        <li><strong>Complete Backyard Transformations:</strong> 16-20 weeks</li>
      </ul>
      
      <h3 style="color: #B8860B;">Current Availability:</h3>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>🗓️ Next Available Start Dates:</strong></p>
        <p>We currently have openings for new projects starting in 4-6 weeks. Priority scheduling available for VIP consultation clients.</p>
        <p><a href="https://serenitycustompools.com/schedule" style="display: inline-block; background: #B8860B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Check Available Dates</a></p>
      </div>
      
      <p><strong>Seasonal Consideration:</strong> Starting your project now means you'll be swimming by prime pool season!</p>
      
      <p>Weather conditions and permit approval times can affect these estimates, but our experienced team manages projects efficiently to minimize delays.</p>
      
      ${signature}
    </div>
  `;
  
  const body = htmlBody.replace(/<[^>]*>/g, '');
  
  return {
    subject,
    body,
    htmlBody,
    confidence: 0.85,
    personalizations: {
      customerName: senderName,
      inquiryType: 'timeline'
    }
  };
}

// Pool design response
async function generateDesignResponse(
  senderName: string,
  emailContent: string,
  signature: string
): Promise<Omit<AutoReplyResponse, 'intent' | 'labels' | 'leadScore' | 'suggestHumanReview'>> {
  const subject = `Re: Pool Design Options - Serenity Custom Pools`;
  
  const htmlBody = `
    <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
      <h2 style="color: #1e3a8a;">Dear ${senderName},</h2>
      
      <p>How exciting that you're exploring pool design options! At Serenity Custom Pools, every pool is a unique work of art tailored to your lifestyle and property.</p>
      
      <h3 style="color: #B8860B;">Popular Design Features We Offer:</h3>
      <ul style="color: #555;">
        <li><strong>Pool Styles:</strong> Infinity edge, geometric, freeform, classic, modern minimalist</li>
        <li><strong>Water Features:</strong> Waterfalls, fountains, rain curtains, bubbling rocks, scuppers</li>
        <li><strong>Integrated Spas:</strong> Spillover spas, separate hot tubs, therapy jets</li>
        <li><strong>Special Features:</strong> Swim-up bars, grottos, beach entries, tanning ledges</li>
        <li><strong>Lighting:</strong> LED color-changing systems, fiber optics, landscape lighting</li>
        <li><strong>Automation:</strong> Smart pool controls, automated covers, self-cleaning systems</li>
      </ul>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e3a8a; margin-top: 0;">🎨 Free 3D Design Visualization</h3>
        <p>During your VIP consultation ($1,500 value), we'll create a stunning 3D rendering of your custom pool design, allowing you to see exactly how your backyard will be transformed.</p>
        <p><a href="https://serenitycustompools.com/portfolio" style="color: #B8860B;">View Our Portfolio</a> for inspiration!</p>
      </div>
      
      <p><strong>Customization is Our Specialty:</strong> Whether you envision a resort-style oasis, a modern architectural masterpiece, or a family-friendly fun zone, we'll bring your unique vision to life.</p>
      
      <p>Ready to explore the possibilities? Let's schedule a design consultation to discuss your specific ideas and preferences.</p>
      
      ${signature}
    </div>
  `;
  
  const body = htmlBody.replace(/<[^>]*>/g, '');
  
  return {
    subject,
    body,
    htmlBody,
    confidence: 0.9,
    personalizations: {
      customerName: senderName,
      inquiryType: 'design'
    }
  };
}

// Maintenance response
async function generateMaintenanceResponse(
  senderName: string,
  emailContent: string,
  signature: string
): Promise<Omit<AutoReplyResponse, 'intent' | 'labels' | 'leadScore' | 'suggestHumanReview'>> {
  const subject = `Re: Pool Maintenance & Service - Serenity Custom Pools`;
  
  const htmlBody = `
    <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
      <h2 style="color: #1e3a8a;">Dear ${senderName},</h2>
      
      <p>Thank you for reaching out about pool maintenance and service needs.</p>
      
      <p>While Serenity Custom Pools specializes in new pool construction and major renovations, we want to ensure your pool stays in perfect condition.</p>
      
      <h3 style="color: #B8860B;">For Our Past Clients:</h3>
      <p>If we built your pool, we offer:</p>
      <ul style="color: #555;">
        <li>Warranty service and support</li>
        <li>Equipment upgrades and replacements</li>
        <li>Renovation and remodeling services</li>
        <li>Referrals to our trusted maintenance partners</li>
      </ul>
      
      <h3 style="color: #B8860B;">Pool Renovation Services:</h3>
      <p>Ready to upgrade your existing pool? We specialize in:</p>
      <ul style="color: #555;">
        <li>Complete pool remodels and modernization</li>
        <li>Adding water features and lighting</li>
        <li>Resurfacing and retiling</li>
        <li>Equipment upgrades for efficiency</li>
        <li>Converting to saltwater systems</li>
      </ul>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Transform Your Existing Pool:</strong> Many clients don't realize how dramatically we can transform an older pool into a modern oasis. Schedule a consultation to explore the possibilities!</p>
      </div>
      
      ${signature}
    </div>
  `;
  
  const body = htmlBody.replace(/<[^>]*>/g, '');
  
  return {
    subject,
    body,
    htmlBody,
    confidence: 0.85,
    personalizations: {
      customerName: senderName,
      inquiryType: 'maintenance'
    }
  };
}

// Complaint response (requires human review)
async function generateComplaintResponse(
  senderName: string,
  signature: string
): Promise<Omit<AutoReplyResponse, 'intent' | 'labels' | 'leadScore' | 'suggestHumanReview'>> {
  const subject = `Re: Your Concern - Immediate Attention from Serenity Custom Pools`;
  
  const htmlBody = `
    <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
      <h2 style="color: #1e3a8a;">Dear ${senderName},</h2>
      
      <p>Thank you for bringing this matter to our attention. Your satisfaction is our highest priority, and we take all concerns very seriously.</p>
      
      <p><strong>Your message has been immediately forwarded to Ron Jones, our founder, for personal review.</strong></p>
      
      <p>You can expect a call from our management team within 24 hours to address your concerns directly. If this is an urgent matter, please don't hesitate to call us immediately at <strong>(678) 300-8949</strong>.</p>
      
      <p>At Serenity Custom Pools, we've built our reputation over 30 years on exceptional service and standing behind our work. We're committed to resolving this matter to your complete satisfaction.</p>
      
      <p>Thank you for your patience and for giving us the opportunity to make this right.</p>
      
      ${signature}
    </div>
  `;
  
  const body = htmlBody.replace(/<[^>]*>/g, '');
  
  return {
    subject,
    body,
    htmlBody,
    confidence: 0.5, // Low confidence for complaints - always needs review
    personalizations: {
      customerName: senderName,
      inquiryType: 'complaint'
    }
  };
}

// General response
async function generateGeneralResponse(
  senderName: string,
  emailContent: string,
  signature: string
): Promise<Omit<AutoReplyResponse, 'intent' | 'labels' | 'leadScore' | 'suggestHumanReview'>> {
  const subject = `Re: Your Inquiry - Serenity Custom Pools`;
  
  // Try to use AI to generate a more contextual response
  try {
    const prompt = `
    Generate a professional, warm email response for a luxury pool company.
    Sender: ${senderName}
    Their message: ${emailContent.slice(0, 500)}
    
    Include:
    - Thank them for their interest
    - Briefly address their question if possible
    - Mention the VIP consultation offer ($1,500 value)
    - Encourage them to schedule a consultation
    - Keep tone professional but warm
    
    Return just the email body HTML without subject line.
    `;
    
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    
    if (aiResponse && aiResponse.length > 100) {
      return {
        subject,
        body: aiResponse.replace(/<[^>]*>/g, ''),
        htmlBody: `<div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">${aiResponse}${signature}</div>`,
        confidence: 0.7,
        personalizations: {
          customerName: senderName,
          inquiryType: 'general'
        }
      };
    }
  } catch (error) {
    console.error('AI generation error:', error);
  }
  
  // Fallback generic response
  const htmlBody = `
    <div style="font-family: 'Georgia', serif; color: #333; line-height: 1.6;">
      <h2 style="color: #1e3a8a;">Dear ${senderName},</h2>
      
      <p>Thank you for contacting Serenity Custom Pools! We're excited to learn more about your pool project.</p>
      
      <p>With over 30 years of experience creating luxury pools throughout North Georgia, we're confident we can bring your vision to life.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e3a8a; margin-top: 0;">🎁 Complimentary VIP Consultation</h3>
        <p>Schedule your free consultation (a $1,500 value) to receive:</p>
        <ul>
          <li>Professional property evaluation</li>
          <li>Custom 3D pool design visualization</li>
          <li>Detailed project proposal and timeline</li>
          <li>Transparent pricing with financing options</li>
        </ul>
        <p><a href="https://serenitycustompools.com/consultation" style="display: inline-block; background: #B8860B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Schedule Now</a></p>
      </div>
      
      <p>One of our design specialists will follow up with you within 24 hours to discuss your specific needs and answer any questions.</p>
      
      ${signature}
    </div>
  `;
  
  const body = htmlBody.replace(/<[^>]*>/g, '');
  
  return {
    subject,
    body,
    htmlBody,
    confidence: 0.6,
    personalizations: {
      customerName: senderName,
      inquiryType: 'general'
    }
  };
}

// Determine Gmail labels based on intent
function determineLabels(intent: EmailIntent): string[] {
  const labels: string[] = ['Serenity Pools'];
  
  switch (intent.type) {
    case 'pricing_inquiry':
      labels.push('Pricing Inquiries');
      break;
    case 'appointment_request':
      labels.push('Appointments');
      labels.push('High Priority');
      break;
    case 'service_area':
      labels.push('Service Area Questions');
      break;
    case 'timeline':
      labels.push('Timeline Questions');
      break;
    case 'pool_design':
      labels.push('Design Inquiries');
      break;
    case 'maintenance':
      labels.push('Maintenance');
      break;
    case 'complaint':
      labels.push('Complaints');
      labels.push('Urgent');
      break;
    default:
      labels.push('General Inquiries');
  }
  
  // Add urgency labels
  if (intent.urgency === 'high') {
    labels.push('High Priority');
  }
  
  // Add sentiment labels
  if (intent.sentiment === 'negative') {
    labels.push('Needs Attention');
  } else if (intent.sentiment === 'positive') {
    labels.push('Hot Lead');
  }
  
  return labels;
}

// Calculate lead score based on email content and intent
export function calculateLeadScore(intent: EmailIntent, emailContent: string): number {
  let score = 50; // Base score
  
  // Intent-based scoring
  const intentScores: Record<string, number> = {
    'appointment_request': 25,
    'pricing_inquiry': 20,
    'pool_design': 15,
    'timeline': 15,
    'service_area': 10,
    'general_inquiry': 5,
    'maintenance': 0,
    'complaint': -10,
    'unknown': 0
  };
  
  score += intentScores[intent.type] || 0;
  
  // Urgency scoring
  if (intent.urgency === 'high') score += 15;
  else if (intent.urgency === 'medium') score += 5;
  
  // Sentiment scoring  
  if (intent.sentiment === 'positive') score += 10;
  else if (intent.sentiment === 'negative') score -= 5;
  
  // Keyword scoring
  const highValueKeywords = [
    'ready to start', 'budget approved', 'immediately', 'asap',
    'luxury', 'high-end', 'premium', 'no budget limit',
    'cash', 'full payment', 'lake house', 'estate'
  ];
  
  const lowerContent = emailContent.toLowerCase();
  for (const keyword of highValueKeywords) {
    if (lowerContent.includes(keyword)) {
      score += 5;
    }
  }
  
  // Confidence adjustment
  score = Math.round(score * intent.confidence);
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}