import { HeroSection } from '@/sections/HeroSection';
import { FeaturedEventSection } from '@/sections/FeaturedEventSection';
import { InteractiveMapSection } from '@/sections/InteractiveMapSection';
import { IlaakaLogoStacked } from '@/components/IlaakaLogo';

export function LandingExperience() {
  return (
    <main className="relative bg-background">
      <HeroSection />
      <FeaturedEventSection />
      <InteractiveMapSection />

      {/* Heritage footer */}
      <footer className="w-full pt-20 pb-12 border-t border-on-surface/10 bg-background">
        <div className="flex flex-col items-center gap-8 px-8 w-full max-w-screen-2xl mx-auto">
          <IlaakaLogoStacked markSize={64} />
          <div className="flex gap-8 flex-wrap justify-center">
            {['Archives', 'Privacy', 'Terms', 'Heritage Manual'].map(link => (
              <a
                key={link}
                href="#"
                className="font-label font-light text-[11px] uppercase tracking-[0.22em] text-on-surface/40 hover:text-on-surface transition-colors duration-500"
              >
                {link}
              </a>
            ))}
          </div>
          <p className="font-label font-light text-[11px] uppercase tracking-[0.22em] text-tertiary/80 mt-2">
            © 2024 ILAAKA. A Digital Heirloom of Local Connection.
          </p>
        </div>
      </footer>
    </main>
  );
}
