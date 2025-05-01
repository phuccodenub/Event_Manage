import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import { toast } from 'react-toastify';

interface JoinEventButtonProps {
  eventId: string;
  participants: string[];
  onJoinSuccess?: () => void;
  onLeaveSuccess?: () => void;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

const JoinEventButton: React.FC<JoinEventButtonProps> = ({
  eventId,
  participants,
  onJoinSuccess,
  onLeaveSuccess,
  startDate,
  endDate,
  status
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Kiểm tra trạng thái sự kiện
  const isEventActive = useCallback(() => {
    if (status === 'cancelled') return false;
    
    const now = new Date();
    const eventStart = startDate ? new Date(startDate) : null;
    const eventEnd = endDate ? new Date(endDate) : null;

    // Nếu sự kiện đã kết thúc
    if (eventEnd && now > eventEnd) return false;
    
    // Nếu sự kiện đã bị hủy
    if (status === 'cancelled') return false;

    return true;
  }, [startDate, endDate, status]);

  // Check if user has joined when component mounts or participants change
  useEffect(() => {
    if (!user || !participants) return; // Early return if no user or participants

    const isParticipant = participants.some(
      participantId => participantId?.toString() === user?._id?.toString()
    );
    setHasJoined(isParticipant);
  }, [user, participants]);

  const handleJoin = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tham gia sự kiện');
      return;
    }

    try {
      setIsLoading(true);
      await eventService.joinEvent(eventId);
      setHasJoined(true);
      // Update UI immediately before calling onJoinSuccess
      onJoinSuccess?.();
      toast.success('Đăng ký tham gia sự kiện thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      setIsLoading(true);
      await eventService.leaveEvent(eventId);
      setHasJoined(false);
      // Update UI immediately before calling onLeaveSuccess
      onLeaveSuccess?.();
      toast.success('Đã hủy đăng ký tham gia sự kiện!');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi hủy đăng ký');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={hasJoined ? handleLeave : handleJoin}
      disabled={isLoading || !isEventActive()}
      className={`px-5 py-2 rounded-xl font-medium transition-colors ${
        !isEventActive() 
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : hasJoined
            ? 'border-2 border-orange-600 text-orange-600 hover:bg-orange-50'
            : 'bg-orange-600 text-white hover:bg-orange-700'
      } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {isLoading 
        ? 'Đang xử lý...'
        : !isEventActive()
          ? 'Đã kết thúc'
          : hasJoined 
            ? 'Hủy tham gia'
            : 'Tham gia ngay'
      }
    </button>
  );
};

export default JoinEventButton;
