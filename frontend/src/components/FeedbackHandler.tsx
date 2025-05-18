import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import feedbackService from '../services/feedbackService';
import FeedbackModal from './FeedbackModal';
import { toast } from 'react-toastify';

/**
 * Component that handles displaying feedback modal automatically when:
 * 1. User opens the app and has pending feedback for completed events
 * 2. User receives a feedback notification
 * 3. User is directed via URL parameter
 */
const FeedbackHandler: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();
  
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [eventId, setEventId] = useState<string>('');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventImage, setEventImage] = useState<string>('');
  const [checkedForPendingFeedback, setCheckedForPendingFeedback] = useState<boolean>(false);
  // Use useRef instead of useState for tracking displayed events to avoid re-renders
  const displayedEventIdsRef = useRef<Set<string>>(new Set());
  // Processing flag to prevent concurrent operations
  const isProcessingRef = useRef<boolean>(false);

  // Check for pending feedback on initial load
  useEffect(() => {
    if (user && !checkedForPendingFeedback && !isProcessingRef.current) {
      checkForPendingFeedback();
    }
  }, [user, checkedForPendingFeedback]);
  
  // Check for feedback request in URL params
  useEffect(() => {
    if (user && location.search && !isProcessingRef.current) {
      const queryParams = new URLSearchParams(location.search);
      const shouldShowFeedback = queryParams.get('feedback') === 'true';
      
      if (shouldShowFeedback) {
        // Extract eventId from the pathname
        const pathParts = location.pathname.split('/');
        const possibleEventId = pathParts[pathParts.indexOf('events') + 1];
        
        if (possibleEventId && !displayedEventIdsRef.current.has(possibleEventId)) {
          setEventId(possibleEventId);
          checkAndShowFeedbackModal(possibleEventId);
          
          // Remove feedback param from URL without page reload
          queryParams.delete('feedback');
          navigate({
            pathname: location.pathname,
            search: queryParams.toString() ? `?${queryParams.toString()}` : ''
          }, { replace: true });
        }
      }
    }
  }, [location, user, navigate]);

  // Listen for feedback notifications
  useEffect(() => {
    if (!notifications || notifications.length === 0 || isProcessingRef.current || showFeedbackModal) return;

    // Find the most recent unread feedback request notification
    const feedbackNotification = notifications.find(
      n => (n.type as string) === 'event_feedback_request' && !n.read && n.relatedId
    );

    if (feedbackNotification && feedbackNotification.relatedId && 
        !displayedEventIdsRef.current.has(feedbackNotification.relatedId.toString())) {
      console.log('Detected feedback request notification:', feedbackNotification);
      
      // Set processing flag
      isProcessingRef.current = true;
      
      // Check if user can submit feedback
      checkAndShowFeedbackModal(feedbackNotification.relatedId.toString())
        .then(() => {
          // Mark notification as read
          return markAsRead(feedbackNotification._id);
        })
        .catch(err => {
          console.error('Error processing feedback notification:', err);
        })
        .finally(() => {
          // Clear processing flag
          isProcessingRef.current = false;
        });
    }
  }, [notifications, markAsRead, showFeedbackModal]);

  // Check for pending feedback events (events the user has attended but not yet provided feedback)
  const checkForPendingFeedback = async () => {
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    try {
      const response = await feedbackService.getPendingFeedbackEvents();
      setCheckedForPendingFeedback(true);
      
      if (response.success && response.data && response.data.length > 0) {
        // Get the most recent event
        const mostRecentEvent = response.data.sort((a, b) => 
          new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
        )[0];
        
        const eventIdStr = mostRecentEvent._id.toString();
        
        // Don't show if we've already displayed this event in this session
        if (displayedEventIdsRef.current.has(eventIdStr)) {
          isProcessingRef.current = false;
          return;
        }
        
        // Show feedback modal for most recent event
        setEventId(eventIdStr);
        setEventTitle(mostRecentEvent.title);
        if (mostRecentEvent.coverImage?.url) {
          setEventImage(mostRecentEvent.coverImage.url);
        }
        
        // Double-check eligibility before showing
        await checkAndShowFeedbackModal(eventIdStr, false);
      }
    } catch (error) {
      console.error('Error checking for pending feedback:', error);
    } finally {
      isProcessingRef.current = false;
    }
  };

  // Check eligibility and show feedback modal
  const checkAndShowFeedbackModal = useCallback(async (id: string, showToast = true) => {
    if (displayedEventIdsRef.current.has(id)) return;
    
    try {
      const response = await feedbackService.checkFeedbackEligibility(id);
      
      if (response.success && response.data) {
        if (response.data.canSubmitFeedback) {
          setEventId(id);
          if (response.data.eventData) {
            setEventTitle(response.data.eventData.title || '');
            if (response.data.eventData.coverImage?.url) {
              setEventImage(response.data.eventData.coverImage.url);
            }
          }
          
          // Add to displayed events to prevent showing again this session
          displayedEventIdsRef.current.add(id);
          
          // Show the modal
          setShowFeedbackModal(true);
        } else if (showToast) {
          // Show reason for not being able to submit feedback
          const reasons: Record<string, string> = {
            'ALREADY_SUBMITTED': 'Bạn đã gửi đánh giá cho sự kiện này',
            'EVENT_NOT_ENDED': 'Sự kiện chưa kết thúc',
            'NOT_CHECKED_IN': 'Bạn chưa điểm danh tham gia sự kiện'
          };
          
          const reason = response.data.reason 
            ? reasons[response.data.reason] || 'Không thể gửi đánh giá'
            : 'Không thể gửi đánh giá';
            
          toast.warning(reason);
        }
      }
    } catch (error) {
      console.error('Error checking feedback eligibility:', error);
    }
  }, []);

  // Handle closing the modal
  const handleClose = () => {
    setShowFeedbackModal(false);
  };

  return (
    <>
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={handleClose}
          eventId={eventId}
          eventTitle={eventTitle}
          eventImage={eventImage}
        />
      )}
    </>
  );
};

export default FeedbackHandler; 