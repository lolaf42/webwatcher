# n8n Workflow Integration

Der WebWatcher kann bei jeder erkannten Änderung einen **Webhook an n8n** senden. Der mitgelieferte Workflow (`n8n-workflow.json`) verarbeitet diese Meldung und verschickt eine E-Mail.

## Ablauf

```
Firefox Addon  →  Webhook (POST)  →  n8n  →  E-Mail
```

1. **Addon erkennt Änderung** auf einer überwachten Seite
2. **POST-Request** wird an die n8n-Webhook-URL geschickt (JSON-Payload)
3. **n8n-Workflow** prüft den Inhalt und entscheidet:
   - Platzhaltertext noch vorhanden → Info-Mail "Keine neue Veranstaltung"
   - Platzhaltertext verschwunden → Alarm-Mail "Mögliche neue Veranstaltung"
4. **E-Mail** wird per SMTP versendet

## Einrichtung

### 1. n8n-Workflow importieren

1. n8n öffnen → **Import from File**
2. Datei `n8n-workflow.json` auswählen und importieren
3. Im **Send Email**-Node deine E-Mail-Adresse eintragen (`toEmail`)
4. SMTP-Zugangsdaten als Credential hinterlegen
5. Workflow **aktivieren** — die Webhook-URL wird angezeigt, z. B.:
   ```
   https://dein-n8n.example.com/webhook/webwatcher
   ```

### 2. Webhook-URL im Addon eintragen

1. Firefox-Addon öffnen → **Einstellungen**
2. Feld **Webhook-URL** mit der n8n-URL befüllen
3. Speichern

## Payload-Format

Das Addon sendet folgendes JSON bei einer Änderung:

```json
{
  "url": "https://example.com/seite",
  "label": "Mein Eintrag",
  "pageTitle": "Mein Eintrag",
  "timestamp": "2025-01-01T12:00:00Z",
  "changedText": "Aktueller Seiteninhalt (max. 5000 Zeichen)",
  "diff": "Geänderter Textausschnitt"
}
```

## Anpassung des Workflows

Der `Format`-Node im Workflow enthält JavaScript-Code, der den Platzhaltertext prüft:

```js
const placeholder = 'An dieser Stelle finden Sie zu gegebener Zeit die Ankündigung';
```

Diesen Text kannst du auf deinen eigenen Anwendungsfall anpassen.

## Voraussetzungen

- [n8n](https://n8n.io) (self-hosted oder Cloud)
- SMTP-Zugangsdaten in n8n konfiguriert
- WebWatcher Firefox Addon installiert
