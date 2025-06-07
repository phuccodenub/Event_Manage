import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export interface ChatMessage {
  _id: string;
  communityId: string;
  sender: {
    _id: string;
    fullName: string;
    avatar?: { url: string };
  };
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: string;
  edited?: boolean;
  editedAt?: string;
}

export interface SendMessageData {
  communityId: string;
  content: string;
  type: 'text' | 'image' | 'file';
}

class ChatService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get chat history for a community
  async getCommunityMessages(communityId: string, page = 1, limit = 50): Promise<{
    messages: ChatMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/communities/${communityId}/messages`,
        {
          headers: this.getAuthHeaders(),
          params: { page, limit }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching community messages:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải tin nhắn');
    }
  }

  // Send a new message
  async sendMessage(messageData: SendMessageData): Promise<ChatMessage> {
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/communities/${messageData.communityId}/messages`,
        messageData,
        { headers: this.getAuthHeaders() }
      );
      return response.data.message;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(error.response?.data?.message || 'Không thể gửi tin nhắn');
    }
  }

  // Edit a message
  async editMessage(communityId: string, messageId: string, content: string): Promise<ChatMessage> {
    try {
      const response = await axios.put(
        `${API_URL}/api/v1/communities/${communityId}/messages/${messageId}`,
        { content },
        { headers: this.getAuthHeaders() }
      );
      return response.data.message;
    } catch (error: any) {
      console.error('Error editing message:', error);
      throw new Error(error.response?.data?.message || 'Không thể chỉnh sửa tin nhắn');
    }
  }

  // Delete a message
  async deleteMessage(communityId: string, messageId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}/api/v1/communities/${communityId}/messages/${messageId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      console.error('Error deleting message:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa tin nhắn');
    }
  }

  // Upload image for chat
  async uploadChatImage(file: File): Promise<{ url: string; public_id: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${API_URL}/api/v1/upload/chat-image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error uploading chat image:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải lên hình ảnh');
    }
  }

  // Get online members in community chat
  async getOnlineMembers(communityId: string): Promise<string[]> {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/communities/${communityId}/online-members`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.onlineMembers;
    } catch (error: any) {
      console.error('Error fetching online members:', error);
      return [];
    }
  }
}

export default new ChatService(); 