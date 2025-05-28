import { useQuery } from '@tanstack/react-query';
import eventService from '../services/eventService';

/**
 * Custom hook to fetch and cache events data
 * Uses React Query for efficient caching and avoiding redundant API calls
 */
export const useEventData = (eventId?: string) => {  // Query for a single event
  const singleEventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const result = await eventService.getEventById(eventId);
      
      // Handle error responses from the service
      if (result.success === false) {
        console.error('Event fetch error:', result.error);
        return null;
      }
      
      return result;
    },
    enabled: !!eventId, // Only run this query if eventId is provided
    retry: false, // Don't retry on 404 errors
  });

  // Query for all events
  const allEventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      return await eventService.getAllEvents();
    },
    enabled: !eventId, // Only run this query if eventId is NOT provided
  });

  return {
    // For single event queries
    event: singleEventQuery.data,
    eventLoading: singleEventQuery.isLoading,
    eventError: singleEventQuery.error,
    refetchEvent: singleEventQuery.refetch,
    
    // For all events queries
    events: allEventsQuery.data || [],
    eventsLoading: allEventsQuery.isLoading,
    eventsError: allEventsQuery.error,
    refetchEvents: allEventsQuery.refetch,
  };
}; 