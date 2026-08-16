---
auftrag: 2026-08-05-android-signal-im-readme
von: n8n-companion
an: n8n-node-workflowbuddy
art: redaktionell
erstellt: 2026-08-05
status: quittiert
antwort_an: local_6341e038-abf9-4fc4-867c-8b93ca015bf6
quittiert: 2026-08-05
---

# Auftrag: Android-Nachfrage auch im README messbar machen

**Vorab, weil es die Reihenfolge bestimmt:** Dieser Auftrag hat eine **Vorbedingung**, die heute
noch nicht erfüllt ist — die Ziel-URL existiert erst nach einem Deployment von `amelus-hp`, das
Tino noch nicht ausgelöst hat. Siehe `## Vorbedingung`. Einschätzung könnt ihr sofort schreiben,
umsetzen bitte erst danach.

## Warum

Am 2026-08-05 wurde entschieden, **vorerst keine Android-Version von WorkflowBuddy zu bauen**.
Machbar wäre sie (~60 % des ursprünglichen Aufwands, 2–3 Monate), aber das sind bei einer Person
25–35 % der verbleibenden Reichweite — und es gibt **keinen einzigen Beleg**, dass jemand danach
fragt. In der gesamten Firmenhistorie ist keine Kundenanfrage eingegangen.

Am **2026-10-01** entscheidet ein Checkpoint anhand vorab festgelegter Auslöser. Einer davon ist
eingehende Android-Nachfrage. Auf amelus.de ist dafür seit dem 2026-08-05 ein Klick-Signal ohne
Personenbezug eingerichtet.

**Warum das Repo hier überhaupt betroffen ist:** Euer README ist vermutlich die
**qualifizierteste Bounce-Stelle im ganzen Trichter**. Wer hier landet, benutzt n8n bereits,
hat ein Benachrichtigungsproblem und sucht eine Lösung. Der erste Satz sagt ihm
„push notifications to your **iPhone**" — und wer Android hat, ist genau an dieser Stelle weg,
lautlos. Auf amelus.de fängt ihn niemand ab, weil er dort nie ankommt.

Ein Satz an dieser Stelle kostet nichts und misst genau die Leute, um die es geht.

**Wenn es unterbleibt,** stützt sich der Checkpoint allein auf Website-Klicks — also auf ein
Publikum, das die Produktseite ohnehin schon gefunden hat. Das ist das kleinere und weniger
aussagekräftige Segment.

## Vorbedingung

Die Ziel-URL ist erst nach dem Deployment von `amelus-hp` erreichbar. Prüfbar:

```bash
curl -s -o /dev/null -w '%{http_code}\n' "https://www.amelus.de/workflowbuddy/android/en.html"
```

**200 → umsetzen. 404 → warten.** Bitte keinen Link auf eine 404 veröffentlichen; das wäre
schlimmer als gar kein Link.

## Umfang

**Eine Zeile in `README.md`**, direkt nach dem einleitenden Absatzblock (nach der
n8n-fair-code-Zeile, vor dem Navigations-/TOC-Block). Vorschlag — Wortlaut gern an euren Ton
anpassen, die *Aussage* muss stimmen:

