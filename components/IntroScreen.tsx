'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Film grain (canvas, 20fps, full-random) ───────────────────────────────
function FilmGrain() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = 384
    canvas.height = 384

    let id: ReturnType<typeof setInterval>
    const draw = () => {
      const img = ctx.createImageData(canvas.width, canvas.height)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0
        d[i] = d[i + 1] = d[i + 2] = v
        d[i + 3] = 22
      }
      ctx.putImageData(img, 0, 0)
    }
    draw()
    id = setInterval(draw, 48) // ~20fps
    return () => clearInterval(id)
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.32, mixBlendMode: 'screen' }}
    />
  )
}

// ─── Circular UI ───────────────────────────────────────────────────────────
function CircularUI({ phase }: { phase: string }) {
  const R = 110   // outer ring radius
  const C = 130   // viewBox center

  // dasharray for outer dashed ring
  const circumference = 2 * Math.PI * R
  const dash = circumference / 32

  return (
    <div className="relative" style={{ width: 260, height: 260 }}>
      <svg
        viewBox="0 0 260 260"
        width={260}
        height={260}
        className="absolute inset-0"
      >
        {/* Outermost rotating dashed ring */}
        <motion.circle
          cx={C} cy={C} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.6"
          strokeDasharray={`${dash * 0.5} ${dash * 1.5}`}
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: `${C}px ${C}px` }}
        />

        {/* Second ring — slow counter-rotate */}
        <motion.circle
          cx={C} cy={C} r={R - 14}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.4"
          strokeDasharray={`${dash} ${dash * 3}`}
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: `${C}px ${C}px` }}
        />

        {/* Pulsing solid ring */}
        <motion.circle
          cx={C} cy={C} r={R - 30}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.5"
          animate={{ opacity: [0.18, 0.45, 0.18] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Inner ring */}
        <circle
          cx={C} cy={C} r={24}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="0.5"
        />


        {/* Crosshair lines */}
        <line x1={C} y1={C - 20} x2={C} y2={C - 35} stroke="rgba(255,255,255,0.20)" strokeWidth="0.5" />
        <line x1={C} y1={C + 20} x2={C} y2={C + 35} stroke="rgba(255,255,255,0.20)" strokeWidth="0.5" />
        <line x1={C - 20} y1={C} x2={C - 35} y2={C} stroke="rgba(255,255,255,0.20)" strokeWidth="0.5" />
        <line x1={C + 20} y1={C} x2={C + 35} y2={C} stroke="rgba(255,255,255,0.20)" strokeWidth="0.5" />

        {/* Tick marks at 4 positions on outer ring */}
        {[0, 90, 180, 270].map((deg) => {
          const rad = (deg * Math.PI) / 180
          const x1 = C + (R - 4) * Math.cos(rad)
          const y1 = C + (R - 4) * Math.sin(rad)
          const x2 = C + (R + 5) * Math.cos(rad)
          const y2 = C + (R + 5) * Math.sin(rad)
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.30)" strokeWidth="0.7" />
        })}

        {/* 45° ticks — smaller */}
        {[45, 135, 225, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180
          const x1 = C + (R - 2) * Math.cos(rad)
          const y1 = C + (R - 2) * Math.sin(rad)
          const x2 = C + (R + 3) * Math.cos(rad)
          const y2 = C + (R + 3) * Math.sin(rad)
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
        })}

        {/* DG monogram */}
        <text
          x={C} y={C + 5}
          textAnchor="middle"
          fill="rgba(255,255,255,0.55)"
          fontSize="13"
          fontFamily="var(--font-space), sans-serif"
          fontWeight="600"
          letterSpacing="4"
        >
          DG
        </text>
      </svg>

      {/* Ambient glow behind circle */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ─── Corner label ──────────────────────────────────────────────────────────
function CornerLabel({
  children,
  position,
  delay = 0,
  show,
}: {
  children: React.ReactNode
  position: 'tl' | 'tr' | 'bl' | 'br'
  delay?: number
  show: boolean
}) {
  const posClass = {
    tl: 'top-6 left-6',
    tr: 'top-6 right-6 text-right',
    bl: 'bottom-6 left-6',
    br: 'bottom-6 right-6 text-right',
  }[position]

  return (
    <motion.div
      className={`absolute ${posClass} font-mono pointer-events-none`}
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.9, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ─── Micro label component ─────────────────────────────────────────────────
const Micro = ({ children, dim = false }: { children: React.ReactNode; dim?: boolean }) => (
  <span
    style={{
      display: 'block',
      fontSize: 11,
      letterSpacing: '0.18em',
      fontFamily: 'monospace',
      color: dim ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.58)',
      textTransform: 'uppercase',
      lineHeight: 1.8,
    }}
  >
    {children}
  </span>
)

// ─── Main intro component ─────────────────────────────────────────────────
type Phase = 'entering' | 'ready' | 'activating'

export default function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('entering')
  const [showLabels, setShowLabels] = useState(false)
  const [showCircle, setShowCircle] = useState(false)
  const [showEnter, setShowEnter] = useState(false)
  const [hoverEnter, setHoverEnter] = useState(false)
  const spotRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Staggered reveal
  useEffect(() => {
    const t1 = setTimeout(() => setShowCircle(true), 600)
    const t2 = setTimeout(() => setShowLabels(true), 1200)
    const t3 = setTimeout(() => setShowEnter(true),  1900)
    const t4 = setTimeout(() => setPhase('ready'),   2200)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  // Mouse spotlight
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!spotRef.current) return
      spotRef.current.style.background =
        `radial-gradient(500px circle at ${e.clientX}px ${e.clientY}px, rgba(255,255,255,0.022) 0%, transparent 65%)`
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const handleInitialize = useCallback(() => {
    if (phase !== 'ready') return
    setPhase('activating')
    setTimeout(onComplete, 1100)
  }, [phase, onComplete])

  // Current date for metadata
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '.')
  const timeStr = now.toTimeString().slice(0, 8)

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-[9000] bg-black overflow-hidden flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.025 }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Film grain */}
      <FilmGrain />

      {/* Mouse spotlight */}
      <div ref={spotRef} className="absolute inset-0 pointer-events-none" />

      {/* Very subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {/* Horizontal rule — top */}
      <motion.div
        className="absolute top-[72px] left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent)' }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: showLabels ? 1 : 0, opacity: showLabels ? 1 : 0 }}
        transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
      />

      {/* Horizontal rule — bottom */}
      <motion.div
        className="absolute bottom-[72px] left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent)' }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: showLabels ? 1 : 0, opacity: showLabels ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
      />

      {/* ── Corner labels ── */}
      <CornerLabel position="tl" show={showLabels} delay={0}>
        <Micro>SYS.INIT / 001</Micro>
        <Micro dim>PORTFOLIO OS</Micro>
      </CornerLabel>

      <CornerLabel position="tr" show={showLabels} delay={0.08}>
        <Micro>LAT 39.95°N / LON 75.18°W</Micro>
        <Micro dim>PHILADELPHIA, PA</Micro>
      </CornerLabel>

      <CornerLabel position="bl" show={showLabels} delay={0.14}>
        <Micro>DENIZ GURSOY / EE</Micro>
        <Micro dim>UPENN / CLASS 2029</Micro>
      </CornerLabel>

      <CornerLabel position="br" show={showLabels} delay={0.20}>
        <Micro>{dateStr} / {timeStr}</Micro>
        <Micro dim>UTC−05:00 / STANDBY</Micro>
      </CornerLabel>

      {/* ── Left edge label (rotated) ── */}
      <motion.div
        className="absolute left-6 top-1/2 pointer-events-none"
        style={{ transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showLabels ? 1 : 0 }}
        transition={{ duration: 0.9, delay: 0.25 }}
      >
        <Micro>INITIALIZED / STANDBY</Micro>
      </motion.div>

      {/* ── Right edge label (rotated) ── */}
      <motion.div
        className="absolute right-6 top-1/2 pointer-events-none"
        style={{ transform: 'translateY(-50%) rotate(90deg)', transformOrigin: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showLabels ? 1 : 0 }}
        transition={{ duration: 0.9, delay: 0.30 }}
      >
        <Micro>CONN.STATUS / NOMINAL</Micro>
      </motion.div>

      {/* ── Top center label ── */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: showLabels ? 1 : 0 }}
        transition={{ duration: 0.9, delay: 0.18 }}
      >
        <Micro>PORTFOLIO SYSTEM v1.0 — READY</Micro>
      </motion.div>

      {/* ── Bottom center label ── */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: showLabels ? 1 : 0 }}
        transition={{ duration: 0.9, delay: 0.22 }}
      >
        <Micro dim>ELEC.ENG / EMBEDDED SYS / ROBOTICS</Micro>
      </motion.div>

      {/* ── Center UI ── */}
      <div className="relative flex flex-col items-center gap-10">

        {/* Status row above circle */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: showLabels ? 1 : 0, y: showLabels ? 0 : 6 }}
          transition={{ duration: 0.8, delay: 0.05 }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-white"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.60)', textTransform: 'uppercase' }}>
            SYS.STATUS: NOMINAL
          </span>
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-white"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 1.25 }}
          />
        </motion.div>

        {/* Circular UI */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: showCircle ? 1 : 0, scale: showCircle ? 1 : 0.88 }}
          transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
        >
          <CircularUI phase={phase} />
        </motion.div>

        {/* INITIALIZE prompt */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: showEnter ? 1 : 0, y: showEnter ? 0 : 6 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          {/* Thin divider */}
          <motion.div
            className="w-16 h-px"
            style={{ background: 'rgba(255,255,255,0.10)' }}
            animate={{ scaleX: showEnter ? [0, 1] : 0 }}
            transition={{ duration: 0.6 }}
          />

          <button
            onClick={handleInitialize}
            onMouseEnter={() => setHoverEnter(true)}
            onMouseLeave={() => setHoverEnter(false)}
            disabled={phase !== 'ready'}
            className="group relative outline-none"
            style={{ cursor: phase === 'ready' ? 'pointer' : 'default' }}
          >
            {/* Bracket left */}
            <motion.span
              style={{
                fontFamily: 'monospace',
                fontSize: 16,
                letterSpacing: '0.20em',
                color: hoverEnter ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.80)',
                display: 'inline-block',
                transition: 'color 0.3s ease',
                userSelect: 'none',
              }}
              animate={{ x: hoverEnter ? -5 : 0 }}
              transition={{ duration: 0.3 }}
            >
              [
            </motion.span>

            {/* Label */}
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 16,
                letterSpacing: '0.28em',
                color: hoverEnter ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.75)',
                textTransform: 'uppercase',
                transition: 'color 0.3s ease',
                margin: '0 10px',
                userSelect: 'none',
              }}
            >
              INITIALIZE
            </span>

            {/* Bracket right */}
            <motion.span
              style={{
                fontFamily: 'monospace',
                fontSize: 16,
                letterSpacing: '0.20em',
                color: hoverEnter ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.80)',
                display: 'inline-block',
                transition: 'color 0.3s ease',
                userSelect: 'none',
              }}
              animate={{ x: hoverEnter ? 5 : 0 }}
              transition={{ duration: 0.3 }}
            >
              ]
            </motion.span>

            {/* Hover underline */}
            <motion.div
              className="absolute bottom-[-4px] left-0 right-0 h-px"
              style={{ background: 'rgba(255,255,255,0.25)' }}
              animate={{ scaleX: hoverEnter ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </button>

          {/* Sub-hint */}
          <motion.span
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              letterSpacing: '0.20em',
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase',
            }}
            animate={{ opacity: hoverEnter ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            PRESS TO ENTER SYSTEM
          </motion.span>
        </motion.div>
      </div>

      {/* ── Activating flash ── */}
      <AnimatePresence>
        {phase === 'activating' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.07, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, times: [0, 0.3, 1] }}
            style={{ background: 'white' }}
          />
        )}
      </AnimatePresence>

      {/* ── Thin scan line (ambient) ── */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.03)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  )
}
