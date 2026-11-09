# foama-wien – Deployment

Die öffentliche PWA wird mit **ChatGPT Sites** bereitgestellt; maßgeblich ist [DEPLOYMENT.md](DEPLOYMENT.md). Die folgenden Backend- und Wear-Alternativen bleiben erhalten.


## A. Optional: Cloudflare-Proxy und QR-Relay

Cloudflare Worker kann **statische PWA + API-Proxy + einmaligen QR-Vermittler** über dieselbe HTTPS-Origin ausliefern. Eine separate Hostinger-Installation ist somit nicht nötig.

**Voraussetzungen:** Cloudflare-Account, Domain oder `*.workers.dev` und für den Worker freigegebene Assets/Durable Objects. Der tatsächliche API-Zugriff muss auf Cloudflare getestet werden; die Wiener-Linien-API kann Zugriffe über Schutzmechanismen blockieren.

```bash
cd cloudflare
npm install
npx wrangler login
npx wrangler deploy
```

Worker-Konfiguration: `cloudflare/wrangler.toml` mit `assets.directory="../pwa"` und `TRANSFER_ROOM` Durable Object. Erst nach erfolgreicher Deployment-Rückmeldung die echte HTTPS-Adresse an die Uhr-App weitergeben.

**API-Smoketests nach Deployment (keine Massenanfragen):**

```bash
curl https://DEINE-APP-DOMAIN/api/health
curl https://DEINE-APP-DOMAIN/api/stops-index
curl 'https://DEINE-APP-DOMAIN/api/monitor?stopId=4116'
```

`4116` ist lediglich eine dokumentierte RBL-Beispielnummer, kein garantierter aktueller Fahrplan. Die JSON-Antwort muss `data.monitors` enthalten, die Strecke durch die Cloudflare-Umgebung tatsächlich erreichbar sein. Bei Fehler 502: Offizielle API/WAF/CORS prüfen, **keine** aggressiven Retries oder Umgehung des Zugriffsschutzes.

### Betrieb der Daten

- Wenn `/api/stops-index` die offizielle CSV nicht abrufen kann: **einmalig** die aktuelle Original-CSV lokal herunterladen (offizielle data.gv.at-Distribution), `python scripts/prepare_stops.py --file <pfad>` ausführen und PWA neu deployen. Die Uhr-APK danach neu bauen.
- ÖBB: auf `data.oebb.at` Nutzungsbedingungen selbst bestätigen, offizielle GTFS-ZIP herunterladen, `python scripts/prepare_rail_gtfs.py <pfad> --days 60` ausführen und die resultierende Datei deployen. Neue Fahrplanperiode spätestens vor Ablauf vorbereiten.
- Valhalla-Demo: vor einer öffentlichen App Rücksprache mit dem Betreiber halten und Limits respektieren. Für großflächigen Betrieb eigenen lizenzierten Routinganbieter oder Hostinger-Router prüfen.
- `pwa/config.json` verwendet `apiBase:"."` (gleiche Website); die App versucht zuerst den direkten WL-Zugriff und danach ihren Worker unter `/api` als CORS-Fallback. Bei rein statischem Hosting `apiBase` auf `""` setzen. Wenn eine getrennte API-URL genutzt wird, diese im PWA-Einstellungsfeld hinterlegen.
- Nur HTTPS erlaubt Standortfreigabe, Service Worker und WebCrypto zuverlässig.

## B. Statische PWA ohne Backend

`pwa/` kann auf jedem statischen HTTPS-Webhost liegen. Vorteile: null eigene API-Server. Einschränkung: Wiener-Linien-CORS kann Browserzugriffe sperren; dann erscheinen **keine Live-Abfahrten**. QR-Transfer zur Uhr braucht trotzdem ein kurzlebiges Relay. Realistische Variante A ist deshalb nur nach Browser-CORS-Test möglich.

## C. Wear-OS-APK ohne lokalen Android-PC (veralteter GitHub-/Gradle-Alternativweg)

**Wichtige Änderung:** Primär muss jetzt Squash Taps bewährter Work-Python-CLI-Build übernommen werden, wie in `docs/squashtap-build-adaptation.md` dokumentiert. GitHub/Gradle sind nicht erforderlich. Die folgenden Absätze dokumentieren lediglich den früher vorgeschlagenen CI-Weg, nicht das geplante Deployment.


GitHub-Repository mit diesem Projekt anlegen, `.github/workflows/ci.yml` ist enthalten. GitHub Actions `foama-wien CI` starten (oder auf `main` pushen). Die Action nutzt Android SDK + Gradle auf einem GitHub Runner und stellt das **Debug-APK** als herunterladbares CI-Artefakt bereit. Das ist ein Testpaket, kein veröffentlichtes signiertes Release.

Vor dem Build die GitHub-Repository-Variable `FOAMA_PWA_BASE` auf die echte PWA-HTTPS-URL setzen (oder den Platzhalter im `wear/app/build.gradle` ersetzen). Aus dem PWA-Stop-/Rail-Katalog die Android-Assets aktualisieren. Zum Testen auf der OnePlus Watch das APK über einen zulässigen Weg sideloaden; Android verlangt eine Benutzerbestätigung.

### Signierte Releases und Updates

Für spätere Updates **denselben Android-Paketnamen** `at.foama.wien`, **dieselbe Signatur** und aufsteigende `versionCode` beibehalten.

Lokaler oder Cloud-Build, mit Signing-Secrets über Umgebungsvariablen:

- `FOAMA_STORE_FILE` (Pfad zum langfristig sicher verwahrten Keystore)
- `FOAMA_STORE_PASSWORD`
- `FOAMA_KEY_ALIAS`
- `FOAMA_KEY_PASSWORD`

Keystore **niemals** ins Git-Repository hochladen. Nach signiertem Build:

```bash
python scripts/publish_wear_update.py /path/to/foama-wien-release.apk 0.1.1 2
# Die aktualisierte pwa/update.json und pwa/apk/*.apk deployen.
```

Die Uhr kann auf ein Update prüfen, die signierte APK herunterladen, die SHA-256-Prüfsumme vergleichen und anschließend den Android-Installer öffnen. **Keine automatische stille Installation**; u. U. Berechtigung „Apps aus unbekannten Quellen installieren“ erforderlich.

## D. Hostinger fallback

Nur bei tatsächlichen Cloudflare-/CORS-/Lizenzgrenzen: Reverse Proxy von `/api` hinter vorhandenes Hostinger-nginx, Docker-Container mit HTTP-API und temporärem Speicher. Gleichwertige Schutzmaßnahmen (TLS, 10-min TTL, Einmalverwendung, Rate-Limits) benötigen zusätzliche Implementierung und Tests. Diese Hostinger-Implementierung ist **noch nicht** Bestandteil von v0.1.0.
