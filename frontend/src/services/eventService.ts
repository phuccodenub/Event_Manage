import apiClient from '../api/apiClient';
import type { Event } from '../types';

interface EventQueryParams {
  department?: string;
}

interface EventResponse {
  success: boolean;
  data: Event[];
}

interface FormResponseData {
  [key: string]: string | string[];
}

// Helper type guard function
interface ErrorWithResponse {
  response?: {
    status?: number;
  };
}

function isErrorWithResponse(error: unknown): error is ErrorWithResponse {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'status' in error.response
  );
}

const eventService = {
  getAllEvents: async () => {
    try {
      const response = await apiClient.get('/events');
      const events = response.data?.data || [];
      
      // Format participants to ensure consistent ID format
      return events.map((event: Event) => ({
        ...event,
        participants: (event.participants || []).map((p: string | { _id: string }) => 
          typeof p === 'string' ? p : p._id.toString()
        )
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      // Return empty array if server is not available
      return [];
    }
  },
  getEventById: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/events/${eventId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching event:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Event not found',
          message: 'Sự kiện không tồn tại hoặc đã bị xóa'
        };
      }
      
      // For other errors, maintain the original structure but add success: false
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch event',
        message: error.response?.data?.message || 'Không thể tải thông tin sự kiện'
      };
    }
  },

  createEvent: async (eventData: FormData) => {
    try {
      // Log all FormData entries for debugging
      console.log('Creating event with data:');
      for (const [key, value] of eventData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await apiClient.post('/events', eventData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to create event');
      }

      return response.data.data;
    } catch (error: unknown) {
      console.error('Event creation error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response data:', axiosError.response?.data);
        console.error('Response status:', axiosError.response?.status);
      }
      throw error;
    }
  },

  updateEvent: async (eventId: string, eventData: FormData) => {
    const response = await apiClient.put(`/events/${eventId}`, eventData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  deleteEvent: async (eventId: string) => {
    await apiClient.delete(`/events/${eventId}`);
  },

  getEventForm: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/events/${eventId}/registration-form`);
      return response.data;
    } catch (error) {
      console.error('Error fetching registration form:', error);
      throw error;
    }
  },

  joinEvent: async (eventId: string, formData?: FormResponseData) => {
    const response = await apiClient.post(`/events/${eventId}/join`, formData);
    return response.data;
  },

  leaveEvent: async (eventId: string) => {
    try {
      const response = await apiClient.post(`/events/${eventId}/leave`);
      return response.data;
    } catch (error) {
      console.error('Error leaving event:', error);
      throw error;
    }
  },

  getEventParticipants: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/events/${eventId}/participants`);
      return response.data;
    } catch (error) {
      // Do not log 403 errors - these are expected when permissions are not sufficient
      if (!isErrorWithResponse(error) || error.response?.status !== 403) {
        console.error('Error fetching participants:', error);
      }
      throw error;
    }
  },

  getEvents: async (params?: EventQueryParams): Promise<EventResponse> => {
    try {
      const response = await apiClient.get<EventResponse>('/events', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  getEventSubmissions: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/events/${eventId}/submissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

  getFormSubmissions: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/events/${eventId}/submissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

  // Collaborator methods
  joinEventAsCollaborator: async (eventId: string, data?: { 
    selectedShifts: { date: string, session: string }[], 
    formData?: Record<string, any> 
  }) => {
    try {
      const response = await apiClient.post(`/events/${eventId}/join-collaborator`, data);
      return response.data;
    } catch (error) {
      console.error('Error joining event as collaborator:', error);
      throw error;
    }
  },

  leaveEventAsCollaborator: async (eventId: string, userId?: string) => {
    try {
      // If userId is provided, it's an admin removing a collaborator
      const endpoint = userId 
        ? `/events/${eventId}/remove-collaborator/${userId}`
        : `/events/${eventId}/leave-collaborator`;
        
      const response = await apiClient.post(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error leaving as collaborator:', error);
      throw error;
    }
  },

  getEventCollaborators: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/events/${eventId}/collaborators`);
      return response.data;
    } catch (error) {
      // Do not log 403 errors - these are expected when permissions are not sufficient
      if (!isErrorWithResponse(error) || error.response?.status !== 403) {
        console.error('Error fetching collaborators:', error);
      }
      throw error;
    }
  },

  // Collaborator form methods
  getEventCollaboratorForm: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/events/${eventId}/collaborator-form`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching collaborator form:', error);
      if (error.response?.status === 404) {
        // Return empty form for events that don't have collaborator forms
        return {
          success: true,
          data: {
            fields: [],
            setupTime: null
          }
        };
      }
      throw error;
    }
  },

  updateEventCollaboratorForm: async (eventId: string, fields: any[]) => {
    try {
      const response = await apiClient.put(`/events/${eventId}/collaborator-form`, { fields });
      return response.data;
    } catch (error) {
      console.error('Error updating collaborator form:', error);
      throw error;
    }
  },

  getCollaboratorFormSubmissions: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/events/${eventId}/collaborator-submissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaborator submissions:', error);
      throw error;
    }
  },

  // Collaborator approval methods
  approveCollaborator: async (eventId: string, userId: string) => {
    try {
      const response = await apiClient.put(`/events/${eventId}/approve-collaborator/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error approving collaborator:', error);
      throw error;
    }
  },

  rejectCollaborator: async (eventId: string, userId: string, reason?: string) => {
    try {
      const response = await apiClient.put(`/events/${eventId}/reject-collaborator/${userId}`, 
        reason ? { reason } : {});
      return response.data;
    } catch (error) {
      console.error('Error rejecting collaborator:', error);
      throw error;
    }
  },

  // Create community event
  createCommunityEvent: async (communityId: string, formData: FormData) => {
    try {
      const response = await apiClient.post(`/communities/${communityId}/eventss`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating community event:', error);
      
      // Handle network errors or server unavailable
      if (!error.response) {
        return {
          success: false,
          message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại sau.'
        };
      }
      
      // Handle specific HTTP errors
      if (error.response.status === 500) {
        return {
          success: false,
          message: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.'
        };
      }
      
      if (error.response.status === 404) {
        return {
          success: false,
          message: 'Không tìm thấy cộng đồng.'
        };
      }
      
      if (error.response.status === 403) {
        return {
          success: false,
          message: 'Bạn không có quyền tạo sự kiện trong cộng đồng này.'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện'
      };
    }
  },
};

export default eventService;