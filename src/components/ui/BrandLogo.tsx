import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  theme = 'light',
}) => {
  const sizeMap = {
    sm: { img: 'w-10 h-10', title: 'text-lg', sub: 'text-[10px]' },
    md: { img: 'w-16 h-16', title: 'text-2xl', sub: 'text-[11px]' },
    lg: { img: 'w-20 h-20', title: 'text-3xl', sub: 'text-sm' },
    xl: { img: 'w-28 h-28', title: 'text-4xl', sub: 'text-base' },
  };

  const dim = sizeMap[size];
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subTextColor = theme === 'dark' ? 'text-amber-400' : 'text-amber-700';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official circular emblem matching the user's brand logo asset */}
      <div className={`relative flex-shrink-0 ${dim.img} rounded-full shadow-sm hover:scale-105 transition-transform duration-200 overflow-hidden bg-white`}>
        <img
          src="/goamate-logo-round.png"
          alt="GoaMate Car & Bike Rental Official Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-extrabold tracking-tight ${textColor} ${dim.title}`}>
            GOA<span className="text-emerald-500">MATE</span>
          </span>
          <span className={`font-semibold tracking-wider uppercase ${subTextColor} ${dim.sub}`}>
            Car &amp; Bike Rental
          </span>
        </div>
      )}
    </div>
  );
};
