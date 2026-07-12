'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

type Photo = string | { src: string; caption?: string }
const toPhoto = (p: Photo) => typeof p === 'string' ? { src: p, caption: undefined } : p

type ProjectLink = { label: string; href: string; icon: 'github' | 'external' }

type Project = {
  id: string
  title: string
  subtitle: string
  period: string
  description: string
  longDescription: string
  tags: string[]
  accent: string
  accentAlt: string
  stats: { label: string; value: string }[]
  visual: string
  photos: Photo[]
  link: ProjectLink | null
  demoLink?: ProjectLink | null
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const projects: Project[] = [
  {
    id: 'systolic-mnist',
    title: 'INT8 Systolic Array DNN Accelerator',
    subtitle: 'Weight-Stationary PE Array in SystemVerilog · FPGA Synthesized',
    period: 'Jul 2026 · RTL Design',
    description:
      'A synthesized 4×4 systolic array executing end-to-end INT8 MNIST inference in RTL — bit-exact against a PyTorch golden model, with a live cycle-by-cycle browser visualizer.',
    longDescription:
      'Weight-stationary dataflow with skewed activation streaming and double-buffered weights using wavefront swap tokens for zero-bubble tile switching. Per-column INT32 accumulators with pipelined requantization support arbitrary tiled layer sizes. Verified with self-checking testbenches: all 2,000 INT32 logits and 9,600 hidden activations bit-exact across 200 test images. Synthesized with Yosys (10.9k gates for 4×4) and placed-and-routed on Lattice ECP5-85k at 65.1 MHz — 5,605 LUTs, 31 DSPs, 16 BRAMs. A JavaScript twin of the RTL validates frame-exact against Verilog trace data. Draw a digit live and watch the hardware classify it cycle by cycle.',
    tags: ['SystemVerilog', 'Systolic Array', 'FPGA', 'INT8 Quantization', 'PyTorch', 'Yosys', 'ECP5', 'Icarus Verilog', 'RTL Design'],
    accent: '#a78bfa',
    accentAlt: '#22d3ee',
    stats: [
      { label: 'Speedup (8×8 array)', value: '52×' },
      { label: 'INT8 Accuracy', value: '96.53%' },
      { label: 'Fmax on ECP5', value: '65 MHz' },
      { label: 'Logits Bit-Exact', value: '200/200' },
    ],
    visual: 'systolic',
    photos: [],
    link: { label: 'GitHub', href: 'https://github.com/dcgursoy/systolic-mnist', icon: 'github' },
    demoLink: { label: 'Live Demo', href: 'https://dcgursoy.github.io/systolic-mnist/viz/', icon: 'external' },
  },
  {
    id: 'mpc-quadrotor',
    title: 'Nonlinear MPC Quadrotor Controller',
    subtitle: 'Receding-Horizon Predictive Flight Through Moving Obstacles',
    period: 'Jul 2026 · Controls & Robotics',
    description:
      'A nonlinear Model Predictive Controller using CasADi/IPOPT that achieves 100% success across 3 obstacle courses with zero collisions — outperforming a tuned cascaded-PID baseline.',
    longDescription:
      'Implemented a receding-horizon MPC with N=20 stages at 75 ms intervals (1.5 s lookahead), resolved at 50 Hz via CasADi SX + IPOPT with primal/dual warm-starting. The controller encodes moving obstacle trajectories as future inequality constraints, enabling predictive path planning seconds ahead of contact — compared to the reactive PID baseline which responds only after near-contact. Both controllers operate on a shared 13-state quaternion rigid-body simulation (RK4 at 500 Hz). Achieved 4.8 ms mean solve time (p95: 11.1 ms) across 1,894 IPOPT solves. Includes matplotlib 3D animator with predicted-horizon ribbon and 33 validation tests.',
    tags: ['Python', 'CasADi', 'IPOPT', 'MPC', 'Control Theory', 'Quaternion Dynamics', 'RK4', 'Trajectory Optimization'],
    accent: '#f97316',
    accentAlt: '#facc15',
    stats: [
      { label: 'Course Success', value: '3 / 3' },
      { label: 'Collisions', value: '0' },
      { label: 'Mean Solve Time', value: '4.8 ms' },
      { label: 'Lookahead Horizon', value: '1.5 s' },
    ],
    visual: 'mpc',
    photos: [],
    link: { label: 'View on GitHub', href: 'https://github.com/dcgursoy/MPC_Predictive_System', icon: 'github' },
  },
  {
    id: 'cartscout',
    title: 'CartScout',
    subtitle: 'Safe RL Environment for Real-Browser Shopping Agents',
    period: 'Jul 2026 · YC HUD Frontier Hackathon',
    description:
      'Built an RL-trained browser agent that learns to extract buying-critical facts from real product pages and compress them into cited purchase recommendations, reducing reliance on expensive frontier model inference.',
    longDescription:
      'Built at the HUD Frontier / RSI RL Environments Hackathon, CartScout trains agents over real Chromium sessions via Chrome DevTools Protocol — not screenshots. A structured JSON action space (open_url, click_ref, extract_page, emit_packet) enables clean reward mapping for RL training. Agents are scored deterministically on constraint satisfaction and evidence citation quality, then refined with a Fireworks AI Qwen judge via GRPO. Each run produces a PurchasePacket — a structured JSON of product, price, delivery info, and cited evidence — with a hard stop-before-checkout safety boundary. Supports Claude, OpenAI, Ollama, and Fireworks AI backends.',
    tags: ['Reinforcement Learning', 'Claude API', 'HUD', 'Chromium CDP', 'GRPO', 'PyTorch', 'Playwright', 'FastAPI', 'Python'],
    accent: '#10b981',
    accentAlt: '#4f8ef7',
    stats: [
      { label: 'Reward Improvement', value: '3×' },
      { label: 'Constraint Accuracy', value: '90%' },
      { label: 'vs Frontier Speed', value: '4× faster' },
      { label: 'Inference Cost vs GPT-4o', value: '−70%' },
    ],
    visual: 'agent',
    photos: [],
    link: { label: 'View on AI Valley', href: 'https://www.aivalley.io/hackathons/hud-frontier-rsi-rl-environments-hackathon/projects/014a2d37-a6f7-4336-a1f0-09bce706d471', icon: 'external' },
  },
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
    photos: [],
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
    photos: [],
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
    ],
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
    ],
    link: null,
  },
]

