'use client'

import { useEffect, useRef } from 'react'

// ─── Shaders ───────────────────────────────────────────────────────────────

const VERT = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`

const FRAG = /* glsl */ `
  precision mediump float;

  uniform vec2  uMouse;
  uniform float uTime;
  uniform float uAspect;
  uniform float uRadius;   /* lens radius, aspect-corrected */

  varying vec2 vUv;

  /* ── Noise ── */
  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 43.21);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = p - i;
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),               hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p  = p * 2.1 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  /* ── Procedural background ── */
  vec3 bg(vec2 uv) {
    /* base near-black */
    vec3 col = vec3(0.038, 0.038, 0.042);

    /* slow-drifting colour blobs */
    vec2 b1 = vec2(0.18 + sin(uTime * 0.29) * 0.13,
                   0.72 + cos(uTime * 0.23) * 0.11);
    float d1 = length((uv - b1) * vec2(uAspect, 1.0));
    col += vec3(0.04, 0.13, 0.45) * exp(-d1 * d1 * 5.5);

    vec2 b2 = vec2(0.78 + cos(uTime * 0.17) * 0.09,
                   0.32 + sin(uTime * 0.21) * 0.14);
    float d2 = length((uv - b2) * vec2(uAspect, 1.0));
    col += vec3(0.20, 0.05, 0.38) * exp(-d2 * d2 * 6.5);

    vec2 b3 = vec2(0.50 + sin(uTime * 0.11) * 0.20,
                   0.18 + cos(uTime * 0.14) * 0.09);
    float d3 = length((uv - b3) * vec2(uAspect, 1.0));
    col += vec3(0.02, 0.11, 0.26) * exp(-d3 * d3 * 7.0);

    /* slow travelling fourth blob for depth */
    vec2 b4 = vec2(0.42 + cos(uTime * 0.08) * 0.28,
                   0.58 + sin(uTime * 0.10) * 0.22);
    float d4 = length((uv - b4) * vec2(uAspect, 1.0));
    col += vec3(0.06, 0.04, 0.22) * exp(-d4 * d4 * 4.5);

    /* subtle high-frequency grain for tactile texture */
    float n = fbm(uv * 7.0 + uTime * 0.025);
    col += vec3(n * 0.018);

    return col;
  }

  /* ── Chromatic lens distortion ── */
  vec3 lensColor(vec2 uv, vec2 dir, float strength) {
    /* R, G, B refract at slightly different angles — classic aberration */
    float ab = strength * 0.38;
    vec2 uvR = uv + dir * (strength + ab);
    vec2 uvG = uv + dir *  strength;
    vec2 uvB = uv + dir * (strength - ab);
    return vec3(bg(uvR).r, bg(uvG).g, bg(uvB).b);
  }

  void main() {
    vec2 uv = vUv;

    /* aspect-corrected distance from mouse */
    vec2  diff = (uv - uMouse) * vec2(uAspect, 1.0);
    float dist = length(diff);
    vec2  dir  = diff / (dist + 1e-5);   /* unit vector from mouse */

    float R     = uRadius;
    float edge  = R * 1.12;  /* fade-in/out band outside the core lens */

    if (dist > edge) {
      /* outside the effect entirely — pure background */
      gl_FragColor = vec4(bg(uv), 1.0);
      return;
    }

    float t = dist / R;   /* 0 = cursor centre, 1 = lens rim */

    /* ── Distortion profile ────────────────────────────────────────────
       sin(t·π) peaks at t=0.5 and is 0 at the centre and rim.
       This creates a smooth ripple / liquid-glass warp.                 */
    float warp = sin(t * 3.14159) * 0.072;

    /* Add a secondary ripple for "liquid" character */
    float ripple = sin(t * 3.14159 * 2.3 + uTime * 0.8) * 0.008 * (1.0 - t);
    warp += ripple;

    vec3 color = lensColor(uv, dir, warp);

    /* ── Frosted-glass interior brightening ──────────────────────────── */
    float frost = (1.0 - smoothstep(0.0, 0.7, t)) * 0.055;
    color += vec3(0.10, 0.14, 0.24) * frost;

    /* ── Caustic highlight at cursor centre ─────────────────────────── */
    float caustic = 1.0 - smoothstep(0.0, 0.18, t);
    color += vec3(0.14, 0.20, 0.40) * caustic * 0.55;

    /* ── Fresnel edge ring ───────────────────────────────────────────── */
    float ring = smoothstep(0.72, 0.92, t) * smoothstep(1.05, 0.86, t * (R / edge));
    color += vec3(0.18, 0.26, 0.52) * ring * 0.75;

    /* ── Chromatic aberration ONLY near the edge ─────────────────────── */
    float aberEdge = smoothstep(0.55, 1.0, t);
    vec2 uvRe = uv + dir * (warp + aberEdge * 0.022);
    vec2 uvBe = uv + dir * (warp - aberEdge * 0.018);
    color.r = mix(color.r, bg(uvRe).r, aberEdge * 0.65);
    color.b = mix(color.b, bg(uvBe).b, aberEdge * 0.65);

    /* ── Outer fade so the lens blends smoothly into background ─────── */
    float outerFade = 1.0 - smoothstep(R, edge, dist);
    color = mix(bg(uv), color, outerFade);

    gl_FragColor = vec4(color, 1.0);
  }
`

// ─── WebGL helpers ─────────────────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('Shader error:', gl.getShaderInfoLog(sh))
  }
  return sh
}

function buildProgram(gl: WebGLRenderingContext): WebGLProgram {
  const prog = gl.createProgram()!
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  return prog
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function LiquidGlassCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    /* canvas setup */
    const canvas = document.createElement('canvas')
    Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })
    wrap.appendChild(canvas)

    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
    if (!gl) { canvas.remove(); return }

    const prog = buildProgram(gl)
    gl.useProgram(prog)

    /* fullscreen quad */
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    /* uniform locations */
    const uMouse  = gl.getUniformLocation(prog, 'uMouse')
    const uTime   = gl.getUniformLocation(prog, 'uTime')
    const uAspect = gl.getUniformLocation(prog, 'uAspect')
    const uRadius = gl.getUniformLocation(prog, 'uRadius')

    /* state */
    const mouse  = { x: 0.5, y: 0.5 }          /* smoothed */
    const target = { x: -2.0, y: 0.5 }          /* real – start off-screen */
    const t0 = performance.now()
    let raf: number

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const w = wrap.offsetWidth
      const h = wrap.offsetHeight
      canvas.width  = w * dpr()
      canvas.height = h * dpr()
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform1f(uAspect, w / h)
      /* radius ≈ 17% of height, in aspect-corrected uv space */
      gl.uniform1f(uRadius, 0.17)
    }

    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect()
      target.x = (e.clientX - r.left)  / r.width
      target.y = 1.0 - (e.clientY - r.top) / r.height
    }

    /* touch support */
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      const r = wrap.getBoundingClientRect()
      target.x = (t.clientX - r.left) / r.width
      target.y = 1.0 - (t.clientY - r.top) / r.height
    }

    const render = () => {
      /* lerp mouse so it trails smoothly */
      const lerpSpeed = 0.09
      mouse.x += (target.x - mouse.x) * lerpSpeed
      mouse.y += (target.y - mouse.y) * lerpSpeed

      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.uniform1f(uTime, (performance.now() - t0) / 1000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    render()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onTouch)
      gl.deleteProgram(prog)
      canvas.remove()
    }
  }, [])

  return <div ref={wrapRef} className="absolute inset-0" />
}
