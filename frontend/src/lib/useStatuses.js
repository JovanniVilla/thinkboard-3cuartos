import { useState, useEffect } from "react";
import api from "../lib/axios";

export function useStatuses() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await api.get("/status");
        setStatuses(res.data);
      } catch (error) {
        console.error("Error fetching statuses", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  return { statuses, setStatuses, loading };
}
