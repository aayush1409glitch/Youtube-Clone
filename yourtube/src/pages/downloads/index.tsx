import DownloadsContent from "@/components/DownloadsContent";
import React, { Suspense } from "react";

const DownloadsPage = () => {
  return (
    <main className="flex-1 p-6">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Downloads</h1>
        <Suspense fallback={<div>Loading downloaded videos...</div>}>
          <DownloadsContent />
        </Suspense>
      </div>
    </main>
  );
};

export default DownloadsPage;
