# Mock Payment Gateway Setup

## Development Environment

To enable mock payment gateway for development, create a `.env.local` file in the project root:

```bash
# .env.local
NEXT_PUBLIC_MOCK_PAYMENT=true
```

## Production Environment

For production, create a `.env.production` file or set the environment variable:

```bash
# .env.production
NEXT_PUBLIC_MOCK_PAYMENT=false
```

## How It Works

### Development Mode (NEXT_PUBLIC_MOCK_PAYMENT=true)
1. **Payment Initiation**: Returns mock response immediately with fake merchantOrderID
2. **Payment Status**: Shows a confirmation dialog with "OK for Success, Cancel for Fail"
3. **No Real API Calls**: All payment gateway calls are mocked locally

### Production Mode (NEXT_PUBLIC_MOCK_PAYMENT=false or not set)
1. **Real Payment Gateway**: Uses actual payment gateway APIs
2. **Normal Flow**: Standard payment processing flow

## Testing

1. Set `NEXT_PUBLIC_MOCK_PAYMENT=true` in `.env.local`
2. Restart your development server (`npm run dev`)
3. Go through the payment flow
4. You'll see a confirmation dialog asking for Success/Fail
5. Choose your desired outcome to test both scenarios

## Files Modified

- `src/services/api.ts` - Added mock payment logic
- `src/components/MockPaymentDialog.tsx` - Created mock dialog component (currently using simple confirm dialog)
- `src/app/payment/callback/page.tsx` - Updated to pass amount/currency for mock

## Environment Variables

- `NEXT_PUBLIC_MOCK_PAYMENT`: Controls mock vs real payment gateway
  - `true`: Use mock payment (development)
  - `false` or unset: Use real payment gateway (production)
