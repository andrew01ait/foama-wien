# Wear 0.9.1 / Code 32 und PWA 0.11.29 · 12. November 2026

Die Uhr-Karte hat oben einen dauerhaft erreichbaren **Liste**-Knopf. Er öffnet den Stationskatalog des aktuellen Kartenausschnitts auch nach einer Stationswahl. Die bisherige Stationskarte unten öffnet weiter deren Abfahrten und Linienaktionen. Zurück aus der Karte bleibt über den benannten 48-dp-Pfeil sowie die Systemnavigation möglich.

**Linie 29B zeigen** und die anderen Linienaktionen beschränken die Stationspunkte auf die tatsächlich angezeigte Streckenvariante. Derselbe Filter gilt für Beschriftungen, Antippen und Stationsliste. Nähe-Verkehrsmittelfilter verstecken keine Stationen einer ausdrücklich geöffneten Linie. Die gewählte Station und der eigene aktuelle Standort bleiben erhalten. **Alle Stationen zeigen** in den Stationsaktionen entfernt die Linienebene und stellt den normalen Katalogfilter wieder her. Ein fehlender neuer Verlauf zerstört die bisherige gültige Linienansicht nicht. Kein neuer Monitor-/Fahrzeug-/Kachelabfragetakt.

Die Kartenortung verwendet bei fehlendem Internet dieselbe begrenzte Offline-GPS-Suche wie die Hauptansicht. Der Wiener Offline-Fahrplan aus 0.9.0 bleibt unverändert mit seiner festen Gültigkeit 09.11.–12.12.2026.

## Mobiler Update-Hinweis

PWA-Titel, installierte Version und Status haben getrennte Textzeilen. Auf Breiten bis 600 CSS-Pixel steht der mindestens 44 Pixel hohe Jetzt-aktualisieren-Button darunter; auf breiteren Ansichten bleibt er seitlich. Eine schrumpfbare Textspalte verhindert Überlauf. „Offline und Push aktualisieren“ ersetzt die lange technische Komponentenbezeichnung. Ein echter neuer App-Stand und ein bloß wartender Offline-/Push-Worker bleiben unterscheidbar. Updateaktivierung, expliziter Klick, Fehlerwiederholung und vorhandene Benutzerdaten unverändert.

## Prüfung und Grenzen

210 native Android-/Robolectric-Tests bestanden. Neue Tests führen wiederholte Stationslisten-Auswahl, echte 29B-Linienaktion, ausgeblendete fremde Stationen bei Zeichnen/Antippen/Liste, Rückkehr zur Übersicht, fehlende Geometrie und explizite Linien trotz deaktivierter Nähe-Modi aus. Kartenansichten bei 192 und 240 dp gerendert und visuell geprüft.

498 Web-/Server- und 22 Python-Tests bestanden. Bestehende Update-Tests sichern die getrennten Titel-/Versionsangaben und behalten Bestätigungs-/Aktivierungs-/Fehlerfälle bei. Die lokale Vorschau wurde vorbereitet, aber die Browser-Zugriffspolicy blockierte die Vorschauadresse. Responsive Browserdarstellung ist deshalb **nicht visuell abgenommen**. Physisches OnePlus-Update und tatsächliche Gesten-/Kartennutzung bleiben gesondert.

| Merkmal | Wert |
| --- | --- |
| Paket | at.andrew.foamawien |
| Version / Code | 0.9.1 / 32 |
| APK-Größe | 7.196.177 Bytes |
| APK SHA-256 | ec1a9223256a41cc00d3eeab4470c1343617afc93bef031bb188104ad4b4323c |
| Originalzertifikat SHA-256 | d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1 |

Originalsignatur, Paket-/Version-/SDK-Metadaten und zipalign geprüft. Keine neue Berechtigung oder Änderung bestehender Favoriten-/Einstellungsformate. Öffentlicher Download foama-wien-wear-0.9.1.apk; PWA-Begleitstand 0.11.29.
