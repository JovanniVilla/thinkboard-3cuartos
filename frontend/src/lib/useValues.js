import { useState, useEffect, useCallback } from "react";
import api from "./axios";

export function useValues() {
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchValues = useCallback(async () => {
    try {
      const res = await api.get("/values");
      setValues(res.data);
    } catch (error) {
      console.error("Error fetching values", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  return { values, setValues, loading, refetch: fetchValues };
}

