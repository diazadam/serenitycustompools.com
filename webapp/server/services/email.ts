import nodemailer from 'nodemailer';
import type { InsertLead } from '@shared/schema';

// Create transporter using SMTP (works with any email provider)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'noreply.aqualux@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'temp-password'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// General email sending function
export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string }) {
  try {
    // Skip email if no credentials configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email credentials not configured, skipping email notification');
      return;
    }

    await transporter.sendMail({
      from: `"Serenity Custom Pools LLC" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || 'Serenity Custom Pools LLC Notification',
      html: html || `<p>${subject}</p>`
    });

    console.log(`Email sent successfully to: ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

export async function sendLeadEmail(lead: InsertLead & { id?: string }) {
  try {
    // Skip email if no credentials configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email credentials not configured, skipping email notification');
      return;
    }

    const htmlContent = generateLeadEmailHTML(lead);
    const textContent = generateLeadEmailText(lead);

    await transporter.sendMail({
      from: `"Serenity Custom Pools LLC" <${process.env.EMAIL_USER}>`,
      to: 'diazdestination@gmail.com',
      subject: `🏊 New Pool Lead - ${lead.firstName} ${lead.lastName || ''} - ${getSourceDisplayName(lead.source)}`,
      text: textContent,
      html: htmlContent
    });

    console.log('Email notification sent successfully for lead:', lead.email);
  } catch (error) {
    console.error('Failed to send email notification:', error);
    // Don't throw error - we don't want to fail lead creation if email fails
  }
}

function generateLeadEmailHTML(lead: InsertLead & { id?: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e40af, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .lead-info { background: white; padding: 15px; border-radius: 6px; margin: 10px 0; }
    .priority { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏊 New Pool Lead - Serenity Custom Pools LLC</h1>
      <p>Lead Source: ${getSourceDisplayName(lead.source)}</p>
    </div>
    
    <div class="content">
      <div class="priority">
        <strong>⚡ HIGH PRIORITY:</strong> Respond within 5 minutes for best conversion rates!
      </div>
      
      <div class="lead-info">
        <h3>👤 Contact Information</h3>
        <p><strong>Name:</strong> ${lead.firstName} ${lead.lastName || ''}</p>
        <p><strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a></p>
        ${lead.phone ? `<p><strong>Phone:</strong> <a href="tel:${lead.phone}">${lead.phone}</a></p>` : ''}
        ${lead.city ? `<p><strong>Location:</strong> ${lead.city}</p>` : ''}
      </div>

      ${lead.projectType ? `
      <div class="lead-info">
        <h3>🏗️ Project Details</h3>
        <p><strong>Project Type:</strong> ${lead.projectType}</p>
        ${lead.budgetRange ? `<p><strong>Budget Range:</strong> ${lead.budgetRange}</p>` : ''}
      </div>
      ` : ''}

      ${lead.message ? `
      <div class="lead-info">
        <h3>💬 Message</h3>
        <p>${lead.message.replace(/\n/g, '<br>')}</p>
      </div>
      ` : ''}

      <div class="lead-info">
        <h3>📊 Lead Source</h3>
        <p><strong>Form:</strong> ${getSourceDisplayName(lead.source)}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        ${lead.id ? `<p><strong>Lead ID:</strong> ${lead.id}</p>` : ''}
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="mailto:${lead.email}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          📧 Reply to Lead
        </a>
        ${lead.phone ? `
        <a href="tel:${lead.phone}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-left: 10px;">
          📞 Call Now
        </a>
        ` : ''}
      </div>
    </div>

    <div class="footer">
      <p>Serenity Custom Pools LLC - Luxury Pool & Spa Contractors</p>
      <p>This is an automated notification from your website lead capture system.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateLeadEmailText(lead: InsertLead & { id?: string }): string {
  const lines = [
    '🏊 NEW POOL LEAD - Serenity Custom Pools LLC',
    '========================================',
    '',
    '👤 CONTACT INFORMATION:',
    `Name: ${lead.firstName} ${lead.lastName || ''}`,
    `Email: ${lead.email}`,
  ];

  if (lead.phone) {
    lines.push(`Phone: ${lead.phone}`);
  }

  if (lead.city) {
    lines.push(`Location: ${lead.city}`);
  }

  lines.push('');

  if (lead.projectType) {
    lines.push('🏗️ PROJECT DETAILS:');
    lines.push(`Project Type: ${lead.projectType}`);
    if (lead.budgetRange) {
      lines.push(`Budget Range: ${lead.budgetRange}`);
    }
    lines.push('');
  }

  if (lead.message) {
    lines.push('💬 MESSAGE:');
    lines.push(lead.message);
    lines.push('');
  }

  lines.push('📊 LEAD INFORMATION:');
  lines.push(`Source: ${getSourceDisplayName(lead.source)}`);
  lines.push(`Timestamp: ${new Date().toLocaleString()}`);
  if (lead.id) {
    lines.push(`Lead ID: ${lead.id}`);
  }

  lines.push('');
  lines.push('⚡ PRIORITY: Respond within 5 minutes for best conversion!');
  lines.push('');
  lines.push('========================================');
  lines.push('Serenity Custom Pools LLC - Luxury Pool & Spa Contractors');

  return lines.join('\n');
}

function getSourceDisplayName(source: string): string {
  const sourceMap: { [key: string]: string } = {
    'hero': 'Homepage Hero Form',
    'lead-magnet': 'Free Design Guide Download',
    'contact': 'Contact Form',
    'pool-calculator': 'Pool Cost Calculator',
    'virtual-tour-booking': 'Virtual Tour Booking',
    'chatbot': 'AI Chatbot Assistant'
  };

  return sourceMap[source] || source;
}