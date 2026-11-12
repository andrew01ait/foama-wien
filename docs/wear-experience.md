# Uhr-App 0.9.1: Abfahrten zuerst

Die Hauptziele bleiben Nähe, Favoriten und A nach B. Abfahrtszeit, nächste Verbindung, Gehzeit und Erreichbarkeit haben Vorrang. Karten und Fahrzeuge sind bewusst optionale Detailansichten. Keine neuen dauerhaften Jobs, keine Ortung oder Abfahrtsabfragen bei ausgeschaltetem Bildschirm.

| Einstieg | Verhalten |
| --- | --- |
| Nähe | Karte neben den Verkehrsmitteln; Abfahrten bleiben unmittelbar darunter. |
| Favoriten | Routen/Stationen bleiben getrennt und die Auswahl gespeichert. Der ausschließlich für Nähe gültige Verkehrsmittelfilter belegt hier keine Zeile mehr. Doppelte Abschnittstitel entfallen bei gefüllten Listen. |
| Verbindung | Station, Linie, Richtung und großer Countdown; anschließend Fahrzeuge im Anflug und Station auf Karte. Zurück erhält die Ausgangsliste und Leseposition. |
| Route | Aktueller Einstieg groß, nächster Umstieg als kurze Vorschau mit aktueller Linienzeit. Weiter zum Umstieg bleibt eine bewusste Aktion. |
| Tile | Zwei direkte Einstiege: Favoriten und In der Nähe. Keine dort eingebauten Abfahrts-, GPS- oder Hintergrundabfragen. |

## Neue Funktionen finden

| Funktion | Weg auf der Uhr |
| --- | --- |
| Stationsliste | Karte → Liste; vor und nach einer Stationswahl erreichbar. |
| Stationskarte | Nähe → Karte neben den Verkehrsmitteln; alternativ Station öffnen → nach unten zu Station auf Karte. |
| Wiener Linienverlauf | Stationspunkt antippen → Stationsname am unteren Kartenrand → Linie … zeigen. |
| Fahrzeuge im Anflug | Eine konkrete Wiener U-Bahn-, Tram- oder Busverbindung öffnen → nach unten zu Fahrzeuge im Anflug. |
| Aktueller Routenabschnitt | A nach B → gespeicherte Route oder Favoriten → Routen → Route. Weiter zum Umstieg zeigt den nächsten Einstieg. |
| Schnellzugriff | In der Kachelverwaltung der Uhr foama hinzufügen. Die beiden Aktionen öffnen Favoriten bzw. In der Nähe. |
| Layout und Leseposition | Automatisch je Display und Systemschrift; kein zusätzlicher Schalter. |

Routen zunächst in der Handy-PWA speichern und unter Einstellungen → Favoriten → Aus PWA importieren übernehmen. Auf der Karte zoomen Pinch, Plus/Minus und Drehkrone; Ziehen verschiebt den Ausschnitt. Der linke ◎-Knopf zentriert auf die eigene Position. Auf ausdrücklichen Nutzerwunsch bleibt er **ohne sichtbares Standort-Textlabel**. Antippen bestätigt den blauen Punkt auch bei bereits zentrierter Karte; Suche, fehlende Freigabe, deaktivierte Ortung, ungenauer Empfang und Timeout erhalten eine Rückmeldung.

## Bildschirmgrößen

`WatchLayout` entscheidet anhand verfügbarer dp, runder Displayform und Systemschrift. Kleine Displays und große Schrift erhalten gestapelte Verbindungszeilen: Linie und Minuten, darunter Richtung und Erreichbarkeit. Keine horizontal gestauchten Buchstaben. Die Hauptnavigation kürzt bei Platzbedarf ausschließlich die sichtbaren Bezeichnungen zu „Favor.“ und „A → B“; die zugänglichen Namen bleiben vollständig. Tippflächen mindestens 48 dp. Das Schema zeigt zwei vorherige Stationen, auf größeren Displays bei normaler Schrift bis zu vier.

Automatische Layoutprüfung bei 192, 204, 225 und 240 dp mit normaler und vergrößerter Schrift; native Ansichten werden zusätzlich als runde Bilder gerendert. Das ist keine physische Messung eines Pixel-, Galaxy- oder OnePlus-Geräts. Die OnePlus Watch 2R benötigt weiterhin die gesonderte Geräteabnahme.

