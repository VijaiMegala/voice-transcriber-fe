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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
      <Input
        type="text"
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 w-full sm:max-w-md"
      />
      <Button onClick={onAddClick} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Add
      </Button>
    </div>
  );
}

