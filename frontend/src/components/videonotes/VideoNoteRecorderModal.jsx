import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../lib/axios";
import { formatDuration, formatFileSize } from "../../lib/fileUtils";
import {
  VideoIcon,
  MicIcon,
  MicOffIcon,
  PlayIcon,
  PauseIcon,
  SquareIcon,
  RotateCcwIcon,
  UploadCloudIcon,
  XIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  MonitorIcon,
  ArrowLeftIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const MAX_DURATION_SECONDS = 300; // 5 minutos límite estricto (300s)

export default function VideoNoteRecorderModal({
  taskId,
  subtaskId = null,
  onUploadSuccess,
  onClose,
}) {
  // Estados: 'idle' | 'recording' | 'paused' | 'preview'
  const [recordingState, setRecordingState] = useState("idle");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [title, setTitle] = useState("");
  const [videoBlob, setVideoBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef(null);
  const displayStreamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const combinedStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const mimeTypeRef = useRef("");

  // Detener todos los tracks de los flujos de medios
  const stopAllMediaTracks = useCallback(() => {
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (combinedStreamRef.current) {
      combinedStreamRef.current.getTracks().forEach((track) => track.stop());
      combinedStreamRef.current = null;
    }
  }, []);

  // Limpiar timer y flujos al desmontar o cerrar
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopAllMediaTracks();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stopAllMediaTracks, previewUrl]);

  // Selección dinámica del mejor mimeType soportado por el navegador
  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=h264,opus",
      "video/webm",
      "video/mp4;codecs=avc1,mp4a",
      "video/mp4",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return "";
  };

  // Iniciar la grabación de pantalla + audio
  const handleStartRecording = async () => {
    setErrorMsg("");
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setErrorMsg(
        "Tu navegador o entorno no soporta la grabación nativa de pantalla (getDisplayMedia)."
      );
      return;
    }

    try {
      // 1. Obtener flujo de pantalla (1080p máx, 30fps)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
      displayStreamRef.current = displayStream;

      // 2. Obtener flujo de audio de micrófono con cancelación de eco y supresión de ruido
      let audioStream = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        audioStreamRef.current = audioStream;
      } catch (micErr) {
        console.warn("No se pudo acceder al micrófono:", micErr);
        toast("Grabando sin audio de micrófono (permiso denegado)", {
          icon: "⚠️",
        });
      }

      // 3. Combinar pistas de pantalla y micrófono en un solo MediaStream
      const tracks = [
        ...displayStream.getVideoTracks(),
        ...(audioStream ? audioStream.getAudioTracks() : []),
      ];
      const combinedStream = new MediaStream(tracks);
      combinedStreamRef.current = combinedStream;

      // Detectar cuando el usuario detiene la pantalla mediante la barra del navegador
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          handleStopRecording();
        };
      }

      // 4. Configurar MediaRecorder con restricciones estrictas de compresión (1.5 Mbps video / 128 kbps audio)
      const selectedMime = getSupportedMimeType();
      mimeTypeRef.current = selectedMime;

      const options = {
        ...(selectedMime ? { mimeType: selectedMime } : {}),
        videoBitsPerSecond: 1500000, // 1.5 Mbps
        audioBitsPerSecond: 128000, // 128 kbps
      };

      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        const rawType = mimeTypeRef.current || "video/webm";
        const finalBlob = new Blob(chunksRef.current, { type: rawType });
        setVideoBlob(finalBlob);

        const url = URL.createObjectURL(finalBlob);
        setPreviewUrl(url);
        setRecordingState("preview");

        // Autogenerar título sugerido si está vacío
        if (!title.trim()) {
          const now = new Date();
          const dateStr = now.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
          setTitle(`Video Nota - ${dateStr}`);
        }

        stopAllMediaTracks();
      };

      // Iniciar grabación recolectando paquetes cada 1 segundo
      mediaRecorder.start(1000);
      setRecordingState("recording");
      setTimeElapsed(0);

      // Iniciar temporizador
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_DURATION_SECONDS) {
            toast.error("Límite de 5 minutos alcanzado. Grabación finalizada.");
            handleStopRecording();
            return MAX_DURATION_SECONDS;
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Error al iniciar grabación:", err);
      stopAllMediaTracks();
      if (err.name === "NotAllowedError") {
        setErrorMsg("Se canceló o denegó el acceso a la pantalla.");
      } else {
        setErrorMsg(`Error al iniciar la grabación: ${err.message || err}`);
      }
      setRecordingState("idle");
    }
  };

  // Pausar grabación
  const handlePauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setRecordingState("paused");
    }
  };

  // Reanudar grabación
  const handleResumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_DURATION_SECONDS) {
            toast.error("Límite de 5 minutos alcanzado. Grabación finalizada.");
            handleStopRecording();
            return MAX_DURATION_SECONDS;
          }
          return next;
        });
      }, 1000);
    }
  };

  // Detener grabación
  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("Error stopping mediaRecorder:", err);
      }
    }
  };

  // Descartar video y volver al estado inicial
  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setVideoBlob(null);
    setPreviewUrl(null);
    setTimeElapsed(0);
    setRecordingState("idle");
    setErrorMsg("");
  };

  // Cerrar el video/grabación y volver a la tarea
  const handleCloseAndReturn = () => {
    if (recordingState === "recording" || recordingState === "paused") {
      if (
        !window.confirm(
          "¿Deseas cancelar la grabación y volver a la tarea? El video en curso se perderá."
        )
      ) {
        return;
      }
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    stopAllMediaTracks();
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    onClose();
  };

  // Alternar audio del micrófono durante la grabación
  const toggleAudioTrack = () => {
    if (audioStreamRef.current) {
      const audioTracks = audioStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioEnabled;
        audioTracks.forEach((t) => (t.enabled = nextState));
        setAudioEnabled(nextState);
      }
    }
  };

  // Subir video nota al servidor
  const handleUpload = async () => {
    if (!videoBlob) {
      toast.error("No hay ninguna grabación para subir.");
      return;
    }

    if (!title.trim()) {
      toast.error("Por favor ingresa un título para la video nota.");
      return;
    }

    setIsUploading(true);
    try {
      const isMp4 = (mimeTypeRef.current || "").includes("mp4");
      const ext = isMp4 ? ".mp4" : ".webm";
      const filename = `videonote-${Date.now()}${ext}`;

      const formData = new FormData();
      formData.append(
        "video",
        videoBlob,
        filename
      );
      formData.append("title", title.trim());
      formData.append("durationSeconds", timeElapsed.toString());
      if (subtaskId) {
        formData.append("subtaskId", subtaskId);
      }

      const res = await api.post(`/tasks/${taskId}/video-notes`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("¡Video nota guardada y vinculada exitosamente!");
      if (onUploadSuccess) {
        onUploadSuccess(res.data.videoNote);
      }
      onClose();
    } catch (err) {
      console.error("Error al subir video nota:", err);
      const msg =
        err.response?.data?.message ||
        "Error al subir el video. Verifica que no exceda 64MB.";
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Porcentaje del tiempo transcurrido respecto al límite de 5 min (300 seg)
  const progressPercent = Math.min(
    100,
    Math.round((timeElapsed / MAX_DURATION_SECONDS) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-base-100 rounded-2xl shadow-2xl border border-base-content/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-content/10 bg-base-200/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-error/15 text-error rounded-xl">
              <VideoIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-base-content leading-tight">
                Grabar Video Nota
              </h2>
              <p className="text-xs text-base-content/60">
                Captura pantalla y micrófono (hasta 5 min, máx 64MB)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCloseAndReturn}
              disabled={isUploading}
              className="btn btn-ghost btn-xs sm:btn-sm gap-1.5 rounded-lg text-base-content/70 hover:text-base-content font-medium"
              title="Cerrar el video y volver a la tarea"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="hidden sm:inline">Volver a la tarea</span>
            </button>
            <button
              type="button"
              onClick={handleCloseAndReturn}
              disabled={isUploading}
              className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              title="Cerrar"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="alert alert-error/15 border border-error/30 text-error text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertCircleIcon className="size-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ESTADO IDLE: Instrucciones previas a la grabación */}
          {recordingState === "idle" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-base-200/50 border border-base-content/10 text-center space-y-3">
                <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                  <MonitorIcon className="size-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-base-content">
                    Listo para grabar tu pantalla y voz
                  </h3>
                  <p className="text-xs text-base-content/60 max-w-sm mx-auto mt-1 leading-relaxed">
                    Al presionar <strong>"Iniciar Grabación"</strong>, tu navegador
                    te solicitará seleccionar la pantalla, ventana o pestaña que
                    deseas capturar.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left pt-2">
                  <div className="p-2.5 bg-base-100 rounded-xl border border-base-content/10 text-xs">
                    <span className="text-[10px] uppercase font-bold text-primary block">
                      Resolución
                    </span>
                    <span className="font-medium text-base-content">
                      1080p (1920x1080)
                    </span>
                  </div>
                  <div className="p-2.5 bg-base-100 rounded-xl border border-base-content/10 text-xs">
                    <span className="text-[10px] uppercase font-bold text-primary block">
                      Tiempo Máximo
                    </span>
                    <span className="font-medium text-base-content">
                      5:00 minutos
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-sm btn-ghost rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="btn btn-sm btn-error text-white rounded-lg gap-2 shadow-sm font-semibold"
                >
                  <span className="size-2 rounded-full bg-white animate-pulse" />
                  <span>Iniciar Grabación</span>
                </button>
              </div>
            </div>
          )}

          {/* ESTADO RECORDING / PAUSED: Interfaz en vivo de grabación */}
          {(recordingState === "recording" || recordingState === "paused") && (
            <div className="space-y-5 py-2">
              <div className="p-6 rounded-2xl bg-base-200/60 border border-base-content/10 text-center space-y-4">
                {/* Indicador de estado */}
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`size-3 rounded-full ${
                      recordingState === "recording"
                        ? "bg-error animate-ping"
                        : "bg-warning"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      recordingState === "recording"
                        ? "text-error"
                        : "text-warning"
                    }`}
                  >
                    {recordingState === "recording"
                      ? "Grabando pantalla y audio..."
                      : "Grabación en pausa"}
                  </span>
                </div>

                {/* Contador de tiempo */}
                <div className="font-mono text-4xl font-extrabold text-base-content tracking-tight">
                  {formatDuration(timeElapsed)}
                  <span className="text-sm font-normal text-base-content/40 ml-2">
                    / 05:00
                  </span>
                </div>

                {/* Barra de progreso de 5 minutos */}
                <div className="space-y-1 max-w-sm mx-auto">
                  <div className="w-full h-2 bg-base-300 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        timeElapsed > 240
                          ? "bg-error"
                          : timeElapsed > 180
                          ? "bg-warning"
                          : "bg-primary"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-base-content/50">
                    <span>0:00</span>
                    <span>Límite 5:00</span>
                  </div>
                </div>

                {/* Acciones de control */}
                <div className="flex items-center justify-center gap-3 pt-3">
                  {recordingState === "recording" ? (
                    <button
                      type="button"
                      onClick={handlePauseRecording}
                      className="btn btn-sm btn-outline gap-1.5 rounded-xl font-medium"
                      title="Pausar grabación"
                    >
                      <PauseIcon className="size-4" />
                      <span>Pausar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResumeRecording}
                      className="btn btn-sm btn-outline btn-warning gap-1.5 rounded-xl font-medium"
                      title="Reanudar grabación"
                    >
                      <PlayIcon className="size-4" />
                      <span>Reanudar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={toggleAudioTrack}
                    className={`btn btn-sm btn-ghost gap-1.5 rounded-xl font-medium ${
                      !audioEnabled ? "text-error" : ""
                    }`}
                    title={
                      audioEnabled
                        ? "Silenciar micrófono"
                        : "Activar micrófono"
                    }
                  >
                    {audioEnabled ? (
                      <MicIcon className="size-4" />
                    ) : (
                      <MicOffIcon className="size-4 text-error" />
                    )}
                    <span>{audioEnabled ? "Micrófono On" : "Micrófono Mute"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="btn btn-sm btn-error text-white gap-1.5 rounded-xl font-semibold shadow-sm"
                    title="Detener y revisar video"
                  >
                    <SquareIcon className="size-4 fill-current" />
                    <span>Finalizar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseAndReturn}
                    className="btn btn-sm btn-ghost gap-1.5 rounded-xl font-medium text-base-content/70 hover:text-error"
                    title="Cancelar grabación y volver a la tarea"
                  >
                    <ArrowLeftIcon className="size-4" />
                    <span>Volver a la tarea</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-center text-base-content/50">
                Puedes minimizar esta ventana para capturar cualquier pestaña o
                documento. Haz clic en "Finalizar" cuando termines tu
                explicación.
              </p>
            </div>
          )}

          {/* ESTADO PREVIEW: Previsualización antes de guardar o descartar */}
          {recordingState === "preview" && (
            <div className="space-y-4">
              {/* Reproductor de previsualización */}
              <div className="rounded-2xl overflow-hidden bg-black/90 aspect-video flex items-center justify-center relative border border-base-content/10 shadow-lg">
                {previewUrl && (
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Metadatos calculados */}
              <div className="flex items-center justify-between text-xs px-1 text-base-content/70">
                <span className="flex items-center gap-1 font-mono">
                  ⏱️ Duración: <strong>{formatDuration(timeElapsed)}</strong>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  📦 Tamaño:{" "}
                  <strong>
                    {videoBlob ? formatFileSize(videoBlob.size) : "Calculando..."}
                  </strong>
                </span>
              </div>

              {/* Título de la Video Nota */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
                  Título de la Video Nota <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Explicación del rediseño del header y fuentes"
                  className="input input-sm input-bordered w-full rounded-xl bg-base-200/50 focus:bg-base-100"
                  disabled={isUploading}
                />
              </div>

              {/* Botones de acción final */}
              <div className="flex items-center justify-between pt-2 border-t border-base-content/10">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isUploading}
                  className="btn btn-sm btn-ghost text-base-content/70 hover:text-error gap-1.5 rounded-lg"
                >
                  <RotateCcwIcon className="size-4" />
                  <span>Volver a Grabar</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseAndReturn}
                    disabled={isUploading}
                    className="btn btn-sm btn-ghost gap-1.5 rounded-lg font-medium text-base-content/70 hover:text-base-content"
                    title="Cerrar el video y volver a la tarea"
                  >
                    <ArrowLeftIcon className="size-4" />
                    <span>Volver a la tarea</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading || !title.trim()}
                    className="btn btn-sm btn-primary rounded-lg gap-2 shadow-sm font-semibold"
                  >
                    {isUploading ? (
                      <>
                        <span className="loading loading-spinner loading-xs" />
                        <span>Subiendo Video...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloudIcon className="size-4" />
                        <span>Guardar Video Nota</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
