export const DEFAULT_COLUMNS = [
  "id",
  "title",
  "checklist",
  "labels",
  "project",
  "size",
  "status",
  "priority",
  "dates",
  "user",
  "createdAt",
  "actions",
];

export const COLUMNS_CONFIG = {
  id: {
    id: "id",
    label: "ID",
    sortKey: "keyId",
    defaultWidth: 95,
    minWidth: 70,
    responsiveClass: "",
    align: "left",
    description: "Identificador único de la tarea o proyecto",
  },
  title: {
    id: "title",
    label: "Nombre",
    sortKey: "title",
    defaultWidth: 280,
    minWidth: 160,
    responsiveClass: "",
    align: "left",
    description: "Título principal y enlaces de la tarea",
  },
  checklist: {
    id: "checklist",
    label: "Checklist",
    sortKey: null,
    defaultWidth: 105,
    minWidth: 75,
    responsiveClass: "hidden md:table-cell",
    align: "left",
    description: "Progreso de subtareas completadas",
  },
  labels: {
    id: "labels",
    label: "Etiquetas",
    sortKey: null,
    defaultWidth: 150,
    minWidth: 90,
    responsiveClass: "hidden lg:table-cell",
    align: "left",
    description: "Etiquetas de categorización",
  },
  project: {
    id: "project",
    label: "Proyecto",
    sortKey: "project",
    defaultWidth: 140,
    minWidth: 95,
    responsiveClass: "hidden sm:table-cell",
    align: "left",
    description: "Proyecto vinculado",
  },
  size: {
    id: "size",
    label: "Talla",
    sortKey: "size",
    defaultWidth: 105,
    minWidth: 75,
    responsiveClass: "",
    align: "left",
    description: "Estimación de horas o esfuerzo",
  },
  status: {
    id: "status",
    label: "Estado",
    sortKey: "status",
    defaultWidth: 120,
    minWidth: 85,
    responsiveClass: "",
    align: "left",
    description: "Estado del flujo de trabajo",
  },
  priority: {
    id: "priority",
    label: "Prioridad",
    sortKey: "priority",
    defaultWidth: 115,
    minWidth: 80,
    responsiveClass: "",
    align: "left",
    description: "Nivel de urgencia",
  },
  dates: {
    id: "dates",
    label: "Fechas",
    sortKey: null,
    defaultWidth: 110,
    minWidth: 75,
    responsiveClass: "hidden md:table-cell",
    align: "left",
    description: "Fecha de inicio o vencimiento",
  },
  user: {
    id: "user",
    label: "Usuario",
    sortKey: "user",
    defaultWidth: 140,
    minWidth: 90,
    responsiveClass: "",
    align: "left",
    description: "Responsable asignado",
  },
  createdAt: {
    id: "createdAt",
    label: "Creación",
    sortKey: "createdAt",
    defaultWidth: 110,
    minWidth: 80,
    responsiveClass: "hidden sm:table-cell",
    align: "left",
    description: "Fecha en la que fue creada",
  },
  actions: {
    id: "actions",
    label: "Acciones",
    sortKey: null,
    defaultWidth: 100,
    minWidth: 85,
    responsiveClass: "",
    align: "right",
    description: "Editar o archivar tarea",
  },
};

export const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(
  Object.entries(COLUMNS_CONFIG).map(([k, v]) => [k, v.defaultWidth])
);

export const getSavedColumnOrder = (userId, userPrefs) => {
  try {
    if (userPrefs?.taskListView?.columnOrder && Array.isArray(userPrefs.taskListView.columnOrder)) {
      const saved = userPrefs.taskListView.columnOrder.filter((id) => COLUMNS_CONFIG[id]);
      const missing = DEFAULT_COLUMNS.filter((id) => !saved.includes(id));
      return [...saved, ...missing];
    }
    const local = localStorage.getItem(`tb_task_list_columns_${userId || "guest"}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed?.order)) {
        const saved = parsed.order.filter((id) => COLUMNS_CONFIG[id]);
        const missing = DEFAULT_COLUMNS.filter((id) => !saved.includes(id));
        return [...saved, ...missing];
      }
    }
  } catch (e) {
    console.error("Error reading saved column order", e);
  }
  return [...DEFAULT_COLUMNS];
};

export const getSavedColumnWidths = (userId, userPrefs) => {
  try {
    if (userPrefs?.taskListView?.columnWidths && typeof userPrefs.taskListView.columnWidths === "object") {
      return { ...DEFAULT_COLUMN_WIDTHS, ...userPrefs.taskListView.columnWidths };
    }
    const local = localStorage.getItem(`tb_task_list_columns_${userId || "guest"}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed?.widths && typeof parsed.widths === "object") {
        return { ...DEFAULT_COLUMN_WIDTHS, ...parsed.widths };
      }
    }
  } catch (e) {
    console.error("Error reading saved column widths", e);
  }
  return { ...DEFAULT_COLUMN_WIDTHS };
};

export const persistColumnPreferences = (userId, newOrder, newWidths, updatePreferences) => {
  try {
    localStorage.setItem(
      `tb_task_list_columns_${userId || "guest"}`,
      JSON.stringify({ order: newOrder, widths: newWidths })
    );
  } catch (e) {
    console.error("Error saving column preferences to localStorage", e);
  }

  if (userId && updatePreferences) {
    updatePreferences({
      taskListView: {
        columnOrder: newOrder,
        columnWidths: newWidths,
      },
    }).catch((e) => console.error("Error saving preferences to server", e));
  }
};

