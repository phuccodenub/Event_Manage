import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Submission {
  _id: string;
  user: {
    fullName: string;
    email: string;
  };
  formData: Record<string, string>;
  createdAt: string;
  status: string;
}

interface SubmissionsTableProps {
  submissions: Submission[];
  fields: Array<{
    fieldId: string;
    label: string;
  }>;
}

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({ submissions, fields }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Người đăng ký
            </th>
            {fields.map(field => (
              <th key={field.fieldId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {field.label}
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thời gian đăng ký
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trạng thái
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.map((submission) => (
            <tr key={submission._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-900">
                    {submission.user.fullName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {submission.user.email}
                  </div>
                </div>
              </td>
              {fields.map(field => (
                <td key={field.fieldId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {submission.formData[field.fieldId]}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(submission.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${submission.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {submission.status === 'approved' ? 'Đã duyệt' :
                    submission.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubmissionsTable;
