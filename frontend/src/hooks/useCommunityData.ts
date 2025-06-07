import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import communityService from '../services/communityService';
import type { Community } from '../services/communityService';
import { Event } from '../types';

const isValidMongoId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const useCommunityData = (id: string | undefined) => {
  const { user } = useAuth();
  const { updateCommunityJoinState, isUserPendingInCommunity, isUserMemberOfCommunity } = useCommunity();
  const [community, setCommunity] = useState<Community | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdminOrTeacher = user && ['admin', 'teacher'].includes(user.role);

  useEffect(() => {
    if (id && isValidMongoId(id)) {
      loadCommunityDetails();
      loadCommunityEvents();
    } else if (id && !isValidMongoId(id)) {
      setError('ID cộng đồng không hợp lệ');
      setIsLoading(false);
    }
  }, [id]);

  const loadCommunityDetails = async () => {
    if (!id) return;
    
    try {
      setError(null);
      const data = await communityService.getCommunityDetails(id);
      setCommunity(data);
    } catch (error: any) {
      setError(error.message || 'Không thể tải thông tin cộng đồng. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommunityEvents = async () => {
    if (!id) return;
    
    try {
      setEventsLoading(true);
      const eventsData = await communityService.getCommunityEvents(id);
      setEvents(eventsData);
    } catch (error: any) {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  // Specialized function for join requests
  const sendJoinRequest = async (): Promise<boolean> => {
    if (!id || !user) return false;
    
    try {
      setProcessingRequest(true);
      setError(null);
      
      const userId = user.id || user._id || '';
      
      // Update context state optimistically FIRST
      updateCommunityJoinState(id, userId, 'join');
      
      // Then make API call
      await communityService.requestToJoin(id);
      
      // Silently refresh the actual data in background
      setTimeout(() => loadCommunityDetails(), 1000);
      
      return true;
    } catch (error: any) {
      // Revert optimistic update on error
      if (user) {
        const userId = user.id || user._id || '';
        updateCommunityJoinState(id, userId, 'cancel');
      }
      setError(error.message || 'Không thể gửi yêu cầu tham gia. Vui lòng thử lại sau.');
      return false;
    } finally {
      setProcessingRequest(false);
    }
  };

  // Function to cancel join request
  const cancelJoinRequest = async (): Promise<boolean> => {
    if (!id || !user) return false;
    
    try {
      setProcessingRequest(true);
      setError(null);
      
      const userId = user.id || user._id || '';
      
      // Update context state optimistically FIRST
      updateCommunityJoinState(id, userId, 'cancel');
      
      // Then make API call
      await communityService.cancelJoinRequest(id);
      
      // Silently refresh the actual data in background
      setTimeout(() => loadCommunityDetails(), 1000);
      
      return true;
    } catch (error: any) {
      // Revert optimistic update on error
      if (user) {
        const userId = user.id || user._id || '';
        updateCommunityJoinState(id, userId, 'join');
      }
      setError(error.message || 'Không thể hủy yêu cầu tham gia. Vui lòng thử lại sau.');
      return false;
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleJoinRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingRequest(true);
      await communityService.handleJoinRequest(requestId, status);
      await loadCommunityDetails(); // Tải lại thông tin sau khi xử lý yêu cầu
    } catch (error: any) {
      setError(error.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.');
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community) return;
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa cộng đồng "${community.name}"?`)) {
      try {
        setIsLoading(true);
        await communityService.deleteCommunity(community._id);
        return true; // Indicate successful deletion
      } catch (error: any) {
        setError(error.message || 'Không thể xóa cộng đồng. Vui lòng thử lại sau.');
        setIsLoading(false);
        return false;
      }
    }
    return false;
  };

  // Calculate permissions and user states
  const userId = user?.id || user?._id;
  
  const leader = community?.leader || (community?.createdBy ? {
    _id: community.createdBy,
    fullName: 'Quản trị viên',
    avatar: { url: '/default-avatar.png' }
  } : null);
  
  const members = community?.members || [];
  const isMember = Boolean(user && members.some(member => {
    if (typeof member.user === 'string') {
      return member.user === userId;
    }
    return member.user && member.user._id === userId;
  }));
  
  // Use context state for real-time updates
  const hasPendingRequest = id ? isUserPendingInCommunity(id) : false;
  const isActiveMember = id ? isUserMemberOfCommunity(id) : false;
  
  const isLeader = leader && leader._id === userId;
  const isDeputy = community?.deputies?.some(deputy => deputy._id === userId) || false;
  const canManage = isLeader || isDeputy || isAdminOrTeacher;

  return {
    // Data
    community,
    events,
    leader,
    members,
    
    // States - use context state for real-time updates
    isLoading,
    eventsLoading,
    processingRequest,
    error,
    isMember: isActiveMember || isMember, // Fallback to local state
    hasPendingRequest,
    
    // Permissions
    isLeader,
    isDeputy,
    canManage,
    isAdminOrTeacher,
    
    // Actions
    sendJoinRequest,
    cancelJoinRequest,
    handleJoinRequest,
    handleDeleteCommunity,
    loadCommunityDetails,
    loadCommunityEvents,
    setError
  };
};