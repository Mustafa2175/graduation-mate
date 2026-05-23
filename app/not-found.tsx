import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate p-6 text-center">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 p-8 shadow-lg flex flex-col items-center space-y-4">
        <div className="text-5xl">👀</div>
        <h2 className="text-2xl font-black text-gray-900">Page Not Found</h2>
        <p className="text-sm text-gray-500">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="w-full pt-4">
          <Link href="/" className="block w-full">
            <Button className="w-full font-bold">Return Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
