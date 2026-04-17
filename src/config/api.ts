// export const API_CONFIG = {
//   baseUrl: process.env.NEXT_PUBLIC_HOTEL360_API_BASE_URL || 'https://posonlinederoyale.cogwave.in',
//   endpoints: {
//     categories: '/api/kot/getfoodcategories',
//     items: '/api/kot/getfoodsimage',
//     submitOrder: '/api/kot/submitorder',
//     getStewards: '/api/kot/getstewards',
//     getOldCart: '/api/kot/getoldcart',
//     getBranch: '/api/kot/getbranch',
//     getMenuListByOlt: '/api/kot/GetMenuListByOlt',
//     getOutletType: '/api/kot/getOutletType',
//     pgCreatePayment: '/api/kot/PGCreatePayment',
//     pgPaymentStatus: '/api/kot/PGPaymentStatus',
//     pgGetPaymentStatus: '/api/kot/PGGetPaymentStatus',
//     postBill: '/api/kot/postbill',
//     submitOrderfastfoodbill: '/api/kot/submitOrderfastfoodbill',
//     getRoomServiceDetails: '/api/kot/getroomsevicedetails',
//     getCompanyInfoBill: '/api/kot/getcompanyinfobill',
//     getBillNoByOrderId: '/api/kot/getbillnouseorderid'
//   }
// };

// export const DEFAULT_IMAGE = '/images/food/food-default.png';


export const API_CONFIG = {
  baseUrl: "http://192.168.1.109:8080",
  // endpoints: {
  //   categories: '/api/kot/getfoodcategories',
  //   items: '/api/kot/getfoodsimage',
  //   submitOrder: '/api/kot/submitorder',
  //   getStewards: '/api/kot/getstewards',
  //   getOldCart: '/api/kot/getoldcart',
  //   getBranch: '/api/kot/getbranch',
  //   getMenuListByOlt: '/api/kot/GetMenuListByOlt',
  //   getOutletType: '/api/kot/getOutletType',
  //   pgCreatePayment: '/api/kot/PGCreatePayment',
  //   pgPaymentStatus: '/api/kot/PGPaymentStatus',
  //   pgGetPaymentStatus: '/api/kot/PGGetPaymentStatus',
  //   postBill: '/api/kot/postbill',
  //   submitOrderfastfoodbill: '/api/kot/submitOrderfastfoodbill',
  //   getRoomServiceDetails: '/api/kot/getroomsevicedetails',
  //   getCompanyInfoBill: '/api/kot/getcompanyinfobill',
  //   getBillNoByOrderId: '/api/kot/getbillnouseorderid'
  // }

 endpoints: {
    categories: '/api/KOT/Getfoodcategories',
    items: '/api/KOT/Getfoodsimage',
    submitOrder: '/api/KOT/SubmitOrder',
    getStewards: '/api/KOT/Getstewards',
    getOldCart: '/api/KOT/Getoldcartforscanner',
    getBranch: '/api/KOT/GetBranch',
    getMenuListByOlt: '/api/KOT/GetMenuListByOlt',
    getOutletType: '/api/KOT/GetOutletType',
    pgCreatePayment: '/api/KOT/PGCreatePayment',
    pgPaymentStatus: '/api/KOT/PGPaymentStatus',
    postBill: '/api/KOT/KotPostbill',
    submitOrderfastfoodbill: '/api/KOT/SubmitOrderfastfoodbill',
    getRoomServiceDetails: '/api/KOT/Getroomsevicedetails',
    getCompanyInfoBill: '/api/KOT/Getcompanyinfobill',
    getBillNoByOrderId: '/api/KOT/Getbillnouseorderid',
     pgGetPaymentStatus: '/api/kot/PGGetPaymentStatus'
  }
};

export const DEFAULT_IMAGE = "/images/food/food-default.png";
