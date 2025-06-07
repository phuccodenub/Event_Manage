import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Community } from '../services/communityService';

interface CommunityJoinState {
  [communityId: string]: 'none' | 'pending' | 'member';
}

interface CommunityActivity {
  id: string;
  type: 'join_request' | 'member_joined' | 'member_left' | 'event_created';
  communityId: string;
  user: {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  timestamp: string;
  data?: any;
}

interface OnlineMemberStatus {
  [communityId: string]: string[]; // Array of user IDs who are online
}

interface CommunityContextType {
  // Core state like EventContext
  communities: Community[];
  setCommunities: React.Dispatch<React.SetStateAction<Community[]>>;
  updateCommunityJoinState: (communityId: string, userId: string, action: 'join' | 'cancel') => void;
  
  // Legacy state for backward compatibility
  joinStates: CommunityJoinState;
  activities: CommunityActivity[];
  onlineMembers: OnlineMemberStatus;
  socket: Socket | null;
  isConnected: boolean;
  updateJoinState: (communityId: string, state: 'none' | 'pending' | 'member') => void;
  joinCommunityRoom: (communityId: string) => void;
  leaveCommunityRoom: (communityId: string) => void;
  clearActivities: (communityId?: string) => void;
  retry: () => void;
  
  // User state tracking
  activePendingRequests: string[]; // Community IDs where user has pending request
  activeMemberships: string[]; // Community IDs where user is member
  isUserPendingInCommunity: (communityId: string) => boolean;
  isUserMemberOfCommunity: (communityId: string) => boolean;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

interface CommunityProviderProps {
  children: ReactNode;
}

export const CommunityProvider: React.FC<CommunityProviderProps> = ({ children }) => {
  // Core state like EventContext
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activePendingRequests, setActivePendingRequests] = useState<string[]>([]);
  const [activeMemberships, setActiveMemberships] = useState<string[]>([]);
  
