import { useState, useEffect } from 'react';
import { 
  UserAddIcon, UserIcon, PencilAltIcon, SearchIcon, 
  FilterIcon, AcademicCapIcon, BriefcaseIcon, EyeIcon, TrashIcon,
  MailIcon, PhoneIcon, CalendarIcon, UserGroupIcon, UserCircleIcon
} from '@heroicons/react/outline';
import userService from '@/services/userService';
import { getSafeAvatarUrl } from '@/utils/avatarUtils';
import AddUserModal from '@/components/admin/users/AddUserModal';
import EditUserModal from '@/components/admin/users/EditUserModal';
import ViewUserModal from '@/components/admin/users/ViewUserModal';
import DeleteUserModal from '@/components/admin/users/DeleteUserModal';
import type { User } from '@/types';
import { toast } from 'react-toastify';

interface FilterState {
  search: string;
  role: string;
  class: string;
  gender: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  teacher: 'bg-blue-100 text-blue-800',
  student: 'bg-green-100 text-green-800'
};

const GENDER_ICONS: Record<string, string> = {
  nam: '👨',
  nữ: '👩',
  khác: '👤'
};

const BASE_COLUMN_WIDTHS = {
  info: 'w-[300px] min-w-[200px]',
  class: 'w-[140px] min-w-[100px]',
  contact: 'w-[280px] min-w-[200px]',
  role: 'w-[120px] min-w-[100px]',
  gender: 'w-[120px] min-w-[90px]',
  birthday: 'w-[140px] min-w-[120px]',
  actions: 'w-[120px] min-w-[100px]'
};

const safeLower = (value?: string): string => (value || '').toLowerCase();

