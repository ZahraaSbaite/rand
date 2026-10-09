---
name: RRAND
description: A world of color + thread. Handmade crochet, presented as 1970s pattern leaflets.
colors:
  ink-tomato: "#c8381f"
  ink-tomato-deep: "#a92e19"
  ink-marigold: "#f2a516"
  ink-avocado: "#5d7629"
  ink-chocolate: "#34201a"
  stock: "#fbf0d6"
  stock-deep: "#f4e2b8"
  on-ink: "#fff8ea"
  kraft: "#c79a6b"
  chocolate-soft: "#6b4b3b"
typography:
  display:
    fontFamily: "Shrikhand, Georgia, serif"
    fontSize: "clamp(4.25rem, 13vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.9
  headline:
    fontFamily: "Shrikhand, Georgia, serif"
    fontSize: "clamp(2.1rem, 4.6vw, 3.6rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)"
    fontWeight: 800
    lineHeight: 1.15
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "0.8rem"
    fontWeight: 700
rounded:
  frame: "28px"
  book: "6px 22px 22px 6px"
  pill: "999px"
spacing:
  gutter: "clamp(1rem, 4vw, 3rem)"
  section: "clamp(4rem, 9vw, 7rem)"
  container: "1280px"
components:
  button-buy:
    backgroundColor: "{colors.ink-tomato}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 1.3rem"
  button-buy-hover:
    backgroundColor: "{colors.ink-tomato-deep}"
  button-primary:
    backgroundColor: "{colors.ink-chocolate}"
    textColor: "{colors.ink-marigold}"
    rounded: "{rounded.pill}"
    height: "54px"
    padding: "0 1.6rem"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-chocolate}"
    rounded: "{rounded.pill}"
    height: "40px"
  chip-active:
    backgroundColor: "{colors.ink-avocado}"
    textColor: "{colors.on-ink}"
  product-frame:
    backgroundColor: "{colors.stock-deep}"
    rounded: "{rounded.frame}"
    padding: "10px"
---

# Design System: RRAND

## Overview

**Creative North Star: "The Pattern Leaflet"**

RRAND's shop is a stack of 1970s crochet pattern leaflets. Every piece is presented the way an old leaflet presents a pattern: a number stamped on the cover, its facts set plainly, and the rounds it took to make. Colour is offset ink printed flat across whole sections, not accents sprinkled on a neutral page. The sections alternate between marigold cover, uncoated stock, avocado and chocolate, and that rhythm is the page structure.

The world is warm and loud but orderly: one display face with real swagger, workhorse text, typewriter notation for numbers and labels. Motion is physical and crafty: a strand of yarn is worked down the page as you scroll, stamps land with a small overshoot, and yarn balls roll into the basket.

**Key Characteristics:**
- Four inks plus stock; flat full-width ink fields own sections.
- Tomato is the buy action and nothing else.
- Shrikhand display, Archivo text, Courier Prime notation.
- Arched and rounded photo frames, dashed "stitch" lines, round number stamps.
- Night print: the same inks on chocolate stock.

## Colors

Four offset inks on uncoated stock; every colour on the site is one of them or a tint of one.

### Primary
- **Buy Tomato** (ink-tomato): Add-to-cart buttons only. Hover deepens to ink-tomato-deep.

### Secondary
- **Cover Marigold** (ink-marigold): the cover and back-cover fields, selection highlight, active nav state, and the commission call to action on chocolate. Text on marigold is always chocolate.
- **Making Avocado** (ink-avocado): the making section field, active filter chips, the "added" confirmation state.

### Neutral
- **Print Chocolate** (ink-chocolate): text, rules, frame borders, the commission band, primary navigation buttons.
- **Uncoated Stock** (stock) and **Deep Stock** (stock-deep): page ground and quiet surfaces.
- **Kraft** (kraft): a supporting pattern-book ground.
- **Soft Chocolate** (chocolate-soft): secondary text.

Night print (`data-theme="dark"`) redefines the same tokens: stock becomes #22140e, chocolate text becomes #f6e6c8, inks brighten (tomato #ef6748, marigold #f5b43a, avocado #a3bb5b), and text on inks turns dark.

### Named Rules
**The Tomato Is Money Rule.** Tomato and its tints appear only on the buy action. Never on frames, tiles, hovers or headings.

**The Four Inks Rule.** No new hues. A new surface picks one of the four inks or a tint; yarn colour swatches in the colorway builder are content, not interface colour.

**The Ink Field Rule.** Colour commits at section scale: a section is a marigold, avocado or chocolate field, or plain stock. Do not scatter ink as small accents on stock.

## Typography

**Display Font:** Shrikhand (with Georgia)
**Body Font:** Archivo (with system-ui)
**Label/Mono Font:** Courier Prime (with Courier New)

**Character:** A heavy, swashy 70s italic carrying the brand voice over a plain, sturdy grotesk, with typewriter notation for anything numbered.

