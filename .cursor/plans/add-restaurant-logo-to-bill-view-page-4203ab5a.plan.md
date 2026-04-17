---
name: ""
overview: ""
todos: []
---

## Update Tax Handling for New getBill Response

### Summary

We will update the bill/tax data model and all consuming UIs to:

- Ignore legacy `CGSTPer`, `CGSTAmt`, `SGSTPer`, `SGSTAmt` fields
- Use the new `TaxList` array from `getBill` for tax breakdown
- Display **each TaxList entry** with **TaxName, Taxper, TaxableAmount, and TaxAmount** where taxes appear
- Trust and display `GrandTotal` and `RoundOff` exactly as provided by the API (no client recomputation)

### Steps

1. **Adjust Types and API Parsing**

- Update the `BillDetails` interface and related types in `[src/types/index.ts]` (or wherever `BillDetails` is defined) to include:
- `TaxList: { TaxName: string; Taxper: number; TaxableAmount: number; TaxAmount: number; }[]`
- Keep existing total fields (`TotalAmount`, `TotalQty`, `GrandTotal`, `Discount`, `RoundOff`, etc.)
- Mark `CGSTPer`, `CGSTAmt`, `SGSTPer`, `SGSTAmt` as optional/unused or remove them if not referenced.
- Confirm `ApiService.getBill` in `[src/services/api.ts]` simply returns the API JSON as `BillDetails` without deriving legacy CGST/SGST fields.

2. **Refactor Internal Tax Computation Helpers (if any)**

- Search for any helper functions that compute or expect `CGSTPer`, `CGSTAmt`, `SGSTPer`, `SGSTAmt`.
- Remove or adapt them to derive any needed aggregates from `TaxList` instead (e.g., sum all `TaxAmount` for display labels if needed).

3. **Update Bill View Page Tax Display**

- In `[src/app/bill/view/[orderId]/page.tsx]`, locate the summary section that currently shows taxes (CGST/SGST or a combined tax line).
- Replace legacy tax field usage with a mapped list over `billDetails.TaxList`, rendering each entry as:
- **Label**: `TaxName` (or `TaxName` + `Taxper` if already present in name)
- **Details**: `Taxper`, `TaxableAmount`, `TaxAmount` in a compact format (e.g., `SGST 2.5% on ₹522 : ₹13.05`).
- Ensure this tax breakdown appears both in the on-screen view and in the generated PDF (update the injected CSS if necessary to style the new rows consistently).

4. **Update Bill Confirmation Overlay Tax Display**

- In `[src/components/BillConfirmationOverlay.tsx]`, locate where taxes are shown in the summary.
- Remove direct use of `CGSTPer`, `CGSTAmt`, `SGSTPer`, `SGSTAmt`.
- Render each `TaxList` entry similarly (TaxName + Taxper + TaxableAmount + TaxAmount) but keep the layout concise so the overlay remains readable on small screens.

5. **Update CartSidebar Tax Display**

- In `[src/components/CartSidebar.tsx]`, find the section that displays taxes within the bill summary when a bill estimate is shown.
- Replace any old CGST/SGST fields with a map over `TaxList`, using the same compact line format.
- Ensure the total section still uses `GrandTotal` and `RoundOff` directly from the API without recomputing.

6. **Maintain Totals and Rounding Behavior**

- Confirm that all places showing the final amount use the API-provided `GrandTotal` and `RoundOff` without recalculating totals on the client.
- Optionally, log a debug message if the sum of `TotalAmount`, `TaxList.TaxAmount`, `Discount`, and `RoundOff` appears inconsistent, but do **not** alter the displayed values.

7. **Visual and PDF Consistency Checks**

- Verify that:
- Bill View page shows all `TaxList` entries as specified.
- Bill Confirmation Overlay and Cart Sidebar show the same breakdown (possibly in a slightly more compact layout but still one line per `TaxList` item).
- Generated PDF from `[src/app/bill/view/[orderId]/page.tsx]` includes the full tax breakdown and remains well-aligned.

### Todos

- **update-types-taxlist**: Update `BillDetails` type to include `TaxList` and deprecate direct CGST/SGST fields.
- **update-api-getbill-tax**: Ensure `ApiService.getBill` returns the new structure and does not rely on removed tax fields.
- **bill-view-taxlist-ui**: Replace legacy tax display in bill view page with mapped `TaxList` showing full details per entry.