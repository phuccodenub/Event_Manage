import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import Header from '@/components/Header';
import checkinService from '@/services/checkinService';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventContext';
import NotFound from './NotFound';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-toastify';
import CheckinSpreadsheet from '@/components/Modal/CheckinSpreadsheet';
import { createPortal } from 'react-dom';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Checkin {
  _id: string;
  studentId: string;
  checkinTime: string;
  checkinMethod: 'qr' | 'manual';
  type: 'participant' | 'collaborator';
  user: {
    fullName: string;
  };
}

type CheckinType = 'participant' | 'collaborator';

// Modal xác nhận xóa điểm danh
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isProcessing: boolean;
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({ 
  isOpen, onClose, onConfirm, title, message, isProcessing 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-trash mr-2"></i>
                Xác nhận xóa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Thêm component Menu Dropdown sử dụng Portal
const MenuDropdown = ({ 
  isOpen, 
  onClose, 
  position,
  onDeleteCheckin,
  onDeleteAllCheckins
}) => {
  if (!isOpen) return null;
  
  return createPortal(
    <div 
      className="fixed inset-0 z-50" 
      onClick={onClose}
    >
      <div 
        className="absolute bg-white rounded-md shadow-lg border border-gray-200 w-64 py-1"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onDeleteCheckin}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Xóa điểm danh này
        </button>
        <button
          onClick={onDeleteAllCheckins}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Xóa tất cả điểm danh của SV
        </button>
      </div>
    </div>,
    document.body
  );
};

const EventCheckin = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { events, fetchEventById } = useEvents();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [scanMode, setScanMode] = useState<'qr' | 'manual'>('manual');
  const [studentId, setStudentId] = useState('');
  const [html5Qrcode, setHtml5Qrcode] = useState<Html5Qrcode | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState<Array<any>>([]);
  const [activeTab, setActiveTab] = useState<CheckinType>('participant');
  const [checkinType, setCheckinType] = useState<CheckinType>('participant');
  const [filteredCheckins, setFilteredCheckins] = useState<Checkin[]>([]);
  const [filterType, setFilterType] = useState<CheckinType | 'all'>('all');
  
  // State cho modal xóa
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [checkinToDelete, setCheckinToDelete] = useState<Checkin | null>(null);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deleteAllProcessing, setDeleteAllProcessing] = useState(false);
  const [studentToDeleteAll, setStudentToDeleteAll] = useState<string | null>(null);
  
  // State cho dropdown menu
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Đóng menu khi click ra ngoài - không cần nữa vì Portal sẽ xử lý

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (event: any) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'ended';
    return 'ongoing';
  };

  const isEventActive = (event: any) => {
    if (!event) return false;

    // Cho phép điểm danh nếu sự kiện đang diễn ra
    if (event.status === 'ongoing') return true;

    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    // Cho phép điểm danh từ 30 phút trước giờ bắt đầu
    const checkinStartTime = new Date(startDate.getTime() - 30 * 60000);
    
    // Và cho đến khi kết thúc sự kiện
    return now >= checkinStartTime && now <= endDate;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tìm event trong context trước
        const foundEvent = events.find(e => e._id === id);
        
        if (foundEvent) {
          console.log('Found event in context:', foundEvent);
          setEvent(foundEvent);
        } else {
          // Nếu không có trong context, fetch từ API
          console.log('Fetching event from API...');
          const eventData = await fetchEventById(id || '');
          console.log('API response:', eventData);
          if (eventData) {
            setEvent(eventData);
          }
        }

        if (id) {
          const checkinsResult = await checkinService.getEventCheckins(id);
          if (checkinsResult.success) {
            setCheckins(checkinsResult.data);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, events, fetchEventById]);

  // Filter checkins whenever checkins or filterType changes
  useEffect(() => {
    if (filterType === 'all') {
      setFilteredCheckins(checkins);
    } else {
      setFilteredCheckins(checkins.filter(checkin => checkin.type === filterType));
    }
  }, [checkins, filterType]);

  useEffect(() => {
    let qrScanner: Html5Qrcode | null = null;

    const initializeScanner = async () => {
      if (scanMode === 'qr' && qrRef.current) {
        try {
          qrScanner = new Html5Qrcode('qr-reader');
          
          const devices = await Html5Qrcode.getCameras();
          console.log('Available cameras:', devices);

          // Filter out virtual cameras and find real camera
          const realCamera = devices.find(device => 
            !device.label.toLowerCase().includes('obs') && 
            !device.label.toLowerCase().includes('virtual')
          ) || devices[0];

          console.log('Selected camera:', realCamera);

          if (realCamera) {
            await qrScanner.start(
              realCamera.id,
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
              },
              onScanSuccess,
              onScanError
            );
            setHtml5Qrcode(qrScanner);
          } else {
            throw new Error('Không tìm thấy camera thích hợp');
          }

        } catch (err) {
          console.error('Scanner error:', err);
          toast.error(err instanceof Error ? err.message : 'Không thể khởi tạo máy quét QR');
        }
      }
    };

    initializeScanner();

    return () => {
      if (qrScanner) {
        qrScanner.stop().catch(console.error);
      }
    };
  }, [scanMode]);

  const onScanSuccess = async (decodedText: string) => {
    try {
      if (html5Qrcode) {
        await html5Qrcode.pause();
      }

      if (!id) {
        toast.error('Event ID is missing');
        return;
      }

      const result = await checkinService.checkinUser({
        eventId: id,
        studentId: decodedText,
        method: 'qr',
        type: checkinType
      });

      setCheckins(prev => [result.data, ...prev]);
      toast.success(`Điểm danh ${checkinType === 'participant' ? 'người tham gia' : 'cộng tác viên'} thành công: ${decodedText}`);
      
      // Hiển thị thông báo nếu có điểm danh tự động
      if (result.message) {
        setTimeout(() => {
          toast.info(result.message, { autoClose: 4000 });
        }, 1000);
      }

      setTimeout(() => {
        if (html5Qrcode) {
          html5Qrcode.resume();
        }
      }, 2000);
    } catch (error: any) {
      if (error.error === 'STUDENT_ALREADY_CHECKED_IN') {
        toast.warning(`MSSV ${decodedText} đã được điểm danh trước đó`);
      } else {
        toast.error(error.error);
      }

      if (html5Qrcode) {
        html5Qrcode.resume();
      }
    }
  };

  const onScanError = (error: any) => {
    // Chỉ log lỗi nghiêm trọng
    if (error?.message?.includes('NavigationError')) {
      console.error('Camera error:', error);
    }
  };

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    try {
      if (!id) {
        toast.error('Event ID is missing');
        return;
      }

      const result = await checkinService.checkinUser({
        eventId: id,
        studentId: studentId.trim(),
        method: 'manual',
        type: checkinType
      });

      setCheckins(prev => [result.data, ...prev]);
      setStudentId('');
      toast.success(`Điểm danh ${checkinType === 'participant' ? 'người tham gia' : 'cộng tác viên'} thành công: ${studentId}`);
      
      // Hiển thị thông báo nếu có điểm danh tự động
      if (result.message) {
        setTimeout(() => {
          toast.info(result.message, { autoClose: 4000 });
        }, 1000);
      }
    } catch (error: any) {
      console.log('Error from server:', error);

      if (error.error === 'STUDENT_ALREADY_CHECKED_IN') {
        toast.warning(`MSSV ${studentId} đã được điểm danh trước đó`);
      } else {
        toast.error(error.error);
      }
    }
  };

  const handleExportExcel = () => {
    // Make sure to pass the filtered data, not all checkins
    setExportData(filteredCheckins);
    setShowExportModal(true);
  };

  // Switch the check-in type when the tab changes
  const handleTabChange = (tab: CheckinType) => {
    setActiveTab(tab);
    setCheckinType(tab);
  };

  const handleDeleteCheckin = (checkin: Checkin) => {
    setCheckinToDelete(checkin);
    setDeleteModalOpen(true);
  };

  const confirmDeleteCheckin = async () => {
    if (!checkinToDelete) return;
    
    try {
      setDeleteProcessing(true);
      await checkinService.deleteCheckin(checkinToDelete._id);
      
      // Cập nhật state để xóa check-in khỏi danh sách
      setCheckins(prevCheckins => 
        prevCheckins.filter(c => c._id !== checkinToDelete._id)
      );
      
      toast.success(`Đã xóa điểm danh ${checkinToDelete.type === 'participant' ? 'người tham gia' : 'cộng tác viên'} ${checkinToDelete.studentId}`);
      setDeleteModalOpen(false);
      setCheckinToDelete(null);
    } catch (error: any) {
      console.error('Error deleting checkin:', error);
      toast.error(error.error || 'Không thể xóa điểm danh');
    } finally {
      setDeleteProcessing(false);
    }
  };

  const handleDeleteAllCheckins = (studentId: string) => {
    setStudentToDeleteAll(studentId);
    setDeleteAllModalOpen(true);
  };

  const confirmDeleteAllCheckins = async () => {
    if (!studentToDeleteAll || !id) return;
    
    try {
      setDeleteAllProcessing(true);
      await checkinService.deleteCheckinsByStudent(id, studentToDeleteAll);
      
      // Cập nhật state để xóa tất cả check-in của sinh viên
      setCheckins(prevCheckins => 
        prevCheckins.filter(c => c.studentId !== studentToDeleteAll)
      );
      
      toast.success(`Đã xóa tất cả điểm danh của MSSV ${studentToDeleteAll}`);
      setDeleteAllModalOpen(false);
      setStudentToDeleteAll(null);
    } catch (error: any) {
      console.error('Error deleting all checkins:', error);
      toast.error(error.error || 'Không thể xóa điểm danh');
    } finally {
      setDeleteAllProcessing(false);
    }
  };

  if (loading) return (    <div className="min-h-screen bg-gray-50 flex items-center justify-center">      <LoadingSpinner size="lg" />    </div>  );

  // Check if user has access to the check-in page
  const isUserCollaborator = user && user._id && event.collaborators ? 
    event.collaborators.some(
      collaboratorId => collaboratorId?.toString() === user._id?.toString()
    ) : false;

  const canAccessCheckin = 
    user?.role === 'admin' || // Admin hệ thống
    (event.creator?._id === user?._id) || // Event creator
    (event.organizer?._id === user?._id) || // Event organizer
    isUserCollaborator || // Event collaborator
    (event.department?._id && (
      user?._id === event.department?.head?._id || // Trưởng khoa
      event.department?.administrators?.includes(user?._id) || // QTV khoa
      event.department?.moderators?.includes(user?._id) // KDV
    ));

  if (!canAccessCheckin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mt-[200px] mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mb-6">
                <i className="fas fa-lock text-6xl text-orange-500"></i>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Không có quyền truy cập
              </h1>
              <p className="text-gray-600 mb-8">
                Bạn không có quyền thực hiện điểm danh cho sự kiện này. 
                Vui lòng liên hệ với quản trị viên nếu bạn cho rằng đây là một sự nhầm lẫn.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => window.history.back()}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                ><i className="fas fa-arrow-left mr-2"></i>
                  Quay lại
                </button>
                <a 
                  href="/events" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <i className="fas fa-home mr-2"></i>
                  Trang chủ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {getEventStatus(event) === 'ended' ? 'Danh sách điểm danh' : 'Điểm danh sự kiện'}
          </h1>
          <p className="text-gray-600 mt-2">{event?.title}</p>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <i className="fas fa-calendar"></i>
            <span>{formatDateTime(event?.startDate)} - {formatDateTime(event?.endDate)}</span>
          </div>
        </div>

        <div className={getEventStatus(event) === 'ended' ? '' : 'grid md:grid-cols-2 gap-6'}>
          {/* Chỉ hiển thị phần điểm danh nếu sự kiện chưa kết thúc */}
          {getEventStatus(event) !== 'ended' && canAccessCheckin && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Tabs for Participant/Collaborator */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => handleTabChange('participant')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'participant'
                      ? 'border-b-2 border-orange-500 text-orange-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="fas fa-users mr-2"></i>
                  Điểm danh người tham gia
                </button>
                <button
                  onClick={() => handleTabChange('collaborator')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'collaborator'
                      ? 'border-b-2 border-green-500 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="fas fa-user-tie mr-2"></i>
                  Điểm danh cộng tác viên
                </button>
              </div>

              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setScanMode('qr')}
                  className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                    scanMode === 'qr'
                      ? `${activeTab === 'participant' ? 'bg-orange-600' : 'bg-green-600'} text-white shadow-lg`
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-qrcode mr-2"></i>
                  Quét QR
                </button>
                <button
                  onClick={() => setScanMode('manual')}
                  className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                    scanMode === 'manual'
                      ? `${activeTab === 'participant' ? 'bg-orange-600' : 'bg-green-600'} text-white shadow-lg`
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-keyboard mr-2"></i>
                  Nhập MSSV
                </button>
              </div>

              {scanMode === 'qr' ? (
                <div className="relative">
                  <div 
                    id="qr-reader" 
                    ref={qrRef} 
                    className="w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-inner"
                  ></div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-center text-gray-600">
                      <i className="fas fa-info-circle mr-2"></i>
                      Đưa mã QR vào khung hình để quét
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleManualCheckin} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="Nhập MSSV"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!studentId.trim()}
                    className={`w-full py-3 ${
                      activeTab === 'participant' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
                    } text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    <i className="fas fa-check mr-2"></i>
                    Xác nhận điểm danh {activeTab === 'participant' ? 'người tham gia' : 'cộng tác viên'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Phần danh sách được hiển thị cho tất cả người dùng có quyền truy cập */}
          {canAccessCheckin && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Danh sách điểm danh
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <i className="fas fa-file-excel mr-2"></i>
                    Xuất Excel
                  </button>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                    {filteredCheckins.length} người
                  </span>
                </div>
              </div>
              
              {/* Filter buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    filterType === 'all'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilterType('participant')}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    filterType === 'participant'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Người tham gia
                </button>
                <button
                  onClick={() => setFilterType('collaborator')}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    filterType === 'collaborator'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Cộng tác viên
                </button>
              </div>
              
              {/* Thêm vào sau phần buttons filter type */}
              {filterType !== 'all' && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mr-2"
                  >
                    <i className="fas fa-file-excel mr-2"></i>
                    Xuất Excel
                  </button>
                </div>
              )}

              <div className="overflow-auto max-h-[600px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời gian
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MSSV
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Họ tên
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phương thức
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vai trò
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCheckins.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          Không có dữ liệu điểm danh
                        </td>
                      </tr>
                    ) : (
                      filteredCheckins.map((checkin) => (
                        <tr 
                          key={checkin._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                            {new Date(checkin.checkinTime).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {checkin.studentId}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                            {checkin.user?.fullName ? (
                              checkin.user.fullName
                            ) : (
                              <span className="italic text-gray-400">(trống)</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${checkin.checkinMethod === 'qr' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              <i className={`fas fa-${checkin.checkinMethod === 'qr' ? 'qrcode' : 'keyboard'} mr-1`}></i>
                              {checkin.checkinMethod === 'qr' ? 'Quét QR' : 'Nhập tay'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${checkin.type === 'participant' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              <i className={`fas fa-${checkin.type === 'participant' ? 'users' : 'user-tie'} mr-1`}></i>
                              {checkin.type === 'participant' ? 'Người tham gia' : 'Cộng tác viên'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                            <div className="relative dropdown-menu">
                              <button
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenuPosition({ 
                                    x: rect.left - 220, // Hiển thị menu sang trái
                                    y: rect.top + window.scrollY + 30 // Hiển thị thấp hơn nút một chút
                                  });
                                  setOpenMenuId(openMenuId === checkin._id ? null : checkin._id);
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Menu dropdown cho các action */}
      <MenuDropdown 
        isOpen={!!openMenuId}
        onClose={() => setOpenMenuId(null)}
        position={menuPosition}
        onDeleteCheckin={() => {
          const checkin = filteredCheckins.find(c => c._id === openMenuId);
          if (checkin) {
            handleDeleteCheckin(checkin);
            setOpenMenuId(null);
          }
        }}
        onDeleteAllCheckins={() => {
          const checkin = filteredCheckins.find(c => c._id === openMenuId);
          if (checkin) {
            handleDeleteAllCheckins(checkin.studentId);
            setOpenMenuId(null);
          }
        }}
      />
      
      {/* Modal xác nhận xóa một bản ghi điểm danh */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteCheckin}
        title="Xóa điểm danh"
        message={checkinToDelete ? 
          `Bạn có chắc chắn muốn xóa điểm danh ${checkinToDelete.type === 'participant' ? 'người tham gia' : 'cộng tác viên'} của MSSV ${checkinToDelete.studentId}?` : 
          'Bạn có chắc chắn muốn xóa điểm danh này?'}
        isProcessing={deleteProcessing}
      />
      
      {/* Modal xác nhận xóa tất cả điểm danh của sinh viên */}
      <DeleteConfirmModal
        isOpen={deleteAllModalOpen}
        onClose={() => setDeleteAllModalOpen(false)}
        onConfirm={confirmDeleteAllCheckins}
        title="Xóa tất cả điểm danh của sinh viên"
        message={`Bạn có chắc chắn muốn xóa TẤT CẢ điểm danh của MSSV ${studentToDeleteAll}?`}
        isProcessing={deleteAllProcessing}
      />
      
      {/* Add CheckinSpreadsheet modal */}
      <CheckinSpreadsheet
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        eventTitle={event?.title || ''}
        eventTime={`${formatDateTime(event?.startDate || new Date())} - ${formatDateTime(event?.endDate || new Date())}`}
        data={exportData}
      />
    </div>
  );
};

export default EventCheckin;