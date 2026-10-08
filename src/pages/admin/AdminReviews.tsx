import { useState, useEffect } from 'react';
import { Star, Check, X, Trash2, Search, MessageSquare, BadgeCheck, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReviewRow {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: string;
  is_verified: boolean;
  created_at: string;
  user_name?: string;
  product_name?: string;
}

const statusStyles: Record<string, string> = {
  approved: 'bg-accent/15 text-accent',
  pending: 'bg-warning/15 text-warning',
  rejected: 'bg-destructive/10 text-destructive',
};

export const AdminReviews = () => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Record<string, { title: string; comment: string; rating: number }>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      setLoading(false);
      toast({ title: 'Error', description: 'Failed to load reviews', variant: 'destructive' });
      return;
    }

    const rows = data as unknown as ReviewRow[];
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const productIds = [...new Set(rows.map((r) => r.product_id))];

    const [profilesRes, productsRes] = await Promise.all([
      userIds.length
        ? supabase.from('profiles').select('user_id, full_name').in('user_id', userIds)
        : Promise.resolve({ data: [] as any[] }),
      productIds.length
        ? supabase.from('products').select('id, name').in('id', productIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.full_name]));
    const productMap = new Map((productsRes.data || []).map((p: any) => [p.id, p.name]));

    setReviews(
      rows.map((r) => ({
        ...r,
        user_name: profileMap.get(r.user_id) || 'Customer',
        product_name: productMap.get(r.product_id) || 'Unknown product',
      }))
    );
    setLoading(false);
  };

  const patch = async (id: string, values: Record<string, any>, message: string) => {
    const { error } = await supabase.from('reviews').update(values).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: message });
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...values } as ReviewRow : r)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Review deleted' });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const saveEdit = async (id: string) => {
    const draft = editing[id];
    if (!draft) return;
    await patch(id, { title: draft.title || null, comment: draft.comment || null, rating: draft.rating }, 'Review updated');
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const filtered = reviews.filter((r) => {
    const matchStatus = filter === 'all' || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.product_name?.toLowerCase().includes(q) ||
      r.user_name?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Reviews</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36 bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border/50">
          <MessageSquare size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const draft = editing[r.id];
            return (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.user_name}</span>
                      {r.is_verified && (
                        <span className="inline-flex items-center gap-1 text-xs text-accent">
                          <BadgeCheck size={13} /> Verified purchase
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[r.status] || 'bg-secondary'}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {r.product_name} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setEditing((p) => ({ ...p, [r.id]: { title: draft?.title ?? r.title ?? '', comment: draft?.comment ?? r.comment ?? '', rating: s } }))}>
                        <Star size={15} className={s <= (draft?.rating ?? r.rating) ? 'text-warning fill-warning' : 'text-muted-foreground/40'} />
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  value={draft?.title ?? r.title ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, [r.id]: { title: e.target.value, comment: draft?.comment ?? r.comment ?? '', rating: draft?.rating ?? r.rating } }))}
                  placeholder="Review title"
                  className="bg-background"
                />
                <Textarea
                  value={draft?.comment ?? r.comment ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, [r.id]: { title: draft?.title ?? r.title ?? '', comment: e.target.value, rating: draft?.rating ?? r.rating } }))}
                  rows={3}
                  className="resize-none text-sm bg-background"
                />

                <div className="flex flex-wrap gap-2">
                  {draft && (
                    <Button size="sm" className="gap-1.5" onClick={() => saveEdit(r.id)}>
                      <Save size={14} /> Save
                    </Button>
                  )}
                  {r.status !== 'approved' && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-accent" onClick={() => patch(r.id, { status: 'approved' }, 'Review approved')}>
                      <Check size={14} /> Approve
                    </Button>
                  )}
                  {r.status !== 'rejected' && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => patch(r.id, { status: 'rejected' }, 'Review rejected')}>
                      <X size={14} /> Reject
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => patch(r.id, { is_verified: !r.is_verified }, r.is_verified ? 'Verification removed' : 'Marked as verified purchase')}>
                    <BadgeCheck size={14} /> {r.is_verified ? 'Unverify' : 'Mark verified'}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={() => handleDelete(r.id)}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
