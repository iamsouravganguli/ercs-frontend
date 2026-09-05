export function roleSwitch(role: string | null | undefined): string {
  const upperRole = (role ?? "").toUpperCase();
  switch (upperRole) {
    case "SA":
      return "/administrator";

    default:
      return "/manage/dashboard";
  }
}
