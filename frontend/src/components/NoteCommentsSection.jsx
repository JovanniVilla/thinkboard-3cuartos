import { useState, useMemo } from "react";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { MessageSquareIcon, SendIcon, CheckIcon } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";
import MarkdownRenderer from "./MarkdownRenderer";

const getInitials = (name = "") => {
  if (!name || name === "Sin asignar") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const formatDateActivity = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("es-ES", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const extractMentions = (text) => {
  const matches = [...text.matchAll(/data-id="([^"]+)"/g)];
  return [...new Set(matches.map((m) => m[1]))];
};

const NoteCommentsSection = ({
  noteId,
  activities = [],
  accounts = [],
  currentUser,
  onNoteUpdated,
  onSaveActivities,
}) => {
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);

  // Edit Comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");

  const accountsList = useMemo(() => accounts.map((acc) => acc.name), [accounts]);

  // Comments and activities filtering & sorting
  const { mainComments, replies, sortedMainItems } = useMemo(() => {
    const allComments = activities.filter((act) => act.type === "comment");
    const mains = allComments.filter((act) => !act.parentId);
    const reps = allComments.filter((act) => act.parentId);

    const sortedMains = [...mains].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    const displayedMains = showAllComments
      ? sortedMains
      : sortedMains.length > 3
      ? sortedMains.slice(-3)
      : sortedMains;

    const displayedItems = activities.filter((act) => {
      if (act.type === "action") return true;
      if (act.type === "comment" && !act.parentId) {
        return displayedMains.some((c) => c._id === act._id || c.id === act.id);
      }
      return false;
    });

    const sortedItems = [...displayedItems].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return {
      mainComments: mains,
      replies: reps,
      sortedMainItems: sortedItems,
    };
  }, [activities, showAllComments]);

  // Handler: Add main comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setPostingComment(true);
    try {
      const res = await api.post(`/notes/${noteId}/comments`, {
        text: commentText.trim(),
        user: currentUser?.name || "Usuario",
        mentions: extractMentions(commentText),
      });
      if (onNoteUpdated) {
        onNoteUpdated(res.data);
      }
      window.dispatchEvent(
        new CustomEvent("thinkboard:notes-updated", {
          detail: { action: "update", note: res.data },
        })
      );
      setCommentText("");
      toast.success("Comentario publicado");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Error al publicar el comentario");
    } finally {
      setPostingComment(false);
    }
  };

  // Handler: Add reply to comment
  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setPostingReply(true);
    try {
      const res = await api.post(`/notes/${noteId}/comments`, {
        text: replyText.trim(),
        user: currentUser?.name || "Usuario",
        parentId: parentId,
        mentions: extractMentions(replyText),
      });
      if (onNoteUpdated) {
        onNoteUpdated(res.data);
      }
      window.dispatchEvent(
        new CustomEvent("thinkboard:notes-updated", {
          detail: { action: "update", note: res.data },
        })
      );
      setReplyText("");
      setReplyingToId(null);
      toast.success("Respuesta publicada");
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Error al publicar la respuesta");
    } finally {
      setPostingReply(false);
    }
  };

  // Handler: Resolve mention
  const handleResolveMention = (activityId) => {
    if (!currentUser?.name || !activities) return;
    const nextActivities = activities.map((act) => {
      if (act.id === activityId || act._id === activityId) {
        return {
          ...act,
          resolvedMentions: [...(act.resolvedMentions || []), currentUser.name],
        };
      }
      return act;
    });
    if (onSaveActivities) {
      onSaveActivities(nextActivities);
    }
  };

  // Handler: Save edited comment
  const handleSaveEditedComment = (activityId) => {
    if (!editedCommentText.trim() || !activities) return;
    const nextActivities = activities.map((act) => {
      if (act.id === activityId || act._id === activityId) {
        return {
          ...act,
          text: editedCommentText.trim(),
          mentions: extractMentions(editedCommentText),
          updatedAt: new Date().toISOString(),
        };
      }
      return act;
    });
    if (onSaveActivities) {
      onSaveActivities(nextActivities);
    }
    setEditingCommentId(null);
    setEditedCommentText("");
  };

  return (
    <div className="lg:col-span-4 p-4 sm:p-5 bg-base-200/40 flex flex-col space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="size-5 text-base-content/70" />
          <h3 className="font-bold text-sm sm:text-base text-base-content">
            Comments and activity
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="btn btn-xs bg-base-100 hover:bg-base-200 border border-base-content/15 text-base-content/80 font-medium rounded-lg px-2.5 shadow-2xs"
        >
          {showDetails ? "Hide details" : "Show details"}
        </button>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleAddComment} className="space-y-2">
        <div className="w-full">
          <MarkdownEditor
            value={commentText}
            onChange={setCommentText}
            placeholder="Escribe un comentario..."
            minHeight="min-h-[85px]"
            hideFooter
            compactToolbar
            users={accountsList}
            className="rounded-2xl border-base-content/20"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={postingComment || !commentText.trim()}
            className={`btn btn-sm rounded-xl gap-2 font-medium px-4 transition-all ${
              commentText.trim()
                ? "btn-primary shadow-xs"
                : "bg-base-200/80 text-base-content/40 hover:bg-base-200/80 border-0 cursor-not-allowed"
            }`}
          >
            <SendIcon className="size-3.5" />
            <span>{postingComment ? "Enviando..." : "Comentar"}</span>
          </button>
        </div>
      </form>

      {/* Activity Feed */}
      {showDetails && (
        <div className="space-y-3 pt-1 overflow-y-auto max-h-[550px] pr-0.5">
          {mainComments.length > 3 && (
            <div className="flex justify-center pb-2 border-b border-base-content/5">
              <button
                type="button"
                onClick={() => setShowAllComments(!showAllComments)}
                className="btn btn-xs btn-outline btn-secondary rounded-lg px-3 gap-1"
              >
                {showAllComments
                  ? "Mostrar solo últimos 3 comentarios"
                  : `Ver todos los comentarios (${mainComments.length})`}
              </button>
            </div>
          )}

          {sortedMainItems.length === 0 ? (
            <p className="text-xs text-base-content/40 italic text-center py-6">
              No hay actividad registrada aún
            </p>
          ) : (
            sortedMainItems.map((act, idx) => {
              // Action items
              if (act.type === "action") {
                return (
                  <div
                    key={act.id || act._id || idx}
                    className="bg-base-100 rounded-2xl border border-base-content/15 p-3.5 space-y-2 shadow-2xs transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white flex-shrink-0 shadow-2xs"
                          style={{
                            backgroundColor:
                              accounts.find((a) => a.name === act.user)?.color ||
                              "#0284c7",
                          }}
                        >
                          {getInitials(act.user)}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-base-content truncate">
                          {act.user || "Usuario"}
                        </span>
                      </div>
                      <span className="text-[11px] sm:text-xs text-base-content/50 flex-shrink-0 font-normal">
                        {formatDateActivity(act.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-base-content/80 leading-snug">
                      {act.text}
                    </p>
                  </div>
                );
              }

              // Comments items
              const commentReplies = replies
                .filter((r) => r.parentId === act.id || r.parentId === act._id)
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

              return (
                <div
                  key={act.id || act._id || idx}
                  className="bg-base-100 rounded-2xl border border-base-content/15 p-3.5 space-y-2.5 shadow-2xs transition-all"
                >
                  {/* Main Comment Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white flex-shrink-0 shadow-2xs"
                        style={{
                          backgroundColor:
                            accounts.find((a) => a.name === act.user)?.color ||
                            "#0284c7",
                        }}
                      >
                        {getInitials(act.user)}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-base-content truncate">
                        {act.user || "Usuario"}
                      </span>
                    </div>
                    <span className="text-[11px] sm:text-xs text-base-content/50 flex-shrink-0 font-normal">
                      {formatDateActivity(act.createdAt)}
                      {act.createdAt !== act.updatedAt && act.updatedAt && " (editado)"}
                    </span>
                  </div>

                  {/* Comment Body */}
                  {editingCommentId === (act.id || act._id) ? (
                    <div className="space-y-2 pt-1">
                      <MarkdownEditor
                        value={editedCommentText}
                        onChange={setEditedCommentText}
                        placeholder="Edita tu comentario..."
                        minHeight="min-h-[60px]"
                        hideFooter
                        compactToolbar
                        users={accountsList}
                        className="rounded-xl border-base-content/20"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditedCommentText("");
                          }}
                          className="btn btn-ghost btn-xs rounded text-[10px] h-6 min-h-0"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditedComment(act.id || act._id)}
                          disabled={!editedCommentText.trim()}
                          className="btn btn-primary btn-xs rounded text-[10px] h-6 min-h-0 px-2.5"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-base break-words max-w-none text-xs sm:text-sm text-base-content/90 prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                      <MarkdownRenderer content={act.text} />
                    </div>
                  )}

                  {/* Comment Footer Actions */}
                  <div className="flex justify-end gap-3 pt-1 border-t border-base-content/5 items-center">
                    {act.mentions?.includes(currentUser?.name) &&
                      !act.resolvedMentions?.includes(currentUser?.name) && (
                        <button
                          type="button"
                          onClick={() => handleResolveMention(act.id || act._id)}
                          className="text-[10px] flex items-center gap-1 text-primary hover:text-primary-focus font-semibold bg-primary/10 px-2 py-0.5 rounded-md transition-colors"
                          title="Marcar mención como atendida"
                        >
                          <CheckIcon className="size-3" />
                          Atendido
                        </button>
                      )}
                    {act.user === currentUser?.name && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(act.id || act._id);
                          setEditedCommentText(act.text);
                        }}
                        className="text-[11px] text-base-content/50 hover:text-primary hover:underline font-medium transition-colors"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (replyingToId === act.id) {
                          setReplyingToId(null);
                          setReplyText("");
                        } else {
                          setReplyingToId(act.id);
                          setReplyText("");
                        }
                      }}
                      className="text-[11px] text-primary hover:underline font-medium transition-colors"
                    >
                      Responder
                    </button>
                  </div>

                  {/* Reply Form */}
                  {replyingToId === act.id && (
                    <form
                      onSubmit={(e) => handleAddReply(e, act.id)}
                      className="pl-3 sm:pl-4 space-y-1.5 pt-2 border-l-2 border-primary/30"
                    >
                      <MarkdownEditor
                        value={replyText}
                        onChange={setReplyText}
                        placeholder="Escribe una respuesta..."
                        minHeight="min-h-[60px]"
                        hideFooter
                        compactToolbar
                        users={accountsList}
                        className="rounded-xl border-base-content/20"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyText("");
                          }}
                          className="btn btn-ghost btn-xs rounded text-[10px] h-6 min-h-0"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={postingReply || !replyText.trim()}
                          className="btn btn-primary btn-xs rounded text-[10px] h-6 min-h-0 px-2.5"
                        >
                          {postingReply ? "Enviando..." : "Responder"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Replies List */}
                  {commentReplies.length > 0 && (
                    <div className="pl-3 sm:pl-4 space-y-2 border-l-2 border-base-content/10 pt-1">
                      {commentReplies.map((rep, rIdx) => (
                        <div
                          key={rep.id || rep._id || rIdx}
                          className="bg-base-200/40 rounded-xl border border-base-content/10 p-2.5 sm:p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 shadow-2xs"
                                style={{
                                  backgroundColor:
                                    accounts.find((a) => a.name === rep.user)?.color ||
                                    "#10B981",
                                }}
                              >
                                {getInitials(rep.user)}
                              </span>
                              <span className="font-semibold text-xs text-base-content truncate">
                                {rep.user || "Usuario"}
                              </span>
                            </div>
                            <span className="text-[10px] text-base-content/45 flex-shrink-0">
                              {formatDateActivity(rep.createdAt)}
                              {rep.createdAt !== rep.updatedAt &&
                                rep.updatedAt &&
                                " (editado)"}
                            </span>
                          </div>
                          {editingCommentId === (rep.id || rep._id) ? (
                            <div className="mt-1 space-y-1.5">
                              <MarkdownEditor
                                value={editedCommentText}
                                onChange={setEditedCommentText}
                                placeholder="Edita tu respuesta..."
                                minHeight="min-h-[50px]"
                                hideFooter
                                compactToolbar
                                users={accountsList}
                                className="rounded-lg border-base-content/20"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditedCommentText("");
                                  }}
                                  className="btn btn-ghost btn-xs rounded text-[9px] h-5 min-h-0 px-1.5"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSaveEditedComment(rep.id || rep._id)
                                  }
                                  disabled={!editedCommentText.trim()}
                                  className="btn btn-primary btn-xs rounded text-[9px] h-5 min-h-0 px-2"
                                >
                                  Guardar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="prose prose-sm prose-base break-words max-w-none text-xs text-base-content/85 prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5">
                              <MarkdownRenderer content={rep.text} />
                            </div>
                          )}
                          <div className="flex justify-end gap-2.5 items-center pt-0.5 border-t border-base-content/5">
                            {rep.mentions?.includes(currentUser?.name) &&
                              !rep.resolvedMentions?.includes(currentUser?.name) && (
                                <button
                                  type="button"
                                  onClick={() => handleResolveMention(rep.id || rep._id)}
                                  className="text-[9px] flex items-center gap-1 text-primary hover:text-primary-focus font-semibold bg-primary/10 px-1.5 py-0.5 rounded"
                                  title="Marcar mención como atendida"
                                >
                                  <CheckIcon className="size-3" />
                                  Atendido
                                </button>
                              )}
                            {rep.user === currentUser?.name && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(rep.id || rep._id);
                                  setEditedCommentText(rep.text);
                                }}
                                className="text-[10px] text-base-content/50 hover:text-primary hover:underline font-medium"
                              >
                                Editar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default NoteCommentsSection;
