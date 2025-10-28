import { useEffect } from 'react';
import { businessInfo, getPageSEO } from '@/lib/seo-config';
import { useLocation } from 'wouter';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  pageType?: string;
}

export default function SEOHead({ 
  title,
  description,
  keywords,
  canonical,
  ogImage = "/og-pool-image.jpg",
  pageType
}: SEOHeadProps) {
  const [location] = useLocation();
  
  // Determine page type from URL if not provided
  const currentPageType = pageType || location.split('/')[1] || 'home';
  const pageSEO = getPageSEO(currentPageType);
  
  // Use provided values or fallback to config
  const finalTitle = title || pageSEO.title;
  const finalDescription = description || pageSEO.description;
  const finalKeywords = keywords || pageSEO.keywords || '';
  const finalCanonical = canonical || `https://serenitycustompools.com${location}`;
  const finalOgImage = ogImage;
  
  useEffect(() => {
    // Set page title
    document.title = finalTitle;
    
    // Set or update meta tags
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic SEO meta tags
    setMetaTag('description', finalDescription);
    setMetaTag('keywords', finalKeywords);
    setMetaTag('robots', 'index, follow, max-image-preview:large');
    setMetaTag('author', `${businessInfo.name} - Ronald Jones`);
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    // Open Graph tags
    setMetaTag('og:title', finalTitle, true);
    setMetaTag('og:description', finalDescription, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', finalCanonical, true);
    setMetaTag('og:image', finalOgImage, true);
    setMetaTag('og:image:width', '1200', true);
    setMetaTag('og:image:height', '630', true);
    setMetaTag('og:site_name', businessInfo.name, true);
    setMetaTag('og:locale', 'en_US', true);
    
    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', finalTitle);
    setMetaTag('twitter:description', finalDescription);
    setMetaTag('twitter:image', finalOgImage);
    setMetaTag('twitter:site', '@serenitypools');
    setMetaTag('twitter:creator', '@serenitypools');
    
    // Local Business Schema
    const businessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": businessInfo.name,
      "alternateName": "Serenity Pools",
      "description": finalDescription,
      "url": finalCanonical,
      "telephone": businessInfo.phone,
      "email": businessInfo.email,
      "founder": {
        "@type": "Person",
        "name": "Ronald Jones",
        "jobTitle": "Owner & Master Pool Builder"
      },
      "address": {
        "@type": "PostalAddress",
        "addressRegion": businessInfo.address.region,
        "addressCountry": businessInfo.address.country
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": String(businessInfo.address.coordinates.latitude),
        "longitude": String(businessInfo.address.coordinates.longitude)
      },
      "areaServed": businessInfo.serviceAreas.slice(0, 10).map(area => ({
        "@type": "City",
        "name": area,
        "containedInPlace": "Georgia, US"
      })),
      "serviceType": [
        "Custom Pool Construction",
        "Luxury Pool Design", 
        "Infinity Pool Installation",
        "Spa & Hot Tub Installation",
        "Pool Renovation",
        "Outdoor Living Spaces"
      ],
      "priceRange": businessInfo.priceRange,
      "paymentAccepted": "Cash, Check, Credit Card, Financing Available",
      "currenciesAccepted": "USD",
      "openingHours": "Mo-Fr 08:00-18:00",
      "image": finalOgImage,
      "sameAs": Object.values(businessInfo.socialProfiles)
    };

    // Service Schema
    const serviceSchema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Luxury Custom Pool Construction",
      "description": "Premium custom pool design and construction services for luxury homes in North Georgia",
      "provider": {
        "@type": "LocalBusiness",
        "name": businessInfo.name
      },
      "areaServed": {
        "@type": "State",
        "name": "North Georgia"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Pool Construction Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Custom Infinity Pool Construction"
            }
          },
          {
            "@type": "Offer", 
            "itemOffered": {
              "@type": "Service",
              "name": "Luxury Spa Installation"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service", 
              "name": "Pool Renovation & Remodeling"
            }
          }
        ]
      }
    };

    // Add or update schema scripts
    const addSchema = (schema: any, id: string) => {
      let script = document.getElementById(id) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    };

    addSchema(businessSchema, 'business-schema');
    addSchema(serviceSchema, 'service-schema');

    // Canonical link
    let canonical_link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical_link) {
      canonical_link = document.createElement('link');
      canonical_link.rel = 'canonical';
      document.head.appendChild(canonical_link);
    }
    canonical_link.href = finalCanonical;

  }, [finalTitle, finalDescription, finalKeywords, finalCanonical, finalOgImage]);

  return null;
}