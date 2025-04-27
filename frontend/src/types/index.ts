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
  images: Avatar[];
  organizer: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: Avatar;
  };
  participants: string[];
  collaborators: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  creator: string;
}