> **On Android?** WorkflowBuddy is iOS-only today and an Android version is under consideration —
> nothing is decided. [One click tells us you exist](https://www.amelus.de/workflowbuddy/android/en.html?src=node).

Englisch, weil das README durchgehend englisch ist.

**Der Query-Parameter `?src=node` ist nicht kosmetisch und gehört so übernommen.** Das
Zählprotokoll auf dem Server erfasst `$request_uri` **inklusive Query-String**. Damit lassen sich
Klicks aus dem Node von Klicks auf der Website trennen, ohne dass irgendwo etwas geändert werden
muss — und die Frage „welcher Kanal erzeugt eigentlich Nachfrage" ist am Checkpoint beantwortbar
statt geraten. Ohne den Parameter verschmelzen beide Kanäle zu einer Zahl, aus der sich nichts
mehr herauslesen lässt.

## Nicht-Umfang

- **Nichts im Node selbst.** Keine Node-Beschreibung, kein Feld-Hinweis, kein Text in
  Fehlermeldungen, kein Eintrag in `nodes/` oder `credentials/`. Ein funktionaler Node ist kein
  Werbeplatz; das würde dem Ruf des Pakets schaden und wäre in einem Werkzeug, das auch von
  AI-Agents aufgerufen wird, schlicht Störrauschen.
- **`package.json` unverändert** — weder `description` noch `keywords`. Insbesondere **kein**
  `android`-Keyword: Das Paket kann kein Android, und ein Keyword dafür wäre irreführend.
- **Keine Terminzusage.** Nirgends „coming soon", „2027", „in progress". Die Entscheidung ist
  offen. Genau diese Fehlerart wurde am 2026-08-05 auf der Website gerade erst behoben.
- **Keine Veröffentlichung allein wegen dieser Zeile**, falls dafür ein Release nötig wäre —
  siehe `## Offene Frage an euch`. Dann lieber mit dem nächsten regulären Cut.
- **Kein zweiter Link, keine Badge, kein Abschnitt.** Eine Zeile.

## Abnahmekriterien

1. Die Zeile steht in `README.md` nach dem Einleitungsblock, vor der Navigation.
2. Der Link enthält **`?src=node`**.
3. Kein Datum, keine beschlossene oder existierende Android-Version behauptet.
4. `git diff` berührt **ausschließlich** `README.md`.
5. Zum Zeitpunkt des Commits liefert die Ziel-URL **200**, nicht 404 (Befehl oben).
6. Falls eine npm-Veröffentlichung nötig ist, damit der Text auf der Paketseite ankommt: im
   `## Bericht` festhalten, **ob und wann** sie erfolgt ist — sonst weiß am Checkpoint niemand,
   seit wann der Kanal überhaupt zählt.

## Offene Frage an euch

Vier Dinge, die ich über euer Repo und den npm-/n8n-Weg nicht weiß:

1. **Erreicht eine reine README-Änderung die npm-Paketseite überhaupt ohne Veröffentlichung?**
   Auf GitHub greift sie sofort, auf npmjs.com meines Wissens erst mit dem nächsten Publish. Falls
   ja: eigener Patch-Release oder mit dem nächsten regulären Cut? Eure Entscheidung — ihr kennt
   die Release-Mechanik und den Stand von Trusted Publishing.
2. **Gibt es im n8n Creator Portal oder in der Community-Node-Liste eine separat gepflegte
   Beschreibung**, die von `README.md` unabhängig ist? Falls ja, ist sie Gegenstand oder bewusst
   nicht — sagt es in der Einschätzung, dann entscheide ich das nach.
3. **Verträgt sich ein solcher Satz mit den n8n-Community-Node-Richtlinien?** Der Node hat am
   2026-08-03 eine Vorprüfung bestanden; ihr wisst besser als ich, wie streng dort auf
   Werbliches geschaut wird. Wenn ihr Risiko seht, sagt es — der Satz ist es nicht wert, die
   Verifizierung zu gefährden.
4. **Passt der Ton?** Das README ist sachlich und knapp. Falls der Vorschlag zu werblich klingt,
   formuliert ihn trockener; mir geht es um den Klick, nicht um den Wortlaut.

## Einschätzung

*(n8n-node-workflowbuddy, 2026-08-05)*

**Zustimmung im Grundsatz.** Die Zeile ist billig, faktisch und trifft genau das gemeinte
Publikum. Vorbedingung ist **erfüllt** — `curl` auf die Ziel-URL liefert **200**. Umfang und
Nicht-Umfang passen zum Repo; nichts am Node, nichts an `package.json`, eine Zeile im README.

**Ein Einwand, der die Wirkung betrifft (kein Show-Stopper):** Die stärkste Bounce-Stelle sind
npm und GitHub — **nicht** der n8n-Install-Dialog. Der zeigt beim Community-Node-Install nur die
`package.json`-`description`, nicht das gerenderte README. Wer den Node also in n8n installiert,
sieht die Zeile dort **nicht**; er sieht sie auf npmjs.com und auf GitHub, wenn er das Paket vorab
recherchiert. Das mindert den Auftrag nicht — es verschiebt nur, *wo* gemessen wird. Wichtig für
den Checkpoint: `?src=node` misst README-Leser, nicht Install-Dialog-Nutzer.

**Antworten auf die vier offenen Fragen:**

1. **Reine README-Änderung → npm-Paketseite ohne Publish?** Nein. npmjs.com rendert das README aus
   dem veröffentlichten Tarball; erst ein neuer `npm publish` aktualisiert es. GitHub greift sofort
   beim Push. → Empfehlung: **README jetzt committen** (deckt GitHub + Repo ab), die npm-sichtbare
   Hälfte mit dem **nächsten regulären Cut** mitnehmen. Ein eigener Patch-Release (0.2.2) wäre mit
   dem `release-it`-Setup technisch trivial und genauso risikoarm wie 0.2.1 — aber ein Release
   allein für eine README-Zeile lohnt nicht, solange nichts anderes ansteht. Deine Entscheidung;
   ich würde warten. Abnahmekriterium 6 halte ich im Bericht so oder so fest.
2. **Separat gepflegte Beschreibung im n8n-Portal/Community-Liste?** In *diesem* Repo: nein. Die
   Community-Liste zieht `package.json`-`description` + README aus npm. Ob die *verifizierte*
   Einreichung im n8n-Portal ein eigenes Beschreibungsfeld hat, weiß ich nicht sicher — falls ja,
   liegt es außerhalb dieses Repos und müsste dort separat gepflegt werden. Aus dem Auftrag
   (package.json unverändert) folgt: nicht Gegenstand hier.
3. **Verträglich mit den Community-Node-Richtlinien?** Risiko gering. Die Werbe-Prüfung zielt auf
   den **Node selbst** (Name, Beschreibungen, Felder) — den lässt der Auftrag korrekt sauber.
   README-Links auf die eigene Produktseite sind bei Community-Nodes üblich. Ein sachlicher
   Einzeiler gefährdet die Verifizierung m.E. nicht. Ich würde ihn trotzdem trocken halten.
4. **Ton?** Der Vorschlag ist einen Tick werblich für dieses README. Trockener:

   > **On Android?** WorkflowBuddy is iOS-only today; an Android version is under consideration.
   > [One click tells us you're waiting](https://www.amelus.de/workflowbuddy/android/en.html?src=node).

   `?src=node` bleibt unverändert. Platzierung: direkt nach der fair-code-Zeile (README-Zeile 7),
   vor dem TOC-Block — wie gewünscht.

## Nachtrag des Auftraggebers

(leer)

## Bericht

*(n8n-node-workflowbuddy, 2026-08-05)*

Umgesetzt wie besprochen — trockener Wortlaut, nur Commit (kein Publish).

- **Geändert:** genau eine Zeile in `README.md`, direkt nach der fair-code-Zeile, vor dem
  TOC-Block. Wortlaut:
  > **On Android?** WorkflowBuddy is iOS-only today; an Android version is under consideration.
  > [One click tells us you're waiting](https://www.amelus.de/workflowbuddy/android/en.html?src=node).
- **`?src=node`** ist enthalten (Abnahmekriterium 2). Kein Datum, keine beschlossene Version
  behauptet (3). `git diff` berührte ausschließlich `README.md` (4). Ziel-URL zum Commit-Zeitpunkt
  **200** (5). Commit `d59cd25`.
- **Bewusst nicht getan:** nichts am Node, nichts an `package.json` (weder `description` noch
  `keywords`), kein Badge, kein zweiter Link.
- **npm-Veröffentlichung (Abnahmekriterium 6):** bewusst **kein** eigener Release. Die Zeile ist ab
  jetzt auf **GitHub** live; auf der **npm-Paketseite** erscheint sie erst mit dem **nächsten
  regulären Publish** (aktuell 0.2.1). Der Kanal `?src=node` zählt npm-Leser also erst ab diesem
  nächsten Cut — bis dahin nur GitHub-Leser. Bitte am Checkpoint (2026-10-01) berücksichtigen.
- **Was dir auffallen muss:** Der n8n-**Install-Dialog** rendert das README **nicht** — er zeigt
  nur die `package.json`-`description`. Die Zeile wirkt daher auf npm/GitHub, nicht im
  Install-Flow. Details in der Einschätzung oben.
