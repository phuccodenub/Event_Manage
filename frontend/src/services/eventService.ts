import apiClient from '../api/apiClient';

const eventService = {
  getAllEvents: async () => {
    const response = await apiClient.get('/events');
    return response.data?.data || [];
  },

  getEventById: async (eventId: string) => {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data?.data || null;
  },

  createEvent: async (eventData: FormData) => {
    try {
      console.log('Creating event with data:', {
        title: eventData.get('title'),
        description: eventData.get('description'),
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
};

export default eventService;
