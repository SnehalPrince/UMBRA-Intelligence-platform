'use client';

import { motion } from 'motion/react';
import { ShieldAlert, Globe, Activity, FileWarning } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function DashboardOverview() {
  const numberRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    // GSAP Number counting animation for the KPIs
    numberRefs.current.forEach((el, index) => {
      if (el) {
        const target = parseInt(el.getAttribute('data-target') || '0', 10);
        gsap.to(el, {
          innerHTML: target,
          duration: 1.5,
          delay: 0.2 + index * 0.1,
          snap: { innerHTML: 1 },
          ease: 'power3.out',
        });
      }
    });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-medium">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time threat telemetry and risk scoring.</p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <KpiCard
          title="Organization Risk Score"
          value="78"
          subtitle="/100 (High Risk)"
          icon={Activity}
          trend="+12 points"
          trendUp={true}
          index={0}
          ref={(el) => { numberRefs.current[0] = el; }}
        />
        <KpiCard
          title="Active Watchlist"
          value="14"
          subtitle="Domains & Keywords"
          icon={Globe}
          trend="2 pending verification"
          index={1}
          ref={(el) => { numberRefs.current[1] = el; }}
        />
        <KpiCard
          title="Critical Findings"
          value="3"
          subtitle="Unresolved alerts"
          icon={ShieldAlert}
          trend="-1 since last week"
          trendUp={false}
          index={2}
          ref={(el) => { numberRefs.current[2] = el; }}
        />
        <KpiCard
          title="Data Breaches"
          value="12"
          subtitle="Historical exposures"
          icon={FileWarning}
          trend="0 new this month"
          index={3}
          ref={(el) => { numberRefs.current[3] = el; }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-medium text-lg mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {/* Mock recent activity list */}
            {[
              { source: 'LinkedIn Data Breach', domain: 'acme.com', severity: 'high', time: '2 hours ago' },
              { source: 'Dark Web Forum Mention', keyword: 'project-titan', severity: 'critical', time: '5 hours ago' },
              { source: 'Canva Breach', domain: 'acme.com', severity: 'medium', time: '1 day ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${activity.severity === 'critical' ? 'bg-red-500' : activity.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="font-medium text-sm">{activity.source}</p>
                    <p className="text-xs text-muted-foreground">{activity.domain || activity.keyword}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-medium text-lg mb-2">AI Insights</h3>
            <p className="text-sm text-muted-foreground mb-4">Claude Haiku has analyzed your recent alerts.</p>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm leading-relaxed text-blue-100">
              "We've detected a pattern of credential exposures originating from third-party vendor breaches. Recommendation: Enforce mandatory password rotations for all administrators within 24 hours and verify 2FA status."
            </div>
          </div>
          <button className="mt-6 w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors border border-white/10">
            View Full AI Report
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Reusable animated KPI Card
const KpiCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendUp, 
  index,
  ref 
}: any) => {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          <Icon className="w-4 h-4 text-foreground/80" />
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-display font-semibold" ref={ref} data-target={value}>0</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        
        {trend && (
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-xs">
            <span className={trendUp === true ? 'text-red-400' : trendUp === false ? 'text-green-400' : 'text-muted-foreground'}>
              {trend}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
