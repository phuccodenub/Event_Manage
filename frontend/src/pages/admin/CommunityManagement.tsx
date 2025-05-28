import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import communityService, { Community } from '../../services/communityService';
import AdminLayout from '../../components/admin/AdminLayout';
import { PencilIcon, TrashIcon, PlusIcon, SearchIcon } from '@heroicons/react/outline';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';

const CommunityManagement: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const data = await communityService.getAllCommunities();
      setCommunities(data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách cộng đồng:', error);
      toast.error('Không thể tải danh sách cộng đồng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const searchCommunities = async () => {
        try {
          setLoading(true);
          const results = await communityService.searchCommunities(searchTerm);
          setCommunities(results);
        } catch (error) {
          console.error('Lỗi khi tìm kiếm cộng đồng:', error);
          toast.error('Không thể tìm kiếm cộng đồng');
        } finally {
          setLoading(false);
        }
      };
      searchCommunities();
    } else {
      fetchCommunities();
    }
  };

  const handleDeleteClick = (community: Community) => {
    setSelectedCommunity(community);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCommunity) return;
    
    try {
      await communityService.deleteCommunity(selectedCommunity._id);
      toast.success('Cộng đồng đã được xóa thành công');
      fetchCommunities();
    } catch (error) {
      console.error('Lỗi khi xóa cộng đồng:', error);
      toast.error('Không thể xóa cộng đồng');
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedCommunity(null);
    }
  };

  // Lọc và phân trang
  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCommunities.slice(indexOfFirstItem, indexOfLastItem);
  
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quản lý cộng đồng</h1>
          <a 
            href="/admin/communities/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Tạo cộng đồng mới
          </a>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Tìm kiếm cộng đồng..."
                className="w-full p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 bg-gray-100 border-l border-gray-300 rounded-r-md hover:bg-gray-200"
              >
                <SearchIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </form>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {currentItems.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-600">Không tìm thấy cộng đồng nào</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên cộng đồng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Người quản lý
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số thành viên
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày tạo
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((community) => (
                        <tr key={community._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={community.avatar?.url || '/placeholder-community.png'}
                                  alt={community.name}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {community.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {community.leader?.fullName || 'Không có'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {community.members?.length || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              community.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {community.isActive ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(community.createdAt || new Date()).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a
                              href={`/admin/communities/${community._id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              <PencilIcon className="h-5 w-5 inline" />
                            </a>
                            <button
                              onClick={() => handleDeleteClick(community)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <Pagination
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredCommunities.length}
                    paginate={paginate}
                    currentPage={currentPage}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận xóa"
      >
        <div className="p-6">
          <p className="mb-4">
            Bạn có chắc chắn muốn xóa cộng đồng "{selectedCommunity?.name}" không? 
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-4">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Hủy
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              onClick={handleConfirmDelete}
            >
              Xóa
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default CommunityManagement;