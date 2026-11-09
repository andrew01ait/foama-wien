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
