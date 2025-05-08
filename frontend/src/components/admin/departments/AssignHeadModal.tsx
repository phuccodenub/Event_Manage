import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon, UserCircleIcon, SearchIcon } from '@heroicons/react/outline';
import type { User } from '@/types';
import { useUserList } from '@/hooks/useUserList';
import { useDepartment } from '@/context/DepartmentContext';
import { toast } from 'react-toastify';

const UserAvatar = ({ user }: { user: User }) => {
  if (user.avatar?.url) {
    return (
      <img 
        src={user.avatar.url} 
        alt={user.fullName} 
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <svg
      className="h-10 w-10 rounded-full bg-gray-200 p-2 text-gray-400"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
};

interface AssignHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
}

const AssignHeadModal = ({ isOpen, onClose, departmentId, departmentName }: AssignHeadModalProps) => {
  const [query, setQuery] = useState('');
  const { users, loading } = useUserList(['teacher', 'admin']);
  const { departments, updateDepartmentHead, fetchDepartments } = useDepartment();

  // Fetch departments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen, fetchDepartments]);

  const currentDepartment = React.useMemo(() => {
    console.log('Fetching department details:', {
      departmentId,
      departments: departments.map(d => ({ id: d._id, name: d.name, head: d.head }))
    });
    return departments.find(dept => dept._id === departmentId);
  }, [departments, departmentId]);

  const currentHead = React.useMemo(() => {
    const head = currentDepartment?.head;
    console.log('Current Head:', {
      head,
      departmentInfo: currentDepartment 
    });
    return head || null;
  }, [currentDepartment]);

  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      if (user._id === currentHead?._id) return false;

      if (currentDepartment?.administrators?.some(admin => admin._id === user._id)) return false;
      if (currentDepartment?.moderators?.some(mod => mod._id === user._id)) return false;

      return query === '' ||
        user.fullName.toLowerCase().includes(query.toLowerCase()) ||
        user.userId?.toLowerCase().includes(query.toLowerCase());
    });
  }, [users, currentHead, currentDepartment, query]);

  const handleAssign = async (userId: string) => {
    try {
      await updateDepartmentHead(departmentId, userId);
      await fetchDepartments();
      onClose();
      toast.success('Phân công trưởng khoa thành công');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-6xl transform rounded-xl bg-white shadow-xl transition-all">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                  <UserCircleIcon className="h-6 w-6 text-blue-600" />
                  <Dialog.Title className="text-lg font-semibold">
                    Phân công trưởng khoa - {departmentName}
                  </Dialog.Title>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4">
                {/* Left Column - Current Head */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 mt-6">
                    Trưởng khoa hiện tại
                  </h3>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto border rounded-lg p-4">
                    {currentHead ? (
                      <div className="flex items-center space-x-3 p-3 rounded-lg border bg-gray-50">
                        <UserAvatar user={currentHead} />
                        <div>
                          <div className="font-medium">{currentHead.fullName}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span>#{currentHead.userId || 'N/A'}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs
                              ${currentHead.role === 'admin' ? 'bg-red-100 text-red-800' : 
                                'bg-blue-100 text-blue-800'}`}
                            >
                              {currentHead.role === 'admin' ? 'Admin' : 'Giảng viên'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Chưa có trưởng khoa
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Available Users */}
                <div>
                  <div className="mb-3">
                    <div className="relative">
                      <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm giảng viên..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto border rounded-lg p-2">
                    {loading ? (
                      <div className="text-center py-4 text-gray-500">Đang tải...</div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        Không tìm thấy giảng viên phù hợp
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <UserAvatar user={user} />
                            <div>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <span>#{user.userId || 'N/A'}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs
                                  ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                                    'bg-blue-100 text-blue-800'}`}
                                >
                                  {user.role === 'admin' ? 'Admin' : 'Giảng viên'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAssign(user._id)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            Chọn
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AssignHeadModal;
