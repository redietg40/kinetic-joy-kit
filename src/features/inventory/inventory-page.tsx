import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Plus, Search, AlertTriangle, ArrowUpCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listInventory, createInventoryItem, updateInventoryItem } from "@/api/inventory";
import { toast } from "sonner";

export function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: listInventory,
  });

  const createMutation = useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setIsAddOpen(false);
      toast.success("Item added to inventory");
    },
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => {
      const item = inventory.find(i => i.id === id);
      return updateInventoryItem(id, { quantity: (item?.quantity || 0) + qty });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setIsRestockOpen(false);
      setSelectedItem(null);
      toast.success("Inventory restocked");
    },
  });

  const filtered = inventory.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.category.toLowerCase().includes(search.toLowerCase()) ||
    i.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell
      title="Inventory"
      description="Track parts, tools, and materials"
      actions={
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createMutation.mutate({
                  id: `ITEM-${Date.now().toString().slice(-6)}`,
                  name: fd.get("name") as string,
                  category: fd.get("category") as string,
                  quantity: parseInt(fd.get("quantity") as string, 10),
                  unit: fd.get("unit") as string,
                  reorder_level: parseInt(fd.get("reorder_level") as string, 10),
                  unit_cost: parseFloat(fd.get("unit_cost") as string),
                });
              }}
              className="space-y-4 pt-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Name</label>
                <input required name="name" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm" placeholder="e.g. Copper Pipe 1/2 inch" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select required name="category" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm">
                    <option value="HVAC">HVAC</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Tools">Tools</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <input required name="unit" defaultValue="pcs" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Qty</label>
                  <input required name="quantity" type="number" defaultValue="0" min="0" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reorder Level</label>
                  <input required name="reorder_level" type="number" defaultValue="5" min="0" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Cost (ETB)</label>
                <input required name="unit_cost" type="number" step="0.01" defaultValue="0.00" min="0" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>Save Item</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6 page-enter">
        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800/50 max-w-md">
          <Search className="w-5 h-5 text-slate-500 ml-2" />
          <input
            type="text"
            placeholder="Search parts, tools, or categories..."
            className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-slate-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">In Stock</th>
                  <th className="px-6 py-4 text-right">Unit Cost</th>
                  <th className="px-6 py-4 text-right">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500">Loading inventory...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-500">No items found.</td></tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <Box className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium">{item.quantity}</span>
                        <span className="text-slate-500 ml-1 text-xs">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        ETB {Number(item.unit_cost).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.quantity <= item.reorder_level ? (
                          <span className="inline-flex items-center text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Dialog open={isRestockOpen && selectedItem === item.id} onOpenChange={(val) => {
                          setIsRestockOpen(val);
                          if(val) setSelectedItem(item.id);
                          else setSelectedItem(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ArrowUpCircle className="w-4 h-4 mr-2 text-emerald-400" />
                              Restock
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Restock {item.name}</DialogTitle>
                            </DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                restockMutation.mutate({
                                  id: item.id,
                                  qty: parseInt(fd.get("quantity") as string, 10),
                                });
                              }}
                              className="space-y-4 pt-4"
                            >
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Quantity to Add</label>
                                <input required name="quantity" type="number" min="1" defaultValue="10" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm" />
                              </div>
                              <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setIsRestockOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={restockMutation.isPending}>Confirm Restock</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
