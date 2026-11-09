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
Live-Abnahme: Bei 29B nach Großfeldsiedlung nennt der Planer das Ziel ohne U-Bahn-Suffix, der Monitor mit „U (über Leopoldau S U)“. PWA und Uhr vergleichen vollständige Zielnamen nach Entfernen reiner S/U-Suffixe. Zusätzliche Monitor-via-Angaben sind bei allgemeinem Planerziel erlaubt; eine ausdrücklich geplante via-Angabe muss übereinstimmen. Keine Teilwort-/Gegenrichtungszuordnung. Gespeicherte Variantenidentitäten bleiben davon getrennt. Zwei Web- und ein nativer Regressionsfall sichern echte Schreibweisen, zweite Etappe und verspätete Detaildaten ab.


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

## PWA 0.1.29 · Kopf-Icons und Reiseplanungsgrundlage · 08.11.2026

Kopfaktionen Teilen/Einstellungen einheitlich 44 × 44 px, beide SVGs 22 × 22 px / Strichstärke 1,8. Wear 0.3.6 unverändert. Standortkarte behält die bestehende Kopplung an den gewählten Suchradius; Nutzer hat den gemeldeten Zoom als Folge der eigenen Radiuswahl bestätigt.

A-nach-B-Grundlage vorbereitet: echte MOTIS-v6-Antwort (HTTP 200, sechs Verbindungen) mit öffentlichen Punkten Westbahnhof/Karlsplatz. Adapter, normalisiertes Reisemodell, genaue IFOPT/DIVA-Zuordnung, Einstiegs-/Umstiegsziele und ausdrücklich getrennte aktuelle Linienalternativen. Noch keine UI oder laufende Produktionsanbindung. Für VAO fehlt eigener Zugang; Transitous erlaubt leichte Prototyptests, verlangt für dauerhafte Nutzung eine veröffentlichte Open-Source-Lizenz. Projektlizenz ist noch nicht festgelegt; keine Lizenz geändert und kein Vertrag angenommen.

## PWA 0.1.28 · App-Einladung · 08.11.2026

Auf der Hauptseite erscheint bei verfügbarer neuer PWA-Version ein Hinweis mit **Jetzt aktualisieren**. Prüfung beim Start und alle fünf Minuten nur bei sichtbarer App; keine automatische Neuladung. Update aktiviert den vorbereiteten Worker und lädt die App neu, Favoriten/Einstellungen bleiben erhalten.

Header-Aktion ersetzt: App teilen statt manueller Abfahrtsaktualisierung. Native Web-Share-Auswahl, bei fehlender/gesperrter Unterstützung ein Dialog mit öffentlichem App-Link, Kopieren und bewusstem WhatsApp-Aufruf. Abbruch öffnet keinen Ersatzdialog. Kein automatisches Senden oder Kopieren und keine persönlichen Daten im Link. Bestehende sichtbare 30-Sekunden-Aktualisierung bleibt unverändert; Uhr 0.3.6 ohne Neubuild. A-nach-B-Planung weiterhin vorgemerkt.

## PWA 0.1.27 / Wear 0.3.6 · Favoritentexte und neuer Featurewunsch · 08.11.2026

Nutzerwunsch: zusätzlicher Standort-/Luftlinie-Satz aus der PWA-Favoritensortierung entfernt; nur ohne Position bleibt der Fallback-Hinweis. Beide Apps nennen die Entfernungssortierung jetzt Nähesten zuerst. Keine Sortier-/Favoritenmigration, neue Berechtigung oder API-Abfrage.

A-nach-B-Planung für PWA und Uhr als geplantes Feature aufgenommen: Gehzeiten, Gesamtdauer, Umstiege, gezielte Abfahrten an Einstiegs-/Umsteigestationen und nächste Alternativen. [Umfang, Dienstoptionen und nächster Schritt](docs/journey-planning.md). Noch nicht implementiert; VAO-Zugang/Kontingent/Kosten zuerst prüfen.

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

