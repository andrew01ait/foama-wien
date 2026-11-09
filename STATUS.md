# Aktueller Projektstand

Stand: 9. November 2026. **PWA 0.6.7, Wear 0.6.1 / Code 21.** Verbindliche Versionen stehen in den PWA-/Wear-Konfigurationen und im Updatefeed. Frühere Details und Abnahmen bleiben in [Release-Verlauf](docs/release.md), [Tests](docs/tests.md) und [Status-Archiv](docs/history/STATUS-before-github.md) erhalten.

## PWA 0.6.7 · Störungs-Push · 09.11.2026

Standard-Web-Push ausschließlich für die PWA; kein eigenes Firebase-Projekt und kein neues Uhr-Release. Dauerhafte verschlüsselte D1-Outbox mit eindeutigem Geräte-/Ereignisschlüssel, atomaren Claims, höchstens vier Transportversuchen und Retry-After. Anbieterannahme bleibt endgültig, fehlende Browserbestätigung löst keine Wiederholung aus. IndexedDB-Gerätebindung und atomare Anzeige-Claims; vor Anzeige aktuelle Ereignisrelevanz, Opt-out, Ablauf, Nachtruhe und tatsächliche Fenstersichtbarkeit prüfen. Lautloser gemeinsamer Tag; eigener Zustellstatus für explizite Testnachrichten. Aufzüge/Fahrtreppen immer serverseitig ausgeschlossen, auch für alte Freigaben; gemischte echte Betriebsstörungen bleiben relevant. Geplantes erst ab Beginn. Bestehender stündlicher Check, aktive Fünf-Minuten-Ergänzung und lokale Daten erhalten. Native Wear 0.6.1/21 unverändert.

## PWA 0.6.6 · Meine Orte

Gespeicherte Orte erscheinen als kompakte Karten mit Name, Straße und ergänzender Ortsangabe. Zwei gleich breite A/B-Aktionen wählen Start oder Ziel; Bearbeiten und Entfernen sind im jeweiligen Ortsmenü erreichbar. Der gemeinsame Menücontroller schließt andere Menüs, reagiert auf Außenklick/Escape und hält die Bedienung getrennt von Hinweisklappen. Anlegen und Bearbeiten verwenden eine eigene Formularansicht mit Speichern/Abbrechen und Rückkehr zur Ortsliste. Abbrechen invalidiert laufende Adresssuchen und verändert keine gespeicherten Orte. Bestehende lokale Orte, physische Routenendpunkte und explizite Löschbestätigung bleiben erhalten.

## Routenübersicht aus 0.6.5

Start und Ziel stehen als A/B-Zeilen mit getrenntem Ortsnamen und Adresse. Eigene Routenbezeichnungen bleiben als kleinere Überschrift erhalten; automatisch aus Endpunkten erzeugte Namen werden nicht nochmals wiederholt. Ein- und Ausstiegsstation stehen weiterhin zusätzlich darunter. Zurück und Favoriten liegen in derselben Kopfzeile. Reise/Gesamtkarte ist der gemeinsame Karteneinstieg; Rückfahrt, Neuplanung und die bewusste Aktualisierung von Fußweg oder Standort teilen eine kompakte Aktionsreihe. Der Hinweis zum gespeicherten Weg trägt keine weitere große doppelte Routenüberschrift.

Abfahrtshinweise aus 0.6.4 bleiben erhalten: spätere Live-Prognosen neutral und kurzlebig, Rollstuhl-Symbol nur für ausdrücklich positiv gemeldete Fahrzeug-Barrierefreiheit. Native Wear 0.6.1/21 unverändert. [Datenregeln](docs/departure-indicators.md).

## Umgesetzt

| Bereich | Stand |
| --- | --- |
| Abfahrten | Nähe/Favoriten, sichtbare 30-s-Aktualisierung, bestätigte Stationslinien, Gehzeit und Erreichbarkeit |
| PWA-Favoriten | Ganze Stationen oder einzelne Linien/Richtungen, gemeinsame Stationskarten, Auswahl auch direkt aus der Standortkarte |
| A nach B | Adressen/GPS/Orte, Gesamt-/Abschnittskarten, Varianten, schnellste Wege/weniger Umstiege, Rückfahrt und lokale Routenfavoriten |
| Uhr-Routen | Import per Datei/QR mit Vorschau, aktuelle passende Etappenzeiten und Alternativen; Vollplanung bleibt in der PWA |
| Uhr-Favoriten 0.6.1 | Umschalter Routen/Stationen, gemerkte Auswahl; nach bestätigtem QR-Import direkt zur passenden Favoritenansicht |
| Updates/Akku | PWA-Updatehinweis; Uhr-Metadatenvorschau, eigene Downloadbestätigung, Fortschritt und optionaler Ultra-Sparmodus |
| Störungshinweise | PWA Web Push nach Gerätefreigabe, Stationen/Linien/Routen/Alternativen, ohne Aufzüge/Fahrtreppen und Geplantes erst ab Beginn |
| Veröffentlichung | Öffentliches GitHub mit CI und konsolidierter Dokumentation; Site und APK werden weiterhin separat veröffentlicht |

## Verifikation und Grenzen

Aktuell: 277 Web-/Server- und acht Python-Tests bestanden; schmale PWA-Darstellung, echte Fahrzeugangaben und bewusste Updateübernahme im Browser geprüft. Details und Grenzen: [Prüfprotokoll](docs/tests.md).

Der erste öffentliche GitHub-Import 0.6.0 umfasst 296 geprüfte Dateien; sein GitHub-Prüflauf war erfolgreich. Web-/Server- und Python-Prüfungen werden im jeweiligen aktuellen Commit automatisch ausgeführt. Für 0.6.1 sind 244 Web-/Server- und 124 native Prüfungen dokumentiert; Python-Suite: acht Prüfungen. Die aktuelle PWA ergänzt Layout, Abfahrtshinweise und eine dauerhafte Push-Warteschlange; die native APK 0.6.1 bleibt unverändert.

Die Störungsquelle wird im Hintergrund stündlich geprüft, bei ohnehin aktiver App ungefähr alle fünf Minuten zusätzlich. Kein Echtzeitversprechen. Serverlauf, Unit-Tests und providerseitige Annahme sind jeweils von tatsächlichem Geräteempfang zu unterscheiden.

## Offene Arbeiten

- Nutzerentscheidung: Push ausschließlich für die PWA; keine weitere Firebase-/Uhr-Push-Einrichtung. Die vorhandene native Vorbereitung bleibt deaktiviert.
- PWA-Push auf den Zieltelefonen nach Opt-in/Testnachricht tatsächlich abnehmen; relevante Störungen, Ruhezeit, Ablauf und Deaktivierung beobachten.
- Physische OnePlus-Abnahme von GPS, Kamera/QR, System-Dateiauswahl, Installer, Gesten und Akkuverhalten fortsetzen. Aus Tests keine gemessene Akkuersparnis ableiten.
- Einen engeren Hintergrundtakt erst mit tatsächlich betriebenem externem Timer anbieten; der vorbereitete Fünf-Minuten-Timer ist derzeit nicht gestartet.
- Ein vollständiger offline nutzbarer Wiener-Linien-Fahrplanfallback ist nicht Bestandteil dieses Releases. Der GTFS-Katalognachweis für Stationslinien ersetzt keine lokale Abfahrtsdatenbank.

Neue Arbeiten starten über die [Dokumentationsübersicht](docs/README.md). Interne Quelle, öffentliches GitHub und Source-Download nach dem [Abgleichverfahren](docs/github.md) zusammen pflegen.
