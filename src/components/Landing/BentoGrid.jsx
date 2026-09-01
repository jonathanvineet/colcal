'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Activity, ArrowRightLeft, PanelLeft, HardDrive, Tablet } from 'lucide-react';

const bentoItems = [
  {
    title: 'Enterprise Security',
    desc: 'Granular access controls and org-level data isolation. Your data never leaks between workspaces.',
    icon: Lock,
    colSpan: 2,
    rowSpan: 1,
  },
  {
    title: 'Lightning Fast',
    desc: 'Built on Next.js 15 for sub-second load times.',
    icon: Activity,
    colSpan: 1,
    rowSpan: 1,
  },
  {
    title: 'Real-time Sync',
    desc: 'Instant updates across all devices when teammates make changes.',
    icon: ArrowRightLeft,
    colSpan: 1,
    rowSpan: 2,
  },
  {
    title: 'Unified Dashboard',
    desc: 'Calendar, tasks, notes, and team rosters in one place. No tab-switching.',
    icon: PanelLeft,
    colSpan: 2,
    rowSpan: 1,
  },
  {
    title: 'Reliable Storage',
    desc: 'Powered by Supabase for resilient, low-latency data persistence.',
    icon: HardDrive,
    colSpan: 1,
    rowSpan: 1,
  },
  {
    title: 'Fully Responsive',
    desc: 'Optimized for desktop, tablet, and mobile without compromise.',
    icon: Tablet,
    colSpan: 1,
    rowSpan: 1,
  },
];

export default function BentoGrid() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <section className="landing-grain landing-dots" style={{ 
      padding: '120px 24px', 
      backgroundColor: '#020202', 
      position: 'relative', 
      zIndex: 10 
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '3rem', marginBottom: '16px', letterSpacing: '0.05em', color: '#fff' }}>
            Engineered for Excellence
          </h2>
          <p style={{ fontSize: '1.25rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            We didn't just build a calendar. We built a high-performance engine for your team's daily operations.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            autoRows: '200px'
          }}
        >
          {bentoItems.map((item, i) => (
            <BentoCard key={i} item={item} variants={itemVariants} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function BentoCard({ item, variants }) {
  const Icon = item.icon;
  
  return (
    <motion.div
      variants={variants}
      style={{
        gridColumn: `span ${item.colSpan}`,
        gridRow: `span ${item.rowSpan}`,
        backgroundColor: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'background-color 0.3s ease, transform 0.3s ease, border-color 0.3s ease',
        cursor: 'default',
        overflow: 'hidden',
        position: 'relative'
      }}
      onMouseOver={e => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div>
        <div style={{ marginBottom: '20px', color: '#777' }}>
          <Icon size={28} strokeWidth={1.5} />
        </div>
        <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem', marginBottom: '10px', color: '#e4e4e4', letterSpacing: '0.04em' }}>
          {item.title}
        </h3>
      </div>
      <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: '1.6' }}>
        {item.desc}
      </p>
    </motion.div>
  );
}