Push-Implementierung vorbereitet und geprüft; noch kein verlässlicher automatischer Hintergrundversand. Erster geplanter Lauf am 08.11.2026 fehlgeschlagen, ohne Fehlergrund im Aufgabenprotokoll; Auftrag pausiert. PUSH_SCHEDULER_ENABLED=false, neue Push-Aktivierung gesperrt. Docker-Timer für Hostinger unter deploy/push-timer vorbereitet, Serverzugang/Start noch offen. Manuelle produktive Quellenprüfung und Geräte-API einschließlich Abmeldung erfolgreich; Cloud-Browser blockiert Notifications. 122 Node- und drei Python-Vertragsprüfungen. Keine eigenständige Wear-Push-Zustellung.

## PWA 0.1.20 · Optionale Störungsbenachrichtigungen · 08.11.2026

Mehr → Einstellungen → Störungsbenachrichtigungen. Favoriten oder alle Wiener-Linien-Linien, optionale Aufzugsmeldungen/Nachtruhe, ausdrücklicher Opt-in, Testnachricht und Abmeldung. Semantisch deduplizierte Sammelhinweise, 30 Minuten Abstand und sechs automatische Hinweise pro Wiener Tag. Push-Registrierung und minimale Filter verschlüsselt in D1, Schlüssel ausschließlich Hosting-Secrets. GPS/Abfahrten unverändert nur sichtbar; Wear 0.2.4 bleibt unverändert. Implementierung und produktiver manueller Quellen-/Gerätefreigabetest erfolgreich. Automatischer Hintergrundlauf der Plattform fehlgeschlagen und pausiert; Push-Aktivierung bleibt deshalb gesperrt. Docker-Timer für einen separaten Server vorbereitet, noch nicht gestartet. [Details, Datenhaltung und Abnahme](docs/push-notifications.md).

## PWA 0.1.19 · Kompaktere Stationsabfahrten · 08.11.2026

Weniger vertikaler Leerraum zwischen Linien derselben Station in Nähe und Favoriten. Nähe-Zeilen mindestens 64 statt 76 px, Abstand zwischen Linienbadge und Richtung 2 statt 6 px; Favoritenzeilen ohne eigene Interaktion mindestens 40 statt 44 px, Gruppengap 2 statt 5 px. Lange Richtungen wachsen weiter natürlich. Hauptzeit 28 px und feste Zeitspalten bleiben erhalten. Linien-Favoritenknopf in Nähe mit 44 × 44 px Tippfläche innerhalb seiner Zeile. Keine Daten-, Abruf-, Speicher- oder native Änderung; Wear 0.2.4 / Code 5 unverändert.

ÖBB/Schnellbahn: bislang kein Datensatz und keine Echtzeitquelle verbunden. Der einmalige geplante Integrationslauf vom 08.11.2026 ist laut Automationsprotokoll fehlgeschlagen; nur generischer Fehler, kein neuer Quellcommit und keine Veröffentlichung. Stations-/Abfahrtsdaten für Siemensstraße und Floridsdorf bleiben nächste separate Aufgabe. S-Bahn-Filter und GTFS-Importer allein sind keine Datenanbindung.

JSON-Exporte: YYYYMMDD_foama-wien-…json, Exportdatum in Wiener Zeit; Favoriten, Watch-Transfer-Download und Diagnoseprotokolle. Produktive Browserprüfung: verschlüsselter JSON-Upload, Empfänger-Entschlüsselung, bestätigter PWA-Import und sofort gelöschter Ciphertext erfolgreich. Temporäre Prüffläche entfernt.

# PWA 0.1.18 / Wear 0.2.4 · QR-Favoritenübertragung · 08.11.2026

Mehr → Favoriten → Mit Handy übertragen auf der Uhr. Vom Handy empfangen oder Ans Handy senden wählen und QR-Code mit der Handy-Kamera scannen. Die eigenständige Übertragungsseite nimmt lokale PWA-Favoriten oder einen JSON-Export an. Auf der Uhr Vorschau prüfen und ausdrücklich übernehmen; auf dem Handy PWA-Import oder JSON-Download wählen. Bestehende Favoriten bleiben erhalten, Duplikate werden übersprungen. Beide Geräte bleiben unabhängig, keine dauerhafte Synchronisierung.

# PWA 0.1.17 · 08.11.2026

