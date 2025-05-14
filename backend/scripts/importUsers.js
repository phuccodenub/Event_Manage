const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars bằng đường dẫn tuyệt đối cố định
dotenv.config({ path: 'D:/Event_Management_Hutech/backend/.env' });

// Kiểm tra và đặt giá trị mặc định cho MONGODB_URI nếu không tìm thấy
if (!process.env.MONGODB_URI) {
  console.log('MONGODB_URI không được tìm thấy trong file .env, sử dụng giá trị mặc định');
  process.env.MONGODB_URI = 'mongodb://localhost:27017/event_management'; 
}

// Connect to DB
console.log('Đang kết nối tới MongoDB:', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Import User model
const User = require('../models/userModel');

// Function to generate random Vietnamese names
const generateVietnameseName = (gender = null) => {
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
  
  // Middle names by gender
  const maleMiddleNames = ['Văn', 'Đức', 'Quang', 'Minh', 'Thanh', 'Hữu', 'Anh', 'Tuấn', 'Đình', 'Xuân', 'Bảo', 'Thái'];
  const femaleMiddleNames = ['Thị', 'Ngọc', 'Hoài', 'Hồng', 'Thanh', 'Minh', 'Anh', 'Thùy', 'Phương', 'Kim', 'Mỹ', 'Thúy'];
  
  const maleLastNames = ['An', 'Anh', 'Bảo', 'Công', 'Cường', 'Đạt', 'Đức', 'Dũng', 'Duy', 'Hải', 'Hiếu', 'Hoàng', 'Hùng', 'Hưng', 'Khang', 'Khánh', 'Lâm', 'Long', 'Minh', 'Nam', 'Nghĩa', 'Nhân', 'Phong', 'Phúc', 'Quân', 'Quang', 'Quyết', 'Tâm', 'Thái', 'Thành', 'Thịnh', 'Thiện', 'Tiến', 'Toàn', 'Trung', 'Tuấn', 'Tùng', 'Việt'];
  const femaleLastNames = ['Anh', 'Chi', 'Diệp', 'Diễm', 'Giang', 'Hà', 'Hạnh', 'Hiền', 'Hoa', 'Hoài', 'Hương', 'Khánh', 'Lan', 'Linh', 'Loan', 'Mai', 'My', 'Nga', 'Ngọc', 'Như', 'Nhi', 'Nhiên', 'Phương', 'Quỳnh', 'Thảo', 'Thơ', 'Trang', 'Trinh', 'Tuyết', 'Uyên', 'Vân', 'Yến'];
  
  let userGender = gender;
  if (userGender === null) {
    userGender = Math.random() < 0.5 ? 'nam' : 'nữ';
  }
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const middleName = userGender === 'nam' 
    ? maleMiddleNames[Math.floor(Math.random() * maleMiddleNames.length)]
    : femaleMiddleNames[Math.floor(Math.random() * femaleMiddleNames.length)];
  const lastName = userGender === 'nam'
    ? maleLastNames[Math.floor(Math.random() * maleLastNames.length)]
    : femaleLastNames[Math.floor(Math.random() * femaleLastNames.length)];
  
  return {
    fullName: `${firstName} ${middleName} ${lastName}`,
    gender: userGender
  };
};

// Generate date of birth based on student batch (khóa)
const generateBirthday = (batch) => {
  const birthYear = 1982 + batch; // Ví dụ: khóa 22 = sinh năm 2004
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, month, day);
};

// Generate random phone number
const generatePhoneNumber = () => {
  const prefixes = ['03', '05', '07', '08', '09'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let number = '';
  for (let i = 0; i < 8; i++) {
    number += Math.floor(Math.random() * 10);
  }
  return prefix + number;
};

// Generate random email based on name
const generateEmail = (fullName, domain = 'hutech.edu.vn') => {
  // Remove Vietnamese diacritics and normalize
  const normalizedName = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '.');
  
  // Add random number to ensure uniqueness
  const randomNum = Math.floor(Math.random() * 1000);
  return `${normalizedName}${randomNum}@${domain}`;
};

// Generate username based on name
const generateUsername = (fullName) => {
  // Remove Vietnamese diacritics and normalize
  const normalizedName = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');
  
  // Add random number to ensure uniqueness
  const randomNum = Math.floor(Math.random() * 1000);
  return `${normalizedName}${randomNum}`;
};

