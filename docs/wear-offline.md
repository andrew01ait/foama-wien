# Uhr ohne Internet · Wear 0.9.0

Die APK enthält den vollständigen vorhandenen Wiener-Linien-Sollfahrplan für 1.695 Stationen. Stationskatalog mit 1.812 Einträgen, Koordinaten und Linien ist bereits lokal. Der erste Offline-Start benötigt keinen vorausgehenden Stationsabruf oder Favoritenimport. Nähe benötigt eine brauchbare Geräteposition; Stations-/Linienfavoriten und gespeicherte Routen benötigen keine Ortung.

Das deterministisch erzeugte Fahrplanarchiv umfasst **1.966.697 Bytes**, gültig **09.11.–12.12.2026**. Quelle: offizielles Wiener-Linien-GTFS, Stadt Wien, CC BY 4.0. Alle vorhandenen Linien/Richtungen und aufgelösten Kalender sind enthalten. ÖBB, andere Städte und Kartenkacheln sind nicht Bestandteil dieses Pakets.

## Gültigkeit und Erneuerung

| Zustand | Verhalten |
| --- | --- |
| Innerhalb der Gültigkeit | Lokale Berechnung der nächsten geplanten Abfahrten. Frische passende API-Gruppen haben Vorrang. |
| Vor Beginn einer heruntergeladenen Periode | Bisheriges gültiges Paket weiter verwenden; neues erst ab dessen Anfangsdatum aktivieren. |
| Nach dem Enddatum | Keine Abfahrten aus diesem Paket, auch nicht aus bereits entpackten Zeilen oder nach Neustart. Hinweis „Fahrplan abgelaufen · bitte aktualisieren“. Live-Abfahrten bleiben mit Verbindung möglich. |
| Sichtbare App mit Internet | Höchstens täglich Metadaten prüfen; unverändertes eingebautes/heruntergeladenes Archiv nicht erneut herunterladen. |
| Fehler oder weiterhin nur abgelaufener Serverstand | Gültiges bisheriges Paket erhalten, keine Frist verlängern. Automatischer nächster Versuch frühestens nach einer Stunde sichtbarer Nutzung. |
| Einstellungen → Offline-Fahrplan → Fahrplan aktualisieren | Bewusste sofortige Prüfung. Anzeige bleibt während dieser sichtbaren Aktion an; Hintergrund/Display aus beendet die Arbeit. |

Alle Gültigkeitsgrenzen beziehen sich auf **Europe/Vienna**, einschließlich des letzten Kalendertags bis 24 Uhr. Ab dessen nächster Mitternacht gesperrt. Auch Vorschauabfahrten dürfen diese Grenze nicht überschreiten. GTFS-Nachmitternachtsfahrten werden dem richtigen Verkehrstag zugeordnet; Zeitumstellung folgt Mittag minus zwölf Stunden. Der Downloadzeitpunkt verändert keine Kalenderdaten.

Eine Metadatenprüfung ist **kein neuer GTFS-Import**. Der Server muss einen tatsächlich neu importierten gültigen Stand veröffentlichen. Ein weiterhin veralteter Serverstand löst einen erklärten Fehler aus; er verlängert niemals die gespeicherte Gültigkeit.

## Datenfluss und Speicher

`scripts/prepare_watch_timetable.py` baut aus dem kanonischen `pwa/data/timetables/wien/manifest.json` und den 32 geprüften Stationspaketen ein reproduzierbares ZIP und `watch.json`. Kalender, Quell-SHA und Fahrplanversion bleiben gebunden. Native Assets werden bei `sync_wear_assets.py` erzeugt; der Site-Build erzeugt dieselben öffentlichen Downloadbytes. Generierte ZIPs gehören nicht in den Quellcode; alle kanonischen Daten und der Generator sind im Source-ZIP enthalten.

`OfflineTimetable` liest das mitgelieferte Archiv und maximal zwei spätere private Pakete. Höchstens drei entpackte Stationsgruppen und 64 Stationszeilen bleiben im Arbeitsspeicher. Die Abfahrten werden bei jedem Lesen neu zeitlich gefiltert und nicht als frische Live-/API-Zeilen in den alten Cache geschrieben. Fahrplanabfahrten tragen FAHRPLAN, keine erfundenen Quellabrufzeitstempel, Fahrzeugpositionen oder sichere Erreichbarkeit.

