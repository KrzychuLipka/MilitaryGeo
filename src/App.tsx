// MapContainer – główny kontener mapy
// TileLayer – warstwa kafelków
// useMap – hook pozwalający uzyskać dostęp do instancji mapy
import { MapContainer, TileLayer, useMap } from "react-leaflet";

// Hook w React to specjalna funkcja, która pozwala „podłączyć się” do mechanizmów Reacta (np. stan, cykl życia komponentu) 
// bez używania klas. Dzięki nim możemy pisać wszystko w prostych komponentach funkcyjnych.

// Importujemy hook useEffect z Reacta.
// useEffect pozwala uruchamiać kod w odpowiedzi na zmiany danych lub przy montowaniu komponentu.
import { useEffect } from "react";

// Importujemy plik CSS z biblioteki leaflet.
// Dzięki temu mapa będzie wyglądała poprawnie (style, ikony, itd.).
import "leaflet/dist/leaflet.css";

import MilitaryOSMLayer from "./MilitaryLayer";

// Tworzymy komponent SetView.
// Komponenty w React to funkcje, które zwracają fragment UI (lub wykonują logikę).
// Tutaj SetView nie zwraca żadnego widocznego elementu, ale zmienia widok mapy.
function SetView({ center, zoom }: { center: [number, number]; zoom: number }) {
  // useMap daje nam dostęp do obiektu mapy (instancji Leaflet).
  const map = useMap();

  // useEffect uruchomi się za każdym razem, gdy zmieni się center lub zoom.
  // Dzięki temu mapa będzie przesuwana/skalowana do nowych wartości.
  useEffect(() => {
    // setView ustawia środek mapy (center) i poziom powiększenia (zoom).
    map.setView(center, zoom);
  }, [map, center, zoom]); // <- lista zależności: jeśli zmieni się map, center lub zoom, efekt się uruchomi ponownie.

  // Ten komponent nie musi nic renderować (nie pokazuje żadnego HTML).
  // Zwracamy null, czyli "nic".
  return null;
}


// Tworzymy główny komponent aplikacji – App.
// W React każdy komponent może być "domyślnym eksportem" pliku.
// Dzięki temu możemy go używać w innych miejscach projektu.
export default function App() {
  // Definiujemy współrzędne środka mapy.
  // Typ [number, number] oznacza tablicę dwóch liczb: [szerokość geograficzna, długość geograficzna].
  // Tutaj ustawiamy środek Polski.
  const center: [number, number] = [52.069167, 19.480556];

  // Definiujemy poziom powiększenia mapy.
  // Im większa liczba, tym większe przybliżenie.
  const zoom = 7;

  // Każdy komponent React musi zwracać JSX (czyli coś w rodzaju HTML w JS).
  // JSX opisuje strukturę UI.
  return (
    // MapContainer to główny element mapy.
    // style={{ height: "100vh", width: "100vw" }} – ustawiamy mapę na pełny ekran (100% wysokości i szerokości okna).
    <MapContainer
      style={{ height: "100vh", width: "100vw" }}
    >
      {/* Dodajemy nasz komponent SetView, który ustawi widok mapy na center i zoom */}
      <SetView center={center} zoom={zoom} />

      {/* TileLayer to warstwa kafelków mapy.
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          – to adres serwera OpenStreetMap, który dostarcza obrazki mapy.
          {s} – subdomena,
          {z} – poziom zoomu,
          {x} i {y} – współrzędne kafelka.
      */}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MilitaryOSMLayer />
    </MapContainer>
  );
}
