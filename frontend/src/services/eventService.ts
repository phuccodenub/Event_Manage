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
    const response = await apiClient.get('/event');
    const events = response.data?.data || [];
    
    // Format participants to ensure consistent ID format
    return events.map((event: Event) => ({
      ...event,
      participants: (event.participants || []).map((p: string | { _id: string }) => 
        typeof p === 'string' ? p : p._id.toString()
      )
    }));
  },

  getEventById: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  createEvent: async (eventData: FormData) => {
    try {
      // Log all FormData entries for debugging
      console.log('Creating event with data:');
      for (const [key, value] of eventData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await apiClient.post('/event', eventData, {
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
    const response = await apiClient.put(`/event/${eventId}`, eventData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  deleteEvent: async (eventId: string) => {
    await apiClient.delete(`/event/${eventId}`);
  },

  getEventForm: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/event/${eventId}/registration-form`);
      return response.data;
    } catch (error) {
      console.error('Error fetching registration form:', error);
      throw error;
    }
  },

  joinEvent: async (eventId: string, formData?: FormResponseData) => {
    const response = await apiClient.post(`/event/${eventId}/join`, formData);
    return response.data;
  },

  leaveEvent: async (eventId: string) => {
    try {
      const response = await apiClient.post(`/event/${eventId}/leave`);
      return response.data;
    } catch (error) {
      console.error('Error leaving event:', error);
      throw error;
    }
  },

  getEventParticipants: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/event/${eventId}/participants`);
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
      const response = await apiClient.get<EventResponse>('/event', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  getEventSubmissions: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/event/${eventId}/submissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

  getFormSubmissions: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/event/${eventId}/submissions`);
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
      const response = await apiClient.post(`/event/${eventId}/join-collaborator`, data);
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
        ? `/event/${eventId}/remove-collaborator/${userId}`
        : `/event/${eventId}/leave-collaborator`;
        
      const response = await apiClient.post(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error leaving as collaborator:', error);
      throw error;
    }
  },

  getEventCollaborators: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/event/${eventId}/collaborators`);
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
      const response = await apiClient.get(`/event/${eventId}/collaborator-form`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaborator form:', error);
      throw error;
    }
  },

  updateEventCollaboratorForm: async (eventId: string, fields: any[]) => {
    try {
      const response = await apiClient.put(`/event/${eventId}/collaborator-form`, { fields });
      return response.data;
    } catch (error) {
      console.error('Error updating collaborator form:', error);
      throw error;
    }
  },

  getCollaboratorFormSubmissions: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/event/${eventId}/collaborator-submissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaborator submissions:', error);
      throw error;
    }
  },

  // Collaborator approval methods
  approveCollaborator: async (eventId: string, userId: string) => {
    try {
      const response = await apiClient.put(`/event/${eventId}/approve-collaborator/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error approving collaborator:', error);
      throw error;
    }
  },

  rejectCollaborator: async (eventId: string, userId: string, reason?: string) => {
    try {
      const response = await apiClient.put(`/event/${eventId}/reject-collaborator/${userId}`, 
        reason ? { reason } : {});
      return response.data;
    } catch (error) {
      console.error('Error rejecting collaborator:', error);
      throw error;
    }
  },
};

export const createCommunityEvent = async (communityId: string, eventData: FormData): Promise<any> => {
  try {
    const response = await apiClient.post(`/communities/${communityId}/events`, eventData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating community event:', error);
    throw error;
  }
};

export default eventService;