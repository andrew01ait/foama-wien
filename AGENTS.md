## PWA 0.11.19 · kompakter Fortschritt und durchgehende Liniensitzung · 12.11.2026

Auf schmalen Bildschirmen (bis 620 px) und in schmalen Inhaltsbereichen (bis 540 px Innenbreite) ersetzt ein sechspixelhoher vierteiliger Balken die nummerierten Datenkarten und den großen Schrittzähler. Mint zeigt abgeschlossene Datenstufen, Amber die aktive, die übrigen bleiben neutral. Aktueller Schritt, Datenstand, Fehler-/Wartetext und nächster Abruf bleiben sichtbar. Breite Ansichten behalten die ausführlichen vier Stufen. Semantischer Fortschrittsbalken mit aktuellem Wert, Maximum und lesbarer Stufenbeschreibung; abgelaufene Quellen setzen auch den Balken zurück.

Nutzerentscheidung ersetzt die bisherige Beschränkung auf einen ausdrücklich ausgewählten Live-Abschnitt: Die ganze Fahrzeugseite besitzt pro gewählter Strecke einen dauerhaften Tracker. Karte, Schema, Dein Halt und Stationswahl filtern vorhandene Ergebnisse, ohne Poller, Bestätigung, Kennungen oder Countdown neu zu starten. Der ausgewählte Stationsbereich erhält die nächsten benötigten Quellenabfragen zuerst. Lange Linien rotieren danach fair durch ihre begrenzten Abschnitte; keine schnelleren oder parallelen Zusatzabfragen. In den aktuellen 617 Varianten brauchen 53 genau zwei Abschnitte, alle übrigen einen. Gemeinsame 30-s-/Cache-/Backoff-Grenzen, höchstens 24 RBLs je Abruf, Hintergrundpause und 60-/90-s-Altersgrenzen bleiben erhalten.

Die Ganzliniensitzung hält Prognosen und angefragte Abdeckung je Halt mit tatsächlichem Quellzeitstempel. Ein Abruf anderswo ist weder eine fehlende Meldung noch ein zweiter Beleg für alte Anker. Gleiche/überlappende Quellenstände erhöhen keine Bestätigung; ein gültiger älterer Stand eines erstmals abgefragten anderen Abschnitts dreht die Gesamtzeit nicht zurück. Tatsächlich leer abgefragte Halte stoppen ihre Zuordnungen, alte Quellen frieren weiterhin ein und laufen ab. Eingebettete Stations-/A-nach-B-Panels bleiben beim bestehenden gemeinsamen Abruf. Kartenkorrektur aus 0.11.18 enthalten; Wear 0.7.4/26 unverändert. Details: docs/vehicle-line-session.md.

## PWA 0.11.18 · Kartenebenen bei vorhandenem Standort · 12.11.2026

Der Stationsausschnitt zeigte Kacheln, aber weder Linie, Halte noch Fahrzeug oder Standort. Reproduziert mit echtem Leaflet, realer 29B-Geometrie und ausdrücklich synthetischer Position: Ein synchron zugestellter vorhandener Fix lief bereits im ersten `load`-Listener, während der zuvor eingereihte SVG-Renderer noch keine Bounds hatte (`intersects`-Fehler). `whenReady` allein reichte nicht. Der gemeinsame Standort-Hook startet jetzt in einer Microtask nach dem vollständigen ersten Ladeereignis; Entfernen vor diesem Zeitpunkt verhindert jede verspätete Anmeldung. Das schützt alle Leaflet-Karten. Der Stationsausschnitt setzt zusätzlich seine erste Ansicht vor dem Hinzufügen der Vektoren.

Ein gescheiterter Stationskartenaufbau entfernt die teilweise erstellte Karte, deaktiviert den Ausschnittknopf und nimmt keine Fahrzeugupdates in unvollständige Ebenen auf. Erneutes Karte/Schema-Umschalten baut sauber neu auf. Normale Updates und Wiederöffnen erhalten Ausschnitt, Zoom, Tracker und Fahrzeugauswahl. Keine neuen Netzwerkanfragen oder Standortfreigaben; Wear 0.7.4/26 unverändert. [Reproduktion und Abnahme](docs/map-overlays-20261112.md).

## PWA 0.11.17 · automatischer Start und Ankunft am gewählten Halt · 12.11.2026

Die ganze Fahrzeugseite beginnt den Live-Abgleich unmittelbar nach erfolgreich geladener und geprüfter Linienbasis. Start-/Pause-Button und Hinweise auf einen nötigen Klick entfernt. Linien-, Richtungs-, Varianten- und Abschnittwechsel starten den gewählten gültigen Umfang automatisch neu, innerhalb derselben globalen 30-s-/Quellencache-/Backoff-Grenzen. Hintergrund und Pagehide stoppen Requests und Bewegung; Rückkehr setzt automatisch fort. Während fehlender oder fehlerhafter Linienbasis keine Monitorabfrage. Die eingebetteten Stationsbereiche bleiben bewusst geschlossen und laden erst beim Öffnen. Wear 0.7.4/26 unverändert.

Für die gewählte Station gibt es genau einen Countdown für das nächste Fahrzeug in Minuten. Auf der Karte steht er als kompakte obere rechte Überlagerung; im Schema und während des Positionsaufbaus als schmale Zeile davor. Eine frische Stationsprognose darf den Countdown bereits vor abgeschlossener Fahrzeug-ID-Zuordnung liefern, ohne dadurch eine Kartenposition zu behaupten. Abfahrtsprognose als Grundlage offenlegen; bekannte Haltezeit bei eindeutigem bestätigtem Anker abziehen. Nur aktuelle anfahrende zugeordnete Fahrzeuge dürfen bei fehlendem Zielmonitor eine ausdrücklich benannte Fahrplan-Schätzung liefern. Bereits passierte Halte, veraltete Quellen/Zeilen, Fehler und ausgelassene Ziele liefern keinen Countdown. Keine zusätzlichen Requests.

461 Web-/Server-Tests, 18 Python-Prüfungen und 86 JavaScript-Syntaxprüfungen.

## PWA 0.11.16 · vollständigere Karten und stabilere Fahrzeuglagen · 12.11.2026

Standortmarker zeigen alle aktivierten Stationslinien in einem Raster mit höchstens vier Spalten. Floridsdorf S U zeigt damit 14 statt zwei Linien. Fußwegkarten zeichnen die Station sofort und laden den Gehweg parallel. Eigene Sitzung mit Routingabbruch und Kartenabbau bei Schließen/Hintergrund verhindert verspätete Antworten auf einer erneut geöffneten Karte. Ohne Startposition oder Routing bleibt die Stationskarte nutzbar; erste Kartenansicht vor Vektor-/Standortschichten.

Monitor, A nach B und Fahrzeugseite beachten neben der 30-s-Startsperre den validierten Ablauf des Quellencaches plus eine Sekunde Reserve. Web Locks machen die kurze Zeitstempelvergabe zwischen Tabs atomar, soweit unterstützt. Identische gleichzeitige Serverbatches und Zusatzmeldungsabrufe teilen Requests je Worker-Instanz. Quellfehler 316 wird auch bei HTTP 200 als Begrenzung mit 60-s-Pause über geänderte Stoplisten behandelt. Maximal 24 RBLs, sichtbare Nutzung und zwei unterschiedliche Quellenstände bleiben verbindlich.

ETA-Korrekturen mit mindestens zwei identischen geplanten Stationsankern erhalten ID und Bestätigung. Die letzte Lage nur begrenzt grau halten, bis die Prognose aufschließt; keine Rückwärtsanimation. Tatsächlich umgekehrte Stationsanker bleiben gesperrt. Eine etablierte Bus-/Tram-ID darf am Rand mit zwei exakt gemeinsamen Live-Schlüsseln fortgesetzt werden; neue Oberflächen-IDs benötigen weiter drei Stationen. Zwei frische Folgeanker erlauben nach Zweiquellenbestätigung eine einzelne angrenzende, ausdrücklich unsichere Anfahrtsprojektion. Spätere Fahrten, fehlende Lagen und wirklich außerhalb liegende Fahrzeuge erhalten unterschiedliche Texte. Panels erhalten die tatsächlich abgesendete Teilmenge und nennen wegen des 24-RBL-Limits ausgelassene Nachbarhalte.

453 Web-/Server-Tests, 18 Python-Prüfungen und 85 JavaScript-Syntaxprüfungen. Begrenzter Vergleich mit denselben Audit-Mitschnitten: 46 erstmals nach 41,3 statt 75,3 s sichtbar; Zeitanteil mit mindestens einer gehaltenen U6-Südlage 38,6 statt 57,4 %. Replay, keine physische Fahrzeugzählung. Unterschiedlich überlappende Batches über mehrere Worker-Instanzen besitzen weiterhin keinen globalen Koordinator. Wear 0.7.4/26 samt Original-APK unverändert.

## PWA 0.11.15 · GPS-Kartenstart und ehrlicher Meldungscache · 12.11.2026

Ein bereits vorhandener frischer GPS-Fix wurde im Leaflet-Init-Hook synchron ausgeliefert, bevor die ersten Vektorpfade existierten. bringToBack löste dadurch einen parentNode-Fehler aus und die Standortkarte blieb leer. Die gemeinsame Standortschicht startet jetzt erst in whenReady nach der ersten Kartenansicht. Reale Leaflet-Browserprobe mit einem ausdrücklich synthetischen öffentlichen Wiener Testpunkt reproduziert den Fehler vorher und prüft GPS-Fix, Genauigkeitskreis sowie erneutes Öffnen ohne GPS nachher. Standort-/Fußwegkacheln senden denselben ausschließlich auf die Origin beschränkten Referer wie die anderen Karten.

Störungsdaten behalten das Alter der Monitor-/Zusatzquelle statt des lokalen Empfangszeitpunkts; wiederholte Cacheantworten erneuern es nicht. Bei explizit fehlender Zusatzquelle bleiben vorhandene Meldungen mit ihrem alten Zeitstempel bis zur bisherigen Ablaufgrenze erhalten. Erst eine vollständige erfolgreiche leere Antwort oder explizite Auflösung entfernt sie. Keine zusätzlichen Abfragen, keine Änderung der Push- oder Fahrzeug-Zuordnungsregeln. 435 Web-/Server-Tests, 18 Python-Prüfungen und 82 JavaScript-Syntaxprüfungen erfolgreich. Neuer PWA-Cache; Wear 0.7.4/26 unverändert.

Die Fahrzeuguntersuchung vom 12.11. ist unter docs/vehicle-audit-20261112.md dokumentiert. Sie unterscheidet API-Erreichbarkeit, doppelte Quellenstände, Schätzlagen, Meldelücken und tatsächliche Fahrzeugidentität. Die vorgeschlagenen Änderungen an Poller/Tracker sind noch nicht Teil dieses Releases.

## PWA 0.11.14 · Störungen auch in A nach B · 11.11.2026

A nach B übernimmt Störungsdaten aus denselben gültigen Wiener-Linien-Monitorantworten wie die Abfahrten. Aktuelle Betriebsmeldungen der gewählten Reise stehen direkt unter Start/Ziel vor Karten-/Routenaktionen und Etappen; ein Variantenwechsel filtert erneut auf die tatsächlich gewählten Linien. Stations-/Verbindungsdetails zeigen passende Hinweise unter Stations-/Linienkopf vor den Abfahrten. Quellenalter, Deduplizierung, Ablauf/Auflösung, fremde Linien/Stationen und die getrennten neutralen Aufzug-/Planungshinweise folgen denselben Regeln wie im Hauptmonitor. Die gemeinsame Meldungsdarstellung vermeidet abweichende Texte/Quellangaben. Warnungen bleiben flüchtig, bestehende aufgeklappte Fahrzeug-/Fußwegkarten erhalten; keine zusätzlichen Requests, keine Änderung an 24-RBL-/30-s-Grenzen oder Push. Neuer PWA-Cache; Wear 0.7.4/26 unverändert.

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

## PWA 0.11.0 · Fahrzeuge im Anflug und horizontale Stationsausschnitte · 11.11.2026

Der Nutzer beauftragt den Rollout auf weitere Linien sowie die Integration in Stationsdetails und A-nach-B-Einstiegsdetails. 165 verifizierbar zugeordnete Linien (5 U-Bahn, 30 Tram, 130 Bus), 616 Varianten. Acht Linien bleiben ausdrücklich ausgeschlossen. Linien-/Variantenwahl im Live-Labor; über 24 RBLs explizite überlappende Abschnitte, niemals zusätzliche schnelle Teilabfragen. Karte und vertikales Schema teilen denselben Tracker. „Dein Halt“ und „Fahrzeuge im Anflug“ verwenden dieselbe horizontale Darstellung: höchstens fünf reale Halte davor und zwei danach, richtige Fahrtfolge von links nach rechts, Zielstation hervorheben, an Liniengrenzen nicht auffüllen. SVG-Zug/Tram/Bus und temporäre IDs erhalten.

