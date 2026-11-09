# Störungs-Push · PWA 0.7.2

Aktuelle Nutzerentscheidung (09.11.2026): Push ausschließlich für die PWA, kein direkter Uhr-Push. Kein eigenes Firebase-Projekt oder Firebase-SDK nötig. Die native App 0.6.1/21 bleibt unverändert; vorhandene FCM-Vorbereitung bleibt deaktiviert. Der Browser wählt seinen Pushdienst; Chrome/Android kann darunter Google-Infrastruktur verwenden.

## Bedienung und Auswahl

Einstellungen → Störungsbenachrichtigungen. Erst „Benachrichtigungen aktivieren“ fordert die Browserfreigabe an. Standard: Meine Favoriten einschließlich Stationen, Linien und bekannter Ein-/Umstiegs-/Ausstiegsstationen gespeicherter A-nach-B-Wege samt Alternativen (maximal 100 Stationen). Alternativ Alle Linien. Optionale Nachtruhe 22–7 Uhr, Europe/Vienna einschließlich Sommerzeit.

Aufzüge und Fahrtreppen lösen **niemals** Push aus, auch nicht bei alten gespeicherten equipment:true-Freigaben. Maßgeblich sind die offiziellen Kategorien; eine echte Betriebsstörung wird nicht wegen des Worts „Aufzug“ im Text verworfen. Geplantes frühestens ab Beginn; beendete/abgelaufene Störungen und reine Informationen sind ausgeschlossen. Stationsgebundene Kurzmeldungen benötigen den tatsächlichen RBL-Bezug. Keine Entwarnung aus fehlenden Daten oder Quellenfehlern.

Testnachricht und Zustellstatus befinden sich ausschließlich im anfangs geschlossenen Bereich **Einstellungen → Debug Push**. Dort gibt es zusätzlich „Anzeige auf Gerät prüfen“: eine lokale lautlose showNotification()-Probe ohne Transport und ohne weitere Freigabeanforderung. Ein expliziter Test wird mit Transport-Dringlichkeit high gesendet, damit die kurze Ein-Minuten-TTL nicht unnötig durch normalen Energiesparaufschub aufgebraucht wird; dies ist keine Zustellgarantie. Reguläre Pushs bleiben normal/lautlos.

Testnachricht sendet einen bewusst ausgelösten Test. „Zustellstatus“ fragt dessen letzten Stand einmal ab: vom Anbieter angenommen, Browser hat Anzeige angefordert, angetippt oder vor Anzeige verworfen. Weder Anbieterannahme noch erfolgreiche showNotification()-Rückkehr beweist sichtbare Präsentation oder menschliches Lesen. Es gibt keinen Status-Pollingloop. Eine Testnachricht darf auch bei sichtbarer App und während der Nachtruhe erscheinen.

## Ablauf und dauerhafte Warteschlange

