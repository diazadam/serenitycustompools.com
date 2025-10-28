import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "How much does a custom pool cost in North Georgia?",
    answer: "Custom pool construction in North Georgia typically ranges from $150,000 to $250,000+ depending on size, features, and site conditions. Luxury infinity pools with spas, outdoor kitchens, and premium finishes can range higher. We provide detailed estimates after our free consultation and site evaluation."
  },
  {
    question: "How long does pool construction take in Dawsonville and Lake Lanier area?",
    answer: "Most custom pool projects in the North Georgia mountains take 8-12 weeks from excavation to completion. Timeline depends on pool size, features, soil conditions, and permitting. We handle all permits for Dawsonville, Cumming, Gainesville, and surrounding areas to ensure smooth project progression."
  },
  {
    question: "Do you build infinity pools around Lake Lanier?",
    answer: "Yes! We specialize in custom infinity pools that maximize Lake Lanier views and complement lakefront properties. Our team understands the unique challenges of building near the lake and works with all necessary permits and environmental requirements."
  },
  {
    question: "What pool construction services do you offer in North Georgia?",
    answer: "We provide complete pool construction services including custom gunite pools, infinity edge pools, luxury spa installation, pool renovation, outdoor kitchens, fire features, and complete landscape integration. All services include design, permitting, construction, and ongoing support."
  },
  {
    question: "Are you licensed pool contractors in Georgia?",
    answer: "Yes, we are fully licensed, bonded, and insured pool contractors in Georgia. We hold all necessary licenses for pool construction in Forsyth County, Hall County, Dawson County, and surrounding North Georgia counties. All work is guaranteed and warranty-backed."
  },
  {
    question: "Do you work with HOAs in luxury communities around Atlanta?",
    answer: "Absolutely! We have extensive experience working with HOA requirements in luxury communities throughout North Georgia and Atlanta metro. We handle all architectural review submissions, coordinate with HOA boards, and ensure designs meet community standards."
  },
  {
    question: "What makes your pool construction different from other builders?",
    answer: "Our 15+ years of North Georgia experience, luxury focus, and complete project management set us apart. We specialize in high-end custom pools, use only premium materials, and provide white-glove service from design through completion. Every project includes 3D design visualization and smart pool technology."
  },
  {
    question: "Do you offer pool financing options?",
    answer: "Yes, we offer various financing options for qualified customers including pool loans and payment plans. We work with several lenders who specialize in luxury pool construction financing to help make your dream pool project affordable."
  }
];

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="py-20 bg-luxury-gray">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-luxury-navy mb-6" data-testid="faq-title">
            Pool Construction FAQ
          </h2>
          <p className="text-xl text-gray-600" data-testid="faq-subtitle">
            Common questions about custom pool construction in North Georgia
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="bg-white shadow-lg">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  data-testid={`faq-question-${index}`}
                >
                  <h3 className="text-lg font-semibold text-luxury-navy pr-4">
                    {faq.question}
                  </h3>
                  {openItems.includes(index) ? (
                    <ChevronUp className="w-5 h-5 text-luxury-gold flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-luxury-gold flex-shrink-0" />
                  )}
                </button>
                
                {openItems.includes(index) && (
                  <div className="px-6 pb-6" data-testid={`faq-answer-${index}`}>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Still have questions about pool construction in North Georgia?
          </p>
          <button 
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-luxury-gold text-white px-8 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
            data-testid="faq-contact-button"
          >
            Get Your Free Consultation
          </button>
        </div>
      </div>
    </section>
  );
}