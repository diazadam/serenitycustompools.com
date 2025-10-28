import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  Star, 
  TrendingUp, 
  Award, 
  Target, 
  Gift,
  ArrowRight,
  CheckCircle,
  Droplets,
  Crown
} from "lucide-react";

export default function AffiliateLanding() {
  const [location] = useLocation();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Get referral code from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      // Store in localStorage for later use
      localStorage.setItem('referralCode', ref);
    }
  }, [location]);

  const tieredProgram = {
    tiers: [
      {
        name: "Pool Partner",
        rate: "5%",
        icon: "💧",
        description: "Starting tier - start earning immediately",
        consultationBonus: "$100",
        serenityRewards: "1,000 points",
        examples: [
          { project: "$50,000 Pool", commission: "$2,500" },
          { project: "$75,000 Pool + Spa", commission: "$3,750" },
          { project: "$100,000 Custom Pool", commission: "$5,000" }
        ]
      },
      {
        name: "Elite Partner",
        rate: "7%",
        icon: "⭐",
        description: "5+ deals per year OR $1M+ in annual sales",
        consultationBonus: "$150",
        serenityRewards: "1,500 points",
        examples: [
          { project: "$50,000 Pool", commission: "$3,500" },
          { project: "$75,000 Pool + Spa", commission: "$5,250" },
          { project: "$100,000 Custom Pool", commission: "$7,000" }
        ]
      },
      {
        name: "Platinum Partner",
        rate: "10%",
        icon: "👑",
        description: "10+ deals per year OR $2M+ in annual sales",
        consultationBonus: "$200",
        serenityRewards: "2,000 points",
        examples: [
          { project: "$50,000 Pool", commission: "$5,000" },
          { project: "$75,000 Pool + Spa", commission: "$7,500" },
          { project: "$100,000 Custom Pool", commission: "$10,000" }
        ]
      }
    ],
    serenityRewards: {
      amount: "50 Serenity Rewards Points",
      description: "Earn Serenity Rewards for consultations that don't convert to sales",
      usage: "Use toward your own Serenity Custom Pools projects or redeem for cash"
    },
    paymentMethods: ["Venmo", "Cash App", "PayPal", "Mailed Check"]
  };

  const gamificationFeatures = [
    {
      name: "Monthly Competitions",
      description: "Win prizes for most referrals, best social media engagement, highest conversion rates",
      icon: "🏆",
      color: "bg-yellow-500",
      features: ["TikTok contests", "Instagram challenges", "Referral leaderboards"]
    },
    {
      name: "Social Media Tracking",
      description: "Get points for posts about Serenity Custom Pools - likes, shares, and comments all count",
      icon: "📱",
      color: "bg-blue-500",
      features: ["Track your social engagement", "Bonus points for viral posts", "Monthly social media winners"]
    },
    {
      name: "Simple 6-Digit ID",
      description: "No complex links - just share your easy-to-remember 6-digit affiliate ID",
      icon: "🎯",
      color: "bg-green-500",
      features: ["Easy to share verbally", "Works on any form", "Simple tracking"]
    }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Tiered Commission System",
      description: "Earn 5% to 10% based on performance - grow your income as you refer more"
    },
    {
      icon: Gift,
      title: "Serenity Rewards Points",
      description: "Earn points for consultations that don't convert - use toward your own projects"
    },
    {
      icon: Users,
      title: "6-Digit ID System",
      description: "Easy to remember and share - no complicated referral links needed"
    },
    {
      icon: TrendingUp,
      title: "Gamified Experience",
      description: "Monthly competitions, social media tracking, and leaderboards"
    },
    {
      icon: Target,
      title: "Multiple Payment Options",
      description: "Get paid via Venmo, Cash App, PayPal, or mailed check"
    },
    {
      icon: Award,
      title: "Industry Leader",
      description: "Partner with North Georgia's premier luxury pool builder with 30+ years experience"
    }
  ];

  const successStories = [
    {
      name: "Michael R.",
      role: "Real Estate Agent",
      earnings: "$47,500",
      referrals: 8,
      serenityRewards: 150,
      testimonial: "The tiered commission system is incredible - I started at 5% and now earn 10% at Platinum. Plus I love earning Serenity Rewards for consultations!"
    },
    {
      name: "Sarah K.",
      role: "Interior Designer", 
      earnings: "$62,300",
      referrals: 11,
      serenityRewards: 200,
      testimonial: "The 6-digit ID system is genius - I can share it verbally or on social media. Working with Serenity Custom Pools has been amazing!"
    },
    {
      name: "David L.",
      role: "Landscape Contractor",
      earnings: "$39,800",
      referrals: 6,
      serenityRewards: 120,
      testimonial: "Best affiliate program I've ever joined. The tiered structure motivates me to refer more high-quality leads!"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-navy to-luxury-charcoal text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
              Join North Georgia's Premier<br />
              <span className="text-luxury-gold">Pool Affiliate Program</span><br />
              Earn Up to 10% Commission
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8">
              Earn up to $10,000 per referral by partnering with Serenity Custom Pools LLC -
              North Georgia's premier luxury pool builder with 30+ years of excellence serving affluent homeowners.
            </p>
            
            {referralCode && (
              <div className="mb-8">
                <Badge className="bg-luxury-gold text-black text-lg px-6 py-2">
                  ✨ You were referred by: {referralCode}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/affiliate/register">
              <Button 
                size="lg" 
                className="bg-luxury-gold hover:bg-yellow-600 text-black text-lg px-8 py-4 font-semibold"
                data-testid="button-apply-now"
              >
                Apply Now - Start Earning
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/affiliate/dashboard">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-luxury-navy text-lg px-8 py-4"
                data-testid="button-login"
              >
                Login to Dashboard
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-luxury-gold mb-2">10%</div>
              <div className="text-sm text-gray-300">Max Commission Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-luxury-gold mb-2">$10K+</div>
              <div className="text-sm text-gray-300">Per Referral Potential</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-luxury-gold mb-2">24hrs</div>
              <div className="text-sm text-gray-300">Approval Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-luxury-gold mb-2">6-Digit</div>
              <div className="text-sm text-gray-300">Simple ID System</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tiered Commission Structure */}
      <section id="commission-structure" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Tiered Commission Structure
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Grow your earnings as you succeed - start at 5% and reach 10% commission
            </p>
          </div>

          {/* Tier Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {tieredProgram.tiers.map((tier, idx) => (
              <Card 
                key={idx} 
                className={`bg-white/10 backdrop-blur-md border-white/20 text-white ${
                  tier.name === "Platinum Partner" ? "ring-2 ring-luxury-gold" : ""
                }`}
              >
                <CardHeader className="text-center">
                  <div className="text-4xl mb-4">{tier.icon}</div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-luxury-gold">{tier.rate}</div>
                    <div className="text-sm text-gray-300">Commission Rate</div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                      <span className="text-sm">Consultation Bonus:</span>
                      <span className="font-semibold text-luxury-gold">{tier.consultationBonus}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                      <span className="text-sm">Serenity Rewards:</span>
                      <span className="font-semibold text-luxury-gold">{tier.serenityRewards}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-gray-400 mb-3">Example Earnings:</p>
                    {tier.examples.map((example, i) => (
                      <div key={i} className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">{example.project}:</span>
                        <span className="font-semibold text-luxury-gold">{example.commission}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Serenity Rewards Card */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Serenity Rewards Program</CardTitle>
              <CardDescription className="text-gray-300">
                {tieredProgram.serenityRewards.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-luxury-gold mb-2">50</div>
              <div className="text-sm text-gray-300 mb-6">Serenity Rewards Points per consultation</div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-luxury-gold mr-2" />
                  <span>Use toward your own Serenity Custom Pools projects</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-luxury-gold mr-2" />
                  <span>Redeem for cash value</span>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-luxury-gold mr-2" />
                  <span>Trade with other affiliates</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-12">
            <p className="text-gray-300 mb-6">
              * Commissions paid monthly after project completion. Serenity Rewards awarded immediately after confirmed consultation.
            </p>
            <Link href="/affiliate/register">
              <Button 
                size="lg" 
                className="bg-luxury-gold hover:bg-yellow-600 text-black font-semibold"
                data-testid="button-join-now"
              >
                Join the Program Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Why Choose Our Program?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We provide everything you need to succeed as a luxury pool affiliate
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={index} className="bg-white/10 border-white/20 text-white">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto mb-6">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                    <p className="text-gray-300">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              See how our affiliates are building wealth by referring luxury pool clients
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <Card key={index} className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold">{story.name}</h4>
                      <p className="text-sm text-gray-300">{story.role}</p>
                    </div>
                    <Badge className="bg-luxury-gold text-black">
                      {story.referrals} Referrals
                    </Badge>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-luxury-gold">{story.earnings}</div>
                    <div className="text-sm text-gray-300">Total Earnings</div>
                    <div className="text-sm text-gray-400 mt-2">
                      {story.serenityRewards} Serenity Points
                    </div>
                  </div>
                  
                  <blockquote className="text-gray-300 italic">
                    "{story.testimonial}"
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="bg-gradient-to-r from-luxury-gold to-yellow-600 text-black">
            <CardContent className="p-12">
              <h2 className="text-4xl font-serif font-bold mb-6">
                Ready to Start Earning?
              </h2>
              <p className="text-xl mb-8">
                Join North Georgia's premier pool affiliate program with Serenity Custom Pools LLC 
                and start earning tiered commissions today.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">1. Apply</div>
                  <div className="text-sm">Submit your application</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">2. Get Approved</div>
                  <div className="text-sm">We review within 24 hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">3. Start Earning</div>
                  <div className="text-sm">Refer clients and get paid</div>
                </div>
              </div>

              <Link href="/affiliate/register">
                <Button 
                  size="lg" 
                  className="bg-luxury-navy hover:bg-blue-900 text-white text-lg px-8 py-4 font-semibold"
                  data-testid="button-apply-final"
                >
                  Apply for the Program Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              
              <p className="text-sm mt-4 opacity-80">
                Application takes less than 3 minutes • Get approved within 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}