Stationskomponente beginnt geschlossen, lädt die öffentliche Linienbasis erst beim Öffnen und hat keinen eigenen Monitor-Poller. Nachbar-RBLs werden mit dem bestehenden Stations-/A-nach-B-Abruf vereinigt, Stationsdaten haben Vorrang, insgesamt maximal 24 und gemeinsame 30-s-Sperre. Schließen, Richtungs-/Stationswechsel und Hintergrund stoppen den Zusatzumfang bzw. verwerfen späte Antworten. Komponentenknoten und Fokus bei Routine-Updates erhalten. Keine Nutzerposition oder historischen Live-Daten speichern.

U-Bahn: bisheriger eindeutiger GTFS-Sollslot mit 60 s Toleranz, zwei Stationen/zwei Quellenstände. Bus/Tram: mindestens drei eindeutig zusammenpassende Live-Sollanker und zwei frische Quellenstände; GTFS nur als kalender-/zielgebundenes Fahrzeitprofil, keine physische Identifikation über nächsten GTFS-Zug oder Abfahrtsrang. Prototypen mit derselben Beobachtungsfolge zusammenfassen; konkurrierende Live-Folgen bleiben offen, sehr enge mehrdeutige Takte nicht erzwingen. ID nur bei mindestens zwei gemeinsamen tatsächlichen Stations-/Sollzeit-Schlüsseln wieder aufnehmen. Profile niemals aus eigenen Schätzungen trainieren. Fehlende/konfliktbehaftete Lage kurz grau halten, 60/90-s-Fristen erhalten.

Format 3 und publizierte RBL-Referenz sind an exakt denselben GTFS-Digest/Kalender wie die Linienkarte gebunden. Aliasnamen nur über eindeutig gemeinsame Endstations-ID. Quelle: offizielle Haltepunkte-/Linien-/Fahrweg-CSV; Referenz scripts/data/vehicle-reference.json ermöglicht unveränderte Reproduktion. Unklare RBL-Seiten leer lassen, keine Namens-/Radiuszuordnung. U6-Legacyprobe für Regressionen erhalten. Details: docs/vehicle-pilot.md. Wear 0.7.4/26 unverändert. Verwaltete Browser-Vorschau, horizontales Schema und Einstieg aus der Linienkarte in den Stationsbereich geprüft; bei 337 px CSS-Breite kein Seitenüberlauf. Physische Fahrtenabnahme separat.

## PWA 0.10.2 · kompakter Monitor-Footer · 11.11.2026

Nutzerfeedback zur installierten PWA: übergroße Abstände zwischen Footer-Linkzeilen und unten. appFooter als Metadatenblock plus gemeinsame umbrechende Linknavigation, Lizenzen darin statt einzelner Restzeile/Punkt. Zwischen Linkzeilen kein Zusatzabstand, horizontal 16 px, mindestens 44 px Tippfläche erhalten. Nur installierte Monitor-PWA reduziert unteren App-Freiraum auf 20 px plus Safe Area; vorhandenen Abstand für Browser-Editor und andere Seiten erhalten. Stadt-/Quelltexte, Version und Ausblenden in Verbindungsansicht weiter nutzen. PWA 0.10.2, Wear 0.7.4/26 unverändert. Keine neuen Verhaltensregeln oder Abrufe.

## PWA 0.10.1 · ganze U6 und sichtbare Zuordnungslücken · 11.11.2026

Der aktuelle Nutzerauftrag erweitert den bisherigen Drei-Stationen-Piloten: längere Strecke, verschwindende Marker beheben und Fahrzeug-Symbole verwenden. fahrzeuge.html umfasst die ganze U6 Floridsdorf–Siebenhirten, 24 reale Halte je Richtung, mit 23 verifizierten Abfahrts-RBLs in einer gemeinsamen sichtbaren Anfrage pro frühestens 30 Sekunden. Ankunfts-Endstation ohne Abfahrts-RBL aus Fahrplan zusätzlich und ausdrücklich unsicher schätzen. Tatsächlich ausgelassene GTFS-Halte und Kurzführungen über nullable Zeiten erhalten; nie Fahrten künstlich verlängern. Minutengenauer Abgleich, Mehrstations- und Zweiquellenbestätigung sowie Quelldigest/Kalenderbindung bleiben erforderlich.

Ein fehlender Halt stoppt andere zugeordnete Fahrten nicht. Bei Meldelücke, Konflikt oder Rückkorrektur letzte zugeordnete Lage mit gleicher ID grau gestrichelt halten, keine unbestätigte Bewegung; nach 90 Sekunden ohne frische Zuordnung bzw. letzte ableitbare Lage ausblenden und Grund anzeigen. Rückkehr bestätigt dieselbe Fahrt-Hypothese unter gleicher temporärer ID. Ankunft nur geschätzt, keine GPS-/Wagenidentität. Höchstens 128 Kandidaten/zehn Minuten, Ereignisse 80, nur Arbeitsspeicher. 24-Halt-Schema scrollt mit 100 px Stationsabstand; Fahrt folgen in Karte und Schema. Zugsymbol + ID in beiden Ansichten und Liste; bestehende SVG-Bus-/Tram-Symbole für spätere Modusanbindung, keine Bus-/Tram-Livedaten behaupten. Paketformat 2 mit begrenzter gzip-Dekodierung, alter Dreihalt-Cache separat. Öffentliche RBL-Referenz scripts/data/u6-rbl-mapping.json. Wear 0.7.4/26 unverändert. Grenzen, Proben und Reproduktion: docs/vehicle-pilot.md. Browser-URL-Richtlinie blockiert Vorschau; keine Umgehung oder visuelle Abnahme behaupten.

## PWA 0.10.0 · U6-Fahrzeugpilot · 11.11.2026

Aktueller Nutzerauftrag erlaubt ausdrücklich den isolierten B-Piloten in echter Karte UND Schema mit Stationsübergaben und internen temporären Fahrt-IDs. fahrzeuge.html beschränkt sich auf Josefstädter Straße–Thaliastraße–Burggasse/Stadthalle, beide Richtungen getrennt. GTFS-Quell-/Kalenderbindung, richtige RBL-Seite, mehrstationsfähige eindeutige Kandidaten und zwei verschiedene Quellenstände erforderlich. Minutengenauen GTFS gegen sekundengenaue Monitor-Sollzeit begrenzt mit 60 s Toleranz abgleichen, nie den nächstbesten Zug wählen. onStop ist Stationsanker, keine GPS-Position oder sichere physische Identität. Karte/Schema teilen einen Fortschritt. Ambiguität, fehlende aktuelle Zuordnung, Konflikt und große Rückkorrektur setzen einzelne Lage aus. Nur drei RBLs/30 s mit gemeinsamem Gate; Pause/Hintergrund/alte Antwort stoppen. Speicher nur kurzlebig, kein Replay oder Positionsverlauf. Wear 0.7.4/26 unverändert. Details und echte Proben: docs/vehicle-pilot.md.

## Wear 0.7.4 · Updates sichtbar halten · 11.11.2026

Updatehinweis und Fortschrittsdialog halten ihre eigenen Fenster sowie das App-Fenster wach; bis zur Android-Bestätigung keine frühe Dialog-/Wachhaltefreigabe. APK-Staging und fsync auf dem bestehenden Worker, Commit nur im gültigen RequestScope. Kurze sichtbare Pause erhält ausschließlich den bestätigten Update-Vorgang; Standort/Abfahrten bleiben pausiert. onStop/Display aus/Home/Abbruch/Fehler/Timeout bereinigen weiter; keine neuen Dienste, Wake-Locks oder automatische Wiederöffnung. Vorschau/Vorgang jeweils maximal fünf Minuten. Nicht aufrufbaren Installer abfangen; prozessinterne schwache Ergebnisreferenz und exakte Sitzungs-ID verwenden. Android darf beim Ersetzen der ganzen APK den Prozess beenden. Originalpaket/-key erhalten, eigene APK 0.7.4/26; PWA unverändert 0.9.5. Details und physische Prüfgrenzen: docs/wear-os-release-0.7.4.md.

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

A nach B verwendet dieselbe Reihenfolge wie Nähe/Favoriten: gemeinsame App-Kopfzeile, Seitenüberschrift, Hauptnavigation und anschließend Route suchen/Meine Routen mit den zugehörigen Inhalten. Überschrift und Navigation liegen in derselben DOM- und Lesereihenfolge. Gemeinsame view-heading-Abstände und 29-px-Titel statt abweichender Sonderregeln. Auf sehr schmalen Geräten Originalmarke proportional mit 40 px und 22-px-Schrift zeigen; Routenanzahl zusammen mit der Beschriftung halten. Suchformular, gespeicherte Orte und kompakte Reise-/Stationsdetails bleiben erhalten; kein verändertes Abfrageverhalten. Wear 0.7.1/23 unverändert.

Allgemeine Daten-, Quellen- und Offline-Erklärungen beginnen als geschlossene native details/summary-Abschnitte. In Linienkarte und Linienfahrplan anwenden; Fehler und fehlende Speicherbarkeit weiterhin direkt anzeigen. Die Stationsliste der Linienkarte beginnt ebenfalls geschlossen. Kompakte Streckenangabe bleibt sichtbar.

Linienkarte zeigt bei Zoom unter 16 nur 8-px-Haltepunkte auf der echten Linie; ab Zoom 16 die bisherigen 26-px-Stationsnummern. 44-px-Treffflächen, Stationsnamen, Popups und geordnete Liste bleiben erreichbar. Tastaturfokus darf seine Nummer auch in der Übersicht hervorheben. Zoomende schaltet nur die Darstellung am Kartencontainer um, ohne neue Datenabfrage oder Neubau der Geometrie.

## PWA 0.9.0 · geografische Linienkarte und PDF · 10.11.2026

Aktueller Nutzerauftrag ersetzt den früheren reinen A-Konzeptstand: A auf einer echten geografischen Karte umsetzen. linienkarte.html zeigt alle 173 Wiener Linien mit 965 realen, kalenderbereinigten Varianten aus dem exakt zum Fahrplan passenden GTFS. OpenStreetMap-Hintergrund, lokales Leaflet, echte Shapes und geordnete Haltepunkte; keine erfundenen Verbindungen. Gleiche Strecken mit anderen Kalender-Shape-IDs zusammenfassen, Kurzführungen/Äste/Modi erhalten. Karte mit Richtungsbuttons, Variantenwahl, antippbaren Markern und geordneter Stationsliste. Überlappende 44-px-Marker wählen per tatsächlichem Zeigerabstand; Tastatur behält den fokussierten Halt. Eigene einzelne Popups statt gleichzeitig geöffneter Nachbar-Popups. Schemaansicht und B weiterhin nicht implementiert.

PDF-Download im bestehenden Linienfahrplan: gewählte Haltestelle/Richtung am Datum oder ganze Linie mit allen Richtungen an diesem Datum. Echte lokale PDF-Datei, keine externe PDF-API oder Druckdialog-Abhängigkeit. Gespeicherte Stationsdaten offline verwenden; unvollständige Pakete/ungültige Tage ehrlich ablehnen. Dateiname mit Wiener Exportdatum YYYYMMDD_, foama-wien, Linie und gewähltem Fahrplantag. A4, lesbare Standard-PDF-Schriften, Quellenhinweis, Gültigkeit, Zeitzone und Seitenzahlen; ganze Linie ausdrücklich alphabetisch. Originalsignatur/-APK Wear 0.7.1/23 unverändert.

Linienpakete nur bei Bedarf laden und im vorhandenen IndexedDB-Store mit Fahrplanversion/Quelldigest speichern; SW darf sie nicht versionslos als Shell übernehmen. OSM-Kacheln nur für sichtbare Karte, keine Offline-Kachelpakete oder Vorabladung. Öffentlichen Origin als Referer senden. Gespeicherter Verlauf ist offline verfügbar, Straßenkartenhintergrund benötigt Internet. Kein neuer GPS-/Monitor-/Hintergrundtimer. Neuimport: prepare_line_maps.py muss exakt dieselbe Quell-SHA und Kalender wie der Fahrplan bestätigen.

B: Nutzer schlägt Übergabe derselben Fahrt von einer Stationsseite zur nächsten anhand der Fahrzeit vor. In docs/line-maps.md als konkretes Kandidaten-/Übergabemodell ausgearbeitet. Fehlender Listeneintrag ist kein bestätigtes Abfahrtereignis. Keine automatische Bestätigung/Trainierung aus eigenen mehrdeutigen Zuordnungen. Noch keine Fahrzeugmarker als Produktfunktion veröffentlichen.

