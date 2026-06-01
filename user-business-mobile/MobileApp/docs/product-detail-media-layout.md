# Product Detail Media Layout

Last updated: 2026-05-23

Canonical reference for product overlay behavior by `MediaAspect`. Implementation lives in `DiscoverProductOverlay`, `ProductHeroMedia`, `ProductDetailSheet`, and `getSheetSnapPoints`.

Related: [auth-flow-audit.md](./auth-flow-audit.md)

## Aspect ratio matrix

| Aspect | Collapsed sheet | Expanded sheet | Hero max height | Fullscreen |
|--------|-----------------|----------------|-----------------|------------|
| `square` (1:1) | 42% | 88% | ~42% screen | Cover/contain per `ProductExpandedView` |
| `portrait45` (4:5) | 58% | 88% | ~50% screen | Same as square |
| `portrait34` (3:4) | 62% | 88% | ~52% screen | Same as square |
| `portrait` | 58% | 88% | ~50% screen | Same as square |
| `landscape` (16:9) | 28% | 88% | ~32% screen | Letterbox contain; side action stack (Phase 3) |
| `story` (9:16) | 22% | 88% | ~72% screen | Portrait fill; reels-style minimized hero |

Helpers: `snapHeight()`, `heroMaxHeight()`, `imageSlotHeight()` in [`getSheetSnapPoints.ts`](../src/components/commerce/getSheetSnapPoints.ts).

## Overlay rules

1. **Fixed image slot** — `imageSlotHeight` is computed from aspect + width and never changes when overlay opens.
2. **Absolute overlay** — Dim + centered action chips use `StyleSheet.absoluteFillObject` inside `imageSlot` only.
3. **Persistent action rail** — Share, cart, bookmark, and expand sit in a fixed row **below** the image slot (Figma image 1). Tapping the image toggles overlay (Figma image 2) without shifting the rail.
4. **Hero caption** — Product name + subtitle below the rail; collapses when sheet expands to avoid duplicate title in sheet.

## Sheet gesture rules

| Gesture zone | Behavior |
|--------------|----------|
| Drag handle + ~24px top hit area | Pan sheet between collapsed and expanded snaps; swipe down dismisses when collapsed |
| Sheet content (`Animated.ScrollView`) | Native vertical scroll at all snap positions |
| Handle pan + scroll | `Gesture.Pan().simultaneousWithExternalGesture(scrollRef)` so gestures do not block each other |

Do **not** wrap the entire sheet in `Gesture.Pan()` — that steals drags from inner scroll.

## Fullscreen / rotate behavior (Phase 3 — deferred)

| Aspect | Minimized | Fullscreen expanded |
|--------|-----------|---------------------|
| `landscape` | Short hero, 28% sheet snap | Contain fill width; side vertical stack (cart, bookmark, share); bottom product bar |
| Square / 4:5 / 3:4 on landscape device | Same minimized rules | Letterbox (contain); rotate-90° pill for portrait media |
| `story` on landscape | Portrait-first | Force portrait presentation or rotate prompt |

Tracked in Linear: **Landscape fullscreen (Phase 3)**.

## Figma mapping

| Reference | Behavior |
|-----------|----------|
| Image 1 | Minimized hero + action rail below image + collapsed sheet |
| Image 2 | Overlay on tap — rail and caption stay fixed |
| Image 3 | Landscape letterbox + rotate pill |
| Image 4 | Sheet content — similar products (price cards) + similar places (landscape cards) |
| Image 5 | Story/reels — tall hero, 22% collapsed sheet |
| Image 6 | Landscape fullscreen layout (Phase 3) |

## Verification route

`/(tabs)/business/[businessId]/product/lp-1` (Patatas Bravas)

- Collapsed: handle, title, Add to cart visible; scroll reaches similar sections
- Swipe handle up: sheet ~88%; scroll still works
- Tap image: overlay appears; rail + caption do not shift
- Story aspect product: sheet ~22% collapsed, tall hero
