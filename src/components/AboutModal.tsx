/**
 * About Modal Component
 * 
 * Displays information about the Routine Ruby app.
 */

import React, { useState } from 'react';
import Portal from './Portal';

interface AboutModalProps {
  show: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ show, onClose }) => {
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);
  const [isAppsExpanded, setIsAppsExpanded] = useState(false);

  if (!show) return null;

  return (
    <Portal>
      <div className="about-modal-backdrop" onClick={onClose}>
        <div className="about-modal-content" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div style={{ padding: '1.5rem', borderBottom: '2px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'white', zIndex: 10, borderRadius: '1rem 1rem 0 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2.5rem' }}>🐦</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>About Routine Ruby</h2>
              </div>
              <p style={{ 
                fontSize: '0.9rem', 
                margin: 0, 
                color: '#e11d48',
                fontStyle: 'italic',
                fontWeight: 600,
                paddingLeft: '3.25rem'
              }}>
                Your day, in full flight ✨
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* About */}
            <div style={{ background: 'linear-gradient(to right, #fce7f3, #fecaca)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #fda4af' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🐦</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#e11d48' }}>Stay in Motion, Stay Organized</h3>
              </div>
              <p style={{ color: '#374151', lineHeight: '1.6', fontSize: '0.95rem', margin: '0 0 1rem 0' }}>
                Like a hummingbird in flight, Routine Ruby helps you hover over what matters most. 🐦✨ Track your daily tasks with the energy and grace of nature's most dynamic bird. Small tasks create big momentum - just as hummingbirds beat their wings 80 times per second, your consistent actions build unstoppable progress!
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontStyle: 'italic', color: '#e11d48' }}>
                  💎 Daily tasks, beautifully done
                </div>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontStyle: 'italic', color: '#e11d48' }}>
                  ⚡ Small tasks, big momentum
                </div>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontStyle: 'italic', color: '#e11d48' }}>
                  🎯 Hover over what matters
                </div>
              </div>
            </div>

            {/* Features */}
            <div style={{ background: 'linear-gradient(to right, #dbeafe, #bfdbfe)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #93c5fd' }}>
              <button onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🚀</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e40af' }}>Features</h3>
                </div>
                <span style={{ fontSize: '1.25rem', color: '#1e40af' }}>{isFeaturesExpanded ? '▲' : '▼'}</span>
              </button>
              {isFeaturesExpanded && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>🎯 Today's Focus</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>See all tasks at a glance with weightage-based layout</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>📊 4 Chart Views</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>List, Bar, Pie, and Trend charts for insights</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>🎨 10 Themes</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>Beautiful themes to match your mood</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>🎭 50+ Avatars</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>Personalize with fun emoji avatars</p>
                  </div>
                </div>
              )}
            </div>

            {/* Apps */}
            <div style={{ background: 'linear-gradient(to right, #cffafe, #a5f3fc)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #67e8f9' }}>
              <button onClick={() => setIsAppsExpanded(!isAppsExpanded)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🌐</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#0e7490' }}>More Apps</h3>
                </div>
                <span style={{ fontSize: '1.25rem', color: '#0e7490' }}>{isAppsExpanded ? '▲' : '▼'}</span>
              </button>
              {isAppsExpanded && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>📚 Bookshelf</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>Track your reading journey</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>🦦 Cipher Otto</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>Learn cryptography interactively</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.7)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>🦁 Leo Planner</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>Task manager & calendar organizer</p>
                  </div>
                </div>
              )}
            </div>

            {/* Support */}
            <div style={{ background: 'linear-gradient(to right, #d1fae5, #a7f3d0)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #6ee7b7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.25rem' }}>💚</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#065f46' }}>Support Routine Ruby</h3>
              </div>
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: '#374151' }}>
                Help keep this app free, ad-free, and flying high! Like nectar for a hummingbird, your support keeps us going! 🌺
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href="https://venmo.com/Nitin-Kumar-22" target="_blank" rel="noopener noreferrer" style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', color: 'white', fontWeight: 'bold', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                  ☕ Donate via Venmo
                </a>
                <a href="https://paypal.me/kumarnitin007" target="_blank" rel="noopener noreferrer" style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'linear-gradient(to right, #eab308, #f97316)', color: 'white', fontWeight: 'bold', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                  💵 Donate via PayPal
                </a>
              </div>
            </div>

            {/* Close */}
            <button onClick={onClose} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #d1d5db', background: '#f3f4f6', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default AboutModal;
