// WhatsApp Service - Send messages via Tryowbot API (through Next.js API route)

export interface WhatsAppMessageParams {
  phone: string;
  guestName: string;
  amount: number;
  orderNumber: string;
  billUrl: string;
}

export interface WhatsAppResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class WhatsAppService {
  static async sendReceiptMessage(params: WhatsAppMessageParams): Promise<WhatsAppResponse> {
    try {
      console.log('Sending WhatsApp message:', {
        phone: params.phone,
        orderNumber: params.orderNumber,
        billUrl: params.billUrl
      });

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp API error:', response.status, errorData);
        return {
          success: false,
          error: errorData.error || `Failed to send WhatsApp message: ${response.status}`
        };
      }

      const result = await response.json();
      console.log('WhatsApp message sent successfully:', result);

      return {
        success: true,
        message: 'WhatsApp message sent successfully'
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

