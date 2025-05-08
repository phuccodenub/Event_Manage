import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XIcon, UserGroupIcon, SearchIcon } from '@heroicons/react/outline';
import type { User, Department } from '@/types';
import { useUserList } from '@/hooks/useUserList';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useDepartment } from '@/context/DepartmentContext';

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

interface ManageRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department;
}

const ManageRolesModal = ({ isOpen, onClose, department }: ManageRolesModalProps) => {
  const [activeTab, setActiveTab] = useState('administrators');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string>('');
  const { users: adminUsers } = useUserList(['admin']);
  const { users: teacherUsers } = useUserList(['teacher']);
  const { users: studentUsers } = useUserList(['student']);

  const { departments, updateDepartmentRoles, fetchDepartments } = useDepartment();

  const currentDepartment = React.useMemo(() => 
    departments.find(dept => dept._id === department._id),
    [departments, department._id]
  );

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen, fetchDepartments]);

  const currentRoleUsers = React.useMemo(() => {
    const users = currentDepartment?.[activeTab as 'administrators' | 'moderators'] || [];
    console.log('Current Role Users:', {
      activeTab,
      users,
      departmentInfo: currentDepartment
    });
    return users;
  }, [currentDepartment, activeTab]);

  const allUsers = React.useMemo(() => {
    const userMap = new Map();
    [...adminUsers, ...teacherUsers, ...studentUsers].forEach(user => {
      if (!userMap.has(user._id)) {
        userMap.set(user._id, user);
      }
    });
    return Array.from(userMap.values());
  }, [adminUsers, teacherUsers, studentUsers]);

  const getUserRoleInDepartment = (userId: string) => {
    if (currentDepartment?.head?._id === userId) return 'head';
    if (currentDepartment?.administrators?.some(admin => admin._id === userId)) return 'administrator';
    if (currentDepartment?.moderators?.some(mod => mod._id === userId)) return 'moderator';
    return null;
  };

  const availableUsers = React.useMemo(() => {
    return allUsers.filter(user => {
      const existingRole = getUserRoleInDepartment(user._id);
      
      if (!existingRole) return true;

      return false;
    });
  }, [allUsers, currentDepartment]);

  const getCurrentRoleDisplay = (role: string | null) => {
    switch (role) {
      case 'head': return 'Trưởng khoa';
      case 'administrator': return 'Quản trị viên';
      case 'moderator': return 'Kiểm duyệt viên';
      default: return null;
    };
  };

  const getUserDepartmentRoles = (user: User) => {
    const role = getUserRoleInDepartment(user._id);
    return role ? [getCurrentRoleDisplay(role)] : [];
  };

  const filteredAvailableUsers = search === '' 
    ? availableUsers
    : availableUsers.filter(user =>
        user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.userId?.toLowerCase().includes(search.toLowerCase())
      );

  const handleRoleUpdate = async (userId: string, role: 'administrators' | 'moderators', action: 'add' | 'remove') => {
    try {
      setProcessing(userId);
      await updateDepartmentRoles(currentDepartment._id, role, userId, action);
      await fetchDepartments();
      toast.success(`${action === 'add' ? 'Thêm' : 'Xóa'} ${role === 'administrators' ? 'quản trị viên' : 'kiểm duyệt viên'} thành công`);
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setProcessing('');
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
                  <UserGroupIcon className="h-6 w-6 text-orange-600" />
                  <Dialog.Title className="text-lg font-semibold">
                    Quản lý vai trò - {currentDepartment?.name}
                  </Dialog.Title>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <Tab.Group>
                <Tab.List className="flex space-x-1 p-4 border-b">
                  <Tab
                    className={({ selected }) =>
                      `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                      ${selected
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-500 hover:bg-gray-100'
                      }`
                    }
                    onClick={() => setActiveTab('administrators')}
                  >
                    Quản trị viên ({currentDepartment?.administrators?.length || 0})
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                      ${selected
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-100'
                      }`
                    }
                    onClick={() => setActiveTab('moderators')}
                  >
                    Kiểm duyệt viên ({currentDepartment?.moderators?.length || 0})
                  </Tab>
                </Tab.List>

                <div className="grid grid-cols-2 gap-4 p-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 mt-6">
                      {activeTab === 'administrators' ? 'Quản trị viên hiện tại' : 'Kiểm duyệt viên hiện tại'}
                      <span className="ml-2 text-sm text-gray-500">
                        ({currentRoleUsers.length})
                      </span>
                    </h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto border rounded-lg p-2">
                      <AnimatePresence>
                        {currentRoleUsers.map((user) => (
                          <motion.div
                            key={user._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              <UserAvatar user={user} />
                              <div>
                                <div className="font-medium">{user.fullName}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  <span>#{user.userId || 'N/A'}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs
                                    ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                                      user.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 
                                      'bg-green-100 text-green-800'}`}
                                  >
                                    {user.role === 'admin' ? 'Admin' : 
                                     user.role === 'teacher' ? 'Giảng viên' : 
                                     'Sinh viên'}
                                  </span>
                                  {getUserDepartmentRoles(user).map((role, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800"
                                    >
                                      {role}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRoleUpdate(user._id, activeTab as 'administrators' | 'moderators', 'remove')}
                              disabled={processing === user._id}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              Xóa
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3">
                      <div className="relative">
                        <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm người dùng..."
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto border rounded-lg p-2">
                      {filteredAvailableUsers.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          Không có người dùng phù hợp để thêm vào vai trò này
                        </div>
                      ) : (
                        <AnimatePresence>
                          {filteredAvailableUsers.map((user) => (
                            <motion.div
                              key={user._id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                            >
                              <div className="flex items-center space-x-3">
                                <UserAvatar user={user} />
                                <div>
                                  <div className="font-medium">{user.fullName}</div>
                                  <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                                    <span>#{user.userId || 'N/A'}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs
                                      ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                                        user.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 
                                        'bg-green-100 text-green-800'}`}
                                    >
                                      {user.role === 'admin' ? 'Admin' : 
                                       user.role === 'teacher' ? 'Giảng viên' : 
                                       'Sinh viên'}
                                    </span>
                                    {getUserDepartmentRoles(user).map((role, idx) => (
                                      <span
                                        key={idx}
                                        className={`px-2 py-0.5 rounded-full text-xs
                                          ${role === 'Trưởng khoa' ? 'bg-purple-100 text-purple-800' :
                                            role === 'QTV' ? 'bg-orange-100 text-orange-800' :
                                            'bg-blue-100 text-blue-800'}`}
                                      >
                                        {role}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRoleUpdate(user._id, activeTab as 'administrators' | 'moderators', 'add')}
                                disabled={processing === user._id}
                                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                Thêm
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>
                </div>
              </Tab.Group>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ManageRolesModal;