// ─── Visuals ──────────────────────────────────────────────────────────────────
const VisualMap: Record<string, React.FC<{ accent: string; accentAlt: string }>> = {
  systolic: ({ accent, accentAlt }) => {
    const size = 22, gap = 9, step = 31
    const ox = 42.5, oy = 38.5
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-65">
        <defs>
          <radialGradient id="g-sys" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accentAlt} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="96" rx="70" ry="64" fill="url(#g-sys)" />

        {/* 4×4 PE grid */}
        {Array.from({ length: 16 }, (_, i) => {
          const row = Math.floor(i / 4), col = i % 4
          const x = ox + col * step, y = oy + row * step
          const diag = row + col
          return (
            <g key={i}>
              <rect x={x} y={y} width={size} height={size} rx="3"
                fill={accent} fillOpacity="0.08"
                stroke={accent} strokeWidth="0.8" strokeOpacity="0.45"
              >
                <animate attributeName="fill-opacity" values="0.08;0.28;0.08"
                  dur="2.4s" begin={`${diag * 0.3}s`} repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.45;0.9;0.45"
                  dur="2.4s" begin={`${diag * 0.3}s`} repeatCount="indefinite" />
              </rect>
              <text x={x + 11} y={y + 14} textAnchor="middle" fontSize="7.5"
                fill={accent} fillOpacity="0.65" fontFamily="monospace" fontWeight="bold">×+</text>
              {col < 3 && <line x1={x + size} y1={y + 11} x2={x + size + gap} y2={y + 11}
                stroke={accent} strokeWidth="0.6" strokeOpacity="0.28" />}
              {row < 3 && <line x1={x + 11} y1={y + size} x2={x + 11} y2={y + size + gap}
                stroke={accentAlt} strokeWidth="0.6" strokeOpacity="0.22" />}
            </g>
          )
        })}

        {/* Activation dots flowing → */}
        {Array.from({ length: 4 }, (_, row) => {
          const cy = oy + row * step + 11
          return (
            <circle key={`h${row}`} r="2.5" cy={cy} fill={accent}>
              <animate attributeName="cx" from="32" to="168" dur="2.2s" begin={`${row * 0.55}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.88;1" dur="2.2s" begin={`${row * 0.55}s`} repeatCount="indefinite" />
            </circle>
          )
        })}

        {/* Partial-sum dots flowing ↓ */}
        {Array.from({ length: 4 }, (_, col) => {
          const cx = ox + col * step + 11
          return (
            <circle key={`v${col}`} r="1.8" cx={cx} fill={accentAlt} fillOpacity="0.7">
              <animate attributeName="cy" from="28" to="164" dur="2.8s" begin={`${col * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.05;0.88;1" dur="2.8s" begin={`${col * 0.4}s`} repeatCount="indefinite" />
            </circle>
          )
        })}

        {/* Labels */}
        <text x="17" y={oy + 8}  fontSize="5.5" fill={accent}    fillOpacity="0.5" fontFamily="monospace" textAnchor="middle">ACT</text>
        <text x="17" y={oy + 16} fontSize="5.5" fill={accent}    fillOpacity="0.5" fontFamily="monospace" textAnchor="middle">→</text>
        <text x="183" y="157"    fontSize="5.5" fill={accentAlt} fillOpacity="0.45" fontFamily="monospace" textAnchor="middle">OUT</text>
        <text x="183" y="164"    fontSize="5.5" fill={accentAlt} fillOpacity="0.45" fontFamily="monospace" textAnchor="middle">↓</text>
      </svg>
    )
  },
  mpc: ({ accent, accentAlt }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-65">
      <defs>
        <radialGradient id="g-mpc" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accentAlt} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="104" rx="72" ry="66" fill="url(#g-mpc)" />

      {/* Moving obstacle circles */}
      <circle cx="72" cy="130" r="20" fill="none" stroke="#ef4444" strokeWidth="0.9" strokeOpacity="0.45" strokeDasharray="4 3" />
      <circle cx="134" cy="88" r="18" fill="none" stroke="#ef4444" strokeWidth="0.9" strokeOpacity="0.45" strokeDasharray="4 3" />
      <circle cx="96" cy="50" r="14" fill="none" stroke="#ef4444" strokeWidth="0.8" strokeOpacity="0.4" strokeDasharray="3 3" />

      {/* PID path — reactive baseline */}
      <path id="pid-path"
        d="M 18,178 C 32,162 52,148 68,120 C 84,92 108,90 126,88 C 148,86 165,64 184,34"
        fill="none" stroke={accentAlt} strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 3" />

      {/* MPC path — predictive optimal */}
      <path id="mpc-path"
        d="M 18,178 C 30,158 46,140 56,110 C 66,78 88,64 110,60 C 136,56 160,46 184,34"
        fill="none" stroke={accent} strokeWidth="1.6" strokeOpacity="0.75" />

      {/* Prediction horizon shading */}
      <path d="M 110,60 C 136,56 160,46 184,34 C 184,40 160,54 136,64 C 110,72 88,76 74,90 Z"
        fill={accent} fillOpacity="0.07" />

      {/* Animated drone on MPC path */}
      <circle r="3.5" fill={accent} fillOpacity="0.95">
        <animateMotion dur="3.5s" repeatCount="indefinite" rotate="auto">
          <mpath href="#mpc-path" />
        </animateMotion>
      </circle>

      {/* Labels */}
      <text x="36" y="193" fontSize="6" fill={accent}    fillOpacity="0.65" fontFamily="monospace">MPC</text>
      <text x="130" y="193" fontSize="6" fill={accentAlt} fillOpacity="0.5"  fontFamily="monospace">PID (baseline)</text>
      <line x1="18" y1="191" x2="34" y2="191" stroke={accent}    strokeWidth="1.5" />
      <line x1="112" y1="191" x2="128" y2="191" stroke={accentAlt} strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  ),
  agent: ({ accent, accentAlt }) => (
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-60">
      <defs>
        <radialGradient id="g-agent" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
          <stop offset="100%" stopColor={accentAlt} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="30" y="38" width="140" height="104" rx="6" fill="none" stroke={accent} strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="30" y1="54" x2="170" y2="54" stroke={accent} strokeWidth="0.8" strokeOpacity="0.3" />
      <circle cx="42" cy="46" r="3" fill={accent} fillOpacity="0.4" />
      <circle cx="52" cy="46" r="3" fill={accent} fillOpacity="0.25" />
      <circle cx="62" cy="46" r="3" fill={accent} fillOpacity="0.15" />
      <rect x="72" y="41" width="82" height="10" rx="3" fill="none" stroke={accent} strokeWidth="0.6" strokeOpacity="0.25" />
      <line x1="44" y1="68" x2="156" y2="68" stroke={accentAlt} strokeWidth="0.8" strokeOpacity="0.3" />
      <line x1="44" y1="78" x2="130" y2="78" stroke={accentAlt} strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="44" y1="88" x2="142" y2="88" stroke={accentAlt} strokeWidth="0.8" strokeOpacity="0.2" />
      <circle cx="60" cy="118" r="8" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.6" />
      <circle cx="100" cy="118" r="8" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.6" />
      <circle cx="140" cy="118" r="8" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.6" />
      <line x1="68" y1="118" x2="92" y2="118" stroke={accent} strokeWidth="0.8" strokeOpacity="0.4" />
      <line x1="108" y1="118" x2="132" y2="118" stroke={accent} strokeWidth="0.8" strokeOpacity="0.4" />
      <circle cx="60" cy="118" r="2.5" fill={accent} fillOpacity="0.6" />
      <circle cx="100" cy="118" r="2.5" fill={accent} fillOpacity="0.6" />
      <circle cx="140" cy="118" r="2.5" fill={accent} fillOpacity="0.3" />
      <line x1="133" y1="110" x2="147" y2="126" stroke="#ef4444" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="147" y1="110" x2="133" y2="126" stroke="#ef4444" strokeWidth="1.2" strokeOpacity="0.5" />
      <ellipse cx="100" cy="100" rx="60" ry="50" fill="url(#g-agent)" />
    </svg>
  ),
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
    </svg>
  ),
}

