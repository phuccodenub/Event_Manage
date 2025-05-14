import React, { useState, useEffect } from 'react';
import { IoDownload, IoCheckmarkCircle, IoWarning, IoClose, IoCheckmark } from 'react-icons/io5';
import certificateService from '../services/certificateService';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

interface CertificateProps {
  eventId: string;
  userId: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
      status?: number;
    };
    status?: number;
  };
  message?: string;
}

interface VerificationResult {
  eventName: string;
  eventDate: string;
  canGenerateCertificate: boolean;
  conditions?: {
    eventEnded: boolean;
    isRegistered: boolean;
    hasCheckedIn: boolean;
  };
}

const Certificate: React.FC<CertificateProps> = ({ eventId, userId }) => {
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventInfo, setEventInfo] = useState<VerificationResult | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        setLoading(true);
        console.log(`Checking certificate eligibility for event: ${eventId}, user: ${userId}`);
        
        const result = await certificateService.verifyCertificateEligibility(eventId, userId);
        console.log('Certificate eligibility result:', result);
        
        setEligible(result.success && result.data.canGenerateCertificate);
        setEventInfo(result.data);
      } catch (error: unknown) {
        console.error('Certificate eligibility error:', error);
        const apiError = error as ApiError;
        
        // Handle specific status codes
        if (apiError.response?.status === 404) {
          setError('Không tìm thấy sự kiện hoặc người dùng');
        } else if (apiError.response?.status === 403) {
          setError('Không có quyền truy cập chứng nhận này');
        } else {
          setError(apiError.response?.data?.message || apiError.message || 'Không thể kiểm tra điều kiện nhận chứng nhận');
        }
        
        setEligible(false);
      } finally {
        setLoading(false);
      }
    };

    // Only check if we have both eventId and userId
    if (eventId && userId) {
      checkEligibility();
    } else {
      setLoading(false);
      setError('Thiếu thông tin cần thiết để kiểm tra chứng nhận');
    }
  }, [eventId, userId]);

  const handleDownloadCertificate = () => {
    if (!eligible) return;

    try {
      // Get certificate URL
      const certificateUrl = certificateService.getCertificateUrl(eventId, userId);
      
      // Open the URL in a new tab to trigger download
      window.open(certificateUrl, '_blank');
      
      toast.success('Đang tải chứng nhận');
    } catch (error) {
      console.error('Download certificate error:', error);
      toast.error('Không thể tải chứng nhận');
    }
  };

  // Determine if viewing someone else's certificate
  const viewingOtherCertificate = user?._id !== userId;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/4 mt-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow-sm p-6 text-red-600">
        <div className="flex items-center gap-2 mb-2">
          <IoWarning className="text-xl" />
          <h3 className="font-medium">Không thể kiểm tra chứng nhận</h3>
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!eligible && eventInfo?.conditions) {
    return (
      <div className="bg-gray-50 rounded-lg shadow-sm p-6">
        <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
          <IoWarning className="text-yellow-500" />
          Chưa đủ điều kiện nhận chứng nhận
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {viewingOtherCertificate 
            ? 'Người dùng này chưa đủ điều kiện nhận chứng nhận từ sự kiện này.'
            : 'Bạn chưa đủ điều kiện nhận chứng nhận từ sự kiện này.'}
        </p>

        {/* Danh sách điều kiện chi tiết */}
        <ul className="text-sm text-gray-700 space-y-2 mb-3 border-t border-gray-200 pt-3">
          <li className="flex items-center">
            {eventInfo.conditions.eventEnded ? 
              <IoCheckmark className="text-green-500 mr-2" /> : 
              <IoClose className="text-red-500 mr-2" />
            }
            <span>Sự kiện đã kết thúc</span>
          </li>
          <li className="flex items-center">
            {eventInfo.conditions.isRegistered ? 
              <IoCheckmark className="text-green-500 mr-2" /> : 
              <IoClose className="text-red-500 mr-2" />
            }
            <span>Đã đăng ký tham gia sự kiện</span>
          </li>
          <li className="flex items-center">
            {eventInfo.conditions.hasCheckedIn ? 
              <IoCheckmark className="text-green-500 mr-2" /> : 
              <IoClose className="text-red-500 mr-2" />
            }
            <span>Đã check-in tại sự kiện</span>
          </li>
        </ul>

        <p className="text-xs text-gray-500">
          Bạn cần đáp ứng tất cả các điều kiện trên để nhận chứng nhận.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-3">
        <IoCheckmarkCircle className="text-green-500 text-xl" />
        <h3 className="font-medium text-gray-800">
          {viewingOtherCertificate
            ? 'Người dùng đủ điều kiện nhận chứng nhận'
            : 'Bạn đủ điều kiện nhận chứng nhận'}
        </h3>
      </div>
      
      {eventInfo && (
        <div className="text-sm text-gray-600 mb-4">
          <p>Sự kiện: <span className="font-medium">{eventInfo.eventName}</span></p>
          <p>Ngày: {new Date(eventInfo.eventDate).toLocaleDateString('vi-VN')}</p>
        </div>
      )}

      <div className="mt-3 relative">
        <div className="relative border-2 border-dashed border-orange-200 rounded-lg p-4 bg-orange-50 hover:bg-orange-100 transition-colors">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <img
                src="/icons/certificate.svg"
                alt="Certificate"
                className="w-12 h-12 text-orange-500"
              />
            </div>
            <h4 className="font-semibold text-gray-700 mb-1">Chứng nhận tham gia sự kiện</h4>
            <p className="text-xs text-gray-500 mb-3">Xác nhận đã tham gia sự kiện này.</p>
            
            <button
              onClick={handleDownloadCertificate}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <IoDownload className="mr-2" />
              {viewingOtherCertificate ? 'Tải chứng nhận' : 'Tải chứng nhận của bạn'}
            </button>
            
            <p className="text-xs text-gray-500 mt-3">
              Chứng nhận có thể được tải xuống và chia sẻ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate; 