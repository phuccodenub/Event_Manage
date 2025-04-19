import { Route, Switch, useLocation } from "wouter";
import React from "react";
// import AdminLogin from "@/pages/admin/login";
// import AdminDashboard from "@/pages/admin/dashboard";
// import AdminProducts from "@/pages/admin/products";
// import AdminProductEdit from "@/pages/admin/product-edit";
// import AdminOrders from "@/pages/admin/orders";
// import AdminOrderDetail from "@/pages/admin/order-detail";
// import AdminUsers from "@/pages/admin/users";
// import AdminBlog from "@/pages/admin/blog";
// import NotFound from "@/pages/not-found";

// Middleware kiểm tra quyền admin
const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return user?.role === "admin";
};

const PrivateRoutes = () => {
  const [, navigate] = useLocation();

  if (!isAdmin()) {
    navigate("/admin/login");
    return null;
  }

  return React.createElement(
    Switch,
    null,
    // React.createElement(Route, { path: "/admin/login", component: AdminLogin }), // AdminLogin open Routed
    // React.createElement(Route, { path: "/admin", component: AdminDashboard }),
    // React.createElement(Route, { path: "/admin/products", component: AdminProducts }),
    // React.createElement(Route, { path: "/admin/products/new", component: AdminProductEdit }),
    // React.createElement(Route, { path: "/admin/products/:id", component: AdminProductEdit }),
    // React.createElement(Route, { path: "/admin/orders", component: AdminOrders }),
    // React.createElement(Route, { path: "/admin/orders/:id", component: AdminOrderDetail }),
    // React.createElement(Route, { path: "/admin/users", component: AdminUsers }),
    // React.createElement(Route, { path: "/admin/blog", component: AdminBlog }),
    // React.createElement(Route, { path: "/:rest*", component: NotFound })
  );
};

export default PrivateRoutes;