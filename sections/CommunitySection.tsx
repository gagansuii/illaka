'use client';

import { motion } from 'framer-motion';
import { fadeUp, stagger } from '@/animations/motion';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { communityTracks } from '@/utils/landing-data';

export function CommunitySection() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-12">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-10%' }} variants={fadeUp}>
          <SectionHeading
            eyebrow="Section 03 - Community energy"
            title="Talent lives next door."
            description="You do not need big institutions to learn something new. Ilaaka surfaces the teachers, makers, and community energy already living nearby."
          />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
          variants={stagger}
          className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_0.85fr]"
        >
          <motion.article
            variants={fadeUp}
            className="relative overflow-hidden rounded-[2.3rem] border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-[0_26px_70px_rgba(17,24,39,0.12)] sm:p-8"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,102,63,0.16),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.16),transparent_42%)]" />
            <div className="relative grid gap-6 md:grid-cols-2">
              {communityTracks.slice(0, 2).map((track) => (
                <div key={track.title} className="rounded-[1.7rem] border border-white/40 bg-[rgba(255,255,255,0.48)] p-5 backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(15,23,42,0.24)]">
                  <div className="h-44 rounded-[1.4rem]" style={{ background: `linear-gradient(135deg, ${track.accent} 0%, rgba(255,255,255,0.12) 100%)` }} />
                  <h3 className="mt-4 text-2xl font-semibold">{track.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{track.description}</p>
                </div>
              ))}
            </div>
          </motion.article>

          <div className="grid gap-4">
            {communityTracks.slice(2).map((track) => (
              <motion.article
                key={track.title}
                variants={fadeUp}
                className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_26px_70px_rgba(17,24,39,0.1)]"
              >
                <div className="h-28 rounded-[1.5rem]" style={{ background: `linear-gradient(135deg, ${track.accent} 0%, rgba(255,255,255,0.08) 100%)` }} />
                <h3 className="mt-4 text-xl font-semibold">{track.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{track.description}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
