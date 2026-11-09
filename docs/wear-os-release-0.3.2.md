# Wear OS 0.3.2 / Code 9 · 8. November 2026

Die sichtbare Uhr-App hält das Display während der Favoritenübertragung in beide Richtungen wach: Vorbereitung, QR-Code, Empfang/Versand, Vorschau und Bestätigung. Kein automatischer Bildschirm-Timeout während der aktiven Sitzung. Abschluss, Back/Abbruch, endgültiger Fehler und Ablauf geben das Display wieder frei. Die Zehn-Minuten-Grenze läuft unabhängig vom Polling und umfasst auch blockierte Vorbereitung sowie unbestätigte Vorschauen; ein früheres Serverablaufdatum verkürzt sie. Bewusstes Verlassen/Systemunterbrechung beendet weiterhin die Sitzung.

Keine zusätzlichen Berechtigungen, Services, Hintergrundortung oder Abfahrtsabfragen. Keine dauerhafte Wachhalteoption. Lokale Favoriten, Paket at.andrew.foamawien und ursprüngliches Zertifikat bleiben erhalten. PWA bleibt 0.1.23.

83 native Android-/Robolectric-Prüfungen vor Signieren, 143 Node-Prüfungen bestanden. apksigner v3, zipalign, Paket, Version 0.3.2 / Code 9 und Watch-Feature verifiziert. APK 3703212 Bytes, SHA-256 278aeb2b323d45a8f846097b77a9d08293cdf6e76097bf4b12bab2c5669c08ec. Reale OnePlus-Abnahme von automatischem Display-Timeout/QR-Transfer bleibt separat.

Update: Mehr → App & Updates → Auf Update prüfen. [Downloadseite](https://foama-wien.endruuu.chatgpt.site/wear.html).

Technische Primärquellen: [Android Screen-on](https://developer.android.com/develop/background-work/background-tasks/awake/screen-on) und [Wear OS Zustände](https://developer.android.com/training/wearables/always-on). Verwendet das bestehende native Activity-Window, keine neue Compose-/Ongoing-Activity-Abhängigkeit.