## PWA 0.8.3 · allgemeine Willkommen-Seite · 10.11.2026

Nach der Willkommen-Veröffentlichung docs/line-maps.md mit Datenprüfung und A/B-Konzept ergänzt. Noch keine Linienkarte oder Fahrzeugschätzung implementiert. Wiener Monitor ohne Fahrt-ID: Abfahrtsrang niemals als Fahrzeugidentität verwenden. Transitous-Kennungen und Linzer AVMS-Kandidaten fachlich validieren. Konzeptvorschau nur Beispieldaten; Prognosepositionen bleiben Schätzungen. Nächste Umsetzung beginnt mit echten Wiener Linienpaketen für A.

Aktueller Nutzerwunsch: allgemeiner PWA-Einstieg im bestehenden Städte-Design. willkommen.html ist die teilbare Willkommen-Seite; ./ öffnet den Abfahrtsmonitor. Die vorhandene Städtecollage darf dafür wiederverwendet werden. Manifest-ID, scope und start_url erhalten, keine Zwangsumleitung für bestehende Installationen. App-Teilen zeigt nun ausschließlich die feste Willkommen-URL; dies ersetzt die frühere Root-URL-Vorgabe. Private aktuelle URL/QR-Fragmente weiterhin niemals teilen.

Einstiegsseite nur Themenwahl, vorhandene bewusste Browser-Installation und Offline-Shell, keine Geolocation-, Monitor-, Routen- oder Push-Anfragen. Alle Nutzenaussagen am aktuellen Funktionsstand ausrichten; keine Linienkarte oder Fahrzeugpositionen als verfügbar bewerben. Nach dieser Seite hat der Nutzer die weitere Ausarbeitung von Linienkarte und interaktiven Fahrzeugschätzungen beauftragt; Fahrzeugkonzept ausdrücklich vor Implementierung klären.

## Wear 0.7.1 · Routen je Stadt und Ladezeiten · 10.11.2026

Aktuelle Nutzerentscheidung ersetzt auf der Uhr die frühere stadtübergreifende Routendarstellung: A nach B und Favoriten → Routen zeigen die gewählte Stadt. Gesamten lokalen Routenspeicher und alle QR-/Dateiexporte erhalten; keine Migration oder Löschung. Stationskennungen und feste Endpunktkoordinaten verwenden, nie Namen oder den momentanen GPS-Fix. Stadtübergreifende Familien einschließlich Alternativen dürfen in mehreren passenden Profilen erscheinen.

Hauptleiste bleibt in A nach B sichtbar, aktiven Tab einschließlich Icon markieren. Mehr → Stadtprofil kehrt zur aufrufenden Routenliste zurück. Nach Rückkehr aus Einstellungen fällige Abfrage sofort starten, eine vorhandene Sperre exakt an ihrem Ende fortsetzen. Gemeinsamen 30-s-Mindestabstand auch bei Stadtwechsel erhalten, Ultra-Sparen weiter 90 s; Fehlerpause je Stadt behalten, nicht auf fremde Stadt übertragen. Pause/Display aus/Transfer/Einstellungen keine Hintergrundabfrage. App-User-Agent ohne Gerätekennung. Originalpaket/-key und lokale Speicher erhalten. Wear 0.7.1/23, PWA 0.8.2 bleibt gleich. Verbindliche Abnahme: docs/wear-os-release-0.7.1.md.

## PWA 0.8.2 · Städtebild und Salzburg-Hinweis · 10.11.2026

Auf ausdrücklichen Nutzerwunsch kein eigener Salzburg-Banner auf staedte.html. Die fachliche Einschränkung im aufklappbaren FAQ LIVE oder Fahrplan und im bestehenden Vergleich erhalten. Neues Titelbild pwa/images/foama-vier-staedte-v1.webp für genau diese Seite: vier übergehende Stadtansichten und Verkehrsmittel, Foama und alle Stadtnamen. Original-Logo unverändert; Hero immer vollständig und proportional anzeigen, kein Beschnitt. Lokales Asset in Offline-Shell und Quell-ZIP erhalten. Bildherkunft/Prompt in docs/assets/foama-vier-staedte.md.

## PWA 0.8.1 · aktuelle UI-Entscheidungen · 10.11.2026

Linienfahrplan-Datum als Auswahl mit Heute an erster Stelle und als Startwert. Aktuelle Stunde ausschließlich bei gleichem Wiener Datum und Zeitzone farbig mit Jetzt markieren; herbstliche Doppelstunden getrennt behandeln. Nur sichtbarer lokaler Minutentimer, im Hintergrund stoppen; Mitternachtswechsel ohne zusätzliche API-Abfrage aus geladenen Daten. Bewusst gewählte spätere Daten erhalten.

Fußwegdialog: station-address nie mit festem dunklem Hintergrund unter hellen Textvariablen; Themenfarben, mindestens 14 px Adresse/12 px Hinweis und gut lesbare Quellenlinks erhalten. Städtevergleich: bisherige Verfügbarkeitstexte einschließlich Bedingungen behalten, kleine grüne Haken und rote Kreuze ergänzen. Erklärungen standardmäßig geschlossene native details/summary-FAQ mit mindestens 44-px-Aktionen; Barrierefreiheitslink öffnet zugehörige FAQ. Versions-/Geltungshinweis als Fußnote unter der Tabelle. Wear unverändert 0.7.0/22.

## PWA 0.8.0 / Wear 0.7.0 · Städte und Linienfahrpläne · 10.11.2026

Die Uhr unterstützt jetzt Wien, Graz, Linz und Salzburg. Wien ist Standard; automatische Erkennung nur durch frische genaue Vordergrundfixes, veraltete Erkennung fällt auf Wien zurück. Manuelle Stadtwahl ausschließlich Mehr → Stadtprofil. Frische Position innerhalb des manuell gewählten Profils erhalten; nur bei fehlender/fremder Position klar bezeichnete Stadtmitte, niemals verlässliche Gehzeit. Alle lokalen Favoriten bleiben erhalten, Stationsfavoriten werden je Stadt angezeigt. Routen bleiben stadtübergreifend. Regionale Boards verwenden exakte bekannte Stations-IDs, maximal drei Stationen und das gemeinsame 30-s-/Serverbudget. Alle sichtbaren Stationen haben Vorrang. Salzburg bleibt Sollfahrplan; keine regionalen Störungs- oder nativen Push-Versprechen. Bus und S-Bahn mit gleicher Liniennummer werden einschließlich Detail/Import nach Modus getrennt.

QR-Handschlag ergänzt city-profiles-v1; alte Uhren bleiben weiterhin für regionale Auswahl gesperrt. Originalpaket, Originalsignatur, Geräte-/Favoritenschlüssel und Zehn-Minuten-Transfer bleiben erhalten. Wear 0.7.0/22: 138 Android-Tests, Signatur, Paket und Größe geprüft. Physische OnePlus-Abnahme bleibt separat.

PWA fahrplan.html zeigt 173 Wiener Linien mit Haltestelle, Richtung, Datum und vollständigem Tagesfahrplan nach Stunden. Nachtfahrten und Zeitumstellung kalendergenau; Stationsliste ausdrücklich alphabetisch, keine erfundene Linienführung. Ganze Linie nur nach Nutzeraktion offline laden; Speicherfehler und Abbruch ehrlich anzeigen. Vorhandenen versionierten IndexedDB-Speicher verwenden. Linienindex stets an dieselbe Fahrplanversion binden und bei Neuimport erneuern. Quelle, Serveränderung, Archivdateistand, Import, Gültigkeit und letzte Quellenprüfung unterscheiden; kein Veröffentlichungsdatum ableiten. Wöchentliche Quellenprüfung eingerichtet, kein automatischer Neuimport/Deploy. Die tatsächliche Quell-ZIP-Prüfsumme war am 10.11. identisch zum Import; Fahrplan gültig bis 12.12.2026.

Städtevergleich staedte.html, App-Links und Uhr-Webseite sind an den neuen Funktionsstand angepasst. Vollständige Linienkarten und Fahrzeugschätzungen sind geprüft und dokumentiert, aber noch nicht umgesetzt. Native/öffentliche Versionsangaben nur zusammen mit der verifizierten APK veröffentlichen.

## PWA 0.7.7 · Öffentliche Städteübersicht · 10.11.2026

Eigene teilbare Seite `staedte.html` mit Funktionsvergleich für Wien, Graz, Linz und Salzburg. Auf dem Smartphone einzelne Stadt oder alle vergleichen; Links im Stadtprofil, unter App & Installation, im PWA-Footer und auf der Uhr-Webseite. Fahrzeug-Barrierefreiheit, reine Fahrplanzeiten, regionale Störungsgrenzen und Offline-Nutzung sind verständlich erklärt. Die Seite ist Teil der Offline-Shell. Native Wear bleibt 0.6.1/21; regionale Uhr-Funktionen folgen separat.

## PWA 0.7.6 · Einstellungen nach Zweck gegliedert · 10.11.2026

Auf Nutzerfeedback sind tägliche Einstellungen und technische Werkzeuge sichtbar getrennt. Deine App: Darstellung, Stadtprofil, Standort & Gehzeit, Störungshinweise und Favoriten & Uhr. Technik & Diagnose: App & Installation, Fahrplandaten importieren, Debug Push und Debugging. Stadt und Farbschema sind unabhängige Einträge; sie haben keinen gemeinsamen Aufklappbereich mehr. Neun dezente Karten mit einheitlichen Vektorsymbolen, ruhigen Hintergründen und besser getrennten Abständen ersetzen die flache Liste. Technische Symbole sind zurückhaltend, Alltagssymbole mint. Alle bisherigen Optionen, IDs, Hilfen und Speicherformate bleiben erhalten. Push und native Wear 0.6.1/21 unverändert.

## PWA 0.7.5 · kompakte Einstellungen · 10.11.2026

Einstellungen zeigen acht anfangs geschlossene Themenbereiche: Darstellung & Stadt, Standort & Gehzeit, Störungsbenachrichtigungen, Favoriten & Uhr, App & Installation, Fahrplandaten importieren, Debug Push und Debugging. Ausführliche Erklärungen sind bei der jeweiligen Option aufklappbar. Der Dialogkopf mit Version und 44-px-Schließen bleibt beim Scrollen sichtbar. Alle bisherigen Eingaben, Aktionen, Links, Statusfelder und Erklärungstexte sind erhalten; keine Speicher-/Berechtigungsänderung. Stadtwahl bleibt ausschließlich in Einstellungen.

Debug Push ist direkt erreichbar und bündelt Testnachricht, Zustellstatus, letzten Dienstlauf und lokalen Anzeigetest. Der bestätigte Worker-Auftrag und die getrennten App-/Komponentenupdatehinweise aus 0.7.4 bleiben erhalten. Die physische lokale Benachrichtigungsanzeige am Zieltelefon muss weiter geprüft werden. Native Wear 0.6.1/21 und sämtliche Gerätefreigaben bleiben unverändert.

## PWA 0.7.4 · lokaler Anzeigetest und eindeutige Updatehinweise · 10.11.2026

Der Nutzer bestätigt den Empfang der echten Push-Testnachricht. Die lokale Probe läuft nun als bestätigter MessageChannel-Auftrag im aktiven Worker mit waitUntil statt als bloßer Anzeigeaufruf aus der Seite. Sie prüft vorhandene Freigabe und Browser-Auflistung, ersetzt nur ihre eigene vorige Testanzeige und meldet fehlende Unterstützung, Ablehnung oder ausbleibende Bestätigung im Debug-Bereich. Kein Transport, keine neue Freigabe, keine Änderung echter Störungsanzeigen; lautlos, Benachrichtigungsleiste beachten. Physische Anzeige der überarbeiteten lokalen Probe bleibt am Zieltelefon zu prüfen.

Ursache des scheinbar unveränderten Updates: Navigation lädt bereits neue Seiten aus dem Netz, während ein neuer Offline-/Push-Worker noch wartet. Ohne nachgewiesene neuere App-Version heißt der Hinweis deshalb Offline-/Push-Komponenten aktualisieren und nennt die laufende App-Version. Ein neues App-Release zeigt Ziel- und aktuelle Version; Worker-Ereignisse überschreiben diese Angabe nicht. Bewusste Aktualisierung bleibt erforderlich. 306 Web-/Server-Tests, zehn Python-Tests und 67 JavaScript-Syntaxprüfungen. Native Wear 0.6.1/21 unverändert.

Abschließender GitHub-Lauf: Ein vorhandener Verschlüsselungstest suchte die kurze Zeichenfolge U6 im zufälligen Base64url-Chiffrat und schlug zufällig an. Die Prüfung entschlüsselt nun den gespeicherten Auftrag mit erwarteten Hashes und verwirft eine falsche Ereigniszuordnung. Kein Produktcode, keine Schlüssel oder Datenformate geändert.

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

