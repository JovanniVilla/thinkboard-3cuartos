import { useState, useEffect } from "react";
import api from "./axios";

export const useProjectTypes = () => {
  const [projectTypes, setProjectTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectTypes = async () => {
      try {
        const res = await api.get("/project-types");
        setProjectTypes(res.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectTypes();
  }, []);

  return { projectTypes, setProjectTypes, loading, error };
};
