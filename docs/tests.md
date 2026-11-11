## PWA 0.11.8 · Karte bei geänderter Breite wieder anzeigen · 11.11.2026

404 Web-/Server-Tests, 18 Python-Prüfungen und 82 Syntaxprüfungen bestanden. Der bestehende Kartentest prüft zusätzlich, dass Größenabgleich die geografische Mitte erhält und nicht animiert; Datenupdates/Schemawechsel passen weiterhin nicht neu ein. Öffentliche 0.11.7-Browserprobe: echte 48A-Daten, Linie in Marker/Status/Schema, Auswahl gleicher interner ID beim Schema-/Kartenwechsel. Telefonbreite: 337 px Inhalt, Schema clientWidth=scrollWidth=281 px, Karte 283 px; kein horizontaler Überlauf. Sichtbare OSM-Kacheln, hervorgehobener Zielhalt und ganze Linie mit gleicher Variante bestätigt. Die dabei beobachtete Zentrierungsverschiebung nach Rückkehr auf Desktopbreite ist in 0.11.8 korrigiert. Keine physische Geräte-/Fahrtenabnahme.

## PWA 0.11.7 · eingebettete Karte und lesbare Kennungen · 11.11.2026

404 Web-/Server-Tests, 18 Python-Prüfungen und 82 JavaScript-Syntaxprüfungen bestanden. Sieben zusätzliche Regressionen: lesbare Linienkennungen ohne interne Präfixe, Zuschnitt auf echten Formpunkten/Stationsankern samt übersprungenen Halten, lazy Darstellung ohne zusätzliche Daten-/Monitoranforderung, Zustand bei Schließen/Öffnen, echte aufgezeichnete 48A-Daten mit unveränderter Tracker-ID/Auswahl beim Wechsel und Abwählen beim zweiten Tippen, Kartenrahmen ohne erneutes Einpassen bei Updates/Wechseln, spätes Kartenmodul nach Schließen/Hintergrund/Dispose sowie Kartenfehler mit Schema-Ausweichmöglichkeit. Alle 174 Shellpfade vorhanden; neues Kartenmodul bare/versioniert enthalten. PWA-/Feedversion 0.11.7 und unveränderte Wear-APK 0.7.4 gegen SHA-256 geprüft. Die lokale verwaltete Vorschau ist durch ein anderes Projekt belegt; öffentliche Browserabnahme erfolgt nach Veröffentlichung.

## PWA 0.11.6 · neues Konturlogo mit Lächeln · 11.11.2026

397 Web-/Server-Tests, 18 Python-Prüfungen und 81 JavaScript-Syntaxprüfungen bestanden. Bestehende Release-Testreferenzen und gemeinsame versionierte Modulimporte auf 0.11.6 angeglichen; keine neuen Tests für die reine Logoänderung. SVG/XML gültig; 192-/512-Pixel-Icons deckend, Alias- und Versionskopien bytegleich. Alle sichtbaren Logo-Pixel liegen im zentralen kreisförmigen Maskable-Sicherheitsbereich mit Radius 40 Prozent. Alle 172 Offline-Shell-Pfade vorhanden, neue Manifest-Icons ausdrücklich enthalten. Manifest-ID und Startadresse erhalten; unveränderte Wear-APK 0.7.4/26 gegen den bisherigen SHA-256 geprüft. Gerenderte SVG/PNG-Fassung betrachtet. Die verwaltete lokale Vorschau ist durch ein anderes Projekt belegt; öffentliche Browserabnahme nach Veröffentlichung. Kein sofortiges Android-Launcher-Update behaupten.

## PWA 0.11.5 · Adressfelder, Markengröße und öffentliche Erklärung · 11.11.2026

397 bestehende Web-/Server-Tests und 18 Python-Prüfungen bestanden. Visuelle Browserprüfung der tatsächlichen A-nach-B-Seite am Desktop und bei 337 px CSS-Breite: Start, Ziel und beide Suchbuttons jeweils exakt 48 px hoch; mobil je Eingabe 227 px plus 48 px Suchbutton, kein Seitenüberlauf. Desktop-Suchtext bleibt einzeilig. Monitor bei 337 px: bestehendes Logo 48 px, Schriftzug rund 25,2 px; 8 px freier Abstand zu den Aktionsbuttons, kein Überlauf.

Willkommen-Bereich mit klar als Beispiel gekennzeichnetem Stationsausschnitt, direktem Fahrzeuglink und FAQ-Link in Desktop-/Telefonansicht geprüft. Der FAQ-Link öffnet die entsprechende Erklärung im Städtevergleich. Wien-Einzelvergleich auf 337 px: Tabelle 303 px, Seite ohne Überlauf; Panorama vollständig geladen. Keine experimentelle Kennzeichnung mehr, geschätzte Genauigkeit/Wien-Abdeckung weiterhin erklärt. Drei neue Logoentwürfe nur zur separaten Bewertung; bestehende App-Marke bleibt erhalten. Keine zusätzlichen Tests für die Layout-/Textkorrekturen.

## PWA 0.11.4 · Kontrast grauer Stadtmarker · 11.11.2026

Bestehende 397 Web-/Server-Tests bestanden. Visuelle Browserprüfung einer lokalen Darstellungsprobe über echten OpenStreetMap-Kacheln: Zug, Tram und Bus, Zuordnungslücke und veralteter Stand, ungewählt und ausgewählt, jeweils in hellem und dunklem App-Farbschema. Tatsächliche Markergröße 36 × 36 px, volle Deckkraft, transparenter Außenrahmen, deckende graue Fläche rgb(75,85,99), Symbol rgb(249,250,251); berechneter Symbol-/Flächenkontrast 7,23:1. Die beiden App-Farbschemata ändern diesen Kartenkontrast nicht. Keine neuen Tests für die reine CSS-Korrektur; Modell-/Abrufverhalten unverändert. Die lokale QA-Seite wird weder veröffentlicht noch dem Quellpaket beigefügt.

## PWA 0.11.3 · Toggle, verlorene Marker und beide Tram-46-Richtungen · 11.11.2026

397 Web-/Server-Tests, 18 Python-Prüfungen, 82 JavaScript-Syntaxprüfungen. Neue Regressionen prüfen echtes Abwählen, Folgenende, Entfernen überholter gehaltener Lagen, ausbleibendes Entfernen bei Überlappung/Quellenausfall/einem einzelnen Anker und erneute Zwei-Quellen-Bestätigung. Alle 165 Pakete/617 Varianten bleiben quell-, kalender-, geometrie- und plattformgebunden. Importprüfung: vollständige reguläre Stationsfolge schlägt historische Umleitungsteilfolge, vollständiger Richtungskonflikt bleibt offen.

Neue minimale öffentliche Mitschnitte für Tram 46: H-Richtung 12:23:45/12:24:40 Wiener Zeit bestätigt Schätzlage trotz fehlender naher GTFS-Abfahrt; R-Richtung 12:39:09/12:40:06 bestätigt zwei Schätzlagen aus acht getrennten Rückrichtungs-RBLs. Keine Standort- oder offiziellen Fahrzeugidentitätsdaten. Frische GTFS-/CSV-Downloads am 11.11. stimmen per Digest mit der bestehenden Referenz überein. Die Fixture-Dateien enthalten nur die benötigten öffentlichen Monitorfelder; Rohproben sind kein Releasebestandteil.

Visuelle Erstprüfung der Fahrzeugseite im verwalteten Browser bei Desktop- und 337 px CSS-Breite: beide Richtungen sichtbar, redundante Einzelvariante und gequetschte Ansichtsschalter erkannt. Daraufhin Layout, Platznutzung und Auswahlstatus optimiert. Vorschau-Refresh beim Worker-Neubau durch Browser-URL-Richtlinie blockiert; weitere veröffentlichte Sichtprüfung separat. Physische Fahrten-/Android-Abnahme bleibt offen.

## PWA 0.11.2 · stabile und bildschirmbreite Stationsansicht · 11.11.2026

386 Web-/Server-Tests einschließlich zweier zusätzlicher Regressionen gegen Remount/Fokuswechsel im tatsächlichen Stations- und A-nach-B-Renderer. Horizontale Bewegung bleibt relativ und nutzt dieselbe Skala wie die Halte. Browser: acht vollständige Halte bei 337 px CSS-Breite per Zoom, Diagramm-clientWidth und scrollWidth beide 281 px, Seite jeweils 337 px; offener Bereich, gewählte Richtung und Fokus bleiben über Routineupdates erhalten. Helle und dunkle Palette kontrolliert. Dies ersetzt keine physische Android-Abnahme.

## PWA 0.11.1 · Benennung und Stationslebenszyklus · 11.11.2026

384 Web-/Server-Tests, 15 Python-Prüfungen und 79 JavaScript-Syntaxprüfungen. Zwei zusätzliche Lebenszyklusfälle prüfen Schließen während des Katalogabrufs und Hintergrund/erneutes Öffnen während eines Paketabrufs. Name, horizontaler Ausschnitt und direkter Karten-/Stations-Einstieg in der verwalteten Vorschau geprüft; 337 px CSS-Breite per Browser-Zoom ohne Seitenüberlauf. Physische Fahrtenabnahme bleibt separat. Nach dem abschließenden Worker-Neubau blockierte die Browser-URL-Richtlinie weitere Vorschauaufrufe; A-nach-B-Ende-zu-Ende-Abnahme daher offen.

## PWA 0.11.0 · weitere Linien und Fahrzeuge im Anflug · 11.11.2026

Rollout auf 165 Wiener Linien und 616 eindeutig zugeordnete Varianten: 5 U-Bahn, 30 Tram, 130 Bus. Auswahl in echter Karte und Schema, mit expliziten begrenzten Abschnitten für lange Linien. Horizontale Stationsausschnitte in Verbindungs-/Stationsdetails und A-nach-B-Einstiegsdetails, bis zu fünf Halte davor und zwei danach, gewählte Station hervorgehoben. Anfangs geschlossen; Nachbar-RBLs teilen die bestehende Abfrage statt eines eigenen Pollers. Passende Zug-/Tram-/Bus-Symbole und temporäre IDs.

U-Bahn behält den begrenzten GTFS-Sollslotabgleich. Bus/Tram benötigen drei eindeutig zusammenpassende Live-Sollanker und zwei Quellenstände; GTFS dient als Fahrzeitprofil, nicht als nächster Zug. Wiederaufnahme über gemeinsame echte Stations-/Sollzeit-Schlüssel, konkurrierende Folgen und enge mehrdeutige Takte bleiben offen. Versionierte öffentliche RBL-Referenz und Gzip-Pakete ermöglichen Reproduktion; acht unklare Linien bleiben ausgeschlossen. Wear 0.7.4/26 unverändert.

384 Web-/Server-Tests, 15 Python-Prüfungen, 79 JavaScript-Syntaxprüfungen. Alle veröffentlichten Datenpakete, horizontale Darstellung, Lebenszyklus, Stations- und A-nach-B-Abrufgrenzen geprüft. Zusätzliche Regressionen stoppen nachträgliche Paketabrufe geschlossener Bereiche und verwerfen Antworten im Hintergrund; Rückkehr lädt den Bereich erneut. Fünf neue reale U3-/49-/48A-Proben bestätigen fortschreitende Schätzlagen und stabile IDs; U3 mit fünf modellbasierten Stationsübergaben. Kein Nachweis physischer Wagenidentität. Verwaltete Vorschau wieder erreichbar: Name, U6-Stationswahl, Schema und direkter Karten-/Stations-Einstieg geprüft; bei 337 px CSS-Breite kein Seitenüberlauf. Vorübergehender Relayfehler wird ohne erfundene Marker behandelt. Physische Fahrtenabnahme bleibt separat. [Datenmodell und Grenzen](vehicle-pilot.md).

## PWA 0.10.2 · kompakter Footer · 11.11.2026

Monitor-Footer trennt Metadaten und gemeinsame Linknavigation. Lizenzen stehen bei den übrigen Links; alleinstehender Trennpunkt und zusätzliche Abstände zwischen umgebrochenen Linkzeilen entfallen. 44-px-Tippflächen bleiben erhalten. Installierte Monitor-PWA nutzt unten nur 20 px plus Safe Area; Browser-Editor-Abstand und andere Seiten behalten ihre bisherigen Regeln. Wear 0.7.4/26 unverändert.

Bestehende 361 Web-/Server-Tests, zwölf Python-Prüfungen und 77 JavaScript-Syntaxprüfungen; keine zusätzlichen Tests für die reine Layoutkorrektur. Browser-Abnahme wegen der bestehenden URL-Richtliniensperre weiterhin offen.

## PWA 0.10.1 · ganze U6, Kontinuität und Symbole · 11.11.2026

Ganzlinienpilot Floridsdorf–Siebenhirten, 24 Stationen je Richtung und 23 verifizierte Abfahrts-RBLs pro gemeinsam begrenztem Request. Scrollbares Schema mit 100 px Stationsabstand und Fahrt folgen in beiden Ansichten. Zug-SVG und temporäre ID in Karte, Schema und Liste; Bus-/Tram-Symbole für spätere Modusanbindung. Kurze Lücken und Korrekturen halten die letzte Lage grau unter gleicher ID; eindeutige andere Zuordnungen laufen weiter. Nach 90 Sekunden ohne aktuelle Ableitung weiterhin ausdrücklich ausblenden. Tatsächlich ausgelassene Halte/Kurzführungen erhalten, letzte Endstationsanfahrt unsicher aus Sollzeit schätzen. Komprimiertes Format-2-Paket mit Quellen-/Kalenderbindung.

361 Web-/Server-Tests, darunter 23 Fahrzeugregressionen, zwölf Python-Prüfungen und 77 JavaScript-Syntaxprüfungen. Sieben neue Ganzlinien-Mitschnitte: acht bis neun südliche und elf nördliche Schätzlagen nach zwei Quellenständen; drei gehaltene IDs später wieder aufgenommen, neun südliche modellbasierte Übergaben. Lücke/Ablauf, lokale Mehrdeutigkeit, ausgelassene Halte, echte Streckenentfernung, Kurzführung/Endstation und 23-RBL-Einzelrequest geprüft. Browser-URL-Richtlinie blockiert Vorschau; keine visuelle/physische Abnahme behaupten. Wear 0.7.4/26 unverändert. [Datenmodell und Grenzen](vehicle-pilot.md).

