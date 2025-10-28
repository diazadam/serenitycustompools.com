import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ViewportModeProvider } from "@/contexts/ViewportModeContext";
import { CookieConsent } from "@/components/cookie-consent";
import Home from "@/pages/home";
import AffiliateRegister from "@/pages/affiliate-register";
import AffiliateDashboard from "@/pages/affiliate-dashboard";
import AffiliateLanding from "@/pages/affiliate-landing";
import AdminAffiliates from "@/pages/admin-affiliates";
import AdminSimple from "@/pages/admin-simple";
import CRMDashboard from "@/pages/crm-dashboard";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import AffiliateAgreement from "@/pages/affiliate-agreement";
import ServiceAreas from "@/pages/service-areas";
import FAQ from "@/pages/faq";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import BlogAutomation from "@/pages/blog-automation";
import EmailAnalytics from "@/pages/email-analytics";
import NotFound from "@/pages/not-found";
import PoolVisualizer from "@/pages/pool-visualizer";
import Portfolio from "@/pages/portfolio";
import MediaGallery from "@/pages/media";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pool-visualizer" component={PoolVisualizer} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/media" component={MediaGallery} />
      <Route path="/affiliate" component={AffiliateLanding} />
      <Route path="/affiliate-landing" component={AffiliateLanding} />
      <Route path="/affiliate/register" component={AffiliateRegister} />
      <Route path="/affiliate-register" component={AffiliateRegister} />
      <Route path="/affiliate/dashboard" component={AffiliateDashboard} />
      <Route path="/affiliate-dashboard" component={AffiliateDashboard} />
      <Route path="/affiliate/agreement" component={AffiliateAgreement} />
      <Route path="/admin" component={AdminSimple} />
      <Route path="/admin/affiliates" component={AdminAffiliates} />
      <Route path="/admin/simple" component={AdminSimple} />
      <Route path="/crm" component={CRMDashboard} />
      <Route path="/email-analytics" component={EmailAnalytics} />
      <Route path="/service-areas" component={ServiceAreas} />
      <Route path="/faq" component={FAQ} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/blog-automation" component={BlogAutomation} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Google Analytics is now initialized only after user consents through the CookieConsent component
  
  return (
    <QueryClientProvider client={queryClient}>
      <ViewportModeProvider>
        <TooltipProvider>
          <Toaster />
          <CookieConsent />
          <Router />
        </TooltipProvider>
      </ViewportModeProvider>
    </QueryClientProvider>
  );
}

export default App;
