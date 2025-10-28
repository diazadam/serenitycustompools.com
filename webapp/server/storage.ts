import { 
  type Lead, 
  type InsertLead, 
  type ChatMessage, 
  type InsertChatMessage,
  type VoiceCall,
  type InsertVoiceCall,
  type Affiliate,
  type InsertAffiliate,
  type AffiliateReferral,
  type InsertAffiliateReferral,
  type AffiliateCommission,
  type SerenityRewardsTransaction,
  type InsertSerenityRewardsTransaction,
  type AffiliateCompetition,
  type InsertAffiliateCompetition,
  type Appointment,
  type InsertAppointment,
  type EmailCampaign,
  type InsertEmailCampaign,
  type CampaignHistory,
  type InsertCampaignHistory,
  type EmailThread,
  type InsertEmailThread,
  type EmailActivity,
  type InsertEmailActivity,
  type Media,
  type InsertMedia,
  leads,
  chatMessages,
  voiceCalls,
  affiliates,
  affiliateReferrals,
  serenityRewardsTransactions,
  affiliateCompetitions,
  appointments,
  blogPosts,
  emailCampaigns,
  campaignHistory,
  emailThreads,
  emailActivities,
  media,
  BlogPost,
  InsertBlogPost
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { autoEnrollLead } from "./services/campaign-scheduler";

export interface IStorage {
  // Lead management
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadByEmail(email: string): Promise<Lead | undefined>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined>;
  updateLeadQualification(id: string, qualification: any): Promise<void>;
  updateLeadScore(id: string, score: number): Promise<void>;
  deleteLead(id: string): Promise<boolean>;
  deleteMultipleLeads(ids: string[]): Promise<number>;
  
  // Chat message management
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
  
  // Voice Call management
  createVoiceCall(voiceCall: InsertVoiceCall): Promise<VoiceCall>;
  getVoiceCalls(filters?: { leadId?: string; status?: string; dateRange?: { start: Date; end: Date } }): Promise<VoiceCall[]>;
  getVoiceCallById(id: string): Promise<VoiceCall | undefined>;
  getVoiceCallsByLead(leadId: string): Promise<VoiceCall[]>;
  updateVoiceCallSummary(id: string, summary: string): Promise<void>;
  updateVoiceCall(id: string, updates: Partial<VoiceCall>): Promise<void>;
  getVoiceCallBySessionId(sessionId: string): Promise<VoiceCall | undefined>;
  
  // Simplified Affiliate management
  createAffiliate(affiliate: InsertAffiliate): Promise<Affiliate>;
  getAffiliate(id: string): Promise<Affiliate | undefined>;
  getAffiliateByAffiliateId(affiliateId: string): Promise<Affiliate | undefined>;
  getAffiliateByEmail(email: string): Promise<Affiliate | undefined>;
  updateAffiliate(id: string, updates: Partial<Affiliate>): Promise<Affiliate | undefined>;
  getAffiliates(): Promise<Affiliate[]>;
  
  // Referrals and commissions
  createReferral(referral: InsertAffiliateReferral): Promise<AffiliateReferral>;
  getReferralsByAffiliate(affiliateDbId: string): Promise<AffiliateReferral[]>;
  updateReferralStatus(referralId: string, status: string, projectValue?: string, serenityRewards?: string): Promise<void>;
  
  // Serenity Rewards system
  createSerenityRewardsTransaction(transaction: InsertSerenityRewardsTransaction): Promise<SerenityRewardsTransaction>;
  getSerenityRewardsByAffiliate(affiliateDbId: string): Promise<SerenityRewardsTransaction[]>;
  
  // Gamification
  createCompetition(competition: InsertAffiliateCompetition): Promise<AffiliateCompetition>;
  getActiveCompetitions(): Promise<AffiliateCompetition[]>;
  updateCompetitionScore(affiliateDbId: string, competitionId: string, score: number): Promise<void>;
  
  // Appointment management
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  updateAppointmentStatus(id: string, status: string): Promise<void>;
  
  // Blog management
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPosts(category?: string): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  updateBlogPostViews(id: string): Promise<void>;
  likeBlogPost(id: string): Promise<void>;
  getFeaturedPosts(): Promise<BlogPost[]>;
  
  // Email Campaign management
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  getEmailCampaigns(): Promise<EmailCampaign[]>;
  getEmailCampaign(id: string): Promise<EmailCampaign | undefined>;
  getEmailCampaignByLeadId(leadId: string): Promise<EmailCampaign[]>;
  getActiveCampaigns(): Promise<EmailCampaign[]>;
  updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined>;
  pauseEmailCampaign(id: string): Promise<void>;
  resumeEmailCampaign(id: string): Promise<void>;
  
  // Campaign History
  createCampaignHistory(history: InsertCampaignHistory): Promise<CampaignHistory>;
  getCampaignHistory(campaignId: string): Promise<CampaignHistory[]>;
  getCampaignHistoryByLead(leadId: string): Promise<CampaignHistory[]>;
  updateCampaignHistory(id: string, updates: Partial<CampaignHistory>): Promise<void>;
  trackEmailOpen(historyId: string): Promise<void>;
  trackEmailClick(historyId: string, url?: string): Promise<void>;
  handleUnsubscribe(leadId: string, campaignId?: string): Promise<void>;
  
  // Email Thread management
  createEmailThread(thread: InsertEmailThread): Promise<EmailThread>;
  getEmailThreads(): Promise<EmailThread[]>;
  getEmailThreadsByLead(leadId: string): Promise<EmailThread[]>;
  getEmailThreadById(id: string): Promise<EmailThread | undefined>;
  getEmailThreadByGmailId(threadId: string): Promise<EmailThread | undefined>;
  updateEmailThread(id: string, updates: Partial<EmailThread>): Promise<EmailThread | undefined>;
  incrementUnreadCount(threadId: string): Promise<void>;
  markThreadAsRead(threadId: string): Promise<void>;
  
  // Email Activity management
  createEmailActivity(activity: InsertEmailActivity): Promise<EmailActivity>;
  getEmailActivities(): Promise<EmailActivity[]>;
  getEmailActivitiesByLead(leadId: string): Promise<EmailActivity[]>;
  getEmailActivitiesByThread(threadId: string): Promise<EmailActivity[]>;
  getEmailActivityByMessageId(messageId: string): Promise<EmailActivity | undefined>;
  updateEmailActivity(id: string, updates: Partial<EmailActivity>): Promise<EmailActivity | undefined>;
  trackEmailOpen(activityId: string): Promise<void>;
  trackEmailClick(activityId: string, url: string): Promise<void>;
  getRecentActivities(limit: number): Promise<EmailActivity[]>;
  
  // Media management
  createMedia(mediaItem: InsertMedia): Promise<Media>;
  getMedia(filters?: { type?: string; category?: string; isPublic?: boolean }): Promise<Media[]>;
  getMediaById(id: string): Promise<Media | undefined>;
  getMediaByLeadId(leadId: string): Promise<Media[]>;
  updateMedia(id: string, updates: Partial<Media>): Promise<Media | undefined>;
  deleteMedia(id: string): Promise<boolean>;
  getPublicMedia(category?: string): Promise<Media[]>;
  updateMediaOrder(id: string, order: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private leads: Map<string, Lead>;
  private chatMessages: Map<string, ChatMessage>;
  private voiceCalls: Map<string, VoiceCall>;
  private affiliates: Map<string, Affiliate>;
  private referrals: Map<string, AffiliateReferral>;
  private serenityRewardsTransactions: Map<string, SerenityRewardsTransaction>;
  private competitions: Map<string, AffiliateCompetition>;
  private competitionEntries: Map<string, any>;
  private appointments: Map<string, Appointment>;
  private blogPosts: Map<string, BlogPost>;
  private emailCampaigns: Map<string, EmailCampaign>;
  private campaignHistories: Map<string, CampaignHistory>;
  private mediaItems: Map<string, Media>;

  constructor() {
    this.leads = new Map();
    this.chatMessages = new Map();
    this.voiceCalls = new Map();
    this.affiliates = new Map();
    this.referrals = new Map();
    this.serenityRewardsTransactions = new Map();
    this.competitions = new Map();
    this.competitionEntries = new Map();
    this.appointments = new Map();
    this.blogPosts = new Map();
    this.emailCampaigns = new Map();
    this.campaignHistories = new Map();
    this.mediaItems = new Map();
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = { 
      ...insertLead,
      id, 
      lastName: insertLead.lastName || null,
      phone: insertLead.phone || null,
      city: insertLead.city || null,
      projectType: insertLead.projectType || null,
      budgetRange: insertLead.budgetRange || null,
      message: insertLead.message || null,
      affiliateId: insertLead.affiliateId || null,
      metadata: null,
      createdAt: new Date()
    };
    this.leads.set(id, lead);
    
    // Auto-enroll lead in appropriate campaign
    // Don't block lead creation if enrollment fails
    try {
      await autoEnrollLead(lead.id);
      console.log(`Lead ${lead.id} auto-enrolled in campaign`);
    } catch (error) {
      console.error(`Failed to auto-enroll lead ${lead.id} in campaign:`, error);
      // Continue without throwing - lead creation should succeed even if enrollment fails
    }
    
    return lead;
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    return Array.from(this.leads.values()).find(lead => lead.email === email);
  }
  
  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (lead) {
      // Apply the updates
      Object.assign(lead, updates);
      this.leads.set(id, lead);
      return lead;
    }
    return undefined;
  }
  
  async updateLeadQualification(id: string, qualification: any): Promise<void> {
    const lead = this.leads.get(id);
    if (lead) {
      lead.metadata = qualification;
      this.leads.set(id, lead);
    }
  }
  
  async updateLeadScore(id: string, score: number): Promise<void> {
    const lead = this.leads.get(id);
    if (lead) {
      lead.score = score;
      this.leads.set(id, lead);
    }
  }

  async deleteLead(id: string): Promise<boolean> {
    const lead = this.leads.get(id);
    if (!lead) {
      return false;
    }
    
    // Delete associated data
    // Delete voice calls associated with this lead
    for (const [callId, call] of this.voiceCalls.entries()) {
      if (call.leadId === id) {
        this.voiceCalls.delete(callId);
      }
    }
    
    // Delete email campaigns associated with this lead
    for (const [campaignId, campaign] of this.emailCampaigns.entries()) {
      if (campaign.leadId === id) {
        this.emailCampaigns.delete(campaignId);
      }
    }
    
    // Delete campaign history associated with this lead
    for (const [historyId, history] of this.campaignHistory.entries()) {
      if (history.leadId === id) {
        this.campaignHistory.delete(historyId);
      }
    }
    
    // Delete email threads associated with this lead
    for (const [threadId, thread] of this.emailThreads.entries()) {
      if (thread.leadId === id) {
        this.emailThreads.delete(threadId);
      }
    }
    
    // Delete email activities associated with this lead
    for (const [activityId, activity] of this.emailActivities.entries()) {
      if (activity.leadId === id) {
        this.emailActivities.delete(activityId);
      }
    }
    
    // Delete appointments associated with this lead
    for (const [appointmentId, appointment] of this.appointments.entries()) {
      if (appointment.leadId === id) {
        this.appointments.delete(appointmentId);
      }
    }
    
    // Finally, delete the lead itself
    this.leads.delete(id);
    return true;
  }
  
  async deleteMultipleLeads(ids: string[]): Promise<number> {
    let deletedCount = 0;
    for (const id of ids) {
      if (await this.deleteLead(id)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Voice Call management methods
  async createVoiceCall(insertVoiceCall: InsertVoiceCall): Promise<VoiceCall> {
    const id = randomUUID();
    const voiceCall: VoiceCall = {
      ...insertVoiceCall,
      id,
      leadId: insertVoiceCall.leadId || null,
      transcriptSummary: insertVoiceCall.transcriptSummary || null,
      leadDataCaptured: insertVoiceCall.leadDataCaptured || null,
      groundingSources: insertVoiceCall.groundingSources || null,
      audioRecordingUrl: insertVoiceCall.audioRecordingUrl || null,
      metadata: insertVoiceCall.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.voiceCalls.set(id, voiceCall);
    return voiceCall;
  }

  async getVoiceCalls(filters?: { leadId?: string; status?: string; dateRange?: { start: Date; end: Date } }): Promise<VoiceCall[]> {
    let calls = Array.from(this.voiceCalls.values());
    
    if (filters) {
      if (filters.leadId) {
        calls = calls.filter(call => call.leadId === filters.leadId);
      }
      if (filters.status) {
        calls = calls.filter(call => call.status === filters.status);
      }
      if (filters.dateRange) {
        calls = calls.filter(call => 
          call.callDate >= filters.dateRange.start && 
          call.callDate <= filters.dateRange.end
        );
      }
    }
    
    return calls.sort((a, b) => b.callDate.getTime() - a.callDate.getTime());
  }

  async getVoiceCallById(id: string): Promise<VoiceCall | undefined> {
    return this.voiceCalls.get(id);
  }

  async getVoiceCallsByLead(leadId: string): Promise<VoiceCall[]> {
    return Array.from(this.voiceCalls.values())
      .filter(call => call.leadId === leadId)
      .sort((a, b) => b.callDate.getTime() - a.callDate.getTime());
  }

  async updateVoiceCallSummary(id: string, summary: string): Promise<void> {
    const voiceCall = this.voiceCalls.get(id);
    if (voiceCall) {
      voiceCall.transcriptSummary = summary;
      voiceCall.updatedAt = new Date();
      this.voiceCalls.set(id, voiceCall);
    }
  }

  async updateVoiceCall(id: string, updates: Partial<VoiceCall>): Promise<void> {
    const voiceCall = this.voiceCalls.get(id);
    if (voiceCall) {
      Object.assign(voiceCall, updates);
      voiceCall.updatedAt = new Date();
      this.voiceCalls.set(id, voiceCall);
    }
  }

  async getVoiceCallBySessionId(sessionId: string): Promise<VoiceCall | undefined> {
    return Array.from(this.voiceCalls.values())
      .find(call => call.sessionId === sessionId);
  }

  // Simplified Affiliate management methods
  async createAffiliate(insertAffiliate: InsertAffiliate): Promise<Affiliate> {
    const id = randomUUID();
    // Generate simple 6-digit affiliate ID
    const affiliateId = Math.floor(100000 + Math.random() * 900000).toString();
    
    const affiliate: Affiliate = {
      ...insertAffiliate,
      id,
      email: insertAffiliate.email,
      phone: insertAffiliate.phone || null,
      affiliateId,
      totalCommissions: "0.00",
      totalSerenityRewards: "0.00",
      lifetimeReferrals: 0,
      lifetimeConsultations: 0,
      status: insertAffiliate.status || "active",
      paymentMethod: insertAffiliate.paymentMethod || null,
      paymentDetails: insertAffiliate.paymentDetails || null,
      company: insertAffiliate.company || null,
      website: insertAffiliate.website || null,
      socialMediaHandle: insertAffiliate.socialMediaHandle || null,
      notes: insertAffiliate.notes || null,
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.affiliates.set(id, affiliate);
    return affiliate;
  }

  async getAffiliate(id: string): Promise<Affiliate | undefined> {
    return this.affiliates.get(id);
  }

  async getAffiliateByAffiliateId(affiliateId: string): Promise<Affiliate | undefined> {
    return Array.from(this.affiliates.values()).find(affiliate => affiliate.affiliateId === affiliateId);
  }

  async getAffiliateByEmail(email: string): Promise<Affiliate | undefined> {
    return Array.from(this.affiliates.values()).find(affiliate => affiliate.email === email);
  }

  async updateAffiliate(id: string, updates: Partial<Affiliate>): Promise<Affiliate | undefined> {
    const affiliate = this.affiliates.get(id);
    if (!affiliate) return undefined;
    
    const updated: Affiliate = {
      ...affiliate,
      ...updates,
      updatedAt: new Date()
    };
    
    this.affiliates.set(id, updated);
    return updated;
  }

  async getAffiliates(): Promise<Affiliate[]> {
    return Array.from(this.affiliates.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // Referrals and commissions
  async createReferral(insertReferral: InsertAffiliateReferral): Promise<AffiliateReferral> {
    const id = randomUUID();
    const referral: AffiliateReferral = {
      ...insertReferral,
      id,
      type: insertReferral.type || "consultation",
      status: insertReferral.status || "pending",
      projectValue: insertReferral.projectValue || null,
      commissionRate: insertReferral.commissionRate || "15.00",
      commissionAmount: insertReferral.commissionAmount || null,
      serenityRewardsAwarded: insertReferral.serenityRewardsAwarded || "0.00",
      consultationDate: insertReferral.consultationDate || null,
      conversionDate: insertReferral.conversionDate || null,
      notes: insertReferral.notes || null,
      createdAt: new Date()
    };
    
    this.referrals.set(id, referral);
    return referral;
  }

  async getReferralsByAffiliate(affiliateDbId: string): Promise<AffiliateReferral[]> {
    return Array.from(this.referrals.values())
      .filter(referral => referral.affiliateDbId === affiliateDbId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateReferralStatus(referralId: string, status: string, projectValue?: string, serenityRewards?: string): Promise<void> {
    const referral = this.referrals.get(referralId);
    if (referral) {
      referral.status = status;
      if (projectValue) {
        referral.projectValue = projectValue;
        // Calculate 15% commission
        referral.commissionAmount = (parseFloat(projectValue) * 0.15).toFixed(2);
        referral.conversionDate = new Date();
      }
      if (serenityRewards) {
        referral.serenityRewardsAwarded = serenityRewards;
      }
      this.referrals.set(referralId, referral);
    }
  }

  // Serenity Rewards system
  async createSerenityRewardsTransaction(insertTransaction: InsertSerenityRewardsTransaction): Promise<SerenityRewardsTransaction> {
    const id = randomUUID();
    const transaction: SerenityRewardsTransaction = {
      ...insertTransaction,
      id,
      referralId: insertTransaction.referralId || null,
      createdAt: new Date()
    };
    
    this.serenityRewardsTransactions.set(id, transaction);
    return transaction;
  }

  async getSerenityRewardsByAffiliate(affiliateDbId: string): Promise<SerenityRewardsTransaction[]> {
    return Array.from(this.serenityRewardsTransactions.values())
      .filter(transaction => transaction.affiliateDbId === affiliateDbId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Gamification
  async createCompetition(insertCompetition: InsertAffiliateCompetition): Promise<AffiliateCompetition> {
    const id = randomUUID();
    const competition: AffiliateCompetition = {
      ...insertCompetition,
      id,
      isActive: insertCompetition.isActive !== undefined ? insertCompetition.isActive : true,
      createdAt: new Date()
    };
    
    this.competitions.set(id, competition);
    return competition;
  }

  async getActiveCompetitions(): Promise<AffiliateCompetition[]> {
    const now = new Date();
    return Array.from(this.competitions.values())
      .filter(competition => 
        competition.isActive && 
        competition.startDate <= now && 
        competition.endDate >= now
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  async updateCompetitionScore(affiliateDbId: string, competitionId: string, score: number): Promise<void> {
    const entryKey = `${affiliateDbId}-${competitionId}`;
    const existingEntry = this.competitionEntries.get(entryKey);
    
    if (existingEntry) {
      existingEntry.score = score;
      existingEntry.updatedAt = new Date();
    } else {
      this.competitionEntries.set(entryKey, {
        affiliateDbId,
        competitionId,
        score,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  // Appointment management methods
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      leadId: insertAppointment.leadId || null, // Ensure leadId is null if undefined
      lastName: insertAppointment.lastName || null, // Ensure lastName is null if undefined
      projectType: insertAppointment.projectType || null, // Ensure projectType is null if undefined
      estimatedBudget: insertAppointment.estimatedBudget || null, // Ensure estimatedBudget is null if undefined
      affiliateId: insertAppointment.affiliateId || null, // Ensure affiliateId is null if undefined
      notes: insertAppointment.notes || null, // Ensure notes is null if undefined
      status: insertAppointment.status || 'scheduled', // Provide default status
      appointmentType: insertAppointment.appointmentType || 'consultation', // Provide default type
      createdAt: new Date(),
      updatedAt: new Date(),
      remindersSent: 0,
    };
    
    this.appointments.set(id, appointment);
    return appointment;
  }

  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async updateAppointmentStatus(id: string, status: string): Promise<void> {
    const appointment = this.appointments.get(id);
    if (appointment) {
      const updated = { ...appointment, status, updatedAt: new Date() };
      this.appointments.set(id, updated);
    }
  }

  // Blog management methods
  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = randomUUID();
    const post: BlogPost = {
      ...insertPost,
      id,
      tags: insertPost.tags || [],
      authorTitle: insertPost.authorTitle || null,
      viewCount: 0,
      likes: 0,
      isPublished: insertPost.isPublished !== undefined ? insertPost.isPublished : true,
      isFeatured: insertPost.isFeatured !== undefined ? insertPost.isFeatured : false,
      featuredImage: insertPost.featuredImage || null,
      metaTitle: insertPost.metaTitle || null,
      metaDescription: insertPost.metaDescription || null,
      publishedAt: new Date(),
      updatedAt: new Date()
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async getBlogPosts(category?: string): Promise<BlogPost[]> {
    const posts = Array.from(this.blogPosts.values())
      .filter(post => post.isPublished)
      .filter(post => !category || post.category === category)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    return posts;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const posts = Array.from(this.blogPosts.values());
    return posts.find(post => post.slug === slug);
  }

  async updateBlogPostViews(id: string): Promise<void> {
    const post = this.blogPosts.get(id);
    if (post) {
      post.viewCount = (post.viewCount || 0) + 1;
      this.blogPosts.set(id, post);
    }
  }

  async likeBlogPost(id: string): Promise<void> {
    const post = this.blogPosts.get(id);
    if (post) {
      post.likes = (post.likes || 0) + 1;
      this.blogPosts.set(id, post);
    }
  }

  async getFeaturedPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .filter(post => post.isPublished && post.isFeatured)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, 4);
  }

  // Email Campaign management methods
  async createEmailCampaign(insertCampaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const id = randomUUID();
    const campaign: EmailCampaign = {
      ...insertCampaign,
      id,
      status: insertCampaign.status || 'active',
      currentStep: 0,
      lastSentAt: insertCampaign.lastSentAt || null,
      nextSendAt: insertCampaign.nextSendAt || null,
      completedAt: insertCampaign.completedAt || null,
      timezone: insertCampaign.timezone || 'America/Los_Angeles',
      metadata: insertCampaign.metadata || null,
      unsubscribed: false,
      enrolledAt: insertCampaign.enrolledAt || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.emailCampaigns.set(id, campaign);
    return campaign;
  }

  async getEmailCampaigns(): Promise<EmailCampaign[]> {
    return Array.from(this.emailCampaigns.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getEmailCampaign(id: string): Promise<EmailCampaign | undefined> {
    return this.emailCampaigns.get(id);
  }

  async getEmailCampaignByLeadId(leadId: string): Promise<EmailCampaign[]> {
    return Array.from(this.emailCampaigns.values())
      .filter(campaign => campaign.leadId === leadId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActiveCampaigns(): Promise<EmailCampaign[]> {
    return Array.from(this.emailCampaigns.values())
      .filter(campaign => campaign.status === 'active' && !campaign.unsubscribed);
  }

  async updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined> {
    const campaign = this.emailCampaigns.get(id);
    if (campaign) {
      const updated = {
        ...campaign,
        ...updates,
        updatedAt: new Date()
      };
      this.emailCampaigns.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async pauseEmailCampaign(id: string): Promise<void> {
    const campaign = this.emailCampaigns.get(id);
    if (campaign) {
      campaign.status = 'paused';
      campaign.updatedAt = new Date();
      this.emailCampaigns.set(id, campaign);
    }
  }

  async resumeEmailCampaign(id: string): Promise<void> {
    const campaign = this.emailCampaigns.get(id);
    if (campaign) {
      campaign.status = 'active';
      campaign.updatedAt = new Date();
      this.emailCampaigns.set(id, campaign);
    }
  }

  // Campaign History methods
  async createCampaignHistory(insertHistory: InsertCampaignHistory): Promise<CampaignHistory> {
    const id = randomUUID();
    const history: CampaignHistory = {
      ...insertHistory,
      id,
      openedAt: insertHistory.openedAt || null,
      clickedAt: insertHistory.clickedAt || null,
      bouncedAt: insertHistory.bouncedAt || null,
      unsubscribedAt: insertHistory.unsubscribedAt || null,
      openCount: 0,
      clickCount: 0,
      clickedLinks: insertHistory.clickedLinks || null,
      emailProvider: insertHistory.emailProvider || 'gmail',
      messageId: insertHistory.messageId || null,
      metadata: insertHistory.metadata || null,
      createdAt: new Date()
    };
    this.campaignHistories.set(id, history);
    return history;
  }

  async getCampaignHistory(campaignId: string): Promise<CampaignHistory[]> {
    return Array.from(this.campaignHistories.values())
      .filter(history => history.campaignId === campaignId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  async getCampaignHistoryByLead(leadId: string): Promise<CampaignHistory[]> {
    return Array.from(this.campaignHistories.values())
      .filter(history => history.leadId === leadId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  async updateCampaignHistory(id: string, updates: Partial<CampaignHistory>): Promise<void> {
    const history = this.campaignHistories.get(id);
    if (history) {
      const updated = {
        ...history,
        ...updates
      };
      this.campaignHistories.set(id, updated);
    }
  }

  async trackEmailOpen(historyId: string): Promise<void> {
    const history = this.campaignHistories.get(historyId);
    if (history) {
      history.openCount = (history.openCount || 0) + 1;
      if (!history.openedAt) {
        history.openedAt = new Date();
      }
      this.campaignHistories.set(historyId, history);
    }
  }

  async trackEmailClick(historyId: string, url?: string): Promise<void> {
    const history = this.campaignHistories.get(historyId);
    if (history) {
      history.clickCount = (history.clickCount || 0) + 1;
      if (!history.clickedAt) {
        history.clickedAt = new Date();
      }
      if (url) {
        const links = (history.clickedLinks as string[]) || [];
        links.push(url);
        history.clickedLinks = links;
      }
      this.campaignHistories.set(historyId, history);
    }
  }

  async handleUnsubscribe(leadId: string, campaignId?: string): Promise<void> {
    if (campaignId) {
      // Unsubscribe from specific campaign
      const campaign = this.emailCampaigns.get(campaignId);
      if (campaign && campaign.leadId === leadId) {
        campaign.unsubscribed = true;
        campaign.status = 'stopped';
        campaign.updatedAt = new Date();
        this.emailCampaigns.set(campaignId, campaign);
      }
    } else {
      // Unsubscribe from all campaigns
      Array.from(this.emailCampaigns.values())
        .filter(campaign => campaign.leadId === leadId)
        .forEach(campaign => {
          campaign.unsubscribed = true;
          campaign.status = 'stopped';
          campaign.updatedAt = new Date();
          this.emailCampaigns.set(campaign.id, campaign);
        });
    }
  }

}

// Database implementation
export class DatabaseStorage implements IStorage {
  // Lead management
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(insertLead).returning();
    
    // Auto-enroll lead in appropriate campaign
    // Don't block lead creation if enrollment fails
    try {
      await autoEnrollLead(lead.id);
      console.log(`Lead ${lead.id} auto-enrolled in campaign`);
    } catch (error) {
      console.error(`Failed to auto-enroll lead ${lead.id} in campaign:`, error);
      // Continue without throwing - lead creation should succeed even if enrollment fails
    }
    
    return lead;
  }

  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeadByEmail(email: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.email, email));
    return lead;
  }
  
  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const [updatedLead] = await db.update(leads)
      .set(updates)
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }
  
  async updateLeadQualification(id: string, qualification: any): Promise<void> {
    await db.update(leads)
      .set({ metadata: qualification })
      .where(eq(leads.id, id));
  }
  
  async updateLeadScore(id: string, score: number): Promise<void> {
    await db.update(leads)
      .set({ score })
      .where(eq(leads.id, id));
  }

  async deleteLead(id: string): Promise<boolean> {
    try {
      // Delete associated data first (cascade delete)
      // Delete voice calls
      await db.delete(voiceCalls).where(eq(voiceCalls.leadId, id));
      
      // Delete email campaigns
      await db.delete(emailCampaigns).where(eq(emailCampaigns.leadId, id));
      
      // Delete campaign history
      await db.delete(campaignHistory).where(eq(campaignHistory.leadId, id));
      
      // Delete email threads
      await db.delete(emailThreads).where(eq(emailThreads.leadId, id));
      
      // Delete email activities
      await db.delete(emailActivities).where(eq(emailActivities.leadId, id));
      
      // Delete appointments
      await db.delete(appointments).where(eq(appointments.leadId, id));
      
      // Finally, delete the lead itself
      const result = await db.delete(leads).where(eq(leads.id, id));
      return true;
    } catch (error) {
      console.error(`Failed to delete lead ${id}:`, error);
      return false;
    }
  }
  
  async deleteMultipleLeads(ids: string[]): Promise<number> {
    let deletedCount = 0;
    for (const id of ids) {
      if (await this.deleteLead(id)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  // Chat message management
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);
  }

  // Voice Call management
  async createVoiceCall(insertVoiceCall: InsertVoiceCall): Promise<VoiceCall> {
    const [voiceCall] = await db.insert(voiceCalls).values(insertVoiceCall).returning();
    return voiceCall;
  }

  async getVoiceCalls(filters?: { leadId?: string; status?: string; dateRange?: { start: Date; end: Date } }): Promise<VoiceCall[]> {
    let query = db.select().from(voiceCalls);
    
    if (filters) {
      const conditions = [];
      if (filters.leadId) {
        conditions.push(eq(voiceCalls.leadId, filters.leadId));
      }
      if (filters.status) {
        conditions.push(eq(voiceCalls.status, filters.status));
      }
      // Note: Date range filtering would require additional SQL operators
      // For now, we'll filter in memory after retrieval
    }
    
    const calls = await query.orderBy(desc(voiceCalls.callDate));
    
    if (filters?.dateRange) {
      return calls.filter(call => 
        call.callDate >= filters.dateRange.start && 
        call.callDate <= filters.dateRange.end
      );
    }
    
    return calls;
  }

  async getVoiceCallById(id: string): Promise<VoiceCall | undefined> {
    const [voiceCall] = await db.select().from(voiceCalls)
      .where(eq(voiceCalls.id, id));
    return voiceCall;
  }

  async getVoiceCallsByLead(leadId: string): Promise<VoiceCall[]> {
    return await db.select().from(voiceCalls)
      .where(eq(voiceCalls.leadId, leadId))
      .orderBy(desc(voiceCalls.callDate));
  }

  async updateVoiceCallSummary(id: string, summary: string): Promise<void> {
    await db.update(voiceCalls)
      .set({ 
        transcriptSummary: summary,
        updatedAt: new Date()
      })
      .where(eq(voiceCalls.id, id));
  }

  async updateVoiceCall(id: string, updates: Partial<VoiceCall>): Promise<void> {
    await db.update(voiceCalls)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(voiceCalls.id, id));
  }

  async getVoiceCallBySessionId(sessionId: string): Promise<VoiceCall | undefined> {
    const [voiceCall] = await db.select().from(voiceCalls)
      .where(eq(voiceCalls.sessionId, sessionId));
    return voiceCall;
  }

  // Affiliate management
  async createAffiliate(insertAffiliate: InsertAffiliate): Promise<Affiliate> {
    // Generate simple 6-digit affiliate ID
    const affiliateId = Math.floor(100000 + Math.random() * 900000).toString();
    
    const [affiliate] = await db.insert(affiliates).values({
      ...insertAffiliate,
      affiliateId
    }).returning();
    return affiliate;
  }

  async getAffiliate(id: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.id, id));
    return affiliate;
  }

  async getAffiliateByAffiliateId(affiliateId: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.affiliateId, affiliateId));
    return affiliate;
  }

  async getAffiliateByEmail(email: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.email, email));
    return affiliate;
  }

  async updateAffiliate(id: string, updates: Partial<Affiliate>): Promise<Affiliate | undefined> {
    const [updated] = await db.update(affiliates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(affiliates.id, id))
      .returning();
    return updated;
  }

  async getAffiliates(): Promise<Affiliate[]> {
    return await db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
  }

  // Referrals and commissions
  async createReferral(insertReferral: InsertAffiliateReferral): Promise<AffiliateReferral> {
    const [referral] = await db.insert(affiliateReferrals).values(insertReferral).returning();
    return referral;
  }

  async getReferralsByAffiliate(affiliateDbId: string): Promise<AffiliateReferral[]> {
    return await db.select().from(affiliateReferrals)
      .where(eq(affiliateReferrals.affiliateDbId, affiliateDbId))
      .orderBy(desc(affiliateReferrals.createdAt));
  }

  async updateReferralStatus(referralId: string, status: string, projectValue?: string, serenityRewards?: string): Promise<void> {
    const updates: any = { status };
    
    if (projectValue) {
      updates.projectValue = projectValue;
      updates.commissionAmount = (parseFloat(projectValue) * 0.15).toFixed(2);
      updates.conversionDate = new Date();
    }
    if (serenityRewards) {
      updates.serenityRewardsAwarded = serenityRewards;
    }
    
    await db.update(affiliateReferrals)
      .set(updates)
      .where(eq(affiliateReferrals.id, referralId));
  }

  // Serenity Rewards system
  async createSerenityRewardsTransaction(insertTransaction: InsertSerenityRewardsTransaction): Promise<SerenityRewardsTransaction> {
    const [transaction] = await db.insert(serenityRewardsTransactions).values(insertTransaction).returning();
    return transaction;
  }

  async getSerenityRewardsByAffiliate(affiliateDbId: string): Promise<SerenityRewardsTransaction[]> {
    return await db.select().from(serenityRewardsTransactions)
      .where(eq(serenityRewardsTransactions.affiliateDbId, affiliateDbId))
      .orderBy(desc(serenityRewardsTransactions.createdAt));
  }

  // Gamification
  async createCompetition(insertCompetition: InsertAffiliateCompetition): Promise<AffiliateCompetition> {
    const [competition] = await db.insert(affiliateCompetitions).values(insertCompetition).returning();
    return competition;
  }

  async getActiveCompetitions(): Promise<AffiliateCompetition[]> {
    const now = new Date();
    return await db.select().from(affiliateCompetitions)
      .where(eq(affiliateCompetitions.isActive, true))
      .orderBy(affiliateCompetitions.startDate);
  }

  async updateCompetitionScore(affiliateDbId: string, competitionId: string, score: number): Promise<void> {
    // Implementation for competition entries would go here
    // For now, this is a placeholder
  }

  // Appointment management methods
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values(insertAppointment).returning();
    return appointment;
  }

  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(desc(appointments.createdAt));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<void> {
    await db.update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointments.id, id));
  }

  // Blog management methods
  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db.insert(blogPosts).values(insertPost).returning();
    return post;
  }

  async getBlogPosts(category?: string): Promise<BlogPost[]> {
    if (category) {
      return await db.select().from(blogPosts)
        .where(eq(blogPosts.category, category))
        .orderBy(desc(blogPosts.publishedAt));
    }
    return await db.select().from(blogPosts)
      .orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    return post;
  }

  async updateBlogPostViews(id: string): Promise<void> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (post) {
      await db.update(blogPosts)
        .set({ viewCount: (post.viewCount || 0) + 1 })
        .where(eq(blogPosts.id, id));
    }
  }

  async likeBlogPost(id: string): Promise<void> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (post) {
      await db.update(blogPosts)
        .set({ likes: (post.likes || 0) + 1 })
        .where(eq(blogPosts.id, id));
    }
  }

  async getFeaturedPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(eq(blogPosts.isFeatured, true))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(4);
  }

  // Email Campaign management methods
  async createEmailCampaign(insertCampaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [campaign] = await db.insert(emailCampaigns).values(insertCampaign).returning();
    return campaign;
  }

  async getEmailCampaigns(): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: string): Promise<EmailCampaign | undefined> {
    const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
    return campaign;
  }

  async getEmailCampaignByLeadId(leadId: string): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns)
      .where(eq(emailCampaigns.leadId, leadId))
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async getActiveCampaigns(): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns)
      .where(eq(emailCampaigns.status, 'active'));
  }

  async updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined> {
    const [updated] = await db.update(emailCampaigns)
      .set(updates)
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updated;
  }

  async pauseEmailCampaign(id: string): Promise<void> {
    await db.update(emailCampaigns)
      .set({ status: 'paused' })
      .where(eq(emailCampaigns.id, id));
  }

  async resumeEmailCampaign(id: string): Promise<void> {
    await db.update(emailCampaigns)
      .set({ status: 'active' })
      .where(eq(emailCampaigns.id, id));
  }

  // Campaign History methods
  async createCampaignHistory(insertHistory: InsertCampaignHistory): Promise<CampaignHistory> {
    const [history] = await db.insert(campaignHistory).values(insertHistory).returning();
    return history;
  }

  async getCampaignHistory(campaignId: string): Promise<CampaignHistory[]> {
    return await db.select().from(campaignHistory)
      .where(eq(campaignHistory.campaignId, campaignId))
      .orderBy(desc(campaignHistory.sentAt));
  }

  async getCampaignHistoryByLead(leadId: string): Promise<CampaignHistory[]> {
    return await db.select().from(campaignHistory)
      .where(eq(campaignHistory.leadId, leadId))
      .orderBy(desc(campaignHistory.sentAt));
  }

  async updateCampaignHistory(id: string, updates: Partial<CampaignHistory>): Promise<void> {
    await db.update(campaignHistory)
      .set(updates)
      .where(eq(campaignHistory.id, id));
  }

  async trackEmailOpen(historyId: string): Promise<void> {
    const [history] = await db.select().from(campaignHistory)
      .where(eq(campaignHistory.id, historyId));
    
    if (history) {
      await db.update(campaignHistory)
        .set({ 
          openCount: (history.openCount || 0) + 1,
          openedAt: history.openedAt || new Date()
        })
        .where(eq(campaignHistory.id, historyId));
    }
  }

  async trackEmailClick(historyId: string, url?: string): Promise<void> {
    const [history] = await db.select().from(campaignHistory)
      .where(eq(campaignHistory.id, historyId));
    
    if (history) {
      const clicks = (history.clickedLinks as string[]) || [];
      if (url) clicks.push(url);
      
      await db.update(campaignHistory)
        .set({ 
          clickCount: (history.clickCount || 0) + 1,
          clickedAt: history.clickedAt || new Date(),
          clickedLinks: clicks
        })
        .where(eq(campaignHistory.id, historyId));
    }
  }

  async handleUnsubscribe(leadId: string, campaignId?: string): Promise<void> {
    if (campaignId) {
      // Unsubscribe from specific campaign
      await db.update(emailCampaigns)
        .set({ 
          unsubscribed: true, 
          status: 'stopped'
        })
        .where(eq(emailCampaigns.id, campaignId));
    } else {
      // Unsubscribe from all campaigns for this lead
      await db.update(emailCampaigns)
        .set({ 
          unsubscribed: true, 
          status: 'stopped'
        })
        .where(eq(emailCampaigns.leadId, leadId));
    }
  }

  // Email Thread management methods
  async createEmailThread(insertThread: InsertEmailThread): Promise<EmailThread> {
    const [thread] = await db.insert(emailThreads).values(insertThread).returning();
    return thread;
  }

  async getEmailThreads(): Promise<EmailThread[]> {
    return await db.select().from(emailThreads).orderBy(desc(emailThreads.updatedAt));
  }

  async getEmailThreadsByLead(leadId: string): Promise<EmailThread[]> {
    return await db.select().from(emailThreads)
      .where(eq(emailThreads.leadId, leadId))
      .orderBy(desc(emailThreads.lastMessageDate));
  }

  async getEmailThreadById(id: string): Promise<EmailThread | undefined> {
    const [thread] = await db.select().from(emailThreads).where(eq(emailThreads.id, id));
    return thread;
  }

  async getEmailThreadByGmailId(threadId: string): Promise<EmailThread | undefined> {
    const [thread] = await db.select().from(emailThreads).where(eq(emailThreads.threadId, threadId));
    return thread;
  }

  async updateEmailThread(id: string, updates: Partial<EmailThread>): Promise<EmailThread | undefined> {
    const [updated] = await db.update(emailThreads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailThreads.id, id))
      .returning();
    return updated;
  }

  async incrementUnreadCount(threadId: string): Promise<void> {
    const [thread] = await db.select().from(emailThreads).where(eq(emailThreads.id, threadId));
    if (thread) {
      await db.update(emailThreads)
        .set({ unreadCount: (thread.unreadCount || 0) + 1, updatedAt: new Date() })
        .where(eq(emailThreads.id, threadId));
    }
  }

  async markThreadAsRead(threadId: string): Promise<void> {
    await db.update(emailThreads)
      .set({ unreadCount: 0, updatedAt: new Date() })
      .where(eq(emailThreads.id, threadId));
  }

  // Email Activity management methods
  async createEmailActivity(insertActivity: InsertEmailActivity): Promise<EmailActivity> {
    const [activity] = await db.insert(emailActivities).values(insertActivity).returning();
    return activity;
  }

  async getEmailActivities(): Promise<EmailActivity[]> {
    return await db.select().from(emailActivities).orderBy(desc(emailActivities.createdAt));
  }

  async getEmailActivitiesByLead(leadId: string): Promise<EmailActivity[]> {
    return await db.select().from(emailActivities)
      .where(eq(emailActivities.leadId, leadId))
      .orderBy(desc(emailActivities.createdAt));
  }

  async getEmailActivitiesByThread(threadId: string): Promise<EmailActivity[]> {
    return await db.select().from(emailActivities)
      .where(eq(emailActivities.threadId, threadId))
      .orderBy(emailActivities.createdAt); // Chronological order for threads
  }

  async getEmailActivityByMessageId(messageId: string): Promise<EmailActivity | undefined> {
    const [activity] = await db.select().from(emailActivities)
      .where(eq(emailActivities.messageId, messageId));
    return activity;
  }

  async updateEmailActivity(id: string, updates: Partial<EmailActivity>): Promise<EmailActivity | undefined> {
    const [updated] = await db.update(emailActivities)
      .set(updates)
      .where(eq(emailActivities.id, id))
      .returning();
    return updated;
  }

  async trackEmailOpen(activityId: string): Promise<void> {
    await db.update(emailActivities)
      .set({ openedAt: new Date() })
      .where(eq(emailActivities.id, activityId));
  }

  async trackEmailClick(activityId: string, url: string): Promise<void> {
    const [activity] = await db.select().from(emailActivities)
      .where(eq(emailActivities.id, activityId));
    
    if (activity) {
      const clicks = (activity.clickedLinks as any[]) || [];
      clicks.push({ url, timestamp: new Date() });
      
      await db.update(emailActivities)
        .set({ clickedLinks: clicks })
        .where(eq(emailActivities.id, activityId));
    }
  }

  async getRecentActivities(limit: number): Promise<EmailActivity[]> {
    return await db.select().from(emailActivities)
      .orderBy(desc(emailActivities.createdAt))
      .limit(limit);
  }

  // Media management methods
  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const [mediaItem] = await db.insert(media).values(insertMedia).returning();
    return mediaItem;
  }

  async getMedia(filters?: { type?: string; category?: string; isPublic?: boolean }): Promise<Media[]> {
    let query = db.select().from(media);
    
    // Apply filters if provided
    // Note: Drizzle doesn't support dynamic where clauses easily, so we'll fetch all and filter
    const results = await query.orderBy(desc(media.createdAt));
    
    if (!filters) return results;
    
    return results.filter(item => {
      if (filters.type && item.type !== filters.type) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.isPublic !== undefined && item.isPublic !== filters.isPublic) return false;
      return true;
    });
  }

  async getMediaById(id: string): Promise<Media | undefined> {
    const [mediaItem] = await db.select().from(media).where(eq(media.id, id));
    return mediaItem;
  }

  async getMediaByLeadId(leadId: string): Promise<Media[]> {
    return await db.select().from(media)
      .where(eq(media.leadId, leadId))
      .orderBy(desc(media.createdAt));
  }

  async updateMedia(id: string, updates: Partial<Media>): Promise<Media | undefined> {
    const [updated] = await db.update(media)
      .set(updates)
      .where(eq(media.id, id))
      .returning();
    return updated;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const deleted = await db.delete(media).where(eq(media.id, id));
    return !!deleted;
  }

  async getPublicMedia(category?: string): Promise<Media[]> {
    const results = await db.select().from(media)
      .where(eq(media.isPublic, true))
      .orderBy(media.order, desc(media.createdAt));
    
    if (!category) return results;
    
    return results.filter(item => item.category === category);
  }

  async updateMediaOrder(id: string, order: number): Promise<void> {
    await db.update(media)
      .set({ order })
      .where(eq(media.id, id));
  }

}

// Use database storage in production
export const storage = new DatabaseStorage();