## PWA 0.10.0 · U6-Pilot · 11.11.2026

354 Web-/Server-Tests (16 Pilotregressionen), zwölf Python-Prüfungen und 77 JavaScript-Syntaxprüfungen. Echte fünf U6-Snapshots: temporäre ID über zwei südliche Stationsübergaben, interpolierte Lage und nördliche Korrekturpause geprüft. Quelle/Kalender, falsche Seite, Doppelzuordnung, stale/fehlende Daten, Abruflimits, Pause und späte Antworten geprüft. Beide Darstellungen teilen denselben Modellfortschritt. Browser-Vorschau nach Infrastruktur-Reparatur durch URL-Richtlinie blockiert; keine visuelle oder physische Abnahme behaupten. [Pilotvertrag](vehicle-pilot.md). Wear 0.7.4/26 unverändert.

## Wear 0.7.4 · Update-Ablauf · 11.11.2026

159 native Android-Tests, 338 Web-/Server-Tests, zwölf Python-Prüfungen und 74 JavaScript-Syntaxprüfungen bestanden. Neuerungen: tatsächliche Update-Dialogfenster und App wach, Download/Staging ohne frühe Dialogfreigabe und ohne UI-Thread-Kopie, kurze sichtbare Pause ohne Updateabbruch bei weiterhin pausiertem GPS/Monitor, echte Stop-/Display-Aus-/Abbruchpfade, Hashfehler, fünf Minuten Timeout und bewusste Wiederholung. Fehlender Installer wird abgefangen; Sitzungsergebnisse sind exakt zugeordnet, verspätete fremde IDs werden ignoriert. Abgebrochene/fehlgeschlagene Staging-Sitzungen sowie die Resultatübergabe an die sichtbare Activity geprüft. Originalsignatur/-paket, Version 0.7.4/26 und zipalign bestätigt. APK 3842666 Bytes; SHA-256 `1f31df225182e95b6c46979c09b8b180f12a8df0abb44aac10ce6550dcaa833a`. Physische OnePlus-/OEM-Abnahme bleibt separat. Der Wechsel auf 0.7.4 selbst läuft noch mit dem vorherigen Updater.

## Wear 0.7.3 · Stadttitel und Filterabstand · 10.11.2026

150 Android- und 338 Web-/Server-Tests erfolgreich. Titel für alle vier manuell gewählten Städte und alle drei Hauptziele, Menü-Rückkehr sowie automatische Erkennung/Ablauf ohne Neubau der Titelsicht oder Rücksetzen des Abrufbudgets geprüft. Native Rundprüfung für Routen/Stationen bei 227 dp sowie 192 dp mit 1,3-facher Schrift: vollständiger Stadttitel, enger sichtbarer Filterabstand, getrennte mindestens 48-dp-Zeilen, Stationsaktionen nach dem vollständigen Filterziel und getrennt erreichbarer Akku-Sparbutton. Unveränderte Views vor Native-Canvas-Aufnahmen invalidieren; die vier betroffenen Favoriten-UI-Tests nach dieser Renderhelferänderung erneut erfolgreich geprüft. Auswahlpersistenz, Speicher, Import, Hintergrund-/Abbruch-/Abrufregeln und erste Abfahrtszahl weiterhin erfolgreich. Signatur, Paket/Version, D8 und zipalign geprüft. [Metadaten](wear-os-release-0.7.3.md); keine physische Geräteabnahme.

## Wear 0.7.2 · kompakte Auswahl und Rundkappe · 10.11.2026

147 Android- und 338 Web-/Server-Tests erfolgreich. Bestehende native Runddarstellung um echte Textlayout- und Glyphenprüfungen erweitert: foama-wien innerhalb des runden Displays, oberhalb der Navigationsicons, beide Segmentbeschriftungen vollständig und mindestens 48 × 48 dp große Tippflächen. Beide Favoritenbereiche bei 227 dp und 192 dp mit 1,3-facher Schrift gerendert und visuell geprüft. Erste Abfahrtszahl auf kleinem Runddisplay sowie Persistenz/Wechsel/Import/Navigation und bisherige Hintergrund-/Abrufregeln weiterhin erfolgreich. Java, D8, Paket-/Version, Originalsignatur und zipalign geprüft. [Signierte Metadaten](wear-os-release-0.7.2.md); physische OnePlus-Abnahme separat.

## PWA 0.9.5 · finale Hover- und Eingabetastenprüfung · 10.11.2026

338 Web-/Server-Tests bestanden, einschließlich zusätzlicher Enter-/keyCode-13-/Fremdtastenfälle in der Stationsereignisregression. Zwölf Python-Tests bestanden bereits für dieselben unveränderten Import-/Buildhelfer. Öffentliche Mausabnahme der vorangehenden Korrektur bestätigt Thaliastraße mit richtigem Hover und Popup sowie Gumpendorfer Straße → Längenfeldgasse unter derselben überlappenden Trefferfläche. Enter-Handler nach dem Browserbefund ergänzt; finale öffentliche Abnahme separat.

## PWA 0.9.4 · Stationsnamen beim Hover · 10.11.2026

338 Web-/Server-Tests, zwölf Python-Tests und 74 JavaScript-Syntaxprüfungen bestanden. Neue Ereignisregression: überlappende 44-px-Treffflächen liefern beim Darüberfahren und Klicken denselben nächsten Stationspunkt; Bewegung innerhalb derselben Trefferfläche aktualisiert den Namen. Tastaturaktivierung wählt weiterhin den fokussierten Marker, Verlassen entfernt den Hover-Hinweis. Bestehende Karten-/Fahrplan-/Offline-Prüfungen bestanden. Die lokale verwaltete Vorschau ist durch ein anderes Projekt belegt; visuelle Abnahme erfolgt separat auf der veröffentlichten Version. Keine physische Smartphone-Abnahme.

## PWA 0.9.3 · Monitor-Verlinkung und Datenfußnote · 10.11.2026

337 Web-/Server-Tests, zwölf Python-Tests und 74 Syntaxprüfungen bestanden. Neue Tests: exakte Station/RBL-Verfügbarkeit, keine Monitorlinks für unbekannte oder reine Fahrplanhalte, URL-Rundlauf mit Linie/Modus/Unicode-Richtung, keine zusätzliche Navigationsebene beim initialen Direktlink und Zurück im alleinstehenden Tab. Bestehende Abruf-/Budget-/Favoritenregressionen bestanden.

Lokaler Browser: Thaliastraße/U6 öffnet aus dem Popup die Richtung Siebenhirten; der separate Link unter der Karte führt zur identischen Verbindung, Fahrplan/PDF bleibt eindeutig beschriftet. Einmal Zurück kehrt zur ursprünglichen Karte samt Stationsmarkierung zurück. Meidling/U6-Fahrplan: Datenstand als zunächst geschlossene Fußnote nach der Tabelle, alle Quellen-/Prüfungsfelder nach Aufklappen vorhanden. Keine physische Smartphone-Abnahme.

## PWA 0.9.2 · Karten-PDF und Stationskontext · 10.11.2026

333 Web-/Server-Tests, zwölf Python-Tests und 74 JavaScript-Syntaxprüfungen bestanden. PDF-Tests prüfen Datum/Richtung/Stationsidentität, beide Richtungen und abweichende Tage, Projektion und begrenzte Kachelanfragen, Offline-Fallback, Abbruch während laufender Abrufe, gemeinsame Bildressource, Quellenlinks und bytegenaue Xref-Offsets sowie lange Stationslisten über mehrere Seiten. Browser erzeugt echte U6-Exporte: Thaliastraße/Floridsdorf vier Seiten einschließlich drei Variantenkarten, ganze U6 55 Seiten einschließlich neun Karten, unter einem MB. Poppler-Renderkontrolle von erster Karte, letzter Variante und Stundentabelle; Markierung, Attribution, Links und volle Namen geprüft. Keine physische Smartphone-Abnahme.

Stationslink aus Thaliastraße/U6/Alle Richtungen öffnet genau Thaliastraße, zeigt passendes Popup und genau einen gedrückten Marker. Verbindungsaktionen bei 320/360/420-px-Rahmen (Client 305/345/405) ohne horizontalen Überlauf; Stern 44 px, zwei gleich breite Planungslinks mit mindestens 52 px Höhe. Temporäre Prüfseiten vor Veröffentlichung entfernen.

## PWA 0.9.1 · A-nach-B-Seitenstruktur · 10.11.2026

326 Web-/Server- und zwölf Python-Tests bestanden. Browserabnahme: Titel vor Hauptnavigation, danach Routenauswahl/Formular; Meine Routen einschließlich Leerzustand erreichbar. Helles und dunkles Farbschema in temporären 320/360/420-px-Rahmen geprüft (Clientbreiten 305/345/405 px): scrollWidth jeweils gleich clientWidth. Voller App-Name und Routenanzahl auch am schmalsten Rahmen lesbar, Hauptnavigation in einer Zeile. Temporäre Prüfseite vor dem Paketbau entfernt. Keine physische Smartphone-Abnahme.

Linienkarte mit echter U1: Gesamtansicht mit 24 kleinen Haltepunkten und 44-px-Treffflächen, Nummern beim Heranzoomen ab Stufe 16 (26 px / 12-px-Schrift), beim Herauszoomen wieder Punkte. Stephansplatz aus Stationsliste und als kleiner Kartenpunkt korrekt gewählt; Popup und Fahrplanlink erhalten. Daten-/Offline-Hinweise aufklappbar und nach Neuladen wieder geschlossen. 17 gezielte Karten-/Fahrplan-/Offline-Shell-Tests nach der Ergänzung bestanden. OpenStreetMap-Kacheln im Browser tatsächlich geladen.

## PWA 0.9.0 · geografische Linienkarte und PDF · 10.11.2026

326 Web-/Server-Tests, zwölf Python-Tests und 73 JavaScript-Syntaxprüfungen nach CI-Auswahl bestanden. Importprüfungen: unsortierte Stopzeilen, kalendergleiche Shapes zusammenführen, echte Kurzführung anhand Streckenentfernung zuschneiden, identische Liniennummer in Bus/Tram getrennt und falsche Kalender/Quellen ablehnen. Alle 173 ausgelieferten Linien und 965 Varianten gegen Hash, Kalender, Koordinaten, geordnete Halte und dekodierbare echte Geometrie geprüft. Offizielle 98.436.733-Byte-GTFS-Datei bytegleich zum vorhandenen Fahrplan (SHA c3e98ec9381a0f610a3164d0336ea93c097b0382aa81fbabb6c739becc25412f).

PDF: echte A4-Struktur, bytegenaue PDF-Querverweise, Umlaute/volle Namen, Auswahl nach Richtung/Datum, ganze Linie, unvollständige Pakete, ungültige Tage, MEZ/MESZ-Doppelstunde, Pagination und Wiener Dateinamen. Echte U1-Ausgaben mit Poppler gerendert und geprüft; Tagesauswahl Stephansplatz/Leopoldau eine Seite, gesamte U1 67 Seiten. Monospaced PDF-Standardschriften für unveränderte Zeichenabstände; keine zusätzliche Bibliothek oder externen PDF-Dienste.

Lokaler Browser: echte OpenStreetMap-Kacheln geladen, U1-Richtungswechsel, Kurzführung ab Alaudagasse (22 Halte), Station aus geordneter Liste zum passenden Tagesfahrplan, beide echten PDF-Downloads erhalten. In der Gesamtansicht überlappende Marker lösten zunächst den Nachbarhalt aus; Zeigerabstandsauflösung samt Regression ergänzt und richtigen Leopoldau-Halt geprüft. Einzelne eigene Popups vermeiden die kurzzeitige Nachbaranzeige. 1348-px-Seitenbreite ohne Überlauf. Cachetests prüfen kalten Offline-Neustart, fehlende/alte Pakete, Speicherfehler und Abbruch; SW-Prüfung umfasst Karten-HTML/Module und Navigation zur eigenen Offline-Seite. Keine physische Smartphone-/Watch-Abnahme und keine implementierte Fahrzeugschätzung in diesem Release.

## PWA 0.8.3 · Willkommen · 10.11.2026

315 Web-/Server- und zehn Python-Tests erfolgreich; 72 JavaScript-Dateien auf Syntax geprüft. Bestehende echte Worker-/Offline-Shell-Prüfungen um willkommen.html erweitert; feste öffentliche Einladungsadresse geprüft, private aktuelle URLs bleiben ausgeschlossen. Manifest-ID/start_url/scope unverändert. Die aktuelle öffentliche Wear-0.7.1-APK wurde per freigegebener Größe/SHA-256 bytegleich wiederhergestellt; kein neuer nativer Build.

Lokaler Browser: Begrüßung über App-Footer geöffnet; App-CTA zurück zum Monitor, Installationsanker und FAQ-Aufklappen geprüft. Jeweils vier Funktionskarten und fünf FAQ, vollständig geladene 1920-px-Städtecollage, Hell/Dunkel und kein seitlicher Überlauf bei 1348 px geprüft. Kein physischer Smartphone-Installationsnachweis. Dekorative Pfeile als lokale SVG statt Schriftzeichen.

## Wear 0.7.1 · Stadtfilter, Hauptnavigation und Abfrageplanung · 10.11.2026

147 Android-Tests, 315 Web-/Server-Tests, zehn Python-Tests und 69 JavaScript-Syntaxprüfungen bestanden. Neue Fälle: beide Routenlisten und Monitorziele nach Stadt filtern; Gesamtspeicher und Neustart erhalten; ehrliche leere Graz-Ansicht bei nur Wiener Routen; Familien mit Alternativen und feste Endpunkte ohne Zuordnung aus Namen/GPS; Hauptnavigation mit aktivem Tab und Rückkehr nach Stadtwechsel; Runddisplays 227 dp und 192 dp mit 1,3-facher Schrift. Ein doppelter Gehzeit-Hinweis und die redundante A-nach-B-Überschrift entfallen.

Abfrageprüfungen: genau am gemeinsamen Freigabetermin fortsetzen, fällige Abfrage nach Einstellungen sofort starten, keine Abfragen in Einstellungen/nach Pause, getrennte und beim Zurückwechseln erhaltene Stadt-Fehlerpausen bei weiter gemeinsamem 30-s-Mindestabstand. Bestehende Ultra-Spar-/Sichtbarkeits-/Transfer-/Abbruchtests bestehen weiter; expliziter App-User-Agent ohne Gerätekennung geprüft.

