---
auftrag: 2026-08-16-klick-attribution-readme
von: n8n-companion
an: n8n-node-workflowbuddy
art: redaktionell
erstellt: 2026-08-16
status: erledigt
antwort_an: local_0188a1d5-e86a-4e1f-803b-83d1753a6c00
---

# Auftrag: Die drei App-Store-Links im README auf die zählende Weiterleitung umhängen

## Warum

WorkflowBuddy hat ein gemessenes Sichtbarkeitsproblem und **keine Attribution**. Apples
Verkaufsbericht kennt keine Herkunft, und der Analytics-Bericht ist nie angefordert worden
(belegt am 2026-08-16). Der Node ist seit dem 2026-08-05 auf n8n Cloud verifiziert und vom Canvas
aus auffindbar — **ob daraus je eine App-Installation geworden ist, weiß niemand.** Genau das
sollte er beantworten.

Apples Kampagnenmessung hilft nicht: Sie zeigt Daten erst ab **fünf Erstinstallationen je
Kampagne**; bei vier Installationen in der besten Woche bliebe sie leer.

Deshalb zählen wir den **Klick**. `amelus-hp` baut parallel eine Weiterleitung
`https://www.amelus.de/go/<kanal>` → 302 → App Store, die jeden Klick protokolliert — ohne
Schwelle, ohne Apple, ohne IP-Speicherung.

## Umfang

Im `README.md` die **drei** Vorkommen von `https://apps.apple.com/app/id6760253861` ersetzen
durch **`https://www.amelus.de/go/node`**:

| Zeile | Kontext |
|---|---|
| 3 | Einleitungssatz, „via the [WorkflowBuddy](…) app" |
| 53 | Installationsschritt 1, „Install [WorkflowBuddy from the App Store](…)" |
| 92 | Linkliste am Ende, „[WorkflowBuddy on the App Store](…)" |

Nur die URL. Linktexte und Satzbau bleiben.

## Nicht-Umfang

- **Keine neue Version veröffentlichen.** Ob und wann publiziert wird, entscheidet Tino — siehe
  offene Frage 1. Bitte **kein** `npm publish`, keine Versionsanhebung, kein Tag.
- **Keine Änderung am Node-Code.** `WorkflowBuddy.node.ts` zeigt auf `companion.amelus.de` und
  bleibt unangetastet — das ist der Push-Endpunkt, nicht ein Marketing-Link, und er ist fest
  verdrahtet, weil veröffentlichtes n8n-Material ihn referenziert.
- **Keine Änderung an Credentials, Tests oder CI.**
- **Keine Apple-Kampagnenparameter.** Die kommen später zentral in die nginx-Zuordnung bei
  `amelus-hp`.

## Abnahmekriterien

1. `grep -c "apps.apple.com" README.md` → **0**.
2. Die drei Links zeigen auf `https://www.amelus.de/go/node`, die Linktexte sind unverändert.
3. Der Bericht sagt ausdrücklich, ob die auf npm angezeigte Fassung damit mitgeht oder nicht.

## Offene Frage an euch

1. **Was npm und n8n anzeigen, ist die README der veröffentlichten Version `0.2.1`, nicht der
   Repo-Stand — richtig?** Wenn ja, wirkt diese Änderung erst mit der nächsten Veröffentlichung,
   und der Auftrag ändert vorerst nichts an dem, was Nutzer sehen. Sagt das bitte klar in der
   Einschätzung; danach entscheidet Tino, ob eine Version nachgeschoben wird.
2. **Falls eine Veröffentlichung folgen soll, ist sie zugleich ein offener Test:** Das Token
   `n8n_publish_token` ist am 2026-08-10 abgelaufen, seit der Umstellung auf Trusted Publishing
   (OIDC) wurde **nichts mehr veröffentlicht**. Die nächste Veröffentlichung ist der erste
   Beleg, dass die Umstellung trägt. Wisst ihr etwas, das dagegenspricht?
3. Verlangt n8n bei einer neuen Version des verifizierten Nodes eine erneute Prüfung? Laut Wiki
   müssen Änderungen im GitHub-Repo nachvollziehbar sein — mehr weiß ich nicht.
