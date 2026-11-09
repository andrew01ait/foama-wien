# Historische Dokumentation vor der GitHub-Veröffentlichung

Archiviert am 9. November 2026. Enthält frühere Stände und inzwischen ersetzte Anweisungen. Maßgeblich sind die aktuellen [Projektunterlagen](../README.md).

## Build 0.4.2 / Code 17

Originaler Release-Key, SDK34, 104 native Tests. Routen-/Detailzeiten gleichen vollständige Planer- und Monitorzielnamen ab; Gegenrichtung und explizit verschiedene via-Angaben bleiben getrennt. Siehe docs/wear-os-release-0.4.2.md.

## Build 0.4.1 / Code 16

Ursprünglicher Release-Key/Paket, Java/Python/SDK34, 103 native Prüfungen vor Signatur. Variantenstore und fokussierte native Ansichten mitgebaut. Kein Gradle/Android Studio oder lokaler Benutzer-PC nötig. Signiermaterial ausschließlich .local/private; Source-/Site-Archiv schließen es aus. Weitere Metadaten in docs/wear-os-release-0.4.1.md.

## Aktueller Build 0.4.0 / Code 15

Gleiche Buildkette und ursprünglicher Release-Key aus dem privaten Backup, kein neuer Key. SDK34, Java/Python/D8/apksigner; 98 Android-Tests vor Signatur zwingend ausgeführt. Native Routenstore/Transfer/Ansichten mitgebaut, Größe/Prüfsumme unter DEPLOYMENT.md und docs/wear-os-release-0.4.0.md. Schlüsseldatei und Passwörter bleiben ausschließlich in .local/private, niemals im Source- oder Site-Archiv.

## Aktuell: Wear 0.3.7 / Code 14

Neue Seiten invalidieren alte Scroll-Runnables. Neues Liniendetail oben; laufender Refresh erhält Position. 91 native Tests einschließlich tatsächlichem ScrollView mit vor Navigation wartendem Restore sowie zwei aufeinanderfolgenden Details bestanden. Originalsignatur/Paket erhalten; 3.715.500 Bytes, SHA-256 170b12ecbd75a253c3945d0ecaf90ba87ba8c605bc4925a61076d8e7c5d9e1bf. Keine native Reiseplanung: zuerst PWA laut Nutzersteuerung. Physische OnePlus-Abnahme separat.

## Aktuell: Wear 0.3.6 / Code 13

Nur Favoriten-Sortiertext Nähesten zuerst. 90 native und 168 Node-Tests bestanden; APK mit Originalsignatur, Paket/Version/Code und zipalign geprüft. Bestehende CLI-Toolchain, Daten und Lifecycle erhalten. PWA 0.1.27; A-nach-B-Planung nur vorgemerkt. [Release](../wear-os-release-0.3.6.md).

## Aktuell: Wear 0.3.5 / Code 12

90 native Tests, bereinigter GTFS-Katalog und gemeinsame öffentliche Linien-Evidenz aus dem bestehenden Dienst. Keine neue native Abhängigkeit/Berechtigung. Signatur/Paket/zipalign und Metadaten geprüft; PWA 0.1.26. [Release](../wear-os-release-0.3.5.md).

## Aktuell: Wear 0.3.4 / Code 11

88 native Tests, gemeinsames Stationslayout in Nähe/Favoriten und neutrale unbestätigte Daten. Originalschlüssel, Paket, APK-Metadaten, zipalign und apksigner verifiziert; keine neuen nativen Abhängigkeiten. PWA 0.1.24. [Release](../wear-os-release-0.3.4.md).

## Aktuell: Wear 0.3.3 / Code 10

86 native Android-Tests; Originalzertifikat, Paket, zipalign und APK-Metadaten verifiziert. Menü-/Darstellungsänderung ohne zusätzliche native Abhängigkeiten. PWA bleibt 0.1.23, öffentliche Uhr-Webseite neu gefasst. [Release](../wear-os-release-0.3.3.md).

## Aktuell: Wear 0.3.2 / Code 9

