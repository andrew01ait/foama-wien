# Entwicklung und Prüfungen

## Voraussetzungen

Die Web-/Serverprüfungen verwenden Node.js 22 und Python 3.12. `npm ci` installiert die in `package-lock.json` festgeschriebenen Entwicklungsabhängigkeiten, darunter esbuild und Drizzle. Die Python-Hilfsprogramme nutzen die Standardbibliothek. Der native Build benötigt zusätzlich Linux, Java/JDK 17, Android-Plattform 34, Build Tools 34.0.0 und die geprüften Maven-Abhängigkeiten; siehe [Uhr-Build](squashtap-build-adaptation.md).

## Verzeichnisstruktur

| Pfad | Verantwortung |
| --- | --- |
| `pwa/` | Smartphone-Oberfläche, Service Worker, Karten und öffentliche Referenzdaten |
| `pwa/src/` | UI, Standort, Favoriten, Reiseplanung, Warnungen und Push-Auswahl |
| `wear/app/` | Native Java-App, Android-Ressourcen und gebündelter Katalog |
| `wear/ui-test/` | Robolectric-Prüfungen für Android-Verhalten und Navigation |
| `cloudflare/src/` | Monitor-Relay, Routenadapter, QR-Relay und Push-Versand |
| `site/` | Sites-Worker-Adapter, lokale D1-Vorschau und APK-Auslieferung |
| `db/`, `drizzle/` | Schema und unveränderliche Datenbankmigrationen |
| `scripts/` | Katalogimport, Builds, Signaturprüfung und Quellpaket |
| `tests/` | Web-/Server-, Krypto-, Transfer- und Python-Prüfungen |
| `deploy/push-timer/` | Vorbereiteter externer Timer; nicht automatisch aktiv |

## Prüfen

```sh
npm ci
npm test
python3 -m unittest discover -s tests -p '*test.py'
```

`npm test` entspricht `node --test tests/*.test.mjs tests/test_*.mjs`. Die Tests verwenden kontrollierte Fixtures und benötigen keine Produktionsschlüssel. GitHub Actions nutzt dieselben Web-/Python-Befehle und prüft zusätzlich die JavaScript-Syntax. Native Prüfungen und physische Geräteabnahme sind getrennt; [docs/tests.md](tests.md) hält tatsächliche Ergebnisse fest.

## Site bauen und lokal ansehen

```sh
python3 scripts/package_source.py
python3 scripts/build_site.py
```

Der Site-Build benötigt die exakt zum Updatefeed passende signierte öffentliche APK unter `pwa/apk/`. Diese Datei wird aus Größe und SHA-256 geprüft und nicht im Git-Repository gespeichert. Eine frische Kopie des Repositories kann deshalb die Tests sofort ausführen, benötigt vor dem Site-Build aber diese zusätzliche Release-Datei. Wiederherstellung und eigene Releases beschreibt [DEPLOYMENT.md](../DEPLOYMENT.md).

Der Build schreibt `dist/server/index.js`. `npm run dev` startet den lokalen Vorschauadapter; er verwendet eine lokale D1-Abbildung und besitzt keine produktiven Push-Secrets oder dauerhaftes R2. In der verwalteten Sites-Umgebung stattdessen den bereitgestellten Vorschau-Daemon mit `sites-preview start <checkout>` verwenden. HTTP-Vorschau ist kein Nachweis für echte GPS-Freigabe, Push-Empfang oder die produktive Anbieter-Erreichbarkeit.

## Daten aktualisieren

Referenzdaten werden bewusst aktualisiert, nicht in jedem GitHub-Prüflauf. `scripts/prepare_stops.py` benötigt die offiziellen CSVs und einen passenden GTFS-Fahrplan; danach aktualisiert `scripts/sync_wear_assets.py` die Uhr-Assets. Herkunft, Abrufdatum und Lizenzen erhalten. Aus Fahrwegvarianten allein keine regulären Stationslinien ableiten. Details und Datenquellen stehen in [Deployment](../DEPLOYMENT.md) und [Metadatenprüfung](wiener-linien-metadata.md).

## Änderungen abschließen

Relevante Prüfungen ausführen, Verhalten in README/Status oder der passenden Fachseite dokumentieren und den [Quellabgleich](github.md) durchführen. Ein reiner Dokumentationswechsel benötigt keine neue App-Version und keine neu signierte APK. Änderungen an App-Assets oder nativem Verhalten erhalten dagegen eine passende neue Version und Abnahme. Keine Keys, Nutzerexporte, Gerätekennungen oder reale QR-/Push-Freigaben in Fixtures aufnehmen.