Öffentliche Einzelproben gegen reale Katalogstationen: Graz Hauptplatz/Congress und Linz/Donau Hauptplatz je 64 Live-Abfahrten, Salzburg Pauernfeindstraße 64 Fahrplanabfahrten, HTTP 200 und jeweils rund sieben Sekunden aus der Buildumgebung. Diese Messung ist weder eine Watch-Laufzeit noch eine Garantie für alle Stationen. Paket-/Signaturdaten: [Release-Protokoll](wear-os-release-0.7.1.md). Physische OnePlus-Abnahme bleibt separat.

## PWA 0.8.2 · 10.11.2026

315 Web-/Server-Tests, zehn Python-Prüfungen und 71 JavaScript-Syntaxprüfungen erfolgreich. Vorhandene Offline-Shell-Abnahme schließt das neue lokale WebP-Titelbild ein. Bannerentfernung, Salzburg-Erläuterung im vorhandenen FAQ, alle 52 Verfügbarkeitssymbole und echte Bildabmessungen 1920 × 819 geprüft. Das 472.402-Byte-WebP zeigt die komplette Collage proportional; keine zusätzliche native APK oder Geräteprüfung.

Die öffentliche Abnahme von 0.8.1 hat nach erfolgreicher Veröffentlichung die U1-Heute-Auswahl und aktuelle Stunde sowie 36 grüne Haken, 16 rote Kreuze, fünf zunächst geschlossene FAQ und das automatische Öffnen der Barrierefreiheitsantwort bestätigt. Helle Adressfarben erreichen 12,29:1 (Adresse/Quelle) und 4,90:1 (Hinweis), dunkle 12,17:1 bzw. 6,53:1.

## PWA 0.8.1 · 10.11.2026

315 Web-/Server-, zehn Python- und 71 JavaScript-Syntaxprüfungen erfolgreich. Neue Datumsregressionen prüfen Heute in Wiener Zeit vor/nach Mitternacht, zukünftige Gültigkeit, abgelaufene Pakete und die getrennten Herbst-Doppelstunden. Andere Tage erhalten keinen aktuellen Stundenmarker. Die bestehenden Offline-Shell-/Fahrplanprüfungen bestehen unverändert.

Lokale Browserabnahme mit dem echten U1-Fahrplan: Heute zuerst/ausgewählt, aktuelle Stunde mit Jetzt, Wechsel auf morgen ohne Stundenmarkierung und zurück. Fußwegdialog an der bewusst manuell gewählten öffentlichen Station Thaliastraße U: im Hellmodus lesbare Adresse mit 14 px und Hinweis mit 12 px; Kontrast 12,29:1 für Haupttext und 4,90:1 für Hinweise. Quellenlink verwendet ebenfalls die Haupttextfarbe. Keine privaten Standortdaten für diese Abnahme. Nach dem FAQ-Build brach die Vorschauverbindung ab; der Browser sperrte die Beobachtung der Fehlerseite. Öffentliche Abnahme nach Veröffentlichung bleibt ein eigener Schritt.

Unveränderte Wear-0.7.0-APK mit exakter freigegebener Größe/SHA-256 wiederhergestellt; kein neuer nativer Build oder physischer Gerätetest.

## PWA 0.8.0 / Wear 0.7.0 · 10.11.2026

313 Web-/Server-Tests, zehn Python-Prüfungen und 138 native Android-Tests erfolgreich. Neue Fälle: vollständige Kalendertage, Nachtfahrten, DST-Doppelstunden/Lücke, Kalendergrenzen, exakte Linien-/Modus-/Stationsfilter, versionsgebundener Linienindex, kalter Offline-Zugriff, fehlgeschlagene Speicherung und Sichtbarkeit aller drei regionalen Stationen. Offline-Shell umfasst Städteübersicht und Fahrplanseite. Native Fälle: Stadtalter/Genauigkeit, manuelle echte Position/öffentliche Mitte, regionale Parser und Cache, Salzburg, gleichnamige Modi, begrenzte sichtbare Abfragen, QR-/Routenkennungen und Menü-Rückweg. Alle bestehenden Lifecycle-/Transfer-/Runddisplay-Prüfungen bestanden.

Wear-APK 0.7.0/22 mit ursprünglichem Zertifikat signiert und per apksigner, zipalign, Paket-/Versionsmetadaten geprüft; 3.838.570 Bytes, SHA-256 c445582a8a2ed5ddd4559cbec3c0cb5a1eac09318276bea2e239c94b3f88efac. Physische OnePlus-Abnahme ist kein Ergebnis dieser Tests. Verwaltete Browser-Vorschau versucht; Browser-URL-Richtlinie sperrte die Beobachtung. Keine erfolgreiche visuelle PWA-Abnahme behaupten.

Offizielle GTFS-Quelle vollständig mit 98.436.733 Bytes geladen und mit dem Import verglichen: SHA-256 identisch. Server Last-Modified 09.11.2026 05:09:41 UTC, Prüfzeit 10.11.2026 08:47 UTC. Kein bestätigtes Veröffentlichungsdatum.

## PWA 0.7.7 · Städteübersicht · 10.11.2026

306 Web-/Server-Tests und zehn Python-Prüfungen erfolgreich. Die vorhandene Offline-Shell-Prüfung umfasst die neue Städteübersicht. Die verwaltete Browser-Vorschau wurde versucht, die Beobachtung jedoch von der Browser-URL-Richtlinie gesperrt; deshalb keine erfolgreiche visuelle oder physische Abnahme behaupten.

## PWA 0.7.6 · Einstellungen nach Zweck gegliedert · 10.11.2026

Auf Nutzerfeedback sind tägliche Einstellungen und technische Werkzeuge sichtbar getrennt. Deine App: Darstellung, Stadtprofil, Standort & Gehzeit, Störungshinweise und Favoriten & Uhr. Technik & Diagnose: App & Installation, Fahrplandaten importieren, Debug Push und Debugging. Stadt und Farbschema sind unabhängige Einträge; sie haben keinen gemeinsamen Aufklappbereich mehr. Neun dezente Karten mit einheitlichen Vektorsymbolen, ruhigen Hintergründen und besser getrennten Abständen ersetzen die flache Liste. Technische Symbole sind zurückhaltend, Alltagssymbole mint. Alle bisherigen Optionen, IDs, Hilfen und Speicherformate bleiben erhalten. Push und native Wear 0.6.1/21 unverändert.

306 Web-/Server-Tests bestanden. Lokale Browserabnahme mit echten App-Frames bei 320, 360 und 420 px: neun getrennte Themen unter den beiden Überschriften, kein horizontaler Überlauf. Alle Themen bei 320 px geöffnet und geschlossen, ebenfalls ohne Überlauf. Dunkel/Hell per tatsächlichem Farbschema-Schalter geprüft. Bestehende IDs und sämtliche Eingaben/Buttons/Links/Ausgaben gegen 0.7.5 verglichen und unverändert vorhanden. Keine Änderungen an Push, GPS oder Datenformaten. Temporäre Layoutseite vor Veröffentlichung entfernt.

## PWA 0.7.5 · kompakte Einstellungen · 10.11.2026

Einstellungen zeigen acht anfangs geschlossene Themenbereiche: Darstellung & Stadt, Standort & Gehzeit, Störungsbenachrichtigungen, Favoriten & Uhr, App & Installation, Fahrplandaten importieren, Debug Push und Debugging. Ausführliche Erklärungen sind bei der jeweiligen Option aufklappbar. Der Dialogkopf mit Version und 44-px-Schließen bleibt beim Scrollen sichtbar. Alle bisherigen Eingaben, Aktionen, Links, Statusfelder und Erklärungstexte sind erhalten; keine Speicher-/Berechtigungsänderung. Stadtwahl bleibt ausschließlich in Einstellungen.

Debug Push ist direkt erreichbar und bündelt Testnachricht, Zustellstatus, letzten Dienstlauf und lokalen Anzeigetest. Der bestätigte Worker-Auftrag und die getrennten App-/Komponentenupdatehinweise aus 0.7.4 bleiben erhalten. Die physische lokale Benachrichtigungsanzeige am Zieltelefon muss weiter geprüft werden. Native Wear 0.6.1/21 und sämtliche Gerätefreigaben bleiben unverändert.

306 Web-/Server- und zehn Python-Prüfungen sowie 67 JavaScript-Syntaxprüfungen bestanden. Vollständigkeit gegen den vorherigen Dialog geprüft: alle 46 vorhandenen IDs und alle bisherigen Eingaben, Buttons, Links und Ausgaben erhalten. Lokale Browserabnahme: acht geschlossene Themen, 64-px-Aufklappzeilen, 44-px-Schließen, 602-px-Dialog und kein horizontaler Überlauf am Desktop. Die nach dem Rebuild unterbrochene lokale Vorschau verhinderte die zusätzliche Handybreitenprüfung; keine daraus behauptete mobile Geräteabnahme.

## PWA 0.7.4 · lokaler Anzeigetest und eindeutige Updatehinweise · 10.11.2026

Der Nutzer bestätigt den Empfang der echten Push-Testnachricht. Die lokale Probe läuft nun als bestätigter MessageChannel-Auftrag im aktiven Worker mit waitUntil statt als bloßer Anzeigeaufruf aus der Seite. Sie prüft vorhandene Freigabe und Browser-Auflistung, ersetzt nur ihre eigene vorige Testanzeige und meldet fehlende Unterstützung, Ablehnung oder ausbleibende Bestätigung im Debug-Bereich. Kein Transport, keine neue Freigabe, keine Änderung echter Störungsanzeigen; lautlos, Benachrichtigungsleiste beachten. Physische Anzeige der überarbeiteten lokalen Probe bleibt am Zieltelefon zu prüfen.

Ursache des scheinbar unveränderten Updates: Navigation lädt bereits neue Seiten aus dem Netz, während ein neuer Offline-/Push-Worker noch wartet. Ohne nachgewiesene neuere App-Version heißt der Hinweis deshalb Offline-/Push-Komponenten aktualisieren und nennt die laufende App-Version. Ein neues App-Release zeigt Ziel- und aktuelle Version; Worker-Ereignisse überschreiben diese Angabe nicht. Bewusste Aktualisierung bleibt erforderlich. 306 Web-/Server-Tests, zehn Python-Tests und 67 JavaScript-Syntaxprüfungen. Native Wear 0.6.1/21 unverändert.

Abschließender GitHub-Lauf: Ein vorhandener Verschlüsselungstest suchte die kurze Zeichenfolge U6 im zufälligen Base64url-Chiffrat und schlug zufällig an. Die Prüfung entschlüsselt nun den gespeicherten Auftrag mit erwarteten Hashes und verwirft eine falsche Ereigniszuordnung. Kein Produktcode, keine Schlüssel oder Datenformate geändert.

## PWA 0.7.3 · automatische Ortung nach manueller Stadtwahl · 09.11.2026

Rückkehr von einem manuell gesetzten Stadtzentrum zu Automatisch prüft die vorhandene Standortberechtigung erneut und startet bei bereits erteilter Freigabe wieder die Vordergrundortung. Es wird keine neue Freigabe angefordert. Eine noch laufende Berechtigungsprüfung darf einen späteren ausdrücklichen Stopp nicht aufheben. Schnelle manuelle Profilwechsel verwerfen überholte Katalogantworten, bevor diese die Position verändern. Vier Regressionen ergänzen insgesamt 301 Web-/Server-Tests; zehn Python-Prüfungen und 67 JavaScript-Syntaxprüfungen. Native 0.6.1/21 unverändert.

## PWA 0.7.2 · abschließender Stand

297 Web-/Server- und zehn Python-Prüfungen; 67 JavaScript-Dateien syntaktisch geprüft. Neue Regression: echte unterschiedliche Modi mit gleicher numerischer Linie und gleichem Ziel werden separat gruppiert/ausgewählt; bekannte Favoritenmodi bleiben verbindlich. Öffentliche 0.7.1-Abnahme: Salzburg Hbf liefert 49 Fahrplanabfahrten ohne LIVE-Angabe; Eltern-/Bahnsteigkorrektur im echten Worker bestätigt. Bewusster Jetzt-aktualisieren-Schritt im öffentlichen Browser ausgelöst. Bereits dokumentierte Linzer/Grazer Echtzeitproben und unveränderte Wear-APK bleiben gültig. Physische GPS-Städtefahrt und Telefon-Push weiter separat; kein Anbieterannahme-/showNotification-Signal als Lesebeweis.

## PWA 0.7.1 · Produktionskorrekturen

Zusätzliche Regressionen sichern sofortiges Leeren alter Stadtkarten/Zeitstempel, konkurrierende Katalogantworten und unveränderte Favoriten; echte eigene Salzburger Bahnsteige mit weiterhin ausgeschlossenen fremden IFOPT-Stationen; morgige regionale Fahrpläne färben Linien nicht als unmittelbar aktuell ein. EFA-Zielplatzhalter werden verworfen. 0.7.0 wurde öffentlich mit echten Linzer EFA-Live-Abfahrten und Grazer Live-/Fahrplanabfahrten geprüft; der dabei nachgewiesene leere reine Salzburger Elternpunktabruf ist korrigiert. 0.7.0-GitHub-CI erfolgreich, alle 369 Dateien byte-/modusgleich abgeglichen. 296 Web-/Server- und zehn Python-Prüfungen bestanden; geänderte JavaScript-Quellen syntaktisch geprüft. Physische GPS-Städtefahrt und Telefon-Push bleiben gesondert.

## PWA 0.7.0 · Fahrplan und Stadtprofile · 09.11.2026

293 Web-/Server- und zehn Python-Prüfungen bestanden; 67 JavaScript-Dateien syntaktisch geprüft. Neue Fälle: Kalenderausnahmen, Zeiten über 24 Uhr, Vortag, abgelaufene/future Pakete, Sommerzeit-Servicebeginn, kalendergebundener Offline-Kaltstart, echte Westbahnhof-Daten ohne erfundene RBLs; Import ohne reine Ausstiege/Rufpflicht und letzte Station. Automatischer Stadtkontext mit Wien als Default, genauer/zu alter/unsichtbarer/manueller Position, Randhysterese und manueller Priorität. Regionale Katalogidentitäten und Routenfavoriten bleiben erhalten. Reale datierte öffentliche Graz-/Linz-/Salzburg-Fixtures, Ausfälle, echte Soll-/Ist-Unterscheidung, Salzburger Fahrplanmodus, feste Relayziele, gemeinsam budgetierte Zusatzanfragen sowie Zusammenführen/30-s-Cache ohne Zeitstempelverlängerung.

