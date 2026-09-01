'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SignInButton } from '@clerk/nextjs';
import { motion, useScroll, useTransform } from 'framer-motion';

import HeroSection from './Landing/HeroSection';
import StickyScrollFeatures from './Landing/StickyScrollFeatures';
import BentoGrid from './Landing/BentoGrid';
import FooterCTA from './Landing/FooterCTA';

const Ferrofluid = dynamic(() => import('./Ferrofluid'), {
  ssr: false,
});

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 300]);
  const backgroundOpacity = useTransform(scrollY, [0, 800], [0.55, 0.08]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-wrapper" style={{ 
      width: '100vw', 
      minHeight: '100vh', 
      backgroundColor: '#020202', 
      color: '#ffffff',
      fontFamily: 'Rajdhani, sans-serif',
      position: 'relative',
      overflow: 'clip'  // 'clip' clips visually but does NOT create a scroll container, so position:sticky in children still works
    }}>
      {/* Background stays fixed but moves slightly with parallax */}
      <motion.div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 0, 
        opacity: backgroundOpacity,
        y: backgroundY,
        pointerEvents: 'none'
      }}>
        <Ferrofluid 
          colors={['#d8d8d8', '#ececec', '#c4c4c4']}
          speed={0.2} 
          scale={1.5}
          glow={1.0}
          shimmer={0.3}
          rimWidth={0.22}
          sharpness={3}
          turbulence={1.0}
          fluidity={0.1}
          flowDirection="down"
          mouseInteraction={true}
        />
      </motion.div>

      {/* Main scrollable content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Navbar */}
        <nav style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '20px 48px',
          background: scrolled ? 'rgba(2,2,2,0.85)' : 'linear-gradient(to bottom, rgba(2,2,2,0.9), transparent)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
          position: 'fixed',
          width: '100%',
          top: 0,
          boxSizing: 'border-box',
          backdropFilter: scrolled ? 'blur(16px)' : 'blur(4px)',
          zIndex: 50,
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.1em', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
            COLCAL
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <SignInButton mode="modal">
              <button style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1.1rem',
                letterSpacing: '0.05em',
                fontFamily: 'Rajdhani, sans-serif',
                opacity: 0.8,
                transition: 'opacity 0.2s ease'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = 1}
              onMouseOut={e => e.currentTarget.style.opacity = 0.8}
              >
                Log In
              </button>
            </SignInButton>
            <SignInButton mode="modal">
              <button style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff',
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.05em',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.14)'
                e.currentTarget.style.boxShadow = '0 0 15px rgba(255,255,255,0.08)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              >
                Get Started
              </button>
            </SignInButton>
          </div>
        </nav>

        <HeroSection />
        <StickyScrollFeatures />
        <BentoGrid />
        <FooterCTA />
        
        {/* Footer minimal */}
        <footer style={{ 
          padding: '40px', 
          textAlign: 'center', 
          borderTop: '1px solid rgba(255,255,255,0.05)', 
          background: '#020202',
          position: 'relative',
          zIndex: 10
        }}>
          <p style={{ opacity: 0.4, margin: 0, fontSize: '1rem' }}>
            &copy; {new Date().getFullYear()} Colcal. All rights reserved.
          </p>
        </footer>

      </div>
    </div>
  )
}
