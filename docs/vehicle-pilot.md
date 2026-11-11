# U6-Fahrzeugschätzung · Pilot in Karte und Schema

PWA 0.10.0, 11. November 2026. `fahrzeuge.html` zeigt denselben Schätzer auf echter OpenStreetMap-Karte und im vertikalen Linienschema. Testabschnitt: Josefstädter Straße U – Thaliastraße U – Burggasse, Stadthalle U, beide Richtungen getrennt. Keine allgemeine Fahrzeugverfolgung für sämtliche U-Bahn-, Tram- oder Buslinien.

## Reproduzierbare Grundlage

`python3 scripts/prepare_vehicle_pilot.py FAHRPLAN.zip` benötigt genau die zum ausgelieferten Fahrplan gehörende offizielle GTFS-Datei. SHA-256, Kalenderschlüssel und Linienversion müssen übereinstimmen. Keine automatische Erneuerung. Der Pilot enthält 2.311 südliche und 2.301 nördliche kalendergebundene GTFS-Fahrten mit tatsächlicher Ankunft/Abfahrt an drei konkreten Steigen, insgesamt 427.945 Bytes. Keine Roh-GTFS-Datei im Deployment.

Die RBL-Seiten wurden anhand echter Antworten geprüft, ausdrücklich nicht aus GTFS-direction_id geraten:

| Folge | Richtung Siebenhirten · R / 2 | Richtung Floridsdorf · H / 1 |
| --- | --- | --- |
| 1 | Josefstädter Straße · 4607 | Burggasse, Stadthalle · 4620 |
| 2 | Thaliastraße · 4608 | Thaliastraße · 4621 |
| 3 | Burggasse, Stadthalle · 4609 | Josefstädter Straße · 4622 |

Zeitliche Zuordnung prüft Route, Modus, Ziel, richtige RBL-Seite, Richtung und Richtungs-ID. Der GTFS liefert hier minutengenaue Sollzeiten, der Monitor sekundengenaue Sollzeiten; die Probe zeigte beispielsweise 08:49:30 / 08:51:00 / 08:52:30 gegenüber 08:49 / 08:51 / 08:52 im GTFS. Der begrenzte Abgleich erlaubt deshalb bis 60 Sekunden Sollabweichung. Er wählt keinen einzelnen nächsten Nachbarn: konkurrierende mehrstationsfähige Kandidaten und doppelte Beobachtungen bleiben offen. Identische Sollzeiten garantieren keine Fahrzeugidentität.

Ein neuer Kandidat benötigt passende Meldungen an mindestens zwei Stationen und zwei verschiedene, frische Quellenstände. Cachewiederholungen zählen nicht erneut. Fahrtrichtung, Verkehrsdatum einschließlich Nachtfahrten und Sommerzeit, Zeitfolge, Abschnittsdauer und onStop-Anker werden gemeinsam geprüft. Interne IDs enthalten Richtung/Testlauf und laufende Nummer; ein neues Fahrzeug erbt nicht die ID des Vorgängers. Zuordnungen sind vorläufige Fahrt-Hypothesen, keine Wagen- oder offiziellen Zugnummern.

Alte Stationsanker dürfen begrenzt die geschätzte Abfahrt eines Abschnitts beschreiben, wenn die nächste Station die Fahrt weiterhin frisch zugeordnet meldet. Zwischen beobachteter Abfahrtsprognose und aus nächster Prognose sowie GTFS-Aufenthalt geschätzter Ankunft wird nach echter Streckenentfernung interpoliert. Beide Ansichten verwenden exakt denselben Fortschritt. Kein gerader Ersatzverlauf und keine Bewegung jenseits des Testabschnitts. Fehlende aktuelle Zuordnung, Mehrdeutigkeit oder widersprüchliche Meldungen entfernen die einzelne Lage; Verschwinden allein bestätigt keine Abfahrt. Größere Rückkorrektur unterbricht die Animation bis zu erneuter stabiler Evidenz.

## Tatsächlicher Datenversuch

