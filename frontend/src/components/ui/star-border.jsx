import React from 'react';
import { cn } from '../../lib/utils';

export function StarBorder({
  as: ComponentProp,
  className,
  color,
  speed = '6s',
  children,
  ...props
}) {
  const Component = ComponentProp || 'button';
  const defaultColor = color || 'hsl(var(--foreground))';

  return (
    <Component
      className={cn(
        'relative inline-block py-[1px] overflow-hidden rounded-[20px]',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'absolute w-[300%] h-[50%] bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0',
          'opacity-20 dark:opacity-70'
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={cn(
          'absolute w-[300%] h-[50%] top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0',
          'opacity-20 dark:opacity-70'
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className={cn(
        'relative z-10 border text-center text-base py-4 px-6 rounded-[20px]',
        'text-white',
        'bg-gradient-to-b from-background/90 to-muted/90 border-border/40',
        'dark:from-background dark:to-muted dark:border-border'
      )}>
        {children}
      </div>
    </Component>
  );
}

export default StarBorder;
