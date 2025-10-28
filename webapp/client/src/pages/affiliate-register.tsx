import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign, Users, Star, TrendingUp } from "lucide-react";

const affiliateSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  company: z.string().optional(),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  paymentMethod: z.enum(["paypal", "venmo", "zelle", "check"], {
    required_error: "Please select a payment method",
  }),
  paymentDetails: z.string().min(1, "Payment details are required"),
  experience: z.string().min(10, "Please describe your experience (minimum 10 characters)"),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the privacy policy and terms of service",
  }),
});

type AffiliateFormData = z.infer<typeof affiliateSchema>;

export default function AffiliateRegister() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<AffiliateFormData>({
    resolver: zodResolver(affiliateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      website: "",
      paymentDetails: "",
      experience: "",
      privacyConsent: false,
    },
  });

  const registerAffiliate = useMutation({
    mutationFn: async (data: AffiliateFormData) => {
      return apiRequest("POST", "/api/affiliates/register", data);
    },
    onSuccess: (response) => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you within 24 hours.",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AffiliateFormData) => {
    registerAffiliate.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-luxury-navy to-luxury-charcoal text-white flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto bg-white/10 border-white/20 text-white">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Application Submitted!</CardTitle>
            <CardDescription className="text-gray-300">
              Thank you for your interest in our affiliate program.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-300">
              We'll review your application and send you login credentials within 24 hours.
            </p>
            <Link href="/">
              <Button className="bg-luxury-gold hover:bg-yellow-600 text-white">
                Return to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-navy to-luxury-charcoal text-white">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-serif font-bold">Serenity Custom Pools LLC</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            Join Our Elite Affiliate Program
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Earn substantial commissions by referring clients to North Georgia's premier luxury pool builder.
          </p>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white/10 border-white/20 text-white text-center">
              <CardContent className="p-6">
                <DollarSign className="w-12 h-12 text-luxury-gold mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">Up to $15,000</h3>
                <p className="text-sm text-gray-300">Per Qualified Referral</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white text-center">
              <CardContent className="p-6">
                <TrendingUp className="w-12 h-12 text-luxury-gold mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">Tiered System</h3>
                <p className="text-sm text-gray-300">Higher Commissions</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white text-center">
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-luxury-gold mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">Marketing Support</h3>
                <p className="text-sm text-gray-300">Professional Materials</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white text-center">
              <CardContent className="p-6">
                <Star className="w-12 h-12 text-luxury-gold mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">Monthly Payouts</h3>
                <p className="text-sm text-gray-300">Reliable Payments</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Registration Form */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Apply to Become an Affiliate</CardTitle>
            <CardDescription className="text-gray-300 text-center">
              Complete the form below to start earning with Serenity Custom Pools LLC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="affiliate-register-form">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                            placeholder="John"
                            data-testid="input-first-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                            placeholder="Doe"
                            data-testid="input-last-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                            placeholder="john@example.com"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                            placeholder="(770) 555-0123"
                            data-testid="input-phone"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                            placeholder="Your Business Name"
                            data-testid="input-company"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                            placeholder="https://yourwebsite.com"
                            data-testid="input-website"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Payment Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/20 border-white/30 text-white" data-testid="select-payment-method">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="venmo">Venmo</SelectItem>
                            <SelectItem value="zelle">Zelle</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Details *</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                            placeholder="Email, phone, or address"
                            data-testid="input-payment-details"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketing Experience & Why You'd Be a Great Affiliate *</FormLabel>
                      <FormControl>
                        <Textarea
                          className="bg-white/20 border-white/30 text-white placeholder-gray-300 min-h-[120px]"
                          placeholder="Tell us about your marketing experience, network, and why you'd be successful promoting luxury pools..."
                          data-testid="textarea-experience"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="privacyConsent"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                          data-testid="checkbox-privacy"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">
                          I agree to the{" "}
                          <Link href="/privacy-policy" className="text-luxury-gold hover:underline" target="_blank">
                            Privacy Policy
                          </Link>{" "}
                          and{" "}
                          <Link href="/terms-of-service" className="text-luxury-gold hover:underline" target="_blank">
                            Terms of Service
                          </Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={registerAffiliate.isPending}
                  className="w-full bg-luxury-gold hover:bg-yellow-600 text-white py-3 text-lg font-semibold"
                  data-testid="button-submit-application"
                >
                  {registerAffiliate.isPending ? "Submitting Application..." : "Submit Application"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Commission Structure */}
        <Card className="mt-12 bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Commission Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-800 text-white py-2 px-4 rounded-lg mb-4">
                  <h4 className="font-bold">Pool Partner</h4>
                  <p className="text-sm">Starting Level</p>
                </div>
                <p className="text-2xl font-bold text-luxury-gold mb-2">5%</p>
                <p className="text-sm text-gray-300">$3,750 - $7,500 per project</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-700 text-white py-2 px-4 rounded-lg mb-4">
                  <h4 className="font-bold">Elite Partner</h4>
                  <p className="text-sm">10+ Referrals or $50K Sales</p>
                </div>
                <p className="text-2xl font-bold text-luxury-gold mb-2">7%</p>
                <p className="text-sm text-gray-300">$5,250 - $10,500 per project</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-800 text-white py-2 px-4 rounded-lg mb-4">
                  <h4 className="font-bold">Platinum Partner</h4>
                  <p className="text-sm">25+ Referrals or $150K Sales</p>
                </div>
                <p className="text-2xl font-bold text-luxury-gold mb-2">10%</p>
                <p className="text-sm text-gray-300">$7,500 - $15,000 per project</p>
              </div>
            </div>
            <p className="text-center text-gray-300 mt-6">
              * Based on typical project values of $75,000 - $150,000. Commissions paid monthly after project completion.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}