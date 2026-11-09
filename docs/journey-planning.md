# Aktuell: PWA 0.4.2 / Wear 0.4.2
Live-Abnahme: Bei 29B nach Großfeldsiedlung nennt der Planer das Ziel ohne U-Bahn-Suffix, der Monitor mit „U (über Leopoldau S U)“. PWA und Uhr vergleichen vollständige Zielnamen nach Entfernen reiner S/U-Suffixe. Zusätzliche Monitor-via-Angaben sind bei allgemeinem Planerziel erlaubt; eine ausdrücklich geplante via-Angabe muss übereinstimmen. Keine Teilwort-/Gegenrichtungszuordnung. Gespeicherte Variantenidentitäten bleiben davon getrennt. Zwei Web- und ein nativer Regressionsfall sichern echte Schreibweisen, zweite Etappe und verspätete Detaildaten ab.


Ursprüngliche Planung liefert bis zu acht Verbindungen. Unterschiedliche Linienwege werden beim Speichern als Alternativen in dieselbe Route aufgenommen, gemeinsame Fahrtabschnitte gruppiert. Das gilt generisch für alle Abfragen; Beispieladressen haben keine Sonderlogik. Variantenwechsel übernimmt vollständige ursprünglich geplante Verbindung. Favoritenöffnung und Variantenwahl laden nur passende Linienzeiten im bestehenden Budget, keine neue Vollroute. Gespeicherte Varianten sind historische Wege, keine aktuellen Gesamtfahrtdauern oder Anschlussgarantien. Für neue geänderte Linienwege explizit Neu planen und speichern.

Gehzeiten öffnen eine Abschnittskarte. Abfahrtstap fokussiert genau Linie und Richtung der gewählten Etappe; ganze Station ist ausdrücklich separat erreichbar. GPS-Hinweis trennt gesetzten Start von der Aktion Verbindungen suchen. Datei-/QR-Aktionen in Einstellungen, Rückgängig 60 s, kompaktere Darstellung und Route-Icon.

# Von A nach B · PWA 0.3.3 / Wear 0.4.0

Nutzerentscheidung: Transitous verwenden. Aktuelles Feedback autorisiert jetzt Karten, einfachere Adress-/GPS-Wahl und QR-Routenübernahme auf die Uhr. Vollplanung bleibt in der PWA.

## Veröffentlichtes Verhalten

- Einstieg als dritter Tab „A nach B“ auf der Startseite bzw. /journey.html.
- Start/Ziel aus lokalem Stationskatalog wählen; Adresse/Ort per Suchen oder beim Absenden an den Dienst übertragen, mehrdeutige Treffer ausdrücklich wählen. GPS-Start ist vorbelegt; erst sichtbare Such-/GPS-Aktion fragt den Ort ab, zeit-/genauigkeitsgeprüft. Start/Ziel alternativ auf der Stationskarte auswählen.
- Abfahrt jetzt oder spätere Abfahrt/Ankunft, ausdrücklich Wiener Datum/Uhrzeit, unabhängig von Gerätezeitzone. Verkehrsmittel und Gehtempo/Reserve aus Einstellungen, Modi für Suche vorübergehend anpassbar.
- Mehrere Verbindungen mit Dauer, Linien und Umstiegen. Ganze Reise zeigt Fußwege, Wartezeit, Ein-/Ausstiege, Bahnsteige falls vorhanden und tatsächliche Anbieterqualität Fahrplan/Echtzeit.
- Aktuelle Wiener-Linien-Abfahrten für nächsten Einstieg und Umstieg, nur aktiv/30 s/max. 24 RBL. Exakte Stop-/Linien-/Richtungszuordnung, keine Namensnähe. Keine Anschlussgarantie und kein Beweis derselben Fahrt. Unbekannte Stationen erhalten keine erfundene Monitorzuordnung.

## Meine Routen

Der Favoritenstern legt maximal 30 lokale Routenfavoriten an. Enthält gewählte feste Start-/Zielorte und Linienweg mit Umsteigestationen und Gehwegabschnitten. Keine absoluten alten Fahrzeiten, Trip-IDs oder rohe API-Antwort. GPS-Start wird als dynamischer „Dein Standort“ gemerkt, nicht als GPS-Fix.

Favorit öffnen: gespeicherter Linienweg und aktuelle Monitorabfahrten, **keine vollständige Routensuche**. Gehwege bleiben zunächst als gespeicherte Schätzung bezeichnet. „Gehweg zum Einstieg aktualisieren“ fragt einzeln nur den Fußweg zum ersten bekannten Stationspunkt ab, bei dynamischem Start nach neuer GPS-Aktion. Gehzeit aus Weglänge/Nutzertempo geschätzt, Bahnsteigwege zusätzlich; weitere gespeicherte Umstiegswege unverändert. Für aktuelle Gesamtfahrzeit, Anschlussprüfung und geänderte Linienwege „Neu planen“. Keine Garantie, dass ein historischer Linienweg bei Störungen weiterhin sinnvoll ist.

