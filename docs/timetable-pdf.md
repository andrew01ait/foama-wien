# Fahrplan als PDF · PWA 0.9.3

Im [Linienfahrplan](https://foama-wien.endruuu.chatgpt.site/fahrplan.html) stehen über der Stundentabelle zwei Downloads:

- **Tagesfahrplan als PDF:** gewählte Haltestelle, Richtung und Datum. „Alle Richtungen“ enthält die einzelnen Richtungen getrennt.
- **Ganze Linie als PDF:** alle bekannten Haltestellen der Linie alphabetisch und alle Richtungen am ausgewählten Datum. Die Datei kann entsprechend viele Seiten enthalten.

Karten und Haltestellenfolge stehen vor den Fahrplantabellen. Je am gewählten Datum aktiver Streckenvariante eine Karte mit nummerierten Halten in tatsächlicher Fahrtfolge. Im Tagesexport nur Varianten, die an der gewählten Station in die gewählte Richtung fahren; bei Alle Richtungen entsprechend beide Richtungen. Ganze Linie enthält auch Kurzführungen und abweichende Fahrwege. Die ausgewählte Station ist mint markiert. Lange Haltestellenlisten laufen auf Folgeseiten weiter. Links öffnen die passende interaktive Variante und die Kartenquelle.

Straßenkartenhintergrund für PDFs: [basemap.at Standard](https://basemap.at/standard/), [Nutzung und Lizenz](https://basemap.at/), CC BY 4.0. Ein gemeinsamer geografischer Ausschnitt pro Export wird einmal geladen und als JPEG in allen Variantenkarten wiederverwendet. Maximal 32 Kacheln, vier gleichzeitige Requests, 15 Sekunden Zeitgrenze; kein Vorabladen und kein zusätzlicher Serverdienst. Die auf der interaktiven Karte verwendeten OSM-Community-Kacheln werden nicht für PDF-Downloads geladen. Ohne Internet oder bei Kartenfehler enthält das PDF den tatsächlichen geografischen Linienverlauf und Haltepunkte auf neutralem Hintergrund, deutlich gekennzeichnet. Keine erfundene Straßenkarte. Das Offline-Speichern einer Linie sichert Fahrplan und Geometrie; bereits früher gespeicherte reine Fahrplandaten benötigen den Linienverlauf einmal zusätzlich.

Echte PDF-Datei direkt auf dem Gerät, ohne Druckdialog oder externen PDF-Dienst. Bereits gespeicherte Fahrplanpakete funktionieren offline. Für noch nicht vorhandene Pakete ist zuerst Internet nötig. Fehlende Pakete erzeugen eine Fehlermeldung statt einer scheinbar vollständigen Linie. Andere Städte ohne eigenes Offlinepaket haben weiterhin keinen solchen Export.

Dateiname: YYYYMMDD_foama-wien_Fahrplan_LINIE_FAHRPLANTAG_HALTESTELLE.pdf. Der erste Datumsblock ist das Wiener Exportdatum; das zweite Datum ist der gewählte Fahrplantag. Ganze Linie endet mit ganze-Linie.pdf. Keine persönlichen Ortsnamen, Nutzerposition oder Favoriten werden exportiert.

A4, lesbare feste Standard-PDF-Schriften, Stunden/Minuten, volle Haltestellen-/Richtungsnamen, Gültigkeit, Europe/Vienna, Quelle CC BY 4.0, Exportzeit, Fahrplanversion und Seitenzahlen. Seitenumbrüche erhalten Stundenblöcke und kennzeichnen Fortsetzungen. Herbst-Doppelstunden bleiben durch MEZ/MESZ getrennt. Es bleiben Sollzeiten; keine Live-, Ausfall- oder Anschlussgarantie.

Implementation: pwa/src/timetable-pdf.mjs verwendet dieselbe lineDayDepartures-Kalenderberechnung wie die Tabelle. PDF-Standardfonts und WinAnsi; sämtliche ausgelieferten Stations- und Zielnamen geprüft. Unbekannte nicht darstellbare Zeichen werden mit einer verständlichen Meldung abgelehnt und niemals still durch Fragezeichen ersetzt. Der Helfer timetable-pdf-map.mjs filtert Kalender/Station/Richtung, projiziert Geodaten nach Web-Mercator und erstellt einen begrenzten Kartenhintergrund im Browser. PDF-Bildobjekte verwenden ASCIIHexDecode/DCTDecode, Quellenlinks echte PDF-Linkannotationen; Xref-Offsets bleiben bytegenau. Keine neue Bibliothek, keine Serverroute und keine Hintergrundarbeit.

Die vollständigen Angaben Datenstand & Aktualität stehen als anfangs geschlossene Fußnote unter den Fahrplaninhalten. Sie behalten Quelle, Import, Gültigkeit und letzte Prüfung getrennt.
