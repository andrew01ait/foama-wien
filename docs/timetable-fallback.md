# Unabhängiger Wiener Fahrplan · PWA 0.7.0

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
