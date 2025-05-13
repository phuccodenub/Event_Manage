import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

// Mock data for community - in a real app you would fetch from an API
const getMockCommunityGroups = async () => {
  // Simulate network request
  await new Promise(resolve => setTimeout(resolve, 200));

  return [
    {
      id: 1,
      name: 'Khoa Công nghệ thông tin',
      members: 1200,
      avatar: '/images/it-faculty.jpg',
      description: 'Cộng đồng sinh viên CNTT HUTECH',
      recentActivity: 'Đang thảo luận về Hackathon 2024'
    },
    {
      id: 2,
      name: 'CLB Lập trình HUTECH',
      members: 450,
      avatar: '/images/coding-club.jpg',
      description: 'Nơi giao lưu và học hỏi lập trình',
      recentActivity: 'Workshop React.js sắp diễn ra'
    },
    {
      id: 3,
      name: 'Khoa Quản trị kinh doanh',
      members: 980,
      avatar: '/images/business-faculty.jpg',
      description: 'Cộng đồng sinh viên QTKD HUTECH',
      recentActivity: 'Cuộc thi Khởi nghiệp sinh viên'
    },
    {
      id: 4,
      name: 'CLB Tiếng Anh HUTECH',
      members: 620,
      avatar: '/images/english-club.jpg',
      description: 'Nơi giao lưu và học hỏi tiếng Anh',
      recentActivity: 'Buổi giao lưu với sinh viên quốc tế'
    }
  ];
};

const getMockDiscussions = async () => {
  // Simulate network request
  await new Promise(resolve => setTimeout(resolve, 200));

  return [
    {
      id: 1,
      title: 'Chia sẻ kinh nghiệm thực tập tại FPT Software',
      author: 'Nguyễn Văn A',
      avatar: '/images/user1.jpg',
      tags: ['Thực tập', 'IT', 'Kinh nghiệm'],
      replies: 23,
      views: 156,
      lastActivity: '5 phút trước'
    },
    {
      id: 2,
      title: 'Hỏi về quy trình đăng ký học bổng du học Nhật Bản',
      author: 'Trần Thị B',
      avatar: '/images/user2.jpg',
      tags: ['Học bổng', 'Du học', 'Nhật Bản'],
      replies: 15,
      views: 98,
      lastActivity: '2 giờ trước'
    },
    {
      id: 3,
      title: 'Tìm nhóm làm đồ án tốt nghiệp ngành CNTT',
      author: 'Lê Văn C',
      avatar: '/images/user3.jpg',
      tags: ['Đồ án', 'CNTT', 'Nhóm'],
      replies: 8,
      views: 67,
      lastActivity: '1 ngày trước'
    }
  ];
};

const getMockUpcomingEvents = async () => {
  // Simulate network request
  await new Promise(resolve => setTimeout(resolve, 200));

  return [
    {
      id: 1,
      title: 'Ngày hội việc làm IT HUTECH 2024',
      date: '15/04/2024',
      time: '08:00 AM',
      location: 'Hội trường A',
      participants: 320,
      banner: '/images/job-fair.jpg'
    },
    {
      id: 2,
      title: 'Workshop: Kỹ năng phỏng vấn hiệu quả',
      date: '20/04/2024',
      time: '14:00 PM',
      location: 'Phòng hội thảo B2',
      participants: 120,
      banner: '/images/interview-workshop.jpg'
    },
    {
      id: 3,
      title: 'Hội thảo: Xu hướng công nghệ AI 2024',
      date: '25/04/2024',
      time: '09:00 AM',
      location: 'Hội trường B',
      participants: 250,
      banner: '/images/ai-seminar.jpg'
    }
  ];
};

/**
 * Custom hook for community data with React Query
 * This helps avoid redundant API calls when navigating between pages
 */
export const useCommunityData = () => {
  // Query for community groups
  const groupsQuery = useQuery({
    queryKey: ['communityGroups'],
    queryFn: getMockCommunityGroups,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for discussions
  const discussionsQuery = useQuery({
    queryKey: ['communityDiscussions'],
    queryFn: getMockDiscussions,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Query for upcoming events
  const eventsQuery = useQuery({
    queryKey: ['communityEvents'],
    queryFn: getMockUpcomingEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoize the combined result
  const result = useMemo(() => ({
    // Groups data
    communityGroups: groupsQuery.data || [],
    groupsLoading: groupsQuery.isLoading,
    groupsError: groupsQuery.error,
    refetchGroups: groupsQuery.refetch,
    
    // Discussions data
    discussions: discussionsQuery.data || [],
    discussionsLoading: discussionsQuery.isLoading,
    discussionsError: discussionsQuery.error,
    refetchDiscussions: discussionsQuery.refetch,
    
    // Events data
    upcomingEvents: eventsQuery.data || [],
    eventsLoading: eventsQuery.isLoading,
    eventsError: eventsQuery.error,
    refetchEvents: eventsQuery.refetch,
    
    // Combined loading state
    isLoading: groupsQuery.isLoading || discussionsQuery.isLoading || eventsQuery.isLoading,
  }), [
    groupsQuery.data, groupsQuery.isLoading, groupsQuery.error, groupsQuery.refetch,
    discussionsQuery.data, discussionsQuery.isLoading, discussionsQuery.error, discussionsQuery.refetch,
    eventsQuery.data, eventsQuery.isLoading, eventsQuery.error, eventsQuery.refetch
  ]);

  return result;
}; 