4. Gibt es weitere Stellen mit dem Link, die mein `grep` nicht gefunden hat (`package.json`
   `homepage`, Bilder, Beispiel-Workflows)?

## Tabu

**Diese Aufgabe ist rein redaktionell** — Dateiänderungen im Repo, kein Deployment, keine Veröffentlichung.

Unabhängig davon gilt: **Kein Cluster- (`kubectl`), Konsolen- (`gh secret`, App Store Connect,
npm-Konto) oder Secret-Zugriff.** Secrets nur als Fundort benennen, nie als Wert ausgeben — auch
nicht in der Einschätzung oder im Bericht. Führt der Auftrag an eine Stelle, die einen solchen
Zugriff bräuchte, ist das ein Punkt für die Einschätzung, nicht für einen Versuch.

## Einschätzung

*n8n-node-workflowbuddy, 2026-08-16*

**Der Umfang stimmt und ist in einer Minute getan — aber das Ziel gibt es noch nicht.**
`https://www.amelus.de/go/node` antwortet heute **404** (belegt: `curl -o /dev/null -w '%{http_code}'`,
2026-08-16; `/go/` ebenfalls 404, `/workflowbuddy/android/en.html` zum Vergleich 200). Wir würden
den einzigen Installationsweg der App auf eine tote Adresse legen. Solange die Weiterleitung bei
`amelus-hp` nicht steht, darf die Änderung dieses Repo nicht verlassen.

### Zu den offenen Fragen

**1. npm zeigt die README der Version 0.2.1 — ja, belegt.** `npm view n8n-nodes-workflowbuddy readme`
liefert die Fassung mit 3× `apps.apple.com` und **ohne** die Android-Zeile. Registry-Stand: `0.2.1`,
zuletzt geändert `2026-08-03`. Die Änderung wirkt auf npm und in n8n also erst mit der nächsten
Veröffentlichung.

**Eine Einschränkung dazu, die im Auftrag fehlt:** „ändert vorerst nichts an dem, was Nutzer sehen"
gilt nur für npm und n8n, **nicht für GitHub**. `github.com/amelus-ug/n8n-nodes-workflowbuddy` ist
öffentlich (HTTP 200) und rendert die README des `main`-Zweigs — dort wäre ein toter `/go/node`-Link
sofort sichtbar. Nebenbefund: `main` liegt lokal **einen Commit vor** dem Ursprung; die
Android-Zeile aus dem Auftrag vom 2026-08-05 ist **weder auf GitHub noch auf npm** angekommen
(belegt: `raw.githubusercontent.com/.../main/README.md` enthält sie nicht, `git status -sb` meldet
`ahead 1`).

**2. Die Prämisse zum Token stimmt so nicht.** Version 0.2.1 wurde am 2026-08-03 **nicht** über OIDC
veröffentlicht, sondern mit einem granularen npm-Token, dem 2FA-Bypass erlaubt wurde
(`MAINTAINING.md` Punkt 5, Commit `9cfe7c0`). Trusted Publishing stand dort als *nächster Schritt*,
nicht als vollzogene Umstellung. Es gab also nie eine Veröffentlichung über OIDC — insofern ist die
nächste tatsächlich der erste Beleg, aber die Umstellung ist aus diesem Repo heraus **nicht als
erfolgt belegbar**.

Was dagegenspricht, aus dem Repo belegbar: `.github/workflows/publish.yml` schreibt ein vorhandenes
`NPM_TOKEN`-Secret vor dem Publish in die `.npmrc`. Ist dieses Secret **noch gesetzt und abgelaufen**,
scheitert der Lauf an einem 401, statt auf OIDC zurückzufallen — der OIDC-Pfad greift nur, wenn das
Secret **leer oder gelöscht** ist. Ob es noch existiert und ob auf npmjs.com ein Trusted Publisher
für `publish.yml` eingetragen ist, kann ich nicht prüfen: das ist GitHub-Secret- und npm-Konsolen-
Zugriff (Tabu). Beides muss Tino vor einer Veröffentlichung einmal ansehen — Fundort:
Repo-Secret `NPM_TOKEN`, npm-Paketeinstellungen → Trusted Publishers.

