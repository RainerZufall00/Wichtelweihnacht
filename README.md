# 🐄🎄 Humberger Wichtelweihnacht

Einmalige Wichtel-Auslosung als PWA, gemacht für den Humberger Demeter-Hof, mit Kühen (natürlich mit Hörnern) und den Hofhunden **Emmi** & **Micky**.

- **Admin-Link**: Namen eintragen, optional Sperren festlegen (z. B. für Pärchen), Budget, Datum der Bescherung und eine Nachricht setzen. Dann die **Milchkannen-Lostrommel** anwerfen.
- Gelost wird **ein großer Kreis**. Niemand zieht sich selbst, und niemand beschenkt sich gegenseitig.
- Der Admin sieht danach die Wichtel-Kette (auf Wunsch mit Spoilerschutz, falls man selbst mitmacht). Zu jeder Person gibt es einen Link mit den Buttons **Teilen / Kopieren / WhatsApp**. Live ist zu sehen, wer sein Los schon geöffnet hat.
- **Personen-Link**: „Bist du wirklich Max?“ → bei *Nö* schlagen Emmi & Micky Alarm. Bei *Ja* folgt eine hochoffizielle Identitätsprüfung und dann ein **Rubbellos im Kuhfell-Look**. Danach gibt es Konfetti, Glöckchen, den Countdown zur Bescherung und den Wunschzettel der beschenkten Person. Den eigenen Wunschzettel kann man dort auch schreiben.
- PWA: installierbar, offline-fähig. Jeder Link wird als eigene App mit dem richtigen Startlink installiert.
- Kleine Extras: Wer Kühe oder Hunde antippt, hört sie muhen oder bellen (per WebAudio erzeugt, ohne Sounddateien).

Keine npm-Abhängigkeiten, nur Node ≥ 20. Die Daten liegen in einer JSON-Datei (`/data/db.json`).

## Starten mit Docker

```bash
git clone <repo> wichtel && cd wichtel
# in docker-compose.yml PUBLIC_URL auf deine Domain setzen
docker compose up -d --build
docker compose logs wichtel     # zeigt den Admin-Link
```

Im Log steht:

```
🔑  Admin-Link: https://wichteln.example.de/admin/<geheimer-token>
```

Wenn `ADMIN_TOKEN` nicht gesetzt ist, wird beim ersten Start ein zufälliger Token erzeugt und im Volume gespeichert. Der Link bleibt also auch nach Neustarts gleich.

## Hinter Pangolin

1. In Pangolin eine neue **HTTP-Resource** anlegen, z. B. `wichteln.deine-domain.de`.
2. Als Ziel eintragen:
   - **Variante A** (Standard in der compose-Datei): Der Port ist nur lokal freigegeben, Ziel ist `http://127.0.0.1:3000` bzw. die Host-IP, über die Newt/Gerbil den Host erreicht.
   - **Variante B**: Den Container ins Docker-Netz von Pangolin/Newt hängen (Block in `docker-compose.yml` einkommentieren). Ziel ist dann `http://wichtel:3000`.
3. **Authentifizierung (empfohlen: Admin hinter Pangolin-Login).** Deine Familie hat keinen Pangolin-Login, du schon. Lass deshalb SSO für die Resource **an** und gib in den **Regeln** der Resource nur diese Pfade ohne Login frei („Bypass Auth“ bzw. „Always Allow“):
   `/`, `/w/*`, `/api/w/*`, `/static/*`, `/shell/*`, `/sw.js`, `/manifest.webmanifest`, `/favicon.ico`, `/apple-touch-icon.png`, `/robots.txt`.
   Alles andere, vor allem `/admin/*` und `/api/admin/*`, erfordert dann deinen Pangolin-Login **und** den geheimen Admin-Link.
   (Notlösung: SSO ganz aus. Dann schützt nur der lange Zufallstoken den Admin-Bereich.)
   Optional: Mit einer Länder-Regel lässt Pangolin nur Zugriffe aus Deutschland durch.
4. HTTPS übernimmt Pangolin. Das wird auch für die PWA-Installation und den Service Worker gebraucht.

## Ablauf

1. Admin-Link öffnen (am besten auf dem Handy und über „Zum Startbildschirm“ als App speichern).
2. Namen eingeben. Mehrere gehen auf einmal, getrennt mit Komma oder Zeilenumbruch.
3. Optional Sperren, Budget, Datum und Nachricht eintragen.
4. **🥛 Lostrommel anwerfen**, die Show genießen.
5. Links per WhatsApp oder Teilen verschicken. Unter „Los geöffnet“ sieht man, wer schon geschaut hat.

