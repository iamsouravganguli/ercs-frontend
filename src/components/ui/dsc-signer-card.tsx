import React from "react";
import { Checkbox } from "./checkbox";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export interface DSCProfileCert {
  id?: number | string;
  serial: string;
  code?: string;
  subject?: string;
  valid_from?: string;
  valid_to?: string;
}

export interface DSCSignerCardProps {
  useDsc: boolean;
  onUseDscChange: (value: boolean) => void;
  pin: string;
  onPinChange: (value: string) => void;
  profileCerts: DSCProfileCert[];
  loadingCerts?: boolean;
  title?: string;
  checkboxLabel?: string;
  pinLabel?: string;
  pinPlaceholder?: string;
  noCertsText?: string;
  certsHeaderTitle?: string;
}

export function DSCSignerCard({
  useDsc,
  onUseDscChange,
  pin,
  onPinChange,
  profileCerts,
  loadingCerts = false,
  title = "Digital Signature (DSC)",
  checkboxLabel = "Digitally sign with DSC Token",
  pinLabel = "Token PIN",
  pinPlaceholder = "Enter token PIN",
  noCertsText = "No registered DSC certificate found in user profile.",
  certsHeaderTitle = "Profile Certificate Details",
}: DSCSignerCardProps) {
  return (
    <section className="bg-card border rounded-xl overflow-hidden">
      <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
        {title}
      </div>
      <div className="p-6 space-y-4">
        {loadingCerts ? (
          <div className="text-xs text-muted-foreground animate-pulse">
            Loading certificate details...
          </div>
        ) : profileCerts.length === 0 ? (
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-medium">
            {noCertsText}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="global_dsc_sign_check"
                checked={useDsc}
                onCheckedChange={(checked) => onUseDscChange(!!checked)}
              />
              <label
                htmlFor="global_dsc_sign_check"
                className="text-sm font-medium text-foreground cursor-pointer select-none"
              >
                {checkboxLabel}
              </label>
            </div>

            {useDsc && (
              <div className="p-4 bg-muted/20 border rounded-lg text-sm space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {certsHeaderTitle}
                </div>
                {profileCerts.map((pc) => (
                  <div
                    key={pc.id || pc.serial}
                    className="space-y-1 text-xs text-foreground/80 font-medium"
                  >
                    {pc.code && (
                      <div>
                        Certificate Code:{" "}
                        <span className="font-semibold text-foreground">
                          {pc.code}
                        </span>
                      </div>
                    )}
                    {pc.subject && (
                      <div>
                        Subject:{" "}
                        <span className="font-semibold text-foreground">
                          {pc.subject}
                        </span>
                      </div>
                    )}
                    <div>
                      Serial:{" "}
                      <span className="font-mono text-muted-foreground">
                        {pc.serial}
                      </span>
                    </div>
                    {(pc.valid_from || pc.valid_to) && (
                      <div>
                        Validity:{" "}
                        <span className="text-muted-foreground">
                          {pc.valid_from ? formatDate(pc.valid_from) : ""}{" "}
                          {pc.valid_to ? `- ${formatDate(pc.valid_to)}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-3 border-t space-y-1.5 max-w-xs">
                  <label
                    htmlFor="global_dsc_pin_input"
                    className="text-xs font-medium text-foreground block"
                  >
                    {pinLabel} <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="global_dsc_pin_input"
                    type="password"
                    value={pin}
                    onChange={(e) => onPinChange(e.target.value)}
                    placeholder={pinPlaceholder}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
