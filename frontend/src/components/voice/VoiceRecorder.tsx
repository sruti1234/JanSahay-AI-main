import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { useLiveTranscript } from "../../hooks/useLiveTranscript";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isDisabled?: boolean;
  language?: string;
}

export default function VoiceRecorder({
  onRecordingComplete,
  isDisabled = false,
  language = "en",
}: VoiceRecorderProps) {
  const { state, errorMessage, startRecording, stopRecording } =
    useVoiceRecorder();
  const { liveText, liveStatus, startLive, stopLive } = useLiveTranscript();

  async function handleToggle() {
    if (state === "recording") {
      stopLive();
      const blob = await stopRecording();
      if (blob && blob.size > 0) {
        onRecordingComplete(blob);
      }
    } else {
      await startRecording();
      startLive(language);
    }
  }

  const isRecording = state === "recording";

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isDisabled || state === "error"}
        aria-label={isRecording ? "Stop recording" : "Start voice recording"}
        className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition
          ${
            isRecording
              ? "animate-pulse border-rose-500 bg-rose-50 text-rose-600"
              : "border-slate-300 bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
          }
          disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {isRecording ? "⏹" : "🎤"}
      </button>
      {isRecording && (
        <span className="text-xs font-medium text-rose-600">Recording…</span>
      )}
      {isRecording && liveStatus && !liveText && (
        <p className="text-xs text-slate-500">{liveStatus}</p>
      )}
      {isRecording && liveText && (
        <p className="max-w-md rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
          {liveText}
        </p>
      )}
      {errorMessage && (
        <p className="max-w-xs text-xs text-rose-600">{errorMessage}</p>
      )}
    </div>
  );
}