Push-Prüfungen ergänzen lokal persistierte Empfangskategorien, hohe Transport-Dringlichkeit für explizite Tests und die getrennte lokale Anzeigetestaktion ohne Backendabruf. Debugausgabe bleibt im aufklappbaren Debug-Push-Bereich. Produktiver Nutzer-Test angenommen, keine Geräte-/Anzeigebestätigung; keine daraus behauptete physische Zustellung oder bewiesene Android-Ursache. Server-/Browserstatus bleiben getrennt. Native 0.6.1/21-APK bytegleich: SHA-256 bbf73cd515ba01fbf6d709ed6b8f9f166de77984640f3dccffde1f6607e6ff59.

Erste lokale Browserabnahme: manueller öffentlicher Westbahnhof-Start zeigt echte FAHRPLAN-Abfahrten trotz fehlender erfolgreicher Live-Antwort und initial geschlossenen Debug-Push-Bereich. Nachfolgende Vorschau wurde beim Browserzugriff durch eine URL-/Frame-Richtlinie blockiert; keine Umgehung. Diese erste Abnahme liegt vor der Endstationsbereinigung; die finale Bereinigung ist durch Import-/Datenprüfungen abgesichert. Keine physische GPS-/Städtefahrt oder Telefon-Push-Anzeige aus Unit-Tests ableiten. Produktionsabnahme separat ergänzen.

## PWA 0.6.7 · Störungs-Push · 09.11.2026

277 Web-/Server- und acht Python-Tests erfolgreich; 64 JavaScript-Dateien syntaktisch geprüft. Neue Prüfungen: verschlüsselte dauerhafte Queue, eindeutige Ereignisse und konkurrierende Claims, vier Versuche/Retry-After, Wiederaufnahme und endgültige Anbieterannahme ohne Empfangsbestätigung, alte Equipment-Freigaben, neu abgeglichene Auswahl, aufgelöste Ereignisse und Ablauf. IndexedDB-Neuöffnung und atomare Claims mit fake-indexeddb 6.2.8 (Apache-2.0). Service Worker prüft sichtbare/verborgene Fenster, erneuten Opt-out während Prüfung, Wiener Nachtruhe, expliziten Test, unpassende Payloads sowie feste authentifizierte Rückkanäle. Status und idempotente shown-Receipts sind vom Provider-Ergebnis getrennt. Ein alter aktiver Worker blockiert v2-Registrierung bis zur bewussten Aktualisierung.

Lokale HTTP-Browseransicht: Equipment-Auswahl entfernt, Nachtruhe und Start-/Favoritenwahl erhalten; mangels HTTPS dort keine Push-Freigabe. Echte Telefonanzeige muss am optierten Zielgerät geprüft werden. Native Quellen und ursprüngliche 0.6.1/21-APK unverändert; Originalbytes, Größe, SHA-256 und Signatur beim Wiederherstellen bestätigt. Direkter Uhr-Push wird auf Nutzerwunsch nicht weiter eingerichtet.

Produktionsabnahme 0.6.7: Bereitstellung erfolgreich, Runtime-Revision 4 und bestehende Schlüssel erhalten. Eine bewusst ungültige, zufällig erzeugte technische Testadresse wurde registriert; der echte Workers-Transport lief bis zur Anbieterantwort für den abgelaufenen/ungültigen Endpoint (API HTTP 410). Der technische Testdatensatz wurde anschließend entfernt. Das prüft Verschlüsselung/HTTP im realen Runtimepfad, keine physische Telefonanzeige. Öffentliche HTTPS-Einstellungen zeigen die neuen Filter und den echten 60-Minuten-Takt; Notification-Freigabe ist im Cloud-Testbrowser blockiert und wurde nicht umgangen.

## PWA 0.6.6 · Meine Orte · 09.11.2026

261 Web-/Server-Prüfungen erfolgreich, geänderte JavaScript-Module und Service Worker syntaktisch geprüft; 96 eindeutige Journey-IDs. Vier neue UI-Regressionsprüfungen umfassen Abbrechen samt verspäteter Adressantwort, erste leere Liste, Adress-/Koordinaten-/ID-Erhalt beim Umbenennen sowie Start-/Zielauswahl und ausdrücklich bestätigte Entfernung des richtigen Datensatzes. Gemeinsame Menüprüfungen für Wechsel, Außenklick, Escape und Fokus weiter erfolgreich. Native Wear 0.6.1/21 unverändert.

Lokale Browserabnahme mit zwei ausdrücklich öffentlichen Beispielorten Rathaus/Oper: Ortsmenüs, Editor, Abbrechen/Fokusrückkehr und Menüwechsel/Escape geprüft. Abbrechen erhält beide gespeicherten Namen. Dialog bei 345 px Inhaltsbreite 496,5 px hoch, beide Standardkarten 138,8 px; Name/Adresse unterscheiden sich durch 16/13/12-px-Typografie. Lange Namen auch bei 305 px vollständig umbrechend, Dialog scrollWidth gleich clientWidth (267 px); geöffnete Menüs bleiben innerhalb des Dialogs. Ebenso Breiten 345, 405 und 695 px geprüft, alle sichtbaren Aktionen mindestens 44 px. Lokale HTTP-Vorschau unterstützt crypto.randomUUID nicht und kann daher Speichern im Browser nicht abnehmen; dafür ist die veröffentlichte HTTPS-Version zu verwenden. Nach einem Szenarienwechsel lieferte die lokale Vorschau zudem 404; die leere Erstansicht ist durch die neue Regression geprüft. Keine privaten Screenshotadressen in Testdaten übernommen, temporäre lokale Testseite entfernt.

## PWA 0.6.5 · mobile Reiseübersicht · 09.11.2026

257 Web-/Server-Tests bestanden; geänderte Module und Service Worker syntaktisch geprüft, alle 91 Journey-IDs eindeutig. Die bestehende Regression für eigene Routennamen prüft jetzt auch getrennte Ortslabels/Adressen, sichtbare Ein-/Ausstiegsstationen, Erhalt der physischen gespeicherten Endpunkte sowie GPS-/Koordinatenabgrenzung. Keine zusätzlichen kosmetischen Unit-Tests. Native APK 0.6.1/21 bleibt unverändert.

Lokale Browserabnahme mit ausdrücklich öffentlichen gespeicherten Testwegen Westbahnhof → Karlsplatz: Inhaltbreiten 305, 345, 405 und 695 px ohne seitlichen Überlauf. Alle Kopf-/Ansichts-/Routenaktionsbuttons 44 px hoch, Rückfahrt/Neuplanung/Fußweg in einer Reihe. Titel 18 px mobil und 20 px breit, Endpunktnamen 16 px. Lange Ortslabels umbrechen vollständig auch bei 305 px; langer eigener Routenname bleibt sichtbar. GPS-Start zeigt keine alte Adresse, hat die beschriftete Standort-/Gehwegaktion und löst beim Öffnen keine GPS-Anfrage aus. Zurück führt zur Routenliste. Gesamtkarte öffnet den gesamten Weg, schematische Abschnitte gekennzeichnet; Rückkehr zur Reise erhält die Ansicht. Lokale API-Abfahrten waren vorübergehend nicht verfügbar, daher keine Live-Zustellung aus dieser Layoutprüfung behauptet. Erstes Fußwegsegment beim normalen Beispiel beginnt bei 345 px Inhaltbreite bereits auf y=555 px. Die temporäre lokale Testseite wird nicht veröffentlicht.

## PWA 0.6.4 · abschließende Browserabnahme · 09.11.2026

257 Web-/Server-Prüfungen bestanden. Kein zusätzlicher nativer Build; Wear 0.6.1/21 bleibt bytegleich. Die bisherige Python-Suite (acht Tests) und Syntaxprüfung (59 Dateien) bestehen. Die abschließende Änderung umfasst gemeinsame Tab-Darstellung/Leerzeichen und Shell-Version, keine neuen Datenzugriffe.

Öffentlicher Browser: bei 303, 343, 403 und 693 px Inhaltbreite sind alle drei Haupttabs auf Startseite und Reiseansicht 44 px hoch; scrollWidth gleich clientWidth. Auf 303 px passen auch Favoritenanzahl und lange gespeicherte Richtung ohne seitlichen Überlauf. Aktuelle U6- und 29B-Antworten zeigen das Fahrzeug-Symbol pro Abfahrt in Route, fokussierter Stationsansicht, Favoriten und Vollbild-Verbindung. Richtung Thaliastraße → Floridsdorf bleibt gefiltert; beide Folgeabfahrten haben eigene Symbole. Erhaltene lokale drei Linien- und drei Routenfavoriten, aktualisierte Shell über den sichtbaren Updateknopf bestätigt. Dark-Auswahl nach Hell-Abnahme wiederhergestellt; bestehende Browserfreigaben nicht geändert.

Der neutrale Korrekturtext wurde mit ausdrücklich als Beispieldaten bezeichneten zwei API-Snapshots geprüft, einschließlich unterschiedlicher Barrierefreiheit der ersten/zweiten Abfahrt. Die Beispiele sind kein beobachteter Störungs- oder Verspätungsnachweis. Die temporäre unverbundene Prüfseite ist im Abschlussstand entfernt. Gleichstations-Fußweg weiterhin 125 px, alle geprüften Reiseaktionen mindestens 44 px hoch. Physische Smartphone-/Watch-Abnahme bleibt von Browser-/Unit-Tests getrennt.

## PWA 0.6.3 · Abfahrtshinweise · 09.11.2026

257 Web-/Server- und acht Python-Tests bestanden; JavaScript-Syntaxprüfung für 59 Dateien erfolgreich. 13 neue Regressionen prüfen spätere Prognosen, Identität und nächste Züge, Cold-Start/JSON-Ausschluss, erste Live-Angabe, Duplikate, Frische/Zukunft, unverlängerten Zweiminutenablauf, Rückkorrektur sowie Fahrzeug-Overrides und individuelle Symbole in der tatsächlichen Stationsdarstellung. Details: [Datenvertrag](departure-indicators.md). Native APK 0.6.1/21 bytegleich, 3.735.980 Bytes, SHA-256 bbf73cd515ba01fbf6d709ed6b8f9f166de77984640f3dccffde1f6607e6ff59.

Layout-Abnahme 0.6.2: Bei 305, 345, 405 und 695 px Inhaltbreite bleibt scrollWidth gleich clientWidth, alle drei Haupttabs sind 44 px hoch. Der gleiche Stations-Fußweg verkürzt sich von 193 auf 125 px. Stations-/Verbindungs-/Kartenaktionen bleiben mindestens 44 px hoch. Fußwegkarte öffnen/schließen, korrekter U6-Richtungsfokus und Zurück zur Reise erfolgreich; Teilen enthält ausschließlich die öffentliche App-Einladung. Neue Shell 0.6.2 über den sichtbaren Updateknopf übernommen, Favoriten erhalten.

## PWA 0.6.2 · kompakte Reiseansicht und einheitlicher Kopf · 09.11.2026

Bahnsteig/Abfahrtszeit beim Stationskopf statt in einer zusätzlichen Abfahrtszeile, kompakte Absatz-/Karten-/Variantenabstände. Fußwege mit Start → Ziel zusammen; gleiche bekannte Stations-ID wird einmal mit beiden Bahnsteigen gezeigt. Alle Stations-/Verbindungs-/Kartenaktionen behalten mindestens 44 px Tippfläche. Logo, Slogan, Version, Teilen/Einstellungen und die waagerechte Hauptnavigation entsprechen der Startseite. Der gemeinsame Link-Tab-Stil verwendet Flex statt Grid, damit Icon/Text nebeneinander bleiben. Heller/dunkler Erstaufbau nutzt dieselbe gespeicherte Theme-Auswahl. Route, Etappenfokus, Abfahrtsbudget und gespeicherte Favoriten unverändert. PWA-/Shell-Version 0.6.2; native APK/Feed 0.6.1/21 unverändert.

# Prüfungen und Abnahmen

## GitHub und konsolidierte Dokumentation · 09.11.2026

Erster vollständiger öffentlicher Import 0.6.0: 296 Dateien nach Pfad, Git-Blob-SHA und Dateimodus geprüft, 244 Web-/Server- und acht Python-Tests bestanden. GitHub-Commit b44cbe20e6f9e082a4a2c1f700f1ad2d9e69d31c; echter Push-Prüflauf 42608519790 erfolgreich. README, Entwicklung, Architektur, Konfiguration, native Build-Anleitung und Veröffentlichungsablauf werden in internen und öffentlichen Quellen konsolidiert. Historische Anleitungen separat archiviert, relative Dateilinks erhalten. Quellpaket enthält nun auch SQL-Migrationen, Drizzle-Konfiguration, CI und Leaflet-Lizenz. App-Verhalten und signierte APK bleiben durch diesen Dokumentations-/Paketwechsel unverändert.

Abgleich auf 0.6.1: 244 Web-/Server- und acht Python-Prüfungen erneut erfolgreich. Alle lokalen Dateilinks der neun aktuellen Einstiegs-/Fachanleitungen sind vorhanden. Das Quell-ZIP umfasst sämtliche 306 versionierten bzw. neuen Quelldateien mit identischen Bytes, ohne fehlende oder unerwartete Dateien und ohne private Schlüssel/Build-Dateien. Enthalten sind alle fünf SQL-Migrationen, die Drizzle-Konfiguration, GitHub-CI und die unveränderte Leaflet-Lizenz. Die öffentliche APK 0.6.1 wurde über den echten Download geladen: 3.735.980 Bytes, SHA-256 bbf73cd515ba01fbf6d709ed6b8f9f166de77984640f3dccffde1f6607e6ff59, Originalsignatur verifiziert. Keine APK neu gebaut oder ersetzt; physische Geräteabnahme weiterhin separat.

## Wear 0.6.1 / Code 21 · Favoritenansichten und QR-Rückkehr · 09.11.2026

