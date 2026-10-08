import { useState, useEffect, useCallback } from 'react';
import { Star, User, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title?: string | null;
  comment: string | null;
  status?: string;
  is_verified?: boolean;
  created_at: string;
  user_name?: string;
  user_avatar?: string | null;
}

interface ReviewSectionProps {
  productId: string;
  onStats?: (stats: { average: number; count: number }) => void;
}

export const ReviewSection = ({ productId, onStats }: ReviewSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    const { data: reviewsData, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error || !reviewsData) return;

    const rows = reviewsData as unknown as Review[];
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: profilesData } = userIds.length
      ? await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', userIds)
      : { data: [] as any[] };

    const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));

    const withNames = rows.map((r) => ({
      ...r,
      user_name: profileMap.get(r.user_id)?.full_name || 'Verified Customer',
      user_avatar: profileMap.get(r.user_id)?.avatar_url || null,
    }));

    setReviews(withNames);
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Only approved reviews are readable publicly, but a signed-in user also
  // receives their own pending ones — exclude those from the public stats.
  const publicReviews = reviews.filter((r) => (r.status ?? 'approved') === 'approved');
  const count = publicReviews.length;
  const average = count ? publicReviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  useEffect(() => {
    onStats?.({ average, count });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [average, count]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'Login required', description: 'Please login to leave a review.', variant: 'destructive' });
      return;
    }
    if (!comment.trim()) {
      toast({ title: 'Review required', description: 'Please write a review before submitting.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      product_id: productId,
      rating,
      title: title.trim() || null,
      comment: comment.trim(),
    } as any);

    if (error) {
      toast({ title: 'Error', description: 'Failed to submit review. Please try again.', variant: 'destructive' });
    } else {
      toast({ title: 'Review submitted', description: 'Thanks! Your review will appear once approved.' });
      setComment('');
      setTitle('');
      setRating(5);
      setShowForm(false);
      fetchReviews();
    }
    setSubmitting(false);
  };

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    total: publicReviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div>
      {/* Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 pb-5 border-b border-border">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold leading-none">{average.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground mb-0.5">/ 5</span>
            </div>
            <div className="flex gap-0.5 mt-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={15}
                  className={s <= Math.round(average) ? 'text-warning fill-warning' : 'text-muted-foreground/30'}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Based on {count} review{count === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {count > 0 && (
          <div className="flex-1 space-y-1 max-w-xs">
            {distribution.map(({ star, total }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-3">{star}</span>
                <Star size={11} className="text-warning fill-warning" />
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full"
                    style={{ width: count ? `${(total / count) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{total}</span>
              </div>
            ))}
          </div>
        )}

        <div className="sm:ml-auto">
          <Button size="sm" variant={showForm ? 'outline' : 'default'} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Write a Review'}
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-secondary/40 rounded-xl p-4 my-5 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium">Your rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={22}
                      className={star <= (hoveredStar || rating) ? 'text-warning fill-warning' : 'text-muted-foreground/40'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Review title (optional)"
              className="bg-background text-sm"
            />
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              className="resize-none text-sm bg-background"
            />

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* List */}
      <div className="space-y-3 pt-5">
        {reviews.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background border border-border rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary flex items-center justify-center flex-shrink-0">
                  {review.user_avatar ? (
                    <img src={review.user_avatar} alt={review.user_name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            className={star <= review.rating ? 'text-warning fill-warning' : 'text-muted-foreground/30'}
                          />
                        ))}
                      </div>
                      {review.is_verified && (
                        <span className="inline-flex items-center gap-1 text-xs text-accent">
                          <BadgeCheck size={13} /> Verified purchase
                        </span>
                      )}
                      {(review.status ?? 'approved') !== 'approved' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          Awaiting approval
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                  {review.title && (
                    <p className="font-semibold text-sm mt-1.5">{review.title}</p>
                  )}
                  {review.comment && (
                    <p className="text-sm text-foreground/80 leading-relaxed mt-1">{review.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">— {review.user_name}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
