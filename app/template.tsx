"use client";
import { useSessionCheck, useSignout } from '@/lib/query';
import { useTranslation } from "@/i18n";
import { Header, NavLink } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { FooterWebsite } from "@/components/ui/footer-website";
import { hasRole } from "@/components/ui/role-guard";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { roleSwitch } from "@/utils/role";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { data } = useSessionCheck();
  const { mutate: logout } = useSignout();
  const pathname = usePathname();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);


  useEffect(() => {
    if (typeof window === "undefined") return;

    const isIdentityPage =
      pathname.includes("/identity/signin") ||
      pathname.includes("/identity/signup") ||
      pathname.includes("/identity/reset-password");
    if (isIdentityPage) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "rccms_session" && !e.newValue) {
        setShowLogoutAlert(true);
      }
    };
    window.addEventListener("storage", handleStorageChange);


    const isAuth = (data as any)?.result?.data?.is_authenticated;
    const hadCache = (() => {
      try { return !!localStorage.getItem("rccms_session"); } catch { return false; }
    })();
    if (isAuth === false && hadCache) {
      try { localStorage.removeItem("rccms_session"); } catch {}
      setShowLogoutAlert(true);
    }

    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pathname, (data as any)?.result?.data?.is_authenticated]);

  const isHome = pathname === "/";
  const showWebsiteFooter =
    pathname === "/" ||
    pathname.startsWith("/privacy-policy") ||
    pathname.startsWith("/contact");

  const navLinks: NavLink[] = useMemo(() => [], []);

  const quickLinks = useMemo(
    () => [
      { label: t("link.menu.home"), href: "/" },
      {
        label: t("link.menu.about"),
        href: "https://bor.uk.gov.in/content-category/introduction/",
      },
      { label: t("link.menu.citizenCorner"), href: "/citizen-corner" },
      { label: t("link.menu.contact"), href: "/contact" },
    ],
    [t],
  );

  const legalLinks = useMemo(
    () => [{ label: t("link.legal.privacy"), href: "/privacy-policy" }],
    [t],
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted overflow-x-hidden overflow-y-auto h-screen print:h-auto print:min-h-0 print:overflow-visible print:bg-white print:block print:p-0 print:m-0">
      {}
      <Header
        logo="/logo.png"
        navLinks={navLinks}
        hideBreadcrumbOnPaths={[""]}
        showSearch
        hideOnPaths={[
          "/case",
          "/action",
          "/administrator",
          "/identity/profile",
          "/search",
          "/manage",
          "/settings/court",
          "/identity/signin",
          "/identity/signup",
          "/identity/reset-password",
          "/settings",
          "/profile",
          "/upload",
        ]}
        isAuthenticated={data?.result?.data?.is_authenticated}
        onLogout={logout}
        searchPlaceholder={t("header.search_case")}
        loginText={t("header.signin")}
        registerText={t("header.signup")}
        logoutText={t("header.signout")}
        dashboardText={t("header.dashboard")}
        profileText={t("header.my_account")}
        settingsText={t("header.preferences")}
        signedInText={t("header.signed_in")}
        loginHref="/identity/signin"
        registerHref="/identity/signup"
        profileHref="/manage/settings/profile"
        forgotPasswordHref="/identity/reset-password"
        forgotPasswordText={t("header.reset_password")}
        dashboardHref={roleSwitch(data?.result?.data?.role || "")}
      />

      {}
      <main className="flex-1">{children}</main>
      {}
      {showWebsiteFooter ? (
        <FooterWebsite
          logo="/logo.png"
          brandTitle={t("brand.title")}
          brandSubtitle={t("brand.subtitle")}
          brandDescription={t("brand.description")}
          digitalIndiaLogo="/digital-india.png"
          nicLogo="/nic.png"
          contentOwnedBy={t("brand.content_owned_managed_by")}
          brandGov={t("brand.gov")}
          quickLinks={quickLinks}
          legalLinks={legalLinks}
          address={t("brand.address.value")}
          phone="+91 01335–2669415"
          hostedBy={t("brand.hosted_by")}
          developedBy={t("brand.developed_by")}
          version="1.0"
          allRightsReserved={t("brand.all_rights_reserved")}
          quickLinksHeading={t("heading.quickLinks")}
          legalHeading={t("heading.legal")}
          contactHeading={t("heading.contact")}
        />
      ) : (
        <Footer
          contentOwnedBy={t("brand.content_owned_managed_by")}
          brandGov={t("brand.gov")}
          version="1.0"
          hideOnPaths={[
            "/case",
            "/action",
            "/administrator",
            "/identity/profile",
            "/manage",
            "/settings/court",
            "/identity/signin",
            "/identity/signup",
            "/identity/reset-password",
            "/settings",
            "/profile",
            "/upload",
          ]}
          centered={pathname === "/search"}
        />
      )}

      {}
      {showLogoutAlert && (
        <AlertDialog open={showLogoutAlert}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader className="text-left place-items-start items-start w-full sm:text-left sm:place-items-start sm:items-start">
              <AlertDialogTitle className="text-left w-full sm:text-left">
                {t("session_expired.title")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left w-full sm:text-left text-xs sm:text-sm">
                {t("session_expired.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="text-left mt-1">
              <span className="text-[10px] text-muted-foreground/80 leading-normal font-medium block">
                {t("session_expired.helper_text")}
              </span>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  try {
                    window.close();
                  } catch (err) {
                    console.error("Browser blocked window.close():", err);
                  }
                }}
                className="cursor-pointer"
              >
                {t("session_expired.close_btn")}
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={() => {
                  setShowLogoutAlert(false);
                  window.location.href = "/identity/signin";
                }}
                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 border-none cursor-pointer"
              >
                {t("session_expired.login_btn")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
