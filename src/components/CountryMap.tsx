"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { num, pct, type Named } from "@/lib/model";

type Point = [longitude: number, latitude: number];
type Country = { code: string; name: string; polygons: Point[][][] };
type MapShape = { code: string; name: string; path: Path2D };

const WIDTH = 900;
const NORTH = 85;
const SOUTH = -62;
const SCALE = WIDTH / 360;
const HEIGHT = Math.ceil((NORTH - SOUTH) * SCALE);
const regionNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });

type Viewport = { zoom: number; x: number; y: number };

const INITIAL_VIEW: Viewport = { zoom: 1, x: 0, y: 0 };
const MAX_ZOOM = 6;
const ZOOM_STEP = 1.5;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };

function clampPosition(view: Viewport): Viewport {
  return {
    ...view,
    x: Math.min(0, Math.max(WIDTH * (1 - view.zoom), view.x)),
    y: Math.min(0, Math.max(HEIGHT * (1 - view.zoom), view.y)),
  };
}

function zoomAt(view: Viewport, factor: number, point = CENTER): Viewport {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, view.zoom * factor));
  const ratio = zoom / view.zoom;
  return clampPosition({ zoom, x: point.x - (point.x - view.x) * ratio, y: point.y - (point.y - view.y) * ratio });
}

function mapPoint(element: HTMLCanvasElement, clientX: number, clientY: number) {
  const bounds = element.getBoundingClientRect();
  return {
    x: (clientX - bounds.left) / bounds.width * WIDTH,
    y: (clientY - bounds.top) / bounds.height * HEIGHT,
  };
}

