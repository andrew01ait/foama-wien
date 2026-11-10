# Wear 0.7.2 · kompakte Favoritenauswahl und Kopftitel

10. November 2026. Paket `at.andrew.foamawien`, Versionscode 24, minSdk 30 / targetSdk 34. PWA bleibt 0.9.5.

Routen und Stationen bilden jetzt einen gemeinsamen flachen Umschalter. Die sichtbare Leiste ist 32 dp hoch und höchstens 176 dp breit statt zweier voller 48-dp-Aktionsbuttons. Getrennte Tippflächen bleiben jeweils mindestens 48 × 48 dp groß; 12-sp-Beschriftung, aktive Auswahl und Fokusmarkierung bleiben erhalten. Die zuletzt gewählte Ansicht und alle lokalen Favoriten bleiben unverändert gespeichert.

Über Nähe/Favoriten/A nach B steht ein kleiner foama-wien-Titel. Die Rundkappe und der leere obere Bereich der Navigation werden gemeinsam genutzt, statt eine zusätzliche volle Titelzeile über die Abfahrten zu setzen. Der Titel bleibt innerhalb des runden Displays und oberhalb der Navigationsicons. Bei großer Systemschrift wächst der nötige Abstand mit. Unterseiten und Transfer behalten ihren bisherigen Seitenaufbau.

147 Android-Tests und 338 Web-/Server-Tests bestanden. Native Renderkontrolle für beide Favoritenbereiche bei 227 dp sowie 192 dp mit 1,3-facher Schrift: vollständige Beschriftung ohne Abschneiden, Titel innerhalb der Rundfläche, keine Überschneidung mit Navigationsicons und mindestens 48-dp-Tippziele. Bestehende Prüfung der ersten Abfahrtszahl auf dem kleinen Runddisplay bestanden, ebenso Auswahlpersistenz, Navigation, Import und Abbruch-/Abrufbudgets.

Java-Kompilierung, D8, zipalign, apksigner, Originalzertifikat und Paket-/Versionsmetadaten erfolgreich geprüft. Gradle-Versionsangaben an die verbindliche CLI-Konfiguration angeglichen.

APK: 3,838,570 Bytes. SHA-256: `07878906f83967bbad1f57dc70604d1760ee746458b7a781ea60add86b96d5db`.

Originalzertifikat SHA-256: `d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1`.

Update über Mehr → App & Updates oder die öffentliche Uhr-Seite. Frühere APKs bleiben unverändert verfügbar; neuer Dateiname `foama-wien-wear-0.7.2.apk`. Die Renderkontrolle ist keine physische Geräteabnahme. Auf der OnePlus-Uhr nach Update Favoriten umschalten, große Schrift und Titel sowie Rückkehr aus einer Verbindung prüfen.