Muss doch nochmal gelost werden, gibt es unten den Bereich „Nochmal ganz von vorn“ (zur Bestätigung „NEU AUSLOSEN“ eintippen). Die Links bleiben gleich, außer man wählt „neue Links erzeugen“.

## Lokal entwickeln

```bash
node server.js                    # http://localhost:3000, Admin-Link steht im Terminal
DATA_DIR=./data ADMIN_TOKEN=test node server.js
```

Icons und das Vorschaubild für WhatsApp (`public/img/*.png`) werden aus den SVG-Zeichnungen erzeugt:

```bash
npm i -D playwright && node scripts/build-icons.mjs
```

Emmi (Berner Sennenhund) und Micky (Mini Australian Shepherd) sind in `public/js/art.js` gezeichnet (Funktionen `emmi()` und `micky()`). Nach Änderungen an Dateien in `public/` sollte in `public/sw.js` die `VERSION` hochgezählt werden, damit installierte Apps das Update laden.

## Sicherheit

Auf demselben Server läuft auch der Mailserver. Ziel ist deshalb: Selbst wenn in dieser App etwas schiefgeht, kommt man darüber nicht weiter.

**Container (docker-compose.yml)**
- Basis ist ein **Distroless-Image**: keine Shell, kein Paketmanager, keine Systemtools. Ein Angreifer findet darin praktisch kein Werkzeug.
- Der Container läuft als **unprivilegierter User 65532**, mit `cap_drop: ALL` und `no-new-privileges`.
- Das Dateisystem ist **schreibgeschützt** (`read_only`). Beschreibbar ist nur das Daten-Volume (`db.json` mit Rechten `600`).
- Limits für RAM, CPU und Prozesse verhindern, dass die App den Server (und damit den Mailserver) ausbremst. Die Log-Größe ist ebenfalls begrenzt.
- Der Container hat ein **eigenes Docker-Netz**. Er hängt nicht im Netz des Mailservers, und der Port ist nur auf `127.0.0.1` gebunden.
- Es gibt keinen Zugriff auf `docker.sock` und keine Host-Verzeichnisse.

**App**
- Keine npm-Abhängigkeiten, also keine Angriffsfläche über die Lieferkette.
- **Rate-Limits pro IP**: 10 falsche Admin-Versuche bzw. 20 falsche Wichtel-Links in 15 Minuten führen zur Sperre. Dazu kommen Limits für Schreibzugriffe und Anfragen insgesamt.
- Zufallstoken: 96 Bit pro Person, 144 Bit für den Admin. Der Vergleich erfolgt in konstanter Zeit. Ein eigenes `ADMIN_TOKEN` muss mindestens 24 Zeichen lang sein.
- POSTs werden nur als `application/json` angenommen, was CSRF verhindert. Anfragen sind auf 64 KB begrenzt, Eingaben werden gekürzt und bereinigt, und jede Ausgabe wird escaped.
- Statische Dateien kommen nur aus einer festen Liste von Ordnern. Path-Traversal ist getestet und wird geblockt.
- Timeouts gegen hängende Verbindungen (Slowloris).
- Strenge Security-Header: CSP (nur eigene Skripte), HSTS, `no-referrer`, `X-Frame-Options: DENY`, COOP/CORP, `noindex`.
- Das Los wird erst nach dem Klick auf „Ja“ geladen. Link-Vorschauen verraten nichts.

**Auf dem Server selbst**
- Port 3000 **nicht** öffentlich freigeben. Achtung: Docker umgeht UFW bei veröffentlichten Ports. Deshalb ist der Port fest an `127.0.0.1:3000` gebunden. Diese Bindung nicht ändern.
- `TRUST_PROXY=1` nur verwenden, solange der Port ausschließlich über Pangolin erreichbar ist. Sonst könnte jemand seine IP fälschen und die Rate-Limits umgehen.
- Ab und zu mit `docker compose build --pull && docker compose up -d` neu bauen, damit Node-Sicherheitsupdates ankommen.
- Nach Weihnachten: `docker compose down`. Was nicht läuft, kann auch nicht angegriffen werden. 🎄
- Backup: Volume `wichtel-data` (enthält `db.json`).

Schriften: [Fredoka](https://fonts.google.com/specimen/Fredoka) und [Mountains of Christmas](https://fonts.google.com/specimen/Mountains+of+Christmas), beide unter der SIL Open Font License.
