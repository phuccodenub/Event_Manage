import { Link, useLocation } from 'wouter';
import { 
  HomeIcon, UsersIcon, CalendarIcon, 
  BellIcon, CogIcon, ChartBarIcon,
  AcademicCapIcon, UserGroupIcon 
} from '@heroicons/react/outline';

const menuItems = [
  { name: 'Dashboard', icon: ChartBarIcon, path: '/admin/dashboard' },
  { name: 'Events', icon: CalendarIcon, path: '/admin/events' },
  { name: 'Users', icon: UsersIcon, path: '/admin/users' },
  { name: 'Communities', icon: UserGroupIcon, path: '/admin/communities' },
  { name: 'Announcements', icon: BellIcon, path: '/admin/announcements' },
  { name: 'Faculties', icon: AcademicCapIcon, path: '/admin/faculties' },
  { name: 'Settings', icon: CogIcon, path: '/admin/settings' },
];

const Sidebar = () => {
  const [location] = useLocation();

  return (
    <div className="h-screen w-64 bg-orange-600 text-white fixed left-0 top-0">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
        <nav>
          {menuItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path}
              className={`
                flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors
                ${location === item.path 
                  ? 'bg-orange-700 text-white' 
                  : 'hover:bg-orange-500'}
              `}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
