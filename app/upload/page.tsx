"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRUpload } from "@/workflows/file-upload/qr-upload";

function UploadPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || searchParams.get("t") || null;

  useEffect(() => {
    if (!token) {
      router.replace("/");
    }
  }, [token, router]);

  if (!token) return null;

  return <QRUpload token={token} />;
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <UploadPageInner />
    </Suspense>
  );
}
