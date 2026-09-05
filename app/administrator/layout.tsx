"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSignout, useProfileDetail } from "@/lib";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { PreferencesButton } from "@/components/ui/preferences-button";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { hasRole } from "@/components/ui/role-guard";
import { cn } from "@/lib/cn";
import Image from "next/image";
import Link from "next/link";
import {
  Home,
  LayoutDashboard,
  Scale,
  Users,
  ShieldCheck,
  KeyRound,
  User,
  Shield,
  LogOut,
  FileEdit,
  Lock,
  Monitor,
  ChevronRight,
  Megaphone,
  ListOrdered,
} from "lucide-react";
import { useEffect } from "react";


function SidebarAutoClose({ pathname }: { pathname: string }) {
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  return null;
}

function AdminSidebarFooter({
  logout,
  user,
}: {
  logout: () => void;
  user: any;
}) {
  const { state } = useSidebar();
  const { t } = useTranslation();

  return (
    <SidebarFooter
      className={cn(
        "px-3 flex border-t border-blue-200 dark:border-blue-900 bg-transparent shrink-0",
        state === "collapsed"
          ? "h-24 flex-col justify-center items-center gap-2 p-0 py-2"
          : "h-14 flex-row items-center gap-1.5",
      )}
    >
      <Button
        variant="ghost"
        type="button"
        className={cn(
          "rounded-lg flex items-center justify-center gap-2 border border-blue-200/70 dark:border-blue-800/60 bg-white/50 dark:bg-blue-950/50 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 text-sm font-medium transition-all text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 shadow-none",
          state === "collapsed" ? "w-9 h-9 px-0" : "flex-1 h-9",
        )}
        onClick={logout}
        title={
          state === "collapsed" ? t("header.signout") || "Sign Out" : undefined
        }
      >
        <LogOut className="w-4 h-4 shrink-0" />
        {state !== "collapsed" && (
          <span>{t("header.signout") || "Sign Out"}</span>
        )}
      </Button>
      <PreferencesButton
        user={user}
        isCollapsed={state === "collapsed"}
        align={state === "collapsed" ? "center" : "end"}
        side="top"
      />
    </SidebarFooter>
  );
}

function AdminSidebarHeader() {
  const { state } = useSidebar();
  const { t } = useTranslation();
  return (
    <SidebarHeader className="h-14 px-4 flex flex-row items-center border-b border-blue-200 dark:border-blue-900 shrink-0 bg-[#dbeafe] dark:bg-slate-900">
      <Link
        href="/"
        className="flex items-center gap-3 hover:opacity-90 transition-opacity flex-grow truncate"
      >
        <span className="rounded-lg bg-white p-1 shadow-xs border border-blue-200 shrink-0">
          <Image src="/logo.png" alt="Logo" width={28} height={28} />
        </span>
        {state !== "collapsed" && (
          <div className="flex flex-col items-start truncate">
            <span className="text-sm leading-tight text-slate-900 dark:text-white truncate w-full font-bold">
              {t("brand.admin_title") || "Administrator"}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight mt-0.5 truncate w-full font-medium">
              {t("brand.admin_subtitle") || "Manage master data and RBAC"}
            </span>
          </div>
        )}
      </Link>
    </SidebarHeader>
  );
}

