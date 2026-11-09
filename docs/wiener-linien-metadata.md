# Wiener-Linien-Metadaten: Prüfung am 07.11.2026

Echte Antwort von `/api/monitor?stopId=4111` (Stephansplatz U1 → Leopoldau), API-Serverzeit `2026-11-07T13:39:59.000+0100`. Die Relay-Antwort enthält unverändert die offiziellen Verkehrsdaten. Keine Beispieldaten im Produkt.

| In der echten Antwort vorhanden | Möglicher Nutzen |
|---|---|
| `timePlanned`, `timeReal`, `countdown` | Prognose, Fahrplan, daraus berechnete Verspätung/Verfrühung |
| `platform`, `gate`, `towards`, `direction`, `richtungsId` | Konkreter Steig und Fahrtrichtung |
| `vehicle.barrierFree` | Fahrzeug-Zugänglichkeit |
| `vehicle.foldingRamp` | Vorhandene Klapprampe |
| `vehicle.cooling` | Vorhandene Klimatisierung |
| `vehicle.onStop` | U-Bahnzug steht aktuell an der Haltestelle; im Sample nur bei einer Abfahrt befüllt |
| `realtimeSupported` | Ob Echtzeit prinzipiell unterstützt wird; allein noch kein Nachweis einer aktuellen Prognose |
| `trafficjam` | Flag für Stau in der Zufahrt |
| `lineId` / `vehicle.linienId` | Stabile Linienkennung |
| `message.serverTime` | Quellzeit zur Alters-/Cacheprüfung |
| `locationStop.geometry.coordinates` | Haltepunktkoordinaten; keine Fahrzeugposition |

Einzelne Fahrzeugwerte können von Linienwerten abweichen. Fehlendes Feld bedeutet unbekannt, nicht automatisch `false`. Fahrzeug-Zugänglichkeit allein bestätigt keinen barrierefreien Stationszugang. Die untersuchte Antwort enthält keine Auslastungsangabe.

Laut [offizieller Schnittstellendokumentation V1.6, 19.10.2026](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf) sind zusätzlich Störungs-, Aufzugs- und Fahrtreppenmeldungen möglich. Einige Kategorien sind standardmäßig aktiv, andere lassen sich über `activateTrafficInfo` anfordern. Im Sample waren keine Meldungen enthalten. Der aktuelle feste Relay akzeptiert weiterhin nur StopIDs; keine zusätzlichen Endpunkte oder Abrufzyklen wurden für diese Recherche eingebaut.

Priorität für eine spätere kompakte Anzeige: Steig, aus Zeitwerten berechnete Abweichung, danach vorhandene Fahrzeug-Zugänglichkeitsmerkmale. Der Prüfauftrag fügt diese Zusatzmerkmale noch nicht als neue Produktanzeigen hinzu.

## Umsetzung v0.1.5

Offizielle Betriebsmeldungen werden jetzt als Klartext angezeigt: stoerunglang/stoerungkurz, Aufzug/Fahrtreppe, information. Der feste Monitorabruf aktiviert diese Kategorien. Relevante linienweite Meldungen aus dem offiziellen trafficInfoList-Feed werden serverseitig mit 120 Sekunden Cache ergänzt. Gegen echte aktuelle Bauarbeitsmeldungen geprüft; keine Mustertexte als Betriebsdaten. Status resolved und vergangenes Ende entfernen Meldungen; zukünftiger Start als geplant, unbekannter Status bleibt ohne gesicherte Aktivitätsbehauptung. Direkte StopIDs/Monitorreferenzen unterscheiden Haltestellen- von Linienhinweisen.

## Adressen ab 0.5.0

Der WL-Katalog enthält Haltepunktkoordinaten, aber keine verifizierten postalischen Hausnummern. Deshalb getrennte Ableitung pwa/data/station-addresses.json aus dem amtlichen Stadt-Wien-WFS ZUGANGSADROGD. Vollständige 151.577 Zugangsadressen, zwei Seiten (100.000 + 51.577), 1.748 Zuordnungen innerhalb von 100 m. Entfernung und Quelle immer sichtbar. Weder Privat-GPS noch Navigationsziel werden dafür übertragen oder verändert. Reproduktion: scripts/prepare_station_addresses.py mit den beiden vollständigen WFS-Seiten; Rohdaten werden nicht veröffentlicht.

## Abdeckung des aktuellen Imports · 09.11.2026

Der gebündelte Wiener-Linien-GTFS-Import belegt derzeit Stations-/Linienzuordnungen aus tatsächlichen Fahrgastfahrten. `pwa/data/stops.json` enthält keine vollständigen Abfahrtskalender oder Sollzeiten. Die Monitoransichten verwenden API-Zeiten und einen begrenzten lokalen Cache. Ohne geladene aktuelle API-Daten kann eine bekannte Linie deshalb noch ohne Zeiten erscheinen; das ist kein Nachweis einer Betriebspause.

Ein echter Wiener-Linien-Sollfahrplan als Fallback für PWA und Uhr ist noch offen: Abfahrten je Station/Richtung, gültige Verkehrstage und Ausnahmen einlesen, Gültigkeit/Änderungen pflegen und Sollzeiten sichtbar von Live-Prognosen trennen. Der vorbereitete ÖBB-Adapter ist eine getrennte Importmöglichkeit; die ausgelieferte `pwa/data/rail.json` enthält derzeit keine Fahrplanabfahrten. Der reine Katalognachweis ersetzt diesen offenen Arbeitsschritt nicht.
