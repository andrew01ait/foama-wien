## 0.6.0 · Störungsbenachrichtigungen · 09.11.2026

Der bisher pausierte Stundenauftrag wurde auf die verbundene foama-wien-App umgestellt. Unbeaufsichtigter Lauf b6807536-f000-8322-bf47-cffd16b20df6, geplant 11:07:54, gestartet 11:08:09, abgeschlossen 11:08:51 Europe/Vienna, recorded_status=completed. Der Server hat den Quellenabruf mit neuer lastCheck/lastSuccess und setup-source-only quittiert. Damit ist der vorherige Scheduler-Blocker für den Stundenbetrieb behoben. Runtime-Revision 4 setzt PUSH_SCHEDULER_ENABLED=true und PUSH_INTERVAL_MINUTES=60; Anwendung mit diesem Release. Vorhandene VAPID-/Speicherschlüssel unverändert. Plattform maximal stündlich; zusätzliche Prüfungen etwa alle fünf Minuten nur im Rahmen ohnehin erfolgender aktiver Monitoraufrufe. Der vorbereitete externe Fünf-Minuten-Timer ist weiterhin nicht gestartet. Kein sofortiger Echtzeitversand oder Fünf-Minuten-Hintergrundtakt behaupten.

Meine Favoriten umfasst nun Haltestellen, Linien sowie gespeicherte A-nach-B-Wege einschließlich Alternativen. Bekannte Ein-, Umstiegs- und Ausstiegsstationen werden lokal zu minimalen Stop-/Linienfiltern zusammengeführt, maximal 100 Stationen. Keine Adressen, eigenen Routennamen oder GPS-Koordinaten werden übertragen. PWA synchronisiert geänderte Routen nach sichtbarer Rückkehr sofort; Uhr bei Import/Entfernen und sichtbarer Fortsetzung. Bestehende Zustellgrenzen, Deduplizierung, Quellen-/Gültigkeitsprüfung, Gerätefreigaben, verschlüsselte Datenhaltung und Opt-out erhalten. Geplantes nicht vor Beginn; Aufzüge/Fahrtreppen weiterhin optional aus.

PWA: Aktivierung/Test nach bewusster Browserfreigabe, sichtbare ehrliche Dienstfrequenz und letzte Prüfung. Direkte Uhr-Zustellung bleibt bis zur Firebase-Einrichtung gesperrt: Firebase-Plugin angeboten, noch nicht bestätigt verbunden; keine FIREBASE_*/FCM_SERVICE_ACCOUNT_JSON im Hosting vorhanden. Die PWA benötigt keinen Firebase-Client. Telefon-Spiegelung ist eine getrennte Systemeinstellung. Keine physische Zustellung aus Unit-Tests oder einem erfolgreichen Quellenabruf ableiten.

# Störungsbenachrichtigungen · PWA 0.1.23 / Wear 0.3.1

## Bedienung

Mehr → Einstellungen → Störungsbenachrichtigungen. Standard Meine Favoriten; alternativ Alle Linien. Aufzüge/Fahrtreppen und Nachtruhe 22–07 Uhr optional. Aktivieren löst erst auf Nutzerklick die Browserfreigabe aus; es gibt keinen Start-Prompt. Testnachricht prüft die Annahme durch den Pushanbieter, tatsächliche Anzeige am Gerät gesondert kontrollieren. Deaktivieren meldet zuerst das Browser-Abonnement ab und entfernt danach die Gerätefreigabe im Dienst. Offline wird eine ausstehende Dienstabmeldung beim nächsten sichtbaren Online-Öffnen nachgeholt.

Der PWA-Benachrichtigungsklick öffnet alerts.html mit offiziellen Betriebsinfos. Die native Uhr hat einen eigenen Empfänger und öffnet nur ihr begrenztes lokales Hinweisarchiv. Keine zusätzlichen Positions-/Abfahrtsanfragen im Hintergrund. Telefon-Spiegelung ist eine getrennte Betriebssystemoption; direkter Watch-Push braucht keine laufende Telefon-PWA. Native Einrichtung ist noch unvollständig, keine reale Zustellung bestätigt.

## Auswahl und Begrenzung

Server prüft den festen offiziellen trafficInfoList-Feed. Normale PWA-Abfahrten/GPS bleiben sichtbar-only. Ganze Stationsfavoriten wählen deren bekannte Linien; Verbindungsfavoriten ihre Linie. Ein stationsgebundener Kurz-/Aufzug-/Fahrtreppenhinweis erfordert den tatsächlichen RBL-Bezug, kein bloßer gleicher Linienname. Nur bereits begonnene, noch gültige Störungen. Geplante Meldungen werden erst ab ihrem tatsächlichen Beginn berücksichtigt; Aufzüge/Fahrtreppen nur bei gesonderter ausdrücklicher Auswahl. Keine Benachrichtigung aus fehlgeschlagenem oder veraltetem Abruf; keine automatische Entwarnung.

