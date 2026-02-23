# ShoppingView Persistence Verification Guide

This document describes how to manually verify that checked item states persist correctly in the ShoppingView component.

## Requirements Being Verified

- **8.1**: Checked/unchecked states persist immediately to backend
- **8.2**: States persist when navigating away and returning
- **8.3**: States persist across browser sessions (close/reopen)
- **8.4**: Checked item ordering persists (checked items at bottom)

## Verification Steps

### Test 1: Immediate Persistence (Requirement 8.1)

1. Open a saved grocery list in the shopping view
2. Open browser DevTools Console (F12)
3. Check off 2-3 items by clicking their checkboxes
4. Observe console logs showing:
   - `[ShoppingView] Toggling item checked state` - shows the toggle action
   - `[ShoppingView] Item checked state persisted to backend` - confirms backend save
   - `[Persistence Check - After Toggle]` - shows current state snapshot

**Expected Result**: Each checkbox toggle should log successful persistence to backend.

### Test 2: Component Remount Persistence (Requirement 8.2)

1. In the shopping view, check off several items
2. Note which items are checked in the console logs
3. Navigate back to the saved lists view (click "Back" button)
4. Navigate back into the same shopping list
5. Observe console logs showing:
   - `[ShoppingView] Component mounted/remounted`
   - `[ShoppingView] Loading list from backend`
   - `[Persistence Check - Load from Backend]` - shows loaded state
   - `[Persistence Verification - Load from Backend]` - compares with previous session

**Expected Result**: 
- All previously checked items should still be checked
- Console should show matching checked counts between sessions
- Checked items should appear at the bottom of their categories

### Test 3: Browser Session Persistence (Requirement 8.3)

1. In the shopping view, check off several items
2. Note the checked items and their count in console logs
3. Copy the list ID from the URL or console
4. Refresh the browser page (F5 or Cmd+R)
5. Observe console logs after page reload

**Expected Result**:
- All checked items remain checked after refresh
- Console logs show `[Persistence Verification]` comparing states
- `statesMatch: true` should appear in verification logs

### Test 4: Cross-Browser Session Persistence (Requirement 8.3 Extended)

1. In the shopping view, check off several items
2. Note the list ID and checked items
3. Close the browser completely
4. Reopen the browser and navigate back to the application
5. Log in (if required) and open the same shopping list
6. Verify checked states are preserved

**Expected Result**:
- All checked items from previous session remain checked
- Checked items appear at bottom of categories
- Console shows successful state restoration

### Test 5: Checked Item Ordering (Requirement 8.4)

1. Open a shopping list with items in multiple categories
2. Check off items in different categories
3. Observe the visual ordering in the UI
4. Navigate away and back to the list
5. Verify ordering is maintained

**Expected Result**:
- Within each category, unchecked items appear first
- Checked items appear at the bottom of their category
- Order is maintained across navigation and refresh
- Console logs show items sorted correctly

## Console Log Reference

### Key Log Messages

- `[ShoppingView] Component mounted/remounted` - Component lifecycle
- `[ShoppingView] Loading list from backend` - Data fetch initiated
- `[ShoppingView] List loaded successfully` - Data received with counts
- `[ShoppingView] Toggling item checked state` - User interaction
- `[ShoppingView] Item checked state persisted to backend` - Save confirmed
- `[Persistence Check - {context}]` - State snapshot with details
- `[Persistence Verification - {context}]` - Comparison with previous state

### Sample Console Output

```
[ShoppingView] Component mounted/remounted {listId: "abc123"}
[ShoppingView] Loading list from backend {listId: "abc123"}
[ShoppingView] List loaded successfully {listId: "abc123", itemCount: 10, checkedCount: 3}
[Persistence Check - Load from Backend] {
  listId: "abc123",
  listName: "Weekly Groceries",
  totalItems: 10,
  checkedCount: 3,
  uncheckedCount: 7,
  checkedItems: [...],
  timestamp: "2026-02-22T10:30:00.000Z"
}
[Persistence Verification - Load from Backend] {
  message: "Comparing with previous session",
  previousCheckedCount: 3,
  currentCheckedCount: 3,
  statesMatch: true,
  previousTimestamp: "2026-02-22T10:25:00.000Z",
  currentTimestamp: "2026-02-22T10:30:00.000Z"
}
```

## Troubleshooting

### States Not Persisting

If checked states are not persisting:
1. Check console for error messages
2. Verify backend API is responding (check Network tab)
3. Ensure authentication token is valid
4. Check that `toggleItemChecked` API call succeeds

### States Mismatch After Reload

If states don't match after reload:
1. Check `[Persistence Verification]` logs for `statesMatch: false`
2. Verify backend storage is working correctly
3. Check for any API errors in console or Network tab

### Ordering Issues

If checked items aren't moving to bottom:
1. Verify `groupItemsByCategory` function is sorting correctly
2. Check that `order` property is set on items
3. Ensure CSS isn't overriding the visual order

## Success Criteria

All tests pass when:
- ✅ Checkbox toggles immediately persist to backend
- ✅ States remain after navigating away and back
- ✅ States survive browser refresh
- ✅ States survive browser close/reopen
- ✅ Checked items consistently appear at bottom of categories
- ✅ Console logs show successful persistence verification
- ✅ No errors appear in console during any test
