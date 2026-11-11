import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = "Memuat data...",
  size = "md",
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-emerald-600`} />
      {label && <p className="text-sm font-medium text-slate-600 tracking-wide">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 max-w-xs w-full mx-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = "h-4 w-full" }) => {
  return <div className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`} />;
};
