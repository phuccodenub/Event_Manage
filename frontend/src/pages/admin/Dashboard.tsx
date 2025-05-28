import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, UsersIcon, CalendarIcon, BellIcon,
  UserAddIcon, AcademicCapIcon
} from '@heroicons/react/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import userService from '@/services/userService';
import eventService from '@/services/eventService';
import announcementService from '@/services/announcementService';
import { getDateRange } from '@/utils/dateUtils';
import type { User, Event, Announcement } from '@/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface StatsData {
  users: {
    total: number;
    roleDistribution: { name: string; value: number }[];
    growthData: { name: string; value: number }[];
  };
  events: {
    total: number;
    upcoming: number;
    byMonth: { name: string; 'Hoàn thành': number; 'Đang diễn ra': number; 'Sắp diễn ra': number }[];
    participation: { 
      name: string; 
      registered: number; 
      capacity: number; 
      startDate: string; 
      endDate: string; 
      location: string; 
      rate: number; 
      department: string; 
      status: string; 
    }[];
  };
  announcements: {
    total: number;
    active: number;
    byCategory: { name: string; value: number }[];
  };
}

const Dashboard = () => {
  const [dateRange, setDateRange] = useState(getDateRange('month'));
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState({
    start: new Date(new Date().getFullYear(), 0, 1), // Jan 1st of current year
    end: new Date()
  });

  const processEventsData = (events: Event[]) => {
    const startDate = new Date(dateFilter.start);
    const endDate = new Date(dateFilter.end);
    const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 
      + endDate.getMonth() - startDate.getMonth() + 1;

    const monthlyStats = Array.from({ length: monthDiff }, (_, index) => {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1);
      return {
        name: `Tháng ${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`,
        'Hoàn thành': 0,
        'Đang diễn ra': 0,
        'Sắp diễn ra': 0,
        monthIndex: monthDate.getMonth(),
        yearIndex: monthDate.getFullYear()
      };
    });    events.forEach(event => {
      if (!event.startDate) return;
      const eventDate = new Date(event.startDate);
      if (eventDate >= startDate && eventDate <= endDate) {
        const monthEntry = monthlyStats.find(m => 
          m.monthIndex === eventDate.getMonth() && 
          m.yearIndex === eventDate.getFullYear()
        );

        if (monthEntry) {
          if (event.status === 'completed') {
            monthEntry['Hoàn thành']++;
          } else if (event.status === 'ongoing') {
            monthEntry['Đang diễn ra']++;
          } else {
            monthEntry['Sắp diễn ra']++;
          }
        }
      }
    });

    return {
      monthlyEvents: monthlyStats.map(({ name, ...stats }) => ({
        name,
        'Hoàn thành': stats['Hoàn thành'],
        'Đang diễn ra': stats['Đang diễn ra'],
        'Sắp diễn ra': stats['Sắp diễn ra']
      })),
      participation: events
        .sort((a, b) => 
          (b.participants?.length || 0) / (b.capacity || 100) - 
          (a.participants?.length || 0) / (a.capacity || 100)
        )
        .slice(0, 5)
        .map(event => ({
          name: event.title,          registered: event.participants?.length || 0,
          capacity: event.capacity || 100,
          startDate: event.startDate ? new Date(event.startDate).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'N/A',
          endDate: event.endDate ? new Date(event.endDate).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          }) : 'N/A',
          location: event.location?.physical 
            ? `${event.location.physical.address}${event.location.physical.room ? ` - ${event.location.physical.room}` : ''}`
            : 'Online',
          rate: Math.round(((event.participants?.length || 0) / (event.capacity || 100)) * 100),
          department: event.department?.name || 'Chưa phân khoa',
          status: event.status
        }))
    };
  };

  const processUserGrowthData = (users: User[]) => {
    const startDate = new Date(dateFilter.start);
    const endDate = new Date(dateFilter.end);
    const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 
      + endDate.getMonth() - startDate.getMonth() + 1;    return Array.from({ length: monthDiff }, (_, index) => {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1);
      return {
        name: `Tháng ${monthDate.getMonth() + 1}/${monthDate.getFullYear()}`,
        value: users.filter(user => {
          if (!user.createdAt) return false;
          const userDate = new Date(user.createdAt);
          return userDate.getMonth() === monthDate.getMonth() 
            && userDate.getFullYear() === monthDate.getFullYear();
        }).length
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [users, events, announcements] = await Promise.all([
          userService.getUsers(),
          eventService.getAllEvents(),
          announcementService.getAllAnnouncements()
        ]);

        const roleDistribution = users.reduce((acc, user) => {
          const role = user.role.charAt(0).toUpperCase() + user.role.slice(1);
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const processedGrowthData = processUserGrowthData(users);
        const processedEventsData = processEventsData(events);

        setStatsData({
          users: {
            total: users.length,
            roleDistribution: Object.entries(roleDistribution)
              .map(([name, value]) => ({ name, value })),
            growthData: processedGrowthData
          },
          events: {
            total: events.length,
            upcoming: events.filter((e: any) => e.startDate && new Date(e.startDate) > new Date()).length,
            byMonth: processedEventsData.monthlyEvents,
            participation: processedEventsData.participation
          },
          announcements: {
            total: announcements.length,
            active: announcements.filter(a => a.status === 'active').length,
            byCategory: Object.entries(
              announcements.reduce((acc, ann) => {
                acc[ann.category] = (acc[ann.category] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([name, value]) => ({ name, value }))
          }
        });
      } catch (err) {
        setError('Failed to load event statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, dateFilter]);

  return (
    <div className="p-6 space-y-8">

      {/* Charts Grid */}
      <div className="space-y-6">
        {/* Row 1: User Distribution & Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Role Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Phân bố người dùng</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statsData?.users.roleDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {statsData?.users.roleDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* User Growth Trend */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Tăng trưởng người dùng</h3>
              <div className="flex items-center gap-4">
                <DatePicker
                  selected={dateFilter.start}
                  onChange={(date) => setDateFilter(prev => ({ ...prev, start: date || new Date() }))}
                  selectsStart
                  startDate={dateFilter.start}
                  endDate={dateFilter.end}
                  dateFormat="dd/MM/yyyy"
                  className="px-3 py-2 border rounded-md"
                  placeholderText="Từ ngày"
                />
                <DatePicker
                  selected={dateFilter.end}
                  onChange={(date) => setDateFilter(prev => ({ ...prev, end: date || new Date() }))}
                  selectsEnd
                  startDate={dateFilter.start}
                  endDate={dateFilter.end}
                  minDate={dateFilter.start}
                  dateFormat="dd/MM/yyyy"
                  className="px-3 py-2 border rounded-md"
                  placeholderText="Đến ngày"
                />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statsData?.users.growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} người dùng mới`]} />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Monthly Events */}
        <div className="w-full">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Sự kiện theo tháng</h3>
              <div className="flex items-center gap-4">
                <DatePicker
                  selected={dateFilter.start}
                  onChange={(date) => setDateFilter(prev => ({ ...prev, start: date || new Date() }))}
                  selectsStart
                  startDate={dateFilter.start}
                  endDate={dateFilter.end}
                  dateFormat="dd/MM/yyyy"
                  className="px-3 py-2 border rounded-md"
                  placeholderText="Từ ngày"
                />
                <DatePicker
                  selected={dateFilter.end}
                  onChange={(date) => setDateFilter(prev => ({ ...prev, end: date || new Date() }))}
                  selectsEnd
                  startDate={dateFilter.start}
                  endDate={dateFilter.end}
                  minDate={dateFilter.start}
                  dateFormat="dd/MM/yyyy"
                  className="px-3 py-2 border rounded-md"
                  placeholderText="Đến ngày"
                />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={statsData?.events.byMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`${value || 0} sự kiện`, name]}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Bar dataKey="Hoàn thành" stackId="a" fill="#8884d8" />
                <Bar dataKey="Đang diễn ra" stackId="a" fill="#82ca9d" />
                <Bar dataKey="Sắp diễn ra" stackId="a" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Event Participation */}
        <div className="w-full">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Tỷ lệ tham gia sự kiện</h3>
            <div className="space-y-4">
              {statsData?.events.participation.map((event, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-700">{event.name}</p>
                      <p className="text-sm text-gray-500">
                        {event.startDate} - {event.endDate}
                      </p>
                      <p className="text-xs text-gray-400">
                        {event.location} | {event.department}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 w-64">
                      <span className="text-sm text-gray-600">
                        {event.registered}/{event.capacity}
                      </span>
                      <div className="relative w-full h-2 bg-gray-200 rounded">
                        <div
                          className={`absolute top-0 left-0 h-2 rounded ${
                            event.status === 'upcoming' ? 'bg-blue-600' :
                            event.status === 'ongoing' ? 'bg-green-600' :
                            'bg-gray-600'
                          }`}
                          style={{ width: `${event.rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">
                        {event.rate}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
