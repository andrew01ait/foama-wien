# foama – Branding ab PWA 0.11.27 / Wear 0.8.3

Verbindlicher Master ist `pwa/icons/foama-mark.svg`: die vom Nutzer gewählte **Bahn + Schiene mit Lächeln**. Mintfarbene Kontur auf Navy, zwei helle Augen, kleines Lächeln und kurzes Gleis. Die Maskable-Sicherheitsabstände des Masters bleiben erhalten.

## Gemeinsame Erzeugung

`python3 scripts/render_icons.py` rendert 192-/512-Pixel-PNGs und stabile Aliasdateien. Die Installationsdateinamen enthalten die ersten zwölf SHA-256-Zeichen des SVG-Masters; eine geänderte Grafik erhält neue URLs, ein reines App-Update keine neue Logoidentität. Manifest, Apple-Touch-Icon, Offline-Shell und Push verwenden denselben Inhalt.

`python3 scripts/sync_branding.py` erzeugt `wear/app/src/main/res/drawable/app_icon.xml` aus genau diesem SVG, einschließlich Transformationen, runden Konturen, Augen und Lächeln. Der CLI-Builder führt dies vor dem Kompilieren der Android-Ressourcen aus. Normales und rundes Launcher-Symbol referenzieren die erzeugte Vektorgrafik. Unbekannte Formen/Transformationen lassen die Synchronisierung fehlschlagen, statt stillschweigend alte Symbole zu übernehmen. Der alte gefüllte Bahnvektor aus Wear 0.8.2 ist ersetzt.

## Bereits installierte PWA

Das Manifest bleibt unter `manifest.webmanifest` erreichbar; der Pfad, die App-ID, Startadresse und Scope bleiben stabil. Alte Manifest-URLs mit Versionsquery funktionieren über denselben Serverpfad weiter. Der Service Worker holt Manifeste zuerst aus dem Netz und verwendet gespeicherte Exemplare bei fehlender Verbindung.

Chrome 144+ prüft Icons nur erneut, wenn sich deren Manifestmetadaten oder URLs ändern. Größere Logoänderungen sind optionale Identitätsupdates, die Nutzer über **Review app update** im App-Menü prüfen und bestätigen können. Die Website kann diesen Android-/Browserdialog nicht selbst bestätigen. App-Aktualisierung, Service-Worker-Aktivierung und Launcher-Symbol sind getrennte Vorgänge. Keine garantierte sofortige Änderung und keine Deinstallation zur Symbolaktualisierung vorsehen.

Quelle: [Chrome-Team, 21. Januar 2026: A better way to update your web apps](https://developer.chrome.com/blog/improvements-to-web-app-updates). Die ältere Anleitung mit pauschaler 24-Stunden-Prüfung ist für Chrome 144+ nicht die maßgebliche Erklärung.

## U-Bahn-Linienfarben

Die RGB-Füllfarben der Linienmarkierungen wurden aus dem offiziellen [Wiener-Linien-Netzplan 2026](https://www.wienerlinien.at/documents/2424499/7499660/2026_SVP_WC.pdf/3605d878-228d-3990-01d7-aff1ec3f7ddd?t=1768568035244) ausgelesen und den dortigen U1-/U2-/U3-/U4-/U6-Beschriftungen zugeordnet.

| Linie | Farbe | RGB/Hex |
|---|---|---|
| U1 | Rot | `#ED1C24` |
| U2 | Violett | `#A066AA` |
| U3 | Orange | `#F5821F` |
| U4 | Grün | `#00A068` |
| U6 | Braun | `#986A3A` |

`routeBadge` setzt ein normalisiertes `data-route`; CSS ordnet die konkrete Linie zu. Gilt für Abfahrtslisten, einzelne Favoriten, ganze Stationsfavoriten und Verbindungsauswahl. U5 ist im verwendeten Betriebsnetzplan nicht enthalten; es werden keine fiktiven U5-Abfahrten angelegt.

## Nachtlinien v0.1.5

Auf Nutzerwunsch: Nachtlinien mit N-Präfix (auch N30R usw.) erhalten dunkelblau `#162A63` mit weißem Text. Shared `.route-pill[data-route^="N"]` gilt für Stationsübersichten, Abfahrten, Favoriten und Verbindungsauswahl. Keine Änderung der offiziellen U-Bahn-Zuordnung.

## Städtecollage ab PWA 0.8.2

Die Seite Städte & Funktionen verwendet `pwa/images/foama-vier-staedte-v1.webp` als vollständiges proportionales Titelbild. Stadtwahrzeichen und Fahrzeuge sind eine dekorative Collage; sie stellen keinen tatsächlichen Linienverlauf dar. Die separate App-Marke wird durch die Collage nicht ersetzt. [Bildherkunft und Gestaltungsbrief](assets/foama-vier-staedte.md).

## Einheitlicher PWA-Slogan ab 0.11.9

Verbindliche Schreibweise: **Öffis, die du noch erreichst.** Alle 13 ausgelieferten HTML-Seiten zeigen denselben Slogan im Markenkopf, einschließlich der rechtlichen Informationen, der Debugging-Umzugsseite und des historischen Uhr-Entwurfs. Im fokussierten Abfahrtsmonitor, der den Hauptkopf ausblendet, steht er im Verbindungskopf. Seitenspezifische Titel/Quellen, Willkommen-Hauptaussage und bestehende Fußzeilen behalten ihren Zweck. Gemeinsame `.brand-tagline`- und `.brand-copy`-Stile sorgen für natürliches Umbrechen ohne Kürzung. Die Manifest-Beschreibung und der Teilen-Text verwenden denselben Wortlaut. Keine Änderung der nativen Wear-APK.
