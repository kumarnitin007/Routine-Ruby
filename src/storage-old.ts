import { AppData, Task, TaskCompletion, TaskSpillover, Event, EventAcknowledgment, Tag, JournalEntry, Routine, UserSettings, DashboardLayout } from './types';

const STORAGE_KEY = 'myday-app-data';
const TASK_ORDER_KEY = 'myday-task-order';

const defaultData: AppData = {
  tasks: [],
  completions: [],
  spillovers: [],
  events: [],
  eventAcknowledgments: [],
  tags: [],
  journalEntries: [],
  routines: []
};

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Ensure backward compatibility - add missing fields
      return {
        tasks: data.tasks || [],
        completions: data.completions || [],
        spillovers: data.spillovers || [],
        events: data.events || [],
        eventAcknowledgments: data.eventAcknowledgments || [],
        tags: data.tags || [],
        journalEntries: data.journalEntries || [],
        routines: data.routines || []
      };
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return defaultData;
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

/**
 * Get all tasks
 */
export const getTasks = (): Task[] => {
  const data = loadData();
  return data.tasks;
};

/**
 * Get all task history/completions
 */
export const getTaskHistory = (): TaskCompletion[] => {
  const data = loadData();
  return data.completions;
};

/**
 * Get all task spillovers
 */
export const getTaskSpillovers = (): TaskSpillover[] => {
  const data = loadData();
  return data.spillovers;
};

export const addTask = (task: Task): void => {
  const data = loadData();
  data.tasks.push(task);
  saveData(data);
};

export const updateTask = (taskId: string, updates: Partial<Task>): void => {
  const data = loadData();
  const index = data.tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    data.tasks[index] = { ...data.tasks[index], ...updates };
    saveData(data);
  }
};

export const deleteTask = (taskId: string): void => {
  const data = loadData();
  data.tasks = data.tasks.filter(t => t.id !== taskId);
  saveData(data);
};

export const completeTask = (taskId: string, date: string, durationMinutes?: number, startedAt?: string): void => {
  const data = loadData();
  const completion: TaskCompletion = {
    taskId,
    date,
    completedAt: new Date().toISOString(),
    durationMinutes,
    startedAt
  };
  data.completions.push(completion);
  saveData(data);
};

export const isTaskCompletedToday = (taskId: string, date: string): boolean => {
  const data = loadData();
  return data.completions.some(c => c.taskId === taskId && c.date === date);
};

export const getTaskCompletions = (taskId: string): TaskCompletion[] => {
  const data = loadData();
  return data.completions.filter(c => c.taskId === taskId);
};

export const moveTaskToNextDay = (taskId: string, fromDate: string, toDate: string): void => {
  const data = loadData();
  const spillover: TaskSpillover = {
    taskId,
    fromDate,
    toDate,
    movedAt: new Date().toISOString()
  };
  data.spillovers.push(spillover);
  saveData(data);
};

export const getTaskSpilloversForDate = (date: string): TaskSpillover[] => {
  const data = loadData();
  return data.spillovers.filter(s => s.toDate === date);
};

export const getTaskCompletionsInRange = (taskId: string, startDate: string, endDate: string): TaskCompletion[] => {
  const data = loadData();
  return data.completions.filter(c => 
    c.taskId === taskId && c.date >= startDate && c.date <= endDate
  );
};

export const getCompletionCountForPeriod = (taskId: string, startDate: string, endDate: string): number => {
  return getTaskCompletionsInRange(taskId, startDate, endDate).length;
};

export const clearAllData = (): void => {
  saveData(defaultData);
};

export const importSampleTasks = async (clearExisting: boolean = false): Promise<boolean> => {
  try {
    const response = await fetch('/sample-tasks.json');
    const sampleTasks = await response.json();
    
    const data = clearExisting ? { ...defaultData } : loadData();
    
    // Generate IDs and colors for sample tasks
    sampleTasks.forEach((taskData: any, index: number) => {
      const task: Task = {
        ...taskData,
        id: `sample-${Date.now()}-${index}`,
        color: getColorForTask(data.tasks.length + index),
        createdAt: new Date().toISOString()
      };
      data.tasks.push(task);
    });
    
    saveData(data);
    return true;
  } catch (error) {
    console.error('Error importing sample tasks:', error);
    return false;
  }
};

