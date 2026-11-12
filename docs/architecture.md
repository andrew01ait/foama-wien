# Architektur und Datenflüsse

Aktueller Stand: PWA 0.11.29 / Wear 0.9.1. Die Clients verwalten ihre Favoriten unabhängig und teilen denselben Server für öffentliche Verkehrsdaten, zeitlich begrenzte verschlüsselte Übertragung und optionalen Push. [Projektstruktur](development.md) und [Konfiguration](configuration.md) ergänzen diese Übersicht.

## Bausteine

| Baustein | Verantwortung und Grenzen |
| --- | --- |
| PWA `pwa/src/app.mjs` | Nähe/Favoriten, Browser-Standort, sichtbare Aktualisierung und lokaler Speicher |
| PWA `journey-*` | A-nach-B-Suche, Adressen, Karten, Varianten und lokale zeitlose Routenfavoriten |
| PWA `line-map-*`, `line-maps` | Geografische Wiener Shapes/Varianten, Version-/Quellprüfung, lokaler Cache; OSM-Kacheln nur für sichtbare Karte |
| PWA `vehicle-data`, `vehicle-tracker`, `vehicle-strip` | Fahrzeuge im Anflug: quellgebundene Linienbasis, kurzlebige Schätzlagen, horizontale Stationsausschnitte; gemeinsame Monitorabfrage ohne eigenen Stations-Poller |
| PWA `timetable-pdf` | Echte lokale PDF-Dateien aus denselben Tages-/Stationsfahrplandaten, ohne externe PDF-Dienste |
| Wear `MainActivity`, `Repo`, `JourneyStore` | Native Navigation, lokale Favoriten, importierte Routen und Vordergrund-Abfahrten |
| Gemeinsamer Monitor-Relay | Feste Wiener-Linien-Zieladresse, begrenzte RBL-Batches, Cache und Fehlerbehandlung |
| `journey-service.mjs` | Feste Transitous-Endpunkte, Eingabeprüfung, Geocoding und gemeinsame Abrufbudgets |
| `transfer-relay.mjs` + D1 | Zehnminütige QR-Sitzungen mit Ciphertext und gehashten Freigaben |
| `push-service.mjs` + D1 | Verschlüsselte technische Gerätefreigaben, minimale Linienfilter, Relevanz, Limits und Deduplizierung |
| `web-push.mjs`, `fcm.mjs` | Web Push bzw. optionales Firebase Cloud Messaging für die Uhr |
| `site/native-releases.mjs` + R2 | Nur erlaubte öffentliche APK-Dateinamen mit exakter Größe und SHA-256 |

Der frühere Durable-Object-Entwurf ist historisch. Der aktuelle QR-Dienst verwendet D1; er benötigt kein Durable Object.

## Einstellungen

Native HTML-Klappbereiche gliedern die bisherigen Bedienelemente in neun Themen. Aufklappen startet weder Ortung noch Abfragen oder Berechtigungsdialoge. Bestehende IDs, Ereignisbindungen und Speicherschlüssel bleiben erhalten. Debug Push ist ein direkter eigener Bereich; ausführliche Hilfen liegen beim jeweiligen Feld. Der Dialogkopf bleibt beim Scrollen sichtbar. App-Version steht zusätzlich im Kopf und unter App & Installation.

## Standort und Abfahrten

Die Clients fragen neue Abfahrten und Standortdaten nur bei sichtbarer App ab. Normaler Monitorabstand: 30 Sekunden. Die gemeinsame Monitorsteuerung priorisiert sichtbare Stationen und begrenzt die RBL-Auswahl auf 24 je gemeinsamem Intervall. PWA-Hauptansicht und Routenansicht teilen diese Begrenzung. Verlassen einer Ansicht verwirft verspätete Antworten; auf der Uhr werden laufende Requests und Standortlistener beendet.

