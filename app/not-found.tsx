"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-dvh overflow-hidden w-full flex items-center justify-center bg-gray-200 dark:bg-neutral-950 text-black dark:text-white">
      <div className="flex flex-col items-center text-center px-6">
        {}
        <h1 className="text-[96px] leading-none font-extrabold tracking-tight">
          404
        </h1>

        {}
        <p className="mt-4 text-xl font-semibold">Page not found</p>

        {}
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>

        {}
        <div className="mt-8 flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="underline underline-offset-4 hover:opacity-70 transition"
          >
            Go home
          </Link>

          <button
            onClick={() => history.back()}
            className="text-neutral-500 hover:text-black dark:hover:text-white transition"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