// Helper function to get color (duplicate from utils.ts to avoid circular dependency)
function getColorForTask(index: number): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
  ];
  return colors[index % colors.length];
}

/**
 * Save custom task order for Today view
 */
export const saveTaskOrder = (taskIds: string[]): void => {
  try {
    localStorage.setItem(TASK_ORDER_KEY, JSON.stringify(taskIds));
  } catch (error) {
    console.error('Error saving task order:', error);
  }
};

/**
 * Load custom task order for Today view
 */
export const loadTaskOrder = (): string[] => {
  try {
    const stored = localStorage.getItem(TASK_ORDER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading task order:', error);
  }
  return [];
};

// ============================================================================
// EVENT MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all events
 */
export const getEvents = (): Event[] => {
  const data = loadData();
  return data.events || [];
};

/**
 * Add a new event
 */
export const addEvent = (event: Event): void => {
  const data = loadData();
  data.events.push(event);
  saveData(data);
};

/**
 * Update an existing event
 */
export const updateEvent = (eventId: string, updates: Partial<Event>): void => {
  const data = loadData();
  const index = data.events.findIndex(e => e.id === eventId);
  if (index !== -1) {
    data.events[index] = { ...data.events[index], ...updates };
    saveData(data);
  }
};

/**
 * Delete an event
 */
export const deleteEvent = (eventId: string): void => {
  const data = loadData();
  data.events = data.events.filter(e => e.id !== eventId);
  saveData(data);
};

/**
 * Get events for a specific date (formatted as YYYY-MM-DD)
 * Considers both yearly and one-time events
 */
export const getEventsForDate = (dateStr: string): Event[] => {
  const data = loadData();
  const [year, month, day] = dateStr.split('-');
  const monthDay = `${month}-${day}`;
  
  return data.events.filter(event => {
    if (event.frequency === 'yearly') {
      // For yearly events, match MM-DD
      return event.date === monthDay;
    } else if (event.frequency === 'one-time') {
      // For one-time events, match full date
      return event.date === dateStr;
    }
    return false;
  });
};

/**
 * Get upcoming events (within next N days)
 */
export const getUpcomingEvents = (daysAhead: number = 7): Array<{ event: Event; date: string; daysUntil: number }> => {
  const data = loadData();
  const today = new Date();
  const upcoming: Array<{ event: Event; date: string; daysUntil: number }> = [];
  
  for (let i = 0; i <= daysAhead; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const monthDay = dateStr.substring(5); // MM-DD
    
    data.events.forEach(event => {
      const notifyDays = event.notifyDaysBefore || 0;
      
      if (event.frequency === 'yearly') {
        if (event.date === monthDay && i <= notifyDays) {
          upcoming.push({
            event,
            date: dateStr,
            daysUntil: i
          });
        }
      } else if (event.frequency === 'one-time') {
        if (event.date === dateStr && i <= notifyDays) {
          upcoming.push({
            event,
            date: dateStr,
            daysUntil: i
          });
        }
      }
    });
  }
  
  return upcoming;
};

/**
 * Import events from JSON file
 */
export const importSampleEvents = async (): Promise<void> => {
  try {
    const response = await fetch('/sample-events.json');
    const sampleEvents: Event[] = await response.json();
    
    const data = loadData();
    // Add sample events with unique IDs
    sampleEvents.forEach(event => {
      data.events.push({
        ...event,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      });
    });
    
    saveData(data);
    console.log('Sample events imported successfully');
  } catch (error) {
    console.error('Error importing sample events:', error);
    throw error;
  }
};

// ============================================================================
// EVENT ACKNOWLEDGMENT FUNCTIONS
// ============================================================================

/**
 * Mark an event as acknowledged/read for a specific date
 */
export const acknowledgeEvent = (eventId: string, date: string): void => {
  const data = loadData();
  const acknowledgment: EventAcknowledgment = {
    eventId,
    date,
    acknowledgedAt: new Date().toISOString()
  };
  
  // Check if already acknowledged
  const exists = data.eventAcknowledgments.some(
    a => a.eventId === eventId && a.date === date
  );
  
  if (!exists) {
    data.eventAcknowledgments.push(acknowledgment);
    saveData(data);
  }
};

/**
 * Check if an event is acknowledged for a specific date
 */
export const isEventAcknowledged = (eventId: string, date: string): boolean => {
  const data = loadData();
  return data.eventAcknowledgments.some(
    a => a.eventId === eventId && a.date === date
  );
};

/**
 * Get all acknowledgments for a specific event
 */
export const getEventAcknowledgments = (eventId: string): EventAcknowledgment[] => {
  const data = loadData();
  return data.eventAcknowledgments.filter(a => a.eventId === eventId);
};

// ============================================================================
// TAG MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all tags
 */
export const getTags = (): Tag[] => {
  const data = loadData();
  return data.tags;
};

/**
 * Add a new tag
 */
export const addTag = (tag: Tag): void => {
  const data = loadData();
  data.tags.push(tag);
  saveData(data);
};

/**
 * Update a tag
 */
export const updateTag = (tagId: string, updates: Partial<Tag>): void => {
  const data = loadData();
  const index = data.tags.findIndex(t => t.id === tagId);
  if (index !== -1) {
    data.tags[index] = { ...data.tags[index], ...updates };
    saveData(data);
  }
};

/**
 * Delete a tag
 */
export const deleteTag = (tagId: string): void => {
  const data = loadData();
  data.tags = data.tags.filter(t => t.id !== tagId);
  
  // Remove tag from all tasks and events
  data.tasks.forEach(task => {
    if (task.tags) {
      task.tags = task.tags.filter(t => t !== tagId);
    }
  });
  
  data.events.forEach(event => {
    if (event.tags) {
      event.tags = event.tags.filter(t => t !== tagId);
    }
  });
  
  saveData(data);
};

/**
 * Get tag by ID
 */
export const getTagById = (tagId: string): Tag | undefined => {
  const data = loadData();
  return data.tags.find(t => t.id === tagId);
};

// ============================================================================
// JOURNAL ENTRY FUNCTIONS
// ============================================================================

/**
 * Get all journal entries
 */
export const getJournalEntries = (): JournalEntry[] => {
  const data = loadData();
  return data.journalEntries.sort((a, b) => b.date.localeCompare(a.date));
};

/**
 * Get journal entry for a specific date
 */
export const getJournalEntryByDate = (date: string): JournalEntry | undefined => {
  const data = loadData();
  return data.journalEntries.find(e => e.date === date);
};

/**
 * Add or update journal entry
 */
export const saveJournalEntry = (entry: JournalEntry): void => {
  const data = loadData();
  const existingIndex = data.journalEntries.findIndex(e => e.date === entry.date);
  
  if (existingIndex !== -1) {
    // Update existing entry
    data.journalEntries[existingIndex] = {
      ...entry,
      updatedAt: new Date().toISOString()
    };
  } else {
    // Add new entry
    data.journalEntries.push(entry);
  }
  
  saveData(data);
};

/**
 * Delete journal entry
 */
export const deleteJournalEntry = (entryId: string): void => {
  const data = loadData();
  data.journalEntries = data.journalEntries.filter(e => e.id !== entryId);
  saveData(data);
};

/**
 * Get journal entries for a date range
 */
export const getJournalEntriesInRange = (startDate: string, endDate: string): JournalEntry[] => {
  const data = loadData();
  return data.journalEntries.filter(e => e.date >= startDate && e.date <= endDate);
};

// ============================================================================
// ROUTINE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all routines
 */
export const getRoutines = (): Routine[] => {
  const data = loadData();
  return data.routines;
};

/**
 * Get pre-defined routines
 */
export const getPreDefinedRoutines = (): Routine[] => {
  const data = loadData();
  return data.routines.filter(r => r.isPreDefined);
};

/**
 * Get user-created routines
 */
export const getUserRoutines = (): Routine[] => {
  const data = loadData();
  return data.routines.filter(r => !r.isPreDefined);
};

/**
 * Add a new routine
 */
export const addRoutine = (routine: Routine): void => {
  const data = loadData();
  data.routines.push(routine);
  saveData(data);
};

/**
 * Update a routine
 */
export const updateRoutine = (routineId: string, updates: Partial<Routine>): void => {
  const data = loadData();
  const index = data.routines.findIndex(r => r.id === routineId);
  if (index !== -1) {
    data.routines[index] = { ...data.routines[index], ...updates };
    saveData(data);
  }
};

/**
 * Delete a routine
 */
export const deleteRoutine = (routineId: string): void => {
  const data = loadData();
  data.routines = data.routines.filter(r => r.id !== routineId);
  saveData(data);
};

/**
 * Apply routine - add all tasks from routine to today with the routine's time-of-day
 */
export const applyRoutine = (routineId: string): Task[] => {
  const data = loadData();
  const routine = data.routines.find(r => r.id === routineId);
  if (!routine) return [];
  
  const tasks = data.tasks.filter(t => routine.taskIds.includes(t.id));
  return tasks;
};

/**
 * Initialize default pre-defined routines
 */
export const initializeDefaultRoutines = (): void => {
  const data = loadData();
  
  // Only initialize if no routines exist
  if (data.routines.length > 0) return;
  
  const defaultRoutines: Routine[] = [
    {
      id: crypto.randomUUID(),
      name: 'Morning Routine',
      description: 'Start your day right',
      timeOfDay: 'morning',
      taskIds: [], // Will be populated when user adds tasks to routine
      isPreDefined: true,
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Evening Routine',
      description: 'Wind down and prepare for tomorrow',
      timeOfDay: 'evening',
      taskIds: [],
      isPreDefined: true,
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Workout Routine',
      description: 'Exercise and stay healthy',
      timeOfDay: 'anytime',
      taskIds: [],
      isPreDefined: true,
      createdAt: new Date().toISOString()
    }
  ];
  
  data.routines = defaultRoutines;
  saveData(data);
};

// ===== USER SETTINGS =====

const USER_SETTINGS_KEY = 'myday-user-settings';
const ONBOARDING_KEY = 'myday-onboarding-complete';

const defaultSettings: UserSettings = {
  dashboardLayout: 'uniform',
  theme: 'default',
  notifications: true
};

export const getUserSettings = (): UserSettings => {
  try {
    const stored = localStorage.getItem(USER_SETTINGS_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      return { ...defaultSettings, ...settings };
    }
  } catch (e) {
    console.error('Error loading user settings:', e);
  }
  return defaultSettings;
};

// ===== ONBOARDING =====

export const isFirstTimeUser = (): boolean => {
  try {
    const hasData = localStorage.getItem(STORAGE_KEY);
    const onboardingComplete = localStorage.getItem(ONBOARDING_KEY);
    
    // First time if no data exists and onboarding not marked complete
    return !hasData && !onboardingComplete;
  } catch (e) {
    return false;
  }
};

export const markOnboardingComplete = (): void => {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (e) {
    console.error('Error marking onboarding complete:', e);
  }
};

export const saveUserSettings = (settings: Partial<UserSettings>): void => {
  try {
    const current = getUserSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving user settings:', e);
  }
};

export const getDashboardLayout = (): DashboardLayout => {
  return getUserSettings().dashboardLayout;
};

export const setDashboardLayout = (layout: DashboardLayout): void => {
  saveUserSettings({ dashboardLayout: layout });
};

// ===== BULK HOLD/UNHOLD =====

export const bulkHoldTasks = (holdEndDate?: string, holdReason?: string): void => {
  const data = loadData();
  const today = new Date().toISOString().split('T')[0];
  
  data.tasks = data.tasks.map(task => ({
    ...task,
    onHold: true,
    holdStartDate: today,
    holdEndDate: holdEndDate || undefined,
    holdReason: holdReason || undefined
  }));
  
  saveData(data);
};

export const bulkUnholdTasks = (): void => {
  const data = loadData();
  
  data.tasks = data.tasks.map(task => ({
    ...task,
    onHold: false,
    holdStartDate: undefined,
    holdEndDate: undefined,
    holdReason: undefined
  }));
  
  saveData(data);
};

