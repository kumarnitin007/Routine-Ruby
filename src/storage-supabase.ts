/**
 * Supabase Storage Layer
 * 
 * This replaces the localStorage-based storage with Supabase-only operations.
 * All data is stored in and retrieved from Supabase database.
 * User must be authenticated to use the app.
 */

import { getSupabaseClient } from './lib/supabase';
import { AppData, Task, TaskCompletion, Event, JournalEntry, Routine, Tag, UserSettings, DashboardLayout } from './types';
import { getTodayString } from './utils';

// ===== HELPER FUNCTIONS =====

const requireAuth = async () => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured. Please check your .env file.');
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('User must be signed in to access data.');
  
  return { client, userId: user.id };
};

// ===== TASKS =====

export const getTasks = async (): Promise<Task[]> => {
  const { client } = await requireAuth();
  
  const { data, error } = await client
    .from('myday_tasks')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  return (data || []).map(task => ({
    id: task.id,
    name: task.name,
    description: task.description || '',
    category: task.category,
    color: task.color,
    customBackgroundColor: task.custom_background_color,
    weightage: task.weightage,
    frequency: task.frequency,
    daysOfWeek: task.days_of_week,
    dayOfMonth: task.day_of_month,
    customFrequency: task.custom_frequency,
    frequencyCount: task.frequency_count,
    frequencyPeriod: task.frequency_period,
    intervalValue: task.interval_value,
    intervalUnit: task.interval_unit,
    intervalStartDate: task.interval_start_date,
    startDate: task.start_date,
    endDate: task.end_date,
    specificDate: task.specific_date,
    endTime: task.end_time,
    dependentTaskIds: task.dependent_task_ids || [],
    onHold: task.on_hold || false,
    holdStartDate: task.hold_start_date,
    holdEndDate: task.hold_end_date,
    holdReason: task.hold_reason,
    tags: task.tags || [],
    createdAt: task.created_at
  }));
};

export const addTask = async (task: Task): Promise<void> => {
  const { client } = await requireAuth();

  const { error } = await client
    .from('myday_tasks')
    .insert([{
      id: task.id,
      name: task.name,
      description: task.description,
      category: task.category,
      color: task.color,
      custom_background_color: task.customBackgroundColor,
      weightage: task.weightage,
      frequency: task.frequency,
      days_of_week: task.daysOfWeek,
      day_of_month: task.dayOfMonth,
      custom_frequency: task.customFrequency,
      frequency_count: task.frequencyCount,
      frequency_period: task.frequencyPeriod,
      interval_value: task.intervalValue,
      interval_unit: task.intervalUnit,
      interval_start_date: task.intervalStartDate,
      start_date: task.startDate,
      end_date: task.endDate,
      specific_date: task.specificDate,
      end_time: task.endTime,
      dependent_task_ids: task.dependentTaskIds,
      on_hold: task.onHold,
      hold_start_date: task.holdStartDate,
      hold_end_date: task.holdEndDate,
      hold_reason: task.holdReason,
      tags: task.tags,
      created_at: task.createdAt
    }]);

  if (error) throw error;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  const { client } = await requireAuth();

  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.customBackgroundColor !== undefined) dbUpdates.custom_background_color = updates.customBackgroundColor;
  if (updates.weightage !== undefined) dbUpdates.weightage = updates.weightage;
  if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
  if (updates.daysOfWeek !== undefined) dbUpdates.days_of_week = updates.daysOfWeek;
  if (updates.dayOfMonth !== undefined) dbUpdates.day_of_month = updates.dayOfMonth;
  if (updates.customFrequency !== undefined) dbUpdates.custom_frequency = updates.customFrequency;
  if (updates.frequencyCount !== undefined) dbUpdates.frequency_count = updates.frequencyCount;
  if (updates.frequencyPeriod !== undefined) dbUpdates.frequency_period = updates.frequencyPeriod;
  if (updates.intervalValue !== undefined) dbUpdates.interval_value = updates.intervalValue;
  if (updates.intervalUnit !== undefined) dbUpdates.interval_unit = updates.intervalUnit;
  if (updates.intervalStartDate !== undefined) dbUpdates.interval_start_date = updates.intervalStartDate;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
  if (updates.specificDate !== undefined) dbUpdates.specific_date = updates.specificDate;
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
  if (updates.dependentTaskIds !== undefined) dbUpdates.dependent_task_ids = updates.dependentTaskIds;
  if (updates.onHold !== undefined) dbUpdates.on_hold = updates.onHold;
  if (updates.holdStartDate !== undefined) dbUpdates.hold_start_date = updates.holdStartDate;
  if (updates.holdEndDate !== undefined) dbUpdates.hold_end_date = updates.holdEndDate;
  if (updates.holdReason !== undefined) dbUpdates.hold_reason = updates.holdReason;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

  const { error } = await client
    .from('myday_tasks')
    .update(dbUpdates)
    .eq('id', taskId);

  if (error) throw error;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const { client } = await requireAuth();

  const { error } = await client
    .from('myday_tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
};

