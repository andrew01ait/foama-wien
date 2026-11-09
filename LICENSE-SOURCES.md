# Quellen und Lizenzhinweise

- Stadt Wien – Wiener Linien, Haltestellen und Live-Monitor: CC BY 4.0; Nennung „Datenquelle: Stadt Wien – data.wien.gv.at“. Keine Zugehörigkeit zum Betreiber.
- ÖBB GTFS: CC BY 4.0 nach offiziell akzeptierten Nutzungsbedingungen; die Rechte und Gültigkeitszeiträume hängen von der bereitgestellten Ressource ab.
- OpenStreetMap: © OpenStreetMap-Mitwirkende, ODbL; beim Verwenden von OSM-Karten Copyright und Tile Usage Policy beachten.
- Valhalla/Leaflet: Open-Source-Komponenten; Quellen und Betreiber bei einer Produktionsbereitstellung zusätzlich in die App-Dokumentation aufnehmen. Demodienste sind keine zugesicherte Produktivinfrastruktur.
- QR-Bibliothek ZXing Core: Apache 2.0 (Build-Abhängigkeit, nicht eingebetteter Quellcode).

## Ausgelieferter Haltestellenindex v0.1.2

Quelle: Stadt Wien / Wiener Linien, CC BY 4.0, offizielle Datei https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-haltepunkte.csv. Abruf 07.11.2026; gruppiert/konvertiert mit scripts/prepare_stops.py zu 1.811 Haltestellengruppen. Keine erfundenen Koordinaten oder RBL-IDs.

## Stationslinien und ungefähre Straßenumgebung v0.1.4

- Stadt Wien / Wiener Linien, CC BY 4.0: [Linien](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-linien.csv), [Fahrwegverläufe](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-fahrwegverlaeufe.csv), [offizielle OGD-Dateibeschreibung](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien_ogd_Beschreibung.pdf). Abruf 07.11.2026, lokal konvertiert; Kataloglinien garantieren keinen aktuellen Betrieb oder eine Abfahrt.
- Datenquelle Stadt Wien – data.wien.gv.at, CC BY 4.0: [Adressen Standorte Wien](https://www.data.gv.at/datasets/1d5c2411-9719-4c8f-b99d-57a5f4a4ae41), WFS `ogdwien:ADRESSENOGD`. Abruf 07.11.2026: 191.470 Hauptreferenzen, auf 79.352 Straßen-/PLZ-Punkte reduziert; keine Hausnummern im ausgelieferten Index. Nur ungefähres Umfeld, keine postalische Zustelladresse.
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started): externe HTTPS-Links ohne eingebettetes Google SDK/API-Key. Erst beim Antippen wird der gewählte Ort bzw. die Navigation an Google übergeben.
- [Chrome Manifestupdates](https://web.dev/articles/manifest-updates): Launcher-/WebAPK-Aktualisierung auf Android separat von Webseiten-/Service-Worker-Updates.

## Leaflet lokal gebündelt v0.1.5

Leaflet 1.9.4, BSD-2-Clause, unveränderte Distribution unter pwa/vendor/leaflet, Lizenzdatei daneben. Quelle: https://unpkg.com/leaflet@1.9.4/dist/ (vom bestehenden verwendeten Release); Lizenz: https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE. Kartenkacheln weiterhin © OpenStreetMap-Mitwirkende.

Betriebsmeldungen: offizielle Wiener-Linien-Monitorantwort mit fest aktivierten Kategorien stoerunglang, stoerungkurz, aufzugsinfo, fahrtreppeninfo, information. Details aus https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf, V1.6 vom 19.10.2026; Angaben und Gültigkeit stammen vom Anbieter.

## Vorbereitete A-nach-B-Verarbeitung

MOTIS-API-Spezifikation: https://raw.githubusercontent.com/motis-project/motis/refs/tags/v2.10.2/openapi.yaml. Ein einzelner öffentlicher Transitous-Prototypabruf gemäß https://transitous.org/api/ geprüft; minimierter datierter Testdatensatz mit öffentlichen Testpunkten und Quellenangabe unter tests/fixtures. Keine aktive Produktionsanbindung. Vor Dauerbetrieb passende Projektlizenz, nicht kommerzielle Nutzung, Anbieter-/OSM-Attribution und Kontaktangabe klären. Diese Quellenliste vergibt keine offene Lizenz für den eigenen App-Code.

## A nach B ab PWA 0.2.0

Transitous produktiv für ausdrücklich ausgelöste Planung/Orts-/Fußwegsuche; [Datenquellen](https://transitous.org/sources/), [Nutzungsbedingungen](https://transitous.org/api/), © OpenStreetMap-Mitwirkende. Eigener App-Code unter [MIT](LICENSE); Quellenliste und Daten werden dadurch nicht pauschal MIT-lizenziert. [Aktuelle Lizenz-/Datenschutzhinweise](docs/licenses.md). Frühere Prototyp-Beschreibungen oben sind historische Stände.
