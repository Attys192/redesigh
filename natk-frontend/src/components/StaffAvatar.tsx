'use client';

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

interface StaffAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
  imageClassName?: string;
  showInitials?: boolean;
}

export default function StaffAvatar({
  name,
  src,
  className = '',
  imageClassName = 'object-contain',
  showInitials = true,
}: StaffAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (src && !imageFailed) {
    return (
      <div className={`flex items-center justify-center overflow-hidden bg-slate-100 ${className}`}>
        <img
          src={src}
          alt={name}
          className={`h-full w-full ${imageClassName}`}
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <User size={32} strokeWidth={1.8} />
        {showInitials && initials && <span className="text-sm font-semibold text-slate-500">{initials}</span>}
      </div>
    </div>
  );
}
