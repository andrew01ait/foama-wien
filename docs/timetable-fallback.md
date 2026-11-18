# Unabhängiger Wiener Fahrplan · PWA 0.8.0

Der Monitor lädt beim Zugriff auf eine Station zusätzlich einen kompakten offiziellen GTFS-Sollfahrplan. Damit gibt es bereits vor der ersten erfolgreichen Monitorantwort und bei leeren/fehlgeschlagenen Live-Antworten echte geplante Abfahrtszeiten. **Fahrplan** ist keine Live-Prognose oder Zusage, dass ein Fahrzeug tatsächlich fährt. Störungsinformationen und die bisherige Datenqualitätsanzeige bleiben separat.

Der ausgelieferte Stand umfasst **1.695 Stationen**, Fahrgastabfahrten vom **09.11. bis 12.12.2026** und den Vortag für über Mitternacht laufende Fahrten. Quelle: [offizielles Wiener-Linien-GTFS](https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/gtfs.zip), Datenquelle Stadt Wien – data.wien.gv.at, CC BY 4.0. Quellhash, Kalender, Datenstand, Gültigkeit und Paketversion stehen in `pwa/data/timetables/wien/manifest.json`.

## Import und Datenvertrag

`scripts/prepare_timetable.py` liest den großen Rohfahrplan ausschließlich beim Vorbereiten. Kalender und Zusatztage/Ausnahmen werden für den gewählten Zeitraum aufgelöst. Keine Zuordnung nach Namen oder Radius: IFOPT-Stationen werden gegen den vorhandenen DIVA-Katalog geprüft. Kein Erfassen von Fahrgastpositionen oder Trainingsabrufen. Nur normale Einstiege, keine reinen Ausstiege, Ruf-/Vorbestellungsfahrten oder letzten Fahrtstationen ohne Weiterfahrt. Die Beitragszählung entfernt letzte Stops unabhängig von der Dateireihenfolge, ohne eine echte andere Fahrt zur selben Uhrzeit zu löschen. Unbekannte Ziele, ungültige Zeiten und unvollständige angeforderte Kalender werden verworfen bzw. führen zum Importfehler.

Die 32 Pakete enthalten gzip/base64-komprimierte Stationsgruppen mit Linie, Ziel, Modus, echter IFOPT-Quelle, Richtung, Kalenderindex und sortierten Sekunden. Gesamtgröße etwa 2,66 MB. Paket- und Kalenderversion müssen übereinstimmen. Kein Parsing des 98-MB-ZIPs bzw. der über 770 MB großen stop_times-Datei in einem Worker-Request. Browser laden nur benötigte Pakete, behalten höchstens zwölf entpackte Pakete im RAM und überschreiben höchstens 32 versionierte IndexedDB-Einträge. Aktuell geladene Daten funktionieren dadurch auch offline; ein nie geladenes Stationspaket benötigt zunächst Internet. Moderner Browser mit DecompressionStream erforderlich.

Zeitberechnung: Europe/Vienna, GTFS-Service-Tagesanfang „Mittag minus zwölf Stunden“, Zeiten bis unter 48 Uhr, Vortag/heute/Folgetag und zwei Stunden Vorschau. Keine Zeiten vor/nach der ausgewiesenen Datenperiode. Ausgelaufene Pakete liefern keine erfundenen Abfahrten.

Frische API-Daten haben je Station/Linie/Richtung Vorrang. Der Fahrplan ergänzt fehlende Verbindungen und ersetzt deren alten Cache. Geplante Abfahrten behalten `source:gtfs`, `quality:schedule`, keine Echtzeit, keinen angeblichen frischen API-Abruf, keine erfundene RBL-Zuordnung und keine Fahrzeug-Barrierefreiheitsbehauptung. Neue Daten sind in Nähe, Stations-/Linienfavoriten, Vollbild-Verbindung und A-nach-B-Etappen eingebunden. Der bestehende 24-RBL-/30-Sekunden-Takt bleibt erhalten; statische Abfahrten werden nicht zu Live-Lernbelegen.

## Erneuern

```sh
curl --fail --location 'https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/gtfs.zip' --output /tmp/foama-wien-gtfs.zip
python3 scripts/prepare_timetable.py /tmp/foama-wien-gtfs.zip --date 2026-11-09 --days 34
```

