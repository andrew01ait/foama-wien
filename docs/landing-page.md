# Willkommen bei Foama

Öffentliche Adresse: https://foama-wien.endruuu.chatgpt.site/willkommen.html. Stand PWA 0.11.5 / Wear 0.7.4.

## Besucherführung

Städtepanorama → App öffnen oder Installation → Fahrzeuge im Anflug mit gekennzeichnetem Stationsbeispiel → weitere konkrete Funktionen → Städtevergleich → gerätespezifische Installationshilfe → FAQ → erneuter App-Einstieg. Die Seite verwendet Original-Logo und vorhandene Städtecollage vollständig, das bestehende Farbschema und gut erreichbare Links. Die vier Stadtlinks öffnen den jeweiligen Vergleich mit ?stadt=.

## App und Installation

Die PWA bleibt unter ./ mit derselben Manifest-ID, start_url und scope. Bestehende installierte Apps starten im Monitor. Die Einladung über App teilen führt zu einer festen öffentlichen Willkommen-Adresse. Sie übernimmt weder die aktuelle URL noch Standort-/Favoritendaten oder QR-Fragmente.

welcome-page.mjs übernimmt die gespeicherte Themenwahl, bindet die vorhandene install.mjs-Komponente ein und registriert über HTTPS den bestehenden Service Worker. Ein nativer Installationsdialog wird nur angeboten, wenn der Browser beforeinstallprompt bereitstellt, und erst nach ausdrücklichem Klick geöffnet. Anleitungen bleiben als Fallback sichtbar. Es wird kein Konto angelegt, keine Standortberechtigung angefragt und kein Monitor-, Routen- oder Push-Dienst gestartet.

## Pflege

Wahrheitsgemäße Stadt-/Offline-/Wear-Grenzen aus STATUS.md und staedte.html übernehmen. Keine künftigen Karten-/Fahrzeugfunktionen vorab als verfügbar darstellen. Neue Versionen in Konfiguration, Feed, Quellen und Offline-Shell pflegen. Root-Monitor, QR-Sitzungen, Gerätespeicher und APK-Identität erhalten.

## Fahrzeuge im Anflug

Reguläre Funktion für 165 Wiener Linien: U-Bahn, Straßenbahn und Bus in Karte, Schema und Stationsausschnitt. Der eigene Bereich verlinkt direkt zur Anzeige und zur Erklärung im Städtevergleich; dort öffnet der Fragmentlink die passende FAQ. Die Illustration ist ausdrücklich ein Beispiel und fragt keine Live-Daten ab. Positionsschätzung aus Stationsprognosen sowie die Beschränkung auf die Smartphone-PWA/Wien werden erklärt; Graz, Linz und Salzburg erhalten keine unzutreffende Fahrzeugverfügbarkeit. Keine experimentelle Produktkennzeichnung. Neue Logoentwürfe bleiben bis zur Auswahl des Nutzers separate Vorschläge.
