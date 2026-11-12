# Eine Fahrzeug-Liniensitzung für alle Ansichten

PWA 0.11.21, 12.11.2026.

## Fehler und neues Verhalten

Die ganze Fahrzeugseite rief beim Eintritt in oder Verlassen von „Dein Halt“ und nach jeder Stationswahl erneut `setDirection` auf. Das löschte den Tracker, Bestätigungen, Auswahl und Countdown und ersetzte die Ganzlinienabfrage durch bis zu acht Nachbar-RBLs. Die Daten waren bereits vorhanden, wurden aber verworfen.

`setView` und `setStation` ändern jetzt Darstellung, Ausschnitt, URL und Abfragepriorität innerhalb derselben Sitzung. Die Karte behält ihren Ausschnitt; globale Fahrzeugauswahl und temporäre Fahrtkennungen bleiben erhalten. Die Prognosen für einen anderen bereits abgefragten Halt sind sofort nutzbar. Ein eigener neuer Tracker ist nur für tatsächlich andere Linien, Richtungen oder Streckenvarianten nötig. Eine echte längere Hintergrundpause respektiert weiterhin die Altersgrenzen.

## Abrufplanung

`vehicle-line-scope.mjs` teilt dieselbe geprüfte Strecke in maximal 24 RBL große Abschnitte mit zwei überlappenden RBLs. In den aktuellen 617 Varianten verwenden 53 genau zwei Abschnitte; alle anderen einen. Kurze Linien fragen stets alle Monitore gemeinsam ab, auch in „Dein Halt“.

Eine Stationswahl priorisiert den Abschnitt, der den gewählten Halt und möglichst viele seiner Nachbarhalte enthält. Er erhält die nächsten ein bis zwei benötigten Abfragetermine, danach rotieren die übrigen Abschnitte fair weiter. Jeder Termin läuft durch dasselbe globale 30-s-, Quellencache- und Backoff-Gate. Es entstehen weder parallele Zusatzabfragen noch ein zweiter Poller. Auch eine Prioritätsänderung während einer laufenden Anfrage verändert nicht deren abgesendete RBLs; die Antwort wird mit exakt diesen RBLs verarbeitet. Neue Priorität gilt für die nächsten regulären Termine.

## Datenalter und Bestätigung

Die Ganzliniensitzung verarbeitet nur die neuen Beobachtungen des tatsächlich abgefragten Abschnitts für die Zuordnung. Sie führt vergangene Prognosen nicht als neuen Gesamtstand erneut der Bestätigung zu. Quellstände werden je Abschnitt verglichen, und jeder Halt behält seinen eigenen Zeitstempel. Eine ältere, aber noch gültige neue Abschnittsantwort darf bisher unbekannte Prognosen liefern, ohne eine neuere Uhr oder neuere Anker zurückzusetzen. Wiederholte identische oder überlappende Quellstände zählen nie als zweiter Beleg für dieselbe Fahrt.

Nicht angefragte Halte sind keine fehlenden Meldungen. Ihre zugeordneten Fahrzeuge bleiben unter denselben Kennungen nutzbar, solange die eigenen Belege frisch genug sind. Eine tatsächlich fehlende Antwort auf einen abgefragten Halt setzt dessen Zuordnung aus. Ab 60 Sekunden werden Lagen eingefroren, nach 90 Sekunden ohne passende Zuordnung ausgeblendet. Prognosen und Abdeckung nennen nur noch frische Halte; ein neuer Abschnitt verjüngt keine alten Quellen. Ein API-Fehler kann weiterhin die Anzeige begrenzt einfrieren. Die Ganzlinienbeobachtung ist keine Behauptung ständig vollständiger Live-Abdeckung.

Seit 0.11.21 wird dieselbe kanonische Liniensitzung auch zwischen Verbindungsdetail, A nach B und eigenständiger Fahrzeugseite übernommen. `vehicle-session.mjs` speichert Checkpoints im lokalen Tab-Speicher, mit exakter Bindung an Fahrplanversion, Quellhash, Linie, Modus, Richtung und Variante. Der Checkpoint erhält ID-Zähler, Anker, Quellen-Deduplizierung, eigene Boardzeiten sowie Korrektur-/Ablaufzustände. Er wird direkt wiederhergestellt und nie als neue Live-Beobachtung abgespielt. Auch eine im Browser-Zurückcache erhaltene Seite übernimmt vor Fortsetzung neuere Daten der anderen Seite.