Routenfavoriten bleiben lokal getrennt gespeichert. Meine Routen bietet große Karten, Umbenennen und rückgängig machbares Entfernen. foama-favorites-v2 ergänzt Routen für QR/JSON; alte station-only v1-Dateien bleiben lesbar. Uhr 0.4.0 zeigt Einstieg und nächsten Umstieg mit aktuellen Linienzeiten sowie Alle Abfahrten; keine automatische native Routenneuberechnung.

## Fahrtkarte und Stationen

Reise/Karte zeichnet mit detaillierten Fahrt- und Transfergeometrien aus MOTIS. Ohne Geometrie ausschließlich als schematisch markierte gestrichelte Punktverbindungen. Auf Wunsch lokale Leaflet-/OSM-Karte für Start/Ziel, viewport-begrenzte Stationsmarker und freie Punkte. Stationen/Abfahrten öffnen eigene ganze Stationsansicht mit allen Linien und Richtungen.

## Anbieter, Betrieb und Datenschutz

[Transitous](https://transitous.org/api/), [Datenquellen](https://transitous.org/sources/), [MOTIS OpenAPI](https://raw.githubusercontent.com/motis-project/motis/refs/tags/v2.10.2/openapi.yaml). MIT für eigenen öffentlich herunterladbaren App-Code, Dritt-/Datenlizenzen unter [Lizenzen](licenses.md). Kein VAO-Antrag/API-Key erforderlich. Nicht kommerziell; Best Effort ohne SLA. Größere Last oder viele Nutzer erfordern Betreiberabstimmung; 720 ist keine garantierte Nutzungszusage.

Server akzeptiert nur kleine POST-JSON-Anfragen und nutzt feste Produktionspfade /api/v6/plan, /api/v1/geocode, /api/v1/one-to-many mit identifizierendem User-Agent. Keine Suchhistorie/GPS-/IP-/Nutzerkennung in D1; nur atomare aggregierte Stundenbudgets: Planung und Fußweg zusammen höchstens 700, Ortssuche 500 in konservativem 25-h-Fenster. Kein unbegrenzter Fallback bei DB-Ausfall. Clientcache flüchtig/maximal vier Antworten für eine Minute. Abbruch beim Ersetzen/Hintergrund, keine automatische Vollroute.

## Testnachweis

Tatsächliche öffentliche Testpunkte Westbahnhof/Karlsplatz: ursprünglicher /plan-Prototyp HTTP 200; v1/geocode und v1/one-to-many HTTP 200 am 08.11.2026. Minimiertes datiertes Plan-Beispiel nur für automatisierte Tests; niemals als aktuelle UI-Verbindung ausgeben. Native Watch bleibt 0.3.7 mit ausschließlich Scrollkorrektur. Physische OnePlus-Abnahme separat.

Öffentliche Abnahme 09.11.2026 Wiener Zeit: Plan/Geocode/Fußweg HTTP 200, gespeicherter Weg nach Reload erhalten, aktuelle U3-Monitorabfahrten sichtbar. Keine Vollroutenabfrage beim Favoritöffnen. Hostingabruf nutzt workerd-kompatibles manual mit Statusprüfung.

Kartenbilder erhalten gemäß [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) die echte öffentliche App-Origin als Referer, ohne Seitenpfad oder Fragment; die übrige Reise-/Transferseite behält ihre restriktive Referrer-Einstellung. Kartenkacheln werden nur für den sichtbaren Ausschnitt geladen, nicht offline vorab gesammelt.

## 0.5.0 · Routenvergleich, Orte und native Bedienung

PWA: Schnellste Route oder Wenig Umstiege wählen, mit konkreten Abfahrts-/Ankunftszeiten und Zeitunterschied. Zwei feste Transitous-Profilabfragen je bewusster Suche (timetableView true/false), beide im bisherigen gemeinsamen 700er-Budget. Umschalten, Karte und Favoritenöffnung lösen keine neue Vollplanung aus. Rückfahrt planen tauscht feste Endpunkte und sucht die tatsächliche Gegenrichtung; bei altem GPS-Start bleibt das Ziel zur Auswahl offen. Meine Orte speichert bis zu 30 benannte Adressen lokal. Start → Ziel und Ein-/Ausstiegsstation bleiben auch unter eigenen Favoritennamen sichtbar; Gesamtroute auf Karte direkt oben.

Haltestellenkarte: nächstgelegene amtliche Zugangsadresse mit Hausnummer, PLZ, Abstand und Stadt-Wien-Quelle. 1.748 Haltestellen aus 151.577 öffentlichen Zugangsadressen zugeordnet, höchstens 100 m Entfernung. Das ist ausdrücklich keine gesicherte Stations-Postadresse; Routingziel bleibt der offizielle Haltepunkt. Fehlende Zuordnung fällt auf Straßenumgebung zurück. Ableitung offline, keine zusätzlichen Standortübertragungen.

Wear: A nach B ist direkt als drittes Hauptziel erreichbar, auch ohne Routen. Routenfavoriten aus PWA per QR oder lokal per JSON-Datei mit Vorschau/bewusster Übernahme; Dateiauswahl ist abhängig von einer verfügbaren System-Dateiauswahl auf der Uhr, QR bleibt als Alternative. 512-KiB-Dateigrenze, bestehende v1/v2-Formate und unabhängige Gerätespeicher erhalten. Aktuelle passende Zeiten je Etappe, Alternativen und korrekter Zurück-Pfad.

Uhr-Updates: Prüfen liest ausschließlich Metadaten, zeigt verfügbare Version und bis zu vier releasebezogene Neuerungen. Erst Installieren bestätigt Download und Übergabe an Android; Prozent-/MB-Fortschritt, Größen-/Hash-/Originalsignaturprüfung und Abbruchbereinigung. Optionaler Ultra-Sparmodus unter 20 %, standardmäßig aus, Hinweis und bewusste Aktivierung. Ab 25 % normal mit Hinweis (Hysterese); Ortung höchstens alle fünf Minuten als Einzelfix, Abfahrten alle 90 s, Darstellung alle 30 s. Manuelle Ortung möglich. Alter/Unsicherheitsgrenzen unverändert, keine Hintergrundabfragen; Akkuzustand wird bei sichtbarer App ausgewertet. QR-/Import-/Update-Operationen behalten ihre begrenzte Wachhaltefunktion.

Prüfung: 240 Web-/Server-, 116 Android- und acht Python-Tests bestanden. Physischer OnePlus-/GPS-/Dateiauswahl-/Installer-Test bleibt separat. Originalpaket at.andrew.foamawien und Signaturschlüssel erhalten; Wear-Code 18. Öffentliche Browserabnahme erfolgreich: Routenvergleich mit realen Transitous-Zeiten (ein Umstieg weniger, vier Minuten spätere Ankunft), Wechsel der gesamten Karte ohne neue Planung, eigene Favoritennamen mit Ein-/Ausstieg, Rückfahrt Karlsplatz → Rathaus mit aktuellen U2-Zeiten Richtung Aspernstraße, Ortsanlage/-auswahl und Erhalt nach Reload, Aktualisierungsbanner mit bewusster Übernahme sowie echte Adresse Franklinstraße 19/1210 Wien in 29 m Abstand. Vorhandene zwei Stations-/drei Routenfavoriten erhalten. Öffentliche APK heruntergeladen, 3.731.884 Bytes und SHA-256 8efe899acf688f53d0629455e5dc98ad1447b95ca7a8b6e7308bdae14150bd07 bytegleich zum signierten Build. Physische Watch-Abnahme weiterhin separat.

## 0.6.0 · Störungsbenachrichtigungen · 09.11.2026

Der bisher pausierte Stundenauftrag wurde auf die verbundene foama-wien-App umgestellt. Unbeaufsichtigter Lauf b6807536-f000-8322-bf47-cffd16b20df6, geplant 11:07:54, gestartet 11:08:09, abgeschlossen 11:08:51 Europe/Vienna, recorded_status=completed. Der Server hat den Quellenabruf mit neuer lastCheck/lastSuccess und setup-source-only quittiert. Damit ist der vorherige Scheduler-Blocker für den Stundenbetrieb behoben. Runtime-Revision 4 setzt PUSH_SCHEDULER_ENABLED=true und PUSH_INTERVAL_MINUTES=60; Anwendung mit diesem Release. Vorhandene VAPID-/Speicherschlüssel unverändert. Plattform maximal stündlich; zusätzliche Prüfungen etwa alle fünf Minuten nur im Rahmen ohnehin erfolgender aktiver Monitoraufrufe. Der vorbereitete externe Fünf-Minuten-Timer ist weiterhin nicht gestartet. Kein sofortiger Echtzeitversand oder Fünf-Minuten-Hintergrundtakt behaupten.

Meine Favoriten umfasst nun Haltestellen, Linien sowie gespeicherte A-nach-B-Wege einschließlich Alternativen. Bekannte Ein-, Umstiegs- und Ausstiegsstationen werden lokal zu minimalen Stop-/Linienfiltern zusammengeführt, maximal 100 Stationen. Keine Adressen, eigenen Routennamen oder GPS-Koordinaten werden übertragen. PWA synchronisiert geänderte Routen nach sichtbarer Rückkehr sofort; Uhr bei Import/Entfernen und sichtbarer Fortsetzung. Bestehende Zustellgrenzen, Deduplizierung, Quellen-/Gültigkeitsprüfung, Gerätefreigaben, verschlüsselte Datenhaltung und Opt-out erhalten. Geplantes nicht vor Beginn; Aufzüge/Fahrtreppen weiterhin optional aus.

PWA: Aktivierung/Test nach bewusster Browserfreigabe, sichtbare ehrliche Dienstfrequenz und letzte Prüfung. Direkte Uhr-Zustellung bleibt bis zur Firebase-Einrichtung gesperrt: Firebase-Plugin angeboten, noch nicht bestätigt verbunden; keine FIREBASE_*/FCM_SERVICE_ACCOUNT_JSON im Hosting vorhanden. Die PWA benötigt keinen Firebase-Client. Telefon-Spiegelung ist eine getrennte Systemeinstellung. Keine physische Zustellung aus Unit-Tests oder einem erfolgreichen Quellenabruf ableiten.
