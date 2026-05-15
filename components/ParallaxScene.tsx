'use client'

import { useEffect, useRef } from 'react'

// ─── Scene element definitions ─────────────────────────────────────────────
// x/y are % of container. depth: 0 = barely moves, 1 = moves most.
// All elements get independent idle drift too (sin oscillation).

const BLOBS = [
  { id: 'b0', x: 12, y: 22, w: 560, h: 440, color: '#0f2a5e', depth: 0.06 },
  { id: 'b1', x: 72, y: 60, w: 480, h: 380, color: '#2a0e52', depth: 0.09 },
  { id: 'b2', x: 48, y: 78, w: 420, h: 330, color: '#073048', depth: 0.07 },
  { id: 'b3', x: 30, y: 10, w: 360, h: 280, color: '#1a0f40', depth: 0.05 },
]

const RINGS = [
  { id: 'r0', x: 80, y: 28, size: 480, stroke: 1,   color: 'rgba(79,142,247,0.10)',  depth: 0.11 },
  { id: 'r1', x: 16, y: 65, size: 380, stroke: 0.8, color: 'rgba(139,92,246,0.09)', depth: 0.14 },
  { id: 'r2', x: 55, y: 50, size: 300, stroke: 0.6, color: 'rgba(34,211,238,0.07)',  depth: 0.17 },
  { id: 'r3', x: 90, y: 70, size: 200, stroke: 0.5, color: 'rgba(79,142,247,0.06)',  depth: 0.20 },
]

const LINES = [
  { id: 'l0', x: 5,  y: 12, w: 140, angle:  32, depth: 0.19 },
  { id: 'l1', x: 85, y: 18, w: 110, angle: -22, depth: 0.21 },
  { id: 'l2', x: 60, y: 82, w: 160, angle:  15, depth: 0.18 },
  { id: 'l3', x: 2,  y: 52, w:  90, angle: -40, depth: 0.23 },
  { id: 'l4', x: 92, y: 48, w: 120, angle:  28, depth: 0.22 },
]

// Technical fragments drawn from Deniz's actual work
const LABELS = [
  { id: 'lbl0', x:  7, y: 17, text: 'PID',         opacity: 0.28, depth: 0.24 },
  { id: 'lbl1', x: 87, y: 76, text: 'LIDAR · IMU', opacity: 0.22, depth: 0.27 },
  { id: 'lbl2', x: 76, y: 14, text: 'FPGA',         opacity: 0.25, depth: 0.29 },
  { id: 'lbl3', x:  8, y: 80, text: '∇²φ = 0',      opacity: 0.20, depth: 0.22 },
  { id: 'lbl4', x: 90, y: 38, text: 'PPO',           opacity: 0.24, depth: 0.31 },
  { id: 'lbl5', x: 18, y: 50, text: 'EMG',           opacity: 0.22, depth: 0.26 },
  { id: 'lbl6', x: 62, y: 88, text: 'YOLO11n',       opacity: 0.20, depth: 0.28 },
  { id: 'lbl7', x: 42, y:  8, text: 'S7-1200',       opacity: 0.18, depth: 0.23 },
]

const HEXAGONS = [
  { id: 'h0', x: 83, y: 20, size: 58, color: 'rgba(79,142,247,0.13)',  depth: 0.33 },
  { id: 'h1', x:  9, y: 62, size: 44, color: 'rgba(139,92,246,0.11)',  depth: 0.36 },
  { id: 'h2', x: 52, y: 90, size: 36, color: 'rgba(34,211,238,0.10)',  depth: 0.40 },
]

const DIAMONDS = [
  { id: 'd0', x: 62, y:  9, size: 18, color: 'rgba(34,211,238,0.30)',   depth: 0.38 },
  { id: 'd1', x:  4, y: 38, size: 14, color: 'rgba(79,142,247,0.28)',   depth: 0.42 },
  { id: 'd2', x: 94, y: 56, size: 20, color: 'rgba(139,92,246,0.25)',   depth: 0.44 },
  { id: 'd3', x: 35, y: 92, size: 12, color: 'rgba(79,142,247,0.22)',   depth: 0.41 },
]

const DOTS = [
  { id: 'dot0', x: 28, y: 18, size: 4, color: '#60a5fa', depth: 0.50 },
  { id: 'dot1', x: 75, y: 68, size: 3, color: '#a78bfa', depth: 0.53 },
  { id: 'dot2', x: 50, y: 85, size: 5, color: '#22d3ee', depth: 0.48 },
  { id: 'dot3', x: 93, y: 30, size: 3, color: '#60a5fa', depth: 0.56 },
  { id: 'dot4', x:  5, y: 72, size: 4, color: '#a78bfa', depth: 0.51 },
  { id: 'dot5', x: 40, y:  5, size: 3, color: '#22d3ee', depth: 0.54 },
]

