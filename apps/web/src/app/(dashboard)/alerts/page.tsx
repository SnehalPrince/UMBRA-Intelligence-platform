'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, Info, ShieldCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AlertsPage() {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  
  // Mock alerts
  const [alerts] = useState([
    {
      id: '1',
      source: 'LinkedIn Data Breach',
      domain: 'acme.com',
      severity: 'critical',
      score: 95,
      date: '2026-06-25T14:30:00Z',
      status: 'new',
      summary: 'Passwords and email addresses were exposed in plaintext.',
    },
    {
      id: '2',
      source: 'Dark Web Forum Mention',
      domain: 'project-titan',
      severity: 'high',
      score: 75,
      date: '2026-06-24T09:15:00Z',
      status: 'investigating',
      summary: 'Threat actor selling access to internal project repositories.',
    },
    {
      id: '3',
      source: 'Canva Breach',
      domain: 'acme.com',
      severity: 'medium',
      score: 45,
      date: '2026-06-20T11:00:00Z',
      status: 'resolved',
      summary: 'Historical exposure of names and email addresses.',
    },
  ]);

  const filteredAlerts = alerts.filter(a => filter === 'all' || a.severity === filter);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium">Alerts & Findings</h1>
          <p className="text-muted-foreground mt-1">Review and remediate detected exposures and breaches.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 p-1 bg-background/50 border border-border/50 rounded-lg w-fit">
        {['all', 'critical', 'high', 'medium'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-white text-black shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <span className="capitalize">{f}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className={`bg-card border rounded-2xl p-5 shadow-sm hover:border-white/20 transition-colors group relative overflow-hidden ${
                alert.severity === 'critical' ? 'border-red-500/30 bg-red-500/[0.02]' : 
                alert.severity === 'high' ? 'border-orange-500/30 bg-orange-500/[0.02]' : 
                'border-border/50'
              }`}
            >
              {/* Status Indicator line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                alert.severity === 'critical' ? 'bg-red-500' : 
                alert.severity === 'high' ? 'bg-orange-500' : 
                'bg-yellow-500'
              }`} />

              <div className="flex justify-between items-start pl-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-2">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider bg-background/50 px-2 py-0.5 rounded-sm border border-border/50">
                      Score: {alert.score}/100
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-foreground">{alert.source}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium text-foreground/80">{alert.domain}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    {alert.summary}
                  </p>
                </div>
                
                <Button variant="outline" className="hidden sm:flex group-hover:bg-white group-hover:text-black transition-all">
                  Analyze <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAlerts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 text-center border border-dashed border-border rounded-2xl"
          >
            <ShieldCheck className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">All Clear</h3>
            <p className="text-muted-foreground mt-1">No alerts found for the selected filter.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'critical') {
    return (
      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
        <ShieldAlert className="w-3.5 h-3.5" />
        Critical
      </span>
    );
  }
  if (severity === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md bg-orange-500/10 text-orange-400 text-xs font-medium border border-orange-500/20">
        <AlertTriangle className="w-3.5 h-3.5" />
        High
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md bg-yellow-500/10 text-yellow-400 text-xs font-medium border border-yellow-500/20">
      <Info className="w-3.5 h-3.5" />
      Medium
    </span>
  );
}