83 native Android-Tests, bestehende CLI-/Firebase-Toolchain unverändert. Transferbezogenes Screen-awake ohne neue Abhängigkeiten oder Berechtigungen; PWA 0.1.23. Originalschlüssel/Paket, Metadaten und Signatur vor Veröffentlichung prüfen. [Release](../wear-os-release-0.3.2.md).

## Aktuell: Wear 0.3.1 / Code 8

79 native Android-Tests vor Signieren bestanden. Originalzertifikat, stabile Paket-ID, APK-Metadaten und zipalign verifiziert; [Releasebeleg](../wear-os-release-0.3.1.md). Nur Warnrelevanz anhand Kategorien/Zeiträumen geändert. Native Toolchain und Firebase-Konfiguration unverändert; Firebase-Zustellung weiter offen.

## PWA 0.1.22 / Wear 0.3.0 · Sichtbare Stationen und gemeinsame Favoritenkarten · 08.11.2026

Favoriten derselben Station erscheinen in einer gemeinsamen Karte, auch wenn nur einzelne Linien/Richtungen gespeichert sind. Der Stationsname ist immer die Hauptüberschrift; Richtungen stehen darunter. PWA: einzelner Stern entfernt nur die gespeicherte Verbindung, ein exklusives Stationsmenü verschiebt/entfernt die gesamte Karte. Entfernungssortierung gruppiert nur die Ansicht; gespeicherte Reihenfolge, JSON, QR und lokale Datenschlüssel bleiben erhalten. Watch: gleiche Stationsgruppierung, Verbindungen weiterhin einzeln über das Detail entfernbar. Ganze Station plus einzelne Verbindungen erzeugen keine doppelten geladenen Zeilen.

Warnmeldungen: betroffene Linien bleiben sowohl in der geschlossenen Warnmeldungen-Karte als auch im geschlossenen Stationshinweis als farbige Linienbadges sichtbar. Alle zusammengefassten Ereignisse tragen bei. Explizite Betreiber-Linienreferenzen haben Vorrang; bei fehlenden Referenzen werden nur eindeutige Linienlisten im Meldungstitel übernommen, keine beliebigen Zahlen aus Beschreibungstexten. Leere Warnbereiche bleiben verborgen; Relevanz, Deduplizierung und Kennzeichnung älterer Daten erhalten.

Abrufpriorität: tatsächlich sichtbare Stationen verbrauchen zuerst das bestehende 24-RBL-Budget, erst danach außerhalb des Bildschirms liegende Stationen. PWA: sichtbar und aufgeklappt vor sichtbar geschlossen. Innerhalb derselben Sichtbarkeitsstufe bestätigte U-Bahn vor Tram vor Bus; bei Überlauf begrenzte Rotation. Scrollen verursacht keine zusätzlichen Requests innerhalb der 30-Sekunden-Sperre. Pause beendet normales Monitor-Polling und GPS. Offene PWA-Dialoge sowie native Unterseiten halten Monitor-Polling an. Josefstädter Straße U: Tram-RBL liegen numerisch vor den U6-RBL 4607/4622; die frühere Verteilung konnte U6 im ersten Budget verdrängen. Es gab dort keine PWA-Dreiergrenze. Öffentlicher API-Abruf mit allen acht Bahnsteigen lieferte zwei U6-Richtungen und drei Tram-Richtungen; Katalog-Badges bedeuten nicht, dass jede historische Linie aktuell fährt.

Direkter Watch-Push ist im nativen Code vorbereitet: ausdrücklicher Opt-in, Android-Freigabe, Favoriten/alle Linien, Nachtruhe, Aufzüge, Test/Abmeldung und begrenztes lokales Hinweisarchiv. FCM plus Firebase Installations nur nach Opt-in; keine Analytics/Auth/Firestore/Hosting/Functions. Kein Hintergrund-GPS oder Abfahrts-Polling. Google verarbeitet Zustellkennung und Nachrichtentext, unser bestehender Dienst verschlüsselte Minimalfilter. Firebase-Projekt/Serverfreigabe und physische Zustellung sind noch nicht verbunden/geprüft. PWA verwendet weiterhin standardmäßigen Web Push. PUSH_SCHEDULER_ENABLED=false bleibt bis zum nachgewiesenen Hintergrundbetrieb erhalten; ein begrenztes Site-Werkzeug prüft während der Einrichtung ausschließlich die offizielle Quelle. [Betrieb und Konfiguration](../push-notifications.md).

