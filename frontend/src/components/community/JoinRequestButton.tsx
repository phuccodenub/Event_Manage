import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import communityService from '../../services/communityService';

interface JoinRequestButtonProps {
  communityId: string;
  isMember: boolean;
  hasPendingRequest: boolean;
  onRequestSent: () => void;
}

const JoinRequestButton: React.FC<JoinRequestButtonProps> = ({
  communityId,
  isMember,
  hasPendingRequest,
  onRequestSent,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleJoinRequest = async () => {
    if (!user) {
      // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
      window.location.href = `/login?redirect=/communities/${communityId}`;
      return;
    }

    setErrorMessage(null);
    try {
      setIsLoading(true);
      await communityService.requestToJoin(communityId);
      onRequestSent();
    } catch (error: any) {
      console.error('Lỗi khi gửi yêu cầu tham gia:', error);
      setErrorMessage(
        error.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelJoinRequest = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu tham gia cộng đồng này không?')) {
      return;
    }

    setErrorMessage(null);
    try {
      setIsLoading(true);
      await communityService.cancelJoinRequest(communityId);
      onRequestSent();
    } catch (error: any) {
      console.error('Lỗi khi hủy yêu cầu tham gia:', error);
      setErrorMessage(
        error.message || 'Có lỗi xảy ra khi hủy yêu cầu. Vui lòng thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isMember) {
    return (
      <button
        disabled
        className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium"
      >
        Đã là thành viên
      </button>
    );
  }

  if (hasPendingRequest) {
    return (
      <div className="flex flex-col items-end">
        <button
          onClick={handleCancelJoinRequest}
          disabled={isLoading}
          className={`bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-4 py-2 rounded-lg font-medium transition-colors
            ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          title="Bấm để hủy yêu cầu tham gia"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-800"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Đang xử lý...
            </span>
          ) : (
            'Đang chờ duyệt'
          )}
        </button>
        {errorMessage && (
          <div className="mt-2 text-red-600 text-sm">{errorMessage}</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleJoinRequest}
        disabled={isLoading}
        className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors
          ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Đang xử lý...
          </span>
        ) : (
          'Tham gia cộng đồng'
        )}
      </button>
      {errorMessage && (
        <div className="mt-2 text-red-600 text-sm">{errorMessage}</div>
      )}
    </div>
  );
};

export default JoinRequestButton;