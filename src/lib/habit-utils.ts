export type Habit = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Completion = {
  id: string;
  habit_id: string;
  completion_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type HabitMetrics = {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  completionPercentage: number;
};

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  const year = yearValue ?? 0;
  const month = monthValue ?? 1;
  const day = dayValue ?? 1;
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function dateKeysBetween(start: Date, end: Date): string[] {
  const keys: string[] = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    keys.push(getLocalDateKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return keys;
}

export function getHabitMetrics(habit: Habit, completions: Completion[]): HabitMetrics {
  const completedKeys = new Set(
    completions.filter((completion) => completion.completed).map((completion) => completion.completion_date),
  );
  const today = getLocalDateKey();
  let currentStreak = 0;
  let cursor = today;
  while (completedKeys.has(cursor)) {
    currentStreak += 1;
    cursor = getLocalDateKey(addDays(parseDateKey(cursor), -1));
  }

  const sortedKeys = [...completedKeys].sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let previousKey: string | undefined;
  for (const key of sortedKeys) {
    if (previousKey && getLocalDateKey(addDays(parseDateKey(previousKey), 1)) === key) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }
    longestStreak = Math.max(longestStreak, runningStreak);
    previousKey = key;
  }

  const created = new Date(habit.created_at);
  const elapsedDays = Math.max(1, Math.floor((Date.now() - created.getTime()) / 86400000) + 1);
  const totalCompleted = completedKeys.size;

  return {
    currentStreak,
    longestStreak,
    totalCompleted,
    completionPercentage: Math.min(100, Math.round((totalCompleted / elapsedDays) * 100)),
  };
}

export function getHistoryWeeks(weeks = 52): string[][] {
  const today = new Date();
  const end = addDays(today, 0);
  const start = addDays(end, -(weeks * 7 - 1));
  const firstDay = start.getDay();
  const alignedStart = addDays(start, -firstDay);
  return Array.from({ length: weeks }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) =>
      getLocalDateKey(addDays(alignedStart, weekIndex * 7 + dayIndex)),
    ),
  );
}

export function monthLabelsForWeeks(weeks: string[][]): { label: string; index: number }[] {
  const labels: { label: string; index: number }[] = [];
  weeks.forEach((week, index) => {
    const firstDay = week[0];
    if (!firstDay) return;
    const date = parseDateKey(firstDay);
    const label = date.toLocaleDateString(undefined, { month: "short" });
    if (index === 0 || labels.at(-1)?.label !== label) labels.push({ label, index });
  });
  return labels;
}

export function formatToday(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function getInitials(email: string): string {
  const localPart = email.split("@")[0] ?? email;
  return localPart.slice(0, 2).toUpperCase();
}