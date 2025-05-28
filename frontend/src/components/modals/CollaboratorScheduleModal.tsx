import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XIcon, ClockIcon, CalendarIcon, UserIcon } from '@heroicons/react/outline';
import { motion } from 'framer-motion';
import eventService from '../../services/eventService';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

interface SupportShift {
  date: string;
  session: string;
}

interface SupportDay {
  date: string;
  sessions: Array<{
    type: string;
    startTime: string;
    endTime: string;
    label: string;
  }>;
}

interface FormField {
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  setupTime?: {
    supportDays?: Array<{
      date: string | Date;
      sessions: Array<{
        type: string;
        startTime: string;
        endTime: string;
        label: string;
      }>;
    }>;
  };
  onSuccess: () => void;
}

const SESSION_INFO = {
  morning: { label: 'Buổi Sáng', time: '7:30 - 11:15', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  afternoon: { label: 'Buổi Chiều', time: '12:30 - 16:15', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  evening: { label: 'Buổi Tối', time: '16:30 - 20:15', color: 'bg-purple-100 text-purple-800 border-purple-300' }
};

const CollaboratorScheduleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  setupTime,
  onSuccess
}) => {
  const { user } = useAuth();
  const [selectedShifts, setSelectedShifts] = useState<SupportShift[]>([]);
  const [availableDays, setAvailableDays] = useState<SupportDay[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Schedule

  // Auto-fill user data when form fields change
  useEffect(() => {
    if (formFields.length > 0) {
      const initialFormData: Record<string, any> = {};
      formFields.forEach((field: FormField) => {
        if (field.type === 'checkbox') {
          initialFormData[field.fieldId] = [];
        } else {
          // Auto-fill user data if available
          if (user) {
            switch (field.fieldId) {
              case 'fullName':
                initialFormData[field.fieldId] = user.fullName || '';
                break;
              case 'email':
                initialFormData[field.fieldId] = user.email || '';
                break;              case 'studentId':
                initialFormData[field.fieldId] = user.userId || '';
                break;
              case 'phone':
                initialFormData[field.fieldId] = user.phone || '';
                break;
              case 'department':
                initialFormData[field.fieldId] = user.department || '';
                break;
              case 'class':
                initialFormData[field.fieldId] = user.class || '';
                break;
              default:
                initialFormData[field.fieldId] = '';
            }
          } else {
            initialFormData[field.fieldId] = '';
          }
        }
      });
      setFormData(initialFormData);
    }
  }, [formFields, user]);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchCollaboratorForm();
    }
  }, [isOpen, eventId]);

  useEffect(() => {
    // Set available days from setupTime prop
    if (setupTime?.supportDays) {
      console.log('Setting available days from setupTime:', setupTime.supportDays);
      setAvailableDays(setupTime.supportDays.map(day => ({
        date: typeof day.date === 'string' ? day.date : day.date.toISOString(),
        sessions: day.sessions
      })));
    } else {
      console.log('No setupTime.supportDays found:', setupTime);
      setAvailableDays([]);
    }
  }, [setupTime]);

  const fetchCollaboratorForm = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventCollaboratorForm(eventId);
      
      if (response && response.success) {
        const fields = response.data?.fields || [];
        setFormFields(fields);
        
        // Remove manual initialization - auto-fill will be handled by useEffect
        
        // If no setupTime from props, try to get from API response
        if (!setupTime?.supportDays && response.data?.setupTime?.supportDays) {
          console.log('Setting available days from API response:', response.data.setupTime.supportDays);
          setAvailableDays(response.data.setupTime.supportDays.map((day: any) => ({
            date: typeof day.date === 'string' ? day.date : day.date,
            sessions: day.sessions
          })));
        }
      } else {
        console.warn('Invalid response from getEventCollaboratorForm:', response);
        toast.error('Dữ liệu form không hợp lệ');
      }
    } catch (error: any) {
      console.error('Error fetching collaborator form:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        toast.error('Không tìm thấy form đăng ký CTV cho sự kiện này');
      } else if (error.response?.status === 500) {
        toast.error('Lỗi server khi tải form đăng ký CTV');
      } else if (error.response?.status === 403) {
        toast.error('Bạn không có quyền truy cập form đăng ký CTV');
      } else {
        toast.error(error.message || 'Không thể tải form đăng ký CTV');
      }
      
      // Fallback: Sử dụng form mặc định khi không thể kết nối server
      setFormFields([
        {
          fieldId: 'fullName',
          label: 'Họ và tên',
          type: 'text',
          required: true,
          placeholder: 'Nhập họ và tên'
        },
        {
          fieldId: 'studentId',
          label: 'Mã số sinh viên',
          type: 'text',
          required: true,
          placeholder: 'Nhập mã số sinh viên'
        },
        {
          fieldId: 'phone',
          label: 'Số điện thoại',
          type: 'tel',
          required: true,
          placeholder: 'Nhập số điện thoại'
        },
        {
          fieldId: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          placeholder: 'Nhập email'
        }
      ]);
      
      // Don't initialize form data here - let the useEffect handle auto-fill
    } finally {
      setLoading(false);
    }
  };

  const handleFormDataChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleShiftToggle = (date: string, session: string) => {
    const existingIndex = selectedShifts.findIndex(
      shift => shift.date === date && shift.session === session
    );

    if (existingIndex >= 0) {
      // Remove shift
      setSelectedShifts(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // Add shift
      setSelectedShifts(prev => [...prev, { date, session }]);
    }
  };

  const isShiftSelected = (date: string, session: string) => {
    return selectedShifts.some(shift => shift.date === date && shift.session === session);
  };

  const validateForm = () => {
    for (const field of formFields) {
      if (field.required && !formData[field.fieldId]) {
        toast.error(`Vui lòng điền ${field.label}`);
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateForm()) return;
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    if (selectedShifts.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ca hỗ trợ');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for submission
      const submissionData = { 
        selectedShifts: selectedShifts.map(shift => ({
          date: shift.date,
          session: shift.session
        })),
        formData 
      };

      console.log('Submitting collaborator registration:', submissionData);
      
      await eventService.joinEventAsCollaborator(eventId, submissionData);
      toast.success('Đăng ký làm cộng tác viên thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error joining as collaborator:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký làm cộng tác viên');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderFormField = (field: FormField) => {
    const value = formData[field.fieldId] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleFormDataChange(field.fieldId, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFormDataChange(field.fieldId, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFormDataChange(field.fieldId, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            required={field.required}
          >
            <option value="">Chọn {field.label}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={field.fieldId}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFormDataChange(field.fieldId, e.target.value)}
                  className="mr-2"
                  required={field.required}
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleFormDataChange(field.fieldId, [...currentValues, option]);
                    } else {
                      handleFormDataChange(field.fieldId, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFormDataChange(field.fieldId, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            required={field.required}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel 
              as={motion.div}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="w-full max-w-2xl transform rounded-xl bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Đăng ký làm cộng tác viên
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentStep === 1 ? 'Điền thông tin cá nhân' : 'Chọn ca hỗ trợ'} cho sự kiện "{eventTitle}"
                  </p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Progress indicator */}
              <div className="mb-6">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep >= 2 ? 'bg-orange-600' : 'bg-gray-200'
                  }`} />
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className={currentStep >= 1 ? 'text-orange-600' : 'text-gray-500'}>
                    Thông tin cá nhân
                  </span>
                  <span className={currentStep >= 2 ? 'text-orange-600' : 'text-gray-500'}>
                    Chọn ca hỗ trợ
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Thông tin cá nhân</h3>
                    {formFields.map((field) => (
                      <div key={field.fieldId}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderFormField(field)}
                      </div>
                    ))}
                  </div>
                )}

                {currentStep === 2 && (
                  <>
                    {availableDays.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          Chưa có ca hỗ trợ nào
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Người tổ chức chưa thiết lập lịch hỗ trợ cho sự kiện này.
                        </p>
                        <p className="mt-2 text-xs text-orange-600">
                          Debug: setupTime = {JSON.stringify(setupTime)}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {availableDays.map((day, dayIndex) => (
                            <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
                              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {formatDate(day.date)}
                              </h3>
                              
                              <div className="grid grid-cols-1 gap-3">
                                {day.sessions.map((session, sessionIndex) => {
                                  const isSelected = isShiftSelected(day.date, session.type);
                                  
                                  return (
                                    <button
                                      key={sessionIndex}
                                      type="button"
                                      onClick={() => handleShiftToggle(day.date, session.type)}
                                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                                        isSelected
                                          ? 'border-orange-500 bg-orange-50'
                                          : 'border-gray-200 hover:border-gray-300 bg-white'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            {session.label}
                                          </div>
                                          <div className="text-sm text-gray-600 flex items-center mt-1">
                                            <ClockIcon className="h-4 w-4 mr-1" />
                                            {session.startTime} - {session.endTime}
                                          </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                          isSelected 
                                            ? 'border-orange-500 bg-orange-500' 
                                            : 'border-gray-300'
                                        }`}>
                                          {isSelected && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {selectedShifts.length > 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <h4 className="font-medium text-orange-900 mb-2">
                              Ca đã chọn ({selectedShifts.length})
                            </h4>
                            <div className="space-y-2">
                              {selectedShifts.map((shift, index) => {
                                const day = availableDays.find(d => d.date === shift.date);
                                const session = day?.sessions.find(s => s.type === shift.session);
                                
                                return (
                                  <div key={index} className="flex items-center justify-between text-sm">
                                    <span className="text-orange-800">
                                      {formatDate(shift.date)} - {session?.label}
                                    </span>
                                    <button
                                      onClick={() => handleShiftToggle(shift.date, shift.session)}
                                      className="text-orange-600 hover:text-orange-800"
                                    >
                                      <XIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="pt-6 border-t mt-6 flex justify-between">
                <div>
                  {currentStep === 2 && (
                    <button
                      onClick={handlePrevStep}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
                    >
                      Quay lại
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
                  >
                    Hủy
                  </button>
                  
                  {currentStep === 1 ? (
                    <button
                      onClick={handleNextStep}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                    >
                      Tiếp theo
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading || selectedShifts.length === 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Đang đăng ký...' : `Đăng ký (${selectedShifts.length} ca)`}
                    </button>
                  )}
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CollaboratorScheduleModal; 