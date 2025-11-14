"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DictionarySearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

export function DictionarySearchBar({
  searchQuery,
  onSearchChange,
  onAddClick,
}: DictionarySearchBarProps) {
  return (
    <div className="flex items-center gap-4 mb-6 justify-between">
      <Input
        type="text"
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 max-w-md"
      />
      <Button onClick={onAddClick}>
        <Plus className="mr-2 h-4 w-4" />
        Add
      </Button>
    </div>
  );
}