## Stationskarte

Native Mercator-Karte mit lokalen Stationskatalogen aller vier Städte, frischem vorhandenem Standort und Genauigkeitskreis. Initialer Ausschnitt berücksichtigt Displaybreite und Suchradius. Pinch, Plus/Minus und Drehkrone zoomen; Ziehen verschiebt. Der Zentrierknopf verändert den Ausschnitt nur bewusst. Ein vorhandener ausreichend genauer Fix wird übernommen; sonst erfolgt bei bereits freigegebenem Standort genau ein Vordergrundversuch. Keine neue Berechtigungsaufforderung durch bloßes Öffnen der Karte.

Stationspunkte bleiben ohne Kartenhintergrund nutzbar. Die Stationsauswahl zeigt Name, verfügbare Linien und bei verlässlichem Fix eine geschätzte Gehzeit. Antippen öffnet Abfahrten bzw. einen Wiener Linienverlauf. Geometrien stammen aus denselben gebündelten offiziellen Linienpaketen wie in der PWA; sie werden mit `scripts/sync_wear_assets.py` übernommen. Andere Städte besitzen hier noch keine Liniengeometrien.

OpenStreetMap-Kacheln werden nur für den sichtbaren Ausschnitt angefordert: höchstens vier in einem Durchgang, zwölf im RAM, ein HTTP-Cache bis zwei MiB unter Beachtung der Quellen-Cacheheader. Kein Vorabladen ganzer Regionen. Bei Fehlern mindestens eine Minute Pause je Kachel; Schließen, Display aus und Hintergrund schließen laufende Verbindungen. Attribution bleibt in der Karte sichtbar. GPS wird nicht an den foama-Monitor übertragen; Kartenkacheln werden direkt beim Kartenanbieter angefordert.

## Fahrzeuge im Anflug

Nur für unterstützte Wiener U-Bahn-, Tram- und Busverbindungen. Der vorhandene Abfahrtscountdown bleibt sofort sichtbar. Die native Uhr zeigt danach eine Ankunftsprognose, ein kurzes Stationsschema und höchstens zwei zugeordnete Fahrzeuge. Positionen sind ausdrücklich geschätzt, keine Fahrzeug-GPS-Ortung. Fehlende oder widersprüchliche Daten erzeugen keine erfundenen Marker. Ältere Lagen sind grau und verschwinden nach spätestens 90 Sekunden.

Der schmale Endpunkt `/api/wear/approach` verwendet die unveränderten PWA-Funktionen zur Kalender-/Quellenprüfung, Richtungszuordnung und Zwei-Quellen-Bestätigung. Er akzeptiert ausschließlich bekannte Linie, Modus, Station und Richtung. Ein Ausschnitt nutzt höchstens acht Haltepunkte und den vorhandenen Monitor-Relay mit dessen Budgets, Cache und Fehlerpausen. Die Antwort liefert die Zielstations-Abfahrten aus genau demselben Abruf. Sie ersetzt auf der Uhr die normale Monitoranfrage dieser Ansicht; kein paralleler Fahrzeug-Poller.

Ab 0.8.1 teilen Stationen derselben Linie, Richtung und Fahrplanbasis einen kanonischen Tracker über die gesamte Richtung. Beim Wechsel werden vorhandene Quellen, Bestätigungen und Fahrtkennungen weiterverwendet; fehlende fremde Halte sind keine neue Leerbestätigung. Nur der aktuell ausgewählte Stationsbereich erzeugt eine begrenzte Anfrage; vorhandene andere Linien bleiben passiv. Überlappende gleichzeitige Stationsaufrufe teilen dieselbe laufende Anfrage. Quellen-Cacheablauf plus Reserve, 30 Sekunden ab Anfragebeginn und längere Fehlerpausen werden erhalten. Keine zusätzlichen Ganzlinien-Hintergrundscans auf der Uhr.

