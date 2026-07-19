import { useState, useEffect } from "react";
import api from "../lib/axios";

export function usePriorities() {
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        const res = await api.get("/priorities");
        setPriorities(res.data);
      } catch (error) {
        console.error("Error fetching priorities", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriorities();
  }, []);

  return { priorities, setPriorities, loading };
}