Im Favoriten-Tab trennt ein direkt sichtbarer Umschalter **Routen** und **Stationen**. Die Stationsansicht trägt die Überschrift **Haltestellen & Linien**. Die ausdrücklich gewählte Ansicht bleibt lokal über Aktualisierung, Detailnavigation und App-Neustart erhalten. Ohne bisherige Auswahl erscheinen bei vorhandenen Routen zuerst Routen, sonst Stationen; beide Bereiche bleiben auch leer erreichbar. Nur Stationen der gewählten Ansicht sind Monitorziele, laufende alte Anfragen werden beim Wechsel verworfen. Gemeinsame Abrufgrenzen, lokale Favoriten und Push-Auswahl bleiben erhalten.

Nach bewusst bestätigtem QR-Import und erfolgreichem Transferabschluss öffnet die Uhr direkt Favoriten: Routen bei mitübernommenen Routen, sonst Stationen. Der Transfer wird beendet, Schlüssel und Wachhalteflag werden freigegeben. Abbruch, Fehler und Ablauf bleiben im bisherigen Fehler-/Zurück-Pfad; bei fehlender Abschlussquittung bleibt die Übernahme gespeichert und die bestehende Wiederholung erreichbar. Dateiimport und Senden ans Handy behalten ihren bisherigen Rückweg. Originalpaket und Release-Key bleiben erhalten; PWA 0.6.1 korrigiert auf Nutzerwunsch die Routenbeschriftung zu **Alternativen nach …**; Alternativen und Planung selbst bleiben erhalten.

## 0.6.0 · Störungsbenachrichtigungen · 09.11.2026

244 Web-/Server-, 119 native Android- und acht Python-Prüfungen erfolgreich. Neuer Routenfiltertest umfasst Hauptweg, Alternativen, Ein-/Ausstieg, Deduplizierung und Ausschluss privater Felder. Sichtbare Rückkehr nach geänderten Routen synchronisiert auch innerhalb von fünf Minuten; versteckte Seiten lösen keinen Abruf aus. Native Tests prüfen echte JourneyStore-Vorlagen, Varianten und Entfernung. Signierte APK 0.6.0/20: 3.731.884 Bytes; SHA-256 d112d1b0b1340623b505033f4fc48ad03320ca06b1fc75d4fe4ede74b39f5900. Signatur/Paket/zipalign geprüft; physische Zustellung weiterhin separat.

Öffentliche Abnahme am 09.11.2026: Release mit Runtime-Revision 4 erfolgreich veröffentlicht. Verbundener Dienst meldet available=true, nativeAvailable=false und intervalMinutes=60. Ein normaler Quellen-/Versandprüflauf nach Freischaltung lieferte checked=true, skipped=false, state=ok und lastSuccess=1794219415518 (11:16:55 Europe/Vienna). Die sichtbaren PWA-Einstellungen zeigen neun Linien an 13 bekannten Haltestellen einschließlich der vorhandenen drei Routenfavoriten, optionale Aufzüge aus, ehrlichen Stundentakt und den Zeitpunkt der letzten Prüfung. Bereits verweigerte Browserfreigabe wird korrekt erklärt und die Aktivierung bleibt gesperrt; keine Erlaubnis automatisch geändert. Echter Geräteempfang damit noch nicht nachgewiesen. Öffentliche Uhr-Landingpage nennt 0.6.0 und erklärt die fehlende direkte Firebase-Einrichtung. Über deren Downloadknopf geladene APK hat identische Größe und SHA-256 wie der signierte Build; ältere Releasepfade bleiben erhalten.

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

Produktive Transitous-Probe am 09.11.2026: HTTP 200 mit acht Verbindungen. Mindest- und Höchstzahl sind beide acht; der Anbieter lehnt eine kleinere Höchstzahl ausdrücklich ab. Der Adaptertest sichert diese gemeinsame Grenze ab.

## PWA 0.3.3 / Wear 0.4.0

215 Node-/PWA-/Serverprüfungen erfolgreich: neu precision-six-Kartengeometrie inkl. defekter/überschrittener Koordinaten, echte detaillierte Fahrt-/Transferanforderung, parent Stop-ID, GPS-Geometrie-Redaktion, kompakte timeless-v2-Pakete, Legacy-Kompatibilität und explizite Relay-Fähigkeit, Routenidentität/ID-Kollisionen/Limit, vollständige Stationsabfahrten mit Schedule/Live/Fehlerstatus, eindeutige/mehrdeutige Adressen ohne ungewolltes GPS, neuer Stations-Scope trotz gleicher Reise sowie alte Abbruch-/30-s-Budgets.

98 native Prüfungen erfolgreich. Neue Prüfungen: WebCrypto-v2-Entschlüsselung und Java-Rückpaket, Vorschau ohne Schreiben, bewusste atomare Übernahme beider Favoritenarten mit Restart und bestehender Reihenfolge, Reduktion alter Zeiten/GPS/Geometrie, defekte Gesamtsammlung und Kapazitätsgrenze, exakte aktuelle Linienzuordnung/Fehlerstatus, Route/Station/Umstieg/Zurück und Top-Scroll mit gerenderten 192-/227-dp-Ansichten. Physische OnePlus-/GPS-/Kameraabnahme bleibt getrennt.

## PWA 0.2.1 · öffentliche Abnahme · 09.11.2026 Wiener Zeit

Öffentlich geprüfte echte Transitous-Verbindung Westbahnhof → Karlsplatz mit U3 → Volkstheater → Tram 1, fünf Alternativen, Planung/Umstiege/Zeiten korrekt. Separater Geocode- und Fußwegabruf produktiv HTTP 200. Routenfavorit gespeichert, Seite neu geladen und gespeicherten Linienweg ohne alte Fahrzeiten wieder geöffnet. Aktuelle U3-Abfahrten tatsächlich aus Wiener-Linien-Monitor angezeigt; fehlende passende Tram-Abfahrt neutral erklärt. Favoritöffnung berechnet keine Vollroute. Öffentliche PWA-Liniendetails bestätigen scrollTop 0 und verbergen Übersicht; Update-Hinweis/Übernahme und Favoritensortierung erhalten. Kein Nutzer-GPS für die Abnahme freigegeben.

Hosting-Fetch auf unterstütztes redirect manual umgestellt: 3xx wird abgewiesen, nie anderer Host verfolgt. Anbieter-Endpunkte unverändert. Neue Sucheingaben verwerfen alte Alternativen, damit kein alter Linienweg unter neuem Start/Ziel gespeichert wird. Geplante Wegabschnitte zeigen gewählte Ortsnamen anstelle technischer START/END-Platzhalter. Wear bleibt 0.3.7 / Code 14, nur Scrollfix; 91 native Tests. 203 Node-/PWA-/Serverprüfungen. Physische OnePlus- und schmale Telefonabnahme separat.

## Abnahme PWA 0.2.0 / Wear 0.3.7

202 Node-/PWA-/Serverprüfungen bestanden. Neue Regressionen: fixes Transitous-Produktionsziel/UA, keine Weiterleitung fremder Felder/Rohantworten, kleine validierte Eingaben und Datenschutz, atomarer gemeinsamer 700er-Budgetrand einschließlich Stundenwechsel/konkurrierender Requests, DB-Ausfall/429/defekte/zu große/abgebrochene Antworten, echte Geocode-Match-Form und bekannte Boarding-Station beim separaten Fußweg. Client: nur explizites POST, kurzer flüchtiger Cache/Ersetzungsabbruch, Wiener Zeitzone einschließlich DST-Lücke/Überlappung, sichere lokale Routenfavoriten ohne alte absolute Zeiten/Trip-ID/GPS-Fix, Deduplizierung und Wiederherstellung, zwei Einstiege innerhalb 24 RBL. PWA Scroll: verspäteter Detail-Frame darf zurückgekehrte Übersicht nicht nach oben setzen.

91 native Prüfungen erfolgreich: neu tatsächlicher ScrollView nach tief gescrollter Übersicht mit noch wartendem Restore → neues Detail oben → Refresh behält Leseposition → anderes Detail wieder oben → ursprünglicher Favoritenmodus/Daten unverändert. Originalsignatur, APK-Paket/Version/Code und zipalign im Builder verifiziert. Physisches OnePlus-Gerät gesondert.

Interne Vorschau war in dieser Sitzung durch Browser-URL-Policy gesperrt; kein Ausweichpfad verwendet. Öffentliche Browser-Abnahme nach Veröffentlichung durchführen. Datierte echte Provider-Proben und Testfixture nicht als aktuelle Live-UI ausgeben. Watch-Reiseplanung absichtlich zurückgestellt.

## Abnahme PWA 0.1.29

187 Web-/Serverprüfungen bestanden. Größen-/Vektoränderung ohne Tests, die nur CSS-Werte wiederholen. Öffentliche Icons nach Deploy prüfen; kein physischer Telefonbericht daraus ableiten.

Neun A-nach-B-Prüfungen: datierte echte MOTIS-Antwort mit 18 → U4 und Fußwegen, exakte Stationsidentität, Zeitzone/Modi/Gehzeit/Reserve, Fehler-/Ausfall-/Chronologiebehandlung, Anbieter-Echtzeit statt erfundener LIVE-Daten, Rufbus/Badner-Bezeichnungen nur nach belegten Metadaten, passende frische erreichbare Linienalternativen, Ersetzen/Abbruch und Timeout. Noch keine UI- oder produktive Daueranbindung behaupten.

Produktive PWA 0.1.28 zuvor im Browser geprüft: App teilen öffnet Dialog mit richtiger öffentlicher Adresse und WhatsApp-Link; Link kopieren meldet Erfolg. Tatsächlicher wartender Worker erzeugte Neue Version verfügbar; Jetzt aktualisieren übernahm ihn und lud neu, Hinweis anschließend verschwunden. Gespeicherte Entfernungssortierung blieb erhalten. Native WhatsApp-Zielauswahl/Endversand auf Telefon separat.

## Abnahme PWA 0.1.28

Zusätzlich Updateprüfungen für numerische Versionen, keine Watch-only-/alten Updates, Hinweis ohne automatischen Reload, aktive Sichtbarkeit/Abbruch, wartenden bzw. bereits installierenden Worker und wiederholbare Offline-/Netzfehler. Offline-Shell-Test fordert ausdrücklich Nutzeraktion vor skipWaiting.

Neue Verhaltensprüfungen für native öffentliche Einladung ohne Transfer-/Standortdaten, Abbruch ohne Nebeneffekt, fehlende/gesperrte Web-Share-Unterstützung, explizites Kopieren/Clipboard-Fehler und doppelte native Aufrufe. 178 Web-/Server-/Offline-Shell-Prüfungen erfolgreich. Öffentliche Browserabnahme des Headerknopfs und der Ersatzansicht nach Deploy; nativer Android-Share-Sheet-/WhatsApp-Endversand bleibt auf dem Gerät zu prüfen. Wear-APK unverändert 0.3.6, daher kein nativer Neubuild.

## Abnahme PWA 0.1.27 / Wear 0.3.6

168 bestehende Node-/PWA-/Servertests und 90 native Android-Tests bestanden. Reine Text-/Hinweisdarstellung erhält keine zusätzlichen Tests, die nur neue Textkonstanten wiederholen. Originalsignatur, Paket at.andrew.foamawien, Version 0.3.6 / Code 13 und zipalign verifiziert. Nach Veröffentlichung Favoriten mit Position und ohne Position sowie gespeicherte Sortierwahl prüfen. Neue Reiseplanung ausschließlich dokumentiert, keine behauptete Funktionsabnahme.

## Abnahme PWA 0.1.26 / Wear 0.3.5

168 Node-/PWA-/Serverprüfungen bestanden. Neue SQLite/D1-Regressionen: individuelle Last-seen-Zeitpunkte/30 Tage, Cachetreffer und alte Betreiberzeit einschließlich frischem Proxy-Zeitstempel, Teilbatches/Fehler, ausreichende unterschiedliche Prüftage/Tageszeiten, spätere Wiederaufnahme, Nacht/Rufbus/Fahrplanbelege, ungefragte Stationen und Fremdmonitore, konkurrierende atomare Updates, begrenzte Aufbewahrung und nicht verfügbare Datenbank. PWA: unabhängige lokale Linienalterung, zentrale Unterdrückung/Offline-Metadaten, bestehende Station/RBL-Identität bei Katalogerneuerung. Reale Datenregressionen für Westbahnhof, Thaliastraße, Nacht-/U-Bahn und getrennte Nachbarstationen.

Acht Python-Prüfungen erfolgreich: fünf neue GTFS-Fälle für Kalendertage/-ausnahmen, reine Wochenendverkehre, exakte Stationsidentität ohne Nachbar-Join, offizielle Rufbus-/Badner-Bezeichnungen, datierte Fahrgastfahrten einschließlich Ausstiegs-Endstelle und Verwerfen abgelaufener/unvollständiger Quellen; drei bestehende Timer-Verträge. 90 native Tests: bereinigte tatsächliche Assets, neue gemeinsame Evidenz bis Offline-Neustart/Unterdrückung/Wiederauftauchen, sichere Feldauswahl und unveränderte Favoriten. Bestehende Standort-/UI-/QR-/Updateprüfungen erhalten. Originalzertifikat, Paket/Version/Code und zipalign verifiziert; physisches Gerät bleibt gesondert. Produktiver D1-/Browsernachweis nach Deploy über den geschlossenen App-Debugbereich möglich: Zentrale Linienbestätigung meldet Verfügbarkeit und ausschließlich aggregierte Stations-/Bestätigungszahlen aus der tatsächlichen Monitorantwort. Öffnen löst keinen Request aus. Direkter externer Prüfclient wurde vom Hosting-Schutz mit HTTP 403 / Code 1010 abgewiesen; keine Agent-/Netzwerkumgehung vorgenommen.

## Abnahme PWA 0.1.25 · 08.11.2026

157 bestehende Node-/PWA-/Serverprüfungen erfolgreich, einschließlich vollständigem Offline-Shell und Verbindungsnavigation. Reine CSS-Dichtekorrektur erhält keine Tests, die CSS-Konstanten wiederholen. Review des gemeldeten Telefonscreenshots: 44-px-Buttons plus weitere Flex-Gaps erzeugten zu große sichtbare Zwischenräume; Dimmungserklärung und Verkehrsmittel wurden zudem als konkurrierende Flex-Geschwister angeordnet. Einspaltige Metadaten und gap-freie Button-Gruppe beheben diese Ursachen; sichtbare Pill-Höhe füllt die unveränderten Touchziele besser aus. Native APK unverändert, kein neuer Watch-Testlauf erforderlich. Öffentliche Browserdarstellung wird nach Deployment kontrolliert; schmale physische Telefonansicht separat prüfen.

