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

// Generate a valid UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const requireAuth = async () => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase not configured. Please check your .env file.');
  }
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    throw new Error('User must be signed in to access data.');
  }
  
  return { client, userId: user.id };
};

// ===== TASKS =====

export const getTasks = async (): Promise<Task[]> => {
  const { client } = await requireAuth();
  
  const { data, error } = await client
    .from('myday_tasks')
    .select('*')
    .order('created_at', { ascending: false });

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
  const { client, userId } = await requireAuth();

  const taskData = {
    id: generateUUID(),
    user_id: userId,
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
  };
  
  const { error } = await client
    .from('myday_tasks')
    .insert([taskData]);

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
  const { client, userId } = await requireAuth();

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
      user_id: userId,
      task_id: taskId,
      completion_date: date,
      duration_minutes: durationMinutes,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    }], {
      onConflict: 'user_id,task_id,completion_date'
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
    .eq('completion_date', date);

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
    date: c.completion_date,
    completedAt: c.completed_at,
    durationMinutes: c.duration_minutes,
    startedAt: c.started_at
  }));
};

// Alias for getCompletions (for backward compatibility)
export const getTaskHistory = getCompletions;

// ===== EVENTS =====

/**
 * Generate reminder records for an event based on notifyDaysBefore
 * Reminder dates follow the same pattern as event dates:
 * - MM-DD format for yearly events
 * - YYYY-MM-DD format for one-time events
 */
const generateEventReminders = async (event: Event, eventId: string): Promise<void> => {
  if (!event.notifyDaysBefore || event.notifyDaysBefore === 0) return;
  
  const { client, userId } = await requireAuth();
  
  // Delete existing reminders for this event
  await client
    .from('myday_notifybeforedays')
    .delete()
    .eq('event_id', eventId);
  
  const reminders: Array<{ reminder_date: string; days_until_event: number }> = [];
  
  if (event.frequency === 'yearly') {
    // For yearly events: Generate reminders for the upcoming occurrence only
    // Since reminder_date is stored as MM-DD (same pattern as event), we only need one set
    
    // Normalize date format: handle both MM-DD and YYYY-MM-DD formats
    let month: number, day: number;
    const dateParts = event.date.split('-').map(Number);
    
    if (dateParts.length === 3) {
      // YYYY-MM-DD format: extract month and day
      [, month, day] = dateParts; // Skip year, get month and day
    } else if (dateParts.length === 2) {
      // MM-DD format: use as-is
      [month, day] = dateParts;
    } else {
      console.error('Invalid date format for yearly event:', event.date);
      return; // Skip reminder generation if date format is invalid
    }
    
    // Validate month and day
    if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      console.error('Invalid month or day for yearly event:', event.date, 'month:', month, 'day:', day);
      return; // Skip reminder generation if values are invalid
    }
    
    // Calculate the next occurrence of this event
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    let eventDate = new Date(currentYear, month - 1, day);
    eventDate.setHours(0, 0, 0, 0);
    
    // If event already passed this year, use next year
    if (eventDate < today) {
      eventDate = new Date(currentYear + 1, month - 1, day);
      eventDate.setHours(0, 0, 0, 0);
    }
    
    // Generate reminder dates (1 to notifyDaysBefore days before event)
    // Store as MM-DD format to match event pattern
    for (let d = 1; d <= event.notifyDaysBefore; d++) {
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - d);
      const reminderDateStr = `${String(reminderDate.getMonth() + 1).padStart(2, '0')}-${String(reminderDate.getDate()).padStart(2, '0')}`;
      reminders.push({ reminder_date: reminderDateStr, days_until_event: d });
    }
  } else if (event.frequency === 'one-time') {
    // For one-time events: Generate reminders for that specific date
    const eventDate = new Date(event.date + 'T00:00:00');
    
    for (let d = 1; d <= event.notifyDaysBefore; d++) {
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - d);
      const reminderDateStr = reminderDate.toISOString().split('T')[0]; // YYYY-MM-DD
      reminders.push({ reminder_date: reminderDateStr, days_until_event: d });
    }
  }
  
  // Insert reminder records
  if (reminders.length > 0) {
    const reminderRecords = reminders.map(r => ({
      user_id: userId,
      event_id: eventId,
      reminder_date: r.reminder_date,
      days_until_event: r.days_until_event,
      frequency: event.frequency
    }));
    
    const { error } = await client
      .from('myday_notifybeforedays')
      .insert(reminderRecords);
    
    if (error) {
      console.error('Error generating reminders:', error);
      throw error;
    }
  }
};

