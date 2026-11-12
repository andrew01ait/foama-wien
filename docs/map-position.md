# Aktueller Standort auf Karten

Ab PWA 0.11.11 zeigen alle interaktiven Karten denselben blauen Standortpunkt mit weißem Rand und transparentem Genauigkeitskreis, sofern ein frischer echter Gerätefix verfügbar ist. Das umfasst Nähe-/Stations-/Fußwegkarten, A-nach-B-Auswahl, Gesamtwege und einzelne Fußwege, Linienkarte sowie ganze und eingebettete Fahrzeugkarten. Schematische Linienbilder und exportierte Fahrplan-PDFs sind keine laufenden Standortkarten.

Der 44-px-Knopf unten rechts zentriert ausdrücklich auf den Standort. Normale Fix-Updates verändern weder Kartenausschnitt noch Zoom. Tooltip und Popup nennen die Genauigkeit; grobe Fixes über 150 m sind ausdrücklich ungefähr. Ein manueller Ausgangspunkt oder alter Routenstart wird nicht als aktueller Standort ausgegeben. Fehlende, ungültige, mehr als 90 Sekunden alte und widerrufene Fixes verschwinden. Der Zentrierknopf ist ohne aktuellen Fix deaktiviert.

## Daten und Lebenszyklus

`map-position.mjs` installiert einen einmaligen Leaflet-Map-Init-Hook über `ensureJourneyMap` bzw. den Monitor-Lader. Jede Karte hält eigene Darstellungs-Layer außerhalb der Route-/Fahrzeuggruppen; ein gemeinsamer Broker verwaltet den letzten Gerätefix ausschließlich im Arbeitsspeicher. Es gibt keinen Positionsverlauf, lokalen Export oder neue Position im Monitor-Relay.

Der Monitor veröffentlicht seine bestehenden Vordergrundfixes und markiert die Standortsteuerung während seines aktivierten Controllers (einschließlich Bewegungspause) als extern verwaltet: Die Kartenschicht startet dann keinen zweiten Watch und umgeht die Bewegungshilfe nicht. Ist der Monitor-Controller inaktiv, etwa beim direkten Öffnen einer Verbindung oder bei manuellem Ausgangspunkt, darf allein die geöffnete Karte einen bereits freigegebenen Gerätefix beziehen; die manuelle Stationsauswahl bleibt erhalten. Andere Kartenseiten prüfen zunächst die bestehende Browserfreigabe. Nur `granted` darf einen gemeinsamen Watch starten. Karten allein lösen keine neue Berechtigungsfrage aus; ohne Permissions-API gibt es keinen stillen Abfrageversuch. Eine bewusste GPS-Aktion im Reiseplaner kann ihren geprüften Fix sofort an die Kartenschicht übergeben.

Der Init-Hook wartet seit 0.11.15 mit whenReady auf die erste vollständig initialisierte Kartenansicht. Erst danach darf ein synchron gelieferter bestehender GPS-Fix Vektorpfade sortieren. Eine reale Leaflet-Probe mit synthetischem Fix prüft diesen Unterschied zur bisherigen reinen Adapterprüfung.

Ein Watch versorgt alle geöffneten Karten derselben Seite. Unsichtbare/geschlossene Karten melden sich ab, der letzte Abnehmer beendet den Watch und den Alterstimer. Hintergrund beendet beide; verspätete Berechtigungs-/GPS-Antworten sind generationsgebunden. Unload entfernt Layer, Beobachter und Bedienknopf. Positionsupdates ändern keine Haltestellenauswahl, Fahrtrichtung, geschätzte Fahrt-ID oder Routenendpunkte. Karte und Schema behalten ihren bisherigen Tracker.

## Abnahme

Automatisierte Prüfungen decken Freigabestatus, einen gemeinsamen Watch, Wiederverwendung des Monitor-Controllers, Genauigkeit/Alter, Fehler/Widerruf, Hintergrund/Schließen/Dispose und verspätete Antworten ab. Die Leaflet-Schicht wird mit Positionswechsel, unverändertem Ausschnitt und ausdrücklicher Zentrierung geprüft. Eine Browserprobe mit simuliertem Standort ist keine Messung am physischen Telefon.
