import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Play, Image, FileVideo, Plus, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import type { Media } from "@shared/schema";

// Helper function to get video embed URL
function getVideoEmbedUrl(url: string): { embedUrl: string; type: 'youtube' | 'vimeo' | 'direct' } {
  // YouTube URL patterns
  if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      type: 'youtube'
    };
  }
  
  // Vimeo URL patterns
  if (url.includes('vimeo.com')) {
    const videoId = url.split('vimeo.com/')[1]?.split(/[?#]/)[0] || '';
    return {
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      type: 'vimeo'
    };
  }
  
  // Direct video file
  return {
    embedUrl: url,
    type: 'direct'
  };
}

export default function MediaGallery() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [viewingMedia, setViewingMedia] = useState<Media | null>(null);

  const { data: mediaData, isLoading } = useQuery({
    queryKey: ["/api/media/public", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "all" 
        ? "/api/media/public" 
        : `/api/media/public?category=${selectedCategory}`;
      return fetch(url).then(res => res.json());
    }
  });

  const createMediaMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/media", "POST", data),
    onSuccess: () => {
      toast({ title: "Media added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/media/public"] });
      setIsAddDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to add media", variant: "destructive" });
    }
  });

  const updateMediaMutation = useMutation({
    mutationFn: (data: { id: string; updates: any }) => 
      apiRequest(`/api/media/${data.id}`, "PATCH", data.updates),
    onSuccess: () => {
      toast({ title: "Media updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/media/public"] });
      setEditingMedia(null);
    }
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/media/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Media deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/media/public"] });
    }
  });

  const handleAddMedia = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    createMediaMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      type: formData.get("type"),
      url: formData.get("url"),
      thumbnailUrl: formData.get("thumbnailUrl"),
      category: formData.get("category"),
      uploadedBy: "user"
    });
  };

  const media = mediaData?.media || [];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-pool-crystal-blue/5 to-white">
        <Navigation />
        
        {/* Hero Section */}
        <div className="relative bg-luxury-navy text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-r from-pool-deep-blue to-pool-crystal-blue opacity-90"></div>
          <div className="relative max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4" data-testid="media-page-title">
              Media Gallery
            </h1>
            <p className="text-xl md:text-2xl text-white/90">
              Explore Our Pool Projects & Transformations
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid grid-cols-5 w-full md:w-auto">
                <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                <TabsTrigger value="portfolio" data-testid="tab-portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="before-after" data-testid="tab-before-after">Before/After</TabsTrigger>
                <TabsTrigger value="testimonial" data-testid="tab-testimonial">Testimonials</TabsTrigger>
                <TabsTrigger value="promotional" data-testid="tab-promotional">Promotional</TabsTrigger>
              </TabsList>
            </Tabs>

          </div>
        </div>

        {/* Media Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : media.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <h3 className="text-xl font-semibold mb-2">No Media Available</h3>
                <p className="text-gray-600">
                  {selectedCategory === "all" 
                    ? "Check back soon for our latest pool projects and videos"
                    : `No media currently available in the ${selectedCategory} category`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {media.map((item: Media) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-shadow" data-testid={`media-card-${item.id}`}>
                  <div className="relative h-64 bg-gray-100">
                    {item.type === "video" ? (
                      <div 
                        className="relative h-full cursor-pointer group"
                        onClick={() => setViewingMedia(item)}
                      >
                        {item.thumbnailUrl ? (
                          <img 
                            src={item.thumbnailUrl} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <FileVideo className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                          <Play className="h-16 w-16 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={item.url} 
                        alt={item.title}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setViewingMedia(item)}
                        data-testid={`image-${item.id}`}
                      />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1" data-testid={`title-${item.id}`}>{item.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{item.category}</span>
                      <span className="text-xs text-gray-500">
                        {item.type === "video" ? <FileVideo className="h-4 w-4 inline" /> : <Image className="h-4 w-4 inline" />}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Media Viewer Dialog */}
        <Dialog open={!!viewingMedia} onOpenChange={() => setViewingMedia(null)}>
          <DialogContent className="max-w-4xl">
            {viewingMedia && (
              <>
                <DialogHeader>
                  <DialogTitle>{viewingMedia.title}</DialogTitle>
                </DialogHeader>
                <div className="aspect-video bg-black">
                  {viewingMedia.type === "video" ? (() => {
                    const { embedUrl, type } = getVideoEmbedUrl(viewingMedia.url);
                    
                    if (type === 'youtube' || type === 'vimeo') {
                      return (
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          data-testid="video-player-embed"
                        ></iframe>
                      );
                    } else {
                      return (
                        <video 
                          controls 
                          className="w-full h-full"
                          src={embedUrl}
                          data-testid="video-player-direct"
                        >
                          Your browser does not support the video tag.
                        </video>
                      );
                    }
                  })() : (
                    <img 
                      src={viewingMedia.url} 
                      alt={viewingMedia.title}
                      className="w-full h-full object-contain"
                      data-testid="image-viewer"
                    />
                  )}
                </div>
                {viewingMedia.description && (
                  <p className="mt-4 text-gray-600">{viewingMedia.description}</p>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </>
  );
}