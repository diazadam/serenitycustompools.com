import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Users, DollarSign, TrendingUp, Phone, Mail, MapPin, Clock, Search, Filter, Bot, MessageSquare, ChevronDown, ChevronRight, Send, Inbox, Eye, MousePointer, Activity, Mic, Trash2, Film } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import VoiceCallDashboard from "@/components/voice-call-dashboard";
import { MediaManager } from "@/components/media-manager";

interface Lead {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  createdAt: string;
  poolInterest?: string;
  estimatedBudget?: string;
  location?: string;
  city?: string;
  projectType?: string;
  budgetRange?: string;
  message?: string;
  affiliateId?: string;
  metadata?: any;
  isFromVoiceCall?: boolean;
}

interface Appointment {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  appointmentDate: string;
  appointmentType: string;
  status: string;
  projectType?: string;
  estimatedBudget?: string;
  source: string;
  notes?: string;
}

interface Affiliate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  affiliateId: string;
  totalCommissions: number;
  lifetimeReferrals: number;
  lifetimeConsultations: number;
  status: string;
}

interface EmailThread {
  id: string;
  leadId: string;
  threadId: string;
  subject: string;
  lastMessageDate: string;
  messageCount: number;
  isRead: boolean;
  labels?: string[];
}

interface EmailActivity {
  id: string;
  leadId: string;
  threadId?: string;
  messageId: string;
  type: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  snippet: string;
  content?: string;
  sentAt?: string;
  receivedAt?: string;
  openedAt?: string;
  clickedAt?: string;
  isInbound: boolean;
}

