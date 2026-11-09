# Hinweise an einzelnen Abfahrten

Stand: PWA 0.6.4, 9. November 2026. Native Wear 0.6.1 / Code 21 bleibt unverändert.

## Später gemeldete Zeitprognose

Der Monitor zeigt dezent **Zeit korrigiert · ca. +N Min.**, in kleinen Reise-Kacheln **ca. +N′ neu**. Verglichen werden absolute Prognosezeiten, nicht die herunterzählenden Minuten. Der Tooltip nennt alte und neue Uhrzeit in Europe/Vienna. Der Hinweis ist neutral, ohne Warnfarbe, Warnsymbol, Unterbrechung oder Benachrichtigung. Eine Korrektur beweist weder eine Störung noch deren Ursache.

Eine Zuordnung erfolgt nur bei gleicher numerischer RBL, Linie, Richtung, Verkehrsart und gültiger geplanter Abfahrtszeit. Beide Antworten müssen Live-Zeiten enthalten, höchstens 90 Sekunden alt sein und nicht mehr als 30 Sekunden in der Zukunft liegen. Der zweite Abruf muss neuer sein; die absolute Zeitverschiebung muss mindestens 30 Sekunden betragen. Die Minutenanzeige ist gerundet und als ungefähr beschriftet. Die Übernahme vom Fahrplan zur ersten Live-Prognose wird nicht als Änderung angezeigt.

Eine neue Zugabfahrt, fehlende Planzeit, mehrdeutige Plan-Slots und ein aus JSON geladener Start-Cache bleiben unmarkiert. Nach Seitenstart werden zunächst zwei frische Antworten benötigt. Der Hinweis hält höchstens zwei Minuten, unveränderte Folgeantworten verlängern diese Frist nicht; eine frühere neue Prognose entfernt ihn. Veraltete Daten oder Abruffehler unterdrücken den Hinweis sofort. WeakSet/WeakMap-Metadaten existieren nur im Arbeitsspeicher der aktuellen Seite und gelangen nicht in Cache-JSON, Export, Diagnose oder Backend.

## Rollstuhl-Symbol

Ein kleines Rollstuhl-Symbol mit zugänglicher Beschriftung kennzeichnet ein laut Wiener Linien **barrierefreies Fahrzeug**. `departure.vehicle.barrierFree` überschreibt die Vorgabe `line.barrierFree`; fehlt das Fahrzeugfeld, gilt die dokumentierte Linienvorgabe. Nur ein echtes Boolean `true` wird positiv dargestellt. `false`, fehlende oder malformed Angaben, alte Daten und Abruffehler bleiben unmarkiert. Ein fehlendes Symbol ist keine Aussage über fehlende Barrierefreiheit.

Jede der beiden sichtbaren Abfahrten erhält ihre eigene Markierung. Aus dem Fahrzeugfeld folgt keine Aussage über Aufzüge, Bahnsteigzugänge, Station oder vollständigen Reiseweg. Diese Grenze steht auch im Tooltip. Alte Cache-Einträge ohne nachvollziehbare Feldquelle werden erst nach einem neuen API-Abruf markiert.

## Quelle und Umsetzung

Primärquelle: [Wiener-Linien-Echtzeitdaten-Dokumentation, Version 1.4, Stand 9. Februar 2026](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf). Die Abschnitte `monitors.lines`, `departureTime` und `departure.vehicle` definieren `barrierFree`, `timePlanned`, `timeReal` sowie die Übernahme abweichender Fahrzeugwerte. Es gibt darin keine für diese Zuordnung garantierte eindeutige Fahrt-ID; deshalb wird konservativ nur ein eindeutiger Plan-Slot innerhalb der laufenden Sitzung verglichen.

Parser: `pwa/src/core.mjs`. Kurzlebiger Vergleich: `departure-cache.mjs`. Gemeinsame Beschriftung/SVG: `departure-indicators.mjs`. Die Markierung wird in Nähe, Favoriten, Vollbild-Verbindung, Folgeabfahrten sowie Reise- und Stationsdetails verwendet. Die vorhandenen 30-Sekunden-/24-RBL-Grenzen bleiben erhalten; keine zusätzliche Abfrage und kein Hintergrundbetrieb.

`tests/departure-indicators.test.mjs` prüft tatsächliche Parser-/Cache-/Markup-Ketten, einschließlich Fahrzeug-Overrides, unbekannter Werte, nächstem Zug, Cold-Start, Frische/Zukunftsgrenzen, Duplikaten, Ablauf und Fehlerunterdrückung. UI-Abnahme und aktueller Teststand stehen in [tests.md](tests.md).
