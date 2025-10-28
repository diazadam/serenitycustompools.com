import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import PortfolioSection from "@/components/portfolio-section";
import SEOHead from "@/components/seo-head";

export default function Portfolio() {
  return (
    <>
      <SEOHead 
        title="Portfolio | Luxury Pool Transformations | Serenity Custom Pools"
        description="Explore our award-winning portfolio of luxury pool installations and complete backyard transformations. View before & after photos of our custom pools, spas, and outdoor living spaces in Greater St. Louis."
        keywords="pool portfolio, pool gallery, backyard transformations, custom pools St. Louis, pool before and after, luxury pools, pool design examples"
        ogImage="/og-portfolio.jpg"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-pool-crystal-blue/10 to-white">
        <Navigation />
        
        {/* Hero Section */}
        <div className="relative bg-luxury-navy text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-r from-pool-deep-blue to-pool-crystal-blue opacity-90"></div>
          <div className="relative max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4" data-testid="portfolio-page-title">
              Our Portfolio
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              30+ Years of Excellence in Luxury Pool Design
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/">
                <Button variant="outline" className="bg-white/10 text-white border-white hover:bg-white hover:text-luxury-navy">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/pool-visualizer">
                <Button className="bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-navy">
                  Try AI Visualizer
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Portfolio Content */}
        <PortfolioSection />
        
        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-pool-crystal-blue to-pool-turquoise">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
              Ready to Create Your Dream Pool?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Let's transform your backyard into a personal paradise
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pool-visualizer">
                <Button size="lg" className="bg-white text-pool-crystal-blue hover:bg-white/90">
                  Visualize Your Pool
                </Button>
              </Link>
              <Link href="/#contact">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Get Free Quote
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    </>
  );
}