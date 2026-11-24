const user={id:'12345678-1234-4234-8234-123456789abc',firstName:'حساب الاختبار',lastName:'المحلي',role:'user',email:'ui@example.test',isActive:true,isVerified:false,city:'الرياض',onboardingStatus:'completed',departments:[],departmentPermissions:{}};
const sections=['details','services','wallet','offers','orders','subscriptions','scan_map','financial','customerservice','info'];
const settings=sections.map(key=>({key:'section_'+key,value:'open'}));
settings.push({key:'txt_details_design',value:JSON.stringify({enable3d:false,typing:false})});
function responseFor(path,{fail=false,malformed=false,empty=false,order,hidden,soon,palette}={}){
 if(path.endsWith('/settings/public'))return [...settings,...(order?[{key:'txt_details_parts_order',value:order}]:[]),...(hidden?[{key:'details_part_'+hidden,value:'hidden'}]:[]),...(soon?[{key:'details_part_'+soon,value:'soon'},{key:'details_part_'+soon+'_message',value:'مراجعة تجريبية للقسم'}]:[]),...(palette?[{key:'txt_details_design',value:JSON.stringify(palette)}]:[])];
 if(path.includes('/auth/nafath/availability'))return {configured:false};
 if(path.endsWith('/user/profile'))return user;
 if(path.includes('/notifications/unread-count'))return {count:0};
 if(path.endsWith('/notifications'))return {notifications:[],total:0};
 if(path.includes('/financial/chart-data'))return empty?[]:[100,200,300,400,500,600,700,800,900,1000,1100,1200];
 if(path.includes('/properties/stats'))return malformed?[null,{}, {name:9,value:'bad'}]:empty?[]:[{name:'villa',value:2},{name:'apartment',value:3}];
 if(path.endsWith('/activities/me'))return empty?[]:[{id:'activity-local',title:'متابعة الطلب التجريبي',description:'بيانات اختبار محلية',createdAt:'2026-11-01T10:00:00Z'}];
 return [];
}
module.exports={user,settings,responseFor};
