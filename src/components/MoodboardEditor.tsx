import { useState, useRef, useEffect } from "react";
import { FiTrash2, FiDownload, FiUpload } from "react-icons/fi";

interface ImageItem {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawingStroke {
  id: string;
  type: "pen" | "line" | "rect" | "circle" | "text";
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

type DrawingTool = "select" | "pen" | "line" | "rect" | "circle" | "text";

export default function MoodboardEditor({ content, onChange }: Props) {
  const [data, setData] = useState<MoodboardData>(() => {
    try {
      const parsed = content
        ? JSON.parse(content)
        : { images: [], strokes: [] };
      // Ensure structure is valid (handle old format)
      return {
        images: Array.isArray(parsed.images) ? parsed.images : [],
        strokes: Array.isArray(parsed.strokes) ? parsed.strokes : [],
      };
    } catch {
      return { images: [], strokes: [] };
    }
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggedImage, setDraggedImage] = useState<ImageItem | null>(null);
  const [draggedStroke, setDraggedStroke] = useState<DrawingStroke | null>(
    null,
  );
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [editingStrokeId, setEditingStrokeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist to parent on change
  const saveData = (newData: MoodboardData) => {
    setData(newData);
    onChange(JSON.stringify(newData));
  };

  // Hit detection - check if point is on a stroke
  const getStrokeAtPoint = (
    x: number,
    y: number,
    strokes: DrawingStroke[],
  ): DrawingStroke | null => {
    const threshold = 8; // pixels tolerance for detection
    for (let i = strokes.length - 1; i >= 0; i--) {
      const stroke = strokes[i];
      if (stroke.type === "pen" && stroke.points) {
        for (const pt of stroke.points) {
          if (
            Math.sqrt(Math.pow(x - pt.x, 2) + Math.pow(y - pt.y, 2)) < threshold
          ) {
            return stroke;
          }
        }
      } else if (stroke.type === "line" && stroke.startX !== undefined) {
        const dist = pointToLineDistance(
          x,
          y,
          stroke.startX,
          stroke.startY!,
          stroke.endX!,
          stroke.endY!,
        );
        if (dist < threshold) return stroke;
      } else if (stroke.type === "rect" && stroke.startX !== undefined) {
        const minX = Math.min(stroke.startX, stroke.endX!);
        const maxX = Math.max(stroke.startX, stroke.endX!);
        const minY = Math.min(stroke.startY!, stroke.endY!);
        const maxY = Math.max(stroke.startY!, stroke.endY!);
        if (
          x >= minX - threshold &&
          x <= maxX + threshold &&
          y >= minY - threshold &&
          y <= maxY + threshold
        ) {
          return stroke;
        }
      } else if (stroke.type === "circle" && stroke.startX !== undefined) {
        const radius = Math.sqrt(
          Math.pow(stroke.endX! - stroke.startX, 2) +
            Math.pow(stroke.endY! - stroke.startY!, 2),
        );
        const dist = Math.sqrt(
          Math.pow(x - stroke.startX, 2) + Math.pow(y - stroke.startY!, 2),
        );
        if (Math.abs(dist - radius) < threshold) return stroke;
      } else if (
        stroke.type === "text" &&
        stroke.startX !== undefined &&
        stroke.text
      ) {
        const fs = stroke.fontSize || 16;
        const lineHeight = fs * 1.4;
        const lines = stroke.text.split("\n");
        const maxWidth = Math.max(...lines.map((l) => l.length * fs * 0.6));
        if (
          x >= stroke.startX - threshold &&
          x <= stroke.startX + maxWidth + threshold &&
          y >= stroke.startY! - fs - threshold &&
          y <= stroke.startY! + (lines.length - 1) * lineHeight + threshold
        ) {
          return stroke;
        }
      }
    }
    return null;
  };

  const pointToLineDistance = (
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Redraw canvas with images and strokes
  const redrawCanvas = (strokes: DrawingStroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw all images first
    const images = data.images || [];
    images.forEach((img) => {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, img.x, img.y, img.width, img.height);
      };
      image.src = img.src;
    });

    // Draw all strokes
    (strokes || []).forEach((stroke) => {
      // Set color - highlight if selected
      const isSelected = stroke.id === selectedStrokeId;
      ctx.strokeStyle = isSelected ? "#ff6b6b" : stroke.color;
      ctx.fillStyle = isSelected ? "#ff6b6b" : stroke.color;
      ctx.lineWidth = isSelected
        ? Math.max(stroke.lineWidth + 2, 4)
        : stroke.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.type === "pen" && stroke.points) {
        if (stroke.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          stroke.points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
          ctx.stroke();
        }
      } else if (
        stroke.type === "line" &&
        stroke.startX !== undefined &&
        stroke.endX !== undefined
      ) {
        ctx.beginPath();
        ctx.moveTo(stroke.startX, stroke.startY!);
        ctx.lineTo(stroke.endX, stroke.endY!);
        ctx.stroke();
      } else if (
        stroke.type === "rect" &&
        stroke.startX !== undefined &&
        stroke.endX !== undefined
      ) {
        const w = stroke.endX - stroke.startX;
        const h = stroke.endY! - stroke.startY!;
        ctx.strokeRect(stroke.startX, stroke.startY!, w, h);
      } else if (
        stroke.type === "circle" &&
        stroke.startX !== undefined &&
        stroke.endX !== undefined
      ) {
        const radius = Math.sqrt(
          Math.pow(stroke.endX - stroke.startX, 2) +
            Math.pow(stroke.endY! - stroke.startY!, 2),
        );
        ctx.beginPath();
        ctx.arc(stroke.startX, stroke.startY!, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (
        stroke.type === "text" &&
        stroke.text &&
        stroke.startX !== undefined
      ) {
        const fs = stroke.fontSize || fontSize;
        ctx.font = `${fs}px Arial`;
        const lineHeight = fs * 1.4;
        stroke.text.split("\n").forEach((line, i) => {
          ctx.fillText(line, stroke.startX!, stroke.startY! + i * lineHeight);
        });
      }
    });
  };

  useEffect(() => {
    redrawCanvas(data.strokes);
  }, [data, selectedStrokeId]);

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
      fileInputRef.current.value = "";
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle select tool
    if (tool === "select") {
      const clickedStroke = getStrokeAtPoint(x, y, data.strokes || []);
      if (clickedStroke) {
        setSelectedStrokeId(clickedStroke.id);
        setDraggedStroke(clickedStroke);
        setStartPos({ x, y });
        return;
      }
      const clickedImage = [...data.images].reverse().find((img) => {
        return (
          x >= img.x &&
          x <= img.x + img.width &&
          y >= img.y &&
          y <= img.y + img.height
        );
      });
      if (clickedImage) {
        setDraggedImage(clickedImage);
      }
      return;
    }

    // Check if clicking on an image
    const clickedImage = [...data.images].reverse().find((img) => {
      return (
        x >= img.x &&
        x <= img.x + img.width &&
        y >= img.y &&
        y <= img.y + img.height
      );
    });

    if (clickedImage) {
      setDraggedImage(clickedImage);
      return;
    }

    if (tool === "text") {
      setEditingStrokeId(null);
      setTextPos({ x, y });
      setTextInput("");
      return;
    }

    setStartPos({ x, y });
    setIsDrawing(true);

    if (tool === "pen") {
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}-${Math.random()}`,
        type: "pen",
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
        img.id === draggedImage.id ? { ...img, x, y } : img,
      );
      setData({ ...data, images: newImages });
      setDraggedImage({ ...draggedImage, x, y });
      return;
    }

    if (draggedStroke && startPos) {
      const dx = x - startPos.x;
      const dy = y - startPos.y;
      const updatedStrokes = (data.strokes || []).map((s) => {
        if (s.id !== draggedStroke.id) return s;
        const moved = { ...s };
        if (moved.type === "pen" && moved.points) {
          moved.points = moved.points.map((pt) => ({
            x: pt.x + dx,
            y: pt.y + dy,
          }));
        } else {
          if (moved.startX !== undefined) moved.startX += dx;
          if (moved.startY !== undefined) moved.startY += dy;
          if (moved.endX !== undefined) moved.endX += dx;
          if (moved.endY !== undefined) moved.endY += dy;
        }
        return moved;
      });
      setData({ ...data, strokes: updatedStrokes });
      setDraggedStroke({
        ...draggedStroke,
        ...{
          startX: (draggedStroke.startX || 0) + dx,
          startY: (draggedStroke.startY || 0) + dy,
          endX: (draggedStroke.endX || 0) + dx,
          endY: (draggedStroke.endY || 0) + dy,
        },
      });
      setStartPos({ x, y });
      return;
    }

    if (!isDrawing || !startPos) return;

    if (tool === "pen") {
      const lastStroke = data.strokes[data.strokes.length - 1];
      if (lastStroke && lastStroke.type === "pen") {
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
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === "rect") {
        const w = x - startPos.x;
        const h = y - startPos.y;
        ctx.strokeRect(startPos.x, startPos.y, w, h);
      } else if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2),
        );
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

    if (draggedStroke) {
      saveData(data);
      setDraggedStroke(null);
      setStartPos(null);
      return;
    }

    if (!isDrawing || !startPos) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random()}`,
      type: tool as "line" | "rect" | "circle",
      color,
      lineWidth,
      startX: startPos.x,
      startY: startPos.y,
      endX: x,
      endY: y,
    };

    if (tool !== "pen") {
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
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = `moodboard-${Date.now()}.png`;
    link.click();
  };

  const removeImage = (id: string) => {
    saveData({ ...data, images: data.images.filter((img) => img.id !== id) });
  };

  const selectedStrokeIdRef = useRef<string | null>(null);
  selectedStrokeIdRef.current = selectedStrokeId;
  const dataRef = useRef<MoodboardData>(data);
  dataRef.current = data;
  const toolRef = useRef<DrawingTool>(tool);
  toolRef.current = tool;

  const deleteSelectedStroke = () => {
    const id = selectedStrokeIdRef.current;
    if (!id) return;
    const current = dataRef.current;
    const newData = {
      ...current,
      strokes: (current.strokes || []).filter((s) => s.id !== id),
    };
    saveData(newData);
    setSelectedStrokeId(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable;

      // Delete selected stroke (Del or Backspace while in select mode)
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        toolRef.current === "select" &&
        selectedStrokeIdRef.current
      ) {
        e.preventDefault();
        deleteSelectedStroke();
        return;
      }

      // Tool shortcuts (skip when typing)
      if (!isTyping) {
        const shortcuts: Record<string, DrawingTool> = {
          v: "select",
          p: "pen",
          l: "line",
          r: "rect",
          c: "circle",
          t: "text",
        };
        const shortcut = shortcuts[e.key.toLowerCase()];
        if (shortcut) {
          e.preventDefault();
          setTool(shortcut);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const submitText = () => {
    if (!textInput.trim()) {
      setTextPos(null);
      setEditingStrokeId(null);
      setTextInput("");
      return;
    }
    if (editingStrokeId) {
      // Update existing text stroke
      const updated = (data.strokes || []).map((s) =>
        s.id === editingStrokeId ? { ...s, text: textInput } : s,
      );
      saveData({ ...data, strokes: updated });
      setEditingStrokeId(null);
    } else if (textPos) {
      // Create new text stroke
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}-${Math.random()}`,
        type: "text",
        text: textInput,
        startX: textPos.x,
        startY: textPos.y,
        color,
        fontSize,
        lineWidth: 0,
      };
      saveData({ ...data, strokes: [...data.strokes, newStroke] });
    }
    setTextPos(null);
    setTextInput("");
  };

  const TOOLS: {
    id: DrawingTool;
    label: string;
    icon: string;
    shortcut: string;
  }[] = [
    { id: "select", label: "Select", icon: "👆", shortcut: "V" },
    { id: "pen", label: "Pen", icon: "✏️", shortcut: "P" },
    { id: "line", label: "Line", icon: "📏", shortcut: "L" },
    { id: "rect", label: "Rectangle", icon: "▭", shortcut: "R" },
    { id: "circle", label: "Circle", icon: "⭕", shortcut: "C" },
    { id: "text", label: "Text", icon: "𝐀", shortcut: "T" },
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
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
              title={`${t.label} (${t.shortcut})`}
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
        {tool === "text" && (
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
            <span className="text-xs text-gray-600 min-w-fit">
              {fontSize}px
            </span>
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
      {(textPos || editingStrokeId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4 shadow-xl w-80">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {editingStrokeId ? "Edit text:" : "Enter text:"}
            </label>
            <textarea
              autoFocus
              rows={5}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitText();
                if (e.key === "Escape") {
                  setTextPos(null);
                  setEditingStrokeId(null);
                  setTextInput("");
                }
              }}
              className="w-full border border-gray-300 rounded px-2 py-1 mb-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans text-sm"
              placeholder="Type your text here...&#10;Press Enter for new lines."
            />
            <p className="text-xs text-gray-400 mb-3">⌘ Enter to confirm</p>
            <div className="flex gap-2">
              <button
                onClick={submitText}
                className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded font-medium text-sm hover:bg-indigo-700"
              >
                {editingStrokeId ? "Update" : "Add"}
              </button>
              <button
                onClick={() => {
                  setTextPos(null);
                  setEditingStrokeId(null);
                  setTextInput("");
                }}
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
          onDoubleClick={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const clicked = getStrokeAtPoint(x, y, data.strokes || []);
            if (clicked && clicked.type === "text") {
              setEditingStrokeId(clicked.id);
              setTextPos({ x: clicked.startX!, y: clicked.startY! });
              setTextInput(clicked.text || "");
              setTool("select");
            }
          }}
          className="bg-white border-2 border-gray-300 rounded-lg shadow-lg cursor-crosshair"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </div>

      {/* Images List Sidebar */}
      {data.images.length > 0 && (
        <div className="flex-shrink-0 w-full max-h-24 overflow-y-auto bg-white border-t border-gray-200 px-4 py-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Images ({data.images.length})
          </p>
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
