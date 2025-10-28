import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AffiliateAgreement() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-navy hover:text-gold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-navy mb-8">Affiliate Agreement</h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
          </p>

          <div className="bg-gold/10 border border-gold/20 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-navy mb-2">🏆 The Greatest Affiliate Program in the United States</h2>
            <p className="text-sm">Join Serenity Custom Pools LLC's revolutionary affiliate program featuring simplified 15% commissions, Serenity Rewards rewards, and heavy gamification that makes earning addictive!</p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">1. Program Overview</h2>
              <p>Welcome to the Serenity Custom Pools LLC Affiliate Program - designed to be the most rewarding and engaging affiliate opportunity in the luxury pool industry. Our program features:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>15% Commission Rate:</strong> Simple percentage-based commissions like car sales/real estate</li>
                <li><strong>Serenity Rewards System:</strong> 50 points for consultations that don't convert</li>
                <li><strong>Heavy Gamification:</strong> Competitions, leaderboards, and social media tracking</li>
                <li><strong>Conversion-Only Payments:</strong> Commissions paid only on actual client conversions</li>
                <li><strong>Simple 6-Digit ID System:</strong> No complex referral links required</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">2. Commission Structure</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Primary Commissions</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p><strong>15% of Total Project Value</strong></p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Paid only after client project completion and final payment</li>
                    <li>No minimum project value requirements</li>
                    <li>No cap on commission amounts</li>
                    <li>Calculated on final project value after any adjustments</li>
                  </ul>
                </div>
                
                <h3 className="text-xl font-medium text-navy">Serenity Rewards</h3>
                <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
                  <p><strong>50 Serenity Rewards per Consultation</strong></p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Awarded for scheduled consultations that don't convert to sales</li>
                    <li>Can be redeemed toward your own Serenity Custom Pools LLC projects</li>
                    <li>Transferable within family (spouse, immediate family)</li>
                    <li>No expiration date on accumulated Serenity Rewards</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">3. Referral Process</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Simple ID System</h3>
                <p>Your unique 6-digit affiliate ID makes referrals easy:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Share your ID verbally, in text, or social media</li>
                  <li>Direct prospects to mention your ID when contacting us</li>
                  <li>No complex tracking links or cookies required</li>
                  <li>Works across all channels: phone, email, website</li>
                </ul>
                
                <h3 className="text-xl font-medium text-navy">Valid Referrals</h3>
                <p>To qualify for commission, referrals must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Mention your affiliate ID during initial contact</li>
                  <li>Not be existing Serenity Custom Pools LLC customers or active prospects</li>
                  <li>Complete a consultation and sign a construction contract</li>
                  <li>Complete their project and make final payment</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">4. Gamification & Competitions</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Monthly Competitions</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Top Referrer:</strong> Monthly prizes for most referrals</li>
                  <li><strong>Social Media Champion:</strong> Recognition for best promotional content</li>
                  <li><strong>Conversion King/Queen:</strong> Highest consultation-to-sale ratio</li>
                  <li><strong>Rookie of the Month:</strong> Best performance by new affiliates</li>
                </ul>
                
                <h3 className="text-xl font-medium text-navy">Leaderboards & Recognition</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Real-time leaderboards for all affiliates</li>
                  <li>Annual affiliate awards ceremony</li>
                  <li>Social media shout-outs for top performers</li>
                  <li>Exclusive "Elite Affiliate" status program</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">5. Payment Terms</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Commission Payments</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Paid within 30 days of project completion and final payment</li>
                  <li>Minimum payout threshold: $100</li>
                  <li>Payment methods: Venmo, CashApp, PayPal, or check</li>
                  <li>Detailed commission statements provided</li>
                </ul>
                
                <h3 className="text-xl font-medium text-navy">Tax Considerations</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>1099 forms issued for payments over $600 annually</li>
                  <li>Affiliates responsible for their own tax obligations</li>
                  <li>Business registration may be required for large volumes</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">6. Affiliate Obligations</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Professional Representation:</strong> Represent Serenity Custom Pools LLC professionally and accurately</li>
                <li><strong>Compliance:</strong> Follow all applicable advertising and marketing laws</li>
                <li><strong>Disclosure:</strong> Clearly disclose affiliate relationship to prospects</li>
                <li><strong>Approved Materials:</strong> Use only approved marketing materials and messages</li>
                <li><strong>No Spam:</strong> No unsolicited email or inappropriate marketing methods</li>
                <li><strong>Confidentiality:</strong> Protect proprietary business information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">7. Prohibited Activities</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-800 mb-2">The following activities will result in immediate termination:</p>
                <ul className="list-disc pl-6 space-y-2 text-red-700">
                  <li>False or misleading claims about services or pricing</li>
                  <li>Impersonating Serenity Custom Pools LLC employees</li>
                  <li>Trademark or copyright infringement</li>
                  <li>Spam, unsolicited communications, or illegal marketing</li>
                  <li>Competing directly with Serenity Custom Pools LLC services</li>
                  <li>Attempting to circumvent the referral tracking system</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">8. Program Changes & Termination</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Program Modifications</h3>
                <p>Serenity Custom Pools LLC reserves the right to modify this program with 30 days written notice. Changes affecting commission rates require 60 days notice.</p>
                
                <h3 className="text-xl font-medium text-navy">Termination</h3>
                <p>Either party may terminate this agreement with 30 days notice. Commissions earned prior to termination will be honored.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">9. Contact & Support</h2>
              <p>Questions about the affiliate program? We're here to help!</p>
              <div className="bg-gold/10 border border-gold/20 rounded-lg p-6 mt-4">
                <p><strong>Serenity Custom Pools LLC Affiliate Program</strong></p>
                <p>Email: affiliates@serenitycustompools.com</p>
                <p>Phone: 1 (678) 300-8949</p>
                <p>Dashboard: serenitycustompools.com/affiliate-dashboard</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">10. Agreement Acceptance</h2>
              <div className="bg-navy/5 border border-navy/20 rounded-lg p-6">
                <p>By participating in the Serenity Custom Pools LLC Affiliate Program, you acknowledge that you have read, understood, and agree to be bound by this Affiliate Agreement and all applicable terms and conditions.</p>
                <p className="mt-4 text-sm text-muted-foreground">This agreement is governed by the laws of the State of Georgia.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}