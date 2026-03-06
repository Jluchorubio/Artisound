import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const MAX_HISTORY = 60;

const presetColors = [
  '#000000', '#111827', '#475569', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ffffff',
];

function hexToRgba(hex, alpha) {
  const cleanHex = hex.replace('#', '');
  const bigint = Number.parseInt(cleanHex.length === 3
    ? cleanHex.split('').map((ch) => ch + ch).join('')
    : cleanHex, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function DrawingPage() {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#0f172a');
  const [lineWidth, setLineWidth] = useState(4);
  const [opacity, setOpacity] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [drawings, setDrawings] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const applyBrushConfig = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = hexToRgba(color, opacity);
    }

    return ctx;
  };

  const captureSnapshot = () => {
    const canvas = canvasRef.current;
    const snapshot = canvas.toDataURL('image/png');
    const currentTop = undoStackRef.current[undoStackRef.current.length - 1];

    if (snapshot !== currentTop) {
      undoStackRef.current.push(snapshot);
      if (undoStackRef.current.length > MAX_HISTORY) {
        undoStackRef.current.shift();
      }
    }
  };

  const restoreSnapshot = (snapshot) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    img.src = snapshot;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    captureSnapshot();
  }, []);

  const startDraw = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    isDrawingRef.current = true;
    const point = getCanvasPoint(event);
    const ctx = applyBrushConfig();

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!isDrawingRef.current) return;

    event.preventDefault();
    const point = getCanvasPoint(event);
    const ctx = applyBrushConfig();

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDraw = (event) => {
    if (!isDrawingRef.current) return;

    event.preventDefault();
    isDrawingRef.current = false;
    captureSnapshot();
    redoStackRef.current = [];
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    captureSnapshot();
    redoStackRef.current = [];
  };

  const undo = () => {
    if (undoStackRef.current.length <= 1) return;

    const current = undoStackRef.current.pop();
    redoStackRef.current.push(current);

    const previous = undoStackRef.current[undoStackRef.current.length - 1];
    restoreSnapshot(previous);
  };

  const redo = () => {
    if (redoStackRef.current.length === 0) return;

    const snapshot = redoStackRef.current.pop();
    undoStackRef.current.push(snapshot);
    restoreSnapshot(snapshot);
  };

  const loadPortfolio = async () => {
    try {
      const res = await apiRequest('/drawings/me');
      setDrawings(res.drawings || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const saveDrawing = async () => {
    setError('');
    setMessage('');

    try {
      const imageBase64 = canvasRef.current.toDataURL('image/png');
      await apiRequest('/drawings', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          imageBase64,
          format: 'image/png',
        }),
      });
      setMessage('Dibujo guardado en tu portafolio');
      setTitle('');
      setDescription('');
      await loadPortfolio();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteDrawing = async (drawingId) => {
    setError('');
    setMessage('');
    try {
      await apiRequest(`/drawings/${drawingId}`, { method: 'DELETE' });
      setMessage('Dibujo eliminado');
      await loadPortfolio();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Demuestra tu talento</h1>
            <p className="text-slate-600">Editor tipo Paint con capas de color, opacidad y control de historial</p>
          </div>
          <Link to="/inicio" className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
            Volver al inicio
          </Link>
        </div>
      </header>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      <section className="rounded-2xl bg-white p-6 shadow-xl">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Herramientas</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTool('brush')}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${tool === 'brush' ? 'bg-cyan-700 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
                >
                  Pincel
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${tool === 'eraser' ? 'bg-cyan-700 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
                >
                  Borrador
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Historial</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={undo} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  Deshacer
                </button>
                <button onClick={redo} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  Rehacer
                </button>
                <button onClick={clearCanvas} className="col-span-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white">
                  Limpiar lienzo
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Color</p>
              <div className="mb-3 grid grid-cols-5 gap-2">
                {presetColors.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setColor(preset)}
                    className={`h-8 w-8 rounded border ${color === preset ? 'ring-2 ring-cyan-500' : 'border-slate-300'}`}
                    style={{ backgroundColor: preset }}
                    title={preset}
                  />
                ))}
              </div>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full rounded border border-slate-300" />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tamano y opacidad</p>
              <label className="mb-2 block text-xs text-slate-600">Tamano: {lineWidth}px</label>
              <input type="range" min={1} max={40} value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="w-full" />
              <label className="mb-2 mt-3 block text-xs text-slate-600">Opacidad: {Math.round(opacity * 100)}%</label>
              <input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full" />
            </div>
          </aside>

          <div className="space-y-3">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={startDraw}
              onPointerMove={draw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
              className="touch-none w-full rounded-xl border border-slate-300 bg-white shadow-inner"
              style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <input
                placeholder="Titulo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                placeholder="Descripcion"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <button onClick={saveDrawing} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white md:col-span-2">
                Guardar dibujo
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-xl font-bold text-slate-900">Mi portafolio</h2>
        {drawings.length === 0 ? (
          <p className="text-slate-600">Aun no tienes dibujos guardados.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {drawings.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                <img src={item.image_base64} alt={item.title || 'Dibujo'} className="h-36 w-full rounded-lg object-cover" />
                <p className="mt-2 font-semibold text-slate-900">{item.title || 'Sin titulo'}</p>
                <p className="text-sm text-slate-600">{item.description || 'Sin descripcion'}</p>
                <button
                  onClick={() => deleteDrawing(item.id)}
                  className="mt-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Eliminar
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
