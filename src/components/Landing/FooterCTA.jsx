'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SignInButton } from '@clerk/nextjs';

export default function FooterCTA() {
  return (
    <section className="landing-grain landing-dots" style={{ 
      padding: '160px 24px', 
      textAlign: 'center',
      background: 'linear-gradient(to top, #000, #020202)',
      position: 'relative',
      zIndex: 10,
      overflow: 'hidden'
    }}>
      {/* Subtle radial vignette */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
        viewport={{ once: true, margin: "-100px" }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <h2 style={{ 
          fontFamily: 'Orbitron, sans-serif', 
          fontSize: 'max(3rem, 4vw)', 
          marginBottom: '24px', 
          letterSpacing: '0.05em',
          color: '#fff',
        }}>
          Ready to upgrade your workflow?
        </h2>
        <p style={{ fontSize: '1.25rem', color: '#555', marginBottom: '48px' }}>
          Join the teams already using Colcal to synchronize their futures.
        </p>

        <SignInButton mode="modal">
          <button style={{
            padding: '20px 64px',
            backgroundColor: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            letterSpacing: '0.08em',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            textTransform: 'uppercase',
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 'bold',
            boxShadow: '0 0 40px rgba(255,255,255,0.12)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.backgroundColor = '#d4d4d4';
            e.currentTarget.style.boxShadow = '0 0 60px rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.boxShadow = '0 0 40px rgba(255,255,255,0.12)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          >
            Start Now
          </button>
        </SignInButton>
      </motion.div>
    </section>
  );
}
