import { useSearch, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookingSuccessPage() {
  const search = useSearch({ strict: false });
  // You would normally use the job_id to look up the customer info, 
  // but for the prototype we'll just show the success state.
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-slate-500 mb-6">Your deposit has been securely paid. A FieldFlow technician will be assigned to your repair shortly.</p>
        
        <div className="bg-blue-50 text-blue-900 p-4 rounded-xl text-sm border border-blue-100 mb-4">
          <p className="font-semibold mb-2">Want updates on Telegram?</p>
          <p className="mb-3">To receive real-time notifications about your repair status, you must start our bot!</p>
          <Button asChild variant="default" className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white">
            <a href="https://t.me/FieldFlowApp_bot" target="_blank" rel="noreferrer">
              Click here to Start the Bot
            </a>
          </Button>
        </div>
        
        <Button variant="outline" className="w-full" asChild>
          <Link to="/">Book Another Repair</Link>
        </Button>
      </div>
    </main>
  );
}
