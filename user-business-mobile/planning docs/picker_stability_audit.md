# DOB Wheel Picker - Alignment & Stability Issues Tracker

## 🚨 Current Issues (March 9, 2026)

### 1. The "December Trap" (Sticky Boundaries)
*   **Symptom**: When scrolling to the end of the month (December) or the beginning/end of the year list, the wheel becomes "sticky" or glitches. Dragging away from the boundary often snaps back to the same value immediately.
*   **Technical Root**: A "scroll-fighting loop" where the internal `FlatList` snap engine and the React state update cycle are out of sync. Programmatic syncs trigger during momentum, causing recursive loops.
*   **Fix Status**: ✅ Resolved (Implemented strict interaction guards and synchronized selection tracking).

### 2. Sub-Pixel Alignment Drift
*   **Symptom**: Numbers occasionally land slightly above or below the center of the white selection lines, especially in the Year column (index 90+).
*   **Technical Root**: Floating point errors in `contentOffset.y` on Android. Native snapping doesn't always land on an exact integer multiple of `ITEM_HEIGHT`.
*   **Fix Status**: ✅ Resolved (Forced exact offset snapping on `momentumScrollEnd`).

### 3. "Black Flash" / Refresh Stutter
*   **Symptom**: Lists occasionally go black or flicker when a selection is made.
*   **Technical Root**: Data reference instability. The month/year arrays were being recreated on every render, causing the list to unmount/remount items.
*   **Fix Status**: ✅ Resolved (Stable `useMemo` references implemented).

### 4. Recursive Update Ping-Pong
*   **Symptom**: CPU usage spikes and the wheel "stutters" after a selection.
*   **Technical Root**: `onSelect` triggering a `dob` update, which triggers a screen re-render, which triggers a wheel sync, which triggers a scroll event.
*   **Fix Status**: ✅ Resolved (UI-thread animation decoupled from state re-renders).

### 5. Performance Lag (VirtualizedList Warning)
*   **Symptom**: "large list that is slow to update" warning in logs.
*   **Technical Root**: `renderItem` was recalculating 100+ items on every scroll frame.
*   **Fix Status**: ✅ Resolved (Implemented `WheelItem` Pure component with `useNativeDriver: true` for all visual updates).

---

## 🛠️ Implementation History & Evolution

1.  **Phase 1: Animated ScrollView**
    *   *Result*: Very buggy. Manual interpolation for opacity and scale was too heavy for the UI thread, causing lag and misalignment.
2.  **Phase 2: FlatList + snapToInterval**
    *   *Result*: Significant improvement in stability. Native engine handles snapping.
3.  **Phase 3: memoized WheelColumn**
    *   *Result*: Eliminated the "large list slow update" warning by stopping unnecessary re-renders of the 100-item Year list.
4.  **Phase 4: Physical Position Ref Tracking**
    *   *Result*: Current stable state. Uses `scrollPos.current` to prevent programmatic scrolls if the wheel is already physically where it needs to be.

---

## 📋 Ongoing Checklist
- [ ] Verify "December to January" flick is smooth without snap-back.
- [ ] Ensure 29th/30th/31st clamping doesn't cause a visual jitter in the Day column.
- [ ] Test alignment consistency after 50+ fast flicks.
