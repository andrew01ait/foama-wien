## PWA 0.4.3 · UI-Korrektur

CSS-Layout für schmale Favoritenzeilen, Kopf und Navigation. Versionierte PWA-Assets/Offline-Shell/Health/Config gemeinsam 0.4.3, Wear bleibt 0.4.2 (17). Keine Migration oder Secret-/Signaturänderung. Visuelle Abnahme bei 320/360/420 px mit echter PWA, Hell/Dunkel und Live-/Leerzustand erfolgt; temporäre ui-layout-check.html entfernt.

## Release PWA 0.4.2 / Wear 0.4.2 · 09.11.2026

PWA-Queryimporte/Health/Config/Update-Feed/Offline-Shell gemeinsam 0.4.2. journey-variants mit/ohne Query precachen. D1 weiterhin append-only Migration 0004, capabilities als bekannte Liste und altes main-only Feld lesbar. Bestehende Secrets/öffentliche Zielgruppe erhalten. Alte signierte APKs bleiben in R2 unverändert erhalten. Nur aktuelle APK zusätzlich im Worker als Fallback, sonst wird die öffentliche bekannte Datei aus R2 gestreamt. Vor/nach Veröffentlichung SHA prüfen.

Native 0.4.2 / Code 17, 3,723,692 Bytes, SHA-256 9d385be821642981a87691a2c2ab93901bf85443a23de92afeac0992308d2fbf. Originalsignatur/Paket/zipalign und 104 Android-Tests geprüft. 231 Node-/acht Python-Prüfungen; alle drei Transferpakete Java↔WebCrypto geprüft. Keine physische Geräteabnahme behaupten. Öffentliche Prüfung: Beispielroute mit Umstieg/Varianten, Speichern/Reload, jeweiliger Linienfokus, Walk-Expand bei Countdown, Einstellungenaktionen und native Downloadbytes.

## Release PWA 0.3.3 / Wear 0.4.0 · 09.11.2026

Migration 0004_little_nova ergänzt nur nullable capabilities in foama_transfers. Alte Migrationen unverändert; Schema vor Worker aktivieren. Neue Kartenmodule mit/ohne Versionsquery in der Offline-Shell, Offline-Navigation für journey.html und transfer.html. Leaflet lokal; Kartenkacheln auf Aktion. Update-Feed, Health, Config und Queryimporte gemeinsam 0.3.3. Öffentliches Publikum und bestehende Secrets erhalten.

Wear 0.4.0 / Code 15, 3,719,596 Bytes, SHA-256 d879b4a34701dd5b25c0b82298c13ad7aefd702e5872dfdb11f8b51a59c38868. 98 native Tests einschließlich 192-/227-dp-Route und Originalsignatur/Paket/zipalign geprüft; 215 Node- und acht Python-Prüfungen bestanden. Bestehende 0.3.7-APK zusätzlich zur neuen APK erhalten. Quellarchiv ohne SDK, Schlüssel und APKs neu erzeugen. Keine physische Geräteabnahme behaupten.

Publikationsprüfung: Adressvorschläge und explizite Auswahl, Stationskarte/Routekarte mit echtem Transitous-Verlauf, Abfahrt → ganze Station → Zur Reise, Meine Routen umbenennen/undo/persistieren, QR-Seite mit v1-vs-v2-Fähigkeit, update.json und APK-Link öffentlich prüfen. Beide Transferformate Java↔WebCrypto geprüft, Transfer selbst bleibt zehn Minuten verschlüsselt mit bewusster Übernahme.

PWA 0.2.1: öffentliche Abnahme erfolgt; Hosting-fetch mit manual kompatibel, neue Suche verwirft alte Alternativen. Wear unverändert 0.3.7. Keine weitere Migration nach 0003.

## Release PWA 0.2.0 / Wear 0.3.7

Neue Schema-Migration 0003_mushy_marrow: ausschließlich aggregierte Abrufbudget-Tabelle. Alte Migrationen unverändert. Hosting wendet Migration vor Worker-Upload an. journey-service nutzt nur https://api.transitous.org/api/v6/plan, /api/v1/geocode und /api/v1/one-to-many. Kein Key/Antrag, keine Nutzerdatenbank, keine automatische Vollroutenabfrage. Quellarchiv muss LICENSE und docs/licenses.md enthalten; visible Attribution unter /journey.html und /licenses.html.

Wear 0.3.7 / Code 14, 3.715.500 Bytes, SHA-256 170b12ecbd75a253c3945d0ecaf90ba87ba8c605bc4925a61076d8e7c5d9e1bf. Originalsignatur/Paket verifiziert. Keine Reiseplanung auf der Uhr veröffentlicht; nur Scrollkorrektur. PWA 0.2.0 im Update-Feed. Bestehendes öffentliches Publikum erhalten.

# foama-wien – ChatGPT Sites Deployment PWA 0.1.29 / Wear 0.3.6

PWA: https://foama-wien.endruuu.chatgpt.site

Debugging: Einstellungen → Debugging; /diagnose bleibt ein Umzugshinweis.

Die bestehende Site-ID aus `.openai/hosting.json` unbedingt erhalten. Zielgruppe bleibt `public`. Die aktuelle Veröffentlichung verwendet einen Worker; das Manifest enthält daher **kein `static`-Feld**.

## PWA 0.1.29

