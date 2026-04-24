import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import Layout from '../components/Layout';
import { repository } from '../db';
import type { Project, ProjectConfig } from '../db/types';
import { DEFAULT_PROJECT_CONFIG } from '../db/types';

const FONT_FAMILIES = ['Georgia', 'Times New Roman', 'Arial', 'Helvetica', 'Palatino', 'Garamond', 'Book Antiqua'];

export default function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) {
      repository.getProject(id).then((p) => {
        setProject(p);
        setConfig(p.config);
        setTitle(p.title);
        setAuthor(p.author);
        setDescription(p.description);
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    try {
      await repository.saveProject({ ...project, title, author, description, config });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const updateFont = (key: keyof ProjectConfig['fonts'], field: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [key]: { ...prev.fonts[key], [field]: value },
      },
    }));
  };

  const updateMargin = (key: keyof ProjectConfig['margins'], value: number) => {
    setConfig((prev) => ({ ...prev, margins: { ...prev.margins, [key]: value } }));
  };

  if (!project) return <Layout><div className="p-8 text-gray-500">Loading...</div></Layout>;

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
            <p className="text-gray-500 text-sm mt-0.5">{project.title}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${
              saved ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <FiSave className="w-4 h-4" />
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div><label className={labelCls}>Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Author</label><input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} rows={3} /></div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Page Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Page Size</label>
                <select value={config.pageSize} onChange={(e) => setConfig((p) => ({ ...p, pageSize: e.target.value as ProjectConfig['pageSize'] }))} className={inputCls}>
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Line Spacing</label>
                <input type="number" min="1" max="3" step="0.1" value={config.lineSpacing} onChange={(e) => setConfig((p) => ({ ...p, lineSpacing: parseFloat(e.target.value) }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Chapter Title Format</label>
                <select value={config.chapterTitleFormat} onChange={(e) => setConfig((p) => ({ ...p, chapterTitleFormat: e.target.value as ProjectConfig['chapterTitleFormat'] }))} className={inputCls}>
                  <option value="chapter_num_title">Chapter 1 - Title</option>
                  <option value="title_only">Title Only</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                <div key={side}>
                  <label className={labelCls}>{side.charAt(0).toUpperCase() + side.slice(1)} (mm)</label>
                  <input type="number" min="0" max="100" value={config.margins[side]} onChange={(e) => updateMargin(side, parseInt(e.target.value))} className={inputCls} />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Font Settings</h2>
            <div className="space-y-4">
              {(['title', 'subtitle', 'body', 'quotation'] as const).map((key) => (
                <div key={key} className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className={labelCls}>{key.charAt(0).toUpperCase() + key.slice(1)} Family</label>
                    <select value={config.fonts[key].family} onChange={(e) => updateFont(key, 'family', e.target.value)} className={inputCls}>
                      {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Size (pt)</label>
                    <input type="number" min="8" max="72" value={config.fonts[key].size} onChange={(e) => updateFont(key, 'size', parseInt(e.target.value))} className={inputCls} />
                  </div>
                  <div className="flex items-center gap-3 pb-2">
                    {key !== 'quotation' ? (
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={(config.fonts[key] as { bold: boolean }).bold} onChange={(e) => updateFont(key, 'bold', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                        Bold
                      </label>
                    ) : (
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={(config.fonts[key] as { italic: boolean }).italic} onChange={(e) => updateFont(key, 'italic', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                        Italic
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
