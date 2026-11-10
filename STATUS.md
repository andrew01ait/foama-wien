# Aktueller Projektstand

Stand: 10. November 2026. **PWA 0.7.6, Wear 0.6.1 / Code 21.** Verbindliche Versionen stehen in den PWA-/Wear-Konfigurationen und im Updatefeed. Frühere Details und Abnahmen bleiben in [Release-Verlauf](docs/release.md), [Tests](docs/tests.md) und [Status-Archiv](docs/history/STATUS-before-github.md) erhalten.

## PWA 0.7.6 · Einstellungen nach Zweck gegliedert · 10.11.2026

Auf Nutzerfeedback sind tägliche Einstellungen und technische Werkzeuge sichtbar getrennt. Deine App: Darstellung, Stadtprofil, Standort & Gehzeit, Störungshinweise und Favoriten & Uhr. Technik & Diagnose: App & Installation, Fahrplandaten importieren, Debug Push und Debugging. Stadt und Farbschema sind unabhängige Einträge; sie haben keinen gemeinsamen Aufklappbereich mehr. Neun dezente Karten mit einheitlichen Vektorsymbolen, ruhigen Hintergründen und besser getrennten Abständen ersetzen die flache Liste. Technische Symbole sind zurückhaltend, Alltagssymbole mint. Alle bisherigen Optionen, IDs, Hilfen und Speicherformate bleiben erhalten. Push und native Wear 0.6.1/21 unverändert.

## PWA 0.7.5 · kompakte Einstellungen · 10.11.2026

Einstellungen zeigen acht anfangs geschlossene Themenbereiche: Darstellung & Stadt, Standort & Gehzeit, Störungsbenachrichtigungen, Favoriten & Uhr, App & Installation, Fahrplandaten importieren, Debug Push und Debugging. Ausführliche Erklärungen sind bei der jeweiligen Option aufklappbar. Der Dialogkopf mit Version und 44-px-Schließen bleibt beim Scrollen sichtbar. Alle bisherigen Eingaben, Aktionen, Links, Statusfelder und Erklärungstexte sind erhalten; keine Speicher-/Berechtigungsänderung. Stadtwahl bleibt ausschließlich in Einstellungen.

Debug Push ist direkt erreichbar und bündelt Testnachricht, Zustellstatus, letzten Dienstlauf und lokalen Anzeigetest. Der bestätigte Worker-Auftrag und die getrennten App-/Komponentenupdatehinweise aus 0.7.4 bleiben erhalten. Die physische lokale Benachrichtigungsanzeige am Zieltelefon muss weiter geprüft werden. Native Wear 0.6.1/21 und sämtliche Gerätefreigaben bleiben unverändert.

## PWA 0.7.4 · lokaler Anzeigetest und eindeutige Updatehinweise · 10.11.2026

Der Nutzer bestätigt den Empfang der echten Push-Testnachricht. Die lokale Probe läuft nun als bestätigter MessageChannel-Auftrag im aktiven Worker mit waitUntil statt als bloßer Anzeigeaufruf aus der Seite. Sie prüft vorhandene Freigabe und Browser-Auflistung, ersetzt nur ihre eigene vorige Testanzeige und meldet fehlende Unterstützung, Ablehnung oder ausbleibende Bestätigung im Debug-Bereich. Kein Transport, keine neue Freigabe, keine Änderung echter Störungsanzeigen; lautlos, Benachrichtigungsleiste beachten. Physische Anzeige der überarbeiteten lokalen Probe bleibt am Zieltelefon zu prüfen.

Ursache des scheinbar unveränderten Updates: Navigation lädt bereits neue Seiten aus dem Netz, während ein neuer Offline-/Push-Worker noch wartet. Ohne nachgewiesene neuere App-Version heißt der Hinweis deshalb Offline-/Push-Komponenten aktualisieren und nennt die laufende App-Version. Ein neues App-Release zeigt Ziel- und aktuelle Version; Worker-Ereignisse überschreiben diese Angabe nicht. Bewusste Aktualisierung bleibt erforderlich. 306 Web-/Server-Tests, zehn Python-Tests und 67 JavaScript-Syntaxprüfungen. Native Wear 0.6.1/21 unverändert.


## PWA 0.7.3 · automatische Ortung nach manueller Stadtwahl · 09.11.2026

