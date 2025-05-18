import React from 'react';
import Spreadsheet from 'react-spreadsheet';
import { utils as xlsxUtils, write as xlsxWrite } from 'xlsx';
import { saveAs } from 'file-saver';

interface CheckinData {
  studentId: string;
  user?: {
    fullName?: string;
  };
  checkinTime: string | Date;
  checkinMethod: 'qr' | 'manual';
  type: 'participant' | 'collaborator';
}

interface CheckinSpreadsheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventTime: string;
  data: CheckinData[];
}

const CheckinSpreadsheet: React.FC<CheckinSpreadsheetProps> = ({
  isOpen,
  onClose,
  eventTitle,
  eventTime,
  data
}) => {
  if (!isOpen) return null;

  // HUTECH colors
  const hutechBlue = '1B3764';
  const hutechLightBlue = 'D6E6FF';
  
  // Colors for cell styles - same in UI and Excel
  const headerGreen = 'E2EFDA';
  const alternatingGray = 'F5F5F5';
  const qrMethodGreen = 'E2EFDA';
  const qrMethodText = '006100';
  const manualMethodGray = 'EDEDED';
  const manualMethodText = '7F7F7F';
  const participantOrange = 'FFF2CC';
  const participantText = '974706';
  const collaboratorBlue = 'DDEBF7';
  const collaboratorText = '0070C0';

  // Prepare data with consistent styling for both view and export
  const prepareSpreadsheetData = () => {
    return [
      [{ value: 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM', readOnly: true, className: `bg-[#${hutechBlue}] text-white font-bold text-lg text-center py-2` }],
      [{ value: 'HUTECH UNIVERSITY', readOnly: true, className: `bg-[#${hutechBlue}] text-white font-bold text-lg text-center py-2` }],
      [{ value: '', readOnly: true }],
      [{ value: 'DANH SÁCH ĐIỂM DANH SINH VIÊN', readOnly: true, className: `bg-[#${hutechBlue}] text-white font-bold text-base text-center py-2` }],
      [{ value: eventTitle.toUpperCase(), readOnly: true, className: `bg-[#${hutechBlue}] text-white font-bold text-sm text-center py-2` }],
      [{ value: `Thời gian: ${eventTime}`, readOnly: true, className: `bg-[#${hutechLightBlue}] text-black text-sm text-center py-2` }],
      [{ value: `Tổng số sinh viên: ${data.length}`, readOnly: true, className: `bg-[#${hutechLightBlue}] text-black text-sm text-center py-2` }],
      [{ value: '', readOnly: true }],
      // Headers
      [
        { value: 'STT', readOnly: true, className: `bg-[#${headerGreen}] font-bold text-center border border-gray-900` },
        { value: 'MSSV', readOnly: true, className: `bg-[#${headerGreen}] font-bold text-center border border-gray-900` },
        { value: 'HỌ VÀ TÊN', readOnly: true, className: `bg-[#${headerGreen}] font-bold text-center border border-gray-900` },
        { value: 'THỜI GIAN ĐIỂM DANH', readOnly: true, className: `bg-[#${headerGreen}] font-bold text-center border border-gray-900` },
        { value: 'PHƯƠNG THỨC', readOnly: true, className: `bg-[#${headerGreen}] font-bold text-center border border-gray-900` },
        { value: 'VAI TRÒ', readOnly: true, className: `bg-[#${headerGreen}] font-bold text-center border border-gray-900` }
      ],
      // Data rows
      ...data.map((row, index) => ([
        { value: index + 1, readOnly: true, className: index % 2 ? 'bg-white text-center border border-gray-200' : `bg-[#${alternatingGray}] text-center border border-gray-200` },
        { value: row.studentId, readOnly: true, className: index % 2 ? 'bg-white text-center border border-gray-200' : `bg-[#${alternatingGray}] text-center border border-gray-200` },
        { value: row.user?.fullName || '(trống)', readOnly: true, className: index % 2 ? 'bg-white text-center border border-gray-200' : `bg-[#${alternatingGray}] text-center border border-gray-200` },
        { value: new Date(row.checkinTime).toLocaleString('vi-VN'), readOnly: true, className: index % 2 ? 'bg-white text-center border border-gray-200' : `bg-[#${alternatingGray}] text-center border border-gray-200` },
        { 
          value: row.checkinMethod === 'qr' ? 'Quét QR' : 'Nhập tay', 
          readOnly: true, 
          className: row.checkinMethod === 'qr' 
            ? `bg-[#${qrMethodGreen}] text-[#${qrMethodText}] text-center border border-gray-200` 
            : `bg-[#${manualMethodGray}] text-[#${manualMethodText}] text-center border border-gray-200` 
        },
        { 
          value: row.type === 'participant' ? 'Người tham gia' : 'Cộng tác viên',
          readOnly: true, 
          className: row.type === 'participant' 
            ? `bg-[#${participantOrange}] text-[#${participantText}] text-center border border-gray-200` 
            : `bg-[#${collaboratorBlue}] text-[#${collaboratorText}] text-center border border-gray-200`
        }
      ]))
    ];
  };

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
      ['STT', 'MSSV', 'HỌ VÀ TÊN', 'THỜI GIAN ĐIỂM DANH', 'PHƯƠNG THỨC', 'VAI TRÒ'],
      ...data.map((row, index) => [
        index + 1,
        row.studentId,
        row.user?.fullName || '(trống)',
        new Date(row.checkinTime).toLocaleString('vi-VN'),
        row.checkinMethod === 'qr' ? 'Quét QR' : 'Nhập tay',
        row.type === 'participant' ? 'Người tham gia' : 'Cộng tác viên'
      ])
    ]);

    // Set column widths and row heights
    ws['!cols'] = [
      { wch: 8 },   // STT
      { wch: 15 },  // MSSV
      { wch: 40 },  // Họ và tên
      { wch: 28 },  // Thời gian điểm danh
      { wch: 18 },  // Phương thức
      { wch: 20 }   // Vai trò
    ];
    
    ws['!rows'] = [
      { hpx: 40 },  // Dòng 1: Tên trường
      { hpx: 25 },  // Dòng 2: HUTECH
      { hpx: 15 },  // Dòng 3: Trống
      { hpx: 30 },  // Dòng 4: Tiêu đề danh sách
      { hpx: 25 },  // Dòng 5: Tên sự kiện
      { hpx: 22 },  // Dòng 6: Thời gian
      { hpx: 22 },  // Dòng 7: Tổng số SV
      { hpx: 15 },  // Dòng 8: Trống
      { hpx: 30 },  // Dòng 9: Header
      ...Array(data.length).fill({ hpx: 22 }) // Dòng dữ liệu
    ];

    // Merge cells for headers
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Trường
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // HUTECH
      { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }, // Tiêu đề
      { s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }, // Tên sự kiện
      { s: { r: 5, c: 0 }, e: { r: 5, c: 5 } }, // Thời gian
      { s: { r: 6, c: 0 }, e: { r: 6, c: 5 } }  // Tổng số SV
    ];
    
    // Define styles with direct color values
    const titleStyle = {
      font: { bold: true, sz: 18, color: { rgb: 'FFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: hutechBlue } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: hutechBlue } },
        bottom: { style: 'thin', color: { rgb: hutechBlue } },
        left: { style: 'thin', color: { rgb: hutechBlue } },
        right: { style: 'thin', color: { rgb: hutechBlue } }
      }
    };
    
    const subtitleStyle = {
      font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: hutechBlue } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        bottom: { style: 'thin', color: { rgb: hutechBlue } },
      }
    };
    
    const infoStyle = {
      font: { bold: true, sz: 12, color: { rgb: '000000' } },
      fill: { patternType: 'solid', fgColor: { rgb: hutechLightBlue } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        bottom: { style: 'thin', color: { rgb: hutechLightBlue } },
      }
    };
    
    const headerStyle = {
      font: { bold: true, color: { rgb: '000000' }, sz: 12 },
      fill: { patternType: 'solid', fgColor: { rgb: headerGreen } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'medium', color: { rgb: '000000' } },
        bottom: { style: 'medium', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
    
    const cellStyle = {
      font: { sz: 11 },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
      border: {
        top: { style: 'thin', color: { rgb: 'D3D3D3' } },
        bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
        left: { style: 'thin', color: { rgb: 'D3D3D3' } },
        right: { style: 'thin', color: { rgb: 'D3D3D3' } }
      },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    };
    
    const evenRowStyle = {
      font: { sz: 11 },
      fill: { patternType: 'solid', fgColor: { rgb: alternatingGray } },
      border: {
        top: { style: 'thin', color: { rgb: 'D3D3D3' } },
        bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
        left: { style: 'thin', color: { rgb: 'D3D3D3' } },
        right: { style: 'thin', color: { rgb: 'D3D3D3' } }
      },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    };
    
    const qrStyle = {
      font: { sz: 11, color: { rgb: qrMethodText } },
      fill: { patternType: 'solid', fgColor: { rgb: qrMethodGreen } },
      border: {
        top: { style: 'thin', color: { rgb: 'D3D3D3' } },
        bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
        left: { style: 'thin', color: { rgb: 'D3D3D3' } },
        right: { style: 'thin', color: { rgb: 'D3D3D3' } }
      },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    };
    
    const manualStyle = {
      font: { sz: 11, color: { rgb: manualMethodText } },
      fill: { patternType: 'solid', fgColor: { rgb: manualMethodGray } },
      border: {
        top: { style: 'thin', color: { rgb: 'D3D3D3' } },
        bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
        left: { style: 'thin', color: { rgb: 'D3D3D3' } },
        right: { style: 'thin', color: { rgb: 'D3D3D3' } }
      },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    };
    
    const participantStyle = {
      font: { sz: 11, color: { rgb: participantText } },
      fill: { patternType: 'solid', fgColor: { rgb: participantOrange } },
      border: {
        top: { style: 'thin', color: { rgb: 'D3D3D3' } },
        bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
        left: { style: 'thin', color: { rgb: 'D3D3D3' } },
        right: { style: 'thin', color: { rgb: 'D3D3D3' } }
      },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    };
    
    const collaboratorStyle = {
      font: { sz: 11, color: { rgb: collaboratorText } },
      fill: { patternType: 'solid', fgColor: { rgb: collaboratorBlue } },
      border: {
        top: { style: 'thin', color: { rgb: 'D3D3D3' } },
        bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
        left: { style: 'thin', color: { rgb: 'D3D3D3' } },
        right: { style: 'thin', color: { rgb: 'D3D3D3' } }
      },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    };

    // Apply styles
    const range = xlsxUtils.decode_range(ws['!ref'] || 'A1:F' + (9 + data.length));
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
          // Apply alternating row styles for better readability
          ws[cell].s = row % 2 === 0 ? evenRowStyle : cellStyle;
          
          // Special styling for specific columns
          if (col === 4) { // Phương thức column
            if (ws[cell].v === 'Quét QR') {
              ws[cell].s = qrStyle;
            } else {
              ws[cell].s = manualStyle;
            }
          }
          
          if (col === 5) { // Vai trò column
            if (ws[cell].v === 'Người tham gia') {
              ws[cell].s = participantStyle;
            } else if (ws[cell].v === 'Cộng tác viên') {
              ws[cell].s = collaboratorStyle;
            }
          }
        }
      }
    }

    // Add formula for automatic date in footer
    const footerRow = 10 + data.length;
    const dateCell = xlsxUtils.encode_cell({ r: footerRow, c: 0 });
    ws[dateCell] = { 
      f: 'TEXT(TODAY(),"DD/MM/YYYY")', 
      t: 'f',
      z: 'dd/mm/yyyy'
    };
    
    // Merge cells for footer
    ws['!merges'].push({ 
      s: { r: footerRow, c: 0 }, 
      e: { r: footerRow, c: 5 } 
    });
    
    // Apply footer style
    ws[dateCell].s = {
      font: { italic: true, sz: 10, color: { rgb: '666666' } },
      alignment: { horizontal: 'right', vertical: 'center' }
    };

    // Add to workbook and save with improved filename
    xlsxUtils.book_append_sheet(wb, ws, 'Danh sách điểm danh');
    const wbout = xlsxWrite(wb, { 
      bookType: 'xlsx', 
      type: 'array',
      bookSST: false,
      compression: true 
    });
    
    // Create a more descriptive filename with date
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const safeEventTitle = eventTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `DIEMDANH_${safeEventTitle}_${dateStr}.xlsx`;
    
    saveAs(new Blob([wbout]), filename);
    onClose();
  };

  const spreadsheetData = prepareSpreadsheetData();

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
            columnLabels={['A', 'B', 'C', 'D', 'E', 'F']}
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