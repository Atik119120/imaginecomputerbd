import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, ShieldCheck, Mail, Calendar, Wallet, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Customer {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  joined_at: string;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
  is_admin: boolean;
}

interface CustomerOrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

interface CustomerOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: CustomerOrderItem[];
}

export const AdminUsers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [orders, setOrders] = useState<Record<string, CustomerOrder[]>>({});
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const toggleOrders = async (userId: string) => {
    if (expanded === userId) {
      setExpanded(null);
      return;
    }
    setExpanded(userId);
    if (orders[userId]) return;

    setOrdersLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('id,status,total_amount,created_at,order_items(product_name,quantity,price)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load orders');
      console.error(error);
    } else {
      setOrders((prev) => ({ ...prev, [userId]: (data || []) as unknown as CustomerOrder[] }));
    }
    setOrdersLoading(false);
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('list_customers');
    if (error) {
      toast.error('Failed to load users');
      console.error(error);
    } else {
      setCustomers((data || []) as Customer[]);
    }
    setLoading(false);
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.email?.toLowerCase().includes(q) ||
      c.full_name?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
  const totalOrders = customers.reduce((sum, c) => sum + Number(c.order_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: customers.length, icon: ShieldCheck, color: 'bg-brand-red/10 text-primary' },
          { label: 'Active Buyers', value: customers.filter(c => c.order_count > 0).length, icon: ShoppingBag, color: 'bg-accent/10 text-accent' },
          { label: 'Total Orders', value: totalOrders, icon: Calendar, color: 'bg-muted text-foreground' },
          { label: 'Lifetime Revenue', value: `৳${totalRevenue.toLocaleString()}`, icon: Wallet, color: 'bg-brand-red/15 text-primary' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Badge variant="secondary">{filtered.length} users</Badge>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No users found</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((c) => (
              <div key={c.user_id}>
                <button
                  type="button"
                  onClick={() => toggleOrders(c.user_id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-secondary/40 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {(c.full_name || c.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{c.full_name || 'Unnamed'}</p>
                      {c.is_admin && <Badge className="bg-accent/15 text-accent hover:bg-accent/15 border-0 text-[10px]">ADMIN</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail size={11} /> {c.email || 'No email'}
                    </p>
                  </div>
                  <div className="hidden md:flex flex-col items-end text-right">
                    <p className="text-sm font-semibold">{c.order_count} orders</p>
                    <p className="text-xs text-muted-foreground">৳{Number(c.total_spent || 0).toLocaleString()} spent</p>
                  </div>
                  <div className="hidden lg:block text-right text-xs text-muted-foreground">
                    Joined<br />
                    {new Date(c.joined_at).toLocaleDateString()}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-muted-foreground transition-transform ${expanded === c.user_id ? 'rotate-180' : ''}`}
                  />
                </button>

                {expanded === c.user_id && (
                  <div className="px-4 pb-4 bg-secondary/30">
                    {ordersLoading ? (
                      <p className="text-sm text-muted-foreground py-3">Loading orders...</p>
                    ) : (orders[c.user_id] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-3">No orders yet</p>
                    ) : (
                      <div className="space-y-2 pt-3">
                        {(orders[c.user_id] || []).map((o) => (
                          <div key={o.id} className="bg-card border border-border rounded-lg p-3">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div>
                                <p className="text-sm font-semibold font-mono">#{o.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                              </div>
                              <Badge variant="secondary" className="uppercase text-[10px]">{o.status}</Badge>
                              <p className="text-sm font-semibold">৳{Number(o.total_amount).toLocaleString()}</p>
                            </div>
                            {(o.order_items || []).length > 0 && (
                              <ul className="mt-2 space-y-1 border-t border-border pt-2">
                                {(o.order_items || []).map((it, idx) => (
                                  <li key={idx} className="text-xs text-muted-foreground flex justify-between gap-2">
                                    <span className="truncate">{it.product_name} × {it.quantity}</span>
                                    <span>৳{(Number(it.price) * it.quantity).toLocaleString()}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

        )}
      </div>
    </div>
  );
};