## Abnahme PWA 0.1.24 / Wear 0.3.4 · 08.11.2026

157 Node-/PWA-/Server- und drei Python-Timerprüfungen bestanden. 14 neue Verbindungsfälle: genaue Station/Linie/Richtung, Rail, Kurzführung je Fahrzeug, Datenalter/Fehler statt falscher Betriebsstatus, RBL-Zuordnung/Fallback/24er-Limit, Browser-Back/Forward und History-Validierung. Tatsächliche Refresh-Funktion mit fokussiertem Ziel, Erhalt fremder Caches, 30-s-Sperre bei manuellen Wiederholungen, 429-Backoff, Hintergrund/Dialogpause, Abbruch laufender fremder Requests und Ignorieren später Antworten ohne Cache-/Log-/Fehleränderung. Tatsächlicher Ansichtswechsel stellt Tab-Sichtbarkeit, Scrollposition und Fokus wieder her; Favoriten bleiben unverändert.

88 native Android-/Robolectric-Tests vor Signatur erfolgreich. Neue Regressionen: datenloser Favorit bleibt erreichbar und gespeichert, Detail erklärt unbestätigte Daten und kehrt nach Dateneingang zur bestätigten Darstellung zurück; Nähe und ganze Stationsfavoriten zeigen identische tatsächliche Rechtecke für Station, Gehzeit, Badge, Richtung und große Minuten. Beide Verbindungen öffnen dasselbe Detail, Favoritenwerte und Elternansicht bleiben erhalten. Runddisplay-Renderings 192/227 dp kontrolliert. Primäre Zeitgrenze prüft jetzt echte Descendant-Rechtecke statt ungeeigneter getLocationOnScreen-Koordinaten im nicht angehängten Robolectric-Fenster. Gemeinsamer Kopf kompakter; Gehzeit als kurze Pfeil-/Minutenangabe, barrierefreie Beschreibung ausdrücklich geschätzt.

Paket at.andrew.foamawien, Originalzertifikat, Version 0.3.4 / Code 11, apksigner und zipalign verifiziert. Physische OnePlus-Abnahme bleibt separat. Interne Vorschau war zuletzt durch URL-Policy gesperrt; der unabhängig benötigte veröffentlichte öffentliche Dienst war im Browser erreichbar. Kein alternativer interner Vorschaupfad als Umgehung verwendet.

Öffentlicher Browsernachweis nach Veröffentlichung: echte Wiener-Linien-Abfahrten an Josefstädter Straße, bestätigte U6/2/12 neben gedimmten Kataloglinien, große Verbindungssicht, Countdown/Folgeabfahrten und lokale Favoritenaktion geprüft. Browser-Back stellt aufgeklappte Übersicht und gemessene Scrollposition 446 px wieder her; Forward öffnet dieselbe Verbindung erneut. Aufruf aus Favoriten und separater Entfernen-Stern funktionieren; Testfavorit anschließend entfernt. Gedimmte Linie 1 bleibt antippbar und zeigt verständlichen Leerstand. Auch im Detail bleibt ihr Badge neutral. Kein GPS freigegeben und kein Testdatensatz als live ausgegeben. Desktop-Browseransicht geprüft; neue schmale PWA-Ansicht und physische OnePlus-Abnahme bleiben separat.

## Abnahme Wear 0.3.3 / Code 10

86 native Android-/Robolectric-Tests erfolgreich. Zusätzliche Menütests prüfen gewählte Meldungsumfänge/Optionen über Unterseiten hinweg, weiterhin gesperrten Opt-in ohne Einrichtung, Datenschutz auf eigener Seite, Archiv-Rückkehr sowie Zurück/Wisch/System-Navigation der neuen Kindseiten. Filter sind in beiden Home-Tabs vor den Stationsüberschriften und außerhalb der Favoritenkarten; ursprüngliche Favoritenwerte bleiben erhalten. Kurzes Störungen-Label bei 192 dp und 1,3-facher Schrift vollständig einzeilig ohne Ellipse. Native 192-/227-dp-Ansichten, Unterseiten und große Schrift gerendert. Reine Darstellung erhält keine Tests, die Farb-/CSS-Konstanten wiederholen.

Geometrieprüfungen verwenden lokale Descendant-Rechtecke statt getLocationOnScreen im nicht angehängten Robolectric-Fenster; vor Rendern Layout neu berechnen. Physische Bedienungs-/OnePlus-Abnahme weiterhin separat. Erste Webseitenprüfung 320/390 px, Hell/Dunkel und kein horizontales Überlaufen; spätere Vorschau-Nachprüfung durch Browser-URL-Policy gesperrt. Installation/Disclosures statisch geprüft, kein vollständiger finaler Klick-Rundlauf. Keine künstlichen Abfahrten als Live-Daten ausgeben.

## Abnahme Wear 0.3.2 / Code 9

83 Android-/Robolectric-Tests bestanden. Neue Transfer-Regressionsfälle: beide Richtungen ab Vorbereitung wach, weiterhin aktiver Transferbildschirm nach 90 Sekunden ohne Eingabe, QR und Rückkehr per Back; sendeseitiger Abschluss entfernt Screen-Flag ohne Activity.finish; erhaltene Importvorschau und Bestätigung halten Display bis zum bestätigten Abschluss; unabhängige Zehn-Minuten-Grenze beendet offene Vorschau ohne weitere Polls und verhindert späteren Import; ungültige Vorbereitungsantwort räumt Flag/Schlüssel auf. Bestehender Menü-/Pause-Test prüft zusätzlich Freigabe des Flags und unveränderte Favoriten. 143 Node-Tests weiterhin erfolgreich. Keine physische OnePlus-Display-/QR-Abnahme aus diesen Tests ableiten.

## Abnahme PWA 0.1.23 / Wear 0.3.1

143 Node- und 79 native Android-Prüfungen erfolgreich. Neue Regressionen: zwei Aufzugsfälle (davon einer geplant), Fahrtreppe, zukünftige Fahrbetriebsstörung und aktuelle gemischte Fahrbetriebs-/Aufzugsmeldung; nur die aktuelle Störung zählt/bestimmt Warn-Badges. Tatsächlicher Stationsrenderer behält alle Zusatzinformationen in neutralem geschlossenem Disclosure. Startgrenze auf eine Millisekunde geprüft, gecachtes planned-Flag nach Beginn korrekt bewertet; beendete Meldungen entfernt. Gemeinsame Push-Regel: eine Sekunde vor Beginn kein Versand, ab Beginn zulässig, Equipment separat standardmäßig aus. Native Monitorreferenzen, Eltern-IDs, Kategorien, Beginn/Ende, erledigt und unbekannte Details geprüft.

Browserprüfung mit klar markierten Beispieldaten: gelbe aktuelle U6-Warnung getrennt von neutralen Aufzugs- und geplanten Meldungen, Daten 24.–25. November lesbar; Hell/Dunkel geprüft. Temporäre Prüffläche vor Veröffentlichung entfernen. Kein physischer Watch-/Push-Zustellnachweis daraus ableiten.

## Abnahme PWA 0.1.22 / Wear 0.3.0

139 Node-Tests: neue Stationsgruppierung mit interleavten Favoriten, identitätsbasierte Gruppenbewegung, keine Mutation bei Entfernungssortierung, Einzel-/Gruppenlöschung; betroffene Linien aller Meldungen im geschlossenen Kopf und konservative Titel-Auswertung. Zusätzlich Josefstädter Straße mit U6-Bahnsteigen, echte DOM-Rechtecke für Sichtbarkeit, 24-RBL-Grenze und Sichtbarkeit vor außerhalb liegenden Metro-Stationen. FCM-JWT unabhängig geprüft, Providerzielbindung, Tokenverfall/Rotation, Gerätespeicherung und Quelle-only-MCP-Prüfung. Alle bisherigen QR/Web-Push-/Datenschutztests erhalten.

77 native Android-Tests: echte Activity-Gruppierung, gespeicherte Einträge/Entfernbarkeit, globale Sichtbarkeit im ScrollView, keine erneuten Requests vor Ablauf der Sperre; FCM-Opt-in, kalter Start ohne Firebase-App, minimale Filter ohne GPS/Namen, Permission/Quiet/Expiry-Grenzen, reines Push-Rendering ohne Activity/GPS, begrenzter deduplizierter 24-h-Hinweisspeicher und Notification-Navigation. Übrige Lifecycle-/Standort-/Gesten-/QR-/Cache-Tests erhalten. Originalsignatur, APK-Metadaten und zipalign geprüft. D8/R8 8.13.25 beseitigt Kotlin-Metadaten-Inkompatibilität der alten Build-Tools.

Browser-Vorschau über echte Importoberfläche: drei synthetische Verbindungen aus zwei öffentlichen Stationen → zwei Karten, Stationsname zuerst; Nach unten verschiebt ganze Stationsgruppe, alle Menüs schließen. Danach blockierte die interne Browser-URL-Policy weiteren Zugriff. Deshalb kein vollständiger mobiler Browser-/Persistenz-Rundlauf behauptet; Einzelentfernung und gespeicherte Daten separat in automatisierten Tests. Native Runddisplay-Bilder sind Beispieldaten, kein physischer Gerätescreenshot. Drei Python-Vertragsprüfungen für den vorbereiteten externen Timer.

Firebase bleibt unverbunden, reale Google→Uhr-Zustellung und physische OnePlus-Aktualisierung/Anzeige nicht geprüft. Hintergrundtimer erst nach tatsächlichem Werkzeuglauf und persistierter Prüfzeit als aktiv melden.

## Frühere Prüfstände

## Abnahme PWA 0.1.21 / Wear 0.2.5

125 Node-Tests, darunter drei neue Prioritätsfälle: Sortierung vor Limit, Entfernung innerhalb eines Modus, ausgeschaltete Modi bei gemischten Stationen, keine Ableitung aus Namen, echter gebündelter Karlsplatz-Katalog. Native Regressionen prüfen sechs Richtungen in Nähe und Stationsfavoriten ohne Trunkierung, U-Bahn vor früher abfahrender Tram/Bus, sechs tatsächliche Karlsplatz-Metro-RBL im ersten Batch trotz 30 vorheriger Busstationen, Rotation/24er-Grenze, Filterabschaltung und Erhalt manueller Favoriten. Hauptfilter: beide Tabs, direkter Einstieg, Umschalten, Button/Swipe zurück, Nullauswahl; alle sechs Symbole bei 192 dp sowie Schriftvergrößerung rendern. Keine synthetischen Abfahrten als Live-Daten ausgeben.

65 native Tests erfolgreich; ursprüngliches Zertifikat, Paket und Version/Code geprüft, signierte APK und zipalign bestätigt. Interne Browserabnahme am echten PWA-UI mit öffentlichen manuellen Stationsstartpunkten: bei allen Filtern Metro vor näherer Tram/Bus, nach Metro-Abschaltung Tram nach Entfernung. Einzelheiten im [Releasebericht](wear-os-release-0.2.5.md).

Aktueller Push-Prüfstand: 122 Node-Tests und drei Python-Vertragsprüfungen bestanden. Produktive Quellenprüfung und authentifizierte Geräte-API/Abmeldung erfolgreich. Erster geplanter Plattformlauf fehlgeschlagen; Auftrag pausiert, Aktivierung gesperrt. Docker-Timer nur vorbereitet; keine physische Push-Anzeige und kein Containerstart bestätigt.

## PWA 0.1.20 · Optionale Störungsbenachrichtigungen · 08.11.2026

Mehr → Einstellungen → Störungsbenachrichtigungen. Favoriten oder alle Wiener-Linien-Linien, optionale Aufzugsmeldungen/Nachtruhe, ausdrücklicher Opt-in, Testnachricht und Abmeldung. Semantisch deduplizierte Sammelhinweise, 30 Minuten Abstand und sechs automatische Hinweise pro Wiener Tag. Push-Registrierung und minimale Filter verschlüsselt in D1, Schlüssel ausschließlich Hosting-Secrets. GPS/Abfahrten unverändert nur sichtbar; Wear 0.2.4 bleibt unverändert. Hintergrundauftrag und Zustellung erst nach tatsächlicher produktiver Verifikation als aktiv melden. [Details, Datenhaltung und Abnahme](push-notifications.md).

# Abnahme PWA 0.1.19 · 105 Node-Tests

Alle bestehenden Tests erfolgreich; keine zusätzlichen Tests, die nur CSS-Werte wiederholen. Interne, ausdrücklich mit Beispieldaten markierte Browser-Prüffläche mit echten UI-Klassen bei 320/345/390 px in Hell und Dunkel: vier reguläre Nähe-Zeilen zuvor je 76 px, neue kurze Zeilen 64 px; lange Richtungen wachsen bei Bedarf weiter, ohne horizontales Überlaufen. Favoritenliste mit denselben vier Beispielen rund 19–23 px kürzer. Hauptzahlen weiterhin berechnet 28 px; Sterne im Nähe-Inhalt 44 × 44 px. Temporäre Prüffläche wird vor Veröffentlichung entfernt. Keine GPS-/API-/Hardwareabnahme aus dieser Darstellungsprüfung ableiten; Wear-APK unverändert, Hash beim Wiederherstellen des öffentlichen Assets geprüft.

JSON-Exporte: YYYYMMDD_foama-wien-…json, Exportdatum in Wiener Zeit; Favoriten, Watch-Transfer-Download und Diagnoseprotokolle. Produktive Browserprüfung: verschlüsselter JSON-Upload, Empfänger-Entschlüsselung, bestätigter PWA-Import und sofort gelöschter Ciphertext erfolgreich. Temporäre Prüffläche entfernt.

# PWA 0.1.18 / Wear 0.2.4 · QR-Favoritenübertragung · 08.11.2026

