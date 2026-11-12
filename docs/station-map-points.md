# Stationspunkte auf der Standortkarte

PWA 0.11.26, 12. November 2026. Aufruf: Dein Standort → Standort & Haltestellen. Antippen eines Linienlabels oder seines Punktes öffnet weiterhin Stationsname, Linien, Adresse, Fußweg und die beiden getrennten Favoritenaktionen.

## Befund und Änderung

Das alte einzeilige Icon war 44 CSS-Pixel hoch, aber bei y = 54 verankert. Der mittig gesetzte Linienbadge lag dadurch 32 CSS-Pixel über dem geografischen Punkt, ohne sichtbaren Punkt oder Verbindung. Bei großen Linienrastern wuchs dieser Abstand. Zusätzlich unterscheiden sich die alten gruppierten OGD-Katalogkoordinaten von physischen Plattformkoordinaten des bereits importierten offiziellen GTFS.

Das Icon zeigt jetzt einen zwölf Pixel großen weiß umrandeten Haltepunkt mit kurzer Verbindung zum Linienraster. Sein Mittelpunkt liegt exakt auf dem Leaflet-Koordinatenanker, unabhängig von der Anzahl der Badgezeilen. Einzelmarker behalten 44 × 44 CSS-Pixel Tippfläche; Umsteigestationen zeigen weiterhin alle aktivierten Kataloglinien in maximal vier Spalten.

| Station | Alter Katalogpunkt (Breite, Länge) | Verwendeter Plattformpunkt am 12.11.2026 |
| --- | --- | --- |
| Giefinggasse | 48.2680427, 16.4260184 | 48.267875, 16.426297 |
| Paukerwerkstraße | 48.2697528, 16.4266652 | 48.269681, 16.426665 |

## Datenvertrag

`scripts/prepare_station_map_points.py` leitet den öffentlichen Index ausschließlich aus den vorhandenen Linienpaketen ab und prüft deren SHA-256 gegen die Linienübersicht. Alle Pakete müssen Version und Quelldigest des installierten Fahrplans besitzen. Der reguläre Linienkartenimport erzeugt denselben Index automatisch.

`pwa/data/station-map-points.json` enthält 1.694 exakt zugeordnete Stationen mit physischen Punkten, Linien/Verkehrsmitteln und Dienstkalendern. Datenquelle und Lizenz bleiben die des vorhandenen offiziellen GTFS: Stadt Wien/Wiener Linien, CC BY 4.0. Es werden weder OSM-Pixel noch Namensähnlichkeit oder räumliche Nähe zur Verbindung verschiedener Stationen verwendet.

Zur Anzeige wird der dem bisherigen Katalogpunkt nächste physische Punkt gewählt, der am aktuellen Wiener Kalendertag zu einer aktivierten Stationslinie und demselben Verkehrsmittel gehört. Bei mehreren Plattformen wird ein repräsentativer echter Punkt angezeigt; die Ansicht bleibt eine gruppierte Stationsübersicht, keine vollständige Darstellung aller Gegenrichtungssteige. Kein künstlicher Mittelwert zwischen Straßenseiten.

Fehlender, abgelaufener, nicht passender oder nicht verfügbarer Index verwendet den bisherigen Katalogpunkt. Der optionale statische Abruf ist auf 2,5 Sekunden begrenzt und gehört zum Offline-Shellcache. Nach geschlossenem Dialog, neuer Zeichnung oder verborgenem Dokument entsteht keine verspätete Karte. Keine zusätzlichen Live-Monitor-/Fahrzeugabfragen; Gehzeit-/Katalogbasis, Favoriten, Geräteposition und Wear-APK bleiben erhalten.

## Automatisierte Abnahme

498 Web-/Server-Tests, 19 Python-Prüfungen und 89 JavaScript-Syntaxprüfungen bestanden. Neue Regressionen prüfen die realen beiden Stationen, genaue Stationsidentität, gleichnamige Linien verschiedener Modi, aktive/fehlende/abgelaufene Diensttage, fehlende/ungültige Koordinaten, nächsten echten Punkt statt Mittelwert, Digest-/Quellbindung und alle Floridsdorfer Linien. Die tatsächlichen Stationsfavoritenaktionen sowie vollständige Service-Worker-Offlineauslieferung bleiben geprüft.

Eine physische Android-GPS-/Stationsabnahme wird durch diese Prüfungen nicht behauptet. Die lokale Browservorschau lieferte trotz korrekt ausgewähltem Checkout die Oberfläche eines anderen Projekts; sie ist deshalb kein Renderingnachweis für diesen Stand. Öffentliche Browserprüfung nach Veröffentlichung separat dokumentieren.
