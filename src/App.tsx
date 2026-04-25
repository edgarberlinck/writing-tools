import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProjectSettings from "./pages/ProjectSettings";
import BookEditor from "./pages/BookEditor";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/:id/settings" element={<ProjectSettings />} />
        <Route path="/projects/:id/editor" element={<BookEditor />} />
      </Routes>
    </HashRouter>
  );
}
