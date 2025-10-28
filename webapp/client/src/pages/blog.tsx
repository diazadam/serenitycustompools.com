import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Eye, Heart, TrendingUp, Sparkles, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { BlogPost } from "@shared/schema";

// Categories with fun descriptions
const categories = [
  { value: "all", label: "All Posts", icon: "🌟", description: "Everything pool and luxury" },
  { value: "pool-design", label: "Pool Design", icon: "🏊‍♂️", description: "Stunning designs & inspiration" },
  { value: "backyard-lifestyle", label: "Backyard Lifestyle", icon: "🌴", description: "Luxury outdoor living" },
  { value: "maintenance", label: "Maintenance", icon: "🔧", description: "Keep your pool pristine" },
  { value: "trends", label: "Trends", icon: "🚀", description: "What's hot in pool design" },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch blog posts
  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "all" 
        ? "/api/blog/posts"
        : `/api/blog/posts?category=${selectedCategory}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    }
  });

  // Fetch featured posts
  const { data: featuredPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts/featured"],
    queryFn: async () => {
      const response = await fetch("/api/blog/posts/featured");
      if (!response.ok) throw new Error("Failed to fetch featured posts");
      return response.json();
    }
  });

  // Filter posts by search term
  const filteredPosts = posts.filter(post => 
    searchTerm === "" || 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // SEO meta tags
  useEffect(() => {
    document.title = "Pool Design Blog & Luxury Backyard Ideas | Serenity Custom Pools LLC";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Expert pool design tips, luxury backyard transformation ideas, and maintenance guides from Georgia\'s premier custom pool builder. Get inspired for your dream pool.'
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-luxury-navy to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M20 20h20v20h-20z%22 fill=%22white%22 fill-opacity=%220.03%22 /%3E%3C/svg%3E')]" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-luxury-gold/20 text-luxury-gold border-luxury-gold">
            <Sparkles className="w-3 h-3 mr-1" />
            Pool Design Inspiration
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 animate-fade-in" data-testid="blog-title">
            The Serenity Pool Blog
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Dive into luxury pool design trends, backyard transformation ideas, 
            and expert tips from Georgia's premier custom pool builder
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for pool design ideas, maintenance tips, and more..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 pr-12 text-lg rounded-full text-gray-900 bg-white shadow-xl focus:outline-none focus:ring-4 focus:ring-luxury-gold/50"
                data-testid="blog-search"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <TrendingUp className="w-6 h-6 text-luxury-gold" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-8 px-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 ${
                  selectedCategory === category.value
                    ? "bg-luxury-navy text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                data-testid={`category-${category.value}`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Post (if exists and all categories selected) */}
            {selectedCategory === "all" && featuredPosts.length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-serif font-bold text-luxury-navy mb-6 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-luxury-gold" />
                  Featured Story
                </h2>
                <Link href={`/blog/${featuredPosts[0].slug}`}>
                  <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden bg-gradient-to-r from-blue-50 to-white border-2 border-luxury-gold/20">
                    {featuredPosts[0].featuredImage && (
                      <div className="relative h-64 md:h-80 overflow-hidden">
                        <img 
                          src={featuredPosts[0].featuredImage} 
                          alt={featuredPosts[0].title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <Badge className="absolute top-4 right-4 bg-luxury-gold text-white">
                          Featured
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="relative">
                      <CardTitle className="text-2xl md:text-3xl font-serif group-hover:text-luxury-gold transition-colors">
                        {featuredPosts[0].title}
                      </CardTitle>
                      <CardDescription className="text-lg mt-3">
                        {featuredPosts[0].excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {featuredPosts[0].readTime} min read
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {featuredPosts[0].viewCount} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            {featuredPosts[0].likes}
                          </span>
                        </div>
                        <span className="text-luxury-gold font-medium group-hover:underline">
                          Read More →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            )}

            {/* Blog Posts Grid */}
            <div className="space-y-6">
              {isLoading ? (
                // Loading skeletons
                [...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <Skeleton className="h-48 md:h-auto md:w-64" />
                      <div className="flex-1 p-6 space-y-3">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </Card>
                ))
              ) : filteredPosts.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-xl text-gray-600">No posts found in this category yet.</p>
                    <p className="text-gray-500 mt-2">Check back soon for more pool inspiration!</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden" data-testid={`blog-post-${post.id}`}>
                      <div className="flex flex-col md:flex-row">
                        {post.featuredImage && (
                          <div className="relative h-48 md:h-auto md:w-64 overflow-hidden bg-gray-100">
                            <img 
                              src={post.featuredImage} 
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {post.isFeatured && (
                              <Badge className="absolute top-2 left-2 bg-luxury-gold text-white">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex-1 p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {categories.find(c => c.value === post.category)?.icon} {post.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            {post.tags?.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <h3 className="text-xl font-serif font-bold text-luxury-navy group-hover:text-luxury-gold transition-colors mb-2">
                            {post.title}
                          </h3>
                          
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {post.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(post.publishedAt), "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {post.readTime} min
                              </span>
                            </div>
                            <span className="text-luxury-gold font-medium group-hover:underline">
                              Read →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Newsletter Signup */}
            <Card className="bg-gradient-to-br from-luxury-navy to-blue-900 text-white">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Pool Design Digest</CardTitle>
                <CardDescription className="text-blue-100">
                  Get weekly pool inspiration and exclusive offers delivered to your inbox
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="w-full px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    data-testid="newsletter-email"
                  />
                  <Button className="w-full bg-luxury-gold hover:bg-yellow-600 text-luxury-navy font-bold">
                    Subscribe Now
                  </Button>
                </form>
                <p className="text-xs text-blue-200 mt-3">
                  Join 5,000+ pool enthusiasts. Unsubscribe anytime.
                </p>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-serif text-luxury-navy">
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["Infinity Pools", "Smart Pools", "LED Lighting", "Natural Pools", "Pool Automation", 
                    "Waterfalls", "Hot Tubs", "Pool Safety", "Eco-Friendly", "Pool Financing"].map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-luxury-gold/10 hover:text-luxury-gold hover:border-luxury-gold transition-colors"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-luxury-gold/10 to-yellow-50 border-2 border-luxury-gold/30">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-luxury-navy">
                  Ready to Build Your Dream Pool?
                </CardTitle>
                <CardDescription>
                  Turn these ideas into reality with Georgia's premier pool builder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/#contact">
                  <Button className="w-full bg-luxury-navy hover:bg-blue-900 text-white">
                    Get Free Consultation
                  </Button>
                </Link>
                <Link href="/#visualizer">
                  <Button variant="outline" className="w-full border-luxury-navy text-luxury-navy hover:bg-luxury-navy hover:text-white">
                    Try AI Pool Visualizer
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Fun Fact */}
            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-luxury-navy flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-luxury-gold" />
                  Did You Know?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  The average luxury pool increases home value by 7-10% in Georgia, 
                  with infinity pools seeing the highest ROI at 12% on average!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}