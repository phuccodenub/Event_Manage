import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface FormField {
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface Props {
  initialFields?: FormField[];
  onChange: (fields: FormField[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Văn bản ngắn' },
  { value: 'textarea', label: 'Văn bản dài' },
  { value: 'number', label: 'Số' },
  { value: 'email', label: 'Email' },
  { value: 'select', label: 'Lựa chọn một' },
  { value: 'radio', label: 'Radio buttons' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Ngày' },
];

export const FormBuilder: React.FC<Props> = ({ initialFields = [], onChange }) => {
  const [fields, setFields] = useState<FormField[]>(initialFields);

  const addField = (type: string) => {
    const newField: FormField = {
      fieldId: `field_${Date.now()}`,
      label: 'Câu hỏi mới',
      type,
      required: false
    };
    
    if (['select', 'radio', 'checkbox'].includes(type)) {
      newField.options = [
        { label: 'Tùy chọn 1', value: '1' }
      ];
    }

    setFields([...fields, newField]);
    onChange([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
    onChange(newFields);
  };

  const deleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    onChange(newFields);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFields(items);
    onChange(items);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {FIELD_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => addField(type.value)}
            className="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 
                     text-orange-700 rounded-full transition-colors"
          >
            + {type.label}
          </button>
        ))}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="form-fields">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {fields.map((field, index) => (
                <Draggable
                  key={field.fieldId}
                  draggableId={field.fieldId}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="p-4 bg-white rounded-lg shadow-sm border 
                               border-gray-200 hover:border-orange-300 
                               transition-colors"
                    >
                      <div className="grid gap-4">
                        <div className="flex justify-between">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            className="text-lg font-medium bg-transparent border-none 
                                     focus:outline-none focus:ring-2 focus:ring-orange-500/20 
                                     rounded px-2 py-1 w-full"
                            placeholder="Nhập câu hỏi..."
                          />
                          <button
                            onClick={() => deleteField(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {['select', 'radio', 'checkbox'].includes(field.type) && (
                          <div className="space-y-2">
                            {field.options?.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={option.label}
                                  onChange={(e) => {
                                    const newOptions = [...(field.options || [])];
                                    newOptions[optionIndex] = {
                                      ...newOptions[optionIndex],
                                      label: e.target.value,
                                      value: e.target.value
                                    };
                                    updateField(index, { options: newOptions });
                                  }}
                                  className="border-gray-300 rounded-md focus:border-orange-500 
                                           focus:ring-orange-500/20"
                                  placeholder={`Tùy chọn ${optionIndex + 1}`}
                                />
                                <button
                                  onClick={() => {
                                    const newOptions = field.options?.filter((_, i) => i !== optionIndex);
                                    updateField(index, { options: newOptions });
                                  }}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newOptions = [...(field.options || [])];
                                newOptions.push({ label: '', value: '' });
                                updateField(index, { options: newOptions });
                              }}
                              className="text-sm text-orange-600 hover:text-orange-700"
                            >
                              + Thêm tùy chọn
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(index, { required: e.target.checked })}
                              className="text-orange-600 rounded border-gray-300 
                                       focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-600">Bắt buộc</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default FormBuilder;
