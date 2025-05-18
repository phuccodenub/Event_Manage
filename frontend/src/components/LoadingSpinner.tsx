import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  className = '' 
}) => {
  // Determine spinner size based on the prop
  const spinnerSize = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }[size];

  return (
    <div className="flex justify-center py-12">
      <div 
        className={`animate-spin rounded-full ${spinnerSize} border-t-2 border-b-2 border-orange-500 ${className}`}
      ></div>
    </div>
  );
};

export default LoadingSpinner; 