import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, Calendar, Clock, Zap, Power, Settings, PenTool, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function BlogAutomationPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  // Fetch scheduler status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/blog/automation/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching status:", error);
      toast({
        title: "Error",
        description: "Failed to fetch automation status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleAutoPublishing = async () => {
    try {
      const endpoint = status?.enabled 
        ? '/api/blog/automation/disable'
        : '/api/blog/automation/enable';
      
      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
        toast({
          title: data.status.enabled ? "Enabled" : "Disabled",
          description: `Auto-publishing has been ${data.status.enabled ? 'enabled' : 'disabled'}`
        });
      }
    } catch (error) {
      console.error("Error toggling auto-publishing:", error);
      toast({
        title: "Error",
        description: "Failed to update auto-publishing setting",
        variant: "destructive"
      });
    }
  };

  const generateNow = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/blog/automation/generate-now', { 
        method: 'POST' 
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success! 🎉",
          description: "A new blog post has been generated and published"
        });
      } else {
        throw new Error(data.error || "Failed to generate blog post");
      }
    } catch (error) {
      console.error("Error generating blog:", error);
      toast({
        title: "Error",
        description: "Failed to generate blog post. Please ensure OpenAI API key is configured.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const updateConfig = async (field: string, value: any) => {
    try {
      const response = await fetch('/api/blog/automation/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      
      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
        toast({
          title: "Updated",
          description: "Schedule configuration has been updated"
        });
      }
    } catch (error) {
      console.error("Error updating config:", error);
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive"
      });
    }
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/crm">
            <Button variant="ghost" className="mb-4">
              ← Back to CRM
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-10 h-10 text-luxury-gold" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Blog Automation</h1>
                <p className="text-gray-600 mt-1">Automatic weekly blog post generation powered by AI</p>
              </div>
            </div>
            <Badge className={status?.enabled ? "bg-green-500" : "bg-gray-400"}>
              {status?.enabled ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {/* Main Controls */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Power className="w-5 h-5" />
                Automation Status
              </CardTitle>
              <CardDescription>
                Control the automatic blog generation system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-publish" className="text-base font-medium">
                  Auto-Publish Weekly Blogs
                </Label>
                <Switch
                  id="auto-publish"
                  checked={status?.enabled || false}
                  onCheckedChange={toggleAutoPublishing}
                />
              </div>
              
              {status?.enabled && status?.nextRunTime && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Next Blog Generation:</span>
                  </div>
                  <p className="text-blue-900 font-semibold mt-1">
                    {new Date(status.nextRunTime).toLocaleString()}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={generateNow}
                disabled={generating}
                className="w-full bg-luxury-gold hover:bg-yellow-600 text-white"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Blog Post Now
                  </>
                )}
              </Button>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>• AI generates pool-related content automatically</p>
                <p>• Posts are published immediately when generated</p>
                <p>• Each post includes SEO optimization</p>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule Configuration
              </CardTitle>
              <CardDescription>
                Set when new blog posts should be generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="day-select">Day of Week</Label>
                <Select
                  value={status?.config?.dayOfWeek?.toString()}
                  onValueChange={(value) => updateConfig('dayOfWeek', parseInt(value))}
                >
                  <SelectTrigger id="day-select">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hour-select">Hour (24h)</Label>
                  <Select
                    value={status?.config?.hour?.toString()}
                    onValueChange={(value) => updateConfig('hour', parseInt(value))}
                  >
                    <SelectTrigger id="hour-select">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="minute-select">Minute</Label>
                  <Select
                    value={status?.config?.minute?.toString()}
                    onValueChange={(value) => updateConfig('minute', parseInt(value))}
                  >
                    <SelectTrigger id="minute-select">
                      <SelectValue placeholder="Minute" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 15, 30, 45].map((minute) => (
                        <SelectItem key={minute} value={minute.toString()}>
                          :{minute.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Settings className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Timezone: Eastern (Georgia)</p>
                    <p className="text-xs mt-1">All times are in Eastern Time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              AI Blog Writer Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🎯 Smart Topics</h3>
                <p className="text-sm text-gray-600">
                  Rotates through 15+ pool-related topics including trends, maintenance, design, and technology
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">📍 Local SEO</h3>
                <p className="text-sm text-gray-600">
                  Automatically includes Georgia locations and seasonal considerations for better rankings
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">✨ Quality Content</h3>
                <p className="text-sm text-gray-600">
                  Generates 800-1200 word articles with proper headers, tags, and meta descriptions
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🖼️ Auto Images</h3>
                <p className="text-sm text-gray-600">
                  Assigns relevant pool images to each blog post automatically
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🚀 Instant Publishing</h3>
                <p className="text-sm text-gray-600">
                  Posts go live immediately with proper URLs and SEO optimization
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🤖 Fully Autonomous</h3>
                <p className="text-sm text-gray-600">
                  Runs automatically every week without any manual intervention needed
                </p>
              </div>
            </div>

            {status?.apiKeyConfigured === false && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      OpenAI API Key Required
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please configure your OPENAI_API_KEY environment variable to enable AI blog generation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* View Blog Button */}
        <div className="mt-6 text-center">
          <Link href="/blog">
            <Button variant="outline" size="lg">
              View Blog →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}