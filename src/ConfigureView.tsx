import React, { useState, useEffect } from 'react';
import { Task, FrequencyType, IntervalUnit } from './types';
import { loadData, addTask, updateTask, deleteTask, importSampleTasks, clearAllData } from './storage';
import { generateId, getColorForTask } from './utils';

const ConfigureView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    weightage: 5,
    frequency: 'daily' as FrequencyType,
    daysOfWeek: [] as number[],
    dayOfMonth: 1,
    customFrequency: '',
    frequencyCount: 3,
    frequencyPeriod: 'week' as 'week' | 'month',
    intervalValue: 1,
    intervalUnit: 'days' as IntervalUnit,
    intervalStartDate: '',
    startDate: '',
    endDate: '',
    specificDate: '',
    endTime: '',
    customBackgroundColor: '',
    dependentTaskIds: [] as string[],
    onHold: false,
    holdStartDate: '',
    holdEndDate: '',
    holdReason: ''
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await loadData();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      alert('Error loading tasks. Please make sure you are signed in.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a task name');
      return;
    }

    const task: Task = {
      id: editingId || generateId(),
      name: formData.name,
      description: formData.description,
      category: formData.category || undefined,
      weightage: formData.weightage,
      frequency: formData.frequency,
      daysOfWeek: formData.frequency === 'weekly' ? formData.daysOfWeek : undefined,
      dayOfMonth: formData.frequency === 'monthly' ? formData.dayOfMonth : undefined,
      customFrequency: formData.frequency === 'custom' ? formData.customFrequency : undefined,
      frequencyCount: formData.frequency === 'count-based' ? formData.frequencyCount : undefined,
      frequencyPeriod: formData.frequency === 'count-based' ? formData.frequencyPeriod : undefined,
      intervalValue: formData.frequency === 'interval' ? formData.intervalValue : undefined,
      intervalUnit: formData.frequency === 'interval' ? formData.intervalUnit : undefined,
      intervalStartDate: formData.frequency === 'interval' ? (formData.intervalStartDate || formData.startDate || new Date().toISOString().split('T')[0]) : undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      specificDate: formData.specificDate || undefined,
      endTime: formData.endTime || undefined,
      color: getColorForTask(tasks.length),
      customBackgroundColor: formData.customBackgroundColor || undefined,
      dependentTaskIds: formData.dependentTaskIds.length > 0 ? formData.dependentTaskIds : undefined,
      onHold: formData.onHold || undefined,
      holdStartDate: formData.onHold && formData.holdStartDate ? formData.holdStartDate : undefined,
      holdEndDate: formData.onHold && formData.holdEndDate ? formData.holdEndDate : undefined,
      holdReason: formData.onHold && formData.holdReason ? formData.holdReason : undefined,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        await updateTask(editingId, task);
      } else {
        await addTask(task);
      }

      resetForm();
      await loadTasks();
      alert('Task saved successfully!');
    } catch (error) {
      console.error('Error saving task:', error);
      alert(`Failed to save task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (task: Task) => {
    setIsEditing(true);
    setEditingId(task.id);
    setFormData({
      name: task.name,
      description: task.description || '',
      category: task.category || '',
      weightage: task.weightage,
      frequency: task.frequency,
      daysOfWeek: task.daysOfWeek || [],
      dayOfMonth: task.dayOfMonth || 1,
      customFrequency: task.customFrequency || '',
      frequencyCount: task.frequencyCount || 3,
      frequencyPeriod: task.frequencyPeriod || 'week',
      intervalValue: task.intervalValue || 1,
      intervalUnit: task.intervalUnit || 'days',
      intervalStartDate: task.intervalStartDate || '',
      startDate: task.startDate || '',
      endDate: task.endDate || '',
      specificDate: task.specificDate || '',
      endTime: task.endTime || '',
      customBackgroundColor: task.customBackgroundColor || '',
      dependentTaskIds: task.dependentTaskIds || [],
      onHold: task.onHold || false,
      holdStartDate: task.holdStartDate || '',
      holdEndDate: task.holdEndDate || '',
      holdReason: task.holdReason || ''
    });
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
      loadTasks();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      weightage: 5,
      frequency: 'daily',
      daysOfWeek: [],
      dayOfMonth: 1,
      customFrequency: '',
      frequencyCount: 3,
      frequencyPeriod: 'week',
      intervalValue: 1,
      intervalUnit: 'days',
      intervalStartDate: '',
      startDate: '',
      endDate: '',
      specificDate: '',
      endTime: '',
      customBackgroundColor: '',
      dependentTaskIds: [],
      onHold: false,
      holdStartDate: '',
      holdEndDate: '',
      holdReason: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const toggleWeekday = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getFrequencyDisplay = (task: Task): string => {
    switch (task.frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        if (task.daysOfWeek && task.daysOfWeek.length > 0) {
          return `Weekly: ${task.daysOfWeek.map(d => weekdays[d]).join(', ')}`;
        }
        return 'Weekly';
      case 'monthly':
        return `Monthly: ${task.dayOfMonth}${getOrdinalSuffix(task.dayOfMonth || 1)}`;
      case 'count-based':
        return `${task.frequencyCount} times per ${task.frequencyPeriod}`;
      case 'custom':
        return task.customFrequency || 'Custom';
      case 'interval':
        return `Every ${task.intervalValue} ${task.intervalUnit}`;
      default:
        return task.frequency;
    }
  };

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const handleImportSampleTasks = async () => {
    const clearFirst = confirm('Clear existing data and load fresh sample tasks?\n\nClick OK to clear existing data, or Cancel to add to existing tasks.');
    
    if (clearFirst) {
      if (!confirm('⚠️ This will delete ALL your existing tasks and data. Are you sure?')) {
        return;
      }
    }

    setIsImporting(true);
    const success = await importSampleTasks(clearFirst);
    
    if (success) {
      loadTasks();
      alert(`Sample tasks ${clearFirst ? 'loaded' : 'added'} successfully!`);
    } else {
      alert('Error importing sample tasks. Please try again.');
    }
    
    setIsImporting(false);
  };

  const handleClearAllData = () => {
    if (confirm('⚠️ This will delete ALL your tasks, completions, and history. Are you absolutely sure?')) {
      if (confirm('This action cannot be undone. Proceed?')) {
        clearAllData();
        loadTasks();
        alert('All data cleared successfully!');
      }
    }
  };

  return (
    <div className="configure-view">
      <div className="view-header">
        <h2>{isEditing ? 'Edit Task' : 'Add New Task'}</h2>
      </div>

      <form className="task-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Task Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Walk 10K steps"
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description..."
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Exercise, Study, Self Care"
            list="category-suggestions"
          />
          <datalist id="category-suggestions">
            <option value="Exercise" />
            <option value="Study" />
            <option value="Self Care" />
            <option value="Grocery" />
            <option value="Bill Payment" />
            <option value="Work" />
            <option value="Social" />
            <option value="Health" />
          </datalist>
          <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Optional - helps organize tasks
          </small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Weightage (1-10) *</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.weightage}
              onChange={(e) => setFormData({ ...formData, weightage: parseInt(e.target.value) || 5 })}
              required
            />
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Higher = larger display
            </small>
          </div>

          <div className="form-group">
            <label>Frequency *</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as FrequencyType })}
              required
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="count-based">Count-Based (X times per period)</option>
              <option value="interval">Interval (Every X days/weeks/months/years)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {formData.frequency === 'weekly' && (
          <div className="form-group">
            <label>Select Days *</label>
            <div className="weekday-selector">
              {weekdays.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  className={`weekday-btn ${formData.daysOfWeek.includes(index) ? 'selected' : ''}`}
                  onClick={() => toggleWeekday(index)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {formData.frequency === 'monthly' && (
          <div className="form-group">
            <label>Day of Month *</label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.dayOfMonth}
              onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
        )}

        {formData.frequency === 'count-based' && (
          <div className="form-row">
            <div className="form-group">
              <label>Number of Times *</label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.frequencyCount}
                onChange={(e) => setFormData({ ...formData, frequencyCount: parseInt(e.target.value) || 3 })}
                required
              />
              <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                e.g., 3 for "3 times"
              </small>
            </div>

            <div className="form-group">
              <label>Per Period *</label>
              <select
                value={formData.frequencyPeriod}
                onChange={(e) => setFormData({ ...formData, frequencyPeriod: e.target.value as 'week' | 'month' })}
                required
              >
                <option value="week">Week (Sun-Sat)</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
        )}

        {formData.frequency === 'interval' && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'linear-gradient(135deg, #a78bfa20 0%, #c084fc20 100%)',
            borderRadius: '8px',
            border: '1px solid #a78bfa40'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#7c3aed' }}>
              ⏱️ Interval Settings
            </h4>
            
            <div className="form-row">
              <div className="form-group">
                <label>Repeat Every *</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.intervalValue}
                  onChange={(e) => setFormData({ ...formData, intervalValue: parseInt(e.target.value) || 1 })}
                  required
                  style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  e.g., 47, 90, 365
                </small>
              </div>

              <div className="form-group">
                <label>Time Unit *</label>
                <select
                  value={formData.intervalUnit}
                  onChange={(e) => setFormData({ ...formData, intervalUnit: e.target.value as IntervalUnit })}
                  required
                  style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Start Date (Reference Point) *</label>
              <input
                type="date"
                value={formData.intervalStartDate}
                onChange={(e) => setFormData({ ...formData, intervalStartDate: e.target.value })}
                placeholder="YYYY-MM-DD"
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
              />
              <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                🗓️ Task will repeat every {formData.intervalValue} {formData.intervalUnit} from this date
              </small>
            </div>

            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: '#ede9fe', 
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#5b21b6'
            }}>
              <strong>📋 Examples:</strong>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                <li>Every 47 days: Value=47, Unit=Days</li>
                <li>Every 6 months: Value=6, Unit=Months</li>
                <li>Every 2 years: Value=2, Unit=Years</li>
                <li>Every 3 weeks: Value=3, Unit=Weeks</li>
              </ul>
            </div>
          </div>
        )}

        {formData.frequency === 'custom' && (
          <div className="form-group">
            <label>Custom Frequency *</label>
            <input
              type="text"
              value={formData.customFrequency}
              onChange={(e) => setFormData({ ...formData, customFrequency: e.target.value })}
              placeholder="e.g., 1st of every month, 15th of every month"
              required
            />
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Format: "1st of every month", "15th of every month", etc.
            </small>
          </div>
        )}

        {/* Date Range & One-Time Task Options */}
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
          borderRadius: '8px',
          border: '1px solid #667eea40'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#667eea' }}>
            📅 Date Options (Optional)
          </h4>

          <div className="form-group">
            <label>Specific Date (One-Time Task)</label>
            <input
              type="date"
              value={formData.specificDate}
              onChange={(e) => setFormData({ ...formData, specificDate: e.target.value })}
              placeholder="YYYY-MM-DD"
            />
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              🎯 For one-time tasks on a specific date (overrides frequency)
            </small>
          </div>

          {!formData.specificDate && (
            <>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  placeholder="YYYY-MM-DD"
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  📆 Task won't appear before this date
                </small>
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  min={formData.startDate || undefined}
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  📆 Task won't appear after this date
                </small>
              </div>

              <div className="form-group">
                <label>End Time (for Timer Countdown)</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  placeholder="HH:mm"
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  ⏱️ Set a daily end time to use "Countdown to Task End Time" feature in Timer
                </small>
              </div>
            </>
          )}
        </div>

        {/* Custom Background Color */}
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #fbbf2420 0%, #f5930020 100%)',
          borderRadius: '8px',
          border: '1px solid #fbbf2440'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#ea580c' }}>
            🎨 Custom Background Color (Optional)
          </h4>
          
          <div className="form-group">
            <label>Card Background Color</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="color"
                value={formData.customBackgroundColor || '#ffffff'}
                onChange={(e) => setFormData({ ...formData, customBackgroundColor: e.target.value })}
                style={{ width: '60px', height: '40px', cursor: 'pointer', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
              <input
                type="text"
                value={formData.customBackgroundColor}
                onChange={(e) => setFormData({ ...formData, customBackgroundColor: e.target.value })}
                placeholder="#ffffff or transparent"
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
              {formData.customBackgroundColor && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, customBackgroundColor: '' })}
                  style={{ padding: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              🎨 Choose a custom background color for this task card
            </small>
          </div>
        </div>

        {/* Dependent Tasks */}
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #06b6d420 0%, #0891b220 100%)',
          borderRadius: '8px',
          border: '1px solid #06b6d440'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#0891b2' }}>
            🔗 Dependent Tasks (Auto-Complete)
          </h4>
          
          <div className="form-group">
            <label>Parent Tasks (Completing these will auto-complete THIS task)</label>
            <div style={{ marginTop: '0.5rem' }}>
              {tasks.filter(t => t.id !== editingId).length === 0 ? (
                <small style={{ color: '#6b7280' }}>No other tasks available</small>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '4px', padding: '0.5rem' }}>
                  {tasks.filter(t => t.id !== editingId).map(task => (
                    <label key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: formData.dependentTaskIds.includes(task.id) ? '#e0f2fe' : 'white', borderRadius: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.dependentTaskIds.includes(task.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, dependentTaskIds: [...formData.dependentTaskIds, task.id] });
                          } else {
                            setFormData({ ...formData, dependentTaskIds: formData.dependentTaskIds.filter(id => id !== task.id) });
                          }
                        }}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: formData.dependentTaskIds.includes(task.id) ? 600 : 400 }}>
                        {task.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
              🔗 Example: "Walk 5K" auto-completes when "Walk 10K" is marked done
            </small>
          </div>
        </div>

        {/* Hold Task Options */}
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #f4433620 0%, #dc262620 100%)',
          borderRadius: '8px',
          border: '1px solid #f4433640'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#dc2626' }}>
            ⏸️ Hold Task (Pause Tracking)
          </h4>
          
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.onHold}
                onChange={(e) => setFormData({ ...formData, onHold: e.target.checked })}
              />
              <span style={{ fontWeight: 600 }}>Put this task on hold</span>
            </label>
            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              ⏸️ Paused tasks won't show up and won't count as missed days
            </small>
          </div>

          {formData.onHold && (
            <>
              <div className="form-group">
                <label>Hold Start Date</label>
                <input
                  type="date"
                  value={formData.holdStartDate}
                  onChange={(e) => setFormData({ ...formData, holdStartDate: e.target.value })}
                  placeholder="YYYY-MM-DD"
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  📅 When should the hold start? (defaults to today if empty)
                </small>
              </div>

              <div className="form-group">
                <label>Hold End Date (Optional)</label>
                <input
                  type="date"
                  value={formData.holdEndDate}
                  onChange={(e) => setFormData({ ...formData, holdEndDate: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  min={formData.holdStartDate || undefined}
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  📅 Auto-resume on this date (leave empty for manual resume)
                </small>
              </div>

              <div className="form-group">
                <label>Hold Reason (Optional)</label>
                <input
                  type="text"
                  value={formData.holdReason}
                  onChange={(e) => setFormData({ ...formData, holdReason: e.target.value })}
                  placeholder="e.g., Vacation, Injury, etc."
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  📝 Why is this task on hold?
                </small>
              </div>
            </>
          )}
        </div>

        <div className="form-actions">
          {isEditing && (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary">
            {isEditing ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </form>

      <div className="tasks-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>All Tasks ({tasks.length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className="btn-secondary" 
              onClick={handleImportSampleTasks}
              disabled={isImporting}
              style={{ background: '#3b82f6', color: 'white' }}
            >
              {isImporting ? 'Loading...' : '📥 Load Sample Tasks'}
            </button>
            {tasks.length > 0 && (
              <button 
                className="btn-secondary" 
                onClick={handleClearAllData}
                style={{ background: '#ef4444', color: 'white' }}
              >
                🗑️ Clear All Data
              </button>
            )}
          </div>
        </div>
        {tasks.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No tasks yet. Add your first task above!
          </p>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className="task-item"
              style={{ '--task-color': task.color } as React.CSSProperties}
            >
              <div className="task-item-header">
                <div>
                  <h4>{task.name}</h4>
                  {task.description && <p>{task.description}</p>}
                  <div className="task-meta">
                    {task.category && <span>📁 {task.category}</span>}
                    <span>Weightage: {task.weightage}/10</span>
                    <span>{getFrequencyDisplay(task)}</span>
                    {task.specificDate && <span>🎯 One-time: {task.specificDate}</span>}
                    {!task.specificDate && task.startDate && <span>📆 From: {task.startDate}</span>}
                    {!task.specificDate && task.endDate && <span>📆 Until: {task.endDate}</span>}
                  </div>
                </div>
                <div className="task-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(task)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(task.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConfigureView;

