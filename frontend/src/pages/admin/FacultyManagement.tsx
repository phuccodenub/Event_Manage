import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, 
  CheckCircleIcon, XCircleIcon, UserCircleIcon,
  UserGroupIcon, // Add this import
  SearchIcon, FilterIcon 
} from '@heroicons/react/outline';
import departmentService from '@/services/departmentService';
import { toast } from 'react-toastify';
import type { AdminDepartment } from '@/types/admin';
import AddDepartmentModal from '@/components/admin/departments/AddDepartmentModal';
import EditDepartmentModal from '@/components/admin/departments/EditDepartmentModal';
import AssignHeadModal from '@/components/admin/departments/AssignHeadModal';
import ManageRolesModal from '@/components/admin/departments/ManageRolesModal';

const COLUMN_WIDTHS = {
  code: 'w-[120px] min-w-[120px] max-w-[120px]',
  name: 'w-[300px] min-w-[300px] max-w-[300px]',
  head: 'w-[200px] min-w-[200px] max-w-[200px]',
  status: 'w-[150px] min-w-[150px] max-w-[150px]',
  actions: 'w-[120px] min-w-[120px] max-w-[120px]'
};

interface FilterState {
  search: string;
  status: string;
  hasHead: string;
}

const FacultyManagement = () => {
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<AdminDepartment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignHeadModalOpen, setIsAssignHeadModalOpen] = useState(false);
  const [selectedDepartmentForHead, setSelectedDepartmentForHead] = useState<AdminDepartment | null>(null);
  const [isManageRolesModalOpen, setIsManageRolesModalOpen] = useState(false);
  const [selectedDepartmentForRoles, setSelectedDepartmentForRoles] = useState<AdminDepartment | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    hasHead: 'all'
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách khoa');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa khoa này?')) {
      try {
        await departmentService.deleteDepartment(id);
        toast.success('Xóa khoa thành công');
        fetchDepartments();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Không thể xóa khoa');
        console.error(error);
      }
    }
  };

  const handleAddDepartment = async (data: Partial<AdminDepartment>) => {
    try {
      await departmentService.createDepartment(data);
      toast.success('Thêm khoa mới thành công');
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thêm khoa');
    }
  };

  const handleEditDepartment = async (data: Partial<AdminDepartment>) => {
    try {
      if (!selectedDepartment?._id) return;
      await departmentService.updateDepartment(selectedDepartment._id, data);
      toast.success('Cập nhật khoa thành công');
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật khoa');
    }
  };

  const handleAssignHead = async (userId: string) => {
    try {
      if (!selectedDepartmentForHead) return;
      await departmentService.assignHead(selectedDepartmentForHead._id, userId);
      toast.success('Phân công trưởng khoa thành công');
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi phân công trưởng khoa');
    }
  };

  const handleRoleUpdate = async (role: 'administrators' | 'moderators', userId: string, action: 'add' | 'remove') => {
    try {
      if (!selectedDepartmentForRoles) return;
      await departmentService.updateDepartmentRoles(
        selectedDepartmentForRoles._id, 
        role,
        userId,
        action
      );
      await fetchDepartments(); // Refresh data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật vai trò');
    }
  };

  const handleAssignHeadClick = (dept: AdminDepartment) => {
    console.log('Opening AssignHead modal with department:', dept);
    setSelectedDepartmentForHead(dept);
    setIsAssignHeadModalOpen(true);
  };

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = !filters.search || [
      dept.name,
      dept.code,
      dept.description,
      dept.head?.fullName
    ].some(field => field?.toLowerCase().includes(filters.search.toLowerCase()));

    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' ? dept.isActive : !dept.isActive);

    const matchesHead = filters.hasHead === 'all' ||
      (filters.hasHead === 'yes' ? dept.head : !dept.head);

    return matchesSearch && matchesStatus && matchesHead;
  });

  const paginatedDepartments = filteredDepartments.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Thêm khoa mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/4 text-orange-600" />
            <input
              type="text"
              placeholder="Tìm kiếm khoa..."
              className="text-orange-600 w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 
                transition-all placeholder:text-orange-300"
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <select
            className="text-orange-600 w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngưng hoạt động</option>
          </select>

          <select
            className="text-orange-600 w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
            value={filters.hasHead}
            onChange={e => setFilters(prev => ({ ...prev, hasHead: e.target.value }))}
          >
            <option value="all">Tất cả trưởng khoa</option>
            <option value="yes">Đã có trưởng khoa</option>
            <option value="no">Chưa có trưởng khoa</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : paginatedDepartments.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Không tìm thấy kết quả phù hợp
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm -mx-2 sm:mx-0">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.code}`}>
                      Mã khoa
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.name}`}>
                      Tên khoa
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.head}`}>
                      Trưởng khoa
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.status}`}>
                      Trạng thái
                    </th>
                    <th className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.actions}`}>
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedDepartments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-gray-50">
                      <td className={`px-6 py-4 ${COLUMN_WIDTHS.code}`}>
                        <div className="truncate font-medium">{dept.code}</div>
                      </td>
                      <td className={`px-6 py-4 ${COLUMN_WIDTHS.name}`}>
                        <div>
                          <div className="font-medium text-gray-900 truncate">{dept.name}</div>
                          {dept.description && (
                            <div className="text-sm text-gray-500 truncate">{dept.description}</div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${COLUMN_WIDTHS.head}`}>
                        <div className="truncate">
                          {dept.head?.fullName || 'Chưa phân công'}
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${COLUMN_WIDTHS.status}`}>
                        {dept.isActive ? (
                          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">Đang hoạt động</span>
                          </span>
                        ) : (
                          <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            <XCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">Ngừng hoạt động</span>
                          </span>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-right space-x-2 ${COLUMN_WIDTHS.actions}`}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDepartmentForRoles(dept);
                            setIsManageRolesModalOpen(true);
                          }}
                          className="text-orange-600 hover:text-orange-800"
                          title="Quản lý vai trò"
                        >
                          <UserGroupIcon className="h-5 w-5 inline" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignHeadClick(dept);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Phân công trưởng khoa"
                        >
                          <UserCircleIcon className="h-5 w-5 inline" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDepartment(dept);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <PencilIcon className="h-5 w-5 inline" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(dept._id);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Hiển thị {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, filteredDepartments.length)} trong số {filteredDepartments.length} khoa
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Trước
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * itemsPerPage >= filteredDepartments.length}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>

      <AddDepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDepartment}
      />

      {selectedDepartment && (
        <EditDepartmentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditDepartment}
          department={selectedDepartment}
        />
      )}

      {selectedDepartmentForHead && (
        <AssignHeadModal
          isOpen={isAssignHeadModalOpen}
          onClose={() => setIsAssignHeadModalOpen(false)}
          departmentId={selectedDepartmentForHead._id}
          departmentName={selectedDepartmentForHead.name}
        />
      )}

      {selectedDepartmentForRoles && (
        <ManageRolesModal
          isOpen={isManageRolesModalOpen}
          onClose={() => setIsManageRolesModalOpen(false)}
          department={selectedDepartmentForRoles}
          onUpdateRole={handleRoleUpdate}
        />
      )}
    </div>
  );
};

export default FacultyManagement;
