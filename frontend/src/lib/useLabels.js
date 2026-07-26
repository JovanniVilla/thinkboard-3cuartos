import { useState, useEffect } from "react";
import api from "./axios";

export const useLabels = () => {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const res = await api.get("/labels");
        setLabels(res.data);
      } catch (err) {
        console.error("Error fetching labels:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, []);

  return { labels, setLabels, loading, error };
};
