import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  title: React.ReactNode;
  icon: React.ElementType;
  className?: string;
  headerAction?: React.ReactNode;
  key?: React.Key;
}

export const Card = ({ children, title, icon: Icon, className = "", headerAction }: CardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-card-bg rounded-[2rem] card-shadow border border-black/5 dark:border-white/5 p-8 ${className}`}
  >
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-brand-accent/5 rounded-2xl">
          <Icon className="w-6 h-6 text-brand-accent" />
        </div>
        <h2 className="text-xl font-serif font-bold tracking-tight text-brand-primary">{title}</h2>
      </div>
      {headerAction}
    </div>
    {children}
  </motion.div>
);
