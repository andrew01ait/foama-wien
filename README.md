# foama-wien

Öffis, die du noch erreichst. Abfahrtsmonitor für Wien als installierbare Smartphone-PWA und native Wear-OS-App.

[**PWA öffnen**](https://foama-wien.endruuu.chatgpt.site/) · [**Uhr-App**](https://foama-wien.endruuu.chatgpt.site/wear.html) · [**GitHub**](https://github.com/andrew01ait/foama-wien) · [Dokumentation](docs/README.md)

## Funktionen

- Live-Abfahrten in der Nähe mit Gehzeit, Erreichbarkeit und zwei nächsten Abfahrten.
- Lokale Favoriten für ganze Haltestellen, einzelne Linien/Richtungen und A-nach-B-Wege.
- Routenplanung mit Adressen, eigenen Orten, Karten, Alternativen und Vergleich von Fahrzeit und Umstiegen.
- Import gespeicherter Wege auf die Uhr per Datei oder kurzlebiger verschlüsselter QR-Übertragung.
- Dezente spätere Live-Zeitkorrekturen und Rollstuhl-Symbol bei ausdrücklich gemeldeter Fahrzeug-Barrierefreiheit in der PWA.
- Optionale PWA-Störungshinweise für Favoriten einschließlich Routen und Alternativen; Aufzüge getrennt wählbar.
- Uhr mit getrennten Routen-/Stationsfavoriten, Updatevorschau, bestätigtem Download und optionalem Ultra-Sparmodus.

Aktueller App-Stand: **PWA 0.6.4 und Wear 0.6.1**, nativer Versionscode **21**. Versionen stehen verbindlich in [PWA-Konfiguration](pwa/config.json), [Uhr-Konfiguration](wear/build-config.json) und [Updatefeed](pwa/update.json). [STATUS.md](STATUS.md) nennt Grenzen und offene Arbeiten.

## Entwicklung starten

Für Web-/Serverprüfungen: Node.js 22 und Python 3.12.

```sh
npm ci
npm test
python3 -m unittest discover -s tests -p '*test.py'
```

Die automatische GitHub-Prüfung führt Web-/Server-, Python- und JavaScript-Syntaxprüfungen aus. Native Android-Tests laufen getrennt im CLI-Build; ein grüner Web-Prüflauf bestätigt keine physische Geräteabnahme.

## Aufbau und Anleitungen

| Einstieg | Inhalt |
| --- | --- |
| [Entwicklung](docs/development.md) | Projektstruktur, Voraussetzungen, Tests und Vorschau |
| [Architektur](docs/architecture.md) | Datenflüsse, Speicher und Abrufgrenzen |
| [Konfiguration](docs/configuration.md) | Hosting-Bindings, Push und optionale Firebase-Einrichtung |
| [Deployment](DEPLOYMENT.md) | Site, APK, Versionsfeed und Release-Abnahme |
| [Uhr-Build](docs/squashtap-build-adaptation.md) | Android-CLI, Prüfung und Signatur |
| [GitHub und interne Quellen](docs/github.md) | Beiträge, Quellabgleich und Veröffentlichungsablauf |
| [Prüfprotokoll](docs/tests.md) | Tatsächliche Tests und verbleibende Geräteprüfungen |
| [Release-Verlauf](docs/release.md) | Frühere Änderungen und Abnahmen |

GitHub enthält Quellcode, öffentliche Referenzdaten und Dokumentation. Die laufende Site wird separat veröffentlicht; ein GitHub-Commit löst dort keinen Deploy aus. Der aktuelle Site-Bundler benötigt die passende öffentliche APK als lokale Build-Datei; siehe [Deployment](DEPLOYMENT.md). Private Schlüssel und Zugangsdaten bleiben außerhalb des Repositories.

## Daten und Datenschutz

Standort und Abfahrtsaktualisierung arbeiten nur bei sichtbarer App. Favoriten bleiben pro Gerät lokal. QR-Sitzungen laufen nach zehn Minuten ab; Push ist freiwillig. Routenplanung und ausdrücklich gestartetes präzises Routing nutzen externe Dienste und übertragen dafür die erforderlichen Eingaben. Die [Architektur](docs/architecture.md) beschreibt die Grenzen.

Die Hintergrundprüfung für Störungen läuft derzeit stündlich, bei ohnehin aktiver App gegebenenfalls häufiger. Direkter Uhr-Push benötigt noch Firebase Cloud Messaging; die PWA nutzt Web Push unabhängig davon. Die Uhr zeigt importierte Routen mit aktuellen Etappenzeiten, führt aber keine eigenständige Vollroutensuche aus.

## Lizenz

Eigener App-Code: [MIT](LICENSE), Copyright 2026 Andrew Lindley. Daten, Bibliotheken, Karten und Dienste behalten ihre eigenen Bedingungen; siehe [Lizenzen](docs/licenses.md) und [Quellen](LICENSE-SOURCES.md). Frühere umfangreiche README-Stände bleiben im [Archiv](docs/history/README-before-github.md) erhalten.
