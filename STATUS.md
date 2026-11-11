# Aktueller Projektstand

Stand: 11. November 2026. **PWA 0.11.8, Wear 0.7.4 / Code 26.** Verbindlich sind PWA-/Wear-Konfiguration und Updatefeed. Frühere Details: [Release-Verlauf](docs/release.md), [Tests](docs/tests.md).

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
| Fahrzeugschätzung | [Fahrzeuge im Anflug](https://foama-wien.endruuu.chatgpt.site/fahrzeuge.html): 165 Linien, 617 eindeutig zugeordnete Varianten, Karte/Schema sowie horizontale Ausschnitte in Stations- und A-nach-B-Einstiegsdetails; Prognoseschätzung, keine GPS-Positionen |
| Städtebild | Proportionale Collage Wien/Graz/Linz/Salzburg mit Bahn, Tram und Obus; Salzburg-Einschränkung im FAQ statt separatem Banner |
| Öffentliche Hilfe | [Städte & Funktionen](https://foama-wien.endruuu.chatgpt.site/staedte.html), mit Verfügbarkeitssymbolen und aufklappbaren FAQ; verlinkt in App-Einstellungen, Footer und Uhr-Webseite |
| Störungen | Wiener Daten; PWA Web Push nach Opt-in, keine Aufzug-/Fahrtreppen-Pushs; keine regionalen Störungsfeeds und kein aktiver nativer Push |
| Veröffentlichung | Öffentliches GitHub, Source-ZIP und Site getrennt abgleichen; Originalsignatur, Paket und lokale Daten erhalten |

## Fahrplanstand und Aktualität

1.695 Wiener Stationen und 173 Linien, gültig 09.11.–12.12.2026. Vollständige offizielle Quelle am 10.11.5026 um 09:47 Wiener Zeit per SHA-256 geprüft: unverändert zum Import. Serveränderungsdatum und ZIP-Dateistand 09.11.; kein ausdrücklich angegebenes Veröffentlichungsdatum. Die Fahrplanansicht unterscheidet diese Angaben, Import und gespeicherten Prüfstand.

Wöchentliche Quellenprüfung ab 16.11. montags; meldet neue Quellen, höchstens 14 Tage Restgültigkeit, Ablauf und anhaltende Prüfprobleme. **Noch kein automatischer Neuimport/Deploy.** Andere Städte haben kein eigenes Offline-Sollfahrplanpaket. Die native Uhr hält nur den begrenzten bisherigen Abfahrtencache, keine vollständigen Linienfahrpläne.

## Verifikation und Grenzen

Aktuelle PWA-Abnahme: geografischer Import, Kalender-/Quellbindung, Offlinecache, Marker-Auswahl und PDF mit echten U1-Daten; Prüfzahlen siehe [Tests](docs/tests.md). Der aktuelle native Release hält Update-Dialoge bis zur Android-Übergabe sichtbar wach und bereitet Installationen ohne blockierte Oberfläche vor. Kurze sichtbare Unterbrechungen erhalten nur den bestätigten Update-Vorgang; Display aus und echtes Verlassen bereinigen weiter. Android kann beim eigentlichen APK-Ersetzen den bisherigen Prozess beenden. Er zeigt weiterhin die aktive Stadt über der Hauptnavigation und rückt Favoritensegmente, Verkehrsmittel und Abschnittsüberschrift enger zusammen; große getrennte Tippflächen bleiben erhalten. Stadtfilter für beide Routenlisten, erreichbare Hauptnavigation und genaue Wiederholungsplanung bleiben erhalten. Fehlerpausen bleiben je Stadt erhalten, die globale 30-Sekunden-Sperre gilt auch beim Wechseln. Aktuelle native Abnahme und signierte Metadaten: [Wear 0.7.4](docs/wear-os-release-0.7.4.md). Öffentliche Einzelproben aus der Buildumgebung lieferten Graz/Linz LIVE und Salzburg Fahrplan in jeweils rund sieben Sekunden; dies ist keine Laufzeitmessung auf der Uhr. Physische OnePlus-Abnahme bleibt separat.

Wiener Störungsquelle weiterhin stündlich im Hintergrund, bei ohnehin aktiver PWA ungefähr alle fünf Minuten ergänzend. Kein neuer externer Timer, keine Hintergrundortung oder Abfahrtsabfragen. Nutzer bestätigt Empfang einer PWA-Testnachricht; tatsächliche lokale Geräteanzeige und reale Störungszustellung weiter praktisch beobachten.

## Nächste Arbeiten

- Physisches Uhr-Update über bestehende Installation; GPS-Stadtwechsel, regionale Favoriten und QR auf OnePlus abnehmen.
- Wiener Fahrplan vor dem 13.12. erneuern; später automatischen Import-/Veröffentlichungsbetrieb ergänzen.
- [U6-Pilot](docs/vehicle-pilot.md) auf dem Telefon und anhand tatsächlicher Stationsbeobachtung vergleichen; Karte/Schema, enge Takte und Korrekturen abnehmen. Zusätzlich Bus-/Tram-Stationsfolgen, enge Takte und die horizontalen Stationsausschnitte unabhängig vor Ort abnehmen.
- Regionale Störungsfeeds und unabhängige regionale Offlinepakete gesondert anbinden; nötige MVO-Registrierung/Lizenzannahme erfolgt nicht automatisch.

Neue Arbeiten starten über die [Dokumentationsübersicht](docs/README.md).
