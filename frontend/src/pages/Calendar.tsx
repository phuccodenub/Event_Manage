import React, { useState } from 'react';
import TopBar from '../components/Footer';
import Header from '../components/Header';

const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const events = [
    { date: '2023-11-01', title: 'Hội thảo AI trong giáo dục', description: 'Tham gia hội thảo về AI trong giáo dục.' },
    { date: '2023-11-02', title: 'Workshop Kỹ năng mềm', description: 'Nâng cao kỹ năng giao tiếp và làm việc nhóm.' },
    { date: '2023-11-03', title: 'Ngày hội việc làm', description: 'Cơ hội việc làm từ các doanh nghiệp hàng đầu.' },
    { date: '2023-11-03', title: 'Ngày hội việc làm', description: 'Cơ hội việc làm từ các doanh nghiệp hàng đầu.' },
  ];

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate(); // Returns the last day of the previous month
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
  };

  const renderCalendar = () => {
    const year = 2023; // Example year
    const month = 11; // Example month (November)
    const daysInMonth = getDaysInMonth(year, month);
    const calendarDays = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const isSelected = selectedDate === date;
      const hasEvent = events.some((event) => event.date === date);

      calendarDays.push(
        <div
          key={date}
          className={`p-4 border rounded-lg text-center cursor-pointer ${
            isSelected ? 'bg-orange-500 text-white' : 'bg-white text-gray-800'
          } ${hasEvent ? 'border-orange-500' : 'border-gray-300'}`}
          onClick={() => handleDateClick(date)}
        >
          {i}
        </div>
      );
    }
    return calendarDays;
  };

  const renderEvents = () => {
    const filteredEvents = events.filter((event) => event.date === selectedDate);
    if (filteredEvents.length === 0) {
      return <p className="text-gray-600">Không có sự kiện nào trong ngày này.</p>;
    }
    return filteredEvents.map((event, index) => (
      <div key={index} className="p-4 bg-white shadow-md rounded-lg mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
        <p className="text-gray-600">{event.description}</p>
      </div>
    ));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFAF0]">
      {/* Top Bar */}
      <TopBar />

      {/* Header */}
      <Header />

      {/* Banner Section */}
      <section className="bg-blue-600 text-white text-center py-16">
        <h1 className="text-4xl font-bold">Lịch sự kiện</h1>
        <p className="mt-4 text-lg">Xem và quản lý các sự kiện theo ngày</p>
      </section>

      {/* Calendar Section */}
      <section className="container mx-auto py-16">
        <div className="grid grid-cols-7 gap-4">
          {renderCalendar()}
        </div>
      </section>

      {/* Events Section */}
      <section className="container mx-auto py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Sự kiện trong ngày</h2>
        {selectedDate ? renderEvents() : <p className="text-gray-600">Chọn một ngày để xem sự kiện.</p>}
      </section>
    </div>
  );
};

export default Calendar;
