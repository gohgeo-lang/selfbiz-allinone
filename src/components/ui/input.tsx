import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