Eingebettete Bereiche verwenden die kanonische Strecke mit allen Fahrten; nur deren Darstellung wird auf das gewählte Ziel gefiltert. So können Kurzführungen keine unpassenden Ziele anzeigen, und die Sitzung bleibt mit der ganzen Linie kompatibel. Tatsächlich angefragte weitere Halte derselben Linie werden mitgespeichert. Der gemeinsame Panel-Abruf bleibt auf den sichtbaren Bereich beschränkt; kein zusätzlicher Panel-Poller. Die ganze Fahrzeugseite verarbeitet weiterhin die ganze Linie.

Der nächste Abruf einschließlich Backoff bleibt ebenfalls erhalten und wird vom neuen Poller bzw. gemeinsamen Monitor beachtet. Höchstens vier Tab-Sitzungen und 1,5 Millionen Zeichen; nach fünf Minuten ohne Nutzung verwerfen. Alte Quellen laufen unabhängig weiter nach 60/90 Sekunden aus. Keine Nutzerposition, Favoriten, Serverhistorie oder Exporte. Blockierter, voller, beschädigter oder unpassender Speicher führt zu einer normalen neuen Live-Sitzung statt eines Anzeigefehlers.

## Kleiner Fortschrittsbalken

Ein kleiner vierteiliger Balken auf allen Bildschirmgrößen ersetzt die nummerierten Datenkarten. Dazu erscheinen nur der aktuelle verständliche Status, eine kurze Erklärung und gegebenenfalls „Nächste Aktualisierung in … s“. Zum Beispiel „Abfahrten werden geladen“, „Fahrzeuge werden gesucht“ oder „Fahrzeugpositionen werden geprüft“. Keine Quellen-/Kandidaten-/Haltezähler und keine doppelte Stufenbeschreibung. Eigene Hinweise für Pause, Fehler, spätere Abfahrten und Fahrzeuge außerhalb des Ausschnitts. Der zugängliche Fortschrittsbalken beschreibt Datenbereitschaft; der Countdown nennt den nächsten Abruf, keinen garantierten Zeitpunkt für die erste Fahrzeugposition.

## Prüfschwerpunkte

Automatisierte Regressionen prüfen dieselben Tracker-/Pollerobjekte, Kennungen und Countdown nach wiederholten Karten-/Schema-/Stationswechseln, Ganzlinienumfang bei kurzen Strecken, Vorrang und faire Rotation langer Strecken, erhaltene andere Fahrzeuge, eigene Quellzeiten, unveränderte Antwortzuordnung bei einer Prioritätsänderung während eines Requests, keine zweite Bestätigung durch Cache-/Überlappungsantworten, gültige anders alte Abschnittsstände, tatsächlich fehlende Monitore und unabhängigen Ablauf. Der gemeinsame Broker fragt weiter keine neuen Standortfreigaben ab. Physische GPS- oder Fahrzeugzählung ist damit nicht nachgewiesen.


Die zusätzlichen Regressionen für 0.11.21 prüfen reale aufgezeichnete Busdaten beim Wechsel Panel → ganze Linie → neues Panel, gleiche IDs/Bestätigungen ohne erneuten Abruf, den ersten unbestätigten Stand ohne falsche Cachebestätigung, neuere Daten beim Zurückkehren, Quellalter, graue Übergangsphase/Ablauf, Varianten-/Quell-/Tabtrennung, Speicherfehler und übernommene Retry-Fristen. Browserprobe mit 29B/Paukerwerkstraße über die echte Verbindungsseite und „Ganze Linie“: bestätigter Gesamtstand im Stationspanel erkannt, anschließend vorhandene Fahrtkennungen 29B · 06 und 29B · 08 ohne neuen Initialisierungsdurchlauf auf der ganzen Linie dargestellt; ihrem Alter entsprechend grau. Keine physische Fahrzeugzählung.
