import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Gift,
  Trophy,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReferralId, setSelectedReferralId] = useState<string>("");
  const [projectValue, setProjectValue] = useState<string>("");
  const [serenityRewardsAmount, setSerenityRewardsAmount] = useState<string>("50");

  const { data: affiliatesData, isLoading } = useQuery({
    queryKey: ["/api/affiliates"],
    refetchInterval: 5000,
  });

  const { data: leadsData } = useQuery({
    queryKey: ["/api/leads"],
  });

  const approveAffiliate = useMutation({
    mutationFn: async ({ affiliateId, approved }: { affiliateId: string, approved: boolean }) => {
      return apiRequest("PATCH", `/api/affiliates/${affiliateId}`, { isApproved: approved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliates"] });
      toast({
        title: "Success",
        description: "Affiliate status updated successfully.",
      });
    }
  });

  const updateReferralStatus = useMutation({
    mutationFn: async ({ referralId, status, projectValue, serenityRewards }: { 
      referralId: string, 
      status: string, 
      projectValue?: string, 
      serenityRewards?: string 
    }) => {
      return apiRequest("PATCH", `/api/referrals/${referralId}`, { 
        status, 
        projectValue, 
        serenityRewards 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Referral status updated successfully.",
      });
      setSelectedReferralId("");
      setProjectValue("");
      setSerenityRewardsAmount("50");
    }
  });

  const affiliates = affiliatesData?.affiliates || [];
  const leads = leadsData?.leads || [];
  const affiliateLeads = leads.filter((lead: any) => lead.affiliateId);

  const totalCommissionsPaid = affiliates.reduce((sum: number, aff: any) => 
    sum + parseFloat(aff.totalCommissions || "0"), 0
  );
  
  const totalSerenityRewards = affiliates.reduce((sum: number, aff: any) => 
    sum + parseFloat(aff.totalSerenityRewards || "0"), 0
  );

  const handleConsultationCompleted = () => {
    if (!selectedReferralId) return;
    
    updateReferralStatus.mutate({
      referralId: selectedReferralId,
      status: "consultation_completed",
      serenityRewards: serenityRewardsAmount
    });
  };

  const handleSaleCompleted = () => {
    if (!selectedReferralId || !projectValue) return;
    
    updateReferralStatus.mutate({
      referralId: selectedReferralId,
      status: "converted_to_sale",
      projectValue: projectValue
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading affiliate data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8" data-testid="admin-affiliates-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-title">
          Simplified Affiliate Program Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your affiliate program with tiered commissions (5%-10%) and Serenity Rewards
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="metric-total-affiliates">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliates.length}</div>
          </CardContent>
        </Card>

        <Card data-testid="metric-affiliate-leads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliateLeads.length}</div>
          </CardContent>
        </Card>

        <Card data-testid="metric-total-commissions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommissionsPaid.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card data-testid="metric-serenity-rewards">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Serenity Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSerenityRewards.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="affiliates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="referrals">Referral Management</TabsTrigger>
          <TabsTrigger value="leads">Affiliate Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Partners</CardTitle>
              <CardDescription>
                Manage your affiliate partners with simple 6-digit IDs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {affiliates.map((affiliate: any) => (
                  <div 
                    key={affiliate.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`affiliate-${affiliate.id}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold">
                          {affiliate.firstName} {affiliate.lastName}
                        </h4>
                        <Badge variant="secondary" className="font-mono">
                          ID: {affiliate.affiliateId}
                        </Badge>
                        <Badge 
                          variant={affiliate.isApproved ? "default" : "destructive"}
                        >
                          {affiliate.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{affiliate.email}</p>
                      <div className="text-sm text-gray-500">
                        Commissions: ${affiliate.totalCommissions} | 
                        Serenity Rewards: {affiliate.totalSerenityRewards} | 
                        Referrals: {affiliate.lifetimeReferrals}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!affiliate.isApproved && (
                        <Button
                          size="sm"
                          onClick={() => approveAffiliate.mutate({ 
                            affiliateId: affiliate.id, 
                            approved: true 
                          })}
                          data-testid={`approve-${affiliate.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`view-${affiliate.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                {affiliates.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No affiliates registered yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Referral Management</CardTitle>
              <CardDescription>
                Award Serenity Rewards for consultations and tiered commissions for sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Select Referral</label>
                    <Select value={selectedReferralId} onValueChange={setSelectedReferralId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a referral" />
                      </SelectTrigger>
                      <SelectContent>
                        {affiliateLeads.map((lead: any) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.firstName} {lead.lastName} ({lead.affiliateId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Serenity Rewards Amount</label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={serenityRewardsAmount}
                      onChange={(e) => setSerenityRewardsAmount(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Project Value ($)</label>
                    <Input
                      type="number"
                      placeholder="75000"
                      value={projectValue}
                      onChange={(e) => setProjectValue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={handleConsultationCompleted}
                    disabled={!selectedReferralId}
                    data-testid="award-serenity-rewards"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Award Serenity Rewards (Consultation Only)
                  </Button>
                  
                  <Button
                    onClick={handleSaleCompleted}
                    disabled={!selectedReferralId || !projectValue}
                    data-testid="award-commission"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Award Tiered Commission (Sale)
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  <p>• Award Serenity Rewards when a consultation happens but no sale occurs</p>
                  <p>• Award tiered commission when a referral becomes a paying client</p>
                  <p>• Commission rates: Pool Partner (5%), Elite Partner (7%), Platinum Partner (10%)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Leads</CardTitle>
              <CardDescription>
                All leads that came through affiliate referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {affiliateLeads.map((lead: any) => (
                  <div 
                    key={lead.id} 
                    className="p-4 border rounded-lg"
                    data-testid={`lead-${lead.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">
                          {lead.firstName} {lead.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{lead.email}</p>
                        <p className="text-sm text-gray-500">
                          Source: {lead.source} | Affiliate ID: {lead.affiliateId}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    {lead.message && (
                      <p className="text-sm mt-2 p-2 bg-gray-50 rounded">
                        {lead.message}
                      </p>
                    )}
                  </div>
                ))}
                {affiliateLeads.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No affiliate leads yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}