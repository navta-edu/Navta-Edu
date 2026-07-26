import React from 'react';

export default function Card({ children, className = '', title = '', subtitle = '', action = null }) {
  return (
    <div className={`glass rounded-3xl p-6 shadow-sm transition-all duration-200 border border-slate-100 dark:border-slate-800/40 hover:shadow-md ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between mb-4 border-b border-slate-100/30 dark:border-slate-800/30 pb-3">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
