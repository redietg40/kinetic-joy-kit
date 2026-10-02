import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/api/client";

const bookingSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  address: z.string().min(5),
  title: z.string().min(3),
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
      if (!res.ok) throw new Error("Failed to submit request.");
      setSubmitted(true);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Request Sent!</h2>
          <p className="text-slate-500">We've received your service request. A technician will contact you shortly.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Book a Service</h1>
          <p className="text-slate-500 text-sm mt-1">Fill out the details below and we'll send a professional your way.</p>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-6">{error}</div>}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Label>Full Name
            <Input className="mt-1" placeholder="John Doe" {...form.register("name")} />
          </Label>
          
          <div className="grid grid-cols-2 gap-4">
            <Label>Email
              <Input type="email" className="mt-1" placeholder="john@example.com" {...form.register("email")} />
            </Label>
            <Label>Phone
              <Input className="mt-1" placeholder="+251 900 0000" {...form.register("phone")} />
            </Label>
          </div>

          <Label>Address
            <Input className="mt-1" placeholder="123 Bole Road, Addis Ababa" {...form.register("address")} />
          </Label>

          <Label>What needs fixing? (Short Title)
            <Input className="mt-1" placeholder="e.g. Broken AC Unit" {...form.register("title")} />
          </Label>

          <Label>Detailed Description
            <Textarea className="mt-1" placeholder="Please describe the issue in detail..." rows={3} {...form.register("description")} />
          </Label>

          <Button size="lg" className="w-full mt-4" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </div>
    </main>
  );
}
