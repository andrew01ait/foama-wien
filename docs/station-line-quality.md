# Stationslinien: Quellen und passive Bestätigung

Stand 08.11.2026, PWA 0.1.26 / Wear 0.3.5.

## Ursache der falschen Zuordnungen

Der ursprüngliche Import vereinigte sämtliche Einträge aus der offiziellen [Fahrweg-CSV](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-fahrwegverlaeufe.csv). Diese enthält Fahrwegvarianten ohne kalendarische Verkehrsgültigkeit. Bei Linie 1 stehen Westbahnhof-Haltepunkte beispielsweise in Pattern 28/128; Linie 2 enthält dort Pattern 46/47/48. Das belegt eine im Export vorhandene Variante, keinen aktuellen regelmäßigen Fahrgastverkehr. Die frühere Einordnung als historische Linien war ohne datierten Fahrtnachweis nicht ausreichend belegt. Grau dargestellte Badges lösten diesen Importfehler nicht.

## Geprüfte Grundlage

- [Haltepunkte mit DIVA/RBL und Koordinaten](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-haltepunkte.csv): Stationsidentität und Monitorziele.
- [Offizielle Linienbezeichnungen](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-linien.csv): Modus und Echtzeit-Namenskonvention.
- [GTFS-Fahrplan](https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/gtfs.zip): tatsächliche Fahrgastfahrten, calendar/calendar_dates und stop_times; kein Halt ohne Ein- und Ausstieg als Fahrgastbeleg.
- [Betreiberdokumentation](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf): Monitorhorizont ungefähr 70 Minuten; keine Abfahrt ist keine sichere Entwarnung/Betriebseinstellung.

Der aktuelle Offline-Snapshot prüft die Servicewoche 08.–14.11.2026, einschließlich Wochenende und Nachtverkehr. 629 bestehende Stations-Liniensätze unterscheiden sich vom früheren Import. Frische Haltepunkte-CSV: 1812 Stationsgruppen; 1713 mit belegtem Fahrgastverkehr in dieser Woche. Gruppen ohne solchen Beleg bleiben für manuelle Suche/Favoriten erhalten; es werden keine Linien erfunden. Westbahnhof enthält keine reguläre Zuordnung 1/2. GTFS-Namen für Rufbusse und Badner Bahn werden gezielt auf ihre OGD-Bezeichnungen abgebildet.

IFOPT `at:49:<Nummer>:...` wird exakt mit dem lokalen Anteil von DIVA `602xxxxx` verbunden. Es gibt keinen Entfernungs- oder Namens-Join zu Nachbarstationen wie Gerstnerstraße. Fahrwegvarianten bleiben als candidateLines zur Erkennung überholter Metadaten erhalten; sie sind keine ungefilterte UI-Liste.

Der Fahrplankatalog ist datiert und muss beim nächsten Katalogimport mit aktuellem GTFS erneuert werden. Er wird nicht bei jeder Monitorabfrage oder unbeaufsichtigt im Hintergrund neu berechnet. Gelernte Zusätze ergänzen ihn unabhängig davon.

## Gemeinsame Lernschicht

Der vorhandene Monitorrelay übernimmt allein öffentlich gemeldete Linien vom festen offiziellen Betreiberziel. Es gibt keinen öffentlichen Schreibendpunkt für frei gelieferte Zuordnungen. Im vorhandenen D1 stehen Station, Linie, Verkehrsmittel sowie erste/letzte Beobachtung. Pro Linie gelten 30 Tage Bestätigung; das Auftauchen einer anderen Linie erneuert sie nicht. Upserts verwenden monotone MIN/MAX-Werte. Verkehrsinfos/Umsteigehinweise sind keine Linienbestätigung.

Nur frische tatsächliche Betreiberantworten mit gültigem Status können lernen. Eine alte Betreiberzeit wird auch durch einen frischen Proxy-Zeitstempel nicht aufgewertet. Cachetreffer lesen vorhandene Evidenz und erneuern weder Bestätigungen noch vollständige Prüftage. Datenbankfehler liefern `foamaLines.status=unavailable`, während Abfahrten weiterhin funktionieren.

Vollprüfungen erfordern alle bekannten Plattformen der Station im selben angeforderten Batch. Filter-/Rotations-/Verbindungs-Teilbatches sind ausschließlich positive Belege. Explizite Teilantworten, Fehler und beschädigte Monitorstrukturen zählen nicht. Fehlende Monitorobjekte können fehlende Abfahrten im 70-Minuten-Horizont bedeuten; sie führen niemals sofort zu einer Entfernung.

Unbelegte Kandidaten und gelernte Zusätze können nach mehr als 30 Tagen und mindestens drei unterschiedlichen vollständigen Prüftagen aus der Anzeige fallen. Tagsüber sind mindestens zwei unterschiedliche Sechs-Stunden-Zeitbereiche erforderlich. Für Nachtlinien zählen ausschließlich Nachtprüfungen von 00–06 Uhr. Rufbusse und unabhängig durch den geprüften Fahrplankatalog belegte Linien werden nicht allein durch solche Abwesenheit entfernt. Ein neuer positiver Monitorbeleg nimmt eine unterdrückte Linie sofort wieder auf. Ohne Abfragen entstehen keine künstlichen Negativbelege.

## Clients und Datenschutz

`foamaLines` wird mit den bestehenden Monitorantworten ausgeliefert. Beide Clients übernehmen denselben Stand und halten einen begrenzten öffentlichen Offline-Spiegel. Die PWA führt zusätzlich einen ebenfalls je Linie datierten lokalen Fallback. Native Routenlisten werden atomar ersetzt, damit UI-Iteratoren während eines Netzwerkabschlusses stabil bleiben. Ältere Metadaten werden nicht zu einer aktuellen Abfahrtsprognose; deren LIVE/ÄLTER-Kennzeichnung bleibt unabhängig.

Kein GPS, Gerät/Nutzer, Favorit oder QR-Schlüssel wird mit Evidenz verknüpft. Prüftage werden pro Station/Datum/Zeitbereich aggregiert; keine individuelle Nutzungsverlaufstabelle. Beobachtungen und Prüfbelege älter als 90 Tage werden bei folgenden tatsächlichen Monitorabrufen bereinigt. Lokale Kopien sind zeitlich und in der Größe begrenzt. Bestehende Favoriten werden auch bei unterdrückter Zuordnung nicht automatisch gelöscht.

Es entstehen keine zusätzlichen Betreiberabfragen, GPS-Zugriffe oder Hintergrunddienste. Bestehendes 30-Sekunden-/24-RBL-/Sichtbarkeitsbudget und Fehler-Backoff gelten unverändert. D1-Migration 0002 ist ausschließlich schemaerweiternd und wird vor dem Worker ausgerollt.
