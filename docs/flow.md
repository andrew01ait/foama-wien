## PWA 0.11.16 · Standort und Fußweg

Standort → Karte → alle aktivierten Linien pro Stationsmarker → Station → Fußweg & Navigation. Stationstitel/Fußwegaktion → sofortige Stationskarte → Gehweg nach erfolgreicher Berechnung. Schließen/Back/Hintergrund baut die Karte ab und bricht Routing ab. Erneutes Öffnen besitzt eine neue Sitzung. Routingfehler lassen Station und externe Kartenaktionen sichtbar. Manuelle Teststation ist kein GPS-Fix.

Fahrzeuge → eine Richtung → gemeinsamer Monitorabruf → nächste Abfrage nach Startsperre UND Quellencacheablauf → zwei unterschiedliche Quellenstände → Position oder tatsächlicher Wartegrund. ETA-Korrekturen mit identischen Ankern halten die letzte Lage begrenzt grau; Filter-/Ansichtswechsel lösen keinen schnellen Zusatzabruf aus.

## Uhr 0.7.1 · Stadtbezogene Routen und Laden

Nähe/Favoriten/A nach B bleiben als Hauptleiste erreichbar. A nach B und Favoriten → Routen zeigen dasselbe Stadtprofil. Mehr → Stadtprofil → Stadt wählen → zweimal Zurück führt zur aufrufenden Routenliste. Keine Route wird durch den Filter gelöscht; Wien wählen macht vorhandene Wien-Routen wieder sichtbar. Fällige Abfahrten starten bei Rückkehr sofort, eine laufende Sperre genau nach ihrer verbleibenden Dauer. Pause/Display aus/Einstellungen/Transfer führen zu keinen Hintergrundabfragen.

## Aktueller Ablauf 0.4.0 / 0.4.1

A nach B → Start/Ziel/GPS → Verbindungen suchen → ursprüngliche Alternativen → Reise. Station vor Linie, unter Umstiegen alternative Weiterwege. Variante wählen erhält dieselbe Route/Favoritenfamilie. Abfahrtszahl/Linie antippen → exakt diese Linie/Richtung → optional Alle Abfahrten. Gehzeit antippen → nur diese Fußwegkarte auf/zu. Uhr → Favorit → Alternative Wege → Variante → aktueller Verzweigungseinstieg; Zeilen-Tap fokussiert genau diese Verbindung.

Einstellungen (auch Zahnrad auf Reise-Seite) → Favoriten/Routen sichern oder Handy/Uhr übertragen. Entfernen → Rückgängig höchstens eine Minute. Keine automatische externe Nachricht oder Dauersynchronisierung.

## A nach B · PWA 0.3.3 und Uhr 0.4.0

PWA: dritter Tab A nach B → Start/Ziel (Adresse, Station, Karte oder dynamisches GPS) → explizit suchen → Alternative → Reise/Karte → Abfahrt/Stationsmarker → Alle Abfahrten → Zur Reise. Browser-Back führt denselben Elternpfad. Favoritenstern → Meine Routen → optional umbenennen/entfernen/rückgängig → Mit der Uhr übertragen. JSON-Sicherung kann auch im anderen Browser auf der QR-Seite geladen werden.

Uhr: Mehr → Favoriten → Mit Handy übertragen → Vom Handy empfangen → QR am Handy scannen → Stationen/Routen wählen → verschlüsselt senden → Uhr-Vorschau bestätigen → Favoriten → Route → aktueller Einstieg/Umstieg → Weiter zum Umstieg oder Alle Abfahrten. Zurück von Station zur Route, von Route zu Favoriten. Kein automatisches Überschreiben und keine Neuplanung auf der Uhr.

## A nach B · PWA 0.2.0

Startseite → Von A nach B → Start/Ziel auswählen → jetzt/Abfahrt/Ankunft in Wiener Zeit → ausdrücklich suchen → Alternative öffnen → Fußwege/Einstieg/Umstiege mit Planzeit und aktuellen Linienalternativen. Nur „Neu planen“ berechnet die gesamte Verbindung erneut.

Alternative → Weg merken → lokal unter „Deine Wege“. Erneut öffnen zeigt gespeicherten Linienweg ohne alte Fahrzeiten, lädt nur die nächsten zwei Stationsmonitore. „Gehweg zum Einstieg aktualisieren“ berechnet auf Wunsch nur diesen Fußweg; bei GPS-Start erst Standortfreigabe und frischer Fix. Geänderte Wege/Störungen oder aktuelle Gesamtankunft über Neu planen prüfen. Weg entfernen wirkt ausschließlich auf Routenfavoriten, bestehende Stationsfavoriten/QR bleiben unabhängig.

