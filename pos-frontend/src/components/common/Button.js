import React from 'react';

export const Button = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md transition-colors';
  
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2',
    danger: 'bg-red-500 hover:bg-red-600 text-white px-4 py-2',
    icon: 'p-1 hover:bg-gray-100 rounded-full',
    default: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2'
  };

  const variantStyles = variants[variant];

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}; 