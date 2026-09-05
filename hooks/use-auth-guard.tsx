"use client";
import { type ComponentType, useEffect } from "react";
import { useSessionCheck } from "@/lib";
import { useRouter, useSearchParams } from "next/navigation";
import { redirectUtil } from "@/utils/redirect";
import { roleSwitch } from "@/utils/role";
import { Loader2 } from "lucide-react";


export function usePublicOnlyRoute() {
  const session = useSessionCheck();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (session.isQueryPending) return;

    const data = session.data?.result?.data;
    if (data?.is_authenticated) {
      const fallback = roleSwitch(data.role || "");
      const destination = redirectUtil.get(searchParams, fallback);
      router.replace(destination);
    }
  }, [session.isQueryPending, session.data, router, searchParams]);

  return {
    isLoading: session.isQueryPending,
    isAuthenticated: session.data?.result?.data?.is_authenticated,
  };
}


export function withPublicOnlyRoute<P extends object>(
  Component: ComponentType<P>,
) {
  return function PublicOnlyRouteWrapper(props: P) {
    const session = useSessionCheck();
    const router = useRouter();
    const searchParams = useSearchParams();

    const isVerifying = session.isQueryPending;
    const data = session.data?.result?.data;
    const isAuthenticated = data?.is_authenticated;
    const userRole = data?.role;

    useEffect(() => {
      if (isVerifying) return;

      if (isAuthenticated) {
        const fallback = roleSwitch(userRole || "");
        const destination = redirectUtil.get(searchParams, fallback);
        router.replace(destination);
      }
    }, [isVerifying, isAuthenticated, userRole, router, searchParams]);


    if (isVerifying || isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground animate-pulse">
              Verifying session...
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
