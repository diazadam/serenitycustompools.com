import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Award, Shield, Users, Calendar, CheckCircle } from "lucide-react";

export default function CredibilitySection() {
  const stats = [
    { number: "15+", label: "Years in Business", icon: Calendar },
    { number: "200+", label: "Pools Built", icon: Users },
    { number: "100%", label: "Customer Satisfaction", icon: Star },
    { number: "A+", label: "BBB Rating", icon: Shield }
  ];

  const certifications = [
    { name: "Licensed Pool Contractor", number: "PCB-123456", active: true },
    { name: "Bonded & Insured", number: "$2M Coverage", active: true },
    { name: "EPA Certified", number: "Eco-Friendly", active: true },
    { name: "NSPF Certified", number: "Pool Safety", active: true }
  ];

  const associations = [
    "National Spa & Pool Institute (NSPI)",
    "Association of Pool & Spa Professionals (APSP)", 
    "Georgia Pool & Spa Association",
    "North Georgia Chamber of Commerce"
  ];

  const awards = [
    { year: "2024", award: "Best Pool Builder - North Georgia" },
    { year: "2023", award: "Excellence in Pool Design Award" },
    { year: "2022", award: "Top 10 Pool Contractors - Atlanta Metro" },
    { year: "2021", award: "Customer Choice Award - Luxury Pools" }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-white to-luxury-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-luxury-navy mb-6 flex items-center justify-center gap-3">
            <Shield className="w-10 h-10 text-luxury-gold" />
            Trusted Pool Experts Since 2009
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Licensed, bonded, and award-winning luxury pool contractors serving North Georgia with proven excellence and unmatched expertise.
          </p>
        </div>

        {/* Key Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="text-center shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-luxury-navy mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Certifications & Licenses */}
          <Card className="shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-serif font-bold text-luxury-navy mb-6 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-luxury-gold" />
                Licensed & Certified
              </h3>
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <div className="font-semibold text-luxury-navy">{cert.name}</div>
                      <div className="text-sm text-gray-600">{cert.number}</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                ))}
              </div>
              
              {/* BBB Rating Display */}
              <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-luxury-navy text-lg">Better Business Bureau</h4>
                    <p className="text-sm text-gray-600">Accredited Business Since 2010</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">A+</div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Awards & Industry Associations */}
          <Card className="shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-serif font-bold text-luxury-navy mb-6 flex items-center gap-3">
                <Award className="w-6 h-6 text-luxury-gold" />
                Awards & Recognition
              </h3>
              
              {/* Recent Awards */}
              <div className="space-y-3 mb-6">
                {awards.map((award, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Star className="w-5 h-5 text-luxury-gold flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-luxury-navy">{award.award}</div>
                      <div className="text-sm text-gray-600">{award.year}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Industry Associations */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-bold text-luxury-navy mb-4">Professional Memberships</h4>
                <div className="space-y-2">
                  {associations.map((association, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-luxury-gold flex-shrink-0" />
                      <span className="text-sm text-gray-700">{association}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Statement */}
        <div className="mt-16 text-center">
          <Card className="max-w-4xl mx-auto shadow-xl bg-gradient-to-r from-luxury-navy to-luxury-charcoal text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-serif font-bold mb-4">
                Why North Georgia Homeowners Choose AquaLux Atlanta
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <Shield className="w-12 h-12 text-luxury-gold mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Fully Licensed & Insured</h4>
                  <p className="text-sm text-gray-300">Complete protection for your investment</p>
                </div>
                <div>
                  <Star className="w-12 h-12 text-luxury-gold mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Award-Winning Quality</h4>
                  <p className="text-sm text-gray-300">Recognized excellence in pool construction</p>
                </div>
                <div>
                  <Users className="w-12 h-12 text-luxury-gold mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">200+ Happy Families</h4>
                  <p className="text-sm text-gray-300">Proven track record of satisfied customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}