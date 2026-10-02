import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Wrench, User } from "lucide-react";
import { login, register } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
const signupSchema = z.object({ 
  name: z.string().min(2),
  email: z.string().email(), 
  password: z.string().min(6),
  role: z.literal("technician")
});

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function LoginPage({ expired }: { expired?: boolean | undefined }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  // 3D Parallax logic for the left side
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const loginForm = useForm<LoginData>({ 
    resolver: zodResolver(loginSchema), 
    defaultValues: { email: "tech@fieldflow.et", password: "password" } 
  });

  const signupForm = useForm<SignupData>({ 
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "technician" }
  });

  const onLogin = async (data: LoginData) => {
    try {
      setError("");
      await login(data.email, data.password);
      void navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in");
    }
  };

  const onSignup = async (data: SignupData) => {
    try {
      setError("");
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role
      });
      void navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign up");
    }
  };

  return (
    <main className="login-page overflow-hidden">
      {/* LEFT SIDE: Animated Branding with Parallax */}
      <motion.section 
        className="login-brand relative bg-slate-950 text-white"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: 1000, color: 'white' }}
      >
        {/* Animated 3D Background Image Layer */}
        <motion.div 
          className="absolute inset-[-10%] z-0 bg-cover bg-center opacity-80"
          style={{ 
            backgroundImage: 'url(/login-bg.png)',
            x: useTransform(mouseX, [-0.5, 0.5], [30, -30]),
            y: useTransform(mouseY, [-0.5, 0.5], [30, -30]),
            scale: 1.05
          }}
        />
        
        {/* Gradient overlay to ensure text readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-slate-950/40 pointer-events-none" />

        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          animate="show"
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative z-10 w-full h-full flex flex-col"
        >
          <motion.div variants={fadeUp} className="brand-lockup" style={{ transform: "translateZ(40px)" }}>
            <span className="brand-icon brand-icon-lg"><Wrench/></span>
            <span><strong>FieldFlow</strong><small>Direct connection, no middleman</small></span>
          </motion.div>
          
          <div className="login-statement">
            <motion.p variants={fadeUp} style={{ transform: "translateZ(30px)" }}>THE DIRECT SERVICE PLATFORM</motion.p>
            <h1 style={{ transformStyle: "preserve-3d" }}>
              <motion.span variants={fadeUp} className="block" style={{ transform: "translateZ(60px)" }}>Your skills.</motion.span>
              <motion.span variants={fadeUp} className="block" style={{ transform: "translateZ(70px)" }}>Your rules.</motion.span>
              <motion.em variants={fadeUp} className="block text-orange-500" style={{ transform: "translateZ(90px)" }}>In flow.</motion.em>
            </h1>
            <motion.span variants={fadeUp} style={{ transform: "translateZ(40px)" }}>
              FieldFlow connects customers directly with certified technicians. No admins. No dispatchers. Just direct service.
            </motion.span>
          </div>
        </motion.div>
        
        {/* Abstract animated background elements */}
        <div className="login-depth absolute inset-0 pointer-events-none" aria-hidden="true">
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} />
          <motion.span animate={{ rotate: -360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} />
          <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      </motion.section>

      {/* RIGHT SIDE: Animated Login / Signup Form */}
      <section className="login-form-wrap flex items-center justify-center p-8 bg-white/50 backdrop-blur-xl">
        <motion.div 
          className="login-form w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100"
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
        >
          <motion.p className="eyebrow" variants={fadeUp} initial="hidden" animate="show">JOIN FIELDFLOW</motion.p>
          <motion.h2 variants={fadeUp} initial="hidden" animate="show">Welcome</motion.h2>
          <motion.p className="text-sm text-muted-foreground mb-6" variants={fadeUp} initial="hidden" animate="show">Sign up or log in to continue.</motion.p>

          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6 relative">
            {/* Animated Tab Background Indicator */}
            <motion.div 
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white rounded-lg shadow-sm"
              animate={{ left: isLogin ? "50%" : "0.375rem" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <button 
              type="button" 
              className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${!isLogin ? "text-primary" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
            <button 
              type="button" 
              className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${isLogin ? "text-primary" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setIsLogin(true)}
            >
              Log In
            </button>
          </div>

          {expired && <div className="session-alert mb-4">Your session expired. Sign in again to continue.</div>}
          {error && <div className="error-alert mb-4">{error}</div>}

          {!isLogin ? (
            /* SIGNUP FORM */
            <motion.form 
              key="signup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={signupForm.handleSubmit(onSignup)} 
              className="grid gap-4"
            >
              <div className="grid grid-cols-1 gap-2 mb-2">
                <motion.button 
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="py-3 border border-primary bg-primary/5 text-primary rounded-xl text-sm font-bold flex flex-col items-center gap-1 cursor-default shadow-sm"
                >
                  <Wrench className="w-5 h-5 mb-1" />
                  Service Professional
                </motion.button>
              </div>

              <Label>Full Name
                <Input type="text" className="mt-1 transition-all focus:ring-2 focus:ring-primary/20" {...signupForm.register("name")} />
              </Label>
              {signupForm.formState.errors.name && <small className="text-destructive">Name is required.</small>}

              <Label>Email address
                <Input type="email" className="mt-1 transition-all focus:ring-2 focus:ring-primary/20" {...signupForm.register("email")} />
              </Label>
              {signupForm.formState.errors.email && <small className="text-destructive">Valid email required.</small>}

              <Label>Password
                <div className="password-field mt-1 relative">
                  <Input type={show ? "text" : "password"} className="transition-all focus:ring-2 focus:ring-primary/20" {...signupForm.register("password")} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8 text-slate-400 hover:text-primary" onClick={() => setShow(!show)}>
                    {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </Button>
                </div>
              </Label>
              {signupForm.formState.errors.password && <small className="text-destructive">Min 6 characters.</small>}

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} className="mt-2">
                <Button size="lg" className="w-full shadow-lg shadow-primary/20" disabled={signupForm.formState.isSubmitting}>
                  {signupForm.formState.isSubmitting ? "Creating..." : <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </motion.div>
            </motion.form>
          ) : (
            /* LOGIN FORM */
            <motion.form 
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={loginForm.handleSubmit(onLogin)} 
              className="grid gap-4"
            >
              <Label>Email address
                <Input type="email" className="mt-1 transition-all focus:ring-2 focus:ring-primary/20" {...loginForm.register("email")} />
              </Label>
              {loginForm.formState.errors.email && <small className="text-destructive">Enter a valid email.</small>}

              <Label>Password
                <div className="password-field mt-1 relative">
                  <Input type={show ? "text" : "password"} className="transition-all focus:ring-2 focus:ring-primary/20" {...loginForm.register("password")} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8 text-slate-400 hover:text-primary" onClick={() => setShow(!show)}>
                    {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </Button>
                </div>
              </Label>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} className="mt-2">
                <Button size="lg" className="w-full shadow-lg shadow-primary/20" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting ? "Signing in..." : <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </motion.div>
            </motion.form>
          )}
        </motion.div>
      </section>
    </main>
  );
}
