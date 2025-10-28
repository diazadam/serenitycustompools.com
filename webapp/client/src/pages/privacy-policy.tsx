import { ArrowLeft, Shield, Users, Globe, Clock, Database, FileText, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-navy mb-8">Privacy Policy</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-900">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()} | 
              <strong> GDPR & CCPA Compliant</strong> | 
              <strong> Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-gold" />
                1. Information We Collect
              </h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-navy">Personal Information</h3>
                <p>When you contact us for pool construction services, we may collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Name and contact information (email, phone, address)</li>
                  <li>Project details and preferences</li>
                  <li>Budget range and timeline information</li>
                  <li>Property details and measurements</li>
                  <li>IP address and device information (automatically collected)</li>
                  <li>Browsing behavior and interaction with our website</li>
                </ul>
                
                <h3 className="text-xl font-medium text-navy mt-6">Affiliate Information</h3>
                <p>For our affiliate program participants, we collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Contact and business information</li>
                  <li>Tax identification numbers (for commission reporting)</li>
                  <li>Payment method details for commission payments</li>
                  <li>Referral tracking data</li>
                  <li>Social media handles for gamification features</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-gold" />
                2. Legal Bases for Processing (GDPR)
              </h2>
              <p>We process your personal data under the following legal bases:</p>
              <div className="space-y-4 mt-4">
                <div className="bg-gray-50 border-l-4 border-gold p-4">
                  <h4 className="font-semibold text-navy">Consent (Article 6(1)(a) GDPR)</h4>
                  <p className="text-sm mt-1">For marketing communications, analytics cookies, and optional data collection.</p>
                </div>
                <div className="bg-gray-50 border-l-4 border-gold p-4">
                  <h4 className="font-semibold text-navy">Contract Performance (Article 6(1)(b) GDPR)</h4>
                  <p className="text-sm mt-1">To provide pool construction services, process orders, and manage affiliate relationships.</p>
                </div>
                <div className="bg-gray-50 border-l-4 border-gold p-4">
                  <h4 className="font-semibold text-navy">Legal Obligations (Article 6(1)(c) GDPR)</h4>
                  <p className="text-sm mt-1">For tax reporting, warranty obligations, and regulatory compliance.</p>
                </div>
                <div className="bg-gray-50 border-l-4 border-gold p-4">
                  <h4 className="font-semibold text-navy">Legitimate Interests (Article 6(1)(f) GDPR)</h4>
                  <p className="text-sm mt-1">For fraud prevention, security, and improving our services.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide pool construction and design services</li>
                <li>Respond to inquiries and schedule consultations</li>
                <li>Process affiliate registrations and manage commissions</li>
                <li>Send project updates and marketing communications (with consent)</li>
                <li>Improve our services and website functionality</li>
                <li>Comply with legal obligations and tax requirements</li>
                <li>Prevent fraud and maintain security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-gold" />
                4. Data Retention Periods
              </h2>
              <p>We retain your data for specific periods based on the purpose of processing:</p>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-navy">Customer Data</h4>
                    <p className="text-sm mt-1">7 years after project completion (warranty and tax obligations)</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-navy">Affiliate Data</h4>
                    <p className="text-sm mt-1">5 years after last activity (commission tracking)</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-navy">Marketing Data</h4>
                    <p className="text-sm mt-1">3 years or until consent withdrawn</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-navy">Cookie Data</h4>
                    <p className="text-sm mt-1">Up to 1 year (varies by cookie type)</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-navy">Website Analytics</h4>
                    <p className="text-sm mt-1">26 months (Google Analytics default)</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-navy">Email Communications</h4>
                    <p className="text-sm mt-1">3 years for business correspondence</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-gold" />
                5. Third-Party Processors
              </h2>
              <p>We work with trusted third-party service providers who process data on our behalf:</p>
              <div className="mt-4 space-y-3">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-navy">Service Provider</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-navy">Purpose</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-navy">Data Location</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm">Google Analytics</td>
                        <td className="px-4 py-3 text-sm">Website analytics and performance</td>
                        <td className="px-4 py-3 text-sm">United States</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Stripe</td>
                        <td className="px-4 py-3 text-sm">Payment processing</td>
                        <td className="px-4 py-3 text-sm">United States</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">OpenAI</td>
                        <td className="px-4 py-3 text-sm">AI-powered design tools</td>
                        <td className="px-4 py-3 text-sm">United States</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">SendGrid</td>
                        <td className="px-4 py-3 text-sm">Email communications</td>
                        <td className="px-4 py-3 text-sm">United States</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Twilio</td>
                        <td className="px-4 py-3 text-sm">SMS notifications</td>
                        <td className="px-4 py-3 text-sm">United States</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Notion</td>
                        <td className="px-4 py-3 text-sm">Project management</td>
                        <td className="px-4 py-3 text-sm">United States</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Neon (PostgreSQL)</td>
                        <td className="px-4 py-3 text-sm">Database hosting</td>
                        <td className="px-4 py-3 text-sm">United States</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-gold" />
                6. International Data Transfers
              </h2>
              <p>Your data may be transferred and processed in countries outside your location, primarily the United States. We ensure appropriate safeguards are in place:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Standard Contractual Clauses (SCCs):</strong> We use EU-approved SCCs for transfers from the EU/UK to third countries</li>
                <li><strong>Privacy Shield:</strong> Where applicable, we work with Privacy Shield certified providers</li>
                <li><strong>Adequacy Decisions:</strong> We prioritize transfers to countries with adequate data protection levels</li>
                <li><strong>Additional Safeguards:</strong> Technical and organizational measures including encryption and access controls</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">7. Information Sharing</h2>
              <p>We do not sell, trade, or rent your personal information. We may share information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> Contractors, suppliers, and professional services (under strict confidentiality agreements)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or legal process</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                <li><strong>Consent:</strong> When you provide explicit consent</li>
                <li><strong>Protection:</strong> To protect rights, property, or safety of our business and users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">8. Data Security</h2>
              <p>We implement comprehensive security measures to protect your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>256-bit SSL/TLS encryption for data transmission</li>
                <li>Encrypted database storage with regular backups</li>
                <li>Multi-factor authentication for administrative access</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Employee training on data protection and GDPR compliance</li>
                <li>Incident response procedures for data breaches</li>
                <li>Physical security measures for office locations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">9. Cookies and Tracking Technologies</h2>
              <p>Our website uses various types of cookies and tracking technologies:</p>
              <div className="space-y-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-navy">Necessary Cookies</h4>
                  <p className="text-sm mt-1">Essential for website functionality, security, and user authentication</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-navy">Analytics Cookies</h4>
                  <p className="text-sm mt-1">Google Analytics to understand website usage and improve our services</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-navy">Marketing Cookies</h4>
                  <p className="text-sm mt-1">Used for targeted advertising and measuring campaign effectiveness</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-navy">Functional Cookies</h4>
                  <p className="text-sm mt-1">Remember your preferences and enhance website functionality</p>
                </div>
              </div>
              <p className="mt-4">You can manage cookie preferences through our cookie consent banner or browser settings.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-gold" />
                10. Your Rights (GDPR & CCPA)
              </h2>
              <p>Under GDPR (for EU/UK residents) and CCPA (for California residents), you have the following rights:</p>
              
              <div className="mt-4 space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <h4 className="font-semibold text-navy mb-2">GDPR Rights (EU/UK Residents)</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><strong>Right to Access:</strong> Request copies of your personal data</li>
                    <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                    <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion of your data</li>
                    <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                    <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
                    <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                    <li><strong>Rights Related to Automated Decision-Making:</strong> Not be subject to solely automated decisions</li>
                    <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
                  </ul>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <h4 className="font-semibold text-navy mb-2">CCPA Rights (California Residents)</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><strong>Right to Know:</strong> Information about data collection and sharing practices</li>
                    <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                    <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information (we do not sell data)</li>
                    <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
                    <li><strong>Right to Correct:</strong> Request correction of inaccurate information</li>
                    <li><strong>Right to Limit Use:</strong> Limit use of sensitive personal information</li>
                  </ul>
                </div>
              </div>

              <p className="mt-4">To exercise any of these rights, please contact us using the information in Section 13. We will respond to your request within 30 days (GDPR) or 45 days (CCPA).</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">11. Children's Privacy</h2>
              <p>Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete such information.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">12. Affiliate Program Privacy</h2>
              <p>Specific to our affiliate program:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Commission data is kept strictly confidential</li>
                <li>Referral tracking uses secure, encrypted identifiers</li>
                <li>Competition and gamification data is anonymized when shared publicly</li>
                <li>Payment information is processed through PCI-compliant systems (Stripe)</li>
                <li>Tax information is retained per IRS requirements (7 years)</li>
                <li>Performance metrics are only shared with your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-gold" />
                13. Complaints and Supervisory Authorities
              </h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-navy mb-2">Your Right to Complain</h4>
                <p className="text-sm">If you believe we have not handled your personal data properly, you have the right to lodge a complaint with a supervisory authority.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-navy">For EU Residents:</h4>
                  <p className="text-sm mt-1">You may contact your local Data Protection Authority (DPA). Find your DPA at: 
                    <a href="https://edpb.europa.eu/about-edpb/board/members_en" className="text-gold hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                      edpb.europa.eu
                    </a>
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-navy">For UK Residents:</h4>
                  <p className="text-sm mt-1">Information Commissioner's Office (ICO)</p>
                  <p className="text-sm">Website: ico.org.uk | Helpline: 0303 123 1113</p>
                </div>

                <div>
                  <h4 className="font-semibold text-navy">For California Residents:</h4>
                  <p className="text-sm mt-1">California Attorney General's Office</p>
                  <p className="text-sm">Website: oag.ca.gov | Phone: (833) 942-1164</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">14. Contact Information & Data Protection Officer</h2>
              <p>For questions about this Privacy Policy, to exercise your rights, or for any privacy concerns:</p>
              <div className="bg-gold/10 border border-gold/20 rounded-lg p-6 mt-4">
                <p><strong>Serenity Custom Pools LLC</strong></p>
                <p><strong>Data Protection Contact:</strong> Privacy Officer</p>
                <p><strong>Email:</strong> privacy@serenitycustompools.com</p>
                <p><strong>General Email:</strong> info@serenitycustompools.com</p>
                <p><strong>Phone:</strong> 1 (678) 300-8949</p>
                <p><strong>Address:</strong> North Georgia Service Area</p>
                <p className="mt-3 text-sm"><strong>Response Time:</strong> We aim to respond to all privacy requests within 30 days</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">15. California Privacy Rights Notice</h2>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm font-semibold mb-2">California "Shine the Light" Law</p>
                <p className="text-sm">California residents may request information about disclosure of personal information to third parties for direct marketing purposes. We do not share personal information with third parties for their direct marketing purposes.</p>
                
                <p className="text-sm font-semibold mt-4 mb-2">Do Not Track Signals</p>
                <p className="text-sm">We do not currently respond to "Do Not Track" browser signals. However, you can manage tracking through our cookie consent settings.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-navy mb-4">16. Updates to This Policy</h2>
              <p>We may update this Privacy Policy to reflect changes in our practices, technology, legal requirements, or for other operational reasons. When we make material changes:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>We will update the "Effective Date" at the top of this policy</li>
                <li>For significant changes, we will provide prominent notice on our website</li>
                <li>We may notify you via email if you have provided contact information</li>
                <li>Continued use of our services after changes constitutes acceptance</li>
              </ul>
              <p className="mt-4">We recommend reviewing this policy periodically to stay informed about how we protect your information.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}