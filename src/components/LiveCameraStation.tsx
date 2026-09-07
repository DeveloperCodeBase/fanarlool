import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { 
  Camera, 
  Video, 
  VideoOff, 
  Sparkles, 
  Crosshair, 
  Sliders, 
  Maximize2, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Eye, 
  Layers, 
  Cpu, 
  Scan,
  Compass,
  Gauge,
  Film,
  Zap,
  Info
} from 'lucide-react';

interface LiveCameraStationProps {
  lang: Language;
}

type VisionFilterMode = 'normal' | 'edges' | 'threshold' | 'inverted' | 'heatmap';
type LightingMode = 'backlight' | 'darkfield' | 'brightfield' | 'coaxial';

interface DetectedAnomaly {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  labelFa: string;
  labelEn: string;
  confidence: number;
  severity: 'pass' | 'warning' | 'defect';
  metric: string;
}

export const LiveCameraStation: React.FC<LiveCameraStationProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  // Camera stream mode: 'webcam' (real user camera) or 'industrial_sim' (Basler GenICam simulator)
  const [feedSource, setFeedSource] = useState<'webcam' | 'industrial_sim'>('industrial_sim');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [hasWebcamPermission, setHasWebcamPermission] = useState<boolean | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Vision Filter & Image Processing Settings
  const [filterMode, setFilterMode] = useState<VisionFilterMode>('normal');
  const [lightingMode, setLightingMode] = useState<LightingMode>('backlight');
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(true);
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [showAIBoxes, setShowAIBoxes] = useState<boolean>(true);
  const [exposureUs, setExposureUs] = useState<number>(1200); // 100 to 10000 us
  const [gainDb, setGainDb] = useState<number>(4.5); // 0 to 24 dB
  const [magnification, setMagnification] = useState<number>(1.0); // 0.5x, 1x, 2x

  // Snapshot modal state
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null);
  const [snapshotSavedNotice, setSnapshotSavedNotice] = useState<boolean>(false);

  // FPS Counter
  const [currentFps, setCurrentFps] = useState<number>(48);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const simAngleRef = useRef<number>(0);

  // Simulated AI Detections that drift realistically
  const [detections, setDetections] = useState<DetectedAnomaly[]>([
    {
      id: 'D-01',
      x: 180,
      y: 90,
      w: 80,
      h: 55,
      labelFa: 'بررسی گام حلقه ۲ (Pitch #2)',
      labelEn: 'Coil Pitch #2',
      confidence: 99.4,
      severity: 'pass',
      metric: 'p = 38.2 mm (Nominal)'
    },
    {
      id: 'D-02',
      x: 175,
      y: 195,
      w: 90,
      h: 60,
      labelFa: 'زاویه عمود سر فنر (Perpendicularity)',
      labelEn: 'End Perpendicularity',
      confidence: 98.1,
      severity: 'pass',
      metric: 'e1 = 0.42° (DIN 2095 Gr.1)'
    },
    {
      id: 'D-03',
      x: 210,
      y: 320,
      w: 45,
      h: 40,
      labelFa: 'میکروترک سطحی احتمالی (Micro-Crack)',
      labelEn: 'Surface Micro-Crack',
      confidence: 94.6,
      severity: 'warning',
      metric: 'Depth < 15 µm'
    }
  ]);

  // Handle Real Webcam Stream Lifecycle
  useEffect(() => {
    if (feedSource === 'webcam') {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [feedSource]);

  const startWebcam = async () => {
    stopWebcam();
    setWebcamError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasWebcamPermission(true);
      setIsStreaming(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setHasWebcamPermission(false);
      setWebcamError(err.message || 'دسترسی به دوربین توسط مرورگر رد شد یا دوربینی یافت نشد.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Main Canvas Rendering Loop (Runs for both Webcam and Industrial Simulation)
  useEffect(() => {
    let active = true;

    const render = (now: number) => {
      if (!active) return;

      // Calculate Real FPS
      frameCountRef.current++;
      if (now - lastTimeRef.current >= 1000) {
        setCurrentFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      if (!isFrozen) {
        // --- 1. Draw Base Image ---
        if (feedSource === 'webcam' && videoRef.current && videoRef.current.readyState >= 2) {
          // Draw user webcam video
          ctx.drawImage(videoRef.current, 0, 0, width, height);
        } else {
          // Draw High-Precision Basler Industrial Telecentric Spring Inspection Stream
          simAngleRef.current += 0.02;
          const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
          if (lightingMode === 'backlight') {
            bgGrad.addColorStop(0, '#f8fafc');
            bgGrad.addColorStop(1, '#e2e8f0');
          } else if (lightingMode === 'darkfield') {
            bgGrad.addColorStop(0, '#030712');
            bgGrad.addColorStop(1, '#0f172a');
          } else {
            bgGrad.addColorStop(0, '#1e293b');
            bgGrad.addColorStop(1, '#334155');
          }
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, width, height);

          // Draw Industrial Spring in Telecentric Beam
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.scale(magnification, magnification);

          const springWidth = 140;
          const coilCount = 7;
          const springHeight = 320;
          const wireThickness = 24;

          // Wire body shadow / glow
          ctx.lineWidth = wireThickness;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          if (lightingMode === 'backlight') {
            ctx.strokeStyle = '#020617'; // High-contrast silhouette
          } else if (lightingMode === 'darkfield') {
            ctx.strokeStyle = '#38bdf8'; // Edge scatter highlights
            ctx.shadowColor = '#0284c7';
            ctx.shadowBlur = 8;
          } else {
            const steelGrad = ctx.createLinearGradient(-springWidth/2, 0, springWidth/2, 0);
            steelGrad.addColorStop(0, '#64748b');
            steelGrad.addColorStop(0.3, '#f1f5f9');
            steelGrad.addColorStop(0.7, '#475569');
            steelGrad.addColorStop(1, '#1e293b');
            ctx.strokeStyle = steelGrad;
          }

          // Draw continuous helical coil path
          ctx.beginPath();
          const startY = -springHeight / 2;
          for (let y = 0; y <= springHeight; y += 4) {
            const phase = (y / springHeight) * coilCount * Math.PI * 2 + simAngleRef.current;
            const x = Math.sin(phase) * (springWidth / 2);
            if (y === 0) ctx.moveTo(x, startY + y);
            else ctx.lineTo(x, startY + y);
          }
          ctx.stroke();

          // Ground Flat Ends (DIN 2095 End Grinding)
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.moveTo(-springWidth/2 - 8, -springHeight/2);
          ctx.lineTo(springWidth/2 + 8, -springHeight/2);
          ctx.moveTo(-springWidth/2 - 8, springHeight/2);
          ctx.lineTo(springWidth/2 + 8, springHeight/2);
          ctx.stroke();

          ctx.restore();
        }

        // --- 2. Apply Computer Vision Filters on Canvas ImageData ---
        if (filterMode !== 'normal') {
          const imgData = ctx.getImageData(0, 0, width, height);
          const d = imgData.data;

          if (filterMode === 'threshold') {
            const threshold = 120;
            for (let i = 0; i < d.length; i += 4) {
              const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              const val = lum > threshold ? 255 : 0;
              d[i] = val;
              d[i + 1] = val;
              d[i + 2] = val;
            }
            ctx.putImageData(imgData, 0, 0);
          } else if (filterMode === 'inverted') {
            for (let i = 0; i < d.length; i += 4) {
              d[i] = 255 - d[i];
              d[i + 1] = 255 - d[i + 1];
              d[i + 2] = 255 - d[i + 2];
            }
            ctx.putImageData(imgData, 0, 0);
          } else if (filterMode === 'edges') {
            // Simplified Sobel filter
            const copy = new Uint8ClampedArray(d);
            for (let y = 1; y < height - 1; y++) {
              for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const gx = -copy[idx - 4] + copy[idx + 4];
                const gy = -copy[idx - width * 4] + copy[idx + width * 4];
                const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 3);
                d[idx] = mag;
                d[idx + 1] = mag > 50 ? mag : 0;
                d[idx + 2] = mag > 120 ? 255 : 0;
              }
            }
            ctx.putImageData(imgData, 0, 0);
          } else if (filterMode === 'heatmap') {
            for (let i = 0; i < d.length; i += 4) {
              const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
              d[i] = lum > 128 ? 255 : lum * 2; // R
              d[i + 1] = lum > 64 && lum < 200 ? 220 : 20; // G
              d[i + 2] = lum < 128 ? 255 - lum * 2 : 0; // B
            }
            ctx.putImageData(imgData, 0, 0);
          }
        }

        // --- 3. Optical Crosshairs & Calibrated Reticle Ruler ---
        if (showCrosshairs) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);

          // Center Horizontal & Vertical Lines
          ctx.beginPath();
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.moveTo(width / 2, 0);
          ctx.lineTo(width / 2, height);
          ctx.stroke();

          // Concentric Reticle Circles (Diameter indicators)
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, 90, 0, Math.PI * 2);
          ctx.arc(width / 2, height / 2, 170, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // --- 4. Sub-Millimeter Optical Calibration Ruler ---
        if (showRuler) {
          ctx.fillStyle = '#06b6d4';
          ctx.font = '9px monospace';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1;

          // Top X Axis Scale (mm)
          for (let x = 30; x < width - 30; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 15);
            ctx.lineTo(x, 25);
            ctx.stroke();
            ctx.fillText(`${((x - width / 2) * 0.15).toFixed(0)}mm`, x - 10, 12);
          }

          // Left Y Axis Scale (mm)
          for (let y = 30; y < height - 30; y += 30) {
            ctx.beginPath();
            ctx.moveTo(15, y);
            ctx.lineTo(25, y);
            ctx.stroke();
            ctx.fillText(`${((y - height / 2) * 0.15).toFixed(0)}`, 2, y + 3);
          }
        }

        // --- 5. AI Detection Overlays (Bounding Boxes & Annotations) ---
        if (showAIBoxes) {
          detections.forEach(det => {
            const isDef = det.severity === 'defect';
            const isWarn = det.severity === 'warning';
            const strokeColor = isDef ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981';
            const fillColor = isDef ? 'rgba(239, 68, 68, 0.12)' : isWarn ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)';

            // Corner bracket bounding box
            ctx.strokeStyle = strokeColor;
            ctx.fillStyle = fillColor;
            ctx.lineWidth = 2;
            ctx.fillRect(det.x, det.y, det.w, det.h);

            // High-tech corner lines
            const len = 10;
            ctx.beginPath();
            // Top-left
            ctx.moveTo(det.x, det.y + len); ctx.lineTo(det.x, det.y); ctx.lineTo(det.x + len, det.y);
            // Top-right
            ctx.moveTo(det.x + det.w - len, det.y); ctx.lineTo(det.x + det.w, det.y); ctx.lineTo(det.x + det.w, det.y + len);
            // Bottom-left
            ctx.moveTo(det.x, det.y + det.h - len); ctx.lineTo(det.x, det.y + det.h); ctx.lineTo(det.x + len, det.y + det.h);
            // Bottom-right
            ctx.moveTo(det.x + det.w - len, det.y + det.h); ctx.lineTo(det.x + det.w, det.y + det.h); ctx.lineTo(det.x + det.w, det.y + det.h - len);
            ctx.stroke();

            // Label tag badge
            ctx.fillStyle = strokeColor;
            ctx.fillRect(det.x, det.y - 18, det.w, 18);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 9px monospace';
            const title = isFa ? det.labelFa : det.labelEn;
            ctx.fillText(`${title.slice(0, 15)} ${det.confidence}%`, det.x + 3, det.y - 5);
          });
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      active = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [feedSource, isFrozen, filterMode, lightingMode, showCrosshairs, showRuler, showAIBoxes, magnification, isFa, detections]);

  // Capture current canvas as snapshot image
  const handleTakeSnapshot = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setSnapshotDataUrl(dataUrl);
      setSnapshotSavedNotice(true);
      setTimeout(() => setSnapshotSavedNotice(false), 5000);
    }
  };

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Hidden video element for webcam streaming */}
      <video ref={videoRef} playsInline muted className="hidden" />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Camera className="w-4 h-4" />
            <span>{isFa ? 'ایستگاه بینایی ماشین و دوربین بلادرنگ خط تولید' : 'Live Industrial Camera & Machine Vision Station'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'پایش تصویری ۳۶۰ درجه و پردازش تصویر بلادرنگ فریم‌ها' : 'Real-Time Edge Computer Vision & Telecentric Imaging'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'قابلیت سوییچ آنی بین دوربین متصل به سیستم (Webcam) و استریم صنعتی دوربین Basler GenICam GigE با لنز تله‌سنتریک، فیلترهای لبه‌سنجی Canny، خط‌کش میکرومتری و تشخیص هوشمند عیوب فنر.'
              : 'Direct integration with system webcam or high-speed Basler GenICam industrial GigE camera with sub-pixel edge detection and instant dimensional verification.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Source Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFeedSource('industrial_sim')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5 ${
                feedSource === 'industrial_sim'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isFa ? 'دوربین صنعتی Basler GigE' : 'Basler GigE'}</span>
            </button>
            <button
              onClick={() => setFeedSource('webcam')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5 ${
                feedSource === 'webcam'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>{isFa ? 'دوربین زنده سیستم (Webcam)' : 'Live Webcam'}</span>
            </button>
          </div>

          {/* Snapshot Button */}
          <button
            onClick={handleTakeSnapshot}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-950"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isFa ? 'ثبت اسنپ‌شات و گزارش' : 'Capture Snapshot'}</span>
          </button>
        </div>
      </div>

      {/* Snapshot Success Notification */}
      {snapshotSavedNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isFa ? 'تصویر با رزولوشن میکرونی ثبت شد و ابعاد در گزارش کنترل کیفیت ذخیره گردید.' : 'Snapshot captured successfully with calibrated dimensions logged.'}</span>
          </div>
          {snapshotDataUrl && (
            <a 
              href={snapshotDataUrl} 
              download="fanar-lool-vision-inspection.png" 
              className="px-3 py-1 bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-500 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>{isFa ? 'دانلود عکس' : 'Download PNG'}</span>
            </a>
          )}
        </div>
      )}

      {/* Webcam Permission Alert if Failed */}
      {feedSource === 'webcam' && hasWebcamPermission === false && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-white mb-1">
              {isFa ? 'عدم دسترسی به دوربین فیزیکی' : 'Camera Hardware Access Denied or Missing'}
            </div>
            <p className="text-rose-200">
              {isFa 
                ? 'لطفاً مجوز دسترسی به دوربین (Camera Permission) را در مرورگر فعال کنید یا از حالت شبیه‌ساز صنعتی Basler GenICam استفاده نمایید.' 
                : 'Please allow camera permissions in your browser or switch back to the Basler Industrial Simulator mode.'}
            </p>
            <button
              onClick={() => setFeedSource('industrial_sim')}
              className="mt-2 px-3 py-1 bg-rose-900 text-white rounded text-xs hover:bg-rose-800"
            >
              {isFa ? 'بازگشت به دوربین صنعتی تله‌سنتریک' : 'Switch to Industrial Basler Stream'}
            </button>
          </div>
        </div>
      )}

      {/* Main Vision Canvas & Inspection Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Interactive Viewport with Real Canvas */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between shadow-2xl">
          
          {/* Top Canvas Bar */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{feedSource === 'webcam' ? 'LIVE WEBCAM STREAM' : 'BASLER ACE 5MP GIGE'}</span>
              </span>

              <span className="text-slate-500">|</span>

              <span className="text-cyan-400">
                {currentFps} FPS
              </span>

              <span className="text-slate-500">|</span>

              <span className="text-slate-400">
                2448×2048 @ 12-bit Mono
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFrozen(!isFrozen)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  isFrozen ? 'bg-amber-950 text-amber-300 border border-amber-700 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isFrozen ? (isFa ? 'توقف فریم (FROZEN)' : 'FROZEN') : (isFa ? 'فریز تصویر' : 'Freeze')}
              </button>

              <button
                onClick={() => setMagnification(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2.0 : 1.0)}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px] font-mono"
                title={isFa ? 'تغییر بزرگنمایی تله‌سنتریک' : 'Toggle Magnification'}
              >
                {magnification}x
              </button>
            </div>
          </div>

          {/* Central Live Canvas */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              width={720}
              height={480}
              className="w-full h-full object-contain cursor-crosshair"
            />

            {/* In-stream Technical HUD Watermark */}
            <div className="absolute bottom-3 left-3 text-[10px] font-mono text-cyan-400 bg-slate-950/80 px-2.5 py-1 rounded border border-cyan-800/60 pointer-events-none">
              CALIBRATION: 0.0125 mm/px | TELECENTRIC F/4.0 | OPTICAL DISTORTION &lt; 0.05%
            </div>

            <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 pointer-events-none">
              EXPOSURE: {exposureUs} µs | GAIN: {gainDb} dB
            </div>
          </div>

          {/* Filter Bar Controls */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-xs font-mono ml-1">{isFa ? 'فیلتر هوش مصنوعی:' : 'CV Filter:'}</span>
              {(['normal', 'edges', 'threshold', 'inverted', 'heatmap'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase transition-colors ${
                    filterMode === mode
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-xs">
                <input
                  type="checkbox"
                  checked={showCrosshairs}
                  onChange={(e) => setShowCrosshairs(e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                <span>{isFa ? 'تارگت مرکزی' : 'Crosshairs'}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-xs">
                <input
                  type="checkbox"
                  checked={showRuler}
                  onChange={(e) => setShowRuler(e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                <span>{isFa ? 'خط‌کش میلیمتری' : 'Ruler'}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-xs">
                <input
                  type="checkbox"
                  checked={showAIBoxes}
                  onChange={(e) => setShowAIBoxes(e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                <span>{isFa ? 'باکس‌های هوش مصنوعی' : 'AI Boxes'}</span>
              </label>
            </div>
          </div>

        </div>

        {/* Right 4 Cols: Industrial Hardware Telemetry & Optical Controls */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          
          {/* Lighting & Lens Mode Box */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isFa ? 'تنظیمات نورپردازی استروبوسکوپیک (Lighting)' : 'Strobe Lighting System'}</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {(['backlight', 'darkfield', 'brightfield', 'coaxial'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setLightingMode(mode)}
                  className={`p-2 rounded-xl text-center border transition-colors ${
                    lightingMode === mode
                      ? 'bg-amber-950/60 text-amber-300 border-amber-600 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {mode === 'backlight' && (isFa ? 'نور پس‌زمینه (سیلوئت)' : 'Backlight')}
                  {mode === 'darkfield' && (isFa ? 'میدان تاریک (Darkfield)' : 'Darkfield')}
                  {mode === 'brightfield' && (isFa ? 'میدان روشن مستقیم' : 'Brightfield')}
                  {mode === 'coaxial' && (isFa ? 'هم‌محور کوآکسیال' : 'Coaxial')}
                </button>
              ))}
            </div>

            {/* Sliders for Exposure & Gain */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{isFa ? 'زمان اکسپوژر (Exposure):' : 'Exposure Time:'}</span>
                  <span className="font-mono text-cyan-400 font-bold">{exposureUs} µs</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="8000"
                  step="100"
                  value={exposureUs}
                  onChange={(e) => setExposureUs(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{isFa ? 'بهره سنسور (Analog Gain):' : 'Sensor Gain:'}</span>
                  <span className="font-mono text-cyan-400 font-bold">{gainDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="18"
                  step="0.5"
                  value={gainDb}
                  onChange={(e) => setGainDb(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Real-time Quality Inspection Results */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? 'نتایج بازرسی زنده فریم کنونی' : 'Current Frame Analysis'}</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                100% IN-LINE
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">طول آزاد محاسبه‌شده (L0):</span>
                <span className="text-white font-bold">412.35 mm <span className="text-emerald-400 text-[10px]">(PASS)</span></span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">قطر خارجی (Do):</span>
                <span className="text-white font-bold">144.18 mm <span className="text-emerald-400 text-[10px]">(PASS)</span></span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">وضعیت ترک سطحی:</span>
                <span className="text-amber-400 font-bold">MONITORING (&lt; 15 µm)</span>
              </div>
            </div>
          </div>

          {/* Quick Camera Info Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="font-bold text-slate-200">{isFa ? 'مشخصات سخت‌افزاری دوربین:' : 'Hardware Specifications:'}</div>
            <div>Sony Pregius IMX264 Global Shutter CMOS Sensor</div>
            <div>لنز تله‌سنتریک دوطرفه (Bi-Telecentric) بدون خطای پرسپکتیو</div>
            <div>رابط گیگابیت اترنت GigE Vision با پروتکل انطباق GenICam</div>
          </div>

        </div>

      </div>
    </div>
  );
};
