import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { 
  Expand, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Info,
  ArrowLeft,
  Sparkles,
  Camera,
  Waves,
  TreePalm,
  Sun,
  RefreshCw,
  Maximize2,
  Droplets,
  Palette,
  Ruler,
  Mountain,
  ChevronDown
} from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import AIPoolVisualizer from "@/components/ai-pool-visualizer";
import SEOHead from "@/components/seo-head";

// Before/After Slider Component
function BeforeAfterSlider({ beforeImage, afterImage }: { beforeImage: string; afterImage: string }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    
    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging]);

  return (
    <div className="relative w-full h-full select-none" ref={containerRef}>
      {/* Before Image */}
      <div className="absolute inset-0">
        <img 
          src={beforeImage} 
          alt="Before" 
          className="w-full h-full object-contain"
          draggable={false}
        />
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-bold">
          BEFORE
        </div>
      </div>
      
      {/* After Image (clipped) */}
      <div 
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={afterImage} 
          alt="After" 
          className="w-full h-full object-contain"
          draggable={false}
        />
        <div className="absolute top-4 right-4 bg-pool-crystal-blue/80 text-white px-3 py-1 rounded-full text-sm font-bold">
          AFTER
        </div>
      </div>
      
      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 cursor-col-resize"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseDown}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <div className="absolute top-0 bottom-0 w-1 bg-white shadow-xl -translate-x-1/2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5a1 1 0 100 2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 9H8a1 1 0 100-2zm4 0a1 1 0 000 2h1.586l-1.293-1.293a1 1 0 111.414-1.414l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L13.586 9H12a1 1 0 100-2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// Image Viewer with Zoom and Fullscreen
function EnhancedImageViewer({ 
  image, 
  originalImage,
  onDownload 
}: { 
  image: string;
  originalImage?: string;
  onDownload?: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [showComparison, setShowComparison] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full shadow-xl px-4 py-2 flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          className="h-8 w-8"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          className="h-8 w-8"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleResetZoom}
          className="h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        {originalImage && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              size="sm"
              variant={showComparison ? "default" : "ghost"}
              onClick={() => setShowComparison(!showComparison)}
              className="h-8"
            >
              {showComparison ? "Hide" : "Show"} Comparison
            </Button>
          </>
        )}
        
        {onDownload && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              size="icon"
              variant="ghost"
              onClick={onDownload}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
          </>
        )}
        
        <Dialog>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
            <div className="relative w-full h-[90vh]">
              {showComparison && originalImage ? (
                <BeforeAfterSlider beforeImage={originalImage} afterImage={image} />
              ) : (
                <img 
                  src={image} 
                  alt="Pool Visualization" 
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Image Display */}
      <div 
        ref={imageRef}
        className="w-full h-full overflow-auto flex items-center justify-center p-8"
      >
        {showComparison && originalImage ? (
          <div className="w-full h-full max-w-6xl">
            <BeforeAfterSlider beforeImage={originalImage} afterImage={image} />
          </div>
        ) : (
          <div 
            style={{ 
              transform: `scale(${zoom / 100})`,
              transition: 'transform 0.2s ease-out'
            }}
            className="max-w-full max-h-full"
          >
            <img 
              src={image} 
              alt="Pool Visualization" 
              className="rounded-lg shadow-2xl"
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function PoolVisualizerPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate initial load
    setTimeout(() => setIsLoaded(true), 500);
  }, []);

  return (
    <>
      <SEOHead 
        title="AI Pool Visualizer - Design Your Dream Pool | Serenity Custom Pools"
        description="Upload a photo of your backyard and see it transformed with a stunning custom pool. Free AI-powered visualization tool from Serenity Custom Pools LLC."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-pool-aqua/10 via-white to-pool-crystal-blue/10">
        <Navigation />
        
        {/* Hero Section with Enhanced Animations */}
        <section className="relative pt-24 pb-12 overflow-hidden water-effect">
          {/* Multi-layer Animated Background */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Gradient orbs with parallax */}
            <motion.div 
              className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-pool-crystal-blue/30 to-pool-turquoise/20 rounded-full blur-3xl"
              animate={{
                x: [0, 30, 0],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div 
              className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-luxury-gold/20 to-pool-crystal-blue/20 rounded-full blur-3xl"
              animate={{
                x: [0, -40, 0],
                y: [0, 30, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Floating Pool Icons with Enhanced Animation */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute float-element opacity-30"
                initial={{ 
                  left: `${10 + (i * 12)}%`,
                  top: `${20 + (i % 3) * 25}%`
                }}
                animate={{
                  y: [-10, 10, -10],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 10 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5
                }}
              >
                {i % 4 === 0 ? <Waves className="w-10 h-10 text-pool-crystal-blue" /> :
                 i % 4 === 1 ? <TreePalm className="w-10 h-10 text-pool-turquoise" /> :
                 i % 4 === 2 ? <Droplets className="w-10 h-10 text-pool-aqua" /> :
                 <Sun className="w-10 h-10 text-luxury-gold" />}
              </motion.div>
            ))}
            
            {/* Particle effects */}
            {[...Array(20)].map((_, i) => (
              <div
                key={`particle-${i}`}
                className="absolute w-1 h-1 bg-pool-crystal-blue/40 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `float-diagonal ${15 + Math.random() * 10}s linear infinite`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            ))}
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Enhanced Back Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/">
                <Button 
                  variant="ghost" 
                  className="mb-6 glass-card-premium hover:bg-white/70 transition-all duration-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </motion.div>
            
            <div className="text-center">
              {/* Canva Banner Embed - Styled as seamless banner */}
              <div className="canva-banner-wrapper" style={{
                position: 'relative',
                width: '100%',
                height: 0,
                paddingTop: '43.9024%',
                paddingBottom: 0,
                boxShadow: '0 2px 8px 0 rgba(63,69,81,0.16)',
                marginTop: '1.6em',
                marginBottom: '0.9em',
                overflow: 'hidden',
                borderRadius: '8px',
                willChange: 'transform'
              }}>
                <iframe
                  loading="lazy"
                  className="canva-embed-iframe"
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    border: 'none',
                    padding: 0,
                    margin: 0
                  }}
                  src="https://www.canva.com/design/DAG20zgCFdU/obsJ2nwee-vDPQAnB41t-w/view?embed"
                  allowFullScreen={true}
                  allow="fullscreen;autoplay"
                  title="Serenity AI Pool Visualizer Banner"
                />
                
                {/* Overlay to block interaction and hide controls */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1
                }} />
                
                {/* Bottom overlay to hide Canva footer */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '60px',
                  background: 'linear-gradient(to bottom, transparent 0%, white 50%)',
                  zIndex: 2
                }} />
              </div>
            </div>
          </div>
        </section>
        
        {/* Enhanced Instructions Section with Animations */}
        <motion.section 
          className="relative py-12 bg-gradient-to-r from-white/60 via-pool-crystal-blue/5 to-white/60 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pool-crystal-blue/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pool-crystal-blue/30 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-serif font-bold text-luxury-navy mb-2">
                Transform Your Backyard in 4 Simple Steps
              </h2>
              <p className="text-gray-600">Our AI technology makes pool design effortless</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              {[
                { icon: Camera, title: "Upload Photo", desc: "Take a clear photo of your backyard", bgClass: "bg-gradient-to-br from-pool-aqua to-pool-crystal-blue", solidColor: "#3BACB6" },
                { icon: Palette, title: "Customize Design", desc: "Choose your perfect pool style", bgClass: "bg-gradient-to-br from-pool-crystal-blue to-pool-turquoise", solidColor: "#2596BE" },
                { icon: Sparkles, title: "AI Generation", desc: "Watch AI transform your space", bgClass: "bg-gradient-to-br from-pool-turquoise to-luxury-gold", solidColor: "#BFA760" },
                { icon: Download, title: "Save & Share", desc: "Download your dream design", bgClass: "bg-gradient-to-br from-luxury-gold to-pool-crystal-blue", solidColor: "#2596BE" },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  className="relative group pt-3"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="relative glass-card-premium p-6 rounded-2xl text-center step-indicator hover:scale-105 transition-all duration-300 overflow-visible">
                    {/* Step number badge */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <div 
                        className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-lg breathing-glow shadow-xl border-2 border-white"
                        style={{ background: step.solidColor }}
                      >
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Icon with gradient background */}
                    <div className={`w-16 h-16 rounded-full ${step.bgClass} mx-auto mb-3 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="font-bold text-luxury-navy mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.desc}</p>
                    
                    {/* Connection line (except for last item) */}
                    {index < 3 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-pool-crystal-blue/30 to-transparent" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Scroll indicator */}
            <div className="flex justify-center mt-8">
              <ChevronDown className="w-6 h-6 text-pool-crystal-blue/50 scroll-indicator" />
            </div>
          </div>
        </motion.section>
        
        {/* Enhanced Main Visualizer Section */}
        <motion.section 
          className="relative py-16 md:py-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-gradient-to-br from-pool-crystal-blue/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-to-bl from-pool-turquoise/10 to-transparent rounded-full blur-3xl" />
          </div>
          
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {!isLoaded ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <LoadingSkeleton />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
              >
                {/* Premium glassmorphic container */}
                <div className="glass-card-premium rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
                  {/* Animated gradient border */}
                  <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-r from-pool-crystal-blue via-pool-turquoise to-luxury-gold opacity-50 animated-gradient-bg" />
                  
                  {/* Content container */}
                  <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-10">
                    <AIPoolVisualizer />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>
        
        {/* Enhanced Tips Section with Premium Cards */}
        <section className="relative py-20 bg-gradient-to-br from-luxury-navy via-pool-deep-blue to-luxury-navy text-white overflow-hidden">
          {/* Animated background waves */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-64 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <motion.path
                  fill="currentColor"
                  d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                  animate={{
                    d: [
                      "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                      "M0,160L48,144C96,128,192,96,288,96C384,96,480,128,576,138.7C672,149,768,139,864,128C960,117,1056,107,1152,122.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                      "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    ]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </svg>
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-serif font-bold mb-4 text-shimmer">
                Pro Tips for Perfect Results
              </h2>
              <p className="text-pool-aqua/80">Expert advice to get the most stunning pool visualizations</p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: Camera, 
                  title: "Quality Photos",
                  desc: "Use clear, well-lit photos taken during daytime for the most accurate visualizations.",
                  gradient: "from-pool-crystal-blue to-pool-turquoise"
                },
                { 
                  icon: Mountain, 
                  title: "Wide Angle Shots",
                  desc: "Capture the entire backyard area where you envision your pool for best results.",
                  gradient: "from-pool-turquoise to-luxury-gold"
                },
                { 
                  icon: Sparkles, 
                  title: "Experiment Freely",
                  desc: "Try different pool shapes, features, and styles to find your perfect design.",
                  gradient: "from-luxury-gold to-pool-crystal-blue"
                }
              ].map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card className="group relative bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden card-lift h-full">
                    {/* Animated gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${tip.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                    
                    <div className="relative p-8">
                      {/* Icon with animated background */}
                      <div className="relative mb-6">
                        <div className={`absolute inset-0 w-16 h-16 bg-gradient-to-br ${tip.gradient} rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />
                        <div className={`relative w-16 h-16 bg-gradient-to-br ${tip.gradient} rounded-full flex items-center justify-center group-hover:scale-110 transform transition-transform duration-300`}>
                          <tip.icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-xl mb-3 text-white group-hover:text-pool-aqua transition-colors duration-300">
                        {tip.title}
                      </h3>
                      <p className="text-white/80 leading-relaxed">
                        {tip.desc}
                      </p>
                      
                      {/* Decorative corner accent */}
                      <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8">
                        <div className={`w-full h-full bg-gradient-to-br ${tip.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Enhanced CTA Section with Premium Design */}
        <motion.section 
          className="relative py-24 bg-gradient-to-br from-white via-pool-aqua/5 to-white overflow-hidden"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-pool-crystal-blue/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-luxury-gold/10 to-transparent rounded-full blur-3xl" />
          </div>
          
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-luxury-navy mb-6">
                Ready to Make Your Dream Pool a Reality?
              </h2>
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                Our expert team is standing by to turn your vision into reality with a free consultation
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/#contact">
                <Button 
                  size="lg" 
                  className="btn-premium text-white px-12 py-7 text-lg font-semibold shadow-xl hover:shadow-2xl transform transition-all duration-300"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Free Consultation
                  <ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
                </Button>
              </Link>
              
              <a href="tel:678-300-8949">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="group border-2 border-luxury-gold bg-white hover:bg-luxury-gold text-luxury-navy hover:text-white px-12 py-7 text-lg font-semibold transition-all duration-300"
                >
                  <svg className="mr-2 h-5 w-5 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call (678) 300-8949
                </Button>
              </a>
            </motion.div>
            
            {/* Trust indicators */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-gray-600"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Available Now</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-luxury-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>5.0 Rating (200+ Reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-pool-crystal-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>No Obligation Quote</span>
              </div>
            </motion.div>
          </div>
        </motion.section>
        
        <Footer />
      </div>
    </>
  );
}