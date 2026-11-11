import React from "react";
import { Skeleton } from "../Loading/LoadingSpinner";

interface StatCardProps {
  id?: string;
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "emerald" | "blue" | "amber" | "indigo" | "teal" | "orange" | "red";
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon,
  variant = "red",
  isLoading = false
}) => {
  const variantStyles = {
    red: {
      bgIcon: "bg-red-50 text-red-600 border-red-200",
      accent: "text-red-600",
      border: "hover:border-red-400"
    },
    emerald: {
      bgIcon: "bg-emerald-50 text-emerald-600 border-emerald-200",
      accent: "text-emerald-600",
      border: "hover:border-emerald-400"
    },
    blue: {
      bgIcon: "bg-blue-50 text-blue-600 border-blue-200",
      accent: "text-blue-600",
      border: "hover:border-blue-400"
    },
    amber: {
      bgIcon: "bg-amber-50 text-amber-600 border-amber-200",
      accent: "text-amber-600",
      border: "hover:border-amber-400"
    },
    indigo: {
      bgIcon: "bg-purple-50 text-purple-600 border-purple-200",
      accent: "text-purple-600",
      border: "hover:border-purple-400"
    },
    teal: {
      bgIcon: "bg-teal-50 text-teal-600 border-teal-200",
      accent: "text-teal-600",
      border: "hover:border-teal-400"
    },
    orange: {
      bgIcon: "bg-orange-50 text-orange-600 border-orange-200",
      accent: "text-orange-600",
      border: "hover:border-orange-400"
    }
  };

  const style = variantStyles[variant] || variantStyles.red;

  return (
    <div
      id={id}
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.border}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] truncate">{title}</p>
          {isLoading ? (
            <Skeleton className="h-9 w-20 my-1 bg-slate-100" />
          ) : (
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              {typeof value === "number" ? value.toLocaleString("id-ID") : value}
            </h3>
          )}
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-medium truncate">{subtitle}</p>
          )}
        </div>

        <div className={`p-3 rounded-2xl border ${style.bgIcon} shrink-0 shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