export const getEvents = async (): Promise<Event[]> => {
  const { client } = await requireAuth();

  // Select all columns including date_text (from migration)
  // Note: 'date' column doesn't exist, use date_text or event_date
  const { data, error } = await client
    .from('myday_events')
    .select('id, name, description, category, tags, date_text, event_date, frequency, custom_frequency, year, notify_days_before, color, priority, hide_from_dashboard, created_at')
    .order('date_text', { ascending: true, nullsFirst: true })
    .order('event_date', { ascending: true, nullsFirst: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return (data || []).map(event => {
    // Use date_text if available (from migration), fall back to event_date
    // date_text is preferred as it supports MM-DD format for yearly events
    let eventDate = event.date_text || event.event_date;
    
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      category: event.category,
      tags: event.tags || [],
      date: eventDate,
      frequency: event.frequency || 'yearly',
      customFrequency: event.custom_frequency,
      year: event.year,
      notifyDaysBefore: event.notify_days_before || 0,
      color: event.color,
      priority: event.priority || 5,
      hideFromDashboard: event.hide_from_dashboard || false,
      createdAt: event.created_at || new Date().toISOString()
    };
  });
};

export const addEvent = async (event: Event): Promise<void> => {
  const { client, userId } = await requireAuth();
  const eventId = generateUUID();

  // Normalize date format based on frequency
  let normalizedDate = event.date;
  if (event.frequency === 'yearly') {
    // For yearly events, ensure date is in MM-DD format
    const dateParts = event.date.split('-').map(Number);
    if (dateParts.length === 3) {
      // YYYY-MM-DD format: convert to MM-DD
      const [, month, day] = dateParts;
      normalizedDate = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else if (dateParts.length === 2) {
      // Already in MM-DD format
      normalizedDate = event.date;
    }
  }
  // For one-time events, keep YYYY-MM-DD format

  // Insert event
  const { error } = await client
    .from('myday_events')
    .insert([{
      id: eventId,
      user_id: userId,
      name: event.name,
      description: event.description,
      category: event.category,
      tags: event.tags || [],
      event_date: normalizedDate,
      date_text: normalizedDate, // Store in date_text for consistency
      notify_days_before: event.notifyDaysBefore || 0,
      color: event.color,
      priority: event.priority || 5,
      hide_from_dashboard: event.hideFromDashboard || false,
      frequency: event.frequency || 'yearly',
      custom_frequency: event.customFrequency,
      year: event.year
    }]);

  if (error) throw error;
  
  // Generate reminders if notifyDaysBefore > 0
  // Use normalized date for reminder generation
  if (event.notifyDaysBefore && event.notifyDaysBefore > 0) {
    const eventWithNormalizedDate = { ...event, date: normalizedDate };
    await generateEventReminders(eventWithNormalizedDate, eventId);
  }
};

export const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<void> => {
  const { client } = await requireAuth();

  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.date !== undefined) {
    dbUpdates.event_date = updates.date;
    dbUpdates.date_text = updates.date; // Update both for consistency
  }
  if (updates.notifyDaysBefore !== undefined) dbUpdates.notify_days_before = updates.notifyDaysBefore;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.hideFromDashboard !== undefined) dbUpdates.hide_from_dashboard = updates.hideFromDashboard;
  if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
  if (updates.customFrequency !== undefined) dbUpdates.custom_frequency = updates.customFrequency;
  if (updates.year !== undefined) dbUpdates.year = updates.year;

  const { error } = await client
    .from('myday_events')
    .update(dbUpdates)
    .eq('id', eventId);

  if (error) throw error;
  
  // If date or notifyDaysBefore changed, regenerate reminders
  if (updates.date !== undefined || updates.notifyDaysBefore !== undefined || updates.frequency !== undefined) {
    // Get full event to regenerate reminders
    const events = await getEvents();
    const fullEvent = events.find(e => e.id === eventId);
    if (fullEvent) {
      // Merge updates into full event
      const updatedEvent = { ...fullEvent, ...updates };
      await generateEventReminders(updatedEvent, eventId);
    }
  }
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
    .order('entry_date', { ascending: false });

  if (error) {
    console.error('Error fetching journal entries:', error);
    return [];
  }

  return (data || []).map(entry => ({
    id: entry.id,
    date: entry.entry_date,
    content: entry.content,
    mood: entry.mood,
    tags: entry.tags || [],
    createdAt: entry.created_at || new Date().toISOString(),
    updatedAt: entry.updated_at || new Date().toISOString()
  }));
};

