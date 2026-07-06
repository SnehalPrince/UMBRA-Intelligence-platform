import { Shield, Activity, Bell, Settings, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

const navItems = [
  { href: '/dashboard', icon: Activity, label: 'Overview' },
  { href: '/dashboard/alerts', icon: Bell, label: 'Alerts' },
  { href: '/dashboard/watchlist', icon: Shield, label: 'Watchlist' },
  { href: '/dashboard/search', icon: Search, label: 'Threat Lookup' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/40 bg-card/50 backdrop-blur-xl">
        <div className="flex h-16 items-center px-6 border-b border-border/40">
          <Shield className="w-6 h-6 mr-3 text-primary" />
          <span className="font-display font-semibold tracking-wide">UMBRA</span>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 w-full px-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-w-0">
        <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-widest">Command Center</h2>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium border border-white/20">
              OP
            </div>
          </div>
        </header>
        
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
