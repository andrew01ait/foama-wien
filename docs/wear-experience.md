# Uhr-App 0.8.0: Abfahrten zuerst

Die Hauptziele bleiben Nähe, Favoriten und A nach B. Abfahrtszeit, nächste Verbindung, Gehzeit und Erreichbarkeit haben Vorrang. Karten und Fahrzeuge sind bewusst optionale Detailansichten. Keine neuen dauerhaften Jobs, keine Ortung oder Abfahrtsabfragen bei ausgeschaltetem Bildschirm.

| Einstieg | Verhalten |
| --- | --- |
| Nähe | Karte neben den Verkehrsmitteln; Abfahrten bleiben unmittelbar darunter. |
| Favoriten | Routen/Stationen bleiben getrennt und die Auswahl gespeichert. Der ausschließlich für Nähe gültige Verkehrsmittelfilter belegt hier keine Zeile mehr. Doppelte Abschnittstitel entfallen bei gefüllten Listen. |
| Verbindung | Station, Linie, Richtung und großer Countdown; anschließend Fahrzeuge im Anflug und Station auf Karte. Zurück erhält die Ausgangsliste und Leseposition. |
| Route | Aktueller Einstieg groß, nächster Umstieg als kurze Vorschau mit aktueller Linienzeit. Weiter zum Umstieg bleibt eine bewusste Aktion. |
| Tile | Zwei direkte Einstiege: Favoriten und In der Nähe. Keine dort eingebauten Abfahrts-, GPS- oder Hintergrundabfragen. |

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

Öffentlicher Schätzzustand liegt nur kurz im Worker-Speicher: höchstens vier Linienpakete und 24 Stationsausschnitte, nach fünf Minuten unbenutzte Ausschnitte entfernen. Keine Gerätekennung, Favoritennamen, Nutzerkoordinaten oder dauerhafte Fahrtgeschichte. Ein Worker-Neustart darf eine erneute Bestätigung erfordern. Wiederholte Cacheantworten sind keine zweite Quelle. Fehler und Retry-After werden berücksichtigt. Der normale gemeinsame 30-s-Abstand und der optionale 90-s-Ultra-Sparmodus bleiben auf der Uhr wirksam.

## Veröffentlichung und Prüfung

Paket und ursprüngliche Release-Signatur bleiben erhalten; 0.8.0 ist Code 27. Der Update-Download und die Installer-Übergabe aus 0.7.4 bleiben bestehen. Das Tile verwendet AndroidX Tiles 1.4.1 / ProtoLayout 1.2.1; die ursprüngliche Datei `firebase-dependencies.json` hält aus Kompatibilitätsgründen jetzt auch diese nativen Abhängigkeiten und ihre SHA-256-Prüfsummen fest.

Vor Veröffentlichung: native Tests, Originalsignatur, APK-Metadaten, zipalign, Größe/Hash und öffentlicher Bytevergleich. Zusätzlich auf der physischen Uhr: Update ohne Deinstallation, Schriftgrößen, Kartenzoom/Drehkrone/Back, echter GPS-Fix, Tile hinzufügen und Vordergrund-/Display-aus-Verhalten prüfen.
