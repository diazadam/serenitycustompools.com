import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ViewportModeToggle } from "@/components/ViewportModeToggle";
import { useViewportMode } from "@/contexts/ViewportModeContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, ChevronDown, User, LogOut, LayoutDashboard, Phone } from "lucide-react";
import { SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface NavigationProps {
  onMobileMenuClose?: () => void;
}

export default function Navigation({ onMobileMenuClose }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [affiliateName, setAffiliateName] = useState<string | null>(null);
  const { isMobile, isDesktop } = useViewportMode();
  const { toast } = useToast();

  // Check for stored affiliate ID on mount
  useEffect(() => {
    const storedId = localStorage.getItem("affiliateId");
    const storedName = localStorage.getItem("affiliateName");
    if (storedId) {
      setAffiliateId(storedId);
      setAffiliateName(storedName);
    }
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    onMobileMenuClose?.();
  };

  const handleLogout = () => {
    localStorage.removeItem("affiliateId");
    localStorage.removeItem("affiliateName");
    setAffiliateId(null);
    setAffiliateName(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    // Redirect to home page
    window.location.href = "/";
  };

  // Track affiliate referrals
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      // Store the referral code for later use in forms
      localStorage.setItem('affiliateReferralCode', referralCode);
      
      // Track the click with our API
      fetch('/api/affiliates/track-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: referralCode }),
      }).catch(err => console.log('Referral tracking error:', err));
    }
  }, []);

  return (
    <>
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          {/* Logo Section - Responsive */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <img 
                src="./attached_assets/IMG_2562_1756470795017.jpeg" 
                alt="Serenity Custom Pools LLC Logo" 
                className={`${isMobile ? 'h-8' : 'h-10'} w-auto mr-2 object-contain`}
                data-testid="company-logo"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-serif font-bold text-luxury-navy`} data-testid="logo">
                Serenity Custom Pools<span className="text-luxury-gold"> LLC</span>
              </h1>
            </div>
            
            {/* Facebook Follow Button */}
            <a
              href="https://www.facebook.com/SerenityCustomPools"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#1877F2] text-white px-3 py-1.5 rounded-full hover:bg-[#166FE5] transition-colors shadow-md hover:shadow-lg"
              data-testid="button-facebook-follow"
              title="Follow us on Facebook"
            >
              <SiFacebook className="w-4 h-4" />
              <span className={`${isMobile ? 'hidden' : 'text-sm font-medium'}`}>
                Follow Us
              </span>
            </a>
            
            {/* Voice Agent Button - triggers the floating voice agent */}
            <Button
              onClick={() => {
                // Find and click the floating voice agent button
                const voiceAgentButton = document.querySelector('[data-testid="voice-agent-button"]');
                if (voiceAgentButton) {
                  (voiceAgentButton as HTMLButtonElement).click();
                }
              }}
              className="flex items-center gap-2 bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-navy px-3 py-1.5 rounded-full shadow-md hover:shadow-lg"
              data-testid="button-voice-agent"
              title="Talk with our AI Assistant"
            >
              <Phone className="w-4 h-4" />
              <span className={`${isMobile ? 'hidden' : 'text-sm font-medium'}`}>
                Call Assistant
              </span>
            </Button>
          </div>
          
          {/* Viewport Mode Toggle & Navigation */}
          <div className="flex items-center gap-4">
            {/* Viewport Mode Toggle - Always visible */}
            <ViewportModeToggle variant="select" className="text-xs" />
            
            {/* Desktop Navigation */}
            {isDesktop && (
              <div className="flex items-center space-x-6 lg:space-x-8">
                <a href="#services" className="text-luxury-charcoal hover:text-luxury-gold transition-colors text-sm lg:text-base" data-testid="nav-services">Services</a>
                <Link href="/pool-visualizer" className="text-luxury-charcoal hover:text-luxury-gold transition-colors text-sm lg:text-base" data-testid="nav-visualizer">AI Visualizer</Link>
                <a href="#portfolio" className="text-luxury-charcoal hover:text-luxury-gold transition-colors text-sm lg:text-base" data-testid="nav-portfolio">Portfolio</a>
                <Link href="/media" className="text-luxury-charcoal hover:text-luxury-gold transition-colors text-sm lg:text-base" data-testid="nav-media">Media Gallery</Link>
                <Link href="/blog" className="text-luxury-charcoal hover:text-luxury-gold transition-colors text-sm lg:text-base" data-testid="nav-blog">Blog</Link>
                <a href="#about" className="text-luxury-charcoal hover:text-luxury-gold transition-colors text-sm lg:text-base" data-testid="nav-about">About</a>
                <a href="#contact" className="text-luxury-charcoal hover:text-luxury-gold transition-colors text-sm lg:text-base" data-testid="nav-contact">Contact</a>
                
                {/* Affiliate Dropdown */}
                {affiliateId ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 text-luxury-charcoal hover:text-luxury-gold transition-colors text-sm lg:text-base cursor-pointer" data-testid="nav-affiliate-logged-in">
                      <User className="h-4 w-4" />
                      {affiliateName || 'Affiliate'}
                      <ChevronDown className="h-3 w-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white border-luxury-gold/20">
                      <DropdownMenuItem asChild className="hover:bg-luxury-gold/10 cursor-pointer">
                        <a href="/affiliate-dashboard" className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          My Dashboard
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-luxury-gold/20" />
                      <DropdownMenuItem 
                        onClick={handleLogout} 
                        className="hover:bg-luxury-gold/10 cursor-pointer flex items-center gap-2 text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 text-luxury-charcoal hover:text-luxury-gold transition-colors text-sm lg:text-base" data-testid="nav-affiliate">
                      Affiliate
                      <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white border-luxury-gold/20">
                      <DropdownMenuItem asChild className="hover:bg-luxury-gold/10 cursor-pointer">
                        <a href="/affiliate">
                          Affiliate Program
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="hover:bg-luxury-gold/10 cursor-pointer">
                        <a href="/affiliate-dashboard">
                          Affiliate Dashboard
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <a href="/crm" className="text-luxury-charcoal hover:text-luxury-gold transition-colors text-xs" data-testid="nav-crm">CRM</a>
                <button 
                  className="bg-luxury-gold text-white px-4 lg:px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm lg:text-base"
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="button-get-quote"
                >
                  Get Free Quote
                </button>
              </div>
            )}
            
            {/* Mobile Navigation using Sheet */}
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2" data-testid="button-mobile-menu">
                    <Menu className="w-5 h-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-6 mt-8">
                    {/* Mobile menu items */}
                    <div className="space-y-4">
                      <a 
                        href="#services" 
                        onClick={closeMobileMenu}
                        className="block text-luxury-charcoal hover:text-luxury-gold transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-lg font-medium"
                        data-testid="nav-mobile-services"
                      >
                        Services
                      </a>
                      <Link 
                        href="/pool-visualizer" 
                        onClick={closeMobileMenu}
                        className="block text-luxury-charcoal hover:text-luxury-gold transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-lg font-medium"
                        data-testid="nav-mobile-visualizer"
                      >
                        AI Visualizer
                      </Link>
                      <a 
                        href="#portfolio" 
                        onClick={closeMobileMenu}
                        className="block text-luxury-charcoal hover:text-luxury-gold transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-lg font-medium"
                        data-testid="nav-mobile-portfolio"
                      >
                        Portfolio
                      </a>
                      <Link 
                        href="/media" 
                        onClick={closeMobileMenu}
                        className="block text-luxury-charcoal hover:text-luxury-gold transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-lg font-medium"
                        data-testid="nav-mobile-media"
                      >
                        Media Gallery
                      </Link>
                      <Link 
                        href="/blog" 
                        onClick={closeMobileMenu}
                        className="block text-luxury-charcoal hover:text-luxury-gold transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-lg font-medium"
                        data-testid="nav-mobile-blog"
                      >
                        Blog
                      </Link>
                      <a 
                        href="#about" 
                        onClick={closeMobileMenu}
                        className="block text-luxury-charcoal hover:text-luxury-gold transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-lg font-medium"
                        data-testid="nav-mobile-about"
                      >
                        About
                      </a>
                      <a 
                        href="#contact" 
                        onClick={closeMobileMenu}
                        className="block text-luxury-charcoal hover:text-luxury-gold transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-lg font-medium"
                        data-testid="nav-mobile-contact"
                      >
                        Contact
                      </a>
                      
                      {/* Mobile Affiliate Section */}
                      {affiliateId ? (
                        <div className="space-y-2">
                          <div className="text-luxury-charcoal font-medium px-4 py-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {affiliateName || 'Affiliate'}
                          </div>
                          <a 
                            href="/affiliate-dashboard" 
                            onClick={closeMobileMenu}
                            className="block text-luxury-charcoal hover:text-luxury-gold transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-lg font-medium ml-4"
                            data-testid="nav-mobile-affiliate-dashboard"
                          >
                            <LayoutDashboard className="h-4 w-4 inline mr-2" />
                            My Dashboard
                          </a>
                          <button 
                            onClick={() => {
                              handleLogout();
                              closeMobileMenu();
                            }}
                            className="w-full text-left text-red-600 hover:text-red-700 transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-lg font-medium ml-4"
                            data-testid="nav-mobile-affiliate-logout"
                          >
                            <LogOut className="h-4 w-4 inline mr-2" />
                            Sign Out
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <a 
                            href="/affiliate" 
                            onClick={closeMobileMenu}
                            className="block text-luxury-charcoal hover:text-luxury-gold transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-lg font-medium"
                            data-testid="nav-mobile-affiliate"
                          >
                            Affiliate Program
                          </a>
                          <a 
                            href="/affiliate-dashboard" 
                            onClick={closeMobileMenu}
                            className="block text-luxury-charcoal hover:text-luxury-gold transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-lg font-medium ml-4"
                            data-testid="nav-mobile-affiliate-dashboard"
                          >
                            ↳ Dashboard
                          </a>
                        </div>
                      )}
                      
                      <a 
                        href="/crm" 
                        onClick={closeMobileMenu}
                        className="block text-luxury-charcoal hover:text-luxury-gold transition-colors py-3 px-4 rounded-lg hover:bg-gray-50 text-base"
                        data-testid="nav-mobile-crm"
                      >
                        CRM Dashboard
                      </a>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <button 
                        className="w-full bg-luxury-gold text-white px-6 py-4 rounded-lg hover:bg-yellow-600 transition-colors font-medium text-lg"
                        onClick={() => {
                          closeMobileMenu();
                          document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        data-testid="button-mobile-get-quote"
                      >
                        Get Free Quote
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </nav>
    </header>
    </>
  );
}