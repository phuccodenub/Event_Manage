import React, { useState, Fragment } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { XIcon, UserCircleIcon, SearchIcon, CheckIcon } from '@heroicons/react/outline';
import type { User } from '@/types';
import { useUserList } from '@/hooks/useUserList';

interface AssignHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (userId: string) => Promise<void>;
  currentHeadId?: string;
  departmentName: string;
}

const AssignHeadModal = ({ isOpen, onClose, onAssign, currentHeadId, departmentName }: AssignHeadModalProps) => {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const { users, loading } = useUserList(['teacher', 'admin']); // Fetch both teachers and admins

  const filteredUsers = query === ''
    ? users // Show all users when no query
    : users.filter((user) =>
        user.fullName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      await onAssign(selectedUser._id);
      onClose();
    }
  };

  // Add timeout to handle click events on options
  const handleBlur = () => {
    setTimeout(() => {
      setIsComboboxOpen(false);
    }, 100); // Delay để cho phép click option hoàn tất
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all min-h-[600px] flex flex-col justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center space-x-2">
                    <UserCircleIcon className="h-6 w-6 text-blue-600" />
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Phân công trưởng khoa
                    </Dialog.Title>
                  </div>
                  <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
                    <XIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="mt-4 flex-1">
                  <p className="text-sm text-gray-500 mb-4">
                    Chọn trưởng khoa cho {departmentName}
                  </p>

                  <Combobox value={selectedUser} onChange={setSelectedUser}>
                    <div className="relative">
                      <div className="relative w-full">
                        <Combobox.Input
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          displayValue={(user: User) => user?.fullName || ''}
                          onChange={(event) => setQuery(event.target.value)}
                          onFocus={() => setIsComboboxOpen(true)}
                          onBlur={handleBlur}
                          placeholder="Tìm giảng viên..."
                        />
                        <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                      <Transition
                        show={isComboboxOpen}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                      >
                        <Combobox.Options 
                          static 
                          className="absolute mt-1 max-h-80 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                        >
                          {loading ? (
                            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                          ) : filteredUsers.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-500">Không tìm thấy giảng viên</div>
                          ) : (
                            filteredUsers.map((user) => (
                              <Combobox.Option
                                key={user._id}
                                value={user}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 px-4 ${
                                    active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                  }`
                                }
                              >
                                {({ selected, active }) => (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {user.avatar?.url ? (
                                        <img 
                                          src={user.avatar.url} 
                                          alt={user.fullName}
                                          className="h-8 w-8 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                          <UserCircleIcon className="h-6 w-6 text-gray-400" />
                                        </div>
                                      )}
                                      <div>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                          {user.fullName}
                                        </span>
                                        <span className={`block truncate text-sm ${
                                          active ? 'text-blue-200' : 'text-gray-500'
                                        }`}>
                                          {user.email}
                                        </span>
                                      </div>
                                    </div>
                                    {selected && (
                                      <CheckIcon className={`h-5 w-5 ${active ? 'text-white' : 'text-blue-600'}`} />
                                    )}
                                  </div>
                                )}
                              </Combobox.Option>
                            ))
                          )}
                        </Combobox.Options>
                      </Transition>
                    </div>
                  </Combobox>
                </div>
              </div>

              <div className="pt-4 border-t mt-auto">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!selectedUser}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Phân công
                  </button>
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
