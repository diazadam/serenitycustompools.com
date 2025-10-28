import { sendEmail } from "./email";

interface LeadNotification {
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  source: string;
  affiliateId?: string | null;
}

interface AffiliateNotification {
  firstName: string;
  lastName: string;
  email: string;
  affiliateId: string;
}

export async function notifyNewLead(lead: LeadNotification): Promise<void> {
  try {
    const subject = `🎯 New Lead: ${lead.firstName} ${lead.lastName || ''} (${lead.source})`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a; border-bottom: 3px solid #eab308; padding-bottom: 10px;">
          🎯 New Lead Alert - Serenity Custom Pools LLC
        </h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #334155; margin-top: 0;">Lead Details:</h3>
          <p><strong>Name:</strong> ${lead.firstName} ${lead.lastName || ''}</p>
          <p><strong>Email:</strong> ${lead.email}</p>
          <p><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
          <p><strong>Source:</strong> ${lead.source}</p>
          ${lead.affiliateId ? `<p><strong>🎯 Affiliate ID:</strong> ${lead.affiliateId}</p>` : ''}
        </div>
        
        <div style="background: #eab308; color: white; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-weight: bold;">⚡ Follow up within 24 hours for best conversion rates!</p>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
          This lead was generated from your Serenity Custom Pools LLC website.
        </p>
      </div>
    `;

    await sendEmail({
      to: process.env.EMAIL_USER || 'info@serenitycustompools.com',
      subject,
      html: htmlContent
    });

    console.log(`✅ Lead notification sent for ${lead.firstName} ${lead.lastName || ''}`);
  } catch (error) {
    console.error('❌ Failed to send lead notification:', error);
  }
}

export async function notifyNewAffiliate(affiliate: AffiliateNotification): Promise<void> {
  try {
    const welcomeSubject = `🎉 Welcome to Serenity Custom Pools LLC Affiliate Program!`;
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a; border-bottom: 3px solid #eab308; padding-bottom: 10px;">
          🎉 Welcome to the Serenity Custom Pools LLC Affiliate Program!
        </h2>
        
        <p>Hi ${affiliate.firstName},</p>
        
        <p>Congratulations! You've successfully joined the <strong>greatest affiliate marketing program in the United States</strong> for luxury pool construction.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #334155; margin-top: 0;">Your Affiliate Details:</h3>
          <p><strong>📋 Your Affiliate ID:</strong> <span style="font-size: 18px; color: #eab308; font-weight: bold;">${affiliate.affiliateId}</span></p>
          <p><strong>💰 Commission Rate:</strong> 15% on all sales (no minimums!)</p>
          <p><strong>🎁 Serenity Rewards:</strong> 50 points for consultations that don't convert</p>
        </div>
        
        <div style="background: #eab308; color: white; padding: 15px; border-radius: 8px;">
          <h4 style="margin-top: 0;">🚀 How to Start Earning:</h4>
          <ol style="margin: 10px 0;">
            <li>Share your affiliate ID: <strong>${affiliate.affiliateId}</strong></li>
            <li>Direct people to: serenitycustompools.com?ref=${affiliate.affiliateId}</li>
            <li>Earn 15% commission on every conversion!</li>
          </ol>
        </div>
        
        <p><strong>Your application is currently under review.</strong> We'll approve you within 24 hours and send you additional marketing materials.</p>
        
        <p>Questions? Reply to this email or call us at (404) 555-POOL.</p>
        
        <p>Welcome to the team!<br>
        <strong>The Serenity Custom Pools LLC Team</strong></p>
      </div>
    `;

    await sendEmail({
      to: affiliate.email,
      subject: welcomeSubject,
      html: welcomeHtml
    });

    const adminSubject = `🎯 New Affiliate Application: ${affiliate.firstName} ${affiliate.lastName}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">🎯 New Affiliate Application</h2>
        <p><strong>Name:</strong> ${affiliate.firstName} ${affiliate.lastName}</p>
        <p><strong>Email:</strong> ${affiliate.email}</p>
        <p><strong>Affiliate ID:</strong> ${affiliate.affiliateId}</p>
        <p><strong>Status:</strong> Pending Approval</p>
        <p>⚡ <strong>Action Required:</strong> Review and approve this affiliate in your admin dashboard.</p>
      </div>
    `;

    await sendEmail({
      to: process.env.EMAIL_USER || 'info@serenitycustompools.com',
      subject: adminSubject,
      html: adminHtml
    });

    console.log(`✅ Affiliate notifications sent for ${affiliate.firstName} ${affiliate.lastName}`);
  } catch (error) {
    console.error('❌ Failed to send affiliate notifications:', error);
  }
}

export async function notifyCommissionEarned(affiliate: AffiliateNotification & { commissionAmount: string, projectValue: string }): Promise<void> {
  try {
    const subject = `💰 Commission Earned: $${affiliate.commissionAmount}!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a; border-bottom: 3px solid #eab308; padding-bottom: 10px;">
          💰 Congratulations! You Earned a Commission!
        </h2>
        
        <p>Hi ${affiliate.firstName},</p>
        
        <div style="background: #22c55e; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">🎉 Commission Earned!</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 0;">$${affiliate.commissionAmount}</p>
          <p style="margin: 5px 0 0 0;">15% of $${affiliate.projectValue} project</p>
        </div>
        
        <p>One of your referrals just converted to a sale! This commission will be processed and paid out according to your selected payment method.</p>
        
        <p><strong>Keep up the great work!</strong> The more you share, the more you earn.</p>
        
        <p>Questions about your commission? Contact us at info@serenitycustompools.com</p>
        
        <p>Best regards,<br>
        <strong>The Serenity Custom Pools LLC Team</strong></p>
      </div>
    `;

    await sendEmail({
      to: affiliate.email,
      subject,
      html
    });

    console.log(`✅ Commission notification sent to ${affiliate.firstName} ${affiliate.lastName}: $${affiliate.commissionAmount}`);
  } catch (error) {
    console.error('❌ Failed to send commission notification:', error);
  }
}