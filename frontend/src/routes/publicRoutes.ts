import { Route, Switch } from "wouter";
// import Home from "@/pages/home";
// import Shop from "@/pages/shop";
// import ProductDetail from "@/store/slices/[slug]";
// import Cart from "@/pages/cart";
// import Checkout from "@/pages/checkout";
import Login from "../pages/Login";
import Success from "../pages/Success";
// import Register from "@/pages/register";
// import OrderSuccess from "@/pages/order-success";
// import NotFound from "@/pages/not-found";
// import Orders from "@/pages/orders";
import React from "react";
// import forgotPassword from "@/pages/forgot-password";
// import ResetPassword from "@/pages/reset-password/[token]";

const PublicRoutes = () => {
  return React.createElement(
    Switch,
    null,
    // React.createElement(Route, { path: "/", component: Home }),
    // React.createElement(Route, { path: "/shop", component: Shop }),
    // React.createElement(Route, { path: "/product/:slug" , component: ProductDetail }),
    // React.createElement(Route, { path: "/cart", component: Cart }),
    // React.createElement(Route, { path: "/checkout", component: Checkout }),
    React.createElement(Route, { path: "/login", component: Login }),
    React.createElement(Route, { path: "/success", component: Success }),
    // React.createElement(Route, { path: "/register", component: Register }),
    // React.createElement(Route, { path: "/order-success/:id", component: OrderSuccess }),
    // React.createElement(Route, { path: "/orders", component: Orders }),
    // React.createElement(Route, { path: "/forgot-password", component: forgotPassword }),
    // React.createElement(Route, { path: "/reset-password/:token", component: ResetPassword }),
    // React.createElement(Route, { path: "/:rest*", component: NotFound })
  );
};

export default PublicRoutes;