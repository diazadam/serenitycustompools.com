import type { InsertLead } from '@shared/schema';

interface LeadNotificationData {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  projectType?: string;
  budgetRange?: string;
  message?: string;
  city?: string;
  source?: string;
  affiliateId?: string;
}

// Simple notification system that logs lead info
export async function notifyAdminOfNewLead(lead: LeadNotificationData): Promise<void> {
  const fullName = lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.firstName;
  const timestamp = new Date().toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    dateStyle: 'short',
    timeStyle: 'short'
  });

  // Create formatted lead notification
  const notification = `
========================================
🎯 NEW LEAD RECEIVED - ${timestamp}
========================================

CONTACT INFORMATION:
-------------------
Name: ${fullName}
Email: ${lead.email}
Phone: ${lead.phone || 'Not provided'}
City: ${lead.city || 'Not provided'}

PROJECT DETAILS:
----------------
Project Type: ${lead.projectType || 'Not specified'}
Budget Range: ${lead.budgetRange || 'Not specified'}
Source: ${lead.source || 'website'}
${lead.affiliateId ? `Affiliate ID: ${lead.affiliateId}` : ''}

MESSAGE FROM CUSTOMER:
---------------------
${lead.message || 'No message provided'}

ACTION REQUIRED:
----------------
⚡ Please contact this lead within 24 hours
📧 Send to: adam@serenitypools.com
📱 Call: ${lead.phone || 'No phone provided'}

View in CRM: https://serenitycustompools.com/crm-dashboard

========================================
  `;

  // Log to console for immediate visibility
  console.log(notification);

  // Store notification for admin access
  try {
    await storeNotification(lead, notification);
  } catch (error) {
    console.error('Failed to store notification:', error);
  }
}

// Store notification for later retrieval
async function storeNotification(lead: LeadNotificationData, notification: string): Promise<void> {
  // This creates a notification that can be retrieved by the admin
  // In production, this could send to a webhook, Slack, or other service
  
  const notificationData = {
    lead,
    notification,
    timestamp: new Date().toISOString(),
    sent_to: 'adam@serenitypools.com',
    status: 'pending_contact'
  };

  // For now, we'll log it - in production this could be stored in DB
  // or sent to an external service
  if (process.env.NODE_ENV === 'development') {
    console.log('Lead notification prepared for:', notificationData.sent_to);
  }
}

// Format lead data for external services (webhooks, Zapier, etc.)
export function formatLeadForWebhook(lead: LeadNotificationData) {
  return {
    timestamp: new Date().toISOString(),
    lead_data: {
      full_name: lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.firstName,
      first_name: lead.firstName,
      last_name: lead.lastName || '',
      email: lead.email,
      phone: lead.phone || '',
      city: lead.city || '',
      project_type: lead.projectType || '',
      budget_range: lead.budgetRange || '',
      message: lead.message || '',
      source: lead.source || 'website',
      affiliate_id: lead.affiliateId || ''
    },
    notification: {
      send_to: 'adam@serenitypools.com',
      priority: lead.budgetRange?.includes('300') || lead.budgetRange?.includes('400') || lead.budgetRange?.includes('500') ? 'high' : 'normal',
      follow_up_required: true,
      follow_up_deadline: '24_hours'
    },
    crm_link: 'https://serenitycustompools.com/crm-dashboard'
  };
}