import type { HTMLAttributes, ReactNode } from "react";

const containerWidths = {
  narrow: "w-[min(880px,calc(100%-40px))]",
  default: "w-[min(1280px,calc(100%-40px))]",
  wide: "w-[min(1440px,calc(100%-40px))]"
} as const;

export type ContainerSize = keyof typeof containerWidths;

export function Container({
  children,
  className = "",
  size = "default",
  ...props
}: HTMLAttributes<HTMLElement> & { children?: ReactNode; size?: ContainerSize }) {
  return (
    <div className={`mx-auto ${containerWidths[size]} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
