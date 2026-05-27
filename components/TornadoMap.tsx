"use client";
import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Tornado } from "@/lib/types";
import { magLabel } from "@/lib/store";

const EF_COLOR: Record<number, string> = {
  [-9]: "#94a3b8",
  0: "#a3d977",
  1: "#fde047",
  2: "#fb923c",
  3: "#ef4444",
  4: "#b91c1c",
  5: "#581c87",
};

const MAX_MARKERS = 4000;

export default function TornadoMap({ rows }: { rows: Tornado[] }) {
  const sample = useMemo(() => {
    if (rows.length <= MAX_MARKERS) return rows;
    // Priority sample: keep all violent (>=EF3) + deadly, then fill with stride.
    const priority: Tornado[] = [];
    const rest: Tornado[] = [];
    for (const r of rows) {
      if (r.mag >= 3 || r.fat > 0) priority.push(r);
      else rest.push(r);
    }
    if (priority.length >= MAX_MARKERS) return priority.slice(0, MAX_MARKERS);
    const need = MAX_MARKERS - priority.length;
    const stride = Math.max(1, Math.ceil(rest.length / need));
    const filled: Tornado[] = [];
    for (let i = 0; i < rest.length && filled.length < need; i += stride) {
      filled.push(rest[i]);
    }
    return priority.concat(filled);
  }, [rows]);

  const dropped = rows.length - sample.length;

  return (
    <div className="relative h-[480px] rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <div className="mb-1 flex items-center justify-between px-1 text-sm font-semibold text-slate-700">
        <span>Tornado map</span>
        <span className="text-xs font-normal text-slate-500">
          {sample.length.toLocaleString()} plotted
          {dropped > 0 && ` (${dropped.toLocaleString()} sampled out — EF3+ and fatal events kept)`}
        </span>
      </div>
      <div className="h-[440px] overflow-hidden rounded">
        <MapContainer
          center={[39, -97]}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sample.map((r) => {
            const lat = r.slat || r.elat;
            const lon = r.slon || r.elon;
            if (!lat || !lon) return null;
            const radius = r.mag < 0 ? 2 : 2 + r.mag * 1.2;
            return (
              <CircleMarker
                key={r.id}
                center={[lat, lon]}
                radius={radius}
                pathOptions={{
                  color: EF_COLOR[r.mag] ?? "#94a3b8",
                  fillColor: EF_COLOR[r.mag] ?? "#94a3b8",
                  fillOpacity: 0.7,
                  weight: 1,
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold">
                      {magLabel(r.mag)} · {r.yr}-{String(r.mo).padStart(2, "0")}
                      -{String(r.dy).padStart(2, "0")} {r.tm}
                    </div>
                    <div>
                      {r.st}
                      {r.co.length ? ` — ${r.co.join(", ")}` : ""}
                    </div>
                    <div>
                      Deaths: <b>{r.fat}</b> · Injuries: <b>{r.inj}</b>
                    </div>
                    <div>
                      Path: {r.len.toFixed(1)} mi, width {r.wid} yd
                    </div>
                    {r.loss > 0 && <div>Loss: ${r.loss.toFixed(2)}M</div>}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
