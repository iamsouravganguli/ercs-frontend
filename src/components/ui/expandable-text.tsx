import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type ExpandableTextProps = {
  value?: string;
  label?: string;
  maxLength?: number;
  showChips?: boolean;
};

export const ExpandableText = ({
  value = "",
  label,
  maxLength = 40,
  showChips = false,
}: ExpandableTextProps) => {
  if (!value) return <span>-</span>;

  const short =
    value.length > maxLength ? value.slice(0, maxLength).trim() + "..." : value;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          className="cursor-pointer truncate inline-block max-w-[200px] align-bottom"
          title={value}
        >
          {short}
        </span>
      </PopoverTrigger>

      <PopoverContent className="w-96 max-h-60 overflow-y-auto">
        <div className="space-y-2">
          {}
          {label && <div className="font-semibold">{label}</div>}

          {}
          {showChips ? (
            <div className="flex flex-wrap gap-1">
              {value.split(",").map((v, i) => (
                <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                  {v.trim()}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm wrap-break-word">{value}</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