Zurück stellt Such-/Ergebnisposition her, Detail startet oben; Hintergrund beendet aktuelle Suche/Monitore. Rückkehr setzt nur Monitore fort, nie automatisch eine Vollroutensuche. Watch-Reisebedienung folgt später; aktueller Watch-Release behebt Scroll-Start von Liniendetails.

## PWA 0.1.29 · Kopfzeile

App teilen und Einstellungen oben gleich groß. A-nach-B weiterhin ohne öffentlichen UI-Pfad, [Datenzugang zuerst klären](journey-planning.md). Standortkarte mit bestehender Suchradiuswahl erhalten.

## PWA 0.1.28 · App teilen

Auf der Hauptseite erscheint bei verfügbarer neuer PWA-Version ein Hinweis mit **Jetzt aktualisieren**. Prüfung beim Start und alle fünf Minuten nur bei sichtbarer App; keine automatische Neuladung. Update aktiviert den vorbereiteten Worker und lädt die App neu, Favoriten/Einstellungen bleiben erhalten.

Oben App teilen → Geräte-Teilen-Menü → Ziel, etwa WhatsApp, selbst wählen. Abbrechen beendet den Vorgang. Ohne Unterstützung/bei Browserfehler → öffentlicher App-Link mit Link kopieren oder Über WhatsApp teilen. Kopierfehler markiert den Link zur manuellen Übernahme; Schließen/Back des Dialogs kehrt zur App zurück. Kein automatischer Nachrichtenversand. Abfahrten aktualisieren weiterhin automatisch bei sichtbarer App sowie über den Detailknopf, kein Reload-Icon im Hauptkopf.

## PWA 0.1.27 / Wear 0.3.6 · Favoriten

Favoriten → Meine Reihenfolge / Nähesten zuerst. Bei vorhandener Position ohne zusätzlichen Standort-/Luftlinie-Hinweis; ohne Position erklärt die PWA die gespeicherte Ersatzreihenfolge. Auswahl und manuelle Reihenfolge bleiben erhalten. [Reiseplanung A nach B](journey-planning.md) ist als kommende Erweiterung aufgenommen, noch kein nutzbarer Navigationspfad.

## PWA 0.1.26 / Wear 0.3.5 · Gemeinsame Linienkorrektur

Stationsansicht → vorhandener normaler Monitorabruf → Betreiber meldet Linien → Dienst aktualisiert nur diese Linienbestätigungen → beide Clients übernehmen gemeinsame Evidenz plus Abfahrten. Neuer oder umgeleiteter Dienst wird beim nächsten tatsächlichen Abruf erkannt. Verbindungs-/Filter-Teilbatch bestätigt Positives, liefert keine vollständige Negativprüfung. Erfolgreiche volle Stationsabfragen sammeln aggregierte Prüftage; unbelegte alte Extras nach 30 Tagen und ausreichender Abdeckung ausblenden, bei Wiederauftauchen wieder aufnehmen. Fahrplan-/Nacht-/Rufbus-Schutz erhalten. Offline lokale Kopie, Favoriteinträge bleiben unabhängig. Kein zusätzlicher Abruf und keine Änderung am 30-s-/24-RBL-/Sichtbarkeitsbudget.

## PWA 0.1.25 · Kompakte Linienauswahl

Linienauswahl in Stationskarten kompakt mit natürlichem Umbruch; Verkehrsmittel und Dimmungserklärung als eigene folgende Zeilen. Jede Linie bleibt mindestens 44 × 44 px antippbar und führt wie bisher zum Verbindungsdetail. Aktualisieren fordert die aktuelle Sicht an, innerhalb 30-s-Sperre und Fehler-Backoff; sichtbare Stationen zuerst, im Detail relevante Verbindungsbahnsteige.

## PWA 0.1.24 / Wear 0.3.4 · Verbindung und Stationsansichten

PWA Nähe oder Favoriten → Linie/Richtung antippen → eigene Verbindungsseite → nur relevante Bahnsteige innerhalb des bestehenden Refresh-Budgets. Linienbadge ohne Richtung → alle Richtungen dieser Linie, dann bewusste Richtungsauswahl. Favoriten speichern/entfernen und Karte bleiben getrennte Aktionen. Zurück oder Browser-Back → ursprünglicher Tab, Aufklappzustand und Listenposition; Browser-Weiter → Verbindung. Hintergrund oder überdeckender Kartendialog → keine neuen Monitoranfragen. Verlassen verwirft laufende fremde Ergebnisse und nimmt die Übersicht im verbleibenden Zeitbudget wieder auf.

