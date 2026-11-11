# U6-Fahrzeugschätzung · ganze Linie in Karte und Schema

PWA 0.10.1, 11. November 2026. `fahrzeuge.html` umfasst Floridsdorf–Siebenhirten mit 24 realen Stationen je Richtung. Beide Darstellungen verwenden dasselbe Modell. Die Erweiterung und Fahrzeug-Symbole sind ausdrücklich beauftragt; andere Linien und Bus/Tram sind noch nicht angeschlossen.

## Daten und Reproduktion

```sh
python3 scripts/prepare_vehicle_pilot.py FAHRPLAN.zip
```

Die offizielle GTFS-Datei muss bytegleich zur ausgelieferten Fahrplanbasis sein (SHA-256 `c3e98ec9381a0f610a3164d0336ea93c097b0382aa81fbabb6c739becc25412f`). Kalender und Linienversion werden ebenfalls geprüft. Die Referenz `scripts/data/u6-rbl-mapping.json` enthält ausschließlich anhand echter Monitorantworten bestätigte öffentliche RBL-Seiten; optional mit `--rbl-mapping DATEI` ersetzen. Keine automatische Erneuerung.

Das Format-2-Paket enthält 2.388 südliche und 2.391 nördliche kalendergebundene Fahrten auf der kanonischen U6. Ankunft und Abfahrt stehen nur an tatsächlich bedienten Halten; ausgelassene Halte und außerhalb einer Kurzführung liegende Stationen bleiben `null`. Beispielsweise fehlen in vielen nördlichen Fahrten die Fahrgastzeiten für Neue Donau. Solche Fahrten erhalten keinen erfundenen Halt. Die tatsächlichen Zeiten bestimmen die nächsten bedienten Stationen, die echte GTFS-Geometrie bestimmt die Streckenentfernung dazwischen. Keine geraden Ersatzverbindungen.

Gzip/Base64 mit deterministischem Zeitstempel hält das ausgelieferte Paket bei 310.866 Bytes. Dekodierung ist auf vier Millionen Base64-Zeichen und zwölf Millionen entpackte Bytes begrenzt; Version und Quelldigest werden vor Verwendung gegen Fahrplan und Linienkarte geprüft. Neuer Katalogschlüssel `vehicle-pilot:u6:full-v2` trennt den alten Dreihalt-Piloten. Roh-GTFS bleibt außerhalb des Deployments.

| Südliche Folge | Station | Siebenhirten · R / 2 | Floridsdorf · H / 1 |
| --- | --- | --- | --- |
| 1 | Floridsdorf S U | 4646 | Ankunft ohne Abfahrts-RBL |
| 2 | Neue Donau | 4647 | 4644 |
| 3 | Handelskai S U | 4648 | 4643 |
| 4 | Dresdner Straße U | 4649 | 4642 |
| 5 | Jägerstraße U | 4650 | 4641 |
| 6 | Spittelau S U | 4651 | 4627 |
| 7 | Nußdorfer Straße U | 4603 | 4626 |
| 8 | Währinger Straße, Volksoper U | 4604 | 4625 |
| 9 | Michelbeuern U AKH | 4605 | 4624 |
| 10 | Alser Straße U | 4606 | 4623 |
| 11 | Josefstädter Straße U | 4607 | 4622 |
| 12 | Thaliastraße U | 4608 | 4621 |
| 13 | Burggasse, Stadthalle U | 4609 | 4620 |
| 14 | Westbahnhof S U | 4610 | 4619 |
| 15 | Gumpendorfer Straße U | 4611 | 4618 |
| 16 | Längenfeldgasse U | 4612 | 4617 |
| 17 | Niederhofstraße U | 4613 | 4616 |
| 18 | Bahnhof Meidling S U | 4614 | 4615 |
| 19 | Tscherttegasse | 4629 | 4640 |
| 20 | Am Schöpfwerk | 4630 | 4639 |
| 21 | Alterlaa U | 4631 | 4638 |
| 22 | Erlaaer Straße | 4632 | 4637 |
| 23 | Perfektastraße U | 4633 | 4636 |
| 24 | Siebenhirten U | Ankunft ohne Abfahrts-RBL | 4635 |

