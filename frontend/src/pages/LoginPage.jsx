import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../lib/AuthContext";
import { LogInIcon, EyeIcon, EyeOffIcon, LoaderIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../lib/ThemeContext";

const LoginPage = () => {
  const { user, login, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (!authLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("¡Bienvenido de vuelta!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div
        className={`absolute inset-0 -z-10 transition-all duration-500 ${
          theme === "light"
            ? "[background:radial-gradient(125%_125%_at_50%_10%,#ffffff_60%,#00FF9D15_100%)]"
            : "[background:radial-gradient(125%_125%_at_50%_10%,#000000_60%,#00FF9D40_100%)]"
        }`}
      />

      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="ThinkBoard" className="w-12 h-12 object-contain" />
            <h1 className="text-4xl font-bold text-primary font-mono tracking-tight">ThinkBoard</h1>
          </Link>
          <p className="text-base-content/60 text-sm">Inicia sesión para acceder a tu tablero</p>
        </div>

        {/* Card */}
        <div className="bg-base-100/80 backdrop-blur-xl border border-base-content/10 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <LogInIcon className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-base-content">Iniciar Sesión</h2>
              <p className="text-xs text-base-content/50">Accede con tu cuenta</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-base-content/80">Email</span>
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="tu@email.com"
                className="input input-bordered w-full bg-base-200/50 focus:bg-base-100 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-base-content/80">Contraseña</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="input input-bordered w-full bg-base-200/50 focus:bg-base-100 transition-colors pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary w-full text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderIcon className="size-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogInIcon className="size-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider text-base-content/30 text-xs my-6">O</div>

          {/* Register Link */}
          <p className="text-center text-sm text-base-content/60">
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="text-primary font-semibold hover:underline hover:text-primary/80 transition-colors"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-base-content/30 mt-6">
          © {new Date().getFullYear()} ThinkBoard. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
