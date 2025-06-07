import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { IoPersonAdd, IoSettings, IoTrash, IoLocationOutline, IoCalendarOutline, IoPeopleOutline, IoTimeOutline, IoCloseOutline } from 'react-icons/io5';
import type { Community } from '../../services/communityService';

interface Leader {
  _id: string;
  fullName: string;
  avatar?: { url: string };
}

interface Member {
  _id?: string;
  user?: string | {
    _id: string;
    fullName: string;
    avatar?: { url: string };
  };
  status: string;
  joinedAt: string;
  role?: string;
  department?: string;
  position?: string;
}

interface CommunityHeaderProps {
  community: Community;
  leader: Leader | null;
  members: Member[];
  isMember: boolean;
  hasPendingRequest: boolean;
  isLeader: boolean;
  isDeputy: boolean;
  canManage: boolean;
  onJoinRequestSent: () => Promise<boolean>;
  onCancelJoinRequest: () => Promise<boolean>;
  onEditCommunity: () => void;
  onDeleteCommunity: () => void;
}

const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  community,
  leader,
  members,
  isMember,
  hasPendingRequest: propHasPendingRequest, // Rename prop to avoid conflict
  isLeader,
  isDeputy,
  canManage,
  onJoinRequestSent,
  onCancelJoinRequest,
  onEditCommunity,
  onDeleteCommunity
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { isUserPendingInCommunity, isUserMemberOfCommunity } = useCommunity();
  
  // Use context state for real-time updates
  const hasPendingRequest = isUserPendingInCommunity(community._id);
  const isActiveMember = isUserMemberOfCommunity(community._id);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleJoinRequest = async () => {
    setIsProcessing(true);
    try {
      await onJoinRequestSent();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRequest = async () => {
    setIsProcessing(true);
    try {
      await onCancelJoinRequest();
    } finally {
      setIsProcessing(false);
    }
  };

  // Use context state with fallback to props
  const finalIsMember = isActiveMember || isMember;
  const finalHasPendingRequest = hasPendingRequest || propHasPendingRequest;

  return (
    <div className="bg-white shadow-sm border-b">
      {/* Banner Image */}
      {community.banner && (
        <div className="h-48 sm:h-64 relative overflow-hidden">
          <img
            src={community.banner.url}
            alt={`${community.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Community Avatar and Basic Info */}
          <div className="flex items-start gap-4">
            {community.avatar && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                <img
                  src={community.avatar.url}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {community.name}
              </h1>
              
              {community.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {community.description}
                </p>
              )}

              {/* Community Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <IoPeopleOutline className="w-4 h-4" />
                  <span>{members.length} thành viên</span>
                </div>
                
                {community.description && (
                  <div className="flex items-center gap-1">
                    <IoLocationOutline className="w-4 h-4" />
                    <span>Mô tả: {community.description}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <IoCalendarOutline className="w-4 h-4" />
                  <span>Tạo ngày {community.createdAt ? formatDate(community.createdAt) : 'Không xác định'}</span>
                </div>
              </div>

              {/* Leader Info */}
              {leader && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Quản lý bởi:</span>
                  <div className="flex items-center gap-2">
                    {leader.avatar && (
                      <img
                        src={leader.avatar.url}
                        alt={leader.fullName}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {leader.fullName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 lg:flex-col lg:w-auto lg:min-w-[200px]">
            {!finalIsMember && !finalHasPendingRequest && (
              <button
                onClick={handleJoinRequest}
                disabled={isProcessing}
                className="w-full sm:w-auto lg:w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoPersonAdd className="w-4 h-4" />
                {isProcessing ? 'Đang xử lý...' : 'Tham gia cộng đồng'}
              </button>
            )}

            {finalHasPendingRequest && (
              <button
                onClick={handleCancelRequest}
                disabled={isProcessing}
                className="w-full sm:w-auto lg:w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoCloseOutline className="w-4 h-4" />
                {isProcessing ? 'Đang hủy...' : 'Hủy yêu cầu'}
              </button>
            )}

            {finalIsMember && !canManage && (
              <div className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm text-center">
                Đã tham gia
              </div>
            )}

            {canManage && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={onEditCommunity}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <IoSettings className="w-4 h-4" />
                  Chỉnh sửa
                </button>

                <button
                  onClick={onDeleteCommunity}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <IoTrash className="w-4 h-4" />
                  Xóa cộng đồng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityHeader; 