'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Bot, CircuitBoard, Settings2,
  Zap, Code2, Activity, Server, Lightbulb, Calculator, Atom, BarChart3,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

// ─── Skill cards ──────────────────────────────────────────────────────────────
const skills = [
  {
    icon: Cpu,
    label: 'Embedded Systems & Firmware',
    sub: 'Bare-metal C/C++, RTOS, microcontrollers, SPI/I²C/UART',
    accent: '#4f8ef7',
  },
  {
    icon: Bot,
    label: 'Robotics & Autonomous Systems',
    sub: 'LIDAR fusion, SLAM, ROS, autonomous navigation stacks',
    accent: '#22d3ee',
  },
  {
    icon: CircuitBoard,
    label: 'PCB & Hardware Design',
    sub: 'Altium Designer, signal integrity, analog front-ends',
    accent: '#8b5cf6',
  },
  {
    icon: Settings2,
    label: 'Controls & Automation',
    sub: 'PLC programming, PID, state machines, HMI',
    accent: '#10b981',
  },
]

// ─── Coursework ───────────────────────────────────────────────────────────────
const semesters = [
  {
    label: 'Fall 2025',
    courses: [
      { icon: Cpu,        code: 'ESE 1110',  name: 'Intro to Circuits, Signals & Embedded Systems',         accent: '#4f8ef7' },
      { icon: Calculator, code: 'Math 1410', name: 'Multivariable Calculus',                                accent: '#22d3ee' },
      { icon: Atom,       code: 'PHYS 0150', name: 'Principles of Physics I: Mechanics & Wave Motion',      accent: '#8b5cf6' },
    ],
  },
  {
    label: 'Spring 2026',
    courses: [
      { icon: Code2,      code: 'CIS 1200',  name: 'Programming Languages & Techniques I',                  accent: '#4f8ef7' },
      { icon: Zap,        code: 'ESE 1120',  name: 'Engineering Electromagnetics',                          accent: '#f59e0b' },
      { icon: BarChart3,  code: 'ESE 2030',  name: 'Linear Algebra with Applications to Engineering & AI',  accent: '#22d3ee' },
      { icon: Activity,   code: 'ESE 2240',  name: 'Signal and Information Processing',                     accent: '#8b5cf6' },
    ],
  },
  {
    label: 'Fall 2026',
    courses: [
      { icon: Server,      code: 'CIS 2400',  name: 'Computer Systems Architecture',                           accent: '#4f8ef7' },
      { icon: CircuitBoard,code: 'ESE 2150',  name: 'Electrical Circuits and Systems',                         accent: '#10b981' },
      { icon: Lightbulb,   code: 'ESE 2180',  name: 'Electronic, Photonic, and Electromechanical Devices',     accent: '#f59e0b' },
    ],
  },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, delay, ease: [0.33, 1, 0.68, 1] },
})