Uhr: Nähe/Favoriten → gleiche Stationskarte mit Name/Gehinfo → gleiche Zeile Linie/Richtung/Zeiten → vorhandenes Detail. Favoriten zeigen nur ausgewählte Verbindungen oder ganze gespeicherte Station. Kein Datenwert → neutrale Darstellung, Erklärung und weiterhin antippbar; eintreffende frische Abfahrten stellen die Linienfarbe wieder her.

## Wear 0.3.3 · aktuelle Bedienung

Nähe/Favoriten → globale Verkehrsmittelsymbole → darunter erste Station. Symbolzeile antippen → Verkehrsmittel → Zurück zur ursprünglichen Ansicht. Favoriten bleiben unabhängig vom Nähe-Filter.

Mehr → Störungen → Hinweise / Push / Auswahl / Infos. Hinweise zeigt das gespeicherte lokale Archiv. Push enthält Aktivieren/Deaktivieren, Test und Verbindungsprüfung; Auswahl enthält Meldungsumfang, Nachtruhe und optionale Aufzüge/Fahrtreppen; Infos enthält Datenschutz und Handy-Spiegelung. Zurück aus einer Unterseite → Störungen → Mehr → Hauptansicht. Der gewählte Umfang wird bei Rückkehr erhalten, kein automatischer Opt-in.

Öffentliche Uhr-Seite → vier Kernfunktionen/aktuelle Beispielansichten → APK herunterladen; Installationslink öffnet die Drei-Schritte-Hilfe. Übertragung/Updates und Version/Quellen nur bei Bedarf aufklappen.

## Wear 0.3.2 · Favoritentransfer

Mehr → Favoriten → Mit Handy übertragen → Vom Handy empfangen / Ans Handy senden → Display automatisch wach halten → QR mit dem Handy scannen → Daten übertragen → auf der Uhr gegebenenfalls Vorschau ausdrücklich übernehmen → Abschlussmeldung und normales Bildschirmverhalten. Zurück, endgültiger Fehler oder Ablauf geben das Display ebenfalls frei. Während des Wartens kein manuelles Wachhalten per Tippen nötig. Maximal zehn Minuten einschließlich Vorbereitung/Vorschau. Bewusstes Verlassen der Uhr-App beendet die Sitzung weiterhin.

## PWA 0.1.23 / Wear 0.3.1 · Warnungen

Station/Favorit → aktuelle Betriebswarnung mit betroffenen Linien aufklappen. Aufzug/Fahrtreppe oder zukünftige Sperre → neutraler Bereich „Aufzüge & Fahrtreppen“, „Geplante Hinweise“ oder „Weitere Hinweise“ → bei Bedarf aufklappen → Zeitraum/Quelle lesen. Geplante Ereignisse erhöhen vor Beginn keine aktuellen Warnzähler und lösen keinen Push aus. Mit Beginn kann eine gültige Betriebsstörung regulär hervorgehoben werden; Equipment bleibt sekundär und für Push ausdrücklich optional. Die Uhr verwendet dieselbe Kategorie-/Zeitgrenze für ihre ⚠-Markierung. Keine zusätzlichen Hintergrund-Abfahrts- oder GPS-Abfragen.

# Aktuelle Abläufe · PWA 0.1.22 / Wear 0.3.0

Favoriten → gemeinsame Karte pro Station → Stationsname zuerst → gespeicherte Verbindungen darunter. PWA-Stern entfernt genau diese Verbindung. Stationsmenü → Nach oben/unten bewegt die ganze Gruppe, nur in Meine Reihenfolge; Entfernungssortierung ändert keine gespeicherten Daten. Ganze Haltestelle und einzelne Verbindungen aus derselben Station bleiben gespeichert, gemeinsame geladene Richtungen erscheinen einmal. Uhr: Verbindung öffnen → Favorit entfernen betrifft nur diese Verbindung.

Warnmeldungen bleiben geschlossen einschließlich aller betroffenen Linien lesbar. Aufklappen zeigt weiterhin vorhandene vollständige Texte, Gültigkeit und Quelle; keine leere Meldungssektion. Sichtbare Stationskarten → deren Bahnsteige zuerst → danach übrige Stationen im gleichen maximalen 24-RBL-Abruf. Frühestens 30 Sekunden nach vorherigem Versuch; Scrollen selbst startet keine zusätzlichen API-Zyklen.

Watch → Mehr → Störungsmeldungen → Filter/Nachtruhe/Aufzüge → auf dieser Uhr aktivieren. Solange Firebase und Hintergrundtimer unbestätigt sind, bleibt Aktivieren gesperrt und Einrichtungshinweis sichtbar. Nach erfolgreicher Einrichtung ausdrücklicher OS-Opt-in; Hinweis öffnet nur das lokale Archiv, kein GPS-/Abfahrtsabruf. Abmelden stoppt Anzeige sofort und entfernt Gerätefreigabe, offline ausstehende Serverlöschung beim nächsten sichtbaren Öffnen.

