import { useEffect, useState, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";

import { MILITARY_TYPES, MILITARY_LABELS } from "./constants/military";
import type { MilitaryType, GeoJSONData } from "./types/military";

// ---- KOMPONENT GŁÓWNY ----
export default function MilitaryOSMLayer() {
  const [militaryType, setMilitaryType] = useState<MilitaryType>("barracks");
  const [data, setData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const layerRef = useRef<L.GeoJSON | null>(null);
  const map = useMap();

  // cache na wszystkie typy
  const cacheRef = useRef<Record<MilitaryType, GeoJSONData | null>>({} as any);

  // ---- NOWA FUNKCJA: pobieranie z lokalnych plików ----
  const fetchLocalLayer = async (type: MilitaryType) => {
    const url = `/data/${type}.json`; // zakładamy 1:1 nazwy plików
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Nie można załadować pliku: ${url}`);
    return (await res.json()) as GeoJSONData;
  };

  // ---- Współbieżne ładowanie wszystkich warstw z plików ----
  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setLoading(true);

      const promises = MILITARY_TYPES.map(async (type) => {
        const geo = await fetchLocalLayer(type);
        return { type, geo };
      });

      const results = await Promise.all(promises);

      if (!cancelled) {
        results.forEach(({ type, geo }) => {
          cacheRef.current[type] = geo;
        });

        setLoading(false);
        setData(cacheRef.current[militaryType] || null);
      }
    };

    loadAll();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Zmiana typu → pobranie z cache ----
  useEffect(() => {
    const cached = cacheRef.current[militaryType];
    if (cached) {
      setData(cached);
    }
  }, [militaryType]);

  // ---- Dopasowanie widoku mapy ----
  useEffect(() => {
    if (!data || !layerRef.current) return;

    const bounds = layerRef.current.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { animate: true });
    }
  }, [data, map]);

  // ---- RENDER ----
  return (
    <>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          Ładowanie: {MILITARY_LABELS[militaryType]}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 9999,
          background: "rgba(255,255,255,0.9)",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          width: "80vw",
          marginLeft: "48px",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
          Typ obiektu wojskowego:
        </div>

        {MILITARY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setMilitaryType(type)}
            style={{
              margin: "4px",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #555",
              background: type === militaryType ? "#c62828" : "#eee",
              color: type === militaryType ? "#fff" : "#000",
              cursor: "pointer",
            }}
          >
            {MILITARY_LABELS[type] || type}
          </button>
        ))}
      </div>

      {data && (
        <GeoJSON
          key={militaryType}
          data={data}
          ref={layerRef}
          style={() => ({
            color: "#ff0000",
            weight: 6,
            opacity: 1,
            fillColor: "#ff0000",
            fillOpacity: 0.45,
          })}
        />
      )}
    </>
  );
}
