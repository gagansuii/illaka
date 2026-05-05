import { TopNav } from '@/components/TopNav';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <TopNav />
      <div className="flex-1">{children}</div>
      <Footer />
      {/* Mobile-only bottom nav */}
      <div className="sm:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
