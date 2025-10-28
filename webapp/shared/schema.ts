import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  city: text("city"),
  state: text("state"),
  projectType: text("project_type"),
  budgetRange: text("budget_range"),
  message: text("message"),
  source: text("source").notNull(), // 'hero', 'lead-magnet', 'contact', 'chatbot', 'affiliate', 'voice-call'
  affiliateId: text("affiliate_id"), // 6-digit affiliate ID if from affiliate
  metadata: jsonb("metadata"),
  isFromVoiceCall: boolean("is_from_voice_call").default(false), // Track if lead came from voice conversation
  voiceCallId: varchar("voice_call_id"), // Reference to the voice call that created this lead
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

// Voice Call Tracking Table
export const voiceCalls = pgTable("voice_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id),
  sessionId: text("session_id").notNull(), // Session ID from the voice service
  callDate: timestamp("call_date").notNull().default(sql`now()`),
  duration: integer("duration").notNull(), // Duration in seconds
  fullTranscript: jsonb("full_transcript").notNull(), // Array of {speaker: 'user'|'assistant', text: string, timestamp?: string}
  transcriptSummary: text("transcript_summary"), // AI-generated summary of the conversation
  leadDataCaptured: jsonb("lead_data_captured"), // Captured lead details {firstName, lastName, email, phone, projectScope, budget, location, timeline}
  groundingSources: jsonb("grounding_sources"), // Array of sources used during the conversation
  status: text("status").notNull().default("completed"), // completed, abandoned, error
  audioRecordingUrl: text("audio_recording_url"), // URL to audio recording if available
  metadata: jsonb("metadata"), // Additional metadata
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Media Table for videos, images, and other content
export const media = pgTable("media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'image', 'video', 'document'
  url: text("url").notNull(), // URL to the media file
  thumbnailUrl: text("thumbnail_url"), // Thumbnail for videos/documents
  category: text("category"), // 'portfolio', 'testimonial', 'before-after', 'promotional'
  tags: jsonb("tags"), // Array of tags for categorization
  metadata: jsonb("metadata"), // Additional metadata (dimensions, duration, format, etc.)
  leadId: varchar("lead_id").references(() => leads.id), // Optional reference to lead
  uploadedBy: text("uploaded_by"), // Who uploaded it (user, agent, system)
  isPublic: boolean("is_public").default(true), // Whether media is publicly visible
  order: integer("order").default(0), // Display order for galleries
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Simplified Affiliate Marketing Tables
export const affiliates = pgTable("affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  company: text("company"),
  website: text("website"),
  affiliateId: text("affiliate_id").notNull().unique(), // Simple 6-digit ID code
  totalCommissions: decimal("total_commissions", { precision: 10, scale: 2 }).default("0.00"),
  totalSerenityRewards: decimal("total_serenity_rewards", { precision: 10, scale: 2 }).default("0.00"),
  lifetimeReferrals: integer("lifetime_referrals").default(0),
  lifetimeConsultations: integer("lifetime_consultations").default(0),
  status: text("status").notNull().default("active"), // active, suspended, inactive
  paymentMethod: text("payment_method"), // venmo, cashapp, paypal, mail
  paymentDetails: text("payment_details"), // username/email/address for payment method
  socialMediaHandle: text("social_media_handle"), // For gamification tracking
  notes: text("notes"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const affiliateReferrals = pgTable("affiliate_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateDbId: varchar("affiliate_db_id").notNull().references(() => affiliates.id),
  affiliateId: text("affiliate_id").notNull(), // The simple 6-digit code
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  type: text("type").notNull().default("consultation"), // consultation, sale
  status: text("status").notNull().default("pending"), // pending, consultation_completed, converted_to_sale, cancelled
  projectValue: decimal("project_value", { precision: 10, scale: 2 }), // Final project value if converted
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("15.00"), // 15% default commission
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  serenityRewardsAwarded: decimal("serenity_rewards_awarded", { precision: 10, scale: 2 }).default("0.00"),
  consultationDate: timestamp("consultation_date"),
  conversionDate: timestamp("conversion_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  referralId: varchar("referral_id").notNull().references(() => affiliateReferrals.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // referral, bonus, adjustment
  status: text("status").notNull().default("pending"), // pending, paid, cancelled
  paidDate: timestamp("paid_date"),
  paymentMethod: text("payment_method"),
  transactionId: text("transaction_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const affiliatePayouts = pgTable("affiliate_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commissionIds: jsonb("commission_ids").notNull(), // array of commission IDs included
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  transactionId: text("transaction_id"),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Email Thread and Activity Tracking Tables
export const emailThreads = pgTable("email_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: text("gmail_thread_id").notNull().unique(), // Gmail thread ID - maps to gmail_thread_id column
  leadId: varchar("lead_id").references(() => leads.id),
  subject: text("subject"),
  lastMessageDate: timestamp("last_message_date").notNull(),
  messageCount: integer("message_count").default(0),
  unreadCount: integer("unread_count").default(0),
  labels: jsonb("labels"), // Array of Gmail labels
  participants: jsonb("participants"), // Array of email addresses
  snippet: text("snippet"), // Preview of latest message
  status: text("status").default("active"), // active, archived, spam
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const emailActivities = pgTable("email_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id),
  threadId: varchar("thread_id").references(() => emailThreads.id),
  messageId: text("message_id").notNull().unique(), // Gmail message ID
  activityType: text("activity_type").notNull(), // sent, received, opened, clicked, bounced, replied
  direction: text("direction"), // inbound, outbound
  fromEmail: text("from_email"),
  toEmail: text("to_email"),
  subject: text("subject"),
  textContent: text("text_content"),
  htmlContent: text("html_content"),
  attachments: jsonb("attachments"), // Array of attachment info
  isRead: boolean("is_read").default(false),
  openedAt: timestamp("opened_at"),
  clickedLinks: jsonb("clicked_links"), // Array of clicked URLs with timestamps
  repliedAt: timestamp("replied_at"),
  sentAt: timestamp("sent_at"),
  receivedAt: timestamp("received_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Gamification and Competition Tables
export const affiliateCompetitions = pgTable("affiliate_competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // social_media, referrals, sales
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  prize: text("prize").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const affiliateCompetitionEntries = pgTable("affiliate_competition_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull().references(() => affiliateCompetitions.id),
  affiliateDbId: varchar("affiliate_db_id").notNull().references(() => affiliates.id),
  score: integer("score").default(0),
  metrics: jsonb("metrics"), // Social media stats, etc.
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Blog Posts Table for SEO and Content Marketing
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  author: text("author").notNull(),
  authorTitle: text("author_title"),
  category: text("category").notNull(), // 'pool-design', 'backyard-lifestyle', 'maintenance', 'trends'
  tags: jsonb("tags").$type<string[]>().default([]),
  readTime: integer("read_time").notNull(), // in minutes
  viewCount: integer("view_count").default(0),
  likes: integer("likes").default(0),
  isPublished: boolean("is_published").default(true),
  isFeatured: boolean("is_featured").default(false),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  publishedAt: timestamp("published_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const serenityRewardsTransactions = pgTable("serenity_rewards_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateDbId: varchar("affiliate_db_id").notNull().references(() => affiliates.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // earned, redeemed, bonus
  reason: text("reason").notNull(),
  referralId: varchar("referral_id").references(() => affiliateReferrals.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});


export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertVoiceCallSchema = createInsertSchema(voiceCalls).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Affiliate schemas
export const insertAffiliateSchema = createInsertSchema(affiliates).omit({
  id: true,
  affiliateId: true,  // Generated by backend
  createdAt: true,
  updatedAt: true,
  totalCommissions: true,
  totalSerenityRewards: true,
  lifetimeReferrals: true,
  lifetimeConsultations: true,
});

export const insertAffiliateReferralSchema = createInsertSchema(affiliateReferrals).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateCommissionSchema = createInsertSchema(affiliateCommissions).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateCompetitionSchema = createInsertSchema(affiliateCompetitions).omit({
  id: true,
  createdAt: true,
});

export const insertSerenityRewardsTransactionSchema = createInsertSchema(serenityRewardsTransactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertVoiceCall = z.infer<typeof insertVoiceCallSchema>;
export type VoiceCall = typeof voiceCalls.$inferSelect;

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type AffiliateReferral = typeof affiliateReferrals.$inferSelect;
export type InsertAffiliateReferral = z.infer<typeof insertAffiliateReferralSchema>;
export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type InsertAffiliateCommission = z.infer<typeof insertAffiliateCommissionSchema>;
export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;
export type AffiliateCompetition = typeof affiliateCompetitions.$inferSelect;
export type InsertAffiliateCompetition = z.infer<typeof insertAffiliateCompetitionSchema>;
export type SerenityRewardsTransaction = typeof serenityRewardsTransactions.$inferSelect;
export type InsertSerenityRewardsTransaction = z.infer<typeof insertSerenityRewardsTransactionSchema>;


// Appointment Scheduling Tables
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentType: text("appointment_type").notNull().default("consultation"), // consultation, design_review, site_visit
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, completed, cancelled, no_show
  notes: text("notes"),
  projectType: text("project_type"), // pool_installation, renovation, repair
  estimatedBudget: text("estimated_budget"),
  affiliateId: text("affiliate_id"), // If booked through affiliate
  source: text("source").notNull(), // pool_visualizer, website, referral, phone
  remindersSent: integer("reminders_sent").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const appointmentAvailability = pgTable("appointment_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "17:00"
  isAvailable: boolean("is_available").default(true),
  maxAppointments: integer("max_appointments").default(8), // Max appointments per day
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const appointmentBlackouts = pgTable("appointment_blackouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blackoutDate: timestamp("blackout_date").notNull(),
  reason: text("reason"),
  isRecurring: boolean("is_recurring").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});


// Blog post schemas
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  viewCount: true,
  likes: true,
  publishedAt: true,
  updatedAt: true,
});

// Appointment schemas
export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  remindersSent: true,
});

export const insertAppointmentAvailabilitySchema = createInsertSchema(appointmentAvailability).omit({
  id: true,
  createdAt: true,
});


// Blog types
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

// Appointment types
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type AppointmentAvailability = typeof appointmentAvailability.$inferSelect;
export type InsertAppointmentAvailability = z.infer<typeof insertAppointmentAvailabilitySchema>;

// Email Campaign Tables
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  campaignType: text("campaign_type").notNull(), // welcome, reengagement, vip_fast_track
  status: text("status").notNull().default("active"), // active, paused, completed, stopped
  currentStep: integer("current_step").default(0),
  totalSteps: integer("total_steps").notNull(),
  lastSentAt: timestamp("last_sent_at"),
  nextSendAt: timestamp("next_send_at"),
  timezone: text("timezone").default("America/Los_Angeles"),
  metadata: jsonb("metadata"), // Store campaign-specific data
  enrolledAt: timestamp("enrolled_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
  unsubscribed: boolean("unsubscribed").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const campaignHistory = pgTable("campaign_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => emailCampaigns.id),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  emailType: text("email_type").notNull(), // welcome_day_1, welcome_day_3, etc.
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").notNull().default(sql`now()`),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  clickedLinks: jsonb("clicked_links"), // Array of clicked URLs
  emailProvider: text("email_provider").default("gmail"), // gmail, sendgrid
  messageId: text("message_id"), // Provider message ID for tracking
  metadata: jsonb("metadata"), // Store additional metrics
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Media schemas
export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  order: true,
});

// Media types
export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;

// Email Campaign schemas
export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentStep: true,
  unsubscribed: true,
});

export const insertCampaignHistorySchema = createInsertSchema(campaignHistory).omit({
  id: true,
  createdAt: true,
  openCount: true,
  clickCount: true,
});

// Email Campaign types
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type CampaignHistory = typeof campaignHistory.$inferSelect;
export type InsertCampaignHistory = z.infer<typeof insertCampaignHistorySchema>;

// Email Thread and Activity schemas
export const insertEmailThreadSchema = createInsertSchema(emailThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  messageCount: true,
  unreadCount: true,
});

export const insertEmailActivitySchema = createInsertSchema(emailActivities).omit({
  id: true,
  createdAt: true,
  openedAt: true,
  repliedAt: true,
  clickedLinks: true,
});

// Email Thread and Activity types
export type EmailThread = typeof emailThreads.$inferSelect;
export type InsertEmailThread = z.infer<typeof insertEmailThreadSchema>;
export type EmailActivity = typeof emailActivities.$inferSelect;
export type InsertEmailActivity = z.infer<typeof insertEmailActivitySchema>;
