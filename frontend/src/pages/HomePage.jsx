import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import RateLimitedUI from "../components/RateLimitedUI";
import api from "../lib/axios";
import toast from "react-hot-toast";
import NotesNotFound from "../components/NotesNotFound";
import { useStatuses } from "../lib/useStatuses";
import { usePriorities } from "../lib/usePriorities";
import { useAccounts } from "../lib/useAccounts";
import { useProjects } from "../lib/useProjects";
import NoteListView from "../components/NoteListView";
import NoteKanbanView from "../components/NoteKanbanView";
import NoteFilters from "../components/NoteFilters";
import { useTaskSizes } from "../lib/useTaskSizes";
import { useValues } from "../lib/useValues";
import { ListIcon, Columns3Icon } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

const HomePage = () => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightedNoteId, setHighlightedNoteId] = useState(null);

  const { statuses } = useStatuses();
  const { priorities } = usePriorities();
  const { accounts } = useAccounts();
  const { projects } = useProjects();
  const { taskSizes } = useTaskSizes();
  const { values } = useValues();
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  const navigate = useNavigate();

  // View Mode: "list" | "board"
  const [viewMode, setViewMode] = useState(() => {
    try {
      return sessionStorage.getItem("tb_view_mode") || "list";
    } catch {
      return "list";
    }
  });

  // Filtering and Sorting state
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return sessionStorage.getItem("tb_filter_search") || "";
    } catch {
      return "";
    }
  });
  const [selectedStatus, setSelectedStatus] = useState(() => {
    try {
      return sessionStorage.getItem("tb_filter_status") || "";
    } catch {
      return "";
    }
  });
  const [selectedPriority, setSelectedPriority] = useState(() => {
    try {
      return sessionStorage.getItem("tb_filter_priority") || "";
    } catch {
      return "";
    }
  });
  const [selectedValue, setSelectedValue] = useState(() => {
    try {
      return sessionStorage.getItem("tb_filter_value") || "";
    } catch {
      return "";
    }
  });
  const [selectedUser, setSelectedUser] = useState(() => {
    try {
      return sessionStorage.getItem("tb_filter_user") || "";
    } catch {
      return "";
    }
  });
  const [selectedProject, setSelectedProject] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const fromUrl = searchParams.get("projectId");
    if (fromUrl) return fromUrl;
    try {
      return sessionStorage.getItem("tb_filter_project") || "";
    } catch {
      return "";
    }
  });
  const [showCompleted, setShowCompleted] = useState(() => {
    try {
      return sessionStorage.getItem("tb_filter_showCompleted") === "true";
    } catch {
      return false;
    }
  });
  const [showMyTasks, setShowMyTasks] = useState(() => {
    try {
      const stored = sessionStorage.getItem("tb_filter_showMyTasks");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });
  const [sortBy, setSortBy] = useState(() => {
    try {
      return sessionStorage.getItem("tb_sort_by") || "createdAt";
    } catch {
      return "createdAt";
    }
  });
  const [sortOrder, setSortOrder] = useState(() => {
    try {
      return sessionStorage.getItem("tb_sort_order") || "desc";
    } catch {
      return "desc";
    }
  });

  // Persist filters across modal navigation and page reloads
  useEffect(() => {
    try {
      sessionStorage.setItem("tb_filter_project", selectedProject || "");
      sessionStorage.setItem("tb_filter_status", selectedStatus || "");
      sessionStorage.setItem("tb_filter_priority", selectedPriority || "");
      sessionStorage.setItem("tb_filter_value", selectedValue || "");
      sessionStorage.setItem("tb_filter_user", selectedUser || "");
      sessionStorage.setItem("tb_filter_showCompleted", String(showCompleted));
      sessionStorage.setItem("tb_filter_showMyTasks", String(showMyTasks));
      sessionStorage.setItem("tb_filter_search", searchQuery || "");
      sessionStorage.setItem("tb_view_mode", viewMode);
      sessionStorage.setItem("tb_sort_by", sortBy);
      sessionStorage.setItem("tb_sort_order", sortOrder);
    } catch (e) {
      console.error("Failed to save filters to sessionStorage", e);
    }
  }, [
    selectedProject,
    selectedStatus,
    selectedPriority,
    selectedValue,
    selectedUser,
    showCompleted,
    showMyTasks,
    searchQuery,
    viewMode,
    sortBy,
    sortOrder,
  ]);

  // Sync project filter from URL search params if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const projectId = searchParams.get("projectId");
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [location.search]);

  const handleSetSelectedProject = useCallback(
    (newProjectId) => {
      setSelectedProject(newProjectId);
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.has("projectId")) {
        searchParams.delete("projectId");
        const newSearch = searchParams.toString();
        navigate(newSearch ? `${location.pathname}?${newSearch}` : location.pathname, { replace: true });
      }
    },
    [location.pathname, location.search, navigate]
  );

  const fetchNotes = useCallback(async () => {
    try {
      const res = await api.get("/notes");
      setNotes(res.data);
      setIsRateLimited(false);
    } catch (error) {
      console.error("Error fetching notes:", error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
      } else {
        toast.error("Error al cargar las tareas");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedStatus("");
    setSelectedPriority("");
    setSelectedValue("");
    setSelectedUser("");
    handleSetSelectedProject("");
    setShowCompleted(false);
    setShowMyTasks(true);
  }, [handleSetSelectedProject]);

  const handleNoteCreated = useCallback((newNote) => {
    if (!newNote) return;

    // Reset filters that would hide the new note so the user sees it immediately
    setSearchQuery("");
    if (selectedStatus && selectedStatus !== newNote.status) {
      setSelectedStatus("");
    }
    if (selectedPriority && selectedPriority !== newNote.priority) {
      setSelectedPriority("");
    }
    if (selectedValue && selectedValue !== newNote.value) {
      setSelectedValue("");
    }
    if (selectedUser && selectedUser !== newNote.user) {
      setSelectedUser("");
    }
    if (selectedProject && selectedProject !== newNote.project) {
      setSelectedProject("");
    }
    if (
      showMyTasks &&
      currentUser?.name &&
      (newNote.user || "").trim().toLowerCase() !== currentUser.name.trim().toLowerCase()
    ) {
      setShowMyTasks(false);
    }
    if (newNote.status?.toLowerCase() === "completado") {
      setShowCompleted(true);
    }

    // Optimistically add the new note at the beginning of the list
    setNotes((prevNotes) => {
      const exists = prevNotes.some((n) => n._id === newNote._id);
      if (exists) {
        return prevNotes.map((n) => (n._id === newNote._id ? newNote : n));
      }
      return [newNote, ...prevNotes];
    });

    // Visually highlight the newly created task so it stands out
    setHighlightedNoteId(newNote._id);
    setTimeout(() => {
      setHighlightedNoteId(null);
    }, 4000);

    // Fetch full dataset from backend in background to ensure all relations are synced
    fetchNotes();
  }, [selectedStatus, selectedPriority, selectedValue, selectedUser, selectedProject, showMyTasks, currentUser?.name, fetchNotes]);

  const handleNoteUpdated = useCallback((updatedNote) => {
    if (!updatedNote) return;
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n._id === updatedNote._id ? { ...n, ...updatedNote } : n))
    );
  }, []);

  const handleNoteDeleted = useCallback((deletedNoteId) => {
    if (!deletedNoteId) return;
    setNotes((prevNotes) => prevNotes.filter((n) => n._id !== deletedNoteId));
  }, []);

  // When returning from child modal routes (/create or /note/:id) back to "/", automatically refetch
  useEffect(() => {
    if (
      location.pathname === "/" &&
      (prevPathRef.current?.startsWith("/create") || prevPathRef.current?.startsWith("/note/"))
    ) {
      fetchNotes();
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, fetchNotes]);

  // Global event listener for note updates across the application
  useEffect(() => {
    const handleNotesEvent = (e) => {
      const { action, note, id } = e.detail || {};
      if (action === "create" && note) {
        handleNoteCreated(note);
      } else if (action === "update" && note) {
        handleNoteUpdated(note);
      } else if (action === "delete" && id) {
        handleNoteDeleted(id);
      } else {
        fetchNotes();
      }
    };

    window.addEventListener("thinkboard:notes-updated", handleNotesEvent);
    return () => {
      window.removeEventListener("thinkboard:notes-updated", handleNotesEvent);
    };
  }, [fetchNotes, handleNoteCreated, handleNoteUpdated, handleNoteDeleted]);

  // Filter and sort notes
  const filteredNotes = notes
    .filter((note) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (note.title || "").toLowerCase().includes(query);
        const matchesContent = (note.content || "").toLowerCase().includes(query);
        const matchesKeyId = (note.keyId || "").toLowerCase().includes(query);
        const matchesProjectKeyId = (note.projectKeyId || "").toLowerCase().includes(query);
        const matchesGlobalKeyId = (note.globalKeyId || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent && !matchesKeyId && !matchesProjectKeyId && !matchesGlobalKeyId) {
          return false;
        }
      }
      if (selectedStatus && note.status !== selectedStatus) {
        return false;
      }
      if (selectedPriority && note.priority !== selectedPriority) {
        return false;
      }
      if (selectedValue && (note.value || "Medio") !== selectedValue) {
        return false;
      }
      if (selectedUser && note.user !== selectedUser) {
        return false;
      }
      if (!showCompleted && selectedStatus !== "Completado" && note.status?.toLowerCase() === "completado") {
        return false;
      }
      if (showMyTasks && currentUser?.name) {
        const currentName = currentUser.name.trim().toLowerCase();
        const isAssigned = (note.user || "").trim().toLowerCase() === currentName;
        const isMentioned = (note.activities || []).some(
          (act) => (act.mentions || []).some((m) => (m || "").trim().toLowerCase() === currentName)
        );
        const hasCommented = (note.activities || []).some(
          (act) => act.type === "comment" && (act.user || "").trim().toLowerCase() === currentName
        );
        if (!isAssigned && !isMentioned && !hasCommented) {
          return false;
        }
      }
      if (selectedProject) {
        if (selectedProject === "Sin asignar" && note.project) return false;
        if (selectedProject !== "Sin asignar" && note.project !== selectedProject) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "keyId") {
        const idA = a.projectKeyId || a.keyId || a.globalKeyId || "";
        const idB = b.projectKeyId || b.keyId || b.globalKeyId || "";
        comparison = idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
      } else if (sortBy === "title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "content") {
        comparison = (a.content || "").localeCompare(b.content || "");
      } else if (sortBy === "status") {
        const orderA = statuses.find((s) => s.name === a.status)?.order ?? 999;
        const orderB = statuses.find((s) => s.name === b.status)?.order ?? 999;
        if (orderA !== orderB) {
          comparison = orderA - orderB;
        } else {
          comparison = (a.status || "").localeCompare(b.status || "");
        }
      } else if (sortBy === "priority") {
        const orderA = priorities.find((p) => p.name === a.priority)?.order ?? 999;
        const orderB = priorities.find((p) => p.name === b.priority)?.order ?? 999;
        if (orderA !== orderB) {
          comparison = orderA - orderB;
        } else {
          comparison = (a.priority || "").localeCompare(b.priority || "");
        }
      } else if (sortBy === "value") {
        const orderA = values.find((v) => v.name === (a.value || "Medio"))?.order ?? 999;
        const orderB = values.find((v) => v.name === (b.value || "Medio"))?.order ?? 999;
        if (orderA !== orderB) {
          comparison = orderA - orderB;
        } else {
          comparison = (a.value || "Medio").localeCompare(b.value || "Medio");
        }
      } else if (sortBy === "user") {
        comparison = (a.user || "").localeCompare(b.user || "");
      } else if (sortBy === "project") {
        const projA = a.project ? (projects.find((p) => p._id === a.project)?.name || "") : "";
        const projB = b.project ? (projects.find((p) => p._id === b.project)?.name || "") : "";
        comparison = projA.localeCompare(projB);
      } else if (sortBy === "size") {
        const sizeAId = typeof a.size === "object" ? a.size?._id : a.size;
        const sizeBId = typeof b.size === "object" ? b.size?._id : b.size;
        const sizeAVal = taskSizes.find((s) => s._id === sizeAId)?.value ?? 0;
        const sizeBVal = taskSizes.find((s) => s._id === sizeBId)?.value ?? 0;
        comparison = sizeAVal - sizeBVal;
      } else if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="h-screen flex flex-col overflow-hidden pb-4">
      <Navbar />

      {isRateLimited && <RateLimitedUI />}

      <div className="flex-1 flex flex-col min-h-0 w-full px-2 sm:px-4 mt-2">
        {loading && <div className="text-center text-primary py-10">Cargando tareas...</div>}

        {notes.length === 0 && !isRateLimited && !loading && <NotesNotFound />}

        {notes.length > 0 && !isRateLimited && !loading && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* View Switcher Bar */}
            {/* Filters panel */}
            <NoteFilters
              viewMode={viewMode}
              setViewMode={setViewMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              selectedPriority={selectedPriority}
              setSelectedPriority={setSelectedPriority}
              selectedValue={selectedValue}
              setSelectedValue={setSelectedValue}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              selectedProject={selectedProject}
              setSelectedProject={handleSetSelectedProject}
              showCompleted={showCompleted}
              setShowCompleted={setShowCompleted}
              showMyTasks={showMyTasks}
              setShowMyTasks={setShowMyTasks}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              statuses={statuses}
              priorities={priorities}
              values={values}
              users={accounts}
              projects={projects}
              totalNotes={notes.length}
              filteredCount={filteredNotes.length}
            />

            {/* Render selected view */}
            <div className="flex-1 min-h-0 mt-2">
              {viewMode === "list" && (
                <NoteListView
                  notes={filteredNotes}
                  setNotes={setNotes}
                  statuses={statuses}
                  priorities={priorities}
                  values={values}
                  users={accounts}
                  projects={projects}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  highlightedNoteId={highlightedNoteId}
                />
              )}

              {viewMode === "board" && (
                <NoteKanbanView
                  notes={filteredNotes}
                  setNotes={setNotes}
                  statuses={statuses}
                  priorities={priorities}
                  values={values}
                  users={accounts}
                  highlightedNoteId={highlightedNoteId}
                />
              )}
            </div>
          </div>
        )}
      </div>
      <Outlet
        context={{
          fetchNotes,
          onNoteCreated: handleNoteCreated,
          onNoteUpdated: handleNoteUpdated,
          onNoteDeleted: handleNoteDeleted,
          resetFilters,
          highlightedNoteId,
        }}
      />
    </div>
  );
};

export default HomePage;
