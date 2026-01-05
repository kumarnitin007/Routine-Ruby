/**
 * Supabase Service Layer
 * 
 * This file provides functions to interact with Supabase database.
 * Currently kept as reference - the app uses localStorage (storage.ts).
 * 
 * When ready to migrate:
 * 1. Run supabase-schema.sql in your Supabase project
 * 2. Update this file with your Supabase URL and anon key
 * 3. Replace imports from './storage' with './supabaseService'
 * 4. Run migration function to transfer localStorage data
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Task, TaskCompletion, TaskSpillover } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

// TODO: Replace with your Supabase project credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

let supabase: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 */
export const initSupabase = (): SupabaseClient => {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
};

/**
 * Get current Supabase client
 */
export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    return initSupabase();
  }
  return supabase;
};

// ============================================================================
// USER FUNCTIONS
// ============================================================================

/**
 * Get current user from Supabase auth
 */
export const getCurrentUser = async () => {
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  
  return user;
};

/**
 * Get or create user profile
 */
export const getUserProfile = async () => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('myday_users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
  
  return data;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (updates: {
  username?: string;
  avatar_id?: string;
  theme_id?: string;
}) => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('myday_users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
  
  return data;
};

// ============================================================================
// TASK FUNCTIONS
// ============================================================================

/**
 * Get all tasks for current user
 */
export const getTasks = async (): Promise<Task[]> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('myday_tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
  
  // Map database format to Task type
  return data.map(task => ({
    id: task.id,
    name: task.name,
    description: task.description,
    category: task.category,
    weightage: task.weightage,
    frequency: task.frequency as any,
    customFrequency: task.custom_frequency,
    daysOfWeek: task.days_of_week || [],
    dayOfMonth: task.day_of_month,
    count: task.frequency_count,
    period: task.frequency_period as any,
    color: task.color,
    order: task.display_order || 0,
  }));
};

/**
 * Create a new task
 */
export const createTask = async (task: Omit<Task, 'id'>): Promise<Task | null> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('myday_tasks')
    .insert({
      user_id: user.id,
      name: task.name,
      description: task.description,
      category: task.category,
      weightage: task.weightage,
      frequency: task.frequency,
      custom_frequency: task.customFrequency,
      days_of_week: task.daysOfWeek || [],
      day_of_month: task.dayOfMonth,
      frequency_count: task.count,
      frequency_period: task.period,
      color: task.color,
      display_order: task.order || 0,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating task:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    weightage: data.weightage,
    frequency: data.frequency as any,
    customFrequency: data.custom_frequency,
    daysOfWeek: data.days_of_week || [],
    dayOfMonth: data.day_of_month,
    count: data.frequency_count,
    period: data.frequency_period as any,
    color: data.color,
    order: data.display_order || 0,
  };
};

/**
 * Update a task
 */
export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return null;
  
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.weightage !== undefined) dbUpdates.weightage = updates.weightage;
  if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
  if (updates.customFrequency !== undefined) dbUpdates.custom_frequency = updates.customFrequency;
  if (updates.daysOfWeek !== undefined) dbUpdates.days_of_week = updates.daysOfWeek;
  if (updates.dayOfMonth !== undefined) dbUpdates.day_of_month = updates.dayOfMonth;
  if (updates.count !== undefined) dbUpdates.frequency_count = updates.count;
  if (updates.period !== undefined) dbUpdates.frequency_period = updates.period;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.order !== undefined) dbUpdates.display_order = updates.order;
  
  const { data, error } = await supabase
    .from('myday_tasks')
    .update(dbUpdates)
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating task:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    weightage: data.weightage,
    frequency: data.frequency as any,
    customFrequency: data.custom_frequency,
    daysOfWeek: data.days_of_week || [],
    dayOfMonth: data.day_of_month,
    count: data.frequency_count,
    period: data.frequency_period as any,
    color: data.color,
    order: data.display_order || 0,
  };
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string): Promise<boolean> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return false;
  
  const { error } = await supabase
    .from('myday_tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error deleting task:', error);
    return false;
  }
  
  return true;
};

/**
 * Update task display order
 */
export const updateTaskOrder = async (taskOrders: { id: string; order: number }[]): Promise<boolean> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return false;
  
  // Update each task's display_order
  const updates = taskOrders.map(({ id, order }) =>
    supabase
      .from('myday_tasks')
      .update({ display_order: order })
      .eq('id', id)
      .eq('user_id', user.id)
  );
  
  try {
    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error('Error updating task order:', error);
    return false;
  }
};

// ============================================================================
// COMPLETION FUNCTIONS
// ============================================================================

/**
 * Get completions for a specific date
 */
export const getCompletionsForDate = async (date: string): Promise<TaskCompletion[]> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('myday_completions')
    .select('*')
    .eq('user_id', user.id)
    .eq('completion_date', date);
  
  if (error) {
    console.error('Error getting completions:', error);
    return [];
  }
  
  return data.map(c => ({
    taskId: c.task_id,
    date: c.completion_date,
  }));
};

/**
 * Get all completions for current user
 */
export const getAllCompletions = async (): Promise<TaskCompletion[]> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('myday_completions')
    .select('*')
    .eq('user_id', user.id)
    .order('completion_date', { ascending: false });
  
  if (error) {
    console.error('Error getting all completions:', error);
    return [];
  }
  
  return data.map(c => ({
    taskId: c.task_id,
    date: c.completion_date,
  }));
};

/**
 * Record task completion
 */
export const recordCompletion = async (taskId: string, date: string): Promise<boolean> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return false;
  
  const { error } = await supabase
    .from('myday_completions')
    .insert({
      user_id: user.id,
      task_id: taskId,
      completion_date: date,
    });
  
  if (error) {
    console.error('Error recording completion:', error);
    return false;
  }
  
  return true;
};

