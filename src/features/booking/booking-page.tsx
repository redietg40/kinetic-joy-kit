import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, CheckCircle2, ShieldCheck, Lock } from "lucide-react";
import { API_BASE_URL } from "@/api/client";

const bookingSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(9, "Phone number is required"),
  national_id: z.string().min(4, "National ID / Fayda / Kebele ID is required for verification"),
  address: z.string().min(5, "Address is required"),
  landmark: z.string().min(3, "Nearest landmark or building is required"),
  telegram_username: z.string().optional(),
  title: z.string().min(3, "Service title is required"),
  description: z.string().optional(),
});

type BookingData = z.infer<typeof bookingSchema>;

export function BookingPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<BookingData>({
    resolver: zodResolver(bookingSchema),
  });

  const onSubmit = async (data: BookingData) => {
    try {
      setError("");
      const res = await fetch(`${API_BASE_URL}/api/book/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, service_type: "General" })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to submit request.");
      
      // Redirect to the Chapa checkout URL
      if (resData.checkout_url) {
        window.location.href = resData.checkout_url;
      } else {
        setSubmitted(true);
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    const hasTelegram = !!form.getValues().telegram_username;
    
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Request Verified & Sent!</h2>
          <p className="text-slate-500 mb-6">We've securely logged your service request. A verified technician will review and schedule your repair shortly.</p>
          
          {hasTelegram && (
            <div className="bg-blue-50 text-blue-900 p-4 rounded-xl text-sm border border-blue-100 mb-4">
              <p className="font-semibold mb-2">Want updates on Telegram?</p>
              <p className="mb-3">To receive real-time notifications about your repair status, you must start our bot!</p>
              <Button asChild variant="default" className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white">
                <a href="https://t.me/FieldFlowApp_bot" target="_blank" rel="noreferrer">
                  Click here to Start the Bot
                </a>
              </Button>
            </div>
          )}
          
          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
            Book Another Repair
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Book a Service</h1>
          <p className="text-slate-500 text-sm mt-1">Fill out the details below. Our verified technicians will come to you.</p>
        </div>

        {/* Security & Digital Paper Trail Guarantee Banner */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3.5 text-xs flex items-start gap-2.5 mb-5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800">Verified & Secure Booking Guarantee</p>
            <p className="text-emerald-700 mt-0.5 leading-relaxed">
              For technician and homeowner safety, every request logs a verified <strong>National ID / Fayda</strong> number and a bank-verified Chapa digital deposit.
            </p>
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-5">{error}</div>}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input className="mt-1" placeholder="Abebe Kebede" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" className="mt-1" placeholder="abebe@example.com" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1" placeholder="+251 911 000000" {...form.register("phone")} />
              {form.formState.errors.phone && <p className="text-xs text-red-500 mt-1">{form.formState.errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>National ID / Fayda / Kebele ID</Label>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Safety Check
              </span>
            </div>
            <Input className="mt-1" placeholder="e.g. FAN-123456 or Kebele ID" {...form.register("national_id")} />
            {form.formState.errors.national_id && <p className="text-xs text-red-500 mt-1">{form.formState.errors.national_id.message}</p>}
          </div>
          
          <div>
            <Label>Telegram Username (Optional)</Label>
            <Input className="mt-1" placeholder="@username" {...form.register("telegram_username")} />
          </div>

          <div>
            <Label>Home / Service Address</Label>
            <Input className="mt-1" placeholder="Bole Sub-City, Woreda 03, House 450" {...form.register("address")} />
            {form.formState.errors.address && <p className="text-xs text-red-500 mt-1">{form.formState.errors.address.message}</p>}
          </div>

          <div>
            <Label>Nearest Landmark / Building Description</Label>
            <Input className="mt-1" placeholder="Near Edna Mall, behind Medhanialem Church" {...form.register("landmark")} />
            {form.formState.errors.landmark && <p className="text-xs text-red-500 mt-1">{form.formState.errors.landmark.message}</p>}
          </div>

          <div>
            <Label>What needs fixing? (Short Title)</Label>
            <Input className="mt-1" placeholder="e.g. Broken AC Unit or Leaking Pipe" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>}
          </div>

          <div>
            <Label>Detailed Description</Label>
            <Textarea className="mt-1" placeholder="Please describe the issue in detail..." rows={2} {...form.register("description")} />
          </div>

          <Button size="lg" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Verifying & Submitting..." : "Verify & Continue to Secure Booking"}
          </Button>
        </form>
      </div>
    </main>
  );
}
