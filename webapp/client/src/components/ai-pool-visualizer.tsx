import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Sparkles, Download, Loader2, Waves, TreePalm, Sun, Hammer, Info } from "lucide-react";
import { Link } from "wouter";
import { z } from "zod";

// Lead capture schema for popup form
const leadSchema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().optional(),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone number required"),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the privacy policy and terms of service",
  }),
});

type LeadFormData = z.infer<typeof leadSchema>;

// Pool customization options
const POOL_OPTIONS = {
  shape: ['Freeform', 'Geometric', 'Kidney', 'Infinity Edge', 'Lap Pool'],
  size: ['Small (Plunge Pool)', 'Medium (15x30 ft)', 'Large (20x40 ft)', 'Extra Large (Custom)'],
  material: ['Plaster', 'Pebble', 'Tile', 'Fiberglass'],
};

// Deck and patio material options
const DECK_OPTIONS = {
  material: ['Stamped Concrete', 'Slate', 'Natural Stone', 'Pavers', 'Wood Decking', 'Composite'],
};

// Key features including hot tub, spa, cabana, water slide
const FEATURE_OPTIONS = [
  'Water Slide', 
  'Cabana', 
  'Outdoor Kitchen', 
  'Fire Pit', 
  'Waterfall', 
  'Grotto', 
  'Hot Tub',
  'Spa',
  'Swim-Up Bar',
  'Tanning Ledge',
  'Beach Entry',
  'Rock Formation'
];

// Style and design options
const STYLE_OPTIONS = {
  design: [
    'Modern', 
    'Tropical Oasis', 
    'Mediterranean', 
    'Classic Luxury', 
    'Naturalistic Lagoon', 
    'Rustic Charm', 
    'Tuscan Villa'
  ],
  landscaping: [
    'Lush Tropical', 
    'Woodland Retreat', 
    'Minimalist Xeriscape', 
    'English Garden', 
    'Japanese Zen'
  ],
  angle: [
    'Aerial View', 
    'Eye-Level', 
    'Dramatic Low Angle', 
    'Wide Angle Shot'
  ],
  aspectRatio: [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Classic (4:3)' },
    { value: '3:2', label: 'Photography (3:2)' },
    { value: '21:9', label: 'Cinematic (21:9)' }
  ]
};

// Fun loading messages
const LOADING_MESSAGES = [
  { icon: Waves, text: "Analyzing your backyard dimensions...", progress: 10 },
  { icon: TreePalm, text: "Designing the perfect pool shape...", progress: 25 },
  { icon: Sun, text: "Adding tropical landscaping touches...", progress: 40 },
  { icon: Hammer, text: "Selecting premium materials...", progress: 55 },
  { icon: Sparkles, text: "Applying luxury finishes...", progress: 70 },
  { icon: Waves, text: "Perfecting water features...", progress: 85 },
  { icon: TreePalm, text: "Final touches on your paradise...", progress: 95 },
];