export default function CRMDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [expandedLeadEmail, setExpandedLeadEmail] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<Record<string, string>>({});
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Fetch all CRM data
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: affiliates = [], isLoading: affiliatesLoading } = useQuery<Affiliate[]>({
    queryKey: ["/api/affiliates"],
  });

  // Fetch email activity feed
  const { data: activityFeedResponse } = useQuery<{ success: boolean; activities: EmailActivity[]; total: number }>({
    queryKey: ["/api/crm/activity-feed"],
  });
  
  const activityFeed = activityFeedResponse?.activities || [];

  // Mutation for syncing inbox
  const syncInboxMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/crm/sync-inbox", { maxResults: 50 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activity-feed"] });
      toast({
        title: "Inbox Synced",
        description: "Your inbox has been synced with CRM successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync inbox. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for quick reply
  const quickReplyMutation = useMutation({
    mutationFn: async ({ leadId, threadId, message }: { leadId: string; threadId: string; message: string }) => {
      return apiRequest("POST", "/api/crm/quick-reply", { leadId, threadId, message });
    },
    onSuccess: (_, variables) => {
      setReplyMessage(prev => ({ ...prev, [variables.threadId]: "" }));
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${variables.leadId}/emails`] });
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Reply Failed",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a single lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return apiRequest("DELETE", `/api/leads/${leadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activity-feed"] });
      setLeadToDelete(null);
      toast({
        title: "Lead Deleted",
        description: "The lead has been successfully removed from your CRM.",
      });
    },
    onError: () => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for bulk deleting leads
  const bulkDeleteLeadsMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      return apiRequest("DELETE", "/api/leads", { leadIds });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activity-feed"] });
      setShowBulkDeleteDialog(false);
      setSelectedLeads(new Set());
      toast({
        title: "Leads Deleted",
        description: `${data.deletedCount} lead(s) have been successfully removed from your CRM.`,
      });
    },
    onError: () => {
      toast({
        title: "Bulk Deletion Failed",
        description: "Failed to delete selected leads. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate key metrics
  const todayAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
  );

  const weeklyLeads = leads.filter(lead => {
    const leadDate = new Date(lead.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return leadDate >= weekAgo;
  });

  const pendingAppointments = appointments.filter(apt => apt.status === 'scheduled');
  const activeAffiliates = affiliates.filter(aff => aff.status === 'approved');

  // Estimated pipeline value
  const pipelineValue = leads.reduce((total, lead) => {
    // Try to extract numeric value from budgetRange first, then estimatedBudget
    const budgetString = lead.budgetRange || lead.estimatedBudget || "50000";
    const numericBudget = parseInt(budgetString.replace(/[^0-9]/g, '')) || 50000;
    return total + numericBudget;
  }, 0);

  const filteredLeads = leads.filter(lead => 
    searchTerm === "" || 
    `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm)
  );

  // Fetch emails for expanded lead
  const { data: leadEmails = [], isLoading: emailsLoading } = useQuery<EmailActivity[]>({
    queryKey: expandedLeadEmail ? [`/api/leads/${expandedLeadEmail}/emails`] : ['no-emails'],
    enabled: !!expandedLeadEmail,
  });

  // Fetch threads for expanded lead  
  const { data: leadThreads = [], isLoading: threadsLoading } = useQuery<EmailThread[]>({
    queryKey: expandedLeadEmail ? [`/api/leads/${expandedLeadEmail}/threads`] : ['no-threads'],
    enabled: !!expandedLeadEmail,
  });

  // Get recent activities
  const recentActivities = activityFeed.slice(0, 10);

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-600';
    switch (status.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'pool_visualizer': return '🏊‍♂️';
      case 'website': return '🌐';
      case 'affiliate': return '🤝';
      case 'referral': return '👥';
      case 'voice_call': return '🎤';
      default: return '📧';
    }
  };

  if (leadsLoading || appointmentsLoading || affiliatesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8860B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1e3a8a]">Serenity Pools CRM</h1>
            <p className="text-gray-600">Manage leads, appointments, and affiliates</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => syncInboxMutation.mutate()}
              disabled={syncInboxMutation.isPending}
              data-testid="sync-inbox-button"
            >
              <Inbox className="h-4 w-4" />
              {syncInboxMutation.isPending ? "Syncing..." : "Sync Inbox"}
            </Button>
            <a href="/blog-automation">
              <Button variant="outline" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Blog AI
              </Button>
            </a>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="search-customers"
              />
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Leads (7 days)</CardTitle>
              <Users className="h-4 w-4 text-[#B8860B]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1e3a8a]">{weeklyLeads.length}</div>
              <p className="text-xs text-gray-600">
                {leads.length} total leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-[#B8860B]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1e3a8a]">{todayAppointments.length}</div>
              <p className="text-xs text-gray-600">
                {pendingAppointments.length} pending total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-[#B8860B]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1e3a8a]">
                ${(pipelineValue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-600">
                Estimated project value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Affiliates</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#B8860B]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1e3a8a]">{activeAffiliates.length}</div>
              <p className="text-xs text-gray-600">
                {affiliates.length} total affiliates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="appointments">Appointments ({appointments.length})</TabsTrigger>
            <TabsTrigger value="affiliates">Affiliates ({affiliates.length})</TabsTrigger>
            <TabsTrigger value="voice-calls">
              <span className="flex items-center gap-1">
                <Mic className="w-4 h-4" />
                Voice Calls
              </span>
            </TabsTrigger>
            <TabsTrigger value="email-activity">
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                Email Activity
                {recentActivities.filter(a => !a.openedAt).length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {recentActivities.filter(a => !a.openedAt).length}
                  </Badge>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="media">
              <span className="flex items-center gap-1">
                <Film className="w-4 h-4" />
                Media Gallery
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Leads */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Recent Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-2xl">{getSourceIcon(lead.source)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                              {lead.isFromVoiceCall && (
                                <Badge className="bg-purple-100 text-purple-700 text-xs">
                                  <Mic className="w-3 h-3 mr-1" />
                                  Voice
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{lead.email}</p>
                            {lead.budgetRange && (
                              <p className="text-sm text-green-600 font-medium mt-1">
                                Budget: {lead.budgetRange}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                          {lead.metadata?.priority && (
                            <Badge className={
                              lead.metadata.priority === 'High' ? 'bg-red-500 text-white text-xs' :
                              lead.metadata.priority === 'Medium' ? 'bg-yellow-500 text-white text-xs' :
                              'bg-gray-500 text-white text-xs'
                            }>
                              {lead.metadata.priority}
                            </Badge>
                          )}
                          <p className="text-xs text-gray-500">
                            {format(new Date(lead.createdAt), 'MMM d')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appointments
                      .filter(apt => new Date(apt.appointmentDate) >= new Date())
                      .slice(0, 5)
                      .map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-[#B8860B]" />
                            <div>
                              <p className="font-medium">{appointment.firstName} {appointment.lastName}</p>
                              <p className="text-sm text-gray-600">{appointment.appointmentType}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {format(new Date(appointment.appointmentDate), 'MMM d, h:mm a')}
                            </p>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Leads</CardTitle>
                  {selectedLeads.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{selectedLeads.size} selected</Badge>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowBulkDeleteDialog(true)}
                        data-testid="button-bulk-delete"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Selected
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Select All Checkbox */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                  <Checkbox
                    checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
                      } else {
                        setSelectedLeads(new Set());
                      }
                    }}
                    data-testid="checkbox-select-all"
                  />
                  <label className="text-sm font-medium cursor-pointer">
                    Select All ({filteredLeads.length} leads)
                  </label>
                </div>
                
                <div className="space-y-4">
                  {filteredLeads.map((lead) => (
                    <div key={lead.id} className="border rounded-lg p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Lead Checkbox */}
                          <Checkbox
                            checked={selectedLeads.has(lead.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedLeads);
                              if (checked) {
                                newSelected.add(lead.id);
                              } else {
                                newSelected.delete(lead.id);
                              }
                              setSelectedLeads(newSelected);
                            }}
                            data-testid={`checkbox-lead-${lead.id}`}
                            className="mt-1"
                          />
                          <div className="text-3xl">{getSourceIcon(lead.source)}</div>
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {lead.firstName} {lead.lastName}
                              </h3>
                              {lead.isFromVoiceCall && (
                                <Badge className="bg-purple-100 text-purple-700">
                                  <Mic className="w-4 h-4 mr-1" />
                                  Voice Call Lead
                                </Badge>
                              )}
                            </div>
                            
                            {/* Contact Information */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {lead.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {lead.phone}
                              </span>
                              {(lead.city || lead.location) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {lead.city || lead.location}
                                </span>
                              )}
                            </div>
                            
                            {/* Project Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              {lead.projectType && (
                                <div className="bg-blue-50 rounded px-3 py-2">
                                  <p className="text-xs text-blue-600 font-medium uppercase">Project Type</p>
                                  <p className="text-sm text-blue-900 font-semibold capitalize">
                                    {lead.projectType.replace(/_/g, ' ')}
                                  </p>
                                </div>
                              )}
                              
                              {lead.budgetRange && (
                                <div className="bg-green-50 rounded px-3 py-2">
                                  <p className="text-xs text-green-600 font-medium uppercase">Budget Range</p>
                                  <p className="text-sm text-green-900 font-semibold">
                                    {lead.budgetRange}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Dream Project Message */}
                            {lead.message && (
                              <div className="bg-gray-50 rounded p-3 mt-3">
                                <p className="text-xs text-gray-600 font-medium uppercase mb-1">Dream Project Details</p>
                                <p className="text-sm text-gray-800 italic">
                                  "{lead.message}"
                                </p>
                              </div>
                            )}
                            
                            {/* AI Qualification Score */}
                            {lead.metadata?.score && (
                              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium uppercase text-purple-600">AI Qualification Score</p>
                                  <Badge className={
                                    lead.metadata.priority === 'High' ? 'bg-red-500 text-white' :
                                    lead.metadata.priority === 'Medium' ? 'bg-yellow-500 text-white' :
                                    'bg-gray-500 text-white'
                                  }>
                                    {lead.metadata.priority} Priority
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-500 ${
                                          lead.metadata.score >= 8 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                          lead.metadata.score >= 5 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                          'bg-gradient-to-r from-red-400 to-red-600'
                                        }`}
                                        style={{ width: `${lead.metadata.score * 10}%` }}
                                      />
                                    </div>
                                  </div>
                                  <span className="font-bold text-lg text-purple-700">{lead.metadata.score}/10</span>
                                </div>
                                {lead.metadata.estimatedProjectValue && (
                                  <p className="text-sm font-semibold text-green-600 mt-2">
                                    Est. Value: {lead.metadata.estimatedProjectValue}
                                  </p>
                                )}
                                {lead.metadata.insights && lead.metadata.insights.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 font-medium uppercase mb-1">AI Insights:</p>
                                    <ul className="text-xs text-gray-700 space-y-1">
                                      {lead.metadata.insights.slice(0, 2).map((insight: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-1">
                                          <span className="text-purple-500 mt-0.5">•</span>
                                          <span>{insight}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Metadata */}
                            <div className="flex items-center gap-4 mt-3">
                              <p className="text-xs text-gray-500">
                                Source: <span className="font-medium">{lead.source.replace(/_/g, ' ')}</span>
                              </p>
                              <p className="text-xs text-gray-500">
                                Created: <span className="font-medium">{format(new Date(lead.createdAt), 'MMM d, yyyy h:mm a')}</span>
                              </p>
                              {lead.affiliateId && (
                                <p className="text-xs text-purple-600">
                                  Affiliate: <span className="font-medium">{lead.affiliateId}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2 ml-4">
                          <Badge className={getStatusColor(lead.status || 'new')}>
                            {lead.status || 'New'}
                          </Badge>
                          
                          <div className="flex flex-col gap-2">
                            <Button size="sm" variant="outline" data-testid={`button-call-${lead.id}`}>
                              <Phone className="w-4 h-4 mr-1" />
                              Call
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              data-testid={`button-email-${lead.id}`}
                              onClick={() => setExpandedLeadEmail(expandedLeadEmail === lead.id ? null : lead.id)}
                            >
                              <Mail className="w-4 h-4 mr-1" />
                              {expandedLeadEmail === lead.id ? 'Hide Emails' : 'View Emails'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              data-testid={`button-delete-${lead.id}`}
                              onClick={() => setLeadToDelete(lead)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Email Conversation Section */}
                      {expandedLeadEmail === lead.id && (
                        <div className="mt-4 border-t pt-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Email Conversations
                                {leadEmails.length > 0 && (
                                  <Badge variant="secondary">{leadEmails.length} emails</Badge>
                                )}
                              </h4>
                              <div className="flex items-center gap-2">
                                {leadThreads.filter(t => !t.isRead).length > 0 && (
                                  <Badge variant="destructive">
                                    {leadThreads.filter(t => !t.isRead).length} unread
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {emailsLoading || threadsLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8860B]"></div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {leadThreads.length > 0 ? (
                                  leadThreads.map((thread) => (
                                    <Collapsible key={thread.id}>
                                      <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 text-left">
                                          <div className="flex items-center gap-3 flex-1">
                                            <ChevronRight className="w-4 h-4" />
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <p className={`font-medium ${!thread.isRead ? 'text-black' : 'text-gray-700'}`}>
                                                  {thread.subject}
                                                </p>
                                                {!thread.isRead && <Badge variant="secondary" className="text-xs">New</Badge>}
                                              </div>
                                              <p className="text-sm text-gray-600">
                                                {thread.messageCount} messages • Last: {format(new Date(thread.lastMessageDate), 'MMM d, h:mm a')}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent className="mt-2 ml-7 space-y-2">
                                        {leadEmails
                                          .filter(email => email.threadId === thread.threadId)
                                          .sort((a, b) => new Date(a.sentAt || a.receivedAt || '').getTime() - new Date(b.sentAt || b.receivedAt || '').getTime())
                                          .map((email) => (
                                            <div key={email.id} className="p-3 bg-gray-50 rounded-lg">
                                              <div className="flex items-start justify-between mb-2">
                                                <div>
                                                  <p className="text-sm font-medium">
                                                    {email.isInbound ? `From: ${email.fromEmail}` : `To: ${email.toEmail}`}
                                                  </p>
                                                  <p className="text-xs text-gray-500">
                                                    {email.sentAt ? format(new Date(email.sentAt), 'MMM d, h:mm a') : 
                                                     email.receivedAt ? format(new Date(email.receivedAt), 'MMM d, h:mm a') : ''}
                                                  </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  {email.openedAt && (
                                                    <Badge variant="outline" className="text-xs">
                                                      <Eye className="w-3 h-3 mr-1" />
                                                      Opened
                                                    </Badge>
                                                  )}
                                                  {email.clickedAt && (
                                                    <Badge variant="outline" className="text-xs">
                                                      <MousePointer className="w-3 h-3 mr-1" />
                                                      Clicked
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <p className="text-sm text-gray-700">{email.snippet}</p>
                                            </div>
                                          ))}
                                        
                                        {/* Quick Reply Section */}
                                        <div className="p-3 border rounded-lg bg-white">
                                          <Textarea
                                            placeholder="Type your reply..."
                                            className="mb-2"
                                            value={replyMessage[thread.threadId] || ''}
                                            onChange={(e) => setReplyMessage(prev => ({ ...prev, [thread.threadId]: e.target.value }))}
                                            data-testid={`reply-input-${thread.threadId}`}
                                          />
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500">Quick reply to thread</p>
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                if (replyMessage[thread.threadId]) {
                                                  quickReplyMutation.mutate({
                                                    leadId: lead.id,
                                                    threadId: thread.threadId,
                                                    message: replyMessage[thread.threadId]
                                                  });
                                                }
                                              }}
                                              disabled={!replyMessage[thread.threadId] || quickReplyMutation.isPending}
                                              data-testid={`send-reply-${thread.threadId}`}
                                            >
                                              <Send className="w-4 h-4 mr-1" />
                                              {quickReplyMutation.isPending ? 'Sending...' : 'Send Reply'}
                                            </Button>
                                          </div>
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  ))
                                ) : leadEmails.length > 0 ? (
                                  <div className="space-y-2">
                                    {leadEmails.map((email) => (
                                      <div key={email.id} className="p-3 border rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                          <div>
                                            <p className="text-sm font-medium">
                                              {email.isInbound ? `From: ${email.fromEmail}` : `To: ${email.toEmail}`}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {email.sentAt ? format(new Date(email.sentAt), 'MMM d, h:mm a') : 
                                               email.receivedAt ? format(new Date(email.receivedAt), 'MMM d, h:mm a') : ''}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {email.openedAt && (
                                              <Badge variant="outline" className="text-xs">
                                                <Eye className="w-3 h-3 mr-1" />
                                                Opened
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <h5 className="font-medium text-sm mb-1">{email.subject}</h5>
                                        <p className="text-sm text-gray-700">{email.snippet}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No email conversations yet</p>
                                    <p className="text-xs mt-1">Sync your inbox to see email history</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Calendar className="w-8 h-8 text-[#B8860B] mt-1" />
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">
                              {appointment.firstName} {appointment.lastName}
                            </h3>
                            <p className="text-[#1e3a8a] font-medium">
                              {appointment.appointmentType} • {appointment.projectType}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {appointment.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {appointment.phone}
                              </span>
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-gray-600 italic">"{appointment.notes}"</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div>
                            <p className="font-semibold text-[#1e3a8a]">
                              {format(new Date(appointment.appointmentDate), 'MMM d, yyyy')}
                            </p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(appointment.appointmentDate), 'h:mm a')}
                            </p>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          {appointment.estimatedBudget && (
                            <p className="text-sm font-medium text-green-600">
                              {appointment.estimatedBudget}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="affiliates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliates.map((affiliate) => (
                    <div key={affiliate.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#B8860B] text-white rounded-full flex items-center justify-center font-semibold">
                            {affiliate.firstName[0]}{affiliate.lastName[0]}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">
                              {affiliate.firstName} {affiliate.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">ID: {affiliate.affiliateId}</p>
                            <p className="text-sm text-gray-600">{affiliate.email}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className={getStatusColor(affiliate.status)}>
                            {affiliate.status}
                          </Badge>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">{affiliate.lifetimeReferrals}</span> referrals
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">{affiliate.lifetimeConsultations}</span> consultations
                            </p>
                            <p className="text-sm font-semibold text-green-600">
                              ${affiliate.totalCommissions.toFixed(2)} earned
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email-activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Email Activity Feed
                  </span>
                  <Badge variant="outline">
                    {activityFeed.length} Total Activities
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-full ${activity.isInbound ? 'bg-blue-100' : 'bg-green-100'}`}>
                              {activity.isInbound ? (
                                <Inbox className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Send className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">
                                  {activity.isInbound ? 'Received from' : 'Sent to'} {activity.isInbound ? activity.fromEmail : activity.toEmail}
                                </p>
                                {activity.openedAt && (
                                  <Badge variant="outline" className="text-xs">
                                    <Eye className="w-3 h-3 mr-1" />
                                    Opened
                                  </Badge>
                                )}
                                {activity.clickedAt && (
                                  <Badge variant="outline" className="text-xs">
                                    <MousePointer className="w-3 h-3 mr-1" />
                                    Clicked
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-sm text-gray-900 mb-1">
                                {activity.subject}
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {activity.snippet}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>
                                  {activity.sentAt ? format(new Date(activity.sentAt), 'MMM d, h:mm a') : 
                                   activity.receivedAt ? format(new Date(activity.receivedAt), 'MMM d, h:mm a') : 'Unknown time'}
                                </span>
                                {activity.threadId && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    Thread: {activity.threadId.slice(0, 8)}...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-2"
                            onClick={() => {
                              const lead = leads.find(l => l.id === activity.leadId);
                              if (lead) {
                                setSelectedTab('leads');
                                setExpandedLeadEmail(lead.id);
                              }
                            }}
                            data-testid={`view-lead-${activity.id}`}
                          >
                            View Lead
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice-calls" className="space-y-4">
            <VoiceCallDashboard />
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="w-5 h-5" />
                  Media Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MediaManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Single Lead Confirmation Dialog */}
      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {leadToDelete?.firstName} {leadToDelete?.lastName} ({leadToDelete?.email}) 
              from your CRM along with all associated data including voice calls, email conversations, and appointments.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leadToDelete && deleteLeadMutation.mutate(leadToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedLeads.size} Selected Leads?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedLeads.size} lead(s) from your CRM along with all their 
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteLeadsMutation.mutate(Array.from(selectedLeads))}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedLeads.size} Lead(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}