import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Plus, Trash2, Mail, Crown, KeyRound, Eye, EyeOff, AtSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface AdminRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export const AdminAdmins = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('list_admin_users');
    if (error) {
      toast.error('Failed to load admins');
      console.error(error);
    } else {
      setAdmins((data || []) as AdminRow[]);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!email.trim()) return;
    setAdding(true);
    try {
      const { data: uid, error: lookupErr } = await supabase.rpc('find_user_by_email', { _email: email.trim() });
      if (lookupErr) throw lookupErr;
      if (!uid) {
        toast.error('No user found with that email. They must sign up first.');
        return;
      }
      const { error: insertErr } = await supabase.from('user_roles').insert({ user_id: uid, role: 'admin' });
      if (insertErr) {
        if (insertErr.code === '23505') {
          toast.info('That user is already an admin');
        } else {
          throw insertErr;
        }
      } else {
        toast.success('Admin added successfully');
        setEmail('');
        setDialogOpen(false);
        load();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("You can't remove yourself");
      return;
    }
    if (!confirm('Remove admin access from this user?')) return;
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
    if (error) {
      toast.error('Failed to remove admin');
    } else {
      toast.success('Admin removed');
      load();
    }
  };

  return (
    <div className="space-y-6">
      <PasswordCard />
      <EmailCard />

      <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-border rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Crown size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Admin Team</h3>
            <p className="text-sm text-muted-foreground">Manage who can access the admin panel</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-1" /> Add Admin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add new admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Enter the email of an existing user. They must have signed up on the site first.
              </p>
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={adding || !email.trim()}>
                {adding ? 'Adding...' : 'Grant admin access'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            Active Admins
          </h3>
          <Badge variant="secondary">{admins.length}</Badge>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Loading...</div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No admins yet</div>
        ) : (
          <div className="divide-y divide-border">
            {admins.map((a, i) => (
              <motion.div
                key={a.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 flex items-center gap-4 hover:bg-secondary/40 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {(a.full_name || a.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{a.full_name || 'Unnamed admin'}</p>
                    {a.user_id === user?.id && (
                      <Badge className="bg-brand-red/15 text-primary hover:bg-brand-red/15 border-0 text-[10px]">YOU</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail size={11} /> {a.email || 'No email'}
                  </p>
                </div>
                <p className="hidden md:block text-xs text-muted-foreground">
                  Since {new Date(a.created_at).toLocaleDateString()}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(a.user_id)}
                  disabled={a.user_id === user?.id}
                  className="text-destructive hover:bg-destructive/10 disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PasswordCard = () => {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    if (next.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (next !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (!user?.email) {
      toast.error('No email on this account');
      return;
    }
    setSaving(true);
    try {
      // Verify current password first
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signErr) {
        toast.error('Current password is incorrect');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success('Password updated successfully');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
          <KeyRound size={18} />
        </div>
        <div>
          <h3 className="font-semibold">Change Your Password</h3>
          <p className="text-xs text-muted-foreground">Update the password for {user?.email}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="relative">
          <Input
            type={show ? 'text' : 'password'}
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <Input
          type={show ? 'text' : 'password'}
          placeholder="New password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <Input
          type={show ? 'text' : 'password'}
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
          {show ? 'Hide' : 'Show'} passwords
        </button>
        <Button onClick={handleChange} disabled={saving || !current || !next || !confirm}>
          {saving ? 'Updating...' : 'Update password'}
        </Button>
      </div>
    </div>
  );
};

const EmailCard = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const pendingEmail = (user as any)?.new_email as string | undefined;

  const handleResend = async () => {
    const target = pendingEmail || newEmail.trim();
    if (!target || !target.includes('@')) {
      toast.error('Enter the new email address first');
      return;
    }
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-send-email', {
        body: {
          type: 'email_change',
          email: user?.email,
          newEmail: target,
          redirectTo: `${window.location.origin}/admin`,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Verification link sent to ${target} via Resend`, { duration: 6000 });
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend verification link');
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!user?.email) {
      toast.error('No email on this account');
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Please enter a valid new email');
      return;
    }
    if (newEmail.trim().toLowerCase() === user.email.toLowerCase()) {
      toast.error('New email must be different from current email');
      return;
    }
    if (!currentPassword) {
      toast.error('Enter your current password to confirm');
      return;
    }
    setSaving(true);
    try {
      // Verify current password
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signErr) {
        toast.error('Current password is incorrect');
        return;
      }
      // Send branded verification email via Resend
      const { data, error } = await supabase.functions.invoke('admin-send-email', {
        body: {
          type: 'email_change',
          email: user.email,
          newEmail: newEmail.trim(),
          redirectTo: `${window.location.origin}/admin`,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Verification link sent to ${newEmail.trim()} via Resend. Click the link to confirm.`, { duration: 8000 });
      setCurrentPassword('');
      setNewEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change email');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-brand-red/15 text-primary flex items-center justify-center">
          <AtSign size={18} />
        </div>
        <div>
          <h3 className="font-semibold">Change Your Email</h3>
          <p className="text-xs text-muted-foreground">
            Current: <span className="font-medium text-foreground">{user?.email}</span> · Verification links go to both old & new email
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Input
          type="email"
          placeholder="New email address"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Current password (to confirm)"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
        <p className="text-xs text-muted-foreground">
          {pendingEmail
            ? <>Pending verification for <span className="font-medium text-foreground">{pendingEmail}</span></>
            : 'Both inboxes must be confirmed for the change to apply.'}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending || (!pendingEmail && !newEmail)}
          >
            {resending ? 'Resending...' : 'Resend verification link'}
          </Button>
          <Button onClick={handleChangeEmail} disabled={saving || !newEmail || !currentPassword}>
            {saving ? 'Sending...' : 'Send verification links'}
          </Button>
        </div>
      </div>
    </div>
  );
};
