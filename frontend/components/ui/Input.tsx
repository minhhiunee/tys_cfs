import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-[48px] w-full rounded-[8px] border bg-white px-[12px] py-2 text-[16px] text-text-primary transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-page disabled:text-text-secondary ${
          error ? "border-error focus-visible:ring-error/20 focus-visible:border-error" : "border-border"
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
