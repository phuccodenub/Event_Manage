const Event = require('../models/eventModel');
const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');
const Checkin = require('../models/checkinModel');
const https = require('https');

// Đăng ký font từ Google nếu cần
try {
  // Đăng ký font NotoSansJP cho tên người tham gia
  const notoSansFontPath = path.join(__dirname, '../assets/fonts/NotoSansJP-VariableFont_wght.ttf');
  
  if (fs.existsSync(notoSansFontPath)) {
    console.log('NotoSansJP font found at:', notoSansFontPath);
    registerFont(notoSansFontPath, { 
      family: 'NotoSansJP',
      weight: '900' // Thiết lập weight cho variable font
    });
    console.log('NotoSansJP font registered successfully');
  } else {
    console.log('NotoSansJP font not found at:', notoSansFontPath);
  }

  // Đăng ký font WindSong
  const windSongFontPath = path.join(__dirname, '../assets/fonts/WindSong-Regular.ttf');
  
  if (fs.existsSync(windSongFontPath)) {
    console.log('WindSong font found at:', windSongFontPath);
    registerFont(windSongFontPath, { family: 'WindSong', weight: 'normal' });
    console.log('WindSong font registered successfully');
  } else {
    console.log('WindSong font not found at:', windSongFontPath);
  }
  
  // Đường dẫn lưu font Babylonica (hỗ trợ ngược)
  const babylonicaFontPath = path.join(__dirname, '../assets/fonts/Babylonica-Regular.ttf');
  
  // Kiểm tra xem font đã tồn tại chưa và đăng ký
  if (fs.existsSync(babylonicaFontPath)) {
    // Đăng ký font nếu đã tồn tại
    console.log('Babylonica font found at:', babylonicaFontPath);
    registerFont(babylonicaFontPath, { family: 'Babylonica', weight: 'normal' });
    console.log('Babylonica font registered successfully');
  } else {
    console.log('Babylonica font not found at:', babylonicaFontPath);
  }
} catch (err) {
  console.error('Error registering fonts:', err);
}

/**
 * @desc    Generate certificate for event participation
 * @route   GET /api/v1/certificates/:eventId/:userId
 * @access  Private
 */
