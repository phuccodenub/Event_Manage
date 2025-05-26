import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'wouter';
import type { Community } from '../../services/communityService';
import communityService from '../../services/communityService';
import { 
  IoPeopleOutline,
  IoCalendarOutline,
  IoEyeOutline,
  IoPersonAddOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline
} from 'react-icons/io5';

interface CommunityCardProps {
  community: Community;
  onUpdate?: () => void;
  onDelete?: (id: string) => void;
  onJoinRequest?: (id: string) => void;
  onEdit?: (community: Community) => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ 
  community, 
  onUpdate, 
  onDelete, 
  onJoinRequest,
  onEdit 
}) => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user && user.role === 'admin';
  const isTeacher = user && user.role === 'teacher';
  const userId = user?.id || user?._id;
  
  // Xử lý leader
  const leader = community.leader || (community.createdBy ? {
    _id: community.createdBy,
    fullName: 'Quản trị viên',
    avatar: { url: '/default-avatar.png' }
  } : null);
  
  const isLeader = user && leader && userId === leader._id;
  const isDeputy = user && community.deputies?.some(deputy => deputy._id === userId);
  
  const canManage = isAdmin || isTeacher || isLeader || isDeputy;
  const canDelete = isAdmin || isLeader;

  // Xử lý members với cấu trúc data thực
  const members = community.members || [];
  const isMember = user && members.some(member => {
    if (typeof member.user === 'string') {
      return member.user === userId;
    }
    return member.user && member.user._id === userId;
  });

  const hasPendingRequest = user && community.pendingRequests?.some(
    request => request.user && request.user._id === userId && request.status === 'pending'
  );

  // Xử lý isActive
  const isActive = community.isActive !== undefined ? community.isActive : 
    (community.status !== 'pending');

  const handleViewDetails = () => {
    navigate(`/community/${community._id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(community);
    } else {
      navigate(`/community/${community._id}/edit`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Bạn có chắc chắn muốn xóa cộng đồng này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await communityService.deleteCommunity(community._id);
      if (onDelete) {
        onDelete(community._id);
      }
    } catch (error: any) {
      console.error('Error deleting community:', error);
      setError(error.message || 'Có lỗi xảy ra khi xóa cộng đồng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await communityService.requestToJoin(community._id);
      if (onJoinRequest) {
        onJoinRequest(community._id);
      }
    } catch (error: any) {
      console.error('Error requesting to join:', error);
      setError(error.message || 'Có lỗi xảy ra khi gửi yêu cầu tham gia');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Chưa xác định';
    
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Chưa xác định';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group" onClick={handleViewDetails}>
      {/* Banner với Avatar và Management Buttons */}
      <div className="h-32 bg-gradient-to-br from-orange-400 to-orange-600 relative overflow-hidden">
        {community.banner?.url && community.banner.url !== '/default-banner.png' ? (
          <img 
            src={community.banner.url} 
            alt={`${community.name} banner`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600" />
        )}
        
        {/* Management Buttons */}
        {canManage && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
              title="Chỉnh sửa"
            >
              <IoPencilOutline className="text-orange-600 text-sm" />
            </button>
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                title="Xóa cộng đồng"
                disabled={isLoading}
              >
                <IoTrashOutline className="text-red-500 text-sm" />
              </button>
            )}
          </div>
        )}



        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-500 text-white'
          }`}>
            {isActive ? 'Hoạt động' : 'Tạm dừng'}
          </div>
        </div>
      </div>

      {/* Community Info */}
      <div className="p-4">
        {/* Avatar and Content */}
        <div className="flex gap-4 mb-3">
          {/* Avatar */}
          <div className="w-16 h-16 flex-shrink-0">
            <div className="w-full h-full rounded-xl bg-white border shadow-sm overflow-hidden">
              {community.avatar?.url && community.avatar.url !== '/default-community.png' ? (
                <img 
                  src={community.avatar.url} 
                  alt={community.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/default-community.png';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-xl">
                    {community.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">{community.name}</h3>
            <p className="text-sm text-gray-600 mb-2">
              Trưởng nhóm: {leader?.fullName || 'Chưa có'}
            </p>
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
              {community.description}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <IoPeopleOutline className="text-orange-500" />
            <span>{members.length} thành viên</span>
          </div>
          <div className="flex items-center gap-1">
            <IoCalendarOutline className="text-orange-500" />
            <span>{Array.isArray(community.events) ? community.events.length : 0} sự kiện</span>
          </div>
        </div>

        {/* Pending Requests (for leaders) */}
        {(isLeader || isDeputy || isAdmin) && community.pendingRequests && community.pendingRequests.length > 0 && (
          <div className="mb-3 p-2 bg-orange-50 rounded-lg border-l-4 border-orange-400">
            <p className="text-sm text-orange-700 flex items-center">
              <IoPersonAddOutline className="mr-1" />
              {community.pendingRequests.length} yêu cầu chờ duyệt
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 px-3 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
          >
            <IoEyeOutline />
            Xem chi tiết
          </button>

          {/* Join/Status Button */}
          {user && !isMember && !hasPendingRequest && (
            <button
              onClick={handleJoinRequest}
              disabled={isLoading || !isActive}
              className="px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <IoPersonAddOutline />
              {isLoading ? 'Đang xử lý...' : 'Tham gia'}
            </button>
          )}

          {hasPendingRequest && (
            <div className="px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg text-sm font-medium flex items-center gap-1">
              <IoTimeOutline />
              Chờ duyệt
            </div>
          )}

          {isMember && (
            <div className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium flex items-center gap-1">
              <IoCheckmarkCircleOutline />
              Đã tham gia
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityCard;