# Aktueller Projektstand

Stand: 9. November 2026. **PWA 0.6.1, Wear 0.6.1 / Code 21.** Verbindliche Versionen stehen in den PWA-/Wear-Konfigurationen und im Updatefeed. Frühere Details und Abnahmen bleiben in [Release-Verlauf](docs/release.md), [Tests](docs/tests.md) und [Status-Archiv](docs/history/STATUS-before-github.md) erhalten.

## Umgesetzt

| Bereich | Stand |
| --- | --- |
| Abfahrten | Nähe/Favoriten, sichtbare 30-s-Aktualisierung, bestätigte Stationslinien, Gehzeit und Erreichbarkeit |
| PWA-Favoriten | Ganze Stationen oder einzelne Linien/Richtungen, gemeinsame Stationskarten, Auswahl auch direkt aus der Standortkarte |
| A nach B | Adressen/GPS/Orte, Gesamt-/Abschnittskarten, Varianten, schnellste Wege/weniger Umstiege, Rückfahrt und lokale Routenfavoriten |
| Uhr-Routen | Import per Datei/QR mit Vorschau, aktuelle passende Etappenzeiten und Alternativen; Vollplanung bleibt in der PWA |
| Uhr-Favoriten 0.6.1 | Umschalter Routen/Stationen, gemerkte Auswahl; nach bestätigtem QR-Import direkt zur passenden Favoritenansicht |
| Updates/Akku | PWA-Updatehinweis; Uhr-Metadatenvorschau, eigene Downloadbestätigung, Fortschritt und optionaler Ultra-Sparmodus |
| Störungshinweise | PWA Web Push nach Gerätefreigabe, Stationen/Linien/Routen/Alternativen, Aufzüge optional und Geplantes erst ab Beginn |
| Veröffentlichung | Öffentliches GitHub mit CI und konsolidierter Dokumentation; Site und APK werden weiterhin separat veröffentlicht |

## Verifikation und Grenzen

Der erste öffentliche GitHub-Import 0.6.0 umfasst 296 geprüfte Dateien; sein GitHub-Prüflauf war erfolgreich. Web-/Server- und Python-Prüfungen werden im jeweiligen aktuellen Commit automatisch ausgeführt. Für 0.6.1 sind 244 Web-/Server- und 124 native Prüfungen dokumentiert; Python-Suite: acht Prüfungen. Der Dokumentations-/Quellpaketwechsel verändert kein App-Verhalten und erfordert keine neue APK.

Die Störungsquelle wird im Hintergrund stündlich geprüft, bei ohnehin aktiver App ungefähr alle fünf Minuten zusätzlich. Kein Echtzeitversprechen. Serverlauf, Unit-Tests und providerseitige Annahme sind jeweils von tatsächlichem Geräteempfang zu unterscheiden.

## Offene Arbeiten

- Direkten FCM-Empfang der Uhr durch Firebase-Projekt-/Client-/Serverkonfiguration und anschließend echten Gerätetest abschließen. Die PWA ist davon unabhängig.
- PWA-Push auf den Zieltelefonen nach Opt-in/Testnachricht tatsächlich abnehmen; relevante Störungen, Ruhezeit, Ablauf und Deaktivierung beobachten.
- Physische OnePlus-Abnahme von GPS, Kamera/QR, System-Dateiauswahl, Installer, Gesten und Akkuverhalten fortsetzen. Aus Tests keine gemessene Akkuersparnis ableiten.
- Einen engeren Hintergrundtakt erst mit tatsächlich betriebenem externem Timer anbieten; der vorbereitete Fünf-Minuten-Timer ist derzeit nicht gestartet.
- Ein vollständiger offline nutzbarer Wiener-Linien-Fahrplanfallback ist nicht Bestandteil dieses Releases. Der GTFS-Katalognachweis für Stationslinien ersetzt keine lokale Abfahrtsdatenbank.

Neue Arbeiten starten über die [Dokumentationsübersicht](docs/README.md). Interne Quelle, öffentliches GitHub und Source-Download nach dem [Abgleichverfahren](docs/github.md) zusammen pflegen.
