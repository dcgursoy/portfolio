'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

// Use a plain string for no caption:   '/naviglass-1.jpg'
// Use an object for a caption:         { src: '/naviglass-1.jpg', caption: 'Prototype v2' }
type Photo = string | { src: string; caption?: string }
const toPhoto = (p: Photo) => typeof p === 'string' ? { src: p, caption: undefined } : p

const projects = [
  {
    id: 'naviglass',
    title: 'NaviGlass',
    subtitle: 'AI-powered Assistive Wearable for the Visually Impaired',
    period: 'Nov 2025 – Dec 2025',
    description:
      'A full-stack wearable system that uses computer vision to give real-time environmental awareness to visually impaired users — at 72% lower cost than commercial alternatives.',
    longDescription:
      'Integrated YOLO11n computer vision on Raspberry Pi 4 to detect 80+ object classes (vehicles, pedestrians, obstacles) with real-time processing. Developed a multi-modal feedback system combining 6-motor proximity-aware haptic array, AI text-to-speech narration, and Bluetooth connectivity — all housed in a custom 3D-printed SOLIDWORKS enclosure at just $83 total cost vs $300+ commercial alternatives.',
    tags: ['YOLO11n', 'Raspberry Pi 4', 'OpenCV', 'Python', 'TTS', 'Haptics', 'SOLIDWORKS', 'Bluetooth'],
    accent: '#4f8ef7',
    accentAlt: '#22d3ee',
    stats: [
      { label: 'Object Classes', value: '80+' },
      { label: 'Total Cost', value: '$83' },
      { label: 'vs Commercial', value: '−72%' },
    ],
    visual: 'eye',
    photos: [] as Photo[],
    link: { label: 'View on Devpost', href: 'https://devpost.com/software/naviglass', icon: 'external' },
  },
  {
    id: 'fpga-trading',
    title: 'FPGA-Accelerated Algorithmic Trading Agent',
    subtitle: 'Deep Reinforcement Learning + Hardware Inference',
    period: 'Jun 2025 – Jul 2025',
    description:
      'A high-frequency trading agent combining DRL with FPGA-accelerated inference — slashing latency from 316μs to ~2μs while achieving a 36.4% ROI in backtesting.',
    longDescription:
      'Designed a Deep Reinforcement Learning-based HFT agent using PPO (Proximal Policy Optimization) with multi-layer perceptrons, achieving a 36.4% ROI and 0.78 Sharpe Ratio in backtesting. Accelerated inference using HLS-based C++ compiled to FPGA hardware, reducing per-decision latency from 316μs (CPU) to ~2μs — a 158× speedup enabling true microsecond-grade execution.',
    tags: ['DRL / PPO', 'FPGA / HLS', 'C++', 'Python', 'PyTorch', 'Quantitative Finance', 'HFT'],
    accent: '#8b5cf6',
    accentAlt: '#4f8ef7',
    stats: [
      { label: 'ROI (Backtesting)', value: '36.4%' },
      { label: 'Sharpe Ratio', value: '0.78' },
      { label: 'Latency Reduction', value: '158×' },
    ],
    visual: 'chart',
    photos: [] as Photo[],
    link: { label: 'View Code', href: 'https://github.com/dcgursoy/fpga_trading_agent', icon: 'github' },
  },
  {
    id: 'hexacopter-sar',
    title: 'Hexacopter SAR Platform',
    subtitle: 'Custom Synthetic Aperture Radar UAV System',
    period: 'Jun – Aug 2025 · Syracuse University',
    description:
      'A fully custom hexacopter platform integrating a PulsON 440 radar for synthetic aperture radar imaging, achieving sub-10cm resolution with autonomous flight.',
    longDescription:
      'Designed and built a custom hexacopter integrating a PulsON 440 radar with a Pixhawk flight stack and Raspberry Pi compute module. Optimized powertrain achieving a 20% increase in flight stability during autonomous data collection missions. Developed Python signal processing pipelines implementing backprojection and motion compensation algorithms, achieving sub-10cm resolution and 40% reduction in image reconstruction latency.',
    tags: ['SAR', 'PulsON 440', 'Pixhawk', 'Raspberry Pi', 'Python', 'Signal Processing', 'UAV', 'Backprojection'],
    accent: '#22d3ee',
    accentAlt: '#10b981',
    stats: [
      { label: 'Resolution', value: '<10cm' },
      { label: 'Stability Gain', value: '+20%' },
      { label: 'Latency Saved', value: '40%' },
    ],
    visual: 'drone',
    photos: [
      { src: '/hexacopter-1.JPEG' },
      { src: '/hexacopter-2.JPEG' },
      { src: '/hexacopter-3.JPEG' },
    ] as Photo[],
    link: null,
  },
  {
    id: 'autonomous-racecar',
    title: 'Autonomous Racecar Stack',
    subtitle: 'MIT Beaver Works · International Grand Prix',
    period: 'Jun – Aug 2023 · MIT Lincoln Labs',
    description:
      'Led a team to 1st place internationally, building a fully autonomous 1/10-scale vehicle with LIDAR/IMU fusion and real-time obstacle avoidance on a 9-section course.',
    longDescription:
      'As Team Captain, led a 5-student team to first place at MIT\'s Beaver Works Autonomous Racecar Grand Prix. Designed and implemented a Python-based autonomous stack featuring LIDAR/IMU sensor fusion, OpenCV-based AR tag recognition for localization, and a PID control system achieving sub-100ms obstacle response and zero-collision performance across the entire 9-section obstacle course.',
    tags: ['Python', 'LIDAR', 'IMU Fusion', 'OpenCV', 'PID Control', 'ROS', 'AR Recognition', 'Autonomous Systems'],
    accent: '#f59e0b',
    accentAlt: '#ef4444',
    stats: [
      { label: 'Placement', value: '#1' },
      { label: 'Response Time', value: '<100ms' },
      { label: 'Collisions', value: '0' },
    ],
    visual: 'car',
    photos: [
      { src: '/racecar-1.png' },
      { src: '/racecar-2.png' },
    ] as Photo[],
    link: null,
  },
]

