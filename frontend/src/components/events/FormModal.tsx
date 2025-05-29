import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XIcon, CalendarIcon, ClockIcon } from '@heroicons/react/outline';
import { useAutoFillUserData } from '../../hooks/useAutoFillUserData';

interface FormField {
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface EventDay {
  date: string;
  sessions: Array<{
    type: string;
    startTime: string;
    endTime: string;
    label: string;
  }>;
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  fields: FormField[];
  loading: boolean;
  eventDays?: EventDay[];
  eventTitle?: string;
}

const FormModal: React.FC<FormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  fields, 
  loading,
  eventDays = [],
  eventTitle = ''
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSessions, setSelectedSessions] = useState<Array<{date: string, session: string}>>([]);

  // Merge default fields with custom fields, avoiding duplicates
  const allFormFields = React.useMemo(() => {
    const defaultFields = [
      { fieldId: 'fullName', label: 'Họ và tên', type: 'text', required: true },
      { fieldId: 'studentId', label: 'MSSV', type: 'text', required: true },
      { fieldId: 'email', label: 'Email', type: 'email', required: true }
    ];

    const mergedFields = [...defaultFields];
    fields.forEach(field => {
      if (!mergedFields.find(f => f.fieldId === field.fieldId)) {
        mergedFields.push(field);
      }
    });
    
    return mergedFields;
  }, [fields]);

  // Auto-fill user data hook
  const { isUserDataAvailable, availableFields } = useAutoFillUserData({
    formFields: allFormFields,
    setFormData,
    formData
  });

  useEffect(() => {
    if (isOpen) {
      // Initialize form data with default values
      const initialData: Record<string, any> = {};
      
      allFormFields.forEach(field => {
        if (field.type === 'checkbox') {
          initialData[field.fieldId] = [];
        } else {
          initialData[field.fieldId] = '';
        }
      });

      setFormData(initialData);
      setErrors({});
      setSelectedSessions([]);
    }
  }, [isOpen, allFormFields]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  };

  const handleSessionToggle = (date: string, sessionType: string) => {
    setSelectedSessions(prev => {
      const existingIndex = prev.findIndex(s => s.date === date && s.session === sessionType);
      if (existingIndex >= 0) {
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        return [...prev, { date, session: sessionType }];
      }
    });
  };

  const isSessionSelected = (date: string, sessionType: string) => {
    return selectedSessions.some(s => s.date === date && s.session === sessionType);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate default fields
    allFormFields.forEach(field => {
      if (field.required && !formData[field.fieldId]) {
        newErrors[field.fieldId] = `${field.label} là bắt buộc`;
      }
    });

    // Validate custom fields
    fields.forEach(field => {
      if (field.required && !formData[field.fieldId]) {
        newErrors[field.fieldId] = `${field.label} là bắt buộc`;
      }
    });

    // Validate session selection if eventDays exist
    if (eventDays.length > 0 && selectedSessions.length === 0) {
      newErrors.sessions = 'Vui lòng chọn ít nhất một buổi tham gia';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submissionData = {
      ...formData,
      selectedSessions: selectedSessions
    };

    onSubmit(submissionData);
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
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
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
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            required={field.required}
          >
            <option value="">Chọn {field.label}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option.value}>{option.label}</option>
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
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
                  className="mr-2"
                  required={field.required}
                />
                {option.label}
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
                  value={option.value}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleInputChange(field.fieldId, [...currentValues, option.value]);
                    } else {
                      handleInputChange(field.fieldId, currentValues.filter(v => v !== option.value));
                    }
                  }}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
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
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Đăng ký tham gia sự kiện
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              {eventTitle && (
                <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-medium text-orange-900">{eventTitle}</h3>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Default Required Fields */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Thông tin cá nhân</h3>
                    {isUserDataAvailable && availableFields.length > 0 && (
                      <div className="flex items-center text-sm text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Đã tự động điền {availableFields.length} trường
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên <span className="text-red-500">*</span>
                      {availableFields.includes('fullName') && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Tự động
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.fullName || ''}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Nhập họ và tên"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MSSV <span className="text-red-500">*</span>
                      {availableFields.includes('studentId') && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Tự động
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.studentId || ''}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                      placeholder="Nhập mã số sinh viên"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                    {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                      {availableFields.includes('email') && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Tự động
                        </span>
                      )}
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Nhập email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                </div>

                {/* Custom Fields */}
                {fields.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Thông tin bổ sung</h3>
                    {fields.map((field) => (
                      <div key={field.fieldId}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderFormField(field)}
                        {errors[field.fieldId] && (
                          <p className="mt-1 text-sm text-red-600">{errors[field.fieldId]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Event Sessions Selection */}
                {eventDays.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Chọn buổi tham gia</h3>
                    <p className="text-sm text-gray-600">Vui lòng chọn buổi bạn muốn tham gia sự kiện</p>
                    
                    {eventDays.map((day, dayIndex) => (
                      <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {formatDate(day.date)}
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {day.sessions.map((session, sessionIndex) => {
                            const isSelected = isSessionSelected(day.date, session.type);
                            
                            return (
                              <button
                                key={sessionIndex}
                                type="button"
                                onClick={() => handleSessionToggle(day.date, session.type)}
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
                    
                    {errors.sessions && (
                      <p className="text-sm text-red-600">{errors.sessions}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
                    disabled={loading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? 'Đang đăng ký...' : 'Đăng ký tham gia'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default FormModal;
