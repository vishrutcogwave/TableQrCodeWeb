import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const tableData = await request.json();
    
    // Validate required fields
    const requiredFields = ['tableId', 'tableNumber', 'restaurantId', 'restaurantName'];
    const missingFields = requiredFields.filter(field => !tableData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Mock table registration - in real app, this would register with backend
    const registeredTableData = {
      tableId: tableData.tableId,
      tableNumber: tableData.tableNumber,
      restaurantId: tableData.restaurantId,
      outletType: tableData.outletType || 'Restaurant',
      restaurantName: tableData.restaurantName,
      currency: tableData.currency || 'INR',
      registeredAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: registeredTableData
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to register table' },
      { status: 400 }
    );
  }
}
