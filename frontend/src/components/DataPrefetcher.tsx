import React from 'react';
import { usePrefetchData } from '../hooks/usePrefetchData';

interface DataPrefetcherProps {
  children: React.ReactNode;
}

/**
 * Component bọc ứng dụng để prefetch dữ liệu
 * Không hiển thị gì cả, chỉ chạy logic prefetch
 */
export const DataPrefetcher: React.FC<DataPrefetcherProps> = ({ children }) => {
  // Sử dụng hook prefetch
  usePrefetchData();
  
  // Không render gì ngoài children
  return <>{children}</>;
}; 