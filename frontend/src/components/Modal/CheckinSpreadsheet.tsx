import React from 'react';
import Spreadsheet from 'react-spreadsheet';
import { utils as xlsxUtils, write as xlsxWrite } from 'xlsx';
import { saveAs } from 'file-saver';

interface CheckinSpreadsheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventTime: string;
  data: any[];
}

const CheckinSpreadsheet: React.FC<CheckinSpreadsheetProps> = ({
  isOpen,
  onClose,
  eventTitle,
  eventTime,
  data
}) => {
  if (!isOpen) return null;

  const spreadsheetData = [
    [{ value: 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM', readOnly: true, className: 'text-white font-bold text-lg text-center py-2' }],
    // [{ value: 'HUTECH UNIVERSITY', readOnly: true, className: 'text-white font-bold text-lg text-center py-2' }],
    [{ value: '', readOnly: true }],
    [{ value: 'DANH SÁCH ĐIỂM DANH SINH VIÊN', readOnly: true, className: 'text-white font-bold text-base text-center py-2' }],
    [{ value: eventTitle.toUpperCase(), readOnly: true, className: 'text-white font-bold text-sm text-center py-2' }],
    [{ value: `Thời gian: ${eventTime}`, readOnly: true, className: 'text-white text-sm text-center py-2' }],
    [{ value: `Tổng số sinh viên: ${data.length}`, readOnly: true, className: 'text-white text-sm text-center py-2' }],
    [{ value: '', readOnly: true }],
    // Headers
    [
      { value: 'STT', readOnly: true, className: 'bg-gray-300 font-bold text-center border border-gray-900' },
      { value: 'MSSV', readOnly: true, className: 'bg-gray-300 font-bold text-center border border-gray-900' },
      { value: 'HỌ VÀ TÊN', readOnly: true, className: 'bg-gray-300 font-bold text-center border border-gray-900' },
      { value: 'THỜI GIAN ĐIỂM DANH', readOnly: true, className: 'bg-gray-300 font-bold text-center border border-gray-900' },
      { value: 'PHƯƠNG THỨC', readOnly: true, className: 'bg-gray-300 font-bold text-center border border-gray-900' }
    ],
    // Data rows
    ...data.map((row, index) => ([
      { value: index + 1, readOnly: true, className: index % 2 ? 'bg-white text-center border border-gray-200' : 'bg-gray-50 text-center border border-gray-200' },
      { value: row.studentId, readOnly: true, className: index % 2 ? 'bg-white text-center border border-gray-200' : 'bg-gray-50 text-center border border-gray-200' },
      { value: row.user?.fullName || '(trống)', readOnly: true, className: index % 2 ? 'bg-white text-center border border-gray-200' : 'bg-gray-50 text-center border border-gray-200' },
      { value: new Date(row.checkinTime).toLocaleString('vi-VN'), readOnly: true, className: index % 2 ? 'bg-white text-center border border-gray-200' : 'bg-gray-50 text-center border border-gray-200' },
      { 
        value: row.checkinMethod === 'qr' ? 'Quét QR' : 'Nhập tay', 
        readOnly: true, 
        className: row.checkinMethod === 'qr' ? 'bg-green-100 text-center border border-gray-200' : (index % 2 ? 'bg-white text-center border border-gray-200' : 'bg-gray-50 text-center border border-gray-200') 
      }
    ]))
  ];

  const handleExportExcel = () => {
    // Create workbook
    const wb = xlsxUtils.book_new();
    
    // Create worksheet from data
    const ws = xlsxUtils.aoa_to_sheet([
      ['TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM'],
      ['HUTECH UNIVERSITY'],
      [''],
      ['DANH SÁCH ĐIỂM DANH SINH VIÊN'],
      [eventTitle.toUpperCase()],
      [`Thời gian: ${eventTime}`],
      [`Tổng số sinh viên: ${data.length}`],
      [''],
      ['STT', 'MSSV', 'HỌ VÀ TÊN', 'THỜI GIAN ĐIỂM DANH', 'PHƯƠNG THỨC'],
      ...data.map((row, index) => [
        index + 1,
        row.studentId,
        row.user?.fullName || '(trống)',
        new Date(row.checkinTime).toLocaleString('vi-VN'),
        row.checkinMethod === 'qr' ? 'Quét QR' : 'Nhập tay'
      ])
    ]);

    // Set column widths and row heights
    ws['!cols'] = [
      { wch: 6 },   // STT
      { wch: 12 },  // MSSV
      { wch: 35 },  // Họ và tên
      { wch: 25 },  // Thời gian điểm danh
      { wch: 15 }   // Phương thức
    ];
    ws['!rows'] = [
      { hpx: 30 },  // Dòng 1: Tên trường
      { hpx: 25 },  // Dòng 2: HUTECH
      { hpx: 10 },  // Dòng 3: Trống
      { hpx: 25 },  // Dòng 4: Tiêu đề danh sách
      { hpx: 25 },  // Dòng 5: Tên sự kiện
      { hpx: 20 },  // Dòng 6: Thời gian
      { hpx: 20 },  // Dòng 7: Tổng số SV
      { hpx: 10 },  // Dòng 8: Trống
      { hpx: 25 },  // Dòng 9: Header
      ...Array(data.length).fill({ hpx: 20 }) // Dòng dữ liệu
    ];

    // Merge cells for headers
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Trường
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // HUTECH
      { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, // Tiêu đề
      { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }, // Tên sự kiện
      { s: { r: 5, c: 0 }, e: { r: 5, c: 4 } }, // Thời gian
      { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } }  // Tổng số SV
    ];

    // Define styles
    const titleStyle = {
      font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1B3764' } }, // HUTECH Blue
      alignment: { horizontal: 'center', vertical: 'center' }
    };
    const subtitleStyle = {
      font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1B3764' } }, // HUTECH Blue
      alignment: { horizontal: 'center', vertical: 'center' }
    };
    const infoStyle = {
      font: { bold: true, sz: 12, color: { rgb: '000000' } },
      fill: { fgColor: { rgb: '1B3764' } }, // HUTECH Blue
      alignment: { horizontal: 'center', vertical: 'center' }
    };
    const headerStyle = {
      font: { bold: true, color: { rgb: '000000' } },
      fill: { fgColor: { rgb: 'D3D3D3' } }, // Xám nhạt
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'medium', color: { rgb: '#000000' } },
        bottom: { style: 'medium', color: { rgb: '#000000' } },
        left: { style: 'medium', color: { rgb: '#000000' } },
        right: { style: 'medium', color: { rgb: '#000000' } }
      }
    };
    const cellStyle = {
      border: {
        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
        right: { style: 'thin', color: { rgb: 'E5E7EB' } }
      },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
    const qrStyle = {
      ...cellStyle,
      fill: { fgColor: { rgb: 'E6F3E6' } } // Xanh nhạt cho Quét QR
    };

    // Apply styles
    const range = xlsxUtils.decode_range(ws['!ref'] || 'A1:E' + (9 + data.length));
    for (let row = 0; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cell = xlsxUtils.encode_cell({ r: row, c: col });
        if (!ws[cell]) continue;

        if (row === 0 || row === 1) {
          ws[cell].s = titleStyle;
        } else if (row === 3 || row === 4) {
          ws[cell].s = subtitleStyle;
        } else if (row === 5 || row === 6) {
          ws[cell].s = infoStyle;
        } else if (row === 8) {
          ws[cell].s = headerStyle;
        } else if (row > 8) {
          ws[cell].s = {
            ...cellStyle,
            fill: { fgColor: { rgb: row % 2 ? 'FFFFFF' : 'F9FAFB' } }
          };
          if (col === 4 && ws[cell].v === 'Quét QR') {
            ws[cell].s = qrStyle;
          }
        }
      }
    }

    // Add to workbook and save
    xlsxUtils.book_append_sheet(wb, ws, 'Danh sách điểm danh');
    const wbout = xlsxWrite(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout]), `DIEMDANH_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            Xem và Xuất danh sách điểm danh
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto border border-gray-200 rounded-lg">
          <Spreadsheet
            data={spreadsheetData}
            darkMode={false}
            columnLabels={['A', 'B', 'C', 'D', 'E']}
            rowLabels={Array.from({ length: spreadsheetData.length }, (_, i) => (i + 1).toString())}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              const csv = spreadsheetData
                .map(row => row.map(cell => `"${cell.value}"`).join(','))
                .join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `DIEMDANH_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
              a.click();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <i className="fas fa-download mr-2"></i>
            Tải xuống CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <i className="fas fa-file-excel mr-2"></i>
            Tải xuống Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckinSpreadsheet;