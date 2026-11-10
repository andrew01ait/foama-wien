# Wear 0.7.3 · aktive Stadt und engere Favoritensteuerung

10. November 2026. Paket `at.andrew.foamawien`, Versionscode 25, minSdk 30 / targetSdk 34. PWA bleibt 0.9.5.

Über Nähe/Favoriten/A nach B steht ausschließlich die aktive Stadt: Wien, Graz, Linz oder Salzburg. Verwendet wird dieselbe CityProfiles.current()-Zuordnung wie für die Daten, nicht das Wort Automatisch oder ein eigener GPS-Abgleich. Der Titel folgt manueller Profilwahl, automatischer Erkennung und dem bestehenden Ablauf einer alten automatischen Zuordnung. Inhaltsaktualisierung führt ihn ohne neuen Timer, Netzabruf oder Navigation nach.

Die Verkehrsmittelsymbole stehen in Favoriten näher an Routen/Stationen. Angepasste sichtbare Insets und eine obere Ausrichtung der Symbole verringern den Leerraum; die nicht interaktive Abschnittsüberschrift nutzt den bisher leeren unteren Filterbereich. Die echten Tippzeilen bleiben getrennt und mindestens 48 dp hoch. Erste Stations- und Routenaktionen beginnen nach dem vollständigen Filterziel. Bei sichtbarem Akku-Sparangebot bleiben Filter und Sparbutton separat, ohne Überlappung. Abschnittsinhalte rücken im Normalfall zehn dp nach oben. Explizites Gruppenpadding verhindert eine ungewollte Verschiebung durch Drawable-Insets.

150 Android- und 338 Web-/Server-Tests erfolgreich. Neue Prüfungen für alle vier manuell gewählten Städte auf allen Hauptseiten, Rückkehr aus dem Stadtmenü, automatische Erkennung/Ablauf im bestehenden Titel ohne Rücksetzen des Abrufbudgets, sichtbaren Filterabstand, getrennte 48-dp-Ziele und Akku-Sparaktion. Beide Favoritenbereiche bei 227 dp und 192 dp mit 1,3-facher Schrift gerendert. Native Tests prüfen Text-/Kreisgrenzen und die erste Abfahrtszahl im kleinen Runddisplay weiterhin. Renderhelfer invalidiert vor jeder Aufnahme auch unveränderte Views, damit aufeinanderfolgende Native-Canvas-Bilder vollständig gezeichnet werden.

Originalsignatur, Paket, Version und zipalign geprüft. APK: 3,838,570 Bytes, SHA-256 `79d7be677bb2a70168da41a6c3d3a40b559e184770fca87522819a645d5141ca`. Zertifikat SHA-256 `d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1`.

Neuer Dateiname `foama-wien-wear-0.7.3.apk`; alte Veröffentlichungen unverändert. Update über Mehr → App & Updates oder die öffentliche Uhr-Seite. Keine physische OnePlus-Abnahme aus Render- und Unit-Tests ableiten.