export const saveJournalEntry = async (entry: JournalEntry): Promise<void> => {
  const { client, userId } = await requireAuth();

  const { error } = await client
    .from('myday_journal_entries')
    .upsert([{
      id: entry.id || generateUUID(),
      user_id: userId,
      entry_date: entry.date,
      content: entry.content,
      tags: entry.tags
    }], {
      onConflict: 'user_id,entry_date'
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

export const getJournalEntryByDate = async (date: string): Promise<JournalEntry | null> => {
  const entries = await getJournalEntries();
  return entries.find(e => e.date === date) || null;
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
    timeOfDay: routine.time_of_day,
    isPreDefined: routine.is_pre_defined || false,
    isActive: routine.is_active !== false, // Default to true for backward compatibility
    createdAt: routine.created_at || new Date().toISOString()
  }));
};

export const saveRoutine = async (routine: Routine): Promise<void> => {
  const { client, userId } = await requireAuth();

  const { error } = await client
    .from('myday_routines')
    .upsert([{
      id: routine.id || generateUUID(),
      user_id: userId,
      name: routine.name,
      description: routine.description,
      task_ids: routine.taskIds,
      time_of_day: routine.timeOfDay,
      is_pre_defined: routine.isPreDefined || false,
      is_active: routine.isActive !== false
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

// Aliases for backward compatibility
export const addRoutine = saveRoutine;
export const updateRoutine = async (routineId: string, updates: Partial<Routine>): Promise<void> => {
  const routines = await getRoutines();
  const routine = routines.find(r => r.id === routineId);
  if (!routine) throw new Error('Routine not found');
  await saveRoutine({ ...routine, ...updates });
};

export const initializeDefaultRoutines = async (): Promise<void> => {
  try {
    const { client, userId } = await requireAuth();
    
    // Check if sample routines already exist
    const { data: existingRoutines, error: checkError } = await client
      .from('myday_routines')
      .select('id')
      .eq('user_id', userId)
      .eq('is_pre_defined', true);

    if (checkError) throw checkError;
    
    // If sample routines already exist, don't create duplicates
    if (existingRoutines && existingRoutines.length > 0) {
      return;
    }

    // Create sample routines (inactive by default)
    const sampleRoutines = [
      {
        id: generateUUID(),
        user_id: userId,
        name: '🌅 Morning Energizer',
        description: 'Start your day with energy and focus',
        time_of_day: 'morning',
        task_ids: [],
        is_pre_defined: true,
        is_active: false,
        created_at: new Date().toISOString()
      },
      {
        id: generateUUID(),
        user_id: userId,
        name: '🌙 Evening Wind Down',
        description: 'Relax and prepare for restful sleep',
        time_of_day: 'evening',
        task_ids: [],
        is_pre_defined: true,
        is_active: false,
        created_at: new Date().toISOString()
      },
      {
        id: generateUUID(),
        user_id: userId,
        name: '💪 Workout Session',
        description: 'Complete workout and fitness routine',
        time_of_day: 'anytime',
        task_ids: [],
        is_pre_defined: true,
        is_active: false,
        created_at: new Date().toISOString()
      },
      {
        id: generateUUID(),
        user_id: userId,
        name: '🧘 Mindfulness Break',
        description: 'Meditation, breathing, and mental reset',
        time_of_day: 'anytime',
        task_ids: [],
        is_pre_defined: true,
        is_active: false,
        created_at: new Date().toISOString()
      },
      {
        id: generateUUID(),
        user_id: userId,
        name: '📚 Study Session',
        description: 'Focused learning and skill development',
        time_of_day: 'afternoon',
        task_ids: [],
        is_pre_defined: true,
        is_active: false,
        created_at: new Date().toISOString()
      },
      {
        id: generateUUID(),
        user_id: userId,
        name: '🏠 Home Reset',
        description: 'Quick cleaning and organization routine',
        time_of_day: 'anytime',
        task_ids: [],
        is_pre_defined: true,
        is_active: false,
        created_at: new Date().toISOString()
      }
    ];

    const { error: insertError } = await client
      .from('myday_routines')
      .insert(sampleRoutines);

    if (insertError) throw insertError;
    
    console.log('✅ Sample routines initialized successfully');
  } catch (error) {
    console.error('Error initializing sample routines:', error);
  }
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
    description: tag.description,
    createdAt: tag.created_at || new Date().toISOString()
  }));
};

export const saveTag = async (tag: Tag): Promise<void> => {
  const { client, userId } = await requireAuth();

  const { error } = await client
    .from('myday_tags')
    .upsert([{
      id: tag.id || generateUUID(),
      user_id: userId,
      name: tag.name,
      color: tag.color,
      trackable: tag.trackable,
      description: tag.description
    }], {
      onConflict: 'user_id,name'
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

// Aliases for backward compatibility
export const addTag = saveTag;
export const updateTag = async (tagId: string, updates: Partial<Tag>): Promise<void> => {
  const tags = await getTags();
  const tag = tags.find(t => t.id === tagId);
  if (!tag) throw new Error('Tag not found');
  await saveTag({ ...tag, ...updates });
};

// ===== USER SETTINGS =====
// Note: User settings can still be stored in localStorage as they're user-preference based

const USER_SETTINGS_KEY = 'routine-ruby-user-settings';

export const loadUserSettings = async (): Promise<UserSettings> => {
  try {
    const { client, userId } = await requireAuth();
    const { data, error } = await client
      .from('myday_user_settings')
      .select('theme, dashboard_layout, notifications_enabled, location')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error loading user settings:', error);
    }
    
    if (data) {
      return {
        theme: data.theme || 'purple',
        dashboardLayout: data.dashboard_layout || 'uniform',
        notifications: data.notifications_enabled ?? true,
        location: data.location ? JSON.parse(data.location) : undefined
      };
    }
  } catch (error) {
    console.error('Error loading user settings:', error);
  }
  
  // Return defaults if loading fails
  return {
    theme: 'purple',
    dashboardLayout: 'uniform',
    notifications: true,
    location: undefined
  };
};

export const saveUserSettings = async (settings: Partial<UserSettings>): Promise<void> => {
  const { client, userId } = await requireAuth();
  
  const dbUpdates: any = {};
  if (settings.theme !== undefined) dbUpdates.theme = settings.theme;
  if (settings.dashboardLayout !== undefined) dbUpdates.dashboard_layout = settings.dashboardLayout;
  if (settings.notifications !== undefined) dbUpdates.notifications_enabled = settings.notifications;
  if (settings.location !== undefined) dbUpdates.location = JSON.stringify(settings.location);
  
  const { error } = await client
    .from('myday_user_settings')
    .upsert([{
      user_id: userId,
      ...dbUpdates
    }], {
      onConflict: 'user_id'
    });
  
  if (error) throw error;
  
  // Also update localStorage cache
  try {
    const current = getUserSettingsSync();
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
  } catch (cacheError) {
    console.error('Error updating settings cache:', cacheError);
  }
};

// Alias for backward compatibility
export const getUserSettings = loadUserSettings;

  // Sync version for initial load (returns cached data from localStorage)
export const getUserSettingsSync = (): UserSettings => {
  const stored = localStorage.getItem(USER_SETTINGS_KEY);
  if (!stored) {
    return {
      theme: 'purple',
      dashboardLayout: 'uniform',
      notifications: true,
      location: undefined
    };
  }
  return JSON.parse(stored);
};

export const getDashboardLayout = (): DashboardLayout => {
  const settings = getUserSettingsSync();
  return settings.dashboardLayout || 'uniform';
};

export const setDashboardLayout = async (layout: DashboardLayout): Promise<void> => {
  await saveUserSettings({ dashboardLayout: layout });
};

// Alias for backward compatibility
export const saveDashboardLayout = setDashboardLayout;

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

// ===== HELPER FUNCTIONS FOR VIEWS =====

// Synchronous version that works with pre-loaded data
export const isTaskCompletedToday = (taskId: string, date: string, completions?: TaskCompletion[]): boolean => {
  if (!completions) {
    // If no completions provided, return false (data should be pre-loaded)
    console.warn('isTaskCompletedToday called without completions data');
    return false;
  }
  return completions.some(c => c.taskId === taskId && c.date === date);
};

export const getTaskSpilloversForDate = async (date: string): Promise<any[]> => {
  // Spillovers not yet implemented in Supabase
  return [];
};

export const moveTaskToNextDay = async (taskId: string, fromDate: string, toDate: string): Promise<void> => {
  // Spillovers not yet implemented in Supabase
  console.log('Move to next day not yet implemented');
};

export const getCompletionCountForPeriod = async (taskId: string, startDate: string, endDate: string): Promise<number> => {
  const completions = await getCompletions();
  return completions.filter(c => c.taskId === taskId && c.date >= startDate && c.date <= endDate).length;
};

export const saveTaskOrder = (taskIds: string[]): void => {
  localStorage.setItem('routine-ruby-task-order', JSON.stringify(taskIds));
};

export const loadTaskOrder = (): string[] => {
  try {
    const stored = localStorage.getItem('routine-ruby-task-order');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading task order:', error);
  }
  return [];
};

export const getUpcomingEvents = async (daysAhead: number = 7, baseDate?: string): Promise<Array<{ event: Event; date: string; daysUntil: number }>> => {
  const { client, userId } = await requireAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Use baseDate if provided (for selected date navigation), otherwise use today
  const selectedDate = baseDate || today.toISOString().split('T')[0];
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const mmdd = `${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}-${String(selectedDateObj.getDate()).padStart(2, '0')}`;
  
  // Query reminders table for the selected date
  // Match MM-DD for yearly events or YYYY-MM-DD for one-time events
  const { data: reminders, error } = await client
    .from('myday_notifybeforedays')
    .select(`
      *,
      event:myday_events(*)
    `)
    .eq('user_id', userId)
    .or(`reminder_date.eq.${mmdd},reminder_date.eq.${selectedDate}`);
  
  if (error) {
    console.error('Error fetching reminders:', error);
    // Fallback to old logic if table doesn't exist yet
    return getUpcomingEventsLegacy(daysAhead, baseDate);
  }
  
  // Also check for events on the actual date (not just reminders)
  const events = await getEvents();
  const upcoming: Array<{ event: Event; date: string; daysUntil: number }> = [];
  const seenEventIds = new Set<string>();
  
  // Process reminders
  if (reminders && reminders.length > 0) {
    reminders.forEach((reminder: any) => {
      const eventData = reminder.event;
      if (!eventData || eventData.hide_from_dashboard) return;
      
      // Match by frequency pattern
      const matches = (reminder.frequency === 'yearly' && reminder.reminder_date === mmdd) ||
                     (reminder.frequency === 'one-time' && reminder.reminder_date === selectedDate);
      
      if (matches) {
        const eventKey = `${eventData.id}-${reminder.reminder_date}-${reminder.days_until_event}`;
        if (!seenEventIds.has(eventKey)) {
          seenEventIds.add(eventKey);
          
          // Map database event to Event type
          const event: Event = {
            id: eventData.id,
            name: eventData.name,
            description: eventData.description,
            category: eventData.category,
            tags: eventData.tags || [],
            date: eventData.date_text || eventData.event_date,
            frequency: eventData.frequency || 'yearly',
            customFrequency: eventData.custom_frequency,
            year: eventData.year,
            notifyDaysBefore: eventData.notify_days_before || 0,
            color: eventData.color,
            priority: eventData.priority || 5,
            hideFromDashboard: eventData.hide_from_dashboard || false,
            createdAt: eventData.created_at || new Date().toISOString()
          };
          
          upcoming.push({
            event,
            date: reminder.reminder_date,
            daysUntil: reminder.days_until_event
          });
        }
      }
    });
  }
  
  // Also check for events on the actual date (not just reminders)
  events.forEach(event => {
    if (event.hideFromDashboard) return;
    
    let eventDate: Date;
    let eventDateStr: string;
    
    if (event.frequency === 'yearly') {
      const [eventMonth, eventDay] = event.date.split('-').map(Number);
      const baseMonth = selectedDateObj.getMonth() + 1;
      const baseDay = selectedDateObj.getDate();
      
      // Check if event is on the selected date
      if (eventMonth === baseMonth && eventDay === baseDay) {
        const eventKey = `${event.id}-${selectedDate}-0`;
        if (!seenEventIds.has(eventKey)) {
          seenEventIds.add(eventKey);
          upcoming.push({
            event,
            date: selectedDate,
            daysUntil: 0 // TODAY!
          });
        }
      }
    } else if (event.frequency === 'one-time') {
      if (event.date === selectedDate) {
        const eventKey = `${event.id}-${selectedDate}-0`;
        if (!seenEventIds.has(eventKey)) {
          seenEventIds.add(eventKey);
          upcoming.push({
            event,
            date: selectedDate,
            daysUntil: 0 // TODAY!
          });
        }
      }
    }
  });
  
  // Sort by daysUntil (today/selected date first, then upcoming)
  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
};

// Legacy function as fallback (old complex logic)
const getUpcomingEventsLegacy = async (daysAhead: number = 7, baseDate?: string): Promise<Array<{ event: Event; date: string; daysUntil: number }>> => {
  const events = await getEvents();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const base = baseDate ? new Date(baseDate + 'T00:00:00') : today;
  base.setHours(0, 0, 0, 0);
  
  const upcoming: Array<{ event: Event; date: string; daysUntil: number }> = [];
  const seenEventIds = new Set<string>();
  
  events.forEach(event => {
    if (event.hideFromDashboard) return;
    const notifyDays = event.notifyDaysBefore || 7;
    let eventDate: Date;
    let eventDateStr: string;
    
    if (event.frequency === 'yearly') {
      eventDateStr = event.date;
      if (!eventDateStr || !eventDateStr.includes('-')) return;
      const [eventMonth, eventDay] = eventDateStr.split('-').map(Number);
      if (isNaN(eventMonth) || isNaN(eventDay)) return;
      const currentYear = base.getFullYear();
      eventDate = new Date(currentYear, eventMonth - 1, eventDay);
      eventDate.setHours(0, 0, 0, 0);
      const baseMonth = base.getMonth() + 1;
      const baseDay = base.getDate();
      const eventMatchesToday = (eventMonth === baseMonth && eventDay === baseDay);
      if (eventMatchesToday) {
        eventDate = new Date(base);
        eventDate.setHours(0, 0, 0, 0);
      } else {
        const daysDiff = Math.floor((eventDate.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < 0) {
          eventDate = new Date(currentYear + 1, eventMonth - 1, eventDay);
          eventDate.setHours(0, 0, 0, 0);
        }
      }
    } else if (event.frequency === 'one-time') {
      eventDateStr = event.date;
      eventDate = new Date(eventDateStr + 'T00:00:00');
      if (isNaN(eventDate.getTime())) return;
      eventDate.setHours(0, 0, 0, 0);
    } else {
      return;
    }
    
    const daysUntil = Math.floor((eventDate.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilFromToday = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const shouldShow = daysUntilFromToday >= 0 && (
      daysUntil === 0 ||
      (daysUntil > 0 && daysUntil <= notifyDays) ||
      (daysUntil < 0 && daysUntil >= -notifyDays)
    );
    
    if (shouldShow) {
      const eventDateStrForKey = event.frequency === 'yearly' 
        ? `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`
        : eventDateStr;
      const eventKey = `${event.id}-${eventDateStrForKey}-${daysUntil}`;
      if (!seenEventIds.has(eventKey)) {
        seenEventIds.add(eventKey);
        upcoming.push({
          event,
          date: eventDateStrForKey,
          daysUntil: daysUntil === 0 ? 0 : daysUntil
        });
      }
    }
  });
  
  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
};

const EVENT_ACK_KEY = 'routine-ruby-event-acknowledgments';

export const acknowledgeEvent = (eventId: string, date: string): void => {
  try {
    const stored = localStorage.getItem(EVENT_ACK_KEY);
    const acks = stored ? JSON.parse(stored) : {};
    acks[`${eventId}-${date}`] = true;
    localStorage.setItem(EVENT_ACK_KEY, JSON.stringify(acks));
  } catch (error) {
    console.error('Error acknowledging event:', error);
  }
};

export const isEventAcknowledged = (eventId: string, date: string): boolean => {
  try {
    const stored = localStorage.getItem(EVENT_ACK_KEY);
    const acks = stored ? JSON.parse(stored) : {};
    return !!acks[`${eventId}-${date}`];
  } catch (error) {
    console.error('Error checking event acknowledgment:', error);
    return false;
  }
};

export const bulkHoldTasks = async (endDate?: string, reason?: string): Promise<void> => {
  const tasks = await getTasks();
  for (const task of tasks) {
    await updateTask(task.id, {
      onHold: true,
      holdStartDate: getTodayString(),
      holdEndDate: endDate,
      holdReason: reason
    });
  }
};

export const bulkUnholdTasks = async (): Promise<void> => {
  const tasks = await getTasks();
  for (const task of tasks) {
    if (task.onHold) {
      await updateTask(task.id, {
        onHold: false,
        holdStartDate: undefined,
        holdEndDate: undefined,
        holdReason: undefined
      });
    }
  }
};

// ===== USER PROFILE =====

export const getUserProfile = async (): Promise<{ username: string; email: string; avatarEmoji: string } | null> => {
  try {
    const { client, userId } = await requireAuth();
    const { data, error } = await client
      .from('myday_users')
      .select('username, email, avatar_emoji')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
    
    return {
      username: data.username || 'User',
      email: data.email || '',
      avatarEmoji: data.avatar_emoji || '😊'
    };
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (updates: { username?: string; email?: string; avatarEmoji?: string }): Promise<void> => {
  const { client, userId } = await requireAuth();
  
  const dbUpdates: any = {};
  if (updates.username !== undefined) dbUpdates.username = updates.username;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.avatarEmoji !== undefined) dbUpdates.avatar_emoji = updates.avatarEmoji;
  
  const { error } = await client
    .from('myday_users')
    .update(dbUpdates)
    .eq('id', userId);
  
  if (error) throw error;
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
};

// ===== SAMPLE DATA =====

export const importSampleTasks = async (replace: boolean = false): Promise<boolean> => {
  throw new Error('Sample tasks import not supported in Supabase mode. Please create tasks manually or import from file.');
};

export const importSampleEvents = async (replace: boolean = false): Promise<boolean> => {
  throw new Error('Sample events import not supported in Supabase mode. Please create events manually or import from file.');
};

export const clearAllData = async (): Promise<void> => {
  throw new Error('Clear all data not supported. Please delete tasks individually or sign out and delete your account.');
};

