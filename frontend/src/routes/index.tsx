import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import PublicRoutes from "./publicRoutes";
import PrivateRoutes from "./privateRoutes";

const Router = () => {
  const [role, setRole] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    setRole(user?.role || null);
  }, []);

  if (role === null) {
    return <PublicRoutes />; // Hiển thị trạng thái loading trong lúc kiểm tra quyền
  }

  return role === "admin" ? <PrivateRoutes /> : <PublicRoutes />;
};

export default Router;
