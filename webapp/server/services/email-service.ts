import sgMail from '@sendgrid/mail';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Initialize Gemini AI for sentiment analysis
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

interface LeadEmailData {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  projectType?: string;
  budgetRange?: string;
  message?: string;
  city?: string;
}

export async function sendLeadThankYouEmail(lead: LeadEmailData): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Email not sent.');
    return false;
  }

  const fullName = lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.firstName;
  
  // Create the HTML email template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Georgia', serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #2c2c2c 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .tagline {
          font-size: 14px;
          color: #B8860B;
        }
        .content {
          background: white;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-radius: 0 0 10px 10px;
        }
        .greeting {
          font-size: 24px;
          color: #1e3a8a;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          color: #555;
          margin-bottom: 25px;
        }
        .project-details {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .detail-row {
          margin: 10px 0;
          display: flex;
          justify-content: space-between;
        }
        .detail-label {
          font-weight: bold;
          color: #1e3a8a;
        }
        .cta-button {
          display: inline-block;
          background: #B8860B;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-size: 16px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #888;
          font-size: 14px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }
        .signature {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }
        .signature-name {
          font-weight: bold;
          color: #1e3a8a;
        }
        .signature-title {
          color: #666;
          font-style: italic;
        }
        .contact-info {
          margin-top: 20px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Serenity Custom Pools LLC</div>
        <div class="tagline">Transforming Backyards Into Paradise Since 1994</div>
      </div>
      
      <div class="content">
        <h2 class="greeting">Thank You, ${fullName}!</h2>
        
        <div class="message">
          We're thrilled that you've chosen Serenity Custom Pools LLC for your luxury pool project. Your dream of a perfect backyard oasis is about to become reality!
        </div>
        
        <div class="message">
          <strong>What happens next?</strong> Ron or Adam from our design team will be reaching out to you within the next 24 hours to schedule your complimentary consultation. During this meeting, we'll:
        </div>
        
        <ul style="color: #555; margin: 20px 0;">
          <li>Visit your property for a detailed evaluation</li>
          <li>Discuss your vision and preferences in detail</li>
          <li>Create a custom 3D design visualization</li>
          <li>Provide a comprehensive project proposal and timeline</li>
          <li>Answer all your questions about the construction process</li>
        </ul>
        
        ${(lead.projectType || lead.budgetRange || lead.message) ? `
        <div class="project-details">
          <h3 style="color: #1e3a8a; margin-top: 0;">Your Project Interest Summary:</h3>
          ${lead.projectType ? `
          <div class="detail-row">
            <span class="detail-label">Project Type:</span>
            <span>${lead.projectType.replace(/_/g, ' ')}</span>
          </div>
          ` : ''}
          ${lead.budgetRange ? `
          <div class="detail-row">
            <span class="detail-label">Budget Range:</span>
            <span>${lead.budgetRange}</span>
          </div>
          ` : ''}
          ${lead.city ? `
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span>${lead.city}</span>
          </div>
          ` : ''}
          ${lead.message ? `
          <div style="margin-top: 15px;">
            <span class="detail-label">Your Vision:</span>
            <p style="margin-top: 5px; font-style: italic; color: #666;">"${lead.message}"</p>
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        <div class="message">
          With over 30 years of experience and more than 500 luxury pools built throughout North Georgia, we're confident we can exceed your expectations.
        </div>
        
        <center>
          <a href="https://serenitycustompools.com" class="cta-button">View Our Portfolio</a>
        </center>
        
        <div class="signature">
          <div class="signature-name">Ronald Jones</div>
          <div class="signature-title">Founder & Master Pool Designer</div>
          <div style="margin-top: 10px; color: #666;">
            30+ Years of Excellence in Luxury Pool Construction
          </div>
        </div>
        
        <div class="contact-info">
          <strong>Need immediate assistance?</strong><br>
          📞 Call us: 1 (678) 300-8949<br>
          📧 Email: info@serenitycustompools.com<br>
          🏢 Serving North Georgia & Lake Lanier Area
        </div>
      </div>
      
      <div class="footer">
        <p>
          © 2024 Serenity Custom Pools LLC. All rights reserved.<br>
          Licensed, Bonded & Insured | GA License #LIC123456<br>
          <a href="https://serenitycustompools.com/privacy-policy" style="color: #B8860B;">Privacy Policy</a> | 
          <a href="https://serenitycustompools.com/terms-of-service" style="color: #B8860B;">Terms of Service</a>
        </p>
      </div>
    </body>
    </html>
  `;

  // Plain text version for email clients that don't support HTML
  const textContent = `
Thank You, ${fullName}!

We're thrilled that you've chosen Serenity Custom Pools LLC for your luxury pool project. Your dream of a perfect backyard oasis is about to become reality!

What happens next? Ron or Adam from our design team will be reaching out to you within the next 24 hours to schedule your complimentary consultation.

During this meeting, we'll:
• Visit your property for a detailed evaluation
• Discuss your vision and preferences in detail
• Create a custom 3D design visualization
• Provide a comprehensive project proposal and timeline
• Answer all your questions about the construction process

${lead.projectType ? `Project Type: ${lead.projectType.replace(/_/g, ' ')}\n` : ''}${lead.budgetRange ? `Budget Range: ${lead.budgetRange}\n` : ''}${lead.city ? `Location: ${lead.city}\n` : ''}${lead.message ? `Your Vision: "${lead.message}"\n` : ''}

With over 30 years of experience and more than 500 luxury pools built throughout North Georgia, we're confident we can exceed your expectations.

View Our Portfolio: https://serenitycustompools.com

Best regards,
Ronald Jones
Founder & Master Pool Designer
30+ Years of Excellence in Luxury Pool Construction

Need immediate assistance?
📞 Call us: 1 (678) 300-8949
📧 Email: info@serenitycustompools.com
🏢 Serving North Georgia & Lake Lanier Area

© 2024 Serenity Custom Pools LLC. All rights reserved.
Licensed, Bonded & Insured | GA License #LIC123456
  `;

  try {
    const msg = {
      to: lead.email,
      from: {
        email: 'info@serenitycustompools.com',
        name: 'Serenity Custom Pools LLC'
      },
      subject: `Thank You for Your Interest in Serenity Custom Pools, ${fullName}!`,
      text: textContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`Thank you email sent successfully to ${lead.email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send notification email to admin when new lead comes in
export async function sendAdminLeadNotification(lead: LeadEmailData): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid not configured - lead notification not sent via SendGrid');
    return false;
  }

  const fullName = lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.firstName;
  const adminEmails = ['adam@serenitypools.com'];
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { background: #1e3a8a; color: white; padding: 20px; border-radius: 5px; }
        .content { background: #f5f5f5; padding: 20px; margin-top: 20px; border-radius: 5px; }
        .detail { margin: 10px 0; }
        .label { font-weight: bold; color: #1e3a8a; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>🎯 New Lead Alert!</h2>
      </div>
      <div class="content">
        <h3>Contact Information:</h3>
        <div class="detail"><span class="label">Name:</span> ${fullName}</div>
        <div class="detail"><span class="label">Email:</span> ${lead.email}</div>
        <div class="detail"><span class="label">Phone:</span> ${lead.phone || 'Not provided'}</div>
        <div class="detail"><span class="label">City:</span> ${lead.city || 'Not provided'}</div>
        
        <h3>Project Details:</h3>
        <div class="detail"><span class="label">Project Type:</span> ${lead.projectType || 'Not specified'}</div>
        <div class="detail"><span class="label">Budget Range:</span> ${lead.budgetRange || 'Not specified'}</div>
        ${lead.message ? `<div class="detail"><span class="label">Message:</span><br>${lead.message}</div>` : ''}
        
        <p style="margin-top: 20px;">
          <strong>Action Required:</strong> Please follow up with this lead within 24 hours.<br>
          <a href="https://serenitycustompools.com/crm-dashboard" style="background: #B8860B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View in CRM</a>
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const msg = {
      to: adminEmails,
      from: {
        email: 'leads@serenitycustompools.com',
        name: 'Serenity Leads System'
      },
      subject: `🎯 New Lead: ${fullName} - ${lead.budgetRange || 'Budget TBD'}`,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log('Admin notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return false;
  }
}
// Enhanced Lead Scoring Types
export interface EmailAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'high' | 'medium' | 'low';
  intent: string;
  keywords: string[];
  readyToBuy: boolean;
  estimatedValue: number;
  confidence: number;
}

export interface LeadScoreUpdate {
  leadId: string;
  currentScore: number;
  newScore: number;
  factors: ScoreFactor[];
  recommendation: string;
}

export interface ScoreFactor {
  factor: string;
  impact: number;
  reason: string;
}

// Analyze email for sentiment and scoring factors
export async function analyzeEmailForScoring(
  emailContent: string,
  subject: string,
  responseTime?: number // minutes since email received
): Promise<EmailAnalysis> {
  // High-value keywords that indicate buyer intent
  const buyerKeywords = {
    high: [
      'ready to start', 'budget approved', 'asap', 'immediately', 
      'urgent', 'this month', 'authorized', 'decided', 'committed',
      'cash payment', 'all cash', 'no financing needed'
    ],
    medium: [
      'interested', 'considering', 'exploring', 'planning',
      'next season', 'this year', 'researching', 'comparing',
      'getting quotes', 'budget range'
    ],
    low: [
      'just looking', 'future', 'maybe', 'someday', 
      'not sure', 'thinking about', 'preliminary', 'initial'
    ]
  };

  // Value indicators
  const valueKeywords = {
    luxury: ['luxury', 'premium', 'high-end', 'custom', 'estate', 'executive'],
    features: ['infinity', 'waterfall', 'spa', 'outdoor kitchen', 'complete backyard'],
    size: ['large', 'olympic', 'resort-style', 'extensive', 'grand']
  };

  const content = (subject + ' ' + emailContent).toLowerCase();
  
  // Count keyword matches
  let highMatches = 0;
  let mediumMatches = 0;
  let lowMatches = 0;
  let luxuryMatches = 0;
  const foundKeywords: string[] = [];

  buyerKeywords.high.forEach(keyword => {
    if (content.includes(keyword)) {
      highMatches++;
      foundKeywords.push(keyword);
    }
  });

  buyerKeywords.medium.forEach(keyword => {
    if (content.includes(keyword)) {
      mediumMatches++;
      foundKeywords.push(keyword);
    }
  });

  buyerKeywords.low.forEach(keyword => {
    if (content.includes(keyword)) {
      lowMatches++;
      foundKeywords.push(keyword);
    }
  });

  Object.values(valueKeywords).flat().forEach(keyword => {
    if (content.includes(keyword)) {
      luxuryMatches++;
      foundKeywords.push(keyword);
    }
  });

  // Determine urgency
  let urgency: 'high' | 'medium' | 'low' = 'low';
  if (highMatches >= 2 || content.includes('asap') || content.includes('urgent')) {
    urgency = 'high';
  } else if (highMatches >= 1 || mediumMatches >= 2) {
    urgency = 'medium';
  }

  // Determine sentiment (simple analysis)
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (highMatches > lowMatches && (content.includes('excited') || content.includes('love') || content.includes('perfect'))) {
    sentiment = 'positive';
  } else if (content.includes('disappointed') || content.includes('frustrated') || content.includes('problem')) {
    sentiment = 'negative';
  }

  // Estimate project value
  let estimatedValue = 100000; // Base value
  if (luxuryMatches >= 2) estimatedValue += 50000;
  if (content.includes('infinity')) estimatedValue += 30000;
  if (content.includes('outdoor kitchen')) estimatedValue += 25000;
  if (content.includes('complete backyard')) estimatedValue += 40000;
  
  // Parse budget if mentioned
  const budgetMatch = content.match(/\$?(\d+)k|\$?(\d{3,})/);
  if (budgetMatch) {
    const amount = parseInt(budgetMatch[1] || budgetMatch[2]);
    if (budgetMatch[1]) {
      estimatedValue = amount * 1000;
    } else {
      estimatedValue = amount;
    }
  }

  // Calculate confidence
  const totalKeywords = highMatches + mediumMatches + luxuryMatches;
  const confidence = Math.min(0.95, 0.3 + (totalKeywords * 0.1));

  // Try AI analysis for better accuracy
  if (process.env.GEMINI_API_KEY) {
    try {
      const aiAnalysis = await analyzeWithAI(emailContent, subject);
      return {
        ...aiAnalysis,
        keywords: foundKeywords,
        estimatedValue
      };
    } catch (error) {
      console.error('AI analysis failed, using keyword analysis:', error);
    }
  }

  return {
    sentiment,
    urgency,
    intent: highMatches > 0 ? 'purchase' : mediumMatches > 0 ? 'consideration' : 'exploration',
    keywords: foundKeywords,
    readyToBuy: highMatches >= 2,
    estimatedValue,
    confidence
  };
}

// AI-powered email analysis
async function analyzeWithAI(emailContent: string, subject: string): Promise<EmailAnalysis> {
  const prompt = `
  Analyze this email to a luxury pool company for lead scoring purposes.
  
  Subject: ${subject}
  Content: ${emailContent}
  
  Determine:
  1. Sentiment (positive, neutral, negative)
  2. Urgency level (high, medium, low)
  3. Purchase intent (purchase, consideration, exploration)
  4. Ready to buy indicators (true/false)
  5. Confidence score (0-1)
  
  Return JSON: {
    sentiment: "positive",
    urgency: "high",
    intent: "purchase",
    readyToBuy: true,
    confidence: 0.85
  }
  `;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const aiResult = JSON.parse(jsonMatch[0]);
    return {
      sentiment: aiResult.sentiment || 'neutral',
      urgency: aiResult.urgency || 'medium',
      intent: aiResult.intent || 'exploration',
      keywords: [],
      readyToBuy: aiResult.readyToBuy || false,
      estimatedValue: 100000,
      confidence: aiResult.confidence || 0.5
    };
  }

  throw new Error('Failed to parse AI response');
}

// Calculate lead score based on multiple factors
export function calculateLeadScore(
  analysis: EmailAnalysis,
  responseTimeMinutes?: number,
  previousScore: number = 50
): LeadScoreUpdate {
  const factors: ScoreFactor[] = [];
  let newScore = previousScore;

  // Sentiment impact
  if (analysis.sentiment === 'positive') {
    factors.push({
      factor: 'Positive Sentiment',
      impact: 15,
      reason: 'Enthusiastic and engaged communication'
    });
    newScore += 15;
  } else if (analysis.sentiment === 'negative') {
    factors.push({
      factor: 'Negative Sentiment',
      impact: -10,
      reason: 'May have concerns or objections'
    });
    newScore -= 10;
  }

  // Urgency impact
  if (analysis.urgency === 'high') {
    factors.push({
      factor: 'High Urgency',
      impact: 20,
      reason: 'Ready to move forward quickly'
    });
    newScore += 20;
  } else if (analysis.urgency === 'medium') {
    factors.push({
      factor: 'Medium Urgency',
      impact: 10,
      reason: 'Active consideration phase'
    });
    newScore += 10;
  }

  // Intent impact
  if (analysis.intent === 'purchase') {
    factors.push({
      factor: 'Purchase Intent',
      impact: 25,
      reason: 'Strong buying signals detected'
    });
    newScore += 25;
  } else if (analysis.intent === 'consideration') {
    factors.push({
      factor: 'Consideration Stage',
      impact: 10,
      reason: 'Evaluating options'
    });
    newScore += 10;
  }

  // Ready to buy indicator
  if (analysis.readyToBuy) {
    factors.push({
      factor: 'Ready to Buy',
      impact: 30,
      reason: 'Explicit purchase readiness indicators'
    });
    newScore += 30;
  }

  // Response time impact
  if (responseTimeMinutes !== undefined) {
    if (responseTimeMinutes < 5) {
      factors.push({
        factor: 'Immediate Response',
        impact: 10,
        reason: 'Very engaged, responding quickly'
      });
      newScore += 10;
    } else if (responseTimeMinutes < 60) {
      factors.push({
        factor: 'Quick Response',
        impact: 5,
        reason: 'Engaged and interested'
      });
      newScore += 5;
    } else if (responseTimeMinutes > 1440) { // 24 hours
      factors.push({
        factor: 'Delayed Response',
        impact: -5,
        reason: 'Lower engagement level'
      });
      newScore -= 5;
    }
  }

  // Project value impact
  if (analysis.estimatedValue > 150000) {
    factors.push({
      factor: 'High-Value Project',
      impact: 15,
      reason: `Estimated value: $${analysis.estimatedValue.toLocaleString()}`
    });
    newScore += 15;
  } else if (analysis.estimatedValue > 100000) {
    factors.push({
      factor: 'Premium Project',
      impact: 10,
      reason: `Estimated value: $${analysis.estimatedValue.toLocaleString()}`
    });
    newScore += 10;
  }

  // Keyword bonus
  if (analysis.keywords.length > 5) {
    factors.push({
      factor: 'Multiple Buy Signals',
      impact: 10,
      reason: `${analysis.keywords.length} positive indicators found`
    });
    newScore += 10;
  }

  // Confidence adjustment
  newScore = Math.round(newScore * (0.5 + analysis.confidence * 0.5));

  // Cap score between 0 and 100
  newScore = Math.max(0, Math.min(100, newScore));

  // Generate recommendation
  let recommendation = '';
  if (newScore >= 80) {
    recommendation = 'HOT LEAD: Immediate personal attention required. Call within 1 hour.';
  } else if (newScore >= 60) {
    recommendation = 'WARM LEAD: High priority. Personalized follow-up within 24 hours.';
  } else if (newScore >= 40) {
    recommendation = 'QUALIFIED LEAD: Standard follow-up sequence. Nurture with valuable content.';
  } else {
    recommendation = 'COLD LEAD: Add to long-term nurture campaign. Monitor for engagement.';
  }

  return {
    leadId: '',
    currentScore: previousScore,
    newScore,
    factors,
    recommendation
  };
}

// Analyze email thread for engagement patterns
export function analyzeEmailThread(
  messages: Array<{
    content: string;
    subject: string;
    timestamp: Date;
    fromLead: boolean;
  }>
): { engagementScore: number; pattern: string; insights: string[] } {
  const insights: string[] = [];
  let engagementScore = 50;

  // Sort messages by timestamp
  messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Calculate response times
  const responseTimes: number[] = [];
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].fromLead !== messages[i - 1].fromLead) {
      const timeDiff = messages[i].timestamp.getTime() - messages[i - 1].timestamp.getTime();
      responseTimes.push(timeDiff / (1000 * 60)); // Convert to minutes
    }
  }

  // Analyze response time patterns
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    if (avgResponseTime < 60) {
      engagementScore += 20;
      insights.push('Very quick response times indicate high interest');
    } else if (avgResponseTime < 360) {
      engagementScore += 10;
      insights.push('Good response times show active engagement');
    }
  }

  // Count lead-initiated messages
  const leadMessages = messages.filter(m => m.fromLead).length;
  const totalMessages = messages.length;
  const leadInitiationRate = leadMessages / totalMessages;

  if (leadInitiationRate > 0.5) {
    engagementScore += 15;
    insights.push('Lead is proactively engaging in conversation');
  }

  // Analyze message length trend
  const leadMessageLengths = messages
    .filter(m => m.fromLead)
    .map(m => m.content.length);

  if (leadMessageLengths.length >= 2) {
    const lengthTrend = leadMessageLengths[leadMessageLengths.length - 1] - leadMessageLengths[0];
    if (lengthTrend > 0) {
      engagementScore += 10;
      insights.push('Increasing message length shows growing interest');
    }
  }

  // Determine engagement pattern
  let pattern = 'standard';
  if (engagementScore >= 80) {
    pattern = 'highly_engaged';
  } else if (engagementScore >= 60) {
    pattern = 'engaged';
  } else if (engagementScore < 30) {
    pattern = 'disengaged';
  }

  return {
    engagementScore,
    pattern,
    insights
  };
}
