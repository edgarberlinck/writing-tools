import { useState, useRef, useEffect } from 'react';
import { FiTrash2, FiDownload, FiUpload } from 'react-icons/fi';

interface ImageItem {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawingStroke {
  type: 'pen' | 'line' | 'rect' | 'circle' | 'text';
  points?: { x: number; y: number }[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  color: string;
  lineWidth: number;
  text?: string;
  fontSize?: number;
}

interface MoodboardData {
  images: ImageItem[];
  strokes: DrawingStroke[];
}

interface Props {
  content: string;
  onChange: (data: string) => void;
}

type DrawingTool = 'pen' | 'line' | 'rect' | 'circle' | 'text';

export default function MoodboardEditor({ content, onChange }: Props) {
  const [data, setData] = useState<MoodboardData>(() => {
    try {
      return content ? JSON.parse(content) : { images: [], strokes: [] };
    } catch {
      return { images: [], strokes: [] };
    }
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggedImage, setDraggedImage] = useState<ImageItem | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist to parent on change
  const saveData = (newData: MoodboardData) => {
    setData(newData);
    onChange(JSON.stringify(newData));
  };

  // Redraw canvas with images and strokes
  const redrawCanvas = (strokes: DrawingStroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw all images first
    data.images.forEach((img) => {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, img.x, img.y, img.width, img.height);
      };
      image.src = img.src;
    });

    // Draw all strokes
    strokes.forEach((stroke) => {
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.type === 'pen' && stroke.points) {
        if (stroke.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          stroke.points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
          ctx.stroke();
        }
      } else if (stroke.type === 'line' && stroke.startX !== undefined && stroke.endX !== undefined) {
        ctx.beginPath();
        ctx.moveTo(stroke.startX, stroke.startY!);
        ctx.lineTo(stroke.endX, stroke.endY!);
        ctx.stroke();
      } else if (stroke.type === 'rect' && stroke.startX !== undefined && stroke.endX !== undefined) {
        const w = stroke.endX - stroke.startX;
        const h = stroke.endY! - stroke.startY!;
        ctx.strokeRect(stroke.startX, stroke.startY!, w, h);
      } else if (stroke.type === 'circle' && stroke.startX !== undefined && stroke.endX !== undefined) {
        const radius = Math.sqrt(
          Math.pow(stroke.endX - stroke.startX, 2) + Math.pow(stroke.endY! - stroke.startY!, 2)
        );
        ctx.beginPath();
        ctx.arc(stroke.startX, stroke.startY!, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (stroke.type === 'text' && stroke.text && stroke.startX !== undefined) {
        ctx.font = `${stroke.fontSize || fontSize}px Arial`;
        ctx.fillText(stroke.text, stroke.startX, stroke.startY!);
      }
    });
  };

  useEffect(() => {
    redrawCanvas(data.strokes);
  }, [data]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const newImage: ImageItem = {
          id: `img-${Date.now()}-${Math.random()}`,
          src,
          x: 50,
          y: 50,
          width: 150,
          height: 150,
        };
        saveData({ ...data, images: [...data.images, newImage] });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on an image
    const clicked = [...data.images].reverse().find((img) => {
      return x >= img.x && x <= img.x + img.width && y >= img.y && y <= img.y + img.height;
    });

    if (clicked) {
      setDraggedImage(clicked);
      return;
    }

    if (tool === 'text') {
      setTextPos({ x, y });
      setTextInput('');
      return;
    }

    setStartPos({ x, y });
    setIsDrawing(true);

    if (tool === 'pen') {
      const newStroke: DrawingStroke = {
        type: 'pen',
        points: [{ x, y }],
        color,
        lineWidth,
      };
      saveData({ ...data, strokes: [...data.strokes, newStroke] });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedImage) {
      const newImages = data.images.map((img) =>
        img.id === draggedImage.id ? { ...img, x, y } : img
      );
      setData({ ...data, images: newImages });
      setDraggedImage({ ...draggedImage, x, y });
      return;
    }

    if (!isDrawing || !startPos) return;

    if (tool === 'pen') {
      const lastStroke = data.strokes[data.strokes.length - 1];
      if (lastStroke && lastStroke.type === 'pen') {
        const updatedStrokes = [...data.strokes];
        updatedStrokes[updatedStrokes.length - 1] = {
          ...lastStroke,
          points: [...(lastStroke.points || []), { x, y }],
        };
        setData({ ...data, strokes: updatedStrokes });
      }
    } else {
      // Live preview for other tools - redraw with temporary shape
      redrawCanvas(data.strokes);
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === 'rect') {
        const w = x - startPos.x;
        const h = y - startPos.y;
        ctx.strokeRect(startPos.x, startPos.y, w, h);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedImage) {
      saveData({ ...data, images: data.images });
      setDraggedImage(null);
      return;
    }

    if (!isDrawing || !startPos) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStroke: DrawingStroke = {
      type: tool,
      color,
      lineWidth,
      startX: startPos.x,
      startY: startPos.y,
      endX: x,
      endY: y,
    };

    if (tool !== 'pen') {
      saveData({ ...data, strokes: [...data.strokes, newStroke] });
    }

    setIsDrawing(false);
    setStartPos(null);
  };

  const clearDrawing = () => {
    saveData({ ...data, strokes: [] });
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = `moodboard-${Date.now()}.png`;
    link.click();
  };

  const removeImage = (id: string) => {
    saveData({ ...data, images: data.images.filter((img) => img.id !== id) });
  };

  const addText = () => {
    if (!textInput || !textPos) return;
    const newStroke: DrawingStroke = {
      type: 'text',
      text: textInput,
      startX: textPos.x,
      startY: textPos.y,
      color,
      fontSize,
      lineWidth: 0,
    };
    saveData({ ...data, strokes: [...data.strokes, newStroke] });
    setTextPos(null);
    setTextInput('');
  };

  const TOOLS: { id: DrawingTool; label: string; icon: string }[] = [
    { id: 'pen', label: 'Pen', icon: '✏️' },
    { id: 'line', label: 'Line', icon: '📏' },
    { id: 'rect', label: 'Rectangle', icon: '▭' },
    { id: 'circle', label: 'Circle', icon: '⭕' },
    { id: 'text', label: 'Text', icon: '𝐀' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-wrap">
        {/* Tools */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                tool === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Color */}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
          title="Color"
        />

        {/* Line Width */}
        <input
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="w-24"
          title={`Line width: ${lineWidth}`}
        />
        <span className="text-xs text-gray-600 min-w-fit">{lineWidth}px</span>

        {/* Font Size (for text) */}
        {tool === 'text' && (
          <>
            <input
              type="range"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24"
              title={`Font size: ${fontSize}`}
            />
            <span className="text-xs text-gray-600 min-w-fit">{fontSize}px</span>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1 min-w-fit" />

        {/* Action buttons */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <FiUpload className="w-4 h-4" />
          Add Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <button
          onClick={clearDrawing}
          className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
        >
          <FiTrash2 className="w-4 h-4" />
          Clear
        </button>

        <button
          onClick={downloadImage}
          className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
        >
          <FiDownload className="w-4 h-4" />
          Download
        </button>
      </div>

      {/* Text Input Modal */}
      {textPos && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4 shadow-xl">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Enter text:
            </label>
            <input
              autoFocus
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addText();
                if (e.key === 'Escape') setTextPos(null);
              }}
              className="w-full border border-gray-300 rounded px-2 py-1 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type text..."
            />
            <div className="flex gap-2">
              <button
                onClick={addText}
                className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded font-medium text-sm hover:bg-indigo-700"
              >
                Add
              </button>
              <button
                onClick={() => setTextPos(null)}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded font-medium text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={1000}
          height={800}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="bg-white border-2 border-gray-300 rounded-lg shadow-lg cursor-crosshair"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Images List Sidebar */}
      {data.images.length > 0 && (
        <div className="flex-shrink-0 w-full max-h-24 overflow-y-auto bg-white border-t border-gray-200 px-4 py-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Images ({data.images.length})</p>
          <div className="flex gap-2 flex-wrap">
            {data.images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.src}
                  alt="moodboard item"
                  className="h-16 w-16 object-cover rounded border border-gray-200"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiTrash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
