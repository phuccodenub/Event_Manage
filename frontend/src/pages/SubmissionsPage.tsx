import React, { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Header from '@/components/Header';
import eventService from '@/services/eventService';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface FormField {
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
}

const SubmissionsPage = () => {
  const { id } = useParams();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventData, formData, submissionsData] = await Promise.all([
          eventService.getEventById(id),
          eventService.getEventForm(id),
          eventService.getFormSubmissions(id)
        ]);

        console.log('Event Data:', eventData);
        console.log('Form Data:', formData);
        console.log('Submissions:', submissionsData);

        setEvent({
          ...eventData.data,
          registrationForm: {
            fields: formData.data.fields || []
          }
        });
        setSubmissions(submissionsData.data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Có lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const generateChartData = (fieldId: string) => {
    const responses = submissions.map(s => s.formResponses?.[fieldId]);
    const counts: { [key: string]: number } = {};

    responses.forEach(response => {
      // Chỉ xử lý checkbox là array, các loại khác xử lý như single value
      if (Array.isArray(response) && response.length > 0) {
        response.forEach(value => {
          counts[value] = (counts[value] || 0) + 1;
        });
      } else if (response) {
        counts[response] = (counts[response] || 0) + 1;
      }
    });

    // Sort by count in descending order
    const sortedLabels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    return {
      labels: sortedLabels,
      datasets: [{
        data: sortedLabels.map(label => counts[label]),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#4BC0C0', '#7CB5EC', '#90ED7D', '#F7A35C'
        ],
        label: 'Số lượng'
      }]
    };
  };

  const renderFieldResponse = (field: FormField, submission: any) => {
    const response = submission.formResponses?.[field.fieldId];
    
    // Skip rendering if response is empty
    if (!response && response !== 0) return null;
  
    if (field.type === 'checkbox') {
      const selectedValues = Array.isArray(response) ? response : [response];
      if (selectedValues.length === 0) return null;
  
      return (
        <div className="space-y-1">
          {selectedValues.map((value: string, index: number) => (
            <div key={`${submission._id}-${field.fieldId}-${index}`} className="flex items-center gap-2">
              <svg className="h-4 w-4 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{value}</span>
            </div>
          ))}
        </div>
      );
    }
  
    if (field.type === 'date' ) {
      const [year, month, day] = response.split('-');
      return (
        <p className="text-sm text-gray-700">{`${day}/${month}/${year}`}</p>
      );
    }
  
    if (field.type === 'number') {
      return (
        <p className="text-sm text-gray-700">{response.toLocaleString('vi-VN')}</p>
      );
    }
  
    // For all other field types
    return (
      <p className="text-sm text-gray-700 break-words">{response}</p>
    );
  };

  const renderTabs = () => (
    <div className="border-b border-gray-200">
      <nav className="flex justify-center" aria-label="Tabs">
        {[
          { id: 'summary', name: 'Bản tóm tắt' },
          { id: 'questions', name: 'Câu hỏi' },
          { id: 'responses', name: 'Cá nhân' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${
              activeTab === tab.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center`}
          >
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );

  const renderIndividualResponse = () => {
    if (!selectedSubmission) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Danh sách người trả lời ({submissions.length})</h2>
            <div className="space-y-3">
              {submissions.map((submission) => (
                <button
                  key={submission._id}
                  onClick={() => setSelectedSubmission(submission)}
                  className="w-full flex items-start p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <div className="flex-shrink-0">
                    {submission.user.avatar?.url ? (
                      <img
                        src={submission.user.avatar.url}
                        alt={submission.user.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0U1RTdFQiIgZD0iTTI0IDIwLjk5M1YyNEgwdi0yLjk5NmMwLTMuMzMyIDMuMzMzLTYuMDA1IDcuNS02LjAwNWg5YzQuMTY3IDAgNy41IDIuNjczIDcuNSA2LjAwNXptLTEyLThjLTIuNzYxIDAtNS00LjIzOS01LTdWM2MwLTIuNzYxIDIuMjM5LTUgNS01czUgMi4yMzkgNSA1djNjMCAyLjc2MS0yLjIzOSA3LTUgN3oiLz48L3N2Zz4=";
                        }}
                      />
                    ) : (
                      <svg 
                        className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 p-2"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium">{submission.user.fullName}</h3>
                    <p className="text-sm text-gray-500">{submission.user.email}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(submission.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedSubmission(null)}
            className="text-orange-600 hover:text-orange-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại danh sách
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* User info header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            {selectedSubmission.user.avatar?.url ? (
              <img
                src={selectedSubmission.user.avatar.url}
                alt={selectedSubmission.user.fullName}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0U1RTdFQiIgZD0iTTI0IDIwLjk5M1YyNEgwdi0yLjk5NmMwLTMuMzMyIDMuMzMzLTYuMDA1IDcuNS02LjAwNWg5YzQuMTY3IDAgNy41IDIuNjczIDcuNSA2LjAwNXptLTEyLThjLTIuNzYxIDAtNS00LjIzOS01LTdWM2MwLTIuNzYxIDIuMjM5LTUgNS01czUgMi4yMzkgNSA1djNjMCAyLjc2MS0yLjIzOSA3LTUgN3oiLz48L3N2Zz4=";
                }}
              />
            ) : (
              <svg 
                className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 p-2"
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
                  clipRule="evenodd" 
                />
              </svg>
            )}
            <div>
              <h3 className="font-medium text-lg">{selectedSubmission.user.fullName}</h3>
              <p className="text-gray-500">{selectedSubmission.user.email}</p>
              <p className="text-sm text-gray-400">
                {format(new Date(selectedSubmission.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
          </div>

          {/* Form responses */}
          <div className="grid gap-4">
            {event?.registrationForm?.fields?.map((field: FormField) => {
              const response = renderFieldResponse(field, selectedSubmission);
              if (!response) return null;

              return (
                <div 
                  key={field.fieldId} 
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <p className="font-medium text-gray-900 mb-2">{field.label}</p>
                  {response}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryField = (field: FormField) => {
    const totalResponses = submissions.length;
    const hasResponses = submissions.some(s => s.formResponses?.[field.fieldId]);

    return (
      <div key={field.fieldId} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{field.label}</h3>
        
        {!hasResponses ? (
          <p className="text-sm text-gray-500">Chưa có câu trả lời nào</p>
        ) : (
          <>
            {/* Chỉ hiển thị biểu đồ cho radio và checkbox */}
            {(field.type === 'radio' || field.type === 'checkbox') && (
              <div className="mb-6 bg-gray-50 p-6 rounded-lg">
                <div className="w-full max-w-md mx-auto">
                  <Pie 
                    data={generateChartData(field.fieldId)}
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom'
                        },
                        tooltip: {
                          callbacks: {
                            label: (context: any) => {
                              const value = context.raw;
                              const percentage = ((value / totalResponses) * 100).toFixed(1);
                              return `${context.label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Text responses summary */}
            {['text', 'textarea', 'email', 'date', 'number'].includes(field.type) && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Một số câu trả lời:</p>
                {submissions
                  .filter(submission => submission.formResponses?.[field.fieldId])
                  .slice(0, 5)
                  .map((submission, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className="text-sm text-gray-700">
                        {submission.formResponses[field.fieldId]}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className="space-y-8">
            {event?.registrationForm?.fields?.map(renderSummaryField)}
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-8">
            {event?.registrationForm?.fields?.map((field: FormField) => {
              // Get non-empty responses for this field
              const nonEmptyResponses = submissions.filter(submission => {
                const response = submission.formResponses?.[field.fieldId];
                if (!response && response !== 0) return false;
                if (Array.isArray(response)) return response.length > 0;
                return true;
              });

              if (nonEmptyResponses.length === 0) return null;

              return (
                <div key={field.fieldId} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </h2>
                  <div className="mt-4">
                    <div className="space-y-3">
                      {nonEmptyResponses.map((submission) => (
                        <div 
                          key={`${submission._id}-${field.fieldId}`} 
                          className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {submission.user.avatar?.url ? (
                              <img
                                src={submission.user.avatar.url}
                                alt={submission.user.fullName}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI0U1RTdFQiIgZD0iTTI0IDIwLjk5M1YyNEgwdi0yLjk5NmMwLTMuMzMyIDMuMzMzLTYuMDA1IDcuNS02LjAwNWg5YzQuMTY3IDAgNy41IDIuNjczIDcuNSA2LjAwNXptLTEyLThjLTIuNzYxIDAtNS00LjIzOS01LTdWM2MwLTIuNzYxIDIuMjM5LTUgNS01czUgMi4yMzkgNSA1djNjMCAyLjc2MS0yLjIzOSA3LTUgN3oiLz48L3N2Zz4=";
                                }}
                              />
                            ) : (
                              <svg 
                                className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 p-2"
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path 
                                  fillRule="evenodd" 
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
                                  clipRule="evenodd" 
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {submission.user.fullName}
                            </p>
                            {renderFieldResponse(field, submission)}
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(submission.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'responses':
        return renderIndividualResponse();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{event?.title}</h1>
            <p className="text-gray-600 mt-1">{submissions.length} người đã đăng ký tham gia</p>
          </div>
          {renderTabs()}
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsPage;
