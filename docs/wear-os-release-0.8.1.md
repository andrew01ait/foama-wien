# Wear 0.8.1 / Code 28 · 12. November 2026

Fahrzeuge im Anflug setzt vorhandene Daten beim Wiederöffnen und Stationswechsel fort. Kanonischer PWA-Tracker pro Linie/Richtung, vier passive Antworten im RAM der Uhr, unveränderte gemeinsame Abrufsperre und höchstens acht RBLs im gewählten Stationsbereich. Ein aktiver Abruf; Wechsel storniert vor Übernahme. Kompakter Ladebalken statt leerem Schema. Stationsboards behalten Quellenalter und erfolgreiche leere Bestätigungen. Der linke Kartenknopf bleibt auf Nutzerwunsch ein Symbol ohne sichtbares Standortlabel und bestätigt nun Suche, Zentrierung und Ortungsprobleme.

[Bedienwege und Grenzen](wear-experience.md).

## Tatsächliche Prüfung

- 496 Web-/Server-Tests und 18 Python-Prüfungen bestanden.
- 93 JavaScript-Syntaxprüfungen bestanden.
- 183 native Android-/Robolectric-Tests im signierten CLI-Build bestanden.
- Native Prüfungen: Wiederöffnen mit gleichen IDs/Quellen/Gate, getrennte Linien, keine leeren Schemata, Ablauf der Positionen, passiver begrenzter Cache, Anfragebeginn statt Antwortende, längere Serverpause, höchstens eine aktive Anfrage und verworfene alte Antwort. Zusätzlich Kartenfreigabe, deaktivierte Ortung, Erfolg ohne Bewegung, ungenauer Fix, Timeout/Retry und Display aus.
- Server: echte aufgezeichnete U6-Quellen, unveränderte Zwei-Quellen-Bestätigung, Stationswechsel mit gleichen IDs ohne Zusatzrequest, ein laufender Request für überlappende Stationen, Quellencacheablauf und 429-Fehlerpause.

## Physisch offen

Update auf der OnePlus Watch 2R ohne Deinstallation, echte Quellen unterwegs, Stations-/Verbindungswechsel, Karten-Zentrierung mit echtem GPS sowie Display-aus-/Wiederöffnen-Verhalten. Prüfungen mit Robolectric ersetzen diese Geräteabnahme nicht.

## Signierte APK

| Merkmal | Ergebnis |
| --- | --- |
| Paket | at.andrew.foamawien |
| Version / Code | 0.8.1 / 28 |
| SDK | min 30, target 34 |
| Größe | 5217738 Bytes |
| SHA-256 | eb2d70ab908c034b4c763e4e4bbae6921f572df9144c202eff6d37f67e9638a8 |
| Originalzertifikat SHA-256 | d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1 |

Originalsignatur, Paket-/Version-/SDK-Metadaten und zipalign geprüft. Neuer unveränderlicher Dateiname foama-wien-wear-0.8.1.apk; PWA-Begleitstand 0.11.24. Keine Datenbankmigration, neue Gerätekennung oder Favoriten-/QR-/Push-Schlüsseländerung.