const VisualMap: Record<string, React.FC<{ accent: string; accentAlt: string }>> = {
  eye: ({ accent, accentAlt }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-60">
      <defs>
        <radialGradient id="g-eye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accentAlt} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="100" rx="90" ry="55" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.4" />
      <circle cx="100" cy="100" r="28" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="100" cy="100" r="10" fill={accent} fillOpacity="0.4" />
      {[30, 60, 90, 120, 150].map((a) => (
        <line key={a} x1="100" y1="100" x2={100 + 85 * Math.cos((a * Math.PI) / 180)} y2={100 + 85 * Math.sin((a * Math.PI) / 180)} stroke={accentAlt} strokeWidth="0.5" strokeOpacity="0.25" />
      ))}
    </svg>
  ),
  chart: ({ accent, accentAlt }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-60">
      <polyline points="10,160 40,130 70,140 100,80 130,90 160,40 190,50" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.7" />
      <polyline points="10,170 40,165 70,155 100,145 130,130 160,120 190,100" fill="none" stroke={accentAlt} strokeWidth="1" strokeOpacity="0.4" />
      {[40, 70, 100, 130, 160].map((x, i) => (
        <circle key={x} cx={x} cy={[130, 140, 80, 90, 40][i]} r="3" fill={accent} fillOpacity="0.7" />
      ))}
    </svg>
  ),
  drone: ({ accent, accentAlt }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-60">
      <circle cx="100" cy="100" r="18" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.7" />
      <circle cx="100" cy="100" r="6" fill={accent} fillOpacity="0.5" />
      {[0, 90, 180, 270].map((a) => {
        const rx = 100 + 40 * Math.cos((a * Math.PI) / 180)
        const ry = 100 + 40 * Math.sin((a * Math.PI) / 180)
        return (
          <g key={a}>
            <line x1="100" y1="100" x2={rx} y2={ry} stroke={accent} strokeWidth="1" strokeOpacity="0.3" />
            <ellipse cx={rx} cy={ry} rx="22" ry="8" fill="none" stroke={accentAlt} strokeWidth="1" strokeOpacity="0.5" transform={`rotate(${a},${rx},${ry})`} />
          </g>
        )
      })}
    </svg>
  ),
  car: ({ accent, accentAlt }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-60">
      <rect x="30" y="90" width="140" height="50" rx="12" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity="0.6" />
      <rect x="55" y="65" width="90" height="35" rx="8" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.4" />
      <circle cx="60" cy="148" r="14" fill="none" stroke={accentAlt} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="140" cy="148" r="14" fill="none" stroke={accentAlt} strokeWidth="1.5" strokeOpacity="0.6" />
      {[0, 45, 90, 135].map((a) => (
        <line key={a} x1="60" y1="148" x2={60 + 10 * Math.cos((a * Math.PI) / 180)} y2={148 + 10 * Math.sin((a * Math.PI) / 180)} stroke={accentAlt} strokeWidth="1" strokeOpacity="0.4" />
      ))}
      <line x1="20" y1="100" x2="5" y2="85" stroke={accent} strokeWidth="0.8" strokeOpacity="0.3" />
      <line x1="180" y1="100" x2="195" y2="85" stroke={accent} strokeWidth="0.8" strokeOpacity="0.3" />
    </svg>
  ),
}

