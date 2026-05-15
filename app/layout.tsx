import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Deniz Gursoy — Electrical Engineer',
  description:
    'Portfolio of Deniz Gursoy — EE student at UPenn, incoming SpaceX intern, robotics engineer, and embedded systems developer.',
  keywords: ['Deniz Gursoy', 'Electrical Engineer', 'UPenn', 'SpaceX', 'Robotics', 'Embedded Systems'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-[#0a0a0a] text-[#f0f0f0]`}>
        {children}
      </body>
    </html>
  )
}