const sortUsers = (users: User[]) => {
  const rolePriority = {
    admin: 3,
    teacher: 2,
    student: 1
  };

  return users.sort((a, b) => {
    // First sort by role priority
    const roleComparison = (rolePriority[b.role as keyof typeof rolePriority] || 0) - 
                         (rolePriority[a.role as keyof typeof rolePriority] || 0);
    
    if (roleComparison !== 0) return roleComparison;

    // Then sort by name if same role (null-safe, case-insensitive)
    return safeLower(a.fullName).localeCompare(safeLower(b.fullName));
  });
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: 'all',
    class: 'all',
    gender: 'all'
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getUsers();
        setUsers(data);
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleAddUser = async (userData: any) => {
    try {
      const newUser = await userService.createUser(userData);
      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleEditUser = async (id: string, userData: any) => {
    try {
      const updatedUser = await userService.updateUser(id, userData);
      setUsers(users.map(user => user._id === id ? updatedUser : user));
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Có lỗi xảy ra khi cập nhật người dùng');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await userService.deleteUser(id);
      setUsers(users.filter(user => user._id !== id));
      toast.success('Xóa người dùng thành công');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Có lỗi xảy ra khi xóa người dùng');
    }
  };

  const classes = [...new Set(users
    .map(user => user.class)
    .filter((c): c is string => Boolean(c))
  )].sort((a, b) => a.localeCompare(b));
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = !filters.search || [
      user.fullName,
      user.email,
      user.userId,
      user.username,
      user.phone
    ].some(field => field?.toLowerCase().includes(filters.search.toLowerCase()));

    const matchesRole = filters.role === 'all' || user.role === filters.role;
    const matchesClass = filters.class === 'all' || user.class === filters.class;
    const matchesGender = filters.gender === 'all' || user.gender === filters.gender;

    return matchesSearch && matchesRole && matchesClass && matchesGender;
  });

  const paginatedUsers = sortUsers(filteredUsers).slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const actionButtons = (user: User) => (
    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={() => { setSelectedUser(user); setIsViewModalOpen(true); }}
        className="text-blue-600 hover:text-blue-900"
      >
        <EyeIcon className="h-5 w-5" />
      </button>
      <button 
        onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }}
        className="text-green-600 hover:text-green-900"
      >
        <PencilAltIcon className="h-5 w-5" />
      </button>
      <button 
        onClick={() => { setSelectedUser(user); setIsDeleteModalOpen(true); }}
        className="text-red-600 hover:text-red-900"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <UserAddIcon className="h-5 w-5" />
          <span>Thêm người dùng</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/4 text-orange-400" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              className="text-orange-600 w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 
                transition-all placeholder:text-orange-300"
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 col-span-1 sm:col-span-2 lg:col-span-3 gap-3">
            {/* Role Filter */}
            <select
              className="text-orange-600 w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
              value={filters.role}
              onChange={e => setFilters(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="teacher">Giảng viên</option>
              <option value="student">Sinh viên</option>
            </select>

            {/* Class Filter - Chỉ hiển thị khi có sinh viên */}
            {users.some(user => user.role === 'student') && (
              <select
                className="text-orange-600 w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                value={filters.class}
                onChange={e => setFilters(prev => ({ ...prev, class: e.target.value }))}
              >
                <option value="all">Tất cả lớp</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls===''?'Admin/Giảng viên':cls}</option>
                ))}
              </select>
            )}

            {/* Gender Filter */}
            <select
              className="text-orange-600 w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
              value={filters.gender}
              onChange={e => setFilters(prev => ({ ...prev, gender: e.target.value }))}
            >
              <option value="all">Tất cả giới tính</option>
              <option value="nam">Nam</option>
              <option value="nữ">Nữ</option>
              <option value="khác">Khác</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm -mx-2 sm:mx-0">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${BASE_COLUMN_WIDTHS.info}`}>
                    <div className="flex items-center gap-1">
                      <UserCircleIcon className="h-4 w-4" />
                      Thông tin
                    </div>
                  </th>
                  {/* Chỉ hiển thị cột lớp nếu có sinh viên trong danh sách */}
                  {users.some(user => user.role === 'student') && (
                    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${BASE_COLUMN_WIDTHS.class}`}>
                      <div className="flex items-center gap-1">
                        <AcademicCapIcon className="h-4 w-4" />
                        Lớp
                      </div>
                    </th>
                  )}
                  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${BASE_COLUMN_WIDTHS.contact}`}>
                    <div className="flex items-center gap-1">
                      <MailIcon className="h-4 w-4" />
                      Liên hệ
                    </div>
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${BASE_COLUMN_WIDTHS.role}`}>
                    <div className="flex items-center gap-1">
                      <BriefcaseIcon className="h-4 w-4" />
                      Vai trò
                    </div>
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${BASE_COLUMN_WIDTHS.gender}`}>
                    <div className="flex items-center gap-1">
                      <UserGroupIcon className="h-4 w-4" />
                      Giới tính
                    </div>
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${BASE_COLUMN_WIDTHS.birthday}`}>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      Ngày sinh
                    </div>
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase ${BASE_COLUMN_WIDTHS.actions}`}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedUsers.map((user) => (
                  <tr 
                    key={user._id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedUser(user); setIsViewModalOpen(true); }}
                  >
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 ${BASE_COLUMN_WIDTHS.info}`}>
                      <div className="flex items-center gap-3">                        {getSafeAvatarUrl(user.avatar) ? (
                          <img src={getSafeAvatarUrl(user.avatar)} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{user.fullName}</div>
                          <div className="text-sm text-gray-500 truncate">ID: {user.userId}</div>
                        </div>
                      </div>
                    </td>
                    {/* Chỉ hiển thị thông tin lớp cho sinh viên */}
                    {users.some(u => u.role === 'student') && (
                      <td className={`px-3 sm:px-6 py-3 sm:py-4 ${BASE_COLUMN_WIDTHS.class}`}>
                        {user.role === 'student' ? (
                          <div className="flex items-center gap-2">
                            <AcademicCapIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-900 truncate">{user.class}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400"></span>
                        )}
                      </td>
                    )}
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 ${BASE_COLUMN_WIDTHS.contact}`}>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <MailIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900 truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-500 truncate">{user.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 ${BASE_COLUMN_WIDTHS.role}`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                        {user.role === 'admin' ? 'Admin' : 
                         user.role === 'teacher' ? 'Giảng viên' : 
                         'Sinh viên'}
                      </span>
                    </td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 ${BASE_COLUMN_WIDTHS.gender}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{GENDER_ICONS[user.gender]}</span>
                        <span className="text-sm text-gray-500 capitalize">{user.gender}</span>
                      </div>
                    </td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 ${BASE_COLUMN_WIDTHS.birthday}`}>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-500">
                          {user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : 'Trống'}
                        </span>
                      </div>
                    </td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 text-right ${BASE_COLUMN_WIDTHS.actions}`}>
                      {actionButtons(user)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-700 text-center sm:text-left">
          Hiển thị {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, filteredUsers.length)} trong số {filteredUsers.length} người dùng
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 min-w-[100px]"
          >
            Trước
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * itemsPerPage >= filteredUsers.length}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 min-w-[100px]"
          >
            Sau
          </button>
        </div>
      </div>

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddUser}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
        onSubmit={handleEditUser}
        user={selectedUser}
      />

      <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setSelectedUser(null); }}
        user={selectedUser}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedUser(null); }}
        onConfirm={handleDeleteUser}
        user={selectedUser}
      />
    </div>
  );
};

export default UserManagement;
