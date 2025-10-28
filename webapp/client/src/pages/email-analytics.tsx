import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, RadialBarChart, 
  RadialBar, Funnel, FunnelChart, LabelList 
} from "recharts";
import { 
  Download, Mail, Users, TrendingUp, Clock, Activity, 
  Target, MousePointer, Reply, Send, Eye, BarChart3,
  Calendar, RefreshCw, FileSpreadsheet, FileText
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Main dashboard component
export default function EmailAnalytics() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("30");
  const [selectedCampaign, setSelectedCampaign] = useState("all");

  // Calculate date range
  const getDateRange = () => {
    let end = new Date();
    let start = new Date();
    
    switch(dateRange) {
      case "7":
        start = subDays(end, 7);
        break;
      case "14":
        start = subDays(end, 14);
        break;
      case "30":
        start = subDays(end, 30);
        break;
      case "90":
        start = subDays(end, 90);
        break;
      case "week":
        start = startOfWeek(end);
        end = endOfWeek(end);
        break;
      case "month":
        start = startOfMonth(end);
        end = endOfMonth(end);
        break;
      default:
        start = subDays(end, 30);
    }
    
    return { 
      start: start.toISOString(), 
      end: end.toISOString() 
    };
  };

  // Fetch overall email metrics
  const { data: emailMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/analytics/email-metrics', dateRange],
    queryFn: async () => {
      const range = getDateRange();
      const response = await fetch(
        `/api/analytics/email-metrics?startDate=${range.start}&endDate=${range.end}`
      );
      const data = await response.json();
      return data.data;
    }
  });

  // Fetch campaign performance
  const { data: campaignPerformance, isLoading: campaignLoading } = useQuery({
    queryKey: ['/api/analytics/campaign-performance', dateRange],
    queryFn: async () => {
      const range = getDateRange();
      const response = await fetch(
        `/api/analytics/campaign-performance?startDate=${range.start}&endDate=${range.end}`
      );
      const data = await response.json();
      return data.data;
    }
  });

  // Fetch engagement heatmap
  const { data: engagementHeatmap, isLoading: heatmapLoading } = useQuery({
    queryKey: ['/api/analytics/engagement-heatmap', dateRange],
    queryFn: async () => {
      const range = getDateRange();
      const response = await fetch(
        `/api/analytics/engagement-heatmap?startDate=${range.start}&endDate=${range.end}`
      );
      const data = await response.json();
      return data.data;
    }
  });

  // Fetch top templates
  const { data: topTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/analytics/top-templates'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/top-templates?limit=5');
      const data = await response.json();
      return data.data;
    }
  });

  // Fetch lead funnel
  const { data: leadFunnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['/api/analytics/lead-funnel'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/lead-funnel');
      const data = await response.json();
      return data.data;
    }
  });

  // Fetch response times
  const { data: responseTimes, isLoading: responseLoading } = useQuery({
    queryKey: ['/api/analytics/response-times', dateRange],
    queryFn: async () => {
      const range = getDateRange();
      const response = await fetch(
        `/api/analytics/response-times?startDate=${range.start}&endDate=${range.end}`
      );
      const data = await response.json();
      return data.data;
    }
  });

  // Fetch lead engagement scores
  const { data: leadScores, isLoading: scoresLoading } = useQuery({
    queryKey: ['/api/analytics/lead-engagement-scores'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/lead-engagement-scores?limit=10');
      const data = await response.json();
      return data.data;
    }
  });

  // Fetch optimal send times
  const { data: optimalTimes, isLoading: optimalLoading } = useQuery({
    queryKey: ['/api/analytics/optimal-send-times'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/optimal-send-times');
      const data = await response.json();
      return data.data;
    }
  });

  // Export to CSV
  const exportCSV = useMutation({
    mutationFn: async () => {
      const range = getDateRange();
      const response = await fetch(
        `/api/analytics/export/csv?startDate=${range.start}&endDate=${range.end}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Analytics data has been exported to CSV.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Unable to export analytics data.",
        variant: "destructive"
      });
    }
  });

  // Generate PDF report
  const generatePDF = () => {
    const doc = new jsPDF();
    const date = format(new Date(), 'MMM dd, yyyy');
    
    // Title
    doc.setFontSize(20);
    doc.text('Email Analytics Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${date}`, 20, 30);
    doc.text(`Period: ${emailMetrics?.period || 'Last 30 days'}`, 20, 38);
    
    // Overall metrics
    doc.setFontSize(16);
    doc.text('Overall Performance', 20, 55);
    doc.setFontSize(11);
    
    const metricsData = [
      ['Metric', 'Value'],
      ['Total Sent', emailMetrics?.totalSent?.toString() || '0'],
      ['Total Delivered', emailMetrics?.totalDelivered?.toString() || '0'],
      ['Open Rate', `${emailMetrics?.openRate?.toFixed(2) || 0}%`],
      ['Click Rate', `${emailMetrics?.clickRate?.toFixed(2) || 0}%`],
      ['Reply Rate', `${emailMetrics?.replyRate?.toFixed(2) || 0}%`],
    ];
    
    (doc as any).autoTable({
      head: [metricsData[0]],
      body: metricsData.slice(1),
      startY: 60,
      theme: 'striped'
    });
    
    // Campaign performance
    if (campaignPerformance && campaignPerformance.length > 0) {
      doc.setFontSize(16);
      doc.text('Campaign Performance', 20, (doc as any).lastAutoTable.finalY + 20);
      
      const campaignData = campaignPerformance.map((c: any) => [
        c.campaignName,
        c.totalSent,
        `${c.openRate.toFixed(1)}%`,
        `${c.clickRate.toFixed(1)}%`,
        `${c.engagementScore.toFixed(1)}`
      ]);
      
      (doc as any).autoTable({
        head: [['Campaign', 'Sent', 'Open Rate', 'Click Rate', 'Score']],
        body: campaignData,
        startY: (doc as any).lastAutoTable.finalY + 25,
        theme: 'striped'
      });
    }
    
    // Save PDF
    doc.save(`email-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: "PDF Generated",
      description: "Analytics report has been downloaded.",
    });
  };

  // Refresh all data
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    toast({
      title: "Data Refreshed",
      description: "All analytics data has been refreshed.",
    });
  };

  // Prepare heatmap data for visualization
  const prepareHeatmapData = () => {
    if (!engagementHeatmap) return [];
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return days.map(day => {
      const dayData: any = { day };
      hours.forEach(hour => {
        const fullDay = day === 'Mon' ? 'Monday' :
                       day === 'Tue' ? 'Tuesday' :
                       day === 'Wed' ? 'Wednesday' :
                       day === 'Thu' ? 'Thursday' :
                       day === 'Fri' ? 'Friday' :
                       day === 'Sat' ? 'Saturday' : 'Sunday';
        
        const dataPoint = engagementHeatmap.find(
          (d: any) => d.dayOfWeek === fullDay && d.hour === hour
        );
        dayData[`h${hour}`] = dataPoint?.engagementScore || 0;
      });
      return dayData;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
            Email Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400" data-testid="text-page-description">
            Monitor email performance, engagement metrics, and campaign effectiveness
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]" data-testid="select-date-range">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={refreshData}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => exportCSV.mutate()}
              disabled={exportCSV.isPending}
              data-testid="button-export-csv"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={generatePDF}
              disabled={!emailMetrics}
              data-testid="button-generate-pdf"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate PDF
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-sent">
                {metricsLoading ? <Skeleton className="h-8 w-20" /> : emailMetrics?.totalSent || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {emailMetrics?.period || 'Last 30 days'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-open-rate">
                {metricsLoading ? <Skeleton className="h-8 w-20" /> : 
                  `${emailMetrics?.openRate?.toFixed(1) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {emailMetrics?.totalOpened || 0} opened
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-click-rate">
                {metricsLoading ? <Skeleton className="h-8 w-20" /> : 
                  `${emailMetrics?.clickRate?.toFixed(1) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {emailMetrics?.totalClicked || 0} clicked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
              <Reply className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-reply-rate">
                {metricsLoading ? <Skeleton className="h-8 w-20" /> : 
                  `${emailMetrics?.replyRate?.toFixed(1) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {emailMetrics?.totalReplied || 0} replied
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-delivery-rate">
                {metricsLoading ? <Skeleton className="h-8 w-20" /> : 
                  `${emailMetrics?.deliveryRate?.toFixed(1) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {emailMetrics?.totalDelivered || 0} delivered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="leads">Lead Scores</TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance Comparison</CardTitle>
                <CardDescription>
                  Compare effectiveness across different email campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaignLoading ? (
                  <Skeleton className="h-[400px]" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={campaignPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="campaignName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="openRate" fill="#8884d8" name="Open Rate %" />
                      <Bar dataKey="clickRate" fill="#82ca9d" name="Click Rate %" />
                      <Bar dataKey="replyRate" fill="#ffc658" name="Reply Rate %" />
                      <Bar dataKey="engagementScore" fill="#ff7c7c" name="Engagement Score" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Send Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={campaignPerformance}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.campaignName}: ${entry.totalSent}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalSent"
                      >
                        {campaignPerformance?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Response Times</CardTitle>
                  <CardDescription>Hours to first response by campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={campaignPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="campaignName" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="averageResponseTime" 
                        stroke="#8884d8" 
                        name="Avg Response (hrs)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Heatmap</CardTitle>
                <CardDescription>
                  Best times for email engagement (darker = higher engagement)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {heatmapLoading ? (
                  <Skeleton className="h-[400px]" />
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      <div className="grid grid-cols-25 gap-1">
                        <div className="col-span-1"></div>
                        {Array.from({ length: 24 }, (_, i) => (
                          <div key={i} className="text-xs text-center">
                            {i}:00
                          </div>
                        ))}
                        {prepareHeatmapData().map((dayData: any) => (
                          <>
                            <div className="text-sm font-medium">{dayData.day}</div>
                            {Array.from({ length: 24 }, (_, i) => {
                              const score = dayData[`h${i}`];
                              const opacity = score > 0 ? Math.min(score / 100, 1) : 0.1;
                              return (
                                <div
                                  key={`${dayData.day}-${i}`}
                                  className="aspect-square rounded"
                                  style={{
                                    backgroundColor: `rgba(59, 130, 246, ${opacity})`
                                  }}
                                  title={`${dayData.day} ${i}:00 - Score: ${score}`}
                                />
                              );
                            })}
                          </>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimal Send Times</CardTitle>
                <CardDescription>
                  Best times to send emails based on engagement data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {optimalLoading ? (
                  <Skeleton className="h-[200px]" />
                ) : (
                  <div className="space-y-2">
                    {optimalTimes?.map((time: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            #{index + 1}
                          </Badge>
                          <div>
                            <div className="font-medium">
                              {time.dayOfWeek} at {time.hour}:00
                            </div>
                            <div className="text-sm text-gray-500">
                              Engagement Score: {time.score}
                            </div>
                          </div>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Email Templates</CardTitle>
                <CardDescription>
                  Templates ranked by effectiveness score
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <Skeleton className="h-[400px]" />
                ) : (
                  <div className="space-y-4">
                    {topTemplates?.map((template: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={index === 0 ? "default" : "secondary"}>
                                #{index + 1}
                              </Badge>
                              <h3 className="font-semibold text-sm">
                                {template.subject}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              {template.previewText}
                            </p>
                          </div>
                          <Badge variant="outline">
                            Score: {template.effectivenessScore.toFixed(1)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Sent:</span>
                            <span className="ml-1 font-medium">{template.sentCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Open Rate:</span>
                            <span className="ml-1 font-medium">{template.openRate.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Click Rate:</span>
                            <span className="ml-1 font-medium">{template.clickRate.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Reply Rate:</span>
                            <span className="ml-1 font-medium">{template.replyRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Funnel Tab */}
          <TabsContent value="funnel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Conversion Funnel</CardTitle>
                <CardDescription>
                  Track lead progression through engagement stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                {funnelLoading ? (
                  <Skeleton className="h-[400px]" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={leadFunnel} 
                      layout="horizontal"
                      margin={{ left: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="stage" type="category" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8">
                        <LabelList dataKey="percentage" position="right" formatter={(value: any) => `${value.toFixed(1)}%`} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {leadFunnel?.slice(0, 3).map((stage: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{stage.stage}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{stage.count}</div>
                    <div className="text-sm text-gray-500">
                      {stage.percentage.toFixed(1)}% of total
                    </div>
                    {stage.averageTimeInStage > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        Avg time: {stage.averageTimeInStage}h
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Responses Tab */}
          <TabsContent value="responses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Analytics</CardTitle>
                <CardDescription>
                  Analysis of email response times
                </CardDescription>
              </CardHeader>
              <CardContent>
                {responseLoading ? (
                  <Skeleton className="h-[300px]" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 border rounded">
                        <div className="text-sm text-gray-500">Average</div>
                        <div className="text-2xl font-bold">
                          {responseTimes?.averageResponseTime?.toFixed(1) || 0}h
                        </div>
                      </div>
                      <div className="p-4 border rounded">
                        <div className="text-sm text-gray-500">Median</div>
                        <div className="text-2xl font-bold">
                          {responseTimes?.medianResponseTime?.toFixed(1) || 0}h
                        </div>
                      </div>
                      <div className="p-4 border rounded">
                        <div className="text-sm text-gray-500">Fastest</div>
                        <div className="text-2xl font-bold">
                          {responseTimes?.fastestResponseTime?.toFixed(1) || 0}h
                        </div>
                      </div>
                      <div className="p-4 border rounded">
                        <div className="text-sm text-gray-500">Slowest</div>
                        <div className="text-2xl font-bold">
                          {responseTimes?.slowestResponseTime?.toFixed(1) || 0}h
                        </div>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={responseTimes?.responseTimeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#82ca9d" name="Responses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lead Scores Tab */}
          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Engaged Leads</CardTitle>
                <CardDescription>
                  Leads ranked by engagement score
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scoresLoading ? (
                  <Skeleton className="h-[400px]" />
                ) : (
                  <div className="space-y-3">
                    {leadScores?.map((lead: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-lg font-bold">{lead.score}</span>
                          </div>
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-gray-500">{lead.email}</div>
                            <div className="flex gap-4 mt-1 text-xs text-gray-400">
                              <span>📧 {lead.totalEmails} emails</span>
                              <span>👁 {lead.opens} opens</span>
                              <span>🖱 {lead.clicks} clicks</span>
                              <span>💬 {lead.replies} replies</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            lead.trend === 'increasing' ? 'default' : 
                            lead.trend === 'decreasing' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {lead.trend === 'increasing' ? '↑' : 
                           lead.trend === 'decreasing' ? '↓' : '→'} {lead.trend}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}