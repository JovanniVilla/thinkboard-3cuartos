import { Navigate } from "react-router";
import { useAuth } from "../lib/AuthContext";
import { LoaderIcon } from "lucide-react";
import ForcePasswordChange from "./ForcePasswordChange";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.requiresPasswordChange) {
    return (
      <>
        {children}
        <ForcePasswordChange />
      </>
    );
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
