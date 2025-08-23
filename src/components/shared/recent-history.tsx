'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalHistory } from '@/hooks/use-local-history';
import { Clock, Trash2, Download, Copy } from 'lucide-react';

export default function RecentHistory() {
  const { entries, clearHistory } = useLocalHistory();

  const handleDownload = (payload: unknown, idx: number) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certicheck-report-${idx + 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  if (entries.length === 0) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Recent Reports (local)
            </CardTitle>
            <CardDescription>Stored in your browser for convenience</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.slice(0,5).map((e, idx) => (
            <div key={e.id ?? idx} className="flex items-center justify-between rounded-md border p-3">
              <div className="min-w-0">
                <p className="font-medium truncate">
                  [{e.kind === 'analysis' ? 'Analysis' : 'Forgery'}] {e.statusLabel}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {e.documentType || 'Unknown type'} • {new Date(e.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleCopy(e.summary)}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownload(e.payload, idx)}>
                  <Download className="h-4 w-4 mr-1" /> JSON
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}