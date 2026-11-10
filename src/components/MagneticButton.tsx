import React, { useRef, useState } from 'react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 0.25,
  className = '',
  variant = 'primary',
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const y = (e.clientY - (rect.top + rect.height / 2)) * strength;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const baseStyles = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none rounded-xl text-sm px-5 py-2.5';
  const variantStyles = {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-105 active:scale-95',
    secondary: 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-300 shadow-sm dark:shadow-md',
    outline: 'bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/10 hover:border-emerald-500',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5',
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: position.x === 0 && position.y === 0 ? 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'transform 0.1s ease-out',
      }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