Stadtprofile: Wien ist Standard, automatische Erkennung ausschließlich aus frischen Vordergrundfixes; manuelle Auswahl nur unter Einstellungen. Stadtwechsel verändert weder Favoriten noch Manifest-ID. Die Uhr filtert beide Routenlisten mit derselben lokalen Zuordnung, ebenso die Monitorziele. Unveränderte Gesamtliste für Speicherung und Export; stadtübergreifende Familien können mehreren Profilen entsprechen. Gemeinsame Abfragesperre und je Stadt getrennte Fehlerpausen verhindern sowohl Zusatzabfragen als auch übertragene Wartezeiten. Der regionale Relay verarbeitet ausschließlich bekannte öffentliche IFOPT-Stationen. Boards zählen im gemeinsamen 700-Abruf-Budget; kein GPS im Monitorrequest. [Stadtprofile](city-profiles.md).

Der unabhängige Wiener Fahrplan wird stationsweise aus versionierten komprimierten GTFS-Paketen geladen, mit Kalender-/Nachtfahrtenprüfung und lokalem Offlinecache. Frische API-Verbindungen haben Vorrang; reine Fahrplanabfahrten erzeugen keine Live-Lernbestätigung. [Fahrplanvertrag](timetable-fallback.md).

GPS bleibt auf dem Gerät und wird nicht für Monitoranfragen benötigt. Bewusst angeforderte Routen-/Adresssuche sowie präzise Gehwege übertragen die dafür nötigen Eingaben an den jeweiligen Dienst. Das Backend speichert keine Reise-, Adress- oder GPS-Historie; aggregierte Lastzähler begrenzen die Nutzung. Fehlende, grobe oder alte Daten dürfen keine sichere Erreichbarkeit suggerieren. LIVE und Fahrplan bleiben unterscheidbar.

Die PWA vergleicht aktuelle Live-Prognosen nur innerhalb der laufenden Seite anhand RBL, Linie, Richtung, Modus und geplanter Abfahrtszeit. Korrekturhinweise bleiben kurzlebige WeakMap-Metadaten und werden nicht exportiert oder an den Server gesendet. Fahrzeug-Barrierefreiheit stammt aus einem expliziten API-Boolean, einschließlich des dokumentierten Fahrzeug-Overrides. Details: [Abfahrtshinweise](departure-indicators.md).

Die optionale native Ultra-Sparfunktion reduziert unter 20 Prozent Akku nach Opt-in die Ortung auf Einzelfixes höchstens alle fünf Minuten, Abfahrten auf 90 Sekunden und Darstellung auf 30 Sekunden. Ab 25 Prozent erfolgt die Rückkehr zum normalen Modus mit Hinweis. Die Hintergrundregeln bleiben erhalten.

## Stationen und Routen

Der öffentliche Katalog verbindet offizielle Haltepunkte mit nachgewiesenen Linien. Reguläre Fahrgastfahrten aus GTFS und datierte Live-Bestätigungen werden getrennt von bloßen Fahrwegvarianten behandelt. Neue Live-Beobachtungen bestätigen Linien für 30 Tage; vollständige Prüfungen und Tageszeitabdeckung schützen vor falschem Entfernen durch bloße Datenlücken. [Metadatenprüfung](wiener-linien-metadata.md).

Vollständige Reiseplanung erfolgt nur auf bewusste Suche in der PWA. Zwei begrenzte Profilabfragen erlauben den Vergleich schnellster Wege und weniger Umstiege; beide zählen im gemeinsamen Budget von höchstens 700 Planungs-/Fußwegabrufen je konservativen 25 Stunden. Karten- und Variantenwechsel lösen keine neue Vollplanung aus. Favoriten speichern Linienwege und Umstiege, keine alten Fahrtzeiten oder Trip-IDs. Ein GPS-Endpunkt bleibt dynamisch, ohne gespeicherten Fix. Die Uhr zeigt aktuelle passende Etappenzeiten; ein gleicher Linienname ist keine garantierte konkrete Fahrt oder Anschlusszusage.

