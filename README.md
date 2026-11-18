# Kraterläufer

Ein eigener, seitlich scrollender Mond-Rover-Shooter im Browser: **80er-Pixeloptik mit modernem Touch**
(Scheinwerferkegel, leuchtende Schüsse und Explosionen, Parallax-Himmel mit Erde und Nebel, Staub, Kameraschütteln,
Synthwave-Musik). Für iPhone/iPad im Querformat und den Desktop.

## Spielen
`index.html` über einen Webserver öffnen (z. B. `python3 -m http.server`). Auf dem iPhone: Safari →
„Teilen → Zum Home-Bildschirm“, Gerät quer halten.

- **Handy:** ◀ ▶ Tempo · SPRUNG (halten = höher) · FEUER (halten = Dauerfeuer)
- **PC:** ← → Tempo · ↑ oder Leertaste springen · X feuern · P Pause

## Spiel
- Etappen über Mondmeere und Hochländer (Mare Imbrium, Kopernikus-Ebene, Tycho-Hochland, Schattenkrater,
  Apennin-Grat, Mare Nubium), danach von vorn und schwieriger.
- Ein Schuss geht immer **nach vorn und nach oben** gleichzeitig.
- Krater und Minen überspringen, Felsen wegschießen oder überspringen, Kriecher abschießen.
- Drohnen und Bomber werfen Bomben – sie reißen **neue Krater** in den Weg; Bomben lassen sich abschießen.
- Jede dritte Etappe endet mit einem **Kampfläufer**: Raketen in Bodenhöhe überspringen, Plasmabomben ausweichen.
- Zeitbonus pro Etappe, Extraleben bei 20.000 Punkten, danach alle 30.000. Rekord wird gespeichert.
- Sprungpuffer: Wer kurz vor der Landung drückt, springt beim Aufsetzen sofort wieder ab.

## Grafik
Alles hat eine Code-Variante, damit das Spiel sofort läuft. Bilder aus Draw Things ersetzen sie automatisch:
Prompts in `art/PROMPTS.md`, Größen in `art/manifest.json`, Rohbilder nach `art/incoming/`, dann
`python3 tools/import_art.py` (stellt frei, macht Gebirgsebenen nahtlos kachelbar, skaliert) → `assets/`.

## Technik
`index.html` (Menüs, Touch-Knöpfe), `game.js` (alles andere). Testzugang: `window.__kl`.