Neue Nutzerentscheidung ersetzt frühere Anweisungen zu optionalen Equipment-Pushs und weiterem Firebase-/Uhr-Push-Ausbau. Native Quellen, Version und signierte APK erhalten. Bestehende VAPID-/Speicherschlüssel nicht rotieren. Neue Migration 0005 append-only; keine Schemaoperationen im Requestpfad. v2 erst nach Nachweis des aktiven neuen Workers, wartende Updates weiterhin bewusst aktivieren. Keine Geodaten oder vollständigen Favoriten in Outbox/Receipts/Debug-Logs. Quellen- und Geräteempfangsnachweise getrennt dokumentieren.

## PWA 0.6.6 · Meine Orte

Nutzer beanstandet große, unruhige Ortsverwaltung. Klare kompakte Ortskarten, Name/Adresse getrennt und sichtbar. Start/Ziel als A/B-Aktionen, Bearbeiten/Entfernen im Ortsmenü; vorhandenen Menücontroller samt Außenklick/Escape nutzen. Formular separat von Liste mit Speichern/Abbrechen. Abbruch invalidiert alte Suchantworten, unveränderte Orte und physische Endpunkte bleiben erhalten. Löschen weiterhin ausdrücklich bestätigen. Keine zusätzlichen APIs/GPS oder neue Kategorien-/Speicherformate. 44-px-Bedienziele erhalten. Lokale UI-Testseiten nicht veröffentlichen, keine privaten Screenshotadressen in Fixtures übernehmen. Wear bleibt 0.6.1/21.

## PWA 0.6.5 · mobile Reiseübersicht

Nutzer beanstandet übergroße mobile Routentitel, doppelte Angaben und breite Aktionsreihen. Ortslabel und echte Adresse in A/B-Zeilen getrennt zeigen; physische Endpunkte niemals durch Labels ersetzen. Eigene Favoritennamen als kompakte Überschrift erhalten, automatisch erzeugte Endpunktnamen nicht doppelt wiederholen. Ein-/Ausstiegsstation zusätzlich sichtbar halten. Ein gemeinsamer Reise/Gesamtkarte-Umschalter, Zurück/Stern in Kopfzeile, kompakte beschriftete Aktionen mit mindestens 44 px Höhe. Keine abgeschnittenen Namen oder zusätzliche Abfragen. Temporäre lokale Layoutprüfung nicht veröffentlichen. Wear bleibt 0.6.1/21.

## PWA 0.6.2 · Reise-Dichte und gemeinsame Navigation

Stationsname weiterhin über der Linie/Richtung; Abfahrtszeit und Bahnsteig dürfen im Stationskopf stehen. Fußweg-Endpunkte in einer kompakten gemeinsamen Zeile umbrechbar anzeigen; nur bei gleicher nichtleerer Stations-ID den gemeinsamen Namen einmal zeigen. Keine Verkleinerung der 44-px-Aktionen, keine verdeckten überlappenden Klickflächen. A-nach-B-Header nutzt bestehendes Original-Logo, Slogan, Version, sicheres App-Teilen und Einstellungen. Haupttabs müssen Icon/Text in einer Reihe halten; .tabs a.tab darf das gemeinsame Flex-Layout nicht durch Grid überschreiben. Nur PWA 0.6.2, Wear unverändert 0.6.1/21.

# Aktuelle Dokumentations- und Veröffentlichungsregeln · 09.11.2026

Für neue Arbeiten zuerst README.md, STATUS.md, DEPLOYMENT.md und docs/README.md lesen. Aktuelle Fachanleitungen ersetzen ausdrücklich alte Anweisungen in docs/history/. Öffentliche Quelle: https://github.com/andrew01ait/foama-wien, Branch main. Nutzer hat die öffentliche Quellveröffentlichung und die Pflege sowohl der internen als auch der GitHub-Dokumentation ausdrücklich freigegeben.

Interne Site-Quelle, öffentliches GitHub und Quell-ZIP bewusst abgleichen; kein automatischer Deploy durch GitHub. Credentials/Keystores/Build-Caches/APKs/Nutzerexporte niemals als Quellcode übertragen. Vor Aktualisierung fremde Commits prüfen, keine Force-Pushes. Dokumentation und CI müssen den tatsächlichen Source-/Release-Stand beschreiben. Source-ZIP umfasst auch SQL-Migrationen, Drizzle-Konfiguration, CI und Bibliothekslizenzen. Reiner Dokumentationswechsel verändert weder App-Version noch signierte APK. 0.6.1/21 und die aktuellen Grenzen aus STATUS.md erhalten.

## Frühere Anweisungen und Release-Kontext

# Agent instructions for foama-wien

Read `README.md`, `DEPLOYMENT.md`, `STATUS.md`, `docs/architecture.md`, `docs/tests.md`, and particularly `docs/squashtap-build-adaptation.md` before building.

**Primary build target:** Native Wear OS APK built and signed in ChatGPT Work cloud using Java + Python + Android SDK command-line tools, like Squash Tap. No required Android Studio, Gradle, GitHub or local user-PC development software. Legacy Gradle scaffolding is not the delivery plan.

Never claim an APK is built unless `apksigner verify`, package/version metadata checks, tests, and a real output file support that claim. Never claim a public deployment until an HTTPS URL is reachable. No synthetic departures as live data. Never publish signing keys. Keep package ID and release signing key stable after first installation; preserve per-watch local data on updates. Keep 30-second refresh visible-only and 10-minute encrypted QR transfer. Update the docs and release notes on every change.

## PWA-Veröffentlichung v0.1.4

Für PWA-Aufgaben die vorhandene ChatGPT-Site aus `.openai/hosting.json` erhalten. Öffentliche URL: https://foama-wien.endruuu.chatgpt.site. Worker-Ausgabe aus den bestehenden PWA-Dateien mit `python3 scripts/build_site.py`; maßgeblich `DEPLOYMENT.md`. Diagnose, Logexport und Service-Worker-Assets bei Änderungen erhalten. Wear-Build bleibt ein separater, noch offener Arbeitsstrang.

Standort-Erstfreigabe muss unmittelbar durch eine sichtbare Nutzeraktion ausgelöst werden. Bereits erteilte Freigabe nur bei sichtbarer App fortsetzen; Fehlergrund erklären. Navigation im Seitenfluss behalten, damit Host-Overlays sie nicht verdecken. Der gebündelte offizielle Katalog und die eigene feste API-Relay-Route müssen bei Updates erhalten bleiben. Keine GPS-Koordinaten im Relay oder Diagnoseexport.

Stationsnamen öffnen die Fußwegkarte; Abfahrten bleiben separat aufklappbar. Favoriten-Auswahl ausdrücklich nach Station und Linie/Richtung erhalten, keine automatische Zuordnung beim bloßen Tippen eines Suchtexts. Grafik-Master: pwa/icons/foama-mark.svg; U-Bahn-Farben und Quellen in docs/branding.md. API-Metadaten-Prüfung in docs/wiener-linien-metadata.md.

## v0.1.4 erhalten

Verkehrsmittel-Klappzustand und bestehende Settings/Favoriten-Schlüssel erhalten. Nur nachgewiesen passende Stationen in „In der Nähe“; Bahnsteige nach bestätigten Verkehrsmitteln filtern. Station-Suffixe U/S sind keine Liniennachweise. Offline-Linien und öffentlicher Straßenindex bleiben erhalten. Nutzerpositionen niemals in den Straßenindex, Relay oder Diagnoseexport schreiben.

Grobe Standorte nicht pauschal bei ±150 m verwerfen. Alter/Genauigkeit bei jedem Fix erneuern, auch unter 40 m Bewegung; veraltete/grobe/unterwegs liegende Positionen und fehlgeschlagene API-Abrufe erlauben keine grüne Geh-Ampel. Im Hintergrund keine neue Arbeit. Google Maps erst durch externen Link auf Nutzeraktion; aktuelle Telefonposition nicht durch eine veraltete Origin überschreiben. Manifest-Adresse und App-ID stabil halten; keine sofortigen Android-Launcher-Updates versprechen.

## v0.1.5

Nachtlinienfarbe über die gemeinsame Linienkachel mit N-Präfix erhalten. Stationsadresse bleibt als ungefähr gekennzeichnet und wird lokal aus öffentlichen Referenzdaten ermittelt; keine Hausnummern oder exakten Stations-Postadressen erfinden.

## Nutzerentscheidung ab v0.1.5

Der Nutzer hat die bisherige eigenständige Wiener-Linien-API-Testoberfläche ausdrücklich abgewählt. Sie nicht wieder in die Hauptoberfläche aufnehmen. Fehlerprotokoll stattdessen standardmäßig geschlossen unter Einstellungen → Debugging; neue Logs ausschließlich Whitelist ohne GPS, StopIDs, Stationsnamen, Favoriten, Berechtigungen, URLs oder Rohantworten. Alte Diagnose-Links bleiben nur als Umzugshinweis erhalten. Diese aktuelle Nutzerentscheidung ersetzt ältere Erhaltungsregeln zur Testoberfläche.

Nachtlinien dunkelblau; allgemeine Karte und Listenansicht teilen Filter. Leaflet lokal gebündelt halten. Betriebsmeldungen zeigen Quelle, Gültigkeit und Linien-/Stationsbezug; keine Entwarnung bei Fehlern, keine fremden Liftstörungen nur wegen gleicher Linie. Ganze Stationsfavoriten haben Erreichbarkeit je Verbindung. Anschließend auf Nutzerwunsch ein reduziertes Wear-OS-Design starten; eine APK erst nach tatsächlichem Build/Signaturprüfung als geliefert bezeichnen.

## v0.1.6 – Bewegungshilfe

Option standardmäßig aus. Niemals Ruhe des Beschleunigungssensors allein als gesicherten Stillstand werten. Frische genaue Standortbestätigung und Kontrollversuch spätestens nach 60 Sekunden erhalten; bei erkannter Bewegung sofort Ortung wiederaufnehmen. Sensorfehler/grober Empfang behalten normale Ortung. Sensor, Watches und Timer bei Hintergrund/manuellem Standort stoppen; kein Sensor-/Positionsverlauf in Speicherung, Logs oder Netzwerk. Keine gemessene Akkuersparnis oder getestete physische Fahrt ohne Gerätenachweis behaupten. Siehe docs/motion-battery-saving.md.

## v0.1.7 – Favoriten und Meldungen

Haltestellengebundene Kurzmeldungen nicht über deren ganze Linie verbreiten. Relevanz auch gegen vorhandenen Cache prüfen. Nur passende identische/kurze Standardmeldungen vereinigen; andere Richtungen, Zeiträume, individuelle Aufzüge und Zusatzinformationen nicht entfernen. Bei gleicher ID ausführliche Monitorquelle vor Feed-Zusammenfassung erhalten.

Entfernungssortierung als Ansicht berechnen, niemals die gespeicherte manuelle Favoritenreihenfolge überschreiben. Lösch-/Verschiebeaktionen verwenden weiterhin den ursprünglichen gespeicherten Index. API-Priorität folgt derselben sichtbaren Favoritenordnung; bei mehr als 24 eindeutigen RBL 16 vordere plus acht rotierende, keine Zusatzrequests oder Hintergrundarbeit. Karte speichert nur ausdrückliche Stationsauswahl und verhindert Duplikate. Alte Symbolhilfe nicht wieder einbauen.

## UI-Präferenz ab v0.1.8

Der Nutzer bevorzugt direkt sichtbare Umschaltknöpfe für Moduswechsel, keine Dropdowns. Für die beiden Favoriten-Sortiermodi Button-Gruppe mit klarer aktiver Auswahl, aria-pressed und mindestens 44-px-Tippfläche erhalten.

## UI-Präferenz ab v0.1.9

Stationskarten ohne großes Personen-/Geh-Emoji. Statt schwebendem Abfahrten-Pill eine vollbreite klar erkennbare Aufklappzeile erhalten. Nutzer bevorzugt große Haupt-Abfahrtszahlen: gleicher 28-px-Wert in Vorschau, Abfahrtsliste und Favoriten, nicht durch ältere CSS-Regeln für schmale Displays verkleinern. Zweite Abfahrt darf kleiner bleiben.

## v0.1.10 – Standortanzeige

Standortstatus ausschließlich in der Karte Dein Standort anzeigen, nicht zusätzlich als obere Bannerzeile. Genauigkeit, Alter, Akkupause, unterwegs, manuell und Fehler dort erklären. Oberen Statusbereich für Daten-/Startfehler erhalten; bei API-Backoff keine reguläre 30-s-Aktualisierung behaupten.

