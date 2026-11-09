# Eine foama-PWA für Wien, Linz, Graz und Salzburg

Ursprüngliche Analyse vom 09.11.2026. **Die empfohlene PWA-Umsetzung ist inzwischen in 0.7.0 erfolgt:** [Stadtprofile](city-profiles.md), [Wiener Fahrplan](timetable-fallback.md). Die folgenden Befunde beschreiben die Recherchebasis und weiterhin offene Anbietergrenzen. Auftrag: dieselbe installierte PWA soll abhängig vom Aufenthaltsort vorübergehend als foama-linz, foama-graz bzw. foama-salzburg auftreten. Kein neuer App-Klon, keine zusätzlichen Konten für Fahrgäste. PWA zuerst; ein späterer Uhr-Ausbau kann denselben Datenvertrag nutzen. Push bleibt ausschließlich PWA-Thema.

## Ergebnis und Datenquellen

| Stadt | Fahrpläne und Haltestellen | Echtzeit und praktischer Nachweis | Offene Punkte |
| --- | --- | --- | --- |
| Linz | LINZ AG / MVO GTFS; OÖVV und ÖBB für weitere Verkehre ergänzen | Öffentlich dokumentierte EFA-Schnittstelle liefert in eigener Probe am Hauptplatz fünf Abfahrten mit dateTime/realDateTime und realtime=1, ohne API-Key | Legacy; Einstellung war bereits für 2024 angekündigt. Vollständigkeit, Lastgrenzen und Störungsdaten nicht zugesichert. |
| Graz | MVO-Steiermark-GTFS mit Graz Linien; ÖBB separat | Transitous führt fünf GTFS-RT-Quellen der Verkehrsverbund Steiermark GmbH. Eigene Hauptplatz/Congress-Abfrage lieferte aktuelle realTime=true-Abfahrten der Graz Linien | Betreiber-/Linienabdeckung und Aktualität breiter prüfen. Direkte TRIAS-Alternative verlangt Zugangsdaten und Zustimmung zu Bedingungen. |
| Salzburg | MVO-Salzburg-GTFS mit OBus, Albus, Regionalverkehr und Lokalbahnen; ÖBB separat | Transitous liefert Abfahrten. Die eigene Hauptbahnhof-Stichprobe war ohne Echtzeit (realTime=false / NO_RT_DATA) | Kein vergleichbar frei dokumentierter umfassender Echtzeitzugang bestätigt. Einzelne Stichprobe beweist keine generelle Abwesenheit von Echtzeit. |

Die nationalen Soll-Fahrpläne sind kostenlos nutzbar; ein eigener MVO-Download verlangt einmalige Registrierung und manuelle Lizenzannahme. Anschließend ist ein automatisierter Import mit Authentifizierung dokumentiert. Das ist ein Betreiberzugang für unseren Import, keine Registrierung jedes App-Nutzers. Namensnennung und konkrete Quellenbedingungen erhalten. Keine Lizenzannahme, Zugangseinrichtung oder Kontaktaufnahme im Rahmen dieser Recherche durchgeführt.

Transitous enthält bereits Daten für alle drei Regionen und ist für unser veröffentlichtes nichtkommerzielles Open-Source-Projekt eine naheliegende gemeinsame Basis. Die API ist Best Effort; zusätzliche Städte erhalten keine vervielfachten Planungsbudgets. Gemeinsames Caching und bei wachsendem Betrieb Abstimmung über die Last bzw. eigener Routingbetrieb erforderlich. Eigene Verarbeitung darf die Datenbedingungen der jeweiligen Quellen nicht pauschal durch unsere MIT-Code-Lizenz ersetzen.

## Was am bestehenden Code geändert werden müsste

- **Stadtkontext:** Profile für Gebiete, Betreiber, Quellen, Farben und Fähigkeiten. Eine kleine Stadtauswahl mit Automatisch/Manuell; A nach B bleibt dritter Haupttab. Header und Daten wechseln mit stabil bestätigter Position, Installation und URL bleiben erhalten. Keine neue Hintergrundortung und kein GPS-Verlauf.
- **Gemeinsamer Datenvertrag:** Stations-, Linien-, Richtungs- und Bahnsteigkennung einschließlich Herkunft; Sollzeit, Echtzeit, Ausfall und Aktualität getrennt. Keine Zuordnung allein über Stationsnamen, Liniennummern oder räumliche Nähe. Aktuelle RBL-/Wiener-Linien-Filter und passives Linienlernen sind providerspezifisch und benötigen eine Adaptergrenze.
- **Fahrplanbasis:** GTFS-Kalender, Ausnahmen, Tageswechsel und Zeiten nach 24 Uhr auswerten. Änderungen serverseitig regelmäßig prüfen; Stadtpakete nur bei Bedarf auf das Gerät laden. Einen österreichweiten Rohdatensatz nicht bei jedem Worker-Request oder auf der Uhr parsen.
- **Monitor und Routen:** Wien behält den direkten Live-Adapter. Graz kann den MOTIS-stoptimes-Endpunkt nutzen; Linz einen begrenzten EFA-Adapter mit Fahrplanersatz. Salzburg zunächst eindeutig als Fahrplan anzeigen. Wiener Suchbevorzugung, lokale Adress-/Stationsindizes und Stationszuordnung des Routenmonitors anpassen. Stadtübergreifende A-nach-B-Wege dürfen nicht vom aktuellen Stadtkontext abgeschnitten werden.
- **Erhaltene Nutzerdaten:** Bestehende Wiener Favoriten/Orte bleiben erhalten. Favoriten erhalten Herkunft und Stadt; allgemeine Gehgeschwindigkeit/Reserve/Theme können gemeinsam bleiben. Explizite Auswahl anderer Städte auch ohne GPS. Import/Export und später die Uhr nur mit nachgewiesen unterstützten Katalogen erweitern.
- **Fähigkeiten statt Versprechen:** Störungsfeeds, Fahrzeug-Barrierefreiheit und echte Stationsadressen je Quelle separat prüfen. Keine Pushs zu Aufzügen/Fahrtreppen; kein Störungsfrei-Status aus einem fehlenden regionalen Feed. Geplante Zeiten niemals LIVE nennen.