// Generate student ID with specified batch and fixed prefix
const generateStudentId = (batch) => {
  // Format: 2280601822 where 22 is batch, 806018 is fixed, and last 2 are random
  let id = `${batch}806018`;
  // Add 4 random digits
  for (let i = 0; i < 4; i++) {
    id += Math.floor(Math.random() * 10);
  }
  return id;
};

// Generate admin ID
const generateAdminId = (index) => {
  return `ADMIN${(10000 + index).toString().padStart(5, '0')}`;
};

// Generate teacher ID
const generateTeacherId = (index) => {
  return `TEACHER${(10000 + index).toString().padStart(3, '0')}`;
};

// Generate structured class name (e.g., 22DTHE3)
const generateClassName = (batch) => {
  // Các ngành học
  const majors = ['DTH', 'ATT', 'KPM', 'DLK', 'MMT', 'NTT', 'HTT', 'KDL'];
  // Các lớp
  const classTypes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  const major = majors[Math.floor(Math.random() * majors.length)];
  const classType = classTypes[Math.floor(Math.random() * classTypes.length)];
  const classNumber = Math.floor(Math.random() * 9) + 1;
  
  return `${batch}${major}${classType}${classNumber}`;
};

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Main function to create users
const createUsers = async () => {
  try {
    // KHÔNG xóa dữ liệu hiện có, như yêu cầu
    console.log('Bắt đầu tạo user mới mà không xóa dữ liệu hiện có');

    const hashedPassword = await hashPassword('password123');
    const users = [];

    // Create 5 admin users
    for (let i = 0; i < 5; i++) {
      const { fullName, gender } = generateVietnameseName();
      users.push({
        username: generateUsername(fullName),
        password: hashedPassword,
        fullName,
        email: generateEmail(fullName, 'admin.hutech.edu.vn'),
        gender,
        role: 'admin',
        userId: generateAdminId(i),
        phone: generatePhoneNumber(),
        birthday: new Date(1985 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        oauthProvider: 'local'
      });
    }

    // Create 10 teacher users
    for (let i = 0; i < 10; i++) {
      const { fullName, gender } = generateVietnameseName();
      users.push({
        username: generateUsername(fullName),
        password: hashedPassword,
        fullName,
        email: generateEmail(fullName, 'lecturer.hutech.edu.vn'),
        gender,
        role: 'teacher',
        userId: generateTeacherId(i),
        phone: generatePhoneNumber(),
        birthday: new Date(1975 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        oauthProvider: 'local'
      });
    }

    // Phân bố số lượng sinh viên theo khóa
    const batchDistribution = [
      { batch: 21, count: 20 }, // 20 sinh viên khóa 21
      { batch: 22, count: 35 }, // 35 sinh viên khóa 22
      { batch: 23, count: 30 }  // 30 sinh viên khóa 23
    ];

    // Create student users according to batch distribution
    for (const { batch, count } of batchDistribution) {
      for (let i = 0; i < count; i++) {
        const { fullName, gender } = generateVietnameseName();
        const className = generateClassName(batch);
        const studentId = generateStudentId(batch);
        users.push({
          username: generateUsername(fullName),
          password: hashedPassword,
          fullName,
          email: generateEmail(fullName),
          gender,
          role: 'student',
          userId: studentId,
          class: className,
          phone: generatePhoneNumber(),
          birthday: generateBirthday(batch),
          oauthProvider: 'local'
        });
      }
    }

    // Insert to database
    await User.insertMany(users);
    console.log(`Đã thêm thành công ${users.length} user vào database`);

    // Save users to JSON file for reference
    fs.writeFileSync(
      path.join(__dirname, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log('Đã lưu danh sách user vào file users.json');

    // Log count of each role
    const adminCount = users.filter(user => user.role === 'admin').length;
    const teacherCount = users.filter(user => user.role === 'teacher').length;
    const studentCount = users.filter(user => user.role === 'student').length;
    const batchCounts = batchDistribution.map(({ batch }) => {
      return {
        batch,
        count: users.filter(user => user.role === 'student' && user.class?.startsWith(batch.toString())).length
      };
    });

    console.log(`Tổng số admin: ${adminCount}`);
    console.log(`Tổng số giảng viên: ${teacherCount}`);
    console.log(`Tổng số sinh viên: ${studentCount}`);
    console.log('Phân bố sinh viên theo khóa:');
    batchCounts.forEach(({ batch, count }) => {
      console.log(`- Khóa ${batch}: ${count} sinh viên`);
    });

    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('Đã ngắt kết nối database');
  } catch (error) {
    console.error('Lỗi khi tạo users:', error);
    process.exit(1);
  }
};

// Execute the function
createUsers(); 