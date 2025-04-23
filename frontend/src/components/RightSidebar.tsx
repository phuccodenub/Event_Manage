import React from 'react';

const RightSidebar: React.FC = () => {
  return (
    <aside className="hidden md:block col-span-1">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">Sự kiện sắp diễn ra</h2>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-green-600">
            Tech Talk: AI và Tương lai ngành IT
          </h3>
          <p className="text-xs text-gray-500">30/04/2025 (14:00 - 16:30)</p>
          <button className="mt-2 text-sm text-white bg-green-600 px-4 py-1 rounded-full">
            Tham gia
          </button>
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-green-600">
            Cuộc thi Sáng tạo Robot HUTECH
          </h3>
          <p className="text-xs text-gray-500">10/05/2025 (08:00 - 17:00)</p>
          <button className="mt-2 text-sm text-white bg-green-600 px-4 py-1 rounded-full">
            Tham gia
          </button>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
