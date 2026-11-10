# Fahrplan als PDF · PWA 0.9.0

Im [Linienfahrplan](https://foama-wien.endruuu.chatgpt.site/fahrplan.html) stehen über der Stundentabelle zwei Downloads:

- **Tagesfahrplan als PDF:** gewählte Haltestelle, Richtung und Datum. „Alle Richtungen“ enthält die einzelnen Richtungen getrennt.
- **Ganze Linie als PDF:** alle bekannten Haltestellen der Linie alphabetisch und alle Richtungen am ausgewählten Datum. Die Datei kann entsprechend viele Seiten enthalten.

Echte PDF-Datei direkt auf dem Gerät, ohne Druckdialog oder externen PDF-Dienst. Bereits gespeicherte Fahrplanpakete funktionieren offline. Für noch nicht vorhandene Pakete ist zuerst Internet nötig. Fehlende Pakete erzeugen eine Fehlermeldung statt einer scheinbar vollständigen Linie. Andere Städte ohne eigenes Offlinepaket haben weiterhin keinen solchen Export.

Dateiname: YYYYMMDD_foama-wien_Fahrplan_LINIE_FAHRPLANTAG_HALTESTELLE.pdf. Der erste Datumsblock ist das Wiener Exportdatum; das zweite Datum ist der gewählte Fahrplantag. Ganze Linie endet mit ganze-Linie.pdf. Keine persönlichen Ortsnamen, Nutzerposition oder Favoriten werden exportiert.

A4, lesbare feste Standard-PDF-Schriften, Stunden/Minuten, volle Haltestellen-/Richtungsnamen, Gültigkeit, Europe/Vienna, Quelle CC BY 4.0, Exportzeit, Fahrplanversion und Seitenzahlen. Seitenumbrüche erhalten Stundenblöcke und kennzeichnen Fortsetzungen. Herbst-Doppelstunden bleiben durch MEZ/MESZ getrennt. Es bleiben Sollzeiten; keine Live-, Ausfall- oder Anschlussgarantie.

Implementation: pwa/src/timetable-pdf.mjs verwendet dieselbe lineDayDepartures-Kalenderberechnung wie die Tabelle. PDF-Standardfonts und WinAnsi; sämtliche ausgelieferten Stations- und Zielnamen geprüft. Unbekannte nicht darstellbare Zeichen werden mit einer verständlichen Meldung abgelehnt und niemals still durch Fragezeichen ersetzt. Keine neue Bibliothek, keine Serverroute und keine Hintergrundarbeit.
