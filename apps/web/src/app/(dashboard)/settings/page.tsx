'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Save, Mail, Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [threshold, setThreshold] = useState('high');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-medium">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and notification rules.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-8"
      >
        {/* Settings Navigation */}
        <div className="md:col-span-1 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 bg-white/10 text-foreground font-medium rounded-lg text-sm">
            <Settings className="w-4 h-4" /> General
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-white/5 hover:text-foreground font-medium rounded-lg text-sm transition-colors">
            <Mail className="w-4 h-4" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-white/5 hover:text-foreground font-medium rounded-lg text-sm transition-colors">
            <Shield className="w-4 h-4" /> Organization
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-white/5 hover:text-foreground font-medium rounded-lg text-sm transition-colors">
            <Key className="w-4 h-4" /> API Keys
          </button>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-3">
          <form onSubmit={handleSave} className="space-y-6 bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm">
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Profile Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <Input defaultValue="Admin Operator" className="bg-background/50 h-11" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <Input defaultValue="admin@umbra.io" type="email" className="bg-background/50 h-11" disabled />
                </div>
              </div>
            </div>

            <div className="h-px bg-border/50 w-full my-6" />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Alert Threshold</h3>
              <p className="text-sm text-muted-foreground mb-4">Select the minimum severity level required to trigger an immediate email alert.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'critical', label: 'Critical Only', color: 'border-red-500/50' },
                  { value: 'high', label: 'High & Critical', color: 'border-orange-500/50' },
                  { value: 'medium', label: 'Medium & Above', color: 'border-yellow-500/50' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setThreshold(option.value)}
                    className={`flex items-center justify-center py-3 rounded-lg border transition-all text-sm font-medium ${
                      threshold === option.value 
                        ? `bg-background border-primary text-foreground shadow-sm` 
                        : 'border-border/50 text-muted-foreground hover:border-border hover:bg-white/[0.02]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <Button type="submit" disabled={isLoading} className="bg-white text-black hover:bg-white/90">
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
