import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSettings, FiArrowLeft, FiSidebar, FiInfo } from "react-icons/fi";
import { useBookEditor } from "../hooks/useBookEditor";
import Sidebar from "../components/Sidebar";
import Editor from "../components/Editor";
import MoodboardEditor from "../components/MoodboardEditor";
import LanguageTabs from "../components/LanguageTabs";
import ExportButton from "../components/ExportButton";
import AboutModal from "../components/AboutModal";

export default function BookEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  const {
    project,
    loading,
    orderedChapters,
    orderedSections,
    selectedChapterId,
    selectedSectionId,
    selectedLocale,
    selectedChapter,
    selectedSection,
    editorContent,
    setSelectedChapterId,
    setSelectedSectionId,
    setSelectedLocale,
    addChapter,
    deleteChapter,
    renameChapter,
    reorderChapters,
    addSection,
    deleteSection,
    renameSection,
    reorderSections,
    saveContent,
  } = useBookEditor(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/")}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="flex items-center gap-2 px-2.5 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          title={sidebarOpen ? "Hide chapters" : "Show chapters"}
        >
          <FiSidebar className="w-5 h-5" />
          <span className="text-sm font-medium">
            {sidebarOpen ? "Hide chapters" : "Show chapters"}
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate">
            {project?.title}
          </h1>
          {project?.author && (
            <p className="text-xs text-gray-500">{project.author}</p>
          )}
        </div>
        {selectedChapter?.chapterType !== "moodboard" && (
          <LanguageTabs
            selectedLocale={selectedLocale}
            onChange={setSelectedLocale}
          />
        )}
        {project && (
          <ExportButton
            project={project}
            chapter={selectedChapter}
            section={selectedSection}
            locale={selectedLocale}
            chapters={orderedChapters}
            sectionsByChapter={orderedSections}
          />
        )}
        <button
          onClick={() => navigate(`/projects/${id}/settings`)}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Settings"
        >
          <FiSettings className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowAbout(true)}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="About"
        >
          <FiInfo className="w-5 h-5" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <Sidebar
            chapters={orderedChapters}
            sections={orderedSections}
            selectedChapterId={selectedChapterId}
            selectedSectionId={selectedSectionId}
            onSelectChapter={(cid) => {
              setSelectedChapterId(cid);
              setSelectedSectionId(null);
            }}
            onSelectSection={(cid, sid) => {
              setSelectedChapterId(cid);
              setSelectedSectionId(sid);
            }}
            onAddChapter={addChapter}
            onDeleteChapter={(chapter) => {
              if (!confirm(`Delete chapter "${chapter.title}"?`)) return;
              deleteChapter(chapter);
            }}
            onRenameChapter={renameChapter}
            onReorderChapters={reorderChapters}
            onAddSection={addSection}
            onDeleteSection={(section) => {
              if (!confirm(`Delete section "${section.title}"?`)) return;
              deleteSection(section);
            }}
            onRenameSection={renameSection}
            onReorderSections={reorderSections}
          />
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedChapter ? (
            selectedChapter.chapterType === "moodboard" ? (
              <MoodboardEditor
                key={`${selectedChapterId}-moodboard`}
                content={editorContent}
                onChange={saveContent}
              />
            ) : (
              <Editor
                key={`${selectedChapterId}-${selectedSectionId}-${selectedLocale}`}
                content={editorContent}
                onChange={saveContent}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FiSettings className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500">
                Select a chapter
              </h3>
              <p className="text-gray-400 mt-1 text-sm">
                Choose a chapter from the sidebar to start writing.
              </p>
            </div>
          )}
        </div>
      </div>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
