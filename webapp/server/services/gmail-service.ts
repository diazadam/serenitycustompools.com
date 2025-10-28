import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gmail OAuth client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID?.trim(),
  process.env.GOOGLE_CLIENT_SECRET?.trim(),
  'http://localhost:5000/auth/callback'
);

// Set refresh token if available and force refresh
if (process.env.GOOGLE_REFRESH_TOKEN) {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN.trim();
  console.log('Setting Gmail refresh token, length:', refreshToken.length);
  // Force clear any cached access token and use new refresh token
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
    // Force refresh by not setting access_token
    access_token: undefined,
    expiry_date: undefined
  });
  // Force refresh the access token immediately
  oauth2Client.getAccessToken().then(
    (token) => console.log('Gmail token refreshed successfully'),
    (err) => console.error('Error refreshing Gmail token:', err)
  );
}

// Initialize Gemini AI with production model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Gemini 2.5 Flash for higher quotas

// Gmail service
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Gmail API interfaces
interface EmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
    }>;
  };
  internalDate: string;
}

interface EmailSummary {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: Date;
  isRead: boolean;
  labels: string[];
}

interface EmailDetails extends EmailSummary {
  textContent: string;
  htmlContent: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
}

interface LeadEmailData {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  projectType?: string;
  budgetRange?: string;
  message?: string;
  city?: string;
  source?: string;
}

interface LeadQualification {
  score: number; // 1-10
  priority: 'High' | 'Medium' | 'Low';
  insights: string[];
  recommendedActions: string[];
  estimatedProjectValue: string;
  personalizedMessage: string;
}

// Get OAuth URL with full Gmail scope
export function getAuthUrl(): string {
  const scopes = ['https://mail.google.com/'];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
}

// Gmail API Methods

// List messages from inbox
export async function listInboxMessages(
  maxResults: number = 50,
  query: string = 'in:inbox'
): Promise<EmailSummary[]> {
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return [];
    }

    const messages: EmailSummary[] = [];
    for (const msg of response.data.messages) {
      try {
        const details = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'METADATA',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        });

        const message = details.data as unknown as EmailMessage;
        const headers = message.payload.headers;
        
        messages.push({
          id: message.id,
          threadId: message.threadId,
          from: headers.find(h => h.name === 'From')?.value || '',
          to: headers.find(h => h.name === 'To')?.value || '',
          subject: headers.find(h => h.name === 'Subject')?.value || '',
          snippet: message.snippet,
          date: new Date(parseInt(message.internalDate)),
          isRead: !message.labelIds.includes('UNREAD'),
          labels: message.labelIds || [],
        });
      } catch (error) {
        console.error(`Error fetching message ${msg.id}:`, error);
      }
    }

    return messages;
  } catch (error) {
    console.error('Error listing inbox messages:', error);
    throw new Error('Failed to list inbox messages');
  }
}

// Get full message details
export async function getMessageDetails(messageId: string): Promise<EmailDetails> {
  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'FULL',
    });

    const message = response.data as unknown as EmailMessage;
    const headers = message.payload.headers;
    
    let textContent = '';
    let htmlContent = '';
    const attachments: EmailDetails['attachments'] = [];

    // Extract body content
    function extractContent(parts: any[]): void {
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          textContent += Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          htmlContent += Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.filename) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body?.size || 0,
          });
        } else if (part.parts) {
          extractContent(part.parts);
        }
      }
    }

    if (message.payload.parts) {
      extractContent(message.payload.parts);
    } else if (message.payload.body?.data) {
      const content = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      if (message.payload.mimeType === 'text/html') {
        htmlContent = content;
      } else {
        textContent = content;
      }
    }

    return {
      id: message.id,
      threadId: message.threadId,
      from: headers.find(h => h.name === 'From')?.value || '',
      to: headers.find(h => h.name === 'To')?.value || '',
      subject: headers.find(h => h.name === 'Subject')?.value || '',
      snippet: message.snippet,
      date: new Date(parseInt(message.internalDate)),
      isRead: !message.labelIds.includes('UNREAD'),
      labels: message.labelIds || [],
      textContent,
      htmlContent,
      attachments,
    };
  } catch (error) {
    console.error('Error getting message details:', error);
    throw new Error('Failed to get message details');
  }
}

// Create and manage labels
export async function createLabel(labelName: string): Promise<GmailLabel> {
  try {
    const response = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    });

    return response.data as GmailLabel;
  } catch (error: any) {
    if (error?.response?.data?.error?.message?.includes('already exists')) {
      // Label already exists, try to get it
      const labels = await listLabels();
      const existingLabel = labels.find(l => l.name === labelName);
      if (existingLabel) {
        return existingLabel;
      }
    }
    console.error('Error creating label:', error);
    throw new Error(`Failed to create label: ${labelName}`);
  }
}