export default function AdministratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { mutate: logout } = useSignout();
  const { t } = useTranslation();
  const { data: profileData } = useProfileDetail();
  const user = profileData?.result?.data;

  const menuGroups = [
    {
      label: t("court_menu.groups.overview") || "Overview",
      items: [
        {
          label: t("header.home") || "Home",
          href: "/",
          icon: Home,
        },
        {
          label: t("header.dashboard") || "Dashboard",
          href: "/administrator",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: t("administrator.quick.court_master.title") || "Court Master",
      items: [
        {
          label: t("page_tab.courts") || "Courts",
          href: "/administrator/masters/courts",
          icon: Scale,
        },
      ],
    },
    {
      label: t("administrator.groups.support_master") || "Support Master",
      items: [
        {
          label: t("page_tab.types") || "Types",
          href: "/administrator/masters/support/types",
          icon: FileEdit,
        },
        {
          label: t("page_tab.categories") || "Categories",
          href: "/administrator/masters/support/categories",
          icon: FileEdit,
        },
        {
          label: t("page_tab.sub_categories") || "Sub-Categories",
          href: "/administrator/masters/support/sub-categories",
          icon: ListOrdered,
        },
        {
          label: t("page_tab.priorities") || "Priorities",
          href: "/administrator/masters/support/priorities",
          icon: Shield,
        },
        {
          label: t("page_tab.statuses") || "Statuses",
          href: "/administrator/masters/support/statuses",
          icon: ShieldCheck,
        },
        {
          label: t("page_tab.escalation_levels") || "Escalation Levels",
          href: "/administrator/masters/support/escalation-levels",
          icon: Users,
        },
        {
          label: t("page_tab.resolution_types") || "Resolution Types",
          href: "/administrator/masters/support/resolution-types",
          icon: FileEdit,
        },
      ],
    },

    {
      label: t("administrator.groups.rbac") || "Access Control (RBAC)",
      items: [
        {
          label: t("page_tab.system_user") || "System Users",
          href: "/administrator/masters/rbac/users/system",
          icon: Users,
        },
        {
          label: t("page_tab.court_user") || "Court Users",
          href: "/administrator/masters/rbac/users/court",
          icon: Users,
        },
        {
          label: t("page_tab.citizen_user") || "Citizen Users",
          href: "/administrator/masters/rbac/users/citizen",
          icon: Users,
        },
        {
          label: t("page_tab.roles") || "Roles",
          href: "/administrator/masters/rbac/roles",
          icon: ShieldCheck,
        },
        {
          label: t("page_tab.permissions") || "Permissions",
          href: "/administrator/masters/rbac/permissions",
          icon: KeyRound,
        },
      ],
    },
    {
      label: t("court_menu.groups.operations") || "Operations",
      items: [
        {
          label: t("page_tab.announcements") || "Announcements",
          href: "/administrator/announcements",
          icon: Megaphone,
        },
        {
          label: t("page_tab.dsc_management") || "DSC Management",
          href: "/administrator/dsc",
          icon: KeyRound,
        },
      ],
    },
    {
      label: t("header.my_account") || "Account Settings",
      items: [
        {
          label: t("page_tab.profile") || "My Profile",
          href: "/identity/profile/details",
          icon: User,
        },
        ...(!hasRole(user?.role, ["SUPER_ADMIN", "ADMIN", "RI", "RSI"])
          ? [
              {
                label: t("page_tab.dsc") || "DSC Configuration",
                href: "/identity/profile/dsc",
                icon: ShieldCheck,
              },
            ]
          : []),
        {
          label: t("page_tab.security") || "Security",
          href: "/identity/profile/security",
          icon: Lock,
        },
        {
          label: t("page_tab.sessions") || "Active Sessions",
          href: "/identity/profile/sessions",
          icon: Monitor,
        },
      ],
    },
  ];

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true} className="bg-background">
        <SidebarAutoClose pathname={pathname} />
        <div className="flex h-screen w-full overflow-hidden">
          {}
          <Sidebar
            collapsible="offcanvas"
            className="border-r border-blue-200 dark:border-blue-900 bg-gradient-to-b from-[#dbeafe] via-[#f0f9ff] to-[#dbeafe] dark:from-slate-900 dark:via-blue-950 dark:to-slate-950 text-slate-800 dark:text-slate-100 [&_[data-sidebar=sidebar]]:bg-transparent"
          >
            <AdminSidebarHeader />

            {}
            <SidebarContent className="p-3 gap-1.5 bg-transparent">
              {menuGroups.map((group) => (
                <SidebarGroup key={group.label} className="p-0">
                  <SidebarGroupLabel className="px-3 mb-1 text-[11px] font-semibold capitalize tracking-wider text-blue-900/80 dark:text-blue-300">
                    {group.label}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5">
                      {group.items.map((item) => {
                        const isActive =
                          item.href === "/administrator"
                            ? pathname === "/administrator"
                            : pathname === item.href ||
                              pathname.startsWith(item.href + "/");
                        const Icon = item.icon;

                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => router.push(item.href)}
                              tooltip={item.label}
                              className={cn(
                                "h-9 px-3 rounded-lg transition-all duration-150 group/item shadow-none ring-0 border border-transparent text-[13px] sm:text-sm text-slate-600 dark:text-slate-400 font-medium hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white",
                                isActive &&
                                  "bg-[#dbedff]! text-slate-900! font-bold border border-blue-300/60! shadow-xs! dark:bg-blue-900/60! dark:text-white! hover:bg-[#dbedff]! dark:hover:bg-blue-900/60!",
                              )}
                            >
                              <Icon
                                className={cn(
                                  "shrink-0 w-4 h-4 text-slate-400 dark:text-slate-500 transition-colors group-hover/item:text-slate-900 dark:group-hover/item:text-white",
                                  isActive &&
                                    "text-slate-800! dark:text-white!",
                                )}
                              />
                              <span className="truncate flex-1">
                                {item.label}
                              </span>
                              {isActive && (
                                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-800! dark:text-white! ml-auto" />
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>

            {}
            <AdminSidebarFooter logout={logout} user={user} />
          </Sidebar>

          {}
          <SidebarInset className="bg-background dark:bg-neutral-950 overflow-hidden flex-1 h-screen flex flex-col">
            <div className="flex-1 w-full relative flex flex-col overflow-hidden h-full">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
