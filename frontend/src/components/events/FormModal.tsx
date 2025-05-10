import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XIcon } from '@heroicons/react/outline';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  fields: Array<{
    fieldId: string;
    label: string;
    type: string;
    required: boolean;
    options?: { label: string; value: string }[];
    placeholder?: string;
  }>;
  loading?: boolean;
}

const FormModal = ({ isOpen, onClose, onSubmit, fields, loading }: FormModalProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};

    fields.forEach((field) => {
      if (field.type === 'checkbox') {
        // Get all selected values for checkboxes
        const selectedValues = formData.getAll(field.fieldId);
        data[field.fieldId] = selectedValues.length > 0 ? selectedValues : '';
      } else {
        data[field.fieldId] = formData.get(field.fieldId) || '';
      }
    });

    onSubmit(data);
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.fieldId}
                  value={option.value}
                  required={field.required}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name={field.fieldId}
                  value={option.value}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );
      case 'select':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type={field.type === 'radio' ? 'radio' : 'checkbox'}
                  name={field.fieldId}
                  value={option.value}
                  required={field.required}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );
      case 'textarea':
        return (
          <textarea
            name={field.fieldId}
            required={field.required}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            rows={3}
            placeholder={field.placeholder}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            name={field.fieldId}
            required={field.required}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        );
      default:
        return (
          <input
            type={field.type}
            name={field.fieldId}
            required={field.required}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
                  Đăng ký tham gia sự kiện
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {fields.map((field) => (
                  <div key={field.fieldId}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Đang xử lý...' : 'Đăng ký'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default FormModal;
