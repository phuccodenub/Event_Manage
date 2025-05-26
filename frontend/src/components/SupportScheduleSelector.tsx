import React, { useState } from 'react';
import { PlusIcon, XIcon, ClockIcon, CalendarIcon } from '@heroicons/react/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Session {
  type: 'morning' | 'afternoon' | 'evening' | 'custom';
  startTime: string;
  endTime: string;
  label: string;
}

interface SupportDay {
  date: Date;
  sessions: Session[];
}

interface Props {
  supportDays: SupportDay[];
  onChange: (supportDays: SupportDay[]) => void;
}

const SESSION_PRESETS = {
  morning: { startTime: '07:00', endTime: '11:30', label: 'Buổi Sáng' },
  afternoon: { startTime: '12:00', endTime: '16:30', label: 'Buổi Chiều' },
  evening: { startTime: '16:00', endTime: '20:30', label: 'Buổi Tối' }
};

const SupportScheduleSelector: React.FC<Props> = ({ supportDays, onChange }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const addSupportDay = () => {
    if (!selectedDate) return;
    
    // Check if date already exists
    const existingDay = supportDays.find(day => 
      day.date.toDateString() === selectedDate.toDateString()
    );
    
    if (existingDay) {
      alert('Ngày này đã được thêm');
      return;
    }

    const newDay: SupportDay = {
      date: selectedDate,
      sessions: []
    };

    onChange([...supportDays, newDay]);
    setSelectedDate(null);
  };

  const removeSupportDay = (index: number) => {
    const newSupportDays = supportDays.filter((_, i) => i !== index);
    onChange(newSupportDays);
  };

  const addSession = (dayIndex: number, sessionType: 'morning' | 'afternoon' | 'evening' | 'custom') => {
    const newSupportDays = [...supportDays];
    
    if (sessionType === 'custom') {
      const newSession: Session = {
        type: 'custom',
        startTime: '08:00',
        endTime: '18:00',
        label: 'Ca tự chọn'
      };
      newSupportDays[dayIndex].sessions.push(newSession);
    } else {
      const preset = SESSION_PRESETS[sessionType];
      const newSession: Session = {
        type: sessionType,
        startTime: preset.startTime,
        endTime: preset.endTime,
        label: preset.label
      };
      newSupportDays[dayIndex].sessions.push(newSession);
    }
    
    onChange(newSupportDays);
  };

  const removeSession = (dayIndex: number, sessionIndex: number) => {
    const newSupportDays = [...supportDays];
    newSupportDays[dayIndex].sessions.splice(sessionIndex, 1);
    onChange(newSupportDays);
  };

  const updateSession = (dayIndex: number, sessionIndex: number, field: keyof Session, value: string) => {
    const newSupportDays = [...supportDays];
    newSupportDays[dayIndex].sessions[sessionIndex] = {
      ...newSupportDays[dayIndex].sessions[sessionIndex],
      [field]: value
    };
    onChange(newSupportDays);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lịch hỗ trợ cần thiết
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Chọn các ngày và ca làm việc mà bạn cần cộng tác viên hỗ trợ
        </p>
        
        {/* Add new day */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              placeholderText="Chọn ngày cần hỗ trợ"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <button
            type="button"
            onClick={addSupportDay}
            disabled={!selectedDate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Thêm ngày
          </button>
        </div>

        {/* Support days list */}
        <div className="space-y-4">
          {supportDays.map((day, dayIndex) => (
            <div key={dayIndex} className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-green-600" />
                  {formatDate(day.date)}
                </h3>
                <button
                  type="button"
                  onClick={() => removeSupportDay(dayIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Sessions */}
              <div className="space-y-3">
                {day.sessions.map((session, sessionIndex) => (
                  <div key={sessionIndex} className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-sm">Ca {sessionIndex + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSession(dayIndex, sessionIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Tên ca
                        </label>
                        <input
                          type="text"
                          value={session.label}
                          onChange={(e) => updateSession(dayIndex, sessionIndex, 'label', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                          placeholder="Tên ca làm việc"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Giờ bắt đầu
                        </label>
                        <input
                          type="time"
                          value={session.startTime}
                          onChange={(e) => updateSession(dayIndex, sessionIndex, 'startTime', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Giờ kết thúc
                        </label>
                        <input
                          type="time"
                          value={session.endTime}
                          onChange={(e) => updateSession(dayIndex, sessionIndex, 'endTime', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add session buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addSession(dayIndex, 'morning')}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 border border-yellow-300"
                  >
                    + Ca Sáng
                  </button>
                  <button
                    type="button"
                    onClick={() => addSession(dayIndex, 'afternoon')}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 border border-blue-300"
                  >
                    + Ca Chiều
                  </button>
                  <button
                    type="button"
                    onClick={() => addSession(dayIndex, 'evening')}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 border border-purple-300"
                  >
                    + Ca Tối
                  </button>
                  <button
                    type="button"
                    onClick={() => addSession(dayIndex, 'custom')}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 border border-gray-300"
                  >
                    + Tự chọn
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {supportDays.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>Chưa có ngày hỗ trợ nào</p>
            <p className="text-sm">Thêm ngày và ca làm việc cần cộng tác viên hỗ trợ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportScheduleSelector; 