Semantische Fingerprints berücksichtigen Kategorie, Linien/Haltepunkte, Text und Gültigkeitszeit; wechselnde Abrufzeiten oder Lieferanten-IDs allein erzeugen keine neue Benachrichtigung. Neue Inhalte werden zu einem Hinweis gebündelt. Mindestens 30 Minuten Abstand, maximal sechs automatische Hinweise pro Wiener Kalendertag. Testnachricht separat maximal einmal pro Minute. Nachtruhe optional, Europe/Vienna einschließlich Sommerzeit. Bei HTTP 404/410 des Pushdiensts werden Freigabe und Verlauf gelöscht; 429 setzt längere Pause.

## Architektur und Datenschutz

Standards: RFC 8291 aes128gcm (ECDH P-256, HKDF-SHA-256, AES-GCM, eigener zufälliger Schlüssel/Salt pro Nachricht), RFC 8292 VAPID ES256. Sender folgt keinen Redirects und erlaubt nur bekannte HTTPS-Pushdienste von Google, Mozilla, Apple und Microsoft. TTL fünf Minuten. Browser zeigt eine echte Systembenachrichtigung über den vorhandenen Service Worker; wiederholte Hinweise verwenden einen gemeinsamen Tag ohne erneutes Klingeln.

D1 speichert eine zufällige Geräte-ID, Hash der lokalen Verwaltungsfreigabe, Endpoint-Hash, Ablauf und Zählwerte. Push-Adresse, Pushschlüssel und minimale Favoritenfilter liegen als AES-256-GCM-Datensatz mit Geräte-ID als Additional Data vor. Privater VAPID- und Speicherschlüssel nur als Hosting-Secrets. Keine Koordinaten, GPS-Verläufe, Favoritennamen, externen URLs oder Push-Secrets im Debug-Export. Bestehende Favoriten/QR-Exporte bleiben unverändert lokal; die optionale Push-Auswahl wird beim Aktivieren klar erläutert.

Freigabe spätestens nach 90 Tagen ohne sichtbare Erneuerung abgelaufen. Bereinigung durch Dispatcher/API-Aufrufe; keine sekundengenaue physische Löschung bei vollständigem Dienstausfall behaupten. Versandverlauf maximal 256 Fingerprints pro Gerät und 90 Tage. Maximal 256 Geräte, höchstens 32 Geräte je Prüflauf; Rotation und Laufzeitgrenze. Anbieterzustellung und Zeitpunkt können durch Browser/OS verzögert werden.

## Unbeaufsichtigter Betrieb

Der erste geplante Hintergrundlauf der Plattform ist am 08.11.2026 fehlgeschlagen (Beginn 12:52:06, Ende 12:52:10 Europe/Vienna); kein konkreter Fehlergrund im Aufgabenprotokoll. Der stündliche Auftrag wurde daraufhin pausiert. Zuvor hatte die Plattform bereits einen Fünf-Minuten-Zeitplan wegen maximal eines Laufs pro Stunde abgelehnt. Es wurden keine versetzten Parallelaufträge als Umgehung erstellt. PUSH_SCHEDULER_ENABLED=false hält die Push-Aktivierung gesperrt; vorhandene Geräte lassen sich weiterhin abmelden. Regelmäßige automatische Zustellung ist daher noch nicht als betriebsbereit bestätigt.

Für einen separaten Server ist deploy/push-timer vorbereitet: Docker-Container ohne eingehenden Port, fünf Minuten Intervall, ausschließlich leeres POST-Objekt an /api/push/check, Healthcheck und begrenzte Logs. **Noch kein Hostinger-Zugriff und kein Containerstart.** Nach Freigabe/Verbindung des Servers echten Timer starten, Hosting-Flag und PUSH_INTERVAL_MINUTES=5 setzen, Site erneut deployen und tatsächliche Hintergrundaufrufe/physische Testnachricht prüfen. Die normale öffentliche Site bleibt erhalten; keine neue Domain nötig.

