# Linienkarten und geschätzte Fahrzeugpositionen

Konzeptstand 10.11.2026 nach Veröffentlichung der Willkommen-Seite in PWA 0.8.3. **A und B sind noch nicht implementiert.** Nutzerauftrag: Fahrzeugkonzept vor der Implementierung ausarbeiten. Eine interaktive Konzeptvorschau verwendet ausdrücklich Beispieldaten und ist kein Fahrzeugdienst.

## Geprüfte Grundlage

Der Wiener GTFS enthält `shape_id`, `shapes.txt`, geordnete `stop_sequence`, Ankunft/Abfahrt und `shape_dist_traveled`. Die ausgelieferten stationsweisen Offlinepakete behalten diese Zusammenhänge nicht. Der Linienindex für Tagesfahrpläne listet Haltestellen alphabetisch und ersetzt keine Linienführung. Separate versionierte Linienpakete aus dem Import sind daher der erste Schritt. Bestehende lokale Leaflet-Komponenten können verwendet werden.

Ein echter Fahrzeugstandort benötigt einen gesonderten Positionenfeed. Für unsere vier Stadtanbindungen ist ein solcher Feed nicht nachgewiesen. `vehicle.onStop` ist ein Stationsstatus, `locationStop.geometry` eine Haltepunktkoordinate. Auch sichere Fahrtzuordnung macht eine interpolierte Position nicht zur Messung.

## Datenprüfung am 10.11.2026

| Anbindung | Tatsächlich vorhanden | Konsequenz für B |
| --- | --- | --- |
| Wien / WL Monitor | Sollzeit, Abfahrtsprognose, Richtung, RBL und teilweise `onStop`; in der U1-Probe keine Fahrt-ID, Fahrzeugattribute leer | Fahrtzuordnung bleibt eine Schlussfolgerung. Linienname und erste Abfahrt einer Station reichen nicht für Fahrzeugidentität. |
| Graz / Transitous | Fixture mit `tripId`, `routeId`, `directionId`, Soll-/Prognosezeiten; teilweise `PROPAGATED` statt direkter Prognose | Gute Voraussetzung für einen Versuch mit derselben Fahrt. Herkunft einzelner Zeiten erhalten; `realTime=true` ist kein GPS-Nachweis. |
| Linz / EFA | Fixture enthält `attrs[name=AVMSTripID]` und Linien-/Richtungskennung | Kandidat für stabile Zuordnung. Bedeutung und Wiederverwendung über mehrere Stationen/Verkehrstage erst nachweisen; nicht ungeprüft Transitous-IDs gleichsetzen. |
| Salzburg / Transitous | Fahrtkennungen, untersuchte Daten mit `realTime=false` / `NO_RT_DATA`; App behandelt die Stadt bewusst als Fahrplan | Nur bewusst eingeschaltete Fahrplansimulation, keine livekorrigierte Position versprechen. |

Codeprüfung: `normalizeRegionalBoard` verwendet die Transitous-Fahrt-ID nur innerhalb der stationsgebundenen Anzeige-ID. Eigenes Fahrt-ID-Feld, Linien-ID, Richtung und Zeitbegründung fehlen. `normalizeLinzBoard` verwirft die AVMS-Kennung. Wiener Normalisierung verwirft Richtungsschlüssel und `onStop`. Bestehende Anzeige-IDs niemals als stationsübergreifende Fahrzeug-IDs verwenden; spätere Adapter ergänzen eigene Felder.

### Kleine echte U1-Probe, keine Genauigkeitsmessung

Zwei einmalige offizielle Monitorabfragen für Karlsplatz 4109, Stephansplatz 4111 und Schwedenplatz 4113, Richtung Leopoldau. Serverzeiten 10.11.2026 **13:27:40 und 13:28:46 Europe/Vienna**. Keine Nutzerposition, keine Hintergrundabfrage, kein neuer Dienst.

| Datensatz am Schwedenplatz | Erste Antwort | Zweite Antwort |
| --- | --- | --- |
| Geplante Abfahrt | 13:30:00 | 13:30:00 |
| Prognostizierte Abfahrt | 13:28:27 | 13:29:21 |

