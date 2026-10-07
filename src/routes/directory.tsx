import { createFileRoute } from '@tanstack/react-router';
import { Shield, Wrench, Clock, Star, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';

export const Route = createFileRoute('/directory')({
  component: DirectoryPage,
});

const technicians = [
  {
    id: 1,
    name: "Dawit Alemu",
    role: "Master HVAC Technician",
    rating: 4.9,
    reviews: 124,
    skills: ["AC Repair", "Heating Systems", "Ventilation"],
    image: "https://i.pravatar.cc/150?img=11",
    status: "Available"
  },
  {
    id: 2,
    name: "Hana Girma",
    role: "Licensed Plumber",
    rating: 5.0,
    reviews: 89,
    skills: ["Pipe Leak", "Water Heater", "Drain Cleaning"],
    image: "https://i.pravatar.cc/150?img=5",
    status: "On a Job"
  },
  {
    id: 3,
    name: "Samuel Kebede",
    role: "Electrical Engineer",
    rating: 4.8,
    reviews: 210,
    skills: ["Panel Upgrade", "Wiring", "Safety Inspection"],
    image: "https://i.pravatar.cc/150?img=12",
    status: "Available"
  },
  {
    id: 4,
    name: "Meron Tadesse",
    role: "HVAC Specialist",
    rating: 4.7,
    reviews: 56,
    skills: ["Maintenance", "Duct Cleaning", "Freon Refill"],
    image: "https://i.pravatar.cc/150?img=9",
    status: "Available"
  },
  {
    id: 5,
    name: "Nahom Fekadu",
    role: "Emergency Plumber",
    rating: 4.9,
    reviews: 312,
    skills: ["Blocked Drains", "Burst Pipes", "Flood Rescue"],
    image: "https://i.pravatar.cc/150?img=14",
    status: "On a Job"
  }
];

function DirectoryPage() {
  const [mounted, setMounted] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-500 selection:text-white relative">
      {/* Language Switcher for Customer */}
      <div className="absolute top-4 right-6 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-lg border border-white/20 shadow-sm">
        <button 
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setLanguage('en')}
        >
          EN
        </button>
        <button 
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'am' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setLanguage('am')}
        >
          አማ
        </button>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 20px 5px rgba(59, 130, 246, 0.1); }
        }
        .reveal {
          opacity: 0;
          animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        
        /* 3D Card Effect */
        .card-3d-wrapper {
          perspective: 1000px;
        }
        .card-3d {
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
          transform-style: preserve-3d;
        }
        .card-3d:hover {
          transform: translateY(-10px) rotateX(4deg) rotateY(-4deg);
          box-shadow: -15px 15px 30px -5px rgba(0,0,0,0.1), 0 0 20px rgba(59, 130, 246, 0.1);
        }
      `}} />

      {/* Hero / Background Info Section */}
      <section className="bg-slate-950 text-white py-24 px-6 relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-[pulseGlow_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[120%] bg-purple-600/20 blur-[100px] rounded-full mix-blend-screen animate-[pulseGlow_8s_ease-in-out_infinite_reverse]" />
        
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h1 className={`text-6xl md:text-7xl font-extrabold mb-6 tracking-tight ${mounted ? 'reveal' : 'opacity-0'}`}>
            {t("Directory Title")}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              {t("Directory Subtitle")}
            </span>
          </h1>
          <p className={`text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed ${mounted ? 'reveal delay-100' : 'opacity-0'}`}>
            {t("Directory Desc")}
          </p>
          
          <div className={`flex flex-wrap justify-center gap-6 ${mounted ? 'reveal delay-200' : 'opacity-0'}`}>
            {[
              { icon: Shield, text: "Verified Experts", color: "text-emerald-400" },
              { icon: Clock, text: "24/7 Fast Dispatch", color: "text-blue-400" },
              { icon: Wrench, text: "Quality Guaranteed", color: "text-purple-400" }
            ].map((item, i) => (
              <div key={i} className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 transition-all duration-300 hover:scale-105 hover:border-white/20 cursor-default" style={{ animation: `float ${4 + i}s ease-in-out infinite` }}>
                <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                <span className="font-medium tracking-wide">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technician Directory List */}
      <section className="py-24 px-6 max-w-6xl mx-auto relative">
        <div className={`mb-16 text-center ${mounted ? 'reveal delay-300' : 'opacity-0'}`}>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">{t("Meet Techs")}</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">{t("Techs Desc")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 card-3d-wrapper">
          {technicians.map((tech, idx) => (
            <div 
              key={tech.id} 
              className={`bg-white rounded-3xl p-8 shadow-sm border border-slate-100 card-3d group ${mounted ? 'reveal' : 'opacity-0'}`}
              style={{ animationDelay: `${300 + (idx * 100)}ms` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-inner group-hover:border-blue-50 transition-colors duration-300">
                    <img src={tech.image} alt={tech.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  {/* Status Indicator Micro-interaction */}
                  <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${tech.status === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                       {tech.status === 'Available' && <div className="w-full h-full rounded-full animate-ping bg-emerald-400 opacity-75" />}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 bg-amber-50/80 backdrop-blur-sm text-amber-700 px-3 py-1.5 rounded-xl text-sm font-bold border border-amber-100/50">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {tech.rating}
                  <span className="text-amber-900/40 font-medium ml-1">({tech.reviews})</span>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{tech.name}</h3>
              <p className="text-slate-500 font-medium text-sm mb-6">{tech.role}</p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {tech.skills.map(skill => (
                  <span key={skill} className="bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-100 transition-colors">
                    {skill}
                  </span>
                ))}
              </div>
              
              <button className="w-full bg-slate-900 hover:bg-blue-600 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-slate-900/20 hover:shadow-blue-600/30 flex items-center justify-center gap-2 group/btn">
                {t("Request Service")}
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
