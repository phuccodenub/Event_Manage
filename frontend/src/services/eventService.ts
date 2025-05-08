import apiClient from '../api/apiClient';
import type { Event } from '../types';

interface EventQueryParams {
  department?: string;
}

interface EventResponse {
  success: boolean;
  data: Event[];
}

const eventService = {
  getAllEvents: async () => {
    const response = await apiClient.get('/events');
    const events = response.data?.data || [];
    
    // Format participants to ensure consistent ID format
    return events.map((event: any) => ({
      ...event,
      participants: (event.participants || []).map((p: any) => 
        typeof p === 'string' ? p : p._id.toString()
      )
    }));
  },

  getEventById: async (eventId: string) => {
    try {
      const response = await apiClient.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  createEvent: async (eventData: FormData) => {
    try {
      // Log data before sending
      console.log('Creating event with data:', {
        title: eventData.get('title'),
        description: eventData.get('description'),
        capacity: eventData.get('capacity'),
        images: eventData.get('images'),
      });

      const response = await apiClient.post('/events', eventData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to create event');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Event creation error:', error.response || error);
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

  joinEvent: async (eventId: string) => {
    try {
      const response = await apiClient.post(`/events/${eventId}/join`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to join event');
    }
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
      console.error('Error fetching participants:', error);
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
};

export default eventService;
