'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NeuralNetCanvas from './NeuralNetCanvas'

const roles = [
  'Electrical Engineer',
  'Embedded Systems Developer',
  'Robotics Engineer',
  'Automation Engineer',
  'Autonomy Researcher',
]

const FIRST = 'Deniz'
const LAST = 'Gursoy'

export default function Hero() {
  const [roleIdx, setRoleIdx] = useState(0)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const id = setInterval(() => setRoleIdx((i) => (i + 1) % roles.length), 2800)
    return () => clearInterval(id)
  }, [])

  const scrollTo = useCallback((id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <section
      ref={heroRef}
      className="relative flex items-center justify-center overflow-hidden bg-[#0a0a0a]"
      style={{ minHeight: '100svh' }}
    >
      {/* Neural network background */}
      <NeuralNetCanvas />



      {/* Hero content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">

        {/* Name — "Hi, I'm" prefix + letter-by-letter name */}
        <h1 className="font-display font-bold leading-none tracking-[-0.02em] mb-8 select-none">

          {/* Greeting line */}
          <div className="flex justify-center items-baseline gap-[0.22em] mb-2"
            style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.6rem)' }}
          >
            {["Hi,", "I'm"].map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.12, ease: [0.33, 1, 0.68, 1] }}
                className="text-white/50 font-medium inline-block"
              >
                {word}
              </motion.span>
            ))}
          </div>

          {/* First name */}
          <div
            className="flex justify-center"
            style={{ fontSize: 'clamp(3.8rem, 11vw, 10rem)' }}
          >
            {FIRST.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 70 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.75,
                  delay: 0.42 + i * 0.065,
                  ease: [0.33, 1, 0.68, 1],
                }}
                className="text-white inline-block"
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Last name — gradient */}
          <div
            className="flex justify-center"
            style={{ fontSize: 'clamp(3.8rem, 11vw, 10rem)' }}
          >
            {LAST.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 70 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.75,
                  delay: 0.80 + i * 0.065,
                  ease: [0.33, 1, 0.68, 1],
                }}
                className="text-gradient-blue inline-block"
              >
                {char}
              </motion.span>
            ))}
          </div>
        </h1>

        {/* Animated role ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.35, duration: 0.6 }}
          className="h-7 overflow-hidden mb-7"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={roleIdx}
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -22, opacity: 0 }}
              transition={{ duration: 0.38, ease: 'easeInOut' }}
              className="text-base md:text-lg font-medium text-white/38 tracking-wide"
            >
              {roles[roleIdx]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Short bio */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.55, duration: 0.65 }}
          className="text-sm md:text-base text-white/32 max-w-lg mx-auto mb-12 leading-relaxed"
        >
          Building the physical layer of intelligent systems in embedded hardware, robotics, and deep tech
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.75, duration: 0.65 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <MagneticButton onClick={() => scrollTo('#clubs')} variant="primary">
            View Work
          </MagneticButton>
          <MagneticButton onClick={() => scrollTo('#contact')} variant="secondary">
            Get in Touch
          </MagneticButton>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
        onClick={() => scrollTo('#about')}
      >
        <span className="text-[9px] text-white/30 tracking-[0.3em] uppercase font-medium">Scroll</span>
        {/* Mouse shell */}
        <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-1.5">
          <motion.div
            className="w-0.5 h-1.5 rounded-full bg-white/50"
            animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

    </section>
  )
}

function MagneticButton({
  children,
  onClick,
  variant = 'primary',
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const onMove = (e: React.MouseEvent) => {
    const rect = btnRef.current!.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * 0.28
    const y = (e.clientY - rect.top - rect.height / 2) * 0.28
    setOffset({ x, y })
  }

  return (
    <motion.button
      ref={btnRef}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className={
        variant === 'primary'
          ? 'px-8 py-3 rounded-full text-sm font-semibold bg-white text-[#0a0a0a] hover:bg-white/93 active:scale-95 transition-all duration-150 shadow-[0_0_24px_rgba(255,255,255,0.1)]'
          : 'px-8 py-3 rounded-full text-sm font-semibold border border-white/16 text-white/55 hover:text-white/90 hover:border-white/35 hover:bg-white/4 transition-all duration-250'
      }
    >
      {children}
    </motion.button>
  )
}
