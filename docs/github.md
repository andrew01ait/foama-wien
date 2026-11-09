# GitHub und interne Quellen

Öffentliches Repository: [andrew01ait/foama-wien](https://github.com/andrew01ait/foama-wien), Hauptbranch `main`. Es enthält PWA, native Uhr-App, Server, Migrationen, öffentliche Referenzdaten, Tests und Dokumentation. Eigener App-Code steht unter MIT; eingebundene Daten/Bibliotheken behalten ihre [Lizenzen](licenses.md).

## Einrichtung und Rechte

Die GitHub-Anmeldung und die Installation der GitHub-App sind getrennte Schritte. Für diesen Publikationsweg muss der ChatGPT Codex Connector im richtigen Konto installiert sein und Zugriff auf das gewählte Repository besitzen. Schreibzugriff durch eine tatsächlich gelungene Änderung bestätigen; die bloße Anzeige des Profils oder eines öffentlichen Repositories reicht nicht. Fehler 403 `Resource not accessible by integration` deutet auf fehlende Berechtigung oder Repository-Zuordnung, nicht auf einen erfolgreichen Upload.

Repository-Zugriff in den GitHub-App-Einstellungen möglichst auf die benötigten Repositories begrenzen. Produktions-Secrets und private Signierdateien nicht als Repository-Dateien oder Commit-Historie übertragen.

## Quellstände abgleichen

Die bestehende Site nutzt weiterhin ihr internes Git-Repository und ihren separaten Veröffentlichungsablauf. Das öffentliche GitHub ist der überprüfbare Quellstand für Beiträge und Weiterverwendung. Es gibt derzeit keinen automatischen Deploy und keinen automatischen bidirektionalen Spiegel. Für jeden Release die beteiligten Commit-SHAs und den tatsächlich veröffentlichten Stand nachvollziehbar halten.

1. Aktuelle interne Quelle und GitHub-`main` lesen. Ungeprüfte parallele Änderungen erhalten.
2. Den vorgesehenen Quellstand festlegen; lokale Favoriten, Nutzerexporte, echte QR-/Push-Freigaben, Secrets, Keystores, SDKs und Build-Ausgaben ausschließen.
3. README, Status, Fachseiten, Tests und Neuerungen am tatsächlichen Code ausrichten. Öffentliche Datenquellen, SQL-Migrationen und Bibliothekslizenzen müssen mitkommen.
4. Relevante Tests ausführen. Den GitHub-Baum nach Pfad, Git-Blob-SHA und Dateimodus gegen den vorbereiteten Quellstand prüfen.
5. Auf einem normalen Arbeitsbranch Änderungen als Pull Request vorschlagen. Für eine bewusst freigegebene Erstveröffentlichung oder Wartung direkt auf `main` den erwarteten bisherigen Branchkopf prüfen und ausschließlich vorwärts aktualisieren. Keine fremden Commits durch Force-Push ersetzen.
6. Nach dem Commit die tatsächliche GitHub-Workflow-Ausführung für genau diese SHA lesen. Ein lokaler Erfolg ist kein Beleg für einen gelaufenen GitHub-Job.
7. Interne Quelle und öffentlichen Source-Download passend nachziehen; Site-/APK-Veröffentlichungen zusätzlich nach [Deployment](../DEPLOYMENT.md) durchführen.

Die erste öffentliche Übernahme war ein geprüfter Snapshot statt der pauschalen internen Git-Historie. Startcommit für die vollständige Quelle: [b44cbe2](https://github.com/andrew01ait/foama-wien/commit/b44cbe20e6f9e082a4a2c1f700f1ad2d9e69d31c), Stand 0.6.0. Dessen [erster GitHub-Prüflauf](https://github.com/andrew01ait/foama-wien/actions/runs/42608519790) war erfolgreich. Anschließend werden die bereits veröffentlichte 0.6.1-Quelle und die konsolidierten Anleitungen abgeglichen.

## Beiträge und CI

Änderungen in einem Branch vorbereiten, passende Tests und Dokumentation ergänzen und einen Pull Request öffnen. GitHub Actions führt bei Push/PR auf `main` Web-/Server-, Python- und JavaScript-Syntaxprüfungen aus. CI benötigt keine Produktionsschlüssel, erneuert keine Verkehrsdaten und baut/signiert keine Release-APK. Native Android-Tests laufen im dokumentierten CLI-Build separat.

Die laufende Site bleibt unter https://foama-wien.endruuu.chatgpt.site/ erreichbar. Ein grüner GitHub-Prüflauf veröffentlicht dort nichts und bestätigt keinen physischen Watch-/Push-Test. [Entwicklung](development.md), [Uhr-Build](squashtap-build-adaptation.md), [Konfiguration](configuration.md).
