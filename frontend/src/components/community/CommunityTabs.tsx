import React from 'react';

interface CommunityTabsProps {
  activeTab: 'about' | 'events' | 'discussions';
  onTabChange: (tab: 'about' | 'events' | 'discussions') => void;
  eventsCount: number;
}

const CommunityTabs: React.FC<CommunityTabsProps> = ({
  activeTab,
  onTabChange,
  eventsCount
}) => {
  return (
    <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'about' 
              ? 'text-orange-600 border-b-2 border-orange-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => onTabChange('about')}
        >
          Giới thiệu
        </button>
        <button
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'events' 
              ? 'text-orange-600 border-b-2 border-orange-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => onTabChange('events')}
        >
          Sự kiện ({eventsCount})
        </button>
        <button
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'discussions' 
              ? 'text-orange-600 border-b-2 border-orange-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => onTabChange('discussions')}
        >
          Thảo luận
        </button>
      </div>
    </div>
  );
};

export default CommunityTabs; 