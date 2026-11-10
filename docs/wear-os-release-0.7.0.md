# Wear 0.7.0 · Mehrere Städte

10. November 2026. Paket `at.andrew.foamawien`, Versionscode 22, minSdk 30 / targetSdk 34. Update mit dem ursprünglichen Releasezertifikat; vorhandene lokale Daten bleiben erhalten.

Wien, Graz, Linz und Salzburg: gemeinsame native Nähe-/Favoritenansichten, automatische Vordergrund-Stadterkennung und manuelle Auswahl nur unter Mehr → Stadtprofil. Vorhandene Stationsfavoriten werden je Stadt betrachtet; Routen bleiben stadtübergreifend. Regionale Übertragung benötigt die neue QR-Fähigkeit `city-profiles-v1`; PWA und Server prüfen sie. Regionale Routen behalten ihre exakten Stationskennungen und Modi. Salzburg zeigt Fahrplanzeiten.

138 Android-Tests erfolgreich. Sie umfassen Stadterkennung/Alter/Genauigkeit, manuelle Positionen, Sichtbarkeitspriorität und begrenzte Rotation, regionalen Parser und Cache, Salzburg, gleichnamige Verkehrsmittel, Import und Navigation sowie bestehende kleine Runddisplays, Transfers, Updates und Pause/Abbruch. Java-Kompilierung, D8, zipalign, apksigner und Paket-/Versionsmetadaten geprüft.

APK: 3.838.570 Bytes. SHA-256: `c445582a8a2ed5ddd4559cbec3c0cb5a1eac09318276bea2e239c94b3f88efac`.

Originalzertifikat SHA-256: `d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1`.

Keine gemessene physische OnePlus-Abnahme aus den Android-Tests ableiten. Auf dem Zielgerät sind Update über die bestehende Installation, frische Standortwechsel, regionale Nähe/Favoriten und QR-Übernahme noch praktisch zu prüfen. Direkter nativer Push bleibt deaktiviert; neue regionale Störungsfeeds sind nicht Teil dieses Release.