PWA-Shell/Update/Health gemeinsam erneuert für einheitliche Kopf-Icons. Keine neue Migration, Variable oder Berechtigung. A-nach-B-Modul liegt als nicht eingebundene Grundlage vor, startet keine Produktionsrequests. Wear 0.3.6 und Signatur erhalten. Vor Aktivierung Datenzugang und Projektlizenz klären.

## PWA 0.1.28

app-updates.mjs im Offline-Shell erhalten. Neues Worker-Installieren wartet auf Nutzeraktion; Hauptseite zeigt Jetzt aktualisieren. Produktiven Übergang vom alten aktiven zum wartenden neuen Worker prüfen, kein automatischer Reload und keine Datenlöschung.

Neues app-share.mjs mit/ohne Versionsquery im Offline-Shell; veröffentlichte öffentliche Root-Adresse bleibt bewusst fest. PWA-Shell, Update und Health gemeinsam auf 0.1.28, native 0.3.6 unverändert. Keine neue Migration, Berechtigung, Serverroute oder Runtime-Variable. Native Web-Share-Option und Desktop-Fallback getrennt prüfen; kein WhatsApp-Endversand im automatischen Test.

## PWA 0.1.27 / Wear 0.3.6

Reine Favoriten-Texte/Hinweisdarstellung; neuer versionierter Offline-Shell und neu signierte APK Code 13. Keine neue Migration, Laufzeitvariable, Berechtigung oder Anbieteranbindung. Reiseplanung ausschließlich in der Projektplanung dokumentiert.

## PWA 0.1.26 / Wear 0.3.5

Migration 0002_normal_captain_cross.sql und Drizzle-Metadaten append-only erhalten. Sites migriert vor Worker-Upload; kein CREATE/ALTER im Monitorpfad. LINE_STOPS wird intern vom vorhandenen Runtime-Adapter aus gebündelten Assets bereitgestellt, keine neue Umgebungsvariable/Secret nötig. foamaLines.status=available sowie tatsächliche Betreiberzeilen sind der produktive Lernnachweis, nicht allein ein vorhandener Handler. Native neue APK 0.3.5 / Code 12 und neuer Shell v0.1.26 gemeinsam veröffentlichen.

## PWA 0.1.25

Nur Stationslinien-Layout und zugehöriger Shell-Versionswechsel; native APK 0.3.4 unverändert. Vollständige versionierte Shell-Assets erhalten.

## Release 08.11.2026

Verbindungsseite und gedimmte Linien sind Teil des normalen PWA-Shells, connection-detail.mjs mit/ohne Versionsquery im Service Worker erhalten. Verbindung ist kein Dialog; sichtbares Fokus-Polling aktiv, Kartendialog pausiert. Native 0.3.4 / Code 11 mit gemeinsamem Stationslayout und ursprünglicher Signatur veröffentlichen. Keine neuen Datenbankmigrationen, Berechtigungen oder Secrets.

## Build

1. `node --test tests/*.test.mjs tests/test_*.mjs` (168 Node-Tests), zusätzlich `python3 -m unittest discover -s tests -p 'push_timer_test.py'` (drei Prüfungen).
2. `python3 scripts/build_site.py` erzeugt `dist/server/index.js` und `dist/.openai/hosting.json` mit dem gepinnten esbuild. Der Worker enthält unveränderte PWA-Quelldateien als Byte-Assets, `cloudflare/src/index.js` und `site/runtime.mjs` als Adapter. Größe nach eingebetteten aktuellen/älteren öffentlichen APKs und Quell-ZIP prüfen; keine Schlüssel/SDKs oder Testabhängigkeiten einbetten. Ab Wear 0.2.0 wird ausschließlich die geprüfte öffentliche Release-APK als Download eingebettet.
3. Mit dem Sites-Quellworkflow auf dieselbe Site committen/pushen und Archiv aus genau diesem Commit packen. Prüfbefehle/Build als geordnete Argumentarrays übergeben; Credential nur über stdin.
4. Version mit Commit und Archiv speichern, dann öffentlich deployen. Keine neue Site anlegen.
5. Nach Veröffentlichung `/`, `/diagnose`, `manifest.webmanifest`, `sw.js`, `api/health` kontrollieren. Einmal `/api/monitor?stopId=4111` testen; danach Fair-Use-Abstand beachten. Echte `data.monitors` sind erforderlich, um Livezugriff als erfolgreich zu melden.
6. Einstellungen → Debugging bleibt standardmäßig geschlossen; JSON-Export prüfen. Tatsächliche Android-Standortfreigabe, Bewegungssensor und Akkuersparnis auf dem Gerät prüfen.

## Laufzeit

- Normale PWA: `apiBase:"."`, `staticOnly:false`, `preferProxy:true`.
- Monitor-Relay akzeptiert nur numerische StopIDs, höchstens 24, feste offizielle Zieladresse, 12-Sekunden-Verbindungstimeout, 30-Sekunden-Cache. Keine Standortkoordinaten oder offenen URL-Weiterleitungen.
- `/api/health` meldet die App-Version. `/api/stops-index` bleibt als Fallback vorhanden; der normale Start verwendet den gebündelten offiziellen Katalog.
- Assets liefern `Permissions-Policy: geolocation=(self), accelerometer=(self)`. Die Browser-/Android-Freigabe bleibt notwendig. Eingebettete Browser können die API zusätzlich sperren; das wird im UI erklärt.
- D1-Bindung DB für zeitlich begrenzten verschlüsselten QR-Transfer sowie optionale verschlüsselte Push-Freigaben; keine Durable-Object-Bindung. Physische Geräteabnahme gesondert prüfen.
- Versionswechsel: Shell-Cache und versionierte CSS/JS-Abhängigkeiten aktualisieren. Manifest-Adresse ab v0.1.4 stabil halten, Manifest netz-zuerst abrufen; Icon-Dateipfade bei tatsächlichen Änderungen versionieren. Manifest-ID/Scope, LocalStorage-/IndexedDB-Schlüssel unverändert erhalten.

