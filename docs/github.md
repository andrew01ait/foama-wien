# GitHub: Einrichtung und Entwicklung

Dieses Repository enthält den aktuellen foama-wien-Quellcode für Smartphone-PWA und Wear OS. Die erste öffentliche Übernahme entspricht dem veröffentlichten App-Stand 0.6.0 / Wear-Code 20 vom 9. November 2026. Die ursprüngliche interne Commit-Historie und private Build-Dateien werden nicht übernommen. Die Projektübersicht, diese Anleitung und der GitHub-Prüfablauf wurden für den öffentlichen Einstieg ergänzt.

## Struktur

| Verzeichnis | Inhalt |
| --- | --- |
| `pwa/` | Installierbare Web-App, Karten, Service Worker und öffentliche Referenzdaten |
| `wear/` | Native Wear-OS-App, Ressourcen und Android-Tests |
| `cloudflare/` | API-Relay, Routenadapter, verschlüsselte Übertragung und Push-Versand |
| `db/`, `drizzle/` | Datenbankmigrationen und Schema |
| `scripts/` | Import, Tests, nativer Build und Veröffentlichung |
| `tests/` | Web-/Server- und Python-Prüfungen |
| `docs/` | Architektur, Datenquellen, Lizenzen und Release-Dokumentation |

## Prüfen

Mit Node.js 22 und Python 3.12:

```sh
npm ci
npm test
python3 -m unittest discover -s tests -p '*test.py'
```

GitHub Actions führt diese Web-/Server- und Python-Tests sowie JavaScript-Syntaxprüfungen bei Push/PR auf `main` aus. Die Tests benötigen keine Produktionsschlüssel. Es werden weder neue Fahrplandaten heruntergeladen noch APKs automatisch signiert oder Produktionsversionen veröffentlicht. Der frühere Gradle-Debug-Ablauf wurde durch diesen aktuellen Prüfablauf ersetzt.

Die 119 nativen Android-Prüfungen des veröffentlichten 0.6.0-Builds sind separat in [docs/tests.md](tests.md) dokumentiert. Ein grüner Web-Prüflauf ersetzt keine native oder physische Geräteabnahme.

## Eigener Betrieb

Die laufende PWA bleibt unter https://foama-wien.endruuu.chatgpt.site/ erreichbar. Änderungen auf GitHub lösen dort keinen automatischen Deploy aus. Für eine eigene Site die Hosting-Projektzuordnung in `.openai/hosting.json` durch eine eigene ersetzen. Server, D1-/R2-Bindings und Migrationen nach [DEPLOYMENT.md](../DEPLOYMENT.md) einrichten. Produktive Zugangsdaten gehören ausschließlich in die jeweiligen Hosting-Secrets.

Die reine Oberfläche ersetzt den Server nicht: API-Relay, A-nach-B-Anbieteradapter, QR-Übertragung und Push benötigen die vorgesehenen Serverrouten. Details zu Kontingenten, sparsamem Abruf und festen Anbietern stehen in [Architektur](architecture.md) und [Routenplanung](journey-planning.md). Lizenz- und Quellenangaben für öffentliche Daten und Bibliotheken erhalten.

## Uhr-App bauen

Der primäre Build verwendet Java/Python und die Android-SDK-Kommandozeilentools. [Build-Anleitung](squashtap-build-adaptation.md) und `python3 scripts/build.py --help` erläutern Vorbereitung und Parameter. Legacy-Gradle-Dateien sind zusätzlich vorhanden, aber nicht der erprobte Release-Weg.

Originale Release-APKs werden mit einem privaten, hier nicht enthaltenen Signierschlüssel gebaut. Für eine eigene App eine eigene Paket-/Hostingkonfiguration und einen eigenen Schlüssel verwenden. Ein fremd signierter Build kann die bestehende öffentliche App nicht als Update ersetzen. Die öffentliche Installation und der Versionsfeed sind über [wear.html](https://foama-wien.endruuu.chatgpt.site/wear.html) erreichbar.

## Beiträge und Lizenz

Änderungen über Branch und Pull Request vorschlagen, passende Tests ausführen und Dokumentation/Release-Hinweise aktualisieren. Die enthaltene MIT-Lizenz gilt für den eigenen App-Code. Daten, Leaflet, ZXing, Firebase-Komponenten und Dienste behalten ihre jeweiligen Bedingungen; siehe [Lizenzen](licenses.md) und [Quellen](../LICENSE-SOURCES.md).
