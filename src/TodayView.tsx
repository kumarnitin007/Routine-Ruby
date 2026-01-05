/**
 * Today View Component
 * 
 * Displays today's tasks with:
 * - Drag-and-drop reordering
 * - Up/down arrow buttons
 * - Overall completion streak (global)
 * - Per-task completion streaks (shown in each card)
 * - Per-task missed count (shown in each card)
 */

import React, { useState, useEffect } from 'react';
import { Task, Event, AppData } from './types';
import { getTodayString, getTasksForToday, formatDate, getWeekBounds, getMonthBounds, shouldTaskShowToday } from './utils';
import { loadData, completeTask, isTaskCompletedToday, getTaskSpilloversForDate, moveTaskToNextDay, getCompletionCountForPeriod, saveTaskOrder, loadTaskOrder, getUpcomingEvents, acknowledgeEvent, isEventAcknowledged } from './storage';
import TaskActionModal from './TaskActionModal';
import CountdownTimer from './components/CountdownTimer';
import MotivationalSection from './components/MotivationalSection';
import ImportantDatesSection from './components/ImportantDatesSection';
import ReviewOverlay from './components/ReviewOverlay';
import SmartCoachSection from './components/SmartCoachSection';
import { getUnderperformingTasks, isInsightDismissed, TaskInsight } from './services/aiInsights';
import LayoutSelector from './components/LayoutSelector';
import { DashboardLayout } from './types';
import { getDashboardLayout, setDashboardLayout, bulkHoldTasks, bulkUnholdTasks } from './storage';
import { useAuth } from './contexts/AuthContext';
import MonthlyView from './MonthlyView';

type DashboardItem = {
  type: 'task' | 'event';
  task?: Task;
  event?: Event;
  id: string;
  name: string;
  description?: string;
  category?: string;
  isCompleted: boolean;
  weightage: number;
  color?: string;
  daysUntil?: number;
};

interface TodayViewProps {
  onNavigate: (view: string) => void;
}

