"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { QRUpload } from "@/workflows/file-upload/qr-upload";

export default function UploadTokenPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = (params?.token as string) || null;
  useEffect(() => { if (!token) router.replace("/"); }, [token, router]);
  if (!token) return null;
  return <QRUpload token={token} />;
}
