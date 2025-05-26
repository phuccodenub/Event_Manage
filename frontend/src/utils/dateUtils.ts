import { formatDistanceToNow } from 'date-fns';

export const formatDateTime = (date: string | Date) => {
  const d = new Date(date);
  if (!isNaN(d.getTime())) {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  }
  return 'Invalid Date';
};

export const formatDate = (date: string | Date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getEventStatus = (date: string | Date, endDate?: string | Date) => {
  const eventDate = new Date(date);
  const now = new Date();
  const end = endDate ? new Date(endDate) : null;

  if (end && now > end) return 'completed';
  if (now < eventDate) return 'upcoming';
  if (end && now >= eventDate && now <= end) return 'ongoing';
  return 'upcoming';
};

export const dateRanges = {
  today: 'Hôm nay',
  week: '7 ngày qua',
  month: '30 ngày qua',
  quarter: '3 tháng qua',
  year: 'Năm nay',
  custom: 'Tùy chọn'
} as const;

export const getDateRange = (range: keyof typeof dateRanges) => {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(start.getFullYear(), 0, 1);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
  }

  return { start, end };
};

export const isWithinRange = (date: Date, start: Date, end: Date) => {
  return date >= start && date <= end;
};

// New utility functions for eventDays
export const getEventStartDate = (eventDays: any[]): Date | null => {
  if (!eventDays || eventDays.length === 0) return null;
  
  const firstDay = eventDays[0];
  if (!firstDay.sessions || firstDay.sessions.length === 0) {
    return new Date(firstDay.date);
  }
  
  const firstSession = firstDay.sessions[0];
  const date = new Date(firstDay.date);
  const [hours, minutes] = firstSession.startTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
};

export const getEventEndDate = (eventDays: any[]): Date | null => {
  if (!eventDays || eventDays.length === 0) return null;
  
  const lastDay = eventDays[eventDays.length - 1];
  if (!lastDay.sessions || lastDay.sessions.length === 0) {
    return new Date(lastDay.date);
  }
  
  const lastSession = lastDay.sessions[lastDay.sessions.length - 1];
  const date = new Date(lastDay.date);
  const [hours, minutes] = lastSession.endTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
};

export const getEventStatusFromEventDays = (eventDays: any[]): string => {
  const startDate = getEventStartDate(eventDays);
  const endDate = getEventEndDate(eventDays);
  
  if (!startDate) return 'upcoming';
  
  const now = new Date();
  
  if (endDate && now > endDate) return 'completed';
  if (now < startDate) return 'upcoming';
  if (endDate && now >= startDate && now <= endDate) return 'ongoing';
  return 'upcoming';
};

export const formatEventDaysDisplay = (eventDays: any[]): string => {
  if (!eventDays || eventDays.length === 0) return 'Chưa xác định';
  
  if (eventDays.length === 1) {
    const day = eventDays[0];
    const date = new Date(day.date);
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'numeric' 
    });
  }
  
  const firstDay = new Date(eventDays[0].date);
  const lastDay = new Date(eventDays[eventDays.length - 1].date);
  
  return `${firstDay.toLocaleDateString('vi-VN', { 
    day: 'numeric', 
    month: 'numeric' 
  })} - ${lastDay.toLocaleDateString('vi-VN', { 
    day: 'numeric', 
    month: 'numeric' 
  })}`;
};

export const formatEventTimeDisplay = (eventDays: any[]): string => {
  if (!eventDays || eventDays.length === 0) return 'Chưa xác định';
  
  const startDate = getEventStartDate(eventDays);
  const endDate = getEventEndDate(eventDays);
  
  if (!startDate || !endDate) return 'Chưa xác định';
  
  if (eventDays.length === 1) {
    return `${startDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit', 
      minute: '2-digit'
    })} - ${endDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit', 
      minute: '2-digit'
    })}`;
  }
  
  return `${startDate.toLocaleDateString('vi-VN')} ${startDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit', 
    minute: '2-digit'
  })} - ${endDate.toLocaleDateString('vi-VN')} ${endDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit', 
    minute: '2-digit'
  })}`;
};
