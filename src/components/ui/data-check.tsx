type DataCheckProps<T> = {
  data: T[] | null | undefined;
  children: React.ReactNode;
};

export function DataCheck<T>({ data, children }: DataCheckProps<T>) {
  if (!data || data.length === 0) return null;

  return <>{children}</>;
}
