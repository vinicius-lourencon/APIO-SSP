import { useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/FormField";
import { ApiError, requestMeeting } from "@/lib/api";
import { cn } from "@/lib/utils";
import { fieldClass, primaryButton, secondaryButton } from "@/lib/styles";
import type { MeetingRequestResponse } from "@shared/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  studentName: string;
  studentEmail: string;
  onSent: (result: MeetingRequestResponse) => void;
}

// Current local time as "YYYY-MM-DDTHH:mm" (datetime-local format) to block past dates
function nowForInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MeetingRequestDialog({
  open,
  onOpenChange,
  projectId,
  studentName,
  studentEmail,
  onSent,
}: Props) {
  const [message, setMessage] = useState("");
  const [proposedAt, setProposedAt] = useState("");
  const [location, setLocation] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Fresh form every time the dialog opens
  useEffect(() => {
    if (open) {
      setMessage("");
      setProposedAt("");
      setLocation("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const result = await requestMeeting(projectId, {
        message: message.trim(),
        proposed_at: proposedAt || undefined,
        location: location.trim(),
      });
      if (result.delivery === "log") {
        // Test mode on the server: nothing was really e-mailed, so never show it as a success
        toast.warning(result.message, { duration: 10_000 });
      } else {
        toast.success(
          result.scheduleUpdated
            ? `${result.message} A reunião também foi adicionada ao cronograma.`
            : result.message,
        );
      }
      onSent(result);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Erro ao enviar a solicitação de reunião.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !sending && onOpenChange(next)}>
      <DialogContent className="border-black/5 bg-white font-sans sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-tinta">
              Solicitar reunião
            </DialogTitle>
            <DialogDescription>
              O aluno recebe um e-mail com sua solicitação. As respostas dele
              chegam direto no seu e-mail.
            </DialogDescription>
          </DialogHeader>

          <div>
            <p className="mb-2 text-sm font-medium text-apoio">Destinatário</p>
            <p className="break-all rounded-xl border border-black/5 bg-black/[0.03] px-4 py-2.5 text-sm text-tinta">
              {studentName} &lt;{studentEmail}&gt;
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Data e horário" hint="opcional">
              <input
                type="datetime-local"
                min={nowForInput()}
                value={proposedAt}
                onChange={(e) => setProposedAt(e.target.value)}
                disabled={sending}
                className={cn(fieldClass, "h-11")}
              />
            </FormField>
            <FormField label="Local" hint="opcional">
              <input
                type="text"
                maxLength={200}
                placeholder="Ex.: Sala 3, Bloco B ou Google Meet"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={sending}
                className={cn(fieldClass, "h-11")}
              />
            </FormField>
          </div>
          {proposedAt && (
            <p className="-mt-2 text-xs text-mata">
              A data informada será adicionada ao cronograma do projeto.
            </p>
          )}

          <FormField
            label="Mensagem"
            hint="opcional"
            counter={`${message.length}/2000`}
          >
            <textarea
              rows={5}
              maxLength={2000}
              placeholder="Sugira datas, horários, local ou a pauta da reunião..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              className={cn(fieldClass, "resize-none")}
            />
          </FormField>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={sending}
              className={secondaryButton}
            >
              Cancelar
            </button>
            <button type="submit" disabled={sending} className={primaryButton}>
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
