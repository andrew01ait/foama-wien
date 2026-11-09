# foama-wien – Bearbeitungsleitlinien für Entwicklungsagenten

1. Niemals Live-Abfahrten erfinden oder Sollfahrplan als „Live“ markieren.
2. In der Ansicht „In der Nähe“ Haltestellen **gruppiert und auf-/zuklappbar**; in Favoriten **direkte Einzel-Einträge**. Keine unbemerkten UX-Regressionen.
3. Standard: Radius 300 m, Gehgeschwindigkeit 4,5 km/h, Reserve 1 min, 30 s Live-Refresh, 40 m Standortbewegung.
4. Abfahrts-API-Fair-Use beachten: ausschließlich angezeigte Haltepunkte, max. 24 RBL pro Aufruf, min. 30 s zwischen WL-Requests. Gleiche Site-Origin bevorzugen, direkte Diagnose separat; bei Blockade klar kennzeichnen, nicht umgehen.
5. Keine Standort-/HTTP-Hintergrundarbeit; GPS nur sichtbar/resumed und notwendige Updates. Browser-Geolocation ist kein garantierter reiner Bewegungssensor.
6. Kontakt zu externem Routingdienst erst nach ausdrücklichem Opt-in oder Nutzeraktion „Karte öffnen“, Koordinatenübertragung verständlich erklären.
7. Favoriten/Settings ohne Konto lokal; QR via WebCrypto AES-256-GCM, Schlüssel niemals an Server, zehn Minuten TTL, einmalige Nutzung.
8. Quelle Stadt Wien/Wiener Linien, ÖBB und OpenStreetMap nennen. Lizenzdateien nicht entfernen.
9. APK-Signierung: keine Keystores in Repository, keine stillen Installationen. Derselbe Paketname und Signing-Key für Updates.
10. Jedes Feature braucht Tests, README-/Deployment-/Architektur-/Flow-/Changelog-Pflege. Vor öffentlichen Releases gegen echte Endgeräte und echte API testen.

## PWA-Veröffentlichung v0.1.4

Für PWA-Aufgaben die vorhandene ChatGPT-Site aus `.openai/hosting.json` erhalten. Öffentliche URL: https://foama-wien.endruuu.chatgpt.site. Worker-Ausgabe aus den bestehenden PWA-Dateien mit `python3 scripts/build_site.py`; maßgeblich `DEPLOYMENT.md`. Diagnose, Logexport und Service-Worker-Assets bei Änderungen erhalten. Wear-Build bleibt ein separater, noch offener Arbeitsstrang.

Standort-Erstfreigabe muss unmittelbar durch eine sichtbare Nutzeraktion ausgelöst werden. Bereits erteilte Freigabe nur bei sichtbarer App fortsetzen; Fehlergrund erklären. Navigation im Seitenfluss behalten, damit Host-Overlays sie nicht verdecken. Der gebündelte offizielle Katalog und die eigene feste API-Relay-Route müssen bei Updates erhalten bleiben. Keine GPS-Koordinaten im Relay oder Diagnoseexport.

## v0.1.4 erhalten

Verkehrsmittel-Klappzustand und bestehende Settings/Favoriten-Schlüssel erhalten. Nur nachgewiesen passende Stationen in „In der Nähe“; Bahnsteige nach bestätigten Verkehrsmitteln filtern. Station-Suffixe U/S sind keine Liniennachweise. Offline-Linien und öffentlicher Straßenindex bleiben erhalten. Nutzerpositionen niemals in den Straßenindex, Relay oder Diagnoseexport schreiben.

Grobe Standorte nicht pauschal bei ±150 m verwerfen. Alter/Genauigkeit bei jedem Fix erneuern, auch unter 40 m Bewegung; veraltete/grobe/unterwegs liegende Positionen und fehlgeschlagene API-Abrufe erlauben keine grüne Geh-Ampel. Im Hintergrund keine neue Arbeit. Google Maps erst durch externen Link auf Nutzeraktion; aktuelle Telefonposition nicht durch eine veraltete Origin überschreiben. Manifest-Adresse und App-ID stabil halten; keine sofortigen Android-Launcher-Updates versprechen.

## v0.1.5

Nachtlinienfarbe über die gemeinsame Linienkachel mit N-Präfix erhalten. Stationsadresse bleibt als ungefähr gekennzeichnet und wird lokal aus öffentlichen Referenzdaten ermittelt; keine Hausnummern oder exakten Stations-Postadressen erfinden.

## Nutzerentscheidung ab v0.1.5

Der Nutzer hat die bisherige eigenständige Wiener-Linien-API-Testoberfläche ausdrücklich abgewählt. Sie nicht wieder in die Hauptoberfläche aufnehmen. Fehlerprotokoll stattdessen standardmäßig geschlossen unter Einstellungen → Debugging; neue Logs ausschließlich Whitelist ohne GPS, StopIDs, Stationsnamen, Favoriten, Berechtigungen, URLs oder Rohantworten. Alte Diagnose-Links bleiben nur als Umzugshinweis erhalten. Diese aktuelle Nutzerentscheidung ersetzt ältere Erhaltungsregeln zur Testoberfläche.