Mehr → Favoriten → Mit Handy übertragen auf der Uhr. Vom Handy empfangen oder Ans Handy senden wählen und QR-Code mit der Handy-Kamera scannen. Die eigenständige Übertragungsseite nimmt lokale PWA-Favoriten oder einen JSON-Export an. Auf der Uhr Vorschau prüfen und ausdrücklich übernehmen; auf dem Handy PWA-Import oder JSON-Download wählen. Bestehende Favoriten bleiben erhalten, Duplikate werden übersprungen. Beide Geräte bleiben unabhängig, keine dauerhafte Synchronisierung.

# Abnahme PWA 0.1.17 · 101 Node-Tests

Vier neue Regressionen: Sichtbarkeit nur für passende Linie/Station bei Plattform-/Favoritenduplikaten; leere Daten/fehlende Ziele/Cacheablauf/erledigte und beendete Meldungen; gültige ältere Meldungen mit erhaltenem Abrufalter; offenes Disclosure über Refresh erhalten und nach Entfernen der letzten Meldung ohne Inhalt/Leerraum schließen. Vorhandene 97 Tests bleiben erfolgreich.

Browser: echte PWA-Favoritenansicht ohne manuelle Reihenfolge-Hilfe, ohne leeren Meldungsstatus und ohne Warnbereich. Favoritendialog über ＋ Favorit hinzufügen geöffnet und Haltestellensuche Floridsdorf mit echten lokalen Katalogtreffern geprüft, ohne Favoritenmutation. Lokale ausdrücklich als Beispieldaten gekennzeichnete UI-Prüffläche verwendet dieselbe Warning-Komponente und denselben Notice-Renderer: Hell/Dunkel, Aufklappen, Details mit Gültigkeit/Quelle/älterem Stand und vollständiges Verbergen bei null Meldungen geprüft. Prüffläche vor Veröffentlichung entfernt; keine synthetischen Abfahrten als Live-Daten. Wear-APK unverändert.

# Abnahme PWA 0.1.16 / Wear 0.2.3

97 Node-Tests bestanden. Browserprüfung der echten PWA in 320-/345-/390-px-Frames: alle sechs Modus-Buttons haben gleiche Y-Koordinate, Höhe 44 px, Breite mindestens 44 px. Radius im Kopf, Auswahl/Deaktivierung am Bus ohne Filterexpansion. Kurze Sortier- und Meldungstexte innerhalb des Favoritenpanels. Standort bleibt initial geschlossen. HTTP-Vorschau ist kein GPS-/Produktions-API-Nachweis. Temporäre Prüffläche vor Veröffentlichung entfernt.

54 bestehende JUnit/Robolectric-Tests vor Signieren bestanden, einschließlich Navigation, 48-dp-Zielen, Font-/Runddisplay-Renderings und Ressourcenbereinigung. Native Nähe bei 192/227 dp und 1,3-fache Schrift kontrolliert: Pin/Stern und Beschriftung horizontal, sichtbare Leiste 36 dp innerhalb von 48-dp-Zielen. Originalzertifikat, Paket, Version 0.2.3 / Code 4 und zipalign geprüft. Keine physische Watch-Abnahme behauptet; keine zusätzlichen Tests nur für Styling.

# Abnahme PWA 0.1.15 – 97 Node-Tests

Acht zusätzliche Regressionstests: sofortiger exklusiver Menüstatus vor asynchronem Toggle, Schließen nach Verschieben trotz alter Events, ein offenes Menü über normale Neuzeichnung, ignorierte Events entfernter Elemente, Außenklick/Escape ohne Scrollen, unveränderte Meldungsdisclosures/saubere Listener-Abmeldung, Auf-/Ab-Rundlauf ohne Datenverlust, Identitätsauflösung nach früherer Verschiebung sowie Grenzen/ungültige Aktionen.

Browser: zwei geöffnete 0.1.14-Menüs als Ausgangsfehler nachgewiesen. In 0.1.15 mit zwei öffentlichen Teststationen nach unten verschoben und wieder nach oben; jeweils korrekte Reihenfolge und null offene Menüs. Öffnen eines anderen Menüs hält nur eines offen. Reload erhält beide Favoriten und ihre Reihenfolge, Menüs starten geschlossen. Der HTTP-Preview ist kein Standort-/Live-API-Nachweis. Bestehende 89 Filter-/Datenschutz-/Offline-/Relay-Tests bestanden weiter; keine Änderung an nativen APK-Bytes.

# Abnahme PWA 0.1.14 / Wear 0.2.2

89 Node-Tests bestanden. Neue Filterfälle prüfen sämtliche sechs Modi einschließlich ausgeschalteter Modi, beschriftete Inline-SVGs, ausschließlich gültige Toggle-Ziele, einmalige Eventweitergabe ohne Disclosure-Expansion, initial geschlossene Standortdetails, Auf-/Zuklappen sowie HTML-/Offline-Einstieg. Browser auf dem verwalteten Preview bestätigt deaktivierten Bus ohne Filterexpansion, gespeicherten Zustand nach Reload, dabei wieder eingeklappten Standort und Synchronität zur erweiterten Ansicht. HTTP-Preview ist kein GPS-Nachweis.

54 Android-Tests vor Signatur bestanden. Zusätzlich zur bestehenden Abnahme: linke Wischgeste gegen tatsächlichen Zurück-Button auf jeder Menüstufe, Detail und moderner System-Back, vertikale/abgebrochene Gesten, Window-Dismiss-Konfiguration und Root-Schließen; SCREEN_OFF entfernt echte simulierte GPS-Listener und storniert die Sitzung, SCREEN_ON startet keine versteckte Activity. Blockierter HTTP-Aufruf wird getrennt und eine verspätete erfolgreiche Antwort verworfen; keine neuen Verbindungen nach Abbruch. HTTP-/Hash-/Größenfehler im Updater schließen Verbindungen und löschen Teil-Dateien; fremder App-Cache bleibt erhalten. Cachetests prüfen mehr als 3.000 UTF-8-Datensätze gegen 512 KiB, wiederholte Saves ohne Wachstum, Entfernung abgelaufener persistierter Daten beim Offline-Start und Erhalt der Nutzereinstellungen/Favoriten. Native 192-/227-dp- und 1,3-fache Schrift-Renderings kontrolliert. Keine daraus behauptete physische Wisch-/Akkuprüfung.

# Native Abnahme Wear 0.2.1

39 Android-/Robolectric-Tests bestanden: die bisherigen 26 sowie zwölf Standortcontroller- und ein vollständiger Activity-Wiederherstellungstest. Geprüft sind stummes network/fused mit GPS-Fallback, brauchbarer Fix und Entfernen übriger Listener, kein unendliches Warten, Cache aus anderer Quelle, Abweisung alter Fixes, Grobfreigabe ohne direkten GPS-Abruf, grober Fix ohne falsche Geh-Ampel, ausgeschaltete Ortung, Wiederholen, deaktivierter Anbieter und verspätete verworfene Quellen. Pause löscht Timer, Listener und CancellationSignals. Der Activity-Test führt von Position wird gesucht über das Zeitlimit zum Wiederholen und dann zur Nähe-Anzeige; externe Abfahrtsabfragen sind dabei gesperrt.

Aktualisierte native Renderings bei 192 und 227 dp sowie 1,3-facher Schrift visuell kontrolliert. Hauptminuten müssen innerhalb ihrer Spalte und im ersten kleinen Viewport liegen; Touchziele bleiben mindestens 48 dp. Nähe, Detail, Mehr, Standort, Verkehrsmittel und App/Updates gerendert. Alle Renderings verwenden ausdrücklich öffentliche Beispieldaten. Keine physische Hardwareabnahme daraus ableiten. Der Release-Builder erzwingt diese Tests vor dem Signieren und prüft das ursprüngliche Zertifikat, Version 0.2.1 / Code 2, Paket und zipalign.

# Abnahme PWA 0.1.13

84 bestehende PWA-/Relay-Tests für erhaltene Logik ausführen. Keine neuen Tests nur für CSS-Abstände; öffentlich rechte Zahlenkanten, reservierte Folgeabfahrt-/Qualitätsspalten, große Schrift und beide App-Links prüfen. Wear-APK-Bytes und SHA-256 unverändert.

# Abnahme v0.1.12 – 83 JS-Tests

Drei Theme-Prüfungen ergänzen die 80 Regressionstests: Systemänderung inklusive Browserfarbe und Auswahlzustand, Vorrang expliziter Auswahl mit Rückkehr zu System und sauberem Listener-Ende, validierte lokale Einstellungen. Öffentliche Prüfung beider Paletten und gespeicherter Wahl; kompakte Favoriten und zusammengeführter Standortstatus mitprüfen.

Native Android-/APK-Prüfungen folgen separat. Web-Entwurfsbilder sind kein Beleg für tatsächlich ausgeführte native Watch-UI.

# Abnahme v0.1.11

80 vorhandene Regressionstests, keine neuen Tests nur für Abstände. Öffentlich reduzierte Stationsfavoriten-Abstände und unveränderte 28-px-Hauptzahl, 17-px-Zweitzeit sowie unbeschnittene mehrzeilige Richtungen prüfen.

# Abnahme v0.1.10

80 bestehende Regressionstests; keine neuen Tests nur für reversible Anzeigeanordnung. Öffentliche UI-Prüfung: kein doppeltes Standortbanner, Status/Fixmetadaten/Refreshinfo innerhalb Dein Standort, Katalog-/API-/Startfehlerpfade erhalten. Physische GPS-/Sensorprüfung ist davon unverändert getrennt.

# Abnahme v0.1.9

80 vorhandene Regressionstests für erhaltene Logik; keine neuen Tests nur für die Darstellung. Öffentliche Prüfung: Stationskopf ohne Personen-Icon, Kartenaktion/Favoritenstern, vollflächiges Auf-/Zuklappen mit sichtbarem Chevron, Live-/Fahrplan-/Älter-Kennzeichnung und einheitliche berechnete Hauptzahlen (28 px) in Vorschau, Abfahrtslisten und Favoriten.

# Abnahme v0.1.8

80 vorhandene Regressionstests; kein neuer Test nur für reversible Button-Darstellung. Öffentlich beide Modi, sichtbaren/aria-pressed-Auswahlzustand und erhaltene Sortierung prüfen.

# Abnahme v0.1.7 – 80 Tests

Neue Fälle: vollständige Reproduktion der sieben Line-46-Meldungen, Relevanz gegen vorhandenen Cache, passende Lang-/Kurzmeldung ohne Übernahme der generischen Endzeit, identische Bahnsteigtexte vs. zusätzliche Richtungen/Zeitpunkte/Linien/Lifte, Erhaltung genauer Monitorbeschreibung, Ausschluss fremder Feed-Stopmeldungen. Echte öffentliche Brunnengasse-Antwort lokal wiedergegeben: sieben → eine Meldung.

Favoriten: Entfernungssortierung ohne Mutation der manuellen Reihenfolge, ursprüngliche Aktionsindizes, gleiche Entfernung und unbekannte Stationen, gespeicherte Sortierauswahl; direkte Stationsspeicherung ohne Verbindungsfavoriten zu ersetzen oder Duplikate zu erzeugen. Budgettest über sechs 24-RBL-Zyklen bestätigt feste vordere 16, Rotation aller übrigen IDs, veränderte Priorität bei anderem Standort bzw. manueller Ordnung, keine doppelten Stationsslots und keine WL-Abfrage für ÖBB-Stationen.

Öffentliche UI-Abnahme nach Deployment: entfernter Symbolhinweis, Marker und Listenalternative speichern, Favoritenanzahl/gespeicherter Zustand, sortierte Entfernungen, Rückkehr zur manuellen Ordnung und passende Verschiebepfeile. API-Limits/Sichtbarkeit/Fehlerexport und übrige Regressionstests bleiben erhalten. Keine physische Android-/Akku-Abnahme durch Desktop-Tests behaupten.

# Abnahme v0.1.6 – 70 Tests

Zehn neue Tests prüfen die Kombination ruhiger Sensorwerte und genauer Standorte, Ausschluss gecachter/grober/schneller Fixes, Sensorlücken und Fahrzeug-Hysterese, explizites Opt-in, echte Watch-Pausen und sofortiges Wiederaufnehmen, ruhige Fahrt/Tunnel, spätestens einminütige frische Kontrollversuche, einmalige Bestätigung bei ausbleibenden Watch-Callbacks, nicht verfügbare/gesperrte/stumme Sensoren sowie Hintergrund/Opt-out/manuellen Start/Standortverweigerung. Bestehende Datenquellen-/Export-/PWA-/Filter-/Meldungsprüfungen bleiben enthalten. Worker-Policy erlaubt Sensoren ausschließlich für die eigene Origin.

Physische Android-Sensordaten, Vergleich der Akkuaufnahme und Übergänge im echten Fahrzeug sind offen. In der Cloud kann eine simulierte Uhr/Sensorquelle nur den Steuerungsablauf beweisen, keine Erkennungsquote oder Energieersparnis am Smartphone.

# Abnahme v0.1.5 – 60 Tests

Alle 60 Node-Tests bestehen. Neue Fälle: Bauarbeiten vs. reine Linienhinweise, Haltepunktreferenzen, geplante/abgelaufene/erledigte Meldungen, Erhaltung anderer Cache-Einträge, begrenzte/ungefährliche Texte, Kartenfilter/Radius/Markerlimit, strikt bereinigter Fehlerexport und echter Download-Handler ohne GPS-/Netzwerkaufrufe. Backend: linienweite Ergänzung und Ausschluss fremder Aufzugsstörungen, getrennte Fehlerbehandlung bei weiterhin gültigen Abfahrten.

Offline-Test enthält jetzt auch Leaflet-Distribution und neue Debug-/Meldungsmodule. Frühere Diagnose-Helper bleiben für alte JSON-Formate testbar; deren Testseite ist nicht mehr der Produktablauf. Aktueller Ablauf: Einstellungen → Debugging (geschlossen) → JSON exportieren/kopieren.

Lokale Browserprüfung vor Erweiterung: Nachtfarben und Stationsadresse bestätigt. Anschließende interne Preview-URL wurde vom Browser blockiert; keine Umgehung versucht. Neue Gesamtoberfläche öffentlich nach Veröffentlichung prüfen. Physischer Android-Bewegungs-/Akkutest und Wear-Hardware bleiben Gerätetests.

# Abnahme v0.1.5

Bestehende automatisierte Release-Prüfungen werden ausgeführt; Farbregel und Stationsadresse im Browser prüfen. Keine zusätzlichen Tests nur für kosmetische Farbanpassungen.

