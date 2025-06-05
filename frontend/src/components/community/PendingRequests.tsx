import React from 'react';
import type { Community } from '../../services/communityService';

interface PendingRequestsProps {
  community: Community;
  loading: boolean;
  onHandleRequest: (requestId: string, status: 'approved' | 'rejected') => void;
}

const PendingRequests: React.FC<PendingRequestsProps> = ({
  community,
  loading,
  onHandleRequest
}) => {
  const pendingRequests = community.pendingRequests?.filter(r => r.status === 'pending') || [];

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Yêu cầu tham gia ({pendingRequests.length})
      </h2>
      {loading && (
        <div className="mb-4 bg-blue-50 p-2 rounded text-blue-700 text-sm flex items-center">
          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang xử lý yêu cầu...
        </div>
      )}
      <div className="space-y-3">
        {pendingRequests.map(request => {
          if (!request.user) return null;
          
          return (
            <div
              key={request._id}
              className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={request.user.avatar?.url || '/default-avatar.png'}
                    alt={request.user.fullName || 'User'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {request.user.fullName || 'Người dùng không xác định'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(request.requestDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onHandleRequest(request._id, 'approved')}
                  disabled={loading}
                  className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                >
                  Duyệt
                </button>
                <button
                  onClick={() => onHandleRequest(request._id, 'rejected')}
                  disabled={loading}
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                >
                  Từ chối
                </button>
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
};

export default PendingRequests; 