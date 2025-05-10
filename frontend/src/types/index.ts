export interface Avatar {
  public_id: string;
  url: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  userId: string;
  role: string;
  class?: string;
  department: string | null;
  gender: string;
  phone: string;
  birthday?: Date;
  collaboratorEvents: any[];
  registeredEvents: any[];
  avatar?: Avatar;
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
  startDate: Date;
  endDate: Date;
  eventType: 'offline' | 'online' | 'hybrid';
  location: {
    physical?: {
      address: string;
      room: string;
    };
    online?: {
      platform: string;
      meetingLink: string;
    };
  };
  images: Array<{
    public_id: string;
    url: string;
  }>;
  organizer: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  participants: string[];
  creator: {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  status: 'sắp diễn ra' | 'đang diễn ra' | 'đã kết thúc' | 'đã hủy';
  needsRegistrationForm: boolean;
  registrationForm?: {
    fields: FormField[];
  };
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  creator: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: {
      public_id: string;
      url: string;
    };
  };
  department?: {
    _id: string;
    name: string;
  };
  expiresAt: string;
  status: 'active' | 'expired' | 'archived';
  createdAt: string;
  updatedAt: string;
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
