'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Temporary mock login for UI building
      await new Promise((resolve) => setTimeout(resolve, 1200));
      toast.success('Successfully logged in');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-card p-8 rounded-2xl border border-border/50 shadow-2xl backdrop-blur-sm"
    >
      <div className="flex flex-col items-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-4"
        >
          <Shield className="w-6 h-6 text-foreground" />
        </motion.div>
        <h1 className="text-2xl font-display font-medium tracking-tight">Access UMBRA</h1>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Enter your credentials to access the shadow intelligence platform.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Email Address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background/50 h-11"
            placeholder="operator@umbra.io"
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <a href="#" className="text-xs text-primary hover:underline">
              Forgot password?
            </a>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-background/50 h-11"
            placeholder="••••••••"
            required
          />
        </div>

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="w-full h-11 mt-4 bg-white text-black hover:bg-white/90 transition-colors font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </motion.div>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <a href="/register" className="text-primary hover:underline">
          Request access
        </a>
      </div>
    </motion.div>
  );
}
