# Lizenzen und Dienste

Eigener foama-wien-App-Code: [MIT](../LICENSE), Copyright 2026 Andrew Lindley. Die Lizenz gilt nicht pauschal für eingebundene Daten, Bibliotheken, Karten oder externe Dienste. Öffentlicher Quellcode einschließlich Lizenz und Build-Anleitungen: https://foama-wien.endruuu.chatgpt.site/foama-wien-source.zip.

- Reiseplanung und explizite Ortssuche: [Transitous-Datenquellen](https://transitous.org/sources/), [Nutzungsbedingungen](https://transitous.org/api/). Nicht kommerziell, Open Source, sparsame Nutzung, Best Effort ohne Verfügbarkeitszusage. Der eigene MIT-Code hebt diese Bedingungen für die Nutzung des Dienstes nicht auf.
- Karten und Wege: © [OpenStreetMap-Mitwirkende](https://www.openstreetmap.org/copyright), ODbL. Datenzuordnung und sämtliche einzelnen Transitous-Feeds: siehe verlinkte Datenquellen.
- Wiener-Linien-Katalog und Monitor sowie lokale Wiener Straßenreferenzen: Datenquelle Stadt Wien – data.wien.gv.at, CC BY 4.0. Konvertierung/Filterung durch foama-wien. [Vollständige Quellenliste](../LICENSE-SOURCES.md).
- Leaflet 1.9.4: BSD-2-Clause, unveränderte Lizenz in pwa/vendor/leaflet/LICENSE.
- Native QR-Abhängigkeit ZXing, optionale Firebase-Komponenten: jeweilige Apache-2.0-Lizenz und mit den Build-Abhängigkeiten gelieferte Hinweise; Apache-Lizenz unter docs/licenses/Apache-2.0.txt. Firebase wird weiterhin nur nach eigener Einrichtung und Opt-in verwendet.

Reiseabfragen gehen über den eigenen Dienst mit festem Transitous-Ziel und identifizierendem User-Agent. Keine dauerhafte Speicherung der Eingaben, GPS-Daten oder Reisen auf dem Server. Einzig stundenweise aggregierte Abrufzahlen begrenzen die gemeinsame Nutzung. Lokal werden Routenfavoriten ausschließlich nach „Weg merken“ gespeichert. Ein GPS-Start wird als dynamischer „Dein Standort“ gespeichert, ohne die GPS-Koordinate im Favoriten festzuschreiben. Der geplante Linienweg und die ausdrücklich gewählten festen Start-/Zielorte bleiben auf dem Gerät.

- Haltestellennahe Hausnummern: [Zugangsadressen Wien – amtlicher WFS](https://data.wien.gv.at/daten/geo?service=WFS&version=2.0.0&request=GetFeature&typeNames=ogdwien:ZUGANGSADROGD&count=1). Datenquelle: Stadt Wien - data.wien.gv.at, CC BY 4.0. Abgeleitete Zuordnung innerhalb von 100 m mit Distanzangabe; keine zugesicherte Stations-Postadresse.