Die Tabelle ist in südlicher Stationsfolge; Floridsdorf wird in umgekehrter Reihenfolge befahren. Je Richtung gibt es 23 Abfahrts-RBLs. Die jeweilige Endstation hat keinen Monitor in Ankunftsrichtung; ihre Anfahrt erhält deshalb eine ausdrücklich unsichere Fahrplanprojektion und einen begrenzten geschätzten Endaufenthalt.

## Fahrt-Hypothesen und Kontinuität

Route, Modus, Ziel, RBL-Seite, Richtung und Richtungs-ID müssen passen. Der GTFS ist hier minutengenau, der Monitor sekundengenau; höchstens 60 Sekunden Sollabweichung sind zulässig. Mehrere passende mehrstationsfähige Fahrten bleiben offen. Eine mehrdeutige Station verwirft keine eindeutigen Anker an anderen Stationen. Keine Zuordnung allein nach Abfahrtsrang oder nächstem Sollzeit-Nachbarn.

Ein neuer Kandidat benötigt Meldungen an mindestens zwei Stationen und zwei unterschiedliche frische Quellenstände. Cachewiederholungen zählen nicht erneut. Verkehrsdatum, Sommerzeit, Zeitfolge, Abschnittsdauer und `onStop` werden mitgeprüft. Interne IDs gehören zu dieser kurzlebigen Fahrt-Hypothese, nicht zu einem bestimmten Wagen. Ein neuer Kandidat erbt keine Vorgänger-ID.

Frische passende Prognosen interpolieren die Lage entlang echter Streckenentfernung. Ein frischer vorheriger Anker darf ausschließlich bis zum nächsten tatsächlich bedienten Halt mit Sollfahrzeit überbrücken; diese schwächere Annahme ist grau gestrichelt und beschriftet. `onStop` ist ein Stationsstatus, keine GPS-Position. Ein fehlender Listeneintrag bestätigt keine Abfahrt.

Bei Meldelücke, Abruffehler, Mehrdeutigkeit oder großer Rückkorrektur bleibt die letzte ableitbare Lage unter derselben ID grau gestrichelt stehen. Keine unbestätigte Weiterfahrt. Einzelne fehlende Stationsdaten stoppen andere zugeordnete Fahrten nicht. Neue passende Evidenz kann dieselbe Fahrt-Hypothese wieder aufnehmen. Ab 60 Sekunden ohne frischen Quellenstand keine weitere Bewegung, nach 90 Sekunden ohne passende Meldung beziehungsweise letzte ableitbare Lage ausblenden. Die ausgewählte Fahrt erklärt den Grund; Ereignisse nennen Lücke, Wiederaufnahme, Ablauf oder geschätztes Linienende. Fahrtende/Kurzführung wird nicht über seine tatsächliche Grenze hinaus verlängert.

## Bedienung und Abrufbudget

