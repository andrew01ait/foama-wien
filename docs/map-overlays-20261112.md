# Kartenebenen: Diagnose und Reparatur vom 12.11.2026

PWA 0.11.18. Betroffenes Nutzerbild: Stationsausschnitt der 29B Richtung Floridsdorf, OSM-Hintergrund sichtbar, Status mit einer geschätzten Lage, aber keine Linie, Halte, Fahrzeuge oder eigene Position. Gleichzeitig erschien „Karte gerade nicht verfügbar“.

## Ursache

Die Karte war teilweise erzeugt. `vehicle-map.mjs` reihte Polyline und Stationskreise vor der ersten Ansicht ein. Beim anschließenden `fitBounds` löste Leaflet sein erstes `load`-Ereignis aus. Der über den Init-Hook zuerst registrierte `whenReady`-Callback lief vor dem später eingereihten SVG-Renderer. Der gemeinsame Standortbroker lieferte einen vorhandenen Fix synchron aus. Dessen Kreiszeichnung traf auf fehlende Renderer-Bounds: `TypeError: Cannot read properties of undefined (reading 'intersects')`, aus Leaflet `_empty` → `_updateCircle` → `_reset` → `_layerAdd`.

Das Ladeereignis brach ab, bevor die eingereihten Vektoren aktiviert wurden. Der äußere Fehlerpfad ließ die teilweise erzeugte Karte bestehen; spätere Aufrufe hätten deren Initialisierung übersprungen. OSM-Kacheln können trotzdem sichtbar bleiben. Diese Beobachtung erklärt das gemeinsame Ausfallen aller vier Ebenen trotz vorhandener Fahrzeugschätzung. Eine höhere Monitorabfragerate kann diese Initialisierung nicht reparieren.

Die Reparatur aus 0.11.15 wartete nur auf `whenReady`. Sie deckte eine Karte ohne bereits eingereihte Vektoren ab und war für diese Reihenfolge unvollständig.

## Änderungen

- Der gemeinsame Hook meldet den Standort erst in einer Microtask nach dem vollständigen ersten Ladeereignis an. Alle eingereihten Renderer-/Vektorlistener sind dann fertig. Ein vorheriges `unload` verwirft die Anmeldung, auch wenn die Microtask bereits geplant war.
- Die eingebettete Stationskarte setzt ihre erste Ansicht zusätzlich vor allen Vektoren. Sie passt sie weiterhin nur anfangs und nach ausdrücklichem „Ausschnitt zeigen“ ein.
- Ein fehlgeschlagener Stationsaufbau entfernt Karte, Layerreferenzen und Marker, deaktiviert den Ausschnittknopf und nimmt keine Bewegungsupdates in unvollständige Ebenen auf. Ein erneuter Ansichtswechsel erzeugt die Karte vollständig neu.

Tracker, Richtung, Standortfreigaben, Watch-/Hintergrundregeln, API-Intervalle, Datenabdeckung und native APK bleiben erhalten. Die gemeinsame Hook-Korrektur gilt auch für Linien-, Fußweg-, Standort- und ganze Fahrzeugkarten.

## Browser-Reproduktion

Verwendet wurden die ausgelieferte Leaflet-Bibliothek, die echte veröffentlichte 29B-Geometrie (`7a1f9e4ef859a72c`, Großfeldsiedlung U → Floridsdorf, 23 Halte), ein Abschnitt mit fünf Halten davor und zwei danach sowie ausdrücklich synthetische Testpositionen. Kein Geräte-GPS und keine Live-Monitorabfrage; die Probe belegt Rendering, keine physische Fahrzeugzählung. Der lokale Prüfabschnitt hatte 350 CSS-Pixel Breite.

| Probe | Linien-/Stationspfade | Fahrzeugmarker | Standortpunkt | Fehler |
| --- | ---: | ---: | ---: | --- |
| 0.11.17, vorhandener Fix | 0 | 0 | 0 | Leaflet `intersects` |
| 0.11.17, kein Fix | 9 | 1 | 0 | keiner |
| 0.11.18, vorhandener Fix | 9 | 1 | 1 | keiner |
| 0.11.18, erneut geöffnet | 9 | 1 | 1 | keiner |
| 0.11.18, absichtlich vor der ersten Ansicht eingereihte Vektoren | 9 | nicht Bestandteil dieser Hook-Probe | 1 | keiner |

Mit Standortpunkt und Genauigkeitskreis insgesamt elf SVG-Pfade. Beim Verbergen verschwand der Standortpunkt und beim Wiederanzeigen erschien er erneut, ohne neue Karte oder neuen Fahrzeugtracker. Die letzte Probe erzeugte die Vektoren bewusst in der bisher problematischen Reihenfolge und prüfte damit den gemeinsamen Hook unabhängig von der zusätzlichen Initialisierungsreihenfolge im Stationswidget. Der temporäre QA-Einstieg gehört nicht zum veröffentlichten Paket.

## Automatisierte Abnahme

464 Web-/Server-Tests und 18 Python-Prüfungen bestanden. Die relevanten neuen Regressionen wurden zunächst gegen den alten Stand ausgeführt und schlugen fehl: spätere SVG-Ladelistener müssen vor der Positionsanmeldung fertig werden; Entfernen vor/nach dem ersten Ladecallback verhindert Anmeldung; erster Stationsausschnitt vor Vektoren; unvollständigen Kartenaufbau verwerfen und mit vorhandener Fahrzeugsituation erneut öffnen. Bestehende Prüfungen für Nutzer-Ausschnitt, Markerbewegung, geschlossene/spät geladene Karten und geteilte Standortfreigabe bleiben erfolgreich.

Die Browserprobe verwendet synthetische öffentliche Testpunkte. Die reale GPS-Verfügbarkeit und Darstellung auf dem physischen Android-Gerät sind getrennt zu prüfen.

Öffentliche Abnahme von 0.11.18 nach Veröffentlichung: 29B Richtung Floridsdorf zeigte den vollständigen Linienverlauf, 23 Stationsmarker, zwei geschätzte Fahrzeuglagen und einen als Fahrplan-Schätzung bezeichneten Countdown von etwa zwölf Minuten bis Floridsdorf. Die Seitenreferenz lud `vehicle-page.mjs?v=0.11.18`. Kein Geräte-GPS im Cloud-Browser; der Standortpunkt ist durch die oben beschriebene synthetische Reproduktion geprüft.
