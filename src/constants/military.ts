import type { MilitaryType } from "../types/military";


export const MILITARY_TYPES: MilitaryType[] = [
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

export const MILITARY_LABELS: Record<MilitaryType, string> = {
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
