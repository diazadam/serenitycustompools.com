import twilio from 'twilio';
import type { InsertLead } from '@shared/schema';

// Initialize Twilio client only if credentials are properly configured
let client: any = null;

if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  try {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
  }
}

export async function sendLeadNotification(lead: InsertLead & { id?: string }) {
  try {
    // Skip SMS if Twilio not configured properly
    if (!client || !process.env.TWILIO_PHONE_NUMBER || !process.env.NOTIFICATION_PHONE_NUMBER) {
      console.log('Twilio not configured properly, skipping SMS notification');
      return;
    }

    // Format the lead information for SMS
    const message = formatLeadMessage(lead);
    
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.NOTIFICATION_PHONE_NUMBER
    });

    console.log('SMS notification sent successfully for lead:', lead.email);
  } catch (error) {
    console.error('Failed to send SMS notification:', error);
    // Don't throw error - we don't want to fail lead creation if SMS fails
  }
}

function formatLeadMessage(lead: InsertLead & { id?: string }): string {
  const lines = [
    '🏊 NEW POOL LEAD - AquaLux Atlanta',
    '',
    `Name: ${lead.firstName}${lead.lastName ? ' ' + lead.lastName : ''}`,
    `Email: ${lead.email}`,
  ];

  if (lead.phone) {
    lines.push(`Phone: ${lead.phone}`);
  }

  if (lead.city) {
    lines.push(`Location: ${lead.city}`);
  }

  if (lead.projectType) {
    lines.push(`Project: ${lead.projectType}`);
  }

  if (lead.budgetRange) {
    lines.push(`Budget: ${lead.budgetRange}`);
  }

  lines.push(`Source: ${getSourceDisplayName(lead.source)}`);

  if (lead.message) {
    lines.push('', `Message: ${lead.message}`);
  }

  lines.push('', '📧 Respond ASAP for best conversion!');

  return lines.join('\n');
}

function getSourceDisplayName(source: string): string {
  const sourceMap: { [key: string]: string } = {
    'hero': 'Homepage Form',
    'lead-magnet': 'Free Guide Download',
    'contact': 'Contact Form',
    'pool-calculator': 'Pool Cost Calculator',
    'virtual-tour-booking': 'Virtual Tour Booking',
    'chatbot': 'AI Chatbot'
  };

  return sourceMap[source] || source;
}