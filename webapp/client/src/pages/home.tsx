import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import HeroSection from "@/components/hero-section";
import ServicesSection from "@/components/services-section";
import LeadMagnetSection from "@/components/lead-magnet-section";
import PortfolioSection from "@/components/portfolio-section";
import OwnerSection from "@/components/owner-section";
import TestimonialsWithSchema from "@/components/testimonials-with-schema";
import ContactSection from "@/components/contact-section";
import FAQSection from "@/components/faq-section";
import InteractiveFeaturesSection from "@/components/interactive-features-section";
import GoogleReviewsSection from "@/components/google-reviews-section";
import CredibilitySection from "@/components/credibility-section";
import SEOHead from "@/components/seo-head";
import FloatingCTA from "@/components/floating-cta";
import Navigation from "@/components/navigation";
import StructuredData from "@/components/structured-data";
import Footer from "@/components/footer";
import { VoiceAgentButton } from "@/components/voice-agent-button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { businessInfo } from "@/lib/seo-config";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Users, Star, Zap, Eye } from "lucide-react";
import beforeAfterImage from "@assets/generated_images/Pool_renovation_before_after_21f87fe4.png";
import luxuryPoolImage from "@assets/generated_images/Luxury_infinity_pool_sunset_background_9a3dd124.png";
import backyardTransformImage from "@assets/generated_images/Complete_backyard_transformation_b5ff6116.png";
import modernPoolImage from "@assets/generated_images/Modern_geometric_pool_spa_d8c10696.png";