## v0.1.11 – Kompakte Favoriten

Große Abfahrtszahlen nicht durch überhöhte Mindestzeilenhöhen erkaufen. Stationsfavoriten: 44-px-Mindestzeile, fünf Pixel Gruppengap; lange Richtungen dürfen natürlich umbrechen. Hauptzahl weiterhin 28 px.

## v0.1.12 – Farbschema

PWA-System/Hell/Dunkel als direkte Buttons erhalten; Theme lokal speichern, Systemänderungen ohne Polling verfolgen. Offizielle Linienfarben bleiben themenunabhängig. Helle Ansichten müssen lesbare Formulare, Menüs, Meldungen und Abfahrtszahlen behalten. Uhr weiterhin auf wenige Kernaufgaben und schwarzem Hintergrund ausrichten; keine ungeprüfte APK behaupten.

## Native Wear 0.2.0 – stabiler erster Release

Anwendung at.andrew.foamawien, Version 0.2.0/Code 1, natives Java im vorhandenen Namespace. 26 Android-Tests über scripts/test_wear.py vor Signieren erzwungen. Originaler separater Release-Key ist privat dauerhaft gesichert; bei fehlendem Key das Backup wiederherstellen, nie neu signieren. Nur öffentlicher Fingerprint in wear/release-signing.json. Keine privaten Dateien/SDKs/Maven-Caches in Quellarchiv oder Site. publish_wear_update.py erhält PWA-Metadaten und prüft den APK-Signer nochmals.

Nähe/Favoriten als einzige Hauptziele, Verbindungstap öffnet Detail, Favoritenänderung ausdrücklich. Hauptzeit 28 sp / Detail 54 sp, 48-dp-Ziele und Runddisplay erhalten. MainActivity beendet Timer/Listener bei onPause; keine Hintergrunddienste. Native WL-Anfragen über eigenen festen HTTPS-Relay. QR-Transfer bleibt vorbereitet, aber mangels Hostingdienst in erster APK nicht angeboten; nie als funktionsfähig behaupten. Native Hardwareprüfung gesondert dokumentieren.

## PWA 0.1.13 – ausgerichtete Ergebnisse

Feste Spaltenbreiten für Zeiten erhalten: Folgeabfahrt 3,6 ch, Qualitätslabel 6 em seiner eigenen Schriftgröße. Hauptzeiten weiterhin 28 px. Keine ungleich breiten LIVE-/FAHRPLAN-Labels zwischen den Minuten. Öffentliche Uhr-Webseite und PWA müssen direkt in beide Richtungen erreichbar sein, PWA-Footer zusätzlich zum bisherigen Settings-Link.


## Native Wear 0.2.1

Aktuelle Version 0.2.1 / Code 2; ursprünglichen Key, Paket und lokale Daten erhalten. WatchLocation bevorzugt verfügbares fused, sonst network/GPS, prüft geeignete Caches und versucht nach acht Sekunden Alternativen. 30 Sekunden ohne frischen genauen Fix: Ortungsanfragen beenden, klare Wiederholen-/Einstellungen-Aktion; keine unendliche Suchanzeige. Bei erfolgreichem Fix übrige Listener/Einmalanfragen stoppen, fremde verspätete Quellen ignorieren. Pause beendet alles. Standortcontroller-, Activity- und Layoutprüfungen: 39 native Tests vor dem Signieren.

Native Darstellung nach interaktivem Entwurf erhalten: Station plus Gehinfo, Linie/Richtung/Zeit nebeneinander, Richtung vor großer Detailzeit. Button-Tint/-Elevation explizit überschreiben; Hauptaktion mint, Auswahl gedeckt grün, Entfernen dezent rot und Zurück ruhig. Mehr gruppiert Standort & Nähe, Gehen & Reserve, Favoriten und App & Updates. System-Zurück erhält die Elternseite. Mindestens 48-dp-Touchziele und 12-sp-Inhalte; auf kleinen Runddisplays responsive Ränder, keine außerhalb ihrer Spalte gezeichneten Minuten. Landing-Page-Renderings nur mit Beispieldaten; keine physische Abnahme behaupten.


## PWA 0.1.14 / Wear 0.2.2

PWA: Die geschlossene Verkehrsmittelübersicht ist eine schaltbare Icon-Leiste, kein Text und kein Teil des Expand-Knopfs. Alle sechs Modi sichtbar halten, auch wenn aus. Bestehende Mode-Settings, Klappzustand und Filterlogik teilen; 44-px-Ziele, Titel/aria-pressed und lokale Inline-SVGs. Standortdetails initial immer geschlossen, Status/Kartenaktion im Kopf; Aufklappen darf nie eine Freigabe oder GPS-Abfrage auslösen. Neues Modul im SW erhalten.

Watch: Nutzer bestätigt 0.2.1 gut und lobt Mehr-/Zurück-Styling; diese erhalten. Hauptschalter mit Pin und Stern, mindestens 48-dp-Ziele. Links/rechts wischen, Button und System-Back verwenden denselben Elternpfad. Window-Swipe darf Unterseiten nicht direkt finishen; nur Root-Back schließt. Vertikales Scrollen, Abbruch und Mehrfingerbewegungen sind kein Back. Api33-Aufrufe isoliert halten.

RequestScope pro sichtbarer Sitzung. Pause/Stop/SCREEN_OFF beendet Listener, Timer, aktive HTTP-Verbindungen und queued Futures; keine späten Daten oder Backoffänderungen aus stornierten Sitzungen. SCREEN_ON darf nur bei bereits sichtbarer Activity starten. Keine Background-Services/WorkManager-Jobs. Cache maximal 3.000 / zehn Minuten / 512 KiB; Start/Pause bereinigen, Favoriten/Einstellungen erhalten. Keine GPS-Speicherung. Update-Download auf 8 MiB begrenzt, Teil-/Enddatei nur app-eigener Cache, Entfernung bei Fehler/Abbruch/Dialogschluss/Übergabe/Verlassen; gescheiterte Installer-Sitzung aufgeben. 54 Android- und 89 JS-Tests; physische Watch-Gestenabnahme separat.


## PWA 0.1.15 – Favoritenmenüs

Bearbeitungsmenüs sind transient und exklusiv; nicht in state.openDetails der Betriebsmeldungen speichern. Sofortigen Summary-Klickstatus und DOM-Zugehörigkeit bei asynchronem toggle erhalten. Nach Verschieben/Entfernen sowie Außenklick/Escape schließen. Verschiebe-/Entfernenaktionen verwenden favoriteKey, nicht einen möglicherweise alten DOM-Index. Nur Meine Reihenfolge darf die gespeicherte Reihenfolge ändern. Fokus nach Umordnen ohne Scrollen auf den verschobenen Menüknopf setzen. 97 Node-Tests, Browser-Rundlauf und Persistenzprüfung. Keine nativen APK- oder Favoriten-/Settings-Schlüsseländerungen.


## PWA 0.1.16 / Wear 0.2.3 – kompakte Schalter

Alle sechs Modi auch bei 320 px in einer Reihe halten, mindestens 44-px-Ziele; Suchradius in den Filterkopf. Routine-Status/Sortierhilfe kurz innerhalb der zugehörigen Panels, echte Betriebs-/Fehlermeldungen weiterhin erreichbar. Watch: Icon und 12-sp-Label nebeneinander, sichtbare 36-dp-Leiste mit unvermindert 48-dp-Touchzielen, höchstens 184 dp breit, Runddisplay und 1,3-fache Schrift beachten. Release 0.2.3 / Code 4, Original-Key; 54 native und 97 Node-Tests. QR bleibt vorbereitet, nicht aktiviert und nicht als verstecktes Feature bezeichnen.


## PWA 0.1.17 – Nutzerentscheidung Warnmeldungen

Manuellen Reihenfolge-Hinweis nicht mehr anzeigen. Meldungsstatus wie Bisher keine Meldung, noch nicht alle Haltepunkte geprüft oder Laden nicht wieder in Hauptansichten einbauen. Eigene Warnmeldungen-Karte ausschließlich bei relevanten vorhandenen Einträgen, ohne Leerraum bei null Meldungen. Gemeinsame Stop-/Linienrelevanz, Deduplizierung, Ablauf und ältere Daten erhalten; bei Verbindungsfavoriten nur die gespeicherte Linie einbeziehen. Fehlende Daten sind keine Entwarnung. 101 Node-Tests; Wear 0.2.3 unverändert.


## QR-Transfer ab PWA 0.1.18 / Wear 0.2.4

Übertragungsseite transfer.html und Watch-Menü Mehr → Favoriten → Mit Handy übertragen erhalten. Unabhängige lokale Favoriten, nur bewusste Übernahme; Duplikate überspringen, unbekannte Watch-Stationen zählen. AES-GCM-Schlüssel ausschließlich QR-Fragment/Arbeitsspeicher. Getrennte zufällige 192-Bit-Lese-/Schreibfreigaben, nur Hashes in D1; Token gehasht, nie Positions-/Favoritenklartext speichern oder loggen. Session zehn Minuten, keine Verlängerung durch Polls; nach Bestätigung Ciphertext sofort löschen, leere Quittung bis Ablauf, physische Ablaufbereinigung bei folgenden API-Aufrufen. Auf Uhr Transfer nur sichtbar, Pause/Back/Display aus storniert Requests/Timer und löscht Schlüssel; kein GPS oder WL-Polling während QR. Bestehenden Key/Paket/LocalStorage erhalten. D1-Migrationen unveränderlich; keine Schemaänderungen im Requestpfad. 105 Node- und 60 native Tests plus produktive Relay-/Browserabnahme nötig. QR-Testdaten/Seiten nicht im finalen Deployment belassen.


Nutzerpräferenz für alle JSON-Exporte: immer Exportdatum als YYYYMMDD_-Präfix und Anwendungsname im Dateinamen, z. B. 20261108_foama-wien-favoriten.json. Gemeinsames export-file.mjs verwenden; Datum Europe/Vienna. Bei QR-Links auch hashchange im bereits geöffneten Browser behandeln, vorherige Sitzung/Requests verwerfen.

## PWA 0.1.19 – dichtere Stationszeilen

Nutzer möchte mehr Abfahrten pro Bildschirm. Nähe-Zeilen mindestens 64 px, Richtung nur 2 px unter dem Badge, 28-px-Hauptzahlen/feste Zeitachsen und natürliches Umbrechen erhalten. Linien-Favoritensterne haben 44-px-Tippflächen, negative vertikale Außenränder sparen nur Layout-Leerraum, kein benachbartes Bedienelement überdecken. Nichtinteraktive Stationsfavoritenzeilen jetzt mindestens 40 px mit 2-px-Gap; dies ersetzt die ältere 44-px-/5-px-Abstandsregel. Keine Zahlen oder Richtungen abschneiden, um eine feste Höhe zu erzwingen. Wear unverändert.

## PWA 0.1.20 – optionale Störungs-Pushs

Neue Nutzeranweisung erlaubt regelmäßige serverseitige Störungsprüfung auch bei geschlossener PWA. GPS, Sensoren und Abfahrts-Polling auf Telefon/Uhr bleiben sichtbar-only. Push ausschließlich ausdrücklicher Opt-in; kein automatischer Freigabedialog. Fester offizieller Meldungsfeed, bekannte HTTPS-Pushprovider, verschlüsselte Geräte-/Filterdaten, gehashte Verwaltungsfreigaben, strikte Relevanz und begrenzte/deduplizierte Sammelhinweise. Keine Push-Secrets oder Filter im Diagnose-/Favoritenexport. Aus-/Ablaufbereinigung und 404/410-Abmeldung erhalten. Geplanten Auftrag nur als aktiv melden, wenn gespeichert, autorisiert und produktiv ausgeführt; kein Hintergrund-Cron allein aus vorhandenem scheduled-Handler ableiten. docs/push-notifications.md beachten. VAPID-/Speicherschlüssel nicht rotieren, Bestehende D1-Migration unveränderlich; neu erzeugte Migration append-only. esbuild über gepinnte npm-Abhängigkeit, aktuelle Wear-APK vor Site-Build verifizieren.

Unbeaufsichtigte Störungsprüfung: leerer POST /api/push/check als begrenzter öffentlicher Tick. Keine frei gewählten Empfänger/Inhalte/Filter/URLs akzeptieren, keine Gerätedaten oder Versandzahlen in seiner Antwort. Globalen atomaren Lease, Opt-in, Relevanz und individuelle Limits unabhängig vom Aufrufer erhalten. Register/Update/Test/Delete weiterhin Gerätegeheimnis. Kein MCP-Plugin oder Admin-Login für den regelmäßigen Tick erforderlich. Stündlich geplanten Auftrag separat speichern und tatsächlich gegen den öffentlichen Dienst prüfen.