- [Karte](https://foama-wien.endruuu.chatgpt.site/fahrzeuge.html?ansicht=karte) und [Schema](https://foama-wien.endruuu.chatgpt.site/fahrzeuge.html?ansicht=schema), bewusster Live-Start, Pause/Fortsetzen und getrennte Richtungen.
- Schema mit 100 px Abstand je Station im scrollbaren Ausschnitt. Fahrt auswählen und in Karte oder Schema folgen; manuelles Scrollen beendet das Folgen. „Gesamte Linie“ setzt Karte bzw. Schema zurück.
- Zugsymbole mit temporärer ID in Karte, Schema und Fahrzeugliste. Wiederverwendbare Bus-/Tram-Symbole sind für die spätere Anbindung vorhanden; dies stellt keine Bus-/Tram-Verfolgung bereit. Hinweise beginnen als geschlossene Klappbereiche.
- Ein sichtbarer Request mit 23 RBLs der gewählten Richtung, frühestens alle 30 Sekunden. Gemeinsamer `foama.wl.lastApiAttempt.v1`-Schlüssel, unveränderte Servergrenze von 24 RBLs, Backoff/Retry-After. Darstellungswechsel, Auswahl und Animation erzeugen keine Monitorabfrage.
- Pause stoppt Netzwerk und Bewegung. Unsichtbarkeit, Richtungswechsel und pagehide brechen Requests ab und verwerfen späte Antworten. Längere Pause sammelt neu. Reduzierte Bewegung zeigt Quellenstände statt laufender Bewegung.
- Quellenalter aus Monitor- und Serverzeit, keine Verjüngung durch Cacheabruf. Höchstens 128 Kandidaten und zehn Minuten, Ereignisse höchstens 80, nur Arbeitsspeicher. Keine Nutzerposition, kein Bewegungsarchiv, kein Hintergrunddienst oder Offline-Live-Replay. Nur öffentliche Fahrplanbasis kann lokal gespeichert sein.
- Wear 0.7.4/26 samt APK, Signatur und Feedmetadaten unverändert.

## Echte Proben und Prüfung

Drei begrenzte RBL-Entdeckungsbatches am 11.11.2026, 09:24:45–09:26:09 Wiener Zeit, bestätigten die Seiten. Fünf südliche Ganzlinienproben folgten 09:26:49–09:29:21, zwei nördliche 09:38:56–09:39:33. Jeweils mindestens 30 Sekunden Abstand, maximal 24 RBLs pro Request. `tests/fixtures/u6-full-live.json` enthält ausschließlich die notwendigen öffentlichen U6-Zeit-/Richtungsfelder und höchstens sechs Prognosen je Halt. Rohantworten mit sonstigen Inhalten bleiben ausgeschlossen.

Nach der Zweiquellenbestätigung erscheinen acht südliche bzw. elf nördliche geschätzte Lagen über große Teile der Linie. Später sind neun südliche Lagen sichtbar; drei zwischenzeitlich gehaltene Lagen werden unter denselben IDs wieder aufgenommen. Neun südliche modellbasierte Stationsübergaben werden erfasst. Die frühere Dreihalt-Probe bleibt mit eigener reduzierter Fahrplanfixture als Regression erhalten. Das belegt Verhalten des Zuordnungsmodells, keine unabhängige Bestätigung physischer Züge oder Positionsgenauigkeit.

361 Web-/Server-Tests einschließlich 23 Fahrzeugregressionen, zwölf Python-Prüfungen und 77 JavaScript-Syntaxprüfungen. Neue Fälle: vollständige RBL-Abdeckung und ein Request, gleiche IDs nach Lücke, endliche 90-Sekunden-Haltezeit, lokale Mehrdeutigkeit, ausgelassene Halte mit echter Streckenentfernung, Kurzführung und unsichere Endstationsanfahrt sowie Paketbindung. Die Browser-URL-Richtlinie blockiert die verwaltete Vorschau; keine visuelle Browser- oder physische Geräteabnahme behaupten.

## Nächste Abnahme

Karte und Schema auf dem Telefon und tatsächliche Zugfolgen unabhängig vergleichen. Spitzenverkehr, längere Störung, Kurzführung, Signalhalt, Netzverlust und Tageswechsel beobachten. Danach weitere U-Bahn-Linien und Bus/Tram getrennt anbinden. Eigene mehrdeutige Zuordnungen niemals als bestätigtes Trainingssignal verwenden.

Primärquellen: [Wiener-Linien-Realtime V1.6](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf), [offizieller GTFS](https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/gtfs.zip), [GTFS-Zeitvertrag](https://gtfs.org/documentation/schedule/reference/#stop_timestxt). Der Monitor liefert Abfahrtsprognosen und Stationsstatus, keine gemessene Fahrzeugposition.
