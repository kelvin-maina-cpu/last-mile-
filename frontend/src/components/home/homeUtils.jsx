import { useEffect, useRef, useState } from 'react'

/* ========================================================================
   Reveal-on-scroll hook (IntersectionObserver, pauses when tab hidden)
   ======================================================================== */
export function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }

    let cancelled = false
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !cancelled) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [])

  return [ref, visible]
}

/* ========================================================================
   Active-section tracking for navbar highlighting (persistent observer)
   ======================================================================== */
export function useActiveSection(ids) {
  const [active, setActive] = useState('')

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-30% 0px -55% 0px' }
    )

    // Sections render across phases — only observe the ones that exist.
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    els.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [ids])

  return active
}

/* ========================================================================
   Smooth scroll to a homepage section (defined in LandingPage composition)
   ======================================================================== */
export function scrollToSection(id) {
  if (id === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
