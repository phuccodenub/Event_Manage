require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Models
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const Department = require('../models/departmentModel');
const RegistrationForm = require('../models/registrationFormModel');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventManagement';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Function to upload image to cloudinary
const uploadToCloudinary = async (filePath, folder = 'events') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto' }]
    });
    return {
      public_id: result.public_id,
      url: result.secure_url
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Error uploading to Cloudinary');
  }
};

// Get all image paths from temp_img folder
const getImagesFromFolder = () => {
  const imgFolder = path.join(__dirname, 'temp_img');
  return fs.readdirSync(imgFolder)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', ''].includes(ext);
    })
    .map(file => path.join(imgFolder, file));
};

// Main function to import events
const importEvents = async () => {
  try {
    // Check if events already exist
    // const count = await Event.countDocuments();
    // if (count > 0) {
    //   console.log('Events already exist in the database. Skipping import.');
    //   return;
    // }

    // Get admin user for creator/organizer
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('Admin user not found. Please import users first.');
      process.exit(1);
    }

    // Get a department
    const department = await Department.findOne();
    if (!department) {
      console.error('No department found. Please create departments first.');
      process.exit(1);
    }

    // Get some teachers/speakers
    const speakers = await User.find({ role: 'teacher' }).limit(5);
    if (speakers.length === 0) {
      console.error('No teachers found for speakers. Please import users first.');
      process.exit(1);
    }

    // Get collaborators
    const collaborators = await User.find({ role: { $in: ['teacher', 'student'] } }).limit(10);

    // Get images
    const imagePaths = getImagesFromFolder();
    if (imagePaths.length < 10) {
      console.error('Not enough images in temp_img folder. Need at least 10 images.');
      process.exit(1);
    }

    // Event templates
    const eventTemplates = [
      {
        title: 'Hội thảo Công nghệ Blockchain và Ứng dụng',
        description: 'Hội thảo chuyên sâu về công nghệ Blockchain, chuỗi khối và các ứng dụng trong thực tiễn. Các chuyên gia sẽ chia sẻ kinh nghiệm và xu hướng phát triển mới nhất trong lĩnh vực này.',
        tags: ['blockchain', 'technology', 'innovation', 'crypto'],
        eventType: 'hybrid',
        category: 'seminar',
        location: {
          physical: { address: 'Trường Đại học HUTECH, 475A Điện Biên Phủ, Bình Thạnh, TP.HCM', room: 'E6.1' },
          online: { platform: 'Zoom', meetingLink: 'https://zoom.us/j/123456789', meetingId: '123456789', password: 'blockchain' }
        },
        maxParticipants: { offline: 100, online: 500 },
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours duration
        visibility: 'public',
        isRegistrationRequired: true,
        capacity: 600,
        needsRegistrationForm: true,
        needsVolunteers: true,
        maxVolunteers: 10
      },
      {
        title: 'Workshop Thiết kế UX/UI cho Ứng dụng Di động',
        description: 'Workshop thực hành về thiết kế trải nghiệm người dùng (UX) và giao diện người dùng (UI) cho ứng dụng di động. Học viên sẽ được thực hành trực tiếp với các công cụ thiết kế chuyên nghiệp.',
        tags: ['design', 'UX/UI', 'mobile', 'figma'],
        eventType: 'offline',
        category: 'workshop',
        location: {
          physical: { address: 'Trường Đại học HUTECH, 475A Điện Biên Phủ, Bình Thạnh, TP.HCM', room: 'E3.2' }
        },
        maxParticipants: { offline: 50 },
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours duration
        visibility: 'public',
        isRegistrationRequired: true,
        capacity: 50,
        needsRegistrationForm: true,
        needsVolunteers: true,
        maxVolunteers: 5
      },
      {
        title: 'Ngày hội Việc làm CNTT 2023',
        description: 'Sự kiện kết nối sinh viên IT với các doanh nghiệp hàng đầu trong ngành công nghệ thông tin. Cơ hội tìm việc làm, thực tập và giao lưu với các chuyên gia IT.',
        tags: ['job fair', 'IT', 'career', 'networking'],
        eventType: 'offline',
        category: 'career',
        location: {
          physical: { address: 'Trường Đại học HUTECH, 475A Điện Biên Phủ, Bình Thạnh, TP.HCM', room: 'Hội trường lớn' }
        },
        maxParticipants: { offline: 500 },
        startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 9 hours duration
        visibility: 'public',
        isRegistrationRequired: true,
        capacity: 500,
        needsRegistrationForm: true,
        needsVolunteers: true,
        maxVolunteers: 30
      },
      {
        title: 'Hội thảo Machine Learning và AI trong Y tế',
        description: 'Hội thảo chuyên đề về ứng dụng Machine Learning và Trí tuệ nhân tạo trong lĩnh vực y tế. Các chuyên gia sẽ chia sẻ về các nghiên cứu và ứng dụng mới nhất của AI trong chẩn đoán và điều trị bệnh.',
        tags: ['AI', 'machine learning', 'healthcare', 'technology'],
        eventType: 'online',
        category: 'seminar',
        location: {
          online: { platform: 'Microsoft Teams', meetingLink: 'https://teams.microsoft.com/l/meetup-join/123', meetingId: 'ai_healthcare', password: 'aihealth2023' }
        },
        maxParticipants: { online: 300 },
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours duration
        visibility: 'public',
        isRegistrationRequired: true,
        capacity: 300,
        needsRegistrationForm: true,
        needsVolunteers: false
      },
      {
        title: 'Cuộc thi Lập trình Thuật toán',
        description: 'Cuộc thi thường niên dành cho sinh viên đam mê lập trình và thuật toán. Thí sinh sẽ giải quyết các bài toán thuật toán trong thời gian giới hạn, với nhiều giải thưởng hấp dẫn.',
        tags: ['programming', 'algorithm', 'competition', 'coding'],
        eventType: 'offline',
        category: 'academic',
        location: {
          physical: { address: 'Trường Đại học HUTECH, 475A Điện Biên Phủ, Bình Thạnh, TP.HCM', room: 'E2.5' }
        },
        maxParticipants: { offline: 150 },
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours duration
        visibility: 'public',
        isRegistrationRequired: true,
        capacity: 150,
        needsRegistrationForm: true,
        needsVolunteers: true,
        maxVolunteers: 15
      },
      {
        title: 'Talkshow: Khởi nghiệp trong lĩnh vực Công nghệ',
        description: 'Talkshow với các doanh nhân thành công trong lĩnh vực công nghệ. Chia sẻ kinh nghiệm khởi nghiệp, gọi vốn và phát triển sản phẩm công nghệ từ ý tưởng đến thành công.',
        tags: ['startup', 'entrepreneurship', 'technology', 'innovation'],
        eventType: 'hybrid',
        category: 'seminar',
        location: {
          physical: { address: 'Trường Đại học HUTECH, 475A Điện Biên Phủ, Bình Thạnh, TP.HCM', room: 'E1.3' },
          online: { platform: 'Zoom', meetingLink: 'https://zoom.us/j/987654321', meetingId: '987654321', password: 'startup' }
        },
        maxParticipants: { offline: 120, online: 400 },
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours duration
        visibility: 'public',
        isRegistrationRequired: true,
        capacity: 520,
        needsRegistrationForm: true,
        needsVolunteers: true,
        maxVolunteers: 10
      },
      {
        title: 'Workshop: Game Development with Unity',
        description: 'Workshop thực hành về phát triển game với Unity. Học viên sẽ được hướng dẫn cách tạo một game 2D đơn giản từ đầu đến cuối, học các kỹ thuật cơ bản trong phát triển game.',
        tags: ['game development', 'unity', 'programming', 'design'],
        eventType: 'offline',
        category: 'workshop',
        location: {
          physical: { address: 'Trường Đại học HUTECH, 475A Điện Biên Phủ, Bình Thạnh, TP.HCM', room: 'E4.2' }
        },
        maxParticipants: { offline: 40 },
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours duration
        visibility: 'public',
        isRegistrationRequired: true,
        capacity: 40,
        needsRegistrationForm: true,
        needsVolunteers: true,
        maxVolunteers: 5
      },
      {
        title: 'Hội nghị Khoa học Sinh viên IT 2023',
        description: 'Hội nghị khoa học dành cho sinh viên IT để trình bày các nghiên cứu, dự án và sáng kiến trong lĩnh vực công nghệ thông tin. Cơ hội để sinh viên chia sẻ và học hỏi từ những nghiên cứu của nhau.',
        tags: ['research', 'science', 'technology', 'academic'],
        eventType: 'hybrid',
        category: 'academic',
        location: {
          physical: { address: 'Trường Đại học HUTECH, 475A Điện Biên Phủ, Bình Thạnh, TP.HCM', room: 'Hội trường B' },
          online: { platform: 'Google Meet', meetingLink: 'https://meet.google.com/abc-def-ghi', meetingId: 'abc-def-ghi', password: '' }
        },
        maxParticipants: { offline: 200, online: 300 },
        startDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours duration
        visibility: 'public',
        isRegistrationRequired: true,
        capacity: 500,
        needsRegistrationForm: true,
        needsVolunteers: true,
        maxVolunteers: 20
      },
      {
        title: 'Workshop: Data Science và Phân tích Dữ liệu',
        description: 'Workshop thực hành về khoa học dữ liệu và phân tích dữ liệu với Python. Học viên sẽ được hướng dẫn sử dụng các thư viện như Pandas, NumPy, và Matplotlib để phân tích và trực quan hóa dữ liệu.',
        tags: ['data science', 'python', 'analytics', 'visualization'],
        eventType: 'offline',
        category: 'workshop',
        location: {
          physical: { address: 'Trường Đại học HUTECH, 475A Điện Biên Phủ, Bình Thạnh, TP.HCM', room: 'E3.5' }
        },
        maxParticipants: { offline: 60 },
        startDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
        endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), // 7 hours duration
        visibility: 'public',
        isRegistrationRequired: true,
        capacity: 60,
        needsRegistrationForm: true,
        needsVolunteers: true,
        maxVolunteers: 8
      },
      {
        title: 'Tech Talk: Tương lai của Metaverse và Web 3.0',
        description: 'Tech Talk về tương lai của Metaverse và Web 3.0, những công nghệ đang định hình lại internet trong tương lai. Các diễn giả sẽ thảo luận về tiềm năng, thách thức và cơ hội trong lĩnh vực này.',
        tags: ['metaverse', 'web3', 'blockchain', 'future tech'],
        eventType: 'online',
        category: 'seminar',
        location: {
          online: { platform: 'Zoom', meetingLink: 'https://zoom.us/j/111222333', meetingId: '111222333', password: 'metaverse' }
        },
        maxParticipants: { online: 250 },
        startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
        endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
        visibility: 'public',
        isRegistrationRequired: true,
        capacity: 250,
        needsRegistrationForm: true,
        needsVolunteers: false
      }
    ];

    console.log('Starting event import process...');
    console.log(`Found ${imagePaths.length} images in temp_img folder`);

    // Create events
    for (let i = 0; i < Math.min(10, imagePaths.length); i++) {
      const template = eventTemplates[i];
      const imgPath = imagePaths[i];

      // Prepare event data following eventController.js structure
      const eventData = { ...template };
      
      // Handle booleans
      eventData.needsRegistrationForm = template.needsRegistrationForm === true;
      eventData.needsVolunteers = template.needsVolunteers === true;
      eventData.maxVolunteers = parseInt(template.maxVolunteers) || 0;
      
      // Upload and add image
      console.log(`Uploading image for event ${i+1}: ${template.title}`);
      try {
        const uploadedImage = await uploadToCloudinary(imgPath);
        eventData.images = [uploadedImage];
      } catch (error) {
        console.error(`Error uploading image for event ${i+1}:`, error);
        eventData.images = []; // Set empty images if upload fails
      }

      // Randomly select 1-3 speakers for this event
      const numSpeakers = Math.floor(Math.random() * 3) + 1;
      const eventSpeakers = speakers
        .sort(() => 0.5 - Math.random())
        .slice(0, numSpeakers)
        .map(speaker => speaker._id);

      // Randomly select 2-5 collaborators
      const numCollaborators = Math.floor(Math.random() * 4) + 2;
      const eventCollaborators = collaborators
        .sort(() => 0.5 - Math.random())
        .slice(0, numCollaborators)
        .map(collab => collab._id);

      // Add required fields
      eventData.department = department._id;
      eventData.speakers = eventSpeakers;
      eventData.organizer = admin._id;
      eventData.creator = admin._id;
      eventData.collaborators = eventCollaborators;
      eventData.registrationDeadline = new Date(template.startDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before event

      // Create event first (following eventController.js structure)
      console.log(`Creating event: ${template.title}`);
      try {
        const event = await Event.create(eventData);
        
        // If registration form is needed, create it (following eventController.js logic)
        if (eventData.needsRegistrationForm) {
          try {
            console.log(`Creating registration form for event: ${template.title}`);
            // Use default fields as in eventController.js
            const registrationForm = await RegistrationForm.create({
              event: event._id,
              fields: [
                {
                  fieldId: 'fullName',
                  label: 'Họ và tên',
                  type: 'text',
                  required: true,
                  placeholder: 'Nhập họ và tên'
                },
                {
                  fieldId: 'studentId',
                  label: 'MSSV',
                  type: 'text',
                  required: true,
                  placeholder: 'Nhập mã số sinh viên'
                },
                {
                  fieldId: 'email',
                  label: 'Email',
                  type: 'email',
                  required: true,
                  placeholder: 'Nhập email'
                },
                {
                  fieldId: 'phone',
                  label: 'Số điện thoại',
                  type: 'text',
                  required: false,
                  placeholder: 'Nhập số điện thoại của bạn'
                },
                {
                  fieldId: 'joinMethod',
                  label: 'Bạn tham gia bằng hình thức nào?',
                  type: 'radio',
                  required: true,
                  options: [
                    { label: 'Trực tiếp', value: 'offline' },
                    { label: 'Trực tuyến', value: 'online' }
                  ]
                },
                {
                  fieldId: 'expectation',
                  label: 'Bạn mong đợi gì từ sự kiện này?',
                  type: 'textarea',
                  required: false,
                  placeholder: 'Chia sẻ mong đợi của bạn'
                }
              ],
              active: true,
              createdBy: admin._id
            });

            // Update event with form reference
            event.registrationForm = registrationForm._id;
            await event.save();
            console.log(`Registration form created and linked to event: ${template.title}`);
          } catch (formError) {
            console.error('Error creating registration form:', formError);
          }
        }
        
        // Populate the creator field
        await event.populate('creator');
        console.log(`Successfully created event: ${template.title}`);
      } catch (error) {
        console.error(`Error creating event ${i+1}:`, error);
      }
    }

    console.log('Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

// Run the import
importEvents(); 