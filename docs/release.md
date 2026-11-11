## PWA 0.11.12 · Fahrzeugstart ohne doppelte Flächennutzung · 11.11.2026

Grafischer Datenstand ist der Platzhalter für die Fahrzeugdarstellung, keine zusätzliche große Karte darüber. Solange im gewählten Ausschnitt keine darstellbare Position vorliegt, bleiben Schema/Karte, Haltefolge und die zusätzlichen Stations-/Fahrzeugdetails verborgen. Sobald eine Lage vorhanden ist, verschwindet der Fortschrittsbereich vollständig. Kurz grau gehaltene Lagen bleiben sichtbar; erst nach Ablauf aller Lagen kehrt der Platzhalter zurück. Gilt für Stations-/A-nach-B-Bereiche und die ganze Fahrzeugseite, mit derselben Auswahl, Tracker-ID und Abrufbegrenzung. Kartenmodul erst bei sichtbarer Fahrzeugkarte initialisieren, bestehende Karte und Nutzerausschnitt bei Wechseln erhalten. Neuer PWA-Cache; Wear 0.7.4/26 unverändert.

## PWA 0.11.9 · einheitlicher Slogan auf allen Seiten · 11.11.2026

Verbindliche Formulierung „Öffis, die du noch erreichst.“ in den Markenköpfen aller 13 PWA-HTML-Seiten. In fokussierten Stations-/Verbindungsdetails steht sie im eigenen Verbindungskopf; A-nach-B-Unteransichten behalten den gemeinsamen Markenkopf. Einheitliche brand-copy/brand-tagline-Stile mit normalem Umbruch, bestehende Wortmarke und Logogröße erhalten. Themenüberschriften, Zurückaktionen, Datenquellen und bisherige dezente Fußzeilen bleiben erhalten. Manifest-Beschreibung und Teilen-Text führen denselben Wortlaut. Debugging bleibt Umzugsseite, Wear-Prototyp bleibt ausdrücklich als Entwurf gekennzeichnet. Neuer PWA-Cache, native Wear-APK 0.7.4/26 erhalten.

## PWA 0.11.8 · Kartenzentrum bei Breitenwechsel erhalten · 11.11.2026

Öffentliche Browserabnahme von 0.11.7: Karte/Schema bei 337 px Inhaltsbreite ohne Überlauf (Schema clientWidth/scrollWidth 281 px), echte 48A-Kennung und Auswahl beim Wechsel erhalten. Beim erneuten Öffnen einer in der Breite veränderten Karte ließ pan:false die geografische Mitte auswandern. Größenabgleich verwendet nun pan:true ohne Animation; laufende Datenupdates passen weiterhin weder Zoom noch Ausschnitt neu ein. Die bewusste Aktion Ausschnitt zeigen bleibt verfügbar. Bestehende Regression prüft das Zentrierungsverhalten beim Wiederanzeigen. Keine neue native APK.

## PWA 0.11.7 · Schema/Karte in Stationsansichten und verständliche Fahrtkennungen · 11.11.2026

Eingebettete Fahrzeuge im Anflug in Stations-/Verbindungsdetails und A-nach-B-Einstiegen/Favoriten bieten Schema und Karte für denselben Ausschnitt (bis zu fünf Halte davor, zwei danach). Schema vorbelegt, Kartenmodul/Kacheln erst auf bewusste Auswahl. Beide Darstellungen teilen Tracker, Richtung, temporäre Identität und Auswahl; Wechsel erzeugt keinen zusätzlichen Monitorabruf. Die Karte behält den vom Nutzer gewählten Ausschnitt bei Updates und Ansichtwechseln. Geometrie aus exakt derselben Streckenvariante, Zielhalt hervorgehoben, eigene Aktion Ausschnitt zeigen. Schließen/Hintergrund beenden die Kachelebene und verwerfen späte Modulantworten; Schema bleibt bei Kartenfehlern wählbar. Offener Panelknoten und Fokus bleiben bei Routineupdates erhalten.

Sichtbare Fahrzeugkennungen jetzt etwa U6 · 01, 46 · 02 oder 48A · 03 in Karte, Schema, Liste, Auswahl und Stationsmeldungen. Interne IDs unverändert; keine offiziellen Fahrzeugnummern suggerieren. Neuer PWA-Cache samt barem/versioniertem Kartenmodul, bestehendes Logo und Wear 0.7.4/26 erhalten.

## PWA 0.11.6 · lächelnde Bahn als neues Foama-Logo · 11.11.2026

Nutzer hat die Konturvariante „Bahn + Schiene“ mit den beiden weißen Punkten als Augen und einem kleinen Lächeln ausgewählt. Neuer skalierbarer SVG-Master für Monitor, A nach B, Fahrzeug-/Linienseiten, Willkommen, Städtevergleich und Uhr-Webseite. Kurzes Gleis mit zwei Schwellen; Mint/Navy und helle Augen. Versionierte 192-/512-Pixel-Icons für Installation, Apple-Touch-Icon, Benachrichtigungen und Offline-Shell; alte Icondateien bleiben für bisherige Worker erhalten. Manifest-ID, Startadresse und Favoriten unverändert. Android bestimmt den Aktualisierungszeitpunkt eines installierten Launcher-Symbols. Dieser Release betrifft PWA und Website; native Wear-APK bleibt 0.7.4/26.

## PWA 0.11.5 · klare Eingaben, sichtbare Marke und Fahrzeuge im Anflug · 11.11.2026

Der auf zwei Zeilen umbrechende Suchbutton zog Start- und Zielinput auf rund 58–60 px Höhe. Eingaben verwenden jetzt eine flexible Restbreite und feste 48 px Höhe bei 16 px Schrift. Der Suchbutton bleibt auf einer Zeile; auf schmalen Bildschirmen bis 480 px zeigt er eine 48-px-Lupe mit unverändertem zugänglichem Namen und Titel. Die kompaktere Platzhalterbeschriftung passt besser auf kleine Telefone. Such-, Auswahl- und GPS-Verhalten unverändert. Kartensymbol-Kontrast aus 0.11.4 erhalten, neuer PWA-Cache, Wear 0.7.4/26 erhalten.

Willkommen-Seite mit eigenem Fahrzeuge-im-Anflug-Bereich, einer als Beispiel gekennzeichneten Stationsdarstellung und direkten Links. Städtevergleich um Einführung und eigene Erklärung mit direktem FAQ-Einstieg ergänzt. Die Funktion ist auf Nutzerwunsch regulär verfügbar und trägt keine experimentelle Kennzeichnung mehr; Quellen-/Genauigkeitserklärung und Wien-Abdeckung bleiben klar. Der Monitor zeigt das bestehende Logo auf kleinen Telefonen wieder mit 48 px und den Schriftzug mit mindestens 24 px. Neue Logoentwürfe werden getrennt zur Bewertung gezeigt und ersetzen das aktuelle Logo erst nach Auswahl.

## PWA 0.11.4 · graue Fahrzeuge auf Stadtkarte lesbar · 11.11.2026

