"use client";

import { PageLayout } from "@/components/PageLayout";
import Link from "next/link";

export default function DictionaryPage() {
  return (
    <PageLayout>
      <div className="w-full max-w-7xl h-[calc(100vh-200px)] flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 pt-4">
          <Link
            href="/history"
            className="px-4 py-2 font-medium transition-colors text-gray-500 hover:text-gray-700"
          >
            History
          </Link>
          <button
            className="px-4 py-2 font-medium transition-colors text-black border-b-2 border-black"
          >
            Dictionary
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <p className="text-lg">Dictionary feature coming soon</p>
            <p className="text-sm mt-2">This section will contain your saved dictionary entries.</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}