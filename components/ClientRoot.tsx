'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Experience from '@/components/Experience'
import Clubs from '@/components/Clubs'
import Projects from '@/components/Projects'
import Skills from '@/components/Skills'
import Contact from '@/components/Contact'

// Load intro client-only — it uses canvas / Date / browser APIs
const IntroScreen = dynamic(() => import('@/components/IntroScreen'), { ssr: false })

export default function ClientRoot() {
  const [introComplete, setIntroComplete] = useState(false)

  return (
    <>
      <AnimatePresence>
        {!introComplete && (
          <IntroScreen onComplete={() => setIntroComplete(true)} />
        )}
      </AnimatePresence>

      <Navigation />
      <main>
        <Hero />
        <About />
        <Experience />
        <Clubs />
        <Projects />
        <Skills />
        <Contact />
      </main>
    </>
  )
}
