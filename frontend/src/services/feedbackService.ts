import apiClient from '../api/apiClient';

// Types for feedback data
export interface FeedbackDTO {
  rating: number;
  content?: string;
  tags?: string[];
}

export interface EventCoverImage {
  url: string;
  public_id?: string;
}

export interface FeedbackUser {
  _id: string;
  fullName: string;
  avatar?: string;
  email?: string;
  userId?: string;
}

export interface FeedbackItem {
  _id: string;
  event: string;
  user: FeedbackUser;
  rating: number;
  content?: string;
  tags?: string[];
  createdAt: string;
}

export interface FeedbackEligibilityResponse {
  success: boolean;
  data?: {
    canSubmitFeedback: boolean;
    hasSubmitted: boolean;
    reason?: string;
    eventData?: {
      title: string;
      coverImage?: EventCoverImage;
    };
  };
  message?: string;
}

export interface FeedbackListResponse {
  success: boolean;
  data?: {
    feedback: FeedbackItem[];
    stats: {
      averageRating: string;
      ratingCounts: {
        total: number;
        '5': number;
        '4': number;
        '3': number;
        '2': number;
        '1': number;
      };
      tagCounts: Record<string, number>;
    };
  };
}

export interface PendingFeedbackEvent {
  _id: string;
  title: string;
  coverImage?: EventCoverImage;
  location?: string;
  startDate: string;
  endDate: string;
}

export interface PendingFeedbackResponse {
  success: boolean;
  data: PendingFeedbackEvent[];
}

const feedbackService = {
  /**
   * Check if the user can submit feedback for an event
   */
  checkFeedbackEligibility: async (eventId: string): Promise<FeedbackEligibilityResponse> => {
    const response = await apiClient.get(`/events/${eventId}/feedback/check`);
    return response.data;
  },

  /**
   * Submit feedback for an event
   */
  submitFeedback: async (eventId: string, feedback: FeedbackDTO) => {
    const response = await apiClient.post(`/events/${eventId}/feedback`, feedback);
    return response.data;
  },

  /**
   * Get all feedback for an event (admin/organizer only)
   */
  getEventFeedback: async (eventId: string): Promise<FeedbackListResponse> => {
    const response = await apiClient.get(`/events/${eventId}/feedback`);
    return response.data;
  },

  /**
   * Send feedback request notifications to eligible users (admin/organizer only)
   */
  sendFeedbackNotifications: async (eventId: string) => {
    const response = await apiClient.post(`/events/${eventId}/feedback/notify`);
    return response.data;
  },

  /**
   * Get all completed events that the user has attended but not yet provided feedback
   */
  getPendingFeedbackEvents: async (): Promise<PendingFeedbackResponse> => {
    const response = await apiClient.get('/events/pending-feedback');
    return response.data;
  }
};

export default feedbackService; 