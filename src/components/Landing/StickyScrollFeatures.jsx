'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useSpring, useScroll } from 'framer-motion';
import { SlidersHorizontal, GitFork, Kanban, BookMarked } from 'lucide-react';

const features = [
  {
    id: 'scheduling',
    title: 'Advanced Scheduling',
    desc: 'Switch effortlessly between day, week, month, and list views. Drag and drop events to reschedule in real-time across your entire organization.',
    icon: SlidersHorizontal,
    color: '#d4d4d4',
  },
  {
    id: 'rosters',
    title: 'Team Rosters',
    desc: 'Organize your workspace with unlimited teams. Monitor member availability and distribute workloads with unparalleled clarity.',
    icon: GitFork,
    color: '#a3a3a3',
  },
  {
    id: 'tasks',
    title: 'Daily Tasks',
    desc: 'Break down complex projects into actionable daily tasks. Assign responsibilities, track completion, and maintain momentum.',
    icon: Kanban,
    color: '#c4c4c4',
  },
  {
    id: 'notes',
    title: 'Rich Notes',
    desc: 'Capture ideas instantly with our built-in rich text editor. Share notes with your team or keep a private journal of your daily progress.',
    icon: BookMarked,
    color: '#8a8a8a',
  },
];

const N = features.length;

export default function StickyScrollFeatures() {
  const [activeIndex, setActiveIndex] = useState(0);
  const outerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
    restDelta: 0.001,
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      let idx = Math.floor(v * N);
      if (idx >= N) idx = N - 1;
      if (idx < 0) idx = 0;
      setActiveIndex(idx);
    });
    return unsubscribe;
  }, [scrollYProgress]);

  return (
    <section
      ref={outerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: `${N * 100 + 50}vh`,
        zIndex: 10,
      }}
    >
      <div
        className="landing-grain landing-dots"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          padding: '0 48px',
          boxSizing: 'border-box',
          backgroundColor: '#050505',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '64px',
          }}
        >
          {/* ── Left: Text ── */}
          <div style={{ flex: 1, position: 'relative' }}>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '36px' }}>
              {features.map((f, i) => (
                <div
                  key={i}
                  style={{
                    width: i === activeIndex ? '28px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: i === activeIndex ? '#d4d4d4' : 'rgba(255,255,255,0.12)',
                    transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
              ))}
            </div>

            <div style={{ position: 'relative', minHeight: '260px' }}>
              {features.map((feature, i) => (
                <motion.div
                  key={feature.id}
                  initial={false}
                  animate={{
                    opacity: i === activeIndex ? 1 : 0,
                    y: i === activeIndex ? 0 : i < activeIndex ? -28 : 28,
                    pointerEvents: i === activeIndex ? 'auto' : 'none',
                  }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                >
                  <h2
                    style={{
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: 'clamp(1.8rem, 2.8vw, 2.8rem)',
                      margin: '0 0 18px 0',
                      color: '#fff',
                      lineHeight: 1.15,
                    }}
                  >
                    {feature.title}
                  </h2>

                  <p
                    style={{
                      fontSize: '1.15rem',
                      lineHeight: '1.7',
                      color: '#888',
                      margin: 0,
                      maxWidth: '440px',
                    }}
                  >
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Right: Visual ── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 'min(420px, 40vw)',
                height: 'min(420px, 40vw)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '28px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <React.Fragment key={feature.id}>
                    <motion.div
                      initial={false}
                      animate={{ opacity: i === activeIndex ? 1 : 0 }}
                      transition={{ duration: 0.7, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle at 50% 55%, ${feature.color}0f 0%, transparent 70%)`,
                        pointerEvents: 'none',
                      }}
                    />
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: i === activeIndex ? 1 : 0,
                        scale: i === activeIndex ? 1 : 0.72,
                        y: i === activeIndex ? 0 : 28,
                      }}
                      transition={{ duration: 0.55, type: 'spring', bounce: 0.22 }}
                      style={{
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '18px',
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '148px',
                          height: '148px',
                          borderRadius: '50%',
                          backgroundColor: `rgba(255,255,255,0.04)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 0 50px rgba(255,255,255,0.08)`,
                          border: `1px solid rgba(255,255,255,0.1)`,
                        }}
                      >
                        <Icon size={72} color={feature.color} strokeWidth={1.2} />
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