## Favoritenübertragung

QR-Sitzungen verwenden AES-GCM, zufällige getrennte Lese-/Schreibfreigaben und zehn Minuten Ablaufzeit. Der Schlüssel bleibt im QR-Fragment und im Client-Arbeitsspeicher. D1 erhält Ciphertext und gehashte Freigaben; nach bestätigter Übernahme wird der Inhalt entfernt. Importvorschau und bewusste Bestätigung bleiben erforderlich. Beide Geräte behalten eigene Listen. Dateiimport ist lokal. Adresslabels eigener Orte und alte GPS-/Fahrtinformationen werden nicht als dauerhafte Bewegungsdaten übertragen. [QR-Vertrag](qr-transfer.md).

## Störungshinweise

Eine einzelne stündliche Hintergrundaufgabe prüft die feste offizielle Quelle. Bei ohnehin laufenden sichtbaren Monitoraufrufen kommen Prüfungen ungefähr alle fünf Minuten dazu. Es gibt keine zusätzliche Hintergrund-Ortung oder Abfahrtsabfrage auf den Geräten. Der vorbereitete externe Fünf-Minuten-Timer ist nicht aktiv.

Die Favoritenauswahl umfasst Stationen, Linien sowie alle bekannten Ein-, Umstiegs- und Ausstiegsstationen gespeicherter Routen einschließlich Alternativen, höchstens 100 Stationen. Gespeichert werden minimale Referenzen statt eigener Routennamen, Adressen oder GPS. Nur bereits gültige passende Meldungen lösen gebündelte Hinweise aus; Aufzüge/Fahrtreppen sind immer ausgeschlossen. Quellenfehler senden keine Entwarnung. Endgerätefreigaben laufen ohne sichtbare Erneuerung nach spätestens 90 Tagen ab. Push ist auf Nutzerwunsch ausschließlich für die PWA vorgesehen; Firebase ist dafür nicht erforderlich. [Push-Vertrag](push-notifications.md).

## Veröffentlichungen

Interne Site-Quelle und öffentliches GitHub werden bewusst abgeglichen. Build-Ausgaben, produktive Secrets, private Signierschlüssel und reale Nutzerexporte gehören nicht in Git. Das Quell-ZIP enthält auch SQL-Migrationen, Drizzle-Konfiguration, CI und Bibliothekslizenzen. Die laufende Site, ein GitHub-Commit und eine signierte APK sind getrennte Veröffentlichungen mit jeweils eigener Prüfung. [Ablauf](../DEPLOYMENT.md), [Quellabgleich](github.md).

Frühere Architekturentscheidungen stehen im [Archiv](history/architecture-before-github.md); insbesondere alte Durable-Object- und Versionsangaben sind keine aktuelle Betriebsanleitung.

Fahrzeugkontinuität: Auswahl ist umschaltbar; entfernte gehaltene Marker benötigen bei Rückkehr erneut zwei Quellenstände. Bestätigte Folgefahrten können überholte alte Lagen anhand zweier gemeinsamer frischer Sollzeitanker ausblenden. Bus-/Tram-Profile dürfen bei fehlenden nahen Slots vom aktuellen gültigen Betriebstag derselben Variante stammen. Die strengere Live-Stationskette bleibt erforderlich. Vollständig identische öffentliche Fahrwegfolgen haben im Import Vorrang vor historischen Umleitungsteilfolgen; keine unscharfe Plattformzuordnung.

Fahrzeugstart ab 0.11.10: unabhängige Katalog-/Paketdownloads parallel, maximal vier geprüfte Linienpakete im Seitenspeicher und gemeinsame laufende Downloads je Linie. Monitorzyklus ab Requestbeginn, weiterhin gemeinsame 30-s-Sperre und zwei verschiedene Quellenstände. Endstationsalias für den belegten Parlament/Volkstheater-Endpunkt wird in Monitor, Fallback, Favoriten und Detailauswahl konsistent verwendet.

