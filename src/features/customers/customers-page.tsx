import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, Mail, MapPin, Phone, Plus, Search, Send, User } from "lucide-react";
import { listCustomers, saveCustomer } from "@/api/customers";
import { listJobs } from "@/api/jobs";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

import type { Customer } from "@/types";

export function CustomersPage() {
  const qc = useQueryClient();
  const { data: customers } = useSuspenseQuery({
    queryKey: ["customers"],
    queryFn: listCustomers,
    refetchInterval: 3000,
  });
  const { data: jobs } = useSuspenseQuery({
    queryKey: ["jobs"],
    queryFn: listJobs,
    refetchInterval: 3000,
  });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    telegram_username: "",
    notes: ""
  });

  const mutation = useMutation({
    mutationFn: saveCustomer,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      toast.success(editingCustomer ? "Customer updated successfully!" : "Customer added successfully!");
      setEditingCustomer(null);
      setFormData({ name: "", email: "", phone: "", address: "", telegram_username: "", notes: "" });
    },
    onError: () => {
      toast.error("Failed to save customer. Please check the details.");
    }
  });

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      email: c.email,
      phone: c.phone || "",
      address: c.address || "",
      telegram_username: c.telegram_username || "",
      notes: c.notes || ""
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      return toast.error("Full name and Email are required.");
    }
    mutation.mutate({
      ...(editingCustomer ? { id: editingCustomer.id } : {}),
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      telegram_username: formData.telegram_username.trim(),
      notes: formData.notes.trim()
    });
  };

  const filtered = customers.filter(c =>
    `${c.name} ${c.email} ${c.phone} ${c.address}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell
      title="Customers"
      description="Manage customer accounts, addresses, and service histories."
      actions={
        <Dialog open={open} onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditingCustomer(null);
            setFormData({ name: "", email: "", phone: "", address: "", telegram_username: "", notes: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCustomer(null);
              setFormData({ name: "", email: "", phone: "", address: "", telegram_username: "", notes: "" });
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Edit Customer Details" : "Add New Customer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Abebe Bikila"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@example.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+251 911 000 000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Service Address</Label>
                <Input
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Bole, Addis Ababa"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Telegram Username or Chat ID (Optional)</Label>
                  <a
                    href="https://t.me/FieldFlowApp_bot"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    @FieldFlowApp_bot ↗
                  </a>
                </div>
                <Input
                  value={formData.telegram_username}
                  onChange={e => setFormData({ ...formData, telegram_username: e.target.value })}
                  placeholder="@username or Chat ID (e.g. 5179839146)"
                />
                <p className="text-[11px] text-muted-foreground">
                  Numeric Chat ID or @username used for instant repair schedule alerts and receipts.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Gate code, preferred hours, etc."
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : editingCustomer ? "Save Changes" : "Save Customer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="page-enter space-y-5">
        <div className="search-box max-w-md">
          <Search />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
          />
        </div>

        {filtered.length === 0 ? (
          <div className="panel text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold">No customers yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first customer using the button above, or clients can self-register via the Customer Portal.
            </p>
          </div>
        ) : (
          <div className="card-grid">
            {filtered.map(c => (
              <article className="customer-card" key={c.id}>
                <div className="contact-card">
                  <span className="avatar avatar-lg">
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <p className="text-xs text-muted-foreground">
                      {c.created_at ? `Customer since ${new Date(c.created_at).getFullYear()}` : "Active Client"}
                    </p>
                  </div>
                </div>
                <div className="info-list space-y-1 text-sm">
                  {c.phone && <p><Phone className="w-4 h-4 inline mr-2" />{c.phone}</p>}
                  <p><Mail className="w-4 h-4 inline mr-2" />{c.email}</p>
                  {c.address && <p><MapPin className="w-4 h-4 inline mr-2" />{c.address}</p>}
                  {c.telegram_username && (
                    <p className="text-blue-500 font-medium">
                      <Send className="w-4 h-4 inline mr-2" />{c.telegram_username}
                    </p>
                  )}
                </div>
                <div className="card-footer">
                  <span>
                    <BriefcaseBusiness className="w-4 h-4 inline mr-1" />
                    {jobs.filter(j => j.customer_id === c.id).length} jobs
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(c)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.info(c.notes || "No notes recorded for this customer.")}
                    >
                      View notes
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
