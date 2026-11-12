# Dokumentation

Diese Übersicht gilt für interne Quellen und das öffentliche [GitHub-Repository](https://github.com/andrew01ait/foama-wien). Stand: 12. November 2026, PWA 0.11.15 / Wear 0.8.0.

| Frage | Maßgebliche Anleitung |
| --- | --- |
| Wo finden neue Nutzer einen Einstieg? | [Willkommen](https://foama-wien.endruuu.chatgpt.site/willkommen.html), [Seitenaufbau und Installation](landing-page.md) |
| Wie sehe ich Tagesfahrpläne und den Datenstand? | [Linienfahrpläne](https://foama-wien.endruuu.chatgpt.site/fahrplan.html), [Import und Aktualitätsprüfung](timetable-fallback.md), [PDF-Download](timetable-pdf.md) |
| Wie bleiben Fahrzeugdaten beim Seitenwechsel erhalten? | [Liniensitzung, Abrufplanung und Ladeanzeige](vehicle-line-session.md) |
| Warum erscheinen Fahrzeuge verzögert oder verschwinden? | [Untersuchung vom 12.11.2026](vehicle-audit-20261112.md) |
| Wie sehe ich geschätzte Fahrzeuge und horizontale Stationsausschnitte? | [Wiener Fahrzeugschätzung](vehicle-pilot.md) |
| Wo erscheint mein aktueller Standort? | [Gemeinsame Kartenposition](map-position.md) |
| Wie zeigt die Karte Linien und was folgt für Fahrzeugschätzungen? | [Geografische Linienkarte und B-Konzept](line-maps.md) |
| Was kann die App, was fehlt noch? | [Projektübersicht](../README.md), [Status](../STATUS.md) |
| Wie starte und prüfe ich den Code? | [Entwicklung](development.md) |
| Welche Teile und Datenflüsse gibt es? | [Architektur](architecture.md) |
| Welche Konfiguration wird benötigt? | [Konfiguration](configuration.md) |
| Wie werden Site und Updates veröffentlicht? | [Deployment](../DEPLOYMENT.md) |
| Wie bediene ich die neue Uhr-Oberfläche, Karten, Fahrzeuge und Tile? | [Uhr-Erlebnis 0.8.0](wear-experience.md) |
| Wie baue ich die native Uhr-App? | [Uhr-Build](squashtap-build-adaptation.md) |
| Wie bleiben GitHub und interne Quellen abgestimmt? | [GitHub und Quellabgleich](github.md) |
| Wie funktionieren Routen, QR und Push? | [Routenplanung](journey-planning.md), [QR-Übertragung](qr-transfer.md), [Push](push-notifications.md) |
| Wie werden Zeitkorrekturen und Fahrzeug-Barrierefreiheit gezeigt? | [Abfahrtshinweise](departure-indicators.md) |
| Wie funktionieren Fahrplan-Fallback und Städte? | [Wiener Fahrplan](timetable-fallback.md), [Stadtprofile](city-profiles.md), [ursprüngliche Recherche](multi-city-feasibility.md) |
| Was wurde tatsächlich geprüft? | [Prüfprotokoll](tests.md), [native Release-Protokolle](wear-os-release-0.8.0.md) |
| Welche Rechte gelten für Code und Daten? | [Lizenzen](licenses.md), [Quellen](../LICENSE-SOURCES.md) |

[Release-Verlauf](release.md) und [Changelog](../CHANGELOG.md) dokumentieren frühere Entscheidungen. Dateien unter `docs/history/` sind ausdrücklich archiviert; dortige Versionsnummern und Anweisungen beschreiben historische Stände. Für neue Arbeiten gelten die oben verlinkten aktuellen Anleitungen und die neueste passende Release-Abnahme.
