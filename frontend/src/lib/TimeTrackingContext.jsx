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

  // Referencias para timers e idle detector
  const broadcastChannelRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const globalEntryRef = useRef(null);
  const activeNoteEntryRef = useRef(null);

  globalEntryRef.current = globalEntry;
  activeNoteEntryRef.current = activeNoteEntry;

  // ─── 1. Sincronización Inicial y Consulta de Temporizadores ───────────────
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
    };
  }, [fetchActiveTimers]);

  const notifyBroadcast = (type, payload = null) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type, payload });
      } catch (err) {
        console.warn("Error enviando mensaje por BroadcastChannel:", err);
      }
    }
  };

  // ─── 3. Contador Visual de Segundos (Tick local cada 1s) ──────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (globalEntryRef.current) {
        setTodayGlobalSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ─── 4. Heartbeat cada 30 segundos al backend ─────────────────────────────
  useEffect(() => {
    const heartbeatInterval = setInterval(async () => {
      if (!user) return;

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
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [user]);

  // ─── 5. Detección de Inactividad (Idle Detector: 5 minutos / 300s) ─────────
  useEffect(() => {
    if (!user) return;

    const IDLE_LIMIT_MS = 5 * 60 * 1000; // 5 minutos = 300,000 ms

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    // Throttle listener
    let throttleTimeout = null;
    const throttledListener = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          handleUserActivity();
          throttleTimeout = null;
        }, 3000);
      }
    };

    events.forEach((ev) => window.addEventListener(ev, throttledListener, { passive: true }));

    // Verificador periódico de inactividad cada 10 segundos
    const idleCheckInterval = setInterval(async () => {
      const now = Date.now();
      const elapsedSinceActivity = now - lastActivityRef.current;

      const isRunning = !!(globalEntryRef.current || activeNoteEntryRef.current);

      if (isRunning && elapsedSinceActivity >= IDLE_LIMIT_MS) {
        console.warn("[IdleDetector] Inactividad detectada. Pausando contadores con retroactividad...");

        const idleStartTime = new Date(now - IDLE_LIMIT_MS);
        const savedGlobal = globalEntryRef.current;
        const savedNote = activeNoteEntryRef.current;

        // Pausar en backend con fecha en que empezó la inactividad
        if (savedGlobal?._id) {
          await api.post("/time/pause", { entryId: savedGlobal._id, customEndedAt: idleStartTime }).catch(() => {});
        }
        if (savedNote?._id) {
          await api.post("/time/pause", { entryId: savedNote._id, customEndedAt: idleStartTime }).catch(() => {});
        }

        setIdleInfo({
          wasGlobalRunning: !!savedGlobal,
          wasNoteRunning: !!savedNote,
          noteId: savedNote?.noteId?._id || savedNote?.noteId,
          noteTitle: savedNote?.noteId?.title || "Tarea",
        });

        setGlobalEntry(null);
        setActiveNoteEntry(null);
        setIsIdleModalOpen(true);
        notifyBroadcast("REFRESH_TIMERS");
      }
    }, 10000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, throttledListener));
      clearInterval(idleCheckInterval);
    };
  }, [user]);



  // ─── 7. Acciones Expuestas ────────────────────────────────────────────────
  const startGlobalTimer = useCallback(async () => {
    try {
      const res = await api.post("/time/start", { type: "GLOBAL" });
      setGlobalEntry(res.data);
      notifyBroadcast("GLOBAL_STARTED", res.data);
      toast.success("Jornada iniciada");
    } catch {
      toast.error("Error al iniciar contador global");
    }
  }, []);

  const pauseGlobalTimer = useCallback(async () => {
    const idToPause = globalEntryRef.current?._id;
    if (!idToPause) return;
    try {
      await api.post("/time/pause", { entryId: idToPause });
      setGlobalEntry(null);
      notifyBroadcast("GLOBAL_PAUSED");
      toast("Jornada pausada", { icon: "⏸️" });
    } catch {
      toast.error("Error al pausar contador global");
    }
  }, []);

  const startNoteTimer = useCallback(async (noteId, { silent = false } = {}) => {
    if (!noteId) return;
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
  }, []);

  const pauseNoteTimer = useCallback(async (entryId, { silent = false } = {}) => {
    const idToPause = entryId || activeNoteEntryRef.current?._id;
    if (!idToPause) return;

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
    }
  }, []);

  const resumeFromIdle = useCallback(async () => {
    if (!idleInfo) {
      setIsIdleModalOpen(false);
      return;
    }

    try {
      if (idleInfo.wasGlobalRunning) {
        await startGlobalTimer();
      }
      if (idleInfo.wasNoteRunning && idleInfo.noteId) {
        await startNoteTimer(idleInfo.noteId);
      }
    } finally {
      setIsIdleModalOpen(false);
      setIdleInfo(null);
      lastActivityRef.current = Date.now();
    }
  }, [idleInfo, startGlobalTimer, startNoteTimer]);

  const dismissIdleModal = useCallback(() => {
    setIsIdleModalOpen(false);
    setIdleInfo(null);
    lastActivityRef.current = Date.now();
  }, []);

  // Cálculo de duración actual de la nota activa
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
