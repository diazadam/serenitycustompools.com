import type { Express } from "express";
import { storage } from "./storage";
import { 
  insertAffiliateSchema,
  insertAffiliateReferralSchema,
  insertSerenityRewardsTransactionSchema,
  insertAffiliateCompetitionSchema
} from "@shared/schema";
import { notifyNewAffiliate } from "./services/notifications";
import { z } from "zod";

// Simplified Affiliate Management Routes
export function registerAffiliateRoutes(app: Express) {
  // Affiliate Registration - Simple 6-digit ID system
  app.post("/api/affiliates/register", async (req, res) => {
    try {
      const affiliateData = insertAffiliateSchema.parse({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        company: req.body.company || undefined,
        website: req.body.website || undefined,
        socialMediaHandle: req.body.socialMediaHandle || undefined,
        paymentMethod: req.body.paymentMethod,
        paymentDetails: req.body.paymentDetails,
      });
      
      const existingAffiliate = await storage.getAffiliateByEmail(affiliateData.email);
      if (existingAffiliate) {
        return res.status(409).json({ 
          success: false, 
          error: "An affiliate with this email already exists" 
        });
      }

      const affiliate = await storage.createAffiliate(affiliateData);
      
      // Send welcome notifications (don't await to avoid slowing down response)
      notifyNewAffiliate({
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        email: affiliate.email,
        affiliateId: affiliate.affiliateId
      });
      
      res.json({ 
        success: true, 
        affiliate: {
          id: affiliate.id,
          firstName: affiliate.firstName,
          lastName: affiliate.lastName,
          email: affiliate.email,
          affiliateId: affiliate.affiliateId,
          status: affiliate.status
        }
      });
    } catch (error) {
      console.error("Affiliate registration error:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof z.ZodError ? error.errors : "Registration failed" 
      });
    }
  });

  // Get all affiliates (Admin only)
  app.get("/api/affiliates", async (req, res) => {
    try {
      const affiliates = await storage.getAffiliates();
      res.json(affiliates);
    } catch (error) {
      console.error("Get affiliates error:", error);
      res.status(500).json({ message: "Failed to fetch affiliates" });
    }
  });

  // Get affiliate by ID
  app.get("/api/affiliates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const affiliate = await storage.getAffiliate(id);
      
      if (!affiliate) {
        return res.status(404).json({ success: false, error: "Affiliate not found" });
      }
      
      res.json({ success: true, affiliate });
    } catch (error) {
      console.error("Get affiliate error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch affiliate" });
    }
  });

  // Update affiliate status (Admin only)
  app.patch("/api/affiliates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedAffiliate = await storage.updateAffiliate(id, updates);
      
      if (!updatedAffiliate) {
        return res.status(404).json({ success: false, error: "Affiliate not found" });
      }
      
      res.json({ success: true, affiliate: updatedAffiliate });
    } catch (error) {
      console.error("Update affiliate error:", error);
      res.status(500).json({ success: false, error: "Failed to update affiliate" });
    }
  });

  // Get affiliate referrals
  app.get("/api/affiliates/:affiliateDbId/referrals", async (req, res) => {
    try {
      const { affiliateDbId } = req.params;
      const referrals = await storage.getReferralsByAffiliate(affiliateDbId);
      res.json({ success: true, referrals });
    } catch (error) {
      console.error("Get affiliate referrals error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch affiliate referrals" });
    }
  });

  // Update referral status - for consultations and sales
  app.patch("/api/referrals/:referralId", async (req, res) => {
    try {
      const { referralId } = req.params;
      const { status, projectValue, serenityRewards } = req.body;
      
      await storage.updateReferralStatus(referralId, status, projectValue, serenityRewards);
      
      // Award Serenity Rewards if consultation completed but no sale
      if (status === "consultation_completed" && serenityRewards) {
        // For now, we'll skip the Serenity Rewards transaction since we need to implement proper referral lookup
        // This will be added when we have a proper getReferralById method
        console.log(`Would award ${serenityRewards} Serenity Rewards for referral ${referralId}`);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Update referral status error:", error);
      res.status(500).json({ success: false, error: "Failed to update referral" });
    }
  });

  // Get Serenity Rewards balance for affiliate
  app.get("/api/affiliates/:affiliateDbId/serenity-rewards", async (req, res) => {
    try {
      const { affiliateDbId } = req.params;
      const transactions = await storage.getSerenityRewardsByAffiliate(affiliateDbId);
      
      // Calculate total balance
      const balance = transactions.reduce((total, transaction) => {
        return transaction.type === "earned" || transaction.type === "bonus"
          ? total + parseFloat(transaction.amount)
          : total - parseFloat(transaction.amount);
      }, 0);
      
      res.json({ success: true, transactions, balance });
    } catch (error) {
      console.error("Get Serenity Rewards error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch Serenity Rewards" });
    }
  });

  // Create competition (Admin only)
  app.post("/api/competitions", async (req, res) => {
    try {
      const competitionData = insertAffiliateCompetitionSchema.parse(req.body);
      const competition = await storage.createCompetition(competitionData);
      
      res.json({ success: true, competition });
    } catch (error) {
      console.error("Create competition error:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof z.ZodError ? error.errors : "Invalid competition data" 
      });
    }
  });

  // Get active competitions
  app.get("/api/competitions/active", async (req, res) => {
    try {
      const competitions = await storage.getActiveCompetitions();
      res.json({ success: true, competitions });
    } catch (error) {
      console.error("Get active competitions error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch competitions" });
    }
  });

  // Update competition score
  app.patch("/api/competitions/:competitionId/score", async (req, res) => {
    try {
      const { competitionId } = req.params;
      const { affiliateDbId, score } = req.body;
      
      await storage.updateCompetitionScore(affiliateDbId, competitionId, score);
      res.json({ success: true });
    } catch (error) {
      console.error("Update competition score error:", error);
      res.status(500).json({ success: false, error: "Failed to update score" });
    }
  });
}