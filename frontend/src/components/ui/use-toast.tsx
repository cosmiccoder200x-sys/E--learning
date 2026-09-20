import { Toaster } from "sonner";

export function useToast() {
  return { toast: (props: { title?: string; description?: string; variant?: string }) => {
    if (props.variant === "destructive") {
      console.error(props.description);
    } else {
      console.log(props.title, props.description);
    }
  }};
}

export { Toaster };