## Frühere Abläufe

## PWA 0.1.20 · Optionale Störungsbenachrichtigungen · 08.11.2026

Mehr → Einstellungen → Störungsbenachrichtigungen. Favoriten oder alle Wiener-Linien-Linien, optionale Aufzugsmeldungen/Nachtruhe, ausdrücklicher Opt-in, Testnachricht und Abmeldung. Semantisch deduplizierte Sammelhinweise, 30 Minuten Abstand und sechs automatische Hinweise pro Wiener Tag. Push-Registrierung und minimale Filter verschlüsselt in D1, Schlüssel ausschließlich Hosting-Secrets. GPS/Abfahrten unverändert nur sichtbar; Wear 0.2.4 bleibt unverändert. Implementierung und produktiver manueller Quellen-/Gerätefreigabetest erfolgreich. Automatischer Hintergrundlauf der Plattform fehlgeschlagen und pausiert; Push-Aktivierung bleibt deshalb gesperrt. Docker-Timer für einen separaten Server vorbereitet, noch nicht gestartet. [Details, Datenhaltung und Abnahme](push-notifications.md).

## PWA 0.1.19 · Kompaktere Stationsabfahrten · 08.11.2026

Weniger vertikaler Leerraum zwischen Linien derselben Station in Nähe und Favoriten. Nähe-Zeilen mindestens 64 statt 76 px, Abstand zwischen Linienbadge und Richtung 2 statt 6 px; Favoritenzeilen ohne eigene Interaktion mindestens 40 statt 44 px, Gruppengap 2 statt 5 px. Lange Richtungen wachsen weiter natürlich. Hauptzeit 28 px und feste Zeitspalten bleiben erhalten. Linien-Favoritenknopf in Nähe mit 44 × 44 px Tippfläche innerhalb seiner Zeile. Keine Daten-, Abruf-, Speicher- oder native Änderung; Wear 0.2.4 / Code 5 unverändert.

# PWA 0.1.18 / Wear 0.2.4 · QR-Favoritenübertragung · 08.11.2026

Mehr → Favoriten → Mit Handy übertragen auf der Uhr. Vom Handy empfangen oder Ans Handy senden wählen und QR-Code mit der Handy-Kamera scannen. Die eigenständige Übertragungsseite nimmt lokale PWA-Favoriten oder einen JSON-Export an. Auf der Uhr Vorschau prüfen und ausdrücklich übernehmen; auf dem Handy PWA-Import oder JSON-Download wählen. Bestehende Favoriten bleiben erhalten, Duplikate werden übersprungen. Beide Geräte bleiben unabhängig, keine dauerhafte Synchronisierung.

# Warnmeldungen · PWA 0.1.17

Ansicht wechseln oder vorhandenen Refresh verarbeiten → passende Meldungen für aktuelle Stationen/Linien aus gültigem Cache bestimmen → Duplikate zusammenführen → null Meldungen: keinen Bereich anzeigen; sonst eigene Warnmeldungen-Karte mit Titelvorschau und Anzahl → antippen für Details und offizielle Quelle. Ältere gültige Meldungen kenntlich machen; abgelaufene/erledigte Meldungen entfernen. Kein zusätzlicher API-Aufruf und kein Text über noch nicht geprüfte Haltepunkte. Meine Reihenfolge zeigt nur die Sortierbuttons, ohne Bedienhinweis.

Favoriten suchen: Favoriten → unten ＋ Favorit hinzufügen → Haltestellennamen eingeben → Treffer ausdrücklich auswählen → ganze Station speichern oder Linie/Richtung wählen. Das ist eine Favoritenauswahl, kein Umstiegs-Routenplaner. ÖBB/Schnellbahn bleibt ohne importierten Datensatz unverbunden.

# Kompakte Hauptansichten · PWA 0.1.16 / Wear 0.2.3

PWA: geschlossener Filter → Radius im Kopf und alle sechs Modi in einer Zeile → Icon schaltet seinen Modus ohne Expansion. Favoriten → Sortiermodus und kurze Hilfe innerhalb eines Panels; Betriebsstatus folgt in dasselbe Panel. Vollständige Betriebsmeldungen weiterhin bei den Stationen. Dein Standort startet geschlossen.

Watch: kompakter Pin/Nähe- oder Stern/Favoriten-Schalter mit mindestens 48-dp-Tippzielen → bisheriger Hauptpfad. Update über Mehr → App & Updates → Auf Update prüfen. Keine Deinstallation; lokale Favoriten/Einstellungen bleiben erhalten. QR weiterhin nicht nutzbar, PWA-Dateiexport unter Mehr → Einstellungen → Favoriten sichern.