Wear 0.3.0 / Code 7, Paket at.andrew.foamawien und ursprüngliches Zertifikat. Update: Mehr → App & Updates → Auf Update prüfen; nicht deinstallieren. 139 Node-, 77 native Android- und drei Python-Prüfungen; native Beispielrenderings. Browser bestätigt gemeinsame Karten und Bewegung ganzer Stationsgruppen; weiterer Vorschauzugriff durch interne URL-Policy blockiert, kein behaupteter kompletter mobiler Browser-Rundlauf. Physische Watch-/Push-Abnahme separat. ÖBB/S-Bahn-Datenquelle weiterhin offen.

## Historische Releases und ergänzende Dokumentation

## PWA 0.1.21 / Wear 0.2.5 · Verkehrsmittel und Karlsplatz · 08.11.2026

U-Bahn vor Tram vor Bus: nahe Stationskarten auf beiden Geräten nach dem besten eingeschalteten, belegten Verkehrsmittel, innerhalb derselben Gruppe nach Entfernung. Die PWA begrenzt die Liste erst nach dieser Sortierung und erhält die Priorität beim Neuzeichnen mit Gehentfernungen. Gespeicherte Favoriten behalten ihre manuelle Reihenfolge.

Watch: bisherige harte Vorschaugrenze von drei Linien/Richtungen in Nähe und ganzen Stationsfavoriten entfernt. Alle geladenen passenden Verbindungen erscheinen; U-Bahn-Gruppen stehen vor Tram und Bus, danach nächste Abfahrt. Der erste API-Batch priorisiert in Nähe bestätigte eingeschaltete U-Bahn-Bahnsteige; höchstens 24 RBL, 16 priorisierte plus acht rotierende bei Überlauf. Favoriten behalten die Stationspriorität, innerhalb einer Station werden höher priorisierte Bahnsteige zuerst abgefragt.

Aktive Verkehrsmittel erscheinen als lokale Vektorsymbole direkt im Hauptbild. In Nähe mit dem ersten Stationskopf und der geschätzten Gehzeit kombiniert, in Favoriten als kompakte Zeile. Tippen öffnet sofort Verkehrsmittel; Zurück, Wischen und System-Back kehren zur vorherigen Hauptansicht zurück. Alle ausgeschaltet: klarer Hinweis und weiterhin erreichbar. Volle 48-dp-Tippfläche, keine zusätzliche Hintergrundarbeit. Menüpfad Mehr → Standort & Nähe → Verkehrsmittel bleibt erhalten.

Wear 0.2.5 / Code 6, Paket und ursprünglicher Signaturschlüssel bleiben erhalten. Update über Mehr → App & Updates → Auf Update prüfen. Nicht deinstallieren. Native Abnahme mit synthetischen Karlsplatz-Testverbindungen; physische Uhr-/Live-Karlsplatz-Abnahme separat erforderlich. ÖBB/S-Bahn-Anbindung bleibt offen; Filter allein bedeutet keine Datenquelle.

Push für Telefon und eigenständige Watch ist weiterhin ein eigener offener Arbeitsstrang: PWA-Infrastruktur vorhanden, Aktivierung wegen fehlendem verlässlichem Server-Timer gesperrt. Native FCM-Konfiguration/Anbindung noch offen. Firebase-Verbindung zur weiteren Einrichtung angeboten; keine aktive Watch-Push-Zustellung behaupten.

# PWA 0.1.18 / Wear 0.2.4 · QR-Favoritenübertragung · 08.11.2026

Mehr → Favoriten → Mit Handy übertragen auf der Uhr. Vom Handy empfangen oder Ans Handy senden wählen und QR-Code mit der Handy-Kamera scannen. Die eigenständige Übertragungsseite nimmt lokale PWA-Favoriten oder einen JSON-Export an. Auf der Uhr Vorschau prüfen und ausdrücklich übernehmen; auf dem Handy PWA-Import oder JSON-Download wählen. Bestehende Favoriten bleiben erhalten, Duplikate werden übersprungen. Beide Geräte bleiben unabhängig, keine dauerhafte Synchronisierung.