## Vorschau

Nach dem Build `sites-preview start <checkout>` benutzen. Der Daemon startet `npm run dev` mit dem lokalen Adapter. Das HTTP-Preview erlaubt kein echtes Geolocation-Testing; sein Node-Netzzugriff ist kein Nachweis für den produktiven Cloudflare-Relay. Browserprüfungen bleiben bei den bereitgestellten Browser-Werkzeugen.

## Datenkatalog aktualisieren

Offizielle CSVs und das aktuelle offizielle GTFS-ZIP separat herunterladen; dann `python3 scripts/prepare_stops.py --file <haltepunkte.csv> --lines-file <linien.csv> --patterns-file <fahrwegverlaeufe.csv> --gtfs-file <gtfs.zip> --reference-date YYYY-MM-DD` ausführen. Die Servicewoche muss vollständig im Feed enthalten sein; keine ungeprüfte Varianten-Fallbackliste erzeugen. Danach `python3 scripts/sync_wear_assets.py` für die Wear-Quellen. Quelle und Abrufstand bleiben im JSON. ÖBB-Import und getrennte Backend-/Wear-Alternativen stehen in [deployment.md](deployment.md).

Sites-Cache-Kompatibilität: eigener benannter API-Cache `foama-wien-api-v1`, niemals `caches.default`. Der Test simuliert den verbotenen Default-Cache. Der Katalog-Fallback `/api/stops-index` liefert den gebündelten offiziellen Katalog ohne weiteren externen Abruf; versionierte Katalogabfrage vermeidet alte leere Offline-Caches.

## Referenzdaten v0.1.4

`prepare_stops.py` verbindet Haltepunkte mit `wienerlinien-ogd-linien.csv` und `wienerlinien-ogd-fahrwegverlaeufe.csv`. Optional lokale Quellen mit `--file`, `--lines-file`, `--patterns-file`; unvollständige Linienzuordnung bricht ab. Keine bloße Ableitung des Verkehrsmittels aus dem Stationsnamen.

`prepare_address_index.py --file <ADRESSENOGD-GeoJSON>` reduziert den öffentlichen Wiener Referenzbestand auf 79.352 Straßen-/PLZ-Punkte (~2 MB). Quellabfrage/Stand in `pwa/data/streets.json`. Nur öffentliche Referenzdaten werden ausgeliefert; kein Backend-Geocoder, keine Standortprotokollierung. SW-Precache und Datei vor Veröffentlichung prüfen.

HTTP 403/429: Relay liefert weiter einen tatsächlichen Fehler samt `upstreamHttpStatus` und `Retry-After`. Erfolgreiche Antworten 30 Sekunden, Zugriffspause 60 Sekunden (ggf. bis 300 nach Anbieterhinweis) im benannten Cache. Client speichert reale Abfahrten begrenzt und steigert Pausen bis fünf Minuten. Keine Zugriffsschutz-Umgehung oder unbekannten Drittanbieter-Proxys.

## v0.1.5

Neue CSS-/JS-Einstiege und Shell-Version für Nachtlinienfarben und Zieladresse der Stationskarte. Vorhandene Manifest-ID und Icon-Dateipfade bleiben erhalten. Build/Veröffentlichung unverändert.

## v0.1.5 – Meldungen, Karten und Debugging

Monitor-Relay aktiviert intern fünf feste Meldungskategorien; eingehende Parameter bleiben auf numerische StopIDs begrenzt. Nach erfolgreicher Monitorantwort wird der feste offizielle `trafficInfoList`-Feed aus dem benannten Cache ergänzt (120 Sekunden Erfolg, 60 Sekunden Fehler). Abrufbudget maximal drei Sekunden, bei langsamem Monitor kleiner; Fehler blockieren keine gültige Abfahrtsantwort. Keine frei wählbaren Ziel-URLs, kein zusätzlicher Client-Timer, keine Hintergrundpolls.

Leaflet-Distribution unter `pwa/vendor/leaflet` inklusive Bilder/Lizenz im Worker und SW-Precache. Kartenkacheln/Routing weiterhin externe Dienste nach Nutzeraktion. Neuer Debug-Logger nutzt `foama.debug.v1`, höchstens 60 streng begrenzte technische Ereignisse, keine Koordinaten oder Haltepunkte. `/diagnose` ist eine Kompatibilitäts-Hinweisseite; kein Live-Tester im normalen UI. Vor Publikation SW-Assetliste und Debug-Export prüfen.

Wear-Designvorschau /wear-design.html wird als zusätzliches statisches Asset derselben Site ausgeliefert. Kein separater App-Host, keine neue Site, keine APK und keine API-Abfragen des Prototyps.

## v0.1.6 – Bewegungshilfe