1. Der feste offizielle Wiener-Linien-trafficInfoList-Feed wird geprüft; semantische Fingerprints ignorieren bloße Abrufzeiten und wechselnde Lieferanten-IDs.
2. Passende neue Ereignisse werden vor dem Versand dauerhaft in D1 eingereiht. foama_push_outbox hat einen eindeutigen Geräte-/Ereignisschlüssel, atomare Lease/Claims, Versuche, Ablauf und begrenzte Empfangssignale. Verschlüsselt gespeichert werden lediglich Referenzen auf Betreiberereignisse, keine Nutzeradressen oder vollständigen Favoritenexporte.
3. Vor jedem Zustellversuch gelten erneut Freigabe, aktuelle Auswahl, Nachtruhe, Tageslimit und aktuelle Quellenlage. Höchstens vier Transportversuche, höchstens drei kurze Versuche je begrenztem Wartungslauf. Nur Netzfehler/429/5xx sind wiederholbar; Retry-After wird respektiert. Anbieterannahme ist endgültig: fehlende Browserbestätigung löst **keinen** erneuten Versand aus.
4. Der Browser kann den Service Worker ohne offene App starten. Das v2-Payload bindet Geräte-ID, zufällige Ereignis-ID, Sendezeit und kurzes Ablaufdatum. Es enthält kein Verwaltungsgeheimnis. Der Worker liest die eigene Freigabe aus IndexedDB und prüft die Relevanz über einen geräteauthentifizierten festen Serverpfad.
5. Vor der Anzeige werden Opt-out, Ablauf, Nachtruhe und tatsächliche Fenstersichtbarkeit nochmals geprüft. Ein lediglich im Hintergrund offenes Fenster unterdrückt keinen Hinweis. Atomare IndexedDB-Claims verhindern doppelte parallele Anzeigen und halten den geräteweiten Minutenabstand. Anzeigen sind standardmäßig lautlos und ersetzen denselben Tag ohne erneutes Klingeln.
6. Nur anschließend erfolgt showNotification(); begrenzte authentifizierte shown/clicked/suppressed-Signale sind vom Transportstatus getrennt. Der Klick öffnet ausschließlich die eigene alerts.html. Keine GPS-/Abfahrtsabfragen oder dauerhaften Clienttimer im Hintergrund.

Eine Warteschlangenreferenz kann höchstens 24 Stunden aufbewahrt werden; das ist keine Erlaubnis für alte Inhalte. Jeder Versuch und jede Anzeige verlangt weiterhin eine aktuelle passende Betreiberstörung. Regulärer Transport/Anzeige maximal fünf Minuten, explizite Tests maximal eine Minute. Quellen-Cache höchstens zwei Minuten. Höchstens 64 Vorgänge je Gerät, davon maximal 56 durch Tests belegbar; höchstens 32 Transportversuche je Lauf und begrenzte Laufzeit. 404/410 entfernt Gerätefreigabe, Warteschlange und Verlauf. Andere permanente Anbieterfehler werden nicht wiederholt.

## Frequenz und Grenzen

Eine bestehende stündliche Plattformaufgabe prüft die Quelle; bei ohnehin aktiver App ergänzt ein vorhandener Monitoraufruf ungefähr alle fünf Minuten einen begrenzten Check mittels waitUntil(). Der öffentliche leere POST /api/push/check und der verbundene MCP-Tick verwenden denselben Dispatcher; kein frei wählbarer Empfänger, Nachrichtentext oder Dritt-URL. Sie nehmen ausstehende Transportarbeit wieder auf. Quellenfehler verhindern auch deren Versand. Kein Echtzeitversprechen: eine neu begonnene Störung kann bei vollständig geschlossener App erst beim nächsten stündlichen Check erkannt werden.

Anders als Farbfeld hat foama-wien kein eigenes Spielereignis, das den Server sofort anstößt: Betreiberstörungen müssen abgefragt werden. Der vorbereitete separate Fünf-Minuten-Timer in deploy/push-timer ist weiterhin nicht betrieben. Keine versetzten Plattformjobs als Intervallumgehung. PUSH_INTERVAL_MINUTES=60 bleibt ehrlich. Mindestens 30 Minuten zwischen automatischen Hinweisen, maximal sechs pro Wiener Kalendertag; Tests separat maximal einmal pro Minute.

## Datenschutz, Migration und Betrieb

Web Push verwendet RFC 8291 aes128gcm und RFC 8292 VAPID. Privater VAPID- und AES-Speicherschlüssel bleiben unverändert in Hosting-Secrets. Endpunkte ausschließlich bekannte HTTPS-Pushanbieter; Redirects werden verworfen. Keine Firebase-Datenbank/Analytics oder neuen Konten. Bestehende Abonnements hängen am stabilen VAPID-Schlüsselpaar.

