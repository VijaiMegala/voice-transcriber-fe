import { Input } from "@/components/ui/input";
import { ReactNode } from "react";

interface AuthFormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
  error?: string;
}

export function AuthFormField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  minLength,
  disabled = false,
  error,
}: AuthFormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        disabled={disabled}
        className={`bg-white border-gray-300 focus:border-pink-400 focus:ring-pink-400 ${
          error ? "border-red-500" : ""
        }`}
      />
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