Hinweis zur manuellen Reihenfolge und sämtliche Keine-/Lade-/Teilprüfungs-Texte für Betriebsmeldungen entfernt. Relevante Meldungen erscheinen ausschließlich bei vorhandenen Einträgen zusätzlich in einer eigenen, aufklappbaren Karte **Warnmeldungen**, mit Titelvorschau und Anzahl. Sie enthält Linien-/Haltestellenbezug, Gültigkeit, Quelle und Kennzeichnung älterer Daten. Kein Platzhalter und keine Entwarnung bei fehlenden Daten. Stationsbezogene Detailhinweise bleiben erreichbar.

101 Node-Tests und Browserprüfung: leere Ansicht ohne Hinweistext, Warnkarte in Hell/Dunkel, Aufklappen und vollständiges Verschwinden nach der letzten Meldung. Wear 0.2.3 unverändert. ÖBB-Datensatz weiterhin leer, keine Schnellbahn-Abfahrten verbunden. Favoritensuche: Favoriten → unten ＋ Favorit hinzufügen → Haltestelle suchen → ganze Station oder Linie/Richtung speichern.

# PWA 0.1.16 / Wear 0.2.3 · 08.11.2026

PWA: alle sechs Verkehrsmittel bleiben auch bei 320 px in einer Reihe, mit mindestens 44-px-Tippflächen. Suchradius im Filterkopf. Kurze Sortier- und Betriebsinfos stehen innerhalb der jeweiligen Karte; ausführliche Stationsmeldungen bleiben erhalten. Keine neue API-, Standort- oder Speicherlogik.

Wear: kompakter Hauptschalter mit Pin/Stern neben Nähe/Favoriten, höchstens 184 dp breit. Sichtbare Leiste 36 dp hoch, volle 48-dp-Tippflächen. 12-sp-Beschriftungen, Auswahlzustand und bewährte Mehr-/Zurück-Gestaltung erhalten. Ursprüngliches Zertifikat, Paket und lokale Daten bleiben bei einem Update erhalten. QR-Transfer weiterhin nicht aktiviert; JSON-Export in der PWA unter Mehr → Einstellungen → Favoriten sichern.

97 Node- und 54 native Android-Tests bestanden. APK 0.2.3 / Code 4 signiert, Paket/Originalzertifikat und zipalign geprüft. Browser-QA bei 320/345/390 px: sechs Icons in gleicher Zeile, mindestens 44 px, Bus unabhängig schaltbar; Sortier-/Meldungstexte innerhalb ihrer Panels. Native Renderings 192/227 dp und 1,3-fache Schrift geprüft. Physische OnePlus-Watch-Abnahme des neuen Schalters steht aus. [Release](docs/wear-os-release-0.2.3.md).

# Aktueller Stand · PWA 0.1.15 / Wear 0.2.2

Überlagernde Favoritenmenüs in 0.1.14 im Browser reproduziert. Bearbeitungsmenüs sind jetzt getrennt von dauerhaft offen gehaltenen Betriebsmeldungen: genau ein aktives Menü, synchroner Klickzustand, ignorierte Toggle-Events entfernter Elemente. Verschieben/Entfernen, Ansichts-/Sortierwechsel, Außenklick und Escape schließen das Menü. Nach Umordnen liegt der Fokus ohne Seitensprung auf dem verschobenen Favoriten. Aktionen adressieren gespeicherte Favoritenidentitäten statt alter DOM-Indizes. 97 Node-Tests bestanden; Browser mit zwei Testfavoriten bestätigt beide Richtungen, geschlossene Menüs nach jedem Schritt und gespeicherte Reihenfolge nach Reload. Wear-Release bleibt 0.2.2.

# Aktueller Stand · PWA 0.1.14 / Wear 0.2.2

PWA: Im eingeklappten Verkehrsmittelfilter bleiben sechs beschriftete SVG-Symbole direkt schaltbar, einschließlich ausgeschalteter Modi. Dieselben gespeicherten Filter gelten in beiden Ansichten. Dein Standort startet bei jedem Seitenaufruf eingeklappt; Status und Kartenaktion bleiben sichtbar. Auf-/Zuklappen startet keine Ortung. 89 Node-Tests bestanden, Browserprüfung bestätigt Bus umschalten ohne Expansion, Synchronität beider Filteransichten und eingeklappten Standort nach Reload.

