import { useEffect } from "react";
import SEOHead from "@/components/seo-head";
import Navigation from "@/components/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { businessInfo } from "@/lib/seo-config";
import { Phone, Mail, Clock, DollarSign, Calendar, Shield, Wrench, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Costs & Financing
  {
    category: "Costs & Financing",
    question: "How much does a custom pool cost in North Georgia?",
    answer: `Our custom luxury pools typically range from ${businessInfo.priceRange}, depending on size, features, and materials. The average pool project in North Georgia is around $95,000. We provide free detailed quotes after an on-site consultation to assess your specific needs and property requirements. Factors affecting cost include pool size, depth, special features (infinity edge, spa, waterfall), decking materials, and site conditions.`
  },
  {
    category: "Costs & Financing",
    question: "Do you offer pool financing options?",
    answer: "Yes! We work with several trusted financing partners to offer competitive rates on pool construction loans. Many of our clients qualify for rates as low as 5.99% APR with terms up to 20 years. We can help you explore financing options during your free consultation, including home equity loans, pool loans, and cash-out refinancing options. Pre-qualification takes just minutes and doesn't affect your credit score."
  },
  {
    category: "Costs & Financing",
    question: "What's included in the pool construction price?",
    answer: "Our comprehensive quotes include everything needed for your pool: excavation, steel reinforcement, gunite/concrete shell, plumbing, electrical work, equipment (pump, filter, heater), interior finish (plaster, pebble, or tile), coping and decking, basic landscaping restoration, permits, and inspections. We also include our 3D design service and AI visualization at no extra charge. Any additional features like waterfalls, lighting, or automation are itemized separately."
  },

  // Timeline & Process
  {
    category: "Timeline & Process",
    question: "How long does pool construction take?",
    answer: "Most pool construction projects take 8-12 weeks from breaking ground to your first swim. The timeline includes: Week 1: Excavation and steel installation, Weeks 2-3: Plumbing and electrical, Week 4: Gunite application and curing, Weeks 5-6: Tile and coping installation, Weeks 7-8: Decking and equipment, Weeks 9-10: Interior finish and filling. Weather conditions and permit processing can affect the timeline. We provide a detailed schedule at contract signing."
  },
  {
    category: "Timeline & Process",
    question: "What is the pool construction process?",
    answer: "Our proven process ensures a smooth project: 1) Free consultation and site evaluation, 2) 3D design and AI visualization creation, 3) Contract signing and permit application, 4) Excavation and foundation work, 5) Steel framework and plumbing rough-in, 6) Gunite/shotcrete application, 7) Tile, coping, and decking installation, 8) Equipment installation and electrical work, 9) Interior finish application, 10) Pool filling and chemical balancing, 11) Final inspection and pool school training. We keep you informed at every step!"
  },
  {
    category: "Timeline & Process",
    question: "When is the best time to build a pool?",
    answer: "In North Georgia, we build pools year-round! However, the ideal time to start construction is late fall through early spring (October-March). Starting during these months means your pool will be ready for summer swimming. Winter construction often has advantages: faster permit processing, more crew availability, and potential off-season discounts. The key is planning ahead – contact us 3-4 months before your desired completion date."
  },

  // Permits & Regulations
  {
    category: "Permits & Regulations",
    question: "Do you handle pool permits and inspections?",
    answer: "Absolutely! Serenity Custom Pools handles all permit applications, fees, and scheduling of required inspections. We're familiar with local codes in all our service areas including Alpharetta, Roswell, Johns Creek, Sandy Springs, Marietta, and surrounding counties. Permit costs typically range from $500-$1,500 depending on your location and are included in our quote. We ensure your pool meets all safety requirements and local regulations."
  },
  {
    category: "Permits & Regulations",
    question: "What are the setback requirements for pools?",
    answer: "Setback requirements vary by municipality but typically pools must be: 10-15 feet from the house, 10 feet from property lines, 10 feet from septic systems, and outside of any easements. Most cities require pools to be in the rear yard only. During our free consultation, we'll review your property survey and local codes to ensure proper placement. We handle all the research and compliance – you just pick your perfect pool location!"
  },

  // Maintenance & Warranty
  {
    category: "Maintenance & Warranty",
    question: "What maintenance does a pool require?",
    answer: "Modern pools are easier to maintain than ever! Basic maintenance includes: Daily: Run pump 8-12 hours, check skimmer baskets. Weekly: Test and balance water chemistry, brush walls, vacuum if needed. Monthly: Clean filter, check equipment operation. Seasonally: Professional inspection and service. We provide complimentary 'pool school' training after construction and can recommend trusted service companies. Many clients opt for weekly service at $100-150/month."
  },
  {
    category: "Maintenance & Warranty",
    question: "What warranty do you provide?",
    answer: "Serenity Custom Pools stands behind our work with comprehensive warranties: Structure (gunite shell): 10 years, Interior finish: 5-10 years depending on material, Tile and coping: 5 years, Equipment: 2-3 years manufacturer warranty, Workmanship: 2 years on all labor. We also offer extended warranty options and are always available for service after construction. With 30+ years in business, we'll be here when you need us!"
  },

  // Pool Visualization & Design
  {
    category: "Design & Visualization",
    question: "How does the AI pool visualization process work?",
    answer: "Our cutting-edge AI visualization is FREE with every consultation! Simply upload a photo of your backyard, and our AI technology creates a realistic rendering of your custom pool design within 24 hours. The visualization shows exactly how your pool will look in your actual backyard, including water features, decking, and landscaping. You can request unlimited revisions until the design is perfect. This technology has revolutionized pool planning – see your dream pool before we break ground!"
  },
  {
    category: "Design & Visualization",
    question: "Can I customize my pool design?",
    answer: "Absolutely! Every pool we build is 100% custom designed for your property and lifestyle. Choose from endless options: Shape (freeform, geometric, classic), Features (infinity edge, beach entry, tanning ledge, swim-up bar), Water features (waterfalls, fountains, bubblers, jets), Materials (plaster, pebble, tile finishes), Lighting (LED, color-changing, fiber optic), Automation (smartphone control, automatic covers). Our 3D design process lets you explore all options before construction begins."
  },

  // Affiliate Program
  {
    category: "Affiliate Program",
    question: "How does your affiliate program work?",
    answer: "Our Serenity Rewards affiliate program offers generous commissions for referrals! Earn 5-10% commission on pool projects (average $5,000-$10,000 per referral). It's perfect for realtors, contractors, landscapers, or anyone in home services. Sign up is free and takes minutes. We provide marketing materials, tracking dashboard, and monthly payments. Top affiliates earn bonuses and exclusive perks. Join at serenitycustompools.com/affiliate or call for details!"
  },
  {
    category: "Affiliate Program",
    question: "Who can join the affiliate program?",
    answer: "Our affiliate program is open to anyone who can refer pool customers! Ideal partners include: Real estate agents and brokers, Home builders and contractors, Landscape designers, Interior designers, Property managers, Home service professionals, Social media influencers, Previous customers. No experience necessary – we provide training and support. Some of our best affiliates are satisfied customers who love sharing their pool experience!"
  },

  // General Questions
  {
    category: "General",
    question: "Why choose Serenity Custom Pools over other builders?",
    answer: `With ${businessInfo.yearsExperience}+ years of experience and ${businessInfo.poolsBuilt}+ pools built, we're North Georgia's most trusted pool builder. What sets us apart: Owner Ronald Jones personally oversees every project, FREE 3D design and AI visualization technology, Transparent pricing with detailed quotes, ${businessInfo.rating.value}-star rating from ${businessInfo.rating.reviewCount}+ reviews, Licensed, bonded, and fully insured, In-house crews (no subcontractors), Lifetime support and service. We're not just building pools – we're creating backyard dreams!`
  },
  {
    category: "General",
    question: "What types of pools do you build?",
    answer: "We specialize in luxury custom gunite/concrete pools including: Infinity edge pools with stunning views, Classic geometric pools for modern homes, Natural freeform pools with rock features, Lap pools for exercise enthusiasts, Cocktail pools for smaller spaces, Resort-style pools with beach entries, Indoor pools with year-round swimming. We also build spas, hot tubs, and combination pool-spa systems. Every pool is engineered for North Georgia's climate and built to last generations."
  },
  {
    category: "General",
    question: "Do you renovate existing pools?",
    answer: "Yes! We're experts in pool renovation and remodeling. Popular renovation services include: Resurfacing (plaster, pebble, tile), Adding water features or lighting, Equipment upgrades for energy efficiency, Deck replacement or expansion, Adding a spa to existing pool, Safety upgrades (covers, fencing), Complete transformations with new design. Renovations typically cost $25,000-$75,000 and take 3-6 weeks. We'll assess your pool and provide renovation options that fit your budget."
  }
];