### Hierarchy
- **Display** (400, clamp(4.25rem, 13vw, 6rem), 0.9): the RRAND logotype on the cover only.
- **Headline** (400, clamp(2.1rem, 4.6vw, 3.6rem), 1.05): section titles and pattern-book labels.
- **Title** (800, clamp(1.4rem, 2.4vw, 1.9rem), 1.15): row and card headings, in Archivo.
- **Body** (400, 1rem–1.1rem, 1.55–1.6): running copy, max about 36rem wide.
- **Label** (700, 0.8rem): leaflet numbers, "Rnd 1:" notation, the ticker, category names.

### Named Rules
**The Notation Rule.** Numbers that count making (leaflet numbers, rounds, book numbers) are set in Courier Prime as pattern notation ("No. 4", "Rnd 2:"), never as eyebrows above headings.

## Layout

Content sits in a 1280px container with fluid gutters (clamp(1rem, 4vw, 3rem)); ink fields bleed full width behind it. Sections get generous vertical padding (clamp(4rem, 9vw, 7rem)). Two-column splits (cover, making rounds, colorway builder, close) collapse to one column under 900px; product grids are auto-fill at 250px min and fixed two-up under 600px. The making photo is sticky beside the rounds on desktop. On phones, the cover keeps the first piece's Add to cart above the fold.

## Elevation & Depth

Flat by default: depth comes from ink fields and 1.5–3px chocolate borders. Shadows are soft and offset, used only on lifted objects: the cover caption card (0 16px 30px -14px), hovered pattern books (0 24px 36px -18px), the round counter and dropdown menus.

**The Printed Flat Rule.** Surfaces rest flat; lift and shadow appear on hover or on objects physically placed on the page (stamps, captions).

## Shapes

Rounded photo frames (28px) set inside a 10px tinted mat; the cover photo is an arch (fully rounded top). Round stamps carry numbers. Pattern books are booklets: square spine edge, rounded fore-edge (6px 22px 22px 6px), with a stapled spine line. Buttons and chips are pills. Lines are dashed like stitches wherever they are decorative: search border, chip outline, link underlines, round dividers, the ring around the cover piece.

## Components

### Buttons
- **Buy** (tomato pill, 40–48px): "Add" / "Add to cart"; turns avocado with "Added" for about 1.5s and launches a yarn ball to the basket.
- **Primary** (chocolate pill with marigold text, 54px): navigation to shop.
- **Commission** (marigold pill with chocolate text on the chocolate band).
- **Text links:** bold, dashed underline that turns solid and drops on hover.
- **Press:** scale(0.94–0.97) on active; hover lifts 2px.

### Chips
- **Style:** pill, dashed chocolate outline, transparent ground.
- **State:** active is solid avocado with on-ink text.

### Cards / Containers
- **Product leaflet card:** tinted mat (marigold, avocado, oat, kraft rotation) around a 4:5 rounded photo, a chocolate round number stamp, a wishlist button on stock, name in Archivo 700, and a price row with category notation and the Add button. On hover the mat fills with its ink and tilts -1deg; the stamp spins. Sold out shows "Sold out, back when it's made" in soft chocolate, and the photo is desaturated.
- **Pattern book tile:** a flat ink booklet with its label in Shrikhand, the number running up the spine, and an arrow; it lifts and tilts on hover.

### Inputs / Fields
- **Style:** pill, dashed border at 45% chocolate; solid border and deep-stock fill on focus.
- **Focus ring (global):** 2.5px dashed tomato outline, 3px offset.

### Navigation
- A running chocolate ticker, then a stock masthead with the RRAND logotype, a search pill and icons, then a centred menu whose links get a stitched underline worked in from the left. The cart badge pops on count change, and the basket jolts when a yarn ball lands. On mobile, a marigold drawer slides in from the left.

### Yarn Strand (signature)
A two-ply strand (5px chocolate core, dashed marigold twist) runs down the page gutters and crosses only at section seams with a chain-stitch loop. It is drawn by scroll, with a rolling yarn ball at its tip. Under reduced motion it is fully drawn and the ball is hidden.

### Colorway Builder (signature)
A granny square whose three rounds the visitor colours from yarn-ball swatches; it links to Custom Orders with the colorway pre-filled.

## Do's and Don'ts

### Do:
- **Do** set every section as one ink field or plain stock.
- **Do** keep text on marigold chocolate in both themes.
- **Do** use the world's motion: draw (strands, stitched underlines), stamp (overshoot landing), roll (yarn balls). Respect `prefers-reduced-motion`.
- **Do** show real product facts only (numbers are product ids, prices, stock).

### Don't:
- **Don't** use tomato anywhere except the buy action.
- **Don't** put a kicker or eyebrow label above a heading.
- **Don't** invent skill ratings, review counts or testimonials to fill the leaflet look.
- **Don't** reintroduce the old pastel lavender/mint palette or Syne/DM Sans.