Neues `motion-state.mjs` in Worker und Offline-Precache; alle aktuellen versionierten Module/Health-/Update-Angaben auf v0.1.6. Manifest-ID/URL und Icon-Dateien unverändert. `accelerometer=(self)` erlaubt nur die eigene Origin; kein Sensorzugriff vor optionaler Aktivierung und Standortaktion. Sensorfrische und Kontrolltimer werden wie GPS bei Seitenpause beendet. Details und physische Testgrenzen: [Bewegungshilfe](docs/motion-battery-saving.md).

Kosmetische Nachprüfung v0.1.6-r1: Checkbox-/Label-Ausrichtung korrigiert, CSS-Query und Shell-Cache aktualisiert. Standortlogik unverändert.

## v0.1.7 – Meldungen und Favoriten

`favorite-state.mjs` in Worker und Offline-Shell aufgenommen. Versionsabfragen/Health/Update auf v0.1.7; Manifest-Identität, bestehende Icon-Dateien und lokale Datenschlüssel bleiben erhalten. `favoriteSort` wird im bestehenden Settings-Objekt gespeichert. Keine zusätzliche API-Route, kein neuer Abfragetimer.

Relay filtert fremde haltestellengebundene Kurzmeldungen aus der Feed-Ergänzung und bevorzugt die ausführliche Monitor-Kopie bei gleicher ID. Client prüft den Haltepunktbezug auch bei altem Cache und vereinigt identische Meldungen. Favoritenbudget pro 30-s-Monitor: bei Bedarf 16 feste priorisierte und acht rotierende RBL; eigene Reihenfolge folgt Anzeige, nicht früher aufgeklappten Nähe-Karten. Nach Publikation Kartenmarker → Favorit speichern, Listenalternative und Wechsel manuell/Entfernung prüfen.

## v0.1.8

Favoriten-Sortierung als Button-Gruppe statt Select; HTML, CSS, Modul- und Shell-Version gemeinsam erneuert. Settings-Schlüssel/Sortierwerte unverändert. Beide Knöpfe, gespeicherte Auswahl und Tastaturfokus öffentlich prüfen.

## v0.1.9

Stationskarten/Zeitzahlen neu gestaltet; HTML/CSS/Modul- und Offline-Shell-Version gemeinsam auf v0.1.9. Keine Datenmigration, keine neue API-Route oder Ressource. Nach Veröffentlichung beide Karten-Zustände, Kartennavigation und Favoritenstern sowie gleiche berechnete Zahlengröße in Nähe/Favoriten prüfen.

## v0.1.10

Standortanzeige zusammengeführt; Main-HTML/CSS/Module/Service-Worker gemeinsam aktualisiert. Oberer Statusbereich initial verborgen und nur für Daten-/Startfehler eingeblendet. Keine Datenmigration oder neue Berechtigung. Öffentlich prüfen: normal kein Standortbanner, Status und Abfahrtsaktualisierung innerhalb der Standortkarte.

## v0.1.11

Nur Favoriten-Abstände kompakter; Hauptzahlen unverändert. Versionierte Offline-Shell erneuert. Öffentlich Zeilenhöhe/Abstände und weiterhin 28-px-Hauptzeit prüfen. Keine Daten-/API-Änderung.

## v0.1.12 – Aussehen und Wear-Vorbereitung

Theme-Modul im Offline-Precache, frühe lokale Theme-Anwendung im Dokumentkopf, Buttons nutzen dieselben gespeicherten Settings. Öffentliche Hell-/Dunkel-Prüfung einschließlich Menüs, Karten, Formularen und Warnungen; Systemwechsel separat automatisiert geprüft. SDK/ZXing bleiben unter ignoriertem .local, niemals im Worker/Quell-ZIP. Nativer Build-Stand in docs/squashtap-build-adaptation.md.

## Native Wear-Veröffentlichung 0.2.0

Die separat gebaute/signierte APK erst mit scripts/publish_wear_update.py prüfen und nach pwa/apk kopieren. PWA-Version bleibt 0.1.12; Wear-Version 0.2.0 separat in update.json, einschließlich Code 1, Paket, SHA-256 und 402075 Bytes. Öffentlicher Einstieg /wear.html, Link unter Einstellungen → Auf deiner Uhr. APK-MIME application/vnd.android.package-archive und Attachment-Disposition.

python3 scripts/package_source.py erzeugt den öffentlichen Quell-/Dokumentationsdownload ohne .local, private Schlüssel, Passwörter und APK-Dateien. Danach npm test und python3 scripts/build_site.py im Sites-Quellworkflow. Aktueller SW r2 nimmt APK/ZIP nicht in den Offline-Cache auf. Native Binaries bleiben in veröffentlichten Versionen erhalten, ohne die Downloadseite mit alten Builds zu überladen. Für ein echtes Watch-Update niemals den Signaturschlüssel wechseln oder die App vorher deinstallieren. Privates Signing-Backup ist separat dauerhaft gesichert; siehe docs/wear-os-release-0.2.0.md.

## PWA 0.1.13

Versionierte HTML-/CSS-/Modul-/Offline-Shell gemeinsam erneuert; API-Health, Config und gemeinsamer Update-Feed melden PWA 0.1.13. Wear-Version 0.2.0 und deren SHA-256/Download bleiben unverändert. Nur die Darstellung/Links angepasst; kein nativer Neubuild. Die bewährte private Signatur bleibt unangetastet. Quell-/Dokumentationsarchiv vor dem Sites-Build erneuern.


## Native Aktualisierung 0.2.1

