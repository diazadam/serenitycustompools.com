import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, User, Phone, Mail, DollarSign, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertAppointmentSchema } from "@shared/schema";

// Available time slots
const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
];

// Budget ranges
const BUDGET_RANGES = [
  "Under $50,000",
  "$50,000 - $100,000", 
  "$100,000 - $200,000",
  "$200,000 - $500,000",
  "Over $500,000",
  "I need guidance"
];

const appointmentFormSchema = insertAppointmentSchema.extend({
  appointmentDate: z.string().min(1, "Please select a date"),
  appointmentTime: z.string().min(1, "Please select a time"),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the privacy policy and terms of service",
  }),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

interface AppointmentSchedulerProps {
  onSuccess?: () => void;
  leadId?: string;
  affiliateId?: string;
  source: string;
  defaultEmail?: string;
  defaultPhone?: string;
  defaultFirstName?: string;
  defaultLastName?: string;
}

export function AppointmentScheduler({ 
  onSuccess, 
  leadId, 
  affiliateId, 
  source,
  defaultEmail = "",
  defaultPhone = "",
  defaultFirstName = "",
  defaultLastName = ""
}: AppointmentSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>(TIME_SLOTS);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      email: defaultEmail,
      phone: defaultPhone,
      appointmentType: "consultation",
      projectType: "pool_installation",
      estimatedBudget: "",
      notes: "",
      source,
      leadId: leadId || undefined,
      affiliateId: affiliateId || undefined,
      privacyConsent: false,
    },
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      // Combine date and time into a single timestamp
      const [date] = data.appointmentDate.split('T');
      const timeStr = data.appointmentTime;
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      
      const appointmentDateTime = new Date(`${date}T${hour24.toString().padStart(2, '0')}:${minutes}:00`);
      
      const { appointmentTime, ...appointmentData } = {
        ...data,
        appointmentDate: appointmentDateTime.toISOString(),
      };
      
      return apiRequest("POST", "/api/appointments", appointmentData);
    },
    onSuccess: () => {
      toast({
        title: "Appointment Scheduled! ✅",
        description: "Ronald Jones will contact you soon to confirm your luxury pool consultation.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to schedule appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate next 30 days as available dates (excluding weekends for business hours)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  const availableDates = getAvailableDates();

  const onSubmit = (data: AppointmentFormData) => {
    bookAppointmentMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-[#B8860B]/20">
      <CardHeader className="text-center bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Calendar className="w-6 h-6" />
          Schedule Your Luxury Pool Consultation
        </CardTitle>
        <p className="text-blue-100 text-sm">
          Book your free consultation with Ronald Jones - 30+ years of luxury pool expertise
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="appointment-form">
          
          {/* Personal Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                First Name *
              </Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                data-testid="input-first-name"
                className="border-gray-300"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                data-testid="input-last-name"
                className="border-gray-300"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                data-testid="input-email"
                className="border-gray-300"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone *
              </Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                data-testid="input-phone"
                className="border-gray-300"
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Preferred Date *
              </Label>
              <Select onValueChange={(value) => {
                setSelectedDate(value);
                form.setValue("appointmentDate", value);
              }}>
                <SelectTrigger data-testid="select-date">
                  <SelectValue placeholder="Select a date" />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => {
                    const dateObj = new Date(date);
                    const formatted = dateObj.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    });
                    return (
                      <SelectItem key={date} value={date}>
                        {formatted}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {form.formState.errors.appointmentDate && (
                <p className="text-sm text-red-600">{form.formState.errors.appointmentDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Preferred Time *
              </Label>
              <Select onValueChange={(value) => form.setValue("appointmentTime", value)}>
                <SelectTrigger data-testid="select-time">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.appointmentTime && (
                <p className="text-sm text-red-600">{form.formState.errors.appointmentTime.message}</p>
              )}
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Project Type
              </Label>
              <Select onValueChange={(value) => form.setValue("projectType", value)} defaultValue="pool_installation">
                <SelectTrigger data-testid="select-project-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pool_installation">New Pool Installation</SelectItem>
                  <SelectItem value="renovation">Pool Renovation</SelectItem>
                  <SelectItem value="repair">Pool Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Estimated Budget
              </Label>
              <Select onValueChange={(value) => form.setValue("estimatedBudget", value)}>
                <SelectTrigger data-testid="select-budget">
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Tell us about your vision, specific requirements, or questions..."
                className="border-gray-300 min-h-[100px]"
                data-testid="textarea-notes"
              />
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacyConsent"
              checked={form.watch("privacyConsent")}
              onCheckedChange={(checked) => 
                form.setValue("privacyConsent", checked === true)
              }
              className="mt-1"
              data-testid="checkbox-privacy"
            />
            <div className="space-y-1">
              <Label htmlFor="privacyConsent" className="text-sm">
                I agree to the{" "}
                <Link href="/privacy-policy" className="text-primary hover:underline" target="_blank">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/terms-of-service" className="text-primary hover:underline" target="_blank">
                  Terms of Service
                </Link>
              </Label>
              {form.formState.errors.privacyConsent && (
                <p className="text-sm text-destructive">{form.formState.errors.privacyConsent.message}</p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white font-semibold py-3 text-lg"
            disabled={bookAppointmentMutation.isPending}
            data-testid="button-schedule"
          >
            {bookAppointmentMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Scheduling...
              </div>
            ) : (
              <>
                <Calendar className="w-5 h-5 mr-2" />
                Schedule My Consultation
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">What to Expect:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Free 60-minute consultation with Ronald Jones</li>
            <li>• Site evaluation and design recommendations</li>
            <li>• Detailed project timeline and investment options</li>
            <li>• 3D renderings and pool visualization (when applicable)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}