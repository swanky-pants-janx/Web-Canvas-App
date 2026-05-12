# Web Canvas — Design Asset Board

A lightweight, browser-based infinite canvas for organising web design assets, inspiration, and colour palettes. No build tools required — just open `index.html` in your browser.

---

## Getting Started

1. Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge)
2. Or use the **Live Server** extension in VS Code for hot reload

---

## Features

### Canvas Navigation
| Action | How |
|--------|-----|
| Pan | Click and drag the background |
| Zoom | Scroll wheel |
| Reset view | Click **Reset View** in the toolbar |

### Widgets
| Widget | Description |
|--------|-------------|
| **Image** | Add images via file picker or drag & drop from desktop |
| **Heading** | Large editable heading text |
| **Text** | Body text block for notes |
| **Note** | Yellow sticky note |
| **Palette** | Colour swatch card with hex values |
| **Folder** | Store images off-canvas; click to browse & pull back out |

### Interactions
- **Drag** any widget to reposition it
- **Resize** widgets by dragging the bottom-right corner handle
- **Delete** widgets using the trash button in the widget controls (hover to reveal)
- **Click a colour swatch** to copy its hex value to clipboard
- **Drop images into a folder** to hide them from the canvas
- **Click a folder** to open it and pull images back onto the canvas

---

## File Structure

```
web-canvas-app/
├── index.html    — App shell and markup
├── style.css     — All styles (light + dark mode)
├── canvas.js     — Canvas engine, widget logic, interactions
└── README.md     — This file
```

---

## Customisation

### Adding a default colour palette
In `canvas.js`, find `seedCanvas()` and update the `addPaletteWidget` call:
```js
addPaletteWidget(x, y, ['#your', '#colors', '#here']);
```

### Changing the canvas dot grid
In `style.css`, find the `#app` background-image:
```css
background-image: radial-gradient(circle, var(--border-default) 1px, transparent 1px);
background-size: 24px 24px; /* adjust grid size */
```

### Dark mode
Dark mode is automatic via `prefers-color-scheme`. Override by adding a `data-theme` attribute system if needed.

---

## Browser Support

Works in all modern browsers. No dependencies, no build step, no framework.
