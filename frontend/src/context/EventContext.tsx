import React, { createContext, useContext, useState, useCallback } from 'react';
import { Event } from '../types';
import eventService from '../services/eventService';
import userService from '../services/userService'; // Thêm import userService

interface Participant {
  _id: string;
  fullName: string;
  avatar?: {
    url: string;
  };
  registrationStatus: string;
}

interface EventContextType {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  updateEventParticipants: (eventId: string, userId: string, isJoining: boolean) => void;
  currentParticipantList: Participant[];
  setCurrentParticipantList: React.Dispatch<React.SetStateAction<Participant[]>>;
  currentEvent: Event | null;
  setCurrentEvent: React.Dispatch<React.SetStateAction<Event | null>>;
  fetchParticipants: (eventId: string) => Promise<void>;
  fetchEvents: () => Promise<void>;  // Thêm function này vào interface
  addEvent: (event: Event) => void;  // Add this line
  deleteEvent: (eventId: string) => void;  // Add this line
  loading: boolean;  // Thêm state loading
  error: string | null;  // Thêm state error
  departmentEvents: Event[];
  fetchDepartmentEvents: (departmentId: string) => Promise<void>;
  fetchEventById: (eventId: string) => Promise<Event | null>; // Thêm fetchEventById
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [currentParticipantList, setCurrentParticipantList] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departmentEvents, setDepartmentEvents] = useState<Event[]>([]);

  const fetchParticipants = useCallback(async (eventId: string) => {
    try {
      const response = await eventService.getEventParticipants(eventId);
      setCurrentParticipantList(response.data);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }, []);

  const updateEventParticipants = useCallback(async (eventId: string, userId: string, isJoining: boolean) => {
    try {
      // Cập nhật events list
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId 
            ? { ...event, participants: isJoining 
                ? [...event.participants, userId] 
                : event.participants.filter(id => id !== userId) 
              }
            : event
        )
      );

      // Lấy thông tin user từ service
      const userData = await userService.getUserById(userId);

      // Cập nhật danh sách người tham gia
      setCurrentParticipantList(prev => {
        if (isJoining) {
          return [...prev, {
            _id: userId,
            fullName: userData.fullName,
            avatar: userData.avatar,
            registrationStatus: 'approved'
          }];
        } else {
          return prev.filter(p => p._id !== userId);
        }
      });

    } catch (error) {
      console.error('Error updating participants:', error);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventService.getAllEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  const addEvent = useCallback((newEvent: Event) => {
    setEvents(prevEvents => [...prevEvents, newEvent]);
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prev => {
      const eventIndex = prev.findIndex(e => e._id === eventId);
      if (eventIndex === -1) return prev;
      
      // Create new array without the deleted event
      const newEvents = [...prev];
      newEvents.splice(eventIndex, 1);
      return newEvents;
    });
  }, []);

  const fetchDepartmentEvents = useCallback(async (departmentId: string) => {
    try {
      setLoading(true);
      const response = await eventService.getEvents({ department: departmentId });
      if (response.success && Array.isArray(response.data)) {
        setDepartmentEvents(response.data);
      } else {
        setDepartmentEvents([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching department events:', err);
      setError('Failed to fetch department events');
      setDepartmentEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEventById = useCallback(async (eventId: string) => {
    try {
      const response = await eventService.getEventById(eventId);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }, []);

  return (
    <EventContext.Provider value={{ 
      events, 
      setEvents, 
      updateEventParticipants,
      currentParticipantList,
      setCurrentParticipantList,
      currentEvent,
      setCurrentEvent,
      fetchParticipants,
      fetchEvents,
      addEvent,
      deleteEvent,
      loading,
      error,
      departmentEvents,
      fetchDepartmentEvents,
      fetchEventById
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (undefined === context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};
