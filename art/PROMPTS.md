# Kraterläufer – Prompts für Draw Things

Stil: **80er-Pixelart mit modernem Touch** – kräftige Synthwave-Farben (Violett, Magenta, Cyan), saubere Pixel,
leuchtende Akzente. Eigene Motive, keine Namen bekannter Spiele in die Prompts schreiben.

## So geht's
1. **Modell:** wie bei den anderen Spielen (FLUX bzw. SDXL, für Pixel-Look gern mit LoRA „Pixel Art XL“).
   **Ein Modell und eine feste Seed** für alle Bilder.
2. **Sprites:** 1024 × 1024, **Seitenansicht**, ein Objekt, **magentafarbener Hintergrund (#FF00FF)** – oder selbst
   freistellen (PNG mit Transparenz).
3. **Gebirgsebenen** (`bg_far`, `bg_near`): **breites Format 1536 × 512**, Gebirge unten im Bild, darüber Magenta.
   Das Import-Skript macht sie automatisch nahtlos kachelbar.
4. **Himmel und Titelbild** mit Hintergrund (nicht freistellen).
5. Dateinamen wie unten, nach `art/incoming/`, dann `python3 tools/import_art.py`, `art/incoming/` und `assets/`
   committen und pushen.

**Stil-Zusatz für Sprites:**
> , retro 1980s arcade game sprite with a modern polish, high quality pixel art, crisp pixels, limited synthwave palette
> of purple, magenta, cyan and warm white, subtle neon highlights, side view, single object centered, isolated on a
> solid pure magenta background (#FF00FF), no shadow

**Negativ-Prompt (immer):**
> text, letters, watermark, logo, signature, frame, border, multiple objects, cropped, blurry, photo, 3d render,
> perspective view, top-down view, white background, gradient background

## Sprites

| Datei | Prompt |
|---|---|
| `buggy.png` | a six-wheeled lunar rover buggy driving to the right, white and lavender armored body, small cyan cockpit dome, a short forward cannon at the front and a vertical cannon on the roof, magenta stripe, antenna with a small light, big chunky wheels |
| `drone.png` | a small flying saucer drone with a dark violet hull and a row of glowing cyan lights, compact and round |
| `bomber.png` | a sleek alien bomber spacecraft flying to the left, dark purple hull, magenta engine glow, sharp wedge shape |
| `crawler.png` | a small armored crawling robot bug with six short legs and a single glowing magenta eye, low and wide |
| `rock_small.png` | a small jagged grey-lavender moon rock |
| `rock_big.png` | a large jagged moon boulder with sharp edges, grey-lavender with highlights |
| `mine.png` | a flat round landmine half buried in moon dust with a small red blinking light |
| `walker.png` | a huge two-legged battle walker mech facing left, boxy armored body, glowing magenta visor slit, a long cannon arm, missile pods on the side, menacing, tall composition |

## Hintergrund

| Datei | Größe | Prompt |
|---|---|---|
| `bg_far.png` | 1536 × 512 | a distant jagged lunar mountain range silhouette along the bottom of the image, layered purple and violet tones with soft rim light on the peaks, pixel art, wide panorama, solid pure magenta background (#FF00FF) above the mountains |
| `bg_near.png` | 1536 × 512 | low rolling moon hills and small craters along the bottom of the image, dusty lavender-grey with darker shading, pixel art, wide panorama, solid pure magenta background (#FF00FF) above the hills |
| `bg_sky.png` | 1344 × 768 | deep space sky seen from the moon, the blue planet Earth half lit in the upper right, a faint magenta and violet nebula, many small stars, dark and calm, pixel art with smooth modern gradients, no ground |

## Titelbild

| Datei | Größe | Prompt |
|---|---|---|
| `title.png` | 1344 × 768 | retro 1980s sci-fi arcade poster, a six-wheeled lunar rover jumping over a crater on the moon, glowing cyan and magenta laser shots, a battle walker mech and flying saucers in the background, the Earth rising over the horizon, synthwave colors, dramatic lighting, painted pixel art, empty dark space in the upper third for a title |

Negativ-Prompt für Himmel und Titelbild: `text, letters, watermark, logo, signature, frame, border`
