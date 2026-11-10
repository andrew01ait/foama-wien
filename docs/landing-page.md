# Willkommen bei Foama

Öffentliche Adresse: https://foama-wien.endruuu.chatgpt.site/willkommen.html. Stand PWA 0.8.3 / Wear 0.7.1.

## Besucherführung

Städtepanorama → App öffnen oder Installation → konkrete Funktionen → Städtevergleich → gerätespezifische Installationshilfe → FAQ → erneuter App-Einstieg. Die Seite verwendet Original-Logo und vorhandene Städtecollage vollständig, das bestehende Farbschema und gut erreichbare Links. Die vier Stadtlinks öffnen den jeweiligen Vergleich mit ?stadt=.

## App und Installation

Die PWA bleibt unter ./ mit derselben Manifest-ID, start_url und scope. Bestehende installierte Apps starten im Monitor. Die Einladung über App teilen führt zu einer festen öffentlichen Willkommen-Adresse. Sie übernimmt weder die aktuelle URL noch Standort-/Favoritendaten oder QR-Fragmente.

welcome-page.mjs übernimmt die gespeicherte Themenwahl, bindet die vorhandene install.mjs-Komponente ein und registriert über HTTPS den bestehenden Service Worker. Ein nativer Installationsdialog wird nur angeboten, wenn der Browser beforeinstallprompt bereitstellt, und erst nach ausdrücklichem Klick geöffnet. Anleitungen bleiben als Fallback sichtbar. Es wird kein Konto angelegt, keine Standortberechtigung angefragt und kein Monitor-, Routen- oder Push-Dienst gestartet.

## Pflege

Wahrheitsgemäße Stadt-/Offline-/Wear-Grenzen aus STATUS.md und staedte.html übernehmen. Keine künftigen Karten-/Fahrzeugfunktionen vorab als verfügbar darstellen. Neue Versionen in Konfiguration, Feed, Quellen und Offline-Shell pflegen. Root-Monitor, QR-Sitzungen, Gerätespeicher und APK-Identität erhalten.
