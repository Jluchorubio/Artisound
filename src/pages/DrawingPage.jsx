import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api/client';
import RebelHeader from '../components/RebelHeader';
import { useAuth } from '../context/AuthContext';

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

function randomOffset(radius) {
  return (Math.random() * 2 - 1) * radius;
}

export default function DrawingPage() {
  const { user, logout } = useAuth();
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
  const [editingDrawingId, setEditingDrawingId] = useState(null);
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

  const sprayAtPoint = (ctx, point) => {
    const density = Math.max(8, Math.round(lineWidth * 2.2));
    const radius = Math.max(4, lineWidth * 1.6);
    const dotSize = Math.max(1, lineWidth * 0.18);

    for (let i = 0; i < density; i += 1) {
      const offsetX = randomOffset(radius);
      const offsetY = randomOffset(radius);
      if (offsetX * offsetX + offsetY * offsetY > radius * radius) continue;

      ctx.beginPath();
      ctx.arc(point.x + offsetX, point.y + offsetY, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
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
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = hexToRgba(color, opacity);
      ctx.fillStyle = hexToRgba(color, opacity);
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

  const loadImageOnCanvas = (imageDataUrl) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      undoStackRef.current = [];
      redoStackRef.current = [];
      captureSnapshot();
    };

    img.src = imageDataUrl;
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

    if (tool === 'spray') {
      sprayAtPoint(ctx, point);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!isDrawingRef.current) return;

    event.preventDefault();
    const point = getCanvasPoint(event);
    const ctx = applyBrushConfig();

    if (tool === 'spray') {
      sprayAtPoint(ctx, point);
      return;
    }

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
      if (editingDrawingId) {
        await apiRequest(`/drawings/${editingDrawingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title,
            description,
            imageBase64,
            format: 'image/png',
          }),
        });
        setMessage('Dibujo actualizado en tu portafolio');
      } else {
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
      }
      setTitle('');
      setDescription('');
      setEditingDrawingId(null);
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

  const editDrawing = (drawing) => {
    setError('');
    setMessage('Editando dibujo seleccionado');
    setEditingDrawingId(drawing.id);
    setTitle(drawing.title || '');
    setDescription(drawing.description || '');
    loadImageOnCanvas(drawing.image_base64);
  };

  const cancelEditing = () => {
    setEditingDrawingId(null);
    setTitle('');
    setDescription('');
    clearCanvas();
  };

  return (
    <>
      <RebelHeader user={user} onLogout={logout} />

      <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
        <section className="border border-white/10 bg-[#111] p-6 shadow-[14px_14px_0px_#f59e0b]">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">Laboratorio visual</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black italic uppercase leading-none">
            Libertad
            <br />
            <span className="text-rose-500">Creativa</span>
          </h1>
          <p className="mt-4 text-zinc-300">Editor tipo Paint con historial, opacidad, color y portafolio personal.</p>
        </section>

        {error && <p className="border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {message && <p className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}

        <section className="border border-white/10 bg-[#121212] p-6">
          <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-4 border border-white/10 bg-black/30 p-4">
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Herramientas</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTool('brush')}
                    className={`px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${tool === 'brush' ? 'bg-yellow-400 text-black' : 'border border-white/20 text-zinc-100'}`}
                  >
                    Pincel
                  </button>
                  <button
                    onClick={() => setTool('spray')}
                    className={`px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${tool === 'spray' ? 'bg-yellow-400 text-black' : 'border border-white/20 text-zinc-100'}`}
                  >
                    Spray
                  </button>
                  <button
                    onClick={() => setTool('eraser')}
                    className={`col-span-2 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${tool === 'eraser' ? 'bg-yellow-400 text-black' : 'border border-white/20 text-zinc-100'}`}
                  >
                    Borrador
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Historial</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={undo} className="border border-white/20 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-zinc-100">
                    Deshacer
                  </button>
                  <button onClick={redo} className="border border-white/20 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-zinc-100">
                    Rehacer
                  </button>
                  <button onClick={clearCanvas} className="col-span-2 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-black">
                    Limpiar muro
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Color</p>
                <div className="mb-3 grid grid-cols-5 gap-2">
                  {presetColors.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setColor(preset)}
                      className={`h-8 w-8 border ${color === preset ? 'border-yellow-300 ring-2 ring-yellow-400' : 'border-white/20'}`}
                      style={{ backgroundColor: preset }}
                      title={preset}
                    />
                  ))}
                </div>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full border border-white/20" />
              </div>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Tamano y opacidad</p>
                <label className="mb-2 block text-xs text-zinc-300">Tamano: {lineWidth}px</label>
                <input type="range" min={1} max={40} value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="w-full" />
                <label className="mb-2 mt-3 block text-xs text-zinc-300">Opacidad: {Math.round(opacity * 100)}%</label>
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
                className="touch-none w-full border-[10px] border-[#1a1a1a] bg-white shadow-[12px_12px_0px_#f59e0b]"
                style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  placeholder="Titulo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border border-white/20 bg-black/30 px-3 py-2 text-white"
                />
                <input
                  placeholder="Descripcion"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border border-white/20 bg-black/30 px-3 py-2 text-white"
                />
                <button onClick={saveDrawing} className="bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:-skew-x-6 hover:bg-rose-400 hover:text-white md:col-span-2">
                  {editingDrawingId ? 'Actualizar tag' : 'Guardar tag'}
                </button>
                {editingDrawingId && (
                  <button
                    onClick={cancelEditing}
                    className="border border-white/20 px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-zinc-100 md:col-span-2"
                  >
                    Cancelar edicion
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border border-white/10 bg-[#121212] p-6">
          <h2 className="mb-4 text-3xl font-black uppercase italic">Mi portafolio</h2>
          {drawings.length === 0 ? (
            <p className="text-zinc-300">Aun no tienes dibujos guardados.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {drawings.map((item) => (
                <article key={item.id} className="border border-white/10 bg-[#1a1a1a] p-3">
                  <img src={item.image_base64} alt={item.title || 'Dibujo'} className="h-36 w-full border border-white/10 object-cover" />
                  <p className="mt-2 font-bold uppercase text-white">{item.title || 'Sin titulo'}</p>
                  <p className="text-sm text-zinc-300">{item.description || 'Sin descripcion'}</p>
                  <button
                    onClick={() => editDrawing(item)}
                    className="mt-3 mr-2 border border-white/20 px-3 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-white"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteDrawing(item.id)}
                    className="mt-3 bg-rose-600 px-3 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-white"
                  >
                    Eliminar
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}