# Favoriten umordnen · PWA 0.1.15

Meine Reihenfolge → Menü des Favoriten öffnen (anderes Bearbeitungsmenü schließen) → Nach oben/unten → Favoritenidentität in der aktuellen gespeicherten Liste auflösen → eine Position verschieben und speichern → alle Bearbeitungsmenüs schließen → Liste zeichnen → Fokus ohne Seitensprung auf den verschobenen Menüknopf. Am Listenrand bleibt die jeweilige Richtung gesperrt. Nächste zuerst verändert die gespeicherte Reihenfolge nicht und bietet keine Verschiebeaktionen. Außenklick/Escape schließen transiente Menüs; Meldungsdisclosures sind unabhängig. Nach Reload bleibt die Reihenfolge erhalten.

# Aktuelle Bedienung · PWA 0.1.14 / Wear 0.2.2

PWA öffnen → Dein Standort zunächst geschlossen, Status/Kartenknopf sichtbar. Titel antippen → Details auf-/zuklappen ohne GPS-Aufruf; Standort aktivieren bleibt eine ausdrückliche Folgeaktion. Verkehrsmittel zuklappen → sechs schaltbare Icons plus Radius; Icon antippen → nur diesen Modus ändern, speichern und nahe Stationen aktualisieren, Filter bleibt zu. Erweiterte Ansicht verwendet dieselben Werte. Standortdetails starten nach Reload wieder geschlossen, gespeicherter Filter-Klappzustand bleibt erhalten.

Watch: Pin/Nähe oder Stern/Favoriten → Verbindung → Detail; Mehr-Einstellungen wie bisher. Wischen links/rechts, Zurück und System-Back gehen genau eine gleiche Stufe zurück. Radius/Verkehrsmittel → Standort & Nähe → Mehr → Hauptansicht; erst Root-Back beendet die Activity. Pause/Stop/Display aus → GPS-Listener/Ortungstimer entfernen → HTTP-Sitzung abbrechen, queued Tasks stornieren → keine späten Daten übernehmen → Cache abgelaufener Abfahrten und Update-Dateien bereinigen. Fortsetzen nur bei wieder sichtbarer, interaktiver Activity. Keine Position historisch speichern.

# Wear 0.2.1 – aktuelle Bedienung

Nähe/Favoriten → Verbindung → große Detailansicht → ausdrücklich Favorit speichern/entfernen. Standort erstmals durch sichtbaren Tap erlauben. Geeignete vorhandene Caches prüfen → verfügbare primäre Ortungsquelle anfragen → nach acht Sekunden gegebenenfalls andere Quellen versuchen → bei frischem genauen Fix einen Stream behalten; spätestens nach 30 Sekunden ohne solchen Fix alle Suchanfragen beenden und Erneut versuchen/Standorteinstellungen anbieten. Grobe/alte Nähe bleibt gekennzeichnet, Favoriten bleiben nutzbar. App-Pause beendet jede Ortungsarbeit.

Mehr → Standort & Nähe → Standort, Suchradius, Verkehrsmittel; Mehr → Gehen & Reserve; Mehr → Favoriten → Sortierung; Mehr → App & Updates → Auf Update prüfen/Abfahrten aktualisieren. Zurück aus Radius/Verkehrsmittel führt zu Standort & Nähe; danach zu Mehr, danach zur Hauptansicht. In der installierten Vorversion 0.2.0 liegt Auf Update prüfen direkt unter Mehr.

# Bedienabläufe v0.1.4

Nähe öffnen → gespeicherten Klappzustand und Verkehrsmittel/Radius laden → Standortfreigabe bzw. vorhandene Freigabe nur im Vordergrund verwenden → bestätigte passende Stationen im gewählten Radius bestimmen → Linien offline anzeigen → 24 passende StopIDs fair verteilen → vorhandene Abfahrten sofort nutzen, neue frühestens nach 30 Sekunden laden. „Verkehrsmittel“ klappt den gesamten Bereich auf/zu, die kurze Auswahl-/Radiusübersicht bleibt sichtbar.

Standortkarte: Straßenumgebung/PLZ lokal bestimmen → Genauigkeit und Fix-Alter zeigen → „Karte“ öffnet OSM-Momentaufnahme mit Punkt/Unsicherheitskreis → optional Google Maps / OSM extern öffnen. Stationsname → bisherige Fußwegkarte → „In Google Maps navigieren“ übergibt das Ziel, Google Maps bestimmt den aktuellen Telefonstart; bei manuellem Start bleibt dieser erhalten.