Die gemeinsame Kartenschicht in `map-position.mjs` wird über die beiden Leaflet-Lader einmalig in alle Karten eingebunden. Der Monitor veröffentlicht ausschließlich echte GPS-Fixes aus seinem vorhandenen Controller; manuelle Auswahl ist kein Gerätefix. Andere Kartenseiten teilen einen nur bei erteilter Freigabe aktiven Vordergrund-Watch. `vehicle-readiness.mjs` berechnet rein lokal aus Trackerzustand und tatsächlichem Abrufplan die vier grafischen Stufen; es hat keinen eigenen Netzwerklauf. [Kartenposition](map-position.md).

Seit 0.11.15 startet die Karten-Standortschicht nach Leaflet whenReady. Der Meldungscache verwendet Monitor-/Feed-Zeitstempel; eine unvollständige Zusatzquelle darf vorhandene Warnungen nicht löschen oder verjüngen. Diagnose und umgesetzte Fahrzeugverbesserungen: [Untersuchung 12.11.2026](vehicle-audit-20261112.md).

0.11.16: monitor-timing.mjs verbindet globale Startsperre, cachebezogene Quellengrenze und kurze Web-Locks-Zeitstempelvergabe für Monitor, A nach B und Fahrzeugseite. Worker-In-Flight-Maps sind auf je 64 laufende Batches/Origins begrenzt; keine Fahrzeughistorie. ETA-Änderungen mit identischen Ankern verändern Lageunsicherheit statt Identität. walking-map.mjs besitzt Karte, Routing-AbortController und Sitzung; Rendering beginnt unabhängig vom Routing. station-map-marker.mjs zeigt alle gefilterten Linien mit maximal vier Spalten.

0.11.17: Die ganze Fahrzeugansicht startet automatisch nach der geprüften Linienbasis, ohne Start-/Pause-Steuerung. Unsichtbar stoppen, bei Rückkehr automatisch fortsetzen; bestehende Abrufgrenzen und geschlossene eingebettete Stationspanels erhalten.

Bei gewählter Station zeigt die Fahrzeugseite den Countdown für genau das nächste Fahrzeug: groß in Minuten als Kartenüberlagerung, sonst als kompakte Zeile. Er nutzt vorhandene frische Prognosen; ein Ersatz aus dem Fahrzeitprofil bleibt als Fahrplan-Schätzung erkennbar. Keine neuen Abfragen oder behaupteten Fahrzeugpositionen allein durch den Countdown.

0.11.18: Der gemeinsame Standort-Hook wartet nach `whenReady` zusätzlich bis nach dem gesamten ersten Ladeereignis, damit zuvor eingereihte SVG-Renderer bereit sind. Frühes Entfernen verwirft die Anmeldung. Stationskarten initialisieren ihre Ansicht vor Vektoren und entsorgen einen unvollständigen Aufbau vor einem erneuten Versuch. [Diagnose und Abnahme](map-overlays-20261112.md).

0.11.19: Eine gemeinsame Liniensitzung für Karte, Schema und Dein Halt. Stationswahl erhält Prognosen, IDs, Bestätigung und Abruf-Countdown; der Stationsbereich erhält Vorrang. Ganze lange Linien werden fair in maximal 24 RBL großen Abschnitten innerhalb derselben Abrufgrenzen aktualisiert. Schmale Ansichten verwenden einen kompakten Fortschrittsbalken.

