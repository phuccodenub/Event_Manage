import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { RiTimeLine, RiUserLine, RiCalendarEventLine } from 'react-icons/ri';
import { CollaboratorWithStatus } from '../types';
import { getSafeAvatarUrl } from '../utils/avatarUtils';

interface CollaboratorScheduleDisplayProps {
  collaborator: CollaboratorWithStatus;
  showUserInfo?: boolean;
  className?: string;
}

const CollaboratorScheduleDisplay: React.FC<CollaboratorScheduleDisplayProps> = ({
  collaborator,
  showUserInfo = true,
  className = ''
}) => {
  if (!collaborator.workingSchedule) {
    return <div className="text-sm text-gray-500 italic">Không có thông tin lịch làm việc</div>;
  }
  // Helper function to get user information safely
  const getUserInfo = () => {
    if (typeof collaborator.user === 'string') {
      return { _id: collaborator.user, fullName: 'Cộng tác viên', avatar: undefined };
    }
    return collaborator.user;
  };
  const userInfo = getUserInfo();
  // Handle avatar that might be a simple URL string or object
  const avatarUrl = getSafeAvatarUrl(userInfo.avatar);

  const startDate = new Date(collaborator.workingSchedule.start);
  const endDate = new Date(collaborator.workingSchedule.end);

  // Kiểm tra nếu cùng ngày
  const isSameDay = startDate.toDateString() === endDate.toDateString();

  // Format date strings based on whether it's the same day
  const startDateStr = format(startDate, 'HH:mm - EEEE, dd/MM/yyyy', { locale: vi });
  const endDateStr = isSameDay 
    ? format(endDate, 'HH:mm', { locale: vi })
    : format(endDate, 'HH:mm - EEEE, dd/MM/yyyy', { locale: vi });

  // Calculate duration
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  const durationText = durationHours > 0
    ? `${durationHours} giờ${durationMinutes > 0 ? ` ${durationMinutes} phút` : ''}`
    : `${durationMinutes} phút`;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>      {showUserInfo && userInfo && (
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={userInfo.fullName || 'User'} 
                className="h-full w-full object-cover"
              />
            ) : (
              <RiUserLine className="h-6 w-6 text-gray-500" />
            )}
          </div>
          <div>
            <div className="font-medium">{userInfo.fullName || 'Cộng tác viên'}</div>
            <div className={`text-sm ${
              collaborator.status === 'approved' 
                ? 'text-green-600' 
                : collaborator.status === 'pending' 
                  ? 'text-amber-600' 
                  : 'text-red-600'
            }`}>
              {collaborator.status === 'approved' 
                ? 'Đã duyệt' 
                : collaborator.status === 'pending' 
                  ? 'Đang chờ duyệt' 
                  : 'Đã từ chối'}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <RiCalendarEventLine className="mt-0.5 text-gray-500 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-gray-700">Thời gian làm việc:</div>
            <div className="text-sm">
              <span className="font-medium">{startDateStr}</span>
              {isSameDay ? ' đến ' : <br />}
              <span className="font-medium">{endDateStr}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <RiTimeLine className="text-gray-500 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium">{durationText}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorScheduleDisplay; 