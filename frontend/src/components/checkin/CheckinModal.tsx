import React, { useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import checkinService from '@/services/checkinService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onCheckinSuccess: (data: any) => void;
}

const CheckinModal: React.FC<Props> = ({ isOpen, onClose, eventId, onCheckinSuccess }) => {
  const [mode, setMode] = useState<'qr' | 'manual'>('qr');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const qrScanner = useRef<any>(null);

  useEffect(() => {
    if (isOpen && mode === 'qr') {
      // Initialize QR Scanner
      qrScanner.current = new Html5QrcodeScanner(
        "qr-reader", 
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1
        },
        false
      );

      qrScanner.current.render((decodedText: string) => {
        handleQRScan(decodedText);
      }, (error: any) => {
        console.error(error);
      });
    }

    return () => {
      if (qrScanner.current) {
        qrScanner.current.clear();
      }
    };
  }, [isOpen, mode]);

  const handleQRScan = async (scannedData: string) => {
    try {
      setLoading(true);
      // Dừng quét khi đã quét được
      if (qrScanner.current) {
        qrScanner.current.pause();
      }      const result = await checkinService.checkinUser({
        eventId,
        studentId: scannedData,
        method: 'qr',
        type: 'participant'
      });

      onCheckinSuccess(result.data);
      toast.success('Điểm danh thành công');
      
      // Đóng modal sau khi quét thành công
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Điểm danh thất bại');
      // Tiếp tục quét nếu thất bại
      if (qrScanner.current) {
        qrScanner.current.resume();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    try {
      setLoading(true);      const result = await checkinService.checkinUser({
        eventId,
        studentId: studentId.trim(),
        method: 'manual',
        type: 'participant'
      });

      onCheckinSuccess(result.data);
      toast.success('Điểm danh thành công');
      setStudentId('');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Điểm danh thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6">
              <Dialog.Title className="text-lg font-medium mb-4">
                Điểm danh sự kiện
              </Dialog.Title>

              <div className="space-y-4">
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setMode('qr')}
                    className={`px-4 py-2 rounded-lg ${
                      mode === 'qr' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-100'
                    }`}
                  >
                    Quét QR
                  </button>
                  <button
                    onClick={() => setMode('manual')}
                    className={`px-4 py-2 rounded-lg ${
                      mode === 'manual' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-100'
                    }`}
                  >
                    Nhập MSSV
                  </button>
                </div>

                {mode === 'qr' ? (
                  <div>
                    <div id="qr-reader" className="w-full"></div>
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Đưa mã QR vào khung hình để quét
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleManualCheckin} className="space-y-4">
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="Nhập MSSV"
                      className="w-full p-2 border rounded-lg"
                      autoFocus
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !studentId.trim()}
                      className="w-full bg-orange-600 text-white py-2 rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                  </form>
                )}
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CheckinModal;
