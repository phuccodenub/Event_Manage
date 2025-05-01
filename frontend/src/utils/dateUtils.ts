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