D1 hält gehashte Verwaltungsfreigaben sowie AES-256-GCM-verschlüsselte Zustelladresse/-schlüssel und minimale Stations-/Linienfilter. Eigene Gerätefreigabe in localStorage wird für den Service Worker in IndexedDB gespiegelt; dort liegen außerdem begrenzte Anzeige-Claims. Geheimnisse gelangen weder in Push-Payloads, öffentliche Statusantworten, Quellcode, Zeitpläne noch Debug-Exporte. Lokaler Opt-out wird vor dem Abmelden beim Anbieter gespeichert; fehlgeschlagene Serverabmeldung wird beim nächsten sichtbaren Online-Öffnen nachgeholt. Gerätefreigaben ohne sichtbare Erneuerung maximal 90 Tage; Versandfingerprints maximal 256 je Gerät/90 Tage. Bereinigung bei normalen API-/Wartungsläufen, kein sekundengenaues physisches Löschversprechen bei Ausfall.

Append-only Migration 0005 ergänzt die Outbox. Ältere Clients bleiben im vorhandenen v1-Protokoll kompatibel; der serverseitige Equipment-Ausschluss wirkt sofort auch dort. Die neue PWA handelt v2 erst nach einem MessageChannel-Nachweis des aktiven neuen Workers aus. Ein noch wartendes Update verlangt ausdrücklich „Jetzt aktualisieren“. Erst danach können IndexedDB-Gerätebindung, Prüfung vor Anzeige und Browserbestätigungen greifen. Keine stille automatische Updateaktivierung.

PUSH_VAPID_PUBLIC_KEY, PUSH_VAPID_PRIVATE_JWK, PUSH_VAPID_SUBJECT, PUSH_STORAGE_KEY, PUSH_SCHEDULER_ENABLED und PUSH_INTERVAL_MINUTES bleiben erhalten; keine neuen Produktions-Secrets erforderlich. Interner Quellstand, GitHub und Quell-ZIP gemeinsam pflegen. Ein Unit-Test oder erfolgreicher Quellenabruf ist kein Nachweis einer echten Telefonzustellung; realen Workers-Transport und abschließend ein optiertes Zieltelefon prüfen.

## Code und Nachweise

| Bereich | Quelle |
| --- | --- |
| Registrierung, Einstellungen und Teststatus | pwa/src/notifications.mjs |
| Gemeinsamer IndexedDB-Speicher | pwa/src/push-storage.js |
| Validierung, Anzeige und Klick | pwa/src/push-worker.js |
| Geräteauthentifizierung und feste APIs | cloudflare/src/push-service.mjs |
| Dauerhafte Queue, Claims und Wiederholung | cloudflare/src/push-outbox.mjs |
| Relevanz und Grenzen | pwa/src/push-policy.mjs |
| Verschlüsselung und Standardtransport | cloudflare/src/push-crypto.mjs, cloudflare/src/web-push.mjs |

[Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) · [RFC 8291](https://www.rfc-editor.org/rfc/rfc8291) · [RFC 8292](https://www.rfc-editor.org/rfc/rfc8292) · [Prüfprotokoll](tests.md)

## Diagnose des ausgebliebenen Tests am 09.11.2026

Produktiver Test um 22:21 UTC wurde nach einem Transportversuch angenommen, aber ohne shown/clicked/suppressed und ohne sichtbaren Event-Verifikationsabruf. Ein weiterer Test ca. 40 s später erhielt die vorgesehene HTTP-429-Minutenpause. Das belegt keinen Geräteempfang und keine konkrete Android-Ursache. Keine Nutzerschlüssel oder Endpunkte wurden für die Prüfung exportiert. Ab 0.7.0 speichert der Worker höchstens acht technische Empfangsschritte für 24 h lokal in IndexedDB (Zeit/zulässiger Kategoriename, keine Inhalte/IDs/Geheimnisse). Status und Testausgaben stehen im Debug-Bereich. Nach dem Update erneut bewusst testen; Anbieterannahme ohne Bestätigung wird niemals automatisch erneut gesendet.
