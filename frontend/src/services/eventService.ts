import apiClient from '../api/apiClient';

const eventService = {
  /**
   * Fetch all events
   * @returns Promise with the list of events
   */
  getAllEvents: async () => {
    const response = await apiClient.get('/events');
    return response.data?.data || []; // Ensure it returns an array
  },

  /**
   * Fetch a single event by ID
   * @param eventId ID of the event
   * @returns Promise with the event details
   */
  getEventById: async (eventId: string) => {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data?.data || null; // Ensure it returns the event or null
  },
};

export default eventService;
