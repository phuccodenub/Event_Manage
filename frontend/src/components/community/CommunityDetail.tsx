import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import { useCommunityData } from '../../hooks/useCommunityData';
import LoadingSpinner from '../LoadingSpinner';
import ErrorAlert from '../ErrorAlert';
import Header from '../Header';
import CreateCommunityEventModal from '../CreateCommunityEventModal';
import CommunityHeader from './CommunityHeader';
import CommunityTabs from './CommunityTabs';
import CommunityMembers from './CommunityMembers';
import CommunityEvents from './CommunityEvents';
import CommunityChat from './CommunityChat';
import PendingRequests from './PendingRequests';
import EditCommunityModal from './EditCommunityModal';
import { IoArrowBack } from 'react-icons/io5';

const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Use custom hook for data management
  const {
    community,
    events,
    leader,
    members,
    isLoading,
    eventsLoading,
    processingRequest,
    error,
    isMember,
    hasPendingRequest,
    isLeader,
    isDeputy,
    canManage: canManageProp,
    loadCommunityDetails,
    loadCommunityEvents,
    sendJoinRequest,
    cancelJoinRequest,
    handleJoinRequest,
    handleDeleteCommunity,
    setError
  } = useCommunityData(id);

  // Convert nullable boolean to boolean
  const canManage = canManageProp ?? false;

  // Local state for UI
  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'discussions'>('about');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

  const handleBackToList = () => {
    navigate('/community');
  };

  const handleEditCommunity = () => {
    setIsModalOpen(true);
  };

  const handleDeleteCommunityAction = async () => {
    const success = await handleDeleteCommunity();
    if (success) {
      navigate('/community');
    }
  };

  const handleCreateEvent = () => {
    setShowCreateEventModal(true);
  };

  const handleEventCreated = () => {
    setShowCreateEventModal(false);
    loadCommunityEvents();
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    loadCommunityDetails();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !community) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <button 
            onClick={handleBackToList}
            className="mb-6 flex items-center text-gray-600 hover:text-orange-600 transition-colors"
          >
            <IoArrowBack className="mr-2" />
            Quay lại danh sách cộng đồng
          </button>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <ErrorAlert message={error} />
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!community) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy cộng đồng</h2>
          <button 
            onClick={handleBackToList}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Quay lại danh sách cộng đồng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Community Header with Banner and Info */}
      <CommunityHeader
        community={community}
        leader={leader}
        members={members}
        isMember={isMember}
        hasPendingRequest={hasPendingRequest}
        isLeader={!!isLeader}
        isDeputy={!!isDeputy}
        canManage={canManage}
        onJoinRequestSent={sendJoinRequest}
        onCancelJoinRequest={cancelJoinRequest}
        onEditCommunity={handleEditCommunity}
        onDeleteCommunity={handleDeleteCommunityAction}
      />

      <div className="container mx-auto px-4">
        {/* Tab Navigation */}
        <CommunityTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          eventsCount={events.length}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'about' && (
              <CommunityMembers
                community={community}
                members={members}
                leader={leader}
              />
            )}

            {activeTab === 'events' && (
              <CommunityEvents
                events={events}
                loading={eventsLoading}
                canManage={canManage}
                onCreateEvent={handleCreateEvent}
              />
            )}

            {activeTab === 'discussions' && (
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <CommunityChat
                  communityId={id || ''}
                  members={members}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {canManage && (
              <PendingRequests
                community={community}
                loading={processingRequest}
                onHandleRequest={handleJoinRequest}
              />
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && community && (
        <div className="fixed bottom-4 right-4 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-xs text-red-600 hover:text-red-800"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      <EditCommunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        community={community}
        setError={setError}
      />
      
      {/* Create Event Modal */}
      <CreateCommunityEventModal
        isOpen={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onEventCreated={handleEventCreated}
        communityId={id || ''}
        communityName={community?.name || ''}
      />
    </div>
  );
};

export default CommunityDetail;