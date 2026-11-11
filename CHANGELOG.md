## PWA 0.11.13 · Störungen zuerst und graue Schemafahrzeuge lesbar · 11.11.2026

Relevante Störungsmeldungen stehen direkt unter Haltestelle, Linie und Richtung, vor der nächsten Abfahrt. Der Hinweisbereich liegt nicht mehr unter Folgeabfahrten und Fahrzeuge im Anflug. Eigener Kopfcontainer erhält delegierte Favoriten-/Richtungsaktionen und den bestehenden Fahrzeugknoten. Bestehende Relevanzfilter, aufklappbare Warnungsdetails, Datenalter und Abrufregeln bleiben erhalten. Neuer PWA-Cache, Wear 0.7.4/26 unverändert.

Graue Fahrzeuge im horizontalen und vertikalen Schema erhalten denselben deckenden grauen Körper mit hellem Symbol wie auf der Stadtkarte, einen dezenten Schatten und ein klar lesbares dunkles Linienlabel mit heller Schrift. Unsicherheit bleibt über Grau erkennbar; keine schwachen transparenten Symbole oder gestrichelten Außenrahmen.

## PWA 0.11.12 · Fahrzeugstart ohne doppelte Flächennutzung · 11.11.2026

Grafischer Datenstand ist der Platzhalter für die Fahrzeugdarstellung, keine zusätzliche große Karte darüber. Solange im gewählten Ausschnitt keine darstellbare Position vorliegt, bleiben Schema/Karte, Haltefolge und die zusätzlichen Stations-/Fahrzeugdetails verborgen. Sobald eine Lage vorhanden ist, verschwindet der Fortschrittsbereich vollständig. Kurz grau gehaltene Lagen bleiben sichtbar; erst nach Ablauf aller Lagen kehrt der Platzhalter zurück. Gilt für Stations-/A-nach-B-Bereiche und die ganze Fahrzeugseite, mit derselben Auswahl, Tracker-ID und Abrufbegrenzung. Kartenmodul erst bei sichtbarer Fahrzeugkarte initialisieren, bestehende Karte und Nutzerausschnitt bei Wechseln erhalten. Neuer PWA-Cache; Wear 0.7.4/26 unverändert.

## PWA 0.11.11 · Standort auf Karten und grafische Fahrzeugbereitschaft · 11.11.2026

Alle interaktiven Leaflet-Karten erhalten einen gemeinsamen blauen aktuellen Standortpunkt, Genauigkeitskreis und 44-px-Zentrierknopf. Nur frische echte GPS-Fixes verwenden; manuelle Stations-/Routenstartpunkte bleiben getrennt. Kein automatisches Verschieben/Zoomen, kein Speichern/Export/Relay der Position. Im Monitor die vorhandene Ortung wiederverwenden; andere Kartenseiten nur bei bereits erteilter Freigabe und sichtbarer Karte, höchstens ein geteilter Watch. Hintergrund/Schließen/Ablauf/Fehler bereinigen. Stationskarte auch bei fehlendem Routenstart oder Routingausfall über denselben Kartenrenderer.

Fahrzeuge im Anflug mit vier grafischen Datenstufen auf ganzer Seite und in eingebetteten Ausschnitten: Strecke, Stationsdaten, Fahrtenabgleich, Bestätigung. Abdeckung, Prognosen, Kandidaten und 1/2-/2/2-Quellenstände explizit. Tatsächlicher Abruf-Countdown einschließlich Backoff, frühestmögliche Bestätigung statt garantierter Fahrzeugzeit, eigene Zustände für wiederholte/fehlende/alte Quellen, keine eindeutige Lage, außerhalb des Ausschnitts, Fehler und Pause. Gemeinsame Abrufregeln erhalten, auch A-nach-B ab Requestbeginn planen. PWA-Cache erneuern; Wear 0.7.4/26 unverändert.

## PWA 0.11.10 · Linie 46 und schnellerer Fahrzeugstart · 11.11.2026

Doppelanzeige durch unterschiedliche offizielle Namen derselben Endstation behoben: Parlament/Volkstheater und Parlament, U Volkstheater. Frische Live-Daten haben für genau diese Verbindung Vorrang, alte Favoriten und Detailverweise bleiben passend. Kein unscharfer Zielvergleich.

