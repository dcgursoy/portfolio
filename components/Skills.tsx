'use client'

import { motion } from 'framer-motion'

const categories = [
  {
    label: 'Languages',
    color: '#4f8ef7',
    skills: ['Python', 'C', 'C++', 'Java', 'MATLAB'],
  },
  {
    label: 'AI / ML',
    color: '#8b5cf6',
    skills: ['TensorFlow', 'PyTorch', 'Deep Reinforcement Learning', 'OpenCV', 'YOLO', 'ROS'],
  },
  {
    label: 'Hardware & EE',
    color: '#22d3ee',
    skills: ['FPGA / HLS', 'PLC Programming', 'Altium Designer', 'Modbus RTU', 'I2C', 'SPI', 'PCB Design', 'EMG Acquisition'],
  },
  {
    label: 'Tools & Platforms',
    color: '#f59e0b',
    skills: ['Siemens TIA Portal', 'SOLIDWORKS', 'Linux', 'Git', 'Raspberry Pi', 'ESP32', 'Pixhawk'],
  },
]

const proficiencies = [
  { label: 'Python', level: 95 },
  { label: 'C / C++', level: 85 },
  { label: 'Embedded Systems', level: 90 },
  { label: 'Signal Processing', level: 85 },
  { label: 'PLC / Controls', level: 80 },
  { label: 'ML / DRL', level: 78 },
]

export default function Skills() {
  return (
    <section id="skills" className="py-28 md:py-36 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-10"
        >
          <div className="h-px w-8 bg-gradient-to-r from-blue-500/0 to-blue-500/70" />
          <span className="text-xs font-semibold tracking-[0.22em] text-blue-400/65 uppercase">Skills</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.05 }}
          className="font-display text-4xl md:text-5xl font-bold mb-14"
        >
          My <span className="text-gradient-purple">technical stack</span>
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: skill categories */}
          <div className="space-y-10">
            {categories.map((cat, ci) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: ci * 0.1, ease: [0.33, 1, 0.68, 1] }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-1 h-4 rounded-full" style={{ background: cat.color }} />
                  <p
                    className="text-xs font-bold tracking-[0.2em] uppercase"
                    style={{ color: cat.color + 'bb' }}
                  >
                    {cat.label}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill, si) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: ci * 0.1 + si * 0.04 }}
                      whileHover={{ scale: 1.05, y: -1 }}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium border cursor-default transition-colors duration-200"
                      style={{
                        background: cat.color + '0d',
                        borderColor: cat.color + '22',
                        color: cat.color + 'cc',
                      }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: proficiency bars */}
          <div className="space-y-6">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-xs font-semibold tracking-[0.2em] uppercase text-white/25 mb-8"
            >
              Proficiency
            </motion.p>

            {proficiencies.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.33, 1, 0.68, 1] }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-white/60">{item.label}</span>
                  <span className="text-xs text-white/25 font-mono">{item.level}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, #4f8ef7, #22d3ee)`,
                    }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.level}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, delay: 0.2 + i * 0.1, ease: [0.33, 1, 0.68, 1] }}
                  />
                </div>
              </motion.div>
            ))}

            {/* Floating cert/badge cards */}
            <div className="grid grid-cols-2 gap-3 mt-10">
              {[
                { label: 'Autonomous Systems', sub: 'MIT Lincoln Labs', color: '#22d3ee' },
                { label: 'Embedded Systems', sub: 'PCB · FPGA · PLC', color: '#8b5cf6' },
                { label: 'Robotics & UAVs', sub: 'ROS · Pixhawk · SAR', color: '#4f8ef7' },
                { label: 'AI / DRL', sub: 'PPO · YOLO · Torch', color: '#f59e0b' },
              ].map((badge, i) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="glass rounded-xl p-4 cursor-default hover:border-white/12 transition-colors duration-300"
                >
                  <div className="w-2 h-2 rounded-full mb-2.5" style={{ background: badge.color }} />
                  <p className="text-xs font-semibold text-white/60">{badge.label}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{badge.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