Aktueller Codebefund: Der gemeinsame Planer akzeptiert bereits einen großen Österreich-Koordinatenbereich, die Ortssuche bevorzugt jedoch Wien. Stationskatalog, RBL-Batching, Quellenfilter, Linienfarben und Push-Relevanz sind weiterhin stark an Wiener Linien gebunden. Es ist ein überschaubarer Architekturumbau mit anschließender Datenabnahme, kein bloßer Texttausch.

## Empfehlung

1. Den noch offenen unabhängigen Wiener Sollfahrplan-Fallback als gemeinsamen Baustein fertigstellen. Der aktuelle GTFS-Import bestätigt ausschließlich Stations-/Linienzuordnungen; API-Sollzeiten ersetzen keine Abfahrtsdatenbank bei leerer oder fehlender API-Antwort.
2. Stadtprofile und Providergrenzen einführen, danach Graz und Linz als Pilotregionen. Graz hat mit dem vorhandenen Transitous-Dienst einen besonders kurzen Integrationsweg; Linz hat einen konkret erfolgreich geprüften Live-Endpunkt, benötigt aber einen belastbaren Fallback.
3. Salzburg zunächst mit vollständig gekennzeichnetem Fahrplanmodus anbieten und Live-Daten erst nach bestätigtem Zugang/Abdeckung ergänzen. Standortwechsel, Grenzfälle, Nacht-/Feiertagsbetrieb und Erhalt von Wiener Favoriten vor breiter Veröffentlichung prüfen.

Die ursprüngliche Forschung veränderte weder App-Funktionen noch Wear-Version. Der folgende PWA-Ausbau ist separat unter 0.7.0 dokumentiert; die Wear-Version bleibt unverändert. Eigene Stichproben sind Machbarkeitsnachweise, keine dauerhaften Verfügbarkeits-/Vollständigkeitsgarantien.

## Primärquellen und Nachweiswege

- [Nationaler Zugangspunkt: Soll-Fahrplandaten, beteiligte Verbünde und kostenlose Nutzung](https://mobilitaetsdaten.gv.at/daten/soll-fahrplandaten-gtfs)
- [MVO-Datenkatalog](https://data.mobilitaetsverbuende.at/de/data-sets), [Nutzungsbedingungen](https://mobilitaetsverbuende.atlassian.net/wiki/spaces/DBP/pages/185237505/Terms%2Bof%2BUse), [Download-API und manuelle Voraussetzungen](https://mobilitaetsverbuende.atlassian.net/wiki/spaces/DBP/pages/231145473/Public%2BAPI%2BDownload%2Bfor%2BDBP)
- [Offizielles Linzer EFA-Dokumentationsverzeichnis](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/fahrplan/), [Ars Electronica 2026: aktuelle getestete API-Referenz samt Legacy-Hinweis](https://hackathon.ars.electronica.art/de/datasets/efa-fahrplanauskunft/api/)
- Eigene Linz-Abfrage: offizielles XML_DM_REQUEST, stateless=1, mode=direct, useRealtime=1, Hauptplatz-ID 60501010, limit=5; keine privaten Standortdaten.
- [Verbund Linie: offizielle TRIAS-FAQ, Bedingungen und Zugang](https://www.verbundlinie.at/de/kundenservice/weitere-infostellen/faqs-hilfe/faq-zur-ogd-service-schnittstelle-trias)
- [Transitous: tatsächliche Datenquellen einschließlich Steiermark-Echtzeit](https://transitous.org/sources/), [API-Nutzungsbedingungen](https://transitous.org/api/), [Österreich-Feedkonfiguration](https://github.com/public-transport/transitous/blob/main/feeds/at.json)
- Eigene Transitous-Abfragen: öffentlicher produktiver geocode- und v6/stoptimes-Endpunkt, jeweils acht Abfahrten, ausdrücklich öffentliche Beispielstationen Graz Hauptplatz/Congress und Salzburg Hauptbahnhof; identifizierender App-User-Agent. Keine dauernden Abfragen oder Änderungen an Nutzerdaten.