Hosting-Limit: maximal ein geplanter Lauf pro Stunde. Keine mehrfach versetzten Aufgaben als Umgehung anlegen. Hintergrund stündlich, zusätzliche serverseitige Prüfung nur bei ohnehin erfolgendem aktivem Monitorabruf (circa fünf Minuten, D1-Lease). UI/Config/Dokumentation müssen diese Latenz ehrlich benennen. Für kurze unabhängige Intervalle ist ein zusätzlicher Server-Timer nötig.

Aktueller Push-Betriebsblocker: erster Plattformlauf fehlgeschlagen, Auftrag pausiert; Aktivierung via PUSH_SCHEDULER_ENABLED=false gesperrt. Nicht als funktionsfähigen Hintergrundversand vermarkten. Vorbereitetes deploy/push-timer erst nach tatsächlichem Serverzugang starten und HTTP-Quittungen/Hostgesundheit prüfen. Anschließend Runtime-Gate freischalten und Site erneut deployen. VAPID-/Speicherschlüssel erhalten.

## PWA 0.1.21 / Wear 0.2.5 – Verkehrsmittelpriorität

U-Bahn vor Tram vor Bus, nach tatsächlich belegten und in Nähe eingeschalteten Modi; innerhalb derselben Stationsgruppe nach Gehentfernung. PWA muss vor dem Listenlimit und beim Rendern dieselbe Priorität verwenden. Namen/Suffixe sind kein Modusnachweis. Manuelle Favoritenreihenfolge erhalten. Watch zeigt sämtliche geladenen Verbindungsgruppen statt der früheren Dreiergrenze. API-Budget 24 erhalten; Nähe nach Modus priorisieren, acht rotierende Plätze bei Überlauf. Favoriten-Stationspriorität bleibt erhalten, Bahnsteige je Station nach Modus.

Aktive Filter als kleine lokale Vektoren im Hauptbild; Tippen führt direkt zu Verkehrsmittel, alle Back-Wege zur ursprünglichen Nähe-/Favoritenansicht. Station/geschätzten Fußweg und erste große Minuten auf kleinen Runddisplays erhalten. Eine gemeinsame mindestens 48-dp-Tippfläche, auch bei null/allen Filtern erreichbar. Keine neue Hintergrundarbeit und keine neue Speicherung von Standort oder Modusverlauf. Native Push weiterhin offen, nicht mit diesem UI-Update als umgesetzt behaupten.

## PWA 0.1.22 / Wear 0.3.0 – aktuelle Nutzerentscheidungen

Sichtbare Stationen zuerst im bestehenden 24-RBL-/30-s-Budget, auch wenn außerhalb des Bildschirms eine höher priorisierte Metro liegt. Bei Überlauf innerhalb der Sichtbarkeitsstufe 16 feste plus acht rotierende Plätze; außerhalb liegende Stationen erst aus verbleibendem Budget. Dies ersetzt frühere Annahmen, die alle Favoriten/Modi ungeachtet der aktuellen Sichtbarkeit vorziehen. Scrollen darf keine Fair-Use-Grenzen umgehen; keine neue Hintergrundortung.

Ausgewählte Verbindungen derselben Station in einer Karte gruppieren, Stationsname stets Hauptüberschrift, Richtungen darunter. Nur Darstellung gruppieren, keine automatische Datenmigration; JSON/QR/Identität erhalten. PWA-Gruppenmenü bewegt ganze Stationen ausschließlich auf ausdrücklichen Wunsch, individuelle Verbindung bleibt separat entfernbar. Exklusive transiente Menüs und Fokus ohne Scrollen erhalten. Warnmeldungen im geschlossenen Zustand mit allen tatsächlich betroffenen Linien, aus Betreiberreferenzen bzw. eindeutigen Linientiteln; keine beliebigen Zahlen als Linien interpretieren und keine leeren Warnsektionen.

Direkter nativer FCM-Empfang ist die vom Nutzer autorisierte Ausnahme zum früheren generellen Hintergrunddienst-Verbot. Er darf nur nach ausdrücklichem Opt-in Firebase/Installations initialisieren und Hinweise rendern oder vorhandene Tokenfreigaben minimal aktualisieren; keine GPS-/Abfahrtsabfragen, keine Laufzeitverlängerung der 90-Tage-Freigabe durch Hintergrundrotation, keine automatische Neuanmeldung bei HTTP 410. Auto-Init/Analytics/BigQuery/Delegation standardmäßig aus. IDs/Geheimnisse/Inhalt nicht exportieren. Firebase-Anbindung und physische Zustellung bis zum tatsächlichen Nachweis offen benennen. Site-MCP bietet denselben begrenzten Tick ohne beliebige Eingaben; bei deaktivierter Zustellung nur Quellenprüfung. Kein aktiver Scheduler ohne nachgewiesenen Lauf. 139 Node-/77 native Tests vor dem Release; Original-Key/Paket und lokale Daten erhalten.

## PWA 0.1.23 / Wear 0.3.1 – Warnungsrelevanz

Reine Aufzüge/Fahrtreppen und zukünftige Ereignisse nicht als aktuelle wichtige Betriebswarnung zählen oder gelb hervorheben. In der PWA neutral und geschlossen als Zusatzhinweise verfügbar halten, Zeitraum und „Geplant“ erhalten. Betroffene Linien der aktuellen Warnung ausschließlich aus aktuellen Fahrbetriebsereignissen bestimmen. Push nie vor Beginn; Equipment nur mit eigener ausdrücklicher Auswahl, standardmäßig aus. Gemischte echte Fahrbetriebsstörung nicht wegen des Worts Aufzug abwerten. Native Referenzen gegen Kategorie/Zeit prüfen; unbekannte Details sind keine Entwarnung. 143 Node-/79 native Tests, Paket/Key und lokale Daten erhalten.

## Wear 0.3.2 – Transferbildschirm wach halten

Nutzer verlangt sichtbare App während QR-Senden/Empfangen einschließlich Vorbereitung und Übernahmebestätigung. FLAG_KEEP_SCREEN_ON nur für aktive sichtbare Transfers. Nach Abschluss/Back/Fehler/Ablauf/Pause entfernen; unabhängige monotone Zehn-Minuten-Obergrenze auch bei Busy/Vorschau, früheren Serverablauf beachten. Bewussten Home-/Back-/Power-Schritt nicht übergehen; keine automatische Vordergrund-Neuöffnung oder neue Dienste. GPS/Abfahrten bleiben während QR pausiert; Timer/Requests und Schlüssel bei Endpfaden löschen, späte Callbacks verwerfen. 83 native Tests; Originalschlüssel und lokale Favoriten erhalten.

## Wear 0.3.3 – aktuelle Menü- und Filterpräferenz

Erste Mehr-Ebene mit vorhandenen Icon-Karten erhalten, kurzer Name Störungen statt Störungsmeldungen. Kinder Hinweise, Push, Auswahl und Infos mit gemeinsamem Elternpfad; Statuscallback aktualisiert auch Push-Unterseiten. Auswahl grün/Haken, Hauptaktion mint, Deaktivieren rote Kontur, Navigation neutral, Zurück ruhig. Verkehrsmittelfilter immer als globale eigene Zeile VOR jeder Station – auch Favoriten. Kein Stationsname/Fußweg im Filterknopf; dies ersetzt ältere Vorgabe zur Kombination mit der ersten Station. Station-Tags nur für echte Stationsinhalte. Kurze öffentliche Uhr-Landingpage mit vier Kernfunktionen, direktem Download und bei Bedarf aufklappbarer Installation/Version; keine lange technische Featurewand. 86 native Tests, lokale Daten/Key und Transfer-Keep-awake erhalten.

## PWA 0.1.24 / Wear 0.3.4 – Verbindungsfokus und konsistente Stationen

Linien-/Richtungstap öffnet eigene PWA-Seite, Sterne bleiben ausdrückliche separate Aktion. Browser-Back/Forward, ursprünglichen Tab und Scrollposition erhalten; Auswahl flüchtig in History, keine neue Favoriten-/Standortpersistenz. Im Fokus nur bekannte Verbindungsbahnsteige, bei fehlenden Daten engster Stations-/Modus-Fallback. API liefert Bahnsteige; 24 IDs, 30 s auch bei manueller Aktualisierung/Navigation, gemeinsamer Tab-Sperre und Backoff erhalten. Alte Anfragen abbrechen, späte Antworten weder persistieren noch als Fehler zählen. Hintergrund stoppt laufende Monitoranfragen. Modul vollständig offline cachen.

Gedimmte Linien bedeuten ausschließlich keine bestätigte frische Abfahrt; keine ungeprüfte Behauptung über Betriebsschluss. Antippbarkeit, offizielle Farben bestätigter Linien und Meldungsrelevanz erhalten. Fahrzeugrichtung/Kurzführung hat Vorrang vor Monitorrichtung. Watch Nähe/Favoriten teilen stationPanel/stationHeading und dieselbe kompakte Verbindungszeile; nur Inhalte unterscheiden sich. Globale Verkehrsmittelfilter weiterhin davor, Stationsname Hauptüberschrift, Gehinfo auch in Favoriten. Native 0.3.4 / Code 11, Key/Paket/Daten und Transfer-Keep-awake erhalten.

## PWA 0.1.25 – Abstände der Stationslinien

Keine zusätzlichen Flex-Gaps zwischen den bereits 44-px-großen Linien-Tippflächen. Sichtbare Badge-Höhe 32 px; mindestens 44 × 44 px Touchziel erhalten. station-services als einspaltiger Grid-Container: Badges, Verkehrsmittel, Dimmungserklärung in getrennten Zeilen. Nicht wieder in eine gemeinsame umbrechende Flexzeile legen. Änderungen auf Stationskarten begrenzen, Warnungs-/Karten-Badges unverändert. Wear 0.3.4 bleibt erhalten.

## PWA 0.1.26 / Wear 0.3.5 – belastbare Stationslinien

Fahrwegvarianten allein sind keine regulären Stationslinien. Vorbereitung benötigt aktuellen offiziellen GTFS, kalendergültige Fahrgastfahrten, exakte DIVA/IFOPT-Identität; keine Nachbar-/Radius-Verknüpfung oder individuelle Linien-Blacklist. Geprüften Zeitraum/Quelle beilegen. candidateLines sind ausschließlich interne Kandidaten, nie ungefiltert anzeigen. Bei Katalogerneuerung GTFS aktualisieren und Wear-Assets synchronisieren.

Passive gemeinsame D1-Lernschicht erhalten: öffentliche Station/Linie/Modus, 30 Tage Bestätigung pro Linie, nur erneute konkrete Monitorbeobachtung erneuert. Upstreamserverzeit prüfen, Cachehit nie als neuen Beleg werten. Teilbatches, gefilterte RBL-Abfragen, Fehler und ausdrücklich teilweise Antworten liefern keine vollständige Prüfung. Unterdrücken erst nach >30 Tagen und mindestens drei unterschiedlichen Prüftagen/zweien Tageszeitbereichen; Nacht nur mit Nachtprüfungen. Rufbus und datiert geprüfte Fahrplanbasis nicht wegen bloßer Monitorlücken entfernen. GTFS-Snapshot und gelernte Zusätze sind unterschiedliche Belege; Snapshot muss beim Aktualisieren neu geprüft werden. Keine Abfrage bisher ungenutzter Stationen für Trainingszwecke.

Keine GPS-/Nutzer-/Gerätekennung, Favoriten oder Rohantworten in Evidenz/Logs. Öffentliche Offlinekopie begrenzen, 90-Tage-Retention; Favoriten nie wegen Unterdrückung löschen. D1-Ausfall darf Abfahrten nicht zerstören. Neue Migrationen ausschließlich append-only, keine Schemaoperationen im Requestpfad. 168 Node-, acht Python-, 90 native Tests vor Veröffentlichung; Wear 0.3.5 / Code 12, Original-Key/Paket und Transfer-Lifecycle erhalten.

## PWA 0.1.27 / Wear 0.3.6 – aktuelle Favoritenpräferenz und Reiseplanung

Sortierlabel exakt Nähesten zuerst auf beiden Geräten. Bei vorhandener Position keinen zusätzlichen Standort-/Luftlinie-Satz in PWA-Favoriten anzeigen. Ohne Position bleibt nur eine kurze Erklärung der gespeicherten Ersatzreihenfolge. Gespeicherte manual/distance- bzw. sortDistance-Werte, manuelle Reihenfolge und Abrufpriorität unverändert erhalten.

A-nach-B-Planung für PWA/Uhr ist vom Nutzer aufgenommen, Umfang und offene Dienstwahl unter docs/journey-planning.md. Ohne tatsächlich verbundenen und geprüften Planer keine Reisezeiten/Umstiege erfinden oder Funktion als verfügbar bewerben. Noch keine VAO-Vertragsannahme, kostenpflichtige Freischaltung oder stille Erweiterung des Favoriten-QR-Protokolls autorisiert.

