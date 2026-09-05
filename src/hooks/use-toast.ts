"use client";
import toast from "react-hot-toast";


function useToast() {
  return {
    toasts: [] as any[],
    toast,
    dismiss: (toastId?: string) => toast.dismiss(toastId),
  };
}

export { useToast, toast };
