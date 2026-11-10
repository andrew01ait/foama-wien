# Stadtprofile · PWA 0.8.2 / Wear 0.7.1

Eine Installation, bestehende URL/Manifest-ID und vorhandene Speicherschlüssel. **Wien ist Standard.** Nur bei sichtbarer App und vorhandener Standortfreigabe darf ein frischer genauer GPS-Fix zu Graz, Linz oder Salzburg wechseln. Es werden keine zusätzlichen Hintergrundortungen eingeführt.

## Bedienung

Manuelle Stadtwahl **ausschließlich Einstellungen → Stadtprofil**: Automatisch, Wien, Graz, Linz, Salzburg. Keine weitere Auswahl in Header, Haupttabs oder Banner. Manuell bleibt bis zur Rückkehr zu Automatisch aktiv. Während des Katalogladens zeigt die App eine leere beschriftete Ladeansicht statt Karten der vorherigen Stadt. Liegt die vorhandene Position außerhalb der manuell gewählten Stadt oder fehlt sie, beginnt die Ansicht mit einem ausdrücklich manuellen Startpunkt in der Stadtmitte, auch nach einem Neustart ohne neue Ortungsfreigabe. Einstellungen und globale Filter bleiben erhalten; Favoriten werden nur nach Stadt betrachtet, niemals gelöscht oder durch automatische Listen ersetzt. Manuelles Verschieben verändert ausschließlich die Reihenfolge innerhalb dieses Stadtprofils. In der PWA bleiben eigene Orte und A-nach-B-Favoriten stadtübergreifend zugänglich. Auf der Uhr zeigen A nach B und Favoriten → Routen ab 0.7.1 nur Wege der gewählten Stadt. Die gemeinsame lokale Liste und QR-/Dateiexporte behalten alle Routen. Ein stadtübergreifender Weg erscheint in jedem betroffenen Stadtprofil; eine Routenfamilie einschließlich Alternativen bleibt ein einzelner Favorit. Zuordnung anhand bekannter Stationskennungen und fester Start-/Zielpunkte, niemals anhand freier Namen oder der aktuellen GPS-Position.

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

Die native Uhr 0.7.1/23 unterstützt dieselben vier Stadtprofile mit eigenen lokalen Favoriten. Manuelle Wahl ausschließlich Mehr → Stadtprofil; präzise Vordergrundortung kann automatisch wechseln. Regionale Stationen und Routen werden per QR/Datei bewusst übernommen; der neue QR-Handschlag city-profiles-v1 hält ältere Uhren weiterhin geschützt. Native Vollplanung, Karten und vollständige Offline-Linienfahrpläne bleiben in der PWA. Direkter Uhr-Push bleibt deaktiviert.

Quellen und ursprüngliche Proben: [Machbarkeitsanalyse](multi-city-feasibility.md), [Transitous API](https://transitous.org/api/), [Datenquellen](https://transitous.org/sources/), [LINZ AG EFA](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/fahrplan/).

Rückkehr zu Automatisch: Eine vorhandene GPS-Freigabe wird erneut geprüft; ohne Freigabe bleibt der bewusste Standort-Button erforderlich. Ein späterer Stopp verwirft eine noch laufende Berechtigungsantwort. Bei konkurrierender manueller Auswahl darf nur die zuletzt gewählte Stadt die manuelle Position setzen.

## Ladeverhalten der Uhr ab 0.7.1

A nach B behält die Hauptleiste mit aktivem Tab; Mehr → Stadtprofil kehrt zur aufrufenden Routenansicht zurück. Nach Rückkehr aus Einstellungen wird eine fällige Abfrage sofort angestoßen. Eine noch laufende gemeinsame Sperre bekommt einen einmaligen sichtbaren Termin genau an ihrem Ende, statt auf einen zusätzlichen 30-Sekunden-Takt zu warten. Hintergrund, ausgeschalteter Bildschirm, Transfer und Einstellungsseiten beenden bzw. unterbinden diese Arbeit.

Fehlerpausen und Fehlversuchszähler sind lokal pro Stadt getrennt; beim Zurückwechseln bleibt die vorherige Pause erhalten. Der Mindestabstand aller realen Abfragen gilt stadtübergreifend weiter. Der freiwillige Ultra-Sparmodus hält zusätzlich seine 90 Sekunden ein. Laden wird unmittelbar angezeigt; vorhandene brauchbare Daten bleiben währenddessen sichtbar. Fester App-User-Agent ohne Gerätekennung; Anbieterbudgets, Serverzeitgrenzen und Salzburgs Fahrplankennzeichnung bleiben erhalten.
