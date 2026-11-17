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
3. **Wichtig: Authentifizierung.** Deine Familie hat keinen Pangolin-Login. Es gibt zwei Möglichkeiten:
   - Einfach: Für diese Resource die Pangolin-Authentifizierung (SSO) **ausschalten**. Geschützt ist die Seite trotzdem: Jeder Link enthält einen langen Zufallstoken, und ohne Token sieht man nur die Startseite.
   - Extra sicher: SSO anlassen und über die **Regeln** der Resource diese Pfade ohne Login erlauben („Bypass Auth“):
     `/`, `/w/*`, `/api/w/*`, `/static/*`, `/shell/*`, `/sw.js`, `/manifest.webmanifest`, `/favicon.ico`, `/apple-touch-icon.png`.
     Der Bereich `/admin/*` und `/api/admin/*` liegt dann zusätzlich hinter deinem Pangolin-Login.
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

Die Farben von Emmi und Micky stehen oben in `public/js/art.js` (`DOGS`). Dort lassen sie sich an die echten Hunde anpassen. Nach Änderungen an Dateien in `public/` sollte in `public/sw.js` die `VERSION` hochgezählt werden, damit installierte Apps das Update laden.

## Datenschutz & Sicherheit

- Jeder Personen-Link hat einen eigenen Zufallstoken (96 Bit), der Admin-Link 144 Bit.
- Das Los wird erst nach dem Klick auf „Ja“ vom Server geholt. Link-Vorschauen (z. B. in WhatsApp) verraten also nichts und zählen auch nicht als „geöffnet“.
- `Referrer-Policy: no-referrer`, `noindex`, strenge Content-Security-Policy, keine externen Ressourcen (Schriften sind lokal eingebunden).
- Backup: das Volume `wichtel-data` sichern, darin liegt `db.json`.

Schriften: [Fredoka](https://fonts.google.com/specimen/Fredoka) und [Mountains of Christmas](https://fonts.google.com/specimen/Mountains+of+Christmas), beide unter der SIL Open Font License.
