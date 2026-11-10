# Architektur und Datenflüsse

Aktueller Stand: PWA 0.8.2 / Wear 0.7.0. Die Clients verwalten ihre Favoriten unabhängig und teilen denselben Server für öffentliche Verkehrsdaten, zeitlich begrenzte verschlüsselte Übertragung und optionalen Push. [Projektstruktur](development.md) und [Konfiguration](configuration.md) ergänzen diese Übersicht.

## Bausteine

| Baustein | Verantwortung und Grenzen |
| --- | --- |
| PWA `pwa/src/app.mjs` | Nähe/Favoriten, Browser-Standort, sichtbare Aktualisierung und lokaler Speicher |
| PWA `journey-*` | A-nach-B-Suche, Adressen, Karten, Varianten und lokale zeitlose Routenfavoriten |
| Wear `MainActivity`, `Repo`, `JourneyStore` | Native Navigation, lokale Favoriten, importierte Routen und Vordergrund-Abfahrten |
| Gemeinsamer Monitor-Relay | Feste Wiener-Linien-Zieladresse, begrenzte RBL-Batches, Cache und Fehlerbehandlung |
| `journey-service.mjs` | Feste Transitous-Endpunkte, Eingabeprüfung, Geocoding und gemeinsame Abrufbudgets |
| `transfer-relay.mjs` + D1 | Zehnminütige QR-Sitzungen mit Ciphertext und gehashten Freigaben |
| `push-service.mjs` + D1 | Verschlüsselte technische Gerätefreigaben, minimale Linienfilter, Relevanz, Limits und Deduplizierung |
| `web-push.mjs`, `fcm.mjs` | Web Push bzw. optionales Firebase Cloud Messaging für die Uhr |
| `site/native-releases.mjs` + R2 | Nur erlaubte öffentliche APK-Dateinamen mit exakter Größe und SHA-256 |

Der frühere Durable-Object-Entwurf ist historisch. Der aktuelle QR-Dienst verwendet D1; er benötigt kein Durable Object.

## Einstellungen

Native HTML-Klappbereiche gliedern die bisherigen Bedienelemente in neun Themen. Aufklappen startet weder Ortung noch Abfragen oder Berechtigungsdialoge. Bestehende IDs, Ereignisbindungen und Speicherschlüssel bleiben erhalten. Debug Push ist ein direkter eigener Bereich; ausführliche Hilfen liegen beim jeweiligen Feld. Der Dialogkopf bleibt beim Scrollen sichtbar. App-Version steht zusätzlich im Kopf und unter App & Installation.

## Standort und Abfahrten

Die Clients fragen neue Abfahrten und Standortdaten nur bei sichtbarer App ab. Normaler Monitorabstand: 30 Sekunden. Die gemeinsame Monitorsteuerung priorisiert sichtbare Stationen und begrenzt die RBL-Auswahl auf 24 je gemeinsamem Intervall. PWA-Hauptansicht und Routenansicht teilen diese Begrenzung. Verlassen einer Ansicht verwirft verspätete Antworten; auf der Uhr werden laufende Requests und Standortlistener beendet.

Stadtprofile: Wien ist Standard, automatische Erkennung ausschließlich aus frischen Vordergrundfixes; manuelle Auswahl nur unter Einstellungen. Stadtwechsel verändert weder Favoriten noch Manifest-ID. Der regionale Relay verarbeitet ausschließlich bekannte öffentliche IFOPT-Stationen. Boards zählen im gemeinsamen 700-Abruf-Budget; kein GPS im Monitorrequest. [Stadtprofile](city-profiles.md).

Der unabhängige Wiener Fahrplan wird stationsweise aus versionierten komprimierten GTFS-Paketen geladen, mit Kalender-/Nachtfahrtenprüfung und lokalem Offlinecache. Frische API-Verbindungen haben Vorrang; reine Fahrplanabfahrten erzeugen keine Live-Lernbestätigung. [Fahrplanvertrag](timetable-fallback.md).

GPS bleibt auf dem Gerät und wird nicht für Monitoranfragen benötigt. Bewusst angeforderte Routen-/Adresssuche sowie präzise Gehwege übertragen die dafür nötigen Eingaben an den jeweiligen Dienst. Das Backend speichert keine Reise-, Adress- oder GPS-Historie; aggregierte Lastzähler begrenzen die Nutzung. Fehlende, grobe oder alte Daten dürfen keine sichere Erreichbarkeit suggerieren. LIVE und Fahrplan bleiben unterscheidbar.

