# foama – Branding v0.11.6

Master: `pwa/icons/foama-mark.svg`, die vom Nutzer gewählte Variante **Bahn + Schiene mit Lächeln**. Mintfarbene Kontur auf Navy, zwei helle Punkte als Augen und ein kleines Lächeln; kurzes Gleis mit zwei Schwellen. Als skalierbare native SVG umgesetzt, ohne Beschriftung oder Präsentationsrand. Header und Favicons verwenden denselben Master. `python3 scripts/render_icons.py` erzeugt die unversionierten 192-/512-Pixel-PNGs und passende versionierte Kopien gemäß `pwa/config.json`. Manifest, Apple-Touch-Icon, Offline-Shell und Benachrichtigungen verwenden die neuen Dateinamen, damit alte Caches das vorherige Logo nicht festhalten. Manifest-ID und Startadresse bleiben erhalten. Android bestimmt selbst, wann sich ein bereits installiertes Launcher-Symbol aktualisiert. Die Wear-APK 0.7.4 enthält weiterhin ihr bisheriges natives Symbol; dieser Release aktualisiert die PWA und Website.

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

Die Seite Städte & Funktionen verwendet `pwa/images/foama-vier-staedte-v1.webp` als vollständiges proportionales Titelbild. Stadtwahrzeichen und Fahrzeuge sind eine dekorative Collage; sie stellen keinen tatsächlichen Linienverlauf dar. Die separate App-Marke wird durch die Collage nicht ersetzt. [Bildherkunft und Gestaltungsbrief](assets/foama-vier-staedte.md).