Originalen privaten Release-Key wiederherstellen. scripts/build.py erzwingt 39 native Tests vor dem Signieren; Konfiguration 0.2.1 / Code 2 in wear/build-config.json und Gradle-Spiegel. scripts/publish_wear_update.py prüft Originalsignatur, Paket und Version, erhält PWA 0.1.13 und veröffentlicht den getrennten Wear-Feed. Neue APK: 406171 Bytes, SHA-256 fab1ae7707e5ba875bf31689d1ec50d2ca9f28ec5deca982446c026f41728ce2. Vorversion 0.2.0 samt Prüfsumme weiterhin im Deployment, nur 0.2.1 prominent verlinkt. Native Beispielrenderings erneuern und mit ?v=0.2.1 abrufen. Shell-Revision v0.1.13-wear021 erneuert nur Ressourcen; PWA-Datenschlüssel unverändert.

Updatepfad aktuell Mehr → App & Updates → Auf Update prüfen, aus 0.2.0 direkt Mehr → Auf Update prüfen. Wiederverwendete Paketidentität und Signatur erlauben Installation über die vorhandene App; nicht deinstallieren. Hardwareprüfung von Ortung/Update bleibt nötig.


## PWA 0.1.14 / Wear 0.2.2

PWA-Importqueries, Config/Health, Update-Feed und Shell-Version zusammen erneuert; transport-controls.mjs mit und ohne Query im Precache. CSS-/JS-/App-/Speicheridentitäten unverändert. Native Konfiguration 0.2.2 / Code 3, ursprünglicher Key, 54 Android-Tests vor dem Signieren. APK 410267 Bytes / SHA-256 a30dfd578aa0aec9373d39f448d9aa576556cb9a5bf3d06b93a3fa96edbed029. Bisherige geprüfte APKs im Deployment erhalten, nur aktuelle prominent verlinken. Neue native Beispielrenderings mit ?v=0.2.2. Quell-/Dokumentations-ZIP erneuern.

Nach Publikation PWA-Icon-Filter in beiden Ansichten, nach Reload geschlossenen Standort und native Updateversion kontrollieren. Preview-HTTP erlaubt kein echtes GPS; Watch-Gesten/Display-aus noch physisch prüfen.


## PWA 0.1.15

PWA-Version, Config/Health, Queryimporte und Shell gemeinsam auf 0.1.15. favorite-menu.mjs mit und ohne Versionsquery im Precache. Quell-/Dokumentationsarchiv erneuern; Wear-Metadaten und geprüfte APKs erhalten. Nach Veröffentlichung Menüexklusivität, beide Verschieberichtungen, geschlossene Menüs nach Mutation und gespeicherte Reihenfolge nach Reload prüfen. Native APK bleibt 0.2.2; kein nativer Neubuild für diesen PWA-Fix.


## PWA 0.1.16 / Wear 0.2.3

PWA-Queryimporte, Shell, Health, Config und Update-Feed gemeinsam erneuert. Verkehrsmittelleiste per Sechser-Grid, Suchradius im Kopf; Meldungsstatus wird in das Panel der aktuellen Ansicht versetzt. Favoriten-/Settings-Schlüssel und Netzwerkintervalle bleiben. Temporäre responsive Prüffläche nicht ausliefern.

Native Konfiguration 0.2.3 / Code 4; 54 Android-Tests, Originalsignatur, Paket und zipalign geprüft. APK 410267 Bytes, SHA-256 4ce7a2d605891c308006cbab426a1bf7bd7f6816a865ba609c8f10d8e8ea89c6. Vorversionen erhalten, nur aktuelle prominent verlinken. Native Renderings und Quellarchiv erneuern. 97 Node-Tests; keine zusätzlichen Tests nur für die Darstellung. QR-Dienst bleibt unkonfiguriert.


## PWA 0.1.17

warning-panel.mjs mit und ohne Versionsquery in die Offline-Shell aufgenommen. PWA-HTML/CSS/Imports, Config/Health/Update gemeinsam auf 0.1.17. Warnkarte initial verborgen, nur bei relevanten vorhandenen Einträgen sichtbar; kein separater Status zu leeren/ladenden Meldungen. 101 Node-Tests, Browserprüfung ohne Meldungen und lokaler gekennzeichneter Warn-Beispielfall in beiden Themes. Temporäre Prüffläche vor Verpacken entfernt. Quell-/Dokumentationsarchiv erneuern. Native APKs, alle Wear-Metadaten und App-/Speicheridentitäten unverändert.


## PWA 0.1.18 / Wear 0.2.4

D1-Binding als String "d1": "DB" in .openai/hosting.json, schema-only Drizzle-Migration aus db/schema.ts generiert. Build enthält drizzle-Metadaten/SQL. Keine Tabellenanlage während Requests. Relay ist auf feste Session-/Payload-Routen, Capability-Header und 50-KB-Anfragen begrenzt. Keine AES-Schlüssel, Klartextfavoriten oder GPS-Werte im Relay. 256 gleichzeitige Sessions; Zugang endet fest zehn Minuten nach Erstellung. Ciphertext wird nach Übernahme/Abrufbestätigung sofort auf NULL gesetzt; eine inhaltslose Quittung verhindert Wiederverwendung. Abgelaufene Zeilen werden bei folgenden Transfer-/API-Aufrufen physisch bereinigt, nicht durch einen zusätzlichen Hintergrund-Job. Speicherung/Backups des Providers können eigene Aufbewahrung besitzen; es wird keine sekundengenaue physische Löschung während vollständiger Inaktivität behauptet.

