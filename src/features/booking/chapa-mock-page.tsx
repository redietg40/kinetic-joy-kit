import { useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, CreditCard, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/api/client";

export function ChapaMockPage() {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const jobId = search.job_id as string | undefined;
  const invoiceId = search.invoice_id as string | undefined;
  const amount = search.amount as string;

  const handlePay = async () => {
    setLoading(true);
    try {
      // Simulate calling the webhook
      const res = await fetch(`${API_BASE_URL}/api/webhooks/chapa/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, invoice_id: invoiceId })
      });
      if (!res.ok) throw new Error("Payment failed");
      
      setSuccess(true);
      setTimeout(() => {
        if (invoiceId) {
          navigate({ to: "/invoices" });
        } else {
          navigate({ to: "/booking-success", search: { job_id: jobId } });
        }
      }, 2000);
    } catch (e) {
      toast.error("Payment failed. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-green-100">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-slate-500">Redirecting you back to FieldFlow...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f4f7f6] p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#0C8C5E] text-white rounded-full mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Chapa Secure Checkout</h1>
          <p className="text-slate-500 text-sm mt-1">
            {invoiceId ? "Pay your invoice securely online." : "Pay your booking deposit to confirm your repair."}
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100 text-center">
          <p className="text-sm text-slate-500 mb-1">Total Due</p>
          <p className="text-4xl font-black text-[#0C8C5E]">{amount} ETB</p>
        </div>

        <div className="space-y-3 mb-6">
          <Button 
            className="w-full bg-[#E51B24] hover:bg-[#c9171f] text-white h-12 text-lg" 
            onClick={handlePay}
            disabled={loading}
          >
            <Smartphone className="mr-2" /> Pay with Telebirr
          </Button>
          <Button 
            className="w-full bg-[#401C64] hover:bg-[#2d1446] text-white h-12 text-lg" 
            onClick={handlePay}
            disabled={loading}
          >
            <CreditCard className="mr-2" /> Pay with CBE Birr
          </Button>
        </div>

        <p className="text-xs text-center text-slate-400">
          This is a simulated Chapa checkout page for FieldFlow testing.
        </p>
      </div>
    </main>
  );
}