Wear: 0.2.2 / Code 3 mit ursprünglichem Zertifikat gebaut. Nutzer bestätigt 0.2.1 als gut funktionierend und bevorzugt die Mehr-/Zurück-Stile. Diese bleiben erhalten. Pin-/Stern-Schalter auf der Hauptseite, einheitliche linke/rechte Wisch-, Button- und System-Zurück-Navigation; nur die Hauptseite kann die Activity schließen. Native Window-Dismiss-Falle durch eigenen hierarchischen Gestenpfad ersetzt. GPS, Timer und HTTP-Sitzung werden bei Pause, Stop und SCREEN_OFF beendet. Verspätete Daten werden verworfen. Abfahrtencache höchstens 512 KiB / 3.000 Datensätze, Ablauf nach zehn Minuten, Bereinigung bei Öffnen/Schließen; Favoriten und Einstellungen bleiben. Update-Dateien bei Fehler, Abbruch, Dialogschluss/Installation oder App-Verlassen entfernen; Download maximal 8 MiB. 54 Android-Tests und Signatur-/Paket-/zipalign-Prüfung erfolgreich. Physischer Wischtest mit 0.2.2 bleibt nötig. [Release](docs/wear-os-release-0.2.2.md).

# Aktueller Stand · PWA 0.1.13 / Wear 0.2.1

Native Aktualisierung 0.2.1 / Code 2 gebaut und mit dem ursprünglichen Zertifikat signiert. 39 Android-Tests bestanden; Metadaten, SHA-256 und zipalign geprüft. Kompakte Verbindungszeilen, klar gewählte Tabs, eigene Aktions-/Auswahl-/Entfernen-/Zurück-Stile und vier kleine Mehr-Unterseiten. Standortcontroller versucht zunächst fused bzw. network/GPS, nach acht Sekunden weitere Quellen; nach 30 Sekunden ohne frischen genauen Fix beendet er die Suche mit Wiederholen-Hinweis. Keine Ortung im Hintergrund.

Nutzer hat die Installation und den Start von 0.2.0 auf der OnePlus Watch 2R bestätigt; die Position blieb dort auf „Position wird gesucht“. Der entsprechende Softwarepfad ist nun durch Quellenwechsel-/Zeitlimit-/UI-Tests abgedeckt. Die tatsächliche Ortung und Bedienung mit 0.2.1 auf seiner Uhr müssen erneut geprüft werden. QR-Transfer weiter nicht angeboten. PWA-Funktionen und gespeicherte Daten bleiben erhalten. [Release](docs/wear-os-release-0.2.1.md).

# Aktueller Stand · PWA 0.1.13 / Wear 0.2.0

Feste Breiten für Qualitätslabel und zweite Abfahrt verhindern versetzte Hauptzeiten zwischen Favoritenzeilen. Große Hauptzahlen unverändert; zusätzliche direkte Footer-Verknüpfung PWA → Wear, eindeutige Links Wear → Smartphone-PWA. APK 0.2.0 / Code 1 unverändert.

# Aktueller Stand · PWA 0.1.12 / Wear 0.2.0

PWA-System/Hell/Dunkel öffentlich geprüft, gespeicherte Auswahl und Systemanpassung. Helle Dialoge nach Kontrastprüfung korrigiert. Favoritenzeilen tatsächlich 44 px / Hauptzahl 28 px; normal kein separater Standortbanner.

Native Wear-Testversion 0.2.0 / Code 1 gebaut, RSA-signiert und mit apksigner, zipalign und Paketmetadaten verifiziert. 26 Android-Tests bestanden, native Runddisplay-Renderings kontrolliert. Downloadseite und APK sind auf derselben öffentlichen Site veröffentlicht. Öffentliche Seite geprüft; Worker bestätigt APK HTTP 200. Cloud-Download abgebrochen und automatisierte Direktaufrufe an Hosting-Edge blockiert; tatsächlicher Watch-Zugriff bleibt Gerätetest. [Native Release-Dokumentation](docs/wear-os-release-0.2.0.md). Physische OnePlus-Watch-Installation, GPS und Bedienung noch offen; QR-Transfer noch nicht als nutzbar angeboten. Privater Signierschlüssel dauerhaft separat gesichert.

