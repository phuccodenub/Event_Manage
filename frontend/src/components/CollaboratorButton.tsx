import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications, getSocketStatus } from '../context/NotificationContext';
import eventService from '../services/eventService';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import CollaboratorScheduleModal from './modals/CollaboratorScheduleModal';

interface CollaboratorButtonProps {
  eventId: string;
  eventTitle: string;
  collaborators: string[];
  onJoinSuccess?: () => void;
  onLeaveSuccess?: () => void;
  startDate?: Date | string;
  endDate?: Date | string;
  setupTime?: {
    start: Date | string;
    end: Date | string;
  };
  status?: string;
}

const CollaboratorButton: React.FC<CollaboratorButtonProps> = ({
  eventId,
  eventTitle,
  collaborators,
  onJoinSuccess,
  onLeaveSuccess,
  startDate,
  endDate,
  setupTime,
  status,
}) => {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const isEventActive = useCallback(() => {
    if (status === 'cancelled') return false;
    
    const now = new Date();
    const eventEnd = endDate ? new Date(endDate) : null;

    if (eventEnd && now > eventEnd) return false;
    if (status === 'cancelled') return false;

    return true;
  }, [startDate, endDate, status]);

  useEffect(() => {
    if (!user || !collaborators) return;

    const isUserCollaborator = collaborators.some(
      collaboratorId => collaboratorId?.toString() === user?._id?.toString()
    );
    setIsCollaborator(isUserCollaborator);
  }, [user, collaborators]);

  const updateNotifications = async () => {
    try {
      const socketStatus = getSocketStatus();
      console.log('Socket status:', socketStatus);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
  };

  const handleJoin = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng ký làm CTV');
      return;
    }

    // Nếu không có thông tin setupTime, hiển thị thông báo lỗi
    if (!setupTime || !setupTime.start || !setupTime.end) {
      toast.error('Không có thông tin thời gian setup cho sự kiện này');
      return;
    }

    // Mở modal để chọn lịch làm việc
    setShowScheduleModal(true);
  };

  const handleLeave = async () => {
    try {
      setIsLoading(true);
      await eventService.leaveEventAsCollaborator(eventId);
      setIsCollaborator(false);
      onLeaveSuccess?.();
      
      await updateNotifications();
      
      toast.success('Đã hủy đăng ký làm CTV!');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Có lỗi xảy ra khi hủy đăng ký làm CTV'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleSubmitSuccess = () => {
    setIsCollaborator(true);
    onJoinSuccess?.();
    updateNotifications();
  };

  return (
    <>
      <div className="inline-block">
        <button
          onClick={isCollaborator ? handleLeave : handleJoin}
          disabled={isLoading || !isEventActive()}
          className={`px-5 py-2 rounded-xl font-medium transition-colors ${
            !isEventActive() 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : isCollaborator
                ? 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                : 'bg-blue-600 text-white hover:bg-blue-700'
          } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading 
            ? 'Đang xử lý...'
            : !isEventActive()
              ? 'Sự kiện kết thúc'
              : isCollaborator 
                ? 'Hủy đăng ký CTV'
                : 'Đăng ký làm CTV'
          }
        </button>
      </div>

      {setupTime && (
        <CollaboratorScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          eventId={eventId}
          eventTitle={eventTitle}
          setupTime={setupTime}
          onSuccess={handleScheduleSubmitSuccess}
        />
      )}
    </>
  );
};

export default CollaboratorButton; 