import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export const renderPartyCell = (
  data: any[] = [],
  label: string,
  showId: boolean = false,
) => {
  if (!data || data.length === 0) return "-";

  const first = data[0];
  const remaining = data.length - 1;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="cursor-pointer flex flex-col max-w-[180px]">
          {}
          <span className="font-medium truncate" title={first.PartyName}>
            {first.PartyName}
          </span>

          {first.FName && (
            <span
              className="text-xs text-muted-foreground truncate"
              title={first.FName}
            >
              {first.FName}
            </span>
          )}

          {remaining > 0 && (
            <span className="text-xs text-muted-foreground">
              +{remaining} more
            </span>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 max-h-60 overflow-y-auto">
        <div className="space-y-3">
          <div className="font-semibold">{label}</div>

          {data.map((p: any, index: number) => (
            <div key={index} className="border-b pb-2 last:border-none">
              {}
              <div className="font-medium wrap-break-word">{p.PartyName}</div>

              {}
              {p.FName && (
                <div className="text-xs text-muted-foreground wrap-break-word">
                  {p.FName}
                </div>
              )}

              {p.Mobile && <div className="text-xs">{p.Mobile}</div>}

              {showId && p.Id && p.IdNo && (
                <div className="text-xs text-muted-foreground">
                  {p.Id}: {p.IdNo.replace(/\d{8}(\d{4})/, "XXXXXXXX$1")}
                </div>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
