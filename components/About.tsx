'use client'

import { motion } from 'framer-motion'
import { Cpu, Bot, CircuitBoard, Settings2 } from 'lucide-react'

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

const courses = [
  'Signal & Information Processing',
  'Engineering Electromagnetics',
  'Multivariable Calc & Linear Algebra',
  'Circuits & Systems Fundamentals',
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, delay, ease: [0.33, 1, 0.68, 1] },
})

export default function About() {
  return (
    <section id="about" className="py-28 md:py-36 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-3 mb-16">
          <div className="h-px w-8 bg-gradient-to-r from-blue-500/0 to-blue-500/70" />
          <span className="text-xs font-semibold tracking-[0.22em] text-blue-400/65 uppercase">About</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-start">
          {/* Left col */}
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
                  <p className="text-white/60 font-semibold text-sm mt-0.5">May 2029</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-5">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/22 uppercase mb-3">
                  Relevant Coursework
                </p>
                <div className="flex flex-wrap gap-2">
                  {courses.map((c) => (
                    <span
                      key={c}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-white/4 text-white/38 border border-white/6"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right col — skill cards */}
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
                    style={{
                      background: `${s.accent}15`,
                      borderColor: `${s.accent}30`,
                    }}
                  >
                    <Icon size={17} style={{ color: s.accent }} />
                  </div>
                  <p className="text-sm font-semibold text-white/65 leading-snug mb-1.5">{s.label}</p>
                  <p className="text-xs text-white/28 leading-relaxed">{s.sub}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