// ─── Link icon helpers ─────────────────────────────────────────────────────────
const GitHubIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)
const ExternalIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── Card ─────────────────────────────────────────────────────────────────────
function ProjectCard({ project, index }: { project: Project; index: number }) {
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
        <div className="absolute top-4 right-4">
          <span className="text-[10px] font-medium text-white/30 tracking-wider">{project.period}</span>
        </div>
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(400px circle at 50% 50%, ${project.accent}0d, transparent)` }}
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-display font-bold text-xl mb-1" style={{ color: project.accent }}>
            {project.title}
          </h3>
          <p className="text-xs text-white/30 font-medium">{project.subtitle}</p>
        </div>

        <p className="text-[13px] text-white/45 leading-relaxed mb-5">{project.description}</p>

        {/* Stats row */}
        <div className="flex gap-6 mb-5 py-4 border-y border-white/5 flex-wrap">
          {project.stats.map((s) => (
            <div key={s.label}>
              <p className="font-display font-bold text-base" style={{ color: project.accent }}>{s.value}</p>
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

        {/* Actions row */}
        <div className="flex items-center gap-3 flex-wrap">
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
              style={{ color: `${project.accent}cc`, borderColor: `${project.accent}30` }}
            >
              {project.link.icon === 'github' ? <GitHubIcon /> : <ExternalIcon />}
              {project.link.label}
            </a>
          )}

          {project.demoLink && (
            <a
              href={project.demoLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200 hover:bg-white/5"
              style={{ color: `${project.accentAlt}cc`, borderColor: `${project.accentAlt}30` }}
            >
              <ExternalIcon />
              {project.demoLink.label}
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

// ─── Section ──────────────────────────────────────────────────────────────────
export default function Projects() {
  return (
    <section id="projects" className="py-28 md:py-36 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
