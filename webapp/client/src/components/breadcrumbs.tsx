import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items: customItems, className = "" }: BreadcrumbsProps) {
  const [location] = useLocation();
  
  // Generate breadcrumbs based on URL if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) return customItems;
    
    const paths = location.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/" }
    ];
    
    // Map paths to friendly names
    const pathNames: Record<string, string> = {
      'affiliate': 'Affiliate Program',
      'affiliate-dashboard': 'Dashboard',
      'affiliate-register': 'Register',
      'affiliate-agreement': 'Agreement',
      'affiliate-landing': 'Partner Program',
      'admin': 'Admin',
      'admin-affiliates': 'Manage Affiliates',
      'admin-simple': 'Dashboard',
      'crm': 'CRM Dashboard',
      'privacy-policy': 'Privacy Policy',
      'terms-of-service': 'Terms of Service',
      'service-areas': 'Service Areas',
      'faq': 'FAQ'
    };
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const isLast = index === paths.length - 1;
      
      breadcrumbs.push({
        label: pathNames[path] || path.charAt(0).toUpperCase() + path.slice(1),
        href: isLast ? undefined : currentPath
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  useEffect(() => {
    // Add Breadcrumb Schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.label,
        "item": crumb.href ? `https://serenitycustompools.com${crumb.href}` : undefined
      }))
    };
    
    // Add or update schema script
    let script = document.getElementById('breadcrumb-schema') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'breadcrumb-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(breadcrumbSchema);
    
    return () => {
      // Cleanup if needed
    };
  }, [breadcrumbs]);
  
  // Don't show breadcrumbs on home page
  if (location === '/' && !customItems) return null;
  
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`bg-gray-50 py-3 px-4 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              )}
              
              {crumb.href ? (
                <Link href={crumb.href}>
                  <a className="text-gray-600 hover:text-pool-crystal-blue transition-colors flex items-center">
                    {index === 0 && <Home className="w-4 h-4 mr-1" />}
                    {crumb.label}
                  </a>
                </Link>
              ) : (
                <span className="text-luxury-navy font-semibold flex items-center">
                  {index === 0 && <Home className="w-4 h-4 mr-1" />}
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}