Rückkehr von einem manuell gesetzten Stadtzentrum zu Automatisch prüft die vorhandene Standortberechtigung erneut und startet bei bereits erteilter Freigabe wieder die Vordergrundortung. Es wird keine neue Freigabe angefordert. Eine noch laufende Berechtigungsprüfung darf einen späteren ausdrücklichen Stopp nicht aufheben. Schnelle manuelle Profilwechsel verwerfen überholte Katalogantworten, bevor diese die Position verändern. Vier Regressionen ergänzen insgesamt 301 Web-/Server-Tests; zehn Python-Prüfungen und 67 JavaScript-Syntaxprüfungen. Native 0.6.1/21 unverändert.


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

Aktuell: 306 Web-/Server- und zehn Python-Tests bestanden; schmale PWA-Darstellung, echte Fahrzeugangaben und bewusste Updateübernahme im Browser geprüft. Details und Grenzen: [Prüfprotokoll](docs/tests.md).

Der erste öffentliche GitHub-Import 0.6.0 umfasst 296 geprüfte Dateien; sein GitHub-Prüflauf war erfolgreich. Web-/Server- und Python-Prüfungen werden im jeweiligen aktuellen Commit automatisch ausgeführt. Für 0.6.1 sind 244 Web-/Server- und 124 native Prüfungen dokumentiert; Python-Suite: acht Prüfungen. Die aktuelle PWA ergänzt Fahrplan-Fallback, Stadtprofile und Push-Diagnose; die native APK 0.6.1 bleibt unverändert.

Die Störungsquelle wird im Hintergrund stündlich geprüft, bei ohnehin aktiver App ungefähr alle fünf Minuten zusätzlich. Kein Echtzeitversprechen. Serverlauf, Unit-Tests und providerseitige Annahme sind jeweils von tatsächlichem Geräteempfang zu unterscheiden.

## Stadtprofile und Fahrplan

Wien als Standard, automatische genaue Vordergrundortung und manuelle Auswahl ausschließlich in Einstellungen. Graz (967 Stationen), Linz (674) und Salzburg (539) sind in derselben PWA eingebunden. Graz/Transitous und Linz/EFA liefern Echtzeit nach Datenlage; Salzburg zeigt zunächst ausschließlich Sollzeiten. Bestehende Wiener Favoriten bleiben gespeichert. Details: [Stadtprofile](docs/city-profiles.md).

Unabhängiger Wiener GTFS-Fallback mit 1.695 Stationen und Daten bis 12.12.2026. Kalender, Ausnahmen, Nachtfahrten, Endstationen, Sommerzeit und kalenderversionierte Pakete; Nähe, Favoriten, Vollbild und Reiseetappen nutzen dieselben Zeiten. Abgerufene Pakete funktionieren offline. Kein automatischer Neuimport/Deploy; andere Städte verwenden zunächst Anbieter-Boards. [Fahrplan](docs/timetable-fallback.md).

## Offene Arbeiten

- Nutzerentscheidung: Push ausschließlich für die PWA; keine weitere Firebase-/Uhr-Push-Einrichtung. Die vorhandene native Vorbereitung bleibt deaktiviert.
- PWA-Push auf den Zieltelefonen nach Opt-in/Testnachricht tatsächlich abnehmen; relevante Störungen, Ruhezeit, Ablauf und Deaktivierung beobachten.
- Physische OnePlus-Abnahme von GPS, Kamera/QR, System-Dateiauswahl, Installer, Gesten und Akkuverhalten fortsetzen. Aus Tests keine gemessene Akkuersparnis ableiten.
- Einen engeren Hintergrundtakt erst mit tatsächlich betriebenem externem Timer anbieten; der vorbereitete Fünf-Minuten-Timer ist derzeit nicht gestartet.
- Wiener Fahrplan vor dem 13.12.2026 erneuern; automatischen Import-/Veröffentlichungsbetrieb ergänzen. Direkter MVO-Import für regionale Offlinepakete benötigt weiterhin Betreiberregistrierung und manuelle Lizenzannahme.
- Regionalen Störungsfeed, amtliche Adressen und später die native Mehrstädte-Unterstützung getrennt ausbauen.

Neue Arbeiten starten über die [Dokumentationsübersicht](docs/README.md). Interne Quelle, öffentliches GitHub und Source-Download nach dem [Abgleichverfahren](docs/github.md) zusammen pflegen.
