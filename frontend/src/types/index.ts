export interface Avatar {
  public_id?: string;
  url: string;
}

// Standardized collaborator interface with flexible avatar support
export interface CollaboratorWithStatus {
  _id?: string;
  user: {
    _id: string;
    fullName: string;
    email?: string;
    avatar?: Avatar | string;
    role?: string;
  } | string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: {
    _id: string;
    fullName: string;
  };
  rejectionReason?: string;
  selectedShifts?: Array<{
    date: string;
    session: string;
  }>;
  formData?: Map<string, any>;
  workingSchedule?: {
    start: string | Date;
    end: string | Date;
  };
}

export interface User {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  username?: string;
  userId?: string;
  role: string;
  class?: string;
  department: string | null;
  gender: string;
  phone?: string;
  birthday?: Date;
  createdAt?: Date | string;
  socialMedia?: {
    facebook?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
  };
  collaboratorEvents: string[];
  registeredEvents: string[];
  avatar?: Avatar | string;
  uniqueEventCount?: number;
  showProfileToOthers?: boolean;
}

export interface FormField {
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  startDate?: Date | string; // Legacy field for backward compatibility
  endDate?: Date | string; // Legacy field for backward compatibility
  eventDays?: Array<{
    date: Date | string;
    sessions: Array<{
      type: string;
      startTime: string;
      endTime: string;
      label: string;
    }>;
  }>;
  createdAt?: Date | string;
  eventType: 'offline' | 'online' | 'hybrid';
  location: {
    physical?: {
      address: string;
      room: string;
    };
    online?: {
      platform: string;
      meetingLink: string;
      meetingId?: string;
      password?: string;
    };
  };
  images: Array<{
    public_id: string;
    url: string;
  }>;
  category?: string;
  speakers?: string[];
  tags?: string[];
  likes?: string[];
  comments?: string[];
  shares?: string[];
  organizer: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: {
      url: string;
      public_id?: string;
    } | string;
  };
  department?: {
    _id: string;
    name: string;
  };
  community?: {
    _id: string;
    name: string;
    description?: string;
    avatar?: {
      url: string;
      public_id?: string;
    };
    banner?: {
      url: string;
      public_id?: string;
    };
  };
  participants: string[];
  collaborators: Array<string | CollaboratorWithStatus>;
  creator: {
    _id: string;
    fullName: string;
    avatar?: {
      url: string;
      public_id?: string;
    } | string;
  };
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'sắp diễn ra' | 'đang diễn ra' | 'đã kết thúc' | 'đã hủy';
  needsRegistrationForm: boolean;
  needsCollaboratorForm?: boolean;
  needsVolunteers?: boolean;
  maxVolunteers?: number;
  capacity?: number;
  eventScope?: 'general' | 'community';
  visibility?: 'public' | 'private' | 'restricted';
  registrationDeadline?: Date | string;
  registrationForm?: {
    fields: FormField[];
  };
  setupTime?: {
    supportDays?: Array<{
      date: string | Date;
      sessions: Array<{
        type: string;
        startTime: string;
        endTime: string;
        label: string;
      }>;
    }>;
  };
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  images?: Array<{
    public_id: string;
    url: string;
  }>;
  creator: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: {
      public_id: string;
      url: string;
    } | string;
  };
  department?: {
    _id: string;
    name: string;
  };
  expiresAt: string;
  status: 'active' | 'expired' | 'archived';
  createdAt: string;
  updatedAt?: string;
}

export interface BasePost {
  _id: string;
  title: string;
  creator: {
    _id: string;
    fullName: string;
    avatar?: {
      url: string;
    };
  };
  createdAt: string;
  images?: Array<{
    public_id: string;
    url: string;
  }>;
}

export type Post = Event | Announcement;

export function isEvent(post: Event | Announcement): post is Event {
  return 'eventType' in post;
}

export function isAnnouncement(post: Post): post is Announcement {
  return (post as Announcement).priority !== undefined;
}

export interface Notification {
  relatedModel?: 'Event' | 'Announcement';
  relatedId?: string;
  link?: string;
  createdAt: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  head?: {
    _id: string;
    fullName: string;
    avatar?: Avatar;
  };
  administrators?: Array<{
    _id: string;
    fullName: string;
    avatar?: Avatar;
  }>;
  moderators?: Array<{
    _id: string;
    fullName: string;
    avatar?: Avatar;
  }>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
