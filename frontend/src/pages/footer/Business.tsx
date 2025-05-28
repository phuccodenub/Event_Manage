import React, { useState } from 'react';
import Header from '../../components/Header';
import PlanSelectionModal from '../../components/modals/PlanSelectionModal';
import ContactModal from '../../components/modals/ContactModal';
import { IoCheckmarkCircle, IoBriefcaseOutline, IoPeopleOutline, 
         IoTrendingUpOutline } from 'react-icons/io5';

const Business: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const pricingPlans = [
    {
      name: "Starter",
      price: "2,000,000",
      description: "Dành cho doanh nghiệp vừa và nhỏ",
      features: [
        "Đăng tin tuyển dụng không giới hạn",
        "Tiếp cận 1000+ sinh viên",
        "Báo cáo cơ bản",
        "Hỗ trợ qua email"
      ]
    },
    {
      name: "Business",
      price: "5,000,000",
      description: "Dành cho doanh nghiệp lớn",
      popular: true,
      features: [
        "Tất cả tính năng của gói Starter",
        "Tổ chức sự kiện riêng",
        "Tiếp cận 5000+ sinh viên",
        "Báo cáo chi tiết",
        "Hỗ trợ ưu tiên 24/7"
      ]
    },
    {
      name: "Enterprise",
      price: "Liên hệ",
      description: "Giải pháp tùy chỉnh",
      features: [
        "Tất cả tính năng của gói Business",
        "Giải pháp tùy chỉnh",
        "Tiếp cận không giới hạn",
        "Tư vấn chiến lược",
        "Hỗ trợ chuyên biệt"
      ]
    }
  ];

  const statistics = [
    { number: "30,000+", label: "Sinh viên" },
    { number: "500+", label: "Doanh nghiệp" },
    { number: "1,000+", label: "Sự kiện" },
    { number: "95%", label: "Đánh giá tích cực" }
  ];

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    setShowPlanModal(true);
  };

  const handleLearnMore = () => {
    const featuresSection = document.querySelector('#services');
    featuresSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="relative bg-orange-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Dịch vụ</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Dịch vụ doanh nghiệp</h1>
          <p className="text-xl opacity-90 max-w-2xl">
            Giải pháp tổ chức sự kiện toàn diện cho doanh nghiệp
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-8xl mx-auto space-y-24">
          {/* Statistics Section */}
          <section className="bg-white rounded-2xl shadow-sm p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {statistics.map((stat, index) => (
                <div key={index} className="text-center p-6 rounded-xl hover:bg-orange-50 transition-colors">
                  <div className="text-4xl font-bold text-orange-600 mb-3">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Services Grid */}
          <section id="services">
            <h2 className="text-3xl font-bold text-center mb-12">Dịch vụ của chúng tôi</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ServiceCard
                icon={IoBriefcaseOutline}
                title="Tuyển dụng"
                description="Tiếp cận nguồn nhân lực chất lượng từ sinh viên HUTECH"
                features={[
                  "Đăng tin tuyển dụng",
                  "Tổ chức job fair",
                  "Phỏng vấn trực tuyến"
                ]}
              />
              <ServiceCard
                icon={IoTrendingUpOutline}
                title="Marketing"
                description="Quảng bá thương hiệu đến đối tượng sinh viên tiềm năng"
                features={[
                  "Quảng cáo sự kiện",
                  "Brand awareness",
                  "Digital marketing"
                ]}
              />
              <ServiceCard
                icon={IoPeopleOutline}
                title="Hợp tác"
                description="Tổ chức sự kiện hợp tác giữa doanh nghiệp và trường học"
                features={[
                  "Workshop chuyên môn",
                  "Seminar nghề nghiệp",
                  "Chương trình thực tập"
                ]}
              />
            </div>
          </section>

          {/* Pricing Section */}
          <section className="relative">
            <h2 className="text-3xl font-bold text-center mb-20">Bảng giá dịch vụ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-20">
              {pricingPlans.map((plan, index) => (
                <div 
                  key={index} 
                  className={`
                    bg-white rounded-2xl p-8 shadow-sm transition-all duration-300
                    ${plan.popular ? 'ring-2 ring-orange-500 shadow-lg scale-105' : 'hover:shadow-xl border border-gray-100'}
                    relative
                  `}
                >
                  {plan.popular && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/4 bg-orange-600 text-white px-4 py-1 text-sm rounded-full shadow-sm">
                      Phổ biến nhất
                    </span>
                  )}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>
                  <div className="text-center mb-8">
                    <div className="text-4xl font-bold text-orange-600">
                      {plan.price}
                    </div>
                    <div className="text-gray-500">VNĐ/tháng</div>
                  </div>
                  <ul className="space-y-4 mb-8 min-h-[280px]">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <IoCheckmarkCircle className="text-orange-500 text-xl flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSelectPlan(plan.name)}
                    className={`
                      w-full py-4 rounded-xl font-medium transition-all duration-300
                      ${plan.popular 
                        ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md hover:shadow-lg' 
                        : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}
                    `}
                  >
                    Chọn gói này
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-12 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-orange-600">Bắt đầu hợp tác ngay hôm nay</h2>
              <p className="text-lg text-orange-600/90 mb-8">
                Hãy để chúng tôi giúp doanh nghiệp của bạn tiếp cận với nguồn nhân lực chất lượng từ HUTECH
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button 
                  onClick={handleLearnMore}
                  className="px-8 py-3 ring-1 ring-orange-600 bg-white text-orange-600 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:bg-orange-50"
                >
                  Tìm hiểu thêm
                </button>
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="px-8 py-3 bg-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:bg-orange-800"
                >
                  Liên hệ ngay
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Plan Selection Modal */}
      <PlanSelectionModal 
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        selectedPlan={selectedPlan}
      />

      {/* Contact Modal */}
      <ContactModal 
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </div>
  );
};

const ServiceCard = ({ icon: Icon, title, description, features }: {
  icon: any;
  title: string;
  description: string;
  features: string[];
}) => (
  <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-100">
    <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
      <Icon className="w-7 h-7 text-orange-600" />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    <ul className="space-y-3">
      {features.map((feature: string, index: number) => (
        <li key={index} className="flex items-center gap-2 text-gray-600">
          <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

export default Business;
