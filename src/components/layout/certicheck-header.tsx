import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function CertiCheckHeader() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <ShieldCheck size={32} />
          <h1 className="text-xl sm:text-2xl font-semibold">Certicheck by NETCAMPUS</h1>
        </Link>
      </div>
    </header>
  );
}
