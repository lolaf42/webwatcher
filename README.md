# WebWatcher

Ein Firefox-Add-on, das beliebige Webseiten auf Änderungen überwacht und dich
per E-Mail (über n8n) und Browser-Benachrichtigung informiert. Vorkonfiguriert
für die Dresden-Informationstage-Seite, aber für beliebige Seiten erweiterbar.

**Wichtig:** Das Add-on prüft nur, solange Firefox geöffnet ist. Die E-Mail
selbst verschickt dein n8n-Server.

## Aufbau

- **Add-on (Firefox):** ruft die Seiten periodisch ab, erkennt Änderungen,
  schickt bei einer Änderung einen Webhook an n8n und zeigt eine Benachrichtigung.
- **n8n (dein Server):** empfängt den Webhook und verschickt die E-Mail.

## 1. n8n einrichten (zuerst)

1. In n8n: Menü → **Import from File** → `n8n-workflow.json` auswählen.
2. **Send-Email-Node** öffnen: SMTP-Zugangsdaten hinterlegen (Credential anlegen),
   Absender (`fromEmail`) und Empfänger (`toEmail`) eintragen.
3. Workflow oben rechts auf **Active** stellen.
4. **Webhook-Node** öffnen, die **Production-URL** kopieren.

## 2. Add-on in Firefox laden (Desktop)

1. In Firefox in die Adressleiste `about:debugging` eingeben.
2. Links **Dieser Firefox** → Button **Temporäres Add-on laden…**.
3. Im Ordner dieses Add-ons die Datei `manifest.json` auswählen.
4. Auf das Add-on-Symbol klicken → ⚙ (Einstellungen):
   - Die n8n-Webhook-URL einfügen.
   - Speichern.
5. Im Popup **Alle jetzt prüfen** drücken zum Testen.

Hinweis: "Temporäres Add-on" verschwindet bei jedem Firefox-Neustart. Für
dauerhafte Installation müsste es über addons.mozilla.org signiert werden.

## 3. Add-on in Firefox für Android laden

1. Firefox für Android (oder Firefox Nightly) → erfordert eine eigene
   Erweiterungs-Sammlung auf addons.mozilla.org oder Nightly mit aktivierter
   Debug-Funktion. Der einfachste dauerhafte Weg ist eine signierte Version.
2. Die Oberfläche (Popup, Einstellungen) ist für schmale Displays ausgelegt.

## Weitere Seiten hinzufügen

In den Einstellungen (⚙) → **+ Seite hinzufügen**:
- **Name/Label:** erscheint im Mail-Betreff.
- **URL:** die zu überwachende Seite.
- **CSS-Selektor:** optional, grenzt den überwachten Bereich ein (Standard `#content`).
  Wenn leer oder nicht gefunden, wird der gesamte Seitentext überwacht.
- **Intervall:** Prüfabstand in Minuten.

Für andere Domains als dresden.de muss in `manifest.json` unter
`host_permissions` der entsprechende Eintrag ergänzt und das Add-on neu geladen
werden, z. B. `"https://www.example.com/*"`. Alternativ `"<all_urls>"` setzen
(prüft dann alle Seiten, weitreichendere Berechtigung).

## Wie eine Änderung erkannt wird

Zwei Signale, eines davon genügt:
1. SHA-256-Hash des extrahierten Textes ändert sich.
2. Der Zeitstempel "letzte Änderung: …" auf der Seite ändert sich.

Bei einem Netzwerkfehler bleibt der gespeicherte Stand erhalten, damit eine
kurze Störung keine echte Änderung verschluckt.