105 Node- und 60 Android-Tests, WebCrypto↔Java AES-GCM und native QR-Decodierung bestanden. Signatur, zipalign und Paketversion 0.2.4 / Code 5 mit ursprünglichem Zertifikat geprüft. APK 418459 Bytes, SHA-256 7401d0841578299fabdada27b94af885e548f4b97c7da4ee3eb94888ca5c68dd. Alte geprüfte Binaries bleiben in der unveränderten Sites-Version 31 als Rückgriff enthalten; nach Workspace-Bereinigung war ihre erneute Cloud-Übernahme über HTTP/Browser nicht möglich. Die neue Veröffentlichung liefert die aktuelle APK. Kein neuer Signierschlüssel, keine Deinstallation oder Datenmigration.

Quellarchiv enthält Schema/Migrationen und schließt Schlüssel, .local, APKs und node_modules aus. Öffentliche temporäre Transfer-Abnahmeseite nach Prüfung entfernen und abschließende Version veröffentlichen.

## PWA 0.1.19

Kompaktere Stationszeilen, PWA-Version und versionierte Einstiege auf 0.1.19, neuer Offline-Shell-Cache. Keine Schema- oder API-Änderung. Die bestehende öffentliche APK 0.2.4 unverändert aus dem gespeicherten Release-Archiv wiederhergestellt und gegen den Update-Feed-Hash geprüft; kein nativer Neubuild. Quell-/Dokumentationsarchiv neu erzeugen; temporäre Abstands-Prüfdateien vor dem finalen Build entfernen. ÖBB-Integration hat noch keine Veröffentlichung geliefert.

## PWA 0.1.20 · Push-Betrieb

Vor dem Build npm-Dependencies über den Site-Installer wiederherstellen; esbuild 0.25.12 ist gepinnt. Migration 0001_worried_zaran ergänzt drei Push-Tabellen, 0000 unverändert. ESM-Bündel statt manueller Importentfernung. Build bricht bei fehlender/falscher aktueller Wear-APK ab. Source ZIP neu erstellen, Site unverändert öffentlich veröffentlichen. Runtime-Secret-Namen, Auftragsaufbau und Prüfablauf siehe docs/push-notifications.md. Nie Secrets oder Verwaltungsfreigaben im Quellarchiv/Zeitplan speichern. Nach Änderungen der Runtime-Konfiguration gespeicherte Version erneut deployen. Native APK/Signer unverändert.

Aktueller Betriebsblocker 08.11.2026: erster stündlicher Plattformauftrag fehlgeschlagen, pausiert. PUSH_SCHEDULER_ENABLED=false belassen, bis deploy/push-timer auf einem verbundenen Server gestartet und verifiziert ist. Runtime-Flag und optional PUSH_INTERVAL_MINUTES=5 erst dann setzen und erneut deployen. Docker ist in dieser Arbeitsumgebung nicht verfügbar; Timer nur mit Python-Vertragsprüfungen vorbereitet. Keine automatische/physische Zustellung behaupten.

## PWA 0.1.22 / Wear 0.3.0

station-viewport.mjs mit und ohne Query im Offline-Cache erhalten. Die Sichtbarkeit steuert nur das bestehende 24-RBL-/30-s-Budget; kein zusätzlicher Abruf beim Scrollen. Favoriten-Gruppierung ist eine Ansicht auf unveränderten gespeicherten Einträgen, nur ausdrücklich betätigtes Stations-Verschieben ändert deren Reihenfolge. Warn-Badges im geschlossenen Kopf von globalen und stationsbezogenen Meldungen erhalten.

Native Abhängigkeiten: offizielles Firebase Messaging 26.0.1 mit 77 gepinnten Runtime-Artefakten aus firebase-dependencies.json; D8/R8 8.13.25 in android-dependencies.json. scripts/firebase_sdk.py prüft SHA-256, vereinigt offizielle Ressourcen/Registrare, erstellt Bibliotheks-R-Klassen und übernimmt notwendige DataStore-JNI-Bibliotheken. SDK-/Maven-Caches bleiben ignoriert unter .local. Kein google-services.json erforderlich; öffentliche Firebase-Optionen kommen ausschließlich nach Opt-in aus /api/push/config. Standard-FirebaseInitProvider entfernt, Auto-Init und Datensammlung aus; Opt-in initialisiert die eigene Firebase-App. Privaten ursprünglichen Release-Key laden, scripts/build.py erzwingt 77 Android-Tests, apksigner, zipalign und Metadaten. Neue APK nur mit publish_wear_update.py stagen, danach update.json/wear.html und Beispielrenderings synchron halten.

MCP: .openai/hosting.json erhält capabilities:["mcp"]. Der stateless /mcp-Endpunkt bietet nur foama_push_status und foama_check_disruptions ohne Eingabeparameter; keine Geräte-/Empfängerinformationen. Der begrenzte Prüf-Tick ist auch weiterhin ohne Plugin über leeres POST /api/push/check nutzbar, sobald der Dienst freigeschaltet ist. Ein tatsächlicher unbeaufsichtigter Werkzeuglauf muss anhand der D1-Prüfzeit nachgewiesen werden; vorhandener Code allein ist kein Scheduler. Maximale Plattformfrequenz stündlich. Firebase-Namen und Betriebsgrenzen: docs/push-notifications.md.

## PWA 0.1.23 / Wear 0.3.1