// ===== TASK COMPLETIONS =====

export const completeTask = async (taskId: string, date: string, durationMinutes?: number): Promise<void> => {
  const { client } = await requireAuth();

  // First, check for dependent tasks and complete them too
  const { data: task } = await client
    .from('myday_tasks')
    .select('dependent_task_ids')
    .eq('id', taskId)
    .single();

  // Mark the main task as complete
  const { error } = await client
    .from('myday_task_completions')
    .upsert([{
      task_id: taskId,
      completed_date: date,
      duration_minutes: durationMinutes,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    }], {
      onConflict: 'task_id,completed_date'
    });

  if (error) throw error;

  // If task has dependents, mark them as complete too
  if (task?.dependent_task_ids && task.dependent_task_ids.length > 0) {
    for (const dependentId of task.dependent_task_ids) {
      await completeTask(dependentId, date, durationMinutes);
    }
  }
};

export const uncompleteTask = async (taskId: string, date: string): Promise<void> => {
  const { client } = await requireAuth();

  const { error } = await client
    .from('myday_task_completions')
    .delete()
    .eq('task_id', taskId)
    .eq('completed_date', date);

  if (error) throw error;
};

export const getCompletions = async (): Promise<TaskCompletion[]> => {
  const { client } = await requireAuth();

  const { data, error } = await client
    .from('myday_task_completions')
    .select('*');

  if (error) {
    console.error('Error fetching completions:', error);
    return [];
  }

  return (data || []).map(c => ({
    taskId: c.task_id,
    date: c.completed_date,
    completedAt: c.completed_at,
    durationMinutes: c.duration_minutes,
    startedAt: c.started_at
  }));
};

// ===== EVENTS =====

export const getEvents = async (): Promise<Event[]> => {
  const { client } = await requireAuth();

  const { data, error } = await client
    .from('myday_events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return (data || []).map(event => ({
    id: event.id,
    name: event.name,
    description: event.description,
    category: event.category,
    date: event.date,
    notificationDays: event.notification_days || 7,
    color: event.color,
    priority: event.priority || 'medium',
    hideFromDashboard: event.hide_from_dashboard || false
  }));
};

export const addEvent = async (event: Event): Promise<void> => {
  const { client } = await requireAuth();

  const { error } = await client
    .from('myday_events')
    .insert([{
      id: event.id,
      name: event.name,
      description: event.description,
      category: event.category,
      date: event.date,
      notification_days: event.notificationDays,
      color: event.color,
      priority: event.priority,
      hide_from_dashboard: event.hideFromDashboard
    }]);

  if (error) throw error;
};

export const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<void> => {
  const { client } = await requireAuth();

  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.notificationDays !== undefined) dbUpdates.notification_days = updates.notificationDays;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.hideFromDashboard !== undefined) dbUpdates.hide_from_dashboard = updates.hideFromDashboard;

  const { error } = await client
    .from('myday_events')
    .update(dbUpdates)
    .eq('id', eventId);

  if (error) throw error;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  const { client } = await requireAuth();

  const { error } = await client
    .from('myday_events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
};

// ===== JOURNAL ENTRIES =====

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  const { client } = await requireAuth();

  const { data, error } = await client
    .from('myday_journal_entries')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching journal entries:', error);
    return [];
  }

  return (data || []).map(entry => ({
    id: entry.id,
    date: entry.date,
    content: entry.content,
    tags: entry.tags || []
  }));
};

export const saveJournalEntry = async (entry: JournalEntry): Promise<void> => {
  const { client } = await requireAuth();

  const { error } = await client
    .from('myday_journal_entries')
    .upsert([{
      id: entry.id,
      date: entry.date,
      content: entry.content,
      tags: entry.tags
    }], {
      onConflict: 'id'
    });

  if (error) throw error;
};

export const deleteJournalEntry = async (entryId: string): Promise<void> => {
  const { client } = await requireAuth();

  const { error } = await client
    .from('myday_journal_entries')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
};

