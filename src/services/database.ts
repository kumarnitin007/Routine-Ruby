/**
 * Database Service Layer
 * 
 * Provides a unified interface for database operations
 * Supports both Supabase (cloud) and localStorage (local) storage
 */

import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { Task, Event, JournalEntry, Routine, Tag, AppData } from '../types';
import * as localStorageService from '../storage';

export type StorageMode = 'supabase' | 'localStorage';

/**
 * Get current storage mode
 */
export const getStorageMode = (): StorageMode => {
  return isSupabaseConfigured() ? 'supabase' : 'localStorage';
};

/**
 * Check if user is authenticated (required for Supabase)
 */
export const isAuthenticated = async (): Promise<boolean> => {
  if (getStorageMode() === 'localStorage') return true;
  
  const client = getSupabaseClient();
  if (!client) return false;
  
  const { data: { user } } = await client.auth.getUser();
  return !!user;
};

// =============================================
// TASKS
// =============================================

export const getTasks = async (): Promise<Task[]> => {
  if (getStorageMode() === 'localStorage') {
    return localStorageService.loadData().tasks;
  }

  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('myday_tasks')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  return data.map(task => ({
    id: task.id,
    name: task.name,
    description: task.description,
    category: task.category,
    color: task.color,
    weightage: task.weightage,
    frequency: task.frequency,
    daysOfWeek: task.days_of_week,
    dayOfMonth: task.day_of_month,
    frequencyCount: task.frequency_count,
    frequencyPeriod: task.frequency_period,
    startDate: task.start_date,
    endDate: task.end_date,
    specificDate: task.specific_date,
    tags: task.tags || []
  }));
};

export const createTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
  if (getStorageMode() === 'localStorage') {
    const newTask = { ...task, id: crypto.randomUUID() };
    const data = localStorageService.loadData();
    data.tasks.push(newTask);
    localStorageService.saveData(data);
    return newTask;
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('myday_tasks')
    .insert([{
      name: task.name,
      description: task.description,
      category: task.category,
      color: task.color,
      weightage: task.weightage,
      frequency: task.frequency,
      days_of_week: task.daysOfWeek,
      day_of_month: task.dayOfMonth,
      frequency_count: task.frequencyCount,
      frequency_period: task.frequencyPeriod,
      start_date: task.startDate,
      end_date: task.endDate,
      specific_date: task.specificDate,
      tags: task.tags || []
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    color: data.color,
    weightage: data.weightage,
    frequency: data.frequency,
    daysOfWeek: data.days_of_week,
    dayOfMonth: data.day_of_month,
    frequencyCount: data.frequency_count,
    frequencyPeriod: data.frequency_period,
    startDate: data.start_date,
    endDate: data.end_date,
    specificDate: data.specific_date,
    tags: data.tags || []
  };
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  if (getStorageMode() === 'localStorage') {
    const data = localStorageService.loadData();
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...updates };
      localStorageService.saveData(data);
    }
    return;
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const dbUpdates: any = {};
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category) dbUpdates.category = updates.category;
  if (updates.color) dbUpdates.color = updates.color;
  if (updates.weightage) dbUpdates.weightage = updates.weightage;
  if (updates.frequency) dbUpdates.frequency = updates.frequency;
  if (updates.daysOfWeek) dbUpdates.days_of_week = updates.daysOfWeek;
  if (updates.dayOfMonth) dbUpdates.day_of_month = updates.dayOfMonth;
  if (updates.frequencyCount) dbUpdates.frequency_count = updates.frequencyCount;
  if (updates.frequencyPeriod) dbUpdates.frequency_period = updates.frequencyPeriod;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
  if (updates.specificDate !== undefined) dbUpdates.specific_date = updates.specificDate;
  if (updates.tags) dbUpdates.tags = updates.tags;

  const { error } = await client
    .from('myday_tasks')
    .update(dbUpdates)
    .eq('id', taskId);

  if (error) throw error;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  if (getStorageMode() === 'localStorage') {
    const data = localStorageService.loadData();
    data.tasks = data.tasks.filter(t => t.id !== taskId);
    localStorageService.saveData(data);
    return;
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { error } = await client
    .from('myday_tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
};

// =============================================
// TASK COMPLETIONS
// =============================================

export const completeTask = async (taskId: string, date: string): Promise<void> => {
  if (getStorageMode() === 'localStorage') {
    localStorageService.completeTask(taskId, date);
    return;
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { error } = await client
    .from('myday_task_completions')
    .insert([{
      task_id: taskId,
      completed_date: date
    }]);

  if (error && !error.message.includes('duplicate')) {
    throw error;
  }
};

export const getTaskCompletions = async (taskId?: string, startDate?: string, endDate?: string): Promise<any[]> => {
  if (getStorageMode() === 'localStorage') {
    const data = localStorageService.loadData();
    let completions = data.completions || [];
    
    if (taskId) {
      completions = completions.filter(c => c.taskId === taskId);
    }
    if (startDate) {
      completions = completions.filter(c => c.date >= startDate);
    }
    if (endDate) {
      completions = completions.filter(c => c.date <= endDate);
    }
    
    return completions;
  }

  const client = getSupabaseClient();
  if (!client) return [];

  let query = client.from('myday_task_completions').select('*');
  
  if (taskId) query = query.eq('task_id', taskId);
  if (startDate) query = query.gte('completed_date', startDate);
  if (endDate) query = query.lte('completed_date', endDate);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching completions:', error);
    return [];
  }

  return data.map(c => ({
    taskId: c.task_id,
    date: c.completed_date
  }));
};

// =============================================
// EVENTS
// =============================================

export const getEvents = async (): Promise<Event[]> => {
  if (getStorageMode() === 'localStorage') {
    return localStorageService.loadData().events || [];
  }

  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('myday_events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data.map(event => ({
    id: event.id,
    name: event.name,
    description: event.description,
    category: event.category,
    date: event.date,
    frequency: event.frequency,
    color: event.color,
    notifyDaysBefore: event.notify_days_before,
    priority: event.priority,
    hideFromDashboard: event.hide_from_dashboard,
    tags: event.tags || []
  }));
};

