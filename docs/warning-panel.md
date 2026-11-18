# Einheitliche Warnmeldungen

PWA 0.11.22, 12.11.2026.

## Darstellung

`warning-panel.mjs` erzeugt den gemeinsamen Klappbereich für Monitorübersicht, Verbindungs-/Stationsdetails und A-nach-B-Reisen. Geschlossen: ein Warnsymbol, Titel, Meldungsanzahl, betroffene Linien und eine kurze Vorschau. Geöffnet: ruhiger Kopf und jede Meldung mit einer Linienkennzeichnung, eindeutigem Titel, Text, optionaler Stationszuordnung, Gültigkeit und tatsächlichem Quellenstand. Kopfvorschau und Kopf-Linienkennzeichen werden dann auch für assistive Technik ausgeblendet. Ein ausdrücklich belegter Linienpräfix vor dem Doppelpunkt wird aus dem Titel entfernt, wenn dieselbe Linie direkt daneben steht. Andere Titel bleiben unverändert. Ein Betreiberlink je Gruppe.

Aktuelle Warnungen erscheinen zentral über der Übersicht. Stations-/Favoritenkarten wiederholen dieselbe Warnung nicht. Im Verbindungsdetail stehen sie weiterhin vor den Abfahrten; in A nach B direkt nach Start und Ziel. Aufzüge/Fahrtreppen, geplante und weitere neutrale Hinweise bleiben separat verfügbar und erhöhen nicht die Zahl aktueller Warnungen. Der gleiche Baustein berücksichtigt schmale Ansichten sowie helles/dunkles Farbschema; native `details`-Bedienung und bisheriger Klappzustand bleiben erhalten.

## Gespeicherte A-nach-B-Wege

Vorher begann A nach B mit einem leeren lokalen Meldungsstand, obwohl der Monitor gültige Meldungen bereits gespeichert hatte. Bis zu einem eigenen passenden Abruf blieb die gespeicherte Route ohne Warnung; eine globale Abrufpause machte dies besonders sichtbar.

Beide Seiten nutzen jetzt `foama.traffic.v1`. Lesen/Schreiben/Wiederaufnahme erhalten die tatsächliche Quellzeit. Warnungen des gewählten Wegs erscheinen so bereits vor dessen erstem Abruf, soweit der passende Meldungsstand vorhanden ist. Erfolgreiche leere Records löschen alte Warnungen auch nach Rückkehr zu einer älteren Seite; neuere Records gewinnen bei der Fusion. Storage-Ereignisse übernehmen Änderungen aus einer anderen geöffneten Seite. Fremde Halte oder Linien, nicht unterstützte Stadtanbieter, abgelaufene/aufgelöste Ereignisse und neutrale Hinweise werden weiterhin ausgeschlossen.

Der sichtbare gemeinsame Monitor priorisiert aktuelle Einstiege und den offenen Fahrzeugbereich. Danach ergänzen Ein- und Ausstiegsanker aller ausgewählten Fahrtabschnitte den vorhandenen Request, maximal 24 RBLs insgesamt. Der bestehende 30-Sekunden-, Quellcache- und Fehlerpausenvertrag bleibt bestehen. Keine eigene Warnungsabfrage, kein Hintergrundpolling und keine neue Vollroutenplanung. Sehr umfangreiche Wege bleiben durch dieses harte Budget begrenzt; nicht bereits bekannte Abschnitte können erst nach einem passenden Abruf Warnungen liefern.

## Datenalter und Speicher

Höchstens 128 öffentliche RBL-Records und 1 MB JSON. Nur gültige Cache-Records und normalisierte Meldungen lesen. Nach 15 Minuten verwerfen; ab 90 Sekunden als älter kennzeichnen. Lesen und Wiederöffnen sind keine Bestätigung. Fehlgeschlagene oder unvollständige Quellen löschen keine gültige Meldung. Beschädigter, voller oder nicht verfügbarer lokaler Speicher verhindert die normale Live-Verarbeitung nicht. Kein Standort und keine Favoriten im Meldungsspeicher.

## Prüfung

489 Web-/Server-Tests, 18 Python-Prüfungen und 88 JavaScript-Syntaxprüfungen. Neue Tests prüfen den gespeicherten Weg mit übernommenem Monitorcache vor dem ersten eigenen Abruf, Quellenalter/Ablauf, leere Bestätigungen, Speicherfehler, weitere Fahrtabschnitte und einmalige Linienkennzeichnung. Die verwaltete lokale Browservorschau war durch einen anderen Site-Test belegt; sie wurde nicht beendet. Der abschließende öffentliche Browsercheck ist davon getrennt. Keine simulierten Meldungen werden produktiv veröffentlicht.
