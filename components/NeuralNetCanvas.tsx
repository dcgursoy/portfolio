'use client'

import { useEffect, useRef } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  activation: number   // 0–1, decays over time
  lastFired: number    // timestamp ms
  hue: number          // slight colour variety per node
}

interface Signal {
  from: number
  to: number
  t: number            // 0–1 travel progress
  speed: number
  intensity: number
}

interface Edge {
  a: number
  b: number
  dist: number
}

// ─── Constants ─────────────────────────────────────────────────────────────

const NODE_COUNT     = 68
const MAX_CONN_DIST  = 185          // px — max edge length
const MOUSE_RADIUS   = 140          // px — cursor influence
const DECAY          = 0.975        // activation decay per frame
const AUTO_FIRE_MS   = 550          // ms between random signal spawns
const FIRE_COOLDOWN  = 900          // ms between a node's own firings
const CACHE_INTERVAL = 45           // frames between edge re-computation

// ─── Component ─────────────────────────────────────────────────────────────

export default function NeuralNetCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let nodes:   Node[]   = []
    let edges:   Edge[]   = []
    let signals: Signal[] = []
    const mouse    = { x: -9999, y: -9999 }
    const prevMx   = { x: -9999, y: -9999 }
    let lastAutoFire = 0
    let frame = 0
    let raf: number

    // ── Init ──────────────────────────────────────────────────────────────
    const init = () => {
      nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
        x: Math.random() * canvas.width  / dpr,
        y: Math.random() * canvas.height / dpr,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 1.2,
        activation: 0,
        lastFired: -9999,
        hue: Math.random() > 0.7 ? 270 : 215,   // mostly blue, some purple
      }))
      signals = []
      buildEdges()
    }

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
      init()
    }

    // ── Edge cache ────────────────────────────────────────────────────────
    const buildEdges = () => {
      edges = []
      const W = canvas.width / dpr
      const H = canvas.height / dpr
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < MAX_CONN_DIST) edges.push({ a: i, b: j, dist: d })
        }
      }
    }

    // ── Signals ───────────────────────────────────────────────────────────
    const spawnSignal = (from: number, to: number, intensity: number) => {
      if (signals.some(s => s.from === from && s.to === to)) return
      signals.push({ from, to, t: 0, speed: 0.38 + Math.random() * 0.35, intensity })
    }

    const getNeighbours = (i: number): number[] =>
      edges.filter(e => e.a === i || e.b === i).map(e => e.a === i ? e.b : e.a)

    // ── Update ────────────────────────────────────────────────────────────
    const update = (ts: number) => {
      const W = canvas.width  / dpr
      const H = canvas.height / dpr

      // Rebuild edge cache periodically
      if (frame % CACHE_INTERVAL === 0) buildEdges()

      // Move nodes
      for (const n of nodes) {
        n.x += n.vx;  n.y += n.vy
        if (n.x < 0) n.x += W;  if (n.x > W) n.x -= W
        if (n.y < 0) n.y += H;  if (n.y > H) n.y -= H
        n.activation *= DECAY
      }

      // Mouse proximity — activate nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        const n  = nodes[i]
        const dx = n.x - mouse.x
        const dy = n.y - mouse.y
        const d  = Math.sqrt(dx * dx + dy * dy)
        if (d < MOUSE_RADIUS) {
          const boost = ((MOUSE_RADIUS - d) / MOUSE_RADIUS) ** 1.5
          n.activation = Math.min(1, n.activation + boost * 0.10)
        }
      }

      // Mouse velocity pulse — fast cursor movement excites nearby nodes
      const mvSpeed = Math.hypot(mouse.x - prevMx.x, mouse.y - prevMx.y)
      if (mvSpeed > 7) {
        for (let i = 0; i < nodes.length; i++) {
          const d = Math.hypot(nodes[i].x - mouse.x, nodes[i].y - mouse.y)
          if (d < MOUSE_RADIUS * 1.6)
            nodes[i].activation = Math.min(1, nodes[i].activation + 0.45 * (mvSpeed / 25))
        }
      }
      prevMx.x = mouse.x;  prevMx.y = mouse.y

      // Activated nodes fire signals to neighbours
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        if (n.activation > 0.28 && ts - n.lastFired > FIRE_COOLDOWN) {
          const nb = getNeighbours(i)
          if (nb.length) {
            const to = nb[Math.floor(Math.random() * nb.length)]
            spawnSignal(i, to, n.activation)
            n.lastFired = ts
          }
        }
      }

      // Background auto-fire — keeps network alive when idle
      if (ts - lastAutoFire > AUTO_FIRE_MS) {
        const i  = Math.floor(Math.random() * nodes.length)
        const nb = getNeighbours(i)
        if (nb.length) {
          const to = nb[Math.floor(Math.random() * nb.length)]
          spawnSignal(i, to, 0.25 + Math.random() * 0.35)
          nodes[i].activation = Math.max(nodes[i].activation, 0.3)
          lastAutoFire = ts
        }
      }

      // Advance signals and activate destination on arrival
      signals = signals.filter(s => {
        s.t += s.speed / 60
        if (s.t >= 1) {
          nodes[s.to].activation = Math.min(1, nodes[s.to].activation + s.intensity * 0.65)
          return false
        }
        return true
      })
    }

    // ── Draw ──────────────────────────────────────────────────────────────
    const draw = () => {
      const W = canvas.width  / dpr
      const H = canvas.height / dpr
      ctx.clearRect(0, 0, W, H)

      // ── Edges ──
      for (const e of edges) {
        const a   = nodes[e.a]
        const b   = nodes[e.b]
        const act = Math.max(a.activation, b.activation)
        const baseAlpha = ((MAX_CONN_DIST - e.dist) / MAX_CONN_DIST) * 0.065
        const alpha = baseAlpha + act * 0.09

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = `rgba(110, 165, 255, ${alpha})`
        ctx.lineWidth = 0.45
        ctx.stroke()
      }

      // ── Signals ──
      for (const s of signals) {
        const a  = nodes[s.from]
        const b  = nodes[s.to]
        const sx = a.x + (b.x - a.x) * s.t
        const sy = a.y + (b.y - a.y) * s.t

        // Brighten the carrying edge
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = `rgba(130, 195, 255, ${0.22 * s.intensity})`
        ctx.lineWidth = 0.9
        ctx.stroke()

        // Glow halo
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 9)
        g.addColorStop(0,   `rgba(170, 220, 255, ${0.85 * s.intensity})`)
        g.addColorStop(0.4, `rgba(120, 180, 255, ${0.35 * s.intensity})`)
        g.addColorStop(1,   'rgba(100, 150, 255, 0)')
        ctx.beginPath()
        ctx.arc(sx, sy, 9, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220, 240, 255, ${s.intensity})`
        ctx.fill()
      }

      // ── Nodes ──
      for (const n of nodes) {
        const act  = n.activation
        const alpha = 0.18 + act * 0.70

        // Activation glow
        if (act > 0.08) {
          const glowR = n.r + act * 10
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR)
          g.addColorStop(0, `hsla(${n.hue}, 80%, 72%, ${act * 0.45})`)
          g.addColorStop(1, `hsla(${n.hue}, 80%, 60%, 0)`)
          ctx.beginPath()
          ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2)
          ctx.fillStyle = g
          ctx.fill()
        }

        // Node core
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${n.hue}, 75%, 72%, ${alpha})`
        ctx.fill()
      }
    }

    // ── Loop ──────────────────────────────────────────────────────────────
    const loop = (ts: number) => {
      frame++
      update(ts)
      draw()
      raf = requestAnimationFrame(loop)
    }

    // ── Events ────────────────────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      const r  = canvas.getBoundingClientRect()
      mouse.x  = e.clientX - r.left
      mouse.y  = e.clientY - r.top
    }
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999 }

    const onClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      const cx = e.clientX - r.left
      const cy = e.clientY - r.top
      // Strong pulse on click
      for (let i = 0; i < nodes.length; i++) {
        const d = Math.hypot(nodes[i].x - cx, nodes[i].y - cy)
        if (d < MOUSE_RADIUS * 2)
          nodes[i].activation = Math.min(1, nodes[i].activation + 0.8 * (1 - d / (MOUSE_RADIUS * 2)))
      }
    }

    resize()
    loop(0)
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseleave', onLeave)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  )
}