Fahrplan-/Fahrzeugkatalog und danach Fahrzeug-/Geometriedaten parallel laden; bis zu vier validierte Linienpakete pro Seite wiederverwenden und laufende gleiche Downloads vereinigen. Fahrzeug-Poller wartet ab Requestbeginn, behält globale 30-s-Sperre/Backoff und zeigt Startfortschritt/Countdown. Zwei frische Quellenstände weiterhin erforderlich. Ganze Linie als 44-px-Button neben Stationsausschnitt. Neuer PWA-Cache, Wear 0.7.4/26 erhalten.

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

382 Web-/Server-Tests, 15 Python-Prüfungen, 79 JavaScript-Syntaxprüfungen. Alle veröffentlichten Datenpakete, horizontale Darstellung, Lebenszyklus, Stations- und A-nach-B-Abrufgrenzen geprüft. Fünf neue reale U3-/49-/48A-Proben bestätigen fortschreitende Schätzlagen und stabile IDs; U3 mit fünf modellbasierten Stationsübergaben. Kein Nachweis physischer Wagenidentität. Browser-Abnahme weiterhin durch URL-Richtlinie blockiert. [Datenmodell und Grenzen](docs/vehicle-pilot.md).

## PWA 0.10.2 · kompakter Footer · 11.11.2026

Monitor-Footer trennt Metadaten und gemeinsame Linknavigation. Lizenzen stehen bei den übrigen Links; alleinstehender Trennpunkt und zusätzliche Abstände zwischen umgebrochenen Linkzeilen entfallen. 44-px-Tippflächen bleiben erhalten. Installierte Monitor-PWA nutzt unten nur 20 px plus Safe Area; Browser-Editor-Abstand und andere Seiten behalten ihre bisherigen Regeln. Wear 0.7.4/26 unverändert.

Bestehende 361 Web-/Server-Tests, zwölf Python-Prüfungen und 77 JavaScript-Syntaxprüfungen; keine zusätzlichen Tests für die reine Layoutkorrektur. Browser-Abnahme wegen der bestehenden URL-Richtliniensperre weiterhin offen.

## PWA 0.10.1 · ganze U6, Kontinuität und Symbole · 11.11.2026

Ganzlinienpilot Floridsdorf–Siebenhirten, 24 Stationen je Richtung und 23 verifizierte Abfahrts-RBLs pro gemeinsam begrenztem Request. Scrollbares Schema mit 100 px Stationsabstand und Fahrt folgen in beiden Ansichten. Zug-SVG und temporäre ID in Karte, Schema und Liste; Bus-/Tram-Symbole für spätere Modusanbindung. Kurze Lücken und Korrekturen halten die letzte Lage grau unter gleicher ID; eindeutige andere Zuordnungen laufen weiter. Nach 90 Sekunden ohne aktuelle Ableitung weiterhin ausdrücklich ausblenden. Tatsächlich ausgelassene Halte/Kurzführungen erhalten, letzte Endstationsanfahrt unsicher aus Sollzeit schätzen. Komprimiertes Format-2-Paket mit Quellen-/Kalenderbindung.

361 Web-/Server-Tests, darunter 23 Fahrzeugregressionen, zwölf Python-Prüfungen und 77 JavaScript-Syntaxprüfungen. Sieben neue Ganzlinien-Mitschnitte: acht bis neun südliche und elf nördliche Schätzlagen nach zwei Quellenständen; drei gehaltene IDs später wieder aufgenommen, neun südliche modellbasierte Übergaben. Lücke/Ablauf, lokale Mehrdeutigkeit, ausgelassene Halte, echte Streckenentfernung, Kurzführung/Endstation und 23-RBL-Einzelrequest geprüft. Browser-URL-Richtlinie blockiert Vorschau; keine visuelle/physische Abnahme behaupten. Wear 0.7.4/26 unverändert. [Datenmodell und Grenzen](docs/vehicle-pilot.md).

## PWA 0.10.0 · U6-Live-Labor · 11.11.2026

