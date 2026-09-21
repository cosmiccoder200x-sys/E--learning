import { toast as sonnerToast, Toaster } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | string;
}

export function toast(props: ToastProps | string) {
  if (typeof props === "string") {
    return sonnerToast(props);
  }

  const { title, description, variant } = props;
  const message = title || description || "";
  const subText = title ? description : undefined;

  if (variant === "destructive") {
    return sonnerToast.error(message, { description: subText });
  }

  return sonnerToast.success(message, { description: subText });
}

export function useToast() {
  return { toast };
}

export { Toaster };
