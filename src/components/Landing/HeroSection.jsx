'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SignInButton } from '@clerk/nextjs';

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 }
    }
  };

  return (
    <section style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '0 24px',
      textAlign: 'center',
      paddingTop: '80px',
      position: 'relative',
      zIndex: 10
    }}>
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <motion.h1 
          variants={itemVariants}
          style={{ 
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 'max(4rem, 6vw)', 
            margin: '0 0 1.5rem 0', 
            letterSpacing: '0.05em',
            textShadow: '0 0 40px rgba(255,255,255,0.08)',
            maxWidth: '1000px',
            lineHeight: 1.1
          }}
        >
          Synchronize your team's future.
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          style={{ 
            fontSize: '1.5rem', 
            margin: '0 0 3rem 0', 
            color: '#888',
            maxWidth: '700px',
            lineHeight: '1.6'
          }}
        >
          Colcal is the ultimate collaborative workspace combining advanced scheduling, real-time task tracking, and seamless team coordination in one unified interface.
        </motion.p>
        
        <motion.div variants={itemVariants}>
          <SignInButton mode="modal">
            <button style={{
              padding: '18px 56px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1.1rem',
              letterSpacing: '0.12em',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              textTransform: 'uppercase',
              fontFamily: 'Orbitron, sans-serif',
              boxShadow: '0 4px 30px rgba(0,0,0,0.4)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.boxShadow = '0 4px 30px rgba(0,0,0,0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              Start for free
            </button>
          </SignInButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