Bestehende Identitäten, Datenschlüssel und Originalsignatur erhalten. PWA-Queryimporte, Offline-Shell, Config, Health und Updateversion gemeinsam erneuern. traffic-info.mjs enthält reine Zeit-/Kategoriepriorität; keine zusätzliche API oder Timer. stationNoticeSections in warning-panel.mjs trennt gelbe aktive Warnungen von neutralen Geräte-/Zukunftshinweisen. Beide Push-Transporte verwenden dieselbe Regel ohne 30-Minuten-Vorlauf. Native Uhr filtert aufgelöste/abgelaufene/zukünftige/Equipment-Referenzen vor dem Warnmarker. 143 Node-/79 Android-Tests. Signierte APK 0.3.1 / Code 8, ursprüngliches Paket/Zertifikat, apksigner/zipalign und Metadaten vor Veröffentlichung prüfen. Temporäre Browser-Prüffläche vor Quellarchiv und finalem Build entfernen. Push-Betriebsgate unverändert aus.

## Wear 0.3.2 / Code 9

Nur native Transfer-Lebensdauer geändert, PWA bleibt 0.1.23. MainActivity setzt FLAG_KEEP_SCREEN_ON ausschließlich während aktiver sichtbarer Transfers und entfernt das Flag bei jedem Endpfad. Unabhängiger Handler-Timer mit monotoner Zehn-Minuten-Obergrenze und ggf. früherem Serverablauf; auch Vorbereitung und Bestätigungswartezeit begrenzt. Terminale Endpfade stornieren Requests/Timer und verwerfen QR/Schlüssel/Vorschau; keine späten Callbacks aus geschlossener Sitzung. 83 native Tests und 143 unveränderte Node-Tests; Original-Key, apksigner, zipalign und Metadaten vor Staging prüfen. APK, Update-Feed, Downloadseite und öffentliches Quellarchiv gemeinsam veröffentlichen.

## Wear 0.3.3 / Code 10

Keine neue Abhängigkeit, Berechtigung oder Schemaänderung. Native Menüs/Filterplatzierung und die öffentliche Uhr-Webseite angepasst; PWA bleibt 0.1.23. 86 native Prüfungen vor Signieren, ursprüngliche Identität, Metadaten und zipalign erhalten. Veröffentlichung aktualisiert APK/Update-Feed, wear.html, separat versioniertes wear.css?v=0.3.3 und native Near-/Detail-Renderings; technische Metadaten aus geprüftem Feed übernehmen. Temporäre wear-review.html vor Quellarchiv und finalem Worker entfernen. Keine Test-/Beispielseite in Produktion. Source ZIP und Worker aus demselben Git-Stand erzeugen.

## 0.5.0 · Routenvergleich, Orte und native Bedienung

PWA: Schnellste Route oder Wenig Umstiege wählen, mit konkreten Abfahrts-/Ankunftszeiten und Zeitunterschied. Zwei feste Transitous-Profilabfragen je bewusster Suche (timetableView true/false), beide im bisherigen gemeinsamen 700er-Budget. Umschalten, Karte und Favoritenöffnung lösen keine neue Vollplanung aus. Rückfahrt planen tauscht feste Endpunkte und sucht die tatsächliche Gegenrichtung; bei altem GPS-Start bleibt das Ziel zur Auswahl offen. Meine Orte speichert bis zu 30 benannte Adressen lokal. Start → Ziel und Ein-/Ausstiegsstation bleiben auch unter eigenen Favoritennamen sichtbar; Gesamtroute auf Karte direkt oben.

Haltestellenkarte: nächstgelegene amtliche Zugangsadresse mit Hausnummer, PLZ, Abstand und Stadt-Wien-Quelle. 1.748 Haltestellen aus 151.577 öffentlichen Zugangsadressen zugeordnet, höchstens 100 m Entfernung. Das ist ausdrücklich keine gesicherte Stations-Postadresse; Routingziel bleibt der offizielle Haltepunkt. Fehlende Zuordnung fällt auf Straßenumgebung zurück. Ableitung offline, keine zusätzlichen Standortübertragungen.

Wear: A nach B ist direkt als drittes Hauptziel erreichbar, auch ohne Routen. Routenfavoriten aus PWA per QR oder lokal per JSON-Datei mit Vorschau/bewusster Übernahme; Dateiauswahl ist abhängig von einer verfügbaren System-Dateiauswahl auf der Uhr, QR bleibt als Alternative. 512-KiB-Dateigrenze, bestehende v1/v2-Formate und unabhängige Gerätespeicher erhalten. Aktuelle passende Zeiten je Etappe, Alternativen und korrekter Zurück-Pfad.

Uhr-Updates: Prüfen liest ausschließlich Metadaten, zeigt verfügbare Version und bis zu vier releasebezogene Neuerungen. Erst Installieren bestätigt Download und Übergabe an Android; Prozent-/MB-Fortschritt, Größen-/Hash-/Originalsignaturprüfung und Abbruchbereinigung. Optionaler Ultra-Sparmodus unter 20 %, standardmäßig aus, Hinweis und bewusste Aktivierung. Ab 25 % normal mit Hinweis (Hysterese); Ortung höchstens alle fünf Minuten als Einzelfix, Abfahrten alle 90 s, Darstellung alle 30 s. Manuelle Ortung möglich. Alter/Unsicherheitsgrenzen unverändert, keine Hintergrundabfragen; Akkuzustand wird bei sichtbarer App ausgewertet. QR-/Import-/Update-Operationen behalten ihre begrenzte Wachhaltefunktion.

