"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Formats a numeric value to pt-BR currency display (e.g. 110000 → "110.000,00").
 * Returns empty string for null/undefined/NaN/0 when allowEmpty is true.
 */
function formatToBRL(value: number | undefined | null, allowEmpty = true): string {
  if (value == null || isNaN(value)) return "";
  if (allowEmpty && value === 0) return "";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parses a pt-BR formatted string back to a number.
 * "110.000,00" → 110000
 * "1.234,56"   → 1234.56
 */
function parseBRL(display: string): number {
  if (!display) return 0;
  // Remove dots (thousand separators), replace comma with dot (decimal separator)
  const cleaned = display.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** Numeric value (e.g. 110000) */
  value: number | undefined | null;
  /** Called with the raw numeric value */
  onChange: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, placeholder = "0,00", onBlur, onFocus, ...props }, ref) => {
    const [display, setDisplay] = React.useState(() => formatToBRL(value));
    const [focused, setFocused] = React.useState(false);

    // Sync display when value changes externally (and not focused)
    React.useEffect(() => {
      if (!focused) {
        setDisplay(formatToBRL(value));
      }
    }, [value, focused]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value;
      // Allow only digits, dots, commas
      const sanitized = raw.replace(/[^0-9.,]/g, "");
      setDisplay(sanitized);

      const parsed = parseBRL(sanitized);
      onChange(parsed === 0 && sanitized === "" ? undefined : parsed);
    }

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
      setFocused(true);
      onFocus?.(e);
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
      setFocused(false);
      // Re-format on blur
      const parsed = parseBRL(display);
      if (display === "" || (parsed === 0 && display === "")) {
        setDisplay("");
        onChange(undefined);
      } else {
        setDisplay(formatToBRL(parsed, false));
        onChange(parsed);
      }
      onBlur?.(e);
    }

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          R$
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent pl-10 pr-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className
          )}
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
