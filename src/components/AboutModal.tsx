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
                color: '#14b8a6',
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
            <div style={{ background: 'linear-gradient(to right, #ccfbf1, #a5f3fc)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #5eead4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🐦</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#0f766e' }}>Stay in Motion, Stay Organized</h3>
              </div>
              <p style={{ color: '#374151', lineHeight: '1.6', fontSize: '0.95rem', margin: '0 0 1rem 0' }}>
                Like a hummingbird in flight, Routine Ruby helps you hover over what matters most. 🐦✨ Track your daily tasks with the energy and grace of nature's most dynamic bird. Small tasks create big momentum - just as hummingbirds beat their wings 80 times per second, your consistent actions build unstoppable progress!
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontStyle: 'italic', color: '#14b8a6' }}>
                  💎 Daily tasks, beautifully done
                </div>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontStyle: 'italic', color: '#14b8a6' }}>
                  ⚡ Small tasks, big momentum
                </div>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontStyle: 'italic', color: '#14b8a6' }}>
                  🎯 Hover over what matters
                </div>
              </div>
            </div>

            {/* Features */}
            <div style={{ background: 'linear-gradient(to right, #dbeafe, #bfdbfe)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #93c5fd' }}>
              <button onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🚀</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e40af' }}>Cool Features</h3>
                </div>
                <span style={{ fontSize: '1.25rem', color: '#1e40af' }}>{isFeaturesExpanded ? '▲' : '▼'}</span>
              </button>
              {isFeaturesExpanded && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ background: 'linear-gradient(to right, #fce7f3, #fbcfe8)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #f9a8d4' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>🎯 Today's Smart Dashboard</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      See all your tasks at a glance with three visual layouts (Uniform, Priority-Sized, Masonry). 
                      Track progress, streaks, and get AI-powered coaching on underperforming tasks!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #ddd6fe, #c4b5fd)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #a78bfa' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>📊 Analytics & Insights</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Daily history with habit tracking grid, monthly calendar view, and deep insights with performance 
                      analysis, time patterns, and trend predictions!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #fed7aa, #fbbf24)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #f59e0b' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>⏱️ Focus Timer & Countdown</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Full-screen countdown timer with three modes: countdown to task end time, custom duration timer, 
                      or standalone stopwatch. Auto-completes tasks when timer ends!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #a7f3d0, #6ee7b7)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #34d399' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>📅 Events & Occasions</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Track birthdays, anniversaries, memorials, holidays, and festivals. Import events from Google Calendar 
                      (.ics files). Auto-notifications before important dates!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #bfdbfe, #93c5fd)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #60a5fa' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>📔 Daily Journal</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Free-form daily notes with mood tracking and custom tags. Tag tracking analytics show monthly 
                      trends (track habits like "late night sleep" or "social meetings")!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #fce7f3, #fda4af)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #fb7185' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>🎯 Task Templates & Routines</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Pre-defined and user-creatable routines (Morning, Evening, Workout). Define time windows and 
                      quickly add entire routine sets to your day!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #e0e7ff, #c7d2fe)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #a5b4fc' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>🔄 Advanced Task Scheduling</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Daily, weekly, monthly, custom frequencies (every 3 days, every 2 months), interval-based (every X 
                      days/weeks/months/years), one-time tasks, and date-range tasks!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #fef3c7, #fde68a)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #fcd34d' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>🏷️ Tags & Categories</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Create trackable tags with descriptions. Use in journal entries to auto-count patterns. 
                      Filter tasks by tags and see analytics!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #cffafe, #a5f3fc)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #67e8f9' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>🎨 10 Beautiful Themes</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Mint Fresh, Purple Dream, Ocean Breeze, Sunset Glow, Forest Green, Cherry Blossom, Golden Hour, 
                      Midnight Blue, Lavender Fields, Autumn Leaves. Instant theme switching!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #fecaca, #fca5a5)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #f87171' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>🎭 50+ Avatars</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Personalize with emoji avatars across 6 categories: Smileys, Animals, Food, Activities, Travel, Objects. 
                      Your avatar shows everywhere!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #d1fae5, #a7f3d0)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #6ee7b7' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>🔌 Integration Hub</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Import/export tasks from Google Calendar (.ics), connect with Google Tasks, Apple Reminders, 
                      Todoist. Sync your productivity ecosystem!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #e9d5ff, #d8b4fe)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #c084fc' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>📱 Progressive Web App (PWA)</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Install to home screen on any device! Works offline, desktop and mobile optimized, fast loading, 
                      and native app-like experience!
                    </p>
                  </div>
                  <div style={{ background: 'linear-gradient(to right, #fed7aa, #fdba74)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #fb923c' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>👥 Family Accounts (Coming Soon)</p>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Invite family members, share tasks, assign tasks to others, and collaborate on household routines. 
                      Perfect for families!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Apps */}
            <div style={{ background: 'linear-gradient(to right, #cffafe, #a5f3fc)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #67e8f9' }}>
              <button onClick={() => setIsAppsExpanded(!isAppsExpanded)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🌐</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#0e7490' }}>Other Apps in the Family</h3>
                </div>
                <span style={{ fontSize: '1.25rem', color: '#0e7490' }}>{isAppsExpanded ? '▲' : '▼'}</span>
              </button>
              {isAppsExpanded && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Bookshelf */}
                  <div style={{ background: 'linear-gradient(to right, #fef3c7, #fde68a)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #fbbf24' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: 'bold', margin: 0, fontSize: '1rem', color: '#92400e' }}>📚 Bookshelf</p>
                      <a 
                        href="https://mybooksshelf.vercel.app/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0ea5e9', textDecoration: 'underline' }}
                      >
                        Visit App →
                      </a>
                    </div>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Your personal reading tracker and library organizer! Keep track of books you've read, want to read, 
                      and get personalized AI recommendations. Organize your collection with themed bookshelves, track 
                      reading stats, earn XP and achievements, and share books with friends!
                    </p>
                  </div>

                  {/* Cipher Otto */}
                  <div style={{ background: 'linear-gradient(to right, #e9d5ff, #d8b4fe)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #c084fc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <p style={{ fontWeight: 'bold', margin: 0, fontSize: '1rem', color: '#581c87' }}>🦦 Cipher Otto</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a 
                          href="https://cipher-otto.vercel.app/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c3aed', textDecoration: 'underline' }}
                        >
                          Beta →
                        </a>
                        <a 
                          href="https://cipher-otto2.vercel.app/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c3aed', textDecoration: 'underline' }}
                        >
                          Stable →
                        </a>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Your interactive cryptography learning platform! Learn, practice, and master various ciphers 
                      with Otto's guidance. Explore historical ciphers (Caesar, Vigenère, Playfair, and more), 
                      solve challenges, track your progress, and join a community of cryptography enthusiasts!
                    </p>
                  </div>

                  {/* Routine Ruby */}
                  <div style={{ background: 'linear-gradient(to right, #d1fae5, #a7f3d0)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #6ee7b7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: 'bold', margin: 0, fontSize: '1rem', color: '#065f46' }}>🐦 Routine Ruby (You are here!)</p>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: 'rgba(255,255,255,0.7)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                        Current App
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Your daily task manager and productivity companion! Track tasks with streaks, get AI-powered 
                      coaching, manage events and journals, use focus timers, and stay organized with the grace 
                      of a hummingbird in flight! 🐦✨
                    </p>
                  </div>

                  {/* Leo Planner */}
                  <div style={{ background: 'linear-gradient(to right, #dbeafe, #bfdbfe)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #93c5fd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: 'bold', margin: 0, fontSize: '1rem', color: '#1e3a8a' }}>🦁 Leo Planner</p>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                        Coming Soon
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', margin: 0, color: '#374151', lineHeight: '1.5' }}>
                      Your personal task manager, event tracker, and gift card organizer! Keep track of your schedule, 
                      share calendars with family, manage daily tasks with ease, and never forget important occasions. 
                      Perfect for household organization!
                    </p>
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