Äquivalente Zielbezeichnungen wie Floridsdorf / Floridsdorf S U sowie der belegte Parlament/Volkstheater-Alias vermeiden leere gespeicherte Verbindungen und doppelte API-/Fahrplangruppen. Verschiedene Ziele, Linien, Modi und explizite via-Wege bleiben getrennt.

Updates gehen nur an feste öffentliche Site-Pfade ohne GPS, Gerätekennung oder Favoritenparameter. Begrenzte Größe, SHA-256, vollständige 32 Pakete, Paket-Hashes, Kalender-/Quellbindung und gültige Periode prüfen. Erst danach neue Datei und Zeiger übernehmen. Unvollständige oder abgebrochene Downloads dürfen den funktionierenden Stand nicht ersetzen. Neuere Pakete mit gleichem Gültigkeitsende haben auch nach Neustart Vorrang; zukünftige Pakete verdrängen die heute gültige Periode nicht.

## GPS und leere Nähe-Ansicht

Im früheren Code wurde die Position beim Pausieren sofort verworfen. Eine aktivierte, aber ohne Telefon/Netz stumme Ortungsquelle konnte zunächst den Vorzug erhalten; nach 30 Sekunden endete die gesamte Suche. Das sind nachvollziehbare Ursachen, kein nachträglicher Nachweis des konkreten OnePlus-Empfangs.

Ohne Internet wird bei erteilter genauer Standortfreigabe der GPS-Provider der Uhr sofort parallel angefordert. Der begrenzte Vordergrundversuch darf bis zu 90 Sekunden dauern. Ein guter Fix beendet konkurrierende Quellen; im Ultra-Sparmodus endet die Suche nach einem guten Einzelfix. Ohne genaue Freigabe wird kein GPS angefordert. Deaktivierte Ortung, fehlende Freigabe und erfolglose Suche haben unterschiedliche Hinweise und eine Wiederholungsaktion.

Eine kürzlich echte Position bleibt höchstens zehn Minuten **nur im Arbeitsspeicher** verfügbar. Ab 90 Sekunden wird sie als älter/unsicher gekennzeichnet und erlaubt keine sichere Geh-Ampel. Nach Ablauf ist Nähe wieder eine GPS-Suchansicht statt einer falschen Meldung über angeblich fehlende Stationen. Prozessneustart speichert/wiederherstellt keinen GPS-Fix. Hintergrund/Display aus entfernt Listener, Timer und Requests und verwirft verspätete Antworten.

## Neue Fahrplanperiode veröffentlichen

1. Tatsächlich verfügbare neue GTFS-Periode nach [Fahrplanvertrag](timetable-fallback.md) importieren. Keine Kalenderdaten auf den alten Dateien verlängern.
2. `python3 scripts/prepare_watch_timetable.py` ausführen, danach passende Import-/Kalender-/native Prüfungen und Site-Build.
3. `watch.json` und dessen inhaltsgebundenes Archiv gemeinsam veröffentlichen. Der Site-Build erstellt das Archiv automatisch; ein neues APK ist für die Kalendererneuerung nicht nötig.
4. Öffentliche Metadaten, Archivgröße/SHA und Gültigkeit prüfen. Auf der Uhr mit Verbindung aktualisieren und anschließend offline abnehmen.

Die bestehende Quellenprüfung und ihr Import-/Veröffentlichungsbedarf bleiben bestehen. Es gibt keinen neuen Hintergrundjob auf der Uhr und weiterhin keinen automatisch gestarteten Server-GTFS-Neuimport.

Physisch noch zu prüfen: kompatibles Upgrade auf der OnePlus Watch 2R, kalter GPS-Fix im Freien mit deaktiviertem Internet, Näheliste, Favoriten, Ablaufhinweis und Erneuerung über die tatsächliche Telefon-/WLAN-Verbindung.
