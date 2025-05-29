import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface FormField {
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface UseAutoFillUserDataOptions {
  formFields: FormField[];
  setFormData: (data: Record<string, any>) => void;
  formData: Record<string, any>;
}

/**
 * Hook để tự động điền thông tin user vào form
 */
export const useAutoFillUserData = ({ 
  formFields, 
  setFormData, 
  formData 
}: UseAutoFillUserDataOptions) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !formFields.length) return;

    // Mapping từ fieldId sang user data
    const fieldMapping: Record<string, any> = {
      fullName: user.fullName || '',
      name: user.fullName || '',
      firstName: user.fullName?.split(' ')[0] || '',
      lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
      phone: user.phone || '',
      phoneNumber: user.phone || '',
      studentId: user.userId || '',
      mssv: user.userId || '',
      userId: user.userId || '',
      class: user.class || '',
      lop: user.class || '',
      department: user.department || '',
      khoa: user.department || '',
      faculty: user.department || '',
      role: user.role || '',
      dateOfBirth: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      gender: user.gender || '',
      gioiTinh: user.gender || '',
    };

    // Tạo form data mới với auto-fill
    const autoFilledData: Record<string, any> = { ...formData };
    let hasChanges = false;

    formFields.forEach((field) => {
      const fieldValue = fieldMapping[field.fieldId];
      
      // Chỉ auto-fill nếu:
      // 1. Có data từ user
      // 2. Form field hiện tại đang trống
      if (fieldValue && !autoFilledData[field.fieldId]) {
        if (field.type === 'checkbox') {
          autoFilledData[field.fieldId] = [];
        } else {
          autoFilledData[field.fieldId] = fieldValue;
          hasChanges = true;
        }
      } else if (!autoFilledData[field.fieldId]) {
        // Nếu không có data và chưa có giá trị, set default
        if (field.type === 'checkbox') {
          autoFilledData[field.fieldId] = [];
        } else {
          autoFilledData[field.fieldId] = '';
        }
      }
    });

    // Chỉ update nếu có thay đổi để tránh re-render không cần thiết
    if (hasChanges) {
      console.log('Auto-filling form with user data:', autoFilledData);
      setFormData(autoFilledData);
    }
  }, [user, formFields, setFormData]); // Removed formData from deps to avoid infinite loop

  return {
    isUserDataAvailable: !!user,
    availableFields: user ? Object.keys({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      studentId: user.userId,
      userId: user.userId,
      class: user.class,
      department: user.department,
    }).filter(key => {
      if (key === 'department') {
        return !!user.department;
      }
      return !!(user as any)[key];
    }) : []
  };
}; 