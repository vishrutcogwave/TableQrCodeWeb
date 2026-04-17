import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    
    // Generate a mock order number
    const orderNumber = `ORD-${Date.now()}`;
    
    const mockOrder = {
      orderId: orderNumber,
      tableId: orderData.tableId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      estimatedTime: '20-25 minutes'
    };

    return NextResponse.json({
      success: true,
      data: mockOrder
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to place order' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('tableId');

    // Mock order history
    const mockOrders = [
      {
        orderId: 'ORD-001',
        tableId: tableId,
        items: [
          { id: 'APP001', name: 'Chicken Wings', quantity: 2, price: 12.99 },
          { id: 'MAIN001', name: 'Grilled Salmon', quantity: 1, price: 24.99 }
        ],
        totalAmount: 50.97,
        status: 'completed',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        estimatedTime: '20-25 minutes'
      },
      {
        orderId: 'ORD-002',
        tableId: tableId,
        items: [
          { id: 'DESS001', name: 'Chocolate Cake', quantity: 1, price: 7.99 }
        ],
        totalAmount: 7.99,
        status: 'preparing',
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        estimatedTime: '10-15 minutes'
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockOrders
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
