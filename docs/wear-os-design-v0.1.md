Wear 0.2.2 erhält die vom Nutzer ausdrücklich gelobten Mehr-/Zurück-Stile. Der Nähe/Favoriten-Schalter hat jetzt einen gemeinsamen Rahmen, Pin-/Stern-Vektoren und klare Auswahl. Horizontale Wischgesten sind mit den Buttons und modernem System-Back identisch. [Release](wear-os-release-0.2.2.md).

Wear 0.2.1 gleicht native Zeilen, Detailfolge, aktive Tabs und Aktionsstile an diesen Entwurf an. Mehr ist in vier echte Unterseiten gegliedert; QR bleibt nicht verfügbar. [Aktueller Release](wear-os-release-0.2.1.md).

Aktualisierung 07.11.2026: Dieser Entwurf ist in die erste native Test-APK 0.2.0 überführt. [Download](https://foama-wien.endruuu.chatgpt.site/wear.html) · [Release, Umfang und Prüfgrenzen](wear-os-release-0.2.0.md). Die frühere interaktive Vorschau bleibt ausdrücklich ein Beispieldaten-Prototyp. QR ist noch offen; die native Oberfläche enthält keinen funktionslosen Transferknopf.

# foama-wien Wear OS – fokussierter UI-Entwurf 0.1

Stand: 07.11.2026. **Design-/Interaktionsprototyp, keine APK.** Begonnen nach Veröffentlichung und öffentlicher Prüfung der PWA v0.1.5. Bestehende Wear-Java-Quellen bleiben Ausgangspunkt.

Öffentliche Vorschau: https://foama-wien.endruuu.chatgpt.site/wear-design.html

## Ziel

In wenigen Sekunden erkennen: Welche relevante Verbindung fährt als Nächstes, und lohnt sich der Fußweg? Zwei Hauptansichten: **Nähe** und **Favoriten**. Eine Verbindung antippen öffnet die große Abfahrtsanzeige. Der Entwurf verwendet ausschließlich klar bezeichnete öffentliche Beispieldaten und liest keine echten Favoriten, Geräteposition oder Live-API.

## Hauptansichten

| Ansicht | Sichtbarer Inhalt | Aktion |
|---|---|---|
| Nähe | Nächste Station, kurze Gehzeit, direkt sichtbare Linien/Richtungen mit nächsten zwei Zeiten | Verbindung öffnet Detail; vertikal weitere Einträge |
| Favoriten | Eigene gespeicherte Verbindungen, Linie/Richtung/Station und Zeiten | Detail öffnen; Bearbeitung erst dort ausdrücklich |
| Verbindungsdetail | Große nächste Abfahrt, Richtung, Station, danach folgende Abfahrt, Geh-Einschätzung | Favorit ausdrücklich speichern/entfernen; Zurück |
| Mehr | Favoriten übertragen, Geh-Einstellungen, manuell aktualisieren | Kleine vertikale Nebenliste |

Nähe/Favoriten sind die einzigen permanenten Navigationsziele. Die letzte gewählte Hauptansicht bleibt im nativen Produkt lokal erhalten. „Mehr“ liegt am Ende der Liste, nicht als zusätzliche Aktionsleiste über den Abfahrten. Karten, umfangreiche Stationssuche, lange Baustellentexte und technische Logs gehören weiterhin zur Smartphone-PWA. Ein betroffener Watch-Eintrag kann später einen kurzen Hinweis tragen, dessen Details am Telefon liegen.

## Bedienung und Darstellung

- Schwarzer Displayhintergrund, Mint als Aktionsfarbe, Weiß für wichtige Daten. Offizielle U-Bahn-Farben und dunkelblaue N-Linien erhalten.
- Runde, vertikal scrollende Oberfläche. Relevante Ziele mindestens 48 × 48 dp. Wesentliche Texte mindestens 12 sp; Systemschriftgröße beachten. Preview arbeitet mit einer logischen 227-dp-Rundfläche und zeigt eine größere Schriftprobe.
- Krone/Rotary scrollt die Haupt- und Detailseiten; sichtbarer Scrollindikator während der Interaktion. Keine Abhängigkeit von schwer erkennbaren Sondergesten.
- Plattform-Zurück / Swipe-to-dismiss führt eine Ebene zurück. Verbindungstaps ändern niemals stillschweigend Favoriten.
- Erreichbarkeit mit **Farbe und Text**, nicht Farbe allein. Ganze Stationen bekommen keine pauschale Ampel allein aus der frühesten Abfahrt.
- Keine permanente Schaltflächenreihe „Jetzt / Züge / QR“. Kein Löschen-Button auf jeder Favoritenkarte der Hauptliste. Die relevante Abfahrt erhält den Platz.

## Standort, Tunnel und Offline

| Zustand | Verhalten |
|---|---|
| Zuverlässiger Standort | Nähe, geschätzte Gehzeit und Erreichbarkeit je Verbindung |
| Grobe/veraltete Position oder Fahrt | Letzte/ungefähre Position deutlich markieren, keine gesicherte Geh-Ampel |
| Kein Standort | Favoriten direkt nutzbar, sichtbare optionale Standortaktion |
| Offline / API-Fehler | Letzten realen Stand mit Alter anzeigen, als älter kennzeichnen; keine neue Echtzeit behaupten |
| App nicht sichtbar | GPS-Watch und neue Datenabfragen stoppen; kein Hintergrundservice für Polling |

Abfahrtsabrufe weiterhin 30 Sekunden nur im Vordergrund, Bewegungsfilter etwa 40 m. Kleinstbewegungen müssen Alter/Genauigkeit aktualisieren, ohne die Stationsliste ständig neu aufzubauen. Die vorhandene native Grobstandort-/Fehlerlogik braucht vor Release denselben Umgang mit Alter, Bewegung und Cache wie die PWA.

## Favoriten und Telefon

Favoriten bleiben pro Gerät unabhängig/lokal (vereinbarte Option B). Übertragung bleibt bewusst angestoßen: Mehr → Favoriten übertragen → kurzlebiger QR auf der Uhr → Smartphone bestätigt Auswahl → Ergänzen/Ersetzen auf der Uhr. Zehn Minuten, bestehendes E2E-Format. Der Prototyp zeigt ausschließlich einen nicht scannbaren Platzhalter; der produktive Transferdienst ist noch nicht eingerichtet.

Keine Tastatureingabe zum Hinzufügen vieler Stationen auf der Uhr. Auswahl/umfangreiche Suche bevorzugt am Telefon, danach übertragen. Eine konkret angezeigte Verbindung kann in ihrem Detail als Watch-Favorit gespeichert werden.

## Bestehenden Code weiterentwickeln

Ausgangspunkte: `wear/app/src/main/java/at/foama/wien/MainActivity.java`, `Repo.java`, `TransferManager.java` und die vorhandenen Ressourcen. Java-/CLI-Buildstrategie aus `docs/squashtap-build-adaptation.md` beibehalten; kein erzwungener Wechsel auf Android Studio, Gradle oder Compose.

Nächste Umsetzungsschritte:

1. `MainActivity`-Layout in zwei Hauptansichten plus eigene Verbindungsdetailansicht aufteilen. Daten-/Favoritenmodell und Identität erhalten.
2. Zusätzliche Aktionsleiste entfernen, QR/Geh-Einstellungen/Update in „Mehr“; explizite Favoritenaktion im Detail.
3. Standorte und Abfahrten wie in PWA gegen grobe/veraltete Daten absichern; zugängliche Linien-Badges und größere Touchziele.
4. Runddisplay-/Rotary-/große-Schrift-Prüfung auf 192-dp- und größeren Rundflächen. Noch kein Hardware-/APK-Nachweis.
5. Erst nach erfolgreichem CLI-Build, Signatur-/Paketprüfungen und Geräteabnahme eine installierbare APK veröffentlichen. Signing-Key und Paketidentität ab Erstinstallation stabil halten.

## Quellen

- [Wear OS: Designprinzipien](https://developer.android.com/design/ui/wear/guides/get-started/design-for-wearables/principles) – Kernaufgaben und schnelle Interaktion.
- [Wear OS App Quality](https://developer.android.com/docs/quality-guidelines/wear-app-quality) – 48-dp-Ziele, Schrift, schwarze Hintergründe und Runddisplay.
- [Rotary Input](https://developer.android.com/training/wearables/compose/rotary-input) – Eingabe-/Scrollverhalten; diese Leitlinien erfordern keinen Framework-Wechsel des bestehenden Projekts.

Browserreview: Nähe/Favoriten und Verbindungsdetail funktionieren; Tunnel/Offline ersetzen die grüne Einschätzung durch ungewiss. Große Schrift ist testbar. Im Detail steht die Abfahrt sofort oben, Zurück liegt im Web-Entwurf zusätzlich unten bzw. außerhalb der Uhr; nativ ist System-Zurück vorgesehen. Dadurch verbraucht keine feste Zurück-Leiste den Platz der großen Minutenanzeige.