  // Legacy state for backward compatibility
  const [joinStates, setJoinStates] = useState<CommunityJoinState>({});
  const [activities, setActivities] = useState<CommunityActivity[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<OnlineMemberStatus>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const maxReconnectAttempts = 5;

  // Helper functions like EventContext
  const isUserPendingInCommunity = useCallback((communityId: string) => {
    return activePendingRequests.includes(communityId);
  }, [activePendingRequests]);

  const isUserMemberOfCommunity = useCallback((communityId: string) => {
    return activeMemberships.includes(communityId);
  }, [activeMemberships]);

  // Main update function like updateEventParticipants
  const updateCommunityJoinState = useCallback((communityId: string, userId: string, action: 'join' | 'cancel') => {
    try {
      // Update communities state optimistically
      setCommunities(prevCommunities => 
        prevCommunities.map(community => {
          if (community._id === communityId) {
            const pendingRequests = community.pendingRequests || [];
            
            if (action === 'join') {
              // Add pending request
              const newRequest = {
                _id: `temp-${Date.now()}`,
                user: {
                  _id: userId,
                  fullName: 'Loading...',
                  avatar: { url: '/default-avatar.png' }
                },
                status: 'pending' as const,
                requestDate: new Date().toISOString()
              };
              
              return {
                ...community,
                pendingRequests: [...pendingRequests, newRequest]
              };
            } else if (action === 'cancel') {
              // Remove pending request
              return {
                ...community,
                pendingRequests: pendingRequests.filter(
                  request => {
                    const requestUserId = typeof request.user === 'string' ? request.user : request.user?._id;
                    return requestUserId !== userId;
                  }
                )
              };
            }
          }
          return community;
        })
      );

      // Update user state tracking
      if (action === 'join') {
        setActivePendingRequests(prev => 
          prev.includes(communityId) ? prev : [...prev, communityId]
        );
        setActiveMemberships(prev => 
          prev.filter(id => id !== communityId)
        );
      } else if (action === 'cancel') {
        setActivePendingRequests(prev => 
          prev.filter(id => id !== communityId)
        );
      }

      // Update legacy state for backward compatibility
      const newState = action === 'join' ? 'pending' : 'none';
      setJoinStates(prev => ({
        ...prev,
        [communityId]: newState
      }));

      // Emit to websocket for real-time sync
      if (socket && isConnected) {
        socket.emit('community:update-join-state', {
          communityId,
          userId,
          action,
          status: newState,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error updating community join state:', error);
    }
  }, [socket, isConnected]);

  const initializeSocket = useCallback(() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser._id || currentUser.id;

      const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        query: {
          userId: userId || ''
        }
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('🔗 Connected to community websocket');
        setIsConnected(true);
        setReconnectAttempts(0);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from websocket:', reason);
        setIsConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setReconnectAttempts(0);
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt #${attemptNumber}`);
        setReconnectAttempts(attemptNumber);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('❌ Failed to reconnect after maximum attempts');
        setIsConnected(false);
      });

      // Community-specific events
      newSocket.on('community:join-request', (data) => {
        console.log('📨 Community join request update:', data);
        updateCommunityJoinState(data.communityId, data.userId, data.action);

        // Add to activity feed
        const activity: CommunityActivity = {
          id: `${data.communityId}_${Date.now()}`,
          type: 'join_request',
          communityId: data.communityId,
          user: data.user,
          timestamp: data.timestamp || new Date().toISOString(),
          data: { status: data.status }
        };
        
        setActivities(prev => [activity, ...prev.slice(0, 49)]); // Keep last 50 activities
      });

      newSocket.on('community:member-added', (data) => {
        console.log('👥 Community member added:', data);
        setJoinStates(prev => ({
          ...prev,
          [data.communityId]: 'member'
        }));

        const activity: CommunityActivity = {
          id: `${data.communityId}_member_${Date.now()}`,
          type: 'member_joined',
          communityId: data.communityId,
          user: data.user,
          timestamp: data.timestamp || new Date().toISOString()
        };
        
        setActivities(prev => [activity, ...prev.slice(0, 49)]);
      });

      newSocket.on('community:request-cancelled', (data) => {
        console.log('🚫 Community request cancelled:', data);
        updateCommunityJoinState(data.communityId, data.userId, 'cancel');
      });

      newSocket.on('community:member-status-change', (data) => {
        console.log('🔄 Member status change:', data);
        setOnlineMembers(prev => ({
          ...prev,
          [data.communityId]: data.onlineMembers || []
        }));
      });

      newSocket.on('community:new-activity', (activity: CommunityActivity) => {
        console.log('🆕 New community activity:', activity);
        setActivities(prev => [activity, ...prev.slice(0, 49)]);
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('🚨 WebSocket error:', error);
      });

      setSocket(newSocket);

      return newSocket;
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const socketInstance = initializeSocket();

    return () => {
      if (socketInstance) {
        console.log('🔌 Cleaning up WebSocket connection');
        socketInstance.close();
      }
    };
  }, [initializeSocket]);

  // Initialize user state when communities are loaded
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser && currentUser._id && communities.length > 0) {
      const userId = currentUser._id;
      
      // Find communities where user has pending requests
      const pendingCommunities = communities.filter(community => 
        community.pendingRequests?.some(request => {
          const requestUserId = typeof request.user === 'string' ? request.user : request.user?._id;
          return requestUserId === userId && request.status === 'pending';
        })
      ).map(community => community._id);
      
      // Find communities where user is member
      const memberCommunities = communities.filter(community =>
        community.members?.some(member => {
          const memberId = typeof member.user === 'string' ? member.user : member.user?._id;
          return memberId === userId;
        })
      ).map(community => community._id);
      
      setActivePendingRequests(pendingCommunities);
      setActiveMemberships(memberCommunities);
    }
  }, [communities]);

  const updateJoinState = useCallback((communityId: string, state: 'none' | 'pending' | 'member') => {
    setJoinStates(prev => ({
      ...prev,
      [communityId]: state
    }));

    // Emit to websocket for real-time sync
    if (socket && isConnected) {
      socket.emit('community:update-join-state', {
        communityId,
        status: state,
        timestamp: new Date().toISOString()
      });
    }
  }, [socket, isConnected]);

  const joinCommunityRoom = useCallback((communityId: string) => {
    if (socket && isConnected) {
      console.log(`🏠 Joining community room: ${communityId}`);
      socket.emit('community:join-room', communityId);
    }
  }, [socket, isConnected]);

  const leaveCommunityRoom = useCallback((communityId: string) => {
    if (socket && isConnected) {
      console.log(`🚪 Leaving community room: ${communityId}`);
      socket.emit('community:leave-room', communityId);
    }
  }, [socket, isConnected]);

  const clearActivities = useCallback((communityId?: string) => {
    if (communityId) {
      setActivities(prev => prev.filter(activity => activity.communityId !== communityId));
    } else {
      setActivities([]);
    }
  }, []);

  const retry = useCallback(() => {
    console.log('🔄 Retrying websocket connection...');
    if (socket) {
      socket.close();
    }
    initializeSocket();
  }, [socket, initializeSocket]);

  const contextValue: CommunityContextType = {
    // Core state like EventContext
    communities,
    setCommunities,
    updateCommunityJoinState,
    
    // User state tracking
    activePendingRequests,
    activeMemberships,
    isUserPendingInCommunity,
    isUserMemberOfCommunity,
    
    // Legacy state for backward compatibility
    joinStates,
    activities,
    onlineMembers,
    socket,
    isConnected,
    updateJoinState,
    joinCommunityRoom,
    leaveCommunityRoom,
    clearActivities,
    retry
  };

  return (
    <CommunityContext.Provider value={contextValue}>
      {children}
      
      {/* Connection status indicator */}
      {!isConnected && reconnectAttempts > 0 && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Đang kết nối lại... ({reconnectAttempts}/{maxReconnectAttempts})</span>
          </div>
        </div>
      )}
      
      {!isConnected && reconnectAttempts >= maxReconnectAttempts && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span>Mất kết nối</span>
            <button 
              onClick={retry}
              className="bg-white text-red-500 px-2 py-1 rounded text-sm hover:bg-gray-100"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}
    </CommunityContext.Provider>
  );
};

export const useCommunity = (): CommunityContextType => {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}; 