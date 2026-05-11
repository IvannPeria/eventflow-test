"use client";

import { forwardRef } from "react";

const variants = {
  primary:
    "bg-gradient-to-r from-surface-tint to-brand-deep text-on-secondary shadow-[0_0_15px_rgba(81,153,245,0.3)] hover:shadow-[0_0_25px_rgba(81,153,245,0.45)] active:scale-[0.98]",
  secondary:
    "border border-white/10 bg-white/5 text-on-background hover:border-surface-tint/30 hover:bg-white/10 active:scale-[0.98]",
  ghost:
    "text-on-surface-variant hover:text-surface-tint border border-transparent hover:border-white/10",
  danger:
    "bg-error-container text-error hover:bg-error/90 hover:text-on-error border border-error/20",
};

const sizes = {
  md: "px-5 py-3 text-sm rounded-xl",
  lg: "px-6 py-4 text-base rounded-xl",
  sm: "px-3 py-2 text-xs rounded-lg",
};

export const Button = forwardRef(function Button(
  { className = "", variant = "primary", size = "md", type = "button", disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-heading font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-tint/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});