## PWA 0.1.28 – App teilen statt Header-Reload

Nutzer möchte oben App teilen statt Aktualisieren. Native Web Share nur auf Klick; öffentliche feste Root-Adresse und Einladungstext, niemals aktuelle Seite/Fragment, Favoriten oder Standort. Abbruch ohne weitere Aktion. Fallback mit Kopieren und bewusstem WhatsApp-Aufruf; fehlende Clipboard-Freigabe durch manuellen Link behandeln. Kein automatischer Nachrichtenversand. Reguläre sichtbare 30-Sekunden-Aktualisierung und manueller Detailknopf bleiben erhalten. Wear bleibt 0.3.6. Neues Modul im Offline-Shell erhalten.

PWA-Updates: Hauptseitenhinweis mit Jetzt aktualisieren bei neuer Version/wartendem Worker. Prüfung nur sichtbar, update.json ohne Cache, fünf Minuten Abstand; keine automatischen Reloads. Service Worker wartet auf ausdrückliches FOAMA_ACTIVATE_UPDATE; nach Installation/Controllerwechsel neu laden, lokale Daten erhalten. Offline-/Timeoutfehler erlauben Wiederholen. Neue Module vollständig offline cachen.

## PWA 0.1.29 – Kopf-Icons und Reiseplanungsgrundlage

Teilen/Einstellungen gemeinsam 44-px-Ziele, 22-px-SVGs und gleiche Strichstärke. Nutzerklärung zur Karte: großer Ausschnitt kam vom gewählten großen Suchradius; bestehendes Zoom-/Radiusverhalten und Linienmarker erhalten.

journey-planning.mjs ist nur vorbereitete Grundlage, nicht in öffentlicher UI eingebunden. Tatsächlicher einzelner Transitous-Prototypabruf mit öffentlichen Testpunkten erfolgreich, neun Regressionen. Dauerhafter Zugang benötigt VAO-Schlüssel oder passende offene Projektlizenz für Transitous; Quellcode-Download allein ist keine Open-Source-Lizenz. Keine Lizenzvergabe, Vertrag oder Kosten ohne Nutzerentscheidung. Keine A-nach-B-Oberfläche als fertig bezeichnen; Anbieterplanzeiten und tatsächliche Monitoralternativen getrennt halten.

## PWA 0.2.0 / Wear 0.3.7 · aktuelle Nutzersteuerung

A nach B und lokale Routenfavoriten zuerst in der PWA erproben. Übernahme und Umfang auf der Uhr erst danach gemeinsam festlegen; kein verdecktes natives Routing aktivieren. Watch-Scrollfix bleibt ausdrücklich beauftragt. Neue Liniendetails immer oben, regelmäßiger Refresh erhält Leseposition, veraltete Scroll-Runnables bei Navigation verwerfen.

Transitous ist gewählt, eigener App-Code unter MIT öffentlich; Daten-/Drittkomponenten ausgenommen. Fester Server-Endpunkt, UA/Kontakt und sichtbare Transitous/OSM-Quellen erhalten. Keine präzisen Suchinputs in serverseitiger Speicherung/History/Logs, nur begrenzte aggregierte Lastzähler. Vollroute nur auf Aktion. Gespeicherte Wege sind lokale explizite Favoriten, keine gültigen alten Fahrzeiten; GPS-Start dynamisch ohne gespeicherten GPS-Fix. Monitordaten nicht als sicher identische geplante Fahrt ausgeben. Plan+Weg zusammen max. 700 pro konservativen 25 h, keine Umgehung bei fehlender DB.

## PWA 0.2.2 · Navigation

„A nach B“ ist ausdrücklich der dritte Haupttab und ersetzt „Mehr“. Kein zusätzlicher Routenbanner. Einstellungen über das bestehende Zahnrad. Diese Nutzerpräferenz bei weiteren Umbauten erhalten.

## PWA 0.3.0 / Wear 0.4.0 · Fahrtkarte, Adressen und Routen auf der Uhr · 09.11.2026

A nach B bleibt der dritte Haupttab. Start ist dynamisch „Dein Standort“; eine Suche löst GPS erst nach Klärung getippter Adressen aus. Adresse/Ort per Suchen oder beim Absenden auflösen, mehrdeutige Treffer ausdrücklich wählen. Start/Ziel auf lokaler Leaflet-Karte als Station oder freier Kartenpunkt auswählen. Reise/Karte zeigt echten MOTIS-v6-Verlauf (Präzision sechs); fehlende Geometrie nur ausdrücklich gestrichelt/schematisch zwischen bekannten Punkten. Kartenbewegung löst keine Neuplanung aus.

Abfahrt oder Stationsname in einer Reise öffnet eine eigene ganze Stationsansicht mit allen bekannten Linien/Richtungen und eigenem Zurück-Pfad. Gemeinsames 24-RBL-/30-s-Budget bleibt erhalten, Navigation und Hintergrund verwerfen verspätete Ergebnisse. Meine Routen: große Karten/Tippflächen, eigene Namen, Menü und Rückgängig nach Entfernen. Öffnen eines Favoriten lädt aktuelle Linienzeiten, keine alte Gesamtfahrtdauer; Neu planen bleibt ausdrücklich.

Aktuelle Nutzeranweisung erweitert den früheren PWA-zuerst-Umfang: gespeicherte Routen dürfen jetzt per QR auf die Uhr und zurück. Stationen bleiben im v1-Format kompatibel, Routen verwenden foama-favorites-v2 und die ausdrücklich vom neuen Watch-Code gemeldete Fähigkeit journey-favorites-v1. Vorschau und bewusste Bestätigung, unabhängige lokale Listen, bestehende Reihenfolge/Duplikate und zehn Minuten AES-GCM bleiben erhalten. GPS-Endpunkte dynamisch ohne Fix/Geometrie; QR enthält keine Liniengeometrie, alten Zeiten oder Trip-IDs. Höchstens 30 Routen/32 KiB Transferklartext. Uhr zeigt Einstieg und nächsten Umstieg mit aktuellen exakt zugeordneten Linienzeiten; Weiter zum Umstieg/Alle Abfahrten/Zurück. Keine native Vollroutensuche und keine Anschlusszusage. Transfer-Display bleibt sichtbar wach, Pause/Back/Ende geben den Bildschirm frei.

Neue Nutzeranweisung ersetzt die frühere Einschränkung des Routen-QR-Formats bzw. Watch-Routenanzeige. Keine neuen Konten oder Hintergrundplanung daraus ableiten. Eigene neue Kartenmodule bare und versioniert offline cachen. D1-Migration 0004 ergänzt ausschließlich nullable capabilities; ältere Migrationen unverändert. Versionsziel PWA 0.3.0, Watch 0.4.0/Code 15, Originalschlüssel/Paket erhalten.

PWA-Stand 0.3.1: alle neuen internen Modulimporte versionieren, damit ein noch wartender alter Worker keine inkompatible Bare-Import-Version mischt. Geocoder-Dubletten derselben postalischen Adresse nur innerhalb 150 m zusammenfassen; unterschiedliche Gebiete/entfernte Namen bleiben getrennt. Nach bewusster Ortswahl eine zuvor gestartete Suche fortsetzen, keine selbsttätige Suche beim bloßen Tippen. OSM-Kacheln mit echter App-Origin als Referer gemäß https://operations.osmfoundation.org/policies/tiles/; nur für diese Bilder strict-origin-when-cross-origin, keine Übermittlung von Seitenpfad/Fragment/GPS im Referrer und keine Kachel-Proxys/Prefetchs.

Endstand PWA 0.3.2: Reise-Monitor und Stationskarte teilen den ISO-fetchedAt-Vertrag der Hauptansicht. journeyLineDepartures muss ISO- und numerischen Adapterzeitstempel akzeptieren und nach gleichem Alter/Zukunftsgrenze prüfen. Regression mit echter Parser-/Cache-Kette und öffentlicher Stationsabnahme erhalten. Uhr bleibt 0.4.0 / Code 15.

Endstand PWA 0.3.3 / Wear 0.4.0: Eigene Routennamen auch beim bewussten erneuten Speichern desselben neu geplanten Linienwegs erhalten. Keine doppelten Favoriten; aktualisierte Wegdaten behalten die vorhandene ID und den vergebenen Namen.

## PWA 0.4.0 / Wear 0.4.1 · Etappenfokus und alternative Wege · 09.11.2026

Stationsnamen stehen über Linie/Richtung in Suchergebnissen, gespeicherten Wegen, Reiseabschnitten und nativen Liniendetails. Antippen einer Verbindung öffnet ausschließlich diese Station/Linie/Richtung; Alle Abfahrten ist eine bewusste separate Aktion. Jede angetippte zweite/dritte Etappe erhält ihren eigenen Abruf-Scope, alte Antworten werden verworfen. 24 RBL/30 Sekunden und sichtbare App bleiben erhalten.

Gehzeit antippen klappt die Karte genau dieses Fußwegs auf. Vorhandene Providergeometrie wird verwendet, fehlender Verlauf ehrlich als schematisch/fehlend bezeichnet. Kein zusätzlicher Planerabruf durch Karte oder Countdown; regelmäßige Zeiten-Updates erhalten geöffnete Abschnittskarten. GPS ist als Startquelle vorbelegt: Ort suchen ist bei gesetztem Punkt inaktiv; klare Erklärung, dass Verbindungen suchen die Planung/GPS startet. Kompaktere Abstände bei mindestens 44-px-Zielen. A nach B hat ein lokales Vektoricon. Sichern und Handy/Uhr-Übertragung liegen in Einstellungen. Rückgängig nach Entfernen verfällt nach genau 60 Sekunden und kann auch nach verspätetem Hintergrund-Timer nichts mehr herstellen.

Alle unterschiedlichen Linienwege aus einer ursprünglichen Planung gehören als Alternativen zur gewählten Route. Der Planer wird einmal nach acht Verbindungen gefragt; spätere Fahrten desselben Linienwegs werden nicht dupliziert. Gemeinsame Fahrtabschnitte erscheinen einmal, Varianten beim passenden Verzweigungspunkt. Wechsel zeigt stets eine vollständige Providerverbindung, keine selbst aus unterschiedlichen Fahrtzeiten zusammengesetzte Anschlusszusage. Gespeicherte Wege bleiben zeitlose Templates mit aktuellen passenden Linienzeiten. Pro Route höchstens 16 unterschiedliche Wege; weitere Zusammenführung schlägt vor einer Änderung verständlich fehl, statt alte Varianten zu löschen. Keine Hardcodes für Beispieladressen oder Stationen.

Routenfamilien bleiben ein Favorit inklusive Alternativen, Namen und ID. JSON/QR behalten das v2-Format; neue optionale alternatives. Native 0.4.1 meldet journey-alternatives-v1 zusätzlich zu journey-favorites-v1. Ältere Uhren erhalten mit sichtbarem Hinweis nur die Hauptroute. Neue Alternativen werden nach Vorschau/Bewusster Übernahme in bestehende Route ergänzt, ohne sie umzubenennen oder zu duplizieren. Alle Varianten entfernen absolute alte Zeiten/Trip-IDs, GPS-Fix und erste/letzte GPS-Geometrie; QR streicht sämtliche Geometrie/Abschnittskoordinaten. Zehn-Minuten-Verschlüsselung und Transfer-Keep-awake unverändert.

227 Web-/Server-, 103 Android- und acht Python-Prüfungen bestanden. Java↔WebCrypto für Stationen, Routen und Routenfamilien geprüft. Original-Key/Paket und bestehende Gerätespeicher erhalten. Physischer OnePlus-/GPS-/Kamera-Test bleibt gesondert.

Diese aktuelle Nutzersteuerung ersetzt die frühere Vorgabe, dass Abfahrtstaps aus einer Reise immer die ganze Station öffnen: aktueller Fokus ist die angetippte Linie UND Richtung; alle Linien nur über separate Aktion/Stationsnamen. Alternativen generisch für jede Suche aus den initialen Ergebnissen merken und in die ausgewählte Route aufnehmen. Keine zusätzliche unabhängige Suche je Alternative, keine hartkodierten Beispielrouten. Beim Zusammenführen bestehende Wege/Namen/ID behalten; Variante nur als ganze ursprünglich geplante Verbindung wechseln. Unterseiten und zweite/dritte Etappe dürfen niemals die erste Verbindung als Abrufziel beibehalten. Rückgängig maximal 60 s, Aktionen in Einstellungen, kompakte Abstände und neues Route-Icon erhalten.

