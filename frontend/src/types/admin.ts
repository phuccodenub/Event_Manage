import { User, Event, Announcement } from './index';

export interface AdminDepartment {
  _id: string;
  name: string;
  code: string;
  description?: string;  head?: {
    _id: string;
    fullName: string;
    userId?: string;
    role?: string;
    avatar?: any;
  };
  administrators?: Array<{
    _id: string;
    fullName: string;
    userId?: string;
    role?: string;
    avatar?: any;
  }>;
  moderators?: Array<{
    _id: string;
    fullName: string;
    userId?: string;
    role?: string;
    avatar?: any;
  }>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DashboardStats {
  timeRange: DateRange;
  users: {
    total: number;
    new: number;
    byRole: {
      student: number;
      teacher: number;
      speaker: number;
      admin: number;
    };
    growth: Array<{
      date: string;
      count: number;
      trend: number; // % tăng/giảm
    }>;
  };
  events: {
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
    byStatus: Record<string, number>;
    byDepartment: Record<string, number>;
    participation: Array<{
      id: string;
      title: string;
      registered: number;
      capacity: number;
      rate: number;
      date: Date;
    }>;
    timeline: Array<{
      date: Date;
      count: number;
      type: 'upcoming' | 'ongoing' | 'completed';
    }>;
  };
  announcements: {
    total: number;
    active: number;
    byCategory: Record<string, number>;
    byPriority: Record<number, number>;
    recent: Array<{
      id: string;
      title: string;
      category: string;
      createdAt: Date;
      views: number;
    }>;
  };
  activities: Array<{
    id: string;
    type: 'event' | 'announcement' | 'user';
    action: string;
    title: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
    timestamp: Date;
    details?: Record<string, any>;
  }>;
}

export interface AdminEvent extends Omit<Event, 'status'> {
  department?: {
    _id: string;
    name: string;
    code?: string;
  };
  category?: string;
  capacity?: number;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  registered?: number;
  attendance?: number;
  timeline?: Array<{
    status: string;
    timestamp: Date;
    updatedBy: string;
  }>;
  analytics?: {
    viewCount: number;
    registrationRate: number;
    attendanceRate: number;
    feedback: {
      rating: number;
      count: number;
    };
  };
}

export interface AdminUser extends User {
  lastLogin: Date;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
  statistics: {
    eventsCreated: number;
    eventsParticipated: number;
    announcementsCreated: number;
    lastActivity: Date;
  };
}

export interface AdminAnnouncement extends Omit<Announcement, 'status'> {
  viewCount?: number;
  status: 'draft' | 'published' | 'archived';
  analytics?: {
    views: number;
    uniqueViews: number;
    engagement: number;
  };
  history?: Array<{
    action: string;
    timestamp: Date;
    user: string;
  }>;
  images?: Array<{
    public_id: string;
    url: string;
  }>;
}
