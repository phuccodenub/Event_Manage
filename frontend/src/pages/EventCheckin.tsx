import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import Header from '@/components/Header';
import checkinService from '@/services/checkinService';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventContext';
import NotFound from './NotFound';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { toast } from 'react-toastify';
import Spreadsheet from 'react-spreadsheet';
import CheckinSpreadsheet from '@/components/Modal/CheckinSpreadsheet';

interface Checkin {
  _id: string;
  studentId: string;
  checkinTime: string;
  checkinMethod: 'qr' | 'manual';
  user: {
    fullName: string;
  };
}

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

      const result = await checkinService.checkinUser({
        eventId: id,
        studentId: decodedText,
        method: 'qr',
      });

      setCheckins(prev => [result.data, ...prev]);
      toast.success(`Điểm danh thành công: ${decodedText}`);

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
      const result = await checkinService.checkinUser({
        eventId: id,
        studentId: studentId.trim(),
        method: 'manual',
      });

      setCheckins(prev => [result.data, ...prev]);
      setStudentId('');
      toast.success(`Điểm danh thành công: ${studentId}`);
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
    const exportData = checkins.map((checkin, index) => ({
      'STT': index + 1,
      'MSSV': checkin.studentId,
      'HỌ VÀ TÊN': checkin.user?.fullName || '(trống)',
      'THỜI GIAN ĐIỂM DANH': new Date(checkin.checkinTime).toLocaleString('vi-VN'),
      'PHƯƠNG THỨC': checkin.checkinMethod === 'qr' ? 'Quét QR' : 'Nhập tay'
    }));
    console.log('Export data:', exportData);
    setExportData(exportData);
    setShowExportModal(true);
  };

  if (loading) return <div>Loading...</div>;

  const canAccessCheckin = 
    user?.role === 'admin' || // Admin hệ thống
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
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setScanMode('qr')}
                  className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                    scanMode === 'qr'
                      ? 'bg-orange-600 text-white shadow-lg'
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
                      ? 'bg-orange-600 text-white shadow-lg'
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
                    className="w-full py-3 bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors"
                  >
                    <i className="fas fa-check mr-2"></i>
                    Xác nhận
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
                    {checkins.length} sinh viên
                  </span>
                </div>
              </div>
              
              <div className="overflow-auto max-h-[600px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời gian
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MSSV
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Họ tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phương thức
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {checkins.map((checkin: Checkin) => (
                      <tr 
                        key={checkin._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(checkin.checkinTime).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {checkin.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {checkin.user?.fullName ? (
                            checkin.user.fullName
                          ) : (
                            <span className="italic text-gray-400">(trống)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      {showExportModal && (
        <CheckinSpreadsheet
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          eventTitle={event?.title || ''}
          eventTime={`${formatDateTime(event?.startDate)} - ${formatDateTime(event?.endDate)}`}
          data={checkins}
        />
      )}
    </div>
  );
};

export default EventCheckin;
