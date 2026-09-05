"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  User,
  Shield,
  Fingerprint,
  Monitor,
  ArrowLeft,
  KeyRound,
  LayoutDashboard,
  Scale,
  FileText,
  HelpCircle,
  MessageCircleQuestion,
  Home,
  LogOut,
  IndianRupee,
  Settings,
  ChevronUp,
  SlidersHorizontal,
  Keyboard,
} from "lucide-react";
import { useSignout, useProfileDetail, usePreferences, useUpdatePreferences, useSessionCheck } from '@/lib/query';
import { useTranslation } from "@/i18n";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SettingsDialogAuth } from "@/components/ui/settings-dialog-auth";
import { Switch } from "@/components/ui/switch";
import { useHindiKeyboard } from "@/components/ui/hindi-keyboard";
import { useState } from "react";
import toast from "react-hot-toast";

const nav = [
  {
    href: "/manage/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/manage/cases", label: "Cases", icon: FileText },
  { href: "/manage/payments", label: "Payments", icon: IndianRupee },
  { href: "/manage/support", label: "Support", icon: MessageCircleQuestion },
  { href: "/manage/settings/profile", label: "Settings", icon: Settings },
];

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const signoutMut = useSignout();
  const { data: profileData } = useProfileDetail();
  const { locale } = useTranslation();
  const user: any = profileData?.result?.data;
  const userName = user?.name || user?.username || "User";
  const userRole =
    (locale === "hi"
      ? user?.role_detail?.name
      : user?.role_detail?.name_en || user?.role_detail?.name) ||
    user?.role_name ||
    user?.role ||
    "—";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [mobilePopoverOpen, setMobilePopoverOpen] = useState(false);
  const { enabled: hindiEnabled, setEnabled: setHindiEnabled } =
    useHindiKeyboard();
  const { data: sessionData2 } = useSessionCheck();
  const isAuthenticated = !!sessionData2?.result?.data?.is_authenticated;
  const prefQuery = usePreferences();
  const updatePref = useUpdatePreferences();
  const dbPrefs = prefQuery.data?.result?.data as any;


  const isSettings = pathname.startsWith("/manage/settings");
  const isCourt = pathname.startsWith("/manage/court");
  if (isSettings || isCourt) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen overflow-hidden flex bg-white dark:bg-background">
      {}
      <aside className="hidden md:flex w-[280px] shrink-0 flex-col bg-zinc-100 dark:bg-card fixed top-0 left-0 h-screen z-30">
        <div className="h-14 flex items-center gap-3 px-4 shrink-0 bg-zinc-100 dark:bg-card">
          <span className="shrink-0 rounded dark:bg-white dark:p-0.5 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-7 w-7 object-contain"
            />
          </span>
          <span className="font-black text-xl text-black dark:text-white">
            RCCMS
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto bg-zinc-100 dark:bg-card">
          {nav.map((it) => {
            const active = it.exact
              ? pathname === it.href
              : pathname.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary dark:bg-zinc-800 dark:text-white"
                    : "text-muted-foreground dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-white",
                )}
              >
                <it.icon className="h-[18px] w-[18px] shrink-0" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 shrink-0 bg-zinc-100 dark:bg-card">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-3 px-2 py-2 rounded-lg transition-colors text-left overflow-hidden",
                  popoverOpen
                    ? "bg-white dark:bg-zinc-800"
                    : "hover:bg-white dark:hover:bg-zinc-800",
                )}
              >
                <Avatar className="h-8 w-8 shrink-0 ring-1 ring-black/10 dark:ring-white/15 shadow-sm">
                  <AvatarFallback className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-bold shadow-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left overflow-hidden">
                  <p className="text-sm font-medium truncate leading-tight">
                    {userName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate leading-tight">
                    {userRole}
                  </p>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="center"
              sideOffset={8}
              className="w-[var(--radix-popover-trigger-width)] p-1.5 rounded-xl bg-zinc-100 dark:bg-card border-0 shadow-lg"
            >
              <div className="px-2 py-1.5 mb-1">
                <p className="text-sm font-semibold truncate leading-tight">
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                  {userRole}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                {pathname.startsWith("/manage/settings") ? (
                  <div className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-muted-foreground opacity-50 cursor-not-allowed">
                    <Settings className="h-4 w-4" /> Settings
                  </div>
                ) : (
                  <Link
                    href="/manage/settings/profile"
                    onClick={() => setPopoverOpen(false)}
                    className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                )}
                {pathname === "/manage/settings/preferences" ? (
                  <div className="flex w-full items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-muted-foreground opacity-50 cursor-not-allowed">
                    <SlidersHorizontal className="h-4 w-4" /> Preferences
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setPopoverOpen(false);
                      setPrefsOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-2 py-2.5 rounded-lg text-sm hover:bg-white dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <SlidersHorizontal className="h-4 w-4" /> Preferences
                  </button>
                )}
                <div
                  onClick={() => setHindiEnabled(!hindiEnabled)}
                  className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 cursor-pointer select-none"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Keyboard className="h-4 w-4" /> हिंदी टाइपिंग
                  </span>
                  <span onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={hindiEnabled}
                      onCheckedChange={setHindiEnabled}
                      aria-label="हिंदी टाइपिंग"
                    />
                  </span>
                </div>
                <button
                  onClick={() => signoutMut.mutate()}
                  disabled={signoutMut.isPending}
                  className="flex w-full items-center gap-2 px-2 py-2.5 rounded-lg text-sm hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 text-left"
                >
                  <LogOut className="h-4 w-4" />{" "}
                  {signoutMut.isPending ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <SettingsDialogAuth
            open={prefsOpen}
            onOpenChange={setPrefsOpen}
            isAuthenticated={isAuthenticated}
            dbPreferences={
              dbPrefs
                ? {
                    preferred_language: dbPrefs.preferred_language,
                    preferred_theme: dbPrefs.preferred_theme,
                  }
                : undefined
            }
            onSave={async (data) => {
              if (isAuthenticated) {
                await updatePref.mutateAsync(data);
                toast.success("Preferences saved to account");
              } else {
                toast.success("Preferences saved locally");
              }
            }}
          />
        </div>
      </aside>

      {}
      <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-background md:ml-[280px] h-screen overflow-hidden">
        {}
        <div className="md:hidden h-14 flex items-center justify-between px-4 shrink-0 bg-zinc-100 dark:bg-card">
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded dark:bg-white dark:p-0.5 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-7 w-7 object-contain"
              />
            </span>
            <span className="font-black text-xl text-black dark:text-white">
              RCCMS
            </span>
          </div>
          <Popover open={mobilePopoverOpen} onOpenChange={setMobilePopoverOpen}>
            <PopoverTrigger asChild>
              <button className="h-8 w-8 rounded-full overflow-hidden shrink-0 ring-1 ring-black/10 dark:ring-white/15 shadow-sm">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-bold shadow-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={8}
              className="w-[var(--radix-popover-trigger-width)] p-1.5 rounded-xl bg-zinc-100 dark:bg-card border-0 shadow-lg min-w-[240px]"
            >
              <div className="px-2 py-1.5 mb-1">
                <p className="text-sm font-semibold truncate leading-tight">
                  {userName}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                  {userRole}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                {pathname.startsWith("/manage/settings") ? (
                  <div className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-muted-foreground opacity-50 cursor-not-allowed">
                    <Settings className="h-4 w-4" /> Settings
                  </div>
                ) : (
                  <Link
                    href="/manage/settings/profile"
                    onClick={() => setMobilePopoverOpen(false)}
                    className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobilePopoverOpen(false);
                    setPrefsOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-2 py-2.5 rounded-lg text-sm hover:bg-white dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Preferences
                </button>
                <div
                  onClick={() => setHindiEnabled(!hindiEnabled)}
                  className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 cursor-pointer select-none"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Keyboard className="h-4 w-4" /> हिंदी टाइपिंग
                  </span>
                  <span onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={hindiEnabled}
                      onCheckedChange={setHindiEnabled}
                      aria-label="हिंदी टाइपिंग"
                    />
                  </span>
                </div>
                <button
                  onClick={() => signoutMut.mutate()}
                  disabled={signoutMut.isPending}
                  className="flex w-full items-center gap-2 px-2 py-2.5 rounded-lg text-sm hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 text-left"
                >
                  <LogOut className="h-4 w-4" />{" "}
                  {signoutMut.isPending ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {}
        <div className="md:hidden flex gap-2 p-3 overflow-x-auto bg-zinc-100 dark:bg-card scrollbar-none">
          {nav.map((it) => {
            const active = it.exact
              ? pathname === it.href
              : pathname.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors",
                  active
                    ? "bg-primary/10 text-primary border-transparent dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
                    : "bg-card border-border text-muted-foreground dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-foreground dark:hover:text-white",
                )}
              >
                <it.icon className="h-4 w-4" /> {it.label}
              </Link>
            );
          })}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white dark:bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}