export default function FAQ() {
  useEffect(() => {
    // Add FAQ Schema
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    // Add or update schema script
    let script = document.getElementById('faq-schema') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'faq-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(faqSchema);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Group FAQs by category
  const faqsByCategory = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  const categoryIcons: Record<string, any> = {
    "Costs & Financing": DollarSign,
    "Timeline & Process": Calendar,
    "Permits & Regulations": Shield,
    "Maintenance & Warranty": Wrench,
    "Design & Visualization": HelpCircle,
    "Affiliate Program": Mail,
    "General": Phone
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead 
        title="Pool Builder FAQ | Common Questions About Pool Construction | Serenity Pools"
        description="Get answers to frequently asked questions about pool construction costs, timeline, financing, permits, and maintenance. Learn about our pool building process in North Georgia."
        keywords="pool construction FAQ, pool builder questions, pool costs Georgia, pool financing, pool construction timeline, pool permits, pool maintenance"
        pageType="faq"
      />
      
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-luxury-navy via-pool-crystal-blue to-luxury-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
            Everything you need to know about building your dream pool with Serenity Custom Pools
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-luxury-navy">{businessInfo.yearsExperience}+</div>
              <div className="text-sm text-gray-600">Years Experience</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-luxury-navy">{businessInfo.poolsBuilt}+</div>
              <div className="text-sm text-gray-600">Pools Built</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-luxury-navy">8-12</div>
              <div className="text-sm text-gray-600">Weeks Timeline</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-luxury-navy">100%</div>
              <div className="text-sm text-gray-600">Financing Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {Object.entries(faqsByCategory).map(([category, questions]) => {
            const Icon = categoryIcons[category] || HelpCircle;
            
            return (
              <Card key={category} className="mb-8">
                <CardHeader className="bg-gradient-to-r from-luxury-navy to-pool-crystal-blue text-white">
                  <CardTitle className="flex items-center text-2xl">
                    <Icon className="w-6 h-6 mr-3" />
                    {category}
                  </CardTitle>
                  <CardDescription className="text-gray-200">
                    {questions.length} questions about {category.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {questions.map((faq, index) => (
                      <AccordionItem key={index} value={`${category}-${index}`}>
                        <AccordionTrigger className="text-left hover:text-pool-crystal-blue">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}

          {/* Still Have Questions CTA */}
          <Card className="bg-gradient-to-r from-luxury-navy to-pool-crystal-blue text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Still Have Questions?</CardTitle>
              <CardDescription className="text-gray-200">
                Our pool experts are here to help with any questions about your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <a href={`tel:${businessInfo.phone}`}>
                  <Button size="lg" className="w-full bg-white text-luxury-navy hover:bg-gray-100">
                    <Phone className="w-4 h-4 mr-2" />
                    Call {businessInfo.phone}
                  </Button>
                </a>
                <Link href="/#contact">
                  <Button size="lg" variant="outline" className="w-full text-white border-white hover:bg-white/20">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </Link>
              </div>
              <div className="mt-6 flex items-center justify-center text-sm">
                <Clock className="w-4 h-4 mr-2" />
                <span>Response within 24 hours • Monday-Friday 8am-6pm</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}