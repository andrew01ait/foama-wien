# foama-wien Wear OS 0.2.1 · Ortung und Gestaltung

07.11.2026. Aktualisierung der vorhandenen nativen App; PWA bleibt 0.1.13.
Veröffentlichungsziel: [Download und Installation](https://foama-wien.endruuu.chatgpt.site/wear.html).

## Verhalten

Kompakte Zeilen zeigen Linie, Richtung, Erreichbarkeit, Hauptzeit, Folgeabfahrt und Datenqualität. Stationsname und Gehschätzung stehen darüber. Detailfolge wie im Entwurf: Linie, Richtung, Station, große Minuten, nächste Alternative, Erreichbarkeit. Aktive Tabs sind gefüllt, Hauptaktionen mint, ausgewählte Werte gedeckt grün, Entfernen dezent rot, Zurück zurückhaltend. Android-Standardtint und Elevation werden ausdrücklich überschrieben. Kleine Runddisplays erhalten angepasste Ränder, Text berücksichtigt die Systemschrift.

Mehr enthält Standort & Nähe, Gehen & Reserve, Favoriten und App & Updates. Radius und Verkehrsmittel liegen unter Standort & Nähe; Zurück führt durch diese Hierarchie. Keine neue dauerhafte Aktionsleiste, keine zusätzlichen Hauptziele.

WatchLocation verwendet geeignete aktivierte Systemquellen. Verfügbares Plattform-fused wird bevorzugt, sonst network/GPS. Ein eingeschalteter, aber stummer network-Provider verhindert GPS nicht mehr. Alle geeigneten Caches werden durch Repo geprüft. Nach acht Sekunden ohne genauen frischen Fix werden weitere Quellen versucht. Nach 30 Sekunden endet erfolglose bzw. weiterhin ungenaue Erstortung mit konkretem Hinweis, Wiederholen und Einstellungen. Vorhandene grobe/ältere Fixes bleiben als unsicher nutzbar. Eine gute Quelle ersetzt die übrigen Listener/Einmalabrufe; verspätete verworfene Quellen werden ignoriert. Auf Pause werden Timer, Listener und CancellationSignals entfernt. Keine neue Hintergrundarbeit, keine Positionsspeicherung oder GPS-Übertragung an den Relay.

## Identität und geprüftes Paket

| Feld | Wert |
|---|---|
| Application ID | at.andrew.foamawien |
| Version / Code | 0.2.1 / 2 |
| APK | /apk/foama-wien-wear-0.2.1.apk |
| Bytes | 406171 |
| APK SHA-256 | fab1ae7707e5ba875bf31689d1ec50d2ca9f28ec5deca982446c026f41728ce2 |
| Zertifikat SHA-256 | d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1 |
| SDK min / target | 30 / 34 |

Ursprüngliches Zertifikat der installierten Version 0.2.0. apksigner verify, zipalign und AAPT-Paket-/Versionsprüfung erfolgreich. Vorversion bleibt für Rückgriff vorhanden, die Downloadseite führt zur aktuellen APK. Keine privaten Signierdaten im Quellarchiv oder Deployment.

## Prüfung und Grenzen

39 native JUnit/Robolectric-Tests vor dem Signieren bestanden, darunter zwölf Controllerfälle und ein Activity-Test vom Such-Zeitlimit über Wiederholen bis zur erfolgreichen Nähe-Anzeige. Vorhandene Tests zu Datenqualität, Cache, Fair Use, Favoriten und Navigation erhalten. Renderings bei 192/227 dp und 1,3-facher Schrift kontrolliert; Minutentext innerhalb seiner Spalte und initialem kleinen Viewport geprüft. Renderings verwenden öffentliche Beispieldaten.

Der Nutzer bestätigt Installation und Start der Vorversion auf OnePlus Watch 2R / Wear OS 5, mit dauerhaftem „Position wird gesucht“. Die stumme-Quelle-/Zeitlimit-Situation ist automatisiert reproduziert und abgefangen. Ob diese Ursache allein den physischen Fehler erklärt, bleibt bis zum neuen Gerätetest offen. Tatsächlicher GPS-Fix, Standort-/Internetabfragen und PackageInstaller-Upgrade auf der Uhr sind keine durch Robolectric bewiesenen Ergebnisse.

Update aus 0.2.0: Mehr → Auf Update prüfen. In 0.2.1: Mehr → App & Updates → Auf Update prüfen. Alternativ aktuelle APK mit Wear Installer 2 über die bestehende App installieren; nicht deinstallieren. Danach Ortung auf der Uhr erlauben/einschalten und möglichst im Freien testen.

QR-Favoritenübertragung bleibt nicht verfügbar; lokale Favoriten bleiben unabhängig. Neue Version ändert weder die PWA-Daten noch die Paketidentität.

## Offizielle API-Referenzen

[Android LocationManager](https://developer.android.com/reference/android/location/LocationManager) beschreibt die verfügbaren Provider sowie getCurrentLocation und die Abbruchsignale. [Wear-OS-Ortung](https://developer.android.com/training/wearables/apps/location-detection) erläutert die Ortungsquellen von Uhren. Diese Umsetzung verwendet den vorhandenen Plattform-/CLI-Stack ohne neue Play-Services-Abhängigkeit; ein Android-Plattform-fused-Provider wird nur verwendet, wenn er vorhanden ist.
