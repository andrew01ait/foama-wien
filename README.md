# foama-wien

Öffis, die du noch erreichst. Abfahrtsmonitor für Wien als installierbare Smartphone-PWA und native Wear-OS-App.

[**PWA öffnen**](https://foama-wien.endruuu.chatgpt.site/) · [**Uhr-App herunterladen**](https://foama-wien.endruuu.chatgpt.site/wear.html) · [Einrichtung und Entwicklung](docs/github.md) · [MIT-Lizenz](LICENSE)

- Live-Abfahrten in der Nähe, nach Haltestellen gruppiert, mit Gehzeit und Erreichbarkeit.
- Haltestellen, einzelne Linien/Richtungen und A-nach-B-Wege als lokale Favoriten.
- Routenplanung mit Adressen, Karten, Alternativen und Vergleich von Fahrzeit und Umstiegen.
- Favoriten zwischen Handy und Uhr per kurzlebiger verschlüsselter QR-Übertragung oder Datei übernehmen.
- Optionale Störungsbenachrichtigungen in der PWA; direkter Uhr-Push benötigt noch die Firebase-Einrichtung.
- Uhr-Updates mit Vorschau, eigener Downloadbestätigung und Fortschritt; optionaler Ultra-Sparmodus.

Aktueller veröffentlichter Stand: **PWA und Wear 0.6.0**, nativer Versionscode **20**. Ein GitHub-Commit veröffentlicht die laufende App nicht automatisch. [Architektur](docs/architecture.md), [Prüfungen](docs/tests.md), [Deployment](DEPLOYMENT.md) und [Datenquellen/Lizenzen](docs/licenses.md) beschreiben die Details und bekannten Grenzen.

## Entwicklung starten

Voraussetzungen für die Web-/Serverprüfungen: Node.js 22 und Python 3.12.

```sh
npm ci
npm test
python3 -m unittest discover -s tests -p '*test.py'
```

Das GitHub-Repository enthält PWA, nativen Uhr-Code, Server, Datenbankmigrationen, öffentliche Referenzdaten und Tests. Private Signierschlüssel, Zugangsdaten und fertige APKs sind kein Teil dieses Imports. Für einen eigenen Betrieb und den nativen Build siehe [Einrichtung](docs/github.md).

## Bisherige Änderungen und Projektstand

## 0.6.0 · Störungsbenachrichtigungen · 09.11.2026

Der bisher pausierte Stundenauftrag wurde auf die verbundene foama-wien-App umgestellt. Unbeaufsichtigter Lauf b6807536-f000-8322-bf47-cffd16b20df6, geplant 11:07:54, gestartet 11:08:09, abgeschlossen 11:08:51 Europe/Vienna, recorded_status=completed. Der Server hat den Quellenabruf mit neuer lastCheck/lastSuccess und setup-source-only quittiert. Damit ist der vorherige Scheduler-Blocker für den Stundenbetrieb behoben. Runtime-Revision 4 setzt PUSH_SCHEDULER_ENABLED=true und PUSH_INTERVAL_MINUTES=60; Anwendung mit diesem Release. Vorhandene VAPID-/Speicherschlüssel unverändert. Plattform maximal stündlich; zusätzliche Prüfungen etwa alle fünf Minuten nur im Rahmen ohnehin erfolgender aktiver Monitoraufrufe. Der vorbereitete externe Fünf-Minuten-Timer ist weiterhin nicht gestartet. Kein sofortiger Echtzeitversand oder Fünf-Minuten-Hintergrundtakt behaupten.

Meine Favoriten umfasst nun Haltestellen, Linien sowie gespeicherte A-nach-B-Wege einschließlich Alternativen. Bekannte Ein-, Umstiegs- und Ausstiegsstationen werden lokal zu minimalen Stop-/Linienfiltern zusammengeführt, maximal 100 Stationen. Keine Adressen, eigenen Routennamen oder GPS-Koordinaten werden übertragen. PWA synchronisiert geänderte Routen nach sichtbarer Rückkehr sofort; Uhr bei Import/Entfernen und sichtbarer Fortsetzung. Bestehende Zustellgrenzen, Deduplizierung, Quellen-/Gültigkeitsprüfung, Gerätefreigaben, verschlüsselte Datenhaltung und Opt-out erhalten. Geplantes nicht vor Beginn; Aufzüge/Fahrtreppen weiterhin optional aus.

PWA: Aktivierung/Test nach bewusster Browserfreigabe, sichtbare ehrliche Dienstfrequenz und letzte Prüfung. Direkte Uhr-Zustellung bleibt bis zur Firebase-Einrichtung gesperrt: Firebase-Plugin angeboten, noch nicht bestätigt verbunden; keine FIREBASE_*/FCM_SERVICE_ACCOUNT_JSON im Hosting vorhanden. Die PWA benötigt keinen Firebase-Client. Telefon-Spiegelung ist eine getrennte Systemeinstellung. Keine physische Zustellung aus Unit-Tests oder einem erfolgreichen Quellenabruf ableiten.

## PWA 0.5.1 · Favoriten direkt aus der Standortkarte

Unter Dein Standort → Karte bieten Popup und Stationsliste sowohl Ganze Haltestelle merken als auch Linien & Richtungen wählen. Die zweite Aktion öffnet die vorhandene Favoritenauswahl mit genau dieser Station vorausgewählt, über der weiterhin geöffneten Karte. Mehrere Richtungen können nacheinander gespeichert werden; Schließen kehrt zur Karte zurück. Vorhandene Linienfavoriten und ganze Stationsfavoriten bleiben unabhängig und werden nicht dupliziert. Unveränderte gemeinsame Abrufgrenzen und nur aktuell bestätigte Linien/Richtungen; keine zusätzliche Hintergrundabfrage. Kartenaktionen mindestens 44 px groß.

## Uhr 0.5.1 / Code 19 · gemeinsamer Favoritenimport · 09.11.2026

Unter Mehr → Favoriten → Aus PWA importieren gibt es einen gemeinsamen Einstieg für Haltestellen, Linien/Richtungen und A-nach-B-Routen. QR und JSON-Datei sind direkt dort erreichbar. Die bestehende PWA-Übertragung wählt alle kompatiblen Favoriten vor; Nutzer können die Auswahl vor dem Senden ändern. Vorschau und Bestätigung auf der Uhr bleiben erforderlich, vorhandene lokale Favoriten und Routen bleiben erhalten, Duplikate werden zusammengeführt.

Dateivorschau zeigt jetzt auch Haltestellen-/Liniennamen sowie Routen gruppiert. Abbruch, erfolgreiche Übernahme und QR-Rückkehr führen in das aufrufende Importmenü zurück. Dateiimport weiterhin 512 KiB; QR weiterhin zehn Minuten verschlüsselt und mit 32-KiB-Klartextgrenze. Der bisherige A-nach-B-Einstieg und die bidirektionale Übertragung bleiben verfügbar. PWA 0.5.1 ergänzt getrennte Favoritenaktionen auf der Standortkarte; nativer Release 0.5.1/19 mit Originalpaket und Originalschlüssel.

## PWA und Wear 0.5.0 · 09.11.2026

PWA: Schnellste Route oder Wenig Umstiege wählen, mit konkreten Abfahrts-/Ankunftszeiten und Zeitunterschied. Zwei feste Transitous-Profilabfragen je bewusster Suche (timetableView true/false), beide im bisherigen gemeinsamen 700er-Budget. Umschalten, Karte und Favoritenöffnung lösen keine neue Vollplanung aus. Rückfahrt planen tauscht feste Endpunkte und sucht die tatsächliche Gegenrichtung; bei altem GPS-Start bleibt das Ziel zur Auswahl offen. Meine Orte speichert bis zu 30 benannte Adressen lokal. Start → Ziel und Ein-/Ausstiegsstation bleiben auch unter eigenen Favoritennamen sichtbar; Gesamtroute auf Karte direkt oben.

Haltestellenkarte: nächstgelegene amtliche Zugangsadresse mit Hausnummer, PLZ, Abstand und Stadt-Wien-Quelle. 1.748 Haltestellen aus 151.577 öffentlichen Zugangsadressen zugeordnet, höchstens 100 m Entfernung. Das ist ausdrücklich keine gesicherte Stations-Postadresse; Routingziel bleibt der offizielle Haltepunkt. Fehlende Zuordnung fällt auf Straßenumgebung zurück. Ableitung offline, keine zusätzlichen Standortübertragungen.

Wear: A nach B ist direkt als drittes Hauptziel erreichbar, auch ohne Routen. Routenfavoriten aus PWA per QR oder lokal per JSON-Datei mit Vorschau/bewusster Übernahme; Dateiauswahl ist abhängig von einer verfügbaren System-Dateiauswahl auf der Uhr, QR bleibt als Alternative. 512-KiB-Dateigrenze, bestehende v1/v2-Formate und unabhängige Gerätespeicher erhalten. Aktuelle passende Zeiten je Etappe, Alternativen und korrekter Zurück-Pfad.

Uhr-Updates: Prüfen liest ausschließlich Metadaten, zeigt verfügbare Version und bis zu vier releasebezogene Neuerungen. Erst Installieren bestätigt Download und Übergabe an Android; Prozent-/MB-Fortschritt, Größen-/Hash-/Originalsignaturprüfung und Abbruchbereinigung. Optionaler Ultra-Sparmodus unter 20 %, standardmäßig aus, Hinweis und bewusste Aktivierung. Ab 25 % normal mit Hinweis (Hysterese); Ortung höchstens alle fünf Minuten als Einzelfix, Abfahrten alle 90 s, Darstellung alle 30 s. Manuelle Ortung möglich. Alter/Unsicherheitsgrenzen unverändert, keine Hintergrundabfragen; Akkuzustand wird bei sichtbarer App ausgewertet. QR-/Import-/Update-Operationen behalten ihre begrenzte Wachhaltefunktion.

Prüfung: 240 Web-/Server-, 116 Android- und acht Python-Tests bestanden. Physischer OnePlus-/GPS-/Dateiauswahl-/Installer-Test bleibt separat. Originalpaket at.andrew.foamawien und Signaturschlüssel erhalten; Wear-Code 18. Öffentliche Browserabnahme erfolgreich: Routenvergleich mit realen Transitous-Zeiten (ein Umstieg weniger, vier Minuten spätere Ankunft), Wechsel der gesamten Karte ohne neue Planung, eigene Favoritennamen mit Ein-/Ausstieg, Rückfahrt Karlsplatz → Rathaus mit aktuellen U2-Zeiten Richtung Aspernstraße, Ortsanlage/-auswahl und Erhalt nach Reload, Aktualisierungsbanner mit bewusster Übernahme sowie echte Adresse Franklinstraße 19/1210 Wien in 29 m Abstand. Vorhandene zwei Stations-/drei Routenfavoriten erhalten. Öffentliche APK heruntergeladen, 3.731.884 Bytes und SHA-256 8efe899acf688f53d0629455e5dc98ad1447b95ca7a8b6e7308bdae14150bd07 bytegleich zum signierten Build. Physische Watch-Abnahme weiterhin separat.

## PWA 0.4.3 · Favoriten auf schmalen Displays · 09.11.2026

Lange Richtungsnamen in Verbindungsfavoriten erhalten eine eigene umbrechende Zeile. Linie/Stern und große erste/zweite Abfahrt stehen darüber, Erreichbarkeit darunter. Explizit begrenzte Grid-Spalten verhindern, dass Nachladen die Seite seitlich verbreitert. Hauptnavigation und Kopf bleiben bei kleinen Breiten lesbar. 28-px-Hauptzeiten und 44-px-Stern-Tippfläche bleiben erhalten; keine überlappenden negativen Sternränder.

PWA-Version/Offline-Shell 0.4.3. Favoriten-, Linien-, QR- und Datenformate unverändert. Native Wear 0.4.2 / Code 17 und dessen signierte APK bleiben unverändert. 231 bestehende Web-/Serverprüfungen erfolgreich; Öffentliche Browserabnahme: echte PWA bei 320/360/420 px Rahmenbreite (305/345/405 px nutzbar mit Desktop-Scrollbar), Hell und Dunkel. Nach Live-Nachladen und wiederholtem Countdown-Render bleibt scrollWidth gleich clientWidth; keine sichtbaren Elemente außerhalb des Viewports. Geprüft mit langer 29B-Richtung sowie leerer Abfahrtszeile. Stern bleibt tatsächlich 44 × 44 px. Temporäre Prüfseite danach entfernt.

## PWA 0.4.2 / Wear 0.4.2 · Etappenfokus und alternative Wege · 09.11.2026

Stationsnamen stehen über Linie/Richtung in Suchergebnissen, gespeicherten Wegen, Reiseabschnitten und nativen Liniendetails. Antippen einer Verbindung öffnet ausschließlich diese Station/Linie/Richtung; Alle Abfahrten ist eine bewusste separate Aktion. Jede angetippte zweite/dritte Etappe erhält ihren eigenen Abruf-Scope, alte Antworten werden verworfen. 24 RBL/30 Sekunden und sichtbare App bleiben erhalten.

Gehzeit antippen klappt die Karte genau dieses Fußwegs auf. Vorhandene Providergeometrie wird verwendet, fehlender Verlauf ehrlich als schematisch/fehlend bezeichnet. Kein zusätzlicher Planerabruf durch Karte oder Countdown; regelmäßige Zeiten-Updates erhalten geöffnete Abschnittskarten. GPS ist als Startquelle vorbelegt: Ort suchen ist bei gesetztem Punkt inaktiv; klare Erklärung, dass Verbindungen suchen die Planung/GPS startet. Kompaktere Abstände bei mindestens 44-px-Zielen. A nach B hat ein lokales Vektoricon. Sichern und Handy/Uhr-Übertragung liegen in Einstellungen. Rückgängig nach Entfernen verfällt nach genau 60 Sekunden und kann auch nach verspätetem Hintergrund-Timer nichts mehr herstellen.

Alle unterschiedlichen Linienwege aus einer ursprünglichen Planung gehören als Alternativen zur gewählten Route. Der Planer wird einmal nach acht Verbindungen gefragt; spätere Fahrten desselben Linienwegs werden nicht dupliziert. Gemeinsame Fahrtabschnitte erscheinen einmal, Varianten beim passenden Verzweigungspunkt. Wechsel zeigt stets eine vollständige Providerverbindung, keine selbst aus unterschiedlichen Fahrtzeiten zusammengesetzte Anschlusszusage. Gespeicherte Wege bleiben zeitlose Templates mit aktuellen passenden Linienzeiten. Pro Route höchstens 16 unterschiedliche Wege; weitere Zusammenführung schlägt vor einer Änderung verständlich fehl, statt alte Varianten zu löschen. Keine Hardcodes für Beispieladressen oder Stationen.

Routenfamilien bleiben ein Favorit inklusive Alternativen, Namen und ID. JSON/QR behalten das v2-Format; neue optionale alternatives. Native 0.4.1 meldet journey-alternatives-v1 zusätzlich zu journey-favorites-v1. Ältere Uhren erhalten mit sichtbarem Hinweis nur die Hauptroute. Neue Alternativen werden nach Vorschau/Bewusster Übernahme in bestehende Route ergänzt, ohne sie umzubenennen oder zu duplizieren. Alle Varianten entfernen absolute alte Zeiten/Trip-IDs, GPS-Fix und erste/letzte GPS-Geometrie; QR streicht sämtliche Geometrie/Abschnittskoordinaten. Zehn-Minuten-Verschlüsselung und Transfer-Keep-awake unverändert.

231 Web-/Server-, 104 Android- und acht Python-Prüfungen bestanden. Java↔WebCrypto für Stationen, Routen und Routenfamilien geprüft. Original-Key/Paket und bestehende Gerätespeicher erhalten. Physischer OnePlus-/GPS-/Kamera-Test bleibt gesondert.

## PWA 0.3.3 / Wear 0.4.0 · Fahrtkarte, Adressen und Routen auf der Uhr · 09.11.2026

A nach B bleibt der dritte Haupttab. Start ist dynamisch „Dein Standort“; eine Suche löst GPS erst nach Klärung getippter Adressen aus. Adresse/Ort per Suchen oder beim Absenden auflösen, mehrdeutige Treffer ausdrücklich wählen. Start/Ziel auf lokaler Leaflet-Karte als Station oder freier Kartenpunkt auswählen. Reise/Karte zeigt echten MOTIS-v6-Verlauf (Präzision sechs); fehlende Geometrie nur ausdrücklich gestrichelt/schematisch zwischen bekannten Punkten. Kartenbewegung löst keine Neuplanung aus.

Abfahrt oder Stationsname in einer Reise öffnet eine eigene ganze Stationsansicht mit allen bekannten Linien/Richtungen und eigenem Zurück-Pfad. Gemeinsames 24-RBL-/30-s-Budget bleibt erhalten, Navigation und Hintergrund verwerfen verspätete Ergebnisse. Meine Routen: große Karten/Tippflächen, eigene Namen, Menü und Rückgängig nach Entfernen. Öffnen eines Favoriten lädt aktuelle Linienzeiten, keine alte Gesamtfahrtdauer; Neu planen bleibt ausdrücklich.

Aktuelle Nutzeranweisung erweitert den früheren PWA-zuerst-Umfang: gespeicherte Routen dürfen jetzt per QR auf die Uhr und zurück. Stationen bleiben im v1-Format kompatibel, Routen verwenden foama-favorites-v2 und die ausdrücklich vom neuen Watch-Code gemeldete Fähigkeit journey-favorites-v1. Vorschau und bewusste Bestätigung, unabhängige lokale Listen, bestehende Reihenfolge/Duplikate und zehn Minuten AES-GCM bleiben erhalten. GPS-Endpunkte dynamisch ohne Fix/Geometrie; QR enthält keine Liniengeometrie, alten Zeiten oder Trip-IDs. Höchstens 30 Routen/32 KiB Transferklartext. Uhr zeigt Einstieg und nächsten Umstieg mit aktuellen exakt zugeordneten Linienzeiten; Weiter zum Umstieg/Alle Abfahrten/Zurück. Keine native Vollroutensuche und keine Anschlusszusage. Transfer-Display bleibt sichtbar wach, Pause/Back/Ende geben den Bildschirm frei.

## PWA 0.2.2 · A nach B im dritten Tab · 09.11.2026

Aktuelle Nutzersteuerung: „A nach B“ ersetzt „Mehr“ als dritten Tab neben Nähe und Favoriten. Kein eigener Routenbanner. Einstellungen weiterhin über das Zahnrad oben. A-nach-B-Funktionen zuerst in der PWA testen, Watch-Umfang später festlegen. Wear bleibt 0.3.7 / Code 14 mit Scrollkorrektur.

## PWA 0.2.1 · öffentliche Abnahme · 09.11.2026 Wiener Zeit

Öffentlich geprüfte echte Transitous-Verbindung Westbahnhof → Karlsplatz mit U3 → Volkstheater → Tram 1, fünf Alternativen, Planung/Umstiege/Zeiten korrekt. Separater Geocode- und Fußwegabruf produktiv HTTP 200. Routenfavorit gespeichert, Seite neu geladen und gespeicherten Linienweg ohne alte Fahrzeiten wieder geöffnet. Aktuelle U3-Abfahrten tatsächlich aus Wiener-Linien-Monitor angezeigt; fehlende passende Tram-Abfahrt neutral erklärt. Favoritöffnung berechnet keine Vollroute. Öffentliche PWA-Liniendetails bestätigen scrollTop 0 und verbergen Übersicht; Update-Hinweis/Übernahme und Favoritensortierung erhalten. Kein Nutzer-GPS für die Abnahme freigegeben.

Hosting-Fetch auf unterstütztes redirect manual umgestellt: 3xx wird abgewiesen, nie anderer Host verfolgt. Anbieter-Endpunkte unverändert. Neue Sucheingaben verwerfen alte Alternativen, damit kein alter Linienweg unter neuem Start/Ziel gespeichert wird. Geplante Wegabschnitte zeigen gewählte Ortsnamen anstelle technischer START/END-Platzhalter. Wear bleibt 0.3.7 / Code 14, nur Scrollfix; 91 native Tests. 203 Node-/PWA-/Serverprüfungen. Physische OnePlus- und schmale Telefonabnahme separat.

## PWA 0.2.0 / Wear 0.3.7 · A nach B und Routenfavoriten · 08.11.2026

PWA: Auf der Startseite „Von A nach B“. Start/Ziel ausdrücklich als Haltestelle, online gesuchter Ort oder GPS-Start wählen; jetzt/später/Ankunftszeit in Wiener Zeit. Eigene Ergebnisseite mit Dauer, Linien, Fußwegen, Wartezeiten und Umstiegen. Planung über Transitous, aktuelle Linienabfahrten des nächsten Einstiegs/Umstiegs über Wiener Linien. Fahrplan/Echtzeit klar getrennt; gleiche Linie/Richtung ist keine gesicherte Fahrt oder Anschlusszusage.

„Weg merken“ speichert bis zu 30 Routenfavoriten lokal unter „Deine Wege“: Linien und Umsteigestationen, feste Start-/Zielorte und gespeicherte Gehwegabschnitte, keine alten absoluten Fahrzeiten oder Trip-IDs. GPS-Start bleibt dynamisch „Dein Standort“, ohne gespeicherte GPS-Koordinate. Öffnen lädt nur aktuelle Linienabfahrten; Fußweg zum ersten Einstieg auf Wunsch separat berechnen. „Neu planen“ liefert eine neue aktuelle Gesamtverbindung. Keine automatische Routenneuberechnung. Lokale Routenfavoriten sind getrennt von Stationsfavoriten und deren bestehendem JSON/QR-Format.

Nutzerentscheidung: **zuerst PWA**, die passende Übernahme der Reiseplanung auf die Uhr später gemeinsam festlegen. Wear 0.3.7 / Code 14 korrigiert ausschließlich das Scrollverhalten: neue Seiten/Liniendetails starten oben; verspätete Scroll-Aufträge alter Ansichten werden verworfen, Refresh erhält die Leseposition. PWA-History verwaltet Scrollpositionen manuell und ignoriert verspätete Öffnungs-Callbacks.

Eigener App-Code jetzt MIT; Daten, Bibliotheken und Dienste behalten eigene Lizenzen. Öffentlicher Quellcode mit Lizenz und sichtbarer Transitous-/OSM-Attribution. Serverseitig feste Produktions-Endpunkte, identifizierender User-Agent, POST-Eingaben, keine Such-/GPS-Historie; nur aggregierte Stundenzähler. Gemeinsame Obergrenze: 700 Planungs-/Fußwegabrufe in konservativen 25 Stunden, 500 Ortssuchen; bei fehlender Datenbank keine unbegrenzte Ersatzabfrage. Keine Hintergrundabfragen; 30 s und max. 24 RBL für aktive Linienmonitorabfragen bleiben erhalten. Transitous bleibt Best Effort; größere Nutzerzahlen/Last mit Betreiber koordinieren.

## PWA 0.1.29 · Einheitliche Kopf-Icons · 08.11.2026

Teilen und Einstellungen haben identische 44-px-Schaltflächen und 22-px-Vektorsymbole mit gleicher Strichstärke. Der Update-Hinweis mit Jetzt aktualisieren ist seit 0.1.28 vorhanden. Wear bleibt 0.3.6.

A-nach-B: erstes Verarbeitungsmodul und MOTIS-Adapter mit datiertem tatsächlichem Testabruf vorbereitet; noch keine öffentliche Routensuche. [Stand und notwendige Entscheidung zum Datenzugang](docs/journey-planning.md).

## PWA 0.1.28 · App teilen · 08.11.2026

Auf der Hauptseite erscheint bei verfügbarer neuer PWA-Version ein Hinweis mit **Jetzt aktualisieren**. Prüfung beim Start und alle fünf Minuten nur bei sichtbarer App; keine automatische Neuladung. Update aktiviert den vorbereiteten Worker und lädt die App neu, Favoriten/Einstellungen bleiben erhalten.

Oben steht jetzt **App teilen** statt des Aktualisieren-Symbols. Öffnet das native Teilen-Menü, z. B. für WhatsApp. Ohne Web Share oder bei einer Ablehnung des Browsers stehen ein öffentlicher App-Link, Link kopieren und Über WhatsApp teilen bereit. Ein Abbruch des nativen Menüs bleibt ohne weitere Aktion. Geteilt wird ausschließlich die feste öffentliche App-Adresse mit kurzem Einladungstext, niemals die aktuelle Seite, ein Transferfragment, Standort oder Favoriten. Automatische Abfahrtsaktualisierung und Aktualisieren in Verbindungsdetails bleiben erhalten. Wear bleibt 0.3.6.

## PWA 0.1.27 / Wear 0.3.6 · Favoritentexte · 08.11.2026

Die Entfernungssortierung heißt auf beiden Geräten **Nähesten zuerst**. Der zusätzliche Standort-/Luftlinie-Satz in der PWA-Favoritenleiste entfällt bei vorhandener Position. Ohne Position bleibt nur die Erklärung der ersatzweise verwendeten gespeicherten Reihenfolge. Sortierwerte und Favoriten bleiben erhalten.

**Neu aufgenommen:** [A-nach-B-Planung mit Umstiegen und Abfahrten je Reiseabschnitt](docs/journey-planning.md) für PWA und Uhr. Noch geplant; API-Zugang, Kontingent und Anbieter sind vor Umsetzung zu klären.

## PWA 0.1.26 / Wear 0.3.5 · Geprüfte Stationslinien und gemeinsame Lernschicht · 08.11.2026

Stationslinien werden aus datierten Fahrgastfahrten im offiziellen GTFS-Fahrplan bestimmt, einschließlich Verkehrstagen/Ausnahmen und Ein-/Ausstieg. Der bisherige Import aller Fahrwegvarianten als Stationslinien war zu weitgehend. Am Westbahnhof entfallen dadurch unter anderem 1 und 2 aus der normalen Linienliste. Haltepunkte/RBL und lokale Favoriten behalten ihre Identität; Varianten bleiben interne Kandidaten für Abdeckung, nicht reguläre Anzeige. 629 bestehende Stations-Liniensätze geändert; aktuelle CSV 1812 Stationsgruppen, davon 1713 mit Fahrgastverkehr im geprüften Zeitraum 08.–14.11.2026. Rufbus-Namensvarianten und Badner-Bahn-Bezeichnung zwischen beiden offiziellen Quellen normalisiert.

Der bestehende Dienst lernt während ohnehin erfolgender Monitorabrufe öffentliche Linienzuordnungen für Uhr und PWA gemeinsam. Jede Linie besitzt ein eigenes lastSeen; 30 Tage bestätigt, Erneuerung nur bei tatsächlich erneut gemeldeter Linie. Cachetreffer/alte Quellzeit erneuern nichts. Vollständige Stationsabfragen werden getrennt nach Wiener Datum und Tageszeit erfasst; Teilbatches/Filter, Fehler und ausdrückliche Teilantworten sind keine vollständigen Prüfungen. Unbelegte alte Varianten/Zusatzlinien erst nach mehr als 30 Tagen, mindestens drei Prüftagen und zwei Tageszeitbereichen ausblenden. Nachtlinien benötigen Nachtprüfungen; Rufbus sowie unabhängig belegte Fahrplanlinien werden nicht durch bloße 70-Minuten-Lücken entfernt. Wiederauftauchen bestätigt die Linie sofort erneut.

D1 enthält nur öffentliche Station/Linie/Verkehrsmittel und aggregierte Zeitpunkte, keine Nutzer-/Gerätekennung, Koordinaten oder Favoriten. Lokale Kopie für Offlinebetrieb, begrenzte 90-Tage-Aufbewahrung; ursprüngliche Favoriten und JSON/QR bleiben unverändert. Keine neuen Hintergrundabfragen, kein neuer externer Dienst, keine Firebase-Aktivierung. Neue Migration 0002 erweitert ausschließlich das Schema.

168 Node-/PWA-/Server-, acht Python- und 90 native Android-Prüfungen erfolgreich. Originalsignatur, Paket at.andrew.foamawien, APK-Version 0.3.5 / Code 12 und zipalign verifiziert. Physische OnePlus-Abnahme separat. [Datenquellen, Regeln und Grenzen](docs/station-line-quality.md).

## PWA 0.1.25 · Kompakte Linienauswahl · 08.11.2026

Linienbadges in Stationskarten mit dichterem, gleichmäßigem Umbruch: keine zusätzlichen Flex-Gaps um die weiterhin mindestens 44 × 44 px großen Tippflächen, besser ausgefüllte sichtbare Badges. Verkehrsmittel und Erklärung gedimmter Linien erhalten eigene Zeilen unter der Auswahl statt konkurrierender Flex-Elemente. Schmale Karten mit kleineren Außenabständen; Farben und Verbindungsaufruf erhalten. Wear bleibt 0.3.4 / Code 11.

## PWA 0.1.24 / Wear 0.3.4 · Verbindungen und einheitliche Stationskarten · 08.11.2026

PWA: Tippen auf eine Linie/Richtung oder ein Linienbadge öffnet eine eigene bildschirmfüllende Verbindungssicht. Stationsname, große nächste Abfahrt, Folgeabfahrten, Gehzeit/Reserve, passende Betriebs-/Zusatzhinweise, Karte und expliziter Favoritenknopf. Währenddessen werden nur die zur Verbindung bekannten Bahnsteige aktualisiert; bei fehlender Zuordnung engster belegter Stations-/Verkehrsmittel-Fallback. Zurück/Browser-Back stellt die ursprüngliche Nähe-/Favoritenansicht und Scrollposition wieder her, Weiter öffnet die Verbindung erneut. Sternaktionen bleiben separat.

Linien ohne bestätigte frische Abfahrt sind gedimmt und weiterhin antippbar. Die Erklärung „aktuell keine Abfahrt bestätigt“ umfasst auch ungeprüfte, unvollständige, ältere oder fehlgeschlagene Abfragen und behauptet keinen Betriebsschluss. Fahrzeugbezogene Kurzführungen behalten ihre tatsächliche Richtung statt der allgemeinen Monitorrichtung.

Uhr: Nähe und Favoriten teilen dieselbe Stationskarte, linksbündigen Stationskopf mit Gehinfo und identische kompakte Verbindungszeilen. Favoriten bestimmen weiterhin ausschließlich die gespeicherten Inhalte. Katalog-Fallback, datenlose Favoriten und unbestätigte/ältere Linienbadges sind neutral; fehlende Daten bleiben erklärbar und Details erreichbar. Native Version 0.3.4 / Code 11; Paket, Originalsignatur, Daten und Transfer-Wachhaltefunktion erhalten.

157 Node-/PWA-/Server-, 88 native Android- und drei Python-Prüfungen erfolgreich. Native Runddisplay-Renderings 192/227 dp kontrolliert; Originalsignatur, Paket, Metadaten und zipalign geprüft. Physische OnePlus-Abnahme bleibt separat.

30 Sekunden, Sichtbarkeit, Fehler-Backoff und 24-RBL-Grenze bleiben erhalten. Ein Ansichtswechsel oder Hintergrund beendet laufende Monitoranfragen; verspätete Antworten ändern weder Cache noch Fehlerstatus. Watch-Detailabrufe bleiben auf die gewählte Station beschränkt, enthalten dort weiterhin alle Bahnsteige. Push-/Firebase-Einrichtung, verlässlicher externer Timer und ÖBB-Datenquelle bleiben offene Aufgaben.

## Wear 0.3.3 / Code 10 · Menüs, globale Filter und kompakte Uhr-Webseite · 08.11.2026

Erste Ebene unter Mehr behält ihre bisherigen Karten und Icons; der kurze Eintrag heißt Störungen. Darunter getrennte Ziele Hinweise (lokales Archiv), Push (Aktivieren/Deaktivieren, Test und Verbindung), Auswahl (Favoriten/alle Linien, Nachtruhe und optionale Aufzüge/Fahrtreppen) und Infos (Datenschutz/Handy-Spiegelung). Zurück, beide Wischrichtungen und System-Back führen aus Unterseiten zu Störungen und dann Mehr. Auswahl grün mit Haken, Hauptaktion mint, Deaktivieren dezent rot umrandet, Navigation neutral und Zurück ruhig. Push bleibt bis zur tatsächlichen Einrichtung gesperrt.

Verkehrsmittelsymbole sind in Nähe und Favoriten eine eigene globale Zeile vor jeder Station, ohne Stationsname oder Gehzeit im Filterknopf. Jede Stationsgruppe zeigt ihren eigenen Namen darunter; Nähe kombiniert Name und kurze geschätzte Gehzeit. Auf kleinen Runddisplays steht die Minuten-Spalte weiter innen. Mindestens 48-dp-Tippziele, vorhandene Filterwerte, Favoriten, Abrufbudget und Transfer-Keep-awake bleiben erhalten.

Öffentliche Uhr-Seite /wear.html: kurzer Einstieg, direkter Download und vier Kernfunktionen (Nähe, Favoriten, Gehzeit, verschlüsselter QR-Transfer), aktuelle native Beispielansichten. Installation, Übertragung/Updates und technische Details sind kompakt aufklappbar. Automatische Push-Zustellung ehrlich als noch in Einrichtung ausgewiesen. PWA bleibt 0.1.23.

143 Node-/PWA-/Server- und 86 native Android-Tests bestanden; ursprüngliche Signatur, zipalign und Version/Code geprüft. Physische OnePlus-Abnahme bleibt separat.

## Wear 0.3.2 / Code 9 · Display während Favoritentransfers wach · 08.11.2026

Die Uhr hält den Transferbildschirm beim Senden ans Handy/PWA und beim Empfangen vom Handy aktiv: Vorbereitung, QR-Scan, Warten auf Daten sowie Vorschau und ausdrückliche Übernahme. Vorübergehende Verbindungsfehler dürfen innerhalb der Sitzung erneut geprüft werden. Nach erfolgreichem Abschluss, Zurück/Abbruch, endgültigem Vorbereitungsfehler oder Ablauf wird das normale Bildschirmverhalten wiederhergestellt. Ein unabhängiger Timer begrenzt die Sitzung einschließlich Bestätigungswartezeit auf höchstens zehn Minuten; ein früheres Serverablaufdatum gilt zusätzlich.

Die Änderung verhindert den automatischen Display-Timeout während der sichtbaren Übertragung. Bewusstes Verlassen, Systemunterbrechung oder Ausschalten beendet weiterhin Anfragen und löscht Schlüssel; die App erzwingt keine Rückkehr in den Vordergrund. Keine zusätzlichen Berechtigungen, Dienste, GPS- oder Abfahrtsabfragen. Favoriten und ursprüngliche Signatur/Paket-ID bleiben erhalten. PWA-Version unverändert 0.1.23; Update auf der Uhr über Mehr → App & Updates → Auf Update prüfen.

143 Node- und 83 native Android-Tests bestanden. Physische OnePlus-Prüfung des Screen-Timeouts und QR-Transfers bleibt erforderlich.

## PWA 0.1.23 / Wear 0.3.1 · Aktuelle Warnungen und zusätzliche Hinweise · 08.11.2026

Aktuelle Betriebsstörungen bleiben gelb hervorgehoben und zeigen betroffene Linien auch geschlossen. Reine Aufzugs-/Fahrtreppenmeldungen sowie noch nicht begonnene Ereignisse stehen in einem eigenen neutralen, standardmäßig geschlossenen Hinweisbereich. Sie erhöhen weder Anzahl noch Linienbadges der aktuellen Warnungen. Geplante Meldungen behalten Beginn/Ende und werden erst ab Beginn als aktuelle Betriebsstörung behandelt; reine Gerätehinweise bleiben auch dann sekundär. Störungen des Fahrbetriebs bleiben prominent, wenn ihr Text zusätzlich Aufzüge erwähnt.

Gemeinsame Push-Regel für PWA und Watch: keine Zustellung vor dem tatsächlichen Beginn; Gerätehinweise nur bei gesonderter ausdrücklicher Auswahl (standardmäßig aus). Die native Uhr markiert Abfahrten nicht mehr allein wegen referenzierter Aufzugs-/Fahrtreppen- oder zukünftiger Meldungen mit ⚠. Fehlende Meldungsdetails bleiben vorsichtig als unbestätigter Hinweis erhalten.

143 Node-/PWA-/Server-Prüfungen und 79 native Android-Prüfungen bestanden. Neutraler Hinweisbereich und getrennte gelbe Betriebswarnung in Hell/Dunkel mit ausdrücklich gekennzeichneten Beispieldaten im Browser geprüft. Physische Geräteabnahme bleibt separat. Push-Timer, Firebase-Konfiguration und ÖBB/S-Bahn-Datenquelle weiterhin offen; keine neue Push-Aktivierung.

## PWA 0.1.22 / Wear 0.3.0 · Sichtbare Stationen und gemeinsame Favoritenkarten · 08.11.2026

Favoriten derselben Station erscheinen in einer gemeinsamen Karte, auch wenn nur einzelne Linien/Richtungen gespeichert sind. Der Stationsname ist immer die Hauptüberschrift; Richtungen stehen darunter. PWA: einzelner Stern entfernt nur die gespeicherte Verbindung, ein exklusives Stationsmenü verschiebt/entfernt die gesamte Karte. Entfernungssortierung gruppiert nur die Ansicht; gespeicherte Reihenfolge, JSON, QR und lokale Datenschlüssel bleiben erhalten. Watch: gleiche Stationsgruppierung, Verbindungen weiterhin einzeln über das Detail entfernbar. Ganze Station plus einzelne Verbindungen erzeugen keine doppelten geladenen Zeilen.

Warnmeldungen: betroffene Linien bleiben sowohl in der geschlossenen Warnmeldungen-Karte als auch im geschlossenen Stationshinweis als farbige Linienbadges sichtbar. Alle zusammengefassten Ereignisse tragen bei. Explizite Betreiber-Linienreferenzen haben Vorrang; bei fehlenden Referenzen werden nur eindeutige Linienlisten im Meldungstitel übernommen, keine beliebigen Zahlen aus Beschreibungstexten. Leere Warnbereiche bleiben verborgen; Relevanz, Deduplizierung und Kennzeichnung älterer Daten erhalten.

Abrufpriorität: tatsächlich sichtbare Stationen verbrauchen zuerst das bestehende 24-RBL-Budget, erst danach außerhalb des Bildschirms liegende Stationen. PWA: sichtbar und aufgeklappt vor sichtbar geschlossen. Innerhalb derselben Sichtbarkeitsstufe bestätigte U-Bahn vor Tram vor Bus; bei Überlauf begrenzte Rotation. Scrollen verursacht keine zusätzlichen Requests innerhalb der 30-Sekunden-Sperre. Pause beendet normales Monitor-Polling und GPS. Offene PWA-Dialoge sowie native Unterseiten halten Monitor-Polling an. Josefstädter Straße U: Tram-RBL liegen numerisch vor den U6-RBL 4607/4622; die frühere Verteilung konnte U6 im ersten Budget verdrängen. Es gab dort keine PWA-Dreiergrenze. Öffentlicher API-Abruf mit allen acht Bahnsteigen lieferte zwei U6-Richtungen und drei Tram-Richtungen; Katalog-Badges bedeuten nicht, dass jede historische Linie aktuell fährt.

Direkter Watch-Push ist im nativen Code vorbereitet: ausdrücklicher Opt-in, Android-Freigabe, Favoriten/alle Linien, Nachtruhe, Aufzüge, Test/Abmeldung und begrenztes lokales Hinweisarchiv. FCM plus Firebase Installations nur nach Opt-in; keine Analytics/Auth/Firestore/Hosting/Functions. Kein Hintergrund-GPS oder Abfahrts-Polling. Google verarbeitet Zustellkennung und Nachrichtentext, unser bestehender Dienst verschlüsselte Minimalfilter. Firebase-Projekt/Serverfreigabe und physische Zustellung sind noch nicht verbunden/geprüft. PWA verwendet weiterhin standardmäßigen Web Push. PUSH_SCHEDULER_ENABLED=false bleibt bis zum nachgewiesenen Hintergrundbetrieb erhalten; ein begrenztes Site-Werkzeug prüft während der Einrichtung ausschließlich die offizielle Quelle. [Betrieb und Konfiguration](docs/push-notifications.md).

Wear 0.3.0 / Code 7, Paket at.andrew.foamawien und ursprüngliches Zertifikat. Update: Mehr → App & Updates → Auf Update prüfen; nicht deinstallieren. 139 Node-, 77 native Android- und drei Python-Prüfungen; native Beispielrenderings. Browser bestätigt gemeinsame Karten und Bewegung ganzer Stationsgruppen; weiterer Vorschauzugriff durch interne URL-Policy blockiert, kein behaupteter kompletter mobiler Browser-Rundlauf. Physische Watch-/Push-Abnahme separat. ÖBB/S-Bahn-Datenquelle weiterhin offen.

## Historische Releases und ergänzende Dokumentation

## PWA 0.1.21 / Wear 0.2.5 · Verkehrsmittel und Karlsplatz · 08.11.2026

U-Bahn vor Tram vor Bus: nahe Stationskarten auf beiden Geräten nach dem besten eingeschalteten, belegten Verkehrsmittel, innerhalb derselben Gruppe nach Entfernung. Die PWA begrenzt die Liste erst nach dieser Sortierung und erhält die Priorität beim Neuzeichnen mit Gehentfernungen. Gespeicherte Favoriten behalten ihre manuelle Reihenfolge.

Watch: bisherige harte Vorschaugrenze von drei Linien/Richtungen in Nähe und ganzen Stationsfavoriten entfernt. Alle geladenen passenden Verbindungen erscheinen; U-Bahn-Gruppen stehen vor Tram und Bus, danach nächste Abfahrt. Der erste API-Batch priorisiert in Nähe bestätigte eingeschaltete U-Bahn-Bahnsteige; höchstens 24 RBL, 16 priorisierte plus acht rotierende bei Überlauf. Favoriten behalten die Stationspriorität, innerhalb einer Station werden höher priorisierte Bahnsteige zuerst abgefragt.

Aktive Verkehrsmittel erscheinen als lokale Vektorsymbole direkt im Hauptbild. In Nähe mit dem ersten Stationskopf und der geschätzten Gehzeit kombiniert, in Favoriten als kompakte Zeile. Tippen öffnet sofort Verkehrsmittel; Zurück, Wischen und System-Back kehren zur vorherigen Hauptansicht zurück. Alle ausgeschaltet: klarer Hinweis und weiterhin erreichbar. Volle 48-dp-Tippfläche, keine zusätzliche Hintergrundarbeit. Menüpfad Mehr → Standort & Nähe → Verkehrsmittel bleibt erhalten.

Wear 0.2.5 / Code 6, Paket und ursprünglicher Signaturschlüssel bleiben erhalten. Update über Mehr → App & Updates → Auf Update prüfen. Nicht deinstallieren. Native Abnahme mit synthetischen Karlsplatz-Testverbindungen; physische Uhr-/Live-Karlsplatz-Abnahme separat erforderlich. ÖBB/S-Bahn-Anbindung bleibt offen; Filter allein bedeutet keine Datenquelle.

Push für Telefon und eigenständige Watch ist weiterhin ein eigener offener Arbeitsstrang: PWA-Infrastruktur vorhanden, Aktivierung wegen fehlendem verlässlichem Server-Timer gesperrt. Native FCM-Konfiguration/Anbindung noch offen. Firebase-Verbindung zur weiteren Einrichtung angeboten; keine aktive Watch-Push-Zustellung behaupten.

JSON-Exporte: YYYYMMDD_foama-wien-…json, Exportdatum in Wiener Zeit; Favoriten, Watch-Transfer-Download und Diagnoseprotokolle. Produktive Browserprüfung: verschlüsselter JSON-Upload, Empfänger-Entschlüsselung, bestätigter PWA-Import und sofort gelöschter Ciphertext erfolgreich. Temporäre Prüffläche entfernt.

# foama-wien

**Smartphone-PWA v0.1.23** · 08.11.2026 · [Öffentliche App](https://foama-wien.endruuu.chatgpt.site)

Öffi-Abfahrten in Wien, nahe Stationen, persönliche Favoriten und eingeschätzte Geh-Erreichbarkeit. Die vorhandene Implementierung und lokale Daten bleiben erhalten. Die native Wear-OS-Testversion 0.3.3 ist über die verknüpfte Uhr-Webseite verfügbar; tatsächliche Geräteabnahme und QR-Transfer bleiben gesondert.

## PWA 0.1.20 · Optionale Störungsbenachrichtigungen · 08.11.2026

Mehr → Einstellungen → Störungsbenachrichtigungen. Favoriten oder alle Wiener-Linien-Linien, optionale Aufzugsmeldungen/Nachtruhe, ausdrücklicher Opt-in, Testnachricht und Abmeldung. Semantisch deduplizierte Sammelhinweise, 30 Minuten Abstand und sechs automatische Hinweise pro Wiener Tag. Push-Registrierung und minimale Filter verschlüsselt in D1, Schlüssel ausschließlich Hosting-Secrets. GPS/Abfahrten unverändert nur sichtbar; Wear 0.2.4 bleibt unverändert. Implementierung und produktiver manueller Quellen-/Gerätefreigabetest erfolgreich. Automatischer Hintergrundlauf der Plattform fehlgeschlagen und pausiert; Push-Aktivierung bleibt deshalb gesperrt. Docker-Timer für einen separaten Server vorbereitet, noch nicht gestartet. [Details, Datenhaltung und Abnahme](docs/push-notifications.md).

## PWA 0.1.19 · Kompaktere Stationsabfahrten · 08.11.2026

Weniger vertikaler Leerraum zwischen Linien derselben Station in Nähe und Favoriten. Nähe-Zeilen mindestens 64 statt 76 px, Abstand zwischen Linienbadge und Richtung 2 statt 6 px; Favoritenzeilen ohne eigene Interaktion mindestens 40 statt 44 px, Gruppengap 2 statt 5 px. Lange Richtungen wachsen weiter natürlich. Hauptzeit 28 px und feste Zeitspalten bleiben erhalten. Linien-Favoritenknopf in Nähe mit 44 × 44 px Tippfläche innerhalb seiner Zeile. Keine Daten-, Abruf-, Speicher- oder native Änderung; Wear 0.2.4 / Code 5 unverändert.

## PWA 0.1.18 / Wear 0.2.4 · QR-Favoritenübertragung · 08.11.2026

Mehr → Favoriten → Mit Handy übertragen auf der Uhr. Vom Handy empfangen oder Ans Handy senden wählen und QR-Code mit der Handy-Kamera scannen. Die eigenständige Übertragungsseite nimmt lokale PWA-Favoriten oder einen JSON-Export an. Auf der Uhr Vorschau prüfen und ausdrücklich übernehmen; auf dem Handy PWA-Import oder JSON-Download wählen. Bestehende Favoriten bleiben erhalten, Duplikate werden übersprungen. Beide Geräte bleiben unabhängig, keine dauerhafte Synchronisierung.

## PWA 0.1.17 · 08.11.2026

Hinweis zur manuellen Reihenfolge und sämtliche Keine-/Lade-/Teilprüfungs-Texte für Betriebsmeldungen entfernt. Relevante Meldungen erscheinen ausschließlich bei vorhandenen Einträgen zusätzlich in einer eigenen, aufklappbaren Karte **Warnmeldungen**, mit Titelvorschau und Anzahl. Sie enthält Linien-/Haltestellenbezug, Gültigkeit, Quelle und Kennzeichnung älterer Daten. Kein Platzhalter und keine Entwarnung bei fehlenden Daten. Stationsbezogene Detailhinweise bleiben erreichbar.

## PWA 0.1.16 / Wear 0.2.3 · 08.11.2026

PWA: alle sechs Verkehrsmittel bleiben auch bei 320 px in einer Reihe, mit mindestens 44-px-Tippflächen. Suchradius im Filterkopf. Kurze Sortier- und Betriebsinfos stehen innerhalb der jeweiligen Karte; ausführliche Stationsmeldungen bleiben erhalten. Keine neue API-, Standort- oder Speicherlogik.

Wear: kompakter Hauptschalter mit Pin/Stern neben Nähe/Favoriten, höchstens 184 dp breit. Sichtbare Leiste 36 dp hoch, volle 48-dp-Tippflächen. 12-sp-Beschriftungen, Auswahlzustand und bewährte Mehr-/Zurück-Gestaltung erhalten. Ursprüngliches Zertifikat, Paket und lokale Daten bleiben bei einem Update erhalten. QR-Transfer weiterhin nicht aktiviert; JSON-Export in der PWA unter Mehr → Einstellungen → Favoriten sichern.

## PWA 0.1.15

Favoriten zuverlässig über Nach oben/Nach unten umordnen. Ein Bearbeitungsmenü zur Zeit; Verschieben/Entfernen schließt es. Zuordnung über stabile Favoritenidentitäten, Fokus ohne Scrollsprung. 97 Regressionstests und Browserprüfung einschließlich Reload.

## Neu: PWA 0.1.14 / Wear 0.2.2

PWA-Filter auch geschlossen direkt über Verkehrsmittelsymbole schalten; Dein Standort startet eingeklappt. Watch-Hauptschalter mit Pin/Stern; Zurück-Gesten folgen der Menüstruktur. App-Pause/Display aus stoppen Ortung und aktive HTTP-Anfragen. Abfahrtencache und Update-Dateien sind begrenzt und werden bereinigt; Favoriten/Einstellungen bleiben. [Release](docs/wear-os-release-0.2.2.md).

## Wear OS 0.2.1

Kompakte Verbindungszeilen und native Stile nach dem Entwurf, vier kleine Mehr-Unterseiten. Standortsuche wechselt bei stummer Quelle, endet nach 30 Sekunden mit Wiederholen und stoppt bei App-Pause. Update aus 0.2.0: Mehr → Auf Update prüfen; danach Mehr → App & Updates. [Details](docs/wear-os-release-0.2.1.md).

## Neu in v0.1.13

Abfahrtszeiten, Qualitätskennzeichnung und Folgeabfahrt reservieren feste Spaltenbreiten. Ein- und zweistellige Minuten, Live/Fahrplan/Älter und einzelne Verbindungsfavoriten bleiben dadurch an derselben rechten Achse. Die PWA verlinkt sichtbar im Footer zur Uhr-App; deren Kopf und Footer führen eindeutig zur Smartphone-PWA.

## Neu in v0.1.12

**Einstellungen → Aussehen → System / Dunkel / Hell**. Auswahl wird gespeichert; System folgt automatisch dem Gerät. Linienfarben, große Zahlen, kompakte Favoriten und zusammengeführter Standortstatus bleiben erhalten.

## Neu in v0.1.11

Stationsfavoriten mit engeren Zeilen und Abständen, weiterhin großen nächsten Abfahrtszeiten und vollständig lesbaren Richtungsnamen.

## Neu in v0.1.10

Standortstatus direkt in **Dein Standort**, mit Genauigkeit/Fix-Alter und Hinweis zur 30-s-Abfahrtsaktualisierung. Kein zusätzliches Standortbanner; Daten-/Startfehler behalten einen eigenen Hinweis.

## Neu in v0.1.9

Neue Stationskarten ohne Personen-Icon: klarer Name und Kartenlink, Gehwegmetadaten, Linienzeile und vollbreite aufklappbare Abfahrtsvorschau. Nächste Abfahrtszeit überall einheitlich groß, auch innerhalb ganzer Stationsfavoriten. Sortierknöpfe bleiben direkt sichtbar.

## Neu in v0.1.8

Favoriten-Sortierung über direkte Umschaltknöpfe **Meine Reihenfolge / Nächste zuerst**. Auswahl, manuelle Reihenfolge und Live-Datenpriorität bleiben erhalten.

## Neu in v0.1.7

Betriebsmeldungen beachten jetzt den tatsächlichen Haltestellenbezug der Kurzmeldungen und zeigen passende ausführliche Meldungen einmal. Auf der Standortkarte lässt sich eine Station direkt mit **Haltestelle merken** speichern. Favoriten bieten **Meine Reihenfolge / Nächste zuerst**; Entfernungsansicht sortiert lokal nach Luftlinie, während die manuelle Ordnung erhalten bleibt. Die Live-Priorität folgt der gewählten Ansicht: erste 16 RBL regelmäßig, weitere acht rotierend, maximal 24 je 30 Sekunden. Kleine Favoritenlisten werden vollständig geladen. Veraltete Daten bleiben erkennbar. Die überholte App-Symbol-Hilfe wurde entfernt.

## Neu in v0.1.6

Optionaler Standort-Akkusparmodus unter **Einstellungen → Standort → Bei wenig Bewegung Akku sparen**. Nach etwa einer Minute ruhiger Sensorwerte und stabiler genauer Standorte kurze Ortungspausen; Bewegung startet die Ortung wieder, ein Kontrollversuch erfolgt spätestens nach einer Minute. Grober Empfang oder fehlende Sensoren verwenden den bisherigen Standortpfad. Standard aus, Auswahl gespeichert, keine Sensor-/Positionshistorie, keine Hintergrundarbeit. Abfahrten weiterhin alle 30 Sekunden sichtbar. Tatsächliche Akkuersparnis muss am Android-Gerät geprüft werden. [Funktionsweise und Grenzen](docs/motion-battery-saving.md).

## Neu in v0.1.5

- Nachtlinien und Nacht-Rufbusse mit dunkelblauen Linienkacheln und weißer Schrift; U-Bahn-Farben unverändert.
- Karte unter **Standort → Karte** zeigt passende nahe Haltestellen mit Linien. Filter und Suchradius gelten auch auf der Karte. Antippen öffnet Linien, ungefähre Zieladresse und Navigation; eine Liste ergänzt die Karte.
- Stations-Fußwegkarte zeigt Straße und Postleitzahl. Adressangaben werden lokal aus öffentlichen Wiener Referenzpunkten berechnet und sind ungefähr; keine Hausnummern werden erfunden.
- Offizielle Bau-, Sperr-, Umleitungs-, Aufzugs- und weitere Betriebsmeldungen in Stations-/Favoritenkarten, mit Zeitangaben, Quellenangabe sowie Unterscheidung Haltestellen-/Linienhinweis und geplant/älter. Kein Entwarnen allein bei fehlenden oder nicht ladbaren Meldungen.
- Gleicher 30-s-Monitorabruf im Vordergrund, ergänzt durch einen serverseitig zwei Minuten gepufferten offiziellen Linienmeldungsfeed. So erscheinen auch linienweite Bauarbeiten außerhalb des unmittelbaren Haltepunkts. Bei Ausfall dieser Ergänzung bleiben Abfahrten nutzbar.
- Kompakterer Standort, ruhigere Karten/Favoriten, Bearbeitungsmenü pro Favorit; ganze Stationsfavoriten zeigen Erreichbarkeit je Verbindung statt für die gesamte Station anhand der ersten Abfahrt.
- Kartenbibliothek Leaflet 1.9.4 inklusive Lizenz lokal gebündelt. Keine CDN-Abhängigkeit beim Kartenaufbau; bei fehlendem Kartenhintergrund bleiben Stationen/Linien und Liste nutzbar.
- Separaten API-Testbildschirm aus der normalen Bedienung entfernt. **Einstellungen → Debugging** ist standardmäßig eingeklappt; dort technisches Fehlerprotokoll als JSON speichern/kopieren. Keine GPS-Koordinaten, StopIDs/Haltestellennamen, Favoriten, URLs, Berechtigungen, QR-Schlüssel oder Rohantworten im neuen Log. Frühere `/diagnose`-Links führen auf eine Umzugshinweisseite.

## Nutzung

Öffentliche App in Chrome auf Android öffnen → Standort aktivieren und erteilen → passende Verkehrsmittel und Radius wählen. Installation über Chrome-Menü → App installieren; der Browser steuert die Installationsfreigabe. App-ID/Startadresse/Favoriten bleiben bei Updates gleich. Launcher-Symbole werden von Android/Chrome separat aktualisiert.

Näheradius standardmäßig 300 m (100–2.000 m), Gehgeschwindigkeit 4,5 km/h, Reserve 1 Minute. Standortdaten nur bei sichtbarer App. Kleine GPS-Updates erneuern Genauigkeit/Alter; nach etwa 40 m wird die Nähe-Liste neu berechnet. Bei grobem/veraltetem Empfang oder schneller Bewegung keine gesicherte Geh-Ampel. Keine Position im Tunnel erfinden.

Favoriten bleiben lokal und unabhängig vom Nähe-Filter. Ganze Stationen oder einzelne Linien/Richtungen nach Namen suchen und ausdrücklich auswählen. Stationsname öffnet Fußweg/Karte; Google Maps nutzt den Telefonstandort als Start, außer bei bewusst manuell gesetztem Startpunkt. Karten/Routing laden erst nach Nutzeraktion bzw. ausdrücklichem Routing-Opt-in.

Echte Wiener-Linien-Abfahrten über den eigenen festen Relay, maximal 24 StopIDs je Abruf. Ältere Abfahrten als solche markiert. Bei Anbieter-403/429 längere Wiederholungsabstände und gespeicherter Stand; Anbieterfehler sind damit nicht aufgehoben. Importierte ÖBB-GTFS-Daten sind Sollfahrplan; keine realen ÖBB-Daten mitgeliefert.

## Entwicklung

```bash
node --test tests/*.test.mjs tests/test_*.mjs
python3 scripts/build_site.py
```

122 Node-Tests und drei Python-Vertragsprüfungen für den vorbereiteten Timer. Der Build bettet vorhandene PWA-Dateien und Relay in einen Sites-Worker ein. Kanonischer Checkout/Hosting-ID bleiben erhalten. Keine zusätzliche Library-Kopie des Git-Projekts.

[Deployment](DEPLOYMENT.md) · [Architektur](docs/architecture.md) · [Abläufe](docs/flow.md) · [Tests](docs/tests.md) · [Release Notes](docs/release.md) · [Quellen](LICENSE-SOURCES.md) · [Wear-Build](docs/squashtap-build-adaptation.md).

## Wear OS – native Testversion 0.2.4

[Download & Installation](https://foama-wien.endruuu.chatgpt.site/wear.html) · [Release und Geräteabnahme](docs/wear-os-release-0.2.4.md). Signierte APK mit Nähe, lokalen Favoriten, großer Verbindungsanzeige und privater QR-Übertragung in beide Richtungen. Stabile Paket-ID at.andrew.foamawien und ursprüngliches Zertifikat; 60 native Tests. Push in diesem Release gehört zur Smartphone-PWA, die native APK bleibt unverändert. Physische OnePlus-Abnahme und Telefon-/Watch-Benachrichtigungsanzeige getrennt prüfen.

CLI-Build: python3 scripts/bootstrap_android.py, python3 scripts/sync_wear_assets.py, dann python3 scripts/build.py --base-url https://foama-wien.endruuu.chatgpt.site --out .local/native-release. Für Updates den bestehenden privaten Signierschlüssel wiederherstellen; niemals neu generieren. [Builddetails](docs/squashtap-build-adaptation.md).

[Früherer interaktiver Entwurf](https://foama-wien.endruuu.chatgpt.site/wear-design.html) bleibt als mit Beispieldaten gekennzeichnete Designvorschau erhalten.

Öffentliche Browserabnahme erfolgreich: Standortkarte mit öffentlichem manuellem Floridsdorf-Testpunkt, Popup mit beiden getrennten Aktionen, vorausgewählte Haltestelle und aktuelle Linien/Richtungen, U6 Richtung Siebenhirten als einzelner Favorit gespeichert und nach Schließen zurück auf unverändert geöffnete Karte. Bestehende Favoriten erhalten, Speicherrückmeldung auf Karte sichtbar. Öffentliche Uhr-APK heruntergeladen und bytegleich zum signierten Build verifiziert: 3.731.884 Bytes, SHA-256 6843c2f93cbdf3799fe953dd5bd1909c68def222c127ce6d4520881276a2bc83.