Bewegung: Standortmetadaten bei jedem Fix erneuern; nach ca. 40 m Stationen neu sortieren. Zuverlässig schneller als 3,5 m/s → „Unterwegs“, Geh-Ampel/Matrixrouting pausieren. Grober Empfang → ungefähre oder überlappende letzte gute Position nutzen, Fix-Alter anzeigen. Über 90 Sekunden alter Fix → „Letzter bekannter Standort“, keine grüne Geh-Ampel. 45 Sekunden zuverlässig langsam → Gehmodus wieder zulassen. Keine bestimmte Metro-/Tramlinie aus GPS behaupten. Unsichtbar → Watch/Timer stoppen.

Live-Fehler: vorhandene reale Abfahrten und Linien behalten, ältere Werte kenntlich machen, keine vergangenen Abfahrten als Countdown 0 zeigen. HTTP 403/429 → klare Zugriffsmeldung, Wiederholungen mit 60–300 Sekunden Abstand. Kein frischer Erfolg → keine leere Katalogkarte und keine behauptete Echtzeit.

Favoriten bleiben ausdrücklich gespeicherte Verbindungen, unabhängig vom Nähe-Filter. Diagnose bleibt manuell, ohne GPS-Abfrage, mit datensparsamem JSON-Export. Frühere Abläufe und noch nicht live eingerichtete Wear-/QR-Flüsse stehen nachfolgend.

# Bedienabläufe

## In der Nähe

App öffnen → zuletzt gewählte Ansicht laden → GPS beim Gerät anfordern → lokale Haltestellen im Standardradius 300 m bestimmen → optional (nach Zustimmung) Fußwegrouting → Haltestellen nach Gehzeit sortieren → Haltestelle aufklappen → aktivierte Linien/Richtungen und die ersten beiden Abfahrten anzeigen → Ampel aus verbleibender Zeit − Gehzeit − 1 Min. Reserve.

Bei realer Bewegung > ca. 40 m: Standort/nahe Haltestellen neu bestimmen, API-Last begrenzen. Sonst nur alle 30 s Abfahrts-API neu abfragen. Bei App-Pause: Timer/GPS stoppen.

## Favoriten

„☆“ auf Linie/Station → Favorit mit Stop-ID, ggf. Linie/Richtung in lokale Liste → Favoriten in freier Reihenfolge, ohne aufklappbare Stationsgruppen → anzeigen, auch wenn die allgemeinen Verkehrsmittelfilter die Linie ausblenden.

## Weg auf Karte (PWA)

„Fußweg auf Karte“ → externer OpenStreetMap-Dienst und ggf. Valhalla wird **erst jetzt** kontaktiert → Route und Gehzeit anzeigen → alternativ externer Fußweg-Link. Wenn Karten- oder Routing-API nicht geht, nur Kartenvorschau und externer Navigationslink, kein erfundener Fußweg.

## QR-Transfer

Uhr „QR ↗“ → zufällige 192-bit Session-ID & 256-bit AES-Schlüssel auf Uhr → Cloudflare Durable Object 10 Minuten erstellen → QR enthält `https://APP/#session=ID&key=KEY` → Telefon öffnet **dieselbe** PWA-Origin mit Zugriff auf lokale Favoriten → der Browser verschlüsselt AES-GCM → nur Chiffre an Relay → Uhr holt Chiffre, entschlüsselt lokal → Bestätigung „Ergänzen/Ersetzen“ → DELETE-Sitzung. Keine dauerhafte Verbindung.

## Update Wear

Uhr „Auf Update prüfen“ → `update.json` laden → `wearVersionCode` vergleichen → bei neuer Version signierte HTTPS-APK + SHA256 → Prüfsumme verifizieren → Nutzer bittet Android um Installationsbestätigung. Kein stiller Installationsvorgang.

## Öffentliche Diagnose-PWA v0.1.1

Öffentliche HTTPS-Site öffnen → Nähe/Favoriten oder API-Diagnose wählen. Installation über Chrome-Menü oder den bei Verfügbarkeit eingeblendeten Installationsknopf. Diagnose: manuellen Test wählen → lokales Ergebnis mit HTTP-/Fehlerdetails prüfen → JSON speichern oder kopieren. Erst die vom Nutzer geteilte Datei gelangt zum Chat. Kein Hintergrundtest und kein automatischer Log-Upload.

## v0.1.2 – Standort und Menü

PWA öffnen → vorhandenen Berechtigungsstatus ohne Ortung prüfen → bei neuer Freigabe „Standort aktivieren“ → Browser fragt nach Erlaubnis, sofern seine Umgebung dies zulässt → sichtbarer Standort-Watch → 40-m-Bewegungsfilter → Nähe/Gehzeit → gebündelte StopIDs an eigenen Monitor-Relay. App unsichtbar → Watch/Refresh stoppen. Browser blockiert Freigabe → konkreter Hinweis, Chrome-/Android-Einstellungen oder manuelle Haltestelle.

