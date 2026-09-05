"use client";
import { Toaster as HotToaster } from "react-hot-toast";


export function Toaster(props: React.ComponentProps<typeof HotToaster>) {
  return <HotToaster position="top-center" gutter={8} {...props} />;
}
