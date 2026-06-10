import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
}

export function StatCard({ title, value, icon: Icon, colorClass }: StatCardProps) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">
          {title}
        </p>
        <h4 className="text-xl sm:text-2xl font-extrabold text-slate-800">
          {value}
        </h4>
      </div>
    </div>
  );
}
