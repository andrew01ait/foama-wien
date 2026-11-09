# Native Wear 0.3.0 / Code 7 · 08.11.2026

Stationskarten gruppieren alle ausgewählten Verbindungen derselben Station, Stationsname zuerst und Richtung darunter. Ganze Station plus gezielte Favoriten werden ohne doppelte geladene Richtungen angezeigt. Einzeln gespeicherte Verbindung bleibt im Detail entfernbar; JSON und bestehende Daten bleiben erhalten. Sichtbare Stationen bekommen zuerst das bestehende 24-RBL-Budget, innerhalb gleicher Sichtbarkeit U-Bahn vor Tram vor Bus, keine Requests innerhalb der 30-Sekunden-Sperre.

Mehr → Störungsmeldungen enthält den vorbereiteten direkten Push-Opt-in, Filter/Nachtruhe, Test/Abmeldung und lokales 24-h-Archiv (maximal zehn Hinweise). Firebase/Serverkonfiguration fehlen noch; Aktivieren gesperrt. Kein tatsächlicher Google→Uhr-Zustellnachweis. GPS/Monitor bleiben sichtbar-only. Offizielle Messaging-/Installations-Abhängigkeiten nur nach Opt-in initialisiert, kein Analytics/Auth/Firestore. [Betrieb](push-notifications.md).

CLI-Build mit ursprünglichem privaten Key, 77 native Tests bestanden. Firebase Messaging 26.0.1 / 77 gepinnte Artefakte, D8/R8 8.13.25 für neue Kotlin-Metadaten; benötigte Android-Ressourcen/Registrare und JNI enthalten. Keine verpflichtenden Nutzer-PC-/Gradle-/Android-Studio-Tools.

Paket at.andrew.foamawien, Version 0.3.0 / Code 7, minSdk 30 / targetSdk 34. Originales Zertifikat SHA-256 d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1. APK 3703212 Bytes, SHA-256 d1d6c49b2fe9b7a676a93189fd200e132da10fa67fc7f756cb9a4e8148febac1. apksigner verify und zipalign erfolgreich.

Update über Mehr → App & Updates → Auf Update prüfen; nicht deinstallieren. Native Runddisplay-Bilder mit synthetischen Daten, keine physische OnePlus-Abnahme. Originale Paket-/Signatur-/Favoriten- und Einstellungsidentität erhalten. Echte Updateinstallation, Navigation und Benachrichtigungsanzeige auf der Uhr separat prüfen.
