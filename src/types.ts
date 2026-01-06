export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom' | 'count-based' | 'interval';
export type IntervalUnit = 'days' | 'weeks' | 'months' | 'years';

export interface Tag {
  id: string;
  name: string;
  color: string;
  trackable?: boolean; // If true, tag will be auto-counted in analytics
  description?: string; // Optional description of what this tag tracks
  createdAt: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  category?: string; // e.g., "Exercise", "Study", "Self Care", etc.
  tags?: string[]; // Array of tag IDs
  weightage: number; // 1-10, determines screen space
  frequency: FrequencyType;
  customFrequency?: string; // e.g., "1st of every month", "every Monday"
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  frequencyCount?: number; // e.g., 3 for "3 times per week"
  frequencyPeriod?: 'week' | 'month'; // period for count-based frequency
  intervalValue?: number; // e.g., 47 for "every 47 days"
  intervalUnit?: IntervalUnit; // 'days' | 'weeks' | 'months' | 'years'
  intervalStartDate?: string; // YYYY-MM-DD - reference date for interval calculation
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime'; // Time component for routines
  startDate?: string; // YYYY-MM-DD - task won't appear before this date
  endDate?: string; // YYYY-MM-DD - task won't appear after this date
  specificDate?: string; // YYYY-MM-DD - for one-time tasks (when frequency is 'custom')
  color?: string;
  customBackgroundColor?: string; // User-defined background color for the card
  dependentTaskIds?: string[]; // Task IDs that when completed, will auto-complete this task
  onHold?: boolean; // If true, task is paused
  holdStartDate?: string; // YYYY-MM-DD - when hold started
  holdEndDate?: string; // YYYY-MM-DD - when hold will automatically end (optional)
  holdReason?: string; // Optional reason for holding
  endTime?: string; // HH:mm - scheduled end time for task (for timer countdown to end time)
  order?: number; // For custom ordering
  createdAt: string;
}

export interface TaskCompletion {
  taskId: string;
  date: string; // YYYY-MM-DD
  completedAt: string; // ISO timestamp
  durationMinutes?: number; // Optional: how long the task took
  startedAt?: string; // Optional: ISO timestamp when task was started
}

export interface TaskSpillover {
  taskId: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  movedAt: string; // ISO timestamp
}

export type EventFrequencyType = 'yearly' | 'one-time' | 'custom';

export interface Event {
  id: string;
  name: string;
  description?: string;
  category?: string; // e.g., "Birthday", "Anniversary", "Holiday", etc.
  tags?: string[]; // Array of tag IDs
  date: string; // MM-DD format for yearly, YYYY-MM-DD for one-time
  frequency: EventFrequencyType;
  customFrequency?: string; // e.g., "every 5 years"
  year?: number; // For one-time events or tracking age/years
  notifyDaysBefore?: number; // Show on dashboard N days before (default 0 = day of)
  priority?: number; // 1-10, controls display size on dashboard (default 5)
  hideFromDashboard?: boolean; // If true, event won't show on Today dashboard
  color?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  tags?: string[]; // Array of tag IDs
  createdAt: string;
  updatedAt: string;
}

export type DashboardLayout = 'uniform' | 'grid-spans' | 'masonry';

export interface UserSettings {
  dashboardLayout: DashboardLayout;
  theme?: string;
  notifications?: boolean;
  location?: {
    zipCode?: string;
    city?: string;
    country?: string;
  };
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  taskIds: string[]; // References to tasks
  isPreDefined: boolean; // true for system templates, false for user-created
  isActive: boolean; // true = active and usable, false = inactive/template
  createdAt: string;
}

export interface EventAcknowledgment {
  eventId: string;
  date: string; // YYYY-MM-DD - the date it was shown/acknowledged
  acknowledgedAt: string; // ISO timestamp
}

export interface AppData {
  tasks: Task[];
  completions: TaskCompletion[];
  spillovers: TaskSpillover[];
  events: Event[];
  eventAcknowledgments: EventAcknowledgment[];
  tags: Tag[];
  journalEntries: JournalEntry[];
  routines: Routine[];
}

