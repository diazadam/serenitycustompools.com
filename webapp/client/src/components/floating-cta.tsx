import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Show floating CTA when user scrolls past hero section
      setIsVisible(currentScrollY > window.innerHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <Button 
        onClick={() => {
          document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="bg-luxury-gold hover:bg-yellow-600 text-white px-6 py-4 rounded-full shadow-2xl font-semibold text-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 pulse-glow"
        data-testid="floating-cta"
      >
        <span>💰</span>
        <span className="hidden sm:inline">Get Free Quote</span>
        <span className="sm:hidden">Quote</span>
        <span>→</span>
      </Button>
    </div>
  );
}