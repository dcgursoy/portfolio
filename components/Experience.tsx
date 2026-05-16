'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

// ─── Photo type ───────────────────────────────────────────────────────────────
// Use a plain string for no caption:   '/mit-1.jpg'
// Use an object for a caption:         { src: '/mit-1.jpg', caption: 'Race day at MIT' }
type Photo = string | { src: string; caption?: string }

const toPhoto = (p: Photo) => typeof p === 'string' ? { src: p, caption: undefined } : p

// ─── Data ─────────────────────────────────────────────────────────────────────
const research = [
  {
    company: 'Modular Robotics Lab (GRASP Lab)',
    role: 'Undergraduate Research Assistant',
    location: 'Philadelphia, PA',
    period: 'Feb 2026 – Present',
    badge: 'Research',
    badgeColor: 'purple',
    bullets: [
      'Designing capacitive sensing circuits for joint angle detection on the ABOT modular robot under Prof. Mark Yim, implementing a Schmitt trigger relaxation oscillator with OPA277 op-amp for real-time proprioceptive feedback',
    ],
    accent: '#a78bfa',
    logo: '/modlab.jpg',
    photos: [] as Photo[],
  },
  {
    company: 'Stony Brook University',
    role: 'Simons Summer Research Intern',
    location: 'Stony Brook, NY',
    period: 'Jun 2024 – Aug 2024',
    badge: 'Research',
    badgeColor: 'green',
    bullets: [
      'Published co-author research in Langmuir by executing 3,600 ns of atomistic molecular dynamics simulations (LAMMPS/CHARMM36) to quantify PFAS-membrane insertion energetics; discovered that a −9.0 to −17.2 kT free energy gradient drives deep membrane penetration, identifying a critical mechanism for "forever chemical" bioaccumulation',
    ],
    accent: '#34d399',
    logo: '/stonybrook.png',
    photos: [] as Photo[],
  },
]

const professional = [
  {
    company: 'SpaceX',
    role: 'Raptor Tooling & Automation Engineering Intern',
    location: 'Hawthorne, CA',
    period: 'May 2026 – Aug 2026',
    badge: 'Incoming',
    badgeColor: 'blue',
    bullets: [
      'Automating manufacturing and test processes for the Raptor engine program using PLC and controls systems',
    ],
    accent: '#4f8ef7',
    logo: '/spacex.jpg',
    logoScale: 1.5,
    photos: [] as Photo[],
  },
  {
    company: 'Venture Lab · Stealth AI/Healthtech Startup',
    role: 'LLM Operations Intern',
    location: 'Philadelphia, PA',
    period: 'Sep 2025 – Dec 2025',
    badge: 'Internship',
    badgeColor: 'purple',
    bullets: [
      'Collaborated with an AI / Healthtech startup in stealth at Venture Labs, contributing to a real-time health analytics platform',
      'Developed features using React Native, Supabase, and FastAPI; integrated ML-powered insight generation to automatically analyze user symptom data and deliver personalized health patterns in under 3 seconds',
    ],
    accent: '#f97316',
    logo: '/venturelab.jpg',
    photos: [] as Photo[],
  },
  {
    company: 'Syracuse University · College of Engineering',
    role: 'Robotics Systems Engineering Intern',
    location: 'Syracuse, NY',
    period: 'Jun 2025 – Aug 2025',
    badge: 'Engineering',
    badgeColor: 'purple',
    bullets: [
      'Created a custom hexacopter SAR platform by integrating a PulsON 440 radar with a Pixhawk flight stack and Raspberry Pi; optimized powertrain for 20% increase in flight stability during autonomous data collection',
      'Developed Python signal processing pipelines implementing backprojection and motion compensation, achieving sub-10cm resolution and 40% reduction in image reconstruction latency',
    ],
    accent: '#8b5cf6',
    logo: '/syracuse.png',
    photos: [] as Photo[],
  },
  {
    company: 'MIT Lincoln Labs',
    role: 'Beaver Works Autonomous Racecar · Team Captain',
    location: 'Cambridge, MA',
    period: 'Jun 2023 – Aug 2023',
    badge: '🥇 1st Place',
    badgeColor: 'cyan',
    bullets: [
      'Led 5-student team to 1st place internationally by programming a 1/10-scale autonomous vehicle through a 9-section obstacle course',
      'Developed Python-based autonomous stack with LIDAR/IMU fusion and OpenCV-based AR recognition; PID control system achieving sub-100ms obstacle response and zero-collision performance',
    ],
    accent: '#22d3ee',
    logo: '/MIT.png',
    photos: [] as Photo[],
  },
]

