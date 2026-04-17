export interface QRCodeParams {
  checkinno: string;
  tableNumber: string;
  orgOltCode: string;
  orgOltName: string;
  transaction: string;
  stewardNo: string;
  qrcode: string;
  guestname: string;
  hotelName: string;
}

export function parseQRCodeURL(url: string): QRCodeParams | null {
  try {
    // Extract the hash fragment after #
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) return null;
    
    const hashFragment = url.substring(hashIndex + 1);
    
    // Parse the hash fragment: /cin/0/tbl/C4/Olt/1/OtName/RESTAURANT/TrNo/0/Stw/1/Qrcodes/1/guestname/0/HotelName/COGWAVE%20POS
    const segments = hashFragment.split('/').filter(segment => segment.length > 0);
    
    if (segments.length < 18) return null; // Minimum required segments
    
    const params: Partial<QRCodeParams> = {};
    
    // Parse each parameter pair
    for (let i = 0; i < segments.length; i += 2) {
      const key = segments[i];
      const value = segments[i + 1];
      
      switch (key) {
        case 'cin':
          params.checkinno = value;
          break;
        case 'tbl':
          params.tableNumber = value;
          break;
        case 'Olt':
          params.orgOltCode = value;
          break;
        case 'OtName':
          params.orgOltName = decodeURIComponent(value);
          break;
        case 'TrNo':
          params.transaction = value;
          break;
        case 'Stw':
          params.stewardNo = value;
          break;
        case 'Qrcodes':
          params.qrcode = value;
          break;
        case 'guestname':
          params.guestname = decodeURIComponent(value);
          break;
        case 'HotelName':
          params.hotelName = decodeURIComponent(value);
          break;
      }
    }
    
    // Validate that all required parameters are present
    const requiredParams = ['checkinno', 'tableNumber', 'orgOltCode', 'orgOltName', 'transaction', 'stewardNo', 'qrcode', 'guestname', 'hotelName'];
    const missingParams = requiredParams.filter(param => !params[param as keyof QRCodeParams]);
    
    if (missingParams.length > 0) {
      console.error('Missing required parameters:', missingParams);
      return null;
    }
    
    return params as QRCodeParams;
  } catch (error) {
    console.error('Error parsing QR code URL:', error);
    return null;
  }
}

// Example usage:
// const url = "https://example.com/#/cin/0/tbl/C4/Olt/1/OtName/RESTAURANT/TrNo/0/Stw/1/Qrcodes/1/guestname/0/HotelName/COGWAVE%20POS";
// const params = parseQRCodeURL(url);
