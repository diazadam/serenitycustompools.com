import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Check, 
  X, 
  Search,
  Mail,
  Phone,
  ExternalLink,
  Star,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data - in production this would come from API
const mockAffiliates = [
  {
    id: "aff-1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah@example.com",
    phone: "(770) 555-0123",
    company: "Johnson Real Estate",
    referralCode: "SARAH2024",
    commissionTier: "gold",
    totalEarnings: "47500.00",
    lifetimeReferrals: 8,
    status: "active",
    isApproved: true,
    createdAt: "2024-01-15T00:00:00Z",
    pendingPayouts: "12500.00"
  },
  {
    id: "aff-2", 
    firstName: "Michael",
    lastName: "Davis",
    email: "mike@example.com",
    phone: "(404) 555-0234",
    company: "Davis Landscaping",
    referralCode: "MIKE2024",
    commissionTier: "silver",
    totalEarnings: "23750.00",
    lifetimeReferrals: 4,
    status: "active",
    isApproved: true,
    createdAt: "2024-02-20T00:00:00Z",
    pendingPayouts: "7500.00"
  },
  {
    id: "aff-3",
    firstName: "Lisa",
    lastName: "Chen",
    email: "lisa@example.com", 
    phone: "(678) 555-0345",
    company: "Chen Design Studio",
    referralCode: "LISA2024",
    commissionTier: "bronze",
    totalEarnings: "0.00",
    lifetimeReferrals: 0,
    status: "pending",
    isApproved: false,
    createdAt: "2024-08-20T00:00:00Z",
    pendingPayouts: "0.00"
  }
];

const mockPendingPayouts = [
  {
    id: "payout-1",
    affiliateId: "aff-1",
    affiliateName: "Sarah Johnson", 
    amount: "12500.00",
    referralIds: ["ref-1", "ref-2"],
    method: "paypal",
    status: "pending",
    requestedDate: "2024-08-01T00:00:00Z"
  },
  {
    id: "payout-2",
    affiliateId: "aff-2",
    affiliateName: "Michael Davis",
    amount: "7500.00", 
    referralIds: ["ref-3"],
    method: "venmo",
    status: "pending",
    requestedDate: "2024-08-15T00:00:00Z"
  }
];