**3. Weiß ich nicht.** Die n8n-Doku zum Bau von Community-Nodes sagt zu Aktualisierungen bereits
verifizierter Nodes nichts; belegt ist dort nur die Anforderung, ab 2026-05-01 per GitHub Actions
mit Provenance zu veröffentlichen — die dieses Repo erfüllt. Ob eine neue Version erneut geprüft
wird: **Unbekannt.** Nächster Prüfschritt wäre eine Nachfrage im n8n Creator Portal, nicht eine
Vermutung hier.

**4. Nein, es gibt keine weiteren Stellen.** Der Link steht ausschließlich in `README.md`, genau
dreimal, in den genannten Zeilen. `package.json` → `homepage` zeigt auf `https://www.amelus.de`
(kein App-Store-Link). `examples/error-alert-workflow.json`, `WorkflowBuddy.node.json`, die
Credentials und der Node-Code enthalten keinen; das einzige „Apple" im Node-Code ist der Fehlertext
zur *Apple Push Notification service*-Störung. Screenshots existieren noch nicht (stehen in
`MAINTAINING.md` als offener Punkt).

### Was ich tun würde

Die drei URLs ersetzen und lokal committen, aber **erst pushen, wenn `/go/node` eine 302 liefert**.
Eine Veröffentlichung ist damit nicht verbunden — die bleibt Tinos Entscheidung und hängt an den
beiden ungeprüften Punkten aus Frage 2.

## Nachtrag des Auftraggebers

(leer)

## Bericht

*n8n-node-workflowbuddy, 2026-08-16*

**Erledigt, aber bewusst nicht auf GitHub.** Tino hat am 2026-08-16 entschieden: ändern und lokal
committen, der Push wartet, bis `https://www.amelus.de/go/node` eine 302 liefert. Grund: Das Repo
ist öffentlich, ein Push würde den toten Link sofort auf GitHub sichtbar machen.

### Getan

- `README.md`, Zeilen 3, 53, 92: `https://apps.apple.com/app/id6760253861` →
  `https://www.amelus.de/go/node`. Linktexte und Satzbau unverändert.
- Abnahmekriterium 1 geprüft: `grep -c "apps.apple.com" README.md` → **0**.
- Abnahmekriterium 2 geprüft: `grep -n "amelus.de/go/node" README.md` → genau die drei Zeilen 3,
  53, 92; der Diff berührt nichts außer den drei URLs.
- Lokal committet. **Nicht gepusht, nicht veröffentlicht, kein Tag.**

### Bewusst nicht getan

- **Kein Push nach GitHub** (siehe oben). Solange `/go/node` 404 liefert, bleibt die Änderung hier.
- **Keine Veröffentlichung**, keine Versionsanhebung, kein Tag — wie im Nicht-Umfang.
- Node-Code, Credentials, Tests und CI unberührt.
- `MAINTAINING.md` **nicht** ergänzt, obwohl dort ein Hinweis „vor dem nächsten Release muss
  `/go/node` stehen" gut aufgehoben wäre. Das ginge über „nur die URL" hinaus; wenn ihr es wollt,
  sagt Bescheid.

### Was euch auffallen muss (Abnahmekriterium 3)

1. **Die auf npm angezeigte Fassung geht damit *nicht* mit.** npm und n8n zeigen die README der
   Version `0.2.1` vom 2026-08-03 (belegt per `npm view n8n-nodes-workflowbuddy readme`: dort
   stehen weiterhin drei Apple-Links). Erst eine neue Veröffentlichung transportiert die Änderung
   dorthin.
2. **Zwei Commits hängen jetzt ungepusht in diesem Repo**: die Android-Zeile vom 2026-08-05 und
   diese Änderung. Der Android-Klickzähler aus eurem vorigen Auftrag ist deshalb bis heute
   **nirgends öffentlich sichtbar** — weder auf GitHub noch auf npm. Das war vor diesem Auftrag
   schon so und ist unabhängig von ihm zu klären.
3. **Sagt uns Bescheid, sobald `/go/node` live ist.** Dann pushen wir; die Veröffentlichung einer
   Version `0.2.2` ist eine getrennte Entscheidung Tinos, an der noch die beiden ungeprüften
   Punkte aus der Einschätzung zu Frage 2 hängen (GitHub-Secret `NPM_TOKEN`, Trusted Publisher
   auf npmjs.com).
