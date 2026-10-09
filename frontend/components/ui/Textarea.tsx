import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <textarea
        className={`flex min-h-[120px] w-full rounded-[8px] border bg-white px-[12px] py-3 text-[16px] text-text-primary transition-colors placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-page disabled:text-text-secondary resize-y ${
          error ? "border-error focus-visible:ring-error/20 focus-visible:border-error" : "border-border"
        } ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