Prüfung: 240 Web-/Server-, 116 Android- und acht Python-Tests bestanden. Physischer OnePlus-/GPS-/Dateiauswahl-/Installer-Test bleibt separat. Originalpaket at.andrew.foamawien und Signaturschlüssel erhalten; Wear-Code 18. Öffentliche Browserabnahme erfolgreich: Routenvergleich mit realen Transitous-Zeiten (ein Umstieg weniger, vier Minuten spätere Ankunft), Wechsel der gesamten Karte ohne neue Planung, eigene Favoritennamen mit Ein-/Ausstieg, Rückfahrt Karlsplatz → Rathaus mit aktuellen U2-Zeiten Richtung Aspernstraße, Ortsanlage/-auswahl und Erhalt nach Reload, Aktualisierungsbanner mit bewusster Übernahme sowie echte Adresse Franklinstraße 19/1210 Wien in 29 m Abstand. Vorhandene zwei Stations-/drei Routenfavoriten erhalten. Öffentliche APK heruntergeladen, 3.731.884 Bytes und SHA-256 8efe899acf688f53d0629455e5dc98ad1447b95ca7a8b6e7308bdae14150bd07 bytegleich zum signierten Build. Physische Watch-Abnahme weiterhin separat.

## Uhr 0.5.1 / Code 19 · gemeinsamer Favoritenimport · 09.11.2026

Unter Mehr → Favoriten → Aus PWA importieren gibt es einen gemeinsamen Einstieg für Haltestellen, Linien/Richtungen und A-nach-B-Routen. QR und JSON-Datei sind direkt dort erreichbar. Die bestehende PWA-Übertragung wählt alle kompatiblen Favoriten vor; Nutzer können die Auswahl vor dem Senden ändern. Vorschau und Bestätigung auf der Uhr bleiben erforderlich, vorhandene lokale Favoriten und Routen bleiben erhalten, Duplikate werden zusammengeführt.

Dateivorschau zeigt jetzt auch Haltestellen-/Liniennamen sowie Routen gruppiert. Abbruch, erfolgreiche Übernahme und QR-Rückkehr führen in das aufrufende Importmenü zurück. Dateiimport weiterhin 512 KiB; QR weiterhin zehn Minuten verschlüsselt und mit 32-KiB-Klartextgrenze. Der bisherige A-nach-B-Einstieg und die bidirektionale Übertragung bleiben verfügbar. PWA 0.5.1 ergänzt getrennte Favoritenaktionen auf der Standortkarte; nativer Release 0.5.1/19 mit Originalpaket und Originalschlüssel.

## 0.6.0 · Störungsbenachrichtigungen · 09.11.2026

Der bisher pausierte Stundenauftrag wurde auf die verbundene foama-wien-App umgestellt. Unbeaufsichtigter Lauf b6807536-f000-8322-bf47-cffd16b20df6, geplant 11:07:54, gestartet 11:08:09, abgeschlossen 11:08:51 Europe/Vienna, recorded_status=completed. Der Server hat den Quellenabruf mit neuer lastCheck/lastSuccess und setup-source-only quittiert. Damit ist der vorherige Scheduler-Blocker für den Stundenbetrieb behoben. Runtime-Revision 4 setzt PUSH_SCHEDULER_ENABLED=true und PUSH_INTERVAL_MINUTES=60; Anwendung mit diesem Release. Vorhandene VAPID-/Speicherschlüssel unverändert. Plattform maximal stündlich; zusätzliche Prüfungen etwa alle fünf Minuten nur im Rahmen ohnehin erfolgender aktiver Monitoraufrufe. Der vorbereitete externe Fünf-Minuten-Timer ist weiterhin nicht gestartet. Kein sofortiger Echtzeitversand oder Fünf-Minuten-Hintergrundtakt behaupten.

Meine Favoriten umfasst nun Haltestellen, Linien sowie gespeicherte A-nach-B-Wege einschließlich Alternativen. Bekannte Ein-, Umstiegs- und Ausstiegsstationen werden lokal zu minimalen Stop-/Linienfiltern zusammengeführt, maximal 100 Stationen. Keine Adressen, eigenen Routennamen oder GPS-Koordinaten werden übertragen. PWA synchronisiert geänderte Routen nach sichtbarer Rückkehr sofort; Uhr bei Import/Entfernen und sichtbarer Fortsetzung. Bestehende Zustellgrenzen, Deduplizierung, Quellen-/Gültigkeitsprüfung, Gerätefreigaben, verschlüsselte Datenhaltung und Opt-out erhalten. Geplantes nicht vor Beginn; Aufzüge/Fahrtreppen weiterhin optional aus.

PWA: Aktivierung/Test nach bewusster Browserfreigabe, sichtbare ehrliche Dienstfrequenz und letzte Prüfung. Direkte Uhr-Zustellung bleibt bis zur Firebase-Einrichtung gesperrt: Firebase-Plugin angeboten, noch nicht bestätigt verbunden; keine FIREBASE_*/FCM_SERVICE_ACCOUNT_JSON im Hosting vorhanden. Die PWA benötigt keinen Firebase-Client. Telefon-Spiegelung ist eine getrennte Systemeinstellung. Keine physische Zustellung aus Unit-Tests oder einem erfolgreichen Quellenabruf ableiten.