export default function AdminAffiliates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "bronze": return "bg-amber-600";
      case "silver": return "bg-gray-400";
      case "gold": return "bg-yellow-500";
      case "platinum": return "bg-gray-800";
      default: return "bg-gray-500";
    }
  };

  const getTierCommission = (tier: string) => {
    switch (tier) {
      case "bronze": return "5%";
      case "silver": return "7%";
      case "gold": return "10%";
      case "platinum": return "12%";
      default: return "5%";
    }
  };

  const getStatusBadge = (status: string, isApproved: boolean) => {
    if (!isApproved) {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const approveAffiliate = useMutation({
    mutationFn: async (affiliateId: string) => {
      // API call would go here
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Affiliate Approved",
        description: "The affiliate has been approved and can start earning commissions.",
      });
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
    }
  });

  const rejectAffiliate = useMutation({
    mutationFn: async (affiliateId: string) => {
      // API call would go here
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Affiliate Rejected",
        description: "The affiliate application has been rejected.",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
    }
  });

  const processPayout = useMutation({
    mutationFn: async (payoutId: string) => {
      // API call would go here
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Payout Processed",
        description: "The payout has been marked as completed.",
      });
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    }
  });

  const filteredAffiliates = mockAffiliates.filter(affiliate => {
    const matchesSearch = searchTerm === "" || 
      affiliate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "pending" && !affiliate.isApproved) ||
      (statusFilter === "active" && affiliate.isApproved && affiliate.status === "active") ||
      (statusFilter === "suspended" && affiliate.status === "suspended");
    
    return matchesSearch && matchesStatus;
  });

  const totalEarnings = mockAffiliates.reduce((sum, aff) => sum + parseFloat(aff.totalEarnings), 0);
  const totalPendingPayouts = mockPendingPayouts.reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
  const activeAffiliates = mockAffiliates.filter(aff => aff.isApproved && aff.status === "active").length;
  const pendingApprovals = mockAffiliates.filter(aff => !aff.isApproved).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif font-bold text-luxury-navy">
              Affiliate Program Admin
            </h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <a href="/affiliate" target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Page
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Affiliates</p>
                  <p className="text-2xl font-bold text-luxury-navy">{activeAffiliates}</p>
                </div>
                <Users className="w-8 h-8 text-luxury-gold" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Commissions Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalEarnings.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Payouts</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${totalPendingPayouts.toLocaleString()}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-blue-600">{pendingApprovals}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="affiliates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="affiliates">Manage Affiliates</TabsTrigger>
            <TabsTrigger value="payouts">Process Payouts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="affiliates" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Management</CardTitle>
                <CardDescription>
                  Approve applications, manage tier levels, and track performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search affiliates..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-affiliates"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48" data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending Approval</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Affiliates List */}
                <div className="space-y-4">
                  {filteredAffiliates.map((affiliate) => (
                    <div key={affiliate.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg">
                              {affiliate.firstName} {affiliate.lastName}
                            </h4>
                            <Badge className={`${getTierColor(affiliate.commissionTier)} text-white`}>
                              {affiliate.commissionTier.toUpperCase()}
                            </Badge>
                            {getStatusBadge(affiliate.status, affiliate.isApproved)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {affiliate.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {affiliate.phone}
                            </div>
                            {affiliate.company && (
                              <div className="font-medium">{affiliate.company}</div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-2">
                            Code: <code className="bg-gray-100 px-2 py-1 rounded">{affiliate.referralCode}</code>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>Referrals: <span className="font-semibold">{affiliate.lifetimeReferrals}</span></div>
                            <div>Commission: <span className="font-semibold">{getTierCommission(affiliate.commissionTier)}</span></div>
                            <div>Earnings: <span className="font-semibold text-green-600">${parseFloat(affiliate.totalEarnings).toLocaleString()}</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          Joined: {new Date(affiliate.createdAt).toLocaleDateString()}
                        </div>
                        
                        <div className="flex gap-2">
                          {!affiliate.isApproved && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => approveAffiliate.mutate(affiliate.id)}
                                disabled={approveAffiliate.isPending}
                                data-testid={`button-approve-${affiliate.id}`}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectAffiliate.mutate(affiliate.id)}
                                disabled={rejectAffiliate.isPending}
                                data-testid={`button-reject-${affiliate.id}`}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {affiliate.isApproved && (
                            <>
                              <Button size="sm" variant="outline" data-testid={`button-view-${affiliate.id}`}>
                                View Details
                              </Button>
                              <Button size="sm" variant="outline" data-testid={`button-edit-${affiliate.id}`}>
                                Edit Tier
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Payouts</CardTitle>
                <CardDescription>
                  Review and process commission payments to affiliates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPendingPayouts.map((payout) => (
                    <div key={payout.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{payout.affiliateName}</h4>
                          <p className="text-sm text-gray-600">
                            Requested: {new Date(payout.requestedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-luxury-gold">
                            ${parseFloat(payout.amount).toLocaleString()}
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 capitalize">
                            {payout.method}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          {payout.referralIds.length} referral(s) included
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" data-testid={`button-review-${payout.id}`}>
                            Review Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => processPayout.mutate(payout.id)}
                            disabled={processPayout.isPending}
                            data-testid={`button-process-${payout.id}`}
                          >
                            Mark as Paid
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Analytics</CardTitle>
                <CardDescription>
                  Track the performance of your affiliate program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-4">Tier Distribution</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Bronze (5%)</span>
                        <span className="font-semibold">1 affiliate</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Silver (7%)</span>
                        <span className="font-semibold">1 affiliate</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gold (10%)</span>
                        <span className="font-semibold">1 affiliate</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platinum (12%)</span>
                        <span className="font-semibold">0 affiliates</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-4">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Avg. Referrals per Affiliate</span>
                        <span className="font-semibold">4.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg. Commission per Referral</span>
                        <span className="font-semibold">$5,937</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Referrals This Month</span>
                        <span className="font-semibold">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversion Rate</span>
                        <span className="font-semibold">85%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}