Nähe/Favoriten/Mehr stehen gemeinsam im Seitenfluss. Keine fixe untere Menüleiste konkurriert mit dem Host-Overlay. Diagnose → direkter Test oder vorkonfigurierter Relay-Test → lokale Logs → aktiver JSON-Export; kein GPS-Zugriff.

## v0.1.3 – Favoritensuche und Fußweg

Favoriten → „Haltestelle oder Verbindung suchen“ → Namen eingeben → explizit eine Station auswählen → gesamte Station speichern oder echte Linien/Richtungen laden und einzelne Verbindung antippen. Weitere Verbindungen können im selben Dialog ergänzt werden. API-Abstand bleibt 30 Sekunden; bei Wartezeit gibt es eine Meldung und erneutes Laden nur auf Nutzeraktion.

Stationsname in Nähe/Favoriten antippen → aktuelle verlässliche Position als Start → Fußwegkarte mit Start/Ziel und Fußweggeometrie. Kein Standort → Standortaktion fokussieren. „Abfahrten“ öffnet die Liste unabhängig vom Kartenaufruf.

## v0.1.5 – Stationskarte

Station antippen → lokale ungefähre Zieladresse (Straße/PLZ) anzeigen → Karte/Fußweg und Google-Maps-Navigation wie bisher. Auch ohne PWA-Startfix bleibt die Zieladresse sichtbar. Nachtlinien erscheinen in allen Linienansichten dunkelblau.

## v0.1.5 – Aktueller Produktablauf

Standort → Karte → passende Stationen mit Linien/Radius → Station antippen → ungefähre Adresse/Navigation. Filter wirken in Karte und Liste gleich. Karte aktualisieren übernimmt den neuesten Fix; kein ungefragtes Nachführen der Karte während der Fahrt.

Station/Favorit → vorhandene Betriebsmeldung aufklappen → Quelle, Zeitraum und betroffene Linie/Station prüfen. Daten kommen mit dem normalen sichtbaren Monitorabruf; serverseitige Linienmeldungen sind gepuffert. Fehlende Antwort bedeutet unbekannt, keine bestätigte Entwarnung.

Einstellungen → Debugging bewusst aufklappen → Fehlerprotokoll speichern/kopieren. Keine Test-API-Anfrage durch Öffnen. Nach Schließen der Einstellungen wieder eingeklappt. Diagnose-Banner entfernt; alte Diagnose-URL zeigt den neuen Ort. Ganze Stationsfavoriten bekommen keine Gesamt-Gehampel für die erste Abfahrt; jede Verbindung trägt ihre eigene Einschätzung.

Wear-Entwurf: Nähe/Favoriten → Verbindung antippen → große nächste Abfahrt und explizite Favoritenaktion → Zurück. Mehr → Favoritenübertragung/Geh-Einstellungen. Simulation Tunnel/Offline und größere Schrift liegen nur außerhalb der Uhrenansicht als Review-Werkzeuge.

## v0.1.6 – Akkuoption

Einstellungen → Standort → „Bei wenig Bewegung Akku sparen“ aktivieren → gegebenenfalls Standort aktivieren → nur im Vordergrund ruhige Sensorwerte und genaue stabile Position mindestens eine Minute beobachten → einmal frischen Fix bestätigen, falls der Browser im Stillstand keine Watch-Updates liefert → Watch kurz pausieren, Fix-Alter zeigen, Geh-Ampel ungewiss → bei Bewegung sofort oder spätestens nach einer Minute Standort neu anfragen. Grober Empfang/Sensorfehler: normale Ortung. Hintergrund/manueller Start: Sensor/Ortung/Timer stoppen. Wiederaufnahme beginnt ohne alte Stillstandsevidenz. 30-s-Abfahrten bleiben unabhängig.

## v0.1.7 – Favoriten aus Karte, Sortierung und Priorität

Standort → Karte → Station antippen → „Haltestelle merken“ → Bestätigung und gespeicherter Button, Karte bleibt offen. Auch in „Haltestellen als Liste“. Ganze Haltestelle bereits vorhanden → keine zweite Kopie.

Favoriten → Sortieren → Meine Reihenfolge / Nächste zuerst. Entfernung verwendet aktuellen/ungefähren/letzten bzw. manuellen Start mit passender Beschriftung, keine Gehwegdistanz. Manuelle Reihenfolge bleibt erhalten. Je sichtbarem 30-s-Zyklus Live-Priorität aus derselben Reihenfolge bestimmen → falls mehr als 24 RBL, erste 16 und acht weitere rotierend abrufen → vorhandene andere Daten behalten und Alter wahrheitsgemäß anzeigen. Pfeile ändern manuelle Ordnung und damit den nächsten regulär erlaubten Abruf; kein Fair-Use-Bypass.

