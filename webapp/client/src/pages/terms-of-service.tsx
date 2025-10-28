import { ArrowLeft, Gavel, Shield, AlertTriangle, FileText, DollarSign, Clock, CloudRain, Hammer } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
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
          <h1 className="text-4xl font-bold text-navy mb-8">Terms of Service</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-900">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()} | 
              <strong> Last Updated:</strong> {new Date().toLocaleDateString()} | 
              <strong> Version:</strong> 2.0
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-amber-900">
              <strong>⚠️ Important:</strong> These Terms of Service constitute a legally binding agreement. Please read carefully before using our services or entering into any construction agreement.
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">1. Acceptance of Terms</h2>
              <p>By accessing and using Serenity Custom Pools LLC's ("Company," "we," "us," or "our") website and services, you ("Customer," "you," or "your") agree to be bound by these Terms of Service, our Privacy Policy, and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site and our services.</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-sm font-semibold">Electronic Agreement:</p>
                <p className="text-sm mt-1">You agree that these Terms of Service and any other agreements we provide to you in electronic format are equivalent to written, signed documents.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <Hammer className="w-6 h-6 text-gold" />
                2. Services Offered
              </h2>
              <p>Serenity Custom Pools LLC provides luxury pool construction, design, and outdoor living space services in North Georgia. Our services include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Custom pool design and construction</li>
                <li>Spa and hot tub installation</li>
                <li>Outdoor living space development</li>
                <li>Pool renovation and upgrades</li>
                <li>Hardscaping and landscaping</li>
                <li>Pool equipment installation and upgrades</li>
                <li>Consultation and design services</li>
                <li>Project management and coordination</li>
              </ul>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                <p className="text-sm"><strong>Note:</strong> Maintenance and ongoing service agreements are governed by separate service contracts.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">3. Project Agreements and Contracts</h2>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Initial Consultations</h3>
                <p>Initial consultations are provided to assess your project needs. These consultations:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>May include preliminary design concepts and budget estimates</li>
                  <li>Are non-binding until a formal contract is executed</li>
                  <li>May be subject to consultation fees as communicated in advance</li>
                </ul>
                
                <h3 className="text-xl font-medium text-navy">Formal Contracts</h3>
                <p>All construction work requires a signed contract that will detail:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Project Scope:</strong> Detailed specifications, materials, and work to be performed</li>
                  <li><strong>Timeline:</strong> Estimated start date, milestones, and substantial completion date</li>
                  <li><strong>Payment Schedule:</strong> Down payment, progress payments, and final payment terms</li>
                  <li><strong>Warranties:</strong> Specific warranty terms for workmanship and materials</li>
                  <li><strong>Change Orders:</strong> Procedures for modifications to the original scope</li>
                  <li><strong>Permits and Approvals:</strong> Responsibilities for obtaining necessary permits</li>
                </ul>

                <h3 className="text-xl font-medium text-navy mt-6">Estimates and Pricing</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">Important Disclaimers:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-800">
                    <li>Initial estimates are preliminary and subject to change based on site conditions, final design, and material selections</li>
                    <li>Verbal estimates or quotes are not binding</li>
                    <li>Final pricing will be established in the written contract</li>
                    <li>Estimates are valid for 30 days unless otherwise specified</li>
                    <li>Prices may be adjusted for changes in material costs exceeding 10% between estimate and contract execution</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-gold" />
                4. Payment Terms
              </h2>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Payment Schedule</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Down Payment:</strong> Typically 20-30% upon contract signing</li>
                  <li><strong>Progress Payments:</strong> Based on completion of specified milestones</li>
                  <li><strong>Final Payment:</strong> Due upon substantial completion and final inspection</li>
                  <li><strong>Retention:</strong> 5-10% may be retained until all punch list items are completed</li>
                </ul>

                <h3 className="text-xl font-medium text-navy">Payment Terms</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payments are due within 7 days of invoice date unless otherwise specified</li>
                  <li>Late payments incur interest at 1.5% per month or the maximum legal rate</li>
                  <li>Work may be suspended for accounts more than 15 days past due</li>
                  <li>Customer is responsible for all collection costs, including attorney fees</li>
                  <li>No warranty claims will be honored while payments are outstanding</li>
                </ul>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="text-sm font-semibold">Lien Rights:</p>
                  <p className="text-sm mt-1">We retain all lien rights under Georgia law. Failure to pay may result in a mechanics lien being placed on your property.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">5. Change Orders and Modifications</h2>
              
              <div className="space-y-4">
                <p>Any changes to the original contract scope must be documented in a written change order that includes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Detailed description of the change</li>
                  <li>Cost impact (increase or decrease)</li>
                  <li>Schedule impact (if any)</li>
                  <li>Customer signature and approval</li>
                </ul>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">Change Order Policy:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Verbal change requests are not binding</li>
                    <li>Work will not proceed on changes until written approval is received</li>
                    <li>Change orders may include administrative fees (minimum $250)</li>
                    <li>Customer-requested changes may affect warranties</li>
                    <li>Cumulative changes exceeding 20% of original contract may require contract renegotiation</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-gold" />
                6. Warranties and Disclaimers
              </h2>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Construction Warranties</h3>
                <p>We provide the following standard warranties:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Structural Work:</strong> 10 years on pool shell and structural components</li>
                  <li><strong>Plumbing:</strong> 2 years on underground plumbing</li>
                  <li><strong>Equipment:</strong> Manufacturer's warranty (typically 1-3 years)</li>
                  <li><strong>Tile and Coping:</strong> 2 years on installation</li>
                  <li><strong>Plaster/Finish:</strong> 1 year on application (material warranty per manufacturer)</li>
                  <li><strong>Electrical:</strong> 1 year on installation</li>
                </ul>

                <h3 className="text-xl font-medium text-navy mt-6">Warranty Exclusions</h3>
                <p className="font-semibold">Warranties DO NOT cover:</p>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Normal wear and tear or fading</li>
                  <li>Damage from improper maintenance or chemical imbalance</li>
                  <li>Acts of God, extreme weather, earthquakes, or flooding</li>
                  <li>Damage from ground movement, settling, or hydrostatic pressure</li>
                  <li>Modifications or repairs by others</li>
                  <li>Damage from misuse, abuse, or negligence</li>
                  <li>Staining from minerals, metals, or organic materials</li>
                  <li>Damage from pets or wildlife</li>
                  <li>Freeze damage (customer responsible for winterization)</li>
                </ul>

                <h3 className="text-xl font-medium text-navy mt-6">Estimate and Timeline Disclaimers</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">IMPORTANT DISCLAIMERS:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Completion dates are estimates only and not guaranteed</li>
                    <li>We are not liable for delays beyond our reasonable control</li>
                    <li>Weather delays do not constitute a breach of contract</li>
                    <li>Permit or inspection delays are not our responsibility</li>
                    <li>Online design tools and visualizations are approximations only</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-gold" />
                7. Limitation of Liability
              </h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-bold text-red-900 mb-2">LIMITATION OF LIABILITY FOR CONSTRUCTION PROJECTS:</p>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>
                    <strong>Maximum Liability:</strong> Our total liability for any claim arising from our services shall not exceed the total amount paid by the customer for the specific project giving rise to the claim.
                  </li>
                  <li>
                    <strong>Consequential Damages:</strong> IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Lost profits or revenue</li>
                      <li>Loss of use of property</li>
                      <li>Costs of substitute facilities</li>
                      <li>Diminution in property value beyond repair costs</li>
                      <li>Emotional distress or mental anguish</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Third-Party Claims:</strong> Customer agrees to indemnify and hold us harmless from any third-party claims arising from the project.
                  </li>
                  <li>
                    <strong>Known Risks:</strong> Customer acknowledges construction involves inherent risks including property damage, delays, and cost overruns.
                  </li>
                  <li>
                    <strong>Insurance:</strong> Customer is responsible for maintaining adequate property and liability insurance during construction.
                  </li>
                </ol>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-sm font-semibold">Professional Liability:</p>
                <p className="text-sm mt-1">Design services are provided in good faith but without guarantee of approval by authorities or exact replication of visualizations.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <CloudRain className="w-6 h-6 text-gold" />
                8. Force Majeure
              </h2>
              
              <p>Neither party shall be liable for any failure or delay in performance due to circumstances beyond reasonable control, including but not limited to:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-navy mb-2">Natural Events</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Severe weather conditions</li>
                    <li>Floods, hurricanes, tornadoes</li>
                    <li>Earthquakes or ground movement</li>
                    <li>Extended rainfall preventing work</li>
                    <li>Extreme temperatures</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-navy mb-2">External Factors</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Government actions or permit delays</li>
                    <li>Labor strikes or shortages</li>
                    <li>Material shortages or allocation</li>
                    <li>Transportation disruptions</li>
                    <li>Pandemic or health emergencies</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                <p className="text-sm font-semibold">Force Majeure Procedures:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm mt-1">
                  <li>Affected party must promptly notify the other party</li>
                  <li>Timeline will be extended by the duration of the force majeure event</li>
                  <li>Parties will work together to mitigate impacts</li>
                  <li>If delay exceeds 90 days, either party may terminate without penalty</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <Gavel className="w-6 h-6 text-gold" />
                9. Dispute Resolution and Arbitration
              </h2>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Mandatory Arbitration</h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">YOU AGREE THAT ALL DISPUTES SHALL BE RESOLVED THROUGH BINDING ARBITRATION:</p>
                  <ol className="list-decimal pl-5 space-y-2 text-sm">
                    <li>All disputes shall be resolved through binding arbitration under the rules of the American Arbitration Association</li>
                    <li>Arbitration shall take place in Cherokee County, Georgia</li>
                    <li>The arbitrator's decision shall be final and binding</li>
                    <li>Each party bears its own attorney fees unless otherwise awarded</li>
                    <li>Claims must be brought individually (no class actions)</li>
                  </ol>
                </div>

                <h3 className="text-xl font-medium text-navy">Dispute Resolution Process</h3>
                <p>Before initiating arbitration, parties agree to follow this process:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li><strong>Direct Negotiation:</strong> 30 days to resolve through good faith discussion</li>
                  <li><strong>Mediation:</strong> If negotiation fails, non-binding mediation within 60 days</li>
                  <li><strong>Arbitration:</strong> If mediation fails, binding arbitration as described above</li>
                </ol>

                <h3 className="text-xl font-medium text-navy mt-4">Exceptions to Arbitration</h3>
                <p>The following matters are not subject to arbitration:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Mechanics lien enforcement</li>
                  <li>Small claims court matters (under $15,000)</li>
                  <li>Injunctive relief for intellectual property violations</li>
                  <li>Collection of undisputed amounts</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">10. Customer Responsibilities</h2>
              
              <p>Customer agrees to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate property information and surveys</li>
                <li>Obtain HOA approvals if required</li>
                <li>Ensure property access during scheduled work times</li>
                <li>Protect interior furnishings from construction impacts</li>
                <li>Maintain proper insurance coverage</li>
                <li>Make timely decisions on selections and change orders</li>
                <li>Provide safe working conditions free from hazards</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Pay invoices according to payment terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">11. Affiliate Program Terms</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Commission Structure</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>15% commission on completed projects from valid referrals</li>
                  <li>50 Serenity Rewards for non-converting consultations</li>
                  <li>Commissions paid after project completion and payment</li>
                  <li>$500 minimum payment threshold</li>
                  <li>Commissions forfeit if affiliate violates terms</li>
                </ul>
                
                <h3 className="text-xl font-medium text-navy">Affiliate Obligations</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Truthful representation of services</li>
                  <li>FTC disclosure compliance</li>
                  <li>No misleading advertising</li>
                  <li>Maintain confidentiality</li>
                  <li>Independent contractor status (not employee)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">12. Intellectual Property</h2>
              <div className="space-y-4">
                <p>All content, designs, and materials created by us remain our property until fully paid. This includes:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Custom pool designs and plans</li>
                  <li>3D renderings and visualizations</li>
                  <li>Marketing materials and photographs</li>
                  <li>Proprietary construction methods</li>
                </ul>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold">License to Use:</p>
                  <p className="text-sm mt-1">Upon full payment, customer receives a non-exclusive license to use designs for the specific project only. Designs may not be replicated or shared without permission.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">13. Indemnification</h2>
              <p>Customer agrees to indemnify, defend, and hold harmless Serenity Custom Pools LLC, its officers, directors, employees, and agents from and against any claims, damages, losses, and expenses arising from:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Customer's breach of these terms</li>
                <li>Customer's violation of any law or third-party rights</li>
                <li>Property conditions not disclosed to us</li>
                <li>Changes made by customer or third parties</li>
                <li>Customer's negligence or misconduct</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">14. Termination</h2>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Termination by Customer</h3>
                <p>Customer may terminate for convenience with written notice, subject to:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Payment for all work completed and materials ordered</li>
                  <li>20% termination fee on uncompleted portion</li>
                  <li>Reimbursement of demobilization costs</li>
                </ul>

                <h3 className="text-xl font-medium text-navy">Termination by Company</h3>
                <p>We may terminate for:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Non-payment beyond 30 days</li>
                  <li>Customer breach of contract</li>
                  <li>Unsafe working conditions</li>
                  <li>Discovery of hazardous materials</li>
                  <li>Force majeure exceeding 90 days</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">15. Governing Law and Venue</h2>
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                <p>These Terms are governed by Georgia law without regard to conflict of law principles. Exclusive venue for any disputes not subject to arbitration shall be the state and federal courts located in Cherokee County, Georgia. You waive any objection to jurisdiction and venue in such courts.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">16. Miscellaneous Provisions</h2>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-navy">Entire Agreement</h4>
                  <p className="text-sm">These Terms and any project contract constitute the entire agreement between parties.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-navy">Severability</h4>
                  <p className="text-sm">If any provision is deemed invalid, the remaining provisions continue in full force.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-navy">Waiver</h4>
                  <p className="text-sm">No waiver is effective unless in writing and signed by the waiving party.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-navy">Assignment</h4>
                  <p className="text-sm">Customer may not assign rights without our written consent. We may assign to successors or affiliates.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-navy">Survival</h4>
                  <p className="text-sm">Provisions relating to payment, warranties, liability, and disputes survive termination.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">17. Contact Information</h2>
              <p>For questions about these Terms of Service or to initiate dispute resolution:</p>
              <div className="bg-gold/10 border border-gold/20 rounded-lg p-6 mt-4">
                <p><strong>Serenity Custom Pools LLC</strong></p>
                <p><strong>Legal Department</strong></p>
                <p>Email: legal@serenitycustompools.com</p>
                <p>General Email: info@serenitycustompools.com</p>
                <p>Phone: 1 (678) 300-8949</p>
                <p>Address: North Georgia Service Area</p>
                <p className="mt-3 text-sm">
                  <strong>Business Hours:</strong> Monday-Friday, 8:00 AM - 5:00 PM EST
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">18. Changes to Terms</h2>
              <p>We reserve the right to modify these Terms of Service at any time. Changes will be effective upon posting to our website. For existing contracts, the terms in effect at contract signing will govern unless both parties agree to modifications in writing. Your continued use of our website after changes constitutes acceptance of modified terms.</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold">Notification of Changes:</p>
                <p className="text-sm mt-1">Material changes will be announced via website banner for 30 days. We recommend reviewing these terms periodically.</p>
              </div>
            </section>

            <section className="border-t-2 border-gold pt-8">
              <h2 className="text-2xl font-semibold text-navy mb-4">Acknowledgment</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-sm mb-4">
                  By using our services, requesting a quote, or entering into a contract with Serenity Custom Pools LLC, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </p>
                <p className="text-sm font-semibold">
                  These Terms of Service were last updated on {new Date().toLocaleDateString()} and supersede all previous versions.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}