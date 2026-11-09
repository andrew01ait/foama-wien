# foama-wien Wear OS 0.2.2 · Navigation und Ressourcen

07.11.2026. Paket at.andrew.foamawien bleibt erhalten; PWA 0.1.14 separat. [Download](https://foama-wien.endruuu.chatgpt.site/wear.html).

## Gestaltung und Zurück

Der Nutzer bestätigt 0.2.1 als gut funktionierend und lobt Mehr und die Zurück-Buttons. Diese Gestaltung bleibt erhalten. Nähe/Favoriten haben nun einen gemeinsamen Segmentrahmen mit originalen Pin-/Stern-Vektoren. Auswahl ist durch Füllung, Icon und Accessibility-State erkennbar. 48-dp-Tippziele, 12-sp-Beschriftung, responsive Runddisplay-Ränder und große Minuten bleiben.

Beide horizontalen Wischrichtungen, klassische Back-Taste, moderne Android-Back-Callback und sichtbarer Zurück-Button verwenden einen Elternpfad. Interne Seiten dürfen nicht durch das native Activity-Swipe-Finish übersprungen werden. Radius/Verkehrsmittel führen zu Standort & Nähe, dann Mehr, dann Hauptansicht. Detail führt wie der bisherige Zurück-Button zur Hauptansicht. Erst Root-Back schließt. Vertikale, mehrfingrige und abgebrochene Gesten navigieren nicht. Power/Home bleibt vom System verwaltet.

## Ende sichtbarer Arbeit

Bei onPause, onStop, Verlassen am Root und SCREEN_OFF: Ortungslistener und Einmalanfragen/Timer stoppen, HTTP-Sitzung abbrechen und zugehörige Futures stornieren. Jede Verbindung gehört zu RequestScope; nach dessen Storno kann keine neue Verbindung starten oder späte Antwort Daten/Fehlerzustand übernehmen. Erneute Arbeit beginnt nur bei sichtbarer, interaktiver Activity; SCREEN_ON darf keine versteckte App starten. Keine Hintergrunddienste oder periodischen Jobs. Bereits an einen Server gesandte Aufrufe können dort abgeschlossen werden; die Uhr beendet ihre Verbindung und beginnt keine weitere Abfrage.

## Daten auf der Uhr

Favoriten und Einstellungen bleiben. Standort liegt ausschließlich flüchtig vor und wird beim Pausieren verworfen, keine Positionshistorie. Abfahrten: maximal 3.000 Datensätze, 512 KiB serialisierter UTF-8-Cache und zehn Minuten Gültigkeit, vergangene Abfahrten ausgeschlossen. Beim Öffnen/Verlassen werden ungültige/abgelaufene Datensätze auch aus der gespeicherten Datei entfernt. Es gibt keinen Hintergrund-Cleanup nur zum Ablauf der zehn Minuten; ein geschlossener Cache bleibt größenbegrenzt und wird beim nächsten Öffnen bereinigt.

Update-Download maximal 8 MiB, ein app-eigenes temporäres APK, atomare Umbenennung erst nach Prüfsummen-/Paket-/Signaturprüfung. Fehler, Abbruch, später geschlossener Installationsdialog, Übergabe an PackageInstaller oder Verlassen entfernen die Download-Dateien. Angefangene Installer-Sitzungen werden bei Fehlern aufgegeben. Installer-Bestätigung bleibt Android-Aufgabe. Externe Daten und Favoriten werden durch die Bereinigung nicht gelöscht.

## Verifiziertes Paket

| Feld | Wert |
|---|---|
| Version / Code | 0.2.2 / 3 |
| APK | /apk/foama-wien-wear-0.2.2.apk |
| Bytes | 410267 |
| APK SHA-256 | a30dfd578aa0aec9373d39f448d9aa576556cb9a5bf3d06b93a3fa96edbed029 |
| Zertifikat SHA-256 | d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1 |
| Min / target SDK | 30 / 34 |

54 JUnit/Robolectric-Tests vor dem Signieren bestanden; Paket, ursprüngliches Zertifikat, apksigner und zipalign erfolgreich geprüft. Native Renderings 192/227 dp und 1,3-fache Schrift mit öffentlichen Beispieldaten kontrolliert. Physische Gesten-/Display-aus-/Akkuprüfung auf OnePlus Watch 2R mit 0.2.2 ist noch erforderlich; es wird keine gemessene Akkuersparnis behauptet. QR weiter nicht angeboten.

Update aus 0.2.1: Mehr → App & Updates → Auf Update prüfen. Alternativ aktuelle APK über die bestehende Installation installieren. Vorversionen bleiben auf dem Host für Rückgriff vorhanden; auf der Watch werden keine heruntergeladenen Versionsarchive gesammelt.

Offizielle Referenzen: [Wear-Views verlassen](https://developer.android.com/training/wearables/views/exit) beschreibt den Activity-Swipe-Pfad und windowSwipeToDismiss; [OnBackInvokedCallback](https://developer.android.com/reference/android/window/OnBackInvokedCallback) den modernen gemeinsamen Back-Einstieg.
