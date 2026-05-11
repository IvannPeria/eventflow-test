"use client";

import { forwardRef, useId } from "react";

export const Input = forwardRef(function Input(
  {
    label,
    id: idProp,
    error,
    hint,
    className = "",
    leftIcon: LeftIcon,
    inputClassName = "",
    ...props
  },
  ref,
) {
  const genId = useId();
  const id = idProp ?? genId;
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={`min-w-0 space-y-1 ${className}`}>
      {label ? (
        <label
          htmlFor={id}
          className="label-caps text-on-surface-variant block px-1 font-sans"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        {LeftIcon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-surface-tint/50">
            <LeftIcon className="size-5" aria-hidden />
          </span>
        ) : null}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={[error ? errId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined}
          className={`w-full min-w-0 rounded-lg border-0 border-b border-white/10 bg-surface-container-highest/40 py-4 font-sans text-base leading-normal text-on-surface placeholder:text-on-surface-variant/40 transition-all duration-300 focus:ring-0 input-glow ${LeftIcon ? "pl-12 pr-4" : "px-4"} ${inputClassName}`}
          {...props}
        />
      </div>
      {hint && !error ? (
        <p id={hintId} className="px-1 text-xs text-on-surface-variant/70">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} role="alert" className="px-1 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
});
