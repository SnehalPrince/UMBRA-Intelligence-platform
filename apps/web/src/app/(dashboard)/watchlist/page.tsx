'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Globe, Tag, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function WatchlistPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<'domain' | 'keyword'>('domain');
  const [value, setValue] = useState('');
  
  // Mock items
  const [items, setItems] = useState([
    { id: '1', type: 'domain', value: 'acme.com', status: 'verified', addedAt: '2026-06-20' },
    { id: '2', type: 'keyword', value: 'project-titan', status: 'verified', addedAt: '2026-06-25' },
    { id: '3', type: 'domain', value: 'acme-corp.net', status: 'pending_verification', addedAt: '2026-06-26' },
  ]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      type,
      value,
      status: type === 'domain' ? 'pending_verification' : 'verified',
      addedAt: new Date().toISOString().split('T')[0],
    };

    setItems([newItem, ...items]);
    toast.success(`Added ${value} to watchlist`);
    setValue('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast.success('Removed from watchlist');
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium">Watchlist</h1>
          <p className="text-muted-foreground mt-1">Manage domains and keywords to monitor across the dark web.</p>
        </div>
        
        <Button onClick={() => setIsAdding(!isAdding)} className="shrink-0 bg-white text-black hover:bg-white/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="font-medium mb-4">Add New Asset</h3>
              <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'domain' | 'keyword')}
                  className="h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-[150px]"
                >
                  <option value="domain">Domain</option>
                  <option value="keyword">Keyword</option>
                </select>
                
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === 'domain' ? 'e.g., yourcompany.com' : 'e.g., project-name'}
                  className="flex-1 h-10 bg-background/50"
                  required
                />
                
                <div className="flex gap-2">
                  <Button type="submit" className="h-10">Add</Button>
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="h-10">Cancel</Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 p-4 border-b border-border/50 bg-background/30 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1 hidden sm:block">Type</div>
          <div className="col-span-6 sm:col-span-5">Value</div>
          <div className="col-span-3 sm:col-span-3">Status</div>
          <div className="col-span-2 hidden sm:block">Added</div>
          <div className="col-span-3 sm:col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-border/30">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, backgroundColor: 'rgba(255,255,255,0.05)' }}
                animate={{ opacity: 1, backgroundColor: 'transparent' }}
                exit={{ opacity: 0, x: -20, backgroundColor: 'rgba(239,68,68,0.1)' }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-12 p-4 items-center group hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-1 hidden sm:flex items-center text-muted-foreground">
                  {item.type === 'domain' ? <Globe className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                </div>
                
                <div className="col-span-6 sm:col-span-5 font-medium flex items-center">
                  <span className="sm:hidden mr-2 text-muted-foreground">
                    {item.type === 'domain' ? <Globe className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                  </span>
                  {item.value}
                </div>
                
                <div className="col-span-3 sm:col-span-3">
                  {item.status === 'verified' ? (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md bg-yellow-500/10 text-yellow-400 text-xs font-medium border border-yellow-500/20">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  )}
                </div>
                
                <div className="col-span-2 hidden sm:block text-sm text-muted-foreground">
                  {item.addedAt}
                </div>
                
                <div className="col-span-3 sm:col-span-1 text-right">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No assets in your watchlist. Add domains or keywords to monitor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
