# Konfiguration

Die bestehende öffentliche App verwendet die in `.openai/hosting.json` gespeicherte Projektzuordnung. Für einen unabhängigen Betrieb eine eigene Site, eigene Speicher und eigene Secrets verwenden. Die Datei enthält keine Zugangsdaten.

## Server und Speicher

| Name/Pfad | Zweck |
| --- | --- |
| `.openai/hosting.json` | Site-Zuordnung und deklarierte Bindings; Worker-Build ohne `static` |
| `DB` | D1 für QR-Sitzungen, verschlüsselte Push-Freigaben, Abrufbudgets und öffentliche Linienbestätigungen |
| `BUCKET` | R2 für bekannte öffentliche signierte APKs |
| `db/schema.ts`, `drizzle/` | Schema und append-only Migrationen; vorhandene Migrationen nicht umschreiben |
| `pwa/config.json` | Öffentliche PWA-Version und API-Konfiguration; regulär gleicher Ursprung |
| `wear/build-config.json` | Native App-Kennung, SDKs, Version und Neuerungspunkte |
| `pwa/update.json` | Update-Metadaten, APK-Größe und SHA-256 |
| `site/native-releases.json` | Append-only Allowlist unveränderlicher öffentlicher APKs |

Der Sites-Adapter stellt öffentliche Stationskataloge auch für serverseitige Filter bereit. Ein eigenes Worker-Deployment muss diese Adapter-/Asset-Konfiguration beibehalten; eine reine statische HTML-Auslieferung ersetzt die Serverrouten nicht.

## Optionaler PWA-Push

| Variable | Inhalt und Behandlung |
| --- | --- |
| `PUSH_VAPID_PUBLIC_KEY` | Öffentlicher VAPID-Schlüssel für Browserregistrierungen |
| `PUSH_VAPID_PRIVATE_JWK` | Privater VAPID-JWK; ausschließlich Hosting-Secret |
| `PUSH_VAPID_SUBJECT` | Gültiger VAPID-Kontakt, etwa die verantwortete Kontakt-URL oder Mailadresse |
| `PUSH_STORAGE_KEY` | Geheimer Base64url-Schlüssel für die verschlüsselte Ablage; bestehende Daten benötigen denselben Schlüssel |
| `PUSH_SCHEDULER_ENABLED` | Erst nach tatsächlich eingerichteter Hintergrundprüfung auf `true` setzen |
| `PUSH_INTERVAL_MINUTES` | Tatsächlichen Hintergrundtakt angeben; aktuelle öffentliche Einrichtung: `60` |

VAPID- und Speicherschlüssel einer laufenden Installation nicht beiläufig ersetzen. Die PWA nutzt Web Push und benötigt keinen Firebase-Client. Aktivierung und Benachrichtigungsfreigabe erfolgen bewusst am Gerät. Mindestens 30 Minuten Abstand, höchstens sechs Hinweise pro Wiener Kalendertag, optionale Nachtruhe 22–7 Uhr. Aufzüge/Fahrtreppen sind standardmäßig aus; geplante Hinweise frühestens ab Beginn. Siehe [Push-Dokumentation](push-notifications.md).

## Optionaler direkter Uhr-Push

`FIREBASE_PROJECT_ID`, `FIREBASE_ANDROID_APP_ID`, `FIREBASE_API_KEY` und `FIREBASE_SENDER_ID` müssen dieselbe Firebase-Android-App für `at.andrew.foamawien` beschreiben. `FCM_SERVICE_ACCOUNT_JSON` ist ausschließlich ein serverseitiges Secret mit passendem Projekt und Messaging-Berechtigung. Es gehört weder in APK noch Repository. Verwendet wird Firebase Cloud Messaging; keine Firebase-Datenbank, Firebase-Authentifizierung oder Analytics sind dafür vorgesehen.

Die öffentliche Uhr-Zustellung ist bis zu dieser Einrichtung gesperrt. Auf dem Telefon freigegebene PWA-Benachrichtigungen können unabhängig davon über die Uhr-Begleit-App gespiegelt werden; das ist eine Systemeinstellung und kein eigenständiger Watch-Push.

## Native Build-Konfiguration

`FOAMA_BASE_URL` bzw. `--base-url` muss eine echte HTTPS-App-Adresse sein. Zum Signieren werden `FOAMA_STORE_PASSWORD` und `FOAMA_KEY_PASSWORD` als Umgebungsvariablen sowie der private Original-Keystore benötigt. Passwörter nicht in Befehlsargumente, Logs, GitHub-Dateien oder APKs schreiben. `wear/release-signing.json` enthält ausschließlich die öffentliche Signaturidentität. [Build-Ablauf](squashtap-build-adaptation.md).