Der leere öffentliche Tick kann ausschließlich die feste offizielle Quelle prüfen: keine Empfänger, Auswahl oder Nachrichten als Eingabe. Registrierung/Test/Änderung/Abmeldung benötigen weiterhin die zufällige Gerätefreigabe. Globaler atomarer Lease, Mindestabstand, Quellenvalidierung, Opt-in, Relevanz und Versandgrenzen gelten unabhängig vom Aufrufer. Antworten enthalten keine Empfänger-/Geräteinformationen oder Versandzahlen. Keine Geheimnisse im Timer.

Wenn der Dienst später freigeschaltet ist, ergänzen ohnehin erfolgende sichtbare Monitoraufrufe serverseitig eine Prüfung etwa alle fünf Minuten; keine neuen Telefon-Timer oder GPS-/Monitoranfragen dafür. Ein nur vorhandener scheduled-Handler richtet bei Sites keinen nativen Cron-Trigger ein. Bei Quellenfehlern kein Ausweichen auf fremde Proxys, kein Versand alter Daten und keine Entwarnung.

## Schlüssel und Build

PUSH_VAPID_PRIVATE_JWK, PUSH_STORAGE_KEY sind Secrets; PUSH_VAPID_PUBLIC_KEY und PUSH_VAPID_SUBJECT sind öffentlich verwendbare Konfiguration. Keys nicht beim normalen Update neu erzeugen. Schemaänderung in db/schema.ts und neuer unveränderlicher Drizzle-Migration, bestehende Transfermigration unverändert. Build bündelt vorhandene ESM-Module mit fest gepinntem esbuild 0.25.12; keine zusätzlichen Runtime-Abhängigkeiten. Wear 0.3.0 / Code 7 mit Originalsignatur; QR-Funktion und gemeinsame Geräte-API bleiben erhalten. Keine D1-Migration für den zweiten Transport nötig, Typ und Token liegen im bestehenden verschlüsselten Datensatz.

## Quellen

- https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf (V1.6, 19.10.2026)
- https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe
- https://datatracker.ietf.org/doc/html/rfc8291
- https://datatracker.ietf.org/doc/html/rfc8292

## Abnahme

139 Node-Tests einschließlich unabhängiger RFC-8291-Testvektor, Entschlüsselung mit Node-crypto, VAPID-Signaturprüfung, feste Providerziele/Redirectverweigerung, verschlüsselter D1-Speicherung, Freigabentrennung, Relevanz, Wiener Tages-/Nachtruhegrenzen, Deduplizierung/Intervall, Providerablauf, Quellenfehler, Datenbereinigung, begrenztem öffentlichen Scheduler-Tick ohne frei wählbare Empfänger/Inhalte, OS-Notification-Handler und Opt-in/Abmeldung. Produktiver leerer POST-Prüflauf am 08.11.2026: HTTP 200, state=ok und gesetzter lastSuccess. Der aktuelle offizielle Feed wurde aus der Quelle abgerufen und mit 38 normalisierten Meldungen geparst. Cloud-Browser zeigt die korrekte Blockiert-Meldung für seine dort gesperrte Notification-Berechtigung; deshalb kein behaupteter physischer Push-Zustellnachweis. Kein physischer Android-Zustellnachweis aus diesen Tests ableiten.

Zusätzliche produktive Geräte-API-Prüfung mit einer ausdrücklich synthetischen, nicht zustellbaren Testadresse: Anlegen, authentifiziert lesen/ändern, fremdes Geheimnis ablehnen, abmelden und danach HTTP 410. Testfreigabe über dieselbe öffentliche Geräte-API gelöscht. Kein echter Empfänger/GPS verwendet. Drei Python-Vertragsprüfungen des vorbereiteten Timers; Docker steht in dieser Umgebung nicht bereit, kein Containerbuild oder Serverstart behauptet.

## Native Uhr: Firebase-Dienste und ausstehende Konfiguration

Mehr → Störungsmeldungen enthält Meine Favoriten / Alle Linien, Aufzüge & Fahrtreppen, Nachtruhe, Aktivieren, Test, Deaktivieren und Letzte Hinweise. Aktivieren bleibt ohne konfigurierte Server-/Firebase-Bereitschaft gesperrt. Erst ausdrücklicher Tap mit OS-Freigabe initialisiert Firebase Messaging 26.0.1. Der Standard-InitProvider wird beim CLI-Build entfernt; kalter Start erstellt keine Firebase-App. Messaging-Auto-Init, Analytics, Datensammlung, BigQuery-Metriken und Notification-Delegation sind initial aus. Kein Firebase Auth, Firestore, Realtime Database, Hosting, Functions, Analytics oder Crashlytics. Die PWA nutzt keinen Firebase-Client, sondern Web Push/VAPID; der Browser kann selbst einen Google-Pushprovider verwenden.

