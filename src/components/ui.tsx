import type { HTMLAttributes, ReactNode } from "react";

export function Container({ children, className = "", ...props }: HTMLAttributes<HTMLElement> & { children?: ReactNode }) {
  return (
    <div className={`mx-auto w-[min(1200px,calc(100%-48px))] ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