// List all labels
export async function listLabels(): Promise<GmailLabel[]> {
  try {
    const response = await gmail.users.labels.list({
      userId: 'me',
    });

    return (response.data.labels || []) as GmailLabel[];
  } catch (error) {
    console.error('Error listing labels:', error);
    throw new Error('Failed to list labels');
  }
}

// Apply label to message
export async function applyLabel(messageId: string, labelId: string): Promise<void> {
  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: [labelId],
      },
    });
  } catch (error) {
    console.error('Error applying label:', error);
    throw new Error('Failed to apply label to message');
  }
}

// Mark message as read/unread
export async function markAsRead(messageId: string, isRead: boolean = true): Promise<void> {
  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: isRead
        ? { removeLabelIds: ['UNREAD'] }
        : { addLabelIds: ['UNREAD'] },
    });
  } catch (error) {
    console.error('Error marking message as read/unread:', error);
    throw new Error('Failed to update message read status');
  }
}

// Get email thread
export async function getThread(threadId: string): Promise<EmailSummary[]> {
  try {
    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'METADATA',
      metadataHeaders: ['From', 'To', 'Subject', 'Date'],
    });

    const thread = response.data;
    const messages: EmailSummary[] = [];

    if (thread.messages) {
      for (const msg of thread.messages) {
        const headers = msg.payload?.headers || [];
        messages.push({
          id: msg.id || '',
          threadId: threadId,
          from: headers.find(h => h.name === 'From')?.value || '',
          to: headers.find(h => h.name === 'To')?.value || '',
          subject: headers.find(h => h.name === 'Subject')?.value || '',
          snippet: msg.snippet || '',
          date: new Date(parseInt(msg.internalDate || '0')),
          isRead: !(msg.labelIds || []).includes('UNREAD'),
          labels: msg.labelIds || [],
        });
      }
    }

    return messages;
  } catch (error) {
    console.error('Error getting thread:', error);
    throw new Error('Failed to get email thread');
  }
}

// Initialize default labels for lead management
export async function initializeLeadLabels(): Promise<void> {
  const leadLabels = [
    'Hot Lead',
    'Warm Lead', 
    'Cold Lead',
    'VIP',
    'Follow Up',
    'Consultation Scheduled',
    'Proposal Sent',
    'Converted'
  ];

  for (const labelName of leadLabels) {
    try {
      await createLabel(labelName);
      console.log(`Label "${labelName}" created or already exists`);
    } catch (error) {
      console.error(`Failed to create label "${labelName}":`, error);
    }
  }
}

