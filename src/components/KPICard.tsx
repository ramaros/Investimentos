import React from "react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  bgGradient?: string;
}

export function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  iconBgColor,
  iconColor
}: KPICardProps) {
  return (
    <div className="relative overflow-hidden bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-slate-500 font-medium">{subtext}</p>}
        </div>
        <div className={`p-3.5 rounded-xl ${iconBgColor} ${iconColor} transition-all duration-300 shadow-sm`}>
          <Icon className="w-5.5 h-5.5" />
        </div>
      </div>
    </div>
  );
}
