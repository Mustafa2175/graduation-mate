"use client";

import Button from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate p-6 text-center">
          <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 p-8 shadow-lg flex flex-col items-center space-y-4">
            <div className="text-5xl">💥</div>
            <h2 className="text-2xl font-black text-gray-900">Fatal Error</h2>
            <p className="text-sm text-gray-500">
              A critical error occurred. Please try reloading the page.
            </p>
            <div className="w-full pt-4">
              <Button onClick={() => reset()} className="w-full font-bold">
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