Fünf begrenzte Abfragen am 11.11.2026 von **08:49:32 bis 08:52:07 Wiener Zeit**, jeweils sechs feste öffentliche RBLs beider Seiten. Keine Nutzerposition, kein Hintergrunddienst. Ein auf die erforderlichen öffentlichen U6-Felder reduzierter Mitschnitt ist als `tests/fixtures/u6-pilot-live.json` reproduzierbar. Rohantworten mit sonstigen Meldungen bleiben ausgeschlossen.

Der südliche Kandidat behielt dieselbe temporäre ID über die Anker Josefstädter Straße → Thaliastraße → Burggasse, Stadthalle. Zwei modellbasierte Übergaben aus onStop-Stationsfolgen und eine interpolierte Lage zwischen Thaliastraße und Burggasse werden im Test geprüft. Nördlich gab es eine Rückkorrektur mit Unterbrechung und anschließender erneuter Zuordnung; eine weitere Stationsfolge blieb unter derselben ID. Das ist ein erfolgreicher Zuordnungsversuch, keine unabhängige Bestätigung desselben physischen Zuges oder einer räumlichen Genauigkeit.

## Betrieb und Bedienung

- Bewusster Start, Pause/Fortsetzen, Richtungswechsel, Karten-/Schemawechsel, Fahrt auswählen und auf der Karte folgen. Daten- und Modellhinweise beginnen geschlossen. Direkter Schema-Einstieg mit `?ansicht=schema`.
- Ein sichtbarer Live-Abruf frühestens alle 30 Sekunden, genau drei RBLs der gewählten Richtung. Derselbe `foama.wl.lastApiAttempt.v1`-Schlüssel wie Monitor/Reiseansicht; Serverbudget, HTTP-Backoff und Retry-After erhalten. Kein Zusatzabruf durch Darstellungswechsel, Markertap oder Animationsbild.
- Pause stoppt Netzwerk und Bewegung und zeigt den eingefrorenen Stand. Ausblenden, Richtungswechsel und pagehide brechen Requests ab und verwerfen verspätete Antworten. Wiederaufnahme nach längerer Pause sammelt neu. Reduzierte Bewegung zeigt nur Lageänderungen je Quellenstand.
- Quellenzeit aus Monitor- und Serverzeit, nicht aus Cacheabrufzeit. Spätere/falsche Zeitstempel ablehnen. Nach 60 Sekunden einfrieren, nach 90 Sekunden ausblenden. Bei Abruffehler oder unvollständiger Stationsabdeckung keine fortlaufende Animation.
- IDs/Zuordnungen höchstens 64 und zehn Minuten, Ereignisse höchstens 80, nur Arbeitsspeicher. Kein Nutzer- oder Bewegungsverlauf, keine allgemeine Diagnose-Erweiterung. Nur öffentliche, versionsgeprüfte Fahrplanbasis kann über den bestehenden Katalogspeicher offline vorliegen; kein Offline-Live-Replay.
- Originale Wear-0.7.4-APK, Signatur und Feedmetadaten unverändert. Kein neues Störungs-Push-Verhalten und keine GPS-Anfrage.

354 Web-/Server-Tests einschließlich 16 Pilotregressionen sowie zwölf Python-Prüfungen bestanden. Der Site-Build enthält echte Daten und beide Ansichten. Die verwaltete Vorschau wurde versucht; nach Bereinigung einer nicht erreichbaren Vorschau blockierte die Browser-URL-Richtlinie die Beobachtung. Keine visuelle Browser- oder physische Fahrtenabnahme behaupten.

## Nächste Abnahme

Karte und Schema auf dem Telefon prüfen, tatsächliche Zugfolgen an den drei Stationen unabhängig vergleichen und insbesondere Spitzenverkehr, längere Störung, Kurzführung, Signalhalt, Netzverlust und Tageswechsel beobachten. Erst danach den Abschnitt erweitern und andere U-Bahn-Linien, Bus/Tram oder regionale Fahrtkennungen getrennt anbinden. Keine eigene mehrdeutige Zuordnung als bestätigtes Trainingssignal verwenden.

Primärquellen: [Wiener-Linien-Realtime V1.6](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf), [offizieller GTFS](https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/gtfs.zip), [GTFS-Zeitvertrag](https://gtfs.org/documentation/schedule/reference/#stop_timestxt). Der Monitor beschreibt Abfahrtsprognosen und einen Stationsstatus, keine gemessene Fahrzeugposition.
