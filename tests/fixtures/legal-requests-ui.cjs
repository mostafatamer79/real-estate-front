const {user,responseFor}=require('./details-ui.cjs');
const requests=[
{id:'12345678-1234-4234-8234-123456789abc',serviceType:'Legacy legal invoice',invoiceSent:true,invoicePrice:'0.00',price:'0.00',clientDecision:'pending',paymentStatus:'unpaid',firstParty:{name:'First party fixture',idNumber:'1000000001'},secondParty:{name:'Second party fixture',idNumber:'1000000002'}},
{id:'22345678-1234-4234-8234-123456789abc',serviceType:'Accepted legal request',invoiceSent:true,invoicePrice:'350.50',price:'350.50',clientDecision:'accepted',paymentStatus:'unpaid'},
{id:'32345678-1234-4234-8234-123456789abc',serviceType:'Paid legal request',invoiceSent:true,invoicePrice:200,price:200,clientDecision:'pending',paymentStatus:'paid'},
{id:'42345678-1234-4234-8234-123456789abc',serviceType:'Awaiting legal price',invoiceSent:false,invoicePrice:null,price:0,clientDecision:null,paymentStatus:'unpaid'},
{id:'52345678-1234-4234-8234-123456789abc',serviceType:'Rejected legal request',invoiceSent:true,invoicePrice:125,price:125,clientDecision:'rejected',paymentStatus:'unpaid'},
{id:'62345678-1234-4234-8234-123456789abc',serviceType:'Other owner fixture',userId:'not-this-user',invoiceSent:true,invoicePrice:125,price:125,clientDecision:'pending',paymentStatus:'unpaid'},
].map((request,index)=>({userId:user.id,category:'legal',clientName:'Synthetic client',phone:'0500000001',city:'الرياض',district:'حي الاختبار',description:'Synthetic legal request description',quantity:1,status:'pending',createdAt:'2026-11-01T10:00:00Z',metadata:{legalCategory:'legal_consultations'},...request}));
module.exports={user,responseFor,requests};
