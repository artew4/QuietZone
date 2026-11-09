import { useEffect, useRef, useState } from "react";
import { ArrowRight, Clock3, Footprints, MapPin, MousePointer2, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { gameCommand, startGame, stopGame } from "@/game/boot";
import type { GameState } from "@/game/types";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<GameState>("title");
  const [muted, setMuted] = useState(false);
  const [interaction, setInteraction] = useState("");
  const [location, setLocation] = useState("Гаражный кооператив");
  const [toast, setToast] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [summary, setSummary] = useState({ seconds: 0, location: "Центральный двор" });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    startGame(canvas);
    return () => stopGame();
  }, []);

  useEffect(() => {
    const listen = <T,>(name: string, callback: (detail: T) => void) => {
      const handler = (event: Event) => callback((event as CustomEvent<T>).detail);
      window.addEventListener(`quietzone:${name}`, handler);
      return () => window.removeEventListener(`quietzone:${name}`, handler);
    };
    const cleanups = [
      listen("state", setState),
      listen("muted", setMuted),
      listen("interaction", setInteraction),
      listen("location", setLocation),
      listen("toast", setToast),
      listen("summaryData", setSummary),
    ];
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  useEffect(() => {
    if (state !== "playing") return;
    setShowHint(true);
    const timer = window.setTimeout(() => setShowHint(false), 11000);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const minutes = Math.floor(summary.seconds / 60);
  const seconds = String(summary.seconds % 60).padStart(2, "0");

  return (
    <main id="game-root">
      <canvas id="game-canvas" ref={canvasRef} aria-label="Трёхмерный мир игры Тихая зона" />
      <div className="cinematic-vignette" />

      <div id="ui-overlay">
        {state === "title" && (
          <section className="title-screen">
            <div className="title-topline">
              <span>ОПЫТНАЯ СТАНЦИЯ · 2003</span>
              <button className="icon-button glass" onClick={() => gameCommand("mute")} aria-label={muted ? "Включить звук" : "Выключить звук"}>
                {muted ? <VolumeX /> : <Volume2 />}
              </button>
            </div>
            <div className="title-content">
              <p className="eyebrow"><span /> атмосферный 3D‑прототип</p>
              <h1>ТИХАЯ<br />ЗОНА</h1>
              <p className="title-subtitle">Маленький мир. Большие открытия.</p>
              <p className="title-description">Тёплый осенний вечер в старом научном городке.<br />Прогуляйтесь по двору и загляните в гараж № 17.</p>
              <button className="primary-button" onClick={() => gameCommand("start")}>
                <span>Исследовать район</span><ArrowRight />
              </button>
              <p className="start-hint">или нажмите <kbd>Space</kbd></p>
            </div>
            <div className="title-footer">
              <span>THREE.JS · WEBGL</span>
              <span className="title-footer-line" />
              <span>17:42 · ОКТЯБРЬ</span>
            </div>
          </section>
        )}

        {(state === "playing" || state === "paused") && (
          <header className="game-topbar">
            <div className="location-chip glass"><span className="location-dot" /><MapPin /><span>{location}</span></div>
            <div className="topbar-right">
              <div className="time-chip glass"><Clock3 /><span>17:42 · ОКТЯБРЬ</span></div>
              <button className="icon-button glass" onClick={() => gameCommand("mute")} aria-label={muted ? "Включить звук" : "Выключить звук"}>
                {muted ? <VolumeX /> : <Volume2 />}
              </button>
              <button className="icon-button glass" onClick={() => gameCommand("pause")} aria-label="Пауза"><Pause /></button>
            </div>
          </header>
        )}

        {state === "playing" && <div className="crosshair"><span /></div>}

        {state === "playing" && interaction && (
          <div className="interaction-prompt glass"><kbd>E</kbd><span>{interaction.replace(/^E — /, "")}</span></div>
        )}

        {state === "playing" && showHint && (
          <div className="controls-hint glass">
            <div><span className="key-group"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span>движение</span></div>
            <div><MousePointer2 /><span>осмотр</span></div>
            <div><kbd>Shift</kbd><span>быстрый шаг</span></div>
            <div><kbd>Space</kbd><span>прыжок</span></div>
            <div><kbd>Esc</kbd><span>пауза</span></div>
          </div>
        )}

        {toast && state === "playing" && <div className="toast glass"><Footprints /><span>{toast}</span></div>}

        {state === "paused" && (
          <section className="modal-backdrop">
            <div className="modal-card pause-card">
              <p className="eyebrow"><span /> вечер продолжается</p>
              <h2>Пауза</h2>
              <p>За окном шелестят листья. Можно не торопиться.</p>
              <div className="modal-actions">
                <button className="primary-button" onClick={() => gameCommand("resume")}><Play /><span>Продолжить</span></button>
                <button className="secondary-button" onClick={() => gameCommand("restart")}><RotateCcw /><span>Начать с гаража</span></button>
                <button className="text-button" onClick={() => gameCommand("summary")}>Завершить прогулку</button>
                <button className="text-button dim" onClick={() => gameCommand("title")}>Вернуться на главный экран</button>
              </div>
            </div>
          </section>
        )}

        {state === "summary" && (
          <section className="modal-backdrop">
            <div className="modal-card summary-card">
              <p className="eyebrow"><span /> прогулка завершена</p>
              <h2>Вечер в тихой зоне</h2>
              <p>Некоторые места хочется не просто исследовать.<br />В них хочется остаться.</p>
              <div className="summary-stats">
                <div><span>ВРЕМЯ В РАЙОНЕ</span><strong>{minutes}:{seconds}</strong></div>
                <div><span>ПОСЛЕДНЯЯ ТОЧКА</span><strong>{summary.location}</strong></div>
              </div>
              <div className="modal-actions horizontal">
                <button className="primary-button" onClick={() => gameCommand("restart")}><RotateCcw /><span>Ещё одна прогулка</span></button>
                <button className="secondary-button" onClick={() => gameCommand("title")}>На главный экран</button>
              </div>
              <p className="start-hint">Нажмите <kbd>Space</kbd>, чтобы начать заново</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
