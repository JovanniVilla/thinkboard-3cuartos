import { useState, useEffect } from "react";
import api from "./axios";

export const useTaskSizes = () => {
  const [taskSizes, setTaskSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTaskSizes();
  }, []);

  const fetchTaskSizes = async () => {
    try {
      const res = await api.get("/task-sizes");
      setTaskSizes(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching task sizes:", err);
      setError("Error al obtener los tamaños de tarea");
    } finally {
      setLoading(false);
    }
  };

  return { taskSizes, setTaskSizes, loading, error, refetch: fetchTaskSizes };
};