export const createEvent = async (event: Omit<Event, 'id'>): Promise<Event> => {
  if (getStorageMode() === 'localStorage') {
    const newEvent = { ...event, id: crypto.randomUUID() };
    const data = localStorageService.loadData();
    data.events = data.events || [];
    data.events.push(newEvent);
    localStorageService.saveData(data);
    return newEvent;
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('myday_events')
    .insert([{
      name: event.name,
      description: event.description,
      category: event.category,
      date: event.date,
      frequency: event.frequency,
      color: event.color,
      notify_days_before: event.notifyDaysBefore,
      priority: event.priority,
      hide_from_dashboard: event.hideFromDashboard,
      tags: event.tags || []
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    date: data.date,
    frequency: data.frequency,
    color: data.color,
    notifyDaysBefore: data.notify_days_before,
    priority: data.priority,
    hideFromDashboard: data.hide_from_dashboard,
    tags: data.tags || []
  };
};

export const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<void> => {
  if (getStorageMode() === 'localStorage') {
    const data = localStorageService.loadData();
    const eventIndex = data.events?.findIndex(e => e.id === eventId) ?? -1;
    if (eventIndex >= 0 && data.events) {
      data.events[eventIndex] = { ...data.events[eventIndex], ...updates };
      localStorageService.saveData(data);
    }
    return;
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const dbUpdates: any = {};
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category) dbUpdates.category = updates.category;
  if (updates.date) dbUpdates.date = updates.date;
  if (updates.frequency) dbUpdates.frequency = updates.frequency;
  if (updates.color) dbUpdates.color = updates.color;
  if (updates.notifyDaysBefore !== undefined) dbUpdates.notify_days_before = updates.notifyDaysBefore;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.hideFromDashboard !== undefined) dbUpdates.hide_from_dashboard = updates.hideFromDashboard;
  if (updates.tags) dbUpdates.tags = updates.tags;

  const { error } = await client
    .from('myday_events')
    .update(dbUpdates)
    .eq('id', eventId);

  if (error) throw error;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  if (getStorageMode() === 'localStorage') {
    const data = localStorageService.loadData();
    data.events = data.events?.filter(e => e.id !== eventId) || [];
    localStorageService.saveData(data);
    return;
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { error } = await client
    .from('myday_events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
};

// =============================================
// JOURNAL ENTRIES
// =============================================

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  if (getStorageMode() === 'localStorage') {
    return localStorageService.loadData().journalEntries || [];
  }

  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('myday_journal_entries')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching journal entries:', error);
    return [];
  }

  return data.map(entry => ({
    id: entry.id,
    date: entry.date,
    content: entry.content,
    mood: entry.mood,
    tags: entry.tags || []
  }));
};

export const saveJournalEntry = async (entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> => {
  if (getStorageMode() === 'localStorage') {
    const data = localStorageService.loadData();
    data.journalEntries = data.journalEntries || [];
    const existingIndex = data.journalEntries.findIndex(e => e.date === entry.date);
    
    if (existingIndex >= 0) {
      data.journalEntries[existingIndex] = { ...data.journalEntries[existingIndex], ...entry };
      localStorageService.saveData(data);
      return data.journalEntries[existingIndex];
    } else {
      const newEntry = { ...entry, id: crypto.randomUUID() };
      data.journalEntries.push(newEntry);
      localStorageService.saveData(data);
      return newEntry;
    }
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('myday_journal_entries')
    .upsert([{
      date: entry.date,
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags || []
    }], {
      onConflict: 'user_id,date'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    date: data.date,
    content: data.content,
    mood: data.mood,
    tags: data.tags || []
  };
};

// =============================================
// MIGRATION UTILITIES
// =============================================

/**
 * Migrate data from localStorage to Supabase
 */
export const migrateToSupabase = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase is not configured' };
  }

  try {
    const localData = localStorageService.loadData();
    
    // Migrate tasks
    for (const task of localData.tasks) {
      await createTask(task);
    }
    
    // Migrate completions
    for (const completion of localData.completions || []) {
      await completeTask(completion.taskId, completion.date);
    }
    
    // Migrate events
    for (const event of localData.events || []) {
      await createEvent(event);
    }
    
    // Migrate journal entries
    for (const entry of localData.journalEntries || []) {
      await saveJournalEntry(entry);
    }
    
    return { success: true, message: 'Data migrated successfully!' };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, message: 'Migration failed: ' + (error as Error).message };
  }
};

/**
 * Export all data (for backup)
 */
export const exportAllData = async (): Promise<AppData> => {
  return {
    tasks: await getTasks(),
    completions: await getTaskCompletions(),
    history: [], // TODO: implement if needed
    spillovers: [], // TODO: implement if needed
    events: await getEvents(),
    eventAcknowledgments: [], // TODO: implement if needed
    tags: [], // TODO: implement if needed
    journalEntries: await getJournalEntries(),
    routines: [], // TODO: implement if needed
  };
};


