'use client'

import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: -200, y: -200 })
  const curPosRef = useRef({ x: -200, y: -200 })
  const rafRef = useRef<number>(0)
  const hoverRef = useRef(false)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
    }

    const setHover = (on: boolean) => {
      hoverRef.current = on
      if (on) {
        wrap.style.setProperty('--bracket-size', '7px')
        wrap.style.setProperty('--bracket-gap', '5px')
        wrap.style.setProperty('--bracket-color', 'rgba(96,165,250,0.95)')
        wrap.style.setProperty('--dot-opacity', '0')
        wrap.style.setProperty('--glow', '0 0 10px rgba(96,165,250,0.5)')
      } else {
        wrap.style.setProperty('--bracket-size', '10px')
        wrap.style.setProperty('--bracket-gap', '9px')
        wrap.style.setProperty('--bracket-color', 'rgba(255,255,255,0.65)')
        wrap.style.setProperty('--dot-opacity', '1')
        wrap.style.setProperty('--glow', 'none')
      }
    }

    // Initialize CSS variables
    setHover(false)

    const bindInteractive = () => {
      document.querySelectorAll('a, button, input, textarea, [role="button"]').forEach((el) => {
        el.addEventListener('mouseenter', () => setHover(true))
        el.addEventListener('mouseleave', () => setHover(false))
      })
    }

    const animate = () => {
      // Smooth lag — faster than a ring, still feels alive
      curPosRef.current.x += (posRef.current.x - curPosRef.current.x) * 0.18
      curPosRef.current.y += (posRef.current.y - curPosRef.current.y) * 0.18

      wrap.style.left = curPosRef.current.x + 'px'
      wrap.style.top = curPosRef.current.y + 'px'

      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    bindInteractive()
    animate()

    const observer = new MutationObserver(bindInteractive)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', onMove)
      observer.disconnect()
    }
  }, [])

  const bracketBorder = '1.5px solid var(--bracket-color)'
  const size = 'var(--bracket-size)'
  const gap = 'var(--bracket-gap)'

  // Each corner bracket is just two borders on a small div
  const corners = [
    { borderTop: bracketBorder, borderLeft: bracketBorder,  top: `calc(-${gap} - ${size})`, left: `calc(-${gap} - ${size})` },
    { borderTop: bracketBorder, borderRight: bracketBorder, top: `calc(-${gap} - ${size})`, right: `calc(-${gap} - ${size})` },
    { borderBottom: bracketBorder, borderLeft: bracketBorder,  bottom: `calc(-${gap} - ${size})`, left: `calc(-${gap} - ${size})` },
    { borderBottom: bracketBorder, borderRight: bracketBorder, bottom: `calc(-${gap} - ${size})`, right: `calc(-${gap} - ${size})` },
  ]

  return (
    <div
      ref={wrapRef}
      className="fixed top-0 left-0 z-[9999] pointer-events-none"
      style={{
        transform: 'translate(-50%, -50%)',
        willChange: 'left, top',
      }}
    >
      {/* Center dot — tiny, disappears on hover */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 3,
          height: 3,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.8)',
          opacity: 'var(--dot-opacity)',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* 4 corner brackets */}
      {corners.map((style, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 'var(--bracket-size)',
            height: 'var(--bracket-size)',
            boxShadow: 'var(--glow)',
            transition: 'width 0.25s ease, height 0.25s ease, top 0.25s ease, right 0.25s ease, bottom 0.25s ease, left 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
            ...style,
          }}
        />
      ))}
    </div>
  )
}
