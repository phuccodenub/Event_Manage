import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import authService from '../services/authService';
import eventService from '../services/eventService';

interface PrefetchLinkProps extends LinkProps {
  prefetchType?: 'events' | 'user' | 'community' | 'none';
  prefetchDelay?: number;
}

/**
 * Link component với khả năng prefetch dữ liệu khi hover
 */
export const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  children,
  prefetchType = 'none',
  prefetchDelay = 150,
  ...props
}) => {
  const queryClient = useQueryClient();
  let timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Xử lý sự kiện hover
   */
  const handleMouseEnter = () => {
    // Dùng timer để tránh prefetch khi user chỉ rê chuột lướt qua
    timer = setTimeout(() => {
      switch (prefetchType) {
        case 'events':
          queryClient.prefetchQuery({
            queryKey: ['events'],
            queryFn: () => eventService.getAllEvents(),
          });
          break;
        case 'user':
          queryClient.prefetchQuery({
            queryKey: ['userData'],
            queryFn: () => authService.getProfile(),
          });
          break;
        case 'community':
          // Prefetch community data if needed
          queryClient.prefetchQuery({
            queryKey: ['communityGroups'],
            queryFn: () => Promise.resolve([]),
          });
          queryClient.prefetchQuery({
            queryKey: ['communityDiscussions'],
            queryFn: () => Promise.resolve([]),
          });
          break;
        default:
          break;
      }
    }, prefetchDelay);
  };

  /**
   * Xử lý sự kiện rời chuột
   */
  const handleMouseLeave = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return (
    <Link
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Link>
  );
}; 