Aktuell: PWA 0.1.17, Wear 0.2.3 unverändert; nur PWA-Warnbereich und Hinweistexte geändert, kein nativer Neubuild.

Aktuell: PWA 0.1.16 / Wear 0.2.3 / Code 4. 54 native Tests mit ursprünglichem Key, kompakter horizontaler Hauptschalter. Keine neuen Abhängigkeiten. [Release](../wear-os-release-0.2.3.md).

Aktuell: PWA 0.1.14, Wear 0.2.2 / Code 3. 54 native Tests mit ursprünglichem Key. Ergänzte reine Java-Klassen für NavigationIcon und RequestScope; eigene Theme-Ressource für gemeinsamen Back-Pfad. Kein zusätzlicher AndroidX-/Play-Services-/Gradle-Zwang. [Release](../wear-os-release-0.2.2.md).

Aktuell: Wear 0.2.1 / Code 2, ursprünglicher Release-Key, 39 native Tests. [Release](../wear-os-release-0.2.1.md). Die folgenden Angaben zum ersten 0.2.0-Build bleiben historisch erhalten.

# foama-wien – nativer Wear-Build

Stand 07.11.2026, PWA v0.1.12. **Native Test-APK 0.2.0 / Code 1 gebaut und signiert.** Siehe [Release/Prüfgrenzen](../wear-os-release-0.2.0.md).

## Festgelegt

- Bestehende Quellen unter wear/app/src/main/java/at/foama/wien weiterentwickeln. Application-ID **at.andrew.foamawien**, Quellnamespace at.foama.wien; erste native Version laut wear/build-config.json **0.2.0 / Code 1**, minSdk 30, compile/target 34.
- Java + Python + Android-SDK-CLI, keine notwendige Installation auf dem Nutzer-PC, kein Gradle-/GitHub-Zwang. Vorhandene scripts/bootstrap_android.py und scripts/build.py erhalten und testen.
- Google Build Tools 34.0.0 und Android-34-Plattform anhand der offiziellen Repository-Prüfsumme geladen. ZXing 3.5.3: SHA-256 in android-dependencies.json festgeschrieben. Die Java-17-Laufzeit stellt jdk.compiler bereit; der Builder nutzt bei fehlender javac-Startdatei java -m jdk.compiler/com.sun.tools.javac.Main.
- Build-Kit unter .local ignoriert und privat, niemals in öffentliche Assets oder Quellarchive. Bootstrap-Verfahren aus dem öffentlichen Squash-Tap-Builder übernommen, keine fremden Schlüssel/Paketidentität übernommen.

## Abgearbeiteter Implementierungsplan

1. UI nach docs/wear-os-design-v0.1.md: Nähe und Favoriten, große Verbindungsdetails, Nebenaktionen unter Mehr. Touchziele mindestens 48 dp, Runddisplay und Systemschrift beachten.
2. Vorhandene Datenlogik auf sichere aktuelle Standorte, keine falsche Gehampel bei Tunnel/Fahrt/alten Fixes, 30-s-/24-RBL-Fair-Use und begrenzte echte Datenhaltung bringen. Keine Hintergrundortung oder Hintergrundabfragen.
3. Lokale Watch-Favoriten unabhängig vom Telefon; optionalen zehnminütigen E2E-QR-Transfer getrennt prüfen. Aktueller Hosting-Relay dafür noch nicht konfiguriert, nicht als funktionsfähig versprechen.
4. Java-Core-/Android-UI-Tests und nativen CLI-Build ausführen, neuen ausschließlich foama-wien zugehörigen Signierschlüssel geschützt und dauerhaft für spätere Updates sichern.
5. aapt-Metadaten, zipalign und apksigner verify prüfen. Erst dann echte APK, SHA-256 und Update-Feed auf der bestehenden HTTPS-Site veröffentlichen.
6. Telefonbasierte Installation und tatsächliche OnePlus-Watch-Abnahme getrennt von automatisierten Prüfungen dokumentieren. Keine Emulator-/Geräteprüfung erfinden.

