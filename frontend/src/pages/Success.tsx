import { useNavigate } from 'react-router-dom';

const Success = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-green-100">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Đăng nhập thành công!</h1>
        <p className="text-lg mb-6">Chào mừng bạn đến với hệ thống quản lý sự kiện Hutech.</p>
        <button
          onClick={handleGoHome}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default Success;
