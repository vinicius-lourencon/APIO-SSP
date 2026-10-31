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
import { ApiError, requestMeeting } from "@/lib/api";
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

const inputClass =
  "w-full border border-[#CCC] rounded px-3 py-2 font-ubuntu text-sm text-[#333] focus:outline-none focus:ring-2 focus:ring-[#10512D]/30 focus:border-[#10512D] disabled:bg-gray-50";

export default function MeetingRequestDialog({ open, onOpenChange, projectId, studentName, studentEmail, onSent }: Props) {
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
      setError(err instanceof ApiError ? err.message : "Erro ao enviar a solicitação de reunião.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !sending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg font-ubuntu">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[#10512D]">Solicitar reunião</DialogTitle>
            <DialogDescription>
              O aluno recebe um e-mail com sua solicitação. As respostas dele chegam direto no seu e-mail.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="block text-sm font-medium text-[#5A5858] mb-1">Destinatário</label>
            <p className="px-3 py-2 rounded bg-gray-50 border border-[#EEE] text-sm text-[#333] break-all">
              {studentName} &lt;{studentEmail}&gt;
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="meeting-date" className="block text-sm font-medium text-[#5A5858] mb-1">
                Data e horário (opcional)
              </label>
              <input
                id="meeting-date"
                type="datetime-local"
                min={nowForInput()}
                value={proposedAt}
                onChange={(e) => setProposedAt(e.target.value)}
                disabled={sending}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="meeting-location" className="block text-sm font-medium text-[#5A5858] mb-1">
                Local (opcional)
              </label>
              <input
                id="meeting-location"
                type="text"
                maxLength={200}
                placeholder="Ex.: Sala 3, Bloco B ou Google Meet"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={sending}
                className={inputClass}
              />
            </div>
          </div>
          {proposedAt && (
            <p className="text-xs text-[#10512D] -mt-2">
              A data informada será adicionada ao cronograma do projeto.
            </p>
          )}

          <div>
            <label htmlFor="meeting-message" className="block text-sm font-medium text-[#5A5858] mb-1">
              Mensagem (opcional)
            </label>
            <textarea
              id="meeting-message"
              rows={5}
              maxLength={2000}
              placeholder="Sugira datas, horários, local ou a pauta da reunião..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              className={`${inputClass} resize-none`}
            />
            <p className="text-xs text-[#999] mt-1 text-right">{message.length}/2000</p>
          </div>

          {error && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={sending}
              className="border border-[#CCC] bg-white rounded h-10 px-5 text-sm text-black hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sending}
              className="bg-[#10512D] text-white rounded h-10 px-5 text-sm font-semibold hover:bg-[#0d4325] disabled:opacity-60"
            >
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