exports.generateCertificate = async (req, res, next) => {
  try {
    const { eventId, userId } = req.params;
    
    // Kiểm tra sự tồn tại của sự kiện
    const event = await Event.findById(eventId)
      .populate('department', 'name');
    
    if (!event) {
      return next(new ErrorResponse('Không tìm thấy sự kiện', 404));
    }

    // Kiểm tra sự tồn tại của người dùng
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse('Không tìm thấy người dùng', 404));
    }

    // Kiểm tra xem người dùng có tham gia sự kiện không
    const isParticipant = event.participants.some(
      (participant) => participant.toString() === userId
    );

    // Xác minh quyền truy cập - chỉ người tổ chức/admin/người tham gia mới có thể xem
    const isOwner = event.organizer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isRequestingOwnCertificate = userId === req.user.id;

    if (!isParticipant) {
      return next(
        new ErrorResponse('Người dùng không tham gia sự kiện này', 403)
      );
    }

    if (!isOwner && !isAdmin && !isRequestingOwnCertificate) {
      return next(
        new ErrorResponse('Không có quyền truy cập vào tài nguyên này', 403)
      );
    }

    // Kiểm tra xem người dùng đã check-in chưa
    const checkin = await Checkin.findOne({
      event: eventId,
      user: userId
    });

    if (!checkin) {
      return next(
        new ErrorResponse('Người dùng chưa checkin tại sự kiện', 403)
      );
    }

    // Tạo canvas cho chứng nhận với kích thước lớn hơn và tỉ lệ khổ ngang
    const canvas = createCanvas(2000, 1414); // Kích thước cao hơn và rộng hơn
    const ctx = canvas.getContext('2d');

    // Vẽ nền gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8f1e9'); // Hơi vàng nhạt để tạo cảm giác trang trọng
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ viền ngoài sang trọng
    ctx.strokeStyle = '#e6b17e'; // Màu vàng đồng
    ctx.lineWidth = 30;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

    // Vẽ viền trong
    ctx.strokeStyle = '#e6b17e';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 80, canvas.width - 150, canvas.height - 150);

    // Tạo họa tiết trang trí ở 4 góc
    // await drawCornerOrnament(ctx, 50, 50, 100, 100);
    // await drawCornerOrnament(ctx, canvas.width - 100, 50, -100, 100);
    // await drawCornerOrnament(ctx, 50, canvas.height - 50, 100, -100);
    // await drawCornerOrnament(ctx, canvas.width - 100, canvas.height - 50, -100, -100);

    // // Tạo hoa văn trang trí hai bên
    // await drawSideOrnaments(ctx, canvas.width, canvas.height);

    // Vẽ logo HUTECH ở góc trên bên trái
    try {
      const logo = await loadImage('https://img5.thuthuatphanmem.vn/uploads/2021/07/14/logo-dai-hoc-hutech_012634748.png');
      const logoWidth = 400;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      ctx.drawImage(logo, 120, 120, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error loading logo:', error);
    }

    // Thêm tiêu đề trang trọng
    ctx.font = 'bold 70px sans-serif';
    ctx.fillStyle = '#FF0000'; // Đỏ
    ctx.textAlign = 'center';
    ctx.fillText('GIẤY CHỨNG NHẬN', canvas.width / 2, 350);

    // Đường kẻ trang trí dưới tiêu đề
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 400, 380);
    ctx.lineTo(canvas.width / 2 + 400, 380);
    ctx.strokeStyle = '#e6b17e';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Thêm nội dung
    ctx.font = '40px sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText('Trường Đại học Công nghệ TP.HCM (HUTECH)', canvas.width / 2, 450);
    ctx.fillText('Trân trọng chứng nhận', canvas.width / 2, 520);

    // Tên người tham gia (lớn và nổi bật)
    try {
      // Sử dụng font NotoSansJP Variable Font
      ctx.font = '85px sans-serif';  // Sử dụng weight 700 thay vì bold cho variable font
      ctx.fillStyle = '#0033CC'; // Xanh dương
      ctx.fillText(user.fullName, canvas.width / 2, 650);
    } catch (fontError) {
      console.error('Error using NotoSansJP font:', fontError);
      // Fallback nếu không có font NotoSansJP
      ctx.font = 'bold 85px sans-serif';
      ctx.fillStyle = '#0033CC'; // Xanh dương
      ctx.fillText(user.fullName, canvas.width / 2, 650);
    }

    // Phần chữ Đã tham gia
    ctx.font = '40px sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText('Đã tham gia sự kiện', canvas.width / 2, 750);

    // Tên sự kiện (nổi bật, đậm và nghiêng nhẹ)
    ctx.font = 'bold 55px sans-serif';
    ctx.fillStyle = '#e6b17e';
    ctx.fillText(`"${event.title}"`, canvas.width / 2, 850);

    // Thời gian sự kiện và thông tin thêm
    const eventDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    // Format ngày tháng năm rõ ràng hơn
    const formattedStartDate = `${eventDate.getDate().toString().padStart(2, '0')}/${(eventDate.getMonth() + 1).toString().padStart(2, '0')}/${eventDate.getFullYear()}`;
    const formattedEndDate = `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}/${endDate.getFullYear()}`;

    // ctx.font = '35px sans-serif';
    // ctx.fillText(`Diễn ra từ ngày ${formattedStartDate} đến ngày ${formattedEndDate}`, canvas.width / 2, 920);

    // Khoa/phòng ban tổ chức
    const departmentName = event.department ? event.department.name : 'HUTECH';
    ctx.font = 'italic 35px sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText(`Do ${departmentName} tổ chức`, canvas.width / 2, 920);

    // Ngày cấp chứng nhận
    const today = new Date();
    // Format ngày tháng năm rõ ràng hơn
    const formattedToday = `${today.getDate().toString().padStart(2, '0')} tháng ${(today.getMonth() + 1).toString().padStart(2, '0')} năm ${today.getFullYear()}`;
    
    ctx.font = 'italic 25px sans-serif';
    ctx.fillText(`TP. Hồ Chí Minh, ngày ${formattedToday}`, canvas.width - 450, 1100);

    // Chữ ký và thông tin người ký
    // ctx.font = '35px sans-serif';
    // ctx.fillText('NGƯỜI KÝ', canvas.width - 450, 1150);
    
    // Thêm chữ ký
    try {
      // Sử dụng font WindSong đã đăng ký ở đầu file
      ctx.font = '110px WindSong';
      ctx.fillStyle = '#0000CC';
      ctx.fillText('Chidi', canvas.width - 450, 1215);
      console.log('Signature rendered with WindSong font');
    } catch (fontError) {
      console.error('Error using WindSong font:', fontError);
      // Fallback
      ctx.font = 'italic 70px serif';
      ctx.fillText('Chidi', canvas.width - 450, 1220);
    }
    
    // Thêm họ tên người ký
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText('Admin Nguyễn Thành Lộc', canvas.width - 450, 1290);

    // Thêm con dấu (nếu có)
    try {
      // Sử dụng hình ảnh con dấu màu xanh dương
      const stamp = await loadImage('https://cdn-icons-png.flaticon.com/512/3472/3472620.png');
      
      // Đặt độ trong suốt
      ctx.globalAlpha = 0.4;
      
      // Vẽ stamp
      ctx.drawImage(stamp, canvas.width - 400, 1140, 200, 200);
      
      // Trả về độ trong suốt bình thường
      ctx.globalAlpha = 1.0;
    } catch (error) {
      console.error('Error loading stamp:', error);
    }

    // Mã xác thực - Di chuyển qua góc dưới bên trái
    const certificateId = `HTW-${eventId.substring(0, 6)}-${userId.substring(0, 6)}`;
    const formattedCertId = certificateId.match(/.{1,4}/g)?.join('-') || certificateId;
    
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#6c6c6c';
    ctx.textAlign = 'left'; // Đặt căn lề trái
    ctx.fillText(`Mã chứng nhận: ${formattedCertId}`, 100, canvas.height - 120);
    
    // QR code URL (nếu cần) - Cũng đặt ở góc dưới bên trái
    ctx.font = '20px sans-serif';
    ctx.fillText('Xác thực tại: hutechcheckin.com', 100, canvas.height - 80);
    
    // Đặt lại textAlign để không ảnh hưởng đến các phần khác
    ctx.textAlign = 'center';

    // Chuyển canvas thành buffer image
    const buffer = canvas.toBuffer('image/png');

    // Thiết lập header và gửi hình ảnh
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename=certificate-${eventId}-${userId}.png`,
    });

    // Gửi dữ liệu ảnh
    res.send(buffer);
  } catch (error) {
    console.error('Error generating certificate:', error);
    next(new ErrorResponse('Lỗi khi tạo chứng nhận', 500));
  }
};

/**
 * Vẽ họa tiết ở góc chứng nhận đẹp hơn và tinh tế hơn
 */
async function drawCornerOrnament(ctx, x, y, width, height) {
  try {
    ctx.save();
    ctx.translate(x, y);
    
    // Đặt màu và độ dày cho họa tiết - sử dụng màu vàng đồng chủ đạo
    const mainColor = '#e6b17e'; // Vàng đồng - đồng nhất với viền chứng nhận
    const accentColor = '#c69c6d'; // Vàng đồng đậm hơn
    const lightColor = '#f0d4a9'; // Vàng đồng nhạt
    
    const size = Math.abs(width);
    const isRight = width < 0;
    const direction = isRight ? -1 : 1;

    // === Vẽ họa tiết chính - mô phỏng hoa văn cổ điển ===
    
    // 1. Vẽ đường cong lớn chính
    ctx.beginPath();
    if (!isRight) {
      // Góc trên/dưới bên trái
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        size * 0.3, size * 0.1, 
        size * 0.6, size * 0.3, 
        size * 0.8, 0
      );
    } else {
      // Góc trên/dưới bên phải
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        -size * 0.3, size * 0.1, 
        -size * 0.6, size * 0.3, 
        -size * 0.8, 0
      );
    }
    ctx.lineWidth = 4;
    ctx.strokeStyle = mainColor;
    ctx.stroke();
    
    // 2. Vẽ đường cong thứ hai song song với đường chính
    ctx.beginPath();
    if (!isRight) {
      ctx.moveTo(8, 3);
      ctx.bezierCurveTo(
        size * 0.3 + 8, size * 0.1 + 6, 
        size * 0.6 + 8, size * 0.3 + 6, 
        size * 0.8 + 3, 3
      );
    } else {
      ctx.moveTo(-8, 3);
      ctx.bezierCurveTo(
        -size * 0.3 - 8, size * 0.1 + 6, 
        -size * 0.6 - 8, size * 0.3 + 6, 
        -size * 0.8 - 3, 3
      );
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = accentColor;
    ctx.stroke();
    
    // 3. Vẽ họa tiết xoắn ốc tinh tế tại gốc
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = mainColor;
    ctx.fill();
    
    // 4. Vẽ họa tiết hoa văn kiểu baroque đơn giản
    const curlSize = size * 0.25;
    
    // Vẽ những đường xoắn ốc nhỏ
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI / 8) + Math.PI / 16;
      const startX = direction * (i * 15 + 20);
      const startY = 5;
      
      // Xoắn ốc nhỏ
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      // Đường cong baroque
      ctx.bezierCurveTo(
        startX + direction * 15, startY - 10,
        startX + direction * 25, startY - 15,
        startX + direction * 30, startY - 5
      );
      ctx.bezierCurveTo(
        startX + direction * 35, startY + 5,
        startX + direction * 30, startY + 15,
        startX + direction * 20, startY + 12
      );
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = i % 2 === 0 ? mainColor : accentColor;
      ctx.stroke();
      
      // Điểm nhấn tại đầu mỗi xoắn ốc
      ctx.beginPath();
      ctx.arc(startX + direction * 20, startY + 12, 3, 0, Math.PI * 2);
      ctx.fillStyle = lightColor;
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    
    // 5. Trang trí viền ren đơn giản
    // Vẽ hoa văn mô phỏng viền ren ở cạnh ngoài
    const scallops = 5;
    const scallopsSpacing = size * 0.15;
    
    for (let i = 1; i <= scallops; i++) {
      ctx.beginPath();
      const scallionX = direction * (i * scallopsSpacing);
      
      // Vẽ nửa hình bầu dục nhỏ
      const semiOvalHeight = 4;
      const semiOvalWidth = scallopsSpacing * 0.4;
      
      ctx.ellipse(
        scallionX, 0,
        semiOvalWidth, semiOvalHeight,
        0, 0, Math.PI,
        true
      );
      
      ctx.strokeStyle = i % 2 === 0 ? accentColor : mainColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // 6. Thêm điểm nhấn trang trí cuối
    const endX = direction * size * 0.8;
    ctx.beginPath();
    ctx.arc(endX, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();
    
    // 7. Tạo đường trang trí phụ (như đường chỉ dát vàng)
    ctx.beginPath();
    if (!isRight) {
      ctx.moveTo(size * 0.25, -2);
      ctx.lineTo(size * 0.65, -2);
    } else {
      ctx.moveTo(-size * 0.25, -2);
      ctx.lineTo(-size * 0.65, -2);
    }
    ctx.strokeStyle = lightColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.restore();
  } catch (error) {
    console.error('Error drawing corner ornament:', error);
  }
}

/**
 * Vẽ hoa văn ở hai bên chứng nhận
 */
async function drawSideOrnaments(ctx, canvasWidth, canvasHeight) {
  try {
    // Khoảng cách từ mép canvas đến hoa văn
    const margin = 120;
    
    // Màu sắc - đồng nhất với viền chứng nhận
    const mainColor = '#e6b17e'; // Vàng đồng
    const accentColor = '#c69c6d'; // Vàng đồng đậm hơn
    const lightColor = '#f0d4a9'; // Vàng đồng nhạt
    
    // Vẽ hoa văn dọc hai bên
    const ornamentHeight = canvasHeight - 400;
    const ornamentTop = 250;
    
    ctx.save();
    
    // === Vẽ họa tiết bên trái ===
    
    // 1. Đường cong chính uyển chuyển
    ctx.beginPath();
    ctx.moveTo(margin, ornamentTop);
    
    // Tạo đường cong nền
    const segments = 8;
    const segmentHeight = ornamentHeight / segments;
    
    for (let i = 0; i < segments; i++) {
      const y = ornamentTop + i * segmentHeight;
      const amplitude = 18 * Math.sin(i * Math.PI / 2);
      
      ctx.bezierCurveTo(
        margin + amplitude, y + segmentHeight / 3,
        margin + amplitude * 0.8, y + 2 * segmentHeight / 3,
        margin, y + segmentHeight
      );
    }
    
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 2. Đường song song mảnh hơn
    ctx.beginPath();
    ctx.moveTo(margin + 10, ornamentTop + 5);
    
    for (let i = 0; i < segments; i++) {
      const y = ornamentTop + i * segmentHeight;
      const amplitude = 12 * Math.sin(i * Math.PI / 2 + Math.PI / 6);
      
      ctx.bezierCurveTo(
        margin + amplitude + 10, y + segmentHeight / 3,
        margin + amplitude * 0.8 + 10, y + 2 * segmentHeight / 3,
        margin + 10, y + segmentHeight
      );
    }
    
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 3. Vẽ họa tiết xoắn ốc kiểu baroque
    // Vị trí của các họa tiết baroque
    const ornamentPositions = [
      ornamentTop + ornamentHeight * 0.25,
      ornamentTop + ornamentHeight * 0.5,
      ornamentTop + ornamentHeight * 0.75
    ];
    
    ornamentPositions.forEach((y, index) => {
      // Kích thước dựa vào vị trí, tạo thay đổi nhẹ
      const scrollSize = 30 + (index % 2) * 5;
      
      // Xoắn ốc hướng ra ngoài
      ctx.beginPath();
      ctx.moveTo(margin, y);
      
      // Cánh trái
      ctx.bezierCurveTo(
        margin - scrollSize * 0.3, y - scrollSize * 0.4,
        margin - scrollSize * 0.7, y - scrollSize * 0.5,
        margin - scrollSize, y - scrollSize * 0.2
      );
      
      // Uốn cong trở lại
      ctx.bezierCurveTo(
        margin - scrollSize * 1.1, y,
        margin - scrollSize, y + scrollSize * 0.2,
        margin - scrollSize * 0.8, y + scrollSize * 0.1
      );
      
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Thêm chi tiết mảnh hơn
      ctx.beginPath();
      ctx.moveTo(margin - scrollSize * 0.2, y);
      ctx.bezierCurveTo(
        margin - scrollSize * 0.4, y - scrollSize * 0.3,
        margin - scrollSize * 0.8, y - scrollSize * 0.35,
        margin - scrollSize * 0.9, y - scrollSize * 0.1
      );
      
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Điểm nhấn
      ctx.beginPath();
      ctx.arc(margin, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = mainColor;
      ctx.fill();
      
      // Điểm nhấn ở đầu xoắn ốc
      ctx.beginPath();
      ctx.arc(margin - scrollSize * 0.8, y + scrollSize * 0.1, 3, 0, Math.PI * 2);
      ctx.fillStyle = lightColor;
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
    
    // 4. Vẽ các điểm trang trí dọc theo đường cong
    for (let i = 0; i <= segments; i += 2) {
      const y = ornamentTop + i * segmentHeight;
      
      ctx.beginPath();
      ctx.arc(margin, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = mainColor;
      ctx.fill();
    }
    
    // === Vẽ họa tiết bên phải (tương tự nhưng đối xứng) ===
    
    // 1. Đường cong chính
    ctx.beginPath();
    ctx.moveTo(canvasWidth - margin, ornamentTop);
    
    for (let i = 0; i < segments; i++) {
      const y = ornamentTop + i * segmentHeight;
      const amplitude = 18 * Math.sin(i * Math.PI / 2);
      
      ctx.bezierCurveTo(
        canvasWidth - margin - amplitude, y + segmentHeight / 3,
        canvasWidth - margin - amplitude * 0.8, y + 2 * segmentHeight / 3,
        canvasWidth - margin, y + segmentHeight
      );
    }
    
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 2. Đường song song mảnh hơn
    ctx.beginPath();
    ctx.moveTo(canvasWidth - margin - 10, ornamentTop + 5);
    
    for (let i = 0; i < segments; i++) {
      const y = ornamentTop + i * segmentHeight;
      const amplitude = 12 * Math.sin(i * Math.PI / 2 + Math.PI / 6);
      
      ctx.bezierCurveTo(
        canvasWidth - margin - amplitude - 10, y + segmentHeight / 3,
        canvasWidth - margin - amplitude * 0.8 - 10, y + 2 * segmentHeight / 3,
        canvasWidth - margin - 10, y + segmentHeight
      );
    }
    
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 3. Vẽ họa tiết xoắn ốc kiểu baroque bên phải
    ornamentPositions.forEach((y, index) => {
      // Kích thước dựa vào vị trí, tạo thay đổi nhẹ
      const scrollSize = 30 + (index % 2) * 5;
      
      // Xoắn ốc hướng ra ngoài (đối xứng với bên trái)
      ctx.beginPath();
      ctx.moveTo(canvasWidth - margin, y);
      
      // Cánh phải (đối xứng)
      ctx.bezierCurveTo(
        canvasWidth - margin + scrollSize * 0.3, y - scrollSize * 0.4,
        canvasWidth - margin + scrollSize * 0.7, y - scrollSize * 0.5,
        canvasWidth - margin + scrollSize, y - scrollSize * 0.2
      );
      
      // Uốn cong trở lại
      ctx.bezierCurveTo(
        canvasWidth - margin + scrollSize * 1.1, y,
        canvasWidth - margin + scrollSize, y + scrollSize * 0.2,
        canvasWidth - margin + scrollSize * 0.8, y + scrollSize * 0.1
      );
      
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Thêm chi tiết mảnh hơn
      ctx.beginPath();
      ctx.moveTo(canvasWidth - margin + scrollSize * 0.2, y);
      ctx.bezierCurveTo(
        canvasWidth - margin + scrollSize * 0.4, y - scrollSize * 0.3,
        canvasWidth - margin + scrollSize * 0.8, y - scrollSize * 0.35,
        canvasWidth - margin + scrollSize * 0.9, y - scrollSize * 0.1
      );
      
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Điểm nhấn
      ctx.beginPath();
      ctx.arc(canvasWidth - margin, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = mainColor;
      ctx.fill();
      
      // Điểm nhấn ở đầu xoắn ốc
      ctx.beginPath();
      ctx.arc(canvasWidth - margin + scrollSize * 0.8, y + scrollSize * 0.1, 3, 0, Math.PI * 2);
      ctx.fillStyle = lightColor;
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
    
    // 4. Vẽ các điểm trang trí
    for (let i = 0; i <= segments; i += 2) {
      const y = ornamentTop + i * segmentHeight;
      
      ctx.beginPath();
      ctx.arc(canvasWidth - margin, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = mainColor;
      ctx.fill();
    }
    
    // 5. Họa tiết tinh tế ở giữa
    // Thêm các đường ngang tinh tế cách điệu
    const linePositions = [
      ornamentTop + ornamentHeight * 0.15,
      ornamentTop + ornamentHeight * 0.38,
      ornamentTop + ornamentHeight * 0.62,
      ornamentTop + ornamentHeight * 0.85
    ];
    
    linePositions.forEach((y, index) => {
      const lineLength = 25 + (index % 2) * 10;
      
      // Đường bên trái
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.bezierCurveTo(
        margin - lineLength * 0.5, y - 3,
        margin - lineLength * 0.7, y + 3,
        margin - lineLength, y
      );
      
      ctx.strokeStyle = index % 2 === 0 ? mainColor : accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Đường bên phải (đối xứng)
      ctx.beginPath();
      ctx.moveTo(canvasWidth - margin, y);
      ctx.bezierCurveTo(
        canvasWidth - margin + lineLength * 0.5, y - 3,
        canvasWidth - margin + lineLength * 0.7, y + 3,
        canvasWidth - margin + lineLength, y
      );
      
      ctx.strokeStyle = index % 2 === 0 ? mainColor : accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    
    ctx.restore();
  } catch (error) {
    console.error('Error drawing side ornaments:', error);
  }
}

/**
 * @desc    Verify if user can get certificate
 * @route   GET /api/v1/certificates/verify/:eventId/:userId
 * @access  Private
 */
exports.verifyCertificateEligibility = async (req, res, next) => {
  try {
    const { eventId, userId } = req.params;
    
    // Kiểm tra sự tồn tại của sự kiện
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }

    // Kiểm tra sự tồn tại của người dùng
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Xác minh quyền truy cập
    const isAdmin = req.user.role === 'admin';
    const isEventOrganizer = event.organizer.toString() === req.user.id;
    const isRequestingOwnCertificate = userId === req.user.id;

    if (!isAdmin && !isEventOrganizer && !isRequestingOwnCertificate) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập vào tài nguyên này'
      });
    }

    // ĐIỀU KIỆN CẤP CHỨNG NHẬN:
    // 1. Sự kiện đã kết thúc
    const eventEnded = new Date(event.endDate) < new Date();
    
    // 2. Người dùng đã đăng ký tham gia sự kiện
    const isRegistered = event.participants.some(p => p.toString() === userId);
    
    // 3. Người dùng đã check-in tại sự kiện
    const hasCheckedIn = await Checkin.exists({
      event: eventId,
      user: userId
    });

    // 4. Tổng hợp các điều kiện
    const isEligible = eventEnded && isRegistered && hasCheckedIn;

    // Trả về kết quả
    return res.status(200).json({
      success: true,
      data: {
        eventName: event.title,
        eventDate: event.startDate,
        canGenerateCertificate: isEligible,
        conditions: {
          eventEnded,
          isRegistered,
          hasCheckedIn
        }
      }
    });
  } catch (error) {
    console.error('Error verifying certificate eligibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xác minh điều kiện nhận chứng nhận'
    });
  }
};