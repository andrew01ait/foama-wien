# Diagnose-PWA auf Android testen

1. [https://foama-wien.endruuu.chatgpt.site/diagnose.html](https://foama-wien.endruuu.chatgpt.site/diagnose.html) in Chrome auf Android öffnen. Kein Backend nötig für den direkten Diagnosemodus.
2. Auf dem Smartphone die Website im Browser öffnen, bei Bedarf die PWA installieren.
3. Im Menü „Einstellungen“ → „API-Diagnose öffnen“, alternativ `/diagnose.html`.
4. „PWA-Hosting testen“ prüft die eigene statische Website ohne externe ÖPNV-Anfrage.
5. „Live-Monitor direkt testen“ prüft `https://www.wienerlinien.at/ogd_realtime/monitor?stopId=4111` vom **Handy-Browser**. Test-ID ist änderbar.
6. „Haltestellen-CSV testen“ prüft den offiziellen CSV-Download (separater Aufruf, mindestens 30 Sekunden nach dem Monitor-Test).
7. Die Testseite zeigt HTTP-Status, Content-Type, Laufzeit und Zahl der empfangenen Abfahrten. Ein TypeError ohne Status kann sowohl auf CORS als auch WAF oder Netzwerkprobleme hinweisen.
8. „Diagnose als JSON speichern“ und die Datei im Chat teilen. Optional kann die letzte öffentliche API-Antwort mit maximal 30 KB beigefügt werden. Keine Datenübertragung ohne aktives Exportieren.

## Datenschutz / Rate Limit

- Kein Zugriff auf Browser-Geolocation in diesem Modus. Keine GPS-Koordinaten, Favoriten, QR-Schlüssel oder Session-Tokens in Protokollen.
- Höchstens eine API-Testanfrage pro 30 Sekunden in dieser Diagnoseansicht, keine automatische Wiederholung. Bei normalen App-Abfragen in anderen Tabs trotzdem nur mit Bedacht manuell testen.
- Protokolle liegen lokal im Browser (bis 30 Ereignisse), Export optional. Löschen-Button entfernt diese Protokolle.
- Die öffentlich sichtbare Site-URL wird nicht automatisch im Diagnosebericht gespeichert.

## v0.1.2: nach dem gemeldeten Direkt-Netzwerkfehler

„Monitor über foama-wien testen“ verwenden; API-Relay ist auf die eigene Site voreingestellt. Zwischen Direkt-/Relay-/CSV-Tests 30 Sekunden Abstand. Bei Erfolg echte Monitore/Linien/Abfahrten prüfen; bei Fehler wird der konkrete Serverhinweis mit exportiert. GPS wird auf der Hauptseite über „Standort aktivieren“ separat angefragt. Die Diagnose fragt keine Position an.
