import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/status-badge";
import { friendlyDate, money } from "@/lib/format";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, MapPin, Receipt, Wrench, Plus, CalendarClock, User, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { API_BASE_URL } from "@/api/client";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

export function CustomerPortal({ initialTab = "book" }: { initialTab?: "book" | "track" }) {
  const { t, language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState<"book" | "track">(initialTab);
  const [emailInput, setEmailInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [customer, setCustomer] = useState<any>(null);
  const [customerJobs, setCustomerJobs] = useState<any[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const bookingForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      national_id: "",
      address: "",
      landmark: "",
      service_type: "HVAC",
      title: "",
      description: "",
      telegram_username: ""
    }
  });

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = emailInput.trim();
    if (!query) return;

    setLookingUp(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/customer-portal/lookup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: query })
      });

      if (!res.ok) {
        setCustomer(null);
        setErrorMessage("No existing record found for this email. If you are a new client, please submit a service request below!");
        // Pre-fill booking form email
        bookingForm.setValue("email", query);
        return;
      }

      const data = await res.json();
      setCustomer(data.customer);
      setCustomerJobs(data.jobs || []);
      setCustomerInvoices(data.invoices || []);
      toast.success(`Welcome back, ${data.customer.name}!`);
    } catch {
      setErrorMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLookingUp(false);
    }
  };

  const handleBookService = async (formData: any) => {
    setBookingSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/book/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || customer?.name,
          email: formData.email || customer?.email,
          phone: formData.phone || customer?.phone || "",
          national_id: formData.national_id || "",
          address: formData.address || customer?.address || "",
          landmark: formData.landmark || "",
          telegram_username: formData.telegram_username || customer?.telegram_username || "",
          title: formData.title,
          description: formData.description || "",
          service_type: formData.service_type || "General"
        })
      });

      if (!res.ok) {
        let errorMsg = "Could not submit booking request.";
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch {}
        toast.error(errorMsg);
        return;
      }

      const resData = await res.json();
      if (resData.checkout_url) {
        toast.success("Request received! Redirecting to Chapa checkout...");
        const cleanUrl = resData.checkout_url.replace(/^https?:\/\/localhost(:\d+)?/, "");
        window.location.href = cleanUrl;
      } else {
        toast.success("Service request submitted successfully!");
        setBookingOpen(false);
        // Reload portal view for this email
        setEmailInput(formData.email || customer?.email);
        void handleLookup({ preventDefault: () => {} } as any);
      }
    } catch {
      toast.error("Could not submit request. Please try again.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 overflow-hidden relative">
      {/* Top-Right Language Switcher */}
      <div className="absolute top-4 right-6 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-lg border border-white/20 shadow-sm">
        <button
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
          onClick={() => setLanguage('en')}
        >
          EN
        </button>
        <button
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'am' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
          onClick={() => setLanguage('am')}
        >
          አማ
        </button>
      </div>

      <div className="absolute top-0 left-0 w-full h-[400px] bg-slate-900 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-20 pb-12">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-black/5">
            <Wrench className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Customer Portal</h1>
          <p className="text-slate-300 text-lg">Track your service requests, view repair updates, and manage invoices.</p>
        </motion.div>

        {!customer ? (
          <div>
            {/* Unified Switcher Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/60 inline-flex gap-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("book")}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                    activeTab === "book"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <Wrench className="w-4 h-4" /> Book a Service
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("track")}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                    activeTab === "track"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <CalendarClock className="w-4 h-4" /> Track My Repairs
                </button>
              </div>
            </div>

            {activeTab === "book" ? (
              <motion.div
                className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-2xl border border-slate-100"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {/* Security Guarantee Banner */}
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs flex items-start gap-3 mb-6">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-800 text-sm">Verified & Secure Booking (Digital Paper Trail)</p>
                    <p className="text-emerald-700 mt-0.5 leading-relaxed">
                      For homeowner and technician safety, all requests require a verified <strong>National ID / Fayda</strong> number and a bank-verified Chapa digital deposit.
                    </p>
                  </div>
                </div>

                <form onSubmit={bookingForm.handleSubmit(handleBookService)} className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Your Full Name *</Label>
                    <Input {...bookingForm.register("name", { required: true })} placeholder="e.g. Dawit Bekele" className="mt-1" required />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Email Address *</Label>
                      <Input type="email" {...bookingForm.register("email", { required: true })} placeholder="you@example.com" className="mt-1" required />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Phone Number *</Label>
                      <Input {...bookingForm.register("phone", { required: true })} placeholder="+251 911 000000" className="mt-1" required />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-slate-700">National ID / Fayda / Kebele ID *</Label>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Identity Verified
                      </span>
                    </div>
                    <Input {...bookingForm.register("national_id", { required: true })} placeholder="e.g. FAN-123456 or Kebele ID" className="mt-1" required />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Service Address *</Label>
                      <Input {...bookingForm.register("address", { required: true })} placeholder="Bole Sub-City, House 123" className="mt-1" required />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Nearest Landmark *</Label>
                      <Input {...bookingForm.register("landmark", { required: true })} placeholder="Behind Edna Mall, Building B" className="mt-1" required />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Service Specialty</Label>
                    <select
                      {...bookingForm.register("service_type")}
                      className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white mt-1"
                    >
                      <option value="HVAC">HVAC (Heating & Cooling)</option>
                      <option value="Plumbing">Plumbing & Water</option>
                      <option value="Electrical">Electrical & Power</option>
                      <option value="General">General Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Issue Summary *</Label>
                    <Input {...bookingForm.register("title", { required: true })} placeholder="e.g. AC unit leaking, Pipe repair" className="mt-1" required />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Detailed Description</Label>
                    <Textarea {...bookingForm.register("description")} placeholder="Describe what happened..." rows={2} className="mt-1" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-slate-700">Telegram Username (Optional)</Label>
                      <a
                        href="https://t.me/FieldFlowApp_bot"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Start Bot @FieldFlowApp_bot ↗
                      </a>
                    </div>
                    <Input {...bookingForm.register("telegram_username")} placeholder="@username for live alerts" className="mt-1" />
                  </div>

                  <Button type="submit" size="lg" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium" disabled={bookingSubmitting}>
                    {bookingSubmitting ? "Verifying & Submitting..." : "Verify & Proceed to Chapa Deposit (150 ETB)"}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-2xl border border-slate-100"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <form onSubmit={handleLookup} className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Enter your client email address</Label>
                    <Input
                      type="email"
                      required
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="e.g. client@example.com"
                      className="mt-2 h-12 text-base"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full text-base bg-blue-600 hover:bg-blue-700 text-white" disabled={lookingUp}>
                    {lookingUp ? "Searching..." : "View My Portal"} <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>

                {errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs leading-relaxed text-center">
                    {errorMessage}
                  </div>
                )}

                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                  <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-slate-400 font-semibold">need a repair?</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setActiveTab("book")}
                  className="w-full border-emerald-600/30 text-emerald-700 hover:bg-emerald-50"
                >
                  <Wrench className="w-4 h-4 mr-2" /> Book a New Service
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header profile card */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-primary tracking-wider">Client Profile</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">Welcome back, {customer.name}!</h2>
                <p className="text-slate-500 text-sm mt-0.5">{customer.address || "Addis Ababa"} · {customer.phone || customer.email}</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 flex-1 sm:flex-none">
                      <Plus className="w-4 h-4 mr-2" /> Book Another Job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Request Service</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={bookingForm.handleSubmit(handleBookService)} className="space-y-4 pt-3">
                      <div>
                        <Label>Service Title</Label>
                        <Input {...bookingForm.register("title", { required: true })} placeholder="e.g. Water heater repair" required />
                      </div>
                      <div>
                        <Label>Specialty</Label>
                        <select
                          {...bookingForm.register("service_type")}
                          className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white mt-1"
                        >
                          <option value="HVAC">HVAC</option>
                          <option value="Plumbing">Plumbing</option>
                          <option value="Electrical">Electrical</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                      <div>
                        <Label>Details</Label>
                        <Textarea {...bookingForm.register("description")} placeholder="Describe the problem..." rows={3} />
                      </div>
                      <Button type="submit" className="w-full" disabled={bookingSubmitting}>
                        {bookingSubmitting ? "Submitting..." : "Submit Request (150 ETB Deposit)"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={() => { setCustomer(null); setEmailInput(""); }}>
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Jobs & Invoices Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Jobs Column */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" /> Your Service Requests ({customerJobs.length})
                </h3>
                {customerJobs.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
                    <CalendarClock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    You have no active repair requests on file.
                  </div>
                ) : (
                  customerJobs.map(job => (
                    <motion.div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <strong className="block text-lg font-semibold">{job.title}</strong>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5" /> {job.address || customer.address}
                          </span>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl mb-3 text-sm">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Scheduled Date</span>
                        <p className="font-medium">{job.scheduled_at ? friendlyDate(job.scheduled_at) : "Pending Scheduling"}</p>
                      </div>

                      {job.technician_notes && (
                        <div className="bg-blue-50 text-blue-900 p-3 rounded-xl border border-blue-100 flex gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider block mb-0.5">Technician Update</span>
                            <p className="text-xs">{job.technician_notes}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </section>

              {/* Invoices Column */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-500" /> Your Invoices ({customerInvoices.length})
                </h3>
                {customerInvoices.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    You have no invoices on file.
                  </div>
                ) : (
                  customerInvoices.map(invoice => (
                    <motion.div key={invoice.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <strong className="block text-lg">Invoice #{invoice.id.split("-")[0]}</strong>
                          <span className="text-xs text-slate-500">Issued: {friendlyDate(invoice.issued_at)}</span>
                        </div>
                        <StatusBadge status={invoice.status} />
                      </div>

                      <div className="flex justify-between items-end mt-5 pt-3 border-t border-slate-100">
                        <strong className="text-2xl font-bold">{money(invoice.total)}</strong>
                        {invoice.status !== "paid" && (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Pay via Chapa</Button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </section>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