Diese Sollabfahrtsprognose verschob sich in 66 Sekunden um 54 Sekunden. Ein allein aus der ersten Antwort weiterfahrender Marker wäre schon an der Station vorbeigefahren, obwohl die zweite Antwort die Abfahrt noch in der Zukunft sieht. Das belegt die Notwendigkeit von Alter, Korrekturen und Abbruchregeln; es beweist weder Identität noch tatsächliche Position eines Zuges. Die erste Antwort meldete an zwei Stationen gleichzeitig einen Zug mit `onStop=true`. Der jeweils erste Listeneintrag darf deshalb nicht stationsübergreifend gleichgesetzt werden.

## A: gemeinsame Grundlage für Karte und Linienansicht

- Einstieg bei Linie und Linienfahrplan: **Linie ansehen**, dann direkt sichtbarer Umschalter **Karte / Linienansicht**. Stadt aus bestehendem Profil; keine konkurrierende Stadtwahl.
- Tatsächliche Linie, Modus, Richtung und Fahrtvariante verwenden. Gleiche Nummer bei Bus und Bahn ist keine gemeinsame Linie. Kurzführungen, Äste, Schleifen und abweichende Haltefolgen erhalten.
- Karte mit echter Fahrtgeometrie und antippbaren benannten Stationen in Fahrtfolge. Stationsdetails/Abfahrten öffnen; Haltepunkt und Stationsgruppe getrennt halten. Fehlende Geometrie ausdrücklich schematisch darstellen.
- Kleine Displays: vertikale Linienansicht, beide Richtungen als getrennte Spuren, lange Strecken in sichtbaren Abschnitten.
- Linienpaket je Fahrplanversion: Linien-/Fahrtkennung, Richtung, Kalender, geordnete Haltefolge, Ankunft/Abfahrt, Streckenentfernung und Geometrie. Keine Fahrtfolge aus alphabetischen Listen oder Mischung verschiedener Feedversionen.
- Regional liefert der feste MOTIS-v6-Trip-Endpunkt zu konkreten Fahrten Geometrie und Zwischenhalte. Das ersetzt keinen vollständigen Linienkatalog. Dafür ist ein begrenzter validierter Relay nötig, den die bisherige API noch nicht anbietet.

## B: bewegte Schätzung mit sichtbarer Datenbasis

Die gleiche Linienansicht erhält zuschaltbare Fahrzeugschätzungen: **Aus Stationsprognosen geschätzt**, Quellenalter und räumliche Abdeckung sichtbar. Unbedeckte Strecken dürfen nicht wie Strecken ohne Fahrzeuge aussehen. Karte und Schema verwenden dasselbe Modell.

Antippen eines Markers zeigt Linie/Richtung, nächsten Halt, Prognose, letzten Datenstand und Zuordnungsart. Keine erfundenen Genauigkeitsprozente. Bei mehrdeutiger Zuordnung bleiben Stationsprognosen sichtbar, aber kein einzelner Fahrzeugmarker. Bewusst aktivierbare Fahrplanmarker sehen anders aus: **Nur Fahrplan · geschätzt**.

Bedienung: Fahrt oder Station antippen, Wiedergabe pausieren/fortsetzen, gewählter Fahrt folgen. Pause zeigt den eingefrorenen Stand. Animation lokal berechnen, am Rand des belegten Zeit-/Streckenabschnitts beenden und reduzierte Bewegung respektieren. Kein automatisches Wiederholen einer Konzeptdemonstration, kein historischer Replay-Anspruch.

### Zuordnung und Berechnung