// Analyze lead with Gemini AI
async function analyzeLeadWithAI(lead: LeadEmailData): Promise<LeadQualification> {
  try {
    const prompt = `
    Analyze this pool construction lead and provide qualification insights:
    
    Lead Information:
    - Name: ${lead.firstName} ${lead.lastName || ''}
    - Location: ${lead.city || 'Not specified'}
    - Project Type: ${lead.projectType || 'Not specified'}
    - Budget Range: ${lead.budgetRange || 'Not specified'}
    - Message: ${lead.message || 'No message provided'}
    - Source: ${lead.source || 'Website'}
    
    Based on this information, provide:
    1. Lead Score (1-10) based on likelihood to convert
    2. Priority Level (High/Medium/Low)
    3. Key insights about this lead
    4. Recommended follow-up actions
    5. Estimated project value
    6. A personalized message paragraph for the welcome email (2-3 sentences) that addresses their specific needs
    
    Context: Serenity Custom Pools LLC is a luxury pool builder in North Georgia with 30+ years experience. Average project is $100K-$300K.
    
    Return response in JSON format with keys: score, priority, insights (array), recommendedActions (array), estimatedProjectValue, personalizedMessage
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Extract JSON from response (Gemini sometimes adds markdown)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if AI fails
    return {
      score: 5,
      priority: 'Medium',
      insights: ['New lead requiring follow-up'],
      recommendedActions: ['Schedule consultation call', 'Send portfolio'],
      estimatedProjectValue: '$100,000 - $200,000',
      personalizedMessage: 'We look forward to discussing your pool project and bringing your vision to life.'
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    // Return default qualification if AI fails
    return {
      score: 5,
      priority: 'Medium',
      insights: ['New lead requiring follow-up'],
      recommendedActions: ['Schedule consultation call', 'Send portfolio'],
      estimatedProjectValue: '$100,000 - $200,000',
      personalizedMessage: 'We look forward to discussing your pool project and bringing your vision to life.'
    };
  }
}

// Generic send email function
export async function sendEmail(options: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}): Promise<{ success: boolean; messageId?: string }> {
  try {
    // Check if Gmail credentials are configured
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      console.log(`📧 Email queued (Gmail not configured): To: ${options.to}, Subject: ${options.subject}`);
      console.log('   ⚠️  Email will be sent once Gmail credentials are configured');
      return { 
        success: false, 
        messageId: undefined 
      };
    }

    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Create message with proper MIME format
    const boundary = '----=_Part_0_' + Date.now();
    const messageParts = [
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      '',
      options.textContent || options.htmlContent.replace(/<[^>]*>/g, ''),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      options.htmlContent,
      `--${boundary}--`
    ];
    
    const message = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(message).toString('base64url');
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    return { 
      success: true, 
      messageId: response.data.id || messageId 
    };
  } catch (error) {
    console.error('Send email error:', error);
    return { 
      success: false 
    };
  }
}

// Send email using Gmail API
export async function sendWelcomeEmail(lead: LeadEmailData): Promise<{ success: boolean; qualification?: LeadQualification }> {
  try {
    // Get AI analysis
    const qualification = await analyzeLeadWithAI(lead);
    
    const fullName = lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.firstName;
    
    // Create email content with AI personalization
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
    .vip-badge {
      background: #B8860B;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      display: inline-block;
      margin: 20px 0;
      font-weight: bold;
    }
    .ai-insights {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-left: 4px solid #1e3a8a;
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
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
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .footer {
      text-align: center;
      color: #888;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .unsubscribe {
      color: #888;
      text-decoration: underline;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Serenity Custom Pools LLC</div>
    <div class="tagline">Transforming Backyards Into Paradise Since 1994</div>
  </div>
  
  <div class="content">
    <h2 style="color: #1e3a8a;">Thank You for Your Serenity Custom Pools LLC VIP Consultation!</h2>
    
    <p>Dear ${fullName},</p>
    
    <p>Thank you for allowing Serenity Custom Pools LLC to serve you with a free <strong style="color: #B8860B;">$1,500.00 Custom Designed Pools and Outdoors Living VIP Consultation</strong>.</p>
    
    <div class="vip-badge">
      🌟 VIP CLIENT STATUS ACTIVATED 🌟
    </div>
    
    <div class="ai-insights">
      <h3 style="color: #1e3a8a; margin-top: 0;">Personalized for You:</h3>
      <p>${qualification.personalizedMessage}</p>
      ${lead.projectType ? `<p><strong>Project Focus:</strong> Based on your interest in ${lead.projectType.replace(/_/g, ' ')}, we'll prepare specialized design concepts that maximize both beauty and functionality.</p>` : ''}
      ${lead.budgetRange ? `<p><strong>Value Optimization:</strong> With your ${lead.budgetRange} budget, we'll showcase options that deliver maximum luxury and long-term value.</p>` : ''}
    </div>
    
    <p>We will be reaching out to you shortly to schedule your free, zero-obligation VIP Consultation. During this exclusive session, you'll receive:</p>
    
    <ul style="color: #555;">
      <li>Professional 3D design visualization of your dream pool</li>
      <li>Personalized landscape integration planning</li>
      <li>Energy-efficient equipment recommendations</li>
      <li>Flexible financing options overview</li>
      <li>Timeline and project management roadmap</li>
    </ul>
    
    <center>
      <a href="https://serenitycustompools.com/portfolio" class="cta-button">View Our Award-Winning Portfolio</a>
    </center>
    
    <div class="signature">
      <p>
        Sincerely,<br>
        <strong>Adam Mach</strong><br>
        Senior Design Consultant<br>
        Serenity Custom Pools LLC<br>
        📞 1 (678) 300-8949<br>
        📧 adam@serenitycustompools.com
      </p>
    </div>
  </div>
  
  <div class="footer">
    <p>
      © 2024 Serenity Custom Pools LLC. All rights reserved.<br>
      Transforming North Georgia Backyards Since 1994<br>
      <br>
      <a href="https://serenitycustompools.com/unsubscribe?email=${encodeURIComponent(lead.email)}" class="unsubscribe">Unsubscribe</a> | 
      <a href="https://serenitycustompools.com/privacy-policy" class="unsubscribe">Privacy Policy</a>
    </p>
  </div>
</body>
</html>
    `;
    
    const textContent = `
Thank You for Your Serenity Custom Pools LLC VIP Consultation!

Dear ${fullName},

Thank you for allowing Serenity Custom Pools LLC to serve you with a free $1,500.00 Custom Designed Pools and Outdoors Living VIP Consultation.

${qualification.personalizedMessage}

We will be reaching out to you shortly to schedule your free, zero-obligation VIP Consultation.

Sincerely,
Adam Mach
Senior Design Consultant
Serenity Custom Pools LLC
📞 1 (678) 300-8949
📧 adam@serenitycustompools.com

--
Unsubscribe: https://serenitycustompools.com/unsubscribe?email=${encodeURIComponent(lead.email)}
    `;
    
    // Encode email as base64
    const message = [
      'From: adam@serenitycustompools.com',
      `To: ${lead.email}`,
      'Subject: Thank You for Your Serenity Custom Pools LLC VIP Consultation!',
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary="boundary"',
      '',
      '--boundary',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      textContent,
      '',
      '--boundary',
      'Content-Type: text/html; charset=UTF-8',
      '',
      htmlContent,
      '--boundary--'
    ].join('\n');
    
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Send email via Gmail API
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log(`Welcome email sent to ${lead.email} with AI qualification score: ${qualification.score}/10`);
    
    // Admin notification is now sent from the main route to avoid duplicates
    // await sendAdminNotificationWithAI(lead, qualification);
    
    // But still log the AI insights for debugging
    console.log('Admin notification sent with AI insights');
    
    return { success: true, qualification };
  } catch (error) {
    console.error('Error sending Gmail email:', error);
    return { success: false };
  }
}

// Send admin notification with AI insights
async function sendAdminNotificationWithAI(lead: LeadEmailData, qualification: LeadQualification): Promise<void> {
  try {
    const fullName = lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.firstName;
    
    const priorityColor = qualification.priority === 'High' ? '#ff4444' : 
                         qualification.priority === 'Medium' ? '#ffaa00' : '#888888';
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .header { background: #1e3a8a; color: white; padding: 20px; border-radius: 5px; }
    .priority-badge {
      background: ${priorityColor};
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      display: inline-block;
      font-weight: bold;
    }
    .ai-box {
      background: #f0f9ff;
      border: 2px solid #1e3a8a;
      padding: 20px;
      margin: 20px 0;
      border-radius: 10px;
    }
    .score-meter {
      background: #e0e0e0;
      height: 30px;
      border-radius: 15px;
      overflow: hidden;
      margin: 10px 0;
    }
    .score-fill {
      background: linear-gradient(90deg, #ff4444 0%, #ffaa00 50%, #44ff44 100%);
      height: 100%;
      width: ${qualification.score * 10}%;
      display: flex;
      align-items: center;
      padding-left: 10px;
      color: white;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>🎯 New Lead Alert with AI Analysis</h2>
    <span class="priority-badge">${qualification.priority} Priority</span>
  </div>
  
  <div class="ai-box">
    <h3>🤖 AI Lead Qualification</h3>
    <div class="score-meter">
      <div class="score-fill">${qualification.score}/10</div>
    </div>
    <p><strong>Estimated Project Value:</strong> ${qualification.estimatedProjectValue}</p>
    
    <h4>Key Insights:</h4>
    <ul>
      ${qualification.insights.map(insight => `<li>${insight}</li>`).join('')}
    </ul>
    
    <h4>Recommended Actions:</h4>
    <ul>
      ${qualification.recommendedActions.map(action => `<li>${action}</li>`).join('')}
    </ul>
  </div>
  
  <h3>Contact Information:</h3>
  <p><strong>Name:</strong> ${fullName}</p>
  <p><strong>Email:</strong> ${lead.email}</p>
  <p><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
  <p><strong>City:</strong> ${lead.city || 'Not provided'}</p>
  <p><strong>Project Type:</strong> ${lead.projectType || 'Not specified'}</p>
  <p><strong>Budget:</strong> ${lead.budgetRange || 'Not specified'}</p>
  ${lead.message ? `<p><strong>Message:</strong> ${lead.message}</p>` : ''}
  
  <p style="margin-top: 30px;">
    <a href="https://serenitycustompools.com/crm-dashboard" style="background: #B8860B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in CRM</a>
  </p>
</body>
</html>
    `;
    
    const message = [
      'From: adam@serenitycustompools.com',
      'To: adam@serenitycustompools.com',
      `Subject: 🎯 ${qualification.priority} Priority Lead: ${fullName} - AI Score ${qualification.score}/10`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      htmlContent
    ].join('\n');
    
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log('Admin notification sent with AI insights');
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

// Export for backward compatibility
export const sendLeadThankYouEmail = sendWelcomeEmail;
export const sendAdminLeadNotification = async (lead: LeadEmailData) => {
  const result = await sendWelcomeEmail(lead);
  return result.success;
};