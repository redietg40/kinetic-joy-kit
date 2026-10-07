import { Building2, Save, UserRound, Bell, KeySquare, Palette } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSession } from "@/api/auth";
import { useTranslation } from "@/lib/i18n";

export function SettingsPage() {
  const user = getSession();
  const { t, language, setLanguage } = useTranslation();

  return (
    <AppShell title={t("Settings Title")} description={t("Settings Desc")}>
      <div className="page-enter grid gap-6 xl:grid-cols-2">
        {/* Language Settings */}
        <form className="panel settings-form">
          <div className="settings-heading">
            <Building2 />
            <div>
              <h2>{t("Language Settings")}</h2>
              <p>{t("Language Desc")}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("Select Language")}</Label>
            <select 
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "am")}
            >
              <option value="en">English (US)</option>
              <option value="am">አማርኛ (Amharic)</option>
            </select>
          </div>
        </form>

        {/* Company Settings */}
        <form className="panel settings-form" onSubmit={e => { e.preventDefault(); toast.success("Company settings saved"); }}>
          <div className="settings-heading">
            <Building2 />
            <div>
              <h2>{t("Company profile")}</h2>
              <p>{t("Company Desc")}</p>
            </div>
          </div>
          <Label>{t("Company name")}
            <Input defaultValue="FieldFlow Services" />
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <Label>{t("Tax rate")}
              <Input type="number" defaultValue="15" />
            </Label>
            <Label>{t("Invoice prefix")}
              <Input defaultValue="INV" />
            </Label>
          </div>
          <Label>{t("Business address")}
            <Input defaultValue="Bole Road, Addis Ababa" />
          </Label>
          <Button><Save />{t("Save company")}</Button>
        </form>

        {/* Profile Settings */}
        <form className="panel settings-form" onSubmit={e => { e.preventDefault(); toast.success("Profile updated"); }}>
          <div className="settings-heading">
            <UserRound />
            <div>
              <h2>{t("Your profile")}</h2>
              <p>{t("Profile Desc")}</p>
            </div>
          </div>
          <Label>{t("Full name")}
            <Input defaultValue={user?.name || "User"} />
          </Label>
          <Label>{t("Email")}
            <Input type="email" defaultValue={user?.email || "email@example.com"} />
          </Label>
          <Label>{t("Role")}
            <Input defaultValue={user?.role || "Owner"} disabled />
          </Label>
          <Button><Save />{t("Update profile")}</Button>
        </form>

        {/* API Integrations */}
        <form className="panel settings-form" onSubmit={e => { e.preventDefault(); toast.success("Integrations updated"); }}>
          <div className="settings-heading">
            <KeySquare />
            <div>
              <h2>Integrations & API</h2>
              <p>Configure Chapa payments and Telegram bot.</p>
            </div>
          </div>
          <Label>Chapa Secret Key
            <Input type="password" defaultValue="CHASECK_TEST-XXXXXXXXXXXXXXXX" />
          </Label>
          <Label>Telegram Bot Token
            <Input type="password" defaultValue="123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ" />
          </Label>
          <Button><Save />Save Integrations</Button>
        </form>

        {/* Notifications */}
        <form className="panel settings-form" onSubmit={e => { e.preventDefault(); toast.success("Notification preferences saved"); }}>
          <div className="settings-heading">
            <Bell />
            <div>
              <h2>Notifications</h2>
              <p>Choose what events you want to be alerted about.</p>
            </div>
          </div>
          <div className="space-y-4 py-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-700 bg-slate-900" />
              <span className="text-sm font-medium">Email me when a customer pays an invoice</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-700 bg-slate-900" />
              <span className="text-sm font-medium">Alert me on new technician announcements</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-700 bg-slate-900" />
              <span className="text-sm font-medium">Send weekly revenue summary</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-700 bg-slate-900" />
              <span className="text-sm font-medium">Low inventory restock alerts</span>
            </label>
          </div>
          <Button><Save />Save Preferences</Button>
        </form>
      </div>
    </AppShell>
  );
}
