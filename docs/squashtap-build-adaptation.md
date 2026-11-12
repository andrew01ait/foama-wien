# Nativer Wear-OS-Build

Erprobter Release-Weg: Linux, Python, Java/JDK 17 und Android-SDK-Kommandozeilentools. Android Studio und Gradle sind für diesen Weg nicht erforderlich. Die Legacy-Gradle-Dateien bleiben als zusätzliche Quellen erhalten, sind aber kein Nachweis eines aktuellen Release-Builds.

Aktueller Stand: Wear 0.9.1 / Code 32; maßgeblich ist `wear/build-config.json`. Paket `at.andrew.foamawien`, Quellnamespace `at.foama.wien`. Plattform/Target 34, Build Tools 34.0.0, minSdk 30. Die ursprüngliche Signaturidentität steht öffentlich in `wear/release-signing.json`; der Keystore und seine Passwörter sind privat.

## Werkzeuge vorbereiten

```sh
python3 scripts/bootstrap_android.py
python3 scripts/sync_wear_assets.py
```

Bootstrap beschafft die festgelegten Google-SDK- und ZXing-Abhängigkeiten und prüft veröffentlichte Prüfsummen. Für die erstmalige Vorbereitung wird Netzwerkzugang zu den offiziellen Google-/Maven-Quellen benötigt. `android-dependencies.json`, `scripts/firebase_sdk.py` und `wear/ui-test/pom.xml` halten weitere Versionen bzw. Prüfsummen fest. Maven-/Android-/Testcaches liegen unter `.local/` und werden nicht veröffentlicht.

## Ohne Signierschlüssel prüfen

```sh
python3 scripts/build.py --base-url https://foama-wien.endruuu.chatgpt.site --check-only --out .local/native-check
```

Dieser Weg erzeugt Ressourcen und Java-Klassen und führt die nativen Robolectric-Tests aus, signiert aber keine installierbare Release-APK. Die angegebene URL ist hier die bestehende öffentliche App-Adresse; ein eigener Betrieb benötigt eine eigene echte HTTPS-Adresse. Web-Prüfungen laufen im Builder ebenfalls, sofern sie nicht vorher unverändert bestanden haben und ausdrücklich übersprungen werden. Native Tests werden auch mit `--skip-tests` ausgeführt.

## Original-Release bauen

Den ursprünglichen privaten Keystore getrennt wiederherstellen. `FOAMA_STORE_PASSWORD` und `FOAMA_KEY_PASSWORD` ausschließlich als Umgebungsvariablen bereitstellen; keine Werte in Shell-Argumente oder Logs schreiben.

```sh
python3 scripts/build.py --base-url https://foama-wien.endruuu.chatgpt.site --out .local/native-release
```

Der Builder kompiliert Ressourcen/Java, führt native Tests aus, erzeugt DEX, richtet die APK aus und signiert sie. Er prüft anschließend Originalzertifikat, Paket, SDK, Version und Versionscode und erzeugt Größe/SHA-256 sowie Update-Metadaten. Ohne Originalschlüssel kann die bestehende App nicht als kompatibles Update gebaut werden. `--create-key` ersetzt bewusst keinen bereits bestehenden Release-Schlüssel.

Für einen unabhängigen Fork App-Kennung, eigenes Backend, Prüfkonfiguration und eigene Signaturidentität bewusst anpassen. Der unveränderte Builder prüft die ursprüngliche App-Kennung und Signatur; ein Austausch nur des Keystores reicht nicht.

## APK und Feed vorbereiten

```sh
python3 scripts/publish_wear_update.py .local/native-release/foama-wien-0.9.1.apk 0.9.1 32
```

Version und Pfad müssen zum tatsächlich neu gebauten Release passen. Das Skript prüft Signatur und Metadaten, bereitet Download/Größe/SHA-256 und bis zu vier Neuerungspunkte im Feed vor und ergänzt die Release-Allowlist. Eine fertige APK wird nicht als GitHub-Quelldatei eingecheckt. Veröffentlichungen und öffentliche Byteprüfung erfolgen nach [DEPLOYMENT.md](../DEPLOYMENT.md).

Die App prüft Updates zunächst nur über Metadaten. Erst die zusätzliche Bestätigung startet Download und Installer-Übergabe; Fortschritt, Größen-/Hash-/Signaturprüfung sowie Abbruchbereinigung bleiben verpflichtend. Ein neuer Dokumentationsstand rechtfertigt keine neue APK unter einem bestehenden Dateinamen.

## Abnahme

Der freigegebene 0.9.1-Build hat 210 native Tests bestanden. Aktuelle tatsächliche Ergebnisse stehen in [docs/tests.md](tests.md) und dem [Release-Protokoll](wear-os-release-0.9.1.md). GPS, Kamera/QR, System-Dateiauswahl, Installer, Hintergrundverhalten und echter Push-Empfang benötigen zusätzlich physische Geräteprüfung. Historische Build-Protokolle stehen im [Archiv](history/squashtap-build-adaptation-before-github.md).

Schmale JDK-Abbilder ohne `ct.sym`: Der gemeinsame Compilerhelfer verwendet Java-8-Source/Target statt `--release 8`. Die obligatorischen Android-Tests, D8 und APK-Metadatenprüfung bleiben erhalten.

Update-Lebenszyklus ab 0.7.4: sichtbare Dialogfenster wach halten, Staging auf dem Worker, kurze sichtbare Pause nur für bestätigte Updates überbrücken. Systeminstallation und physische Geräteabnahme separat; Details im [Release-Protokoll](wear-os-release-0.9.1.md).
