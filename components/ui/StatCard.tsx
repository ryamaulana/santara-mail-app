import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string;
}

export function StatCard({ title, value, icon: Icon, colorClass }: StatCardProps) {
  // Determine coloring based on the passed colorClass
  const isEmerald = colorClass.includes('emerald');
  const isSky = colorClass.includes('sky') || colorClass.includes('blue');
  const isAmber = colorClass.includes('amber') || colorClass.includes('yellow');
  const isRose = colorClass.includes('rose') || colorClass.includes('red');

  const customIconContainer = cn(
    "p-3 rounded-xl transition-all duration-300 group-hover:scale-105 border",
    isEmerald && "bg-emerald-50 text-emerald-700 border-emerald-100",
    isSky && "bg-sky-50 text-sky-700 border-sky-100",
    isAmber && "bg-amber-50 text-amber-700 border-amber-100",
    isRose && "bg-rose-50 text-rose-750 border-rose-100"
  );

  const customCardBorder = cn(
    "glass-card p-5 rounded-2xl shadow-soft flex items-center space-x-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-350/80 group cursor-pointer border border-slate-200/50"
  );

  return (
    <div className={customCardBorder}>
      <div className={customIconContainer}>
        <Icon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-3" />
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          {title}
        </p>
        <h4 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
          {value}
        </h4>
      </div>
    </div>
  );
}

