'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

type Photo = string | { src: string; caption?: string }
const toPhoto = (p: Photo) => typeof p === 'string' ? { src: p, caption: undefined } : p
// animated GIFs and SVG figures are served as-is so they keep animating / stay crisp
const isRawAsset = (src: string) => /\.(gif|svg)$/i.test(src)

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
  media?: string  // video in the card header instead of the SVG visual
  photos: Photo[]
  link: ProjectLink | null
  demoLink?: ProjectLink | null
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const projects: Project[] = [
  {
    id: 'freertos-can-node',
    title: 'FreeRTOS Battery-Module CAN Node',
    subtitle: 'FreeRTOS POSIX Port · AUTOSAR E2E · UDS Diagnostics · Fail-Safe A/B Updates (Planned)',
    period: 'Nov 2026 – Present · In Progress',
    description:
      'A FreeRTOS telemetry node for one module of a battery pack, simulated on a laptop: five statically allocated tasks measure the module, publish AUTOSAR E2E-protected telemetry on CAN, and track faults as UDS-style trouble codes under two watchdogs — with fail-safe A/B firmware updates over the same bus still to come.',
    longDescription:
      'The node runs as a Linux process on the FreeRTOS POSIX port (kernel V11.3.3, unmodified), with its CAN controller, sensors, flash and watchdog simulated around it so everything builds and is tested in CI. A host platform layer locks the FreeRTOS tick to CLOCK_MONOTONIC, delivers simulated interrupts through lock-free rings, and measures real task stack peaks. The CAN path models arbitration, exact stuffed frame lengths and Bosch fault confinement (error passive, bus off, recovery) over SocketCAN or a UDP virtual bus. Seven cyclic messages come from a DBC through a generated C codec; four carry AUTOSAR E2E Profile 11 protection, checked against published vectors and an independent Python implementation on 20,000+ requests. Sixteen faults map to 24-bit DTCs with ISO 14229-1 status bits and AUTOSAR-style debouncing, reported in a protected fault frame; an AUTOSAR-style watchdog manager gates an STM32 IWDG model, and the reset cause survives in a CRC-checked retained-RAM cell. The code is C11 under -Werror, cppcheck with the MISRA C:2012 addon (documented deviations) and clang-tidy, and every analyzer run also checks a file of planted defects so "no findings" is verified. Phases 0–3 of 8 are done; next come the simulated NOR flash and A/B bootloader, ISO-TP/UDS download, measurements, and a Cortex-M3 build in QEMU.',
    tags: ['FreeRTOS', 'C11', 'CAN / SocketCAN', 'AUTOSAR E2E', 'UDS / DTCs', 'MISRA C:2012', 'DBC Codegen', 'Unity', 'pytest', 'GitHub Actions'],
    accent: '#60a5fa',
    accentAlt: '#fbbf24',
    stats: [
      { label: 'Phases Done', value: '0–3 of 8' },
      { label: 'Static FreeRTOS Tasks', value: '5' },
      { label: 'CAN Messages (4 E2E)', value: '7' },
      { label: 'Faults → DTCs', value: '16' },
    ],
    visual: 'rtos',
    photos: [
      { src: '/fcn-platform-timing.png', caption: 'Host platform layer: tick accuracy and simulated interrupt latency (host timing, not target timing)' },
    ],
    link: { label: 'GitHub', href: 'https://github.com/dcgursoy/freertos-can-node', icon: 'github' },
  },
  {
    id: 'can-ecu-sim',
    title: 'Two-ECU CAN Network on Zephyr RTOS',
    subtitle: 'E2E-Protected C++17 Firmware · Fault-Injection Gateway · Rust Sensor Port',
    period: 'Oct 2026 · Embedded Firmware',
    description:
      'Two simulated ECUs on Zephyr RTOS exchanging CRC- and counter-protected CAN frames over a Linux virtual bus — with a Python fault-injection gateway, a 23-test system suite that measures every reaction on the bus, CI that also builds for an STM32 Nucleo, and the sensor ECU ported to Rust as a cross-language conformance check.',
    longDescription:
      'One C++17 codebase with the ECU role chosen by Kconfig: the sensor publishes SENSOR_DATA every 10 ms plus battery status and a heartbeat, and the controller answers with commands every 20 ms. Safety-relevant messages carry a 4-bit rolling counter and a CRC-8 that also covers the identifier (polynomial chosen by measured Hamming distance). Each node runs per-message timeout monitors, a BOOT / RUNNING / DEGRADED / SAFE_STATE / FAULT node state machine, bus-off recovery with escalating backoff, and a watchdog fed only while every thread has checked in; a link-time guard turns any heap allocation after boot into a fatal error. A Python gateway between the two bus segments drops, delays, duplicates, reorders, corrupts and floods frames per direction and ID, and the pytest suite measures every reaction on the bus: SAFE_STATE 375 ms after the last heartbeat, 4,000 unknown frames/s absorbed with zero drops, every corrupted or replayed frame rejected. The firmware runs at 90.5% line coverage under the suite (libraries 100% under 77 GoogleTests), clang-tidy and cppcheck clean, and CI builds all four images including the Nucleo-F446RE targets. A Rust port of the sensor ECU — a no_std, allocation-free core under a thin std SocketCAN adapter — passes the same 23-test suite against the C++ controller.',
    tags: ['Zephyr RTOS', 'C++17', 'CAN / SocketCAN', 'DBC Codegen', 'Rust (no_std)', 'STM32', 'Fault Injection', 'pytest', 'GoogleTest', 'Docker', 'GitHub Actions'],
    accent: '#2dd4bf',
    accentAlt: '#fb7185',
    stats: [
      { label: 'Tests Pass (C++ & Rust)', value: '23 / 23' },
      { label: 'FW Line Coverage', value: '90.5%' },
      { label: 'Flood, 0 Dropped', value: '4,000 fr/s' },
      { label: 'HB Loss → Safe State', value: '375 ms' },
    ],
    visual: 'canbus',
    photos: [
      { src: '/can-demo.gif', caption: 'Recorded demo (10 s): heartbeat loss on vcan0, SAFE_STATE and recovery read live off the bus' },
      { src: '/can-fault-timeline.svg', caption: 'Heartbeat loss: the controller\'s command mode goes SAFE_STATE after the 350 ms timeout and back to NORMAL after the 500 ms hold' },
      { src: '/can-watchdog-timeline.svg', caption: 'Stalled transmit thread → watchdog reset, C++ sensor vs Rust sensor' },
      { src: '/can-period-histograms.svg', caption: 'Transmit period histograms: 10 ms sensor, 20 ms controller' },
      { src: '/can-echo-rtt.svg', caption: 'Echo round-trip latency, host → ECU → host' },
    ],
    link: { label: 'GitHub', href: 'https://github.com/dcgursoy/can-ecu-sim', icon: 'github' },
  },
  {
    id: 'quotedesk',
    title: 'QuoteDesk',
    subtitle: 'Voice-Agent Manufacturing Quoting · Google DeepMind New Agentic Economy Hackathon',
    period: 'Oct 2026 · Google DeepMind Hackathon',
    description:
      'An AI quoting assistant for machine shops: Gemini reads a buyer\'s email and PDF drawing, a Gemini Live voice agent collects the missing specs in a browser call, and the estimator reviews three priced delivery options — all kept in sync through Supabase.',
    longDescription:
      'Built as a team at the Google DeepMind New Agentic Economy Hackathon 2026. Intake extracts specifications with cited evidence from an email and a PDF drawing, and application code — not the model — decides which fields are missing. A quote-specific QR code opens a Gemini Live session where the buyer supplies material, quantity and finish by voice or typing; the agent is instructed to explain terminology neutrally and to leave engineering decisions to the buyer\'s engineer or vendor. Validated answers are written to Supabase with version checks so conflicting updates are detected rather than overwritten, and unique call IDs make a replayed tool call return its saved result instead of applying twice. Deterministic pricing code (illustrative rates, not a machining estimator) then produces economy, standard and rush options for the estimator to approve. I built the intake side — the Gemini extraction pipeline that turns the email and PDF into spec fields with cited evidence, the gap detection that decides what is still missing, the Supabase client wiring and the quote create/read/reset API routes — while the rest of the team built the Gemini Live voice flow and buyer call UI, the answer-validation, pricing and approval routes, and the estimator workspace.',
    tags: ['Next.js', 'TypeScript', 'Gemini Live', 'Gemini API', 'Supabase', 'Zod', 'Tailwind CSS', 'Voice Agents', 'Vercel'],
    accent: '#f472b6',
    accentAlt: '#38bdf8',
    stats: [
      { label: 'Hackathon Build', value: '1 day' },
      { label: 'Spec Fields Extracted', value: '10' },
      { label: 'Gemini Live Tools', value: '3' },
      { label: 'Priced Options', value: '3 tiers' },
    ],
    visual: 'quote',
    photos: [
      { src: '/quotedesk-intake.webp', caption: 'Estimator intake: the buyer\'s email and PDF drawing before extraction' },
    ],
    link: { label: 'GitHub', href: 'https://github.com/dcgursoy/QuoteDesk', icon: 'github' },
    demoLink: { label: 'Live Demo', href: 'https://quote-desk-hack.vercel.app', icon: 'external' },
  },
  {
    id: 'panda-pick-place-il',
    title: 'Imitation Learning for Robot Pick-and-Place',
    subtitle: 'Behavior Cloning vs Diffusion Policy vs SAC on a Simulated Franka Panda',
    period: 'Oct 2026 – Present · In Progress',
    description:
      'An imitation-learning study on a simulated Franka Panda: cube pick-and-place learned by behavior cloning and a from-scratch Diffusion Policy in PyTorch, benchmarked against an untuned SAC baseline that did not solve the task in 1M steps — with custom multi-rate dataset tooling and a gamepad teleop pipeline, the imitation policies trained on a laptop iGPU.',
    longDescription:
      'The environment is a MuJoCo Menagerie Panda with a scripted expert, a keyboard/gamepad teleop recorder, and a multi-rate logger that writes Zarr datasets with timestamp sync, a validator, bit-exact replay and LeRobot export. The policies are plain PyTorch: a chunked BC-MLP, a BC-ResNet18 with spatial softmax over two cameras, and a Diffusion Policy (ConditionalUNet1D with DDPM/DDIM schedulers matched to diffusers to 1e-5). The imitation policies train on an Intel Arc 140V iGPU through PyTorch\'s XPU backend — 13–29× faster per training step than the CPU for the ResNet18/UNet models — behind a self-check that refuses the device on a driver that once returned silently wrong results; the SAC baseline runs on the CPU. On the scripted dataset, a single-seed, 20-episode dev-set pipeline check (which the milestone log itself calls "not a result") had every IL method at 90–100% success after 2.5–120 minutes of training, while SB3 SAC with the plan\'s shaped reward reached 0% after 1M env steps on each of three seeds (about 9.5 h apiece) — it settles into the grasp-term local optimum, which is reported rather than tuned away. Evaluation runs ten environments in lockstep with per-episode seeding, so reports are reproducible regardless of batch size. The remaining milestones — multi-seed held-out evaluation with bootstrap confidence intervals, a success-vs-demos curve, a robustness test, the LeRobot Diffusion Policy cross-check and the final write-up — make up milestones 7 and 8; the milestone 7 experiment matrix (109 training runs, 169 held-out evaluations, about 90 hours on the iGPU) is running, with its analysis plan fixed in advance, and no held-out result is reported yet.',
    tags: ['Imitation Learning', 'Diffusion Policy', 'Behavior Cloning', 'MuJoCo', 'PyTorch (XPU)', 'Stable-Baselines3', 'SAC', 'Zarr', 'LeRobot', 'Python'],
    accent: '#38bdf8',
    accentAlt: '#fb923c',
    stats: [
      { label: 'Dev-Set Check (1 seed · 20 ep)', value: '90–100%' },
      { label: 'Untuned SAC @ 1M Steps', value: '0 / 3 seeds' },
      { label: 'iGPU vs CPU (train step)', value: '13–29×' },
      { label: 'Tests Passing', value: '126' },
    ],
    visual: 'arm',
    media: '/panda-env-demo.mp4',
    photos: [
      { src: '/panda-dp-rollout.gif', caption: 'Diffusion Policy (state) rollout: third-person, front and wrist cameras' },
      { src: '/panda-teleop.gif', caption: 'Human teleop episode with a PS4 controller, 4× speed' },
      { src: '/panda-sac-curves.png', caption: 'SAC baseline learning curves, 3 seeds × 1M env steps' },
    ],
    link: { label: 'GitHub', href: 'https://github.com/dcgursoy/panda-pick-place-il', icon: 'github' },
  },
  {
    id: 'quadruped-rl',
    title: 'Quadruped Learns to Walk with RL',
    subtitle: 'PPO Locomotion for a Unitree Go1 in MuJoCo · Push-Recovery Hardened',
    period: 'Jul 2026 · Robot Learning',
    description:
      'A simulated Unitree Go1 taught to walk from scratch with PPO — 1.9 m/s, recovers from 100 N shoves in any direction, and walks through 2× sensor noise, all trained on a laptop CPU.',
    longDescription:
      'Trained end-to-end with PPO (Stable-Baselines3) on proprioception only — projected gravity, body-frame velocities, joint state — with actions as joint-target offsets around the standing pose at 50 Hz. The reward went through three documented iterations: the naive baseline reward-hacked into a stable crawl; posture, air-time, and abduction terms produced an upright 1.1 m/s trot; and quantified robustness evaluation exposed left-right gait asymmetry and sensor-noise brittleness, fixed with domain randomization (training-time IMU/encoder noise + random 20–80 N pushes) and a phase-agnostic contact-duty symmetry term. Both 10M-step runs regressed past their best point, so the shipped policy was selected by head-to-head checkpoint evaluation. Final: 1.90 m/s, 40/40 push recovery at ≤75 N (39/40 at 100 N), zero falls under 2× sensor noise, and an interactive MuJoCo demo where you shove the robot with arrow keys.',
    tags: ['Reinforcement Learning', 'PPO', 'MuJoCo', 'Stable-Baselines3', 'Gymnasium', 'Reward Shaping', 'Domain Randomization', 'PyTorch', 'Python'],
    accent: '#34d399',
    accentAlt: '#f472b6',
    stats: [
      { label: 'Walking Speed', value: '1.9 m/s' },
      { label: 'Push Recovery ≤75 N', value: '100%' },
      { label: 'Falls @ 2× Sensor Noise', value: '0/20' },
      { label: 'Training (8-core CPU)', value: '~4 h' },
    ],
    visual: 'quadruped',
    media: '/quadruped-progression.mp4',
    photos: [],
    link: { label: 'GitHub', href: 'https://github.com/dcgursoy/quadruped-rl', icon: 'github' },
  },
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
    id: 'bms-simulator',
    title: '48-Cell Battery Management System Simulator',
    subtitle: 'UKF SOC/SOH Estimation · LP Active Balancing · Electro-Thermal Faults · Live Dashboard',
    period: 'Jul 2026 · Battery Systems · 7 / 8 Phases',
    description:
      'A simulation testbed for battery management: a 48-cell NMC pack of second-order Thevenin (2-RC) cells with hysteresis and aging, estimated over a bandwidth-limited telemetry bus by a UKF that holds SOC error to 0.44% RMSE, balanced by LP-scheduled DC-DC transfers, and guarded by residual-based fault detection — streamed to a live FastAPI dashboard.',
    longDescription:
      'Seven of eight planned phases are built — the results write-up is still pending — and the first six each closed with a committed pass/fail validation suite. The cell model (2.5 Ah NMC with R0, two RC branches, hysteresis, temperature and cycle aging) feeds a 6-module × 8s pack whose telemetry arrives noisy, quantized and stale over a 20-frame/s bus with a 0.9 s full-pack refresh. From that telemetry alone, a joint SOC/SOH UKF recovers from a 45% cold-boot error to under 2% in 2 s and tracks all 48 cells at 0.44% RMSE (EKF: 0.71%; Coulomb counting: 41.7%), while adapting R0 and capacity to within 1–2%. An LP-scheduled 1 A cell-to-pack balancer, running purely on those estimates, closes a 10.5% SOC spread in 473 s losing 1.03 Wh — 12× faster than passive bleeding at 5% of the energy. A coupled electro-thermal model simulates 3C self-heating (48 °C peak) and an internal short that drives one cell to 120 °C while its neighbours rise 22 K and the far corner stays cold. The residual detector diagnosed 4/4 injected faults (internal short, frozen sensor, offset sensor, impedance growth) with zero false positives over 96 cell-hours and applied the right derate or shutdown. A FastAPI + WebSocket dashboard runs the whole loop live at up to 20× real time with fault injection from the browser.',
    tags: ['Python', 'NumPy', 'UKF / EKF', 'Linear Programming', 'Thevenin Cell Model', 'Thermal Modeling', 'Fault Detection', 'FastAPI', 'WebSocket'],
    accent: '#a3e635',
    accentAlt: '#f87171',
    stats: [
      { label: 'UKF SOC RMSE', value: '0.44%' },
      { label: 'Cold-Boot Convergence', value: '2 s' },
      { label: 'vs Passive Balancing', value: '12× faster' },
      { label: 'Faults Caught, 0 FP', value: '4 / 4' },
    ],
    visual: 'battery',
    photos: [
      { src: '/bms-dashboard.webp', caption: 'Live console: pack grid, thermal map, UKF SOC estimates and balancing, fault injection' },
      { src: '/bms-soc-tracking.png', caption: 'UKF SOC tracking from bandwidth-limited bus telemetry' },
      { src: '/bms-ukf-vs-ekf.png', caption: 'UKF vs EKF estimation error' },
      { src: '/bms-balancing.png', caption: 'LP active balancing vs passive bleed: 473 s vs 5,667 s to <1% spread' },
      { src: '/bms-short-propagation.png', caption: 'Internal short: heat propagation to neighbouring cells' },
      { src: '/bms-fault-short.png', caption: 'Fault detection: internal short diagnosed in 9 s → shutdown' },
    ],
    link: { label: 'GitHub', href: 'https://github.com/dcgursoy/bms-simulator', icon: 'github' },
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
    id: 'expense-tracker',
    title: 'Smart Expense Tracker',
    subtitle: 'Full-Stack MERN Personal Finance App',
    period: 'Aug 2025 · Full-Stack Web',
    description:
      'A MERN personal-finance app with JWT auth, categorized income and expense tracking, Excel export and interactive Recharts dashboards, plus a client-side analytics layer that spots common subscriptions, flags unusual charges and awards achievement badges.',
    longDescription:
      'React 19 + Vite + Tailwind frontend over an Express 5 / MongoDB REST API — 13 endpoints across auth, income, expense and dashboard routes — with JWT authentication, bcrypt password hashing and Multer profile-photo uploads; both ledgers export to Excel. A client-side analytics layer on top of the 30-day dashboard data flags recurring charges that match common subscriptions, marks charges above 2× the category average, projects next month\'s spend per category from the monthly average, rolls savings rate and spending mix into a heuristic 0–100 health score, and awards achievement badges for logging habits.',
    tags: ['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Express', 'MongoDB', 'JWT', 'Recharts'],
    accent: '#fbbf24',
    accentAlt: '#818cf8',
    stats: [
      { label: 'REST Endpoints', value: '13' },
      { label: 'Data Models', value: '3' },
      { label: 'Chart Types', value: '3' },
    ],
    visual: 'wallet',
    photos: [],
    link: { label: 'GitHub', href: 'https://github.com/dcgursoy/expense_tracker', icon: 'github' },
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
  rtos: ({ accent, accentAlt }) => {
    // five tasks by priority take turns on the CPU; can_tx pushes frames onto the bus,
    // and the A/B flash slots below hint at the planned fail-safe updates
    const tasks = [
      { name: 'can_rx', prio: 6 }, { name: 'sensor', prio: 5 }, { name: 'process', prio: 4 },
      { name: 'can_tx', prio: 3 }, { name: 'health', prio: 2 },
    ]
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-65">
        <defs>
          <radialGradient id="g-rtos" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accentAlt} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="100" rx="78" ry="64" fill="url(#g-rtos)" />
        <text x="100" y="34" fontSize="6" textAnchor="middle" fill={accent} fillOpacity="0.55" fontFamily="monospace">FREERTOS · 5 STATIC TASKS</text>

        {tasks.map((t, i) => {
          const y = 44 + i * 15
          return (
            <g key={t.name}>
              <text x="22" y={y + 7.5} fontSize="5.5" fill={accent} fillOpacity="0.75" fontFamily="monospace">{t.name}</text>
              <text x="56" y={y + 7.5} fontSize="5" fill={accent} fillOpacity="0.4" fontFamily="monospace">p{t.prio}</text>
              <rect x="68" y={y} width="110" height="10" rx="2" fill={accent} fillOpacity="0.04" stroke={accent} strokeWidth="0.5" strokeOpacity="0.25" />
              {/* each task gets one running slice per 5 s cycle, highest priority first */}
              <rect x={68 + i * 20} y={y + 1.5} width="18" height="7" rx="1.5" fill={i === 3 ? accentAlt : accent} fillOpacity="0.08">
                <animate attributeName="fill-opacity" values="0.08;0.08;0.7;0.08;0.08"
                  keyTimes={`0;${(i * 0.2).toFixed(2)};${(i * 0.2 + 0.1).toFixed(2)};${(i * 0.2 + 0.2).toFixed(2)};1`}
                  dur="5s" repeatCount="indefinite" />
              </rect>
            </g>
          )
        })}

        {/* CAN bus with frames leaving the node */}
        <line x1="22" y1="128" x2="178" y2="128" stroke={accentAlt} strokeWidth="1.2" strokeOpacity="0.5" />
        <text x="22" y="124" fontSize="5" fill={accentAlt} fillOpacity="0.6" fontFamily="monospace">CAN · E2E P11</text>
        {Array.from({ length: 3 }, (_, i) => (
          <rect key={i} x="22" y="126" width="8" height="4" rx="1" fill={accentAlt} fillOpacity="0.9">
            <animate attributeName="x" from="22" to="170" dur="2.4s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
          </rect>
        ))}

        {/* A/B firmware slots (planned) */}
        <rect x="60" y="142" width="36" height="14" rx="2" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="0.9" strokeOpacity="0.7" />
        <text x="78" y="151.5" fontSize="5.5" textAnchor="middle" fill={accent} fillOpacity="0.85" fontFamily="monospace">SLOT A</text>
        <rect x="104" y="142" width="36" height="14" rx="2" fill="none" stroke={accent} strokeWidth="0.9" strokeOpacity="0.4" strokeDasharray="2 2" />
        <text x="122" y="151.5" fontSize="5.5" textAnchor="middle" fill={accent} fillOpacity="0.5" fontFamily="monospace">SLOT B</text>
        <text x="100" y="168" fontSize="5" textAnchor="middle" fill={accent} fillOpacity="0.45" fontFamily="monospace">A/B UPDATES · PLANNED</text>
      </svg>
    )
  },
  canbus: ({ accent, accentAlt }) => (
    // two ECUs on a bus through the fault gateway; every 6 s the gateway drops a
    // heartbeat and the controller falls into SAFE_STATE until the next one arrives
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-65">
      <defs>
        <radialGradient id="g-can" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accentAlt} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="100" rx="78" ry="60" fill="url(#g-can)" />

      {/* bus segments either side of the gateway */}
      <line x1="52" y1="100" x2="86" y2="100" stroke={accent} strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="114" y1="100" x2="148" y2="100" stroke={accent} strokeWidth="1.2" strokeOpacity="0.5" />
      <text x="69" y="124" fontSize="5" textAnchor="middle" fill={accent} fillOpacity="0.45" fontFamily="monospace">vcan0</text>
      <text x="131" y="124" fontSize="5" textAnchor="middle" fill={accent} fillOpacity="0.45" fontFamily="monospace">vcan1</text>

      {/* sensor ECU */}
      <rect x="14" y="84" width="38" height="32" rx="4" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.2" strokeOpacity="0.8" />
      <text x="33" y="98" fontSize="6" textAnchor="middle" fill={accent} fillOpacity="0.85" fontFamily="monospace" fontWeight="bold">SENSOR</text>
      <text x="33" y="108" fontSize="5" textAnchor="middle" fill={accent} fillOpacity="0.5" fontFamily="monospace">10 ms</text>

      {/* controller ECU: RUNNING until the heartbeat stops, then SAFE_STATE */}
      <rect x="148" y="84" width="38" height="32" rx="4" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.2" strokeOpacity="0.8">
        <animate attributeName="stroke" values={`${accent};${accent};${accentAlt};${accentAlt};${accent}`}
          keyTimes="0;0.6;0.63;0.9;1" dur="6s" repeatCount="indefinite" />
      </rect>
      <text x="167" y="98" fontSize="6" textAnchor="middle" fill={accent} fillOpacity="0.85" fontFamily="monospace" fontWeight="bold">CTRL</text>
      <text x="167" y="108" fontSize="5" textAnchor="middle" fill={accent} fillOpacity="0.6" fontFamily="monospace">
        RUNNING
        <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.6;0.63;0.9;1" dur="6s" repeatCount="indefinite" />
      </text>
      <text x="167" y="108" fontSize="5" textAnchor="middle" fill={accentAlt} fillOpacity="0.95" fontFamily="monospace" opacity="0">
        SAFE_STATE
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.6;0.63;0.9;1" dur="6s" repeatCount="indefinite" />
      </text>

      {/* fault-injection gateway, flashes while it swallows the heartbeat */}
      <rect x="86" y="88" width="28" height="24" rx="3" fill={accentAlt} fillOpacity="0.08" stroke={accentAlt} strokeWidth="1" strokeOpacity="0.6">
        <animate attributeName="fill-opacity" values="0.08;0.08;0.4;0.08;0.08" keyTimes="0;0.5;0.55;0.62;1" dur="6s" repeatCount="indefinite" />
      </rect>
      <text x="100" y="98" fontSize="5" textAnchor="middle" fill={accentAlt} fillOpacity="0.8" fontFamily="monospace" fontWeight="bold">GW</text>
      <text x="100" y="106" fontSize="4" textAnchor="middle" fill={accentAlt} fillOpacity="0.6" fontFamily="monospace">drop·delay</text>

      {/* sensor frames → controller, command frames ← controller */}
      {Array.from({ length: 3 }, (_, i) => (
        <rect key={`s${i}`} x="52" y="96" width="7" height="5" rx="1.5" fill={accent} fillOpacity="0.9">
          <animate attributeName="x" from="52" to="141" dur="1.5s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
        </rect>
      ))}
      {Array.from({ length: 2 }, (_, i) => (
        <rect key={`c${i}`} x="141" y="102" width="7" height="5" rx="1.5" fill={accent} fillOpacity="0.45">
          <animate attributeName="x" from="141" to="52" dur="1.5s" begin={`${0.3 + i * 0.75}s`} repeatCount="indefinite" />
        </rect>
      ))}
      {/* the heartbeat the gateway drops: stops inside it and fades */}
      <rect y="96" width="7" height="5" rx="1.5" fill="#ef4444" opacity="0">
        <animate attributeName="x" values="52;52;96;96;96" keyTimes="0;0.45;0.55;0.62;1" dur="6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.45;0.46;0.55;0.62;1" dur="6s" repeatCount="indefinite" />
      </rect>

      {/* labels */}
      <text x="100" y="44" fontSize="6" textAnchor="middle" fill={accent} fillOpacity="0.55" fontFamily="monospace">ZEPHYR RTOS · C++17 / RUST</text>
      <text x="14" y="166" fontSize="5.5" fill={accent} fillOpacity="0.5" fontFamily="monospace">CRC-8 + ROLLING CNT</text>
      <text x="186" y="166" fontSize="5.5" textAnchor="end" fill={accentAlt} fillOpacity="0.55" fontFamily="monospace">HB TIMEOUT 350 ms</text>
    </svg>
  ),
  quote: ({ accent, accentAlt }) => {
    // email + PDF → Gemini Live call → three priced options, all on one Supabase quote
    const bars = [6, 14, 22, 12, 28, 10, 20, 14, 8]
    const tiers = [{ name: 'ECON', w: 9 }, { name: 'STD', w: 12 }, { name: 'RUSH', w: 16 }]
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-65">
        <defs>
          <radialGradient id="g-quote" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accentAlt} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="100" rx="78" ry="62" fill="url(#g-quote)" />

        {/* buyer's email + PDF drawing (a bracket) */}
        <rect x="16" y="64" width="36" height="46" rx="3" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.1" strokeOpacity="0.7" />
        <path d="M 22,72 h 20 M 22,78 h 24 M 22,84 h 14" stroke={accent} strokeWidth="1" strokeOpacity="0.45" strokeLinecap="round" />
        <path d="M 23,104 v -10 h 8 v 6 h 12 v 4 z" fill="none" stroke={accentAlt} strokeWidth="1" strokeOpacity="0.85" strokeLinejoin="round" />
        <circle cx="27" cy="100" r="1" fill="none" stroke={accentAlt} strokeWidth="0.6" strokeOpacity="0.8" />
        <text x="34" y="120" fontSize="5" textAnchor="middle" fill={accent} fillOpacity="0.5" fontFamily="monospace">EMAIL + PDF</text>

        <path d="M 56,87 H 64 M 61.5,84.5 L 64,87 L 61.5,89.5" fill="none" stroke={accent} strokeWidth="0.9" strokeOpacity="0.45" strokeLinecap="round" />

        {/* Gemini Live voice call */}
        {bars.map((h, i) => {
          const x = 70 + i * 7
          const lo = h * 0.3 + 3
          const dur = `${0.7 + (i % 3) * 0.2}s`
          return (
            <rect key={i} x={x} y={87 - h / 2} width="3.5" height={h} rx="1.75" fill={accentAlt} fillOpacity="0.85">
              <animate attributeName="height" values={`${h};${lo};${h}`} dur={dur} begin={`${i * 0.08}s`} repeatCount="indefinite" />
              <animate attributeName="y" values={`${87 - h / 2};${87 - lo / 2};${87 - h / 2}`} dur={dur} begin={`${i * 0.08}s`} repeatCount="indefinite" />
            </rect>
          )
        })}
        <text x="100" y="120" fontSize="5" textAnchor="middle" fill={accentAlt} fillOpacity="0.6" fontFamily="monospace">GEMINI LIVE</text>

        <path d="M 136,87 H 144 M 141.5,84.5 L 144,87 L 141.5,89.5" fill="none" stroke={accent} strokeWidth="0.9" strokeOpacity="0.45" strokeLinecap="round" />

        {/* three priced delivery options, highlighted in turn */}
        {tiers.map((t, i) => (
          <g key={t.name}>
            <rect x="148" y={68 + i * 14} width="38" height="10" rx="2" fill={accent} fillOpacity="0.06" stroke={accent} strokeWidth="0.8" strokeOpacity="0.45">
              <animate attributeName="fill-opacity" values="0.06;0.28;0.06" dur="4.5s" begin={`${i * 1.5}s`} repeatCount="indefinite" />
            </rect>
            <text x="151" y={75.3 + i * 14} fontSize="4.5" fill={accent} fillOpacity="0.85" fontFamily="monospace">{t.name}</text>
            <rect x="167" y={71 + i * 14} width={t.w} height="4" rx="1" fill={accent} fillOpacity="0.55" />
          </g>
        ))}
        <text x="167" y="120" fontSize="5" textAnchor="middle" fill={accent} fillOpacity="0.5" fontFamily="monospace">3 QUOTES</text>

        {/* Supabase keeps buyer and estimator on one quote record */}
        <rect x="28" y="138" width="144" height="12" rx="6" fill="none" stroke={accent} strokeWidth="0.8" strokeOpacity="0.3" />
        <circle r="2" cy="144" fill={accentAlt} fillOpacity="0.9">
          <animate attributeName="cx" from="32" to="168" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="3s" repeatCount="indefinite" />
        </circle>
        <text x="100" y="161" fontSize="5" textAnchor="middle" fill={accent} fillOpacity="0.5" fontFamily="monospace">SUPABASE · SHARED QUOTE STATE</text>
      </svg>
    )
  },
  arm: ({ accent, accentAlt }) => (
    // fallback only: the panda card shows its environment video instead
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-65">
      <defs>
        <radialGradient id="g-arm" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accentAlt} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="104" rx="72" ry="62" fill="url(#g-arm)" />
      <line x1="20" y1="150" x2="180" y2="150" stroke={accent} strokeWidth="0.8" strokeOpacity="0.35" />
      <path d="M 138,150 v -14 h 30 v 14" fill={accent} fillOpacity="0.06" stroke={accent} strokeWidth="1" strokeOpacity="0.5" />
      <rect x="40" y="138" width="28" height="12" rx="3" fill={accent} fillOpacity="0.14" stroke={accent} strokeWidth="1.2" strokeOpacity="0.8" />
      <g>
        <animateTransform attributeName="transform" type="rotate" values="-8 54 138; 14 54 138; -8 54 138" dur="4s" repeatCount="indefinite" />
        <line x1="54" y1="138" x2="54" y2="86" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeOpacity="0.85" />
        <g>
          <animateTransform attributeName="transform" type="rotate" values="70 54 86; 96 54 86; 70 54 86" dur="4s" repeatCount="indefinite" />
          <line x1="54" y1="86" x2="54" y2="40" stroke={accent} strokeWidth="2.6" strokeLinecap="round" strokeOpacity="0.85" />
          <path d="M 50,40 v 8 M 58,40 v 8" stroke={accentAlt} strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
      <rect x="98" y="138" width="12" height="12" rx="1.5" fill={accentAlt} fillOpacity="0.25" stroke={accentAlt} strokeWidth="1.2" strokeOpacity="0.9" />
      <text x="20" y="172" fontSize="6" fill={accent} fillOpacity="0.55" fontFamily="monospace">BC · DIFFUSION POLICY</text>
    </svg>
  ),
  battery: ({ accent, accentAlt }) => {
    // 6 modules × 8s: the LP balancer pulls every cell's SOC to the pack mean
    // while cell 20 (the README's internal-short scenario) flags red
    const cols = 8, rows = 6, w = 14, h = 16, gx = 4, gy = 4, ox = 36, oy = 46
    const target = 0.62
    const fillH = (lvl: number) => (h - 4) * lvl
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-65">
        <defs>
          <radialGradient id="g-bms" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accentAlt} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="104" rx="76" ry="64" fill="url(#g-bms)" />
        {Array.from({ length: cols * rows }, (_, i) => {
          const r = Math.floor(i / cols), c = i % cols
          const x = ox + c * (w + gx), y = oy + r * (h + gy)
          const soc = 0.35 + 0.5 * (((i * 37) % 11) / 10)
          const fault = i === 20
          const top = (lvl: number) => y + h - 2 - fillH(lvl)
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} rx="2" fill={accent} fillOpacity="0.05"
                stroke={fault ? accentAlt : accent} strokeWidth="0.8" strokeOpacity={fault ? 0.9 : 0.4}>
                {fault && <animate attributeName="stroke-opacity" values="0.9;0.3;0.9" dur="1s" repeatCount="indefinite" />}
              </rect>
              <rect x={x + 2} y={top(soc)} width={w - 4} height={fillH(soc)} rx="1"
                fill={fault ? accentAlt : accent} fillOpacity={fault ? 0.6 : 0.45}>
                <animate attributeName="height" values={`${fillH(soc)};${fillH(target)};${fillH(target)};${fillH(soc)}`}
                  keyTimes="0;0.5;0.9;1" dur="7s" repeatCount="indefinite" />
                <animate attributeName="y" values={`${top(soc)};${top(target)};${top(target)};${top(soc)}`}
                  keyTimes="0;0.5;0.9;1" dur="7s" repeatCount="indefinite" />
              </rect>
            </g>
          )
        })}
        <text x="36" y="38" fontSize="5.5" fill={accent} fillOpacity="0.55" fontFamily="monospace">6 × 8s · 48 CELLS</text>
        <text x="176" y="38" fontSize="5.5" textAnchor="end" fill={accentAlt} fillOpacity="0.7" fontFamily="monospace">SHORT: CELL 20</text>
        <text x="36" y="176" fontSize="5.5" fill={accent} fillOpacity="0.55" fontFamily="monospace">UKF SOC / SOH</text>
        <text x="176" y="176" fontSize="5.5" textAnchor="end" fill={accent} fillOpacity="0.55" fontFamily="monospace">LP BALANCING</text>
      </svg>
    )
  },
  wallet: ({ accent, accentAlt }) => {
    const bars = [34, 52, 40, 70, 58, 86, 64]
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-65">
        <defs>
          <radialGradient id="g-wallet" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accentAlt} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="104" rx="72" ry="62" fill="url(#g-wallet)" />
        <line x1="34" y1="150" x2="170" y2="150" stroke={accent} strokeWidth="0.8" strokeOpacity="0.35" />
        {bars.map((b, i) => {
          const x = 42 + i * 18
          return (
            <rect key={i} x={x} y={150 - b} width="10" height={b} rx="2" fill={accent} fillOpacity="0.5">
              <animate attributeName="height" values={`${b};${b};${b * 0.6};${b}`} keyTimes="0;0.6;0.7;1" dur="4s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
              <animate attributeName="y" values={`${150 - b};${150 - b};${150 - b * 0.6};${150 - b}`} keyTimes="0;0.6;0.7;1" dur="4s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
            </rect>
          )
        })}
        <polyline points={bars.map((b, i) => `${47 + i * 18},${144 - b}`).join(' ')} fill="none" stroke={accentAlt} strokeWidth="1.2" strokeOpacity="0.7" />
        {bars.map((b, i) => (
          <circle key={i} cx={47 + i * 18} cy={144 - b} r="2" fill={accentAlt} fillOpacity="0.9" />
        ))}
        <circle cx="160" cy="48" r="12" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.2" strokeOpacity="0.7">
          <animate attributeName="r" values="12;13.5;12" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <text x="160" y="52" fontSize="11" textAnchor="middle" fill={accent} fillOpacity="0.85" fontFamily="monospace" fontWeight="bold">$</text>
        <text x="34" y="170" fontSize="6" fill={accent} fillOpacity="0.55" fontFamily="monospace">INCOME · EXPENSES</text>
        <text x="170" y="170" fontSize="6" textAnchor="end" fill={accentAlt} fillOpacity="0.55" fontFamily="monospace">FORECAST ↗</text>
      </svg>
    )
  },
  quadruped: ({ accent, accentAlt }) => {
    // side-view trot: diagonal leg pairs swing in antiphase around their hips
    const legs = [
      { hip: 74, phase: 0, far: false },   // rear near
      { hip: 74, phase: 1, far: true },    // rear far
      { hip: 126, phase: 1, far: false },  // front near
      { hip: 126, phase: 0, far: true },   // front far
    ]
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-65">
        <defs>
          <radialGradient id="g-quad" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accentAlt} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="104" rx="72" ry="62" fill="url(#g-quad)" />

        {/* ground + scrolling ticks (walking illusion) */}
        <line x1="16" y1="150" x2="184" y2="150" stroke={accent} strokeWidth="0.8" strokeOpacity="0.35" />
        {Array.from({ length: 5 }, (_, i) => (
          <line key={i} y1="153" y2="156" x1={40 + i * 32} x2={40 + i * 32}
            stroke={accent} strokeWidth="0.8" strokeOpacity="0.3">
            <animate attributeName="x1" from={40 + i * 32} to={8 + i * 32} dur="0.9s" repeatCount="indefinite" />
            <animate attributeName="x2" from={40 + i * 32} to={8 + i * 32} dur="0.9s" repeatCount="indefinite" />
          </line>
        ))}

        {/* robot: gentle bob + brief stagger when the push lands */}
        <g>
          <animateTransform attributeName="transform" type="translate"
            values="0,0; 0,1.4; 0,0" dur="0.45s" repeatCount="indefinite" additive="sum" />
          <animateTransform attributeName="transform" type="translate"
            values="0,0; 0,0; 7,-1.5; 2,0; 0,0" keyTimes="0;0.5;0.56;0.7;1"
            dur="4s" repeatCount="indefinite" additive="sum" />

          {/* legs (far pair drawn dimmer, behind the body) */}
          {legs.map((l, i) => (
            <g key={i} opacity={l.far ? 0.38 : 0.9}>
              <path
                d={`M ${l.hip},112 L ${l.hip - 4},131 L ${l.hip + 4},149`}
                fill="none" stroke={l.far ? accentAlt : accent}
                strokeWidth={l.far ? 2 : 2.6} strokeLinecap="round" strokeLinejoin="round"
              >
                <animateTransform attributeName="transform" type="rotate"
                  values={l.phase === 0
                    ? `-16 ${l.hip} 112; 16 ${l.hip} 112; -16 ${l.hip} 112`
                    : `16 ${l.hip} 112; -16 ${l.hip} 112; 16 ${l.hip} 112`}
                  dur="0.9s" repeatCount="indefinite" />
              </path>
            </g>
          ))}

          {/* trunk + head */}
          <rect x="58" y="96" width="84" height="20" rx="7"
            fill={accent} fillOpacity="0.14" stroke={accent} strokeWidth="1.4" strokeOpacity="0.8" />
          <rect x="136" y="90" width="16" height="12" rx="4"
            fill={accent} fillOpacity="0.14" stroke={accent} strokeWidth="1.2" strokeOpacity="0.7" />
          <circle cx="147" cy="95" r="1.6" fill={accentAlt} fillOpacity="0.9" />
        </g>

        {/* push force arrow, lands mid-cycle then fades */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.4;0.52;0.66;1"
            dur="4s" repeatCount="indefinite" />
          <line x1="22" y1="104" x2="50" y2="104" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.85" />
          <path d="M 50,104 L 43,100 M 50,104 L 43,108" stroke="#ef4444" strokeWidth="2"
            strokeOpacity="0.85" strokeLinecap="round" />
          <text x="22" y="96" fontSize="6" fill="#ef4444" fillOpacity="0.8" fontFamily="monospace">100 N</text>
        </g>

        {/* labels */}
        <text x="17" y="172" fontSize="6" fill={accent} fillOpacity="0.55" fontFamily="monospace">PPO @ 50 Hz</text>
        <text x="132" y="172" fontSize="6" fill={accentAlt} fillOpacity="0.55" fontFamily="monospace">1.9 m/s →</text>
      </svg>
    )
  },
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
        {project.media ? (
          <video
            src={project.media}
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="w-40 h-40">
              <Visual accent={project.accent} accentAlt={project.accentAlt} />
            </div>
          </div>
        )}
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
                    <Image src={p.src} alt={p.caption ?? `${project.title} photo ${i + 1}`} fill className="object-cover" unoptimized={isRawAsset(p.src)} />
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
              <Image src={lightbox.src} alt={lightbox.caption ?? 'Photo'} width={1200} height={800} className="object-contain max-h-[80vh]" unoptimized={isRawAsset(lightbox.src)} />
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
