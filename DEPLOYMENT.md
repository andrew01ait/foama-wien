# Veröffentlichung und Betrieb

Aktueller App-Stand: PWA 0.11.28 / Wear 0.9.0, nativer Code 31. Diese Anleitung gilt für die bestehende öffentliche Site und die interne Release-Arbeit. Für einen eigenen Betrieb ergänzend [Konfiguration](docs/configuration.md) und [GitHub/Quellabgleich](docs/github.md) lesen.

## Drei getrennte Ergebnisse

| Ergebnis | Maßgebliche Daten und Nachweis |
| --- | --- |
| Öffentliches GitHub | Vollständiger geprüfter Quellstand im freigegebenen Branch/PR bzw. auf main, passende Dokumentation und CI |
| Laufende Site | Gepushter interner Source-Commit, daraus gebautes Archiv, gespeicherte Version und erfolgreicher Deploy |
| Native Uhr-App | APK mit Originalpaket/-signatur, Version, Code, Größe und SHA-256 im Updatefeed |

Ein GitHub-Commit aktualisiert die Site nicht automatisch. Ein erfolgreicher Site-Deploy beweist weder eine physische Watch-Installation noch einen empfangenen Push. Die bestehende Site-ID, öffentliche Sichtbarkeit, Manifest-ID und Geräte-Speicherschlüssel erhalten.

## Prüfen und Build-Dateien vorbereiten

```sh
npm ci
npm test
python3 -m unittest discover -s tests -p '*test.py'
```

