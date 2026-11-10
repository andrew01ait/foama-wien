# Linienkarten und geschätzte Fahrzeugpositionen

Machbarkeitsprüfung vom 10. November 2026; noch keine veröffentlichte Funktion.

Der verifizierte aktuelle Wiener GTFS enthält `shape_id`, `shapes.txt`, geordnete `stop_sequence`, Ankunft/Abfahrt und `shape_dist_traveled`. Eine vollständige Linienkarte ist daher grundsätzlich möglich. Die bislang ausgelieferten stationsweisen Offlinepakete behalten diese Zusammenhänge nicht. Der neue Linienindex für Tagesfahrpläne listet Haltestellen ausdrücklich alphabetisch und ist kein Ersatz für eine Linienführung.

Empfohlener nächster Ausbau: beim Import ein separates versioniertes Linienpaket mit tatsächlichen Fahrtvarianten, Richtung, geordneter Haltefolge und Geometrie ableiten. Oberfläche Linie → Richtung → Variante mit Karte und Stationsliste. Kurzführungen und abweichende Äste getrennt behandeln. Fehlende Geometrie nur ausdrücklich schematisch darstellen. Bestehende lokale Leaflet-Komponenten können verwendet werden. Für regionale konkrete Fahrten ist außerdem der feste MOTIS-v6-Trip-Endpunkt mit Fahrtgeometrie/Zwischenhalten geeignet; das erfordert einen begrenzten Relay und eindeutige Fahrt-ID.

Fahrplanpositionen lassen sich zwischen den geplanten Halten entlang der konkreten Geometrie interpolieren. Darstellung nur als **Position nach Fahrplan · geschätzt**, vorzugsweise optional. Stau, Ausfall, Umleitung und verlängerte Halte werden damit nicht gemessen. Live-Prognosen dürfen nur bei sicher derselben Fahrt zur Korrektur dienen; die Wiener Monitorantwort garantiert dafür keine eindeutige Fahrt-ID. Keine Netzabfragen zur flächendeckenden Simulation, nur ausgewählte Linie und sichtbare Karte. Alte oder unklar zugeordnete Marker ausblenden.

Ein echter Fahrzeugstandort benötigt einen gesonderten Positionenfeed. Für unsere derzeitigen vier Stadtanbindungen ist ein solcher Feed nicht nachgewiesen. `vehicle.onStop` aus der Wiener Schnittstelle ist ein Stationsstatus, keine Fahrzeugkoordinate.

Quellen: [GTFS Schedule](https://gtfs.org/documentation/schedule/reference/), [Vehicle Positions](https://gtfs.org/documentation/realtime/feed-entities/vehicle-positions/), [MOTIS OpenAPI v2.10.2](https://raw.githubusercontent.com/motis-project/motis/refs/tags/v2.10.2/openapi.yaml), [Wiener-Linien-Realtime v1.6, 19.10.2026](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf).
