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

// ---- TYPY DANYCH ----

// Typy obiektów wojskowych, które będziemy pobierać z OpenStreetMap
// Dzięki TypeScript możemy jasno określić, jakie wartości są dozwolone
type MilitaryType =
  | "barracks"
  | "naval_base"
  | "airfield"
  | "training_area"
  | "yes"
  | "range"
  | "primary"
  | "office"
  | "danger_area"
  | "checkpoint"
  | "shelter"
  | "bunker";

// Typ dla danych GeoJSON (osmtogeojson zwraca obiekt zgodny ze specyfikacją GeoJSON)
type GeoJSONData = GeoJSON.FeatureCollection;

// ---- LISTA TYPÓW ----
// Tablica dostępnych typów obiektów wojskowych
const MILITARY_TYPES: MilitaryType[] = [
  "barracks",
  "naval_base",
  "airfield",
  "training_area",
  "yes",
  "range",
  "primary",
  "office",
  "danger_area",
  "checkpoint",
  "shelter",
];

// ---- ETYKIETY ----
// Mapowanie typów obiektów na czytelne etykiety w języku polskim
const MILITARY_LABELS: Record<MilitaryType, string> = {
  barracks: "Koszary",
  naval_base: "Baza morska",
  airfield: "Lotnisko wojskowe",
  training_area: "Poligon",
  yes: "Obiekt wojskowy",
  range: "Strzelnica / teren ćwiczeń",
  primary: "Obiekt główny",
  office: "Biuro wojskowe",
  danger_area: "Strefa niebezpieczna",
  checkpoint: "Punkt kontrolny",
  shelter: "Schron",
  bunker: "Bunkier",
};

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

  // ---- FUNKCJA POBIERANIA DANYCH ----
  const fetchData = async (type: MilitaryType) => {
    setLoading(true); // pokaż loader
    setData(null);    // usuń starą warstwę natychmiast

    // Zapytanie w języku Overpass QL (specjalny język do pobierania danych z OpenStreetMap)
    const query = `
      [out:json][timeout:60];
      area["ISO3166-1"="DE"]->.a;
      (
        way["military"="${type}"](area.a);
        relation["military"="${type}"](area.a);
      );
      out geom;
    `;

    // Tworzymy URL do API Overpass
    const url =
      "https://overpass.kumi.systems/api/interpreter?data=" +
      encodeURIComponent(query);

    try {
      // Pobieramy dane z API
      const res = await axios.get(url);

      // Konwertujemy dane OSM na GeoJSON
      const geojson: GeoJSONData = osmtogeojson(res.data);

      // Zapisujemy dane w stanie
      setData(geojson);
    } catch (e) {
      console.error("Błąd Overpass:", e);
    } finally {
      setLoading(false); // ukryj loader
    }
  };

  // ---- useEffect: pobieranie danych przy zmianie typu ----
  useEffect(() => {
    fetchData(militaryType);
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
