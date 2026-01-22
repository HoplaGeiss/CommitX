export const getDaysInMonth = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = new Date(year, month, 1).getDay();
  // Convert from Sunday-based (0-6) to Monday-based (0-6)
  // Sunday (0) becomes 6, Monday (1) becomes 0, etc.
  return (day + 6) % 7;
};

export const getMonthDays = (currentMonth: Date): (number | null)[] => {
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days: (number | null)[] = [];

  // Add empty placeholder cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
};

export const isToday = (day: number | null, currentMonth: Date): boolean => {
  if (!day) return false;
  const today = new Date();
  const date = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    day
  );
  return (
    today.getDate() === date.getDate() &&
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear()
  );
};

export const isDateInFuture = (day: number | null, currentMonth: Date): boolean => {
  if (!day) return false;
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  
  const dateYear = currentMonth.getFullYear();
  const dateMonth = currentMonth.getMonth();
  const dateDay = day;
  
  // Compare dates by components to avoid timezone issues
  if (dateYear > todayYear) return true;
  if (dateYear < todayYear) return false;
  if (dateMonth > todayMonth) return true;
  if (dateMonth < todayMonth) return false;
  return dateDay > todayDay;
};

export const isNextMonthInFuture = (currentMonth: Date): boolean => {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  
  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(currentMonth.getMonth() + 1);
  const nextMonthYear = nextMonth.getFullYear();
  const nextMonthMonth = nextMonth.getMonth();
  
  // Check if next month is in the future
  if (nextMonthYear > todayYear) return true;
  if (nextMonthYear < todayYear) return false;
  return nextMonthMonth > todayMonth;
};