354 Web-/Server-Tests (16 Pilotregressionen), zwölf Python-Prüfungen und 77 JavaScript-Syntaxprüfungen. Echte fünf U6-Snapshots: temporäre ID über zwei südliche Stationsübergaben, interpolierte Lage und nördliche Korrekturpause geprüft. Quelle/Kalender, falsche Seite, Doppelzuordnung, stale/fehlende Daten, Abruflimits, Pause und späte Antworten geprüft. Beide Darstellungen teilen denselben Modellfortschritt. Browser-Vorschau nach Infrastruktur-Reparatur durch URL-Richtlinie blockiert; keine visuelle oder physische Abnahme behaupten. [Pilotvertrag](docs/vehicle-pilot.md). Wear 0.7.4/26 unverändert.

## Wear 0.7.4 · 11.11.2026

- Update-Dialog und App bleiben während Download und Vorbereitung sichtbar wach.
- Kurze sichtbare Unterbrechungen stoppen Standort/Abfahrten, erhalten aber den bestätigten Download.
- APK-Vorbereitung blockiert die Oberfläche nicht; Installer-Fehler und verspätete Ergebnisse werden abgefangen.
- 159 native Tests, Originalpaket/-signatur; echte Systeminstallation und Geräteprüfung bleiben getrennt.

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

A nach B und Routenfavoriten zeigen die gewählte Stadt; alle gespeicherten Routen bleiben erhalten. Hauptnavigation bleibt in A nach B sichtbar, Mehr/Einstellungen kehren dorthin zurück. Fällige Abfragen starten sofort bei Rückkehr, gemeinsame Sperren exakt nach Restzeit; Fehlerpausen bleiben pro Stadt getrennt. Globales 30-Sekunden-Limit und Ultra-Sparmodus bleiben erhalten. Expliziter App-User-Agent ohne Gerätekennung. Signierter Build und aktuelle Abnahme: [Wear 0.7.1](docs/wear-os-release-0.7.1.md). PWA bleibt 0.8.2.

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

Rollstuhl-Symbol je Abfahrt nur bei explizitem `barrierFree: true`, mit Fahrzeug-Override vor Linienvorgabe. Unbekannt/false/veraltet/Fehler bleiben unmarkiert. Beschriftung und Tooltip beziehen sich auf das Fahrzeug, nicht auf Station oder gesamten Reiseweg. Monitor/Favoriten, Vollbild-Verbindung und Reise-Abfahrten verwenden dieselben Regeln. Kein zusätzlicher API-/GPS-Aufruf, unveränderte QR-/Favoritenformate und native APK 0.6.1/21. Enthält die kompakteren Reiseabschnitte und den einheitlichen Kopf aus 0.6.2. [Datenvertrag](docs/departure-indicators.md).

## PWA 0.6.2 · kompakte Reiseansicht und einheitlicher Kopf · 09.11.2026

Bahnsteig/Abfahrtszeit beim Stationskopf statt in einer zusätzlichen Abfahrtszeile, kompakte Absatz-/Karten-/Variantenabstände. Fußwege mit Start → Ziel zusammen; gleiche bekannte Stations-ID wird einmal mit beiden Bahnsteigen gezeigt. Alle Stations-/Verbindungs-/Kartenaktionen behalten mindestens 44 px Tippfläche. Logo, Slogan, Version, Teilen/Einstellungen und die waagerechte Hauptnavigation entsprechen der Startseite. Der gemeinsame Link-Tab-Stil verwendet Flex statt Grid, damit Icon/Text nebeneinander bleiben. Heller/dunkler Erstaufbau nutzt dieselbe gespeicherte Theme-Auswahl. Route, Etappenfokus, Abfahrtsbudget und gespeicherte Favoriten unverändert. PWA-/Shell-Version 0.6.2; native APK/Feed 0.6.1/21 unverändert.

## Wear 0.6.1 / Code 21 · Favoritenansichten und QR-Rückkehr · 09.11.2026

Im Favoriten-Tab trennt ein direkt sichtbarer Umschalter **Routen** und **Stationen**. Die Stationsansicht trägt die Überschrift **Haltestellen & Linien**. Die ausdrücklich gewählte Ansicht bleibt lokal über Aktualisierung, Detailnavigation und App-Neustart erhalten. Ohne bisherige Auswahl erscheinen bei vorhandenen Routen zuerst Routen, sonst Stationen; beide Bereiche bleiben auch leer erreichbar. Nur Stationen der gewählten Ansicht sind Monitorziele, laufende alte Anfragen werden beim Wechsel verworfen. Gemeinsame Abrufgrenzen, lokale Favoriten und Push-Auswahl bleiben erhalten.

