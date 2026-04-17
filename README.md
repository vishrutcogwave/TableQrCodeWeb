# Hotel360 Restaurant Ordering App

A mobile-friendly, browser-based restaurant ordering application built with Next.js and Tailwind CSS.

## Features

- **QR Code Table Registration**: Customers scan QR codes to register their table
- **Category-based Menu**: Organized menu with tabs for different food categories
- **Smart Cart Management**: Add, remove, and update quantities with special instructions
- **Flexible Billing**: Support for both immediate and cumulative billing
- **Order Tracking**: View order history and status updates
- **Mobile Optimized**: Responsive design optimized for mobile devices
- **Payment Simulation**: Mock payment processing for immediate billing
- **Multi-Currency Support**: Configurable currency display (default: INR with ₹ symbol)

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: React Context API with useReducer
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   Navigate to `http://localhost:3000/#/cin/0/tbl/1/Olt/1/OtName/BAR%20%26%20RESTAURANT/TrNo/0/Stw/1/Qrcodes/1/guestname/0/HotelName/De%20Royale`
   ``
   `http://localhost:3000/#/cin/0/tbl/1/Olt/1/OtName/BAR%20%26%20RESTAURANT/TrNo/0/Stw/1/Qrcodes/1/guestname/0/HotelName/PARADISE%20BAR%20AND%20RESTAURANT`
## Project Structure

```
src/
├── app/
│   ├── api/                 # Mock API endpoints
│   │   ├── register-table/  # Table registration
│   │   ├── menu/           # Menu data
│   │   ├── orders/         # Order management
│   │   └── payment/        # Payment processing
│   ├── menu/               # Menu page
│   ├── orders/             # Order history page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # QR scan page
├── components/
│   └── CartSidebar.tsx     # Shopping cart component
├── context/
│   └── AppContext.tsx      # Global state management
└── types/
    └── index.ts            # TypeScript type definitions
```

## API Integration

The app now integrates with the real Hotel360 API:

### Configuration
- **Base URL**: `https://onlineposmenu.cogwave.in` (configurable in `src/config/api.ts`)
- **Categories API**: `/api/kot/getfoodcategories`
- **Items API**: `/api/kot/getfoodsimage?outlet=1&category={categoryId}&filter=0`
- **Currency**: Default INR with ₹ symbol (configurable in `src/utils/currency.ts`)

### Mock APIs (for testing)
- **POST /api/register-table** - Table registration
- **POST /api/orders** - Order placement
- **GET /api/orders** - Order history
- **POST /api/payment** - Payment processing

### API Data Structure
- **Categories**: Array of objects with `CategoryId`, `Category`, and `thumb`
- **Items**: Array of objects with `ItemCode`, `ItemName`, `ItemRate`, `CurrentPrize`, `IsVeg`, `Avaliable`, `thumb`, etc.
- **Images**: Uses `thumb` field from API, falls back to placeholder if null

## Usage Flow

1. **Table Registration**: Customer scans QR code or uses demo mode
2. **Menu Browsing**: Browse menu by categories, view item details
3. **Cart Management**: Add items, adjust quantities, add special instructions
4. **Order Placement**: Place order with payment (immediate) or without (cumulative)
5. **Order Tracking**: View order status and history

## Billing Types

- **Immediate**: Payment required at order placement
- **Cumulative**: Payment deferred until bill settlement

## Mobile Features

- Touch-friendly interface
- Responsive design
- Optimized for small screens
- Swipe gestures for cart
- Large tap targets

## Demo Mode

The app includes a demo mode for testing without QR codes. Click "Try Demo Mode" on the home page.

## Future Enhancements

- Real payment gateway integration
- Real-time order status updates
- Push notifications
- Offline support
- Multi-language support
- Advanced filtering and search