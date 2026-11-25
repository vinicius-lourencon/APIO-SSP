import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { primaryButton, secondaryButton } from "@/lib/styles";

export interface ConfirmOptions {
  title: string;
  /** What will happen if the user confirms */
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for destructive actions (delete/remove): red confirm button */
  variant?: "default" | "danger";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

// App-styled replacement for window.confirm(): `if (!(await confirm({ ... }))) return;`
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Kept after closing so the text doesn't vanish during the close animation
  const [options, setOptions] = useState<ConfirmOptions>({ title: "" });
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    resolverRef.current?.(false); // a dialog left open is treated as cancelled
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setOpen(false);
  };

  const danger = options.variant === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(isOpen) => !isOpen && settle(false)}
      >
        <AlertDialogContent className="border-black/5 bg-white font-sans sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle
              className={cn(
                "text-xl font-semibold",
                danger ? "text-red-700" : "text-tinta",
              )}
            >
              {options.title}
            </AlertDialogTitle>
            {options.description && (
              <AlertDialogDescription className="text-sm leading-relaxed text-apoio">
                {options.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 gap-2 sm:gap-2">
            <AlertDialogCancel
              onClick={() => settle(false)}
              className={cn(secondaryButton, "mt-0 text-tinta")}
            >
              {options.cancelLabel ?? "Cancelar"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => settle(true)}
              className={cn(
                primaryButton,
                danger &&
                  "bg-red-600 shadow-none hover:bg-red-700 focus-visible:ring-red-200",
              )}
            >
              {options.confirmLabel ?? "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm)
    throw new Error("useConfirm must be used within ConfirmProvider");
  return confirm;
}
