import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  title: React.ReactNode;
  icon: React.ElementType;
  className?: string;
  headerAction?: React.ReactNode;
  key?: React.Key;
  iconClassName?: string;
  iconBgClassName?: string;
}

export const Card = ({ children, title, icon: Icon, className = "", headerAction, iconClassName = "", iconBgClassName = "" }: CardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-card-bg rounded-[2rem] card-shadow border border-black/5 dark:border-white/5 p-5 sm:p-8 ${className}`}
  >
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${iconBgClassName || 'bg-brand-accent/5'}`}>
          <Icon className={`w-6 h-6 ${iconClassName || 'text-brand-accent'}`} />
        </div>
        <h2 className="text-xl font-serif font-bold tracking-tight text-brand-primary">{title}</h2>
      </div>
      {headerAction}
    </div>
    {children}
  </motion.div>
);
