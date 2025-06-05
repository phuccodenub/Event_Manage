import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

interface CommunityProviderProps {
  children: ReactNode;
}

export const CommunityProvider: React.FC<CommunityProviderProps> = ({ children }) => {
  const [joinStates, setJoinStates] = useState<CommunityJoinState>({});
  const [activities, setActivities] = useState<CommunityActivity[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<OnlineMemberStatus>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const maxReconnectAttempts = 5;

  const initializeSocket = useCallback(() => {
    try {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
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
        setJoinStates(prev => ({
          ...prev,
          [data.communityId]: data.status
        }));

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
        setJoinStates(prev => ({
          ...prev,
          [data.communityId]: 'none'
        }));
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
    if (socket) {
      socket.close();
    }
    setTimeout(() => {
      initializeSocket();
    }, 1000);
  }, [socket, initializeSocket]);

  const contextValue: CommunityContextType = {
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