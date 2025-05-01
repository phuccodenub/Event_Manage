import React from 'react';
import { Route, Switch } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import EventManagement from "@/pages/admin/EventManagement";
import UserManagement from "@/pages/admin/UserManagement";
import AnnouncementManagement from "@/pages/admin/AnnouncementManagement";
import Settings from "@/pages/admin/Settings";
import FacultyManagement from "@/pages/admin/FacultyManagement";

const PrivateRoutes = () => {
  return React.createElement(
    Switch,
    null,
    React.createElement(Route, { path: "/admin", component: AdminLayout }),
    React.createElement(Route, { path: "/admin/dashboard", component: () =>
      React.createElement(AdminLayout, null, React.createElement(Dashboard))
    }),
    React.createElement(Route, { path: "/admin/events", component: () =>
      React.createElement(AdminLayout, null, React.createElement(EventManagement))
    }),
    React.createElement(Route, { path: "/admin/users", component: () =>
      React.createElement(AdminLayout, null, React.createElement(UserManagement))
    }),
    React.createElement(Route, { path: "/admin/announcements", component: () =>
      React.createElement(AdminLayout, null, React.createElement(AnnouncementManagement))
    }),
    React.createElement(Route, { path: "/admin/faculties", component: () =>
      React.createElement(AdminLayout, null, React.createElement(FacultyManagement))
    }),
    React.createElement(Route, { path: "/admin/settings", component: () =>
      React.createElement(AdminLayout, null, React.createElement(Settings))
    })
  );
};

export default PrivateRoutes;