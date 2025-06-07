import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import chatService, { ChatMessage } from '../../services/chatService';
import { IoSend, IoImage, IoHappyOutline, IoEllipsisVertical } from 'react-icons/io5';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CommunityChatProps {
  communityId: string;
  members: any[];
}

const CommunityChat: React.FC<CommunityChatProps> = ({ communityId, members }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useCommunity();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        const data = await chatService.getCommunityMessages(communityId);
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Error loading chat history:', error);
        setMessages([]); // Set empty for now
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [communityId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join community chat room
    socket.emit('community:join-chat', communityId);

    // Listen for new messages
    const handleNewMessage = (message: ChatMessage) => {
      if (message.communityId === communityId) {
        // Remove any temp message from same user
        setMessages(prev => {
          const filteredMessages = prev.filter(msg => !msg._id.startsWith('temp-'));
          return [...filteredMessages, message];
        });
      }
    };

    // Listen for message updates (edit/delete)
    const handleMessageUpdate = (updatedMessage: ChatMessage) => {
      if (updatedMessage.communityId === communityId) {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === updatedMessage._id ? updatedMessage : msg
          )
        );
      }
    };

    socket.on('community:new-message', handleNewMessage);
    socket.on('community:message-updated', handleMessageUpdate);

    return () => {
      socket.off('community:new-message', handleNewMessage);
      socket.off('community:message-updated', handleMessageUpdate);
      socket.emit('community:leave-chat', communityId);
    };
  }, [socket, isConnected, communityId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      const messageData = {
        communityId,
        content: newMessage.trim(),
        type: 'text' as const
      };

      // Optimistic update
      const tempMessage: ChatMessage = {
        _id: `temp-${Date.now()}`,
        communityId,
        content: newMessage.trim(),
        type: 'text',
        sender: {
          _id: user._id || user.id || '',
          fullName: user.fullName,
          avatar: typeof user.avatar === 'string' 
            ? { url: user.avatar }
            : user.avatar && typeof user.avatar === 'object' && 'url' in user.avatar
              ? user.avatar
              : undefined
        },
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');

      // Send via API
      const savedMessage = await chatService.sendMessage(messageData);

      // Send via socket for real-time updates to other users
      if (socket && isConnected) {
        socket.emit('community:send-message', savedMessage);
      }

      // Replace temp message with real message
      setMessages(prev => 
        prev.map(msg => 
          msg._id.startsWith('temp-') ? savedMessage : msg
        )
      );

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg._id.startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: vi 
    });
  };

  const isUserMember = members.some(member => {
    const memberId = typeof member.user === 'string' ? member.user : member.user?._id;
    return memberId === (user?._id || user?.id);
  });

  if (!isUserMember) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <div className="text-center">
          <IoHappyOutline className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Bạn cần tham gia cộng đồng để có thể thảo luận</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white border rounded-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-800">Thảo luận cộng đồng</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <IoHappyOutline className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender._id === (user?._id || user?.id);
            const isTemporary = message._id.startsWith('temp-');
            
            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender.avatar?.url ? (
                        <img
                          src={message.sender.avatar.url}
                          alt={message.sender.fullName}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-orange-600">
                            {message.sender.fullName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {message.sender.fullName}
                      </span>
                    </div>
                  )}
                  
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      isOwnMessage
                        ? `bg-orange-500 text-white ${isTemporary ? 'opacity-70' : ''}`
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-orange-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                      {message.edited && ' (đã chỉnh sửa)'}
                      {isTemporary && ' (đang gửi...)'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn của bạn..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <IoSend className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Nhấn Enter để gửi, Shift + Enter để xuống dòng
        </p>
      </div>
    </div>
  );
};

export default CommunityChat; 