Nach bewusst bestätigtem QR-Import und erfolgreichem Transferabschluss öffnet die Uhr direkt Favoriten: Routen bei mitübernommenen Routen, sonst Stationen. Der Transfer wird beendet, Schlüssel und Wachhalteflag werden freigegeben. Abbruch, Fehler und Ablauf bleiben im bisherigen Fehler-/Zurück-Pfad; bei fehlender Abschlussquittung bleibt die Übernahme gespeichert und die bestehende Wiederholung erreichbar. Dateiimport und Senden ans Handy behalten ihren bisherigen Rückweg. Originalpaket und Release-Key bleiben erhalten; PWA 0.6.1 korrigiert auf Nutzerwunsch die Routenbeschriftung zu **Alternativen nach …**; Alternativen und Planung selbst bleiben erhalten.

## PWA 0.1.29 · 08.11.2026

- Teilen und Einstellungen im Kopf mit identischen Schaltflächen-/Vektorgrößen und gleicher Strichstärke.
- A-nach-B-Datenverarbeitung als noch nicht aktivierte Grundlage vorbereitet. Datenzugang/Lizenzentscheidung vor öffentlicher Routensuche erforderlich. Wear bleibt 0.3.6.

## PWA 0.1.28 · 08.11.2026

Auf der Hauptseite erscheint bei verfügbarer neuer PWA-Version ein Hinweis mit **Jetzt aktualisieren**. Prüfung beim Start und alle fünf Minuten nur bei sichtbarer App; keine automatische Neuladung. Update aktiviert den vorbereiteten Worker und lädt die App neu, Favoriten/Einstellungen bleiben erhalten.

- App teilen ersetzt das Aktualisieren-Symbol im Kopf: natives Teilen-Menü, Link kopieren und WhatsApp-Alternative.
- Ausschließlich öffentliche App-Adresse und Einladungstext; keine Standort-/Favoritendaten oder QR-Schlüssel.
- Normale automatische Aktualisierung und Aktualisieren in Verbindungsdetails erhalten. Uhr unverändert 0.3.6.

## PWA 0.1.27 / Wear 0.3.6 · 08.11.2026

- Favoritensortierung einheitlich Nähesten zuerst; zusätzlicher PWA-Standort-/Luftlinie-Hinweis entfällt bei vorhandener Position.
- Bisherige Sortierwerte und lokale Favoriten bleiben erhalten. Wear 0.3.6 / Code 13.
- A-nach-B-Reiseplanung für PWA/Uhr mit Umstiegen und passenden Abfahrten in die Planung aufgenommen; noch kein veröffentlichtes Routingfeature.

## PWA 0.1.26 / Wear 0.3.5 · 08.11.2026

- Stationslinien anhand kalendergültiger Fahrgastfahrten im offiziellen GTFS bereinigt; Fahrwegvarianten bleiben interne Kandidaten. Westbahnhof ohne falsche reguläre 1-/2-Zuordnung.
- Zentrale passive Bestätigung je Linie für 30 Tage, gemeinsame Daten für PWA/Uhr und lokale Offlinekopie. Kein Erneuern fremder Linien durch einen Stationsabruf.
- Konservative Alterung nur nach ausreichenden vollständigen Abfragen; Nacht-/Rufbus-/Fahrplannachweis geschützt, Wiederauftauchen sofort übernommen.
- Keine zusätzlichen WL-/GPS-Hintergrundabfragen, keine Favoritenänderung. Wear 0.3.5 / Code 12 mit ursprünglichem Schlüssel.

## PWA 0.1.25 · Kompakte Linienauswahl · 08.11.2026

Linienbadges in Stationskarten mit dichterem, gleichmäßigem Umbruch: keine zusätzlichen Flex-Gaps um die weiterhin mindestens 44 × 44 px großen Tippflächen, besser ausgefüllte sichtbare Badges. Verkehrsmittel und Erklärung gedimmter Linien erhalten eigene Zeilen unter der Auswahl statt konkurrierender Flex-Elemente. Schmale Karten mit kleineren Außenabständen; Farben und Verbindungsaufruf erhalten. Wear bleibt 0.3.4 / Code 11.

## 0.1.24 PWA / 0.3.4 Wear · 2026-11-08

