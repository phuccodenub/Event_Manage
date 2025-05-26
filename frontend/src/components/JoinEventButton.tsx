import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications, getSocketStatus } from '../context/NotificationContext';
import eventService from '../services/eventService';
import { toast } from 'react-toastify';
import FormModal from './events/FormModal';
import { IoPersonAddOutline, IoPersonRemoveOutline } from 'react-icons/io5';

interface FormField {
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface JoinEventButtonProps {
  eventId: string;
  participants: string[];
  onJoinSuccess?: () => void;
  onLeaveSuccess?: () => void;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  registrationForm?: {
    fields: FormField[];
  };
  isCompact?: boolean;
  creatorId?: string;
  organizerId?: string;
  eventDays?: Array<{
    date: string;
    sessions: Array<{
      type: string;
      startTime: string;
      endTime: string;
      label: string;
    }>;
  }>;
  eventTitle?: string;
}

const JoinEventButton: React.FC<JoinEventButtonProps> = ({
  eventId,
  participants,
  onJoinSuccess,
  onLeaveSuccess,
  startDate,
  endDate,
  status,
  registrationForm,
  isCompact,
  creatorId,
  organizerId,
  eventDays,
  eventTitle,
}) => {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{[key: string]: string}>({});
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [registrationFields, setRegistrationFields] = useState<FormField[]>([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  const isCreator = user?._id === creatorId;
  const isOrganizer = user?._id === organizerId;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const showCompact = isCompact !== undefined 
    ? isCompact 
    : windowWidth < 640;

  const isEventActive = useCallback(() => {
    if (status === 'cancelled') return false;
    
    const now = new Date();
    const eventStart = startDate ? new Date(startDate) : null;
    const eventEnd = endDate ? new Date(endDate) : null;

    if (eventEnd && now > eventEnd) return false;
    if (status === 'cancelled') return false;

    return true;
  }, [startDate, endDate, status]);

  useEffect(() => {
    if (!user || !participants) return;

    const isParticipant = participants.some(
      participantId => participantId?.toString() === user?._id?.toString()
    );
    setHasJoined(isParticipant);
  }, [user, participants]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    if (formErrors[fieldId]) {
      setFormErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    registrationForm?.fields.forEach(field => {
      if (field.required && !formData[field.fieldId]) {
        errors[field.fieldId] = `${field.label} là bắt buộc`;
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateNotifications = async () => {
    try {
      // Check socket status
      getSocketStatus();
      
      // Give the backend time to create notifications
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try fetching notifications multiple times with delay between attempts
      for (let attempt = 0; attempt < 3; attempt++) {
        await fetchNotifications();
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tham gia sự kiện');
      return;
    }

    try {
      const response = await eventService.getEventForm(eventId);
      console.log("Registration form data:", response.data);

      if (response.data?.fields && response.data.fields.length > 0) {
        setRegistrationFields(response.data.fields);
        setShowForm(true);
        return;
      }

      setIsLoading(true);
      await eventService.joinEvent(eventId);
      setHasJoined(true);
      onJoinSuccess?.();
      
      await updateNotifications();
      
      toast.success('Đăng ký tham gia sự kiện thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      setIsLoading(true);
      await eventService.leaveEvent(eventId);
      setHasJoined(false);
      onLeaveSuccess?.();
      
      await updateNotifications();
      
      toast.success('Đã hủy đăng ký tham gia sự kiện!');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi hủy đăng ký');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      setIsLoading(true);
      await eventService.joinEvent(eventId, { 
        formResponses: formData
      });
      setHasJoined(true);
      setShowForm(false);
      onJoinSuccess?.();
      
      await updateNotifications();
      
      toast.success('Đăng ký tham gia sự kiện thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || isCreator || isOrganizer) {
    return null;
  }

  const tooltipText = hasJoined ? 'Hủy tham gia' : 'Tham gia ngay';

  return (
    <div className="inline-block relative group">
      <button
        onClick={hasJoined ? handleLeave : handleJoin}
        disabled={isLoading || !isEventActive()}
        title={tooltipText}
        aria-label={tooltipText}
        className={`transition-colors ${
          showCompact 
            ? `p-2 rounded-full flex items-center justify-center ${
                !isEventActive() 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : hasJoined
                    ? 'border-2 border-orange-600 text-orange-600 hover:bg-orange-50'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
              }`
            : `px-5 py-2 rounded-xl font-medium ${
                !isEventActive() 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : hasJoined
                    ? 'border-2 border-orange-600 text-orange-600 hover:bg-orange-50'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
              }`
        } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {showCompact ? (
          isLoading ? (
            <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          ) : !isEventActive() ? (
            <span className="text-sm">✕</span>
          ) : hasJoined ? (
            <IoPersonRemoveOutline className="h-5 w-5" />
          ) : (
            <IoPersonAddOutline className="h-5 w-5" />
          )
        ) : (
          isLoading 
            ? 'Đang xử lý...'
            : !isEventActive()
              ? 'Đã kết thúc'
              : hasJoined 
                ? 'Hủy tham gia'
                : 'Tham gia ngay'
        )}
      </button>

      {showCompact && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
          {tooltipText}
        </div>
      )}

      <FormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        fields={registrationFields}
        loading={isLoading}
        eventDays={eventDays}
        eventTitle={eventTitle}
      />
    </div>
  );
};

export default JoinEventButton;
