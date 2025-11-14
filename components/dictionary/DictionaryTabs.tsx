"use client";

import Link from "next/link";

export function DictionaryTabs() {
  return (
    <div className="flex border-b border-gray-200 px-6 pt-4">
      <Link
        href="/history"
        className="px-4 py-2 font-medium transition-colors text-gray-500 hover:text-gray-700"
      >
        History
      </Link>
      <button className="px-4 py-2 font-medium transition-colors text-black border-b-2 border-black">
        Dictionary
      </button>
    </div>
  );
}