# Abnahme v0.1.4

50/50 Node-Tests: `node --test tests/*.test.mjs tests/test_*.mjs`.

Neue Prüfungen: echte Offline-Stationszuordnung ohne Namen-Suffix-Heuristik; keine Treffer bei allen deaktivierten Verkehrsmitteln; passenden Bahnsteigen vorbehaltene 24-ID-Batches mit Richtungswechsel; Anreicherung bestehender CSV-Importe; echte Monitor-Transporttypen; frische Metadaten bei kleinen Bewegungen; grobe Tunnelposition, Alterung und guter überlappender Fix; Fahrzeuggeschwindigkeit/Distanz, Hysterese und Ausschluss ungenauer GPS-Sprünge; Begrenzung/Erhaltung des Abfahrtencaches; lokaler Straßenlookup an öffentlichen Koordinaten; tatsächlicher 403-Status und Relay-Pause über verschiedene Stationsabfragen. Bestehende Standort-/Export-/SW-/API-/Favoriten-/Transferprüfungen erhalten.

Browserprüfung im verwalteten Preview: manueller öffentlicher Teststart Stephansplatz, Straßenumfeld/PLZ sichtbar; bei U-Bahn-only verschwinden nahe Busstationen sofort; U1/U3-Badges bleiben ohne API; Filter nach Reload weiterhin eingeklappt; Standortkarte gerendert, Google-Maps-URL mit korrektem Suchpunkt vorhanden. Preview-Netzfehler sind kein produktiver Anbieterbefund. Kein privater Nutzerstandort verwendet.

Öffentliche Nachprüfung: docs/validation-v0.1.4.json. Reale Android-Fahr-/Tunneltests, Launcher-Iconupdate und Start der nativen Google-Maps-App sind weiterhin am Smartphone zu prüfen; sie werden nicht durch Browser-/Unit-Tests ersetzt.

# Abnahme v0.1.3

36/36 Node-Tests bestanden; darunter neue Tests für Stationssuche mit ß/ss/Umlauten, Trefferbegrenzung, getrennte Richtungen und Ausschluss fremder/veralteter Abfahrten. Bestehende Offline-/Diagnose-/Standort-/Relay-/Transferprüfungen bestehen weiter. Keine neuen Tests nur für kosmetische Grafikänderungen.

SVG-Master und gerenderte PWA-Icons visuell prüfen; offizielle Linienfarben sind in docs/branding.md belegt. Fußwegrouter mit realen öffentlichen Stationskoordinaten getestet: HTTP 200, LineString sowie plausible Distanz/Dauer. GPS-Funktion auf dem Smartphone wurde vom Nutzer bestätigt.

# Tests und Abnahme – v0.1.2

34/34 Node-Tests: `node --test tests/*.test.mjs tests/test_*.mjs`. JS-Syntax und Worker-ESM-Build geprüft.

- Neue Erstfreigabe: keine GPS-Anfrage vor dem Tipp; unmittelbarer API-Aufruf nach der Standortaktion.
- Bereits gewährter Standort: genau ein Watch; unsichtbare App stoppt ihn, verspätete Callbacks werden verworfen, sichtbare App startet ihn wieder.
- Verweigerte Freigabe, sperrende Permissions Policy, Timeout und ungenaue Position werden unterschieden. Kein automatischer Wiederholungs-Prompt nach Verweigerung.
- Sites-Routen `/`, `/index.html`, `/diagnose`, `/diagnose.html`, echte Asset-Bytes, explizite Standort-Richtlinie und Health-Version.
- Monitor-Relay: festes offizielles Ziel, gebündelte/numerische StopIDs, keine fremden URL-Parameter, 30-s-Cache, Timeout-Signal.
- Weiterhin: Parser/Datenqualität, Gehzeiten, Favoriten, Verschlüsselung/Transfer, datensparsamer Diagnose-Blob-/JSON-Export und Offline-Shell.

Lokaler Browser: Menü „Mehr“, Einstellungen, manuelle Auswahl aus dem echten Katalog und tatsächlicher Diagnose-JSON-Download erfolgreich. HTTP-Vorschau unterstützt keine GPS-Freigabe und ihr Node-Netzzugriff beweist den produktiven Relay nicht. Offizieller API-Einzelaufruf aus dieser Sitzung lieferte echtes JSON mit HTTP 200; produktiven Relay nach Deployment gesondert prüfen.

Physische Android-Installation, Standort-/Akkutest, echte ÖBB-Daten und Wear-Hardware bleiben offen. Kein synthetischer Datensatz wird als Live-Daten ausgeliefert.

Sites-Cache-Kompatibilität: eigener benannter API-Cache `foama-wien-api-v1`, niemals `caches.default`. Der Test simuliert den verbotenen Default-Cache. Der Katalog-Fallback `/api/stops-index` liefert den gebündelten offiziellen Katalog ohne weiteren externen Abruf; versionierte Katalogabfrage vermeidet alte leere Offline-Caches.

Produktionsabnahme 07.11.2026: öffentliche HTTPS-Diagnose mit aktivem Service Worker; echter Relay-Test HTTP 200, 1 Monitor / 1 Linie / 14 Abfahrten (Stephansplatz U1 → Leopoldau). Diagnose-JSON im öffentlichen Browser tatsächlich heruntergeladen und geprüft. Health-/Katalog-/Config-/Service-Worker-Endpunkte HTTP 200, Katalog 1.811 Gruppen. Maschinenlesbarer Nachweis: docs/validation-v0.1.2.json. Physische Android-GPS-Freigabe weiterhin auf dem Gerät prüfen.

Favoriten-Dialog: automatische Monitorabfragen der Hauptansicht pausieren, damit sie das Fair-Use-Fenster für eine neu gesuchte Station nicht belegen. Bereits tatsächlich geladene Verbindungen werden kurzzeitig begrenzt gepuffert und beim Speichern sofort angezeigt; beim Schließen startet die normale Aktualisierung wieder.

Öffentlicher Browsercheck v0.1.3: Suche „Stephansplatz“, echte Verbindungen geladen (u. a. U1/U3 und Busse), U1 → Leopoldau und ganze Station gespeichert, Duplikatknöpfe deaktiviert. Live-Abfahrten sichtbar. U1-/U3-Farben als RGB 237/28/36 und 245/130/31 im Browser bestätigt. Stationsname öffnet Fußwegdialog; echte Route mit 702 m auf Karte gerendert. Prüfstart verwendete öffentliche Stationskoordinaten, keinen Nutzerstandort. Nachweis: docs/validation-v0.1.3.json.

Maps-URLs zusätzlich geprüft: GPS-/fehlender Start überlässt die Position dem Telefon, explizit manuell gewählte Starts bleiben erhalten. Stationen sind auch ohne PWA-Standort extern navigierbar.

Öffentliche Abnahme v0.1.4: HTTPS und aktiver Service Worker im Diagnose-UI bestätigt; neuer Relay-Test HTTP 200 mit 1 Monitor, 1 U1-Linie und 14 echten Abfahrten; Diagnose-JSON tatsächlich im Browser heruntergeladen und Format/Version geprüft. In der Nähe echte U1/U3-Abfahrten, U-Bahn-only, gespeicherte Favoriten und Standortkarte geprüft. Öffentliche Stationskoordinaten dienten als manueller Teststart, kein privater GPS-Standort.

Nachkontrolle: Google-Maps-Fußlink auch ohne PWA-Fix im öffentlichen Browser vorhanden, ohne veraltete Origin. Stationskopf als drei stabile Spalten für Namen, Abfahrten und Stern; keine umgebrochene Sternzeile.

Standortkarten-Fix: Leaflet-Ansicht vor dem Berechnen von Suchradius-/Genauigkeitskreis-Bounds initialisieren. Ohne initiale Ansicht konnten getBounds-Aufrufe abbrechen; die öffentliche Browserprüfung hat diesen Fehler sichtbar gemacht.

Öffentliche v0.1.5-Abnahme: Karte mit neun geladenen Kacheln und anklickbarer Stations-/Linien-/Adressauskunft; Nachtlinien RGB 22/42/99. Vier echte Betriebsmeldungen, darunter Gleisbauarbeiten 25/26/27, sichtbar. Geschlossenes Debugging und tatsächlicher JSON-Download mit neuem Format und ausschließlich technischen Feldern geprüft.

Wear-Design 0.1: JS-Syntax prüfen und Browser-Navigation Nähe/Favoriten → Detail → Zurück, Tunnel/Offline und große Schrift prüfen. Keine GPS-/API-Browserberechtigungen oder echten Favoriten im Prototyp. Keine zusätzlichen Unit-Tests für reine reversible Entwurfsansichten.

Öffentlicher Theme-Check: Hell bleibt nach Auswahl aktiv. Dabei entdeckten fest dunklen Dialoghintergrund korrigiert; alle Einstellungs-/Karten-/Favoritendialoge nutzen im hellen Schema helle Oberflächen. CSS-/Offline-Revision v0.1.12-r1.

## Native Watch 0.2.0

26 JUnit/Robolectric-Tests mit Android 34 bestanden, vor dem Release-Signieren durch scripts/test_wear.py erzwungen. Quellen wear/ui-test. Tests für echten offiziellen Katalog (1811), strikte Modi, kleine Fixupdates, groben Empfang/Fahrt/Alter, Live gegen Fahrplan, Teilantworten und Cache, lokale Favoriten/Sortierung, Navigation, ausdrückliches Speichern, Standort-Prompt nur bei Tap, Pause, 48-dp-Bedienziele, Hauptzahl im 192-dp-Viewport und native 192-/227-dp-Rundrenderings. Keine erfundene physische Watch-Abnahme. apksigner v3, zipalign, APK-Paket/Version/Watch-Feature geprüft. [Build- und Releasebeleg](wear-os-release-0.2.0.md).

PWA öffentlich geprüft: alle drei Appearance-Buttons; Hell über Reload erhalten, Dunkel/System wirksam. Kompakte Favoriten 44-px-Zeilen mit 28-px-Zahl; normal oberer Standortbanner verborgen.

Aktueller Gesamtstand: 84 Node-/PWA-/Relay-Tests und 26 native Android-Tests bestanden. Zusätzlicher Hostingtest bestätigt binäre APK-Auslieferung, MIME, Downloadname, HEAD und fehlende private Routen.

Öffentliche Zwischenabnahme: echte Adresse Friedrich-Schmidt-Platz 1 → Opernring 2, fünf Transitous-Alternativen inkl. U2, Geometrie vorhanden. OSM-Hintergrund blockierte zunächst wegen des restriktiven Seiten-Referrers; Kartenbilder jetzt mit echter App-Origin gemäß Anbieterregel. Endprüfung nach Patch erforderlich. APK öffentlich heruntergeladen, SHA-256 stimmt mit signiertem Release überein.

Die Reise-Monitorregression verwendet jetzt die echte WL-Parser-/Cache-Kette statt eines Attrappen-Caches: ein numerischer fetchedAt wurde als ungültig verworfen. Der Reiseabruf setzt nun wie die Hauptansicht einen ISO-Zeitstempel, sodass tatsächlich erhaltene Abfahrten bis in die Stationskarte gelangen. Eindeutige Adresswahl setzt nur die zuvor explizit gestartete Suche fort; Änderungen oder Hintergrund verwerfen die Fortsetzung.

Öffentliche Abnahme 09.11.2026, ca. 08:07 Wiener Zeit: Kartenhintergrund lädt korrekt, U2-Fahrtverlauf zwischen Rathaus und Karlsplatz sichtbar. Meine Routen benennen, Entfernen/Rückgängig und Persistenz nach Reload erfolgreich; bestehende Route unverändert erhalten. Ganze Stationsseite Karlsplatz zeigt tatsächliche U1/U2/U4/WLB/1/4A/59A-Abfahrten mit Richtungen und LIVE-Qualität. Der Linienalternativenfilter akzeptiert den tatsächlichen ISO-Cachezeitstempel und den bisherigen numerischen Adapterzeitstempel, inklusive Frische-/Zukunftsgrenzen.

Öffentliche Prüfung nach Zeitstempelkorrektur erfolgreich: gespeicherte Route Rathaus → Oper zeigt tatsächliche U2-Abfahrten in 1/3/6 Minuten; Antippen der ersten öffnet Rathaus mit allen Richtungen, scrollTop 0. Zielauswahl über Karlsplatz-Marker und Als Ziel wählen setzt den Suchort und schließt die Karte. Eigener Routenname bleibt auch beim erneuten Speichern derselben Route erhalten (Regression).

Prüfung 0.5.1: 242 Web-/Server- und 118 native Tests bestanden. Neue Regressionen unterscheiden beide Karten-Favoritenaktionen und prüfen kombinierten QR-/Dateiimport über die Einstellungen. Öffentliche Browserabnahme erfolgreich: Standortkarte mit öffentlichem manuellem Floridsdorf-Testpunkt, Popup mit beiden getrennten Aktionen, vorausgewählte Haltestelle und aktuelle Linien/Richtungen, U6 Richtung Siebenhirten als einzelner Favorit gespeichert und nach Schließen zurück auf unverändert geöffnete Karte. Bestehende Favoriten erhalten, Speicherrückmeldung auf Karte sichtbar. Öffentliche Uhr-APK heruntergeladen und bytegleich zum signierten Build verifiziert: 3.731.884 Bytes, SHA-256 6843c2f93cbdf3799fe953dd5bd1909c68def222c127ce6d4520881276a2bc83.

124 native Android-Tests und 244 Web-/Server-Prüfungen bestanden. Native Runddarstellung bei 227 dp und 192 dp (1,3-fache Schrift), Bereichswechsel, Erhalt nach Neustart/Detailnavigation, getrennte Monitorziele und gemeinsames Abrufbudget geprüft. QR-Übernahme nach expliziter Bestätigung führt zu den passenden Favoriten; Fehler, Wiederholungsabschluss, Schlüsselbereinigung und Pause/Fortsetzung geprüft. Originalpaket, Originalsignatur, zipalign, Version 0.6.1 / Code 21 verifiziert. APK: 3,735,980 Bytes; SHA-256 bbf73cd515ba01fbf6d709ed6b8f9f166de77984640f3dccffde1f6607e6ff59. Physische OnePlus-Abnahme bleibt separat.
