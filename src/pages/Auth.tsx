import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logoAsset from '@/assets/imagine-logo.png.asset.json';
const logo = logoAsset.url;

type Mode = 'login' | 'register' | 'forgot';

const Auth = () => {
  const [mode, setMode] = useState<Mode>('login');
  const isLogin = mode === 'login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { siteName, logoUrl } = useSiteSettings();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
          navigate('/');
        }
      } else if (mode === 'register') {
        if (!fullName.trim()) {
          toast({ title: 'Full name required', description: 'Please enter your full name.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Account Created!', description: `Welcome to ${siteName}! You are now logged in.` });
          // Fire welcome email (non-blocking)
          supabase.functions.invoke('send-notification-email', {
            body: { type: 'welcome', to: email, data: { name: fullName } },
          }).catch((err) => console.error('Welcome email failed:', err));
          navigate('/');
        }
      } else {
        // forgot password
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } else {
          toast({
            title: 'Check your email',
            description: 'We sent a password reset link to your email address.',
          });
          setMode('login');
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const displayLogo = logo;

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="bg-background rounded-xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src={displayLogo} alt={siteName} className="h-12 w-auto mx-auto object-contain" />
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                mode === 'login' || mode === 'forgot' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                mode === 'register' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Registration
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-foreground mb-4">
              {mode === 'login' ? 'Login' : mode === 'register' ? 'Create Account' : 'Reset Password'}
            </h2>

            {mode === 'forgot' && (
              <p className="text-sm text-muted-foreground text-center -mt-2">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            )}

            {mode === 'register' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
            </div>

            {mode !== 'forgot' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}

            <Button type="submit" className="w-full btn-accent py-3" disabled={loading}>
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'LOGIN NOW'
                : mode === 'register'
                ? 'CREATE ACCOUNT'
                : 'SEND RESET LINK'}
            </Button>

            {mode === 'login' && (
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-primary hover:underline text-sm"
                >
                  Forgot your password?
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1.5 mx-auto"
                >
                  <ArrowLeft size={14} /> Back to login
                </button>
              </p>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
