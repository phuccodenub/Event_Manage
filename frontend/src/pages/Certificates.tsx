import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Certificate from '../components/Certificate';
import { IoDocumentTextOutline, IoSearchOutline, IoRibbon, IoAlertCircle } from 'react-icons/io5';
import certificateService from '../services/certificateService';
import LoadingSpinner from '../components/LoadingSpinner';

interface Department {
  _id: string;
  name: string;
}

// Define a new interface for eligible certificates
interface EligibleCertificate {
  eventId: string;
  eventName: string;
  eventDate: string;
  endDate: string;
  department?: Department;
  category: string;
  certificateType: 'participant' | 'collaborator';
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    }
  };
  message?: string;
}

const Certificates = () => {
  const { user } = useAuth();
  const [isMatched, params] = useRoute("/certificates/:userId?");
  const [loading, setLoading] = useState(true);
  const [eligibleCertificates, setEligibleCertificates] = useState<EligibleCertificate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  console.log('Route matched:', isMatched);
  console.log('Route params:', params);
  console.log('Current user:', user?._id);
  
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the target userId - either from URL or current user
        const targetUserId = params?.userId || user?._id;
        
        console.log('Target userId for certificates:', targetUserId);
        
        if (!targetUserId) {
          setError("Không tìm thấy thông tin người dùng");
          setLoading(false);
          return;
        }
        
        // Directly fetch eligible certificates using the new API
        const result = await certificateService.getUserEligibleCertificates(targetUserId);
        console.log('Eligible certificates response:', result);
        
        // Set the eligible certificates
        if (result.success && result.data) {
          setEligibleCertificates(result.data);
        } else {
          setError("Không thể lấy danh sách chứng nhận");
        }
      } catch (error: unknown) {
        console.error('Error fetching certificates:', error);
        
        // Cast error to ApiError type for type-safe access
        const apiError = error as ApiError;
        
        // Hiển thị thông báo lỗi tùy theo loại lỗi
        if (apiError?.response?.status === 404) {
          setError("Không tìm thấy người dùng hoặc sự kiện");
        } else if (apiError?.response?.status === 403) {
          setError("Bạn không có quyền xem chứng nhận của người dùng này");
        } else {
          setError("Không thể tải danh sách chứng nhận. Vui lòng thử lại sau.");
        }
        
        toast.error("Không thể tải danh sách chứng nhận");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificates();
  }, [params?.userId, user?._id]);
  
  // Filter certificates by search query
  const filteredCertificates = eligibleCertificates.filter(cert => 
    cert.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cert.department?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    cert.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Create certificate cards
  const certificateCards = filteredCertificates.map(cert => ({
    id: `${cert.eventId}-${cert.certificateType}`,
    eventId: cert.eventId,
    title: cert.eventName,
    department: cert.department,
    startDate: cert.eventDate,
    endDate: cert.endDate,
    category: cert.category,
    type: cert.certificateType
  }));
  
  // Determine if viewing own profile or someone else's
  const targetUserId = params?.userId || user?._id;
  const isOwnProfile = !params?.userId || (user && params.userId === user._id);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-orange-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">
            {isOwnProfile ? 'Chứng nhận của tôi' : 'Chứng nhận'}
          </h1>
          <p className="text-orange-100">
            {isOwnProfile 
              ? 'Quản lý và tải xuống chứng nhận tham gia sự kiện'
              : 'Xem chứng nhận tham gia sự kiện'}
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar - Only show if there are certificates and no errors */}
        {!loading && !error && eligibleCertificates.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/4 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Tìm kiếm chứng nhận..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-3 text-red-600 mb-3">
              <IoAlertCircle className="text-3xl" />
              <h2 className="text-xl font-semibold">Đã xảy ra lỗi</h2>
            </div>
            <p className="text-gray-700">{error}</p>
            <p className="mt-4 text-gray-600">
              Vui lòng thử lại sau hoặc liên hệ quản trị viên để được hỗ trợ.
            </p>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <LoadingSpinner size="md" />
        )}
        
        {/* Empty State - No certificates but no errors */}
        {!loading && !error && certificateCards.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-10 text-center">
            <div className="flex justify-center mb-4">
              <IoDocumentTextOutline className="text-6xl text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Không có chứng nhận nào</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchQuery 
                ? 'Không tìm thấy chứng nhận phù hợp với từ khóa tìm kiếm của bạn.'
                : isOwnProfile 
                  ? 'Bạn chưa có chứng nhận nào. Tham gia các sự kiện và hoàn thành chúng để nhận chứng nhận.'
                  : 'Người dùng này chưa có chứng nhận nào.'}
            </p>
          </div>
        )}
        
        {/* Certificates List */}
        {!loading && !error && certificateCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificateCards.map((card) => {
              const isParticipantCard = card.type === 'participant';
              
              return (
                <div 
                  key={card.id} 
                  className={`bg-white rounded-lg shadow-sm overflow-hidden ${isParticipantCard ? 'border-t-4 border-orange-500' : 'border-t-4 border-green-500'}`}
                >
                  {/* Certificate Header */}
                  <div className={`${isParticipantCard ? 'bg-orange-50' : 'bg-green-50'} p-4 border-b ${isParticipantCard ? 'border-orange-100' : 'border-green-100'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">{card.title}</h3>
                        <p className="text-sm text-gray-600">{card.department?.name || 'HUTECH'}</p>
                        <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${isParticipantCard ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                          {isParticipantCard ? 'Chứng nhận tham gia' : 'Chứng nhận cộng tác viên'}
                        </span>
                      </div>
                      <div className={`${isParticipantCard ? 'bg-orange-100' : 'bg-green-100'} p-2 rounded-full`}>
                        <IoRibbon className={`${isParticipantCard ? 'text-orange-600' : 'text-green-600'} text-xl`} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Certificate Body */}
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Ngày diễn ra:</span>
                        <span className="font-medium">
                          {new Date(card.startDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Danh mục:</span>
                        <span className="font-medium capitalize">{card.category}</span>
                      </div>
                    </div>
                    
                    {/* Certificate Component */}
                    {targetUserId && (
                      <Certificate 
                        eventId={card.eventId} 
                        userId={targetUserId}
                        certificateType={card.type}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates; 