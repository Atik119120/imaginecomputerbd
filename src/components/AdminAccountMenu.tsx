import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  User as UserIcon,
  Pencil,
  Mail,
  Lock,
  ImageIcon,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type PanelId = 'profile' | 'name' | 'email' | 'password' | 'picture' | null;


export const AdminAccountMenu = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<PanelId>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);


  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    setFullName(data?.full_name || (user.user_metadata as any)?.full_name || '');
    setAvatarUrl(data?.avatar_url || null);
  };

  useEffect(() => {
    loadProfile();
    setNewEmail(user?.email || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const saveName = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, full_name: fullName.trim() }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) return toast.error(error.message);
    await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    toast.success('Name updated');
    setPanel(null);
  };


  const saveEmail = async () => {
    if (!newEmail.trim() || newEmail === user?.email) {
      toast.error('Enter a new email address');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser(
      { email: newEmail.trim() },
      { emailRedirectTo: `${window.location.origin}/admin` }
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Confirmation link sent to the new email');
    setPanel(null);
  };

  const savePassword = async () => {
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error(error.message);
    setPassword('');
    setConfirmPassword('');
    toast.success('Password updated');
    setPanel(null);
  };

  const uploadPicture = async (file: File) => {
    if (!user) return;
    setSaving(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (upErr) {
      setSaving(false);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, avatar_url: data.publicUrl }, { onConflict: 'user_id' });

    setSaving(false);
    if (error) return toast.error(error.message);
    setAvatarUrl(data.publicUrl);
    toast.success('Picture updated');
  };

  const initial = (fullName || user?.email || 'A').charAt(0).toUpperCase();
  const displayName = fullName || user?.email?.split('@')[0] || 'Admin';

  const items: { id: Exclude<PanelId, null>; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile Settings', icon: UserIcon },
    { id: 'name', label: 'Edit Name', icon: Pencil },
    { id: 'email', label: 'Change Email', icon: Mail },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'picture', label: 'Change Picture', icon: ImageIcon },
  ];


  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl bg-sidebar-accent border border-sidebar-border p-3 flex items-center gap-3 text-left hover:border-sidebar-primary/40 transition-colors"
      >
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-semibold text-sm">
              {initial}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent ring-2 ring-sidebar-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-sidebar-primary/15 text-sidebar-primary">
              ADMIN
            </span>
            <span className="text-[10px] text-sidebar-foreground/50">Online</span>
          </div>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="flex-shrink-0">
          <ChevronDown size={16} className="opacity-60" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 z-50 rounded-xl bg-sidebar-accent border border-sidebar-border shadow-xl overflow-hidden py-1"
          >
            <p className="px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/45">
              Account
            </p>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setOpen(false);
                  setPanel(item.id);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-primary/10 transition-colors"
              >
                <item.icon size={16} className="flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
            <div className="border-t border-sidebar-border mt-1 pt-1">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={16} className="flex-shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadPicture(f);
          e.target.value = '';
        }}
      />

      {/* Profile Settings */}
      <Dialog open={panel === 'profile'} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogDescription>Your admin account details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
                  {initial}
                </div>
              )}
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={saving}>
                Change Picture
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPanel(null)}>
              Close
            </Button>
            <Button onClick={saveName} disabled={saving}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Name */}
      <Dialog open={panel === 'name'} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPanel(null)}>
              Cancel
            </Button>
            <Button onClick={saveName} disabled={saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Email */}
      <Dialog open={panel === 'email'} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>
              A confirmation link will be sent to the new address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New email</Label>
            <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPanel(null)}>
              Cancel
            </Button>
            <Button onClick={saveEmail} disabled={saving}>
              Send link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password */}
      <Dialog open={panel === 'password'} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirm password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPanel(null)}>
              Cancel
            </Button>
            <Button onClick={savePassword} disabled={saving}>
              Update password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Picture */}
      <Dialog open={panel === 'picture'} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Picture</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold">
                {initial}
              </div>
            )}
            <Button onClick={() => fileRef.current?.click()} disabled={saving}>
              {saving ? 'Uploading...' : 'Upload new picture'}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPanel(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
