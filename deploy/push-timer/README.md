# foama-wien Push-Timer

Vorbereitet für einen eigenen Docker-Host, **noch nicht auf Hostinger gestartet**. Keine eingehenden Ports und keine Nginx-Änderung. Nur ausgehendes HTTPS zur eigenen bestehenden App; keine API-Schlüssel oder Nutzerdaten im Container. Fünf Minuten Takt, Speicher-/CPU-/Loggrenzen in compose.yml.

Die normale ChatGPT-Site bleibt öffentlich und hostet die ganze App. Dieser Container ersetzt ausschließlich den fehlenden verlässlichen Hintergrund-Zeitgeber. Er akzeptiert keine individuellen Empfänger und liefert keine Benachrichtigungsinhalte; die Auswahl und Verschlüsselung erfolgen weiterhin im App-Dienst.

## Inbetriebnahme nach Serverfreigabe

1. Dieses Verzeichnis auf dem vorgesehenen Docker-Host ablegen. Ausgehendes HTTPS zur App muss funktionieren.
2. Im Verzeichnis `docker compose up -d --build` ausführen. Die offizielle Basis ist `python:3.12-alpine`.
3. Hosting-Konfiguration `PUSH_SCHEDULER_ENABLED=true` und `PUSH_INTERVAL_MINUTES=5` setzen; gespeicherte Site-Version erneut deployen. VAPID-/Speicherschlüssel erhalten.
4. `docker compose logs --tail=10` und `docker compose ps` prüfen. Ein `check-ok` erfordert eine echte erfolgreiche Quellenprüfung oder eine frische gültige Quittung. Zusätzlich `/api/push/config` mit lastSuccess lesen. Bei noch gesperrtem Hosting ist ein HTTP-503-/Unhealthy-Status erwartbar.
5. Erst danach Push in der PWA aktivieren und Testnachricht am tatsächlichen Gerät prüfen. Im Testbrowser sind Notifications blockiert; bisher keine physische Zustellung bestätigt.

Abschalten: `docker compose down`, danach in der Site `PUSH_SCHEDULER_ENABLED=false` setzen und erneut deployen. Ein deaktivierter Timer löscht keine lokalen Favoriten. Browserabmeldung entfernt die betreffende Gerätefreigabe weiterhin unabhängig davon.

## Prüfstand

Python-Vertragsprüfungen für echte leere POST-Nachricht, frische/alte Quittungen und Fehlerdaten. In dieser Arbeitsumgebung ist Docker nicht installiert; es wurde kein Containerbuild oder Hostinger-Start behauptet. Referenz für die offizielle Basis: https://hub.docker.com/_/python.
