/**
 * Migration Modal Component
 * 
 * Helps users migrate their localStorage data to Supabase
 */

import React, { useState } from 'react';
import { migrateToSupabase, getStorageMode } from '../services/database';

interface MigrationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const MigrationModal: React.FC<MigrationModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleMigrate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const migrationResult = await migrateToSupabase();
      setResult(migrationResult);
      
      if (migrationResult.success) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Migration failed: ' + (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  const storageMode = getStorageMode();

  if (storageMode === 'localStorage') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            <h2>⚠️ Supabase Not Configured</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              To migrate your data to the cloud, you need to configure Supabase first.
            </p>

            <div style={{
              background: '#eff6ff',
              border: '2px solid #3b82f6',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#1e40af' }}>
                📋 Setup Steps:
              </h3>
              <ol style={{
                margin: '0',
                paddingLeft: '1.5rem',
                color: '#475569',
                fontSize: '0.9rem'
              }}>
                <li>Create a Supabase account at supabase.com</li>
                <li>Create a new project</li>
                <li>Run the SQL schema from <code>supabase/schema.sql</code></li>
                <li>Copy your project URL and anon key</li>
                <li>Create a <code>.env</code> file in the root directory</li>
                <li>Add your credentials (see <code>supabase/env-template.txt</code>)</li>
                <li>Restart the dev server</li>
              </ol>
            </div>

            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
              See <code>supabase/README.md</code> for detailed instructions.
            </p>

            <button
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>☁️ Migrate to Cloud</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            This will copy all your localStorage data to Supabase. Your local data will remain unchanged.
          </p>

          <div style={{
            background: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#92400e' }}>
              ⚠️ Important:
            </h3>
            <ul style={{
              margin: '0',
              paddingLeft: '1.5rem',
              color: '#78350f',
              fontSize: '0.85rem'
            }}>
              <li>Make sure you're signed in to Supabase</li>
              <li>This will upload: tasks, completions, events, and journal entries</li>
              <li>Existing cloud data may be duplicated</li>
              <li>Migration may take a few seconds</li>
            </ul>
          </div>

          {result && (
            <div style={{
              padding: '0.75rem',
              background: result.success ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`,
              borderRadius: '8px',
              color: result.success ? '#065f46' : '#dc2626',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {result.success ? '✓' : '✗'} {result.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
              style={{ flex: 1, padding: '0.75rem' }}
            >
              Cancel
            </button>
            <button
              onClick={handleMigrate}
              className="btn-primary"
              disabled={loading || result?.success}
              style={{
                flex: 1,
                padding: '0.75rem',
                opacity: loading || result?.success ? 0.6 : 1,
                cursor: loading || result?.success ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Migrating...' : result?.success ? '✓ Migrated' : 'Migrate Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationModal;


