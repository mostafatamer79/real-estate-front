const {user,responseFor}=require('./details-ui.cjs');
const records=[
{id:'12345678-1234-4234-8234-123456789abc',serviceCategory:'postPurchase',serviceType:'الغاز',clientName:'Client A',city:'الرياض',targetDepartment:'real_estate',status:'pending',price:0,departmentPrices:{},metadata:{},userId:'client-a'},
{id:'22345678-1234-4234-8234-123456789abc',serviceCategory:'legal',serviceType:'صياغة عقد',clientName:'Client B',city:'جدة',targetDepartment:'legal',status:'completed',price:300,departmentPrices:{legal:{price:300,note:'Paid quote'}},metadata:{acceptedOffer:{deptSlug:'legal',price:300}},adminAccepted:true,invoiceSent:true,clientDecision:'accepted',paymentStatus:'paid',userId:'client-b'},
{id:'32345678-1234-4234-8234-123456789abc',serviceCategory:'marketing',serviceType:'تسويق عقار',clientName:'Client C',city:'الدمام',targetDepartment:'marketing',status:'cancelled',price:0,departmentPrices:{},metadata:{},clientDecision:'rejected'},
{id:'42345678-1234-4234-8234-123456789abc',serviceCategory:'legal',serviceType:'استشارة قانونية',clientName:'Client D',city:'الرياض',targetDepartment:'legal',status:'pending',price:450,departmentPrices:{legal:{price:450,note:'Legacy offer'}},metadata:{},userId:'client-d'}
].map(x=>({phone:'0510000001',quantity:1,description:'Synthetic request fixture',createdAt:'2026-11-01T10:00:00Z',category:x.serviceCategory,...x}));
module.exports={user,responseFor,records};
