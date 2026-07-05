"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? "Hide password" : "Show password";
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={cn(inputClass, "pr-11", className)} />
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-mist hover:text-ink"
      >
        <Icon size={17} aria-hidden />
      </button>
    </div>
  );
}
