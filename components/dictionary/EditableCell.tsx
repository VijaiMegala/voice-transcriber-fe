"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface EditableCellProps {
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  className?: string;
}

export function EditableCell({
  value,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  className = "",
}: EditableCellProps) {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    if (isEditing) {
      setEditValue(value);
    }
  }, [isEditing, value]);

  const handleBlur = () => {
    if (editValue.trim() && editValue !== value) {
      onSave(editValue.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (editValue.trim() && editValue !== value) {
        onSave(editValue.trim());
      } else {
        onCancel();
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={`h-8 ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center min-h-[32px] cursor-pointer ${className}`}
      onDoubleClick={onStartEdit}
    >
      <span className="text-gray-700">{value}</span>
    </div>
  );
}

