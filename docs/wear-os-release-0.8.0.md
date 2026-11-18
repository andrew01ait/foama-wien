# Wear 0.8.0 / Code 27 · 12. November 2026

Abfahrten und Favoriten bleiben die Hauptaufgabe. Neue Funktionen: adaptive gestapelte Verbindungszeilen, Rückkehr an die Leseposition, native Stationskarte und Wiener Linienverläufe, Fahrzeuge im Anflug mit derselben Zwei-Quellen-Schätzung wie in der PWA, fokussierte Routenschritte und ein Tile mit zwei direkten Einstiegen. [Bedienung und Architektur](wear-experience.md).

## Tatsächliche Prüfung

- 168 native Android-/Robolectric-Tests im signierten CLI-Build erfolgreich.
- 476 Web-/Server-Tests und 18 Python-Prüfungen erfolgreich; abschließende Release-Feed-/Seitenprüfung vor Veröffentlichung.
- Runde Layouts 192, 204, 225 und 240 dp, Systemschrift bis 1,5-fach; native Bildrenderings visuell geprüft. Kleine Displays zeigen erste Abfahrtsminuten ohne seitliche Schriftstauchung; Gehzeit steht in der kompakten Zeile unter der Richtung.
- Öffnen/Zurück und Routineupdates erhalten Lesepositionen; neue Details beginnen oben. QR-/Import-, Updater-, Sichtbarkeits-/Display-aus- und Stadtprofilprüfungen bleiben enthalten.
- Fahrzeug-Endpunkt gegen echte aufgezeichnete U6-Quellen geprüft: unmittelbare Zielprognose, keine Marker beim ersten/wiederholten Quellenstand, Bestätigung erst aus neuem Quellenstand, höchstens zwei Marker, höchstens acht Monitorziele, Backoff, Ablauf und keine Ersatzrichtung.
- Map-Geometrie/Projektion, lokale Linienansicht, Karteneinstieg und Tile-Verknüpfungen geprüft. Kein vorgetäuschter physischer Uhr-/GPS-/Tile-Empfangstest.

## Signierte APK

| Merkmal | Ergebnis |
| --- | --- |
| Paket | `at.andrew.foamawien` |
| Version / Code | 0.8.0 / 27 |
| SDK | min 30, target 34 |
| Dateigröße | 5213642 Bytes |
| SHA-256 | `3b814dfed160470a470733ce795f7ead082ecaf0abb908d4304de4d0ac1fb1ba` |
| Originalzertifikat SHA-256 | `d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1` |

`apksigner verify`, Zertifikatsvergleich, Paket-/Version-/SDK-Prüfung und zipalign erfolgreich. Eigener unveränderlicher Dateiname `foama-wien-wear-0.8.0.apk`; frühere Releases bleiben erhalten. PWA-Begleitstand 0.11.20, neuer Offline-Cache; keine Favoriten-/QR-/Push-Schlüsseländerung oder Datenbankmigration.

## Physisch offen

Update auf der OnePlus Watch 2R ohne Deinstallation, App-/Systemschrift, Karte mit echtem GPS und OSM, Drehkrone/Pinch, Tile zur Uhr hinzufügen, echte Prognosen unterwegs und Anzeige-aus-/Wiederöffnen-Verhalten. Ein APK-/Unit-Test ist keine physische Geräteabnahme.
