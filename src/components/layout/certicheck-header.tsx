import { ShieldCheck, Github, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CertiCheckHeader() {
  return (
    <header className="bg-primary text-primary-foreground shadow-lg border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="p-2 rounded-lg bg-primary-foreground/10">
              <ShieldCheck size={32} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">CertiCheck</h1>
              <p className="text-xs sm:text-sm text-primary-foreground/80">by NETCAMPUS</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">GitHub</span>
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="https://netcampus.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">NETCAMPUS</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}