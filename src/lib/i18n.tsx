import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "am";

const translations = {
  en: {
    // Navigation
    Overview: "Overview",
    Jobs: "Jobs",
    Dispatch: "Dispatch",
    Customers: "Customers",
    Technicians: "Technicians",
    Invoices: "Invoices",
    Inventory: "Inventory",
    Reports: "Reports",
    Messages: "Messages",
    Settings: "Settings",

    // Settings Page
    "Settings Title": "Settings",
    "Settings Desc": "Manage company and account preferences.",
    "Company profile": "Company profile",
    "Company Desc": "Used on invoices and customer communication.",
    "Company name": "Company name",
    "Tax rate": "Tax rate (%)",
    "Invoice prefix": "Invoice prefix",
    "Business address": "Business address",
    "Save company": "Save company",
    "Your profile": "Your profile",
    "Profile Desc": "Personal information for this workspace.",
    "Full name": "Full name",
    "Email": "Email",
    "Role": "Role",
    "Update profile": "Update profile",
    "Language Settings": "Language Settings",
    "Language Desc": "Choose the platform language for your interface.",
    "Select Language": "Select Language",
    "Save Language": "Save Language",
    
    // Customer Portal (Examples)
    "Book Repair": "Book a Repair",
    "Service Type": "Service Type",
    "Phone Number": "Phone Number",
    "Submit": "Submit Request",
    "Directory Title": "Trusted Professionals,",
    "Directory Subtitle": "At Your Service",
    "Directory Desc": "Welcome to FieldFlow, your premium hub for connecting with certified HVAC, Plumbing, and Electrical experts.",
    "Meet Techs": "Meet Our Top Technicians",
    "Techs Desc": "Browse our roster of highly skilled and customer-approved service professionals ready to solve your problems.",
    "Request Service": "Request Service",

    // Jobs Page
    "Jobs Title": "Jobs",
    "Jobs Desc": "Schedule, assign, and track every service call.",
    "Dispatch board": "Dispatch board",
    "New job": "New job",
    "Search jobs": "Search jobs, addresses or IDs",
    "All statuses": "All statuses",
    "All services": "All services",
    "Job": "Job",
    "Customer": "Customer",
    "Service": "Service",
    "Schedule": "Schedule",
    "Technician": "Technician",
    "Status": "Status",
    "Priority": "Priority",
    "Unassigned": "Unassigned",
    "Previous": "Previous",
    "Next": "Next",
    "Showing": "Showing",

    // Statuses
    "in_progress": "In progress",
    "off_duty": "Off duty",
    "on_job": "On job",
    "scheduled": "Scheduled",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "available": "Available",
    "draft": "Draft",
    "sent": "Sent",
    "paid": "Paid",
    "overdue": "Overdue",
    "urgent": "Urgent",
    "normal": "Normal",
    "low": "Low",
    "awaiting_payment": "Awaiting Payment",
    "pending": "Pending"
  },
  am: {
    // Navigation (Amharic Translations)
    Overview: "አጠቃላይ እይታ",
    Jobs: "ስራዎች",
    Dispatch: "ስምሪት",
    Customers: "ደንበኞች",
    Technicians: "ባለሙያዎች",
    Invoices: "ክፍያዎች",
    Inventory: "ዕቃዎች",
    Reports: "ሪፖርቶች",
    Messages: "መልዕክቶች",
    Settings: "ቅንብሮች",

    // Settings Page
    "Settings Title": "ቅንብሮች",
    "Settings Desc": "የድርጅትዎን እና የመለያዎን ምርጫዎች ያስተዳድሩ።",
    "Company profile": "የድርጅት መገለጫ",
    "Company Desc": "ለክፍያዎች እና ከደንበኞች ጋር ለመገናኘት ያገለግላል።",
    "Company name": "የድርጅት ስም",
    "Tax rate": "የግብር መጠን (%)",
    "Invoice prefix": "የክፍያ ቅድመ-ቅጥያ",
    "Business address": "የንግድ አድራሻ",
    "Save company": "ድርጅቱን አስቀምጥ",
    "Your profile": "የእርስዎ መገለጫ",
    "Profile Desc": "ለዚህ የስራ ቦታ የግል መረጃ።",
    "Full name": "ሙሉ ስም",
    "Email": "ኢሜይል",
    "Role": "ሚና",
    "Update profile": "መገለጫ አዘምን",
    "Language Settings": "የቋንቋ ቅንብሮች",
    "Language Desc": "ለገፅዎ የቋንቋ ምርጫዎን ይምረጡ።",
    "Select Language": "ቋንቋ ይምረጡ",
    "Save Language": "ቋንቋ አስቀምጥ",

    // Customer Portal
    "Book Repair": "ጥገና ይመዝገቡ",
    "Service Type": "የአገልግሎት ዓይነት",
    "Phone Number": "ስልክ ቁጥር",
    "Submit": "ጥያቄውን ላክ",
    "Directory Title": "ታማኝ ባለሙያዎች፣",
    "Directory Subtitle": "እርስዎን ለማገልገል ዝግጁ",
    "Directory Desc": "ወደ ፊልድ ፍሎው እንኳን በደህና መጡ! ከተመሰከረላቸው የኤሌክትሪክ፣ የውሃ እና አየር ማቀዝቀዣ ባለሙያዎች ጋር ለመገናኘት ትክክለኛው ቦታ።",
    "Meet Techs": "ምርጥ ባለሙያዎቻችንን ያግኙ",
    "Techs Desc": "ችግርዎን ለመፍታት ዝግጁ የሆኑትን ከፍተኛ ልምድ ያላቸውን እና በደንበኞች የተመሰገኑ ባለሙያዎችን ይመልከቱ።",
    "Request Service": "አገልግሎት ይጠይቁ",

    // Jobs Page
    "Jobs Title": "ስራዎች",
    "Jobs Desc": "እያንዳንዱን የአገልግሎት ጥሪ ይመድቡ፣ ያስተካክሉ እና ይከታተሉ።",
    "Dispatch board": "የስምሪት ሰሌዳ",
    "New job": "አዲስ ስራ",
    "Search jobs": "ስራዎችን፣ አድራሻዎችን ወይም መለያዎችን ይፈልጉ",
    "All statuses": "ሁሉም ሁኔታዎች",
    "All services": "ሁሉም አገልግሎቶች",
    "Job": "ስራ",
    "Customer": "ደንበኛ",
    "Service": "አገልግሎት",
    "Schedule": "የጊዜ ሰሌዳ",
    "Technician": "ባለሙያ",
    "Status": "ሁኔታ",
    "Priority": "ቅድሚያ",
    "Unassigned": "ያልተመደበ",
    "Previous": "ቀዳሚ",
    "Next": "ቀጣይ",
    "Showing": "እያሳየ ያለው",

    // Statuses
    "in_progress": "በሂደት ላይ",
    "off_duty": "ከስራ ውጪ",
    "on_job": "ስራ ላይ",
    "scheduled": "ቀጠሮ የተያዘለት",
    "completed": "ተጠናቋል",
    "cancelled": "ተሰርዟል",
    "available": "ዝግጁ",
    "draft": "ረቂቅ",
    "sent": "ተልኳል",
    "paid": "ተከፍሏል",
    "overdue": "ጊዜው ያለፈበት",
    "urgent": "አስቸኳይ",
    "normal": "መደበኛ",
    "low": "ዝቅተኛ",
    "awaiting_payment": "ክፍያ በመጠባበቅ ላይ",
    "pending": "በመጠባበቅ ላይ"
  }
};

import { getSession } from "@/api/auth";

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>("en");
  
  useEffect(() => {
    const user = getSession();
    const storageKey = user ? `app_lang_${user.id}` : "app_lang_guest";
    const saved = localStorage.getItem(storageKey) as Language;
    if (saved && (saved === "en" || saved === "am")) {
      setLang(saved);
    } else {
      // Default fallback
      setLang("en");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    const user = getSession();
    const storageKey = user ? `app_lang_${user.id}` : "app_lang_guest";
    setLang(lang);
    localStorage.setItem(storageKey, lang);
  };

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useTranslation must be used within I18nProvider");
  return context;
}
