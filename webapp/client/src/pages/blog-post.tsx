import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, Eye, Heart, Share2, Calendar, User, 
  ChevronLeft, Facebook, Twitter, Linkedin,
  Sparkles, TrendingUp, BookOpen, Home
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { BlogPost } from "@shared/schema";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [hasLiked, setHasLiked] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Fetch blog post by slug
  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog/posts/${slug}`],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Post not found");
        }
        throw new Error("Failed to fetch post");
      }
      return response.json();
    }
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/blog/posts/${post?.id}/like`, {});
    },
    onSuccess: () => {
      setHasLiked(true);
      queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${slug}`] });
      toast({
        title: "Thanks for the love! 💙",
        description: "We're glad you enjoyed this article.",
      });
    }
  });

  // Check if already liked (using localStorage)
  useEffect(() => {
    if (post) {
      const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
      setHasLiked(likedPosts.includes(post.id));
    }
  }, [post]);

  // Handle like
  const handleLike = () => {
    if (!hasLiked && post) {
      likeMutation.mutate();
      const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "[]");
      likedPosts.push(post.id);
      localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
    }
  };

  // Handle share
  const handleShare = (platform: string) => {
    if (!post) return;
    
    const url = window.location.href;
    const title = post.title;
    
    const shareUrls: { [key: string]: string } = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      copy: ""
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Share this article with your friends.",
      });
    } else {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  // Update SEO meta tags
  useEffect(() => {
    if (post) {
      document.title = `${post.metaTitle || post.title} | Serenity Custom Pools Blog`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.metaDescription || post.excerpt);
      }

      // Add structured data for article
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "author": {
          "@type": "Person",
          "name": post.author,
          "jobTitle": post.authorTitle
        },
        "datePublished": post.publishedAt,
        "dateModified": post.updatedAt,
        "image": post.featuredImage,
        "publisher": {
          "@type": "Organization",
          "name": "Serenity Custom Pools LLC",
          "logo": {
            "@type": "ImageObject",
            "url": "https://serenitycustompools.com/logo.png"
          }
        }
      });
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Skeleton className="h-96 mb-8" />
          <Skeleton className="h-12 mb-4" />
          <Skeleton className="h-6 mb-2" />
          <Skeleton className="h-6 w-3/4 mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold text-luxury-navy mb-2">
              Article Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find the article you're looking for.
            </p>
            <Link href="/blog">
              <Button>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse content into sections for better rendering
  const renderContent = (content: string) => {
    const sections = content.split('\n\n');
    return sections.map((section, index) => {
      // Check for headers
      if (section.startsWith('##')) {
        const headerText = section.replace(/^##\s*/, '');
        return (
          <h2 key={index} className="text-2xl font-serif font-bold text-luxury-navy mt-8 mb-4">
            {headerText}
          </h2>
        );
      }
      
      // Check for lists
      if (section.includes('\n- ') || section.startsWith('- ')) {
        const items = section.split('\n').filter(item => item.startsWith('- '));
        return (
          <ul key={index} className="list-disc list-inside space-y-2 my-4 text-gray-700">
            {items.map((item, i) => (
              <li key={i}>{item.replace(/^- /, '')}</li>
            ))}
          </ul>
        );
      }
      
      // Check for numbered lists
      if (section.match(/^\d+\./)) {
        const items = section.split('\n').filter(item => item.match(/^\d+\./));
        return (
          <ol key={index} className="list-decimal list-inside space-y-2 my-4 text-gray-700">
            {items.map((item, i) => (
              <li key={i}>{item.replace(/^\d+\.\s*/, '')}</li>
            ))}
          </ol>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="text-lg leading-relaxed text-gray-700 my-4">
          {section}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-gray-600">
          <Link href="/">
            <span className="hover:text-luxury-gold cursor-pointer flex items-center">
              <Home className="w-4 h-4 mr-1" />
              Home
            </span>
          </Link>
          <span>/</span>
          <Link href="/blog">
            <span className="hover:text-luxury-gold cursor-pointer">Blog</span>
          </Link>
          <span>/</span>
          <span className="text-luxury-navy font-medium truncate">{post.title}</span>
        </div>
      </div>

      {/* Hero Section with Featured Image */}
      {post.featuredImage && (
        <div className="relative h-96 md:h-[500px] overflow-hidden">
          <img 
            src={post.featuredImage} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-4 bg-luxury-gold/90 text-white">
                {post.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4" data-testid="post-title">
                {post.title}
              </h1>
              <p className="text-xl text-gray-200">
                {post.excerpt}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Author and Meta Info */}
        <div className="flex flex-wrap items-center justify-between mb-8 pb-8 border-b">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-luxury-navy text-white">
                {post.author.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-luxury-navy">{post.author}</p>
              {post.authorTitle && (
                <p className="text-sm text-gray-600">{post.authorTitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(post.publishedAt), "MMMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readTime} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {(post.viewCount || 0) + 1} views
            </span>
          </div>
        </div>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none" data-testid="post-content">
          {renderContent(post.content)}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">TAGS</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline" className="hover:bg-luxury-gold/10 hover:text-luxury-gold hover:border-luxury-gold transition-colors cursor-pointer">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Bar */}
        <div className="mt-12 p-6 bg-gray-50 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleLike}
                disabled={hasLiked}
                variant={hasLiked ? "default" : "outline"}
                className={hasLiked ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                data-testid="like-button"
              >
                <Heart className={`w-4 h-4 mr-2 ${hasLiked ? "fill-current" : ""}`} />
                {hasLiked ? "Liked" : "Like"} ({(post.likes || 0) + (hasLiked ? 1 : 0)})
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 mr-2">Share:</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("facebook")}
                data-testid="share-facebook"
              >
                <Facebook className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("twitter")}
                data-testid="share-twitter"
              >
                <Twitter className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("linkedin")}
                data-testid="share-linkedin"
              >
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("copy")}
                data-testid="share-copy"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-luxury-navy to-blue-900 text-white">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-12 h-12 text-luxury-gold mx-auto mb-4" />
            <h2 className="text-3xl font-serif font-bold mb-4">
              Ready to Transform Your Backyard?
            </h2>
            <p className="text-lg text-blue-100 mb-6">
              Let our experts design the perfect luxury pool for your home. 
              Get a free consultation and see your dream pool come to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#contact">
                <Button size="lg" className="bg-luxury-gold hover:bg-yellow-600 text-luxury-navy font-bold">
                  Get Free Consultation
                </Button>
              </Link>
              <Link href="/#visualizer">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Try AI Visualizer
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Related Posts Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-serif font-bold text-luxury-navy mb-6">
            More Pool Inspiration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Placeholder for related posts - would be fetched based on category/tags */}
            <Link href="/blog">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Badge className="mb-2">Pool Design</Badge>
                  <h3 className="font-serif font-bold text-lg text-luxury-navy hover:text-luxury-gold transition-colors">
                    Explore More Pool Design Ideas
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Browse our collection of luxury pool designs and find your perfect style.
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/#portfolio">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Badge className="mb-2">Portfolio</Badge>
                  <h3 className="font-serif font-bold text-lg text-luxury-navy hover:text-luxury-gold transition-colors">
                    View Our Pool Portfolio
                  </h3>
                  <p className="text-gray-600 mt-2">
                    See real transformations we've completed for homeowners across Georgia.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}