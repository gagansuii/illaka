import { TopNav } from '@/components/TopNav';
import { BottomNav } from '@/components/BottomNav';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <TopNav />
      {children}
      {/* Mobile-only bottom nav */}
      <div className="sm:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
