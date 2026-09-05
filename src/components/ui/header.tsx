"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  Settings,
  User,
  LogOut,
  LogIn,
  Search,
  LayoutDashboard,
  UserPlus,
  KeyRound,
  Menu,
  X,
  Home,
  Phone,
  Info,
  Loader2,
  ChevronRight,
  LucideIcon,
} from "lucide-react";

import { Input } from "./input";
import { SettingsDialogAuth } from "./settings-dialog-auth";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./dropdown-menu";

import { Avatar, AvatarFallback } from "./avatar";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip";

import { useTranslation } from "@/i18n";


export interface NavLink {
  label: string;
  href: string;
  icon?: LucideIcon;
  external?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface FullHeaderProps {
  titleKey?: string;
  subtitleKey?: string;
  logo?: string;
  logoHref?: string;
  homeHref?: string;
  navLinks?: NavLink[];
  profileHref?: string;
  dashboardHref?: string;
  loginHref?: string;
  registerHref?: string;
  forgotPasswordHref?: string;
  searchPlaceholder?: string;
  menuHeading?: string;
  accountHeading?: string;
  signedInText?: string;
  dashboardText?: string;
  profileText?: string;
  settingsText?: string;
  logoutText?: string;
  loginText?: string;
  registerText?: string;
  forgotPasswordText?: string;


  showSearch?: boolean;

  showBreadcrumb?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  hideBreadcrumbOnPaths?: string[];
  onLogout?: () => void | Promise<void>;
  isLoggingOut?: boolean;
  isAuthenticated?: boolean;
  userName?: string;
  proxyPrefixes?: string[];


  hideOnPaths?: string[];
}


function isExt(href: string, explicit?: boolean): boolean {
  if (explicit !== undefined) return explicit;
  return href.startsWith("http://") || href.startsWith("https://");
}

function resolveHref(href: string, homeHref: string): string {
  return href === "/" ? homeHref : href;
}

function navigate(
  router: ReturnType<typeof useRouter>,
  href: string,
  homeHref: string,
  explicit?: boolean,
  proxyPrefixes: string[] = [],
) {
  const resolved = resolveHref(href, homeHref);
  if (isExt(resolved, explicit)) {
    window.location.href = resolved;
  } else if (proxyPrefixes.some((p) => resolved.startsWith(p))) {
    window.location.href = resolved;
  } else {
    router.push(resolved);
  }
}


const defaultNavLinks: NavLink[] = [
  { label: "Home", href: "/", icon: Home },
  {
    label: "About",
    href: "https://bor.uk.gov.in/content-category/introduction/",
    icon: Info,
  },
  { label: "Contact", href: "/contact", icon: Phone },
];


function Breadcrumb({
  items,
  onNavigate,
}: {
  items: BreadcrumbItem[];
  onNavigate: (href: string) => void;
}) {
  if (!items.length) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center text-xs overflow-x-auto scrollbar-none [-webkit-overflow-scrolling:touch] min-w-0"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span
            key={index}
            className="flex items-center whitespace-nowrap shrink-0"
          >
            {index > 0 && (
              <ChevronRight className="h-3 w-3 mx-1.5 shrink-0 text-muted-foreground/40" />
            )}
            {item.href && !isLast ? (
              <button
                onClick={() => onNavigate(item.href!)}
                className="text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span
                className={
                  isLast
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}


function IconBtn({
  onClick,
  className = "",
  children,
}: {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        h-9 w-9 flex items-center justify-center rounded-lg shrink-0
        bg-muted border border-border
        text-foreground dark:text-foreground
        hover:bg-accent hover:text-accent-foreground
        dark:bg-muted/60 dark:border-border/60
        dark:hover:bg-accent/80
        transition-colors duration-150 outline-none
        focus-visible:ring-2 focus-visible:ring-ring
        ${className}
      `}
    >
      {children}
    </button>
  );
}


function SearchTrigger({
  className = "",
  onOpen,
  placeholder,
}: {
  className?: string;
  onOpen: () => void;
  placeholder: string;
}) {
  return (
    <div
      onClick={onOpen}
      className={[
        "relative flex items-center cursor-pointer rounded-lg",
        "bg-white/85 border border-white/20 hover:bg-white/90 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15 dark:hover:border-white/20 transition-all duration-150",
        className,
      ].join(" ")}
    >
      <Search className="absolute left-3 h-4 w-4 text-zinc-500 dark:text-white/60 shrink-0" />
      <span className="h-8 pl-9 flex items-center text-sm text-zinc-500 dark:text-white/50 select-none cursor-pointer">
        {placeholder}
      </span>
    </div>
  );
}


function LogoContent({
  imgWidth,
  logo,
  title,
  subtitle,
  textColor = "text-primary-foreground",
  subColor = "text-primary-foreground/70",
}: {
  imgWidth: number;
  logo: string;
  title: string;
  subtitle: string;
  textColor?: string;
  subColor?: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-8 w-8 rounded-md bg-white flex items-center justify-center shrink-0">
        <Image src={logo} alt={title} width={imgWidth} height={imgWidth} />
      </span>
      <span className="flex flex-col items-start">
        <span
          className={`font-semibold text-[13px] sm:text-sm leading-tight ${textColor}`}
        >
          {title}
        </span>
        <span className={`text-[9px] sm:text-[10px] leading-tight ${subColor}`}>
          {subtitle}
        </span>
      </span>
    </span>
  );
}


function DesktopNavButton({
  label,
  active,
  onNavigate,
}: {
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <button
      onClick={onNavigate}
      className={`
        px-3 py-1.5 rounded-md text-sm font-medium transition-colors
        ${
          active
            ? "text-primary bg-primary/20 dark:bg-primary/70 dark:text-white/90 font-semibold"
            : "text-foreground/80 dark:text-white/50 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-muted/60"
        }
      `}
    >
      {label}
    </button>
  );
}

export function Header({
  titleKey = "brand.title",
  subtitleKey = "brand.subtitle",
  logo = "/logo.svg",
  homeHref = "/",
  logoHref,
  navLinks = defaultNavLinks,
  profileHref = "/profile",
  dashboardHref = "/dashboard",
  loginHref = "/signin",
  registerHref = "/signup",
  forgotPasswordHref = "/forgot-password",

  searchPlaceholder = "Search...",
  menuHeading = "Menu",
  accountHeading = "Account",
  signedInText = "Signed in",
  dashboardText = "Dashboard",
  profileText = "Profile",
  settingsText = "System Preferences",
  logoutText = "Logout",
  loginText = "Login",
  registerText = "Register",
  forgotPasswordText = "Forgot Password",

  showSearch = true,

  showBreadcrumb = false,
  breadcrumbs = [],
  hideBreadcrumbOnPaths = [],

  onLogout,
  isLoggingOut = false,

  isAuthenticated = false,
  userName,

  proxyPrefixes = ["/account"],

  hideOnPaths = [],
}: FullHeaderProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();


  const shouldHide =
    hideOnPaths.length > 0 &&
    hideOnPaths.some(
      (p) =>
        pathname === p || pathname.startsWith(p.endsWith("/") ? p : p + "/"),
    );

  const title = t(titleKey);
  const subtitle = t(subtitleKey);
  const resolvedLogoHref = logoHref ?? homeHref;


  const openSearch = () => {
    go("/search");
  };


  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isActive = (href: string) => {
    const resolved = resolveHref(href, homeHref);
    if (isExt(resolved)) return false;
    return resolved === "/" ? pathname === "/" : pathname.startsWith(resolved);
  };

  const loginWithNext = `${loginHref}?next=${encodeURIComponent(pathname)}`;

  const isPathHidden = hideBreadcrumbOnPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  const hasBreadcrumb =
    showBreadcrumb && breadcrumbs.length > 0 && !isPathHidden;

  const go = (href: string, explicit?: boolean) => {
    setSidebarOpen(false);
    navigate(router, href, homeHref, explicit, proxyPrefixes);
  };


  useEffect(() => {
    if (isLoggingOut) setSidebarOpen(false);
  }, [isLoggingOut]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA")
      ) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAuthenticated, openSearch]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled =
        window.scrollY > 0 ||
        document.documentElement.scrollTop > 0 ||
        document.body.scrollTop > 0;
      setIsScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });


    const scrollContainer = document.querySelector(".overflow-y-auto");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }


    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const handleLogout = () => {
    setSidebarOpen(false);
    onLogout?.();
  };

  if (shouldHide) return null;


  function LogoutButton({ fullWidth = false }: { fullWidth?: boolean }) {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={[
          "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold",
          "text-destructive bg-destructive/10 border border-destructive/30",
          "hover:bg-destructive/20 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          fullWidth ? "w-full" : "",
        ].join(" ")}
      >
        {isLoggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        {logoutText}
      </button>
    );
  }


  return (
    <TooltipProvider delayDuration={200}>
      <SettingsDialogAuth open={settingsOpen} onOpenChange={setSettingsOpen} />

      {}

      <header className="sticky top-0 z-40 w-full border-none border-b-0 bg-primary text-primary-foreground backdrop-blur-md">
        <div className="container mx-auto h-12 md:h-14 flex items-center gap-3 px-4 sm:px-6 lg:px-8">
          {}
          <button
            onClick={() => go(resolvedLogoHref)}
            className="flex items-center shrink-0"
          >
            <span className="md:hidden">
              <LogoContent imgWidth={24} logo={logo} title={title} subtitle={subtitle} />
            </span>
            <span className="hidden md:flex items-center gap-2">
              <span className="h-8 w-8 rounded-md bg-white flex items-center justify-center shrink-0">
                <Image src={logo} alt={title} width={24} height={24} />
              </span>
              <span className="flex flex-col items-start">
                <span className="font-semibold text-[13px] sm:text-sm leading-tight text-primary-foreground">
                  {title}
                </span>
                <span className="text-[9px] sm:text-[10px] text-primary-foreground/70 leading-tight">
                  {subtitle}
                </span>
              </span>
            </span>
          </button>

          {}
          <nav className="hidden md:flex items-center gap-0.5 ml-3">
            {navLinks.map(({ label, href, external }) => (
              <DesktopNavButton
                key={href}
                label={label}
                active={isActive(href)}
                onNavigate={() => go(href, external)}
              />
            ))}
          </nav>

          <div className="flex-1" />

          {}
          {showSearch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={openSearch}
                  className="hidden md:flex relative items-center w-full max-w-[220px] lg:max-w-xs xl:max-w-xs
                    cursor-pointer rounded-lg
                    bg-white/85 border border-white/20 hover:bg-white/90 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15 dark:hover:border-white/20 transition-all duration-150"
                >
                  <Search className="absolute left-3 h-4 w-4 text-zinc-500 dark:text-white/60 shrink-0" />
                  <span className="h-8 pl-9 flex items-center text-sm text-zinc-500 dark:text-white/50 select-none cursor-pointer flex-1">
                    {searchPlaceholder}
                  </span>
                  <kbd
                    className="hidden lg:flex mr-3 items-center px-1.5 py-0.5
                    rounded border border-zinc-900/10 bg-zinc-800/5
                    text-[10px] text-zinc-500 font-mono shrink-0 whitespace-nowrap
                    dark:bg-white/10 dark:border-white/15 dark:text-white/60"
                  >
                    ⌘K
                  </kbd>
                </div>
              </TooltipTrigger>
              <TooltipContent>{searchPlaceholder}</TooltipContent>
            </Tooltip>
          )}

          {}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="shrink-0 rounded-full outline-none
                  ring-2 ring-white/20 hover:ring-white/40
                  dark:ring-white/10 dark:hover:ring-white/20
                  transition-all duration-150 focus-visible:ring-white"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-bold bg-white text-primary dark:bg-white/20 dark:text-white">
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary dark:text-white" />
                    ) : isAuthenticated && userName ? (
                      userName.charAt(0).toUpperCase()
                    ) : (
                      <User className="h-4 w-4 text-primary dark:text-white" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {isAuthenticated && (
                <>
                  <DropdownMenuLabel className="font-normal pb-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {signedInText}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => go(dashboardHref)}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {dashboardText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => go(profileHref)}>
                    <User className="mr-2 h-4 w-4" />
                    {profileText}
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                {settingsText}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isAuthenticated ? (
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-destructive focus:text-destructive disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  {logoutText}
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => go(loginWithNext)}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {loginText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => go(registerHref)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {registerText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => go(forgotPasswordHref)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {forgotPasswordText}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {}
        {showSearch && (
          <div className="md:hidden px-4 py-2.5">
            <SearchTrigger onOpen={openSearch} placeholder={searchPlaceholder} />
          </div>
        )}

        {}
        {hasBreadcrumb && (
          <div className="w-full border-t border-border bg-muted/30">
            <div className="w-full px-4 md:px-6 lg:px-8 py-2">
              <Breadcrumb items={breadcrumbs} onNavigate={(href) => go(href)} />
            </div>
          </div>
        )}
      </header>
    </TooltipProvider>
  );
}
