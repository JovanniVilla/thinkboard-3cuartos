import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import Navbar from "../components/Navbar";
import RateLimitedUI from "../components/RateLimitedUI";
import api from "../lib/axios";
import toast from "react-hot-toast";
import NotesNotFound from "../components/NotesNotFound";
import { useStatuses } from "../lib/useStatuses";
import { usePriorities } from "../lib/usePriorities";
import { useAccounts } from "../lib/useAccounts";
import NoteListView from "../components/NoteListView";
import NoteKanbanView from "../components/NoteKanbanView";
import NoteFilters from "../components/NoteFilters";
import { ListIcon, Columns3Icon } from "lucide-react";

const HomePage = () => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { statuses } = useStatuses();
  const { priorities } = usePriorities();
  const { accounts } = useAccounts();

  // View Mode: "list" | "board"
  const [viewMode, setViewMode] = useState("list");

  // Filtering and Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
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
          toast.error("Error al cargar las tareas");
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
      if (selectedPriority && note.priority !== selectedPriority) {
        return false;
      }
      if (selectedUser && note.user !== selectedUser) {
        return false;
      }
      if (!showCompleted && selectedStatus !== "Completado" && note.status?.toLowerCase() === "completado") {
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
      } else if (sortBy === "priority") {
        const orderA = priorities.find((p) => p.name === a.priority)?.order ?? 999;
        const orderB = priorities.find((p) => p.name === b.priority)?.order ?? 999;
        if (orderA !== orderB) {
          comparison = orderA - orderB;
        } else {
          comparison = (a.priority || "").localeCompare(b.priority || "");
        }
      } else if (sortBy === "user") {
        comparison = (a.user || "").localeCompare(b.user || "");
      } else if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="min-h-screen pb-12">
      <Navbar />

      {isRateLimited && <RateLimitedUI />}

      <div className="w-full px-2 sm:px-4 mt-2">
        {loading && <div className="text-center text-primary py-10">Cargando tareas...</div>}

        {notes.length === 0 && !isRateLimited && !loading && <NotesNotFound />}

        {notes.length > 0 && !isRateLimited && !loading && (
          <div>
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
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              showCompleted={showCompleted}
              setShowCompleted={setShowCompleted}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              statuses={statuses}
              priorities={priorities}
              users={accounts}
              totalNotes={notes.length}
              filteredCount={filteredNotes.length}
            />

            {/* Render selected view */}
            {viewMode === "list" && (
              <NoteListView
                notes={filteredNotes}
                setNotes={setNotes}
                statuses={statuses}
                priorities={priorities}
                users={accounts}
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
                priorities={priorities}
                users={accounts}
              />
            )}
          </div>
        )}
      </div>
      <Outlet />
    </div>
  );
};

export default HomePage;
