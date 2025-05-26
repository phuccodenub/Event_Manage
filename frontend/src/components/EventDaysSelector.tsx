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

interface EventDay {
  date: Date;
  sessions: Session[];
}

interface Props {
  eventDays: EventDay[];
  onChange: (eventDays: EventDay[]) => void;
}

const SESSION_PRESETS = {
  morning: { startTime: '07:30', endTime: '11:15', label: 'Buổi Sáng' },
  afternoon: { startTime: '12:30', endTime: '16:15', label: 'Buổi Chiều' },
  evening: { startTime: '16:30', endTime: '20:15', label: 'Buổi Tối' }
};

const EventDaysSelector: React.FC<Props> = ({ eventDays, onChange }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const addEventDay = () => {
    if (!selectedDate) return;
    
    // Check if date already exists
    const existingDay = eventDays.find(day => 
      day.date.toDateString() === selectedDate.toDateString()
    );
    
    if (existingDay) {
      alert('Ngày này đã được thêm');
      return;
    }

    const newDay: EventDay = {
      date: selectedDate,
      sessions: []
    };

    onChange([...eventDays, newDay]);
    setSelectedDate(null);
  };

  const removeEventDay = (index: number) => {
    const newEventDays = eventDays.filter((_, i) => i !== index);
    onChange(newEventDays);
  };

  const addSession = (dayIndex: number, sessionType: 'morning' | 'afternoon' | 'evening' | 'custom') => {
    const newEventDays = [...eventDays];
    
    if (sessionType === 'custom') {
      const newSession: Session = {
        type: 'custom',
        startTime: '09:00',
        endTime: '17:00',
        label: 'Buổi tự chọn'
      };
      newEventDays[dayIndex].sessions.push(newSession);
    } else {
      const preset = SESSION_PRESETS[sessionType];
      const newSession: Session = {
        type: sessionType,
        startTime: preset.startTime,
        endTime: preset.endTime,
        label: preset.label
      };
      newEventDays[dayIndex].sessions.push(newSession);
    }
    
    onChange(newEventDays);
  };

  const removeSession = (dayIndex: number, sessionIndex: number) => {
    const newEventDays = [...eventDays];
    newEventDays[dayIndex].sessions.splice(sessionIndex, 1);
    onChange(newEventDays);
  };

  const updateSession = (dayIndex: number, sessionIndex: number, field: keyof Session, value: string) => {
    const newEventDays = [...eventDays];
    newEventDays[dayIndex].sessions[sessionIndex] = {
      ...newEventDays[dayIndex].sessions[sessionIndex],
      [field]: value
    };
    onChange(newEventDays);
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
          Ngày và buổi diễn ra sự kiện <span className="text-red-500">*</span>
        </label>
        
        {/* Add new day */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              placeholderText="Chọn ngày"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <button
            type="button"
            onClick={addEventDay}
            disabled={!selectedDate}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Thêm ngày
          </button>
        </div>

        {/* Event days list */}
        <div className="space-y-4">
          {eventDays.map((day, dayIndex) => (
            <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {formatDate(day.date)}
                </h3>
                <button
                  type="button"
                  onClick={() => removeEventDay(dayIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Sessions */}
              <div className="space-y-3">
                {day.sessions.map((session, sessionIndex) => (
                  <div key={sessionIndex} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-sm">Buổi {sessionIndex + 1}</span>
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
                          Tên buổi
                        </label>
                        <input
                          type="text"
                          value={session.label}
                          onChange={(e) => updateSession(dayIndex, sessionIndex, 'label', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          placeholder="Tên buổi"
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
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200"
                  >
                    + Buổi Sáng
                  </button>
                  <button
                    type="button"
                    onClick={() => addSession(dayIndex, 'afternoon')}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                  >
                    + Buổi Chiều
                  </button>
                  <button
                    type="button"
                    onClick={() => addSession(dayIndex, 'evening')}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200"
                  >
                    + Buổi Tối
                  </button>
                  <button
                    type="button"
                    onClick={() => addSession(dayIndex, 'custom')}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200"
                  >
                    + Tự chọn
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {eventDays.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>Chưa có ngày nào được thêm</p>
            <p className="text-sm">Chọn ngày và bấm "Thêm ngày" để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDaysSelector; 