# Wear 0.8.3 / Code 30 · 12. November 2026

Das Launcher-Symbol der nativen Uhr verwendet jetzt dieselbe freigegebene lächelnde Bahnkontur wie die PWA. Normales und rundes Symbol werden vor jedem CLI-Build direkt aus dem gemeinsamen SVG-Master erzeugt. Paket und Signaturidentität bleiben erhalten. Einstellungen, Fahrzeuge im Anflug und Rückwege aus 0.8.2 bleiben enthalten.

Die PWA 0.11.27 verwendet inhaltsversionierte Installationssymbole und einen stabilen Manifestlink. Die aktuellen PNGs zeigten bereits die neue Grafik; die URL-Änderung erlaubt eine erneute Symbolprüfung durch den Browser. Größere Logoänderungen können eine separate Bestätigung im Chrome-App-Menü benötigen. [Marken-/Buildvertrag und Browserquelle](branding.md).

Physisch offen: Uhr-Update auf der OnePlus Watch 2R, Launcher-/App-Liste und die angebotene Logoaktualisierung der installierten Smartphone-PWA. Kein Löschen der Favoriten oder Wechsel der App-Identität nötig.

## Verifikation

183 native Android-/Robolectric-Tests, 498 Web-/Server-Tests, 19 Python-Prüfungen und 93 JavaScript-Syntaxprüfungen bestanden. Manifest-ID, Start und Scope unverändert; alle neuen Installationssymbole sind bytegleich mit den gerenderten Master-Aliasdateien und in der Offline-Shell enthalten. Normale und runde native Ressource sind an dieselbe Vektorgrafik gebunden.

| Merkmal | Ergebnis |
| --- | --- |
| Paket | at.andrew.foamawien |
| Version / Code | 0.8.3 / 30 |
| Größe | 5217738 Bytes |
| SHA-256 | c6ebbc9e6315dc7034dddab274c57ac16ac6aa4c3eadae15c7773674c0f6cff0 |
| Originalzertifikat SHA-256 | d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1 |

Originalsignatur, Paket-/Version-/SDK-Metadaten und zipalign geprüft. Unveränderlicher Dateiname foama-wien-wear-0.8.3.apk; PWA-Begleitstand 0.11.27.

Zusätzliche native Bildprüfung der tatsächlich gepackten Icon-Ressource: quadratische und runde 512-Pixel-Darstellung mit Androids Vektorrenderer erzeugt. Mittlere Kanalabweichung zur PWA-Masterrasterung 0,519 von 255; Augen, Lächeln, Kontur und Gleis visuell geprüft.