Nachtlinien dunkelblau; allgemeine Karte und Listenansicht teilen Filter. Leaflet lokal gebündelt halten. Betriebsmeldungen zeigen Quelle, Gültigkeit und Linien-/Stationsbezug; keine Entwarnung bei Fehlern, keine fremden Liftstörungen nur wegen gleicher Linie. Ganze Stationsfavoriten haben Erreichbarkeit je Verbindung. Anschließend auf Nutzerwunsch ein reduziertes Wear-OS-Design starten; eine APK erst nach tatsächlichem Build/Signaturprüfung als geliefert bezeichnen.

## v0.1.6 – Bewegungshilfe

Option standardmäßig aus. Niemals Ruhe des Beschleunigungssensors allein als gesicherten Stillstand werten. Frische genaue Standortbestätigung und Kontrollversuch spätestens nach 60 Sekunden erhalten; bei erkannter Bewegung sofort Ortung wiederaufnehmen. Sensorfehler/grober Empfang behalten normale Ortung. Sensor, Watches und Timer bei Hintergrund/manuellem Standort stoppen; kein Sensor-/Positionsverlauf in Speicherung, Logs oder Netzwerk. Keine gemessene Akkuersparnis oder getestete physische Fahrt ohne Gerätenachweis behaupten. Siehe docs/motion-battery-saving.md.

## v0.1.7 – Favoriten und Meldungen

Haltestellengebundene Kurzmeldungen nicht über deren ganze Linie verbreiten. Relevanz auch gegen vorhandenen Cache prüfen. Nur passende identische/kurze Standardmeldungen vereinigen; andere Richtungen, Zeiträume, individuelle Aufzüge und Zusatzinformationen nicht entfernen. Bei gleicher ID ausführliche Monitorquelle vor Feed-Zusammenfassung erhalten.

Entfernungssortierung als Ansicht berechnen, niemals die gespeicherte manuelle Favoritenreihenfolge überschreiben. Lösch-/Verschiebeaktionen verwenden weiterhin den ursprünglichen gespeicherten Index. API-Priorität folgt derselben sichtbaren Favoritenordnung; bei mehr als 24 eindeutigen RBL 16 vordere plus acht rotierende, keine Zusatzrequests oder Hintergrundarbeit. Karte speichert nur ausdrückliche Stationsauswahl und verhindert Duplikate. Alte Symbolhilfe nicht wieder einbauen.

## UI-Präferenz ab v0.1.8

Der Nutzer bevorzugt direkt sichtbare Umschaltknöpfe für Moduswechsel, keine Dropdowns. Für die beiden Favoriten-Sortiermodi Button-Gruppe mit klarer aktiver Auswahl, aria-pressed und mindestens 44-px-Tippfläche erhalten.

## UI-Präferenz ab v0.1.9

Stationskarten ohne großes Personen-/Geh-Emoji. Statt schwebendem Abfahrten-Pill eine vollbreite klar erkennbare Aufklappzeile erhalten. Nutzer bevorzugt große Haupt-Abfahrtszahlen: gleicher 28-px-Wert in Vorschau, Abfahrtsliste und Favoriten, nicht durch ältere CSS-Regeln für schmale Displays verkleinern. Zweite Abfahrt darf kleiner bleiben.

## v0.1.10 – Standortanzeige

Standortstatus ausschließlich in der Karte Dein Standort anzeigen, nicht zusätzlich als obere Bannerzeile. Genauigkeit, Alter, Akkupause, unterwegs, manuell und Fehler dort erklären. Oberen Statusbereich für Daten-/Startfehler erhalten; bei API-Backoff keine reguläre 30-s-Aktualisierung behaupten.

## v0.1.11 – Kompakte Favoriten

Große Abfahrtszahlen nicht durch überhöhte Mindestzeilenhöhen erkaufen. Stationsfavoriten: 44-px-Mindestzeile, fünf Pixel Gruppengap; lange Richtungen dürfen natürlich umbrechen. Hauptzahl weiterhin 28 px.

## v0.1.12 – Farbschema

PWA-System/Hell/Dunkel als direkte Buttons erhalten; Theme lokal speichern, Systemänderungen ohne Polling verfolgen. Offizielle Linienfarben bleiben themenunabhängig. Helle Ansichten müssen lesbare Formulare, Menüs, Meldungen und Abfahrtszahlen behalten. Uhr weiterhin auf wenige Kernaufgaben und schwarzem Hintergrund ausrichten; keine ungeprüfte APK behaupten.

Aktueller Stand: PWA 0.1.12 mit Theme-System/Hell/Dunkel; native Wear 0.2.0 signiert gebaut (26 Android-Tests). Maßgeblich AGENTS.md und docs/wear-os-release-0.2.0.md. Originalsignatur für Updates bewahren, private Wiederherstellungsdaten niemals veröffentlichen.

PWA 0.1.13: feste Zeitspalten und direkte gegenseitige App-Verknüpfung; native APK bleibt 0.2.0.
