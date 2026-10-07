import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Wrench } from "lucide-react";
import { login } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
type LoginData = z.infer<typeof loginSchema>;

export function TechnicianLoginPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const loginForm = useForm<LoginData>({ 
    resolver: zodResolver(loginSchema), 
    defaultValues: { email: "", password: "" } 
  });

  const onLogin = async (data: LoginData) => {
    try {
      setError("");
      await login(data.email, data.password);
      void navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in. Please check your credentials.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background aesthetics */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.3)]"
          >
            <Wrench className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Technician Portal</h1>
          <p className="text-slate-400">Log in to view your assigned jobs and announce updates.</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={loginForm.handleSubmit(onLogin)} className="grid gap-6">
            <div>
              <Label className="text-slate-300">Email address</Label>
              <Input 
                type="email" 
                className="mt-1.5 transition-all focus:ring-2 focus:ring-primary/50 text-white bg-slate-950/50 border-slate-700 placeholder:text-slate-500 h-12" 
                placeholder="your.email@example.com"
                {...loginForm.register("email")} 
              />
              {loginForm.formState.errors.email && <small className="text-red-400 mt-1 block">Enter a valid email.</small>}
            </div>

            <div>
              <Label className="text-slate-300">Password</Label>
              <div className="mt-1.5 relative">
                <Input 
                  type={show ? "text" : "password"} 
                  className="transition-all focus:ring-2 focus:ring-primary/50 text-white bg-slate-950/50 border-slate-700 placeholder:text-slate-500 h-12 pr-10" 
                  placeholder="Enter the password provided by your owner"
                  {...loginForm.register("password")} 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1 h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-800" 
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </Button>
              </div>
              {loginForm.formState.errors.password && <small className="text-red-400 mt-1 block">Password is required.</small>}
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-4">
              <Button size="lg" className="w-full h-12 text-base font-semibold shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all" disabled={loginForm.formState.isSubmitting}>
                {loginForm.formState.isSubmitting ? "Authenticating..." : <>Access Portal <ArrowRight className="w-5 h-5 ml-2" /></>}
              </Button>
            </motion.div>
          </form>
        </div>
        
        <p className="text-center text-slate-500 text-sm mt-8">
          Need an account? Please contact your Business Owner to be added.
        </p>
      </motion.div>
    </main>
  );
}
