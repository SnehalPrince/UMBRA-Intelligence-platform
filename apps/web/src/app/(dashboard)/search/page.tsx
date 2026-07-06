'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Database, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function SearchPage() {
  const [domain, setDomain] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;
    
    setIsSearching(true);
    setResults(null);
    
    try {
      // Mock search delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock results
      setResults([
        {
          id: 1,
          name: 'Collection #1',
          date: '2019-01-17',
          pwnCount: 772904991,
          classes: ['Email addresses', 'Passwords'],
          description: 'In January 2019, a large collection of credential stuffing lists was discovered...'
        },
        {
          id: 2,
          name: 'LinkedIn',
          date: '2012-05-05',
          pwnCount: 164611595,
          classes: ['Email addresses', 'Passwords'],
          description: 'In May 2012, LinkedIn had 164 million email addresses and passwords exposed...'
        }
      ]);
      toast.success('Scan complete');
    } catch (err) {
      toast.error('Scan failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto mt-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-foreground" />
        </div>
        <h1 className="text-4xl font-display font-medium">Manual Threat Lookup</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Run an on-demand credential breach scan against our historical datasets and the HIBP integration.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 p-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl shadow-2xl">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter domain (e.g. yourcompany.com)"
            className="flex-1 h-14 bg-transparent border-0 focus-visible:ring-0 text-lg px-6"
            required
          />
          <Button 
            type="submit" 
            disabled={isSearching}
            className="h-14 px-8 rounded-lg bg-white text-black hover:bg-white/90 text-base font-medium"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
            {isSearching ? 'Scanning...' : 'Run Scan'}
          </Button>
        </form>
      </motion.div>

      <AnimatePresence mode="wait">
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 pt-8"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h2 className="text-xl font-medium">Scan Results for <span className="text-primary">{domain}</span></h2>
              <span className="text-sm font-medium px-3 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
                {results.length} breaches found
              </span>
            </div>

            {results.map((result, i) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border/50 rounded-xl p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      {result.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Breached on {result.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-display font-semibold text-red-400">
                      {(result.pwnCount / 1000000).toFixed(1)}M
                    </span>
                    <p className="text-xs text-muted-foreground">records exposed</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {result.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {result.classes.map((cls: string) => (
                    <span key={cls} className="text-xs font-medium px-2 py-1 bg-background rounded-md border border-border/50 text-foreground/80 flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      {cls}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
