import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import RateLimitedUI from "../components/RateLimitedUI";
import api from "../lib/axios";
import toast from "react-hot-toast";
import NoteCard from "../components/NoteCard";
import NotesNotFound from "../components/NotesNotFound";
import { useStatuses } from "../lib/useStatuses";
import NoteListView from "../components/NoteListView";
import NoteKanbanView from "../components/NoteKanbanView";
import NoteFilters from "../components/NoteFilters";
import { LayoutGridIcon, ListIcon, Columns3Icon } from "lucide-react";

const HomePage = () => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { statuses } = useStatuses();

  // View Mode: "grid" | "list" | "board"
  const [viewMode, setViewMode] = useState("grid");

  // Filtering and Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get("/notes");
        setNotes(res.data);
        setIsRateLimited(false);
      } catch (error) {
        console.error("Error fetching notes:", error);
        if (error.response?.status === 429) {
          setIsRateLimited(true);
        } else {
          toast.error("Failed to load notes");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Filter and sort notes
  const filteredNotes = notes
    .filter((note) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) return false;
      }
      if (selectedStatus && note.status !== selectedStatus) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "title") {
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
      } else if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="min-h-screen pb-12">
      <Navbar />

      {isRateLimited && <RateLimitedUI />}

      <div className="max-w-7xl mx-auto p-4 mt-6">
        {loading && <div className="text-center text-primary py-10">Cargando tareas...</div>}

        {notes.length === 0 && !isRateLimited && !loading && <NotesNotFound />}

        {notes.length > 0 && !isRateLimited && !loading && (
          <div>
            {/* View Switcher Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-base-100 p-3 rounded-xl border border-base-content/10 shadow-sm">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-base-content px-2">Mis Tareas</h2>
                <span className="badge badge-primary badge-sm font-semibold">
                  {notes.length} total
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-base-200/80 p-1 rounded-lg border border-base-content/10 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`btn btn-sm gap-1.5 transition-all ${
                    viewMode === "grid"
                      ? "btn-primary shadow-sm"
                      : "btn-ghost text-base-content/70 hover:text-base-content"
                  }`}
                  title="Vista en Cuadrícula"
                >
                  <LayoutGridIcon className="size-4" />
                  <span className="hidden md:inline">Cuadrícula</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`btn btn-sm gap-1.5 transition-all ${
                    viewMode === "list"
                      ? "btn-primary shadow-sm"
                      : "btn-ghost text-base-content/70 hover:text-base-content"
                  }`}
                  title="Vista en Lista con Filtros y Ordenamiento"
                >
                  <ListIcon className="size-4" />
                  <span className="hidden md:inline">Lista</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("board")}
                  className={`btn btn-sm gap-1.5 transition-all ${
                    viewMode === "board"
                      ? "btn-primary shadow-sm"
                      : "btn-ghost text-base-content/70 hover:text-base-content"
                  }`}
                  title="Vista en Tablero Kanban por Estado"
                >
                  <Columns3Icon className="size-4" />
                  <span className="hidden md:inline">Tablero</span>
                </button>
              </div>
            </div>

            {/* Filters panel (Active across views, especially highlighted in list and grid) */}
            <NoteFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              statuses={statuses}
              totalNotes={notes.length}
              filteredCount={filteredNotes.length}
            />

            {/* Render selected view */}
            {viewMode === "grid" && (
              filteredNotes.length === 0 ? (
                <div className="bg-base-100 rounded-xl p-12 text-center border border-base-content/10">
                  <p className="text-base-content/60">No se encontraron tareas que coincidan con los filtros seleccionados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      setNotes={setNotes}
                      statuses={statuses}
                    />
                  ))}
                </div>
              )
            )}

            {viewMode === "list" && (
              <NoteListView
                notes={filteredNotes}
                setNotes={setNotes}
                statuses={statuses}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
              />
            )}

            {viewMode === "board" && (
              <NoteKanbanView
                notes={filteredNotes}
                setNotes={setNotes}
                statuses={statuses}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
