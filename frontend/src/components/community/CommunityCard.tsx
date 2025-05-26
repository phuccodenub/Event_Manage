import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import type { Community } from '../../services/communityService';
import communityService from '../../services/communityService';
import { IoEllipsisHorizontal, IoPeople } from 'react-icons/io5';

interface CommunityCardProps {
  community: Pick<Community, '_id' | 'name' | 'description' | 'leader' | 'members' | 'avatar' | 'banner'>;
  isAdminOrTeacher?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ community, isAdminOrTeacher, onDelete, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Cải thiện useEffect logging để xem rõ hơn vấn đề
  useEffect(() => {
    if (community.banner) {
      console.log('Banner URL:', community.banner.url);
    } else {
      console.log('Community has no banner');
    }
  }, [community]);
  
  // Hàm đơn giản hóa chỉ trả về URL gốc hoặc URL ảnh
  const getBannerUrl = () => {
    if (!community.banner?.url) return '';
    
    // Xử lý trực tiếp URL Cloudinary (không cần proxy)
    return community.banner.url;
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cộng đồng "${community.name}"?`)) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await communityService.deleteCommunity(community._id);
      if (onDelete) onDelete();
    } catch (error: any) {
      console.error('Lỗi khi xóa cộng đồng:', error);
      alert(error.message || 'Không thể xóa cộng đồng. Vui lòng thử lại sau.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) onEdit();
  };

  const toggleActions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const truncateDescription = (text: string, maxLength: number = 80) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <Link 
      to={`/community/${community._id}`}
      className="block"
    >
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
        {/* Banner với height cố định */}
        <div className="relative w-full h-36 overflow-hidden bg-gray-200">
          {community.banner?.url ? (
            <img 
              src={getBannerUrl()} 
              alt={`${community.name} banner`}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log('Banner load error');
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Tránh vòng lặp vô hạn
                // Set style để hiển thị banner dự phòng
                target.style.display = 'none';
                // Hiển thị banner dự phòng (container cha đã có bg-gray-200)
                target.parentElement!.classList.add('bg-gradient-to-r', 'from-orange-500', 'to-orange-600', 'flex', 'items-center', 'justify-center');
                const textElement = document.createElement('span');
                textElement.className = 'text-white text-opacity-80 text-xl font-bold';
                textElement.textContent = 'HUTECH';
                target.parentElement!.appendChild(textElement);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
              <span className="text-white text-opacity-80 text-xl font-bold">HUTECH</span>
          </div>
          )}
        </div>
        
        {/* Content Section with Avatar */}
        <div className="p-4 mt-2">
          <div className="flex">
            {/* Avatar (Square) */}
            <div className="mr-3 flex-shrink-0">
              <div className="w-16 h-16 rounded-md border-2 border-white shadow-sm overflow-hidden bg-white">
            <img
                  src={community.avatar?.url || '/default-community.png'}
                  alt={community.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/default-community.png';
                  }}
                />
              </div>
            </div>

            {/* Community Info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg text-gray-800 truncate">{community.name}</h3>
                
                {/* Admin Actions */}
                {isAdminOrTeacher && (
                  <div className="relative ml-2">
                    <button
                      onClick={toggleActions}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    >
                      <IoEllipsisHorizontal />
                    </button>
                    
                    {showActions && (
                      <div className="absolute right-0 mt-1 bg-white shadow-lg rounded-md z-10 border border-gray-200">
                        <button
                          onClick={handleEdit}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                        >
                          {isDeleting ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <p className="mt-1 text-gray-600 text-sm line-clamp-2">
                {truncateDescription(community.description)}
              </p>
            </div>
          </div>

          {/* Member Count */}
          <div className="mt-4 flex items-center text-gray-500">
            <div className="flex items-center bg-gray-100 px-2 py-1 rounded-md">
              <IoPeople className="mr-1 h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">
                {community.members?.length || 0} thành viên
              </span>
            </div>
            <span className="ml-auto text-orange-500 text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">Xem chi tiết →</span>
          </div>
          </div>
        </div>
      </Link>
  );
};

export default CommunityCard;