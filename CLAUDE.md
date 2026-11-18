# Projektkontext für Claude

Sprache: immer auf Deutsch antworten.

## Projekt
**Kraterläufer** – eigener seitlich scrollender Mond-Rover-Shooter (Genre der 80er-Arcades, KEIN Nachbau eines bestimmten
Spiels; eigene Welt, Gegner, Grafik, Musik; keine Namen bekannter Spiele verwenden). Wunsch des Users: „80er-Style mit
modernem Touch“, Grafiken über Draw Things (lokale App, erzeugt in seiner lokalen Session).

- Reines HTML/JS: `index.html` (Overlays, Touch-Knöpfe ◀ ▶ SPRUNG FEUER, Hochformat-Hinweis), `game.js`
- Logische Auflösung 225 px hoch, Breite 300–480 nach Format, Querformat. Bodenlinie GROUND = 140 (darunter liegen
  die Touch-Knöpfe, der Rover bleibt frei).
- Testzugang `window.__kl` (G, state, start, update(dt), keys, pad). Bot-Test: springt bei Gefahr (Flanke drücken!),
  feuert dauernd; mit Schutz läuft er durch alle 6 Etappen bis Runde 2.
- localStorage: `kraterlaeufer-hi`, `kraterlaeufer-ton`

## Inhalt
- 6 Etappen (STAGES, eigene Farben; Etappe 3 und 6 mit Endgegner „Kampfläufer“, Etappe 4 dunkel mit Vignette),
  danach Runde 2 (G.loop) schwieriger.
- Hindernisse immer lösbar erzeugt (spawnAhead): Krater, kleiner/großer Fels, Mine, Kriecher, Kombinationen.
- Luft: Drohnen (Bomben), Bomber (3 Bomben); Bomben reißen Krater frühestens 95 px vor dem Rover.
- Schuss nach vorn (y = Rover − 7, Reichweite 330 px) und nach oben; Sprungpuffer 0,15 s; Sprung halten = höher.
- Moderner Touch: Scheinwerfer, additive Glows, Staub, Shake, Flash, Parallax (Himmel, ferne/nahe Berge).
- Audio: Web-Audio-Synthwave (Am F C G, Saw-Bass-Arp, Kick/Snare/Hat, Lead), Boss-Modus schneller; SFX.

## Grafik
- Code-Grafik als Fallback; `assets/<name>.png|jpg` ersetzt sie (loader oben in game.js). Manifest: buggy, drone,
  bomber, crawler, rock_small, rock_big, mine, walker, bg_far/bg_near (tile_x: nahtlos), bg_sky (jpg), title (jpg).
- `tools/import_art.py`: Hintergrund = häufigste Eckfarbe am Rand (Magenta), Saum-Entfernung, Zuschnitt nach Alpha,
  `tile_x` blendet die rechte Kante über die linke (nahtlos).

## Verlauf
- 2026-11-18: v0.1 gebaut (Code-Grafik), Prompt-Liste für Draw Things geschrieben. Repo theossel-sys/kraterlaeufer
  angelegt, gepusht. 12 Bilder aus der lokalen Session (Commit f764dad) werden automatisch geladen; im Spiel geprüft
  (Gebirgsebenen kacheln nahtlos, Sprites sitzen auf dem Boden). Weil die Bilder in jeder Etappe gleich sind, bekommt
  jede Etappe eine Farbstimmung (STAGES[].tint, multiply über Himmel+Gebirge; Schattenkrater dunkel).