0.11.21: `vehicle-session.mjs` verbindet kanonische Tracker mit einem begrenzten tablokalen `sessionStorage`-Checkpoint. Identität bindet an Fahrplanversion, Quellhash, Linie, Modus, Richtung und genaue Variante. Trackerzustand umfasst ID-Zähler, Anker, Boardzeiten, Quellen-Deduplizierung und Korrektur-/Ablaufzustand; kein Replay als neuer Quellenstand. Wiederaufnahme aus dem Browser-Zurückcache liest vor der Fortsetzung den neueren Zustand. Höchstens vier Sitzungen/1,5 Mio. Zeichen, höchstens fünf Minuten seit letzter Nutzung; Fahrzeugbelege laufen unabhängig weiterhin nach 60/90 Sekunden aus. Keine Standort-/Favoritendaten, keine Hintergrundarbeit und kein eigener Panel-Poller. Paneldarstellung filtert die kanonischen Fahrten auf das gewählte Ziel. `notBefore` erhält den nächsten Termin einschließlich Fehlerpause über den Seitenwechsel hinweg.

0.11.22: `warning-panel.mjs` erzeugt denselben Disclosure-Baustein für Übersicht und Stations-/Reisedetails. `traffic-info.mjs` liest, validiert, vereinigt und speichert den gemeinsamen öffentlichen Meldungscache. A nach B übernimmt ihn beim Initialisieren und Fortsetzen; Storage-Ereignisse aktualisieren die andere Ansicht. Cachefusion entscheidet nach Originalquellzeit und erhält auch erfolgreiche leere Records. Keine neue Persistenzkategorie, Nutzerpositionen oder zusätzliche Warnungsabfrage. [Vertrag](warning-panel.md).

0.11.23: Der aktive Positionseigentümer ist von den passiven Liniensitzungen getrennt. Ganzlinien-Poller und Stationspanel teilen die Zuständigkeit; Übernahme stoppt den bisherigen Request/Umfang vor neuem Start. Zusätzliche Warnungsanker lösen keine zusätzliche Fahrzeugberechnung aus. [Einzelne Fahrzeuglinie](vehicle-line-session.md).

Wear 0.8.2: Stationswechsel teilt einen kanonischen Ganzrichtungs-Tracker pro Linie/Richtung/Quelldigest im Worker. Nur der bewusst ausgewählte Ausschnitt fragt höchstens acht RBLs ab. Die Uhr hält vier passive Antworten fünf Minuten im RAM; Quellenalter und Abrufsperre werden nie durch Lesen erneuert. Wechsel storniert die vorige Zuständigkeit; ein Quellenfehler lässt gehaltene Lagen grau altern. [Bedienung und Grenzen](wear-experience.md).

0.11.26: `station-map-marker.mjs` verankert den sichtbaren Punkt statt eines unsichtbaren Abstands unter dem Label. Ein rein öffentlicher Index aus den bereits importierten GTFS-Linienpaketen wählt einen tatsächlich bedienten Plattformpunkt anhand exakter Stations-/Linien-/Modusidentität und Kalender. Er ändert weder Katalog-/Gehzeitkoordinaten noch Monitor-/Fahrzeugbudgets. [Vertrag](station-map-points.md).

## Native Offline-Daten ab 0.9.0

`OfflineTimetable` liest das vollständige gebündelte ZIP und bis zu zwei spätere, geprüfte Pakete. Kalendergrenzen werden bei jeder Abfrage neu geprüft. Aktualisierung läuft ausschließlich mit aktiver Activity und Verbindung, auf einem getrennten cancellierbaren Worker; API-/Fahrzeugbudgets bleiben erhalten. Die manuelle Erneuerung hält nur das sichtbare Display an. Keine Favoriten/GPS im Download. [Vollständiger Datenvertrag](wear-offline.md).

Kartenfilter ab Wear 0.9.1: Die dargestellte Liniengeometrie und die Menge ihrer echten Stations-IDs werden gemeinsam übernommen. Zeichnen, Trefferprüfung und Liste verwenden dieselbe sichtbare Stationsmenge; eine gescheiterte Linienwahl verändert den vorhandenen Stand nicht. Es entsteht kein neuer Netzwerkabruf. Der Listenzugang ist von der ausgewählten Station unabhängig.
