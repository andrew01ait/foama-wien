# Aktueller Projektstand

Stand: 12. November 2026. **PWA 0.11.24, Wear 0.8.1 / Code 28.** Verbindlich sind PWA-/Wear-Konfiguration und Updatefeed. Frühere Details: [Release-Verlauf](docs/release.md), [Tests](docs/tests.md).

## Was funktioniert?

| Bereich | Stand |
| --- | --- |
| Willkommen | Eigene Startinfo mit Panorama, App-Einstieg, Installationshilfe, Funktionen und FAQ; App-Teilen führt zur Willkommen-Seite |
| Stadtprofile | Wien, Graz, Linz, Salzburg in PWA und nativer Uhr; Wien als Standard, frische Vordergrundortung oder manuelle Auswahl nur Einstellungen/Mehr → Stadtprofil |
| Abfahrten | Nähe/Favoriten, Filter, Gehzeit und Erreichbarkeit; sichtbare Aktualisierung alle 30 Sekunden mit gemeinsamen Budgets und Rücksicht auf Sichtbarkeit |
| Datenqualität | Wien/Wiener Linien, Graz/Transitous und Linz/EFA nach Datenlage live; Salzburg ausschließlich Fahrplan im Monitor |
| Favoriten/QR | Lokale Gerätefavoriten, Stationen und Linien, importierte Routen auf der Uhr je gewählter Stadt; stadtübergreifende Wege in allen betroffenen Profilen; Vorschau/bewusste Übernahme, zehn Minuten verschlüsselt; alte Uhren sperren regionale Auswahl weiter |
| A nach B | Gemeinsamer Seitenaufbau mit Titel vor Hauptnavigation, Vollplanung, Karten, Alternativen und Orte in der PWA; Uhr zeigt importierte Routen mit aktuellen passenden Linienzeiten |
| Tagesfahrpläne | 173 Wiener Linien, Heute zuerst, Datum/Haltestelle/Richtung, aktuelle Stunde farbig, ausdrückliche Offline-Sicherung und PDF für Haltestelle/Richtung oder ganze Linie mit datumsgültigen Variantenkarten und Haltestellen in Fahrtfolge |
| Linienkarte | 173 Wiener Linien, 965 reale Varianten, OpenStreetMap-Hintergrund, Richtungen/Kurzführungen, Haltepunkte mit zoomabhängigen Nummern und aufklappbare Hinweise und geordnete Stationsliste; geladene Geometrie offline, Kartenkacheln online |
| Fahrzeugschätzung | Kompakter Start: Fortschrittsplatzhalter wechselt automatisch zu darstellbaren Positionen und Haltefolge;  [Fahrzeuge im Anflug](https://foama-wien.endruuu.chatgpt.site/fahrzeuge.html): 165 Linien, 617 eindeutig zugeordnete Varianten, Karte/Schema sowie horizontale Ausschnitte in Stations- und A-nach-B-Einstiegsdetails; Prognoseschätzung, keine GPS-Positionen |
| Städtebild | Proportionale Collage Wien/Graz/Linz/Salzburg mit Bahn, Tram und Obus; Salzburg-Einschränkung im FAQ statt separatem Banner |
| Öffentliche Hilfe | [Städte & Funktionen](https://foama-wien.endruuu.chatgpt.site/staedte.html), mit Verfügbarkeitssymbolen und aufklappbaren FAQ; verlinkt in App-Einstellungen, Footer und Uhr-Webseite |
| Störungen | Verbindungsdetails und A-nach-B-Stationen zeigen relevante Hinweise vor den Abfahrten; gewählte Reisen vor den Etappen; Wiener Daten; PWA Web Push nach Opt-in, keine Aufzug-/Fahrtreppen-Pushs; keine regionalen Störungsfeeds und kein aktiver nativer Push |
| Veröffentlichung | Öffentliches GitHub, Source-ZIP und Site getrennt abgleichen; Originalsignatur, Paket und lokale Daten erhalten |

## Fahrplanstand und Aktualität

1.695 Wiener Stationen und 173 Linien, gültig 09.11.–12.12.2026. Vollständige offizielle Quelle am 10.11.5026 um 09:47 Wiener Zeit per SHA-256 geprüft: unverändert zum Import. Serveränderungsdatum und ZIP-Dateistand 09.11.; kein ausdrücklich angegebenes Veröffentlichungsdatum. Die Fahrplanansicht unterscheidet diese Angaben, Import und gespeicherten Prüfstand.

Wöchentliche Quellenprüfung ab 16.11. montags; meldet neue Quellen, höchstens 14 Tage Restgültigkeit, Ablauf und anhaltende Prüfprobleme. **Noch kein automatischer Neuimport/Deploy.** Andere Städte haben kein eigenes Offline-Sollfahrplanpaket. Die native Uhr hält nur den begrenzten bisherigen Abfahrtencache, keine vollständigen Linienfahrpläne.

## Verifikation und Grenzen

Aktuelle PWA-Abnahme: geografischer Import, Kalender-/Quellbindung, Offlinecache, Marker-Auswahl und PDF mit echten U1-Daten; Prüfzahlen siehe [Tests](docs/tests.md). Die Uhr-App 0.8.0 ergänzt adaptive Verbindungszeilen, Rückkehr an die Leseposition, eine Stationskarte für alle vier Städte mit Wiener Liniengeometrien, geschätzte Fahrzeuge im Anflug für unterstützte Wiener Verbindungen, fokussierte Routenschritte und ein Tile mit zwei direkten Einstiegen. Die bestehenden 30-s-/90-s-Abrufregeln, Vordergrundbindung, QR-Übertragung und Updateübergabe bleiben erhalten. [Verhalten, Datenfluss und Grenzen](docs/wear-experience.md). Physische OnePlus-Abnahme bleibt separat.

Wiener Störungsquelle weiterhin stündlich im Hintergrund, bei ohnehin aktiver PWA ungefähr alle fünf Minuten ergänzend. Kein neuer externer Timer, keine Hintergrundortung oder Abfahrtsabfragen. Nutzer bestätigt Empfang einer PWA-Testnachricht; tatsächliche lokale Geräteanzeige und reale Störungszustellung weiter praktisch beobachten.

Ab 0.11.10 wird der doppelte 46er-Eintrag durch den belegten Endstationsalias vermieden. Fahrzeugstart lädt unabhängige Daten parallel und rechnet den 30-s-Abstand ab Requestbeginn. Mindestens zwei frische Quellenstände bleiben nötig. Ganze Linie steht als Button neben Stationsausschnitt.

Ab 0.11.11 teilen alle interaktiven Karten dieselbe blaue Standortanzeige samt Genauigkeitskreis und ausdrücklichem Zentrieren. Fehlende/alte Positionen werden nicht als aktuell dargestellt. Die Fahrzeuganzeige erläutert ihren Datenstand in vier grafischen Schritten; Zeitangaben nennen frühestmögliche Bestätigung bzw. den tatsächlichen nächsten Versuch, keine garantierte erste Fahrzeuglage.

## Nächste Arbeiten

- Physisches Uhr-Update über bestehende Installation; GPS-Stadtwechsel, regionale Favoriten und QR auf OnePlus abnehmen.
- Wiener Fahrplan vor dem 13.12. erneuern; später automatischen Import-/Veröffentlichungsbetrieb ergänzen.
- [U6-Pilot](docs/vehicle-pilot.md) auf dem Telefon und anhand tatsächlicher Stationsbeobachtung vergleichen; Karte/Schema, enge Takte und Korrekturen abnehmen. Zusätzlich Bus-/Tram-Stationsfolgen, enge Takte und die horizontalen Stationsausschnitte unabhängig vor Ort abnehmen.
- Regionale Störungsfeeds und unabhängige regionale Offlinepakete gesondert anbinden; nötige MVO-Registrierung/Lizenzannahme erfolgt nicht automatisch.

Neue Arbeiten starten über die [Dokumentationsübersicht](docs/README.md).

0.11.15 behebt den GPS-abhängigen Kartenstart und die Alter-/Fehlerbehandlung des Störungscaches. Die Fahrzeuganalyse bestätigt 18 erfolgreiche begrenzte Monitorproben, aber doppelte Quellenstände und häufige Korrekturpausen. Die abgeleiteten Verbesserungen sind in 0.11.16 umgesetzt; Ergebnisse und Grenzen: [Befunde und Prioritäten](docs/vehicle-audit-20261112.md).

0.11.16: alle aktivierten Linien auf Stationsmarkern, sofortige Fußwegkarte, Quellencache-Planung, atomare Tab-Sperre, Requestvereinigung, Fehler 316, ETA-Kontinuität und begrenzte Randprojektion. Zwei unabhängige Quellenstände bleiben nötig. Physische Android-/Stationsbeobachtung und global verteilte Koordination bleiben gesondert.

0.11.17: Die ganze Fahrzeugansicht startet automatisch nach der geprüften Linienbasis, ohne Start-/Pause-Steuerung. Unsichtbar stoppen, bei Rückkehr automatisch fortsetzen; bestehende Abrufgrenzen und geschlossene eingebettete Stationspanels erhalten.

Bei gewählter Station zeigt die Fahrzeugseite den Countdown für genau das nächste Fahrzeug: groß in Minuten als Kartenüberlagerung, sonst als kompakte Zeile. Er nutzt vorhandene frische Prognosen; ein Ersatz aus dem Fahrzeitprofil bleibt als Fahrplan-Schätzung erkennbar. Keine neuen Abfragen oder behaupteten Fahrzeugpositionen allein durch den Countdown.

0.11.18: Der gemeinsame Standort-Hook wartet nach `whenReady` zusätzlich bis nach dem gesamten ersten Ladeereignis, damit zuvor eingereihte SVG-Renderer bereit sind. Frühes Entfernen verwirft die Anmeldung. Stationskarten initialisieren ihre Ansicht vor Vektoren und entsorgen einen unvollständigen Aufbau vor einem erneuten Versuch. [Diagnose und Abnahme](docs/map-overlays-20261112.md).

0.11.19: Eine gemeinsame Liniensitzung für Karte, Schema und Dein Halt. Stationswahl erhält Prognosen, IDs, Bestätigung und Abruf-Countdown; der Stationsbereich erhält Vorrang. Ganze lange Linien werden fair in maximal 24 RBL großen Abschnitten innerhalb derselben Abrufgrenzen aktualisiert. Schmale Ansichten verwenden einen kompakten Fortschrittsbalken.

0.11.21: Fahrzeugdaten und nächster Abruf bleiben auch beim Wechsel zwischen unterschiedlichen Seiten erhalten. Derselbe geprüfte Datenstand für Verbindungs-/A-nach-B-Panels und ganze Linie; altersgerechte Fortsetzung statt neuer Initialisierung. Kurzer Balken, verständlicher Status und Aktualisierungs-Countdown auf allen Bildschirmgrößen.

0.11.22: Einheitliche Warnmeldungen mit einmaligem Symbol/Linienkennzeichen und zentraler Übersicht statt wiederholter Kartenwarnungen. A nach B übernimmt den vorhandenen Meldungscache einschließlich Alter und leerer Bestätigungen; gespeicherte Wege berücksichtigen zusätzliche Fahrtabschnitte im gemeinsamen begrenzten Abruf. [Darstellung und Datenvertrag](docs/warning-panel.md).

0.11.23: Genau eine aktive Zuständigkeit für Fahrzeugpositionen in der PWA. Neue Linie beendet den vorherigen Poller bzw. Panels-Abfrageumfang vor Übernahme; verborgene und gespeicherte Linien bleiben passiv. Warnungsfix und Darstellung aus 0.11.22 enthalten.

Wear 0.8.1: Fahrzeugdaten über Ansichts- und Stationswechsel behalten, geteilte Liniensitzung, acht priorisierte Stations-RBLs, kompakter Fortschritt statt leerem Schema. Karten-Zentrierung weiterhin als Symbol, jetzt mit Such-/Ergebnis-/Fehlerrückmeldung. [Bedienwege und Grenzen](docs/wear-experience.md).
