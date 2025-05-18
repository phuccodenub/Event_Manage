import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import feedbackService from '../services/feedbackService';
import { FeedbackItem } from '../services/feedbackService';
import { IoClose } from 'react-icons/io5';
import { UserIcon } from '@heroicons/react/outline';

interface EventFeedbackListProps {
  eventId: string;
}

interface AvatarWithUrl {
  url?: string;
  public_id?: string;
}

const EventFeedbackList: React.FC<EventFeedbackListProps> = ({ eventId }) => {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<{
    averageRating: string;
    ratingCounts: {
      total: number;
      '5': number;
      '4': number;
      '3': number;
      '2': number;
      '1': number;
    };
    tagCounts: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const response = await feedbackService.getEventFeedback(eventId);
        
        if (response.success && response.data) {
          setFeedbackItems(response.data.feedback);
          setStats(response.data.stats);
        } else {
          setError('Không thể tải đánh giá');
        }
      } catch (error: unknown) {
        console.error('Error fetching feedback:', error);
        // Attempt to extract error message if available
        const errorResponse = error as { response?: { data?: { message?: string } } };
        const errorMessage = errorResponse?.response?.data?.message || 'Đã xảy ra lỗi khi tải đánh giá';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchFeedback();
    }
  }, [eventId]);

  // Function to handle tag filter
  const handleTagFilter = (tag: string) => {
    setActiveTagFilter(currentTag => currentTag === tag ? null : tag);
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveTagFilter(null);
  };

  // Filter feedback items based on active tag
  const filteredFeedbackItems = activeTagFilter
    ? feedbackItems.filter(item => item.tags?.includes(activeTagFilter))
    : feedbackItems;

  // Function to render star ratings
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating}/5</span>
      </div>
    );
  };

  // Function to render tags
  const renderTags = (tags?: string[]) => {
    if (!tags || tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {tags.map((tag) => (
          <span 
            key={tag} 
            className={`px-2 py-0.5 text-xs rounded-full ${
              activeTagFilter === tag 
                ? 'bg-orange-200 text-orange-800 border border-orange-300' 
                : 'bg-orange-50 text-orange-700'
            }`}
            onClick={() => handleTagFilter(tag)}
            style={{ cursor: 'pointer' }}
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Stats display
  const renderStats = () => {
    if (!stats) return null;
    
    const totalRatings = stats.ratingCounts.total;
    if (totalRatings === 0) return null;
    
    return (
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-orange-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 border-orange-100">Tổng quan đánh giá</h3>
        
        <div className="flex items-center mb-5">
          <div className="text-4xl font-bold text-orange-600 mr-3">
            {stats.averageRating}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              {renderStars(parseFloat(stats.averageRating))}
            </div>
            <span className="text-sm text-gray-500 mt-1">
              {totalRatings} đánh giá từ người tham gia
            </span>
          </div>
        </div>
        
        {/* Rating distribution */}
        <div className="space-y-2 mb-6">
          {[5, 4, 3, 2, 1].map((rating) => {
            const ratingKey = String(rating) as keyof typeof stats.ratingCounts;
            const count = stats.ratingCounts[ratingKey] || 0;
            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center">
                <div className="w-12 text-sm text-gray-600">{rating} sao</div>
                <div className="flex-1 mx-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        rating >= 4 ? 'bg-green-500' : 
                        rating === 3 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-xs text-gray-500">
                  {count} ({Math.round(percentage)}%)
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Tags summary with filter functionality */}
        {Object.keys(stats.tagCounts).length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-700">Những điểm được đề cập</h4>
              {activeTagFilter && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-orange-600 hover:text-orange-800 flex items-center"
                >
                  <IoClose className="mr-1" /> Bỏ lọc
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.tagCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([tag, count]) => (
                  <div 
                    key={tag} 
                    className={`px-3 py-1 rounded-full text-xs flex items-center border cursor-pointer transform transition hover:scale-105 ${
                      activeTagFilter === tag
                        ? 'bg-orange-200 border-orange-300 text-orange-800 font-medium shadow-sm'
                        : 'bg-orange-50 border-orange-100 text-orange-700'
                    }`}
                    onClick={() => handleTagFilter(tag)}
                  >
                    <span>{tag}</span>
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                      activeTagFilter === tag ? 'bg-orange-300 text-orange-900' : 'bg-orange-100'
                    }`}>{count}</span>
                  </div>
                ))
              }
            </div>
            {activeTagFilter && (
              <div className="mt-3 text-sm text-gray-600 italic">
                Đang hiển thị {filteredFeedbackItems.length} đánh giá có nhắc đến "{activeTagFilter}"
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
        <p className="mt-3 text-gray-600">Đang tải đánh giá...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (feedbackItems.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-gray-500">Chưa có đánh giá nào cho sự kiện này.</p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Đánh giá từ người tham gia</h2>
      
      {renderStats()}
      
      {filteredFeedbackItems.length > 0 ? (
        <div 
          className={`
            overflow-y-auto pr-2 rounded-lg 
            ${filteredFeedbackItems.length > 5 ? 'max-h-[500px]' : ''}
            custom-scrollbar
          `}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#FED7AA #F3F4F6'
          }}
        >
          <div className="space-y-5">
            {filteredFeedbackItems.map((item) => (
              <div key={item._id} className="p-5 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-orange-100 transition-colors">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {item.user.avatar?.url? (
                      <img 
                        src={item.user.avatar?.url} 
                        alt={item.user.fullName} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-orange-200"
                      />
                    ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-orange-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-6 h-6 text-gray-400" />
                        </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-900">{item.user.fullName}</h3>
                      <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
                    </div>
                    
                    <div className="mb-3">
                      {renderStars(item.rating)}
                    </div>
                    
                    {item.content && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-gray-700 whitespace-pre-line">{item.content}</p>
                      </div>
                    )}
                    
                    {renderTags(item.tags)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-orange-100">
          <p className="text-orange-700">Không có đánh giá nào liên quan đến "{activeTagFilter}"</p>
          <button 
            onClick={clearFilters}
            className="mt-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 text-sm font-medium"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

export default EventFeedbackList; 