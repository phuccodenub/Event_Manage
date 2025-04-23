import { Route, Switch } from "wouter";
import Home from "../pages/home";
import Login from "../pages/Login";
import Success from "../pages/Success";
import React from "react";
import Events from "../pages/Events";

const PublicRoutes = () => {
  return React.createElement(
    Switch,
    null,
    React.createElement(Route, { path: "/", component: Home }),
    React.createElement(Route, { path: "/login", component: Login }),
    React.createElement(Route, { path: "/events", component: Events })
  );
};

export default PublicRoutes;