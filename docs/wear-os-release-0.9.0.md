# Wear 0.9.0 / Code 31 · 12. November 2026

Der vollständige vorhandene Wiener-Linien-Sollfahrplan ist bereits in der APK verfügbar. Nähe, Stations-/Linienfavoriten und gespeicherte Routen zeigen geplante Abfahrten auch bei einem ersten Offline-Start. GPS ist weiterhin nur für Nähe/Gehzeit nötig. Ein eigener Einstellungsbereich zeigt Gültigkeit und manuelle Erneuerung; aktive App prüft mit Verbindung täglich auf neue Daten.

Gültigkeit 09.11.–12.12.2026 in Wiener Zeit. Nach Ablauf keine alten Offline-Abfahrten, auch nicht nach Neustart oder aus einem bereits entpackten Paket. Vorschauzeiten außerhalb der Periode werden ausgeschlossen. Neue Pakete werden nur vollständig geprüft übernommen; künftige Perioden aktivieren sich erst an ihrem Beginn. Ein alter Serverstand verlängert keine Frist. Ein unverändertes mitgeliefertes Archiv benötigt keinen erneuten Download. [Daten-/Updatevertrag](wear-offline.md).

Bei fehlender Verbindung startet der GPS-Provider sofort und darf im Vordergrund bis zu 90 Sekunden auf einen kalten Fix warten. Eine kürzlich echte Position bleibt höchstens zehn Minuten nur im RAM und wird nach 90 Sekunden als unsicher behandelt; kein Standortverlauf und kein Wiederherstellen nach Prozessneustart. Listener/Requests werden bei Hintergrund oder Display aus beendet. Kein physischer Empfangsnachweis für den konkreten gemeldeten Vorfall.

## Verifikation

205 native Android-/Robolectric-Tests, 498 Web-/Server-Tests, 22 Python-Prüfungen und 94 JavaScript-Syntaxprüfungen bestanden. Neue Prüfungen umfassen Offline-Kaltstart mit tatsächlich gebündelten Daten, gültige Stations-/Linien- und Routenfavoriten, Live-Vorrang, strikten Ablauf bei Wiener Mitternacht trotz anderer Gerätezeitzone, Vorperioden/Nachtfahrten, Zeitumstellung, künftige Kalender, kaputte/abgebrochene Downloads und Neustart. Kalter GPS-Fix nach 45 Sekunden, begrenzter 90-s-Timeout und saubere Listenerfreigabe geprüft. Kleine runde 192-dp-Abfahrtsansicht gerendert und visuell geprüft.

| Merkmal | Ergebnis |
| --- | --- |
| Paket | at.andrew.foamawien |
| Version / Code | 0.9.0 / 31 |
| APK-Größe | 7.196.177 Bytes |
| APK-SHA-256 | 01a2fd9c1bf098afef65c7e6212e3bee101a11c1ff9b8e4661ca1d36a7c381cc |
| Originalzertifikat SHA-256 | d50111563430d07bf385b0f6ae7f95f60336bcdcd0bc866e123be39a0ce99ca1 |
| Fahrplanarchiv | 1.966.697 Bytes, 1.695 Stationen |
| Fahrplanarchiv SHA-256 | 343fad96fbb7ffeff81a36c8de5b9da7a70e1dfed3e57e80d1355c42277fea22 |

Originalsignatur, Paket-/Version-/SDK-Metadaten und zipalign geprüft. Öffentlicher Dateiname foama-wien-wear-0.9.0.apk; PWA-Begleitstand 0.11.28. Neue normale Berechtigung ACCESS_NETWORK_STATE für die lokale Netzerkennung; keine neue Laufzeitfreigabe außer der bisherigen optionalen Ortung.

Physisch offen: Upgrade der vorhandenen OnePlus Watch 2R, Offline-GPS im Freien, tatsächlicher Watch-/Telefon-Netzwechsel und Fahrplanerneuerung über diese Verbindung. Ein erfolgreicher Download/Unit-Test ist keine Installation auf dem Gerät.
