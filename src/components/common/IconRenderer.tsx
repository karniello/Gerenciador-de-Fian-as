import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-4 h-4', size }) => {
  // @ts-ignore
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;

  return <IconComponent className={className} size={size} />;
};
