# Wear 0.7.1 · Stadtbezogene Routen und Ladezeiten

10. November 2026. Paket `at.andrew.foamawien`, Versionscode 23, minSdk 30 / targetSdk 34. PWA bleibt 0.8.2.

A nach B und Favoriten → Routen zeigen nur Wege der gewählten Stadt. Bestehender Gesamtspeicher, IDs, Alternativen und QR-/Dateiexporte bleiben unverändert. Stadtübergreifende Wege erscheinen in allen betroffenen Profilen. Zuordnung anhand öffentlicher Stationskennungen und fester Endpunkte, niemals anhand eigener Namen oder momentaner GPS-Position.

Die Hauptleiste Nähe/Favoriten/A nach B bleibt in der Routenansicht erhalten, mit aktiver Markierung. Mehr → Stadtprofil kehrt anschließend dorthin zurück. Schmale Navigation mit mindestens 48-dp-Zielen geprüft; überflüssige Überschrift und doppelte Gehzeitwarnung entfernt.

Nach Rückkehr aus Einstellungen starten fällige Abfragen sofort. Gemeinsame Sperren werden genau nach ihrer Restzeit fortgesetzt. Fehlerpausen und Zähler sind je Stadt getrennt und bleiben beim Zurückwechseln erhalten. Gemeinsamer 30-Sekunden-Mindestabstand und freiwilliger 90-Sekunden-Sparmodus bleiben verbindlich. Kein Hintergrundabruf, neue Daten werden direkt nach erfolgreichem Laden dargestellt. API-Anfragen führen einen festen App-User-Agent ohne Gerätekennung.

147 Android-Tests bestanden, einschließlich Routenfilter/Speichererhalt, Elternnavigation, Runddarstellung 227/192 dp mit großer Schrift, genaue Wiederholungszeit, stadtübergreifender Sperre und Abbruch. Java-Kompilierung, D8, zipalign, apksigner, Originalzertifikat und Paket-/Versionsmetadaten erfolgreich geprüft.

APK: 3,838,570 Bytes. SHA-256: `c49d58bdab1053650614086ad9bfa90b564e18344e84543e9675fb1666ae4397`.

Originalzertifikat SHA-256: `d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1`.

Öffentliche echte Einzelproben aus der Buildumgebung: Graz 7,44 s / Linz 7,12 s mit Live-Daten, Salzburg 7,47 s mit Fahrplan, jeweils 64 Abfahrten und HTTP 200. Dies belegt erreichbare Providerdaten für diese Stationen, keine gemessene physische Watch-Geschwindigkeit oder allgemeine Latenzgarantie. Geräteabnahme: bestehende OnePlus-Installation aktualisieren, Graz/Linz/Salzburg rasch wechseln, erste Abfahrt/Restwartezeit, Hauptnavigation und Wiederauftauchen der Wien-Routen prüfen. Native Push-Funktionen unverändert deaktiviert.