Native Downloads: R2 BUCKET enthält ausschließlich bekannte öffentliche signierte APKs. site/native-releases.json append-only erhalten, niemals alte Metadaten/Dateien bei Workspace-Recovery entfernen. Nur aktuelle APK zusätzlich eingebettet. Uploadpfad ausschließlich bekannte Dateinamen/exakte Größe/SHA, keine beliebige Dateiverwaltung oder Löschroute. Privatkey bleibt lokal/privates Backup und wird niemals hochgeladen.

Endversion PWA 0.4.1 / Wear 0.4.1 (16). GPS-Auswahlfarbe beim Tippen einer Adresse sofort zurücknehmen; zusätzliche Ortssuche ist bei bereits gesetztem Standort inaktiv. Bei Rückkehr/Storageevent lokale Routenliste nach QR-/Dateiübernahme neu einlesen. Frühere signierte 0.3.7/0.4.0 und aktuelle 0.4.1 sind bytegleich in R2 gesichert; öffentlicher Downloadpfad stabil. Einmalige Importoberfläche entfernt.

Finale PWA 0.4.2: produktiver Planerabruf mit acht Verbindungen erfolgreich; numItineraries und maxItineraries beide acht. Verbindungsdetails sind ausdrücklich für die gewählte Linie/Richtung beschriftet. Uhr bleibt 0.4.1 / Code 16.

Abschließender Stand: PWA und Wear 0.4.2 / nativer Code 17. 231 Web- und 104 native Tests. Routenzeit-Zuordnung verwendet vollständige normalisierte Endstationsnamen, reine S/U-Suffixe und zusätzliche Monitor-via-Texte; explizite geplante via-Abweichungen nicht verbinden. Routenfamilienidentität bleibt strikt getrennt. Originalzertifikat erhalten.

PWA 0.4.3: favorite-station-lines begrenzt seine Grid-Spalte mit minmax(0,1fr). Verbindungsfavoriten verwenden Linie/Stern + Zeiten, ganze umbrechende Richtung, ganzen Erreichbarkeitshinweis als getrennte Grid-Zeilen. 28-px-Hauptzeiten und 44-px-Stern bleiben; negative überlappende Sternränder nicht wiederherstellen. Schmale Header-/Tab-Inhalte dürfen die Seite nicht verbreitern. Keine kaschierende globale overflow-x-Sperre statt korrekter Größen. Native unverändert 0.4.2/17. Temporäre Layoutprüfseite vor Abschluss entfernen.

Öffentliche Browserabnahme für 0.4.3: 320/360/420 px Rahmen, tatsächliche Clientbreiten 305/345/405 px; scrollWidth=clientWidth, keine sichtbaren Überläufe auch nach Monitor-/Countdown-Updates, leere und lange Verbindungszeilen, Hell/Dunkel. Reale 44×44-px-Sternfläche verifiziert. Temporäre Prüfseite entfernt.

## PWA/Wear 0.5.0 – aktuelle Nutzersteuerung

Direktes A-nach-B-Hauptziel auf der Uhr ausdrücklich gewünscht, auch leer. Native Vollplanung weiterhin in der PWA; Uhr zeigt importierte zeitlose Routen. QR und Datei mit Vorschau/bewusster Übernahme erhalten, Dateipicker-Fehlen mit QR-Fallback erklären. Routenkarte/Favorit zeigt trotz freiem Namen erste und letzte Transitstation. Orte bleiben lokal und außerhalb des QR-Formats; physische Adresse als Routenendpunkt belassen, um Identität nicht durch Ortslabels zu ändern.

Routenvergleich darf genau eine zusätzliche Transfer-Pareto-Profilanfrage in der ursprünglichen bewussten Suche machen. Beide realen Upstreamaufrufe einzeln budgetieren. Abfahrtssuchen nach frühester Ankunft, Ankunftssuchen nach spätester Abfahrt bewerten, nicht nach bloß kürzester Fahrtdauer. Zeitverlust konkret anzeigen. Teilantwort ehrlich kennzeichnen; Umschalten ohne API. Rückfahrt neu planen, nicht alte Richtung umdrehen. Frühere GPS-Koordinaten werden nicht gespeichert, daher Rückfahrtziel ausdrücklich wählen.

Stationen dürfen jetzt eine amtliche benachbarte Zugangsadresse mit Hausnummer zeigen: maximal 100 m und sichtbarer Abstand, Quelle und Einordnung. Niemals Nachbargebäude als bestätigte Stations-Postadresse ausgeben oder Navigationskoordinaten dadurch ersetzen. Ableitung aus vollständigem ZUGANGSADROGD ohne Nutzerdaten.

Normale Uhr-Aktualisierung 30 s bleibt. Nutzer hat optionalen Ultra-Sparmodus beauftragt: standardmäßig aus, unter 20 % informieren, opt-in automatisch aktivieren, ab 25 % mit Hinweis normal. Standort 5 min/Einzelfix, Abfahrten 90 s, Render 30 s; alte Daten und Positionen bleiben unsicher. Im Hintergrund keine Ortung/Abfahrten, keine zusätzlichen Jobs. Updateprüfung lädt nur Versionsfeed: 3–4 geprüfte Neuerungspunkte pro angebotener Version, Download erst nach eigener Bestätigung, Prozent/MB anzeigen. Originalsignatur, Größen-/Hashprüfung und Abbruchcleanup erhalten.

Abnahme 0.5.0: 240 Web-, 116 native und acht Python-Tests bestanden. Öffentliche Route, Rückfahrt/LIVE-Gegenrichtung, Meine Orte/Reload, Stationsadresse und Updateübernahme geprüft. Öffentliche APK bytegleich verifiziert; Paket/Signatur erhalten. Physische Gerätemessungen nicht behaupten.

## Native 0.5.1 / Code 19 – Import in Einstellungen

Nutzer verlangt einen gemeinsamen Import aller Favoritentypen in den Uhr-Einstellungen. Mehr → Favoriten → Aus PWA importieren erhalten: Haltestellen, Linien/Richtungen und A nach B, QR sowie JSON mit Vorschau und bewusster Übernahme. Bestehende Listen/Duplikatregeln und Verschlüsselung erhalten. Zurück/Abbruch/erfolgreicher Dateiimport führen ins aufrufende Menü; QR-Pause ebenfalls. PWA 0.5.1 ergänzt auf aktuellen Nutzerwunsch beide Karten-Favoritenaktionen; nativen Release nie unter gleichem Dateinamen mit geänderten Bytes veröffentlichen.

## PWA 0.5.1 – Favoritentypen auf Standortkarte

Nutzer fordert beide Aktionen im Standortkarten-Popup: ganze Haltestelle sowie einzelne Linien/Richtungen. Gemeinsame Favoritenauswahl mit initialStop wiederverwenden, Karte darunter geöffnet lassen und nach Schließen zurückkehren. Ganze Haltestelle darf den Linienknopf nicht deaktivieren; mehrere unabhängige Richtungen und bestehende Favoriten erhalten, keine Duplikate. Gemeinsames WL-/Sichtbarkeitsbudget nicht umgehen. Beide Aktionen ebenfalls in der passenden Stationsliste anbieten.

Abnahme 0.5.1: 242 Web- und 118 native Tests bestanden. Öffentlich Karte → Linien/Richtungen → U6/Siebenhirten gespeichert → zurück auf dieselbe geöffnete Karte geprüft. Ganze Haltestelle bleibt als eigene Aktion erhalten. APK 0.5.1/19 öffentlich bytegleich verifiziert; physische Uhr-Abnahme weiterhin separat.

## PWA/Wear 0.6.0 – Push fortsetzen

Aktuelle Nutzeranweisung erlaubt Fortsetzung der Störungsbenachrichtigungen. Alten Scheduler-Blocker durch tatsächlichen unbeaufsichtigten Tool-Lauf behoben (09.11.2026, 11:08 Wiener Zeit, completed plus persistierte Server-Prüfzeit). Bestehenden Auftrag Automation_49062dc550ac8191a2d0658eaad0a1d1 erhalten, genau ein Stundenauftrag mit foama_check_disruptions und foama_push_status, keine zeitversetzten Paralleljobs als Frequenzumgehung. Hosting-Gate auf true, Intervall ehrlich 60 min; aktive Monitoraufrufe ergänzen ca. fünf Minuten. Kein nicht gestarteter Hostinger-Timer als aktiv vermarkten.

Push-Auswahl muss A-nach-B-Favoriten und Alternativen berücksichtigen, maximal 100 bekannte Stationen, nur Linie/RBL-Referenzen ohne Endpunktadressen/GPS/Favoritennamen. PWA bei sichtbarer Rückkehr auch innerhalb von fünf Minuten aktualisieren; Uhr nach Änderungen dirty markieren. Geplantes und Aufzüge getrennt, kein Quellenfehler als Entwarnung. Direkter FCM-Empfang auf der Uhr bleibt bis bestätigter Firebase-Konfiguration und später physischem Test offen. VAPID-/Speicherschlüssel nicht rotieren.

## Wear 0.6.1 / Code 21 · Favoritenansichten und QR-Rückkehr · 09.11.2026

Im Favoriten-Tab trennt ein direkt sichtbarer Umschalter **Routen** und **Stationen**. Die Stationsansicht trägt die Überschrift **Haltestellen & Linien**. Die ausdrücklich gewählte Ansicht bleibt lokal über Aktualisierung, Detailnavigation und App-Neustart erhalten. Ohne bisherige Auswahl erscheinen bei vorhandenen Routen zuerst Routen, sonst Stationen; beide Bereiche bleiben auch leer erreichbar. Nur Stationen der gewählten Ansicht sind Monitorziele, laufende alte Anfragen werden beim Wechsel verworfen. Gemeinsame Abrufgrenzen, lokale Favoriten und Push-Auswahl bleiben erhalten.

Nach bewusst bestätigtem QR-Import und erfolgreichem Transferabschluss öffnet die Uhr direkt Favoriten: Routen bei mitübernommenen Routen, sonst Stationen. Der Transfer wird beendet, Schlüssel und Wachhalteflag werden freigegeben. Abbruch, Fehler und Ablauf bleiben im bisherigen Fehler-/Zurück-Pfad; bei fehlender Abschlussquittung bleibt die Übernahme gespeichert und die bestehende Wiederholung erreichbar. Dateiimport und Senden ans Handy behalten ihren bisherigen Rückweg. Originalpaket und Release-Key bleiben erhalten; PWA 0.6.1 korrigiert auf Nutzerwunsch die Routenbeschriftung zu **Alternativen nach …**; Alternativen und Planung selbst bleiben erhalten.

Abnahme 0.6.1: 244 Web-/Server- und 124 native Tests erfolgreich. Originalpaket/Release-Key und lokale Daten erhalten. Neue APK unter eigenem Dateinamen, unveränderte frühere Veröffentlichungen. Physische Geräteabnahme separat.

## PWA 0.6.3 – Zeitkorrektur und Fahrzeug-Barrierefreiheit

Nutzer wünscht spätere Live-Prognosen dezent sichtbar, ausdrücklich ohne Warnung. Nur dieselbe eindeutig bekannte Planabfahrt vergleichen (RBL/Linie/Richtung/Modus/Planzeit), frische Live-Snapshots, neuerer Abruf und mindestens 30 s absolute Verschiebung. Kein Vergleich des ersten Listenelements oder Countdown-Minuten. Keine Ableitung einer Störung/Verspätungsursache. Rein flüchtige WeakMap-Metadaten, höchstens 2 min und nie länger als die Frische, keine Zusatzabfragen, Logs oder Push. Fehlende Identität, Duplikate, erste Live-Angabe und Cold-Start-Cache unmarkiert. Vorwärtskorrektur wieder früher hebt den Hinweis auf.

Barrierefreiheit nur aus explizitem API-Boolean; departure.vehicle.barrierFree überschreibt line.barrierFree. Fahrzeugdaten nur bei bestätigtem true und frischem Abruf zeigen. Unbekannt, false oder Fehler nicht als sichere Gegenbehauptung darstellen. Rollstuhl-Symbol meint Fahrzeug, kein Stations-/Reisewegversprechen. Details und amtliche Quelle in docs/departure-indicators.md. PWA 0.6.3, native Wear 0.6.1/21 bleibt unverändert.

## PWA 0.6.4 – schmale Hauptnavigation

Für Startseite und Reiseansicht denselben einzeiligen Tab-Stil auch auf HTML-buttons anwenden. Bei schmalen Displays keine zweite Labelzeile, keine Beschneidung und keine kleineren Tippflächen als 44 px. Anzahl der Favoriten erhalten. Überflüssige NBSP im Buttontext entfernen; gezielte Schrift-/Abstandsanpassung bis 340 px. Neue Shell-Version, da 0.6.3 bereits im QA-Browser installiert war. Wear 0.6.1/21 unverändert.