## Historische Stände

# Aktueller Stand v0.1.12

PWA: System/Hell/Dunkel, gespeicherte Auswahl und automatische Systemanpassung. Kompakte Stationsfavoriten mit 28-px-Hauptzahlen, Standortstatus in Dein Standort, direkte Sortierknöpfe. 83 JS-Tests. Wear-Entwurf vorhanden; vorhandene Java-Quellen und CLI-Build werden als nächster Schritt zur fokussierten ersten APK weiterentwickelt. Android-Toolchain 34 und ZXing verifiziert verfügbar; noch keine fertige APK behaupten.

## Verlauf

# Aktueller Stand v0.1.11

Stationsfavoriten enger gesetzt (44-px-Mindestzeile, fünf Pixel Gruppengap), Hauptzahlen unverändert 28 px. Standortstatus in Dein Standort, Sortierknöpfe und Abrufpriorität erhalten. 80 bestehende Tests, öffentliche Anzeigeprüfung nach Veröffentlichung.

# Aktueller Stand v0.1.10

Standortstatus und Aktualisierungsinfo in Dein Standort zusammengeführt, einschließlich Warnungen/Manuell/Akkupause. Separater oberer Hinweis nur für API-/Katalog-/Startfehler. Standort-/Sensorlogik unverändert; 80 bestehende Tests, öffentliche Anzeigeprüfung nach Veröffentlichung.

# Aktueller Stand v0.1.9

Stationskarten ohne Personen-Icon, klare Kopfzeile/Verkehrsmittel, große Abfahrtsvorschau als gesamte Aufklappzeile. Einheitliche 28-px-Hauptzeiten in Stationen und Favoriten; zweite Zeit 17 px. Sortierknöpfe und Live-Priorität erhalten. 80 bestehende Regressionstests, öffentliche visuelle/Interaktionsprüfung nach Veröffentlichung.

# Aktueller Stand v0.1.8

Direkte Umschaltknöpfe für die Favoriten-Sortierung, Nutzerpräferenz gegen Dropdown berücksichtigt. Bestehende Sortier-/Priorisierungslogik und Einstellungen erhalten. 80 vorhandene Tests; öffentliche Button-Bedienprüfung nach Veröffentlichung.

# Aktueller Stand v0.1.7

Meldungsduplikate am echten Brunnengasse-Beispiel nachvollzogen: sieben Einträge → eine relevante ausführliche Meldung. Fremde Haltepunkt-Kurzmeldungen werden ausgeschlossen; ausführliche Monitorhinweise bleiben erhalten. Standortkarte und Listenalternative erlauben direkte Stationsfavoriten. Favoriten bieten gespeicherte manuelle Ordnung oder Entfernung; Live-Priorisierung folgt derselben Ordnung, Rest rotiert. Alte Symbolhilfe entfernt. 80 automatische Tests; physische Android-Sensor-/Akkutests und native Wear-APK bleiben offen.

## Vorheriger Stand

# Aktueller Stand v0.1.6

Optionaler Bewegungssensor-Akkusparmodus mit konservativer Kombination aus Standort und Sensorwerten. Standard aus; ein ruhiges Fahrzeug gilt nicht allein aufgrund der Sensoren als Stillstand. Kontrollversuch spätestens nach einer Minute, Wiederaufnahme bei Bewegung; normale Ortung bei ungenauem Empfang/Sensorfehler. Keine Hintergrundsensoren oder private Messwerte im Log. 70 automatische Tests; physischer Android-Bewegungs-/Akkuvergleich weiterhin offen. Wear-OS-Design vorhanden, native APK weiterhin nicht geliefert.

## Vorheriger Stand

# Aktueller Stand v0.1.5

