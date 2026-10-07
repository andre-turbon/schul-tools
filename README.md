# schul-tools

Kleine HTML-Tools für Classroomscreen, gehostet als Cloudflare Worker (Free-Plan).
Zugriff nur mit Schlüssel im Link: `https://schul-tools.<subdomain>.workers.dev/<SCHLÜSSEL>/<tool>/`

## Einmalig einrichten

Voraussetzung: Node.js (LTS) und ein kostenloses Konto auf dash.cloudflare.com.

```powershell
cd schul-tools
npm install
npx wrangler login                 # öffnet Browser, Cloudflare-Konto bestätigen

# Schlüssel erzeugen (PowerShell) – Ausgabe notieren:
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | % {[char]$_})

npm run set-key                    # Schlüssel einfügen (wird verschlüsselt bei Cloudflare gespeichert)
npm run deploy                     # gibt die Worker-Adresse aus
```

## Neues Tool hinzufügen / Tool ändern

1. Ordner unter `public/` anlegen, z. B. `public/zahlen/index.html`
2. `npm run deploy`

Link: `https://schul-tools.<subdomain>.workers.dev/<SCHLÜSSEL>/zahlen/`

## Einbindung in Classroomscreen (Embed-Widget)

```html
<iframe src="https://schul-tools.<subdomain>.workers.dev/<SCHLÜSSEL>/buchstaben/?t=2" width="100%" height="100%" style="border:0"></iframe>
```

## Schlüssel wechseln

`npm run set-key` mit neuem Wert → alter Link ist sofort ungültig; iFrame-Codes in Classroomscreen anpassen.

## Lokal testen

Datei `.dev.vars` mit `ACCESS_KEY=test` anlegen (nicht weitergeben), dann `npm run dev`
und `http://localhost:8787/test/buchstaben/` öffnen.

## Verhalten

- Falscher/fehlender Schlüssel → 404
- Header: `noindex`, `no-referrer`, `no-store`
- Optional `FRAME_ANCESTORS` in `wrangler.jsonc` setzen, um Einbettung nur in Classroomscreen zu erlauben
