import { Route, Switch } from "wouter";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import React from "react";
import Events from "@/pages/Events";
import Community from "@/pages/Community";
import AllNotifications from "@/pages/AllNotifications";
import Profile from "@/pages/Profile";
import Setting from "@/pages/Settings";
import About from "@/pages/footer/About";
import Accessibility from "@/pages/footer/Accessibility";
import Help from "@/pages/footer/Help";
import Privacy from "@/pages/footer/Privacy";
import AdChoices from "@/pages/footer/AdChoices";
import Advertising from "@/pages/footer/Advertising";
import Business from "@/pages/footer/Business";
import Mobile from "@/pages/footer/Mobile";
import More from "@/pages/footer/More";
import PostDetails from "@/pages/PostDetails";
import NotFound from "@/pages/NotFound";
import DepartmentDetail from "@/pages/DepartmentDetail";
import EventCheckin from "@/pages/EventCheckin";
import SubmissionsPage from "@/pages/SubmissionsPage";
import Certificates from "@/pages/Certificates";

const PublicRoutes = () => {
  return React.createElement(
    Switch,
    null,
    React.createElement(Route, { path: "/", component: Home }),
    React.createElement(Route, { path: "/login", component: Login }),
    React.createElement(Route, { path: "/events", component: Events }),
    React.createElement(Route, { path: "/community", component: Community }),
    React.createElement(Route, { path: "/notifications", component: AllNotifications }),
    React.createElement(Route, { path: "/profile/:id", component: Profile }),
    React.createElement(Route, { path: "/setting", component: Setting }),
    React.createElement(Route, { path: "/about", component: About }),
    React.createElement(Route, { path: "/accessibility", component: Accessibility }),
    React.createElement(Route, { path: "/help", component: Help }),
    React.createElement(Route, { path: "/privacy", component: Privacy }),
    React.createElement(Route, { path: "/ad-choices", component: AdChoices }),
    React.createElement(Route, { path: "/advertising", component: Advertising }),
    React.createElement(Route, { path: "/business", component: Business }),
    React.createElement(Route, { path: "/mobile", component: Mobile }),
    React.createElement(Route, { path: "/more", component: More }),
    React.createElement(Route, { path: "/events/:id", component: PostDetails }),
    React.createElement(Route, { path: "/announcements/:id", component: PostDetails }),
    React.createElement(Route, { path: "/department/:id", component: DepartmentDetail }),
    React.createElement(Route, { path: "/events/:id/checkin", component: EventCheckin }),
    React.createElement(Route, { path: "/events/:id/submissions", component: SubmissionsPage }),
    React.createElement(Route, { path: "/certificates", component: Certificates }),
    React.createElement(Route, { path: "/certificates/:userId", component: Certificates }),
    React.createElement(Route, { path: "*", component: NotFound })
  );
};

export default PublicRoutes;