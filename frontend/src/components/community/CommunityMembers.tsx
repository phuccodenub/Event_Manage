import React from 'react';
import { IoPeopleOutline } from 'react-icons/io5';
import type { Community } from '../../services/communityService';

interface CommunityMembersProps {
  community: Community;
  members: any[];
  leader: any;
}

const CommunityMembers: React.FC<CommunityMembersProps> = ({
  community,
  members,
  leader
}) => {
  // Filter valid members (có user data)
  const validMembers = members.filter(member => {
    if (typeof member.user === 'string') {
      return member.user;
    }
    return member.user && member.user._id;
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <IoPeopleOutline className="mr-2 text-orange-500" />
        Thành viên ({validMembers.length})
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {validMembers.map(member => {
          const memberUser = typeof member.user === 'string' ? {
            _id: member.user,
            fullName: 'Thành viên',
            avatar: { url: '/default-avatar.png' }
          } : member.user;
          
          if (!memberUser) return null;
          
          return (
            <div key={member._id || memberUser._id} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden mb-2 border border-gray-200">
                <img
                  src={memberUser.avatar?.url || '/default-avatar.png'}
                  alt={memberUser.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/default-avatar.png';
                  }}
                />
              </div>
              <span className="text-sm text-gray-800 font-medium line-clamp-1">
                {memberUser.fullName}
              </span>
              {leader && leader._id === memberUser._id && (
                <span className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-0.5 rounded-full">Leader</span>
              )}
              {community.deputies?.some(deputy => deputy._id === memberUser._id) && (
                <span className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-0.5 rounded-full">Deputy</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityMembers; 