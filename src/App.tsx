/**
 * Main App Component
 * 
 * Root component that manages:
 * - Navigation between different views
 * - Theme and user context providers
 * - About and Settings modals
 * - View state management
 * 
 * The app uses context providers for theme and user settings
 * which allows all child components to access and modify
 * these settings consistently.
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import TodayView from './TodayView';
import TasksView from './TasksView';
import EventsView from './EventsView';
import JournalView from './JournalView';
import AnalyticsView from './AnalyticsView';
import SettingsView from './SettingsView';
import TimerView from './TimerView';
import FloatingTimerButton from './components/FloatingTimerButton';
import AboutModal from './components/AboutModal';
import SettingsModal from './components/SettingsModal';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OnboardingFlow from './components/OnboardingFlow';
import AuthModal from './components/AuthModal';
import { isFirstTimeUser, markOnboardingComplete } from './storage';
import { loadSampleTasks } from './utils/sampleData';

type View = 'today' | 'tasks' | 'events' | 'journal' | 'analytics' | 'settings';

/**
 * Main App Content Component
 * Separated from App to allow access to context hooks
 */
const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('today');
  const [key, setKey] = useState(0); // Used to force refresh of views
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(isFirstTimeUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  
  const { theme } = useTheme();
  const { avatar, username } = useUser();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // Clear localStorage and test Supabase connection on mount
  useEffect(() => {
    const initialize = async () => {
      // Clear old localStorage data (user must use Supabase now)
      const { clearLocalStorage } = await import('./storage');
      clearLocalStorage();
      
      // Uncomment to test Supabase connection (verbose logging)
      // if (import.meta.env.DEV) {
      //   const { testSupabaseConnection } = await import('./utils/testSupabase');
      //   await testSupabaseConnection();
      // }
    };
    
    initialize();
  }, []);

  // Show auth modal if user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !showOnboarding) {
      setShowAuthModal(true);
    }
  }, [authLoading, isAuthenticated, showOnboarding]);

  // Refresh the current view when switching back to it
  const handleNavigate = (view: View) => {
    setCurrentView(view);
    setKey(prev => prev + 1); // Force re-render of the view
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async (loadSamples: boolean) => {
    markOnboardingComplete();
    setShowOnboarding(false);
    
    // After onboarding, show auth modal if not signed in
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
    
    // Note: Sample tasks loading not supported in Supabase mode
    // Users should create tasks manually or import from file
    if (loadSamples) {
      alert('Sample tasks loading is not available. Please create your own tasks or use the import feature!');
    }
  };

  // Check authentication and show auth modal if needed (disabled for now - manual trigger only)
  // useEffect(() => {
  //   if (!authLoading && !isAuthenticated && !showOnboarding) {
  //     const timer = setTimeout(() => {
  //       setShowAuthModal(true);
  //     }, 500);
  //     return () => clearTimeout(timer);
  //   }
  // }, [authLoading, isAuthenticated, showOnboarding]);

  // Listen for storage changes (e.g., from another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setKey(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'today':
        return <TodayView key={`today-${key}`} onNavigate={handleNavigate} />;
      case 'tasks':
        return <TasksView key={`tasks-${key}`} />;
      case 'events':
        return <EventsView key={`events-${key}`} onNavigate={handleNavigate} />;
      case 'journal':
        return <JournalView key={`journal-${key}`} />;
      case 'analytics':
        return <AnalyticsView key={`analytics-${key}`} />;
      case 'settings':
        return <SettingsView key={`settings-${key}`} />;
      default:
        return <TodayView key={`today-${key}`} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div 
      className="app" 
      style={{ 
        background: `linear-gradient(135deg, ${theme.gradient.from} 0%, ${theme.gradient.via} 50%, ${theme.gradient.to} 100%)`
      }}
    >
      <header className="header">
        <div className="header-left">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🐦</span>
              <h1 style={{ margin: 0 }}>Routine Ruby</h1>
            </div>
            <p style={{ 
              fontSize: '0.75rem', 
              margin: 0, 
              opacity: 0.85,
              fontStyle: 'italic',
              paddingLeft: '2.25rem'
            }}>
              Your day, in full flight
            </p>
          </div>
          <div className="user-badge" title={username}>
            <span className="user-avatar">{avatar.emoji}</span>
            <span className="user-name">{username}</span>
          </div>
        </div>
        <nav className="nav">
          <button
            className={`nav-button ${currentView === 'today' ? 'active' : ''}`}
            onClick={() => handleNavigate('today')}
            title="Today's Dashboard"
            style={currentView === 'today' ? { backgroundColor: theme.colors.primary } : {}}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Today</span>
          </button>
          <button
            className={`nav-button ${currentView === 'tasks' ? 'active' : ''}`}
            onClick={() => handleNavigate('tasks')}
            title="Tasks & Routines"
            style={currentView === 'tasks' ? { backgroundColor: theme.colors.primary } : {}}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-text">Tasks</span>
          </button>
          <button
            className={`nav-button ${currentView === 'events' ? 'active' : ''}`}
            onClick={() => handleNavigate('events')}
            title="Birthdays, Anniversaries & Special Occasions"
            style={currentView === 'events' ? { backgroundColor: theme.colors.primary } : {}}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-text">Events</span>
          </button>
          <button
            className={`nav-button ${currentView === 'journal' ? 'active' : ''}`}
            onClick={() => handleNavigate('journal')}
            title="Daily Journal & Reflections"
            style={currentView === 'journal' ? { backgroundColor: theme.colors.primary } : {}}
          >
            <span className="nav-icon">📔</span>
            <span className="nav-text">Journal</span>
          </button>
          <button
            className={`nav-button ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => handleNavigate('analytics')}
            title="Analytics & Reports"
            style={currentView === 'analytics' ? { backgroundColor: theme.colors.primary } : {}}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Analytics</span>
          </button>
          <button
            className={`nav-button ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavigate('settings')}
            title="Settings & Configuration"
            style={currentView === 'settings' ? { backgroundColor: theme.colors.primary } : {}}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </button>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => setShowAbout(true)}
            title="About Routine Ruby"
            style={{ color: theme.colors.primary }}
          >
            ℹ️
          </button>
          {isAuthenticated && user ? (
            <button
              className="icon-button"
              onClick={async () => {
                if (confirm('Are you sure you want to sign out?')) {
                  const { signOut } = await import('./lib/supabase');
                  await signOut();
                }
              }}
              title={`Sign Out (${user.email || 'User'})`}
              style={{ color: theme.colors.primary }}
            >
              🚪
            </button>
          ) : !authLoading ? (
            <button
              className="icon-button"
              onClick={() => setShowAuthModal(true)}
              title="Sign In / Sign Up"
              style={{ color: theme.colors.primary }}
            >
              🔑
            </button>
          ) : null}
        </div>
      </header>
      <main className="main-content">
        {renderView()}
      </main>

      {/* Modals */}
      <AboutModal show={showAbout} onClose={() => setShowAbout(false)} />
      <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
      
      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            setKey(prev => prev + 1);
          }}
        />
      )}
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}

      {/* Floating Timer Button */}
      <FloatingTimerButton onClick={() => setShowTimerModal(true)} />

      {/* Timer Modal */}
      {showTimerModal && (
        <div className="modal-overlay active" onClick={() => setShowTimerModal(false)}>
          <div className="modal timer-modal" onClick={(e) => e.stopPropagation()}>
            <TimerView key={`timer-${key}`} onClose={() => setShowTimerModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * App Wrapper Component
 * Wraps the app with necessary providers
 */
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