// Hexagon SVG path helper
function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')
}

// Per-element drift parameters (deterministic from id index)
function driftFor(index: number) {
  const seed = (index + 1) * 7.3
  return {
    fx: 0.22 + (seed % 0.18),
    fy: 0.18 + ((seed * 1.4) % 0.20),
    px: (seed * 2.1) % (Math.PI * 2),
    py: (seed * 0.9) % (Math.PI * 2),
    ax: 5 + (index % 5),
    ay: 4 + (index % 4),
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function ParallaxScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const lightRef     = useRef<HTMLDivElement>(null)
  const gridRef      = useRef<HTMLDivElement>(null)

  // One ref per element group
  const blobRefs    = useRef<(HTMLDivElement | null)[]>([])
  const ringRefs    = useRef<(HTMLDivElement | null)[]>([])
  const lineRefs    = useRef<(HTMLDivElement | null)[]>([])
  const labelRefs   = useRef<(HTMLDivElement | null)[]>([])
  const hexRefs     = useRef<(HTMLDivElement | null)[]>([])
  const diamondRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs     = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const mouse  = { x: 0.5, y: 0.5 }
    const target = { x: 0.5, y: 0.5 }
    const MAX    = 75   // max parallax shift (px) for depth=1
    let raf: number

    const onMove = (e: MouseEvent) => {
      const r  = container.getBoundingClientRect()
      target.x = (e.clientX - r.left) / r.width
      target.y = (e.clientY - r.top)  / r.height
    }

    function applyParallax(
      refs: React.MutableRefObject<(HTMLDivElement | null)[]>,
      items: { depth: number }[],
      t: number
    ) {
      items.forEach((el, i) => {
        const ref = refs.current[i]
        if (!ref) return
        const d = driftFor(i)
        const idleX = Math.sin(t * d.fx + d.px) * d.ax
        const idleY = Math.cos(t * d.fy + d.py) * d.ay
        const tx = (mouse.x - 0.5) * el.depth * MAX + idleX
        const ty = (mouse.y - 0.5) * el.depth * MAX + idleY
        ref.style.transform = `translate3d(${tx}px,${ty}px,0)`
      })
    }

    const render = (ts: number) => {
      const t = ts / 1000

      // Smooth mouse follow
      mouse.x += (target.x - mouse.x) * 0.055
      mouse.y += (target.y - mouse.y) * 0.055

      // Dynamic light plane — follows mouse closely
      if (lightRef.current) {
        const lx = mouse.x * 100
        const ly = mouse.y * 100
        lightRef.current.style.background =
          `radial-gradient(700px circle at ${lx}% ${ly}%, rgba(79,142,247,0.055) 0%, transparent 60%)`
      }

      // Grid shifts barely
      if (gridRef.current) {
        const gx = (mouse.x - 0.5) * 0.025 * MAX
        const gy = (mouse.y - 0.5) * 0.025 * MAX
        gridRef.current.style.transform = `translate3d(${gx}px,${gy}px,0)`
      }

      applyParallax(blobRefs,    BLOBS,    t)
      applyParallax(ringRefs,    RINGS,    t)
      applyParallax(lineRefs,    LINES,    t)
      applyParallax(labelRefs,   LABELS,   t)
      applyParallax(hexRefs,     HEXAGONS, t)
      applyParallax(diamondRefs, DIAMONDS, t)
      applyParallax(dotRefs,     DOTS,     t)

      raf = requestAnimationFrame(render)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-[#0a0a0a]">

      {/* ── Subtle background grid (barely moves) ── */}
      <div
        ref={gridRef}
        className="absolute inset-[-5%] will-change-transform"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* ── Blobs ── */}
      {BLOBS.map((b, i) => (
        <div
          key={b.id}
          className="absolute pointer-events-none"
          style={{ left: `${b.x}%`, top: `${b.y}%` }}
        >
          <div
            ref={r => { blobRefs.current[i] = r }}
            className="will-change-transform"
            style={{
              width: b.w, height: b.h,
              marginLeft: -b.w / 2, marginTop: -b.h / 2,
              borderRadius: '50%',
              background: `radial-gradient(ellipse at center, ${b.color} 0%, transparent 70%)`,
              filter: 'blur(55px)',
              opacity: 0.85,
            }}
          />
        </div>
      ))}

      {/* ── Rings ── */}
      {RINGS.map((r, i) => (
        <div
          key={r.id}
          className="absolute pointer-events-none"
          style={{ left: `${r.x}%`, top: `${r.y}%` }}
        >
          <div ref={el => { ringRefs.current[i] = el }} className="will-change-transform">
            <svg
              width={r.size} height={r.size}
              style={{ marginLeft: -r.size / 2, marginTop: -r.size / 2 }}
              viewBox={`0 0 ${r.size} ${r.size}`}
            >
              <circle
                cx={r.size / 2} cy={r.size / 2} r={r.size / 2 - 1}
                fill="none" stroke={r.color} strokeWidth={r.stroke}
              />
              {/* Inner ring for depth */}
              <circle
                cx={r.size / 2} cy={r.size / 2} r={r.size / 2 * 0.72}
                fill="none" stroke={r.color} strokeWidth={r.stroke * 0.4}
                strokeDasharray="4 18"
              />
            </svg>
          </div>
        </div>
      ))}

      {/* ── Lines ── */}
      {LINES.map((l, i) => (
        <div
          key={l.id}
          className="absolute pointer-events-none"
          style={{ left: `${l.x}%`, top: `${l.y}%` }}
        >
          <div ref={el => { lineRefs.current[i] = el }} className="will-change-transform">
            <div
              style={{
                width: l.w,
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(120,160,255,0.20), transparent)',
                transform: `rotate(${l.angle}deg)`,
                transformOrigin: 'center',
              }}
            />
          </div>
        </div>
      ))}

      {/* ── Technical labels ── */}
      {LABELS.map((lbl, i) => (
        <div
          key={lbl.id}
          className="absolute pointer-events-none"
          style={{ left: `${lbl.x}%`, top: `${lbl.y}%` }}
        >
          <div ref={el => { labelRefs.current[i] = el }} className="will-change-transform">
            <span
              style={{
                fontFamily: 'var(--font-space), monospace',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.18em',
                color: `rgba(200,220,255,${lbl.opacity})`,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                display: 'block',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {lbl.text}
            </span>
          </div>
        </div>
      ))}

      {/* ── Hexagons ── */}
      {HEXAGONS.map((h, i) => (
        <div
          key={h.id}
          className="absolute pointer-events-none"
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
        >
          <div ref={el => { hexRefs.current[i] = el }} className="will-change-transform">
            <svg
              width={h.size * 2} height={h.size * 2}
              style={{ marginLeft: -h.size, marginTop: -h.size }}
              viewBox={`0 0 ${h.size * 2} ${h.size * 2}`}
            >
              <polygon
                points={hexPoints(h.size, h.size, h.size - 1)}
                fill="none"
                stroke={h.color}
                strokeWidth="1"
              />
              <polygon
                points={hexPoints(h.size, h.size, (h.size - 1) * 0.6)}
                fill="none"
                stroke={h.color}
                strokeWidth="0.5"
              />
            </svg>
          </div>
        </div>
      ))}

      {/* ── Diamonds ── */}
      {DIAMONDS.map((d, i) => (
        <div
          key={d.id}
          className="absolute pointer-events-none"
          style={{ left: `${d.x}%`, top: `${d.y}%` }}
        >
          <div ref={el => { diamondRefs.current[i] = el }} className="will-change-transform">
            <div
              style={{
                width:  d.size,
                height: d.size,
                border: `1px solid ${d.color}`,
                transform: 'translate(-50%,-50%) rotate(45deg)',
              }}
            />
          </div>
        </div>
      ))}

      {/* ── Dots ── */}
      {DOTS.map((dot, i) => (
        <div
          key={dot.id}
          className="absolute pointer-events-none"
          style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
        >
          <div ref={el => { dotRefs.current[i] = el }} className="will-change-transform">
            <div
              style={{
                width: dot.size,
                height: dot.size,
                borderRadius: '50%',
                background: dot.color,
                transform: 'translate(-50%,-50%)',
                boxShadow: `0 0 ${dot.size * 3}px ${dot.color}`,
              }}
            />
          </div>
        </div>
      ))}

      {/* ── Dynamic light plane (follows mouse, no depth) ── */}
      <div
        ref={lightRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* ── Vignette edge darkening ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 85% 75% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)`,
        }}
      />
    </div>
  )
}
