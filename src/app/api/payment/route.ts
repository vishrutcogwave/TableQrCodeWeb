import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json();
    
    // Simulate payment processing
    const mockPayment = {
      paymentId: `PAY-${Date.now()}`,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      status: 'completed',
      method: paymentData.method || 'card',
      transactionId: `TXN-${Date.now()}`,
      processedAt: new Date().toISOString()
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      data: mockPayment
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Payment failed' },
      { status: 400 }
    );
  }
}