const badgeStyles: Record<string, string> = {
  blue:   'bg-blue-500/12 text-blue-400/80 border-blue-500/20',
  purple: 'bg-purple-500/12 text-purple-400/80 border-purple-500/20',
  cyan:   'bg-cyan-500/12 text-cyan-400/80 border-cyan-500/20',
  amber:  'bg-amber-500/12 text-amber-400/80 border-amber-500/20',
  green:  'bg-emerald-500/12 text-emerald-400/80 border-emerald-500/20',
}

type Item = typeof professional[number]

function ExperienceCard({ item, index }: { item: Item; index: number }) {
  const [lightbox, setLightbox] = useState<{ src: string; caption?: string } | null>(null)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.65, delay: index * 0.1, ease: [0.33, 1, 0.68, 1] }}
        className="relative pl-8 pb-12 last:pb-0"
      >
        {/* Timeline line */}
        <div
          className="absolute left-0 top-1.5 w-[1px] bottom-0"
          style={{ background: `linear-gradient(to bottom, ${item.accent}40 0%, transparent 100%)` }}
        />
        {/* Timeline dot */}
        <div
          className="absolute left-[-3.5px] top-[5px] w-[8px] h-[8px] rounded-full border"
          style={{
            background: `${item.accent}25`,
            borderColor: `${item.accent}80`,
            boxShadow: `0 0 10px ${item.accent}30`,
          }}
        />

        <div className="glass rounded-2xl p-6 hover:border-white/12 hover:bg-white/[0.03] transition-all duration-400">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-start gap-3">
              {item.logo && (
                <div className="shrink-0 w-16 h-16 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center overflow-hidden mt-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.logo} alt={item.company} className="w-14 h-14 object-contain" style={item.logoScale ? { transform: `scale(${item.logoScale})` } : undefined} />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <h3 className="font-display font-bold text-base" style={{ color: item.accent }}>
                    {item.company}
                  </h3>
                </div>
                <p className="text-sm font-medium text-white/65">{item.role}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-white/28 font-medium">{item.location}</p>
              <p className="text-xs text-white/22 mt-0.5">{item.period}</p>
            </div>
          </div>

          <ul className="space-y-2.5">
            {item.bullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-[13px] text-white/40 leading-relaxed">
                <span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: item.accent }} />
                {b}
              </li>
            ))}
          </ul>

          {item.photos.length > 0 && (
            <div className="mt-5 pt-5 border-t border-white/5">
              <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/22 mb-3">Photos</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {item.photos.map((raw, i) => {
                  const p = toPhoto(raw)
                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setLightbox(p)}
                      className="relative shrink-0 w-36 h-24 rounded-xl overflow-hidden border border-white/8 hover:border-white/20 transition-colors duration-300 group"
                      style={{ boxShadow: `0 0 20px ${item.accent}15` }}
                    >
                      <Image src={p.src} alt={p.caption ?? `${item.company} photo ${i + 1}`} fill className="object-cover" />
                      {p.caption && (
                        <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <p className="text-[10px] text-white/90 leading-tight truncate">{p.caption}</p>
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
              className="relative max-w-4xl rounded-2xl overflow-hidden border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={lightbox.src} alt={lightbox.caption ?? 'Photo'} width={1200} height={800} className="object-contain max-h-[80vh]" />
              {lightbox.caption && (
                <div className="px-5 py-3 bg-black/60 border-t border-white/8">
                  <p className="text-sm text-white/75 text-center">{lightbox.caption}</p>
                </div>
              )}
            </motion.div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white text-2xl leading-none transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

type Tab = 'professional' | 'research'

export default function Experience() {
  const [tab, setTab] = useState<Tab>('professional')

  return (
    <section id="experience" className="py-28 md:py-36 px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-10"
        >
          <div className="h-px w-8 bg-gradient-to-r from-blue-500/0 to-blue-500/70" />
          <span className="text-xs font-semibold tracking-[0.22em] text-blue-400/65 uppercase">Experience</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.05 }}
          className="font-display text-4xl md:text-5xl font-bold mb-10"
        >
          Where I've <span className="text-gradient">worked</span>
        </motion.h2>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="flex gap-1 p-1 rounded-xl glass-md w-fit mb-12"
        >
          {(['professional', 'research'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 capitalize ${
                tab === t ? 'text-white' : 'text-white/35 hover:text-white/60'
              }`}
            >
              {tab === t && (
                <motion.div
                  layoutId="exp-tab-indicator"
                  className="absolute inset-0 rounded-lg bg-white/8 border border-white/10"
                />
              )}
              <span className="relative z-10">{t}</span>
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            {(tab === 'professional' ? professional : research).map((item, i) => (
              <ExperienceCard key={item.company + item.role} item={item} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
