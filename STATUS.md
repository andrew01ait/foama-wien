# Aktueller Projektstand

Stand: 10. November 2026. **PWA 0.8.2, Wear 0.7.1 / Code 23.** Verbindlich sind PWA-/Wear-Konfiguration und Updatefeed. Frühere Details: [Release-Verlauf](docs/release.md), [Tests](docs/tests.md).

## Was funktioniert?

| Bereich | Stand |
| --- | --- |
| Stadtprofile | Wien, Graz, Linz, Salzburg in PWA und nativer Uhr; Wien als Standard, frische Vordergrundortung oder manuelle Auswahl nur Einstellungen/Mehr → Stadtprofil |
| Abfahrten | Nähe/Favoriten, Filter, Gehzeit und Erreichbarkeit; sichtbare Aktualisierung alle 30 Sekunden mit gemeinsamen Budgets und Rücksicht auf Sichtbarkeit |
| Datenqualität | Wien/Wiener Linien, Graz/Transitous und Linz/EFA nach Datenlage live; Salzburg ausschließlich Fahrplan im Monitor |
| Favoriten/QR | Lokale Gerätefavoriten, Stationen und Linien, importierte Routen auf der Uhr je gewählter Stadt; stadtübergreifende Wege in allen betroffenen Profilen; Vorschau/bewusste Übernahme, zehn Minuten verschlüsselt; alte Uhren sperren regionale Auswahl weiter |
| A nach B | Vollplanung, Karten, Alternativen und Orte in der PWA; Uhr zeigt importierte Routen mit aktuellen passenden Linienzeiten |
| Tagesfahrpläne | 173 Wiener Linien, Heute zuerst, Datum/Haltestelle/Richtung, aktuelle Stunde farbig und ausdrückliche Offline-Sicherung einer ganzen Linie |
| Städtebild | Proportionale Collage Wien/Graz/Linz/Salzburg mit Bahn, Tram und Obus; Salzburg-Einschränkung im FAQ statt separatem Banner |
| Öffentliche Hilfe | [Städte & Funktionen](https://foama-wien.endruuu.chatgpt.site/staedte.html), mit Verfügbarkeitssymbolen und aufklappbaren FAQ; verlinkt in App-Einstellungen, Footer und Uhr-Webseite |
| Störungen | Wiener Daten; PWA Web Push nach Opt-in, keine Aufzug-/Fahrtreppen-Pushs; keine regionalen Störungsfeeds und kein aktiver nativer Push |
| Veröffentlichung | Öffentliches GitHub, Source-ZIP und Site getrennt abgleichen; Originalsignatur, Paket und lokale Daten erhalten |

## Fahrplanstand und Aktualität

1.695 Wiener Stationen und 173 Linien, gültig 09.11.–12.12.2026. Vollständige offizielle Quelle am 10.11.2026 um 09:47 Wiener Zeit per SHA-256 geprüft: unverändert zum Import. Serveränderungsdatum und ZIP-Dateistand 09.11.; kein ausdrücklich angegebenes Veröffentlichungsdatum. Die Fahrplanansicht unterscheidet diese Angaben, Import und gespeicherten Prüfstand.

Wöchentliche Quellenprüfung ab 16.11. montags; meldet neue Quellen, höchstens 14 Tage Restgültigkeit, Ablauf und anhaltende Prüfprobleme. **Noch kein automatischer Neuimport/Deploy.** Andere Städte haben kein eigenes Offline-Sollfahrplanpaket. Die native Uhr hält nur den begrenzten bisherigen Abfahrtencache, keine vollständigen Linienfahrpläne.

## Verifikation und Grenzen

315 Web-/Server- und zehn Python-Tests des bisherigen PWA-0.8.2-Stands bleiben dokumentiert. Der neue native Release ergänzt Stadtfilter für beide Routenlisten, dauerhaft erreichbare Hauptnavigation und genaue Wiederholungsplanung. Fehlerpausen bleiben je Stadt erhalten, die globale 30-Sekunden-Sperre gilt auch beim Wechseln. Aktuelle native Abnahme und signierte Metadaten: [Wear 0.7.1](docs/wear-os-release-0.7.1.md). Öffentliche Einzelproben aus der Buildumgebung lieferten Graz/Linz LIVE und Salzburg Fahrplan in jeweils rund sieben Sekunden; dies ist keine Laufzeitmessung auf der Uhr. Physische OnePlus-Abnahme bleibt separat.

Wiener Störungsquelle weiterhin stündlich im Hintergrund, bei ohnehin aktiver PWA ungefähr alle fünf Minuten ergänzend. Kein neuer externer Timer, keine Hintergrundortung oder Abfahrtsabfragen. Nutzer bestätigt Empfang einer PWA-Testnachricht; tatsächliche lokale Geräteanzeige und reale Störungszustellung weiter praktisch beobachten.

## Nächste Arbeiten

- Physisches Uhr-Update über bestehende Installation; GPS-Stadtwechsel, regionale Favoriten und QR auf OnePlus abnehmen.
- Wiener Fahrplan vor dem 13.12. erneuern; später automatischen Import-/Veröffentlichungsbetrieb ergänzen.
- [Linienkarte und Fahrzeugschätzungen](docs/line-maps.md): Daten/Machbarkeit geprüft, noch nicht umgesetzt.
- Regionale Störungsfeeds und unabhängige regionale Offlinepakete gesondert anbinden; nötige MVO-Registrierung/Lizenzannahme erfolgt nicht automatisch.

Neue Arbeiten starten über die [Dokumentationsübersicht](docs/README.md).