/**
 * Remove task completion
 */
export const removeCompletion = async (taskId: string, date: string): Promise<boolean> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return false;
  
  const { error } = await supabase
    .from('myday_completions')
    .delete()
    .eq('user_id', user.id)
    .eq('task_id', taskId)
    .eq('completion_date', date);
  
  if (error) {
    console.error('Error removing completion:', error);
    return false;
  }
  
  return true;
};

// ============================================================================
// SPILLOVER FUNCTIONS
// ============================================================================

/**
 * Get spillovers for a specific date
 */
export const getSpilloversForDate = async (date: string): Promise<TaskSpillover[]> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('myday_spillovers')
    .select('*')
    .eq('user_id', user.id)
    .eq('to_date', date);
  
  if (error) {
    console.error('Error getting spillovers:', error);
    return [];
  }
  
  return data.map(s => ({
    taskId: s.task_id,
    fromDate: s.from_date,
    toDate: s.to_date,
  }));
};

/**
 * Get all spillovers for current user
 */
export const getAllSpillovers = async (): Promise<TaskSpillover[]> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('myday_spillovers')
    .select('*')
    .eq('user_id', user.id)
    .order('to_date', { ascending: false });
  
  if (error) {
    console.error('Error getting all spillovers:', error);
    return [];
  }
  
  return data.map(s => ({
    taskId: s.task_id,
    fromDate: s.from_date,
    toDate: s.to_date,
  }));
};

/**
 * Record task spillover
 */
export const recordSpillover = async (
  taskId: string,
  fromDate: string,
  toDate: string
): Promise<boolean> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return false;
  
  const { error } = await supabase
    .from('myday_spillovers')
    .insert({
      user_id: user.id,
      task_id: taskId,
      from_date: fromDate,
      to_date: toDate,
    });
  
  if (error) {
    console.error('Error recording spillover:', error);
    return false;
  }
  
  return true;
};

// ============================================================================
// HELPER FUNCTIONS (using Supabase functions)
// ============================================================================

/**
 * Get completion streak for current user
 */
export const getCompletionStreak = async (): Promise<number> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return 0;
  
  const { data, error } = await supabase
    .rpc('get_myday_completion_streak', { p_user_id: user.id });
  
  if (error) {
    console.error('Error getting completion streak:', error);
    return 0;
  }
  
  return data || 0;
};

/**
 * Get missed tasks in last N days
 */
export const getMissedTasks = async (daysBack: number = 7) => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return [];
  
  const { data, error } = await supabase
    .rpc('get_myday_missed_tasks', {
      p_user_id: user.id,
      p_days_back: daysBack,
    });
  
  if (error) {
    console.error('Error getting missed tasks:', error);
    return [];
  }
  
  return data || [];
};

// ============================================================================
// MIGRATION FUNCTION
// ============================================================================

/**
 * Migrate data from localStorage to Supabase
 * Call this once when transitioning from localStorage to Supabase
 */
export const migrateFromLocalStorage = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('No user logged in');
      return false;
    }
    
    // Load data from localStorage
    const localData = localStorage.getItem('myDayData');
    if (!localData) {
      console.log('No localStorage data to migrate');
      return true;
    }
    
    const { tasks, taskHistory, spillovers } = JSON.parse(localData);
    
    const supabase = getSupabase();
    
    // Migrate tasks
    if (tasks && tasks.length > 0) {
      const taskInserts = tasks.map((task: Task) => ({
        id: task.id,
        user_id: user.id,
        name: task.name,
        description: task.description,
        category: task.category,
        weightage: task.weightage,
        frequency: task.frequency,
        custom_frequency: task.customFrequency,
        days_of_week: task.daysOfWeek || [],
        day_of_month: task.dayOfMonth,
        frequency_count: task.count,
        frequency_period: task.period,
        color: task.color,
        display_order: task.order || 0,
      }));
      
      const { error: tasksError } = await supabase
        .from('myday_tasks')
        .insert(taskInserts);
      
      if (tasksError) {
        console.error('Error migrating tasks:', tasksError);
        return false;
      }
    }
    
    // Migrate completions
    if (taskHistory && taskHistory.length > 0) {
      const completionInserts = taskHistory.map((completion: TaskCompletion) => ({
        user_id: user.id,
        task_id: completion.taskId,
        completion_date: completion.date,
      }));
      
      const { error: completionsError } = await supabase
        .from('myday_completions')
        .insert(completionInserts);
      
      if (completionsError) {
        console.error('Error migrating completions:', completionsError);
        return false;
      }
    }
    
    // Migrate spillovers
    if (spillovers && spillovers.length > 0) {
      const spilloverInserts = spillovers.map((spillover: TaskSpillover) => ({
        user_id: user.id,
        task_id: spillover.taskId,
        from_date: spillover.fromDate,
        to_date: spillover.toDate,
      }));
      
      const { error: spilloversError } = await supabase
        .from('myday_spillovers')
        .insert(spilloverInserts);
      
      if (spilloversError) {
        console.error('Error migrating spillovers:', spilloversError);
        return false;
      }
    }
    
    console.log('✅ Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  }
};

/**
 * Clear all user data (for testing)
 */
export const clearAllData = async (): Promise<boolean> => {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  
  if (!user) return false;
  
  try {
    // Delete in order (due to foreign key constraints)
    await supabase.from('myday_completions').delete().eq('user_id', user.id);
    await supabase.from('myday_spillovers').delete().eq('user_id', user.id);
    await supabase.from('myday_tasks').delete().eq('user_id', user.id);
    
    console.log('✅ All data cleared successfully!');
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

