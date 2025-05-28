import React, { createContext, useContext, useState, useCallback } from 'react';
import { Event, CollaboratorWithStatus } from '../types';
import eventService from '../services/eventService';
import userService from '../services/userService'; // Thêm import userService

interface Participant {
  _id: string;
  fullName: string;
  avatar?: string | {
    url: string;
  };
  registrationStatus: string;
}

interface User {
  _id: string;
  fullName: string;
  avatar?: {
    url: string;
  };
  role?: string;
}

interface EventContextType {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  updateEventParticipants: (eventId: string, userId: string, isJoining: boolean) => void;
  updateEventCollaborators: (eventId: string, userId: string, isJoining: boolean) => void;
  currentParticipantList: Participant[];
  setCurrentParticipantList: React.Dispatch<React.SetStateAction<Participant[]>>;
  currentEvent: Event | null;
  setCurrentEvent: React.Dispatch<React.SetStateAction<Event | null>>;
  fetchParticipants: (eventId: string) => Promise<void>;
  fetchEvents: () => Promise<void>;
  addEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;
  loading: boolean;
  error: string | null;
  departmentEvents: Event[];
  fetchDepartmentEvents: (departmentId: string) => Promise<void>;
  fetchEventById: (eventId: string) => Promise<Event | null>;
  currentCollaboratorList: CollaboratorWithStatus[];
  fetchCollaborators: (eventId: string) => Promise<void>;
  activeCollaboratorEvents: string[];
  isUserCollaborator: (eventId: string) => boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

// Helper function to check if an error has a response with a status code
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

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [currentParticipantList, setCurrentParticipantList] = useState<Participant[]>([]);
  const [currentCollaboratorList, setCurrentCollaboratorList] = useState<CollaboratorWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departmentEvents, setDepartmentEvents] = useState<Event[]>([]);
  // New state to track events user is collaborating with
  const [activeCollaboratorEvents, setActiveCollaboratorEvents] = useState<string[]>([]);

  const fetchParticipants = useCallback(async (eventId: string) => {
    try {
      const response = await eventService.getEventParticipants(eventId);
      setCurrentParticipantList(response.data);
    } catch (error) {
      // Silently handle 403 errors (permission errors)
      if (isErrorWithResponse(error) && error.response?.status === 403) {
        // Set empty array for participants when access is forbidden
        setCurrentParticipantList([]);
      } else {
        // Log other errors but not permission issues
        console.error('Error fetching participants:', error);
      }
    }
  }, []);
  const fetchCollaborators = useCallback(async (eventId: string) => {
    try {
      const response = await eventService.getEventCollaborators(eventId);
      setCurrentCollaboratorList(response.data);
      
      // Find current user in collaborators
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const isCollaborator = response.data.some((collab: CollaboratorWithStatus) => {
        if (typeof collab.user === 'string') {
          return collab.user === currentUser._id;
        } else if (collab.user) {
          return collab.user._id === currentUser._id;
        }
        return false;
      });
      
      // Update activeCollaboratorEvents state
      setActiveCollaboratorEvents(prev => {
        if (isCollaborator && !prev.includes(eventId)) {
          return [...prev, eventId];
        } else if (!isCollaborator && prev.includes(eventId)) {
          return prev.filter(id => id !== eventId);
        }
        return prev;
      });
    } catch (error) {
      // Silently handle 403 errors (permission errors)
      if (isErrorWithResponse(error) && error.response?.status === 403) {
        // Set empty array for collaborators when access is forbidden
        setCurrentCollaboratorList([]);
      } else {
        // Log other errors but not permission issues
        console.error('Error fetching collaborators:', error);
      }
    }
  }, []);

  // Helper function to check if user is collaborator for an event
  const isUserCollaborator = useCallback((eventId: string) => {
    return activeCollaboratorEvents.includes(eventId);
  }, [activeCollaboratorEvents]);

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

  const updateEventCollaborators = useCallback(async (eventId: string, userId: string, isJoining: boolean) => {
    try {
      // Cập nhật events list
      setEvents(prevEvents => 
        prevEvents.map(event => {
          if (event._id === eventId) {
            // Create a new array for collaborators if it doesn't exist
            const collaborators = event.collaborators || [];
              if (isJoining) {
              // Si está uniendo, agregar como colaborador pendiente
              const newCollaborator: CollaboratorWithStatus = {
                _id: `temp-${Date.now()}`,
                user: userId,
                status: 'pending' as const,
                requestedAt: new Date().toISOString()
              };
              
              return { 
                ...event, 
                collaborators: [...collaborators, newCollaborator]
              };
            } else {
              // Si está dejando, eliminar de la lista
              return { 
                ...event, 
                collaborators: collaborators.filter(collab => {
                  if (typeof collab === 'string') {
                    return collab !== userId;
                  } else {
                    return collab.user !== userId && 
                          (typeof collab.user === 'object' ? collab.user._id !== userId : true);
                  }
                })
              };
            }
          }
          return event;
        })
      );

      // Lấy thông tin user từ service
      const userData = await userService.getUserById(userId);      // Cập nhật danh sách người cộng tác
      if (isJoining) {
        setCurrentCollaboratorList(prev => {
          const newCollaborator: CollaboratorWithStatus = {
            user: {
              _id: userId,
              fullName: userData.fullName,
              avatar: userData.avatar,
              role: userData.role
            },
            status: 'pending' as const,
            requestedAt: new Date().toISOString()
          };
          
          return [...prev, newCollaborator];
        });
      } else {
        setCurrentCollaboratorList(prev => 
          prev.filter(c => {
            if (typeof c.user === 'string') {
              return c.user !== userId;
            } else if (typeof c.user === 'object' && c.user) {
              return c.user._id !== userId;
            }
            return true;
          })
        );
      }
      
      // Update activeCollaboratorEvents for real-time UI updates
      setActiveCollaboratorEvents(prev => {
        if (isJoining && !prev.includes(eventId)) {
          return [...prev, eventId];
        } else if (!isJoining && prev.includes(eventId)) {
          return prev.filter(id => id !== eventId);
        }
        return prev;
      });

    } catch (error) {
      console.error('Error updating collaborators:', error);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventService.getAllEvents();
      setEvents(data);
      setError(null);
      
      // Update activeCollaboratorEvents based on fetched events
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser && currentUser._id) {        const collaboratingEvents = data.filter((event: Event) => 
          event.collaborators && event.collaborators.some(
            (collaborator: string | { _id?: string; user: string | { _id: string }; status: string }) => {
              if (typeof collaborator === 'string') {
                return collaborator === currentUser._id;
              } else if (collaborator && typeof collaborator === 'object') {
                // Handle both direct _id and user object structure
                if (collaborator._id) {
                  return collaborator._id.toString() === currentUser._id?.toString();
                } else if (collaborator.user) {
                  const userId = typeof collaborator.user === 'string' 
                    ? collaborator.user 
                    : collaborator.user._id;
                  return userId?.toString() === currentUser._id?.toString();
                }
              }
              return false;
            }
          )
        ).map((event: Event) => event._id);
        
        setActiveCollaboratorEvents(collaboratingEvents);
      }
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
    
    // Remove from activeCollaboratorEvents if present
    setActiveCollaboratorEvents(prev => 
      prev.filter(id => id !== eventId)
    );
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
      
      // Handle error responses
      if (response.success === false) {
        console.error('Event fetch error:', response.error);
        return null;
      }
      
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
      updateEventCollaborators,
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
      fetchEventById,
      currentCollaboratorList,
      fetchCollaborators,
      activeCollaboratorEvents,
      isUserCollaborator
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