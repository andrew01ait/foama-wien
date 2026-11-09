# Wear 0.6.0 / Code 20

Die Störungsauswahl Meine Favoriten berücksichtigt auch gespeicherte A-nach-B-Wege einschließlich Alternativen. Bekannte Ein-, Umstiegs- und Ausstiegsstationen werden lokal zu höchstens 100 minimalen Stations-/Linienfiltern zusammengeführt. Keine Adressen, eigenen Routennamen oder GPS-Koordinaten werden dafür übertragen. Änderungen durch Import, Entfernen und sichtbare Rückkehr aktualisieren die Auswahl. Aufzüge/Fahrtreppen bleiben optional, geplante Hinweise werden vor Beginn ausgeschlossen.

Direkte Push-Zustellung auf die Uhr bleibt bis zur Firebase-Einrichtung gesperrt. Die PWA verwendet unabhängig davon Web Push. Eine erfolgreiche Quellenprüfung oder Unit-Tests belegen keine physische Push-Zustellung. Spiegelung der Handy-Benachrichtigungen über die Begleit-App bleibt eine getrennte Systemeinstellung.

119 native Tests bestanden, darunter Ableitung der Routen-/Alternativenfilter und deren Entfernung ohne Firebase-Initialisierung. 244 Web-/Server- und acht Python-Prüfungen erfolgreich. Originalpaket, Originalsignatur, Updatevorschau mit drei Neuerungen, gesonderte Downloadbestätigung, Fortschrittsanzeige und Ultra-Sparmodus erhalten. Physische Uhr-/Push-Abnahme separat.

APK: 3.731.884 Bytes; SHA-256 d112d1b0b1340623b505033f4fc48ad03320ca06b1fc75d4fe4ede74b39f5900. apksigner, Paket-/Versionsmetadaten und zipalign erfolgreich. Paket at.andrew.foamawien; Originalzertifikat d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1.

Öffentlicher Download über wear.html erfolgreich; Größe und SHA-256 bytegleich zum signierten Build. Landingpage erklärt direkte Firebase-Zustellung als noch offen und Handy-Spiegelung als getrennte Alternative. Produktiver Dienst bestätigt PWA available=true, nativeAvailable=false, Hintergrundintervall 60 Minuten und erfolgreichen aktuellen Quellenabruf; keine physische Geräteinstallation oder Push-Zustellung daraus ableiten.