Der Site-Bundler benötigt die aktuelle verifizierte öffentliche APK am durch `pwa/update.json` vorgegebenen Pfad. In einer frischen Quellkopie fehlt sie bewusst. Die passende APK über die öffentliche [Uhr-Seite](https://foama-wien.endruuu.chatgpt.site/wear.html) wiederherstellen oder einen autorisierten neuen nativen Release bauen. Vor Verwendung Paket, Größe, SHA-256 und Originalsignatur gegen den Versionsfeed bzw. `wear/release-signing.json` prüfen. Eine vorhandene Release-Datei niemals mit geänderten Bytes unter gleichem Dateinamen ersetzen.

```sh
python3 scripts/package_source.py
python3 scripts/build_site.py
```

Das Quell-ZIP enthält Code, Dokumentation, öffentliche Referenzdaten, CI, SQL-Migrationen und Bibliothekslizenzen. SDKs, Build-Caches, private Schlüssel und fertige APKs sind ausgeschlossen. Der Worker-Build erzeugt `dist/server/index.js` und Deployment-Metadaten unter `dist/.openai/`. Er enthält die PWA-Assets und ausschließlich die aktuelle APK; ältere erlaubte APKs bleiben in R2 erhalten. `site/native-releases.json` ist append-only.

## Bestehende Site veröffentlichen

1. Aktuelle Site, Publikum und Quellrepository ermitteln; keine neue Site für ein Update anlegen.
2. Die bestehende Quelle mit einer frischen kurzlebigen Schreibfreigabe öffnen und Änderungen erhalten. Credentials ausschließlich über die vorgesehene geheime Standardeingabe übergeben, nie als Argument, Datei oder Log.
3. Relevante Checks ausführen. Quell-ZIP und Worker aus genau diesem Stand erstellen. Der Quellworkflow übernimmt Commit, Push und Deployment-Archiv; bereits bestandene unveränderte Checks nicht doppelt ausführen.
4. Die gepushte Commit-SHA zusammen mit dem unveränderten Archiv als neue Version speichern. Die bestehende öffentliche Sichtbarkeit beibehalten und diese Version deployen.
5. Nicht abgeschlossene Veröffentlichungen bis zu einem terminalen Status verfolgen. Version, Commit, Deployment-Ergebnis und materielle Prüfgrenzen dokumentieren.
6. Den passenden Quellstand anschließend im öffentlichen GitHub abgleichen. Keine privaten internen Git-Historien oder produktiven Zustandsdaten pauschal spiegeln. [Abgleichverfahren](docs/github.md).

Bei einem reinen Dokumentations-/Quellpaketwechsel bleiben App-Version und signierte APK unverändert. Werden App-Assets oder natives Verhalten geändert, die passende neue Version, Cache-Referenzen und Neuerungspunkte pflegen. APK/Versionsfeed nach nativen Änderungen mit `scripts/publish_wear_update.py` gemeinsam vorbereiten.

## Datenbank und Konfiguration

`DB` und `BUCKET` aus `.openai/hosting.json` erhalten. Die Drizzle-Migrationen werden aus dem gepackten `drizzle/` übernommen; alte Migrationen sind unveränderlich. Neue Schemaänderungen erhalten eine neue Migration. Keine Schema-Neuerstellung im Requestpfad. Produktions-Secrets über die Hosting-Konfiguration verwalten. Änderungen der Runtime-Revision gelten erst nach einem erneuten Deploy. Aktuelle Variablennamen stehen in [Konfiguration](docs/configuration.md).

## Störungshinweise betreiben

Der bestehende Hintergrundauftrag ruft genau einmal die feste Quellenprüfung und anschließend den Status der verbundenen foama-wien-App auf. Aktuell läuft eine einzelne stündliche Aufgabe; keine versetzten Kopien zur Intervallumgehung. Erfolgreicher Quellenabruf und gespeicherte Prüfzeit belegen den Dienstlauf. Eine normale aktive App ergänzt ungefähr alle fünf Minuten eine Prüfung im Rahmen ihrer ohnehin nötigen Monitoraufrufe.

`PUSH_SCHEDULER_ENABLED=true` erst nach tatsächlicher Einrichtung setzen; `PUSH_INTERVAL_MINUTES` muss den echten Takt nennen. Die aktuelle Einrichtung verwendet `60`. `deploy/push-timer/` ist eine vorbereitete Alternative für einen eigenständig betriebenen Timer, aber kein gestarteter Produktionsdienst. VAPID-/Speicherschlüssel bestehender Freigaben erhalten. Push ist ausschließlich für die PWA beauftragt; keine Firebase-Einrichtung nötig. [Betriebsdetails](docs/push-notifications.md).

## Katalog und Referenzdaten

Offizielle Haltepunkte-, Linien- und Fahrweg-CSV sowie aktuelles offizielles GTFS separat beschaffen. Der gewählte Prüfzeitraum muss im GTFS vollständig enthalten sein:

```sh
python3 scripts/prepare_stops.py --file haltepunkte.csv --lines-file linien.csv --patterns-file fahrwegverlaeufe.csv --gtfs-file fahrplan.zip --reference-date YYYY-MM-DD
python3 scripts/sync_wear_assets.py
```

Die Pfade und das Referenzdatum durch tatsächlich vorliegende Quellen ersetzen. Datenherkunft, Lizenz und Abrufdatum erhalten. Keine Fahrwegvarianten als bestätigte Stationslinien ausgeben. ÖBB-Sollfahrplanimport und alternative Infrastruktur beschreibt die ergänzende historische [Deployment-Notiz](deployment.md); sie ersetzt diese Anleitung nicht.

## Abnahme und Rückkehr

PWA-Start, Updatehinweis, Favoriten, relevante neue Funktionen und Fehlerzustände anhand echter Antworten prüfen. Sichtbarkeits- und Abrufgrenzen erhalten. Für neue native APKs öffentlichen Download mit den signierten Originalbytes vergleichen, anschließend Installation/Update auf einem physischen Gerät getrennt abnehmen. Push-Empfang auf dem Zielgerät mit bewusst ausgelöster Testnachricht prüfen; ein HTTP- oder Unit-Test ist kein Empfangsnachweis.

Für eine Rückkehr die passende bereits gespeicherte Site-Version deployen. Keine Datenbankmigration rückwärts überschreiben und keine alte APK mit neuen Bytes austauschen. Aktuelle Datenformate und lokale Gerätespeicher müssen auch nach einer Rückkehr kompatibel bleiben. Frühere Betriebsprotokolle stehen im [Archiv](docs/history/DEPLOYMENT-before-github.md) und in den [Release-Notizen](docs/release.md).

## Fahrplan und Stadtprofile ab 0.7.0

Die kompakten öffentlichen Fahrplanpakete und regionalen Kataloge sind Quellartefakte und müssen in GitHub, Source-ZIP und Site-Build übereinstimmen. Keine Roh-GTFS-ZIPs im Worker. Aktuellen Wiener Feed vor dem 13.12.2026 erneuern; es gibt noch keinen aktiven automatischen Fahrplan-Neuimport/-Deploy. [Import](docs/timetable-fallback.md), [Provider und Grenzen](docs/city-profiles.md). Keine neuen Secrets/DB-Migration oder native APK für diesen Release.

## Linienkarte und PDF ab 0.9.0

Nach dem Fahrplanimport aus exakt derselben offiziellen GTFS-Datei die Linienpakete ableiten:

```sh
python3 scripts/prepare_line_maps.py fahrplan.zip
```

Quelldigest und aufgelöste Kalender müssen zum ausgelieferten Fahrplan passen; andernfalls bricht der Import ab. Geordnete Halte einschließlich tatsächlicher Steige, Shapes und Streckenentfernungen verwenden; Kurzführungen anhand der Distanz auf den genutzten Abschnitt beschränken. Geometrie auf 3 m vereinfachen und als Polyline mit Präzision 6 speichern. Identische physische Varianten über Kalender-Shapes zusammenfassen, unterschiedliche Modi/Äste erhalten. pwa/data/line-maps/wien/index.json und alle 173 Pakete gehören in GitHub, Quell-ZIP und Site. Aktueller Umfang: 965 Varianten, 2.736.758 Bytes. Keine Roh-GTFS-ZIP veröffentlichen.

PDF entsteht lokal im Browser aus denselben Kalenderdaten; kein neuer Server, keine Migration, kein externer PDF-Dienst. Nach Änderungen echte Tages-/Linien-PDFs erzeugen, mit Poppler prüfen und Seiten rendern. Kartenhintergründe niemals als Offlinepakete vorab laden; OSM-Referer und Attribution erhalten.

Ab 0.11.16 teilen identische Monitorbatches und Zusatzmeldungsabrufe laufende Requests je Worker-Instanz. Der 30-s-Cache liefert einen begrenzten nächsten Abrufzeitpunkt mit 1 s Reserve. Quellcode 316 aktiviert eine cachebasierte 60-s-Pause über geänderte Stoplisten. Dies vereinigt keine unterschiedlich überlappenden Stoplisten oder getrennten Worker-Instanzen.

Ab 0.11.26 erzeugt der Linienkartenimport auch `pwa/data/station-map-points.json`. Ein vorhandener unveränderter Linienkartenstand lässt sich mit `python3 scripts/prepare_station_map_points.py` ableiten; Digest und Quellbindung werden geprüft. Den Index zusammen mit den Kartenpaketen, dem Quell-ZIP und dem Service-Worker-Cache veröffentlichen.

## Native Fahrplanerneuerung ab Wear 0.9.0

Nach einem echten neuen GTFS-Import `python3 scripts/prepare_watch_timetable.py` ausführen. Der Site-Build erzeugt denselben kompletten Download und dessen Metadaten; beide zusammen veröffentlichen. Die bereits installierte Uhr kann die neue Periode ohne APK-Update laden. Alte Kalender niemals verlängern. App-Prüfung ersetzt keinen Server-Neuimport. [Vollständiger Ablauf](docs/wear-offline.md).
