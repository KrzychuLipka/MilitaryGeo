// Importujemy hooki z Reacta:
// - useEffect: pozwala uruchamiać dodatkowy kod po wyrenderowaniu komponentu lub gdy zmieniają się dane
// - useState: pozwala komponentowi zapamiętać stan (np. wybrany typ obiektu wojskowego)
// - useRef: pozwala przechowywać referencję do elementu (np. warstwy GeoJSON)
import { useEffect, useState, useRef } from "react";

// Importujemy komponent GeoJSON i hook useMap z react-leaflet:
// - GeoJSON: pozwala wyświetlać dane geograficzne w formacie GeoJSON na mapie
// - useMap: daje dostęp do instancji mapy Leaflet
import { GeoJSON, useMap } from "react-leaflet";

// Importujemy axios – bibliotekę do wykonywania zapytań HTTP (np. pobierania danych z API)
import axios from "axios";

// Importujemy osmtogeojson – konwertuje dane OpenStreetMap (OSM) na format GeoJSON
import osmtogeojson from "osmtogeojson";

import { MILITARY_TYPES, MILITARY_LABELS } from "./constants/military";
import type { MilitaryType, GeoJSONData } from "./types/military";

// ---- KOMPONENT GŁÓWNY ----
export default function MilitaryOSMLayer() {
  // militaryType – aktualnie wybrany typ obiektu wojskowego
  const [militaryType, setMilitaryType] = useState<MilitaryType>("barracks");

  // data – przechowuje pobrane dane w formacie GeoJSON
  const [data, setData] = useState<GeoJSONData | null>(null);

  // loading – informacja, czy trwa pobieranie danych
  const [loading, setLoading] = useState<boolean>(false);

  // layerRef – referencja do warstwy GeoJSON, aby móc np. ustawić widok mapy na jej granice
  const layerRef = useRef<L.GeoJSON | null>(null);

  // map – dostęp do instancji mapy Leaflet
  const map = useMap();

  // cache na wszystkie typy
  const cacheRef = useRef<Record<MilitaryType, GeoJSONData | null>>({});

  const fetchLayer = async (type: MilitaryType) => {
    const query = `
    [out:json][timeout:60];
    area["ISO3166-1"="PL"]->.a;
    (
      way["military"="${type}"](area.a);
      relation["military"="${type}"](area.a);
    );
    out geom;
  `;

    const url =
      "https://overpass.kumi.systems/api/interpreter?data=" +
      encodeURIComponent(query);

    const res = await axios.get(url);
    return osmtogeojson(res.data);
  };

  // Współbieżne pobranie wszystkich warstw
  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setLoading(true);

      const promises = MILITARY_TYPES.map(async (type) => {
        const geo = await fetchLayer(type);
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

  // ---- useEffect: pobieranie danych przy zmianie typu ----
  useEffect(() => {
    const cached = cacheRef.current[militaryType];
    if (cacheRef) {
      setData(cached);
    }
  }, [militaryType]);

  // ---- useEffect: dopasowanie widoku mapy do danych ----
  useEffect(() => {
    if (!data || !layerRef.current) return;

    // Obliczamy granice warstwy GeoJSON
    const bounds = layerRef.current.getBounds();

    // Jeśli granice są poprawne, dopasowujemy widok mapy
    if (bounds.isValid()) {
      map.fitBounds(bounds, { animate: true });
    }
  }, [data, map]);

  // ---- RENDEROWANIE ----
  return (
    <>
      {/* ---- LOADER ---- */}
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

      {/* ---- PRZYCISKI ---- */}
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
          marginLeft: "48px"
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
          Typ obiektu wojskowego:
        </div>

        {/* Generujemy przyciski dla każdego typu */}
        {MILITARY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setMilitaryType(type)} // zmiana typu
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

      {/* ---- WARSTWA GEOJSON ---- */}
      {data && (
        <GeoJSON
          key={militaryType} // wymusza przeładowanie warstwy przy zmianie typu
          data={data}        // dane GeoJSON
          ref={layerRef}     // referencja do warstwy
          style={() => ({
            color: "#ff0000",     // kolor linii
            weight: 6,            // grubość linii
            opacity: 1,           // intensywność koloru
            fillColor: "#ff0000", // kolor wypełnienia
            fillOpacity: 0.45,    // przezroczystość wypełnienia
          })}
        />
      )}
    </>
  );
}
