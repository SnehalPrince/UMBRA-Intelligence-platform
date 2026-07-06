'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mock registration
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Registration successful. Please check your email.');
      router.push('/login');
    } catch (err) {
      toast.error('Registration failed');
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
        <h1 className="text-2xl font-display font-medium tracking-tight">Join UMBRA</h1>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Request access to the shadow intelligence platform.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Full Name
          </label>
          <Input
            type="text"
            className="bg-background/50 h-11"
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Organization Email
          </label>
          <Input
            type="email"
            className="bg-background/50 h-11"
            placeholder="operator@company.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Password
          </label>
          <Input
            type="password"
            className="bg-background/50 h-11"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="w-full h-11 mt-4 bg-white text-black hover:bg-white/90 transition-colors font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Processing Request...' : 'Create Account'}
          </Button>
        </motion.div>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already an operator?{' '}
        <a href="/login" className="text-primary hover:underline">
          Sign In
        </a>
      </div>
    </motion.div>
  );
}
