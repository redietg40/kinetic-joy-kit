import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/status-badge";
import { friendlyDate, money } from "@/lib/format";
import { motion } from "framer-motion";
import { 
  CheckCircle2, ChevronRight, MapPin, Receipt, Wrench, Plus, 
  CalendarClock, User, ArrowRight, ShieldCheck, Lock, Send, 
  KeyRound, Smartphone, Mail, RefreshCw, ExternalLink 
} from "lucide-react";
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
  const [matchingProfiles, setMatchingProfiles] = useState<any[]>([]);
  const [customerJobs, setCustomerJobs] = useState<any[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);

  // 2-Step National ID / Fayda (FAN) OTP Verification
  const [verifyIdOpen, setVerifyIdOpen] = useState(false);
  const [verifyStep, setVerifyStep] = useState<"enter_id" | "enter_otp">("enter_id");
  const [nationalIdInput, setNationalIdInput] = useState("");
  const [idType, setIdType] = useState("National ID (Fayda)");
  const [telegramUsernameInput, setTelegramUsernameInput] = useState("");
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [otpSentInfo, setOtpSentInfo] = useState<{
    masked_email?: string;
    telegram_sent?: boolean;
    email_sent?: boolean;
    message?: string;
    telegram_username?: string;
  } | null>(null);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
    setMatchingProfiles([]);

    try {
      const res = await fetch(`${API_BASE_URL}/api/customer-portal/lookup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query, email: query, phone: query, name: query })
      });

      if (!res.ok) {
        setCustomer(null);
        setMatchingProfiles([]);
        setErrorMessage("No existing record found for this Name, Phone number, Telegram username, or National ID. If you are a new client, please submit a service request below!");
        // Pre-fill booking form based on format
        if (query.includes("@")) {
          if (query.startsWith("@")) {
            bookingForm.setValue("telegram_username", query);
          } else {
            bookingForm.setValue("email", query);
          }
        } else if (/^\+?\d+$/.test(query)) {
          bookingForm.setValue("phone", query);
        } else {
          bookingForm.setValue("name", query);
        }
        return;
      }

      const data = await res.json();
      if (data.multiple && data.profiles && data.profiles.length > 1) {
        setMatchingProfiles(data.profiles);
        setCustomer(null);
        toast.info(`Found ${data.profiles.length} profiles linked to this contact. Please select yours.`);
        return;
      }

      setMatchingProfiles([]);
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

  const handleSelectProfile = async (profileId: string) => {
    setLookingUp(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/customer-portal/lookup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: profileId })
      });

      if (!res.ok) {
        toast.error("Could not load selected profile. Please try again.");
        return;
      }

      const data = await res.json();
      setMatchingProfiles([]);
      setCustomer(data.customer);
      setCustomerJobs(data.jobs || []);
      setCustomerInvoices(data.invoices || []);
      toast.success(`Welcome back, ${data.customer.name}!`);
    } catch {
      toast.error("Unable to load profile. Please try again.");
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
        // Reload portal view for this specific customer
        if (resData.customer_id) {
          void handleSelectProfile(resData.customer_id);
        } else {
          setEmailInput(formData.name || formData.phone || formData.email || customer?.name || "");
          void handleLookup({ preventDefault: () => {} } as any);
        }
      }
    } catch {
      toast.error("Could not submit request. Please try again.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleOpenVerifyModal = () => {
    setNationalIdInput(customer?.national_id || "");
    setTelegramUsernameInput(customer?.telegram_username || "");
    setVerifyStep("enter_id");
    setOtpCodeInput("");
    setOtpSentInfo(null);
    setVerifyIdOpen(true);
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const idVal = nationalIdInput.trim();
    if (!idVal || !customer?.id) {
      toast.error("Please enter a valid National ID / Fayda number.");
      return;
    }

    setRequestingOtp(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customer-portal/request-id-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          national_id: idVal,
          id_type: idType,
          telegram_username: telegramUsernameInput.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      setOtpSentInfo(data);
      setVerifyStep("enter_otp");
      setResendCooldown(60);

      if (telegramUsernameInput.trim()) {
        setCustomer((prev: any) => ({ ...prev, telegram_username: telegramUsernameInput.trim() }));
      }

      toast.success(data.message || "Verification code sent to your Telegram and Email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeVal = otpCodeInput.trim();
    if (!codeVal || codeVal.length < 6 || !customer?.id) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customer-portal/verify-id-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          otp_code: codeVal
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Incorrect or expired verification code.");
      }

      setCustomer((prev: any) => ({
        ...prev,
        national_id: data.national_id || nationalIdInput.trim()
      }));
      setVerifyIdOpen(false);
      toast.success(`🎉 ${idType} verified successfully! A confirmation message has been sent to your Telegram.`);
    } catch (err: any) {
      toast.error(err.message || "Verification failed. Please check the code and try again.");
    } finally {
      setVerifyingOtp(false);
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
                      <Label className="text-sm font-semibold text-slate-700">Phone Number *</Label>
                      <Input {...bookingForm.register("phone", { required: true })} placeholder="+251 911 000000" className="mt-1" required />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Email Address (Optional)</Label>
                      <Input type="email" {...bookingForm.register("email")} placeholder="you@example.com (optional)" className="mt-1" />
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
                    <Label className="text-sm font-semibold text-slate-700">Lookup by Full Name, Phone, Telegram, National ID, or Email</Label>
                    <Input
                      type="text"
                      required
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="e.g. Nardos Tilaye, 0911..., @telegram, FAN-..."
                      className="mt-2 h-12 text-base"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full text-base bg-blue-600 hover:bg-blue-700 text-white" disabled={lookingUp}>
                    {lookingUp ? "Searching..." : "View My Portal"} <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>

                {matchingProfiles.length > 0 && (
                  <div className="mt-6 space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">
                        Select Your Account ({matchingProfiles.length} found)
                      </h3>
                      <button
                        type="button"
                        onClick={() => setMatchingProfiles([])}
                        className="text-xs text-slate-500 hover:text-slate-800 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Multiple client profiles match your lookup. Click your name to open your portal:
                    </p>
                    <div className="space-y-2 pt-1">
                      {matchingProfiles.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProfile(p.id)}
                          className="p-3 bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 group-hover:text-blue-700 text-sm">
                                {p.name}
                              </span>
                              {p.national_id && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-medium">
                                  ID: {p.national_id}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {p.address ? `${p.address} · ` : ""}{p.phone || p.email || "No contact"} · {p.jobs_count} job{p.jobs_count === 1 ? "" : "s"}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="h-8 text-xs border-blue-200 text-blue-700 bg-white group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            Open <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                
                {/* National ID Status & Verification Action */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {customer.national_id ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Verified ID: {customer.national_id}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOpenVerifyModal}
                        className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        Update / Re-verify
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        <Lock className="w-3 h-3 text-amber-600" />
                        National ID Not Verified
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOpenVerifyModal}
                        className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                      >
                        Verify National ID Now
                      </Button>
                    </div>
                  )}

                  {/* 2-Step OTP Verification Modal */}
                  <Dialog open={verifyIdOpen} onOpenChange={setVerifyIdOpen}>
                    <DialogContent className="max-w-md sm:max-w-lg p-6">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                          {verifyStep === "enter_id" ? (
                            <>
                              <ShieldCheck className="w-5 h-5 text-emerald-600" />
                              Verify National ID / Fayda (FAN)
                            </>
                          ) : (
                            <>
                              <KeyRound className="w-5 h-5 text-blue-600" />
                              Enter 6-Digit Verification Code
                            </>
                          )}
                        </DialogTitle>
                      </DialogHeader>

                      {verifyStep === "enter_id" ? (
                        <form onSubmit={handleRequestOtp} className="space-y-4 pt-2">
                          <div className="p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-100 text-xs text-slate-700 leading-relaxed space-y-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                              <span>🇪🇹 Ethiopian Security & Verification:</span>
                            </div>
                            <p>
                              To make verification convenient for Ethiopian users, your 6-digit verification code will be sent to <strong>both Telegram (@FieldFlowApp_bot) and your Email</strong>.
                            </p>
                          </div>

                          <div>
                            <Label className="text-sm font-semibold text-slate-700">Select Document Type</Label>
                            <select
                              value={idType}
                              onChange={(e) => setIdType(e.target.value)}
                              className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm bg-white mt-1"
                            >
                              <option value="National ID (Fayda)">Ethiopian National ID (Fayda - FAN)</option>
                              <option value="Kebele ID">Resident / Kebele ID</option>
                              <option value="Passport">Ethiopian Passport</option>
                              <option value="Driver's License">Driver's License</option>
                            </select>
                          </div>

                          <div>
                            <Label className="text-sm font-semibold text-slate-700">{idType} Number *</Label>
                            <Input
                              required
                              value={nationalIdInput}
                              onChange={(e) => setNationalIdInput(e.target.value)}
                              placeholder={idType === "National ID (Fayda)" ? "e.g. 3563270542984314 or FAN-..." : "Enter ID number"}
                              className="mt-1 font-mono text-base"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold text-slate-700">Telegram Username / Chat ID</Label>
                              <a
                                href="https://t.me/FieldFlowApp_bot"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                Start @FieldFlowApp_bot <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <Input
                              value={telegramUsernameInput}
                              onChange={(e) => setTelegramUsernameInput(e.target.value)}
                              placeholder="@username or numeric chat ID"
                              className="mt-1"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                              Start our bot once so Telegram can instantly deliver your security codes and repair updates.
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                              Primary Code Delivery: Telegram (@FieldFlowApp_bot)
                            </div>
                            {customer?.email ? (
                              <p className="text-slate-500 font-mono text-[11px]">
                                Also sending a copy to: {customer.email}
                              </p>
                            ) : (
                              <p className="text-slate-500 text-[11px]">
                                No email linked — code will be delivered instantly to Telegram.
                              </p>
                            )}
                          </div>

                          <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11"
                            disabled={requestingOtp}
                          >
                            {requestingOtp ? (
                              <span className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Code...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Send className="w-4 h-4" /> Send Verification Code {customer?.email ? "(Telegram & Email)" : "(via Telegram)"}
                              </span>
                            )}
                          </Button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
                          <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-950 space-y-2">
                            <p className="font-semibold text-sm text-blue-900">Verification code dispatched!</p>
                            <div className="space-y-1 text-slate-700 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>
                                  <strong>Telegram:</strong> Check <strong>@FieldFlowApp_bot</strong>
                                  {otpSentInfo?.telegram_username ? ` (@${otpSentInfo.telegram_username.replace('@','')})` : ""}
                                </span>
                              </div>
                              {(otpSentInfo?.masked_email || customer?.email) && (
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                                  <span>
                                    <strong>Email:</strong> Check inbox at <strong>{otpSentInfo?.masked_email || customer?.email}</strong>
                                  </span>
                                </div>
                              )}
                            </div>
                            <a
                              href="https://t.me/FieldFlowApp_bot"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline pt-1"
                            >
                              Open @FieldFlowApp_bot in Telegram <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          <div>
                            <Label className="text-sm font-semibold text-slate-700 block text-center mb-1.5">
                              Enter 6-Digit Code
                            </Label>
                            <Input
                              autoFocus
                              maxLength={6}
                              value={otpCodeInput}
                              onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ""))}
                              placeholder="······"
                              className="h-14 text-center font-mono text-2xl tracking-[0.5em] font-bold border-2 border-slate-300 focus:border-blue-500 rounded-xl"
                            />
                            <p className="text-[11px] text-slate-500 text-center mt-1">
                              Valid for 15 minutes. Enter the exact 6 digits from Telegram or Email.
                            </p>
                          </div>

                          <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-11"
                            disabled={verifyingOtp || otpCodeInput.length < 6}
                          >
                            {verifyingOtp ? (
                              <span className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Code...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Confirm & Verify {idType}
                              </span>
                            )}
                          </Button>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setVerifyStep("enter_id")}
                              className="text-xs text-slate-500 hover:text-slate-800"
                            >
                              ← Change ID or Details
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRequestOtp()}
                              disabled={resendCooldown > 0 || requestingOtp}
                              className="text-xs text-blue-600 hover:text-blue-800 disabled:text-slate-400"
                            >
                              {resendCooldown > 0 ? (
                                `Resend in ${resendCooldown}s`
                              ) : (
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3" /> Resend Code
                                </span>
                              )}
                            </Button>
                          </div>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
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
                <Button variant="outline" onClick={() => { setCustomer(null); setEmailInput(""); setMatchingProfiles([]); }}>
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

                      {/* Security Verification & Chapa Deposit Status */}
                      <div className="bg-slate-50 p-3 rounded-xl mb-3 text-xs space-y-1.5 border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">🛡️ Identity Verification:</span>
                          <span className={customer.national_id ? "text-emerald-700 font-semibold" : "text-amber-700 font-medium"}>
                            {customer.national_id ? `Verified (${customer.national_id})` : "Pending ID Submission"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">💳 Chapa Deposit (150 ETB):</span>
                          {job.booking_fee_paid ? (
                            <span className="text-emerald-700 font-semibold">✓ Paid & Verified</span>
                          ) : (
                            <a
                              href={`/chapa-checkout?job_id=${job.id}&amount=150`}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px]"
                            >
                              Pay 150 ETB Deposit
                            </a>
                          )}
                        </div>
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
