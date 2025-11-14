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

  const isTouchDevice = () => {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  };

  const handleClick = (e: React.MouseEvent) => {
    // On mobile/touch devices, use single tap
    if (isTouchDevice()) {
      e.preventDefault();
      onStartEdit();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only allow double-click on non-touch devices
    if (!isTouchDevice()) {
      onStartEdit();
    }
  };

  return (
    <div
      className={`flex items-center min-h-[32px] cursor-pointer touch-manipulation ${className}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <span className="text-xs sm:text-sm text-gray-700 truncate">{value}</span>
    </div>
  );
}