Die Uhr hält höchstens vier Antworten mit jeweils höchstens 65.536 Zeichen für fünf Minuten im Activity-Arbeitsspeicher. Wiederöffnen, Detail/Zurück und die optionale Karte setzen diesen Stand und die gemeinsame Abrufsperre fort. Lesen verjüngt weder Quellenzeit noch Fahrzeugalter. Linie/Richtung/Station/Modus sind im Cacheschlüssel getrennt. Wechsel beendet die bisherige aktive Anfrage, verspätete Antworten ändern die neue Ansicht nicht. Prozessende darf diesen flüchtigen Cache verlieren.

Bis tatsächlich sichtbare Fahrzeuge vorhanden sind, erscheinen nur Prognose, kurzer verständlicher Status, ein sechs dp hoher Fortschrittsbalken und der nächste Abgleich. Das leere Schema entfällt. Die Fortschrittsstufen stammen aus derselben Readiness-Berechnung wie in der PWA. Gehaltene bzw. ältere Lagen bleiben grau und verschwinden nach 90 Sekunden; ein Quellenfehler erneuert ihre Position oder Zeit nicht. Nicht unterstützte Verbindungen behalten normale Abfahrtsaktualisierungen.

Öffentlicher Schätzzustand liegt nur kurz im Worker-Speicher: höchstens vier Linienpakete und 24 Liniensitzungen mit je höchstens 24 Zielboards, nach fünf Minuten unbenutzte Sitzungen entfernen. Keine Gerätekennung, Favoritennamen, Nutzerkoordinaten oder dauerhafte Fahrtgeschichte. Ein Worker-Neustart darf eine erneute Bestätigung erfordern. Wiederholte Cacheantworten sind keine zweite Quelle. Fehler und Retry-After werden berücksichtigt. Der normale gemeinsame 30-s-Abstand und der optionale 90-s-Ultra-Sparmodus bleiben auf der Uhr wirksam.

## Veröffentlichung und Prüfung

Paket und ursprüngliche Release-Signatur bleiben erhalten; 0.9.1 ist Code 32. Der Update-Download und die Installer-Übergabe aus 0.7.4 bleiben bestehen. Das Tile verwendet AndroidX Tiles 1.4.1 / ProtoLayout 1.2.1; die ursprüngliche Datei `firebase-dependencies.json` hält aus Kompatibilitätsgründen jetzt auch diese nativen Abhängigkeiten und ihre SHA-256-Prüfsummen fest.

Vor Veröffentlichung: native Tests, Originalsignatur, APK-Metadaten, zipalign, Größe/Hash und öffentlicher Bytevergleich. Zusätzlich auf der physischen Uhr: Update ohne Deinstallation, Schriftgrößen, Kartenzoom/Drehkrone/Back, echter GPS-Fix, Tile hinzufügen und Vordergrund-/Display-aus-Verhalten prüfen.

## Einstellungen finden

Am Ende der Hauptansichten steht der bisherige Mehr-Zugang ab 0.8.2 als **Einstellungen** mit Zahnrad. Der Menüpunkt **App & Updates** enthält die Updateprüfung, **Favoriten** den PWA-Import. Der Rückweg führt weiterhin zur vorherigen Nähe-/Favoriten- oder Routenansicht. Keine neue Zeile über den Abfahrten.

## Offline ab 0.9.0

Einstellungen → Offline-Fahrplan zeigt Gültigkeit und manuelle Erneuerung. Vollständige Wiener Sollzeiten sind bereits mit der APK verfügbar, auch für Nähe, Stations-/Linienfavoriten und importierte Routen. Fester Ablauf in Wiener Zeit; kein Verlängern durch Download oder Neustart. Ohne Netz GPS sofort und bis zu 90 Sekunden suchen; letzte echte Position höchstens zehn Minuten nur im RAM behalten. [Kalender-, Update- und Standortvertrag](wear-offline.md).

## Karte ab 0.9.1

Liste bleibt oben immer erreichbar. Die gewählte Linie beschränkt Zeichnung, Antippen und Liste auf die angezeigte Strecke. Stationsaktionen → Alle Stationen zeigen stellt den allgemeinen Katalogfilter wieder her. Eigene Position und gewählter Halt bleiben erhalten. [Prüfung und Grenzen](wear-os-release-0.9.1.md).
