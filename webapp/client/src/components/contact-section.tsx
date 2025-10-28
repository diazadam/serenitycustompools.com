import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  city: z.string().min(2, "Please enter your city"),
  budgetRange: z.string().min(1, "Please select a budget range"),
  message: z.string().min(10, "Please provide more details about your project"),
  affiliateId: z.string().optional(),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the privacy policy and terms of service",
  }),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactSection() {
  const { toast } = useToast();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      budgetRange: "",
      message: "",
      affiliateId: "",
      privacyConsent: false,
    },
  });

  // Auto-populate affiliate ID from localStorage if available
  useEffect(() => {
    const affiliateId = localStorage.getItem('affiliateReferralCode');
    if (affiliateId) {
      form.setValue('affiliateId', affiliateId);
    }
  }, [form]);

  const scheduleConsultation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return apiRequest("POST", "/api/leads", {
        ...data,
        source: "contact",
        projectType: "consultation",
      });
    },
    onSuccess: () => {
      toast({
        title: "Consultation Scheduled!",
        description: "We'll contact you within 24 hours to confirm your appointment.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: "Please try again or call us at 1 (678) 300-8949",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    scheduleConsultation.mutate(data);
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-r from-luxury-navy to-luxury-charcoal text-white scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-6" data-testid="contact-title">
          Ready to Transform Your Backyard?
        </h2>
        <p className="text-lg sm:text-xl mb-12 text-gray-300" data-testid="contact-subtitle">
          Schedule your complimentary design consultation today. Our team will visit your property and create a custom proposal for your dream outdoor space.
        </p>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h3 className="text-2xl font-serif font-semibold mb-6" data-testid="contact-included-title">
              What's Included:
            </h3>
            <ul className="space-y-3">
              {[
                "On-site property evaluation",
                "3D design visualization", 
                "Detailed project proposal",
                "Investment breakdown",
                "Timeline & planning"
              ].map((item, index) => (
                <li key={index} className="flex items-center" data-testid={`contact-included-${index}`}>
                  <svg className="w-5 h-5 text-luxury-gold mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8 border border-white/20">
            <h3 className="text-2xl font-serif font-semibold mb-6" data-testid="contact-form-title">
              Schedule Your Consultation
            </h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="contact-form">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="First Name"
                            className="px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                            data-testid="input-contact-first-name"
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
                        <FormControl>
                          <Input
                            placeholder="Last Name"
                            className="px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                            data-testid="input-contact-last-name"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Email Address"
                          className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                          data-testid="input-contact-email"
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
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Phone Number"
                          className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                          data-testid="input-contact-phone"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="City (Atlanta area)"
                          className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                          data-testid="input-contact-city"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="budgetRange"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger 
                            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                            data-testid="select-contact-budget"
                          >
                            <SelectValue placeholder="Project Budget Range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="50-100k">$50,000 - $100,000</SelectItem>
                          <SelectItem value="100-200k">$100,000 - $200,000</SelectItem>
                          <SelectItem value="200-300k">$200,000 - $300,000</SelectItem>
                          <SelectItem value="300k+">$300,000+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your dream project..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-luxury-gold resize-none"
                          data-testid="textarea-contact-message"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="affiliateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Affiliate Code (optional)"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-luxury-gold text-sm"
                          data-testid="input-contact-affiliate"
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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-white/30 data-[state=checked]:bg-luxury-gold data-[state=checked]:border-luxury-gold"
                          data-testid="checkbox-contact-privacy"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <label className="text-sm text-gray-300">
                          I agree to the{" "}
                          <Link href="/privacy-policy" className="text-luxury-gold hover:underline" target="_blank">
                            Privacy Policy
                          </Link>{" "}
                          and{" "}
                          <Link href="/terms-of-service" className="text-luxury-gold hover:underline" target="_blank">
                            Terms of Service
                          </Link>
                        </label>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  disabled={scheduleConsultation.isPending}
                  className="w-full bg-luxury-gold text-white py-4 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                  data-testid="button-schedule-consultation"
                >
                  {scheduleConsultation.isPending ? "Scheduling..." : "Schedule Free Consultation"}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-8 text-center">
          <div data-testid="contact-info-phone">
            <svg className="w-8 h-8 text-luxury-gold mb-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <h4 className="font-semibold mb-2">Call Us</h4>
            <p className="text-gray-300">1 (678) 300-8949</p>
          </div>
          <div data-testid="contact-info-email">
            <svg className="w-8 h-8 text-luxury-gold mb-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <h4 className="font-semibold mb-2">Email Us</h4>
            <p className="text-gray-300">info@serenitycustompools.com</p>
          </div>
          <div data-testid="contact-info-hours">
            <svg className="w-8 h-8 text-luxury-gold mb-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <h4 className="font-semibold mb-2">Hours</h4>
            <p className="text-gray-300">Mon-Sat: 8AM-6PM</p>
          </div>
        </div>
      </div>
    </section>
  );
}
