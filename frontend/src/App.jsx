import { Route, Routes } from "react-router";

import HomePage from "./pages/HomePage";
import CreatePage from "./pages/CreatePage";
import NoteDetailPage from "./pages/NoteDetailPage";
import BoardSettingsPage from "./pages/BoardSettingsPage";

import { useTheme } from "./lib/ThemeContext";

const App = () => {
  const { theme } = useTheme();

  return (
    <div className="relative h-full w-full min-h-screen">
      <div
        className={`absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 transition-all duration-500 ${
          theme === "light"
            ? "[background:radial-gradient(125%_125%_at_50%_10%,#ffffff_60%,#00FF9D15_100%)]"
            : "[background:radial-gradient(125%_125%_at_50%_10%,#000000_60%,#00FF9D40_100%)]"
        }`}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/note/:id" element={<NoteDetailPage />} />
        <Route path="/board-settings" element={<BoardSettingsPage />} />
      </Routes>
    </div>
  );
};
export default App;
