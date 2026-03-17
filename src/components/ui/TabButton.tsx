import React from 'react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

export const TabButton = ({ active, onClick, icon: Icon, label }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
      active 
        ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20 scale-105' 
        : 'text-gray-400 hover:text-brand-accent hover:bg-brand-accent/5'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm font-semibold tracking-wide">{label}</span>
  </button>
);
