"use client";

import { useEffect, useState } from "react";
import { AppLoader } from "@/components/ui/app-loader";

type Phase = "connecting" | "done";

export function PageLoader() {
  const [phase, setPhase] = useState<Phase>("connecting");
  const [visible, setVisible] = useState(true);

  useEffect(() => {

    const t1 = setTimeout(() => setPhase("done"), 600);
    const t2 = setTimeout(() => setVisible(false), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return <AppLoader variant="fullscreen" phase={phase} />;
}


export { AppLoader as UnifiedLoader };