Datum/Zeitraum durch tatsächlich verfügbare aktuelle Daten ersetzen. Anschließend Tests, Quell-ZIP, Site-Build und bewussten internen/GitHub-/Site-Abgleich durchführen. Die Paketabfrage prüft Metadaten sichtbar höchstens alle zehn Minuten, ersetzt jedoch keinen serverseitigen Neuimport. **Es läuft noch kein automatischer Fahrplan-Import-/Deploy-Auftrag.** Vor dem 13.12. muss die nächste veröffentlichte Fahrplanperiode importiert und veröffentlicht werden; geänderte Rohdaten regelmäßig prüfen. Das ist von den bereits aktiven stündlichen Störungsprüfungen unabhängig.

Graz/Linz/Salzburg verwenden im ersten Ausbau aktuelle Transitous-Boards bzw. EFA. Deren Sollzeiten sind kein vollständiges unabhängiges Offline-GTFS-Paket. Ein eigener regionaler MVO-Import benötigt weiterhin die einmalige Betreiberregistrierung und manuelle Lizenzannahme.

## Tagesfahrpläne und Datenstand ab 0.8.0

[Linienfahrpläne](https://foama-wien.endruuu.chatgpt.site/fahrplan.html) enthält 173 Linien, ausgewählte Haltestelle/Richtung/Datum und Stunden-Minuten-Tabellen. Der vollständige Kalendertag umfasst auch Nachmitternachtsfahrten vom vorigen Verkehrstag; doppelte Herbststunden bleiben mit Zeitzone getrennt. Keine Fahrtidentitäten oder Stationsreihenfolgen werden aus Abfahrtszeiten erfunden. Die Stationsauswahl ist alphabetisch.

`prepare_timetable.py` erzeugt nun beim Import auch `lines.json`, gebunden an die Kalender-/Stationspaketversion. Bestehende Pakete können mit `scripts/prepare_line_index.py` indiziert werden. Die bewusste Aktion Ganze Linie offline speichern lädt die benötigten Stationspakete und prüft deren dauerhafte Speicherung. Fehler, Abbruch und unvollständige Pakete werden nicht als erfolgreiche Offline-Sicherung ausgegeben. Keine Live-/Karten-/Routensuche im Hintergrund.

Das Quellen-ZIP enthält kein explizites Veröffentlichungsdatum. Verifiziert am 10.11.2026 um 09:47 Wiener Zeit: vollständige SHA-256 identisch mit dem Import; HTTP Last-Modified 09.11.2026 05:09:41 UTC, ZIP-Dateizeitstempel 09.11.2026. Diese Daten sind getrennte Felder, kein abgeleitetes Veröffentlichungsversprechen. Die Quellenprüfung lässt sich mit `python3 scripts/check_timetable_source.py --record` wiederholen; der Befehl lädt die feste offizielle Quelle und protokolliert den Vergleich.

Eine wöchentliche Prüfung ist ab 16.11. montags eingerichtet. Sie meldet geänderte Quellen, höchstens 14 Tage Restgültigkeit, abgelaufene Daten oder anhaltend nicht prüfbaren Stand. Kein automatischer Neuimport/Deploy. Die App zeigt ausdrücklich den gespeicherten Prüfstand.

Ab PWA 0.9.0: [PDF-Download](timetable-pdf.md) und [geografische Linienkarte](line-maps.md) ergänzen diese Ansicht. Datum/Kalender und bekannte Stationskennungen bleiben dieselbe Datenbasis.

## Gleiche Endstation mit unterschiedlichen Namen ab 0.11.10

Der reguläre Endpunkt `wl:60200246` heißt im GTFS **Parlament/Volkstheater**, im Live-Monitor **Parlament, U Volkstheater**. Eine explizite Aliasregel verbindet genau diese Namen in Monitorgruppen, Fahrplanvorrang, Favoriten und Verbindungsdetails. Frische passende Live-Daten unterdrücken den zusätzlichen Fahrplaneintrag; bei veraltetem Live-Stand tritt der klar gekennzeichnete Fahrplan an dessen Stelle. Richtige Station, Linie und Verkehrsmittel bleiben Bestandteil der Identität. Bloßes „Volkstheater“, andere Ziele und unterschiedliche explizite via-Wege werden nicht pauschal gleichgesetzt. Gespeicherte Favoriten müssen nicht umgeschrieben werden.

## Vollständiges natives Offlinepaket ab Wear 0.9.0

Der Watch-Generator verwendet dieselben 32 kanonischen Stationspakete und Kalender für ein rund 1,97 MB großes Komplettarchiv. Bereits in der APK; eigenständige überprüfte Erneuerung aus der Site. Feste Wiener Datumsgrenzen bei jedem Lesen, nach Ablauf keine Offline-Abfahrten. Ein App-Download ist kein GTFS-Neuimport. [Watch-Vertrag und Workflow](wear-offline.md).