function ProjectCard({ project, index }: { project: typeof projects[0]; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [lightbox, setLightbox] = useState<{ src: string; caption?: string } | null>(null)
  const Visual = VisualMap[project.visual]

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.33, 1, 0.68, 1] }}
      className="glass rounded-2xl overflow-hidden hover:border-white/12 transition-all duration-400 group"
      style={{ '--accent': project.accent } as React.CSSProperties}
    >
      {/* Visual header */}
      <div
        className="relative h-44 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${project.accent}0d 0%, ${project.accentAlt}0a 100%)`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(${project.accent}30 1px, transparent 1px), linear-gradient(90deg, ${project.accent}30 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-40 h-40">
            <Visual accent={project.accent} accentAlt={project.accentAlt} />
          </div>
        </div>

        {/* Period */}
        <div className="absolute top-4 right-4">
          <span className="text-[10px] font-medium text-white/30 tracking-wider">{project.period}</span>
        </div>

        {/* Glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at 50% 50%, ${project.accent}0d, transparent)`,
          }}
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3
            className="font-display font-bold text-xl mb-1"
            style={{ color: project.accent }}
          >
            {project.title}
          </h3>
          <p className="text-xs text-white/35 font-medium">{project.subtitle}</p>
        </div>

        <p className="text-[13px] text-white/45 leading-relaxed mb-5">{project.description}</p>

        {/* Stats row */}
        <div className="flex gap-6 mb-5 py-4 border-y border-white/5">
          {project.stats.map((s) => (
            <div key={s.label}>
              <p className="font-display font-bold text-base" style={{ color: project.accent }}>
                {s.value}
              </p>
              <p className="text-[10px] text-white/28 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <p className="text-[13px] text-white/42 leading-relaxed mb-5">{project.longDescription}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2.5 py-1 rounded-md font-medium border"
              style={{
                background: `${project.accent}0f`,
                borderColor: `${project.accent}25`,
                color: `${project.accent}cc`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold transition-colors duration-200"
            style={{ color: `${project.accent}99` }}
          >
            {expanded ? '↑ Show less' : '↓ Read more'}
          </button>

          {project.link && (
            <a
              href={project.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200 hover:bg-white/5"
              style={{
                color: `${project.accent}cc`,
                borderColor: `${project.accent}30`,
              }}
            >
              {project.link.icon === 'github' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {project.link.label}
            </a>
          )}
        </div>

        {project.photos.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/5">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/22 mb-3">Photos</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {project.photos.map((raw, i) => {
                const p = toPhoto(raw)
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setLightbox(p)}
                    className="relative shrink-0 w-36 h-24 rounded-xl overflow-hidden border border-white/8 hover:border-white/20 transition-colors duration-300 group"
                    style={{ boxShadow: `0 0 20px ${project.accent}15` }}
                  >
                    <Image src={p.src} alt={p.caption ?? `${project.title} photo ${i + 1}`} fill className="object-cover" />
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
    </motion.div>
  )
}

export default function Projects() {
  return (
    <section id="projects" className="py-28 md:py-36 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-10"
        >
          <div className="h-px w-8 bg-gradient-to-r from-blue-500/0 to-blue-500/70" />
          <span className="text-xs font-semibold tracking-[0.22em] text-blue-400/65 uppercase">Projects</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.05 }}
          className="font-display text-4xl md:text-5xl font-bold mb-4"
        >
          Things I've <span className="text-gradient-blue">built</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
