import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaStar, FaCheckCircle } from 'react-icons/fa';
import { IoCloseCircle } from 'react-icons/io5';
import feedbackService from '../services/feedbackService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle?: string;
  eventImage?: string;
}

// Available feedback tags
const feedbackTags = [
  { id: 'organization', label: 'Tổ chức' },
  { id: 'content', label: 'Nội dung' },
  { id: 'facilities', label: 'Cơ sở vật chất' },
  { id: 'speakers', label: 'Người thuyết trình' },
  { id: 'interaction', label: 'Tương tác' },
  { id: 'other', label: 'Khác' }
];

const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  isOpen, 
  onClose, 
  eventId,
  eventTitle = 'sự kiện',
  eventImage
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isEligible, setIsEligible] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  
  // Check eligibility on mount
  useEffect(() => {
    const checkEligibility = async () => {
      try {
        setIsChecking(true);
        const response = await feedbackService.checkFeedbackEligibility(eventId);
        
        if (response.success && response.data) {
          setIsEligible(response.data.canSubmitFeedback);
          
          if (response.data.hasSubmitted) {
            setSubmitted(true);
          }
          
          // Update event title and image if available
          if (response.data.eventData) {
            if (response.data.eventData.title) {
              eventTitle = response.data.eventData.title;
            }
            
            if (response.data.eventData.coverImage?.url) {
              eventImage = response.data.eventData.coverImage.url;
            }
          }
        } else {
          setIsEligible(false);
        }
      } catch (error) {
        console.error('Error checking feedback eligibility:', error);
        setIsEligible(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    if (isOpen && eventId) {
      checkEligibility();
    }
  }, [isOpen, eventId]);
  
  const handleRatingSelect = (value: number) => {
    setRating(value);
  };
  
  const handleTagSelect = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(tag => tag !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };
  
  const handleSubmit = async () => {
    if (rating === 0) {
      toast.warning('Vui lòng chọn số sao đánh giá');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await feedbackService.submitFeedback(eventId, {
        rating,
        content: comment,
        tags: selectedTags.length > 0 ? selectedTags : undefined
      });
      
      setSubmitted(true);
      toast.success('Cảm ơn bạn đã gửi đánh giá!');
    } catch (error: unknown) {
      console.error('Error submitting feedback:', error);
      
      // Type guard to safely access response data
      const apiError = error as { 
        response?: { 
          data?: { 
            message?: string 
          } 
        } 
      };
      
      toast.error(apiError?.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {isChecking ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang kiểm tra...</p>
          </div>
        ) : (
          <>
            {/* Header with event info */}
            <div className="relative">
              {eventImage ? (
                <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${eventImage})` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                </div>
              ) : (
                <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              )}
              
              <button 
                onClick={onClose}
                className="absolute top-2 right-2 p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/50 transition-colors"
              >
                <IoCloseCircle className="w-6 h-6 text-white" />
              </button>
              
              <div className={`px-6 pb-4 ${eventImage ? '-mt-16' : 'pt-2'}`}>
                <h2 className={`text-2xl font-bold ${eventImage ? 'text-white mb-10' : 'text-gray-800 mb-2'}`}>
                  {submitted ? 'Cảm ơn bạn đã đánh giá!' : 'Đánh giá sự kiện'}
                </h2>
                {!eventImage && (
                  <p className="text-lg font-medium text-gray-700">{eventTitle}</p>
                )}
              </div>
            </div>
            
            {/* Content based on state */}
            {submitted ? (
              <div className="px-6 pb-6 text-center">
                <div className="flex justify-center mb-4">
                  <FaCheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <p className="text-gray-700 mb-4">
                  Chúng tôi đã nhận được đánh giá của bạn về sự kiện "{eventTitle}".
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition w-full"
                >
                  Đóng
                </button>
              </div>
            ) : !isEligible ? (
              <div className="px-6 pb-6 text-center">
                <div className="flex justify-center mb-4">
                  <IoCloseCircle className="w-16 h-16 text-red-500" />
                </div>
                <p className="text-gray-700 mb-4">
                  Bạn không thể đánh giá sự kiện này. Có thể bạn chưa tham gia hoặc chưa điểm danh tại sự kiện.
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition w-full"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <div className="p-6">
                {/* Star Rating */}
                <div className="mb-6">
                  <p className="text-gray-700 mb-2 font-medium">Đánh giá của bạn về sự kiện này</p>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingSelect(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="text-3xl focus:outline-none"
                      >
                        <FaStar
                          className={`${
                            star <= (hoveredRating || rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-gray-600">
                      {rating > 0 ? `${rating}/5` : 'Chưa đánh giá'}
                    </span>
                  </div>
                </div>
                
                {/* Tags */}
                <div className="mb-6">
                  <p className="text-gray-700 mb-2 font-medium">Tag đánh giá (không bắt buộc)</p>
                  <div className="flex flex-wrap gap-2">
                    {feedbackTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagSelect(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedTags.includes(tag.id)
                            ? 'bg-blue-100 text-blue-600 border border-blue-600'
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Comment */}
                <div className="mb-6">
                  <p className="text-gray-700 mb-2 font-medium">Nhận xét (không bắt buộc)</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về sự kiện..."
                    className="w-full border border-gray-300 rounded-md p-2 h-24 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-gray-500">
                    {comment.length}/500
                  </div>
                </div>
                
                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || rating === 0}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Đang gửi...
                    </span>
                  ) : (
                    'Gửi đánh giá'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal; 