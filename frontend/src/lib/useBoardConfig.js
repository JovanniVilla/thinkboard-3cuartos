import { useState, useEffect } from "react";
import api from "./axios";

export function useBoardConfig() {
  const [boardConfig, setBoardConfig] = useState({ projectKey: "", taskCounter: 1, projectName: "ThinkBoard" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoardConfig = async () => {
      try {
        const res = await api.get("/board-config");
        setBoardConfig(res.data);
      } catch (error) {
        console.error("Error fetching board config", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoardConfig();
  }, []);

  useEffect(() => {
    if (boardConfig?.projectName) {
      document.title = boardConfig.projectName;
    }
  }, [boardConfig?.projectName]);

  return { boardConfig, setBoardConfig, loading };
}
