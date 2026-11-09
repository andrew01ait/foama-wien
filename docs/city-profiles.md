# Stadtprofile · PWA 0.7.3

Eine Installation, bestehende URL/Manifest-ID und vorhandene Speicherschlüssel. **Wien ist Standard.** Nur bei sichtbarer App und vorhandener Standortfreigabe darf ein frischer genauer GPS-Fix zu Graz, Linz oder Salzburg wechseln. Es werden keine zusätzlichen Hintergrundortungen eingeführt.

## Bedienung

Manuelle Stadtwahl **ausschließlich Einstellungen → Stadtprofil**: Automatisch, Wien, Graz, Linz, Salzburg. Keine weitere Auswahl in Header, Haupttabs oder Banner. Manuell bleibt bis zur Rückkehr zu Automatisch aktiv. Während des Katalogladens zeigt die App eine leere beschriftete Ladeansicht statt Karten der vorherigen Stadt. Liegt die vorhandene Position außerhalb der manuell gewählten Stadt oder fehlt sie, beginnt die Ansicht mit einem ausdrücklich manuellen Startpunkt in der Stadtmitte, auch nach einem Neustart ohne neue Ortungsfreigabe. Einstellungen und globale Filter bleiben erhalten; Favoriten werden nur nach Stadt betrachtet, niemals gelöscht oder durch automatische Listen ersetzt. Manuelles Verschieben verändert ausschließlich die Reihenfolge innerhalb dieses Stadtprofils. Eigene Orte und A-nach-B-Favoriten bleiben stadtübergreifend zugänglich.

Automatik: Fix höchstens 90 s alt, Genauigkeit höchstens 250 m; sehr genauer Fix bis 50 m deutlich innerhalb des Profils kann unmittelbar wechseln. Andere Fixes benötigen zwei Bestätigungen mit mindestens fünf Sekunden Abstand. Ein Kilometer Randhysterese verhindert Flattern; außerhalb unterstützter Regionen kehrt die App zu Wien zurück. Regionen sind lokale Abdeckungsradien um die Zentren, keine amtlichen Stadtgrenzen. Nur ein aktueller Fix im RAM; sessionStorage enthält zur Seitennavigation ausschließlich Stadt-ID/Zeit für maximal 90 s, keinen GPS-Verlauf. Bei fehlender/alter Erkennung startet Automatisch mit Wien.

## Datenanbieter und Fähigkeiten

| Profil | Katalog | Monitor |
| --- | --- | --- |
| Wien | bestehender offizieller DIVA-/RBL-Katalog | Wiener Linien plus unabhängiger GTFS-Fallback |
| Graz | 967 stationsweise IFOPT-Gruppen | Transitous MOTIS v6 stoptimes, Echtzeit sofern ausdrücklich geliefert |
| Linz | 674 IFOPT-Gruppen im lokalen Umfeld | feste LINZ-AG-EFA-Abfrage per IFOPT; bei Ausfall/leerer Antwort Transitous-Soll-/Echtzeitdaten |
| Salzburg | 539 IFOPT-Gruppen im lokalen Umfeld | zunächst ausschließlich geplante Zeiten; keine LIVE-Kennzeichnung |

Kataloge sind datierte öffentliche Transitous-Map-Snapshots mit MVO-/regionalen und ÖBB-Quellen, vorbereitet mit `scripts/prepare_city_catalogues.py`. Katalogdaten werden beim Zugriff auf ein Profil bzw. einen benötigten Reiseabschnitt geladen. Herkunft/IFOPT bleiben erhalten. Keine Verknüpfung nach Namensähnlichkeit oder Abstand. Ein begrenztes Board bestätigt die gelieferten Linien, ist aber kein vollständiger Negativnachweis für andere Linien. Keine künstliche ungeprüfte Linienliste vor dem ersten Boardabruf.

`regional-departures.mjs` normalisiert Soll-/Istzeit, Quelle, Fahrtrichtung, Ausfall und explizite Fahrzeug-Barrierefreiheit. EFA muss die angefragte IFOPT-Kennung selbst bestätigen. MOTIS fragt Elternstationen einschließlich Bahnsteigen ab (exactRadius=false), prüft jede Reihe aber weiterhin anhand ihrer exakten IFOPT-Station. Andere IFOPT-Stationen werden verworfen; die unpassend enge reine Elternpunkt-Abfrage kann sonst null Bahnsteigabfahrten liefern. Ausfälle werden nicht als Abfahrten angezeigt. Gleiche Liniennummern verschiedener Verkehrsmittel werden getrennt gruppiert und fokussiert. Gleiche Liniennummern verschiedener Städte sind verschiedene Identitäten; Wiener Störungsmeldungen werden nie auf Grazer/Linzer/Salzburger Linien übertragen.

`/api/regional/board` erlaubt ausschließlich eine bis drei bekannte Katalog-Stationen. Feste öffentliche Anbieter-URLs, keine beliebigen URLs, Geokoordinaten oder Gerätekennungen. 30-Sekunden-Cache und gleichzeitige Abfragen zusammenführen, ursprüngliche Abrufzeit erhalten. Sichtbare/fokussierte Stationen zuerst, restliche Stationen rotieren. PWA-Haupt- und Reiseseite teilen die lokale 30-Sekunden-Sperre. Navigation/Unsichtbarkeit verwerfen verspätete Ergebnisse. Jeder tatsächliche regionale Abruf, einschließlich zusätzlichem EFA-Fallback, zählt im bestehenden gemeinsamen maximalen 700-Abruf-/25-h-Budget für Plan/Weg/Boards; keine Vervielfachung je Stadt. Fehlende DB erlaubt keine unbeschränkten externen Abrufe.

## Grenzen und Folgearbeiten

Störungen/Push und amtliche Hausnummern sind weiterhin ausschließlich für Wien angebunden. Ohne regionalen Störungsfeed gibt es keine Entwarnung. Salzburg hat im ersten Profil einen Fahrplanmodus; die Echtzeitabdeckung anderer Städte ist Best Effort und betreiberabhängig. EFA ist ein Legacy-Zugang ohne zugesicherte Verfügbarkeit. Andere Städte haben noch kein eigenes vollständiges Offline-Sollfahrplanpaket. Eigener MVO-Download verlangt manuelle Betreiberregistrierung/Lizenzannahme; im Rahmen dieser Umsetzung wurden keine Konten oder Verträge angelegt.

Die native Uhr bleibt unverändert bei 0.6.1/21 und ihrem Wiener Katalog. QR-Auswahl sperrt explizit noch nicht unterstützte regionale Stationen/Routen statt sie auf der Uhr als funktionsfähig auszugeben; die lokalen PWA-Favoriten bleiben erhalten. JSON-Sicherung bewahrt alle Städte. Ein späterer nativer Ausbau kann dieselben IFOPT-/Providergrenzen übernehmen.

Quellen und ursprüngliche Proben: [Machbarkeitsanalyse](multi-city-feasibility.md), [Transitous API](https://transitous.org/api/), [Datenquellen](https://transitous.org/sources/), [LINZ AG EFA](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/fahrplan/).

Rückkehr zu Automatisch: Eine vorhandene GPS-Freigabe wird erneut geprüft; ohne Freigabe bleibt der bewusste Standort-Button erforderlich. Ein späterer Stopp verwirft eine noch laufende Berechtigungsantwort. Bei konkurrierender manueller Auswahl darf nur die zuletzt gewählte Stadt die manuelle Position setzen.
