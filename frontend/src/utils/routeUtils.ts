/**
 * Danh sách các route công khai không cần xác thực
 */
export const publicRoutes = [
  "/login", 
  "/register", 
  "/forgot-password", 
  "/verify-email", 
  "/change-password",
  "/about",
  "/accessibility", 
  "/help", 
  "/privacy",
  "/ad-choices",
  "/advertising",
  "/business",
  "/mobile",
  "/more"
];

/**
 * Danh sách các route bán công khai - có thể xem mà không cần đăng nhập
 * nhưng có thể có thêm tính năng khi đăng nhập
 */
export const semiPublicRoutes = [
  "/",
  "/events",
  "/community",
  "/announcements",
  "/certificates",
  "/department"
];

/**
 * Kiểm tra xem route có phải là public không
 * @param pathname - Đường dẫn cần kiểm tra
 * @returns true nếu là public route
 */
export const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.includes(pathname) || 
         pathname.startsWith('/reset-password') ||
         pathname.startsWith('/verify/');
};

/**
 * Kiểm tra xem route có phải là semi-public không
 * @param pathname - Đường dẫn cần kiểm tra
 * @returns true nếu là semi-public route
 */
export const isSemiPublicRoute = (pathname: string): boolean => {
  return semiPublicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
};

/**
 * Kiểm tra xem route có cần xác thực không
 * @param pathname - Đường dẫn cần kiểm tra
 * @returns true nếu cần xác thực
 */
export const requiresAuth = (pathname: string): boolean => {
  return !isPublicRoute(pathname) && !isSemiPublicRoute(pathname);
}; 