// ===== ROUTINES =====

export const getRoutines = async (): Promise<Routine[]> => {
  const { client } = await requireAuth();

  const { data, error } = await client
    .from('myday_routines')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching routines:', error);
    return [];
  }

  return (data || []).map(routine => ({
    id: routine.id,
    name: routine.name,
    description: routine.description,
    taskIds: routine.task_ids || [],
    timeOfDay: routine.time_of_day
  }));
};

export const saveRoutine = async (routine: Routine): Promise<void> => {
  const { client } = await requireAuth();

  const { error } = await client
    .from('myday_routines')
    .upsert([{
      id: routine.id,
      name: routine.name,
      description: routine.description,
      task_ids: routine.taskIds,
      time_of_day: routine.timeOfDay
    }], {
      onConflict: 'id'
    });

  if (error) throw error;
};

export const deleteRoutine = async (routineId: string): Promise<void> => {
  const { client } = await requireAuth();

  const { error } = await client
    .from('myday_routines')
    .delete()
    .eq('id', routineId);

  if (error) throw error;
};

// ===== TAGS =====

export const getTags = async (): Promise<Tag[]> => {
  const { client } = await requireAuth();

  const { data, error } = await client
    .from('myday_tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  return (data || []).map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    trackable: tag.trackable || false,
    description: tag.description
  }));
};

export const saveTag = async (tag: Tag): Promise<void> => {
  const { client } = await requireAuth();

  const { error } = await client
    .from('myday_tags')
    .upsert([{
      id: tag.id,
      name: tag.name,
      color: tag.color,
      trackable: tag.trackable,
      description: tag.description
    }], {
      onConflict: 'id'
    });

  if (error) throw error;
};

export const deleteTag = async (tagId: string): Promise<void> => {
  const { client } = await requireAuth();

  const { error } = await client
    .from('myday_tags')
    .delete()
    .eq('id', tagId);

  if (error) throw error;
};

// ===== USER SETTINGS =====
// Note: User settings can still be stored in localStorage as they're user-preference based

const USER_SETTINGS_KEY = 'routine-ruby-user-settings';

export const loadUserSettings = (): UserSettings => {
  const stored = localStorage.getItem(USER_SETTINGS_KEY);
  if (!stored) {
    return {
      theme: 'purple',
      avatar: { emoji: '😊', name: 'Smiling Face' },
      username: 'User',
      dashboardLayout: 'uniform'
    };
  }
  return JSON.parse(stored);
};

export const saveUserSettings = (settings: UserSettings): void => {
  localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
};

export const getDashboardLayout = (): DashboardLayout => {
  const settings = loadUserSettings();
  return settings.dashboardLayout || 'uniform';
};

export const saveDashboardLayout = (layout: DashboardLayout): void => {
  const settings = loadUserSettings();
  settings.dashboardLayout = layout;
  saveUserSettings(settings);
};

// ===== ONBOARDING =====

const ONBOARDING_KEY = 'routine-ruby-onboarding-complete';

export const isFirstTimeUser = (): boolean => {
  return !localStorage.getItem(ONBOARDING_KEY);
};

export const markOnboardingComplete = (): void => {
  localStorage.setItem(ONBOARDING_KEY, 'true');
};

// ===== DATA OPERATIONS =====

export const loadData = async (): Promise<AppData> => {
  const [tasks, completions, events, journalEntries, routines, tags] = await Promise.all([
    getTasks(),
    getCompletions(),
    getEvents(),
    getJournalEntries(),
    getRoutines(),
    getTags()
  ]);

  return {
    tasks,
    completions,
    spillovers: [], // Not implemented yet
    events,
    eventAcknowledgments: [], // Not implemented yet
    journalEntries,
    routines,
    tags
  };
};

// ===== CLEAR LOCAL STORAGE =====

export const clearLocalStorage = (): void => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('myday-') || key.startsWith('routine-ruby-')) {
      if (key !== USER_SETTINGS_KEY && key !== ONBOARDING_KEY) {
        localStorage.removeItem(key);
      }
    }
  });
  console.log('🧹 Local storage cleared (except user settings and onboarding status)');
};

// ===== SAMPLE DATA =====

export const importSampleTasks = async (replace: boolean = false): Promise<boolean> => {
  throw new Error('Sample tasks import not supported in Supabase mode. Please create tasks manually or import from file.');
};

export const clearAllData = async (): Promise<void> => {
  throw new Error('Clear all data not supported. Please delete tasks individually or sign out and delete your account.');
};