export default function About() {
  const [semIdx, setSemIdx] = useState(2)
  const dirRef = useRef(0) // -1 = left, 1 = right

  const go = (next: number) => {
    dirRef.current = next > semIdx ? 1 : -1
    setSemIdx(next)
  }

  const prev = () => semIdx > 0 && go(semIdx - 1)
  const next = () => semIdx < semesters.length - 1 && go(semIdx + 1)

  return (
    <section id="about" className="py-28 md:py-36 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-3 mb-16">
          <div className="h-px w-8 bg-gradient-to-r from-blue-500/0 to-blue-500/70" />
          <span className="text-xs font-semibold tracking-[0.22em] text-blue-400/65 uppercase">About</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-start">
          {/* ── Left col ── */}
          <div>
            <motion.h2
              {...fadeUp(0.05)}
              className="font-display text-4xl md:text-5xl font-bold leading-tight mb-8"
            >
              Building at the edge of{' '}
              <span className="text-gradient-blue">hardware & intelligence</span>
            </motion.h2>

            <motion.div {...fadeUp(0.12)} className="space-y-4 text-white/42 text-[15px] leading-[1.75]">
              <p>
                I'm a second-year Electrical Engineering student at the University of Pennsylvania focused on
                systems at the intersection of hardware, software, and autonomy.
              </p>
              <p>
                I've led an autonomous racecar team to 1st place internationally at MIT, designed EMG-driven
                prosthetics, and programmed PLCs for a hyperloop tunnel boring machine. I build things that
                move, sense, and decide.
              </p>
              <p>
                This summer I join SpaceX as a Raptor Tooling & Automation Engineering Intern, automating
                manufacturing and test processes for the Raptor engine.
              </p>
            </motion.div>

            {/* Education card */}
            <motion.div {...fadeUp(0.22)} className="mt-10 glass rounded-2xl p-6 hover:border-white/12 transition-colors duration-400">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center overflow-hidden mt-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/upenn.png" alt="UPenn" className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.22em] text-white/25 uppercase mb-1.5">Education</p>
                    <h3 className="font-display font-bold text-white text-[17px] leading-snug">
                      University of Pennsylvania
                    </h3>
                    <p className="text-white/40 text-sm mt-1">
                      School of Engineering and Applied Sciences
                    </p>
                    <p className="text-white/32 text-sm">B.S.E. · Electrical Engineering</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[10px] text-white/22 uppercase tracking-widest">Expected</p>
                  <p className="text-white/60 font-semibold text-sm mt-0.5">May 2028</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Right col ── */}
          <div className="flex flex-col gap-4">
            {/* Skill cards 2×2 */}
            <div className="grid grid-cols-2 gap-4">
              {skills.map((s, i) => {
                const Icon = s.icon
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.65, delay: 0.1 + i * 0.1, ease: [0.33, 1, 0.68, 1] }}
                    className="glass rounded-2xl p-6 cursor-default group hover:border-white/12 hover:bg-white/4 transition-all duration-400"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 border"
                      style={{ background: `${s.accent}15`, borderColor: `${s.accent}30` }}
                    >
                      <Icon size={17} style={{ color: s.accent }} />
                    </div>
                    <p className="text-sm font-semibold text-white/65 leading-snug mb-1.5">{s.label}</p>
                    <p className="text-xs text-white/28 leading-relaxed">{s.sub}</p>
                  </motion.div>
                )
              })}
            </div>

            {/* ── Coursework card ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, delay: 0.5, ease: [0.33, 1, 0.68, 1] }}
              className="glass rounded-2xl p-6 hover:border-white/12 transition-colors duration-400 overflow-hidden"
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-semibold tracking-[0.22em] text-white/25 uppercase">
                  Relevant Coursework
                </p>
                {/* Prev / Next arrows */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={prev}
                    disabled={semIdx === 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/8 bg-white/4 hover:bg-white/8 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronLeft size={14} className="text-white/50" />
                  </button>
                  <button
                    onClick={next}
                    disabled={semIdx === semesters.length - 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/8 bg-white/4 hover:bg-white/8 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronRight size={14} className="text-white/50" />
                  </button>
                </div>
              </div>

              {/* Semester tab pills */}
              <div className="flex gap-1.5 mb-5 flex-wrap">
                {semesters.map((sem, i) => (
                  <button
                    key={sem.label}
                    onClick={() => go(i)}
                    className={`relative px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      i === semIdx
                        ? 'text-white'
                        : 'text-white/30 hover:text-white/55'
                    }`}
                  >
                    {i === semIdx && (
                      <motion.div
                        layoutId="sem-tab"
                        className="absolute inset-0 rounded-lg bg-white/8 border border-white/10"
                        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                      />
                    )}
                    <span className="relative z-10">{sem.label}</span>
                  </button>
                ))}
              </div>

              {/* Sliding course list */}
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false} custom={dirRef.current}>
                  <motion.ul
                    key={semIdx}
                    custom={dirRef.current}
                    variants={{
                      enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
                      center:               ({ x: 0,        opacity: 1 }),
                      exit:  (dir: number) => ({ x: dir * -40, opacity: 0 }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.32, ease: [0.33, 1, 0.68, 1] }}
                    className="space-y-2.5"
                  >
                    {semesters[semIdx].courses.map((course) => {
                      const Icon = course.icon
                      return (
                        <li key={course.code} className="flex items-center gap-3">
                          <div
                            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border"
                            style={{ background: `${course.accent}15`, borderColor: `${course.accent}30` }}
                          >
                            <Icon size={13} style={{ color: course.accent }} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-white/45 mr-2">{course.code}</span>
                            <span className="text-sm text-white/35 leading-snug">{course.name}</span>
                          </div>
                        </li>
                      )
                    })}
                  </motion.ul>
                </AnimatePresence>
              </div>

              {/* Dot indicators */}
              <div className="flex gap-1.5 mt-5 justify-center">
                {semesters.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === semIdx ? 'w-4 h-1.5 bg-blue-400/60' : 'w-1.5 h-1.5 bg-white/15 hover:bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
