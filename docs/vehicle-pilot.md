# Fahrzeuge im Anflug · Karte, Schema und Stationsausschnitt

PWA 0.11.4, 11. November 2026. [Fahrzeuge im Anflug](https://foama-wien.endruuu.chatgpt.site/fahrzeuge.html): 165 Wiener Linien, davon fünf U-Bahn-, 30 Tram- und 130 Buslinien, mit 617 eindeutig zugeordneten Streckenvarianten. Das sind aus Stationsprognosen abgeleitete Lagen, keine GPS-Positionen und keine bestätigten physischen Fahrzeugidentitäten.

## Ansichten und Einstiege

| Einstieg | Darstellung und Verhalten |
| --- | --- |
| Fahrzeuge im Anflug | Linien-, Richtungs- und Variantenwahl; echte OpenStreetMap-Karte und vertikales Schema mit demselben Tracker, Pause und Fahrt folgen |
| Linienkarte | Link zur Fahrzeugansicht nur für die genau unterstützte Variante; Linie, Modus, Richtung und gewählte Station bleiben im Link |
| Stations-/Verbindungsdetails | Anfangs geschlossener Bereich „Fahrzeuge im Anflug“, mit eigener klar beschrifteter Richtungs-/Streckenwahl |
| A nach B | An der konkreten Wiener Einstiegsstation: Verbindung öffnen oder „Fahrzeuge im Anflug“ wählen; derselbe Stationsbereich, bezogen auf die gewählte Linie und Richtung |
| „Dein Halt“ in Fahrzeuge im Anflug | Derselbe horizontale Ausschnitt nach bewusster Stationswahl, höchstens fünf Halte davor und zwei danach |

Der horizontale Ausschnitt läuft in tatsächlicher Fahrtfolge von links nach rechts. Die gewählte Station ist hervorgehoben. Am Linienanfang/-ende werden fehlende Nachbarn nicht durch andere Stationen aufgefüllt. Der gesamte Ausschnitt passt ohne horizontales Scrollen in die Bildschirmbreite. Nummerierte Halte und eine kompakte Namensliste darunter halten alle Namen vollständig lesbar. Fahrzeug- und Haltekoordinaten verwenden dieselbe relative Skala. Fahrzeug-Symbole für Zug, Tram und Bus, temporäre IDs, Tastaturbedienung und reduzierte Bewegung werden unterstützt. Die ganze Strecke bleibt über den Link erreichbar.

Zweites Antippen derselben Fahrt hebt die Auswahl auf und beendet aktives Folgen. Unsichere Lagen werden ohne gestrichelten Rahmen dargestellt. Auf der Stadtkarte liegt ein helles Symbol auf einer deckenden dunkelgrauen Fläche mit dezentem Schatten, damit es sich unabhängig vom App-Farbschema vom Kartenhintergrund abhebt. Auf schmalen Bildschirmen stehen die drei Ansichtsschalter in einer vollen Zeile, darunter Start/Pause; eine einzelne Streckenvariante benötigt keinen redundanten Auswahlschalter. Der Desktop-Inhalt nutzt bis zu 1000 px.

## Reproduzierbare öffentliche Datenbasis

```sh
python3 scripts/prepare_vehicle_lines.py FAHRPLAN.zip
```

Die offizielle GTFS-Datei muss exakt zum veröffentlichten Fahrplan und zur Linienkarte passen: SHA-256 `c3e98ec9381a0f610a3164d0336ea93c097b0382aa81fbabb6c739becc25412f`, Kalender und Version `1ee7824e2ce8f51bd73f`, gültig 09.11.–12.12.2026. Keine automatische Erneuerung.

`scripts/data/vehicle-reference.json` enthält die öffentliche, versionsgebundene RBL-Referenz und Endstationsnamen. Sie wurde aus den offiziellen Haltepunkte-, Linien- und Fahrwegverlauf-CSV abgeleitet. Deren Quell-URLs und SHA-256 stehen auch im Fahrzeugindex. Für einen bewussten neuen Referenzimport die drei CSVs als `haltepunkte.csv`, `linien.csv`, `fahrwegverlaeufe.csv` bereitstellen und `--csv-dir VERZEICHNIS` angeben. U6 behält die zuvor direkt geprüften RBL-Aliasse aus `u6-rbl-mapping.json`.

GTFS-Haltefolge und offizielle Fahrwegfolge werden anhand exakter Stations-IDs und Reihenfolge verknüpft. Richtung und Richtungs-ID stammen aus der offiziellen Fahrwegquelle; GTFS-direction_id wird nicht als Wiener-Linien-Monitorrichtung ausgegeben. Mehrdeutige einzelne RBL-Seiten bleiben leer. Geometrie muss tatsächlich am Halt liegen und in Fahrtfolge projizierbar sein. Kurzführungen und ausgelassene Halte bleiben erhalten, ohne künstliche Verlängerung oder gerade Ersatzverbindungen. Gleiche Liniennummern unterschiedlicher Modi werden getrennt.

Ausgeschlossen bleiben 42A, 49BR, 70A, 71A, 74A, N75, ZF und 12: fehlende bestätigte Echtzeitquelle oder keine eindeutig verknüpfbare Haltefolge. Nicht jede historische oder kurze Variante einer unterstützten Linie ist geeignet. Bus-/Tram-Varianten brauchen mindestens drei eindeutige Abfahrthaltepunkte. Die Linienkarte zeigt den Einstieg entsprechend nur für unterstützte Varianten.

Format 3 verwendet begrenztes Gzip/Base64. Nur die bewusst gewählte Linie wird geladen und im vorhandenen IndexedDB-Katalog mit Version/Quelldigest und Paket-Hash gespeichert. Eine andere Fahrplanbasis, beschädigte Pakete, abgelaufene Kalender und unpassende Plattformfolgen werden abgelehnt. Die alte U6-Datei und ihre beiden historischen Mitschnitte bleiben als Regressionen erhalten.

Bei mehreren Fahrwegmustern hat eine vollständig identische öffentliche Stationsfolge Vorrang vor einer Umleitungsfolge, die dieselben Stationen nur als Teilfolge enthält. Vollständige Konflikte bleiben ausgeschlossen; keine Ableitung aus GTFS-Richtungscodes. Linie 46 enthält damit beide regulären Richtungen, getrennte physische RBL-Seiten und die Ankunftsstation ohne erfundenen Abfahrtsmonitor. Die zuvor unterstützte 13-Halte-Hinfahrt bleibt erhalten; die 14-Halte-Rückfahrt ist ergänzt.

Zielnamen werden ausschließlich über dieselbe tatsächliche Endstations-ID verbunden, etwa „Parlament/Volkstheater“ und „Parlament, U Volkstheater“. Keine unscharfe Namensähnlichkeit oder Radiuszuordnung.

## Zwei Arten der Zuordnung

| Modus | Evidenz und temporäre Identität |
| --- | --- |
| U-Bahn | Eindeutiger kalendergebundener GTFS-Sollslot, maximal 60 Sekunden Differenz zwischen minutengenauem GTFS und sekundengenauer Live-Sollzeit; mindestens zwei Stationen und zwei verschiedene frische Quellenstände |
| Tram und Bus | Mindestens drei zusammenpassende Live-Sollanker und zwei verschiedene frische Quellenstände; GTFS liefert ein kompatibles Fahrzeitprofil, seine absolute Abfahrtszeit ist keine Fahrzeugidentität |

Die neuen Proben zeigten für Tram 49 und Bus 48A mehrere Minuten Differenz zwischen Monitor-Sollzeiten und GTFS-Sollslots. Einfach größere Toleranz oder Abfahrtsrang als ID würde falsche Sicherheit schaffen. Stattdessen werden Live-Stationsfolgen anhand richtiger Linie, Modus, Ziel, RBL-Seite und konsistenter relativer Sollzeiten gebildet. Kalender-/zielkompatible GTFS-Profile begrenzen Fahrzeit und Haltefolge. Fehlen nahe Sollslots, darf ein gültiges Profil derselben Streckenvariante vom aktuellen Betriebstag dienen. Die absolute GTFS-Zeit bleibt dabei keine Fahrzeug-ID; die Live-Anker und Quellenstände bleiben unverändert erforderlich. Prototypen mit derselben tatsächlichen Beobachtungsfolge erzeugen keine zusätzlichen Fahrzeug-IDs.

Konkurrierende Live-Folgen, doppelte Anker, widersprüchliche Zeiten und mehrdeutige sehr enge Takte bleiben unaufgelöst. Eine existierende Bus-/Tram-ID wird nur bei mindestens zwei gemeinsamen tatsächlichen Stations-/Sollzeit-Schlüsseln weitergeführt, wenn auch diese Verknüpfung eindeutig ist. Kein nächster GTFS-Zug, keine Rangzuordnung und kein Lernen aus selbst erzeugten Positionen. Ankunfts-/Abfahrtszeiten bleiben auch bei Minutengleichheit in der Quelle erhalten; ohne positive belegbare Abschnittsdauer wird keine Bewegung erfunden.

`onStop` ist ein Stationsstatus, keine GPS-Koordinate. Zwischen frischen Ankern wird auf dem echten Linienverlauf interpoliert. Ein fehlender nächster Anker darf begrenzt bis zum nächsten tatsächlich bedienten Halt mit Sollzeit überbrückt werden; diese zusätzliche Annahme ist als schlicht graues Symbol ohne Rahmen sichtbar. Endstationen ohne Abfahrtsmonitor erhalten eine begrenzte geschätzte Ankunft, danach ein ausdrücklich erklärtes Fahrtende.

## Kontinuität und Abrufbudget

- Eine gehaltene alte Lage wird entfernt, wenn eine frisch bestätigte spätere Fahrt sie um mindestens 0,35 Stationsabstände passiert hat und mindestens zwei gemeinsame frische Stationsanker jeweils über 60 Sekunden spätere Sollzeiten belegen. Kein Entfernen allein wegen räumlicher Überlappung oder Quellenausfall. Eine erneute Darstellung benötigt wieder zwei unabhängige Quellenstände.
- Fehlende oder widersprüchliche aktuelle Zuordnung hält die letzte ableitbare Lage kurz grau unter derselben ID. Keine unbestätigte Weiterfahrt. Andere eindeutige Zuordnungen laufen weiter.
- Ab 60 Sekunden ohne frischen Quellenstand einfrieren; nach 90 Sekunden ohne passende Meldung beziehungsweise letzte ableitbare Lage ausblenden. Die gewählte Fahrt erklärt Lücke, Ablauf oder geschätztes Linienende. Verschwinden allein ist keine bestätigte Abfahrt.
- Ein Monitorabruf frühestens alle 30 Sekunden, höchstens 24 RBLs. Lange Strecken verwenden explizit wählbare Abschnitte mit zwei überlappenden RBLs; kein schneller Zusatzabruf oder automatisches Rundum-Polling. Abschnitt-/Richtungswechsel sammelt neu; Karte und vertikales Schema allein starten keine neue Zuordnung.
- Der Stationsbereich hat keinen eigenen Monitor-Poller. Seine höchstens acht RBLs werden mit der bestehenden Stations-/A-nach-B-Abfrage vereinigt; primäre Stationsdaten haben Vorrang. Geschlossene Bereiche liefern keine Nachbar-RBLs. Schließen oder Hintergrund während eines Paketabrufs verwerfen dessen Antwort; nach Rückkehr wird nur der weiterhin geöffnete Bereich fortgesetzt. Der Link zur ganzen Linie erhält die gewählte Strecke. Erst beim bewussten Öffnen wird die benötigte Linienbasis geladen.
- Gemeinsamer Schlüssel `foama.wl.lastApiAttempt.v1`, bestehendes Serverbudget und Backoff bleiben erhalten. Hintergrund, Dialoge, Abbruch und Kontextwechsel bereinigen bzw. verwerfen späte Antworten; Der offene Komponentenknoten bleibt dauerhaft an derselben Stelle im DOM; Routine-Updates ersetzen nur die getrennten Abfahrtsbereiche. Richtung, Fokus und Tracker bleiben erhalten.
- Quellenalter aus Monitor-/Serverzeit, nicht aus Cacheabrufzeit. Keine Positionsabfrage. IDs, Anker und höchstens 80 Ereignisse nur kurzlebig im Arbeitsspeicher, maximal 128 Kandidaten/zehn Minuten. Kein Live-Replay, Bewegungsarchiv oder Nutzerort im Export. Offline ist nur die öffentliche Fahrplanbasis verfügbar.

## Tatsächliche Proben und Verifikation

Die ursprünglichen U6-Proben prüfen Stationsübergaben, Korrekturpausen und Wiederaufnahme gehaltener IDs auf der ganzen Linie. Die neue Richtungsprobe vom 11.11.2026, 10:13:39–10:15:32 Wiener Zeit, bestätigte passende Live-Metadaten für beide Richtungen aller fünf U-Bahn-Linien sowie Tram 49 und Bus 48A.

Fünf weitere begrenzte Requests von 10:34:21 bis 10:37:09 Wiener Zeit enthalten zusammen maximal 24 angefragte RBLs für U3 bei Volkstheater, Tram 49 bei Urban-Loritz-Platz und Bus 48A bei Thaliastraße/Koppstraße. `tests/fixtures/vehicle-station-live.json` bewahrt ausschließlich erforderliche öffentliche Verkehrs-/Zeitfelder, höchstens 16 Prognosen je Monitor, keine Rohmeldungen oder Nutzerposition. Ein vorheriger begrenzter Versuch lief in einen Lesetimeout; die spätere Probe gelang. Daraus wird keine generelle Verfügbarkeitsgarantie abgeleitet.

Die U3 zeigt nach zwei Quellenständen zwei bis drei Schätzlagen und fünf modellbasierte Stationsübergaben. Tram 49 und Bus 48A behalten jeweils eine sichtbare temporäre ID über vier Quellenstände mit fortschreitender interpolierter Lage. Das ist ein Modellversuch, keine unabhängige Bestätigung eines bestimmten Wagens oder der räumlichen Genauigkeit. Nicht jede der 165 Linien wurde live oder physisch einzeln abgenommen.

386 Web-/Server-Tests, 15 Python-Prüfungen und 79 JavaScript-Syntaxprüfungen. Alle veröffentlichten Pakete gegen Hash, Kalender, reale Geometrie, Plattformfolge und begrenzte Fenster geprüft. Neue Regressionen: horizontale Richtung und Stationsgrenzen, geschlossene/spät geladene Bereiche, gemeinsame Stations- und A-nach-B-Abfrage, konservative Oberflächen-Stationsketten, dichte mehrdeutige Takte, richtige Linie/Modus und ID-Kontinuität. Native Wear 0.7.4/26 samt Original-APK/Feed unverändert.

Die verwaltete Vorschau ist nach Wiederherstellung des Worker-Builds erreichbar. Im Browser geprüft: einheitlicher Name, Linien-/Stationswahl, horizontaler U6-Ausschnitt bei Thaliastraße, Einstieg aus der Linienkarte in den geöffneten Stationsbereich und Link mit gewählter Variante. Bei 337 px CSS-Breite (Browser-Zoom) bleiben Seite und gesamter Stationsausschnitt ohne horizontalen Überlauf; Diagramm-clientWidth und scrollWidth jeweils 281 px. Offener Bereich, gewählte Richtung und Fokus bleiben bei Routineupdates erhalten. Dies ist keine physische Smartphone- oder unabhängige Fahrtenabnahme. Der Vorschau-Relay zeigte auch einen korrekt behandelten vorübergehenden Live-Ausfall. Nach dem abschließenden Neubau blockierte die Browser-URL-Richtlinie weitere Vorschauaufrufe; die visuelle A-nach-B-Ende-zu-Ende-Abnahme bleibt daher offen. Als nächste Abnahme kommen echte Zug-/Tram-/Busfolgen, Störungen, Signalhalte, Spitzenverkehr und Kurzführungen auf dem Telefon hinzu. Andere Städte benötigen getrennte Quellenbindung.

Primärquellen: [offizieller GTFS](https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/gtfs.zip), [Haltepunkte](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-haltepunkte.csv), [Linien](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-linien.csv), [Fahrwegverläufe](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-ogd-fahrwegverlaeufe.csv), [Realtime-Dokumentation](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf).
