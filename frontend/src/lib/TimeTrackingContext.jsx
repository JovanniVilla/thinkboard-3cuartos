import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import api from "./axios";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const TimeTrackingContext = createContext(null);

export const useTimeTracking = () => {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error("useTimeTracking debe usarse dentro de un TimeTrackingProvider");
  }
  return context;
};

export const TimeTrackingProvider = ({ children }) => {
  const { user } = useAuth();

  const [globalEntry, setGlobalEntry] = useState(null);
  const [activeNoteEntry, setActiveNoteEntry] = useState(null);
  const [todayGlobalSeconds, setTodayGlobalSeconds] = useState(0);
  const [isIdleModalOpen, setIsIdleModalOpen] = useState(false);
  const [idleInfo, setIdleInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Refs para usar en callbacks/effects sin re-crear funciones ────────────
  const broadcastChannelRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const globalEntryRef = useRef(null);
  const activeNoteEntryRef = useRef(null);
  // Ref para operaciones en curso (evitar doble-pausa)
  const pausingNoteRef = useRef(false);
  const pausingGlobalRef = useRef(false);

  // Mantener refs sincronizados con el state (sin causar re-renders)
  globalEntryRef.current = globalEntry;
  activeNoteEntryRef.current = activeNoteEntry;

  // ─── 1. Sincronización inicial con el backend ──────────────────────────────
  const fetchActiveTimers = useCallback(async () => {
    if (!user) {
      setGlobalEntry(null);
      setActiveNoteEntry(null);
      setTodayGlobalSeconds(0);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/time/active");
      const { running, todayGlobalSeconds: todaySec } = res.data;

      const runningGlobal = running.find((e) => e.type === "GLOBAL") || null;
      const runningNote = running.find((e) => e.type === "NOTE") || null;

      setGlobalEntry(runningGlobal);
      setActiveNoteEntry(runningNote);
      setTodayGlobalSeconds(todaySec || 0);
    } catch (error) {
      console.error("Error al consultar temporizadores activos:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActiveTimers();
  }, [fetchActiveTimers]);

  // ─── 2. BroadcastChannel Multi-Pestaña ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel("time_tracker_channel");
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === "REFRESH_TIMERS") {
        fetchActiveTimers();
      } else if (type === "GLOBAL_STARTED") {
        setGlobalEntry(payload);
      } else if (type === "GLOBAL_PAUSED") {
        setGlobalEntry(null);
      } else if (type === "NOTE_STARTED") {
        setActiveNoteEntry(payload);
      } else if (type === "NOTE_PAUSED") {
        setActiveNoteEntry(null);
      }
    };

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [fetchActiveTimers]);

  const notifyBroadcast = useCallback((type, payload = null) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type, payload });
      } catch (err) {
        console.warn("Error enviando mensaje por BroadcastChannel:", err);
      }
    }
  }, []);

  // ─── 3. Tick global visual cada 1s (solo incrementa cuando hay globalEntry) ─
  useEffect(() => {
    const interval = setInterval(() => {
      if (globalEntryRef.current) {
        setTodayGlobalSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ─── 4. Heartbeat cada 30s al backend ─────────────────────────────────────
  // ─── 4. Heartbeat cada 30s al backend ─────────────────────────────────────
  const sendHeartbeat = useCallback(async () => {
    const activeIds = [];
    if (globalEntryRef.current?._id) activeIds.push(globalEntryRef.current._id);
    if (activeNoteEntryRef.current?._id) activeIds.push(activeNoteEntryRef.current._id);

    if (activeIds.length > 0) {
      try {
        await api.post("/time/heartbeat", { activeEntryIds: activeIds });
      } catch (err) {
        console.warn("Heartbeat falló:", err.message);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(heartbeatInterval);
  }, [user, sendHeartbeat]);

  // Al volver a la pestaña (visibilitychange), enviar heartbeat inmediato y sincronizar estado
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        lastActivityRef.current = Date.now();
        sendHeartbeat();
        fetchActiveTimers();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, sendHeartbeat, fetchActiveTimers]);

  // ─── 5. Detección de Inactividad ── SOLO pausa el contador GLOBAL ──────────
  // El temporizador de nota NO se pausa por inactividad. Solo el de jornada general.
  // La razón: el usuario puede estar en una reunión o revisando documentos mientras
  // trabaja en una tarea, y no queremos interrumpir su registro de trabajo en esa nota.
  useEffect(() => {
    if (!user) return;

    const IDLE_LIMIT_MS = 5 * 60 * 1000; // 5 minutos

    let lastHandled = 0;
    const throttledListener = () => {
      const now = Date.now();
      if (now - lastHandled > 2000) {
        lastHandled = now;
        lastActivityRef.current = now;
      }
    };

    const events = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach((ev) =>
      window.addEventListener(ev, throttledListener, { capture: true, passive: true })
    );

    // Verificador periódico de inactividad cada 10 segundos
    const idleCheckInterval = setInterval(async () => {
      const now = Date.now();
      const elapsedSinceActivity = now - lastActivityRef.current;

      // Solo pausar GLOBAL si está corriendo y hay inactividad
      const isGlobalRunning = !!globalEntryRef.current;
      if (!isGlobalRunning) return; // Nada que hacer

      if (elapsedSinceActivity >= IDLE_LIMIT_MS) {
        console.warn("[IdleDetector] Inactividad detectada. Pausando contador global...");

        const idleStartTime = new Date(now - IDLE_LIMIT_MS);
        const savedGlobal = globalEntryRef.current;
        // Guardamos si había nota corriendo para informar al usuario (pero NO la pausamos)
        const savedNote = activeNoteEntryRef.current;

        // Pausar SOLO el global con fecha retroactiva al inicio de inactividad
        if (savedGlobal?._id) {
          await api
            .post("/time/pause", { entryId: savedGlobal._id, customEndedAt: idleStartTime })
            .catch(() => {});
          setGlobalEntry(null);
        }

        setIdleInfo({
          wasGlobalRunning: !!savedGlobal,
          wasNoteRunning: !!savedNote,
          noteId: savedNote?.noteId?._id || savedNote?.noteId,
          noteTitle: savedNote?.noteId?.title || "Tarea",
        });

        setIsIdleModalOpen(true);
        notifyBroadcast("GLOBAL_PAUSED");
      }
    }, 10000);

    return () => {
      events.forEach((ev) =>
        window.removeEventListener(ev, throttledListener, { capture: true })
      );
      clearInterval(idleCheckInterval);
    };
  }, [user, notifyBroadcast]);

  // ─── 6. Acciones Expuestas ─────────────────────────────────────────────────
  const startGlobalTimer = useCallback(async () => {
    if (pausingGlobalRef.current) return;
    try {
      const res = await api.post("/time/start", { type: "GLOBAL" });
      setGlobalEntry(res.data);
      notifyBroadcast("GLOBAL_STARTED", res.data);
      toast.success("Jornada iniciada");
    } catch {
      toast.error("Error al iniciar contador global");
    }
  }, [notifyBroadcast]);

  const pauseGlobalTimer = useCallback(async () => {
    if (pausingGlobalRef.current) return;
    const idToPause = globalEntryRef.current?._id;
    if (!idToPause) return;

    pausingGlobalRef.current = true;
    try {
      await api.post("/time/pause", { entryId: idToPause });
      setGlobalEntry(null);
      notifyBroadcast("GLOBAL_PAUSED");
      toast("Jornada pausada", { icon: "⏸️" });
    } catch {
      toast.error("Error al pausar contador global");
    } finally {
      pausingGlobalRef.current = false;
    }
  }, [notifyBroadcast]);

  const startNoteTimer = useCallback(async (noteId, { silent = false } = {}) => {
    if (!noteId) return;
    if (pausingNoteRef.current) return;
    try {
      const res = await api.post("/time/start", { type: "NOTE", noteId });
      setActiveNoteEntry(res.data);
      notifyBroadcast("NOTE_STARTED", res.data);
      if (!silent) {
        toast.success("Temporizador de tarea iniciado");
      }
      return res.data;
    } catch {
      if (!silent) {
        toast.error("Error al iniciar temporizador de tarea");
      }
    }
  }, [notifyBroadcast]);

  const pauseNoteTimer = useCallback(async (entryId, { silent = false } = {}) => {
    const idToPause = entryId || activeNoteEntryRef.current?._id;
    if (!idToPause) return;
    if (pausingNoteRef.current) return;

    pausingNoteRef.current = true;
    try {
      const res = await api.post("/time/pause", { entryId: idToPause });
      setActiveNoteEntry(null);
      notifyBroadcast("NOTE_PAUSED");
      if (!silent) {
        toast("Temporizador de tarea pausado", { icon: "⏸️" });
      }
      return res.data;
    } catch {
      if (!silent) {
        toast.error("Error al pausar temporizador de tarea");
      }
    } finally {
      pausingNoteRef.current = false;
    }
  }, [notifyBroadcast]);

  const resumeFromIdle = useCallback(async () => {
    if (!idleInfo) {
      setIsIdleModalOpen(false);
      return;
    }

    try {
      // Solo reanudar el global (la nota sigue corriendo si estaba corriendo)
      if (idleInfo.wasGlobalRunning) {
        await startGlobalTimer();
      }
      // NO reanudar la nota porque nunca la pausamos por idle
    } finally {
      setIsIdleModalOpen(false);
      setIdleInfo(null);
      lastActivityRef.current = Date.now();
    }
  }, [idleInfo, startGlobalTimer]);

  const dismissIdleModal = useCallback(() => {
    setIsIdleModalOpen(false);
    setIdleInfo(null);
    lastActivityRef.current = Date.now();
  }, []);

  // Calcula los segundos transcurridos de la sesión activa de nota
  const getActiveNoteElapsedSeconds = useCallback(() => {
    const active = activeNoteEntryRef.current;
    if (!active?.startedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000));
  }, []);

  return (
    <TimeTrackingContext.Provider
      value={{
        globalEntry,
        activeNoteEntry,
        todayGlobalSeconds,
        isGlobalRunning: !!globalEntry,
        isNoteRunning: !!activeNoteEntry,
        loading,
        startGlobalTimer,
        pauseGlobalTimer,
        startNoteTimer,
        pauseNoteTimer,
        getActiveNoteElapsedSeconds,
        isIdleModalOpen,
        idleInfo,
        resumeFromIdle,
        dismissIdleModal,
        fetchActiveTimers,
      }}
    >
      {children}
    </TimeTrackingContext.Provider>
  );
};
