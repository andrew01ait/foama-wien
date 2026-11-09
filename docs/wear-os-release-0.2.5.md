## PWA 0.1.21 / Wear 0.2.5 · Verkehrsmittel und Karlsplatz · 08.11.2026

U-Bahn vor Tram vor Bus: nahe Stationskarten auf beiden Geräten nach dem besten eingeschalteten, belegten Verkehrsmittel, innerhalb derselben Gruppe nach Entfernung. Die PWA begrenzt die Liste erst nach dieser Sortierung und erhält die Priorität beim Neuzeichnen mit Gehentfernungen. Gespeicherte Favoriten behalten ihre manuelle Reihenfolge.

Watch: bisherige harte Vorschaugrenze von drei Linien/Richtungen in Nähe und ganzen Stationsfavoriten entfernt. Alle geladenen passenden Verbindungen erscheinen; U-Bahn-Gruppen stehen vor Tram und Bus, danach nächste Abfahrt. Der erste API-Batch priorisiert in Nähe bestätigte eingeschaltete U-Bahn-Bahnsteige; höchstens 24 RBL, 16 priorisierte plus acht rotierende bei Überlauf. Favoriten behalten die Stationspriorität, innerhalb einer Station werden höher priorisierte Bahnsteige zuerst abgefragt.

Aktive Verkehrsmittel erscheinen als lokale Vektorsymbole direkt im Hauptbild. In Nähe mit dem ersten Stationskopf und der geschätzten Gehzeit kombiniert, in Favoriten als kompakte Zeile. Tippen öffnet sofort Verkehrsmittel; Zurück, Wischen und System-Back kehren zur vorherigen Hauptansicht zurück. Alle ausgeschaltet: klarer Hinweis und weiterhin erreichbar. Volle 48-dp-Tippfläche, keine zusätzliche Hintergrundarbeit. Menüpfad Mehr → Standort & Nähe → Verkehrsmittel bleibt erhalten.

Wear 0.2.5 / Code 6, Paket und ursprünglicher Signaturschlüssel bleiben erhalten. Update über Mehr → App & Updates → Auf Update prüfen. Nicht deinstallieren. Native Abnahme mit synthetischen Karlsplatz-Testverbindungen; physische Uhr-/Live-Karlsplatz-Abnahme separat erforderlich. ÖBB/S-Bahn-Anbindung bleibt offen; Filter allein bedeutet keine Datenquelle.

Push für Telefon und eigenständige Watch ist weiterhin ein eigener offener Arbeitsstrang: PWA-Infrastruktur vorhanden, Aktivierung wegen fehlendem verlässlichem Server-Timer gesperrt. Native FCM-Konfiguration/Anbindung noch offen. Firebase-Verbindung zur weiteren Einrichtung angeboten; keine aktive Watch-Push-Zustellung behaupten.

Prüfstand: 65 native JUnit/Robolectric-Tests vor Signieren, 125 Node-Tests, drei Python-Timer-Vertragsprüfungen erfolgreich. Neue 192-/227-dp-Rundrenderings sowie 1,3-fache Schrift kontrolliert. Sechs Filter plus Gehzeit passen ohne horizontales Überlaufen, bei Bedarf zweizeilig. Beide Hauptansichten, unmittelbarer Einstellungszugang und Back-Pfade geprüft. Große Minuten bleiben erhalten.

Signierte APK: 422555 Bytes, SHA-256 f23923b10cd341104bbdcc1daa03cd14437d9d16f3a44fad38cb913c48bdb677. apksigner verify, zipalign, Paket at.andrew.foamawien, Version 0.2.5 / Code 6 und min/target SDK 30/34 geprüft. Zertifikat weiterhin d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1. Kein neuer Schlüssel, keine neue Hintergrundkomponente.

Interne Browserabnahme der tatsächlichen PWA mit öffentlichem manuellem Startpunkt Bärenmühldurchgang: Karlsplatz U (Metro) vor Resselgasse (Tram) vor der näheren Busstation; nach Ausschalten von Metro Resselgasse vor Karlsplatz U. Wiederholtes Neuzeichnen erhält die Reihenfolge. Öffentlicher Preview-API-Zugriff nicht erfolgreich und daher kein Live-Nachweis. Downloadseite zeigt Version, aktualisierte native Beispielbilder und passende Metadaten.

Veröffentlichung über die bestehende öffentliche Site, Download https://foama-wien.endruuu.chatgpt.site/wear.html. [Maschinenlesbare Abnahme](20261108_foama-wien-validation-pwa-0.1.21-wear-0.2.5.json).