Die transparente Darstellung unsicherer Fahrzeuge ließ das graue Symbol mit Straßen, Linien und Stationspunkten verschmelzen. Ausschließlich die Stadtkarte verwendet für unsichere oder veraltete Marker jetzt eine deckende neutrale dunkelgraue Fläche (#4b5563), ein helles Symbol (#f9fafb) und einen dezenten Schatten. Volle Deckkraft und derselbe Kontrast in beiden App-Farbschemata; kein gestrichelter oder grauer Außenrahmen. Markerauswahl, Fahrt-ID und Tracker unverändert. Neuer PWA-Cache; Wear 0.7.4/26 erhalten.

## PWA 0.11.3 · Tram 46 in beide Richtungen und klarere Fahrzeugansicht · 11.11.2026

Zweites Antippen wählt eine Fahrt in Karte, Schema, Liste und Stationsausschnitt wieder ab und beendet aktives Folgen. Unsichere/fehlende Lagen erscheinen als graues Symbol ohne gestrichelten Rahmen. Eine alte gehaltene Lage wird ausgeblendet, wenn eine frisch bestätigte spätere Fahrt sie passiert hat: gleicher Zielbezug, mindestens zwei gemeinsame frische Stationsanker mit späteren Sollzeiten und zwei Quellenstände. Überlappende frische Fahrten oder ein Quellenausfall löschen keinen Marker. Erneute Darstellung einer entfernten ID benötigt wieder zwei Quellenstände; 60/90-s-Fristen bleiben erhalten.

Linie 46 war durch widersprüchliche historische Umleitungsmuster nur in einer Richtung importiert. Vollständig identische öffentliche Stationsfolgen haben nun Vorrang vor bloßen Teilfolgen; widersprüchliche vollständige Zuordnungen bleiben ausgeschlossen. Rückrichtung Joachimsthalerplatz → Parlament/Volkstheater mit getrennt gebundenen RBL-Seiten ergänzt: 165 Linien/617 Varianten. Fehlender naher Sollslot blockiert Bus/Tram nicht mehr, wenn ein gültiges Reisezeitprofil derselben Streckenvariante vom aktuellen Betriebstag vorliegt; mindestens drei Live-Sollanker und zwei Quellenstände bleiben Pflicht. U-Bahn-Sollslotabgleich bleibt erhalten.

Telefon: Darstellungsschalter erhalten eine eigene volle Zeile, Einzelvariantenwahl entfällt, lange Texte umbrechen. Desktop nutzt bis zu 1000 px Breite. Auswahlstatus und Folgen-Schalter klarer; redundante Legende in „Dein Halt“ entfällt. Horizontale Halteansicht bleibt vollständig in der Bildschirmbreite. Neuer PWA-Cache, Wear 0.7.4/26 erhalten.

## PWA 0.11.2 · Stationsausschnitt ohne Seitwärtsscroll · 11.11.2026

Fahrzeuge im Anflug passt den kompletten Ausschnitt proportional an die Bildschirmbreite an. Bis zu acht nummerierte Halte mit vollständig umbrechenden Namen darunter, ausgewählter Halt hervorgehoben; kein horizontaler Scrollbereich und kein automatisches Zentrieren. Fahrzeug- und Stationskoordinaten verwenden dieselbe relative Skala. In Verbindungs- und A-nach-B-Details bleibt das Panel dauerhaft im DOM; Countdown-/Monitorupdates ersetzen ausschließlich Abfahrtsinhalte, ohne Panel, Fokus, Richtungswahl oder Tracker neu einzusetzen. Abrufbudgets, Quellenbindung und Wear 0.7.4/26 bleiben erhalten.

## PWA 0.11.1 · Fahrzeuge im Anflug · 11.11.2026

Einheitlicher Name auf der Fahrzeugseite, in Seitentitel, Monitor-Footer, Linienkarte sowie Stations- und A-nach-B-Einstiegsdetails. Stationsansicht heißt „Dein Halt“. Geschlossene oder unsichtbare Bereiche verwerfen verspätete Paketantworten; ein geschlossener Bereich startet nach ausstehendem Katalogabruf keinen Liniendownload. Der Link zur ganzen Linie erhält die gewählte Strecke. Bestehender Rollout mit 165 Linien/616 Varianten bleibt erhalten. Neuer PWA-Cache, Wear 0.7.4/26 unverändert.

## PWA 0.11.0 · weitere Linien und Fahrzeuge im Anflug · 11.11.2026

Rollout auf 165 Wiener Linien und 616 eindeutig zugeordnete Varianten: 5 U-Bahn, 30 Tram, 130 Bus. Auswahl in echter Karte und Schema, mit expliziten begrenzten Abschnitten für lange Linien. Horizontale Stationsausschnitte in Verbindungs-/Stationsdetails und A-nach-B-Einstiegsdetails, bis zu fünf Halte davor und zwei danach, gewählte Station hervorgehoben. Anfangs geschlossen; Nachbar-RBLs teilen die bestehende Abfrage statt eines eigenen Pollers. Passende Zug-/Tram-/Bus-Symbole und temporäre IDs.

U-Bahn behält den begrenzten GTFS-Sollslotabgleich. Bus/Tram benötigen drei eindeutig zusammenpassende Live-Sollanker und zwei Quellenstände; GTFS dient als Fahrzeitprofil, nicht als nächster Zug. Wiederaufnahme über gemeinsame echte Stations-/Sollzeit-Schlüssel, konkurrierende Folgen und enge mehrdeutige Takte bleiben offen. Versionierte öffentliche RBL-Referenz und Gzip-Pakete ermöglichen Reproduktion; acht unklare Linien bleiben ausgeschlossen. Wear 0.7.4/26 unverändert.

382 Web-/Server-Tests, 15 Python-Prüfungen, 79 JavaScript-Syntaxprüfungen. Alle veröffentlichten Datenpakete, horizontale Darstellung, Lebenszyklus, Stations- und A-nach-B-Abrufgrenzen geprüft. Fünf neue reale U3-/49-/48A-Proben bestätigen fortschreitende Schätzlagen und stabile IDs; U3 mit fünf modellbasierten Stationsübergaben. Kein Nachweis physischer Wagenidentität. Browser-Abnahme weiterhin durch URL-Richtlinie blockiert. [Datenmodell und Grenzen](vehicle-pilot.md).

## PWA 0.10.2 · kompakter Footer · 11.11.2026

Monitor-Footer trennt Metadaten und gemeinsame Linknavigation. Lizenzen stehen bei den übrigen Links; alleinstehender Trennpunkt und zusätzliche Abstände zwischen umgebrochenen Linkzeilen entfallen. 44-px-Tippflächen bleiben erhalten. Installierte Monitor-PWA nutzt unten nur 20 px plus Safe Area; Browser-Editor-Abstand und andere Seiten behalten ihre bisherigen Regeln. Wear 0.7.4/26 unverändert.

Bestehende 361 Web-/Server-Tests, zwölf Python-Prüfungen und 77 JavaScript-Syntaxprüfungen; keine zusätzlichen Tests für die reine Layoutkorrektur. Browser-Abnahme wegen der bestehenden URL-Richtliniensperre weiterhin offen.

## PWA 0.10.1 · ganze U6, Kontinuität und Symbole · 11.11.2026

Ganzlinienpilot Floridsdorf–Siebenhirten, 24 Stationen je Richtung und 23 verifizierte Abfahrts-RBLs pro gemeinsam begrenztem Request. Scrollbares Schema mit 100 px Stationsabstand und Fahrt folgen in beiden Ansichten. Zug-SVG und temporäre ID in Karte, Schema und Liste; Bus-/Tram-Symbole für spätere Modusanbindung. Kurze Lücken und Korrekturen halten die letzte Lage grau unter gleicher ID; eindeutige andere Zuordnungen laufen weiter. Nach 90 Sekunden ohne aktuelle Ableitung weiterhin ausdrücklich ausblenden. Tatsächlich ausgelassene Halte/Kurzführungen erhalten, letzte Endstationsanfahrt unsicher aus Sollzeit schätzen. Komprimiertes Format-2-Paket mit Quellen-/Kalenderbindung.

361 Web-/Server-Tests, darunter 23 Fahrzeugregressionen, zwölf Python-Prüfungen und 77 JavaScript-Syntaxprüfungen. Sieben neue Ganzlinien-Mitschnitte: acht bis neun südliche und elf nördliche Schätzlagen nach zwei Quellenständen; drei gehaltene IDs später wieder aufgenommen, neun südliche modellbasierte Übergaben. Lücke/Ablauf, lokale Mehrdeutigkeit, ausgelassene Halte, echte Streckenentfernung, Kurzführung/Endstation und 23-RBL-Einzelrequest geprüft. Browser-URL-Richtlinie blockiert Vorschau; keine visuelle/physische Abnahme behaupten. Wear 0.7.4/26 unverändert. [Datenmodell und Grenzen](vehicle-pilot.md).

## PWA 0.10.0 · U6-Schätzung in Karte und Schema · 11.11.2026

354 Web-/Server-Tests (16 Pilotregressionen), zwölf Python-Prüfungen und 77 JavaScript-Syntaxprüfungen. Echte fünf U6-Snapshots: temporäre ID über zwei südliche Stationsübergaben, interpolierte Lage und nördliche Korrekturpause geprüft. Quelle/Kalender, falsche Seite, Doppelzuordnung, stale/fehlende Daten, Abruflimits, Pause und späte Antworten geprüft. Beide Darstellungen teilen denselben Modellfortschritt. Browser-Vorschau nach Infrastruktur-Reparatur durch URL-Richtlinie blockiert; keine visuelle oder physische Abnahme behaupten. [Pilotvertrag](vehicle-pilot.md). Wear 0.7.4/26 unverändert.

## Wear 0.7.4 · sichtbare Updates · 11.11.2026

Updatefenster bleiben bis zur Android-Übergabe wach; Staging läuft auf dem Worker. Kurze sichtbare Pause erhält nur bestätigte Update-Arbeit, echte Stop-/Abbruchpfade bereinigen weiterhin. Installerfehler verständlich abfangen, Resultate exakt zuordnen. 159 Android-Tests und Originalsignatur geprüft; [Abnahme und Grenzen](wear-os-release-0.7.4.md). PWA 0.9.5 bleibt unverändert.

## Wear 0.7.3 · aktive Stadt und engere Favoritensteuerung · 10.11.2026

Kopftitel auf den Hauptseiten ist die tatsächlich aktive Stadt aus CityProfiles.current(): Wien, Graz, Linz oder Salzburg. Bei jeder sichtbaren Inhaltsaktualisierung mitführen, auch nach automatischer Erkennung oder Ablauf der automatischen Zuordnung; kein eigener Timer und keine zusätzlichen Anfragen. Manuelle Profilwahl und alle bestehenden Stadt-/Standortregeln erhalten.

Sichtbaren Abstand der Favoritensegmente zur Verkehrsmittelleiste durch angepasste zeichnerische Insets und oben ausgerichtete Symbole verkleinern. Die nicht interaktive Abschnittsüberschrift nutzt den unteren Leerraum des Filterziels; erste Stations-/Routenaktion bleibt außerhalb seiner kompletten 48-dp-Fläche. Explizites Containerpadding verhindert, dass Drawable-Insetpadding die 48-dp-Kinder über den Gruppenrand schiebt. Bei direkt folgender Akku-Sparaktion keine Überschneidung. Auswahlpersistenz, Favoriten, Requestbudgets und Hintergrundregeln erhalten. Neuer APK-Dateiname 0.7.3 / Code 25, Originalpaket/-zertifikat, PWA bleibt 0.9.5.

## Wear 0.7.2 · kompakte Favoritenauswahl und Kopftitel · 10.11.2026

Routen/Stationen als gemeinsame 176-dp-breite, optisch 32-dp-hohe Segmentleiste statt zweier voller Aktionsbuttons. Mindestens 48 × 48 dp große getrennte Tippflächen, 12-sp-Beschriftung, aktive Auswahl und Fokusmarkierung erhalten. Kleiner foama-wien-Titel in der bisher freien Rundkappe über Nähe/Favoriten/A nach B; geringerer oberer Außenabstand gleicht den Titel aus. Keine zusätzliche Aktionszeile und keine Titelkopie auf Unterseiten. Große Systemschrift und 192-/227-dp-Runddisplays prüfen. Ansichtspräferenz, Stadtfilter, Favoritenspeicher, Rückwege und sämtliche Abruf-/Pausenregeln bleiben erhalten. Originalpaket/-zertifikat, eigener APK-Dateiname 0.7.2 / Code 24. PWA-Version bleibt 0.9.5.

## PWA 0.9.5 · Stationsnamen und Tastaturprüfung · 10.11.2026

Öffentliche Mausabnahme bestätigt identische Hover-/Klicknamen für Thaliastraße sowie den Wechsel Gumpendorfer Straße → Längenfeldgasse innerhalb derselben überlappenden Trefferfläche. Der ergänzende Tastaturcheck zeigte, dass die eigenen Popups bisher keinen Leaflet-keypress-Handler hatten. Enter wählt jetzt ausdrücklich den fokussierten Stationsmarker; andere Tasten lösen keine Auswahl aus. Neuer PWA-Cache für die finale Korrektur, Wear unverändert.

## PWA 0.9.4 · konsistente Stationsnamen beim Hover · 10.11.2026

Native Marker-Titel entfernen: überlappende 44-px-Treffflächen konnten einen Nachbarhalt benennen, obwohl die Klickauflösung den richtigen Punkt auswählte. Hover und Klick über dieselbe zentrale Zeigerauflösung verdrahten, bei Bewegung innerhalb einer Trefferfläche erneut auflösen. Ein eigener nicht interaktiver Leaflet-Tooltip zeigt genau den aufgelösten Stationsnamen. Beim Verlassen, Klick, Kartenbewegung, Zoom und Variantenwechsel schließen. Marker behalten ihren echten statischen aria-label-Namen und ihre 44-px-Fläche; Tastaturaktivierung wählt den fokussierten Marker. Keine zusätzlichen Anfragen. Wear 0.7.1/23 unverändert.

## PWA 0.9.3 · Monitor-Links und Datenfußnote · 10.11.2026

Datenstand & Aktualität im Linienfahrplan als geschlossene aufklappbare Fußnote nach den Fahrplaninhalten. Vollständige Metadaten und Quellenprüfung erhalten, mindestens 44-px-Ziel.

Linienkarte bietet im Stationspopup und unter der Karte getrennt Abfahrtsmonitor sowie Tagesfahrplan & PDF. Monitor nur für exakt bekannte Wiener-Linien-Stationen mit gültigen RBLs aus dem lokalen Stationskatalog; kein Probeabruf oder LIVE-Versprechen. Öffentliche Direktlinks enthalten Stations-ID, Linie, Modus und Richtung. Die PWA validiert den Katalogkontext nach dem Laden und öffnet genau die Verbindung. Initialen Link per replaceState übernehmen, damit Zurück zur Karte keinen leeren App-Zwischenschritt benötigt; in einem alleinstehenden Tab zurück zur Übersicht. Keine Standortinitialisierung für die direkt geöffnete Verbindung. Abrufbudgets/Favoriten und Wear 0.7.1/23 erhalten.

## PWA 0.9.2 · PDF-Streckenführung und Verbindungsaktionen · 10.11.2026

Beide Fahrplan-PDFs enthalten Karten und nummerierte Haltestellen in tatsächlicher Fahrtfolge. Tagesexport filtert exakt nach Datum, Richtung und gewählter Haltestelle; ganze Linie enthält alle an diesem Tag aktiven Varianten. Ausgewählte Station in Karte und Liste markieren. Fahrplantabellen danach weiterhin alphabetisch mit allen bisherigen Kalender-/MEZ-/MESZ-Regeln. Ein gemeinsamer geografischer Ausschnitt je Export, eine wiederverwendete JPEG-Hintergrundressource, echte GTFS-Shapes als Vektoren und klickbare Linien-/Quellenlinks. Fehlende Shapes niemals durch gerade Verbindungen ersetzen.

PDF-Hintergrund aus basemap.at Standard (CC BY 4.0), ausschließlich nach bewusstem Export, begrenzter Ausschnitt mit maximal 32 Kacheln/vier gleichzeitigen Abrufen. Keine OSM-Community-Kacheln für Downloads. Normale Browser-Caches, keine Offline-Kachelpakete, keine neue Serverroute. Ohne Hintergrund klar beschriftete geografische Karte aus lokalen Daten; Abbruch/Sichtbarkeit verhindern verspätete Downloads. Offline-Liniensicherung enthält jetzt zusätzlich Liniengeometrie. Basisdaten/Version/Quelldigest müssen zusammenpassen.

Linienkarte übernimmt halt aus dem Link, öffnet Popup, zentriert und hebt genau diese Haltestelle hervor. Gewählte Stations-ID bei Varianten-/Richtungswechsel erhalten, soweit sie dort vorkommt; unbekannte ID wählt keine Ersatzstation. Verbindungsansicht: Favoritenstern 44 px neben Titel, Fußweg als Hauptaktion unter der nächsten Abfahrt, Linienkarte und Fahrplan & PDF gleichwertig nebeneinander. Fachliche Abrufgrenzen, Favoritenschlüssel und Fokus bei Aktualisierungen erhalten. Wear 0.7.1/23 unverändert.

## PWA 0.9.1 · Seitenaufbau und übersichtliche Linienkarte · 10.11.2026

A nach B verwendet dieselbe Reihenfolge wie Nähe/Favoriten: gemeinsame App-Kopfzeile, Seitenüberschrift, Hauptnavigation und anschließend Route suchen/Meine Routen mit den zugehörigen Inhalten. Überschrift und Navigation liegen in derselben DOM- und Lesereihenfolge. Gemeinsame view-heading-Abstände und 29-px-Titel statt abweichender Sonderregeln. Suchformular, gespeicherte Orte und kompakte Reise-/Stationsdetails bleiben erhalten; kein verändertes Abfrageverhalten. Wear 0.7.1/23 unverändert.

Allgemeine Daten-, Quellen- und Offline-Erklärungen beginnen als geschlossene native details/summary-Abschnitte. In Linienkarte und Linienfahrplan anwenden; Fehler und fehlende Speicherbarkeit weiterhin direkt anzeigen. Die Stationsliste der Linienkarte beginnt ebenfalls geschlossen. Kompakte Streckenangabe bleibt sichtbar.

Linienkarte zeigt bei Zoom unter 16 nur 8-px-Haltepunkte auf der echten Linie; ab Zoom 16 die bisherigen 26-px-Stationsnummern. 44-px-Treffflächen, Stationsnamen, Popups und geordnete Liste bleiben erreichbar. Tastaturfokus darf seine Nummer auch in der Übersicht hervorheben. Zoomende schaltet nur die Darstellung am Kartencontainer um, ohne neue Datenabfrage oder Neubau der Geometrie.

## PWA 0.9.0 · geografische Linienkarte und PDF · 10.11.2026

Echte OpenStreetMap-Linienkarte für 173 Wiener Linien mit 965 geografischen Varianten, Richtungen, Kurzführungen und antippbaren Halten in Fahrtfolge. Versionierte Pakete aus exakt passendem offiziellen GTFS; gewählte Linie lokal gespeichert. Straßenkartenkacheln benötigen Internet. Keine Fahrzeugpositionen in diesem Release.

Im Linienfahrplan echter PDF-Download für Haltestelle/Richtung oder ganze Linie am ausgewählten Datum; lokal aus denselben Kalenderdaten, auch mit gespeicherten Paketen offline. A4, Herkunft/Gültigkeit und Seitenzahlen. Dateinamen beginnen mit Wiener Exportdatum und foama-wien. U1-Browserprüfung: echte Kartenkacheln, Richtung/Variante, Station zum passenden Fahrplan und beide PDF-Downloads. Überlappende Marker berücksichtigen den tatsächlichen Zeigerabstand.

B-Konzept um Stationsübergabe anhand richtungstreuer Prognosen und plausibler Abschnittsfahrzeiten erweitert; noch kein Schätzer im Produkt. Wear 0.7.1/23 samt ursprünglicher APK unverändert.

## PWA 0.8.3 · Willkommen bei Foama · 10.11.2026

Neue öffentliche Willkommen-Seite unter willkommen.html im Stil des Städtevergleichs, mit der vorhandenen vollständigen Städtecollage, klarem App-Einstieg, Funktionen, Stadtlinks, Wear-OS-Verweis, Installationshilfe und aufklappbarem FAQ. Themenwahl wird übernommen. Die Seite ist über App-Footer/Einstellungen, Städtevergleich und Uhr-Webseite erreichbar; App teilen verwendet die feste öffentliche Willkommen-Adresse statt der aktuellen Seite.

Die bestehende PWA-Identität, Startadresse und Geräte-Daten bleiben erhalten. Browser bieten Installation nach ihren eigenen Regeln an; die gemeinsame Installationskomponente öffnet einen nativen Dialog erst nach Nutzeraktion. Die Willkommen-Seite startet keine Standort-, Monitor-, Routen- oder Push-Anfragen. Offline-Shell und Navigationsfallback schließen den Einstieg ein. Wear bleibt 0.7.1/23.

## Wear 0.7.1 · Stadtbezogene Routen und schnelleres Laden · 10.11.2026

A nach B und Routenfavoriten zeigen die gewählte Stadt; alle gespeicherten Routen bleiben erhalten. Hauptnavigation bleibt in A nach B sichtbar, Mehr/Einstellungen kehren dorthin zurück. Fällige Abfragen starten sofort bei Rückkehr, gemeinsame Sperren exakt nach Restzeit; Fehlerpausen bleiben pro Stadt getrennt. Globales 30-Sekunden-Limit und Ultra-Sparmodus bleiben erhalten. Expliziter App-User-Agent ohne Gerätekennung. Signierter Build und aktuelle Abnahme: [Wear 0.7.1](wear-os-release-0.7.1.md). PWA bleibt 0.8.2.

## PWA 0.8.2 · Vier Städte im Bild · 10.11.2026

Eigenes breites Titelbild auf Städte & Funktionen: ineinander übergehende Ansichten von Wien, Graz, Linz und Salzburg, mit U-Bahn, Straßenbahnen und Obus sowie Foama-Schriftzug. Das vollständige Bild bleibt auf kleinen und großen Displays sichtbar, ohne Beschnitt; lokale WebP-Datei mit Alternativtext und Offline-Shell. Die Illustration ist kein geografischer Linienplan.

Der eigenständige Salzburg-Banner ist vollständig entfernt. Der bestehende FAQ LIVE oder Fahrplan erklärt ausdrücklich Salzburgs geplante Abfahrtszeiten und mögliche fehlende Verspätungen/kurzfristige Änderungen. Funktionsvergleich und Bedingungen bleiben erhalten. Wear bleibt 0.7.0/22.

## PWA 0.8.1 · Fahrplanorientierung und lesbare Hilfen · 10.11.2026

Der Linienfahrplan startet immer mit Heute. Die aktuelle Stunde erhält nach Wiener Datum, Uhrzeit und Zeitzonenwechseln eine mintfarbene Zeile und Jetzt; andere Tage bleiben unmarkiert. Die lokale Anzeige aktualisiert sich nur sichtbar, folgt bei Heute über Mitternacht dem neuen Tag und behält bewusst gewählte spätere Termine. Kein zusätzlicher Abfahrtsabruf für die Uhrzeitanzeige. Eindeutige Linienlinks tolerieren einen fehlenden oder ungültigen Verkehrsmittelwert; mehrdeutige Linien bleiben in der Auswahl.

Haltestellenadressen im Fußwegdialog verwenden themengerechte Hintergründe, 14-px-Adresszeilen, 12-px-Hinweise und kontrastreiche Quellenlinks. Der Städtevergleich behält alle Einschränkungen im Text und ergänzt kleine grüne Haken bzw. rote Kreuze. Die fünf Erklärungen sind unabhängig aufklappbare FAQ, der Barrierefreiheitslink öffnet die passende Antwort. Der Versions-/Geltungshinweis steht als Fußnote direkt unter der Tabelle. Wear bleibt 0.7.0/22.

## PWA 0.8.0 / Wear 0.7.0 · Städte und Linienfahrpläne · 10.11.2026

Die Uhr unterstützt jetzt Wien, Graz, Linz und Salzburg. Wien ist Standard; automatische Erkennung nur durch frische genaue Vordergrundfixes, veraltete Erkennung fällt auf Wien zurück. Manuelle Stadtwahl ausschließlich Mehr → Stadtprofil. Frische Position innerhalb des manuell gewählten Profils erhalten; nur bei fehlender/fremder Position klar bezeichnete Stadtmitte, niemals verlässliche Gehzeit. Alle lokalen Favoriten bleiben erhalten, Stationsfavoriten werden je Stadt angezeigt. Routen bleiben stadtübergreifend. Regionale Boards verwenden exakte bekannte Stations-IDs, maximal drei Stationen und das gemeinsame 30-s-/Serverbudget. Alle sichtbaren Stationen haben Vorrang. Salzburg bleibt Sollfahrplan; keine regionalen Störungs- oder nativen Push-Versprechen. Bus und S-Bahn mit gleicher Liniennummer werden einschließlich Detail/Import nach Modus getrennt.

QR-Handschlag ergänzt city-profiles-v1; alte Uhren bleiben weiterhin für regionale Auswahl gesperrt. Originalpaket, Originalsignatur, Geräte-/Favoritenschlüssel und Zehn-Minuten-Transfer bleiben erhalten. Wear 0.7.0/22: 138 Android-Tests, Signatur, Paket und Größe geprüft. Physische OnePlus-Abnahme bleibt separat.

PWA fahrplan.html zeigt 173 Wiener Linien mit Haltestelle, Richtung, Datum und vollständigem Tagesfahrplan nach Stunden. Nachtfahrten und Zeitumstellung kalendergenau; Stationsliste ausdrücklich alphabetisch, keine erfundene Linienführung. Ganze Linie nur nach Nutzeraktion offline laden; Speicherfehler und Abbruch ehrlich anzeigen. Vorhandenen versionierten IndexedDB-Speicher verwenden. Linienindex stets an dieselbe Fahrplanversion binden und bei Neuimport erneuern. Quelle, Serveränderung, Archivdateistand, Import, Gültigkeit und letzte Quellenprüfung unterscheiden; kein Veröffentlichungsdatum ableiten. Wöchentliche Quellenprüfung eingerichtet, kein automatischer Neuimport/Deploy. Die tatsächliche Quell-ZIP-Prüfsumme war am 10.11. identisch zum Import; Fahrplan gültig bis 12.12.2026.

Städtevergleich staedte.html, App-Links und Uhr-Webseite sind an den neuen Funktionsstand angepasst. Vollständige Linienkarten und Fahrzeugschätzungen sind geprüft und dokumentiert, aber noch nicht umgesetzt. Native/öffentliche Versionsangaben nur zusammen mit der verifizierten APK veröffentlichen.

## PWA 0.7.7 · Öffentliche Städteübersicht · 10.11.2026

Eigene teilbare Seite `staedte.html` mit Funktionsvergleich für Wien, Graz, Linz und Salzburg. Auf dem Smartphone einzelne Stadt oder alle vergleichen; Links im Stadtprofil, unter App & Installation, im PWA-Footer und auf der Uhr-Webseite. Fahrzeug-Barrierefreiheit, reine Fahrplanzeiten, regionale Störungsgrenzen und Offline-Nutzung sind verständlich erklärt. Die Seite ist Teil der Offline-Shell. Native Wear bleibt 0.6.1/21; regionale Uhr-Funktionen folgen separat.

## PWA 0.7.4 · lokaler Anzeigetest und eindeutige Updatehinweise · 10.11.2026

Der Nutzer bestätigt den Empfang der echten Push-Testnachricht. Die lokale Probe läuft nun als bestätigter MessageChannel-Auftrag im aktiven Worker mit waitUntil statt als bloßer Anzeigeaufruf aus der Seite. Sie prüft vorhandene Freigabe und Browser-Auflistung, ersetzt nur ihre eigene vorige Testanzeige und meldet fehlende Unterstützung, Ablehnung oder ausbleibende Bestätigung im Debug-Bereich. Kein Transport, keine neue Freigabe, keine Änderung echter Störungsanzeigen; lautlos, Benachrichtigungsleiste beachten. Physische Anzeige der überarbeiteten lokalen Probe bleibt am Zieltelefon zu prüfen.

Ursache des scheinbar unveränderten Updates: Navigation lädt bereits neue Seiten aus dem Netz, während ein neuer Offline-/Push-Worker noch wartet. Ohne nachgewiesene neuere App-Version heißt der Hinweis deshalb Offline-/Push-Komponenten aktualisieren und nennt die laufende App-Version. Ein neues App-Release zeigt Ziel- und aktuelle Version; Worker-Ereignisse überschreiben diese Angabe nicht. Bewusste Aktualisierung bleibt erforderlich. 306 Web-/Server-Tests, zehn Python-Tests und 67 JavaScript-Syntaxprüfungen. Native Wear 0.6.1/21 unverändert.

## PWA 0.7.6 · Einstellungen nach Zweck gegliedert · 10.11.2026

Auf Nutzerfeedback sind tägliche Einstellungen und technische Werkzeuge sichtbar getrennt. Deine App: Darstellung, Stadtprofil, Standort & Gehzeit, Störungshinweise und Favoriten & Uhr. Technik & Diagnose: App & Installation, Fahrplandaten importieren, Debug Push und Debugging. Stadt und Farbschema sind unabhängige Einträge; sie haben keinen gemeinsamen Aufklappbereich mehr. Neun dezente Karten mit einheitlichen Vektorsymbolen, ruhigen Hintergründen und besser getrennten Abständen ersetzen die flache Liste. Technische Symbole sind zurückhaltend, Alltagssymbole mint. Alle bisherigen Optionen, IDs, Hilfen und Speicherformate bleiben erhalten. Push und native Wear 0.6.1/21 unverändert.

## PWA 0.7.5 · kompakte Einstellungen · 10.11.2026

Einstellungen zeigen acht anfangs geschlossene Themenbereiche: Darstellung & Stadt, Standort & Gehzeit, Störungsbenachrichtigungen, Favoriten & Uhr, App & Installation, Fahrplandaten importieren, Debug Push und Debugging. Ausführliche Erklärungen sind bei der jeweiligen Option aufklappbar. Der Dialogkopf mit Version und 44-px-Schließen bleibt beim Scrollen sichtbar. Alle bisherigen Eingaben, Aktionen, Links, Statusfelder und Erklärungstexte sind erhalten; keine Speicher-/Berechtigungsänderung. Stadtwahl bleibt ausschließlich in Einstellungen.

Debug Push ist direkt erreichbar und bündelt Testnachricht, Zustellstatus, letzten Dienstlauf und lokalen Anzeigetest. Der bestätigte Worker-Auftrag und die getrennten App-/Komponentenupdatehinweise aus 0.7.4 bleiben erhalten. Die physische lokale Benachrichtigungsanzeige am Zieltelefon muss weiter geprüft werden. Native Wear 0.6.1/21 und sämtliche Gerätefreigaben bleiben unverändert.

## PWA 0.7.3 · automatische Ortung nach manueller Stadtwahl · 09.11.2026

Rückkehr von einem manuell gesetzten Stadtzentrum zu Automatisch prüft die vorhandene Standortberechtigung erneut und startet bei bereits erteilter Freigabe wieder die Vordergrundortung. Es wird keine neue Freigabe angefordert. Eine noch laufende Berechtigungsprüfung darf einen späteren ausdrücklichen Stopp nicht aufheben. Schnelle manuelle Profilwechsel verwerfen überholte Katalogantworten, bevor diese die Position verändern. Vier Regressionen ergänzen insgesamt 301 Web-/Server-Tests; zehn Python-Prüfungen und 67 JavaScript-Syntaxprüfungen. Native 0.6.1/21 unverändert.

## PWA 0.7.2 · getrennte Verkehrsmittel und manueller Neustart · 09.11.2026

Bei der Salzburger Abnahme bestätigt: Derselbe öffentliche Linienname „3“ kommt für Bus und S-Bahn vor. Gruppen und Vollbildfokus berücksichtigen deshalb zusätzlich den echten Modus; eine Bus-Auswahl zeigt keine gleichnamige Bahn. Vorhandene Favoritenidentitäten bleiben erhalten, gespeicherte Modusangaben werden beachtet. Manuell gewählte Stadtprofile starten nach Reload wieder beim öffentlichen Stadtzentrum, ohne zusätzliche GPS-Freigabe oder gespeicherten GPS-Fix. Reiner Text für anfangs leere regionale Linien korrigiert. Native 0.6.1/21 unverändert.

## PWA 0.7.1 · Produktionsabnahme der Stadtprofile · 09.11.2026

Nach der echten 0.7.0-Abnahme korrigiert: Beim Stadtwechsel werden die alten Stationskarten und der alte Abrufstand sofort entfernt, bis der neue Katalog bereit ist; verspätete frühere Stadtabfragen bleiben unwirksam. Salzburg Hauptbahnhof wird einschließlich seiner echten eigenen Bahnsteige abgefragt. Die exakte IFOPT-Prüfung bleibt erhalten und verwirft fremde Nachbarstationen. Reale Vergleichsprobe: exactRadius=true lieferte null Abfahrten, der Eltern-/Bahnsteigabruf 16; Ursache bestätigt und als Regression gesichert. Reine EFA-Zielplatzhalter „0“ nicht anzeigen. Linien mit ausschließlich weit entfernten nächsten Fahrplantagen bleiben gedimmt (keine Abfahrt in den nächsten zwei Stunden), die Fahrplandetails bleiben zugänglich. Neue Shell-Version nach bereits installiertem QA-Stand; native 0.6.1/21 unverändert.

## PWA 0.7.0 · Fahrplan, Stadtprofile und Push-Diagnose · 09.11.2026

Unabhängiger Wiener GTFS-Fallback für 1.695 Stationen, gültig 09.11.–12.12.2026; kalendergültige Fahrgastabfahrten, Nachtfahrten, Sommerzeit und Paketversionen geprüft. Frische Live-Verbindungen haben Vorrang, fehlende Richtungen erhalten klar gekennzeichnete Fahrplanzeiten. Benötigte Pakete bleiben lokal für den Offline-Zugriff erhalten. Noch kein automatischer GTFS-Neuimport/Deploy.

Dieselbe PWA unterstützt Wien, Graz, Linz und Salzburg. Wien ist Standard, frische genaue Vordergrundortung kann automatisch wechseln. Manuelle Auswahl ausschließlich unter Einstellungen → Stadtprofil. Wiener Favoriten/Einstellungen bleiben erhalten. Graz über Transitous-Echtzeit, Linz über bestätigte EFA-IFOPT-Kennung mit Transitous-Ersatz, Salzburg zunächst Fahrplan. Gemeinsames Budget und 30-Sekunden-Sichtbarkeitsgrenzen; keine regionalen Störungs-/Push- oder Adressversprechen. Uhr 0.6.1/21 bleibt unverändert, regionale QR-Auswahl ausdrücklich gesperrt.

Testnachricht, Zustellstatus und lokaler Anzeigetest liegen unter Einstellungen → Debug Push (eingeklappt). Anbieterannahme bleibt von Geräteempfang/Anzeige getrennt. Begrenzte lokale Empfangsschritte ohne Inhalte/Geheimnisse, explizite Testtransporte mit hoher Dringlichkeit bei weiterhin lautloser Anzeige. Für den gemeldeten ausgebliebenen Test ist Anbieterannahme ohne Browserbestätigung belegt; die konkrete Android-Ursache ist nicht bewiesen. Kein automatischer Neuversand allein wegen fehlender Bestätigung.

## PWA 0.6.7 · Störungs-Push · 09.11.2026

Standard-Web-Push ausschließlich für die PWA; kein eigenes Firebase-Projekt und kein neues Uhr-Release. Dauerhafte verschlüsselte D1-Outbox mit eindeutigem Geräte-/Ereignisschlüssel, atomaren Claims, höchstens vier Transportversuchen und Retry-After. Anbieterannahme bleibt endgültig, fehlende Browserbestätigung löst keine Wiederholung aus. IndexedDB-Gerätebindung und atomare Anzeige-Claims; vor Anzeige aktuelle Ereignisrelevanz, Opt-out, Ablauf, Nachtruhe und tatsächliche Fenstersichtbarkeit prüfen. Lautloser gemeinsamer Tag; eigener Zustellstatus für explizite Testnachrichten. Aufzüge/Fahrtreppen immer serverseitig ausgeschlossen, auch für alte Freigaben; gemischte echte Betriebsstörungen bleiben relevant. Geplantes erst ab Beginn. Bestehender stündlicher Check, aktive Fünf-Minuten-Ergänzung und lokale Daten erhalten. Native Wear 0.6.1/21 unverändert.

## PWA 0.6.6 · Meine Orte übersichtlicher · 09.11.2026

Kompakte Ortskarten mit klarer Namens-/Adresshierarchie, gleich breiten Start-/Zielaktionen und einem Ortsmenü für Bearbeiten/Entfernen. Vorhandenen transienten Menücontroller wiederverwendet, 44-px-Aktionen und volle Namen erhalten. Add/Edit als fokussierte Formularansicht mit Suchsymbol, Speichern und Abbrechen; keine lange Liste oberhalb des Editors. Abbrechen verwirft ausstehende Suchantworten, bewusste Löschbestätigung bleibt. Datenformat, gespeicherte Orte, physische Routenendpunkte, Dienste und native Wear 0.6.1/21 unverändert.

## PWA 0.6.5 · mobile Reiseübersicht · 09.11.2026

Kleinerer Routentitel, Start/Ziel als A/B-Zeilen und gespeicherte Ortslabels getrennt von der physischen Adresse. Eigene Favoritennamen sowie Ein-/Ausstiegsstation bleiben sichtbar. Standardnamen aus beiden Endpunkten und die zweite große Überschrift bei gespeicherten Wegen entfallen als doppelte Darstellung. Zurück, Titel und Stern bilden eine Zeile; Rückfahrt, Neuplanung und Fußweg-/Standortaktualisierung eine kompakte Aktionsreihe. Reise/Gesamtkarte ersetzt den doppelten Karteneinstieg. Tippflächen mindestens 44 px, kein Abschneiden langer Namen. Keine Änderung an Planung, Favoritendaten, Abrufgrenzen oder nativer Wear-APK 0.6.1/21.

## PWA 0.6.4 · gleiche Haupttabs auch auf kleinen Displays · 09.11.2026

Hauptnavigation auf Start- und Reiseseite verwendet für Buttons und Links dieselbe einzeilige Flex-Darstellung und mindestens 44 px Höhe. Überflüssige feste Leerzeichen entfernt; bei höchstens 340 px bleiben Beschriftung, Icon und Favoritenanzahl mit kompakter Schrift in einer Zeile. Ergänzt die Reise-Dichte, gemeinsame Kopfzeile und Abfahrtshinweise aus 0.6.2/0.6.3. Native Wear 0.6.1/21 unverändert.

## PWA 0.6.3 · dezente Abfahrtshinweise · 09.11.2026

Neutrales „Zeit korrigiert · ca. +N Min.“ bei später gemeldeter Live-Prognose derselben geplanten Abfahrt. Identität aus RBL, Linie, Richtung, Modus und Planzeit; mindestens 30 Sekunden Verschiebung, beide Abrufe frisch und der zweite neuer. Kein Warnsymbol, keine Störungsbehauptung und kein Push. Cold-Start-Cache, neue Züge, unklare Identitäten und Fahrplan → erste Live-Prognose lösen keinen Hinweis aus. Anzeige höchstens zwei Minuten und nur solange die Daten frisch bleiben; rein lokale flüchtige Metadaten.

Rollstuhl-Symbol je Abfahrt nur bei explizitem `barrierFree: true`, mit Fahrzeug-Override vor Linienvorgabe. Unbekannt/false/veraltet/Fehler bleiben unmarkiert. Beschriftung und Tooltip beziehen sich auf das Fahrzeug, nicht auf Station oder gesamten Reiseweg. Monitor/Favoriten, Vollbild-Verbindung und Reise-Abfahrten verwenden dieselben Regeln. Kein zusätzlicher API-/GPS-Aufruf, unveränderte QR-/Favoritenformate und native APK 0.6.1/21. Enthält die kompakteren Reiseabschnitte und den einheitlichen Kopf aus 0.6.2. [Datenvertrag](departure-indicators.md).

## PWA 0.6.2 · kompakte Reiseansicht und einheitlicher Kopf · 09.11.2026

Bahnsteig/Abfahrtszeit beim Stationskopf statt in einer zusätzlichen Abfahrtszeile, kompakte Absatz-/Karten-/Variantenabstände. Fußwege mit Start → Ziel zusammen; gleiche bekannte Stations-ID wird einmal mit beiden Bahnsteigen gezeigt. Alle Stations-/Verbindungs-/Kartenaktionen behalten mindestens 44 px Tippfläche. Logo, Slogan, Version, Teilen/Einstellungen und die waagerechte Hauptnavigation entsprechen der Startseite. Der gemeinsame Link-Tab-Stil verwendet Flex statt Grid, damit Icon/Text nebeneinander bleiben. Heller/dunkler Erstaufbau nutzt dieselbe gespeicherte Theme-Auswahl. Route, Etappenfokus, Abfahrtsbudget und gespeicherte Favoriten unverändert. PWA-/Shell-Version 0.6.2; native APK/Feed 0.6.1/21 unverändert.

# Release-Verlauf

## GitHub und Dokumentation · 09.11.2026

Öffentliche Erstveröffentlichung des freigegebenen 0.6.0-Quellpakets und erfolgreicher erster GitHub-CI-Lauf. Anschließend Abgleich mit dem inzwischen veröffentlichten Stand 0.6.1. Aktuelle Projekt-, Entwicklungs-, Architektur-, Konfigurations-, Build- und Betriebsanleitungen konsolidiert; alte Anweisungen als Historie erhalten. Source-Download um zuvor fehlende Migrationen, Drizzle-Konfiguration, CI und Bibliothekslizenz vervollständigt. Kein neuer nativer Funktionsrelease und keine ersetzte APK.

## 0.6.0 · Störungsbenachrichtigungen · 09.11.2026

Veröffentlicht und öffentlich geprüft: PWA-Push verfügbar, nativer FCM-Empfang weiterhin unkonfiguriert. Stundentakt und Routenfilter in den Einstellungen sichtbar; Quellen-/Versandprüflauf nach Aktivierung erfolgreich. 244 Web-/Server-, 119 native und acht Python-Tests bestanden. Uhr-APK 0.6.0/20 öffentlich heruntergeladen und bytegleich zum Original-Build geprüft. Tatsächlicher Empfang erfordert Aktivierung/Test auf dem jeweiligen Gerät; Browser der Cloud-Abnahme hat Benachrichtigungen bereits verweigert.

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

## PWA 0.1.29 · 08.11.2026

Kopfzeile: gleiche 44-px-Tippflächen, 22-px-SVGs und Strichstärke 1,8 für Teilen/Einstellungen. Native Version unverändert 0.3.6.

A-nach-B ist als technische Grundlage vorbereitet, noch keine nutzbare öffentliche Suchfunktion. Siehe [Stand und Datenzugang](journey-planning.md).

## PWA 0.1.28 · 08.11.2026

Auf der Hauptseite erscheint bei verfügbarer neuer PWA-Version ein Hinweis mit **Jetzt aktualisieren**. Prüfung beim Start und alle fünf Minuten nur bei sichtbarer App; keine automatische Neuladung. Update aktiviert den vorbereiteten Worker und lädt die App neu, Favoriten/Einstellungen bleiben erhalten.

App teilen ersetzt das Aktualisieren-Symbol im Kopf. Natives Teilen-Menü mit öffentlicher App-Einladung; ohne Unterstützung oder bei Browserfehlern Dialog mit Link kopieren und bewusstem WhatsApp-Link. Nativer Abbruch ohne weiteren Dialog, keine automatische Übertragung oder Kopie. Offline-Shell enthält das neue Modul. Automatische Abfahrtsaktualisierung unverändert, Wear 0.3.6 unverändert.

## PWA 0.1.27 / Wear 0.3.6 · 08.11.2026

- Favoritensortierung einheitlich Nähesten zuerst; zusätzlicher PWA-Standort-/Luftlinie-Hinweis entfällt bei vorhandener Position.
- Bisherige Sortierwerte und lokale Favoriten bleiben erhalten. Wear 0.3.6 / Code 13.
- [A-nach-B-Reiseplanung](journey-planning.md) für PWA/Uhr mit Umstiegen und passenden Abfahrten aufgenommen; noch keine Routingfunktion aktiviert.

## PWA 0.1.26 / Wear 0.3.5 · 08.11.2026

- Stationslinien anhand kalendergültiger Fahrgastfahrten im offiziellen GTFS bereinigt; Fahrwegvarianten bleiben interne Kandidaten. Westbahnhof ohne falsche reguläre 1-/2-Zuordnung.
- Zentrale passive Bestätigung je Linie für 30 Tage, gemeinsame Daten für PWA/Uhr und lokale Offlinekopie. Kein Erneuern fremder Linien durch einen Stationsabruf.
- Konservative Alterung nur nach ausreichenden vollständigen Abfragen; Nacht-/Rufbus-/Fahrplannachweis geschützt, Wiederauftauchen sofort übernommen.
- Keine zusätzlichen WL-/GPS-Hintergrundabfragen, keine Favoritenänderung. Wear 0.3.5 / Code 12 mit ursprünglichem Schlüssel.

## PWA 0.1.25 · Kompakte Linienauswahl · 08.11.2026

Linienbadges in Stationskarten mit dichterem, gleichmäßigem Umbruch: keine zusätzlichen Flex-Gaps um die weiterhin mindestens 44 × 44 px großen Tippflächen, besser ausgefüllte sichtbare Badges. Verkehrsmittel und Erklärung gedimmter Linien erhalten eigene Zeilen unter der Auswahl statt konkurrierender Flex-Elemente. Schmale Karten mit kleineren Außenabständen; Farben und Verbindungsaufruf erhalten. Wear bleibt 0.3.4 / Code 11.

## PWA 0.1.24 / Wear 0.3.4 · 08.11.2026

Bildschirmfüllendes PWA-Verbindungsdetail mit fokussiertem Monitorabruf, Back/Forward und Rückkehr zur Listenposition. Gedimmte unbestätigte Linien; Fahrzeug-Kurzführungen korrekt zuordnen. Native Nähe-/Favoritenansicht mit gemeinsamem Stationskopf, Gehinfo und Zeilenlayout; neutrale Katalog-/Leer-/Altstände bleiben erreichbar. Wear 0.3.4 / Code 11. Bestehende Signatur, Paket, lokale Daten und QR-Transfer-Lifecycle erhalten. Keine neue Push-Aktivierung oder ÖBB-Livequelle.

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

Direkter Watch-Push ist im nativen Code vorbereitet: ausdrücklicher Opt-in, Android-Freigabe, Favoriten/alle Linien, Nachtruhe, Aufzüge, Test/Abmeldung und begrenztes lokales Hinweisarchiv. FCM plus Firebase Installations nur nach Opt-in; keine Analytics/Auth/Firestore/Hosting/Functions. Kein Hintergrund-GPS oder Abfahrts-Polling. Google verarbeitet Zustellkennung und Nachrichtentext, unser bestehender Dienst verschlüsselte Minimalfilter. Firebase-Projekt/Serverfreigabe und physische Zustellung sind noch nicht verbunden/geprüft. PWA verwendet weiterhin standardmäßigen Web Push. PUSH_SCHEDULER_ENABLED=false bleibt bis zum nachgewiesenen Hintergrundbetrieb erhalten; ein begrenztes Site-Werkzeug prüft während der Einrichtung ausschließlich die offizielle Quelle. [Betrieb und Konfiguration](push-notifications.md).

Wear 0.3.0 / Code 7, Paket at.andrew.foamawien und ursprüngliches Zertifikat. Update: Mehr → App & Updates → Auf Update prüfen; nicht deinstallieren. 139 Node-, 77 native Android- und drei Python-Prüfungen; native Beispielrenderings. Browser bestätigt gemeinsame Karten und Bewegung ganzer Stationsgruppen; weiterer Vorschauzugriff durch interne URL-Policy blockiert, kein behaupteter kompletter mobiler Browser-Rundlauf. Physische Watch-/Push-Abnahme separat. ÖBB/S-Bahn-Datenquelle weiterhin offen.

## Frühere Releases

## PWA 0.1.20 · Optionale Störungsbenachrichtigungen · 08.11.2026

Mehr → Einstellungen → Störungsbenachrichtigungen. Favoriten oder alle Wiener-Linien-Linien, optionale Aufzugsmeldungen/Nachtruhe, ausdrücklicher Opt-in, Testnachricht und Abmeldung. Semantisch deduplizierte Sammelhinweise, 30 Minuten Abstand und sechs automatische Hinweise pro Wiener Tag. Push-Registrierung und minimale Filter verschlüsselt in D1, Schlüssel ausschließlich Hosting-Secrets. GPS/Abfahrten unverändert nur sichtbar; Wear 0.2.4 bleibt unverändert. Implementierung und produktiver manueller Quellen-/Gerätefreigabetest erfolgreich. Automatischer Hintergrundlauf der Plattform fehlgeschlagen und pausiert; Push-Aktivierung bleibt deshalb gesperrt. Docker-Timer für einen separaten Server vorbereitet, noch nicht gestartet. [Details, Datenhaltung und Abnahme](push-notifications.md).

## PWA 0.1.19 · Kompaktere Stationsabfahrten · 08.11.2026

Weniger vertikaler Leerraum zwischen Linien derselben Station in Nähe und Favoriten. Nähe-Zeilen mindestens 64 statt 76 px, Abstand zwischen Linienbadge und Richtung 2 statt 6 px; Favoritenzeilen ohne eigene Interaktion mindestens 40 statt 44 px, Gruppengap 2 statt 5 px. Lange Richtungen wachsen weiter natürlich. Hauptzeit 28 px und feste Zeitspalten bleiben erhalten. Linien-Favoritenknopf in Nähe mit 44 × 44 px Tippfläche innerhalb seiner Zeile. Keine Daten-, Abruf-, Speicher- oder native Änderung; Wear 0.2.4 / Code 5 unverändert.

JSON-Exporte: YYYYMMDD_foama-wien-…json, Exportdatum in Wiener Zeit; Favoriten, Watch-Transfer-Download und Diagnoseprotokolle. Produktive Browserprüfung: verschlüsselter JSON-Upload, Empfänger-Entschlüsselung, bestätigter PWA-Import und sofort gelöschter Ciphertext erfolgreich. Temporäre Prüffläche entfernt.

# PWA 0.1.18 / Wear 0.2.4 · QR-Favoritenübertragung · 08.11.2026

Mehr → Favoriten → Mit Handy übertragen auf der Uhr. Vom Handy empfangen oder Ans Handy senden wählen und QR-Code mit der Handy-Kamera scannen. Die eigenständige Übertragungsseite nimmt lokale PWA-Favoriten oder einen JSON-Export an. Auf der Uhr Vorschau prüfen und ausdrücklich übernehmen; auf dem Handy PWA-Import oder JSON-Download wählen. Bestehende Favoriten bleiben erhalten, Duplikate werden übersprungen. Beide Geräte bleiben unabhängig, keine dauerhafte Synchronisierung.

# PWA 0.1.17 · 08.11.2026

Hinweis zur manuellen Reihenfolge und sämtliche Keine-/Lade-/Teilprüfungs-Texte für Betriebsmeldungen entfernt. Relevante Meldungen erscheinen ausschließlich bei vorhandenen Einträgen zusätzlich in einer eigenen, aufklappbaren Karte **Warnmeldungen**, mit Titelvorschau und Anzahl. Sie enthält Linien-/Haltestellenbezug, Gültigkeit, Quelle und Kennzeichnung älterer Daten. Kein Platzhalter und keine Entwarnung bei fehlenden Daten. Stationsbezogene Detailhinweise bleiben erreichbar.

101 Node-Tests bestanden. Browserprüfung beider Themes und Leerzustand; kein nativer Neubuild, Wear 0.2.3 unverändert.

# PWA 0.1.16 / Wear 0.2.3 · 08.11.2026

PWA: alle sechs Verkehrsmittel bleiben auch bei 320 px in einer Reihe, mit mindestens 44-px-Tippflächen. Suchradius im Filterkopf. Kurze Sortier- und Betriebsinfos stehen innerhalb der jeweiligen Karte; ausführliche Stationsmeldungen bleiben erhalten. Keine neue API-, Standort- oder Speicherlogik.

Wear: kompakter Hauptschalter mit Pin/Stern neben Nähe/Favoriten, höchstens 184 dp breit. Sichtbare Leiste 36 dp hoch, volle 48-dp-Tippflächen. 12-sp-Beschriftungen, Auswahlzustand und bewährte Mehr-/Zurück-Gestaltung erhalten. Ursprüngliches Zertifikat, Paket und lokale Daten bleiben bei einem Update erhalten. QR-Transfer weiterhin nicht aktiviert; JSON-Export in der PWA unter Mehr → Einstellungen → Favoriten sichern.

97 Node- und 54 native Android-Tests, native Runddisplay-Renderings und responsive Browser-QA bestanden. [Signiertes Paket und Prüfgrenzen](wear-os-release-0.2.3.md).

# PWA 0.1.15 · Favoriten verschieben

Nach oben/unten schließt nun das Bearbeitungsmenü und verschiebt genau den ausgewählten gespeicherten Favoriten. Ein zuvor offenes Menü kann sich nach Neuzeichnen nicht durch alte Toggle-Events wieder öffnen; nur ein Menü ist gleichzeitig offen. Außenklick und Escape schließen ebenfalls, Escape setzt den Fokus auf den Menüknopf zurück. Der verschobene Favorit erhält den Fokus ohne automatisches Scrollen.

Stabile Schlüssel für Verschieben/Entfernen bewahren die Zuordnung nach vorangegangener Sortierung oder Neuzeichnung. Stations- und Verbindungsfavoriten, eigene Reihenfolge und Betriebsmeldungs-Klappzustände bleiben erhalten. 97 Tests, Browserprüfung beider Richtungen und Persistenz nach Reload bestanden. PWA-Shell/Importqueries auf 0.1.15; Wear-APK bleibt 0.2.2.

# PWA 0.1.14 / Wear OS 0.2.2 · 07.11.2026

PWA: Verkehrsmittel im eingeklappten Filter über sechs klar markierte Symbole direkt ein-/ausschalten. Ausgeschaltete Modi bleiben erreichbar; Aktivierung mit Häkchen und aria-pressed. Erweiterte Filteransicht bleibt synchron. Dein Standort startet eingeklappt, lässt sich unabhängig aufklappen und behält Status/Kartenaktion im Kopf. Bestehende Filter-/Favoriten-/Standortfreigaben und Datenschlüssel erhalten. Neue transport-controls.mjs im Offline-Cache; 89 Node-Tests und Browserprüfung bestanden.

Wear: Pin-/Stern-Segment für Nähe/Favoriten; bewährte Mehr-/Zurück-Stile erhalten. Linkes/rechtes Wischen, Zurück-Button und Android-System-Back verwenden denselben Elternpfad. Native Activity-Dismiss wird intern abgefangen; Schließen erst auf der Hauptseite. SCREEN_OFF/Activity-Pause stoppen GPS, Timer und laufende/queued HTTP-Anfragen; verspätete Antworten dürfen keine Daten mehr übernehmen. Abfahrten maximal zehn Minuten / 3.000 Zeilen / 512 KiB, Bereinigung beim Öffnen und Verlassen. Temporäre APKs maximal 8 MiB und Entfernung bei Fehler, Abbruch oder Übergabe; fehlgeschlagene Installer-Sitzungen werden aufgegeben. Favoriten/Einstellungen erhalten. 54 Android-Tests, Signatur und Paketmetadaten geprüft; [Details](wear-os-release-0.2.2.md).

# Wear OS 0.2.1 / PWA 0.1.13 · 07.11.2026

Native Darstellung an den interaktiven Entwurf angenähert: Stationskopf und kompakte Linie/Richtung/Minuten-Zeilen, dunkle Flächen, deutlich ausgewählte Tabs. Mint nur für Hauptaktionen, gedecktes Grün für Auswahl, dezentes Rot für Entfernen, ruhiges Zurück. Mehr gruppiert Standort & Nähe, Gehen & Reserve, Favoriten sowie App & Updates.

Neue foreground-only Standortsuche mit verfügbarem Plattform-fused-Provider, getrennt abgesicherten Quellen, Cacheprüfung aller geeigneten Anbieter, achtsekündigem Fallback und 30-Sekunden-Zeitlimit. Grobe Fixes bleiben nutzbar und ungewiss; stumme Quellen, verweigerte Freigaben und ausgeschaltete Ortung führen zu konkreten Aktionen. Späte verworfene Quellen dürfen einen guten Fix nicht ersetzen.

39 Android-Tests und Signatur-/Paket-/Ausrichtungsprüfung bestanden. Ursprüngliches Zertifikat, Paket at.andrew.foamawien, Version Code 2. Erneute Geräteprüfung erforderlich. Update aus 0.2.0 über Mehr → Auf Update prüfen; danach Mehr → App & Updates. [Release und Prüfgrenzen](wear-os-release-0.2.1.md).

# PWA 0.1.13 · 07.11.2026

Abfahrtswerte an festen Spalten ausgerichtet. Qualitätslabel und nächste Abfahrt erhalten gleichbleibende Breiten, unabhängig von Minutenanzahl oder LIVE/FAHRPLAN/ÄLTER. Die 28-px-Hauptzahlen bleiben erhalten. PWA und Uhr-Webseite sind direkt in beide Richtungen verlinkt. Wear-APK weiterhin 0.2.0, kein neuer Watch-Download erforderlich.

# Wear OS 0.2.0 / PWA 0.1.12 · 07.11.2026

Erste native signierte Watch-Testversion: Nähe, lokale Favoriten, große Verbindungsdetails; klare kleine Mehr-Seiten. Bestehendes Java-Projekt und Paketidentität erhalten, CLI-Build ohne Nutzer-PC-Entwicklungstools. Reale WL-Daten über eigenen Relay, 30-s-/24-RBL-Grenzen, Teilcache/Backoff und ehrliche Standort-/Datenunsicherheit. 26 Android-Tests sowie Signatur/Metadaten geprüft. Echte Watch-Abnahme und QR-Transfer weiter offen. Download & Installation unter /wear.html.

PWA Hell/Dunkel/System verfügbar und öffentlich kontrolliert; helle Dialogkontraste korrigiert. Dokumentation aktualisiert und mit öffentlichen Quellen als Download bereitgestellt.

## v0.1.12 – 07.11.2026

- Aussehen in Einstellungen mit drei Umschaltknöpfen: System, Dunkel und Hell. Standard System; explizite Auswahl bleibt im vorhandenen lokalen Settings-Objekt. System reagiert auf Änderungen der Geräteanzeige.
- Hellpalette für Listen, Karten, Dialoge, Formulare, Menüs und Warnungen; offizielle Linienfarben und große Abfahrtszahlen unverändert. Frühe Anwendung vor dem Stylesheet vermeidet einen unnötigen Farbschemawechsel beim Start.
- Standortstatus bleibt ausschließlich in Dein Standort; Stationsfavoriten bleiben kompakt. 83 JS-Tests einschließlich Systemwechsel und expliziter Theme-Wahl.
- Dokumentation konsolidiert und nativer Wear-Build vorbereitet: Android API/Build Tools 34 und ZXing aus offiziellen Quellen mit Prüfsummen bereitgestellt; vorhandener CLI-Builder kann den vorhandenen Java-17-Compiler ohne separate javac-Startdatei verwenden. Noch kein APK-Erfolgsnachweis in diesem PWA-Release.

## v0.1.11 – 07.11.2026

- Stationsfavoriten kompakter: Mindestzeilenhöhe von 66 auf 44 px, Abstand zwischen Richtungen von zehn auf fünf Pixel. Weniger Abstand an Gruppentrennern, Meldungen und zwischen Richtung/Erreichbarkeit.
- Haupt-Abfahrtszahlen bleiben 28 px, zweite Zeit 17 px. Mehrzeilige Richtungsnamen dürfen Zeilen weiterhin vergrößern; kein Abschneiden von Daten.
- Standortstatus bleibt in Dein Standort zusammengeführt; Sortierknöpfe und Live-Priorität erhalten. 80 bestehende Regressionstests; öffentliche Größen-/Anzeigeprüfung.

## v0.1.10 – 07.11.2026

- Standortstatus in „Dein Standort“ integriert: aktiv, unterwegs, ungenau, letzter Fix, Akkupause, manuell und Berechtigungs-/Empfangsfehler an einer Stelle. Status mit Farbindikator, Genauigkeit/Alter und 30-s-Abfahrtsinfo innerhalb der Karte.
- Separates Standortbanner entfernt; der obere Hinweis bleibt für API-/Katalog-/Startfehler erhalten. Bei API-Backoff keine normale 30-s-Aktualisierung in der Standortkarte behaupten.
- Bestehende Standort-/Sensorlogik, Karten und Datenhaltung unverändert. Versionierte Offline-Shell erneuert; 80 Regressionstests und öffentliche Prüfung der zusammengeführten Anzeige.

## v0.1.9 – 07.11.2026

- Stationskarten mit klarer Namens-/Gehweg-Kopfzeile und expliziter Kartenaktion statt Personen-Icon. Favoritenstern als eigener, gut erreichbarer Knopf; Linien und Verkehrsmittel in separater ruhiger Zeile.
- Kleine schwebende Abfahrten-Schaltfläche durch vollbreite Vorschau mit Linie/Richtung, nächster Abfahrtszeit und auf-/zuklappendem Chevron ersetzt. Aufgeklappter Zustand, Fokus und zugehöriger Inhaltsbereich zugänglich ausgezeichnet.
- Einheitlich große nächste Abfahrtszahlen (28 px) in Vorschau, Stationsabfahrten, Einzel- und Stationsfavoriten. Zweite Abfahrt bleibt kleiner (17 px); Live-/Fahrplan-/Älter-Kennzeichnung erhalten. Kein Verkleinern der Hauptzeit bei kleinen Displays.
- Vorhandene Karten-/Favoriten-/Meldungs-/Sortier- und API-Logik bleibt erhalten; keine neuen Abfragen durch die Darstellung.
- 80 bestehende Regressionstests; öffentliche visuelle Prüfung sowie Auf-/Zuklappen, Stern und Kartenaufruf. Keine neuen Tests ausschließlich für reversible Darstellung.

## v0.1.8 – 07.11.2026

- Favoriten-Sortierung mit zwei direkt sichtbaren Umschaltknöpfen „Meine Reihenfolge“ und „Nächste zuerst“ anstelle des Dropdowns. Aktive Auswahl visuell und mit aria-pressed markiert; Tippfläche mindestens 44 px.
- Bestehende Auswahl, manuelle Ordnung und Live-Priorisierung erhalten. Erneutes Antippen der aktiven Option startet keine weitere Aktualisierung.
- Offline-Shell/Versionsabfragen erneuert. Bestehende 80 Regressionstests und öffentliche Bedienprüfung; keine zusätzlichen Tests nur für die reversible Kontroll-Darstellung.

## v0.1.7 – 07.11.2026

- Haltestellengebundene Kurzmeldungen anderer Haltepunkte nicht mehr an jede Station derselben Linie verteilen. Identische Zusammenfassungen zusammenfassen; eine passende kurze Standardmeldung tritt hinter die ausführliche Meldung desselben Ereignisses zurück. Richtung, andere Zeiträume und einzelne Lift-/Rolltreppenstörungen erhalten. Bereits gespeicherte Meldungen werden beim Anzeigen bereinigt.
- Stationsnamen/Adresse/Navigation auf der Standortkarte um „Haltestelle merken“ ergänzt, einschließlich Listenalternative. Ohne Kartenwechsel lokal speichern; vorhandene ganze Stationsfavoriten anzeigen und Duplikate verhindern.
- Favoriten wahlweise „Meine Reihenfolge“ oder „Nächste zuerst“, Auswahl lokal gespeichert. Entfernung als ungefähre Luftlinie. Sortieren verändert die gespeicherte manuelle Reihenfolge nicht; Auf-/Ab-Pfeile nur im manuellen Modus.
- Live-Abfrage folgt derselben Reihenfolge. Bei mehr als 24 RBL: erste 16 je Aktualisierung, weitere acht rotierend; kleine Listen vollständig. Doppelte Stationsfavoriten verbrauchen keine zusätzlichen RBL-Slots. Weiter nur ein Request pro 30 Sekunden bei sichtbarer App, Backoff und ehrliche Alterskennzeichnung erhalten.
- Hinweis „App-Symbol noch alt?“ entfernt; Installationshilfe bleibt verfügbar.
- 80 automatische Tests. Echte Brunnengasse-Antwort reproduziert: sieben rohe Einträge ergeben eine detaillierte Meldung. Physische Android-/Akkuabnahme bleibt separat.

## v0.1.6 – 07.11.2026

- Optional unter Einstellungen → Standort: „Bei wenig Bewegung Akku sparen“; standardmäßig aus, Auswahl lokal gespeichert.
- Niedrigfrequenter Bewegungssensor plus frische/stabile Standorte erlauben kurze echte Ortungspausen. Sofortige Wiederaufnahme bei erkannter Bewegung und Kontrollversuch spätestens nach einer Minute; kein Stillstand allein aus einem ruhigen Sensor ableiten.
- Normaler Standortpfad bei Tunnel-/Sensorproblemen; keine grüne Geh-Ampel während der Pause. Sensoren und Timer stoppen im Hintergrund oder bei manuellem Start.
- Keine Sensor-/Positionsprotokollierung oder neue Hintergrundarbeit; 30-s-Abfahrtsabrufe, Favoriten und App-Identität bleiben erhalten.
- Checkboxen in Einstellungen neben dem Text ausgerichtet, mit größerer Tippfläche.
- 70 automatische Tests; physischer Android-Sensor-/Akkutest noch offen. [Details](motion-battery-saving.md).

## v0.1.5 – Ergänzter Funktionsumfang

- Standortkarte mit bis zu 60 passenden Stationen, Linienkacheln, Suchradius, anklickbaren Informationen und Listenalternative.
- Offizielle Monitor-Betriebsmeldungen und linienweite Hinweise aus `trafficInfoList` (serverseitiger Cache 120 Sekunden). Station, Linie, Zeitraum, geplant und Datenalter unterscheidbar; abgelaufene/erledigte Hinweise ausblenden. Kein zusätzliches Abfrageintervall im Telefon.
- Fehlerprotokoll im geschlossenen Einstellungsbereich Debugging. Roh-API-Tester aus normalem UI entfernt; alte Diagnose-Links zeigen eine Umzugsmeldung.
- Standort kompakter, Favoritenmenü hinter ⋯, Erreichbarkeit pro Verbindung. Leaflet lokal gebündelt; kontrastreicher Kartenfehler und alternative Stationenliste.
- 60 automatische Tests einschließlich Meldungszuordnung, Cache-Fehlerisolation, Kartenfilter und tatsächlichem datensparsamem JSON-Exporthandler.

## v0.1.5 – 07.11.2026

- Nachtlinien (N-Präfix, einschließlich Nacht-Rufbus) mit dunkelblauem Hintergrund `#162A63` und weißer Schrift in allen bestehenden Linien-Badges.
- Stationskarte zeigt die ungefähre Straße und Postleitzahl des Ziel-Haltepunkts aus dem vorhandenen lokalen Wiener Referenzindex, auch ohne Startposition. Keine gesicherte Hausnummer oder offizielle Stations-Postadresse behauptet, keine neue GPS-Übertragung.
- Neue Offline-Shell und versionierte Einstiegsdateien; PWA-Identität, Icons, Standort-/API-Logik und gespeicherte Favoriten erhalten.

## v0.1.4 – 2026-11-07

- Verkehrsmittel samt Radius einklappbar; Zustand und Auswahl bleiben lokal gespeichert.
- Nähe-Ansicht zeigt ausschließlich Stationen mit bestätigter Zuordnung zu mindestens einem aktivierten Verkehrsmittel. Offline-Linien aus offiziellen Linien-/Fahrweg-CSV-Dateien, ergänzt um lokal gelernte API-Linien. 1.789 von 1.811 Stopgruppen zugeordnet; 22 unzugeordnete Gruppen erscheinen nicht als leere Nähe-Karten. Ein „S“ oder „U“ im Namen beweist keine Linie.
- Sichtbare Linien-Badges auch vor der ersten Live-Antwort. API-Batches berücksichtigen ausgewählte Bahnsteige, verteilen maximal 24 StopIDs über die Stationen und wechseln Bahnsteige/Richtungen zwischen Abrufen.
- Kompakte Standortkarte mit ungefährem Straßenumfeld, PLZ, Genauigkeit und Fix-Alter. Straßenlookup ausschließlich lokal aus einem kompakten Wiener Referenzindex (keine GPS-Übertragung, keine Hausnummern).
- Ungenaue Tunnelpositionen werden verwendet statt mit einer starren ±150-m-Sperre abgelehnt. Ein überlappender guter Fix bleibt bis 90 Sekunden erhalten. Veraltete Positionen sind ausdrücklich als zuletzt bekannt markiert; keine erfundenen Tunnelpositionen.
- „Unterwegs“ bei glaubwürdiger Geschwindigkeit ab 3,5 m/s bzw. zuverlässiger Ortsänderung. Geh-Ampel und optionales Gehweg-Matrixrouting pausieren bei Bewegung, grober/veralteter Position oder Standortfehlern. Nach 45 Sekunden zuverlässig langsamer Bewegung wird der Gehmodus wieder freigegeben; Zeitgrenzen sind Heuristiken, keine Erkennung einer bestimmten Linie/Fahrzeugart.
- Kleine Standortupdates erneuern Alter/Genauigkeit; nur die Stations-Neusuche bleibt auf etwa 40 m begrenzt. Keine GPS-/API-Abfragen im Hintergrund.
- Eigene Standortkarte mit Genauigkeitskreis und Google-Maps-Links. Google-Maps-Fußnavigation zur Station nutzt standardmäßig den Telefonstandort; manuelle Startpunkte bleiben ausdrücklich manuell.
- Bereits geladene Abfahrten anderer Stationen bleiben beim Ortswechsel und bei Fehlern erhalten, höchstens 10 Minuten lokal. Über 90 Sekunden alte Daten bzw. Daten nach fehlgeschlagener Abfrage sind „ÄLTER“, keine Live-/grüne Erreichbarkeitsbehauptung. Vergangene Abfahrten verschwinden.
- 403/429: deutliche Betreiberfehlermeldung, 60–300 Sekunden steigende Wiederholungsabstände; Relay respektiert eine kurze gemeinsame Zugriffspause auch bei neuen StopIDs. Der Anbieterzugriff kann weiterhin zeitweise scheitern; kein Umgehen seiner Sperren.
- Manifest wird aus dem Netz aktualisiert, mit Offline-Fallback und neuen Icon-Dateipfaden. App-ID, Startadresse, lokale Daten und Diagnose bleiben erhalten. Android verwaltet Launcher-/WebAPK-Iconupdates separat.
- 50 automatische Tests bestanden. Physische Android-Bewegungs-/Tunnelprüfung und Start der externen Google-Maps-App müssen auf dem Gerät bestätigt werden.

## v0.1.3 – 2026-11-07

- Eigenes Tram-Symbol statt f-Punkt-Marke; Header/Favicon/PWA-Icons konsistent.
- Farben der aktiven U-Bahn-Linien aus offiziellem Wiener-Linien-Netzplan übernommen.
- Tippen auf Stationsnamen öffnet die Fußwegkarte, Abfahrtsliste hat separaten Knopf.
- Favoriten nach Stationsnamen durchsuchen, ganze Station oder einzelne Verbindung speichern; tatsächliche Linie/Richtung auswählbar, Duplikate erkannt und bestehende Importe erhalten.
- Bestätigt funktionierende GPS-Logik unverändert. 36 Tests bestanden; Metadaten-Prüfung dokumentiert.

# Versionsstand / Release Notes

## v0.1.2 – 2026-11-07

- Fixe untere Menüleiste durch Navigation im Seitenfluss ersetzt, ausreichend Abstand zur Host-Bearbeiten-Schaltfläche.
- Explizite Standortfreigabe auf der Hauptseite und verständliche Fehlerhinweise; bereits gewährte Freigabe wird nur sichtbar weiterverwendet.
- Echter offizieller Haltestellenkatalog (1.811 Gruppen), manuelle Auswahl bleibt möglich.
- API-Relay unter gleicher Site-Origin, Standard-Relay-Test in der Diagnose und konkrete Serverfehlermeldungen.
- Bestehende PWA/Wear-Quellen erhalten. Worker-Auslieferung ohne Framework-Wechsel; neue Offline-Shell und versionierte Einstiege.
- 34 automatische Tests bestanden; tatsächliche Android-Freigabe weiter am Gerät prüfen.


## v0.1.1 – 2026-11-07

- Öffentliche ChatGPT-Sites-PWA: https://foama-wien.endruuu.chatgpt.site
- Vorhandene Oberfläche und Quellen erhalten, kein Framework-Wechsel.
- Eigenständige API-Diagnose, lokale Protokolle und JSON-Export; ohne GPS/Katalog.
- Android-Installationshilfe / browsergesteuerte Installationsaktion.
- Offline-Shell inklusive Diagnose und Manifest; reine statische Konfiguration.
- 27 Node-Tests erfolgreich. Android-/Live-Datenabnahme weiter erforderlich.

**Testversion:** leere offizielle Datenkataloge; keine verifizierten Smartphone-Livedaten, keine Wear-APK, kein gehosteter QR-Relay.


## v0.1.0 – 2026-11-07

- Projektgerüst PWA, Wear OS Native Java und Cloudflare Worker.
- Näherouten, Favoriten, Zügefilter, 30-Sekunden-Monitor, Erreichbarkeitsampel.
- Geo-Bewegungsfilter, nur aktive App; Opt-in für externes Fußwegrouting.
- Wiener-Linien-CSV- und ÖBB-GTFS-Importer, Offline-Katalogspeicherung.
- QR-E2E-Verschlüsselung, Durable Object TTL, Watch Update-Check und SHA-256-Verifikation.
- Tests, Dokumentation, GitHub Actions Debug-APK-Workflow.

**Kein Produktionsrelease:** Keine reale API-Verifizierung, kein ausgelieferter Haltestellen-/ÖBB-Datensatz, keine kompilierte APK, keine Live-Deployment-Adresse. Aktuelle Mockups/Browsertests benutzen rein synthetische Daten.

Produktionsabnahme 07.11.2026: öffentliche HTTPS-Diagnose mit aktivem Service Worker; echter Relay-Test HTTP 200, 1 Monitor / 1 Linie / 14 Abfahrten (Stephansplatz U1 → Leopoldau). Diagnose-JSON im öffentlichen Browser tatsächlich heruntergeladen und geprüft. Health-/Katalog-/Config-/Service-Worker-Endpunkte HTTP 200, Katalog 1.811 Gruppen. Maschinenlesbarer Nachweis: docs/validation-v0.1.2.json. Physische Android-GPS-Freigabe weiterhin auf dem Gerät prüfen.

Favoriten-Dialog: automatische Monitorabfragen der Hauptansicht pausieren, damit sie das Fair-Use-Fenster für eine neu gesuchte Station nicht belegen. Bereits tatsächlich geladene Verbindungen werden kurzzeitig begrenzt gepuffert und beim Speichern sofort angezeigt; beim Schließen startet die normale Aktualisierung wieder.

Öffentliche Abnahme v0.1.4: HTTPS und aktiver Service Worker im Diagnose-UI bestätigt; neuer Relay-Test HTTP 200 mit 1 Monitor, 1 U1-Linie und 14 echten Abfahrten; Diagnose-JSON tatsächlich im Browser heruntergeladen und Format/Version geprüft. In der Nähe echte U1/U3-Abfahrten, U-Bahn-only, gespeicherte Favoriten und Standortkarte geprüft. Öffentliche Stationskoordinaten dienten als manueller Teststart, kein privater GPS-Standort.

Standortkarten-Fix: Leaflet-Ansicht vor dem Berechnen von Suchradius-/Genauigkeitskreis-Bounds initialisieren. Ohne initiale Ansicht konnten getBounds-Aufrufe abbrechen; die öffentliche Browserprüfung hat diesen Fehler sichtbar gemacht.

Nach PWA-Abnahme: Wear-OS-Design 0.1 als separat verlinkte, interaktive Beispieldaten-Vorschau auf derselben Site erstellt. Zwei Hauptansichten plus Verbindungsdetail, sekundäres Mehr-Menü. Native Java-Quellen erhalten, noch keine APK gebaut/ausgegeben.

Prüfung 0.5.1: 242 Web-/Server- und 118 native Tests bestanden. Neue Regressionen unterscheiden beide Karten-Favoritenaktionen und prüfen kombinierten QR-/Dateiimport über die Einstellungen. Öffentliche Browserabnahme erfolgreich: Standortkarte mit öffentlichem manuellem Floridsdorf-Testpunkt, Popup mit beiden getrennten Aktionen, vorausgewählte Haltestelle und aktuelle Linien/Richtungen, U6 Richtung Siebenhirten als einzelner Favorit gespeichert und nach Schließen zurück auf unverändert geöffnete Karte. Bestehende Favoriten erhalten, Speicherrückmeldung auf Karte sichtbar. Öffentliche Uhr-APK heruntergeladen und bytegleich zum signierten Build verifiziert: 3.731.884 Bytes, SHA-256 6843c2f93cbdf3799fe953dd5bd1909c68def222c127ce6d4520881276a2bc83.
