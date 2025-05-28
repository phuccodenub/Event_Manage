import apiClient from '../api/apiClient';

interface Community {
  _id: string;
  name: string;
  description: string;
  leader?: {
    _id: string;
    fullName: string;
    avatar?: {
      url: string;
    };
  };
  createdBy?: string;
  deputies?: Array<{
    _id: string;
    fullName: string;
    avatar?: {
      url: string;
    };
  }>;
  members?: Array<{
    _id?: string;
    user?: {
      _id: string;
      fullName: string;
      avatar?: {
        url: string;
      };
    } | string;
    status: string;
    joinedAt: string;
    role?: string;
    department?: string;
    position?: string;
  }>;
  pendingRequests?: Array<{
    _id: string;
    user: {
      _id: string;
      fullName: string;
      avatar?: {
        url: string;
      };
    };
    status: 'pending' | 'approved' | 'rejected';
    requestDate: string;
  }>;
  events?: Array<string>;
  avatar?: {
    public_id?: string;
    url: string;
  };
  banner?: {
    public_id?: string;
    url: string;
  };
  isActive?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  basicInfo?: any;
  academicInfo?: any;
  posts?: any[];
  achievements?: any[];
  learningResources?: any;
  settings?: any;
  slug?: string;
}

const communityService = {
  // Lấy danh sách tất cả communities
  getAllCommunities: async (): Promise<Community[]> => {
    try {
      const response = await apiClient.get('/communities');
      return response.data.communities || [];
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách cộng đồng:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Không thể lấy danh sách cộng đồng',
        status: error.response?.status || 500
      };
    }
  },

  // Lấy chi tiết một community
  getCommunityDetails: async (id: string): Promise<Community> => {
    try {
      const response = await apiClient.get(`/communities/${id}`);
      return response.data.community;
    } catch (error: any) {
      console.error(`Lỗi khi lấy chi tiết cộng đồng ${id}:`, error);
      throw {
        message: error.response?.data?.message || error.message || `Không thể lấy thông tin cộng đồng với ID: ${id}`,
        status: error.response?.status || 500
      };
    }
  },

  // Lấy danh sách events của một community
  getCommunityEvents: async (communityId: string) => {
    try {
      console.log(`Fetching events for community: ${communityId}`);
      const response = await apiClient.get(`/communities/${communityId}/events`);
      console.log(`Received ${response.data.data?.length || 0} events for community ${communityId}`);
      return response.data.data || [];
    } catch (error: any) {
      console.error(`Lỗi khi lấy sự kiện cộng đồng ${communityId}:`, error);
      
      // Log chi tiết về lỗi auth nếu có
      if (error.status === 401) {
        console.warn('User not authenticated, may not see private events');
      } else if (error.status === 403) {
        console.warn('User does not have permission to view events');
      }
      
      return [];
    }
  },

  // Tạo community mới
  createCommunity: async (data: {
    name: string;
    description: string;
    isActive?: boolean;
    avatar?: {
      public_id?: string;
      url: string;
    };
    banner?: {
      public_id?: string;
      url: string;
    };
  }): Promise<Community> => {
    try {
      const response = await apiClient.post('/communities/new', data);
      return response.data.community;
    } catch (error: any) {
      console.error('Lỗi khi tạo cộng đồng mới:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Không thể tạo cộng đồng mới',
        status: error.response?.status || 500
      };
    }
  },

  // Gửi yêu cầu tham gia community
  requestToJoin: async (communityId: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post(`/communities/${communityId}/join`);
      return response.data;
    } catch (error: any) {
      console.error(`Lỗi khi gửi yêu cầu tham gia cộng đồng ${communityId}:`, error);
      throw {
        message: error.response?.data?.message || error.message || 'Không thể gửi yêu cầu tham gia cộng đồng',
        status: error.response?.status || 500
      };
    }
  },

  // Xử lý yêu cầu tham gia (dành cho leader)
  handleJoinRequest: async (
    requestId: string,
    status: 'approved' | 'rejected'
  ): Promise<{ message: string }> => {
    try {
      const response = await apiClient.put(`/communities/requests/${requestId}`, {
        status,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Lỗi khi xử lý yêu cầu tham gia ${requestId}:`, error);
      throw {
        message: error.response?.data?.message || error.message || 'Không thể xử lý yêu cầu tham gia',
        status: error.response?.status || 500
      };
    }
  },

  // Cập nhật thông tin community
  updateCommunity: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      avatar?: {
        public_id?: string;
        url: string;
      };
      banner?: {
        public_id?: string;
        url: string;
      };
    }
  ): Promise<Community> => {
    try {
      const response = await apiClient.put(`/communities/${id}`, data);
      return response.data.community;
    } catch (error: any) {
      console.error(`Lỗi khi cập nhật cộng đồng ${id}:`, error);
      throw {
        message: error.response?.data?.message || error.message || 'Không thể cập nhật thông tin cộng đồng',
        status: error.response?.status || 500
      };
    }
  },

  // Xóa community
  deleteCommunity: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete(`/communities/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Lỗi khi xóa cộng đồng ${id}:`, error);
      throw {
        message: error.response?.data?.message || error.message || 'Không thể xóa cộng đồng',
        status: error.response?.status || 500
      };
    }
  },

  // Tìm kiếm community
  searchCommunities: async (keyword: string): Promise<Community[]> => {
    try {
      const response = await apiClient.get(`/communities/search?keyword=${encodeURIComponent(keyword)}`);
      return response.data.communities || [];
    } catch (error: any) {
      console.error('Lỗi khi tìm kiếm cộng đồng:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Không thể thực hiện tìm kiếm',
        status: error.response?.status || 500
      };
    }
  },
};

export default communityService;
export type { Community };