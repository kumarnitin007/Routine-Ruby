/**
 * Onboarding Flow Component
 * 
 * First-time user experience with:
 * - Welcome screen
 * - Quick tutorial
 * - Sample tasks option
 * - Feature highlights
 */

import React, { useState } from 'react';

interface OnboardingFlowProps {
  onComplete: (loadSampleTasks: boolean) => void;
}

type OnboardingStep = 'welcome' | 'features' | 'samples' | 'done';

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [loadSamples, setLoadSamples] = useState(true);

  const handleNext = () => {
    if (step === 'welcome') {
      setStep('features');
    } else if (step === 'features') {
      setStep('samples');
    } else if (step === 'samples') {
      onComplete(loadSamples);
    }
  };

  const handleSkip = () => {
    onComplete(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      overflow: 'auto'
    }}>
      <div style={{
        maxWidth: '700px',
        width: '100%',
        background: 'white',
        borderRadius: '24px',
        padding: '3rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        position: 'relative'
      }}>
        {/* Skip button */}
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            fontSize: '0.875rem',
            cursor: 'pointer',
            padding: '0.5rem',
            fontWeight: 600
          }}
        >
          Skip →
        </button>

        {/* Welcome Step */}
        {step === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>👋</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '3rem' }}>🐦</span>
              <h1 style={{
                fontSize: '2.5rem',
                margin: 0,
                background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Welcome to Routine Ruby!
              </h1>
            </div>
            <p style={{
              fontSize: '1.25rem',
              color: '#e11d48',
              fontStyle: 'italic',
              fontWeight: 600,
              marginBottom: '0.5rem'
            }}>
              Your day, in full flight ✨
            </p>
            <p style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              lineHeight: 1.7,
              marginBottom: '2rem'
            }}>
              Like a hummingbird in motion, hover over what matters and turn small tasks into big momentum.
              Stay organized, stay graceful, and watch your daily goals take flight! 🌟
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2.5rem',
              textAlign: 'left'
            }}>
              <div style={{
                padding: '1.5rem',
                background: '#f0f9ff',
                borderRadius: '12px',
                border: '2px solid #bae6fd'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#0c4a6e' }}>
                  Simple Task Management
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#075985' }}>
                  Create, organize, and complete your daily tasks with ease
                </p>
              </div>

              <div style={{
                padding: '1.5rem',
                background: '#fef3c7',
                borderRadius: '12px',
                border: '2px solid #fde68a'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#78350f' }}>
                  Track Your Progress
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                  Visualize streaks, completion rates, and patterns
                </p>
              </div>

              <div style={{
                padding: '1.5rem',
                background: '#f0fdf4',
                borderRadius: '12px',
                border: '2px solid #bbf7d0'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</div>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#14532d' }}>
                  Focus Timer
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#166534' }}>
                  Built-in countdown timer for deep focus sessions
                </p>
              </div>
            </div>

            <button
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                fontSize: '1.125rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              Get Started →
            </button>
          </div>
        )}

        {/* Features Step */}
        {step === 'features' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
              <h2 style={{
                fontSize: '2rem',
                marginBottom: '0.5rem',
                color: '#1f2937'
              }}>
                Powerful Features
              </h2>
              <p style={{ color: '#6b7280' }}>
                Everything you need to stay productive
              </p>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {[
                { icon: '🎯', title: 'Smart Dashboard', desc: 'See all your tasks for today at a glance' },
                { icon: '🗓️', title: 'Flexible Scheduling', desc: 'Daily, weekly, monthly, or custom frequencies' },
                { icon: '📈', title: 'Detailed Analytics', desc: 'Track streaks, completion rates, and patterns' },
                { icon: '🎉', title: 'Events & Occasions', desc: 'Never miss birthdays, anniversaries, or special days' },
                { icon: '📔', title: 'Daily Journal', desc: 'Reflect on your day with built-in journaling' },
                { icon: '⏱️', title: 'Focus Timer', desc: 'Countdown timer with task tracking' },
                { icon: '🏷️', title: 'Tags & Organization', desc: 'Categorize and filter your tasks' },
                { icon: '💡', title: 'AI Insights', desc: 'Get smart recommendations to improve productivity' }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>{feature.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>
                      {feature.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {feature.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                fontSize: '1.125rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Sample Tasks Step */}
        {step === 'samples' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <h2 style={{
              fontSize: '2rem',
              marginBottom: '0.5rem',
              color: '#1f2937'
            }}>
              Load Sample Tasks?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              marginBottom: '2rem',
              lineHeight: 1.7
            }}>
              We can load some example tasks to help you get started.
              You can always edit or delete them later.
            </p>

            <div style={{
              background: '#f0f9ff',
              border: '2px solid #bae6fd',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <div style={{ fontWeight: 600, color: '#0c4a6e', marginBottom: '1rem' }}>
                Sample tasks include:
              </div>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: '0.75rem'
              }}>
                {[
                  '🏃 Exercise & Fitness',
                  '📚 Learning & Reading',
                  '💧 Health & Self-Care',
                  '🧘 Meditation & Mindfulness',
                  '💼 Work & Productivity'
                ].map((item, idx) => (
                  <li key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#075985',
                    fontSize: '0.9375rem'
                  }}>
                    <span>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <button
                onClick={() => {
                  setLoadSamples(false);
                  handleNext();
                }}
                style={{
                  flex: 1,
                  padding: '1rem 2rem',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                Start Fresh
              </button>
              <button
                onClick={() => {
                  setLoadSamples(true);
                  handleNext();
                }}
                style={{
                  flex: 1,
                  padding: '1rem 2rem',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
              >
                Load Samples ✓
              </button>
            </div>

            <p style={{
              fontSize: '0.875rem',
              color: '#9ca3af'
            }}>
              You can create your own tasks anytime from the Task tab
            </p>
          </div>
        )}

        {/* Progress dots */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          marginTop: '2rem'
        }}>
          {['welcome', 'features', 'samples'].map((s) => (
            <div
              key={s}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: step === s ? '#667eea' : '#d1d5db',
                transition: 'background 0.3s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;

