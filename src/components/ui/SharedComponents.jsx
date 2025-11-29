import React from 'react';
import { X } from 'lucide-react';
import { COLORS } from '../../utils/constants';

export const Button = ({ children, variant = 'primary', className = '', onClick, icon: Icon, disabled = false, type = "button", title="" }) => {
  const variants = {
    primary: `${COLORS.primary} text-white ${COLORS.primaryHover}`,
    secondary: `${COLORS.secondary} text-white hover:opacity-90`,
    accent: `${COLORS.accent} text-[#1A1A1A] font-bold ${COLORS.accentHover} shadow-sm`,
    danger: `bg-[#B71C1C] text-white hover:bg-[#941313]`,
    outline: `border-2 ${COLORS.border} text-[#1A1A1A] hover:bg-gray-100`,
    ghost: `text-[#4A4A4A] hover:bg-gray-100`
  };
  return (
    <button type={type} disabled={disabled} title={title} className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`} onClick={onClick}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export const Card = ({ children, className = '', title, action }) => (
  <div className={`${COLORS.panel} rounded-xl shadow-sm border ${COLORS.border} ${className} overflow-hidden`}>
    {(title || action) && (
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        {title && <h3 className="font-bold text-[#1A1A1A]">{title}</h3>}
        {action}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-[#0F4C3A] text-white">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};