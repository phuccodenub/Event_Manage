import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import { toast } from 'react-toastify';
import FormModal from './events/FormModal';

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
}

const JoinEventButton: React.FC<JoinEventButtonProps> = ({
  eventId,
  participants,
  onJoinSuccess,
  onLeaveSuccess,
  startDate,
  endDate,
  status,
  registrationForm
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{[key: string]: string}>({});
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [registrationFields, setRegistrationFields] = useState<FormField[]>([]);

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

  const handleJoin = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để tham gia sự kiện');
      return;
    }

    try {
      // Fetch form data from API
      const response = await eventService.getEventForm(eventId);
      console.log("Registration form data:", response.data);

      if (response.data?.fields && response.data.fields.length > 0) {
        setRegistrationFields(response.data.fields); // Dynamically set fields
        setShowForm(true);
        return;
      }

      // If no form, proceed with direct join
      setIsLoading(true);
      await eventService.joinEvent(eventId);
      setHasJoined(true);
      onJoinSuccess?.();
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
      // Đổi tên key để match với model
      await eventService.joinEvent(eventId, { 
        formResponses: formData // Đổi formData thành formResponses
      });
      setHasJoined(true);
      setShowForm(false);
      onJoinSuccess?.();
      toast.success('Đăng ký tham gia sự kiện thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-block">
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

      <FormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        fields={registrationFields}
        loading={isLoading}
      />
    </div>
  );
};

export default JoinEventButton;
