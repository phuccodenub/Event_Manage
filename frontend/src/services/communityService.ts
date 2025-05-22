import apiClient from '../api/apiClient';

interface Community {
  _id: string;
  name: string;
  description: string;
  leader: {
    _id: string;
    fullName: string;
    avatar: {
      url: string;
    };
  };
  deputies: Array<{
    _id: string;
    fullName: string;
    avatar: {
      url: string;
    };
  }>;
  members: Array<{
    _id: string;
    user: {
      _id: string;
      fullName: string;
      avatar: {
        url: string;
      };
    };
    status: string;
    joinedAt: string;
  }>;
  pendingRequests: Array<{
    _id: string;
    user: {
      _id: string;
      fullName: string;
      avatar: {
        url: string;
      };
    };
    status: 'pending' | 'approved' | 'rejected';
    requestDate: string;
  }>;
  events: Array<string>;
  avatar: {
    public_id: string | null;
    url: string;
  };
  banner: {
    public_id: string | null;
    url: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const communityService = {
  // Lấy danh sách tất cả communities
  getAllCommunities: async (): Promise<Community[]> => {
    try {
      const response = await apiClient.get('/community');
    return response.data.communities;
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách cộng đồng:', error);
      throw {
        message: error.message || 'Không thể lấy danh sách cộng đồng',
        status: error.status || 500
      };
    }
  },

  // Lấy chi tiết một community
  getCommunityDetails: async (id: string): Promise<Community> => {
    try {
      const response = await apiClient.get(`/community/${id}`);
    return response.data.community;
    } catch (error: any) {
      console.error(`Lỗi khi lấy chi tiết cộng đồng ${id}:`, error);
      throw {
        message: error.message || `Không thể lấy thông tin cộng đồng với ID: ${id}`,
        status: error.status || 500
      };
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
    const response = await apiClient.post('/community/new', data);
    return response.data.community;
    } catch (error: any) {
      console.error('Lỗi khi tạo cộng đồng mới:', error);
      throw {
        message: error.message || 'Không thể tạo cộng đồng mới',
        status: error.status || 500
      };
    }
  },

  // Gửi yêu cầu tham gia community
  requestToJoin: async (communityId: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post(`/community/${communityId}/join`);
    return response.data;
    } catch (error: any) {
      console.error(`Lỗi khi gửi yêu cầu tham gia cộng đồng ${communityId}:`, error);
      throw {
        message: error.message || 'Không thể gửi yêu cầu tham gia cộng đồng',
        status: error.status || 500
      };
    }
  },

  // Xử lý yêu cầu tham gia (dành cho leader)
  handleJoinRequest: async (
    requestId: string,
    status: 'approved' | 'rejected'
  ): Promise<{ message: string }> => {
    try {
      const response = await apiClient.put(`/community/requests/${requestId}`, {
      status,
    });
    return response.data;
    } catch (error: any) {
      console.error(`Lỗi khi xử lý yêu cầu tham gia ${requestId}:`, error);
      throw {
        message: error.message || 'Không thể xử lý yêu cầu tham gia',
        status: error.status || 500
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
      const response = await apiClient.put(`/community/${id}`, data);
    return response.data.community;
    } catch (error: any) {
      console.error(`Lỗi khi cập nhật cộng đồng ${id}:`, error);
      throw {
        message: error.message || 'Không thể cập nhật thông tin cộng đồng',
        status: error.status || 500
      };
    }
  },

  // Xóa community
  deleteCommunity: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete(`/community/${id}`);
    return response.data;
    } catch (error: any) {
      console.error(`Lỗi khi xóa cộng đồng ${id}:`, error);
      throw {
        message: error.message || 'Không thể xóa cộng đồng',
        status: error.status || 500
      };
    }
  },

  // Tìm kiếm community
  searchCommunities: async (keyword: string): Promise<Community[]> => {
    try {
      const response = await apiClient.get(`/community/search?keyword=${keyword}`);
    return response.data.communities;
    } catch (error: any) {
      console.error('Lỗi khi tìm kiếm cộng đồng:', error);
      throw {
        message: error.message || 'Không thể thực hiện tìm kiếm',
        status: error.status || 500
      };
    }
  },
};

export default communityService;
export type { Community };