1. Herkunftsgebundene Fahrt-ID einschließlich Verkehrstag und Feedversion bevorzugen. Auch hier Halt, Richtung, Variante, Ausfall und Alter prüfen. Ein Feldname garantiert keine dauerhafte physische Fahrzeugidentität.
2. Wien: kalendergültige GTFS-Fahrten anhand Linie/Modus, Richtung, konkretem Haltepunkt, Haltefolge und Sollzeit vergleichen. Kandidaten über mehrere Stationen und mindestens zwei sichtbare Aktualisierungen prüfen. Keine Zuordnung nur über Countdown-Rang, Namen oder pauschale Verspätung.
3. Nur einen eindeutig verbliebenen konsistenten Kandidaten als **plausibel zugeordnet** animieren. Mehrere Kandidaten, Kurzführung oder widersprüchliche Prognosen beenden die einzelne Schätzung. Keine stillen Identitätswechsel auf den nächsten Zug.
4. Zwischen geschätzter Abfahrt und nächster geschätzter Ankunft entlang echter Streckenentfernung interpolieren. Ankunft/Abfahrt getrennt halten. Fehlende Ankunft braucht eine kenntlich gemachte Fahrplanannahme zur Haltezeit. Vergangene Prognosen sind keine gemessenen Abfahrtereignisse.
5. Ein einzelner zukünftiger Stationswert ergibt mit dem Fahrplan nur eine gröbere Lageannahme, keine präzise Bewegung über die ganze Linie. Propagierte/fehlende Zeiten als solche erhalten.
6. Korrekturen neu plausibilisieren, kleine gültige Änderungen vorsichtig überblenden, bei unplausiblen Rücksprüngen aussetzen. Bei veralteter Basis Bewegung stoppen und ausblenden. Startvorschlag: ab 60 s veraltet, nach 90 s keine aktive Schätzung. Vor Veröffentlichung mit Abruf-/Cachezeiten abgleichen; Produktgrenzen sind keine gemessenen Genauigkeitsgrenzen.

### Abfragen und technische Grenzen

Geladene Prognosen zuerst wiederverwenden. Gewählte Linie und kleiner sichtbarer Halteabschnitt bestimmen die Anker. Wiener 24-RBL-Grenze und regional maximal drei Stationen je Abruf erhalten. Globale Mindestabstände, Sichtbarkeit, Fehlerpausen und geteiltes Serverbudget gelten auch hier. Kein zusätzlicher paralleler 30-s-Timer, keine flächendeckenden Abfragen beider Richtungen, kein Polling pro Marker oder Animationsbild. Neue regionale Trip-Anfragen nur über festen validierten Relay, keine beliebigen URLs.

## Reihenfolge und Abnahme vor Veröffentlichung

1. **A für Wien/U1:** reproduzierbarer Linienpaket-Import, beide Richtungen/Varianten, echte Geometrie, antippbare Stopps und Stationsliste; dann weitere Linien.
2. **B als isolierter Datenversuch:** Transitous-Fahrten und Linzer Kandidaten prüfen; Wiener Zuordnung mit wiederholten Stationsdaten und `onStop` als zusätzlichem Plausibilitätsanker untersuchen. Noch kein implementierter Schätzer, keine gemessene Trefferquote.
3. Schätzung nur für den nachgewiesenen Bereich veröffentlichen. Unsichere Linien bleiben bei Stationsprognosen.

Prüffälle: zwei Züge gleichzeitig an benachbarten Halten; enge Takte/doppelte Sollzeit; umsortierte/fehlende Abfahrten; +54-s-Prognosekorrektur; Ausfall, Kurzführung, Astwechsel, Schleife, ausgelassener Halt; verspätete Antwort nach Richtungswechsel; Nachtfahrt/Verkehrstag und Zeitumstellung; Quelle ohne Live-Zeit, Cache/Offline und Alter; Pause/Hintergrund/Reduced Motion und Budget. Ohne Referenzpositionen keine Meter-Genauigkeit behaupten.

Primärquellen erneut geprüft: [GTFS Schedule](https://gtfs.org/documentation/schedule/reference/), [Vehicle Positions](https://gtfs.org/documentation/realtime/feed-entities/vehicle-positions/), [MOTIS OpenAPI v2.10.2](https://raw.githubusercontent.com/motis-project/motis/refs/tags/v2.10.2/openapi.yaml) mit `/api/v6/trip`, `intermediateStops` und `legGeometry`, [Wiener-Linien-Realtime V1.6, 19.10.2026](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf). Rohproben nur temporär; regionale Fixtures/Normalisierer im Repository nachvollziehbar. Keine Registrierungen oder Lizenzannahmen für neue Quellen.
