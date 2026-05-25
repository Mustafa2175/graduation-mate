"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate p-6 text-center">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 p-8 shadow-lg flex flex-col items-center space-y-4">
        <div className="text-5xl">🚨</div>
        <h2 className="text-2xl font-black text-gray-900">Something went wrong!</h2>
        <p className="text-sm text-gray-500">
          We've been notified about this issue. Please try again.
        </p>
        <div className="w-full pt-4 flex flex-col gap-3">
          <Button onClick={() => reset()} className="w-full font-bold">
            Try Again
          </Button>
          <Button
            variant="secondary"
            className="w-full font-bold"
            onClick={() => (window.location.href = "/")}
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
