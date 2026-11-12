# Eine Fahrzeug-Liniensitzung für alle Ansichten

PWA 0.11.19, 12.11.2026.

## Fehler und neues Verhalten

Die ganze Fahrzeugseite rief beim Eintritt in oder Verlassen von „Dein Halt“ und nach jeder Stationswahl erneut `setDirection` auf. Das löschte den Tracker, Bestätigungen, Auswahl und Countdown und ersetzte die Ganzlinienabfrage durch bis zu acht Nachbar-RBLs. Die Daten waren bereits vorhanden, wurden aber verworfen.

`setView` und `setStation` ändern jetzt Darstellung, Ausschnitt, URL und Abfragepriorität innerhalb derselben Sitzung. Die Karte behält ihren Ausschnitt; globale Fahrzeugauswahl und temporäre Fahrtkennungen bleiben erhalten. Die Prognosen für einen anderen bereits abgefragten Halt sind sofort nutzbar. Ein eigener neuer Tracker ist nur für tatsächlich andere Linien, Richtungen oder Streckenvarianten nötig. Eine echte längere Hintergrundpause respektiert weiterhin die Altersgrenzen.

## Abrufplanung

`vehicle-line-scope.mjs` teilt dieselbe geprüfte Strecke in maximal 24 RBL große Abschnitte mit zwei überlappenden RBLs. In den aktuellen 617 Varianten verwenden 53 genau zwei Abschnitte; alle anderen einen. Kurze Linien fragen stets alle Monitore gemeinsam ab, auch in „Dein Halt“.

Eine Stationswahl priorisiert den Abschnitt, der den gewählten Halt und möglichst viele seiner Nachbarhalte enthält. Er erhält die nächsten ein bis zwei benötigten Abfragetermine, danach rotieren die übrigen Abschnitte fair weiter. Jeder Termin läuft durch dasselbe globale 30-s-, Quellencache- und Backoff-Gate. Es entstehen weder parallele Zusatzabfragen noch ein zweiter Poller. Auch eine Prioritätsänderung während einer laufenden Anfrage verändert nicht deren abgesendete RBLs; die Antwort wird mit exakt diesen RBLs verarbeitet. Neue Priorität gilt für die nächsten regulären Termine.

## Datenalter und Bestätigung

Die Ganzliniensitzung verarbeitet nur die neuen Beobachtungen des tatsächlich abgefragten Abschnitts für die Zuordnung. Sie führt vergangene Prognosen nicht als neuen Gesamtstand erneut der Bestätigung zu. Quellstände werden je Abschnitt verglichen, und jeder Halt behält seinen eigenen Zeitstempel. Eine ältere, aber noch gültige neue Abschnittsantwort darf bisher unbekannte Prognosen liefern, ohne eine neuere Uhr oder neuere Anker zurückzusetzen. Wiederholte identische oder überlappende Quellstände zählen nie als zweiter Beleg für dieselbe Fahrt.

Nicht angefragte Halte sind keine fehlenden Meldungen. Ihre zugeordneten Fahrzeuge bleiben unter denselben Kennungen nutzbar, solange die eigenen Belege frisch genug sind. Eine tatsächlich fehlende Antwort auf einen abgefragten Halt setzt dessen Zuordnung aus. Ab 60 Sekunden werden Lagen eingefroren, nach 90 Sekunden ohne passende Zuordnung ausgeblendet. Prognosen und Abdeckung nennen nur noch frische Halte; ein neuer Abschnitt verjüngt keine alten Quellen. Ein API-Fehler kann weiterhin die Anzeige begrenzt einfrieren. Die Ganzlinienbeobachtung ist keine Behauptung ständig vollständiger Live-Abdeckung.

Eingebettete Stations-/A-nach-B-Bereiche behalten ihre gemeinsame sichtbare Monitorabfrage. Die neue Ganzliniensitzung betrifft die eigenständige Fahrzeugseite; der Wechsel Karte/Schema in eingebetteten Bereichen bewahrte den Tracker bereits.

## Kleiner Fortschrittsbalken

Bei höchstens 620 px Bildschirmbreite oder 540 px Komponenteninnenbreite ersetzen vier sechs Pixel hohe Segmente die nummerierten Datenkarten und den Schrittzähler. Mint bedeutet abgeschlossen, Amber aktiv. Aktueller Schritt, Grund und Abruf-Countdown bleiben lesbar. Große Ansichten behalten die vier vollständigen Karten. Der Fortschritt verwendet semantische `progressbar`-Werte und eine lesbare Stufenbeschreibung. Er zeigt Datenbereitschaft, keine garantierte Ladezeit oder Fahrzeuganzahl.

## Prüfschwerpunkte

Automatisierte Regressionen prüfen dieselben Tracker-/Pollerobjekte, Kennungen und Countdown nach wiederholten Karten-/Schema-/Stationswechseln, Ganzlinienumfang bei kurzen Strecken, Vorrang und faire Rotation langer Strecken, erhaltene andere Fahrzeuge, eigene Quellzeiten, unveränderte Antwortzuordnung bei einer Prioritätsänderung während eines Requests, keine zweite Bestätigung durch Cache-/Überlappungsantworten, gültige anders alte Abschnittsstände, tatsächlich fehlende Monitore und unabhängigen Ablauf. Der gemeinsame Broker fragt weiter keine neuen Standortfreigaben ab. Physische GPS- oder Fahrzeugzählung ist damit nicht nachgewiesen.
