'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports] = useState([
    { id: '1', name: 'Weekly Threat Summary', date: '2026-06-25', size: '2.4 MB', type: 'PDF' },
    { id: '2', name: 'Executive Risk Briefing', date: '2026-06-01', size: '1.1 MB', type: 'PDF' },
    { id: '3', name: 'Raw Findings Export', date: '2026-05-15', size: '4.8 MB', type: 'CSV' },
  ]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    toast('Report generation started', { description: 'This may take a few moments.' });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('Report generated successfully');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium">Intelligence Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and download executive summaries and raw data exports.</p>
        </div>
        
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="shrink-0 bg-white text-black hover:bg-white/90"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          {isGenerating ? 'Generating...' : 'Generate New Report'}
        </Button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 p-4 border-b border-border/50 bg-background/30 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          <div className="col-span-6 sm:col-span-5">Report Name</div>
          <div className="col-span-3 sm:col-span-3">Date Generated</div>
          <div className="col-span-3 sm:col-span-2 hidden sm:block">Size</div>
          <div className="col-span-3 sm:col-span-2 text-right">Action</div>
        </div>

        <div className="divide-y divide-border/30">
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-12 p-4 items-center group hover:bg-white/[0.02] transition-colors"
            >
              <div className="col-span-6 sm:col-span-5 font-medium flex items-center gap-3">
                <div className="p-2 bg-background/50 rounded-lg border border-border/50 hidden sm:block">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p>{report.name}</p>
                  <p className="text-xs text-muted-foreground sm:hidden mt-0.5">{report.type} • {report.size}</p>
                </div>
              </div>
              
              <div className="col-span-3 sm:col-span-3 flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2 hidden sm:block opacity-50" />
                {report.date}
              </div>
              
              <div className="col-span-3 sm:col-span-2 hidden sm:block text-sm text-muted-foreground">
                {report.size}
              </div>
              
              <div className="col-span-3 sm:col-span-2 text-right">
                <Button variant="outline" size="sm" className="hidden sm:flex ml-auto hover:bg-white hover:text-black transition-colors">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="ghost" size="icon" className="sm:hidden ml-auto">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