const TodayView: React.FC<TodayViewProps> = ({ onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'dashboard' | 'monthly'>('dashboard');
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [events, setEvents] = useState<DashboardItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DashboardItem | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showReviewOverlay, setShowReviewOverlay] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSmartCoachModal, setShowSmartCoachModal] = useState(false);
  const [showBulkHoldModal, setShowBulkHoldModal] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerTask, setTimerTask] = useState<Task | null>(null);
  const [aiInsight, setAiInsight] = useState<TaskInsight | null>(null);
  const [dashboardLayout, setDashboardLayoutState] = useState<DashboardLayout>(getDashboardLayout());
  const [isLoading, setIsLoading] = useState(true);
  const [appData, setAppData] = useState<AppData | null>(null);
  const today = getTodayString();

  const handleLayoutChange = async (layout: DashboardLayout) => {
    try {
      await setDashboardLayout(layout);
      setDashboardLayoutState(layout);
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
    }
  };

  /**
   * Helper function to check if a date matches an interval-based task schedule
   */
  const isIntervalMatch = (task: Task, dateStr: string): boolean => {
    if (!task.intervalValue || !task.intervalUnit || !task.intervalStartDate) {
      return false;
    }
    
    const startDate = new Date(task.intervalStartDate);
    const checkDate = new Date(dateStr);
    
    const diffInMs = checkDate.getTime() - startDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return false; // Before start date
    
    switch (task.intervalUnit) {
      case 'days':
        return diffInDays % task.intervalValue === 0;
        
      case 'weeks':
        const diffInWeeks = Math.floor(diffInDays / 7);
        return diffInWeeks % task.intervalValue === 0 && (diffInDays % 7 === 0);
        
      case 'months':
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        const checkMonth = checkDate.getMonth();
        const checkYear = checkDate.getFullYear();
        const monthsDiff = (checkYear - startYear) * 12 + (checkMonth - startMonth);
        
        return checkDate.getDate() === startDate.getDate() && 
               monthsDiff % task.intervalValue === 0;
        
      case 'years':
        const yearsDiff = checkDate.getFullYear() - startDate.getFullYear();
        
        return checkDate.getDate() === startDate.getDate() &&
               checkDate.getMonth() === startDate.getMonth() &&
               yearsDiff % task.intervalValue === 0;
        
      default:
        return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      // Only load data if user is authenticated
      if (!authLoading && user) {
        await loadItems();
        await calculateStreak();
        await loadAIInsights();
      } else if (!authLoading && !user) {
        // User is not authenticated, set loading to false
        setIsLoading(false);
      }
    };
    init();
  }, [authLoading, user]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await loadData();
      setAppData(data); // Store data in state
      const todayTasks = getTasksForToday(data.tasks);
      
      // Get spillover tasks (currently returns empty array)
      const spillovers = await getTaskSpilloversForDate(today);
      const spilloverTaskIds = spillovers.map(s => s.taskId);
      const spilloverTasks = data.tasks.filter(t => spilloverTaskIds.includes(t.id));
      
      // Combine tasks
      const allTaskIds = new Set([...todayTasks.map(t => t.id), ...spilloverTasks.map(t => t.id)]);
      let combinedTasks = data.tasks.filter(t => allTaskIds.has(t.id));
      
      // Get upcoming events (within next 3 days) and filter out hidden ones
      const upcomingEvents = (await getUpcomingEvents(3)).filter(({ event }) => !event.hideFromDashboard);
      
      // Convert tasks to dashboard items
      const taskItems: DashboardItem[] = combinedTasks.map(task => ({
        type: 'task',
        task,
        id: task.id,
        name: task.name,
        description: task.description,
        category: task.category,
        isCompleted: isTaskCompletedToday(task.id, today, data.completions),
        weightage: task.weightage,
        color: task.color
      }));
    
    // Convert events to dashboard items
    const eventItems: DashboardItem[] = upcomingEvents.map(({ event, daysUntil }) => ({
      type: 'event',
      event,
      id: event.id,
      name: event.name,
      description: event.description,
      category: event.category,
      isCompleted: isEventAcknowledged(event.id, today),
      weightage: event.priority || 5, // Use event's priority, default 5
      color: event.color,
      daysUntil
    }));
    
    // Set events separately (for collapsible section)
    setEvents(eventItems);
    
    // Only use tasks for main dashboard
    let allItems = [...taskItems];
    
    // Apply custom order if exists (only for tasks)
    const savedOrder = loadTaskOrder();
    if (savedOrder.length > 0) {
      allItems = applyCustomOrderToItems(allItems, savedOrder);
    }
    
    setItems(allItems);
    } catch (error: any) {
      // Silently ignore authentication errors (user not signed in yet)
      if (!error?.message?.includes('User must be signed in')) {
        console.error('Error loading data:', error);
        alert('Error loading data. Please make sure you are signed in and have internet connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const applyCustomOrderToItems = (itemList: DashboardItem[], order: string[]): DashboardItem[] => {
    const orderedTasks: DashboardItem[] = [];
    const remainingItems = [...itemList];
    
    // Add tasks in saved order
    order.forEach(taskId => {
      const index = remainingItems.findIndex(item => item.type === 'task' && item.id === taskId);
      if (index !== -1) {
        orderedTasks.push(remainingItems[index]);
        remainingItems.splice(index, 1);
      }
    });
    
    // Events and remaining tasks go at the end
    return [...remainingItems.filter(i => i.type === 'event'), ...orderedTasks, ...remainingItems.filter(i => i.type === 'task')];
  };


  const calculateStreak = async () => {
    try {
      const data = await loadData();
      const allTasks = data.tasks;
      const allCompletions = data.completions;
    
    let streak = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);
    
    for (let i = 0; i < 30; i++) {
      const dateStr = formatDate(checkDate);
      
      const scheduledTasks = allTasks.filter(task => {
        const dayOfWeek = checkDate.getDay();
        const dayOfMonth = checkDate.getDate();
        
        switch (task.frequency) {
          case 'daily':
            return true;
          case 'weekly':
            return task.daysOfWeek?.includes(dayOfWeek) || false;
          case 'monthly':
            return task.dayOfMonth === dayOfMonth;
          default:
            return false;
        }
      });
      
      if (scheduledTasks.length === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      
      const completedCount = scheduledTasks.filter(task =>
        allCompletions.some(c => c.taskId === task.id && c.date === dateStr)
      ).length;
      
      if (completedCount === scheduledTasks.length) {
        streak++;
      } else {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    setCurrentStreak(streak);
    } catch (error: any) {
      // Silently ignore authentication errors (user not signed in yet)
      if (!error?.message?.includes('User must be signed in')) {
        console.error('Error calculating streak:', error);
      }
      setCurrentStreak(0);
    }
  };

  /**
   * Load AI insights for underperforming tasks
   */
  const loadAIInsights = async () => {
    try {
      const insights = await getUnderperformingTasks();
      
      // Filter out dismissed insights
      const activeInsights = insights.filter(insight => !isInsightDismissed(insight.taskId));
      
      // Show only the most severe insight (lowest completion rate)
      if (activeInsights.length > 0) {
        setAiInsight(activeInsights[0]);
      } else {
        setAiInsight(null);
      }
    } catch (error: any) {
      // Silently ignore authentication errors (user not signed in yet)
      if (!error?.message?.includes('User must be signed in')) {
        console.error('Error loading AI insights:', error);
      }
      setAiInsight(null);
    }
  };

  /**
   * Calculate completion streak for a specific task
   */
  const getTaskStreak = (taskId: string): number => {
    if (!appData) return 0;
    const task = appData.tasks.find(t => t.id === taskId);
    if (!task) return 0;
    
    const allCompletions = appData.completions;
    let streak = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday
    
    // Get task creation date
    const taskCreatedDate = task.createdAt ? new Date(task.createdAt) : null;
    const taskCreatedDateStr = taskCreatedDate ? formatDate(taskCreatedDate) : null;
    
    for (let i = 0; i < 30; i++) {
      const dateStr = formatDate(checkDate);
      const dayOfWeek = checkDate.getDay();
      const dayOfMonth = checkDate.getDate();
      
      // Stop if we've gone before task was created
      if (taskCreatedDateStr && dateStr < taskCreatedDateStr) {
        break;
      }
      
      // Stop if before task's start date
      if (task.startDate && dateStr < task.startDate) {
        break;
      }
      
      // Skip if after task's end date
      if (task.endDate && dateStr > task.endDate) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      
      // Skip days when task was on hold (hold days don't break streak)
      if (task.onHold && task.holdStartDate) {
        if (dateStr >= task.holdStartDate) {
          if (!task.holdEndDate || dateStr <= task.holdEndDate) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
      }
      
      let shouldHaveBeenDone = false;
      
      switch (task.frequency) {
        case 'daily':
          shouldHaveBeenDone = true;
          break;
        case 'weekly':
          shouldHaveBeenDone = task.daysOfWeek?.includes(dayOfWeek) || false;
          break;
        case 'monthly':
          shouldHaveBeenDone = task.dayOfMonth === dayOfMonth;
          break;
        case 'count-based':
          shouldHaveBeenDone = true; // Count-based tasks are always active
          break;
        case 'interval':
          shouldHaveBeenDone = isIntervalMatch(task, dateStr);
          break;
      }
      
      // Skip if task wasn't scheduled
      if (!shouldHaveBeenDone) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      
      const wasCompleted = allCompletions.some(c => c.taskId === taskId && c.date === dateStr);
      
      if (wasCompleted) {
        streak++;
      } else {
        break; // Streak broken
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
  };

  /**
   * Calculate missed count for a specific task (last 7 days)
   */
  const getTaskMissedCount = (taskId: string): number => {
    if (!appData) return 0;
    const task = appData.tasks.find(t => t.id === taskId);
    if (!task) return 0;
    
    const allCompletions = appData.completions;
    const allSpillovers = appData.spillovers;
    let missedCount = 0;
    
    // Get task creation date (only check days after task was created)
    const taskCreatedDate = task.createdAt ? new Date(task.createdAt) : null;
    const taskCreatedDateStr = taskCreatedDate ? formatDate(taskCreatedDate) : null;
    
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = formatDate(checkDate);
      const dayOfWeek = checkDate.getDay();
      const dayOfMonth = checkDate.getDate();
      
      // Skip if date is before task was created
      if (taskCreatedDateStr && dateStr < taskCreatedDateStr) {
        continue;
      }
      
      // Skip if date is before task's start date
      if (task.startDate && dateStr < task.startDate) {
        continue;
      }
      
      // Skip if date is after task's end date
      if (task.endDate && dateStr > task.endDate) {
        continue;
      }
      
      // Skip if task was on hold on this date
      if (task.onHold && task.holdStartDate) {
        if (dateStr >= task.holdStartDate) {
          // If no holdEndDate or date is before holdEndDate, task was on hold
          if (!task.holdEndDate || dateStr <= task.holdEndDate) {
            continue;
          }
        }
      }
      
      let shouldHaveBeenDone = false;
      
      switch (task.frequency) {
        case 'daily':
          shouldHaveBeenDone = true;
          break;
        case 'weekly':
          shouldHaveBeenDone = task.daysOfWeek?.includes(dayOfWeek) || false;
          break;
        case 'monthly':
          shouldHaveBeenDone = task.dayOfMonth === dayOfMonth;
          break;
        case 'count-based':
          shouldHaveBeenDone = true; // Check all days for count-based
          break;
        case 'interval':
          shouldHaveBeenDone = isIntervalMatch(task, dateStr);
          break;
      }
      
      if (shouldHaveBeenDone) {
        const wasCompleted = allCompletions.some(c => c.taskId === taskId && c.date === dateStr);
        const wasSpilledOver = allSpillovers.some(s => s.taskId === taskId && s.fromDate === dateStr);
        
        if (!wasCompleted && !wasSpilledOver) {
          missedCount++;
        }
      }
    }
    
    return missedCount;
  };

  const findMissedTasks = () => {
    // This function is kept for backward compatibility but no longer displays separate alerts
    // Individual task stats are now shown on each card
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    
    setItems(newItems);
    // Only save order for tasks
    const taskOrder = newItems.filter(i => i.type === 'task').map(i => i.id);
    saveTaskOrder(taskOrder);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Arrow button handlers
  const moveItemUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
    const taskOrder = newItems.filter(i => i.type === 'task').map(i => i.id);
    saveTaskOrder(taskOrder);
  };

  const moveItemDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
    const taskOrder = newItems.filter(i => i.type === 'task').map(i => i.id);
    saveTaskOrder(taskOrder);
  };

  const handleItemClick = (item: DashboardItem) => {
    if (isReorderMode) return; // Don't open modal in reorder mode
    if (item.isCompleted) return;
    setSelectedItem(item);
  };

  const handleComplete = async (durationMinutes?: number) => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'task' && selectedItem.task) {
      const completedTaskId = selectedItem.task.id;
      await completeTask(completedTaskId, today, durationMinutes);
      
      // Check for dependent tasks and auto-complete them
      if (appData) {
        const dependentTasks = appData.tasks.filter(t => 
          t.dependentTaskIds && t.dependentTaskIds.includes(completedTaskId)
        );
      
        for (const depTask of dependentTasks) {
          // Only auto-complete if the dependent task shows today
          if (shouldTaskShowToday(depTask)) {
            await completeTask(depTask.id, today);
          }
        }
      }
      
    } else if (selectedItem.type === 'event' && selectedItem.event) {
      acknowledgeEvent(selectedItem.event.id, today);
    }
    
    setSelectedItem(null);
    await loadItems();
    await calculateStreak();
  };

  const handleStartTimer = () => {
    if (selectedItem && selectedItem.type === 'task' && selectedItem.task) {
      setTimerTask(selectedItem.task);
      setSelectedItem(null);
      setShowTimer(true);
    }
  };

  const handleTimerComplete = async (durationMinutes: number) => {
    if (timerTask) {
      await completeTask(timerTask.id, today, durationMinutes);
      
      // Check for dependent tasks
      if (appData) {
        const dependentTasks = appData.tasks.filter(t => 
          t.dependentTaskIds && t.dependentTaskIds.includes(timerTask.id)
        );
        
        for (const depTask of dependentTasks) {
          if (shouldTaskShowToday(depTask)) {
            await completeTask(depTask.id, today);
          }
        }
      }
    }
    
    setShowTimer(false);
    setTimerTask(null);
    await loadItems();
    await calculateStreak();
  };

  const handleTimerCancel = () => {
    setShowTimer(false);
    setTimerTask(null);
  };

  const handleMoveToNextDay = () => {
    if (!selectedItem) return;
    
    // Only tasks can be moved to next day
    if (selectedItem.type === 'task' && selectedItem.task) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatDate(tomorrow);
      moveTaskToNextDay(selectedItem.task.id, today, tomorrowStr);
      setSelectedItem(null);
      loadItems();
    }
  };

  const handleCancel = () => {
    setSelectedItem(null);
  };

  const getTaskProgress = (task: Task): { current: number; target: number; label: string } | null => {
    if (task.frequency !== 'count-based' || !task.frequencyCount || !task.frequencyPeriod) {
      return null;
    }
    // TODO: Load completion count asynchronously
    // For now, return null to avoid sync/async issues
    return null;
  };


  const calculateProgress = () => {
    const totalItems = items.length + events.length;
    if (totalItems === 0) return 0;
    const completedItems = items.filter(i => i.isCompleted).length + events.filter(e => e.isCompleted).length;
    return Math.round((completedItems / totalItems) * 100);
  };

  const getPriorityLevel = (weightage: number): 'critical' | 'high' | 'medium' | 'low' => {
    if (weightage >= 9) return 'critical';
    if (weightage >= 7) return 'high';
    if (weightage >= 4) return 'medium';
    return 'low';
  };

  const getPriorityStyle = (weightage: number) => {
    const level = getPriorityLevel(weightage);
    const styles = {
      critical: {
        borderColor: '#ef4444',
        borderWidth: '4px',
        boxShadow: '0 8px 16px rgba(239, 68, 68, 0.25), 0 4px 8px rgba(0, 0, 0, 0.1)',
        badge: '🔥',
        badgeColor: '#ef4444',
        badgeText: 'Critical'
      },
      high: {
        borderColor: '#f97316',
        borderWidth: '3px',
        boxShadow: '0 6px 12px rgba(249, 115, 22, 0.2), 0 3px 6px rgba(0, 0, 0, 0.08)',
        badge: '⚡',
        badgeColor: '#f97316',
        badgeText: 'High'
      },
      medium: {
        borderColor: '#3b82f6',
        borderWidth: '2px',
        boxShadow: '0 4px 8px rgba(59, 130, 246, 0.15), 0 2px 4px rgba(0, 0, 0, 0.06)',
        badge: '📌',
        badgeColor: '#3b82f6',
        badgeText: 'Medium'
      },
      low: {
        borderColor: '#9ca3af',
        borderWidth: '2px',
        boxShadow: '0 2px 4px rgba(156, 163, 175, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)',
        badge: '📋',
        badgeColor: '#9ca3af',
        badgeText: 'Low'
      }
    };
    return styles[level];
  };

  const getGridSpanClass = (weightage: number): string => {
    if (weightage >= 9) return 'priority-critical';
    if (weightage >= 7) return 'priority-high';
    if (weightage >= 4) return 'priority-medium';
    return 'priority-low';
  };

  const getItemStyle = (item: DashboardItem) => {
    const priorityStyle = getPriorityStyle(item.weightage);
    const baseStyle = {
      borderLeft: `${priorityStyle.borderWidth} solid ${priorityStyle.borderColor}`,
      boxShadow: priorityStyle.boxShadow,
      '--task-color': item.color || '#667eea'
    } as React.CSSProperties;

    return baseStyle;
  };

  const formatDateLong = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Show loading screen while data is being fetched
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1.5rem'
      }}>
        <div style={{
          fontSize: '4rem',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          🐦
        </div>
        <h2 style={{ color: 'white', fontSize: '1.5rem' }}>Loading your tasks...</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)' }}>Getting everything ready for your productive day!</p>
      </div>
    );
  }

  // If monthly view is selected, show MonthlyView component
  if (viewMode === 'monthly') {
    return <MonthlyView onNavigate={onNavigate} />;
  }

  return (
    <div className="today-view">
      <div className="date-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>Today's Goals</h2>
            <p>{formatDateLong()}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* View Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'dashboard' ? 'monthly' : 'dashboard')}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{viewMode === 'dashboard' ? '📅' : '🏠'}</span>
              <span>{viewMode === 'dashboard' ? 'Monthly View' : 'Dashboard'}</span>
            </button>
            <button 
              onClick={() => setShowProgressModal(true)}
              className="btn-secondary"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>💪</span>
              <span>Your Progress</span>
            </button>
            {aiInsight && (
              <button 
                onClick={() => setShowSmartCoachModal(true)}
                className="btn-secondary smart-coach-btn"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none'
                }}
              >
                <span>🤖</span>
                <span>Smart Coach</span>
              </button>
            )}
            <button 
              onClick={() => setShowReviewOverlay(true)}
              className="btn-primary"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>📊</span>
              <span>Review</span>
            </button>
            <button 
              onClick={() => setIsReorderMode(!isReorderMode)}
              className="btn-secondary"
              style={{ 
                background: isReorderMode ? '#667eea' : 'white',
                color: isReorderMode ? 'white' : '#667eea',
                border: '2px solid #667eea',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{isReorderMode ? '✓' : '↕️'}</span>
              <span>{isReorderMode ? 'Done Reordering' : 'Reorder Tasks'}</span>
            </button>
            <button 
              onClick={() => setShowBulkHoldModal(true)}
              className="btn-secondary"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'white',
                color: '#f97316',
                border: '2px solid #f97316'
              }}
            >
              <span>⏸️</span>
              <span>Hold Tasks</span>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
            Progress: {calculateProgress()}% ({items.filter(i => i.isCompleted).length + events.filter(e => e.isCompleted).length}/{items.length + events.length} completed)
          </div>
          {currentStreak > 0 && (
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔥</span>
              <span>{currentStreak} Day Streak!</span>
            </div>
          )}
        </div>
      </div>

      {/* Important Dates Section */}
      <ImportantDatesSection 
        events={events}
        onEventClick={handleItemClick}
        collapsed={false}
      />

      {isReorderMode && (
        <div className="reorder-instructions" style={{ background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#1e40af', fontWeight: 600 }}>
            💡 Drag cards to reorder, or use ↑↓ arrows. Click "Done Reordering" when finished.
          </p>
        </div>
      )}

      {items.length === 0 && events.length === 0 ? (
        <div className="no-tasks">
          <h3>No tasks or events scheduled for today</h3>
          <p>Start by adding some tasks to track your daily goals</p>
          <button className="btn-primary" onClick={() => onNavigate('configure')}>
            Add Tasks
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="no-tasks">
          <h3>No tasks scheduled for today</h3>
          <p>All items are events - check the Important Dates section above</p>
        </div>
      ) : (
        <>
          {/* Layout Selector */}
          {!isReorderMode && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <LayoutSelector
                currentLayout={dashboardLayout}
                onLayoutChange={handleLayoutChange}
              />
            </div>
          )}

          <div className={`tasks-grid layout-${dashboardLayout}`}>
          {items
            .slice()
            .sort((a, b) => {
              // Sort completed items to the end
              const aProgress = a.type === 'task' && a.task ? getTaskProgress(a.task) : null;
              const bProgress = b.type === 'task' && b.task ? getTaskProgress(b.task) : null;
              const aCompleted = a.isCompleted || (aProgress && aProgress.current >= aProgress.target) || false;
              const bCompleted = b.isCompleted || (bProgress && bProgress.current >= bProgress.target) || false;
              
              if (aCompleted && !bCompleted) return 1;  // a goes to end
              if (!aCompleted && bCompleted) return -1; // b goes to end
              return 0; // keep original order for items with same completion status
            })
            .map((item, index) => {
              const isSomber = item.type === 'event' && ['Death Anniversary', 'Memorial', 'Remembrance'].includes(item.category || '');
              const progress = item.type === 'task' && item.task ? getTaskProgress(item.task) : null;
              const isCountBasedComplete = progress && progress.current >= progress.target;
            const taskStreak = item.type === 'task' ? getTaskStreak(item.id) : 0;
            const missedCount = item.type === 'task' ? getTaskMissedCount(item.id) : 0;
            
            // Get category icon for events
            const getCategoryIcon = () => {
              if (item.type === 'event') {
                const icons: { [key: string]: string } = {
                  'Birthday': '🎂',
                  'Anniversary': '💝',
                  'Holiday': '🎊',
                  'Special Event': '⭐',
                  'Death Anniversary': '🕯️',
                  'Memorial': '🌹',
                  'Remembrance': '🙏'
                };
                return icons[item.category || ''] || '📅';
              }
              return '';
            };
            
            const priorityClass = (dashboardLayout === 'grid-spans' || dashboardLayout === 'masonry') 
              ? getGridSpanClass(item.weightage) 
              : '';
            const extraClasses = [
              taskStreak > 0 ? 'has-streak' : '',
              progress ? 'has-progress' : ''
            ].filter(Boolean).join(' ');
            
            return (
              <div
                key={item.id}
                className={`task-card ${item.isCompleted || isCountBasedComplete ? 'completed' : ''} ${isReorderMode ? 'reorder-mode' : ''} ${isSomber ? 'somber-event' : ''} ${priorityClass} ${extraClasses}`}
                style={{
                  ...getItemStyle(item),
                  cursor: isReorderMode ? 'move' : 'pointer',
                  opacity: draggedIndex === index ? 0.5 : 1,
                  ...(item.task?.customBackgroundColor && { 
                    background: item.task.customBackgroundColor,
                    backdropFilter: 'blur(10px)'
                  })
                }}
                draggable={isReorderMode}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handleItemClick(item)}
              >
                {isReorderMode && (
                  <div className="reorder-controls" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem', zIndex: 10 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveItemUp(index); }}
                      disabled={index === 0}
                      className="reorder-btn"
                      style={{ 
                        background: 'white',
                        border: '2px solid #3b82f6',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        opacity: index === 0 ? 0.3 : 1,
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#3b82f6'
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveItemDown(index); }}
                      disabled={index === items.length - 1}
                      className="reorder-btn"
                      style={{ 
                        background: 'white',
                        border: '2px solid #3b82f6',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        cursor: index === items.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: index === items.length - 1 ? 0.3 : 1,
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#3b82f6'
                      }}
                    >
                      ↓
                    </button>
                  </div>
                )}
                <div>
                  {/* Priority Badge */}
                  {!isReorderMode && item.weightage >= 7 && !item.task?.onHold && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: `${getPriorityStyle(item.weightage).badgeColor}15`,
                      border: `1.5px solid ${getPriorityStyle(item.weightage).badgeColor}`,
                      borderRadius: '12px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: getPriorityStyle(item.weightage).badgeColor
                    }}>
                      <span>{getPriorityStyle(item.weightage).badge}</span>
                      <span>{getPriorityStyle(item.weightage).badgeText}</span>
                    </div>
                  )}

                  {/* Hold Badge */}
                  {item.task?.onHold && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: '#f9731615',
                      border: '1.5px solid #f97316',
                      borderRadius: '12px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#f97316'
                    }}>
                      <span>⏸️</span>
                      <span>On Hold</span>
                      {item.task.holdEndDate && (
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                          (until {new Date(item.task.holdEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Event icon for events */}
                  {item.type === 'event' && (
                    <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                      {getCategoryIcon()}
                    </div>
                  )}
                  
                  <div className="task-name">{item.name}</div>
                  
                  {/* Days until badge for events */}
                  {item.type === 'event' && item.daysUntil !== undefined && (
                    <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                      {item.daysUntil === 0 ? (
                        <div className={isSomber ? 'event-today-badge-somber' : 'event-today-badge'}>
                          {isSomber ? 'Today' : 'TODAY! 🎊'}
                        </div>
                      ) : (
                        <div className="event-soon-badge">in {item.daysUntil} day{item.daysUntil > 1 ? 's' : ''}</div>
                      )}
                    </div>
                  )}
                  
                  {item.category && (
                    <div className="task-category">
                      {item.type === 'task' ? '📁' : ''} {item.category}
                    </div>
                  )}
                  {progress && (
                    <div className="task-progress">
                      <span className={isCountBasedComplete ? 'progress-complete' : 'progress-pending'}>
                        {progress.label} {item.task?.frequencyPeriod === 'week' ? 'this week' : 'this month'}
                      </span>
                    </div>
                  )}
                  
                  {/* Task Stats Badges (only for tasks) */}
                  {item.type === 'task' && (
                    <div className="task-stats">
                      {taskStreak > 0 && (
                        <div className="task-stat-badge streak-badge">
                          <span className="badge-icon">🔥</span>
                          <span className="badge-text">{taskStreak} day{taskStreak > 1 ? 's' : ''} streak</span>
                        </div>
                      )}
                      {missedCount > 0 && (
                        <div className="task-stat-badge missed-badge">
                          <span className="badge-icon">❌</span>
                          <span className="badge-text">{missedCount} missed in last 7 days</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="task-weightage">
                  Priority: {item.weightage}/10
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

      {selectedItem && (
        <TaskActionModal
          task={selectedItem.type === 'task' ? selectedItem.task! : null}
          event={selectedItem.type === 'event' ? selectedItem.event! : null}
          itemType={selectedItem.type}
          onComplete={handleComplete}
          onMoveToNextDay={handleMoveToNextDay}
          onCancel={handleCancel}
          onStartTimer={selectedItem.type === 'task' ? handleStartTimer : undefined}
        />
      )}

      {/* Countdown Timer */}
      {showTimer && timerTask && (
        <CountdownTimer
          task={timerTask}
          onComplete={handleTimerComplete}
          onCancel={handleTimerCancel}
        />
      )}

      {/* Your Progress Modal */}
      {showProgressModal && (
        <div className="modal-overlay" onClick={() => setShowProgressModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>💪 Your Progress</h2>
              <button className="modal-close" onClick={() => setShowProgressModal(false)}>×</button>
            </div>
            <div style={{ padding: '0' }}>
              <MotivationalSection collapsed={false} />
            </div>
          </div>
        </div>
      )}

      {/* Smart Coach Modal */}
      {showSmartCoachModal && aiInsight && (
        <div className="modal-overlay" onClick={() => setShowSmartCoachModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <h2>🤖 Smart Coach Insights</h2>
              <button className="modal-close" onClick={() => setShowSmartCoachModal(false)} style={{ color: 'white' }}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <SmartCoachSection
                insight={aiInsight}
                onApply={() => {
                  loadItems();
                  loadAIInsights();
                  setShowSmartCoachModal(false);
                }}
                onDismiss={() => {
                  setAiInsight(null);
                  setShowSmartCoachModal(false);
                }}
                collapsed={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Hold/Unhold Modal */}
      {showBulkHoldModal && (
        <div className="modal-overlay" onClick={() => setShowBulkHoldModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', color: 'white' }}>
              <h2>⏸️ Bulk Hold/Unhold Tasks</h2>
              <button className="modal-close" onClick={() => setShowBulkHoldModal(false)} style={{ color: 'white' }}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
                Quickly pause all tasks or resume them. Held tasks won't show up and won't count as missed days.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Hold All Tasks Section */}
                <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#92400e' }}>
                    ⏸️ Hold All Tasks
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#78350f', marginBottom: '1rem' }}>
                    Put all tasks on hold (e.g., vacation, break)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                      type="date"
                      id="bulk-hold-end-date"
                      placeholder="Resume date (optional)"
                      style={{ padding: '0.5rem', border: '1px solid #fbbf24', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      id="bulk-hold-reason"
                      placeholder="Reason (optional, e.g., Vacation)"
                      style={{ padding: '0.5rem', border: '1px solid #fbbf24', borderRadius: '4px' }}
                    />
                    <button
                      onClick={() => {
                        const endDateInput = document.getElementById('bulk-hold-end-date') as HTMLInputElement;
                        const reasonInput = document.getElementById('bulk-hold-reason') as HTMLInputElement;
                        bulkHoldTasks(endDateInput?.value || undefined, reasonInput?.value || undefined);
                        setShowBulkHoldModal(false);
                        loadItems();
                      }}
                      style={{ 
                        padding: '0.75rem', 
                        background: '#f97316', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        fontWeight: 600, 
                        cursor: 'pointer' 
                      }}
                    >
                      ⏸️ Hold All Tasks
                    </button>
                  </div>
                </div>

                {/* Unhold All Tasks Section */}
                <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: '8px', border: '1px solid #10b981' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#065f46' }}>
                    ▶️ Resume All Tasks
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#047857', marginBottom: '1rem' }}>
                    Remove hold from all tasks and resume tracking
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Resume all held tasks?')) {
                        bulkUnholdTasks();
                        setShowBulkHoldModal(false);
                        loadItems();
                      }
                    }}
                    style={{ 
                      padding: '0.75rem', 
                      background: '#10b981', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px', 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    ▶️ Resume All Tasks
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReviewOverlay
        isOpen={showReviewOverlay}
        onClose={() => setShowReviewOverlay(false)}
      />
    </div>
  );
};

export default TodayView;
