import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Copy,
  ExternalLink,
  Star,
  Download,
  Share2,
  Award,
  Target,
  TrendingDown,
  Loader2,
  LogOut,
  Link2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Tier definitions matching server/services/affiliate-tiers.ts
type AffiliateTier = 'pool_partner' | 'elite_partner' | 'platinum_partner';

interface TierBenefits {
  tier: AffiliateTier;
  tierName: string;
  commissionRate: number;
  consultationBonus: number;
  serenityRewards: number;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
}

const TIER_BENEFITS: Record<AffiliateTier, TierBenefits> = {
  pool_partner: {
    tier: 'pool_partner',
    tierName: 'Pool Partner',
    commissionRate: 5,
    consultationBonus: 100,
    serenityRewards: 1000,
    icon: '💧',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  elite_partner: {
    tier: 'elite_partner',
    tierName: 'Elite Partner',
    commissionRate: 7,
    consultationBonus: 150,
    serenityRewards: 1500,
    icon: '⭐',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
  platinum_partner: {
    tier: 'platinum_partner',
    tierName: 'Platinum Partner',
    commissionRate: 10,
    consultationBonus: 200,
    serenityRewards: 2000,
    icon: '👑',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
};

// API types
interface AffiliateData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  affiliateId: string;
  referralCode: string;
  tier: AffiliateTier;
  totalCommissions: string;
  totalSerenityRewards: string;
  lifetimeReferrals: number;
  lifetimeConsultations: number;
  lifetimeSales: string;
  currentYearDeals: number;
  status: string;
  createdAt: Date;
}

interface ReferralData {
  id: string;
  affiliateDbId: string;
  affiliateId: string;
  leadId: string;
  type: string;
  status: string;
  projectValue: string | null;
  commissionRate: string;
  commissionAmount: string | null;
  serenityRewardsAwarded: string;
  consultationDate: Date | null;
  conversionDate: Date | null;
  notes: string | null;
  createdAt: Date;
}

interface LinkData {
  id: string;
  affiliateId: string;
  code: string;
  url: string;
  title: string;
  clicks: number;
  conversions: number;
  createdAt: Date;
}

export default function AffiliateDashboard() {
  const { toast } = useToast();
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check for stored affiliate ID on mount
  useEffect(() => {
    const storedId = localStorage.getItem("affiliateId");
    if (storedId) {
      setAffiliateId(storedId);
    }
  }, []);

  // Fetch affiliate dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/affiliates", affiliateId, "dashboard"],
    queryFn: async () => {
      if (!affiliateId) return null;

      const response = await fetch(`/api/affiliates/${affiliateId}/dashboard`);
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!affiliateId,
  });

  // Handle login via email lookup
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      // First, get all affiliates and find by email (in production, use a proper API endpoint)
      const response = await fetch("/api/affiliates");
      if (!response.ok) {
        throw new Error("Failed to authenticate");
      }

      const affiliates = await response.json();
      const affiliate = affiliates.find((a: AffiliateData) =>
        a.email.toLowerCase() === loginEmail.toLowerCase()
      );

      if (!affiliate) {
        toast({
          title: "Login Failed",
          description: "No affiliate account found with this email.",
          variant: "destructive",
        });
        return;
      }

      // Store affiliate ID and name
      localStorage.setItem("affiliateId", affiliate.id);
      localStorage.setItem("affiliateName", affiliate.firstName);
      setAffiliateId(affiliate.id);

      toast({
        title: "Login Successful",
        description: `Welcome back, ${affiliate.firstName}!`,
      });
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Unable to log in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("affiliateId");
    localStorage.removeItem("affiliateName");
    setAffiliateId(null);
    setLoginEmail("");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  // Calculate progress to next tier
  const getNextTier = (currentTier: AffiliateTier): AffiliateTier | null => {
    switch (currentTier) {
      case 'pool_partner': return 'elite_partner';
      case 'elite_partner': return 'platinum_partner';
      case 'platinum_partner': return null;
      default: return null;
    }
  };

  const calculateTierProgress = (affiliate: AffiliateData) => {
    const nextTier = getNextTier(affiliate.tier);
    if (!nextTier) return { progress: 100, remaining: 0, target: 0 };

    // Use lifetime sales to calculate progress to next tier
    const currentSales = parseFloat(affiliate.lifetimeSales || "0");
    const tierTargets: Record<AffiliateTier, number> = {
      pool_partner: 0,  // Starting tier
      elite_partner: 50000,  // $50K for Elite
      platinum_partner: 150000  // $150K for Platinum
    };

    const target = tierTargets[nextTier];
    const progress = Math.min((currentSales / target) * 100, 100);
    const remaining = Math.max(target - currentSales, 0);

    return { progress, remaining, target, nextTier };
  };

  // Copy referral link/code to clipboard
  const copyToClipboard = (text: string, label: string = "Text") => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  // Show login form if not logged in
  if (!affiliateId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-luxury-navy to-luxury-charcoal text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <div className="mb-4">
              <h1 className="text-3xl font-serif font-bold text-white mb-2">
                Affiliate Dashboard
              </h1>
              <p className="text-gray-300">Serenity Custom Pools LLC</p>
            </div>
            <CardTitle className="text-2xl text-white">Welcome Back!</CardTitle>
            <CardDescription className="text-gray-300">
              Log in with your registered email to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  data-testid="input-login-email"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-luxury-gold hover:bg-yellow-600 text-white"
                disabled={isLoggingIn}
                data-testid="button-login"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log In to Dashboard"
                )}
              </Button>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-300">
                  Not an affiliate yet?{" "}
                  <Link href="/affiliate-register" className="text-luxury-gold hover:underline">
                    Apply Now
                  </Link>
                </p>
                <Link href="/" className="text-sm text-gray-400 hover:text-white">
                  ← Back to Home
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-luxury-navy to-luxury-charcoal text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-luxury-gold" />
          <p className="text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-luxury-navy to-luxury-charcoal text-white flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              We couldn't load your dashboard data. Please try again.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} className="bg-luxury-gold hover:bg-yellow-600">
                Retry
              </Button>
              <Button onClick={handleLogout} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data from dashboard response
  const affiliateData: AffiliateData = dashboardData?.affiliate;
  const referrals: ReferralData[] = dashboardData?.referrals || [];
  const links: LinkData[] = dashboardData?.links || [];
  
  // Add safety check for required data
  if (!affiliateData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-luxury-navy to-luxury-charcoal text-white flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>Data Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              Unable to load affiliate data. Please try again.
            </p>
            <Button onClick={() => refetch()} className="bg-luxury-gold hover:bg-yellow-600">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics
  const totalEarnings = parseFloat(affiliateData.totalCommissions || "0");
  const pendingEarnings = referrals
    .filter(r => r.status === "pending" || r.status === "consultation_completed")
    .reduce((sum, r) => sum + parseFloat(r.commissionAmount || "0"), 0);
  const totalSerenityRewards = parseFloat(affiliateData.totalSerenityRewards || "0");

  const tierProgress = calculateTierProgress(affiliateData);
  const currentTierBenefits = TIER_BENEFITS[affiliateData.tier];

  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-navy to-luxury-charcoal text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-serif font-bold">Serenity Custom Pools LLC</h1>
              <p className="text-sm text-gray-300">Affiliate Partner Dashboard</p>
            </div>
            <Badge className={`${currentTierBenefits.bgColor} ${currentTierBenefits.textColor} border-0`}>
              {currentTierBenefits.icon} {currentTierBenefits.tierName}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Welcome back,</p>
              <p className="font-semibold">{affiliateData.firstName}</p>
            </div>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              ID: {affiliateData.affiliateId}
            </Badge>
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pool Prosperity Facebook Group Banner */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-500 border-blue-400/50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Join Pool Prosperity on Facebook!</h3>
                  <p className="text-blue-100 text-sm">Connect with other affiliates, share tips, and celebrate wins</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
                onClick={() => window.open('https://facebook.com/groups/poolprosperity', '_blank')}
                data-testid="button-facebook-group"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Join Group
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Total Earnings</p>
                  <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-luxury-gold opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Pending</p>
                  <p className="text-2xl font-bold">${pendingEarnings.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Lifetime Referrals</p>
                  <p className="text-2xl font-bold">{affiliateData.lifetimeReferrals}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Lifetime Sales</p>
                  <p className="text-2xl font-bold">${parseFloat(affiliateData.lifetimeSales || "0").toLocaleString()}</p>
                </div>
                <Target className="h-8 w-8 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">This Year</p>
                  <p className="text-2xl font-bold">{affiliateData.currentYearDeals} deals</p>
                </div>
                <Calendar className="h-8 w-8 text-indigo-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Consultations</p>
                  <p className="text-2xl font-bold">{affiliateData.lifetimeConsultations}</p>
                </div>
                <Award className="h-8 w-8 text-orange-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Code & Tier Progress */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Referral Code Card */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Your Referral Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                <code className="text-2xl font-mono font-bold text-luxury-gold">
                  {affiliateData.referralCode}
                </code>
                <Button
                  onClick={() => copyToClipboard(affiliateData.referralCode, "Referral code")}
                  size="sm"
                  className="bg-luxury-gold hover:bg-yellow-600 text-white"
                  data-testid="button-copy-code"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>
              <p className="text-sm text-gray-300">
                Share this code with potential clients to earn commissions on their projects.
              </p>
            </CardContent>
          </Card>

          {/* Tier Progress Card */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Tier Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Current: {currentTierBenefits.tierName}</span>
                  {tierProgress.nextTier && (
                    <span className="text-sm">Next: {TIER_BENEFITS[tierProgress.nextTier].tierName}</span>
                  )}
                </div>
                <Progress value={tierProgress.progress} className="h-3" />
                {tierProgress.nextTier && (
                  <p className="text-xs text-gray-400 mt-2">
                    ${tierProgress.remaining.toLocaleString()} more in sales to reach {TIER_BENEFITS[tierProgress.nextTier].tierName}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-black/30 rounded p-2">
                  <p className="text-xs text-gray-400">Commission</p>
                  <p className="font-bold">{currentTierBenefits.commissionRate}%</p>
                </div>
                <div className="bg-black/30 rounded p-2">
                  <p className="text-xs text-gray-400">Consult Bonus</p>
                  <p className="font-bold">${currentTierBenefits.consultationBonus}</p>
                </div>
                <div className="bg-black/30 rounded p-2">
                  <p className="text-xs text-gray-400">Serenity Rewards</p>
                  <p className="font-bold">{totalSerenityRewards.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Referrals and Marketing Links */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Your Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="referrals" className="space-y-4">
              <TabsList className="bg-black/30">
                <TabsTrigger value="referrals" className="data-[state=active]:bg-luxury-gold data-[state=active]:text-white">
                  Referrals ({referrals.length})
                </TabsTrigger>
                <TabsTrigger value="links" className="data-[state=active]:bg-luxury-gold data-[state=active]:text-white">
                  Marketing Links ({links.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="referrals" className="text-white">
                {referrals.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-lg font-semibold mb-2">No Referrals Yet</h3>
                    <p className="text-gray-400 mb-4">Start sharing your referral code to see your referrals here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="bg-black/30 rounded-lg p-4 border border-white/10">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">Lead #{referral.leadId}</h4>
                            <p className="text-sm text-gray-400">Type: {referral.type}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Referred: {new Date(referral.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={
                              referral.status === 'converted' ? 'bg-green-500 text-white' :
                              referral.status === 'qualified' ? 'bg-blue-500 text-white' :
                              referral.status === 'consultation_completed' ? 'bg-purple-500 text-white' :
                              'bg-gray-500 text-white'
                            }>
                              {referral.status.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                            {referral.commissionAmount && (
                              <p className="text-luxury-gold font-bold mt-2">
                                ${parseFloat(referral.commissionAmount).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="links" className="text-white">
                {links.length === 0 ? (
                  <div className="text-center py-12">
                    <Link2 className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-lg font-semibold mb-2">No Marketing Links Yet</h3>
                    <p className="text-gray-400">Your custom marketing links will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {links.map((link) => (
                      <div key={link.id} className="bg-black/30 rounded-lg p-4 border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">{link.title}</h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(link.url, link.title)}
                              className="text-white hover:bg-white/10"
                              data-testid={`button-copy-${link.id}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" asChild className="text-white hover:bg-white/10">
                              <a href={link.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                        <div className="bg-black/50 rounded p-2 mb-3 overflow-x-auto">
                          <code className="text-xs text-luxury-gold break-all">{link.url}</code>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{link.clicks} clicks</span>
                          <span>{link.conversions} conversions</span>
                          <span>{link.conversions > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0}% rate</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}