## Bereits bestätigt

PWA öffentlich und installierbar; offizielle Wiener-Linien-Stopdaten und reale Abfahrten vorhanden. ÖBB-GTFS-Sollfahrplan ist weiterhin nicht mitgeliefert. Interaktiver Wear-Entwurf ist eine Beispieldaten-Vorschau, kein APK.

Referenz: https://squash-tap-andrew.endruuu.chatgpt.site/SquashTap-source.zip. Nur öffentliche Build-/Testmethoden verwenden; keine Squash-Tap-Signierdaten oder personenbezogenen Inhalte übernehmen.

## Build 0.2.0 bestätigt

26 JUnit/Robolectric-Prüfungen vor Signatur, Android-34-Ressourcen/AAPT2, Java-8-Bytecode per vorhandenem JDK-Modul, D8, zipalign und apksigner. Nativer UI-Tester nach öffentlichem Squash-Tap-Verfahren angepasst, mit eigener Identität und eigenen Tests. Keine Squash-App-Daten oder Schlüssel übernommen. Maven/JUnit/Robolectric nur in .local. Native Bilder sind automatisierte Renderings, keine physischen Watch-Screenshots.

Public release-signing.json enthält nur Zertifikat-Fingerprint; neuer Schlüssel bei bestehender Identität verboten. Privates Backup separat gesichert. publish_wear_update.py erhält PWA-Metadaten; package_source.py arbeitet mit öffentlichen Quellverzeichnissen und schließt Schlüssel/SDK/APK aus.

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

## Wear 0.6.1 / Code 21 · Favoritenansichten und QR-Rückkehr · 09.11.2026

Im Favoriten-Tab trennt ein direkt sichtbarer Umschalter **Routen** und **Stationen**. Die Stationsansicht trägt die Überschrift **Haltestellen & Linien**. Die ausdrücklich gewählte Ansicht bleibt lokal über Aktualisierung, Detailnavigation und App-Neustart erhalten. Ohne bisherige Auswahl erscheinen bei vorhandenen Routen zuerst Routen, sonst Stationen; beide Bereiche bleiben auch leer erreichbar. Nur Stationen der gewählten Ansicht sind Monitorziele, laufende alte Anfragen werden beim Wechsel verworfen. Gemeinsame Abrufgrenzen, lokale Favoriten und Push-Auswahl bleiben erhalten.

Nach bewusst bestätigtem QR-Import und erfolgreichem Transferabschluss öffnet die Uhr direkt Favoriten: Routen bei mitübernommenen Routen, sonst Stationen. Der Transfer wird beendet, Schlüssel und Wachhalteflag werden freigegeben. Abbruch, Fehler und Ablauf bleiben im bisherigen Fehler-/Zurück-Pfad; bei fehlender Abschlussquittung bleibt die Übernahme gespeichert und die bestehende Wiederholung erreichbar. Dateiimport und Senden ans Handy behalten ihren bisherigen Rückweg. Originalpaket und Release-Key bleiben erhalten; PWA 0.6.1 korrigiert auf Nutzerwunsch die Routenbeschriftung zu **Alternativen nach …**; Alternativen und Planung selbst bleiben erhalten.

124 native Android-Tests und 244 Web-/Server-Prüfungen bestanden. Native Runddarstellung bei 227 dp und 192 dp (1,3-fache Schrift), Bereichswechsel, Erhalt nach Neustart/Detailnavigation, getrennte Monitorziele und gemeinsames Abrufbudget geprüft. QR-Übernahme nach expliziter Bestätigung führt zu den passenden Favoriten; Fehler, Wiederholungsabschluss, Schlüsselbereinigung und Pause/Fortsetzung geprüft. Originalpaket, Originalsignatur, zipalign, Version 0.6.1 / Code 21 verifiziert. APK: 3,735,980 Bytes; SHA-256 bbf73cd515ba01fbf6d709ed6b8f9f166de77984640f3dccffde1f6607e6ff59. Physische OnePlus-Abnahme bleibt separat.
