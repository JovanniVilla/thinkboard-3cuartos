import { useState, useEffect } from "react";
import api from "./axios";
import toast from "react-hot-toast";

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects");
        setProjects(res.data);
      } catch (error) {
        console.error("Error fetching projects", error);
        toast.error("Error al cargar los proyectos");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, setProjects, loading };
};
