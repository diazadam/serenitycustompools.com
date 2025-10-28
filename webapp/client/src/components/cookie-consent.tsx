import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Cookie, X, Settings, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { initGoogleAnalytics, disableGoogleAnalytics } from "@/lib/analytics";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem("cookie-consent");
    const savedPreferences = localStorage.getItem("cookie-preferences");
    
    if (!hasConsented) {
      setShowBanner(true);
      // Delay animation for smooth entrance
      setTimeout(() => setIsVisible(true), 100);
    } else {
      // Show floating button if consent was given
      setShowFloatingButton(true);
      
      // If user previously consented, reinitialize analytics if needed
      if (hasConsented === 'accepted' || (savedPreferences && JSON.parse(savedPreferences).analytics)) {
        initGoogleAnalytics();
      }
    }
    
    // Load saved preferences if available
    if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences);
        setPreferences(prefs);
      } catch (e) {
        console.error('Failed to load cookie preferences:', e);
      }
    }
  }, []);

  const savePreferences = (accepted: boolean, customPreferences?: CookiePreferences) => {
    const finalPreferences = customPreferences || preferences;
    
    // Save consent status
    localStorage.setItem("cookie-consent", accepted ? "accepted" : "custom");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    localStorage.setItem("cookie-preferences", JSON.stringify(finalPreferences));
    
    // Handle Google Analytics based on preferences
    if (finalPreferences.analytics) {
      initGoogleAnalytics();
    } else {
      disableGoogleAnalytics();
    }
    
    // Close banner
    setIsVisible(false);
    setTimeout(() => {
      setShowBanner(false);
      setShowFloatingButton(true);
    }, 300);
  };

  const acceptAllCookies = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setPreferences(allAccepted);
    savePreferences(true, allAccepted);
  };

  const rejectAllCookies = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setPreferences(onlyNecessary);
    localStorage.setItem("cookie-consent", "rejected");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    localStorage.setItem("cookie-preferences", JSON.stringify(onlyNecessary));
    
    // Disable analytics
    disableGoogleAnalytics();
    
    setIsVisible(false);
    setTimeout(() => {
      setShowBanner(false);
      setShowFloatingButton(true);
    }, 300);
  };

  const saveCustomPreferences = () => {
    savePreferences(false);
    setShowSettings(false);
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  return (
    <>
      {/* Main Cookie Banner */}
      {showBanner && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-[100] p-4 transition-transform duration-300 ${
            isVisible ? "translate-y-0" : "translate-y-full"
          }`}
          data-testid="cookie-consent-banner"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-2xl border border-gold/20 p-6 md:p-8">
              <button
                onClick={rejectAllCookies}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close cookie consent"
                data-testid="button-close-cookies"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Cookie className="w-6 h-6 text-gold mt-1 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-semibold text-navy" data-testid="text-cookie-title">
                      This Website Uses Cookies
                    </h3>
                    <p className="text-sm text-gray-600" data-testid="text-cookie-message">
                      We use cookies to enhance your browsing experience, personalize content, track affiliate referrals, 
                      and analyze our website traffic. By clicking "Accept All Cookies", you agree to the storing of cookies 
                      on your device. You can manage your preferences or reject non-essential cookies.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Link href="/privacy-policy" className="text-gold hover:underline" data-testid="link-privacy">
                        Privacy Policy
                      </Link>
                      <span className="text-gray-400">•</span>
                      <Link href="/terms-of-service" className="text-gold hover:underline" data-testid="link-terms">
                        Terms of Service
                      </Link>
                      <span className="text-gray-400">•</span>
                      <button
                        onClick={openSettings}
                        className="text-gold hover:underline"
                        data-testid="button-cookie-settings"
                      >
                        Cookie Settings
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Button Group - Simple vertical stack for visibility */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={acceptAllCookies}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#D4AF37',
                      color: 'white',
                      fontWeight: 'bold',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                    data-testid="button-accept-cookies"
                  >
                    Accept All Cookies
                  </button>
                  <button
                    onClick={openSettings}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'white',
                      color: '#D4AF37',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: '2px solid #D4AF37',
                      cursor: 'pointer',
                      fontSize: '15px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FDF5E6'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    data-testid="button-customize"
                  >
                    Customize
                  </button>
                  <button
                    onClick={rejectAllCookies}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'white',
                      color: '#6B7280',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: '2px solid #D1D5DB',
                      cursor: 'pointer',
                      fontSize: '15px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    data-testid="button-reject-cookies"
                  >
                    Reject All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cookie Settings Button */}
      {showFloatingButton && !showBanner && (
        <button
          onClick={openSettings}
          className="fixed bottom-4 left-4 z-[60] bg-white border border-gray-300 rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
          aria-label="Cookie Settings"
          data-testid="button-floating-cookie"
        >
          <Cookie className="w-5 h-5 text-gray-600 group-hover:text-gold transition-colors" />
        </button>
      )}

      {/* Cookie Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[600px]" data-testid="dialog-cookie-settings">
          <DialogHeader>
            <DialogTitle className="text-2xl text-navy">Cookie Settings</DialogTitle>
            <DialogDescription className="text-gray-600">
              Manage your cookie preferences. You can enable or disable different types of cookies below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1 flex-1">
                <Label htmlFor="necessary" className="font-semibold text-navy">
                  Necessary Cookies
                </Label>
                <p className="text-sm text-gray-600">
                  These cookies are essential for the website to function properly. They enable basic functions like page navigation and access to secure areas.
                </p>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <Check className="w-5 h-5 text-green-600" />
                <Switch
                  id="necessary"
                  checked={true}
                  disabled
                  className="opacity-50"
                />
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1 flex-1">
                <Label htmlFor="analytics" className="font-semibold text-navy">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-gray-600">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously (Google Analytics).
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics: checked })
                }
                data-testid="switch-analytics"
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1 flex-1">
                <Label htmlFor="marketing" className="font-semibold text-navy">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-gray-600">
                  These cookies are used to track visitors across websites to display ads that are relevant and engaging for individual users.
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, marketing: checked })
                }
                data-testid="switch-marketing"
              />
            </div>

            {/* Functional Cookies */}
            <div className="flex items-start justify-between space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1 flex-1">
                <Label htmlFor="functional" className="font-semibold text-navy">
                  Functional Cookies
                </Label>
                <p className="text-sm text-gray-600">
                  These cookies enable enhanced functionality and personalization, such as videos and live chats. They may be set by us or third-party providers.
                </p>
              </div>
              <Switch
                id="functional"
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, functional: checked })
                }
                data-testid="switch-functional"
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            <p>
              For more information about how we use cookies, please read our{" "}
              <Link href="/privacy-policy" className="text-gold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                rejectAllCookies();
                setShowSettings(false);
              }}
              className="border-gray-300"
              data-testid="button-settings-reject"
            >
              Reject All
            </Button>
            <Button
              onClick={() => {
                acceptAllCookies();
                setShowSettings(false);
              }}
              variant="outline"
              className="border-gold text-gold hover:bg-gold/10"
              data-testid="button-settings-accept"
            >
              Accept All
            </Button>
            <Button
              onClick={saveCustomPreferences}
              className="bg-gold hover:bg-gold/90 text-white"
              data-testid="button-save-preferences"
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}