export default function AIPoolVisualizer() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg'>('png');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadFormData, setLeadFormData] = useState<LeadFormData & { city?: string; state?: string }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    privacyConsent: false,
  });
  const [leadFormErrors, setLeadFormErrors] = useState<any>({});
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);
  const [leadSubmissionType, setLeadSubmissionType] = useState<'guest' | 'full' | null>(null);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [downloadType, setDownloadType] = useState<'watermark' | 'high-res'>('watermark');
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Check session storage for existing lead info
  useEffect(() => {
    const sessionLead = sessionStorage.getItem('poolVisualizerLead');
    if (sessionLead) {
      setHasSubmittedLead(true);
      const leadData = JSON.parse(sessionLead);
      setLeadSubmissionType(leadData.type || 'guest');
    }
  }, []);
  
  // Capture affiliate ID from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setAffiliateId(ref);
      // Track the referral visit
      fetch('/api/affiliates/track-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref })
      }).catch(console.error);
    }
  }, []);

  // Animate loading progress and messages
  useEffect(() => {
    if (isGenerating) {
      setLoadingProgress(0);
      setCurrentMessageIndex(0);
      
      // Progress animation
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) return 95; // Cap at 95% until actual completion
          return prev + (Math.random() * 3 + 1); // Random increment between 1-4%
        });
      }, 200);
      
      // Message cycling
      const messageInterval = setInterval(() => {
        setCurrentMessageIndex(prev => {
          if (prev >= LOADING_MESSAGES.length - 1) return prev;
          return prev + 1;
        });
      }, 2500);
      
      return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
      };
    } else {
      // Complete the progress when done
      if (loadingProgress > 0) {
        setLoadingProgress(100);
        setTimeout(() => {
          setLoadingProgress(0);
          setCurrentMessageIndex(0);
        }, 500);
      }
    }
  }, [isGenerating]);

  // Pool configuration state
  const [selections, setSelections] = useState({
    poolShape: POOL_OPTIONS.shape[0],
    poolSize: POOL_OPTIONS.size[1],
    poolMaterial: POOL_OPTIONS.material[0],
    deckMaterial: DECK_OPTIONS.material[0],
    design: STYLE_OPTIONS.design[0],
    landscaping: STYLE_OPTIONS.landscaping[0],
    angle: STYLE_OPTIONS.angle[0],
    aspectRatio: STYLE_OPTIONS.aspectRatio[1].value, // Default to 16:9 landscape
    features: new Set<string>(),
  });

  const handleSelectionChange = (category: string, value: string) => {
    setSelections(prev => ({ ...prev, [category]: value }));
  };

  const handleFeatureChange = (feature: string) => {
    setSelections(prev => {
      const newFeatures = new Set(prev.features);
      if (newFeatures.has(feature)) {
        newFeatures.delete(feature);
      } else {
        newFeatures.add(feature);
      }
      return { ...prev, features: newFeatures };
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 10MB",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setGeneratedImage(null);
        setHasSubmittedLead(false); // Reset lead submission when new image uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVisualization = useMutation({
    mutationFn: async () => {
      if (!uploadedImage) throw new Error("No image uploaded");
      
      const response = await apiRequest("POST", "/api/generate-backyard-transformation", {
        imageData: uploadedImage,
        poolShape: selections.poolShape,
        poolSize: selections.poolSize,
        poolMaterial: selections.poolMaterial,
        deckMaterial: selections.deckMaterial,
        design: selections.design,
        landscaping: selections.landscaping,
        angle: selections.angle,
        aspectRatio: selections.aspectRatio,
        features: Array.from(selections.features),
      });
      
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        toast({
          title: "Success!",
          description: "Your dream backyard has been generated",
        });
      } else {
        throw new Error(result.error || "Failed to generate visualization");
      }
    },
    onError: (error) => {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate visualization",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const handleGenerateClick = async () => {
    if (!uploadedImage) {
      toast({
        title: "No image",
        description: "Please upload a photo of your backyard first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateVisualization.mutate();
  };

  const handleDownloadClick = (type: 'watermark' | 'high-res') => {
    setDownloadType(type);
    
    // Always require lead info for any download
    if (!hasSubmittedLead) {
      setShowLeadModal(true);
      return;
    }
    
    // User already submitted lead - proceed with download
    // Add watermark for free version, no watermark for high-res
    performDownload(type === 'watermark');
  };

  const handleLeadSubmit = async (type: 'guest' | 'full') => {
    // Prevent duplicate submissions
    if (isSubmittingLead) return;
    
    setIsSubmittingLead(true);
    setLeadSubmissionType(type);
    
    try {
      let leadData: any;
      
      if (type === 'guest') {
        // Guest submission - validate required fields
        const errors: any = {};
        
        if (!leadFormData.firstName || leadFormData.firstName.trim().length < 2) {
          errors.firstName = "First name required";
        }
        if (!leadFormData.lastName || leadFormData.lastName.trim().length < 1) {
          errors.lastName = "Last name required";
        }
        if (!leadFormData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadFormData.email)) {
          errors.email = "Valid email required";
        }
        if (!leadFormData.city || leadFormData.city.trim().length < 2) {
          errors.city = "City required";
        }
        if (!leadFormData.state || leadFormData.state.trim().length < 2) {
          errors.state = "State required";
        }
        
        if (Object.keys(errors).length > 0) {
          setLeadFormErrors(errors);
          setIsSubmittingLead(false);
          return;
        }
        
        leadData = {
          email: leadFormData.email,
          firstName: leadFormData.firstName,
          lastName: leadFormData.lastName,
          phone: '000-000-0000', // Guest mode doesn't require phone
          city: leadFormData.city,
          state: leadFormData.state,
          projectType: "Backyard Transformation - AI Visualization (Guest)",
          message: `Pool: ${selections.poolShape} ${selections.poolSize}, Features: ${Array.from(selections.features).join(", ")}, Style: ${selections.design}`,
          source: "AI Pool Visualizer - Guest",
          affiliateId: affiliateId,
        };
      } else {
        // Full account creation
        const validatedData = leadSchema.parse(leadFormData);
        leadData = {
          ...validatedData,
          projectType: "Backyard Transformation - AI Visualization",
          message: `Pool: ${selections.poolShape} ${selections.poolSize}, Features: ${Array.from(selections.features).join(", ")}, Style: ${selections.design}`,
          source: "AI Pool Visualizer",
          affiliateId: affiliateId,
        };
      }
      
      // Send to CRM
      await apiRequest("POST", "/api/leads", leadData);
      
      // Save to session storage
      sessionStorage.setItem('poolVisualizerLead', JSON.stringify({
        type: type,
        email: leadFormData.email,
        timestamp: Date.now()
      }));
      
      // Update state
      setHasSubmittedLead(true);
      setShowLeadModal(false);
      setLeadFormErrors({});
      
      // Invalidate leads query to update CRM
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      
      toast({
        title: type === 'guest' ? "Email saved!" : "Account created!",
        description: type === 'guest' ? 
          "Your design is ready for download." :
          "Welcome! Your design is ready and we'll be in touch soon.",
      });
      
      // Perform download based on original button clicked
      // downloadType was set when user clicked the download button
      setTimeout(() => performDownload(downloadType === 'watermark'), 500);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0]] = err.message;
          }
        });
        setLeadFormErrors(errors);
      } else {
        toast({
          title: "Error",
          description: "Failed to save your information. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const performDownload = (addWatermark: boolean = false) => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw the main image
        ctx.drawImage(img, 0, 0);
        
        // Add watermark if requested
        if (addWatermark) {
          // Semi-transparent overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Watermark text
          const watermarkText = 'Serenity Custom Pools LLC';
          const fontSize = Math.min(canvas.width / 20, 48);
          
          ctx.save();
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 2;
          
          // Center watermark
          const textMetrics = ctx.measureText(watermarkText);
          const textWidth = textMetrics.width;
          const x = (canvas.width - textWidth) / 2;
          const y = canvas.height - fontSize * 2;
          
          ctx.strokeText(watermarkText, x, y);
          ctx.fillText(watermarkText, x, y);
          
          // Add website
          const websiteText = 'www.serenitycustompools.com';
          ctx.font = `${fontSize * 0.5}px Arial`;
          const websiteMetrics = ctx.measureText(websiteText);
          const websiteX = (canvas.width - websiteMetrics.width) / 2;
          
          ctx.strokeText(websiteText, websiteX, y + fontSize * 0.8);
          ctx.fillText(websiteText, websiteX, y + fontSize * 0.8);
          
          ctx.restore();
        }
        
        // Download
        link.href = canvas.toDataURL(`image/${downloadFormat}`);
        link.download = addWatermark ? 
          `serenity-pool-design-preview.${downloadFormat}` : 
          `serenity-pool-design-hires.${downloadFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    
    img.onerror = () => {
      toast({
        title: "Download failed",
        description: "Could not download the image. Please try again.",
        variant: "destructive",
      });
    };
    
    img.src = generatedImage;
  };

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls Panel */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-2xl">Backyard Dream Designer</CardTitle>
          <p className="text-sm text-muted-foreground">
            Powered by Serenity Custom Pools LLC
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pool Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🏊 Pool Configuration</h3>
            <div>
              <Label>Shape</Label>
              <Select value={selections.poolShape} onValueChange={(value) => handleSelectionChange('poolShape', value)}>
                <SelectTrigger data-testid="select-poolShape">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POOL_OPTIONS.shape.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Size</Label>
              <Select value={selections.poolSize} onValueChange={(value) => handleSelectionChange('poolSize', value)}>
                <SelectTrigger data-testid="select-poolSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POOL_OPTIONS.size.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Interior Material</Label>
              <Select value={selections.poolMaterial} onValueChange={(value) => handleSelectionChange('poolMaterial', value)}>
                <SelectTrigger data-testid="select-poolMaterial">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POOL_OPTIONS.material.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deck & Patio */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🌿 Deck & Patio</h3>
            <div>
              <Label>Material</Label>
              <Select value={selections.deckMaterial} onValueChange={(value) => handleSelectionChange('deckMaterial', value)}>
                <SelectTrigger data-testid="select-deckMaterial">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DECK_OPTIONS.material.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Key Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">✨ Key Features</h3>
            <div className="grid grid-cols-2 gap-3">
              {FEATURE_OPTIONS.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={selections.features.has(feature)}
                    onCheckedChange={() => handleFeatureChange(feature)}
                    data-testid={`checkbox-feature-${feature.replace(/\s+/g, '-').toLowerCase()}`}
                  />
                  <Label
                    htmlFor={feature}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Ambiance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🎨 Ambiance</h3>
            <div>
              <Label>Design Style</Label>
              <Select value={selections.design} onValueChange={(value) => handleSelectionChange('design', value)}>
                <SelectTrigger data-testid="select-design">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.design.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Landscaping</Label>
              <Select value={selections.landscaping} onValueChange={(value) => handleSelectionChange('landscaping', value)}>
                <SelectTrigger data-testid="select-landscaping">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.landscaping.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Camera Angle</Label>
              <Select value={selections.angle} onValueChange={(value) => handleSelectionChange('angle', value)}>
                <SelectTrigger data-testid="select-angle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.angle.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Output Format</Label>
              <Select value={selections.aspectRatio} onValueChange={(value) => handleSelectionChange('aspectRatio', value)}>
                <SelectTrigger data-testid="select-aspectRatio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.aspectRatio.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerateClick}
            className="w-full"
            disabled={isGenerating || !uploadedImage}
            data-testid="button-generate"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Your Dream Backyard...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Dream Backyard
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Image Panel */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Your Backyard Transformation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {isGenerating && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-cyan-900/95 to-teal-900/95 backdrop-blur-md flex items-center justify-center z-10">
                <div className="w-full max-w-md px-6">
                  {/* Main Loading Content */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
                    {/* Animated Icon */}
                    <div className="mb-6 relative">
                      <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl animate-pulse" />
                      <div className="relative flex justify-center">
                        {LOADING_MESSAGES[currentMessageIndex] && (() => {
                          const IconComponent = LOADING_MESSAGES[currentMessageIndex].icon;
                          return (
                            <IconComponent className="h-16 w-16 text-cyan-300 animate-bounce" />
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Status Message */}
                    <div className="mb-6 text-center">
                      <p className="text-white font-semibold text-lg mb-2">
                        Creating Your Dream Pool Paradise
                      </p>
                      <p className="text-cyan-200 text-sm animate-fade-in">
                        {LOADING_MESSAGES[currentMessageIndex]?.text || "Preparing your design..."}
                      </p>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress 
                        value={loadingProgress} 
                        className="h-3 bg-white/10 shadow-inner"
                      />
                      <p className="text-cyan-100 text-xs text-center font-medium">
                        {Math.round(loadingProgress)}% Complete
                      </p>
                    </div>
                    
                    {/* Fun Facts */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <p className="text-cyan-100 text-xs text-center italic">
                        ✨ Did you know? Our AI analyzes over 10,000 luxury pool designs to create your perfect backyard!
                      </p>
                    </div>
                  </div>
                  
                  {/* Floating Particles Effect */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                    <div className="absolute top-20 right-20 w-3 h-3 bg-blue-400 rounded-full animate-ping animation-delay-1000" />
                    <div className="absolute bottom-20 left-20 w-2 h-2 bg-teal-400 rounded-full animate-ping animation-delay-2000" />
                    <div className="absolute bottom-10 right-10 w-3 h-3 bg-cyan-300 rounded-full animate-ping animation-delay-3000" />
                  </div>
                </div>
              </div>
            )}
            
            {generatedImage ? (
              <div className="relative w-full h-full group">
                <img 
                  src={generatedImage} 
                  alt="Generated backyard design" 
                  className="w-full h-full object-cover"
                  data-testid="image-generated"
                />
                {/* Subtle Watermark Overlay */}
                <div className="absolute bottom-4 right-4 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
                    <p className="text-luxury-navy font-semibold text-sm">
                      Serenity Custom Pools LLC
                    </p>
                  </div>
                </div>
                {/* Hover Info */}
                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <p className="text-white text-xs">
                      ✨ Zoom, pan, and explore your design freely
                    </p>
                  </div>
                </div>
              </div>
            ) : uploadedImage ? (
              <img 
                src={uploadedImage} 
                alt="Your backyard" 
                className="w-full h-full object-cover"
                data-testid="image-uploaded"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload a photo of your backyard to start
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                data-testid="input-file"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
                data-testid="button-upload"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadedImage ? 'Change Image' : 'Upload Image'}
              </Button>
              
              {generatedImage && (
                <Select value={downloadFormat} onValueChange={(value: 'png' | 'jpeg') => setDownloadFormat(value)}>
                  <SelectTrigger className="w-32" data-testid="select-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {generatedImage && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleDownloadClick('watermark')} 
                  variant="secondary"
                  className="w-full"
                  data-testid="button-download-watermark"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">Free Download</div>
                    <div className="text-xs opacity-75">With watermark</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => handleDownloadClick('high-res')} 
                  className="w-full bg-gradient-to-r from-pool-crystal-blue to-pool-turquoise hover:from-pool-deep-blue hover:to-pool-crystal-blue"
                  data-testid="button-download-highres"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">High-Resolution</div>
                    <div className="text-xs opacity-90">Watermark-free</div>
                  </div>
                </Button>
              </div>
            )}
            
            {generatedImage && hasSubmittedLead && (
              <p className="text-xs text-center text-muted-foreground">
                ✅ Your contact info is saved. Download as many designs as you'd like!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lead Capture Modal - Redesigned with Progressive Capture */}
      <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
        <DialogContent className="sm:max-w-xl overflow-visible">
          <div className="absolute -top-3 -right-3 w-24 h-24 bg-gradient-to-br from-luxury-gold to-yellow-400 rounded-full flex items-center justify-center shadow-xl animate-pulse">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-luxury-navy">
              Save Your Pool Design
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {downloadType === 'high-res' ? 
                "Get your high-resolution design and unlock exclusive benefits!" :
                "Save your custom pool design and get a free consultation!"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Value Proposition */}
          <div className="bg-gradient-to-r from-pool-crystal-blue/10 to-pool-turquoise/10 rounded-lg p-4 my-4 border border-pool-crystal-blue/20">
            <h3 className="font-semibold text-luxury-navy mb-2">What you'll receive:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>{downloadType === 'high-res' ? 'High-resolution' : 'Watermarked'} pool design</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Free consultation ($299 value)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Custom quote for your project</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>3D walkthrough option</span>
              </div>
            </div>
          </div>
          
          {/* Progressive Capture Options */}
          <div className="space-y-4">
            {leadSubmissionType === null ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Guest Option */}
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-pool-crystal-blue"
                    onClick={() => setLeadSubmissionType('guest')}
                  >
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <Download className="w-8 h-8 mx-auto text-pool-crystal-blue" />
                        <h4 className="font-semibold">Continue as Guest</h4>
                        <p className="text-xs text-muted-foreground">
                          Quick download with just email
                        </p>
                        <Button variant="outline" className="w-full mt-2">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Full Account Option */}
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-luxury-gold relative overflow-hidden"
                    onClick={() => setLeadSubmissionType('full')}
                  >
                    <div className="absolute top-0 right-0 bg-luxury-gold text-white text-xs px-2 py-1 rounded-bl-lg font-semibold">
                      RECOMMENDED
                    </div>
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <Sparkles className="w-8 h-8 mx-auto text-luxury-gold" />
                        <h4 className="font-semibold">Create Account</h4>
                        <p className="text-xs text-muted-foreground">
                          Get personalized service & quote
                        </p>
                        <Button className="w-full mt-2 bg-gradient-to-r from-pool-crystal-blue to-pool-turquoise hover:from-pool-deep-blue hover:to-pool-crystal-blue">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <p className="text-xs text-center text-muted-foreground">
                  🔒 Your information is secure and never shared with third parties
                </p>
              </>
            ) : leadSubmissionType === 'guest' ? (
              /* Guest Form - Basic Info */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={leadFormData.firstName}
                      onChange={(e) => {
                        setLeadFormData(prev => ({ ...prev, firstName: e.target.value }));
                        setLeadFormErrors({});
                      }}
                      placeholder="John"
                      className="mt-1"
                      data-testid="modal-input-firstName-guest"
                    />
                    {leadFormErrors.firstName && (
                      <p className="text-sm text-destructive mt-1">{leadFormErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={leadFormData.lastName}
                      onChange={(e) => {
                        setLeadFormData(prev => ({ ...prev, lastName: e.target.value }));
                        setLeadFormErrors({});
                      }}
                      placeholder="Doe"
                      className="mt-1"
                      data-testid="modal-input-lastName-guest"
                    />
                    {leadFormErrors.lastName && (
                      <p className="text-sm text-destructive mt-1">{leadFormErrors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={leadFormData.email}
                    onChange={(e) => {
                      setLeadFormData(prev => ({ ...prev, email: e.target.value }));
                      setLeadFormErrors({});
                    }}
                    placeholder="your@email.com"
                    className="mt-1"
                    data-testid="modal-input-email-guest"
                  />
                  {leadFormErrors.email && (
                    <p className="text-sm text-destructive mt-1">{leadFormErrors.email}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={leadFormData.city}
                      onChange={(e) => {
                        setLeadFormData(prev => ({ ...prev, city: e.target.value }));
                        setLeadFormErrors({});
                      }}
                      placeholder="St. Louis"
                      className="mt-1"
                      data-testid="modal-input-city-guest"
                    />
                    {leadFormErrors.city && (
                      <p className="text-sm text-destructive mt-1">{leadFormErrors.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={leadFormData.state}
                      onChange={(e) => {
                        setLeadFormData(prev => ({ ...prev, state: e.target.value }));
                        setLeadFormErrors({});
                      }}
                      placeholder="MO"
                      className="mt-1"
                      data-testid="modal-input-state-guest"
                    />
                    {leadFormErrors.state && (
                      <p className="text-sm text-destructive mt-1">{leadFormErrors.state}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3 text-xs">
                  <p className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>We'll send your high-resolution design to this email. No spam, promise!</span>
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setLeadSubmissionType(null)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => handleLeadSubmit('guest')} 
                    className="flex-1 bg-pool-crystal-blue hover:bg-pool-deep-blue"
                    data-testid="modal-button-submit-guest"
                    disabled={isSubmittingLead}
                  >
                    {isSubmittingLead ? 'Saving...' : 'Download Now'}
                  </Button>
                </div>
              </div>
            ) : (
              /* Full Account Form */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={leadFormData.firstName}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      className="mt-1"
                      data-testid="modal-input-firstName"
                    />
                    {leadFormErrors.firstName && (
                      <p className="text-sm text-destructive mt-1">{leadFormErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={leadFormData.lastName}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                      className="mt-1"
                      data-testid="modal-input-lastName"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={leadFormData.email}
                    onChange={(e) => setLeadFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="mt-1"
                    data-testid="modal-input-email"
                  />
                  {leadFormErrors.email && (
                    <p className="text-sm text-destructive mt-1">{leadFormErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={leadFormData.phone}
                    onChange={(e) => setLeadFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                    data-testid="modal-input-phone"
                  />
                  {leadFormErrors.phone && (
                    <p className="text-sm text-destructive mt-1">{leadFormErrors.phone}</p>
                  )}
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacyConsent"
                    checked={leadFormData.privacyConsent}
                    onCheckedChange={(checked) => 
                      setLeadFormData(prev => ({ ...prev, privacyConsent: checked === true }))
                    }
                    className="mt-1"
                    data-testid="modal-checkbox-privacy"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="privacyConsent" className="text-sm">
                      I agree to receive updates about my pool design and the{" "}
                      <Link href="/privacy-policy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                    {leadFormErrors.privacyConsent && (
                      <p className="text-sm text-destructive">{leadFormErrors.privacyConsent}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setLeadSubmissionType(null)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => handleLeadSubmit('full')} 
                    className="flex-1 bg-gradient-to-r from-pool-crystal-blue to-pool-turquoise hover:from-pool-deep-blue hover:to-pool-crystal-blue"
                    data-testid="modal-button-submit-full"
                    disabled={isSubmittingLead}
                  >
                    {isSubmittingLead ? 'Saving...' : 'Get Design & Quote'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}