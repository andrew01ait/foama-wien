# foama-wien – Branding v0.1.3

Master: `pwa/icons/foama-mark.svg`, originales Tram-Symbol in Mint/Navy. Header und Favicon verwenden dieselbe SVG; `python3 scripts/render_icons.py` rasterisiert sie mit PyMuPDF in 192-/512-Pixel-PNGs für das PWA-Manifest. Kritische Konturen liegen im zentralen Maskable-Sicherheitsbereich. Alte typografische f-/Punkt-Konstruktion entfernt.

## U-Bahn-Linienfarben

Die RGB-Füllfarben der Linienmarkierungen wurden aus dem offiziellen [Wiener-Linien-Netzplan 2026](https://www.wienerlinien.at/documents/2424499/7499660/2026_SVP_WC.pdf/3605d878-228d-3990-01d7-aff1ec3f7ddd?t=1768568035244) ausgelesen und den dortigen U1-/U2-/U3-/U4-/U6-Beschriftungen zugeordnet.

| Linie | Farbe | RGB/Hex |
|---|---|---|
| U1 | Rot | `#ED1C24` |
| U2 | Violett | `#A066AA` |
| U3 | Orange | `#F5821F` |
| U4 | Grün | `#00A068` |
| U6 | Braun | `#986A3A` |

`routeBadge` setzt ein normalisiertes `data-route`; CSS ordnet die konkrete Linie zu. Gilt für Abfahrtslisten, einzelne Favoriten, ganze Stationsfavoriten und Verbindungsauswahl. U5 ist im verwendeten Betriebsnetzplan nicht enthalten; es werden keine fiktiven U5-Abfahrten angelegt.

## Nachtlinien v0.1.5

Auf Nutzerwunsch: Nachtlinien mit N-Präfix (auch N30R usw.) erhalten dunkelblau `#162A63` mit weißem Text. Shared `.route-pill[data-route^="N"]` gilt für Stationsübersichten, Abfahrten, Favoriten und Verbindungsauswahl. Keine Änderung der offiziellen U-Bahn-Zuordnung.

## Städtecollage ab PWA 0.8.2

Die Seite Städte & Funktionen verwendet `pwa/images/foama-vier-staedte-v1.webp` als vollständiges proportionales Titelbild. Stadtwahrzeichen und Fahrzeuge sind eine dekorative Collage; sie stellen keinen tatsächlichen Linienverlauf dar. Das originale Foama-Logo bleibt separat unverändert. [Bildherkunft und Gestaltungsbrief](assets/foama-vier-staedte.md).
