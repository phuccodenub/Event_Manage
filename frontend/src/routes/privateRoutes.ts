import { Routes, Route, Navigate } from "react-router-dom";
// import UserDashboard from "../pages/UserDashboard";
// import AdminDashboard from "../pages/AdminDashboard";
// import NotFound from "../pages/NotFound";

const PrivateRoutes = ({ role }: { role: string | null }) => {
  return (
    <Routes>
      // <Route path="/" element={<UserDashboard />} />
      {role === "admin" ? (
        // <Route path="/admin" element={<AdminDashboard />} />
      ) : (
        // <Route path="/admin" element={<Navigate to="/unauthorized" replace />} />
      )}
      // <Route path="/unauthorized" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default PrivateRoutes;