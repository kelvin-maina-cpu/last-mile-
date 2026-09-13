import { useState, useEffect } from 'react'
import Navbar from '../components/home/Navbar'
import Hero from '../components/home/Hero'
import ValueSection from '../components/home/ValueSection'
import HowItWorks from '../components/home/HowItWorks'
import ServicesSection from '../components/home/ServicesSection'
import AboutSection from '../components/home/AboutSection'
import Testimonials from '../components/home/Testimonials'
import ContactSection from '../components/home/ContactSection'
import FinalCTA from '../components/home/FinalCTA'
import Footer from '../components/home/Footer'

function LandingPage() {
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('reflex_theme') === 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark')
    localStorage.setItem('reflex_theme', isLight ? 'light' : 'dark')
  }, [isLight])

  return (
    <div className="home">
      <a className="home__skip-link" href="#hero">Skip to content</a>
      <Navbar isLight={isLight} onToggleTheme={() => setIsLight(!isLight)} />
      <main id="hero">
        <Hero />
        <ValueSection />
        <HowItWorks />
        <ServicesSection />
        <AboutSection />
        <Testimonials />
        <ContactSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
