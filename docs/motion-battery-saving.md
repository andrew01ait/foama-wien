# Bewegungshilfe und Standort-Akkusparen · v0.1.6

Unter **Einstellungen → Standort → Bei wenig Bewegung Akku sparen** optional einschalten. Standard aus; bestehende Nutzer bekommen keine zusätzliche Sensorabfrage. Die Auswahl wird im bestehenden lokalen Einstellungsobjekt gespeichert, Messwerte nicht.

## Verhalten

- Der vorhandene Standort-Watch bleibt energiesparend (`enableHighAccuracy:false`), nur im Vordergrund. Die 40-m-Schwelle betrifft die Neuberechnung naher Stationen, sie schaltet keine GPS-Hardware ab.
- Nach Opt-in und aktivierter Standortfreigabe ein Beschleunigungssensor mit angefragten 2 Hz. Keine Gyroskop-/Magnetometerabfrage, keine zusätzliche Bibliothek und kein laufender Sensor im Hintergrund.
- Erst mindestens 60 Sekunden ruhige, kontinuierliche Sensorwerte **plus** genaue, räumlich stabile Standortmessungen erlauben eine Pause. Höchstens ±50 m, höchstens 20 m Abstand zum Anker, zuletzt höchstens 15 Sekunden alter Fix; bekannte Geschwindigkeit über 0,8 m/s verhindert die Pause. Glaubwürdige Bewegung/Fahrt blockiert sie für mindestens 90 Sekunden.
- Manche Browser liefern im Stillstand keine weiteren Watch-Callbacks. Deshalb einmal nach einer ruhigen Minute einen frischen bestätigenden Fix anfordern, statt einen alten Cache-Fix als Stillstand zu werten. Keine schnelle Wiederholschleife bei ausbleibendem Fix.
- In der Pause wird der Watch tatsächlich mit `clearWatch` beendet. Erkannte Beschleunigung/Bewegung startet ihn wieder. Spätestens 60 Sekunden nach dem letzten bestätigten Fix erfolgt ein frischer Kontrollversuch (`maximumAge:0`); Empfang und Browser bestimmen, wann ein Ergebnis verfügbar wird.
- Pausen werden als **Standort spart Akku** angezeigt, Fix-Alter bleibt sichtbar; keine grüne Geh-Erreichbarkeit oder präzise Gehweg-Matrix während einer Pause.
- Grober Tunnelstandort, Sensorfehler, fehlender Sensor oder ausbleibende Sensorwerte: normale Standortüberwachung bleibt bzw. wird aktiv. Sensorüberwachung mit kurzem Frische-Wächter; ein stumm gewordener Sensor darf die Pause nicht endlos halten.
- Hintergrund/Display aus/manueller Start/Standortverweigerung: Watches, Sensor und alle zugehörigen Timer stoppen; verspätete Callbacks werden verworfen. Sichtbar wieder beginnen, ohne alte Stillstandsevidenz zu übernehmen.
- Abfahrten bleiben davon unabhängig alle 30 Sekunden sichtbar aktualisiert. Keine Änderung an Live-Datenquelle, Favoriten oder Karten.

## Grenzen

Ein Beschleunigungssensor misst Beschleunigung, nicht verlässlich Ortswechsel: gleichförmige Fahrt kann ruhig aussehen. Er ersetzt keinen Standort und klassifiziert keine bestimmte Metro-/Tramfahrt. Kontrollfix und echte Positionsdaten begrenzen dieses Risiko. Wiederholte falsche oder festgefrorene Providerpositionen lassen sich damit nicht sicher ausschließen. Ruhig halten bzw. viel Gestikulieren kann den Effekt verändern. Tatsächlichen Akkugewinn auf dem Android-Gerät messen; keine Prozentersparnis behaupten.

Browser ohne nutzbaren `Accelerometer` verwenden den bisherigen Standortpfad. Kein Fallback auf eine hochfrequente DeviceMotion-/Gyroskop-Schleife. Die W3C-Spezifikation wird für vorhandene Implementierungen gepflegt; für weitere Browserabdeckung später DeviceMotion mit vergleichbarem Lebenszyklus separat evaluieren.

Native Android-/Wear-Apps können später Activity Recognition für Stillstand/Gehen/Fahrt prüfen. Diese native API ist nicht direkt Teil der PWA und wurde hier nicht implementiert. Für die Uhr weiterhin keine Hintergrundortung oder zusätzliche volle UI vorsehen.

## Datenschutz und Quellen

Letzter Sensorvektor und höchstens zwei Standortreferenzen nur im Sitzungsspeicher. Keine Sensorwerte, Bewegungshistorie oder Koordinaten in LocalStorage, Debug-Export oder Relay. Die gespeicherte Option ist nur ein boolescher Einstellungswert. Permissions-Policy lässt `accelerometer=(self)` zu, Browser-/Geräteeinstellungen bleiben maßgeblich.

- [Chrome: Sensors for the web](https://developer.chrome.com/docs/capabilities/web-apis/generic-sensor)
- [W3C: Accelerometer, gepflegte bestehende Implementierungen](https://w3c.github.io/accelerometer/)
- [Android: Activity Recognition Transition API](https://developer.android.com/develop/sensors-and-location/location/transitions)

Automatische Übergangstests in `tests/motion-location.test.mjs`. Physische Android-Sensor-, Zug-/Tunnel- und Akkuabnahme ist noch offen; Desktop-/Unit-Tests ersetzen sie nicht.
