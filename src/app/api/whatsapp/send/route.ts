import { NextRequest, NextResponse } from 'next/server';

const TRYOWBOT_API_URL = 'https://api.tryowbot.com/sender';
const TEMPLATE_NAME = 'customer_receipt';
const TEMPLATE_LANGUAGE = 'en_us';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.TRYOWBOT_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp service is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { phone, guestName, amount, orderNumber, billUrl } = body;

    // Validate required fields
    if (!phone || !guestName || amount === undefined || !orderNumber || !billUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format amount to 2 decimal places
    const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;

    const requestBody = {
      token: apiKey,
      phone,
      template_name: TEMPLATE_NAME,
      template_language: TEMPLATE_LANGUAGE,
      text1: guestName,
      text2: formattedAmount,
      text3: orderNumber,
      text4: billUrl
    };

    console.log('Sending WhatsApp message via proxy:', {
      phone,
      orderNumber,
      billUrl
    });

    const response = await fetch(TRYOWBOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WhatsApp API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Failed to send WhatsApp message: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('WhatsApp message sent successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'WhatsApp message sent successfully'
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