- PWA-Verbindungen als eigene Vollbildansicht, Browser-Back/Forward und Rückkehr an die ursprüngliche Listenposition.
- Gezielter sichtbarer Monitorabruf für bekannte Verbindungsbahnsteige; laufende fremde Abrufe abbrechen, 30-s-Sperre und Backoff weiter einhalten.
- Antippbare, gedimmte Stationslinien ohne frische bestätigte Abfahrten; keine Gleichsetzung mit Betriebsschluss.
- Fahrzeugbezogene Richtung/Kurzführung beim Parsen erhalten.
- Native Nähe-/Favoritenkarten teilen Stationskopf, Gehinfo und Zeilenlayout; unbestätigte/ältere Linien neutral und weiterhin erreichbar.

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
- 70 automatische Tests; physischer Android-Sensor-/Akkutest noch offen. [Details](docs/motion-battery-saving.md).

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

# Änderungen v0.1.4

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

## 0.1.2 – Mobile Navigation, Standort und API-Relay (2026-11-07)

- Navigation bleibt außerhalb der verdeckten unteren Bildschirmzone erreichbar.
- Expliziter Standortknopf, Browser-/Android-/Policy-Fehlerhinweise und sichtbarkeitsabhängiger Watch ohne unaufgeforderte Erstabfrage.
- Offiziellen Katalog mit 1.811 Haltestellengruppen geladen; Wear-Quellassets synchronisiert.
- Bestehenden festen WL-API-Relay in dieselbe ChatGPT-Site eingebunden. Kein offener Proxy; 30-s-Cache und Verbindungs-Timeout. Diagnose behält Direkt-Test und erhält vorkonfigurierten Relay-Test.
- Geänderte PWA-Einstiege versioniert, neue Offline-Shell, bestehende lokale Daten und Site-ID erhalten.

## 0.1.1 – Android-Browser-API-Diagnose (2026-11-07)

- Eigenständige Diagnoseoberfläche ohne Standortzugriff oder Haltestellenindex.
- Manuelle echte Requests: Wiener Linien Monitor, Haltepunkte CSV, lokales PWA-Hosting, optionaler HTTPS-Proxy.
- Sichtbare HTTP-Statuscodes, Antworten, JSON-Formaterkennung, differenzierte Browser-/CORS-/Netzwerk-Fehler und Diagnoseexport.
- Automatische Unterbindung zu häufiger Testanfragen; lokal speicherbare, datensparsame Protokolle.
- PWA-Shell, Version und Manifest auf Unterpfad-Hosting angepasst.
- Bestehende PWA für öffentliche ChatGPT-Sites-Auslieferung paketiert; statischer Modus verhindert Anfragen an nicht vorhandene eigene API-Routen.
- Android-Installationshilfe und nativer Installationsknopf in App und Diagnose; Service-Worker-Status aktualisiert sich nach Aktivierung.
- Hosting-Diagnose prüft direkt das Netzwerk und wird nicht aus dem Offline-Cache beantwortet.

# Changelog

## [0.1.0] - 2026-11-07

- Initial foama-wien developer preview: PWA and Wear OS source projects.
- Wiener Linien API client, GTFS schedule adapter, configurable radius and reachability.
- Local favorites, optional OpenStreetMap routes, QR session relay and watch update checker.
- Source processing scripts, Cloudflare Worker, CI workflow, automated tests and documentation.
- Not yet publicly hosted or compiled into APK; third-party live integrations require testing.

- 2026-11-07: Build-Handoff nach nachgewiesenem Squash-Tap-Cloudverfahren dokumentiert; GitHub/Gradle nicht mehr als primärer Weg vorgesehen. Keine neue App-Releaseversion, kein APK-Build.

Sites-Cache-Kompatibilität: eigener benannter API-Cache `foama-wien-api-v1`, niemals `caches.default`. Der Test simuliert den verbotenen Default-Cache. Der Katalog-Fallback `/api/stops-index` liefert den gebündelten offiziellen Katalog ohne weiteren externen Abruf; versionierte Katalogabfrage vermeidet alte leere Offline-Caches.

Standortkarten-Fix: Leaflet-Ansicht vor dem Berechnen von Suchradius-/Genauigkeitskreis-Bounds initialisieren. Ohne initiale Ansicht konnten getBounds-Aufrufe abbrechen; die öffentliche Browserprüfung hat diesen Fehler sichtbar gemacht.