- Nachtlinien dunkelblau, ungefähre Stationsadressen, allgemeine Standort-/Haltestellenkarte, offizielle Betriebsmeldungen und UI-Verdichtung implementiert.
- Eigenständige API-Testoberfläche auf Nutzerwunsch abgelöst durch eingeklapptes Debugging in Einstellungen; neue Exporte enthalten ausschließlich technische Ereignisse/Anzahlen.
- Leaflet lokal gebündelt; Kartenliste als Alternative zum Hintergrundbild. Favoriten: kein irreführender Gesamtstatus aus der allerersten Stationsabfahrt.
- 60 automatische Tests bestanden. Frühere Vorschau bestätigte Nachtfarben (RGB 22/42/99) und Zieladresse. Weitere interne Browser-Vorschau nach URL-Policy-Block gestoppt; öffentliche Prüfung nach Sites-Publikation.
- Offizielle Live-API lieferte in dieser Sitzung reale aktive Gleisbau-/Betriebsmeldungen über trafficInfoList. Monitor kann an einem nicht unmittelbar betroffenen Haltepunkt trotzdem keine Meldung enthalten; deshalb linienweite Ergänzung.
- PWA öffentlich geprüft: funktionierende Karte, Nachtlinien und echte Gleisbau-Betriebsmeldungen; Debug-Download erfolgreich.
- Danach reduzierten Wear-OS-Entwurf mit interaktiver Runddisplay-Vorschau erstellt (Nähe/Favoriten/Verbindung). Native APK weiter nicht veröffentlicht.

## Verlauf

# Aktueller Stand v0.1.5

Nachtlinien-Kacheln dunkelblau; ungefähre Zieladresse in der Stationskarte. Vorhandene Datenquellen und Identität erhalten. Prüfungen siehe docs/tests.md.

# Aktueller Stand v0.1.4 · 07.11.2026

- Bestehende öffentliche Site / unveränderte Identität: https://foama-wien.endruuu.chatgpt.site.
- Aktuelle Ergänzungen: gespeicherter Klappfilter, strikte Verkehrsmittelzuordnung, Offline-Stationslinien, lokale Wiener Straßenumgebung, Standortkarte/Google Maps, Umgang mit Fahrt-/Tunnelpositionen und Fehlerpuffer.
- 50 Node-Tests bestanden; lokale Browserprüfung bestätigt U-Bahn-only mit nur Stephansplatz statt umliegenden Busstationen, erhaltenen Klappzustand nach Reload, lokales Straßenumfeld und gerenderte Standortkarte mit Google-Link.
- Vor Release wurde im produktiven Relay ein echter HTTP-200-U1-Monitor bestätigt; Nutzerfehler 403 ist zugleich in Worker-Logs belegt. Direkte Browser-Diagnosefehler beweisen keinen CORS-Grund und sind vom Relay zu unterscheiden. Keine Garantie störungsfreier Anbieterantworten.
- Öffentliche Release-Abnahme wird in docs/validation-v0.1.4.json festgehalten. Physischer Bewegungs-/Tunneltest und tatsächlicher Google-Maps-Android-Appstart bleiben Gerätetests.
- Wear-APK, ÖBB-Echtzeitdaten und QR-Hardwaretest bleiben getrennte offene Aufgaben.

## Frühere Releases

# Aktueller Stand v0.1.3

- Nutzer bestätigt: GPS funktioniert; normale App zeigt reale Abfahrtsdaten.
- Neues Tram-Symbol mit passenden SVG-/PWA-Icons; offizielle U-Bahn-Linienfarben geprüft.
- Stationsklick öffnet die Fußwegkarte; separates Aufklappen der Abfahrten bleibt möglich.
- Favoritensuche nach Namen und Auswahl ganzer Stationen oder konkreter Linien/Richtungen implementiert.
- Zusätzliche Metadaten an echter Monitorantwort und offizieller Dokumentation geprüft, siehe docs/wiener-linien-metadata.md.
- 36 Node-Tests bestanden. Routingdienst mit öffentlichen Stationskoordinaten geprüft: HTTP 200, echte Fußweg-Geometrie (LineString), Distanz und Dauer.
- Physische Wear-APK, ÖBB-Daten und QR-Hardwaretest weiter offen.

## Vorherige Abnahme

# foama-wien – Status v0.1.3 (2026-11-07)

