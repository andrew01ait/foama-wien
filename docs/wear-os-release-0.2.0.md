# foama-wien Wear OS 0.2.0 · erster nativer Testbuild

07.11.2026. Ausgangspunkt sind die bestehenden Java-Quellen, keine neue App-Identität. Öffentlicher Einstieg: https://foama-wien.endruuu.chatgpt.site/wear.html.

## Umfang

- Nähe und Favoriten als einzige Hauptansichten. Verbindungstap öffnet eine eigene große Detailansicht; Speichern/Entfernen ausdrücklich dort. Ganze Station über „Alle Abfahrten der Station“ öffnen und dort merken.
- Schwarzer Hintergrund, 28-sp-Listenzeit und 54-sp-Detailzeit; offizielle U-Bahn-Farben und dunkelblaue Nachtlinien. Wesentliche Texte mindestens 12 sp, Bedienelemente mindestens 48 dp.
- Mehr am Listenende: Standort, Radius 300/600/1000 m, bestätigte Verkehrsmittel, Gehgeschwindigkeit/Reserve, Favoritensortierung und Update-Check. Kategorien sind kleine Unterseiten, keine Dropdowns oder dauerhafte Aktionsleiste.
- Native System-Zurück-/Randwisch-Navigation, Rotary-Scrollen. Kein Keep-awake/Foreground-Service, keine Hintergrundarbeit.
- Lokale Watch-Favoriten unabhängig vom Telefon (Option B), gleiche bekannte Datenfelder. Beim Update dieselbe Paketidentität und denselben Schlüssel behalten; nicht deinstallieren.

## Reale Daten und Zuverlässigkeit

Repo verwendet den vorhandenen HTTPS-Relay der eigenen Site, der nur feste offizielle Wiener-Linien-Endpunkte anspricht. Maximal 24 RBL und frühestens alle 30 s; bei Fehlern 60–300 s Pause. Priorität folgt Nähe bzw. der gewählten Favoritenordnung. Bis 24 alle, darüber 16 vordere und acht rotierende. Plattformen aus dem offiziellen Katalog, kein U/S-Namensraten.

Live nur bei timeReal, sonst Fahrplan. Reale künftige Records werden lokal begrenzt gehalten (höchstens 3.000 / zehn Minuten), nach 90 s oder Fehler als ÄLTER. Erfolgreiche Teilabfragen ersetzen nur deren RBL; andere Favoriten verschwinden nicht aus dem Cache. Keine synthetischen Live-Daten. Offizielle Monitor-Meldungsreferenzen zeigen einen kurzen Hinweis; ausführliche Meldungen bleiben am Telefon.

Standortfreigabe erstmals nur nach sichtbarem Knopf. Zuvor gewährte Ortung kann bei sichtbarer Activity wieder anlaufen. Grobe Fixes bleiben als ungefähre Nähe nutzbar; Alter/Genauigkeit auch unter 40 m Bewegung erneuern. Geh-Einschätzung ungewiss bei über 150 m Unsicherheit, über 90 s Alter, erkannter Fahrt oder Datenfehlern. Geschwindigkeit/konservative Distanzheuristik, kein behaupteter physischer Bewegungstest. GPS wird nicht dauerhaft gespeichert oder an den Relay gesendet.

## Paket und Prüfung

| Feld | Wert |
| --- | --- |
| Application ID | at.andrew.foamawien |
| Java-Namespace | at.foama.wien |
| Version / Code | 0.2.0 / 1 |
| minSdk / targetSdk | 30 / 34 |
| APK | /apk/foama-wien-wear-0.2.0.apk |
| Bytes | 402075 |
| APK SHA-256 | 3d6d26b74ac999901669ebb1914791683bf44e53c80bf156438421b94adc42b9 |
| Signatur | RSA 3072, APK v3, apksigner erfolgreich |
| Zertifikat SHA-256 | d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1 |

