<!-- 0f20b36f-040b-4587-b124-380a5bf08e15 406d1510-8078-4add-a6f6-6c83f20b4b39 -->
# Update Bill System to Use getbillnouseorderid API

## Overview

The `getbillnouseorderid` API now returns complete bill data including Cart, Tax, paymentresponse, and billdetails. This API is used both after successful bill posting (for WhatsApp) and when loading the bill view page. The billdetails object contains Billno, BillDate, BillTime, TokenNo, and OrderId which are used for bill URL construction and WhatsApp messages.

## Implementation Steps

### 1. Update API Service Method (`src/services/api.ts`)

- Update `getBillNoByOrderId()` method to return the full response structure:
  - Cart, Tax, BillingType, SubBillingType, paymentresponse, billdetails
- Remove `getBillByPOSBillNo()` method (no longer needed)
- Update return type to match the new response structure

### 2. Remove Unused API Endpoint (`src/config/api.ts`)

- Remove `getBillByPOSBillNo` endpoint from API_CONFIG

### 3. Update Payment Callback (`src/app/payment/callback/page.tsx`)

- After successful `postBill` or `submitOrderfastfoodbill`:
  - Call `ApiService.getBillNoByOrderId(merchantOrderID)` to get full bill data
  - Extract `billdetails` from response
  - Use `billdetails.OrderId` for bill URL: `${window.location.origin}/bill/view/${billdetails.OrderId}`
  - Determine WhatsApp orderNumber based on outlet type:
    - Restaurant/Roomservice: use `billdetails.BillNo`
    - Fastfood: use `billdetails.TokenNo`
  - Send WhatsApp message with correct orderNumber
  - Use `billdetails` fields for all WhatsApp message parameters

### 4. Update Bill View Page (`src/app/bill/view/[orderId]/page.tsx`)

- The route parameter `orderId` is actually `billdetails.OrderId` from the URL
- On page load:
  - Fetch company info via `getCompanyInfoBill()`
  - Fetch bill data via `getBillNoByOrderId(orderId)` using the orderId from URL
- Update data structure to use the new response format:
  - Use `Cart` and `Tax` from response
  - Use `billdetails.Billno` for Bill No display
  - Use `billdetails.BillDate` for Date display
  - Use `billdetails.BillTime` for Time display
  - Use `billdetails.OutletName` if needed
- Update all references to use the new structure

### 5. Update Types/Interfaces

- Add interface for the full `getBillNoByOrderId` response structure
- Add interface for `billdetails` object

## Files to Modify

**Modified Files:**

- `src/services/api.ts` - Update getBillNoByOrderId method, remove getBillByPOSBillNo
- `src/config/api.ts` - Remove getBillByPOSBillNo endpoint
- `src/app/payment/callback/page.tsx` - Update to use new API response and billdetails
- `src/app/bill/view/[orderId]/page.tsx` - Update to use getBillNoByOrderId and billdetails fields

## Technical Details

**New API Response Structure:**

```typescript
{
  Cart: OrderSubmitRequest;
  Tax: BillDetails;
  BillingType: string;
  SubBillingType: string;
  paymentresponse: {
    success: boolean;
    code: string;
    message: string;
    data: {
      transactionId: string;
      amount: number;
      merchantId: string;
      providerReferenceId: string;
      qrString: string;
    };
  };
  billdetails: {
    Billno: string;
    BillDate: string; // Format: "13/11/2025"
    BillTime: string; // Format: "13:46"
    OutletName: string;
    TokenNo: string | null;
    OrderId: string;
  };
}
```

**Bill URL Format:**

- Always: `/bill/view/${billdetails.OrderId}` (for all outlet types)

**WhatsApp orderNumber:**

- Restaurant/Roomservice: `billdetails.BillNo`
- Fastfood: `billdetails.TokenNo`

**Bill View Page:**

- URL parameter: `orderId` (which is `billdetails.OrderId`)
- Fetches bill using: `getBillNoByOrderId(orderId)`
- Displays: Billno from `billdetails.Billno`, Date from `billdetails.BillDate`, Time from `billdetails.BillTime`

### To-dos

- [ ] Update getBillNoByOrderId() method to return full response structure and remove getBillByPOSBillNo()
- [ ] Remove getBillByPOSBillNo endpoint from API_CONFIG
- [ ] Update payment callback to use billdetails from getBillNoByOrderId response and determine orderNumber by outlet type
- [ ] Update bill view page to use getBillNoByOrderId and display billdetails fields (Billno, BillDate, BillTime)