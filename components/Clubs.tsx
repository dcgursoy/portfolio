'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

// ─── Photo type ───────────────────────────────────────────────────────────────
// Use a plain string for no caption:   '/hyperloop-1.jpg'
// Use an object for a caption:         { src: '/hyperloop-1.jpg', caption: 'TBM control panel' }
type Photo = string | { src: string; caption?: string }

const toPhoto = (p: Photo) => typeof p === 'string' ? { src: p, caption: undefined } : p

// ─── Data ─────────────────────────────────────────────────────────────────────
const clubs = [
  {
    company: 'Penn Hyperloop',
    role: 'Power & Controls Engineer',
    location: 'Philadelphia, PA',
    period: 'Sep 2025 – Present',
    badge: 'Active',
    badgeColor: 'amber',
    bullets: [
      'Upgraded 240V→480V three-phase AC system with 5+ VFDs controlling 15+ HP motors, enabling 300% greater power delivery for a 1,000-lb autonomous TBM that placed 2nd in The Boring Company\'s 2026 Not-a-Boring Competition',
      'Programmed Siemens S7-1200 PLC & ESP32 MCU with TIA Portal to implement autonomous drilling state machine with hardwired E-stops, software interlocks, and remote kill switch for <100ms fail-safe response',
      'Integrated VFDs & sensors into unified HMI using Modbus RTU, I2C, and Ethernet protocols for synchronized telemetry',
    ],
    accent: '#f59e0b',
    logo: '/pennhyperloop.jpg',
    photos: [
      { src: '/hyperloop-1.jpg', caption: 'VFDs' },
      { src: '/hyperloop-2.JPG', caption: 'PLC System' },
      { src: '/hyperloop-3.jpg'},
      { src: '/hyperloop-4.jpg'},
      { src: '/hyperloop-5.JPG'},
    ] as Photo[],
  },
  {
    company: 'Penn Assistive Devices & Prosthetic Technologies',
    role: 'Project Co-Lead',
    location: 'Philadelphia, PA',
    period: 'Sep 2025 – Present',
    badge: 'Active',
    badgeColor: 'green',
    bullets: [
      'Developed 8-channel EMG acquisition system with 24-bit ADCs & programmable gain amplifiers for prosthetic arm control; SPI-interfaced signal conditioning, dual voltage regulation, PCB schematics in Altium Designer',
      'Transitioning from H-bridge linear actuator to dual-servo architecture; implementing modular Raspberry Pi Pico interface for rapid prototyping and user-specific calibration',
    ],
    accent: '#10b981',
    logo: '/pennadapt.jpg',
    photos: [
      { src: '/adapt-1.png', caption: 'Sensor Schematic' },
      { src: '/adapt-4.png', caption: 'Sensor PCB' },
      { src: '/adapt-3.png', caption: 'Main PCB' },
    ] as Photo[],
  },
  {
    company: 'Penn IEEE',
    role: 'President',
    location: 'Philadelphia, PA',
    period: 'Jan 2026 – Present',
    badge: 'Active',
    badgeColor: 'blue',
    bullets: [
      'Leading 100+ member student chapter; organizing technical panels, industry speaker events, and local engineering competitions',
    ],
    accent: '#4f8ef7',
    logo: '/ieeepenn.png',
    photos: [
      { src: '/IEEE-1.JPG', caption: 'Penn Engineering Alumni Social' },
      { src: '/IEEE-2.JPG', caption: 'Guest Talk from Dr. Nader Engheta' },
      { src: '/IEEE-3.JPG', caption: 'Team Photo at IEEE Student Conference' },
    ] as Photo[],
  },
  {
    company: 'Penn Aerial Robotics',
    role: 'Electrical Hardware Engineer',
    location: 'Philadelphia, PA',
    period: 'Sep 2025 – Jan 2026',
    badge: 'Past',
    badgeColor: 'red',
    bullets: [
      'Designed custom STM32-based flight controller PCB in Altium Designer from scratch to optimize SWaP-C vs. commercial Pixhawk systems, targeting 50%+ cost reduction and 30% weight reduction for competition UAV platforms',
      'Engineered power management subsystem with voltage conversion from USB/battery to multiple rails (5V, 3.3V, 1.8V) and implemented dual memory modules, power sensing, and fail-safe systems for flight data logging',
    ],
    accent: '#f87171',
    logo: '/pennair.jpg',
    photos: [
      { src: '/pennair-1.png' },
      { src: '/pennair-2.png' },
      { src: '/pennair-3.png' },
    ] as Photo[],
  },
]

const badgeStyles: Record<string, string> = {
  blue:   'bg-blue-500/12 text-blue-400/80 border-blue-500/20',
  purple: 'bg-purple-500/12 text-purple-400/80 border-purple-500/20',
  cyan:   'bg-cyan-500/12 text-cyan-400/80 border-cyan-500/20',
  amber:  'bg-amber-500/12 text-amber-400/80 border-amber-500/20',
  red:    'bg-red-500/12 text-red-400/80 border-red-500/20',
  green:  'bg-emerald-500/12 text-emerald-400/80 border-emerald-500/20',
}

type Club = typeof clubs[number]

function ClubCard({ item, index }: { item: Club; index: number }) {
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
                  <img src={item.logo} alt={item.company} className="w-14 h-14 object-contain" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <h3 className="font-display font-bold text-base" style={{ color: item.accent }}>
                    {item.company}
                  </h3>
                  <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${badgeStyles[item.badgeColor]}`}>
                    {item.badge}
                  </span>
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

export default function Clubs() {
  return (
    <section id="clubs" className="py-28 md:py-36 px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-10"
        >
          <div className="h-px w-8 bg-gradient-to-r from-blue-500/0 to-blue-500/70" />
          <span className="text-xs font-semibold tracking-[0.22em] text-blue-400/65 uppercase">Clubs</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.05 }}
          className="font-display text-4xl md:text-5xl font-bold mb-12"
        >
          What I'm <span className="text-gradient">building</span>
        </motion.h2>

        <div>
          {clubs.map((item, i) => (
            <ClubCard key={item.company} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