function loadShapes(countries: Country[]): MapShape[] {
  return countries.filter(({ code }) => code !== "AQ").map(({ code, name, polygons }) => {
    const path = new Path2D();
    for (const polygon of polygons) {
      for (const ring of polygon) {
        ring.forEach(([longitude, latitude], index) => {
          const x = (longitude + 180) * SCALE;
          const y = (NORTH - latitude) * SCALE;
          if (index === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
        });
        path.closePath();
      }
    }
    return { code, name: /^[A-Z]{2}$/.test(code) ? regionNames.of(code) ?? name : name, path };
  });
}

export function CountryMap({ rows, selected, onSelect }: {
  rows: Named[];
  selected: string | null;
  onSelect: (country: string | null) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<MapShape[] | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [pointed, setPointed] = useState<string | null>(null);
  const [view, setView] = useState(INITIAL_VIEW);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointerId: number; clientX: number; clientY: number; view: Viewport; moved: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/world-countries.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("World map unavailable");
        return response.json() as Promise<Country[]>;
      })
      .then((countries) => {
        if (!controller.signal.aborted) setShapes(loadShapes(countries));
      })
      .catch(() => {
        if (!controller.signal.aborted) setMapUnavailable(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const element = canvas.current;
    if (!element || !shapes) return;
    const onWheel = (event: WheelEvent) => {
      if ((!event.ctrlKey && !event.metaKey) || !event.deltaY) return;
      event.preventDefault();
      setPointed(null);
      const point = mapPoint(element, event.clientX, event.clientY);
      setView((current) => zoomAt(current, event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, point));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [shapes]);

  const byName = useMemo(() => new Map(shapes?.map((shape) => [shape.name, shape.code])), [shapes]);
  const countries = useMemo(() => rows.map((row) => ({ ...row, key: row.code ?? byName.get(row.name) ?? row.name })), [rows, byName]);
  const counts = useMemo(() => new Map(countries.map((row) => [row.key, row.count])), [countries]);
  const max = Math.max(1, ...countries.map((row) => row.count));
  const total = countries.reduce((sum, row) => sum + row.count, 0);
  const active = pointed ?? byName.get(selected ?? "") ?? selected;
  const activeRow = countries.find((row) => row.key === active);
  const activeCountry = activeRow?.name ?? shapes?.find((shape) => shape.code === active)?.name;

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context || !shapes) return;
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.save();
    context.setTransform(view.zoom, 0, 0, view.zoom, view.x, view.y);
    for (const { code, path } of shapes) {
      const count = counts.get(code) ?? 0;
      context.fillStyle = count > 0 ? `rgba(212, 196, 255, ${0.32 + 0.66 * Math.sqrt(count / max)})` : "#34302f";
      context.fill(path, "evenodd");
      context.strokeStyle = "#151311";
      context.lineWidth = 0.65 / view.zoom;
      context.stroke(path);
    }
    const highlighted = shapes.find((shape) => shape.code === active);
    if (highlighted) {
      context.strokeStyle = "#fff4dc";
      context.lineWidth = 1.8 / view.zoom;
      context.stroke(highlighted.path);
    }
    context.restore();
  }, [shapes, counts, max, active, view]);

  function countryAt(event: PointerEvent<HTMLCanvasElement>) {
    const context = canvas.current?.getContext("2d");
    if (!context || !shapes) return null;
    const point = mapPoint(event.currentTarget, event.clientX, event.clientY);
    const x = (point.x - view.x) / view.zoom;
    const y = (point.y - view.y) / view.zoom;
    return shapes.find(({ path }) => context.isPointInPath(path, x, y, "evenodd"))?.code ?? null;
  }

  function movePointer(event: PointerEvent<HTMLCanvasElement>) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) {
      setPointed(countryAt(event));
      return;
    }
    const dx = event.clientX - start.clientX;
    const dy = event.clientY - start.clientY;
    if (!start.moved && Math.hypot(dx, dy) < 4) return;
    start.moved = true;
    if (start.view.zoom <= 1) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setDragging(true);
    setPointed(null);
    setView(clampPosition({
      ...start.view,
      x: start.view.x + dx * WIDTH / bounds.width,
      y: start.view.y + dy * HEIGHT / bounds.height,
    }));
  }

  function finishPointer(event: PointerEvent<HTMLCanvasElement>) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.type !== "pointerup" || start.moved || Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) >= 4) return;
    const code = countryAt(event);
    const row = countries.find((item) => item.key === code);
    const key = row ? row.code ?? row.name : code;
    setPointed(null);
    onSelect(selected === key ? null : key);
  }

  function changeZoom(factor: number) {
    setPointed(null);
    setView((current) => zoomAt(current, factor));
  }

  return (
    <div className="country-map">
      {mapUnavailable ? <p className="empty">Map unavailable. Country counts are available in the table.</p> : (
        <>
          <div className="country-map-controls" role="group" aria-label="Map controls">
            <button type="button" className="ghost" aria-label="Zoom in" disabled={!shapes || view.zoom === MAX_ZOOM} onClick={() => changeZoom(ZOOM_STEP)}>+</button>
            <button type="button" className="ghost" aria-label="Zoom out" disabled={!shapes || view.zoom === 1} onClick={() => changeZoom(1 / ZOOM_STEP)}>−</button>
            <button type="button" className="ghost" disabled={view.zoom === 1} onClick={() => {
              setPointed(null);
              setView(INITIAL_VIEW);
            }}>Reset map</button>
            <span className="caption">Drag to move · Ctrl/⌘ + scroll to zoom</span>
          </div>
          <canvas
            ref={canvas}
            width={WIDTH}
            height={HEIGHT}
            role="img"
            tabIndex={0}
            aria-label="World map of visitors by country"
            className={dragging ? "dragging" : view.zoom > 1 ? "zoomed" : undefined}
            onPointerMove={movePointer}
            onPointerLeave={() => setPointed(null)}
            onPointerDown={(event) => {
              if (!shapes || event.button !== 0 || drag.current) return;
              drag.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, view, moved: false };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={finishPointer}
            onPointerCancel={finishPointer}
            onLostPointerCapture={finishPointer}
            onKeyDown={(event) => {
              if (event.key === "+" || event.key === "=" || event.key === "-") {
                event.preventDefault();
                changeZoom(event.key === "-" ? 1 / ZOOM_STEP : ZOOM_STEP);
              } else if (view.zoom > 1 && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
                event.preventDefault();
                const x = event.key === "ArrowLeft" ? 40 : event.key === "ArrowRight" ? -40 : 0;
                const y = event.key === "ArrowUp" ? 40 : event.key === "ArrowDown" ? -40 : 0;
                setPointed(null);
                setView((current) => clampPosition({ ...current, x: current.x + x, y: current.y + y }));
              }
            }}
          />
        </>
      )}
      {!shapes && !mapUnavailable ? <p className="caption" role="status">Loading world map…</p> : null}
      <p className="country-map-selection" aria-live="polite">
        {activeCountry ? <><strong>{activeCountry}</strong> · {activeRow
          ? `${num(activeRow.count)} ${activeRow.count === 1 ? "visitor" : "visitors"} · ${pct(total ? activeRow.count / total : 0)} of reported country counts`
          : "No data in this report"}</> : "Select a country on the map or in the table."}
      </p>
    </div>
  );
}