## v0.1.8

Favoriten → direkt „Meine Reihenfolge“ oder „Nächste zuerst“ antippen. Aktiver Knopf bleibt sichtbar markiert, Auswahl gespeichert, Priorität folgt wie bisher. Kein Dropdown-Zwischenschritt.

## v0.1.9

Stationsname/Karte öffnet weiterhin den Fußweg. Stern speichert/entfernt die ganze Station. Vollbreite Abfahrtsvorschau antippen → Richtungen mit großen Zeiten; dieselbe Zeile klappt wieder zu. Geschlossene Vorschau zeigt die nächste tatsächlich geladene Linie/Richtung, keine Gesamt-Erreichbarkeitsampel. Fehlende Daten bleiben als fehlend erkennbar.

## v0.1.10

App → Dein Standort → Status, Adresse, Genauigkeit/Fix-Alter, Karten-/Aktivierungsaktion und 30-s-Abfahrtsinfo gemeinsam. Standortfehler erscheinen hier statt zusätzlich oberhalb der Ansichten. API-/Katalog-/Startfehler behalten den gesonderten Hinweis.

## v0.1.11

Stationsfavorit → dieselben Richtungen, großen Zeiten und Erreichbarkeitshinweise, mit engeren Abständen. Keine Änderung an Bedienung oder Reihenfolge.

## v0.1.12

Einstellungen → Aussehen → System / Dunkel / Hell. Auswahl ist sofort sichtbar und bleibt nach Neustart; System folgt Geräteänderungen. Keine Verbindung zur Standortfreigabe oder zu Abrufintervallen. Danach nativen Wear-Entwurf im bestehenden Java-Projekt umsetzen, CLI-Build/Tests/Signatur prüfen und erst dann einen APK-Download veröffentlichen.

## Native Wear 0.2.0

Start → Nähe/Favoriten (letzte Auswahl). Kein automatischer erster Standortdialog: Nutzer wählt Standort aktivieren. Gewährte Ortung läuft nur während onResume; onPause entfernt Listener und alle periodischen Aufgaben. Verbindung antippen → große Detailansicht → ausdrücklich Favorit speichern/entfernen. Alle Abfahrten der Station → ganze Station merken. System-Zurück oder rechter Randwisch führt zurück. Krone scrollt. Mehr → kleine Seiten für Radius/Verkehrsmittel/Gehen, Sortierknöpfe und Update. QR bleibt bis zu einem aktivierten und geprüften Dienst außerhalb der nativen Oberfläche.

## Wear 0.6.1 / Code 21 · Favoritenansichten und QR-Rückkehr · 09.11.2026

Im Favoriten-Tab trennt ein direkt sichtbarer Umschalter **Routen** und **Stationen**. Die Stationsansicht trägt die Überschrift **Haltestellen & Linien**. Die ausdrücklich gewählte Ansicht bleibt lokal über Aktualisierung, Detailnavigation und App-Neustart erhalten. Ohne bisherige Auswahl erscheinen bei vorhandenen Routen zuerst Routen, sonst Stationen; beide Bereiche bleiben auch leer erreichbar. Nur Stationen der gewählten Ansicht sind Monitorziele, laufende alte Anfragen werden beim Wechsel verworfen. Gemeinsame Abrufgrenzen, lokale Favoriten und Push-Auswahl bleiben erhalten.

Nach bewusst bestätigtem QR-Import und erfolgreichem Transferabschluss öffnet die Uhr direkt Favoriten: Routen bei mitübernommenen Routen, sonst Stationen. Der Transfer wird beendet, Schlüssel und Wachhalteflag werden freigegeben. Abbruch, Fehler und Ablauf bleiben im bisherigen Fehler-/Zurück-Pfad; bei fehlender Abschlussquittung bleibt die Übernahme gespeichert und die bestehende Wiederholung erreichbar. Dateiimport und Senden ans Handy behalten ihren bisherigen Rückweg. Originalpaket und Release-Key bleiben erhalten; PWA 0.6.1 korrigiert auf Nutzerwunsch die Routenbeschriftung zu **Alternativen nach …**; Alternativen und Planung selbst bleiben erhalten.

## Reparaturen 0.11.15

Standortkarte öffnen: zuerst Leaflet-Ansicht initialisieren, dann vorhandenen freigegebenen GPS-Fix und Genauigkeitskreis einblenden. Meldungsaktualisierung: Quellzeit bewahren; bei unvollständiger Zusatzquelle vorhandene Warnung mit ihrem alten Stand erhalten, bei vollständiger erfolgreicher Leerantwort entfernen.
