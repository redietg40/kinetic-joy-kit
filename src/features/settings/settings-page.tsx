import { Building2, Save, UserRound, Bell, KeySquare, Palette } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSession } from "@/api/auth";

export function SettingsPage() {
  const user = getSession();

  return (
    <AppShell title="Settings" description="Manage company and account preferences.">
      <div className="page-enter grid gap-6 xl:grid-cols-2">
        {/* Company Settings */}
        <form className="panel settings-form" onSubmit={e => { e.preventDefault(); toast.success("Company settings saved"); }}>
          <div className="settings-heading">
            <Building2 />
            <div>
              <h2>Company profile</h2>
              <p>Used on invoices and customer communication.</p>
            </div>
          </div>
          <Label>Company name
            <Input defaultValue="FieldFlow Services" />
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <Label>Tax rate (%)
              <Input type="number" defaultValue="15" />
            </Label>
            <Label>Invoice prefix
              <Input defaultValue="INV" />
            </Label>
          </div>
          <Label>Business address
            <Input defaultValue="Bole Road, Addis Ababa" />
          </Label>
          <Button><Save />Save company</Button>
        </form>

        {/* Profile Settings */}
        <form className="panel settings-form" onSubmit={e => { e.preventDefault(); toast.success("Profile updated"); }}>
          <div className="settings-heading">
            <UserRound />
            <div>
              <h2>Your profile</h2>
              <p>Personal information for this workspace.</p>
            </div>
          </div>
          <Label>Full name
            <Input defaultValue={user?.name || "User"} />
          </Label>
          <Label>Email
            <Input type="email" defaultValue={user?.email || "email@example.com"} />
          </Label>
          <Label>Role
            <Input defaultValue={user?.role || "Owner"} disabled />
          </Label>
          <Button><Save />Update profile</Button>
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
