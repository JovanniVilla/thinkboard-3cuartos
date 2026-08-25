import { useState, useEffect } from "react";
import api from "./axios";

export const useProjectStatuses = () => {
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectStatuses = async () => {
      try {
        const res = await api.get("/project-statuses");
        setProjectStatuses(res.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectStatuses();
  }, []);

  return { projectStatuses, setProjectStatuses, loading, error };
};
