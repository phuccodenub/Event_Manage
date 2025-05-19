import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CommunityList from '../components/community/CommunityList';
import CommunityDetail from '../components/community/CommunityDetail';
import CommunityForm from '../components/community/CommunityForm';
import { useAuth } from '../context/AuthContext';
import NotFound from './NotFound';
import AccessDenied from './AccessDenied';

const Community: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrTeacher = user && ['admin', 'teacher'].includes(user.role);
  
  // Chức năng thêm/sửa chỉ dành cho Admin và Teacher
  const ProtectedRoute: React.FC<{element: React.ReactElement}> = ({ element }) => {
    return isAdminOrTeacher ? element : <AccessDenied />;
  };
  
  return (
    <Routes>
      <Route index element={<CommunityList />} />
      <Route path=":id" element={<CommunityDetail />} />
      <Route path="new" element={<ProtectedRoute element={<CommunityForm />} />} />
      <Route path="edit/:id" element={<ProtectedRoute element={<CommunityForm />} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Community;
