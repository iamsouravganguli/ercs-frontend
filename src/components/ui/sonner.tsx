"use client";
import { Toaster as HotToaster, type ToasterProps } from "react-hot-toast";


const Toaster = (props: ToasterProps) => {
  return <HotToaster position="top-center" gutter={8} {...(props as any)} />;
};

export { Toaster };