Die PWA vergleicht aktuelle Live-Prognosen nur innerhalb der laufenden Seite anhand RBL, Linie, Richtung, Modus und geplanter Abfahrtszeit. Korrekturhinweise bleiben kurzlebige WeakMap-Metadaten und werden nicht exportiert oder an den Server gesendet. Fahrzeug-Barrierefreiheit stammt aus einem expliziten API-Boolean, einschließlich des dokumentierten Fahrzeug-Overrides. Details: [Abfahrtshinweise](departure-indicators.md).

Die optionale native Ultra-Sparfunktion reduziert unter 20 Prozent Akku nach Opt-in die Ortung auf Einzelfixes höchstens alle fünf Minuten, Abfahrten auf 90 Sekunden und Darstellung auf 30 Sekunden. Ab 25 Prozent erfolgt die Rückkehr zum normalen Modus mit Hinweis. Die Hintergrundregeln bleiben erhalten.

## Stationen und Routen

Der öffentliche Katalog verbindet offizielle Haltepunkte mit nachgewiesenen Linien. Reguläre Fahrgastfahrten aus GTFS und datierte Live-Bestätigungen werden getrennt von bloßen Fahrwegvarianten behandelt. Neue Live-Beobachtungen bestätigen Linien für 30 Tage; vollständige Prüfungen und Tageszeitabdeckung schützen vor falschem Entfernen durch bloße Datenlücken. [Metadatenprüfung](wiener-linien-metadata.md).

Vollständige Reiseplanung erfolgt nur auf bewusste Suche in der PWA. Zwei begrenzte Profilabfragen erlauben den Vergleich schnellster Wege und weniger Umstiege; beide zählen im gemeinsamen Budget von höchstens 700 Planungs-/Fußwegabrufen je konservativen 25 Stunden. Karten- und Variantenwechsel lösen keine neue Vollplanung aus. Favoriten speichern Linienwege und Umstiege, keine alten Fahrtzeiten oder Trip-IDs. Ein GPS-Endpunkt bleibt dynamisch, ohne gespeicherten Fix. Die Uhr zeigt aktuelle passende Etappenzeiten; ein gleicher Linienname ist keine garantierte konkrete Fahrt oder Anschlusszusage.

## Favoritenübertragung

QR-Sitzungen verwenden AES-GCM, zufällige getrennte Lese-/Schreibfreigaben und zehn Minuten Ablaufzeit. Der Schlüssel bleibt im QR-Fragment und im Client-Arbeitsspeicher. D1 erhält Ciphertext und gehashte Freigaben; nach bestätigter Übernahme wird der Inhalt entfernt. Importvorschau und bewusste Bestätigung bleiben erforderlich. Beide Geräte behalten eigene Listen. Dateiimport ist lokal. Adresslabels eigener Orte und alte GPS-/Fahrtinformationen werden nicht als dauerhafte Bewegungsdaten übertragen. [QR-Vertrag](qr-transfer.md).

## Störungshinweise

Eine einzelne stündliche Hintergrundaufgabe prüft die feste offizielle Quelle. Bei ohnehin laufenden sichtbaren Monitoraufrufen kommen Prüfungen ungefähr alle fünf Minuten dazu. Es gibt keine zusätzliche Hintergrund-Ortung oder Abfahrtsabfrage auf den Geräten. Der vorbereitete externe Fünf-Minuten-Timer ist nicht aktiv.

Die Favoritenauswahl umfasst Stationen, Linien sowie alle bekannten Ein-, Umstiegs- und Ausstiegsstationen gespeicherter Routen einschließlich Alternativen, höchstens 100 Stationen. Gespeichert werden minimale Referenzen statt eigener Routennamen, Adressen oder GPS. Nur bereits gültige passende Meldungen lösen gebündelte Hinweise aus; Aufzüge/Fahrtreppen sind immer ausgeschlossen. Quellenfehler senden keine Entwarnung. Endgerätefreigaben laufen ohne sichtbare Erneuerung nach spätestens 90 Tagen ab. Push ist auf Nutzerwunsch ausschließlich für die PWA vorgesehen; Firebase ist dafür nicht erforderlich. [Push-Vertrag](push-notifications.md).

## Veröffentlichungen

Interne Site-Quelle und öffentliches GitHub werden bewusst abgeglichen. Build-Ausgaben, produktive Secrets, private Signierschlüssel und reale Nutzerexporte gehören nicht in Git. Das Quell-ZIP enthält auch SQL-Migrationen, Drizzle-Konfiguration, CI und Bibliothekslizenzen. Die laufende Site, ein GitHub-Commit und eine signierte APK sind getrennte Veröffentlichungen mit jeweils eigener Prüfung. [Ablauf](../DEPLOYMENT.md), [Quellabgleich](github.md).

Frühere Architekturentscheidungen stehen im [Archiv](history/architecture-before-github.md); insbesondere alte Durable-Object- und Versionsangaben sind keine aktuelle Betriebsanleitung.
