# Wear 0.8.2 / Code 29 · 12. November 2026

Der bisherige Mehr-Zugang am Listenende heißt Einstellungen und zeigt ein Zahnrad. Menütitel und Bedienhinweise verwenden denselben Namen. Die bestehende Oberfläche erhält ihre Abstände und 48-dp-Tippflächen, ohne zusätzliche Kopfzeile über den Abfahrten. Rückwege, Favoriten, Abrufregeln und Fahrzeugoptimierungen aus 0.8.1 bleiben erhalten. Der Karten-Zentrierknopf bleibt ein Symbol.

[Bedienwege](wear-experience.md) · [Fahrzeugänderungen aus 0.8.1](wear-os-release-0.8.1.md).

Native Android-Prüfungen und Signatur-/Metadatenkontrollen gehören zum CLI-Release-Build. Die ursprüngliche Signaturidentität und Paketkennung bleiben verbindlich. Physische OnePlus-Abnahme bleibt separat: Update ohne Deinstallation, Einstellungen/Zurück, Schriftgrößen und echte Fahrzeugdaten.

## Verifikation

183 native Android-/Robolectric-Tests bestanden, einschließlich der umbenannten Menü-, Rückweg-, Update- und Importpfade. 496 Web-/Server-Tests, 18 Python-Prüfungen und 93 Syntaxprüfungen bestanden.

| Merkmal | Ergebnis |
| --- | --- |
| Paket | at.andrew.foamawien |
| Version / Code | 0.8.2 / 29 |
| Größe | 5217738 Bytes |
| SHA-256 | 00797d5fe36588291b45685f651250260fc5011314c219740fb3fc5f0f50d972 |
| Originalzertifikat SHA-256 | d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1 |

Originalsignatur, Paket-/Version-/SDK-Metadaten und zipalign geprüft. Unveränderlicher Dateiname foama-wien-wear-0.8.2.apk; PWA-Begleitstand 0.11.25.

Zusätzliche native Darstellungsprüfung auf einem runden 192-dp-Display: Einstellungslabel bei 100 % und 150 % Systemschrift vollständig einzeilig; gemessene Textbreite 144/216 px bei 244 px verfügbarem Textraum. Bestehende 48-dp-Tippfläche erhalten.