26 JUnit-/Robolectric-Tests mit API 34 bestanden: Core-Grenzen, Cache/Teilantworten, Echtzeit-/Fahrplanqualität, Favoriten und Sortierordnung, Standort-Metadaten, Fahrt, Navigation, kein Erst-Prompt ohne Tap, Pause, kleine Runddisplays, explizite Favoritenaktion, Untermenüs. Native 192-/227-dp-Renderings mit öffentlicher Beispielstation wurden visuell kontrolliert. Dies ist keine Emulator- oder Hardware-Abnahme.

Builder testet vor dem Signieren, prüft anschließend Signatur, zipalign und Paket-/Versionsmetadaten. Publikationshelfer prüft Signatur nochmals und erhält die PWA-Version im gemeinsamen update.json. Der öffentliche Update-Feed führt Wear-Version, Code, Paket, Bytegröße und SHA-256 separat.

## Signatur und Wiederherstellung

Private Schlüssel ausschließlich in ignoriertem .local/private. Separater privater persistenter Backup „foama-wien-private-signing-backup.zip“ ist gesichert. Er enthält Keystore, Wiederherstellungsanweisung und die privaten Umgebungswerte. Niemals in Site, Quellarchiv oder öffentliche Logs aufnehmen. wear/release-signing.json enthält nur den öffentlichen Zertifikat-Fingerabdruck. Builder verweigert einen neuen Schlüssel, sobald die Release-Identität besteht; bei fehlendem Key das Original wiederherstellen.

## Installation und ausstehende Abnahme

Die Downloadseite enthält die telefonbasierte Installation über [Wear Installer 2](https://freepoc.org/wear-installer-2-help-page/). Die APK auf dem Telefon herunterladen und über Custom APK auf die Uhr übertragen; dafür Uhr und Telefon nach der Herstelleranleitung für drahtloses Debugging koppeln. Danach Debugging ausschalten. Keine PC-Entwicklungstools erforderlich.

Auf der OnePlus Watch 2R / Wear OS 5 noch prüfen: tatsächliche Installation/Start, WLAN/Bluetooth-Internet, Standort-Prompt und Fix, aktueller RBL-Abruf, Erwachen/Pause, Touch/Rotary/Zurück und große Systemschrift. Die In-App-Installation hängt vom PackageInstaller der Uhr ab und wird immer durch Android bestätigt; der Download-/Signaturpfad ist implementiert, ein echtes Upgrade von einer älteren Watch-Version ist noch nicht möglich zu testen.

## Bewusst noch offen

Zehnminütiges E2E-QR-Format und TransferManager-Quelle bleiben erhalten. Der aktuelle Sites-Transferdienst ist nicht konfiguriert; die erste native Oberfläche bietet deshalb keinen funktionslosen QR-Knopf. Smartphone-Settings und Downloadseite benennen diese Grenze. Keine automatische Synchronisation behaupten. ÖBB-Fahrplanadapter bleibt vorbereitet, der ausgelieferte Rail-Datensatz leer. Karten, umfassende Stationssuche und umfangreiche Meldungen bleiben Smartphone-Aufgaben.

## Öffentliche Veröffentlichung geprüft

Die öffentliche /wear.html-Seite rendert korrekt, PWA-Settings verlinken dorthin. Produktiver Worker protokolliert APK-GET mit HTTP 200; bereitgestelltes Deployment-Archiv enthält exakt 402075 APK-Bytes mit obigem SHA-256. Der Cloud-Browser hat seinen Download abgebrochen; ein vollständig gespeicherter Browserdownload ist damit nicht bestätigt. Direkte automatisierte urllib-Aufrufe wurden bereits an der Hosting-Edge mit 403/1010 abgewiesen, auch beim Health-Endpunkt. Keine Header-/Fingerprint-Umgehung versucht. Deshalb den tatsächlichen Download und nativen API-Zugriff auf der OnePlus Watch ausdrücklich in die Geräteabnahme aufnehmen. Details: validation-published-wear-0.2.0.json.