Firebase Cloud Messaging liefert die optionale Nachricht an die Uhr; Firebase Installations erzeugt die dafür notwendige technische Installationskennung. Google bekommt Zustellkennung und Nachrichtentext, keine GPS-Koordinaten oder vollständigen Favoritenexporte. Unser bestehender Worker/D1 verarbeitet offizielle Störungen und verschlüsselte minimale Filter (bekannte Stop-/Linienkennungen). Favoritennamen/Richtungen bleiben lokal. Die Services verursachen für Messaging keine Firebase-Nutzungsgebühr; eigene Hosting-/D1-Limits gelten weiter. Provider-Löschung und Aufbewahrung nicht als sofortige physische Löschung bei Google behaupten.

Öffentliche Runtime-Konfiguration: FIREBASE_PROJECT_ID, FIREBASE_ANDROID_APP_ID (für Paket at.andrew.foamawien), FIREBASE_API_KEY, FIREBASE_SENDER_ID. Secret: FCM_SERVICE_ACCOUNT_JSON aus demselben Projekt mit passender Messaging-Sendeberechtigung. Niemals Secret in Chat, APK, Git, Zeitplan oder Debug-Ausgabe schreiben. Projekt und Sender-/App-ID werden gemeinsam geprüft. Fester Google-OAuth-Endpunkt und FCM-HTTP-v1-Sendepfad; RS256-JWT, feste Messaging-Scope, maximal eine Stunde Token, bounded HTTPS ohne Redirects. Privater Schlüssel bleibt im Hosting-Secret. Diese Konfiguration ist aktuell nicht vorhanden; Firebase-Verbindung wurde angeboten, noch nicht verbunden.

Native IDs/192-Bit-Verwaltungsgeheimnis in privaten, nicht exportierten Push-Prefs. Vorhandene FCM-Tokenrotation darf im Hintergrund nur eine aktive Gerätefreigabe aktualisieren (renew:false) und deren Ablauf nicht verlängern. HTTP 410 deaktiviert lokal statt automatisch neu anzumelden. Ohne sichtbare Erneuerung spätestens 90 Tage Ablauf. Deaktivieren stoppt Anzeige sofort, fordert Token-/Installationslöschung an und löscht die eigene Serverfreigabe; offline als ausstehend beim nächsten sichtbaren Öffnen.

FCM-Data-Payload wird nur nach lokaler Opt-in-/Permission-/Nachtruhe-/Ablaufprüfung angezeigt. Höchstens zehn gespeicherte Hinweise, maximal 24 Stunden alt; semantischer Hash statt unbeschränkt gespeicherter Message-ID; ein gemeinsamer Notification-Tag, OnlyAlertOnce, privat, lokal auf der Uhr (keine erneute Spiegelung), Timeout nach einer Stunde. Keine HTTP-/GPS-Anfrage beim Empfang oder Öffnen des lokalen Archivs. FCM-TTL fünf Minuten; nur payloads des eigenen Formats, höchstens zehn Minuten alt. 77 native Tests prüfen Grenzen, SDK-Registrare, OS-Anzeigeobjekt, Cold-Start-Opt-in und Navigation, ohne echten Google-/Geräte-Zustellnachweis.

## Site-Werkzeug als zusätzlicher Prüfpfad

POST /mcp (Sites-authentifiziert) bietet foama_push_status und foama_check_disruptions, jeweils ohne Argumente und ohne Geräteinformationen. Bei PUSH_SCHEDULER_ENABLED=false prüft der zweite Aufruf ausschließlich die feste offizielle Quelle und speichert setup-source-only/lastCheck/lastSuccess; er sendet keine Hinweise. Bei aktivem Dienst benutzt er denselben begrenzten Dispatcher und dieselben Limits wie der öffentliche Tick. Dies erlaubt einen stündlichen Plattformauftrag ohne Terminal-/Ausführungsumgebung. Der tatsächliche unbeaufsichtigte Lauf muss nach Veröffentlichung separat beobachtet und mit persistierter Prüfzeit bestätigt werden. Ein erfolgreicher interaktiver Aufruf allein genügt nicht. Bisheriger fehlgeschlagener Auftrag bleibt bis zu dieser Prüfung als Blocker dokumentiert. Keine versetzten Jobs als Frequenzumgehung.

Zusätzliche Primärquellen: https://firebase.google.com/docs/cloud-messaging/android/client · https://firebase.google.com/docs/projects/manage-installations · https://firebase.google.com/pricing · https://firebase.google.com/support/privacy · https://developer.android.com/build/kotlin-support
