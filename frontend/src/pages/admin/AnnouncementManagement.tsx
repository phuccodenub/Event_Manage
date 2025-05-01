import { useState, useEffect } from 'react';
import { BellIcon, PencilAltIcon, TrashIcon, CalendarIcon, SearchIcon } from '@heroicons/react/outline';
import adminAnnouncementService from '@/services/adminAnnouncementService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import AnnouncementAddModal from '@/components/admin/announcements/AnnouncementAddModal';
import AnnouncementEditModal from '@/components/admin/announcements/AnnouncementEditModal';
import AnnouncementViewModal from '@/components/admin/announcements/AnnouncementViewModal';
import AnnouncementDeleteModal from '@/components/admin/announcements/AnnouncementDeleteModal';

interface AdminAnnouncement {
  _id: string;
  title: string;
  content: string;
  category: 'academic' | 'general';
  priority: number;
  status: 'active' | 'expired' | 'archived';
  images: Array<{
    public_id: string;
    url: string;
  }>;
  creator: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: {
      url: string;
    };
  };
  department?: {
    _id: string;
    name: string;
  };
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

interface FilterState {
  search: string;
  category: string;
  status: string;
}

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    status: 'all'
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AdminAnnouncement | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await adminAnnouncementService.getAll();
      setAnnouncements(data);
    } catch (error: any) {
      toast.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (data: FormData) => {
    try {
      await adminAnnouncementService.create(data);
      toast.success('Tạo thông báo mới thành công'); // Toast chỉ hiển thị ở đây
      fetchAnnouncements();
      setIsAddModalOpen(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo thông báo');
    }
  };

  const handleEdit = async (data: FormData) => {
    try {
      if (!selectedAnnouncement) return;
      await adminAnnouncementService.update(selectedAnnouncement._id, data);
      toast.success('Cập nhật thông báo thành công');
      fetchAnnouncements();
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật thông báo');
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement?._id) return;
    
    try {
      await adminAnnouncementService.delete(selectedAnnouncement._id);
      toast.success('Xóa thông báo thành công');
      fetchAnnouncements();
      setIsDeleteModalOpen(false);
      setSelectedAnnouncement(null); // Clear selection after delete
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa thông báo');
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = !filters.search || [
      announcement.title,
      announcement.content,
      announcement.creator.fullName
    ].some(field => field?.toLowerCase().includes(filters.search.toLowerCase()));

    const matchesCategory = filters.category === 'all' || announcement.category === filters.category;
    const matchesStatus = filters.status === 'all' || announcement.status === filters.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const paginatedAnnouncements = filteredAnnouncements.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    const config = {
      active: {
        label: 'Đang hoạt động',
        className: 'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 w-fit'
      },
      expired: {
        label: 'Hết hạn',
        className: 'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 w-fit'
      },
      archived: {
        label: 'Đã lưu trữ',
        className: 'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 w-fit'
      }
    }[status] || {
      label: 'Không xác định',
      className: 'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 w-fit'
    };

    return (
      <span className={config.className}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <BellIcon className="h-5 w-5" />
          Tạo thông báo mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/4 text-orange-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thông báo..."
              className="text-orange-600 w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 
                transition-all placeholder:text-orange-300"
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <select
            className="text-orange-600 w-full px-3 py-2 border border-orange-200 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
            value={filters.category}
            onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="all">Tất cả danh mục</option>
            <option value="academic">Học vụ</option>
            <option value="general">Chung</option>
          </select>

          <select
            className="text-orange-600 w-full px-3 py-2 border border-orange-200 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="expired">Hết hạn</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thông báo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người tạo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedAnnouncements.map((announcement) => (
              <tr key={announcement._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{announcement.title}</span>
                    <span className="text-sm text-gray-500 line-clamp-1">{announcement.content}</span>
                    {announcement.images.length > 0 && (
                      <span className="text-xs text-orange-600 mt-1">
                        {announcement.images.length} hình ảnh đính kèm
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                    ${announcement.category === 'academic' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {announcement.category === 'academic' ? 'Học vụ' : 'Chung'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {announcement.creator.avatar ? (
                      <img src={announcement.creator.avatar.url} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-orange-600">
                          {announcement.creator.fullName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{announcement.creator.fullName}</span>
                      <span className="text-xs text-gray-500">{announcement.creator.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(announcement.status)}
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      Hết hạn: {format(new Date(announcement.expiresAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => {
                        setSelectedAnnouncement(announcement);
                        setIsViewModalOpen(true);
                      }}
                      className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                    >
                      <BellIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedAnnouncement(announcement);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                    >
                      <PencilAltIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedAnnouncement(announcement);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Hiển thị {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, filteredAnnouncements.length)} trong số {filteredAnnouncements.length} thông báo
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-orange-50"
          >
            Trước
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * itemsPerPage >= filteredAnnouncements.length}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-orange-50"
          >
            Sau
          </button>
        </div>
      </div>

      {/* Modals */}
      <AnnouncementAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAdd}
      />

      {selectedAnnouncement && (
        <>
          <AnnouncementViewModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            announcement={selectedAnnouncement}
          />

          <AnnouncementEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            announcement={selectedAnnouncement}
            onSubmit={handleEdit}
          />

          <AnnouncementDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedAnnouncement(null); // Clear selection when closing
            }}
            onConfirm={handleDelete}
            title={selectedAnnouncement.title}
          />
        </>
      )}
    </div>
  );
};

export default AnnouncementManagement;
