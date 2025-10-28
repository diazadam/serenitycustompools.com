import { Link } from "wouter";
import { businessInfo } from "@/lib/seo-config";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube, Linkedin, Award, Shield, Star } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-luxury-navy text-white" itemScope itemType="https://schema.org/LocalBusiness">
      {/* Main Footer Content */}
      <div className="py-16 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            
            {/* Company Info & NAP */}
            <div className="lg:col-span-2">
              <h3 className="text-3xl font-serif font-bold mb-4" itemProp="name">
                Serenity Custom Pools<span className="text-luxury-gold"> LLC</span>
              </h3>
              <p className="text-gray-400 mb-6" itemProp="description">
                North Georgia's premier custom pool builders since {businessInfo.yearEstablished}. 
                Ronald Jones, with over {businessInfo.yearsExperience} years of luxury pool construction experience, 
                leads our licensed contractors specializing in custom pools, spas & outdoor living.
              </p>
              
              {/* NAP Information */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-luxury-gold mr-3" />
                  <a href={`tel:${businessInfo.phone}`} className="hover:text-luxury-gold transition-colors" itemProp="telephone">
                    {businessInfo.phone}
                  </a>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-luxury-gold mr-3" />
                  <a href={`mailto:${businessInfo.email}`} className="hover:text-luxury-gold transition-colors" itemProp="email">
                    {businessInfo.email}
                  </a>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-luxury-gold mr-3 mt-1" />
                  <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                    <span itemProp="addressRegion">North Georgia & Atlanta Metro</span><br />
                    <span className="text-sm text-gray-400">Serving all of {businessInfo.address.region}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-luxury-gold mr-3 mt-1" />
                  <div>
                    <span className="font-semibold">Business Hours:</span><br />
                    <time itemProp="openingHours" content="Mo-Fr 08:00-18:00">
                      Monday - Friday: 8:00 AM - 6:00 PM
                    </time><br />
                    <span className="text-sm text-gray-400">24/7 Emergency Service Available</span>
                  </div>
                </div>
              </div>
              
              {/* Social Media Links with Glass Morphic Design */}
              <div className="flex space-x-3 sm:space-x-4 overflow-hidden max-w-full">
                {/* Facebook Glass Button */}
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-luxury-gold to-blue-600 opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-500" />
                  <a 
                    href={businessInfo.socialProfiles.facebook} 
                    className="relative block p-2 sm:p-3 rounded-full glass-social-button group-hover:scale-110 transform transition-all duration-300"
                    aria-label="Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-luxury-gold/20 to-pool-crystal-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-[1px] rounded-full glass-inner-social" />
                    <Facebook className="relative z-10 w-6 h-6 text-gray-400 group-hover:text-luxury-gold transition-colors duration-300" />
                  </a>
                </div>
                
                {/* Instagram Glass Button */}
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-600 via-luxury-gold to-purple-600 opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-500" />
                  <a 
                    href={businessInfo.socialProfiles.instagram} 
                    className="relative block p-2 sm:p-3 rounded-full glass-social-button group-hover:scale-110 transform transition-all duration-300"
                    aria-label="Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-luxury-gold/20 to-pool-crystal-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-[1px] rounded-full glass-inner-social" />
                    <Instagram className="relative z-10 w-6 h-6 text-gray-400 group-hover:text-luxury-gold transition-colors duration-300" />
                  </a>
                </div>
                
                {/* Youtube Glass Button */}
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-600 via-luxury-gold to-red-600 opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-500" />
                  <a 
                    href={businessInfo.socialProfiles.youtube} 
                    className="relative block p-2 sm:p-3 rounded-full glass-social-button group-hover:scale-110 transform transition-all duration-300"
                    aria-label="YouTube"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-luxury-gold/20 to-pool-crystal-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-[1px] rounded-full glass-inner-social" />
                    <Youtube className="relative z-10 w-6 h-6 text-gray-400 group-hover:text-luxury-gold transition-colors duration-300" />
                  </a>
                </div>
                
                {/* LinkedIn Glass Button */}
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-700 via-luxury-gold to-blue-700 opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-500" />
                  <a 
                    href={businessInfo.socialProfiles.linkedin} 
                    className="relative block p-2 sm:p-3 rounded-full glass-social-button group-hover:scale-110 transform transition-all duration-300"
                    aria-label="LinkedIn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-luxury-gold/20 to-pool-crystal-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-[1px] rounded-full glass-inner-social" />
                    <Linkedin className="relative z-10 w-6 h-6 text-gray-400 group-hover:text-luxury-gold transition-colors duration-300" />
                  </a>
                </div>
              </div>
            </div>
            
            {/* Services */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-luxury-gold">Our Services</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/#services" className="text-gray-400 hover:text-white transition-colors">
                    Custom Pool Construction
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="text-gray-400 hover:text-white transition-colors">
                    Infinity Pools
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="text-gray-400 hover:text-white transition-colors">
                    Spa Installation
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="text-gray-400 hover:text-white transition-colors">
                    Pool Renovation
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="text-gray-400 hover:text-white transition-colors">
                    Outdoor Living Spaces
                  </Link>
                </li>
                <li>
                  <Link href="/#visualizer" className="text-gray-400 hover:text-white transition-colors">
                    AI Pool Visualization
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-luxury-gold">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/service-areas" className="text-gray-400 hover:text-white transition-colors">
                    Service Areas
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/#portfolio" className="text-gray-400 hover:text-white transition-colors">
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link href="/#testimonials" className="text-gray-400 hover:text-white transition-colors">
                    Reviews
                  </Link>
                </li>
                <li>
                  <Link href="/#contact" className="text-gray-400 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/affiliate" className="text-luxury-gold hover:text-white transition-colors font-semibold">
                    💰 Affiliate Program
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Service Areas */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-luxury-gold">Service Areas</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/service-areas#alpharetta">
                    <a className="text-gray-400 hover:text-white transition-colors">Pool Builder Alpharetta</a>
                  </Link>
                </li>
                <li>
                  <Link href="/service-areas#roswell">
                    <a className="text-gray-400 hover:text-white transition-colors">Pool Construction Roswell</a>
                  </Link>
                </li>
                <li>
                  <Link href="/service-areas#johns-creek">
                    <a className="text-gray-400 hover:text-white transition-colors">Custom Pools Johns Creek</a>
                  </Link>
                </li>
                <li>
                  <Link href="/service-areas#sandy-springs">
                    <a className="text-gray-400 hover:text-white transition-colors">Luxury Pools Sandy Springs</a>
                  </Link>
                </li>
                <li>
                  <Link href="/service-areas#marietta">
                    <a className="text-gray-400 hover:text-white transition-colors">Pool Contractor Marietta</a>
                  </Link>
                </li>
                <li>
                  <Link href="/service-areas">
                    <a className="text-gray-400 hover:text-white transition-colors">+ {businessInfo.serviceAreas.length - 5} More Cities</a>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust Indicators */}
      <div className="py-8 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <Award className="w-8 h-8 text-luxury-gold mx-auto mb-2" />
              <div className="text-2xl font-bold">{businessInfo.yearsExperience}+</div>
              <div className="text-sm text-gray-400">Years Experience</div>
            </div>
            <div>
              <Shield className="w-8 h-8 text-luxury-gold mx-auto mb-2" />
              <div className="text-2xl font-bold">{businessInfo.poolsBuilt}+</div>
              <div className="text-sm text-gray-400">Pools Built</div>
            </div>
            <div>
              <Star className="w-8 h-8 text-luxury-gold mx-auto mb-2" />
              <div className="text-2xl font-bold">{businessInfo.rating.value}</div>
              <div className="text-sm text-gray-400">Star Rating</div>
            </div>
            <div>
              <Phone className="w-8 h-8 text-luxury-gold mx-auto mb-2" />
              <div className="text-2xl font-bold">24hr</div>
              <div className="text-sm text-gray-400">Response Time</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Footer */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="text-sm text-gray-400">
              <p>&copy; {currentYear} {businessInfo.name}. All rights reserved.</p>
              <p className="mt-1">Licensed & Insured | Georgia Contractor License #XXXXXX | Ronald Jones - Owner</p>
            </div>
            <div className="mt-4 md:mt-0">
              <ul className="flex flex-wrap gap-4 text-sm">
                <li>
                  <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/affiliate/agreement" className="text-gray-400 hover:text-white transition-colors">
                    Affiliate Agreement
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Sitemap
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* SEO Rich Text (Hidden) */}
      <div className="sr-only">
        <p>
          Serenity Custom Pools LLC is the leading pool builder serving {businessInfo.serviceAreas.join(", ")} 
          and all of North Georgia. We specialize in luxury custom pool construction, infinity pools, 
          spa installation, and complete outdoor living transformations. With over {businessInfo.yearsExperience} years 
          of experience and {businessInfo.poolsBuilt}+ pools built, we're the trusted choice for homeowners 
          seeking quality pool construction. Contact us at {businessInfo.phone} for a free consultation 
          and AI pool visualization. Licensed, bonded, and fully insured Georgia pool contractor.
        </p>
      </div>
    </footer>
  );
}