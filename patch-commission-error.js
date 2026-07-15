const fs = require('fs');
const path = '/home/mostafa/Work/mostkl/real-estate/real-estate-front/app/wallet/components/CommissionForm.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  /console\.error\("Submission failed:", error\);/g,
  'console.error("Submission failed:", error); console.error("Response data:", error.response?.data); toast.error(error.response?.data?.message || "حدث خطأ أثناء إرسال الطلب");'
);
fs.writeFileSync(path, content);
