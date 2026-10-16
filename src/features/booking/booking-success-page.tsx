import { useSearch, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookingSuccessPage() {
  const search = useSearch({ strict: false });
  const jobId = (search as any)?.job_id;
  const botUrl = jobId
    ? `https://t.me/FieldFlowApp_bot?start=${jobId}`
    : "https://t.me/FieldFlowApp_bot";
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-slate-500 mb-6">Your deposit has been securely paid. A FieldFlow technician will be assigned to your repair shortly.</p>
        
        <div className="bg-blue-50 text-blue-900 p-5 rounded-2xl text-sm border border-blue-100 mb-6 text-left">
          <p className="font-semibold text-base mb-1 text-center text-blue-950">Want updates on Telegram?</p>
          <p className="mb-4 text-xs text-center text-blue-800">
            To receive instant notifications and invoices about your repair, start our bot:
          </p>
          <Button asChild variant="default" className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white shadow-sm mb-3">
            <a href={botUrl} target="_blank" rel="noreferrer">
              Click here to Start the Bot
            </a>
          </Button>
          <div className="text-[11px] text-blue-700/80 bg-blue-100/50 p-2.5 rounded-lg space-y-1">
            <p className="font-medium text-blue-900">ℹ️ Testing Note:</p>
            <p>
              This button opens Telegram on <strong>this specific computer</strong> (where your current Telegram session is logged in).
            </p>
            <p>
              To connect another customer's Telegram account (e.g. <strong>@GenzigAddis</strong>), that person should open <strong>@FieldFlowApp_bot</strong> on their own phone or Telegram account and tap <strong>Start</strong>.
            </p>
          </div>
        </div>
        
        <Button variant="outline" className="w-full" asChild>
          <Link to="/">Book Another Repair</Link>
        </Button>
      </div>
    </main>
  );
}