export default function Home() {
  // Initialize scroll animations
  useScrollAnimation();
  
  // Add preload hints for critical resources
  useEffect(() => {
    // Preload critical fonts
    const fontPreload = document.createElement('link');
    fontPreload.rel = 'preload';
    fontPreload.as = 'font';
    fontPreload.type = 'font/woff2';
    fontPreload.href = '/fonts/serif.woff2';
    fontPreload.crossOrigin = 'anonymous';
    
    // Preload critical images
    const heroImagePreload = document.createElement('link');
    heroImagePreload.rel = 'preload';
    heroImagePreload.as = 'image';
    heroImagePreload.href = '/hero-image.jpg';
    
    document.head.appendChild(fontPreload);
    document.head.appendChild(heroImagePreload);
  }, []);

  return (
    <div className="min-h-screen">
      <SEOHead />
      <StructuredData type="home" />
      {/* Navigation Component */}
      <Navigation />

      {/* Main Content */}
      <main className="pt-20">
        <HeroSection />
        <div className="fade-in-on-scroll">
          <ServicesSection />
        </div>
        
        {/* AI Pool Visualizer Showcase Banner - STUNNING ANIMATED SECTION */}
        <section className="py-20 bg-gradient-to-br from-luxury-navy via-pool-deep-blue to-luxury-navy relative overflow-hidden">
          {/* Animated water particles background */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Floating particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div 
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                initial={{ y: "100vh", x: (i * 25) % 100 }}
                animate={{ 
                  y: "-100px",
                  x: ((i * 25) % 100) - 50
                }}
                transition={{
                  duration: 10 + (i * 2),
                  repeat: Infinity,
                  delay: i * 1.5,
                  ease: "linear"
                }}
                style={{
                  left: `${10 + (i * 12)}%`,
                }}
              />
            ))}
            
            {/* Animated gradient orbs */}
            <motion.div 
              className="absolute top-20 left-10 w-96 h-96 bg-pool-crystal-blue/10 rounded-full blur-3xl"
              animate={{
                x: [0, 50, 0],
                y: [0, 30, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute bottom-20 right-10 w-80 h-80 bg-luxury-gold/10 rounded-full blur-3xl"
              animate={{
                x: [0, -30, 0],
                y: [0, -50, 0],
                scale: [1, 1.3, 1]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, type: "spring" }}
                className="inline-flex items-center gap-2 bg-luxury-gold/20 text-luxury-gold px-4 py-2 rounded-full mb-6"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-semibold">NEW: AI-POWERED VISUALIZATION</span>
              </motion.div>
              
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6">
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  See Your
                </motion.span>{" "}
                <motion.span
                  className="inline-block bg-gradient-to-r from-luxury-gold to-pool-crystal-blue bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Dream Pool
                </motion.span>{" "}
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  Come to Life
                </motion.span>
              </h2>
              
              <motion.p 
                className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                Transform your backyard in seconds with our revolutionary AI pool visualizer. 
                Upload a photo and watch magic happen!
              </motion.p>
              
              {/* Social proof counter */}
              <motion.div 
                className="flex flex-wrap justify-center gap-8 mb-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <div className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-luxury-gold" />
                  <span className="text-2xl font-bold">523</span>
                  <span className="text-gray-300">Pools Visualized</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Star className="w-5 h-5 text-luxury-gold" />
                  <span className="text-2xl font-bold">4.9</span>
                  <span className="text-gray-300">User Rating</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Eye className="w-5 h-5 text-luxury-gold" />
                  <span className="text-2xl font-bold">15s</span>
                  <span className="text-gray-300">Avg. Generation</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Before/After Showcase */}
            <motion.div 
              className="grid lg:grid-cols-2 gap-8 mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Image Showcase */}
              <div className="relative">
                <motion.div 
                  className="relative rounded-2xl overflow-hidden shadow-2xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <img 
                    src={beforeAfterImage} 
                    alt="Pool transformation before and after" 
                    className="w-full h-[400px] object-cover"
                    data-testid="pool-transformation-image"
                  />
                  
                  {/* Animated overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-luxury-navy/80 to-transparent"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                        <p className="text-white font-bold">Before → After Transformation</p>
                        <p className="text-gray-200 text-sm">AI-powered visualization in seconds</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Before/After labels */}
                  <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    BEFORE
                  </div>
                  <div className="absolute top-4 right-4 bg-luxury-gold/90 text-luxury-navy px-3 py-1 rounded-full text-sm font-semibold">
                    AFTER
                  </div>
                </motion.div>
                
                {/* Floating feature badges */}
                <motion.div 
                  className="mt-4 grid grid-cols-2 gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="glass-morphic-luxury rounded-lg p-3 text-center">
                    <Sparkles className="w-5 h-5 text-luxury-gold mx-auto mb-1" />
                    <p className="text-white text-sm font-semibold">Instant Results</p>
                  </div>
                  <div className="glass-morphic-luxury rounded-lg p-3 text-center">
                    <Zap className="w-5 h-5 text-pool-crystal-blue mx-auto mb-1" />
                    <p className="text-white text-sm font-semibold">AI Powered</p>
                  </div>
                </motion.div>
              </div>
              
              {/* Features & CTA */}
              <div className="flex flex-col justify-center">
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Transform Your Backyard in 3 Simple Steps
                  </h3>
                  
                  {/* Steps */}
                  {[
                    { icon: "📷", title: "Upload Photo", desc: "Take a picture of your backyard" },
                    { icon: "🎨", title: "Choose Style", desc: "Select from luxury pool designs" },
                    { icon: "✨", title: "Get Results", desc: "See your dream pool instantly" }
                  ].map((step, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="text-2xl">{step.icon}</div>
                      <div>
                        <h4 className="text-white font-bold">{step.title}</h4>
                        <p className="text-gray-300">{step.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link href="/pool-visualizer" className="flex-1">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full"
                      >
                        <Button 
                          size="lg" 
                          className="w-full glass-morphic-luxury bg-gradient-to-r from-luxury-gold to-pool-crystal-blue hover:from-pool-crystal-blue hover:to-luxury-gold text-white font-bold px-8 py-6 text-lg shadow-2xl transform transition-all duration-300"
                          data-testid="button-try-visualizer"
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                          Try AI Visualizer Free
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </motion.div>
                    </Link>
                    <Link href="#portfolio" className="flex-1">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full"
                      >
                        <Button 
                          size="lg" 
                          variant="outline"
                          className="w-full border-2 border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 px-8 py-6 text-lg"
                          data-testid="button-view-portfolio"
                        >
                          View Real Projects
                        </Button>
                      </motion.div>
                    </Link>
                  </div>
                  
                  {/* Trust badges */}
                  <div className="flex items-center gap-4 pt-4 text-gray-300 text-sm">
                    <span>✅ No signup required</span>
                    <span>🔒 100% private</span>
                    <span>⚡ Instant results</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Gallery Preview */}
            <motion.div 
              className="mt-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-center text-white mb-6 font-semibold">✨ Popular Pool Designs Created with Our AI</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[luxuryPoolImage, backyardTransformImage, modernPoolImage, beforeAfterImage].map((img, index) => (
                  <motion.div
                    key={index}
                    className="relative rounded-lg overflow-hidden shadow-lg"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <img 
                      src={img} 
                      alt={`Pool design ${index + 1}`} 
                      className="w-full h-32 object-cover"
                      data-testid={`gallery-image-${index}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-luxury-navy/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                      <p className="text-white text-xs font-semibold">Style #{index + 1}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
        
        <div className="slide-left-on-scroll">
          <LeadMagnetSection />
        </div>
        
        <div className="fade-in-on-scroll">
          <PortfolioSection />
        </div>
        
        <div className="slide-right-on-scroll">
          <InteractiveFeaturesSection />
        </div>
        
        <div className="scale-in-on-scroll">
          <GoogleReviewsSection />
        </div>
        
        <div className="slide-left-on-scroll">
          <OwnerSection />
        </div>
        
        <div className="fade-in-on-scroll">
          <TestimonialsWithSchema />
        </div>
        
        <div className="scale-in-on-scroll">
          <CredibilitySection />
        </div>

        {/* AI-Friendly Content Section for Chatbots and Search Engines */}
        <section className="py-20 bg-gradient-to-b from-white to-gray-50" aria-label="Serenity Custom Pools LLC Complete Service Information">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-luxury-navy mb-4">
                Complete Pool Construction Services & Pricing Guide
              </h2>
              <div className="w-32 h-1 bg-gradient-to-r from-luxury-gold to-pool-crystal-blue mx-auto mb-6 rounded-full"></div>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Serenity Custom Pools LLC - North Georgia's Premier Pool Builder Since 1994
              </p>
            </div>

            {/* Core Service Information Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Company Overview */}
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold text-luxury-navy mb-4">About Serenity Custom Pools LLC</h3>
                <ul className="space-y-3 text-gray-700">
                  <li>✅ <strong>Established:</strong> 1994 ({businessInfo.yearsExperience}+ years of excellence)</li>
                  <li>✅ <strong>Pools Built:</strong> Over {businessInfo.poolsBuilt} custom pools completed</li>
                  <li>✅ <strong>Owner:</strong> Ronald Jones, Master Pool Builder</li>
                  <li>✅ <strong>Rating:</strong> {businessInfo.rating.value} stars ({businessInfo.rating.reviewCount} reviews)</li>
                  <li>✅ <strong>License:</strong> Fully licensed, bonded, and insured</li>
                  <li>✅ <strong>Specialization:</strong> Luxury inground pools, infinity pools, custom spas</li>
                </ul>
              </div>

              {/* Pricing Information */}
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold text-luxury-navy mb-4">Investment Ranges</h3>
                <ul className="space-y-3 text-gray-700">
                  <li>💰 <strong>Custom Pools:</strong> $75,000 - $150,000</li>
                  <li>💰 <strong>Spa/Hot Tub Addition:</strong> $15,000 - $35,000</li>
                  <li>💰 <strong>Pool Renovation:</strong> $25,000 - $75,000</li>
                  <li>💰 <strong>Outdoor Living Spaces:</strong> $20,000 - $100,000</li>
                  <li>💰 <strong>Financing:</strong> Available with approved credit</li>
                  <li>💰 <strong>Free Services:</strong> Consultation, 3D design, AI visualization</li>
                </ul>
              </div>
            </div>

            {/* Detailed Services */}
            <div className="bg-white p-8 rounded-2xl shadow-lg mb-12">
              <h3 className="text-2xl font-bold text-luxury-navy mb-6">Full Service Offerings</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {businessInfo.services.map((service, index) => (
                  <div key={index} className="border-l-4 border-pool-crystal-blue pl-4">
                    <h4 className="font-bold text-lg text-luxury-navy mb-2">{service.name}</h4>
                    <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                    <p className="text-luxury-gold font-semibold">{service.priceRange}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Areas */}
            <div className="bg-white p-8 rounded-2xl shadow-lg mb-12">
              <h3 className="text-2xl font-bold text-luxury-navy mb-6">Service Areas in North Georgia</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {businessInfo.serviceAreas.map((area, index) => (
                  <div key={index} className="flex items-center">
                    <svg className="w-4 h-4 text-pool-crystal-blue mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-luxury-navy text-white p-8 rounded-2xl shadow-xl">
              <h3 className="text-2xl font-bold mb-6">Get Started with Your Dream Pool</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-luxury-gold mb-4">Contact Information</h4>
                  <ul className="space-y-3">
                    <li>📞 Phone: {businessInfo.phone}</li>
                    <li>✉️ Email: {businessInfo.email}</li>
                    <li>🏢 Service: North Georgia & Lake Lanier Area</li>
                    <li>⏰ Hours: Monday-Friday 8:00 AM - 6:00 PM</li>
                    <li>📅 Response Time: Within 24 hours</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-luxury-gold mb-4">Consultation Process</h4>
                  <ol className="space-y-3">
                    <li>1️⃣ Submit form or call for free consultation</li>
                    <li>2️⃣ Site visit and project discussion</li>
                    <li>3️⃣ Receive 3D design and AI visualization</li>
                    <li>4️⃣ Review detailed quote and timeline</li>
                    <li>5️⃣ Begin your pool construction journey</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* SEO-Rich Content for Search Engines */}
            <div className="mt-12 prose prose-lg max-w-none text-gray-700">
              <p className="text-sm leading-relaxed">
                <strong>Serenity Custom Pools LLC</strong> is the leading luxury pool builder serving North Georgia, including Atlanta, Alpharetta, Roswell, Johns Creek, and the Lake Lanier area. 
                With over 30 years of experience in custom pool construction, we specialize in creating stunning infinity pools, luxury spas, and complete outdoor living spaces. 
                Our typical pool construction project ranges from $75,000 to $150,000, with financing options available. We offer free consultations, 3D design services, and 
                AI-powered pool visualization to help you see your dream pool before construction begins. As a fully licensed, bonded, and insured pool contractor, we've built 
                over 500 custom pools throughout North Georgia. Contact us at 1 (678) 300-8949 or visit our showroom to start your pool construction journey. Our services include 
                custom inground pools, pool renovation, spa installation, outdoor kitchens, patios, and complete backyard transformations. Trust Serenity Custom Pools LLC for 
                quality pool construction in Cumming, Gainesville, Dawsonville, Dahlonega, Milton, Sandy Springs, Marietta, Kennesaw, and surrounding areas.
              </p>
            </div>
          </div>
        </section>
        
        {/* Service Areas Section with Stunning Animations */}
        <section className="py-20 bg-gradient-to-br from-white via-luxury-gray to-white relative overflow-hidden">
          {/* Animated water ripples in background */}
          <div className="absolute inset-0 opacity-10">
            <div className="scroll-water-ripple absolute top-20 left-20 w-64 h-64 border-2 border-pool-crystal-blue rounded-full"></div>
            <div className="scroll-water-ripple absolute bottom-20 right-20 w-96 h-96 border border-luxury-gold rounded-full"></div>
          </div>
          
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="fade-in-on-scroll">
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-luxury-navy mb-8 luxury-glow" data-testid="heading-service-areas">
                Custom Pool Builders Serving North Georgia & Lake Lanier
              </h2>
              <div className="w-32 h-1 bg-gradient-to-r from-luxury-gold to-pool-crystal-blue mx-auto mb-8 rounded-full"></div>
              <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-5xl mx-auto font-light leading-relaxed">
                Premier luxury pool contractors and spa installation experts serving <strong className="text-pool-crystal-blue">North Georgia's most exclusive communities</strong>. Licensed, bonded, and insured with over 30 years of custom pool construction experience under Ronald Jones' leadership.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
              {[
                { title: "North Georgia Mountains", areas: "Dawsonville, Dahlonega, Cleveland, Helen", delay: "0s" },
                { title: "Lake Lanier Area", areas: "Cumming, Gainesville, Buford, Flowery Branch", delay: "0.1s" },
                { title: "North Atlanta Metro", areas: "Alpharetta, Roswell, Johns Creek, Milton", delay: "0.2s" },
                { title: "Northeast Metro", areas: "Sandy Springs, Dunwoody, Brookhaven", delay: "0.3s" },
                { title: "West Metro", areas: "Marietta, Kennesaw, Acworth, Woodstock", delay: "0.4s" },
                { title: "East Metro", areas: "Lawrenceville, Gwinnett County, Commerce", delay: "0.5s" }
              ].map((area, index) => (
                <div 
                  key={index} 
                  className="scale-in-on-scroll glass p-8 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 luxury-glow"
                  style={{ animationDelay: area.delay }}
                  data-testid={`service-area-${index}`}
                >
                  <div className="relative">
                    <div className="water-wave-scroll w-12 h-12 bg-gradient-to-br from-luxury-gold to-pool-crystal-blue rounded-full mx-auto mb-6 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-xl text-luxury-navy mb-3">{area.title}</h3>
                    <p className="text-gray-600">{area.areas}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="fade-in-on-scroll">
          <FAQSection />
        </div>
        
        <div className="scale-in-on-scroll">
          <ContactSection />
        </div>
      </main>

      {/* Footer with complete SEO optimization */}
      <Footer />

      {/* Voice Assistant - Serenity */}
      <VoiceAgentButton />
      
      {/* Floating CTA for mobile users */}
      <FloatingCTA />
    </div>
  );
}
