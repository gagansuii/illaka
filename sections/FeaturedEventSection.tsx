'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react';

const FEATURED = {
  series:    'Heritage Series · Volume IV',
  title:     'Ancient Clay & Ember Workshop',
  date:      'October 24, 2024',
  time:      '17:30 — 20:00',
  duration:  '2.5 Hours Experience',
  location:  'The Old Kiln District',
  address:   '42 Heritage Lane, S-02 Warehouse',
  description: [
    'Step back into a time when creation was a conversation between hand and soil. Our Pottery Workshop isn\'t just about crafting a vessel; it\'s about the heritage of patience and the narrative of the flame.',
    'Guided by master artisan Elias Thorne, participants will explore the Ember-Firing technique, a method passed down through generations to create distinctive, smoke-infused textures that make every piece a unique heirloom.',
  ],
  host: {
    name:  'Master Elias Thorne',
    bio:   'With 40 years of dedication to the heritage kiln, Elias brings the soul of the Earth to life through his guidance.',
    image: '/hero-bg.jpeg',
  },
  bento: [
    { icon: '🏛️', title: 'Sacred Spaces',       body: 'The workshop takes place in a restored 18th-century stone warehouse with natural acoustics.' },
    { icon: '🍵', title: 'Artisan Refreshments', body: 'Enjoy hand-pressed botanical teas and heritage grains served in hand-crafted ceramics.' },
    { icon: '🔥', title: 'Fire-Casting',          body: 'Learn the ancient ember-firing technique that produces one-of-a-kind smoke-infused textures.' },
    { icon: '📜', title: 'Take Home Piece',       body: 'Every participant leaves with a unique fired clay vessel as a lasting heirloom.' },
  ],
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
});

export function FeaturedEventSection() {
  return (
    <section className="bg-background">
      <div className="max-w-screen-2xl mx-auto px-6 py-20 sm:px-12 sm:py-28">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">

          {/* ── Left column (4 cols): Schedule + Location ── */}
          <div className="md:col-span-4 flex flex-col gap-8">

            {/* Schedule card */}
            <motion.div {...fadeUp(0)} className="detail-card">
              <h3 className="font-label text-[10px] uppercase tracking-widest text-outline mb-6">
                Schedule &amp; Arrival
              </h3>
              <div className="flex items-start gap-4 mb-5">
                <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-on-surface font-headline italic text-xl">{FEATURED.date}</p>
                  <p className="text-on-surface-variant text-xs font-label uppercase tracking-tighter mt-1">
                    Sunset Session
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-on-surface font-headline italic text-xl">{FEATURED.time}</p>
                  <p className="text-on-surface-variant text-xs font-label uppercase tracking-tighter mt-1">
                    {FEATURED.duration}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Location card */}
            <motion.div {...fadeUp(0.08)} className="bg-surface-container-low p-8">
              <h3 className="font-label text-[10px] uppercase tracking-widest text-outline mb-6">
                The Sanctuary
              </h3>
              <div className="flex items-start gap-4 mb-6">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-on-surface font-headline italic text-xl">{FEATURED.location}</p>
                  <p className="text-on-surface-variant text-sm font-label mt-1">{FEATURED.address}</p>
                </div>
              </div>
              {/* Attendee count pill */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant/20">
                <Users className="h-4 w-4 text-tertiary" strokeWidth={1.5} />
                <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                  14 attending
                </span>
                <div className="flex -space-x-2 ml-auto">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-7 w-7 rounded-full bg-surface-container-highest border border-surface-container-low flex items-center justify-center text-[9px] font-label text-on-surface-variant"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  <div className="h-7 w-7 rounded-full bg-primary-container border border-surface-container-low flex items-center justify-center text-[9px] font-label text-on-primary-container font-bold">
                    +10
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA → Feed */}
            <motion.div {...fadeUp(0.14)}>
              <motion.div
                whileHover={{ scale: 1.025, y: -3 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 440, damping: 20 }}
              >
                <Link
                  href="/discover"
                  className="heritage-btn heritage-btn--primary w-full justify-center"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Explore Feed
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* ── Right column (8 cols): Narrative + Host + Bento ── */}
          <div className="md:col-span-8 flex flex-col gap-14">

            {/* Narrative */}
            <motion.section {...fadeUp(0.06)} className="max-w-2xl">
              <span className="heritage-eyebrow mb-4">{FEATURED.series}</span>
              <h2
                className="font-headline italic text-primary mt-4 mb-8 leading-tight"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
              >
                Reconnect with the Earth
              </h2>
              <div className="flex flex-col gap-5 text-on-surface-variant leading-relaxed text-[1.05rem] font-light">
                {FEATURED.description.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </motion.section>

            {/* Host */}
            <motion.div
              {...fadeUp(0.12)}
              className="bg-surface-container-lowest p-8 flex flex-col sm:flex-row items-center gap-8"
            >
              <div className="relative w-28 h-28 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={FEATURED.host.image}
                  alt={FEATURED.host.name}
                  className="w-full h-full object-cover rounded-full"
                />
                <div className="absolute inset-0 border border-primary/25 rounded-full scale-110" />
              </div>
              <div className="flex flex-col gap-1.5 text-center sm:text-left">
                <span className="heritage-eyebrow">Hosted By</span>
                <h4 className="font-headline text-2xl italic text-on-surface mt-1">
                  {FEATURED.host.name}
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed max-w-md font-light mt-1">
                  {FEATURED.host.bio}
                </p>
              </div>
            </motion.div>

            {/* Experience bento */}
            <motion.div
              {...fadeUp(0.18)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {FEATURED.bento.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.20 + i * 0.06 }}
                  whileHover={{ y: -3 }}
                  className="bg-surface-container p-7 group cursor-default transition-colors duration-200 hover:bg-surface-container-high"
                >
                  <span className="text-2xl mb-4 block">{item.icon}</span>
                  <h5 className="font-headline text-xl italic text-on-surface mb-2 group-hover:text-tertiary transition-colors duration-200">
                    {item.title}
                  </h5>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-light">
                    {item.body}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