- Bestehende öffentliche Site: https://foama-wien.endruuu.chatgpt.site; Diagnose `/diagnose`.
- Vom Nutzer bestätigt: v0.1.1 HTTPS und Service Worker aktiv; direkte Monitoraufrufe ohne lesbaren HTTP-Status gescheitert. Screenshot zeigt die Host-Bearbeiten-Schaltfläche über dem fixen unteren Menü.
- Behoben: Navigation im Seitenfluss; sichtbare Standortaktion mit präzisen Berechtigungs-/Fehlerhinweisen; kein automatischer Erst-Prompt ohne Nutzeraktion.
- Erhalten: Bewegungsfilter, aktive 30-s-Refreshs, Favoriten/Import/Export, Karten, Diagnose und Wear-Quellen.
- Offizieller Haltestellenkatalog abgerufen und konvertiert: 1.811 Stopgruppen. Echte Monitorantwort von der offiziellen API serverseitig HTTP 200 erhalten.
- API-Relay auf derselben Site implementiert; produktives Hosting wird mit Sites-Version/Deployment dokumentiert. Direkte Tests bleiben unverändert möglich.
- 34/34 Node-Tests bestanden. Lokale Browserprüfung: Navigation, Einstellungen, manuelle Haltestellenwahl und Diagnose-JSON-Download erfolgreich. HTTP-Vorschau kann keine physische Android-GPS-Freigabe bestätigen; Node-Preview-Netzfehler sind separat vom produktiven Relay zu bewerten.
- Offen: physische Android-Freigabe/Bewegung, ÖBB-Daten, Wear-APK und QR-Hardwaretest. Kein gehosteter QR-Relay in diesem Release.

Produktionsabnahme 07.11.2026: öffentliche HTTPS-Diagnose mit aktivem Service Worker; echter Relay-Test HTTP 200, 1 Monitor / 1 Linie / 14 Abfahrten (Stephansplatz U1 → Leopoldau). Diagnose-JSON im öffentlichen Browser tatsächlich heruntergeladen und geprüft. Health-/Katalog-/Config-/Service-Worker-Endpunkte HTTP 200, Katalog 1.811 Gruppen. Maschinenlesbarer Nachweis: docs/validation-v0.1.2.json. Physische Android-GPS-Freigabe weiterhin auf dem Gerät prüfen.

Öffentlicher Browsercheck v0.1.3: Suche „Stephansplatz“, echte Verbindungen geladen (u. a. U1/U3 und Busse), U1 → Leopoldau und ganze Station gespeichert, Duplikatknöpfe deaktiviert. Live-Abfahrten sichtbar. U1-/U3-Farben als RGB 237/28/36 und 245/130/31 im Browser bestätigt. Stationsname öffnet Fußwegdialog; echte Route mit 702 m auf Karte gerendert. Prüfstart verwendete öffentliche Stationskoordinaten, keinen Nutzerstandort. Nachweis: docs/validation-v0.1.3.json.

Öffentliche Abnahme v0.1.4: HTTPS und aktiver Service Worker im Diagnose-UI bestätigt; neuer Relay-Test HTTP 200 mit 1 Monitor, 1 U1-Linie und 14 echten Abfahrten; Diagnose-JSON tatsächlich im Browser heruntergeladen und Format/Version geprüft. In der Nähe echte U1/U3-Abfahrten, U-Bahn-only, gespeicherte Favoriten und Standortkarte geprüft. Öffentliche Stationskoordinaten dienten als manueller Teststart, kein privater GPS-Standort.

Prüfung 0.5.1: 242 Web-/Server- und 118 native Tests bestanden. Neue Regressionen unterscheiden beide Karten-Favoritenaktionen und prüfen kombinierten QR-/Dateiimport über die Einstellungen. Öffentliche Browserabnahme erfolgreich: Standortkarte mit öffentlichem manuellem Floridsdorf-Testpunkt, Popup mit beiden getrennten Aktionen, vorausgewählte Haltestelle und aktuelle Linien/Richtungen, U6 Richtung Siebenhirten als einzelner Favorit gespeichert und nach Schließen zurück auf unverändert geöffnete Karte. Bestehende Favoriten erhalten, Speicherrückmeldung auf Karte sichtbar. Öffentliche Uhr-APK heruntergeladen und bytegleich zum signierten Build verifiziert: 3.731.884 Bytes, SHA-256 6843c2f93cbdf3799fe953dd5bd1909c68def222c127ce6d4520881276a2bc83.
