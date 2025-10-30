import React from 'react';

type DangerButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export const DangerButton: React.FC<DangerButtonProps> = ({ icon, children, className = '', ...props }) => {
  return (
    <button
      {...props}
      className={
        `inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background ` +
        `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 ` +
        `disabled:pointer-events-none disabled:opacity-50 ` +
        `[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ` +
        `bg-red-600 hover:bg-red-700 text-white h-10 rounded-md px-4 py-2 ` +
        className
      }
    >
      {icon}
      {children}
    </button>
  );
};

export default DangerButton;


