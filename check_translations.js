
const fs = require('fs');
const path = require('path');

const translationsPath = '/home/mostafa/Work/mostkl/real-estate/real-estate-front/context/translations.ts';
const content = fs.readFileSync(translationsPath, 'utf8');

// Simple parser for translations.ts
const arMatch = content.match(/ar: \{([\s\S]*?)\},/);
const enMatch = content.match(/en: \{([\s\S]*?)\}/);

const arKeys = new Set();
const enKeys = new Set();

if (arMatch) {
    const lines = arMatch[1].split('\n');
    lines.forEach(line => {
        const keyMatch = line.match(/"([^"]+)":/);
        if (keyMatch) arKeys.add(keyMatch[1]);
    });
}

if (enMatch) {
    const lines = enMatch[1].split('\n');
    lines.forEach(line => {
        const keyMatch = line.match(/"([^"]+)":/);
        if (keyMatch) enKeys.add(keyMatch[1]);
    });
}

const usedKeys = [
    "chat.currency",
    "chat.meters",
    "common.back",
    "common.back",
    "common.back",
    "common.cancel",
    "common.save",
    "common.select",
    "map.markerProp",
    "offers.buy",
    "offers.rent",
    "scan.cancelSelect",
    "scan.coordinates",
    "scan.csv.city",
    "scan.csv.distance",
    "scan.csv.lat",
    "scan.csv.lng",
    "scan.csv.name",
    "scan.csv.type",
    "scan.dataError",
    "scan.default",
    "scan.desc",
    "scan.error.title",
    "scan.export",
    "scan.footer.found",
    "scan.footer.rights",
    "scan.footer.update",
    "scan.hideTable",
    "scan.loadingMap",
    "scan.placesCount",
    "scan.propertyLocation",
    "scan.radius",
    "scan.results",
    "scan.scanning",
    "scan.selectNew",
    "scan.serverError",
    "scan.showTable",
    "scan.start",
    "scan.table.close",
    "scan.table.coords",
    "scan.table.distance",
    "scan.table.name",
    "scan.table.places",
    "scan.table.results",
    "scan.table.type",
    "scan.tips.desc",
    "scan.tips.title",
    "scan.title",
    "scan.topTypes",
    "scan.typesCount",
    "scan.unexpectedError",
    "scan.unit.km",
    "scan.unit.meter",
    "wallet.addBalance",
    "wallet.balance",
    "wallet.commission",
    "wallet.commission.addBroker",
    "wallet.commission.addNewBroker",
    "wallet.commission.age",
    "wallet.commission.agreedPercentage",
    "wallet.commission.amount",
    "wallet.commission.amountAfterTax",
    "wallet.commission.area",
    "wallet.commission.autoCalc",
    "wallet.commission.brokerName",
    "wallet.commission.brokersData",
    "wallet.commission.brokerTableTitle",
    "wallet.commission.buyerData",
    "wallet.commission.city",
    "wallet.commission.contractValues",
    "wallet.commission.deedNum",
    "wallet.commission.details",
    "wallet.commissionDisclaimer",
    "wallet.commission.edit",
    "wallet.commission.email",
    "wallet.commission.enter",
    "wallet.commission.falLicense",
    "wallet.commission.floors",
    "wallet.commission.form.agency",
    "wallet.commission.form.buyer",
    "wallet.commission.form.id",
    "wallet.commission.form.license",
    "wallet.commission.form.name",
    "wallet.commission.form.owner",
    "wallet.commission.form.party",
    "wallet.commission.form.status",
    "wallet.commission.idNumber",
    "wallet.commission.mobile",
    "wallet.commission.neighborhood",
    "wallet.commission.noBrokers",
    "wallet.commission.ownerData",
    "wallet.commission.percentage",
    "wallet.commission.planNum",
    "wallet.commission.plotNum",
    "wallet.commission.propertyType",
    "wallet.commission.request",
    "wallet.commissionRequest",
    "wallet.commission.role.agent",
    "wallet.commission.role.agentDirect",
    "wallet.commission.role.broker",
    "wallet.commission.role.buyer",
    "wallet.commission.role.owner",
    "wallet.commission.role.ownerDirect",
    "wallet.commission.select",
    "wallet.commission.specs",
    "wallet.commission.street",
    "wallet.commission.table.buyer",
    "wallet.commission.table.number",
    "wallet.commission.table.price",
    "wallet.commission.table.seller",
    "wallet.commission.table.service",
    "wallet.commission.title",
    "wallet.commission.totalAmount",
    "wallet.commission.units",
    "wallet.commission.value",
    "wallet.desc.commission",
    "wallet.desc.files",
    "wallet.desc.invest",
    "wallet.desc.invoices",
    "wallet.files",
    "wallet.invest",
    "wallet.investment.long",
    "wallet.investment.partnership",
    "wallet.investment.short",
    "wallet.investment.title",
    "wallet.invoices",
    "wallet.menu",
    "wallet.noData",
    "wallet.pay",
    "wallet.requestSent",
    "wallet.saveSuccess",
    "wallet.sendRequest",
    "wallet.status.accepted",
    "wallet.status.pending",
    "wallet.status.rejected",
    "wallet.table.amount",
    "wallet.table.date",
    "wallet.table.invoiceNo",
    "wallet.table.service",
    "wallet.table.status",
    "wallet.viewInvoice",
    "wallet.wallet",
    "wallet.withdrawBalance"
];

console.log('Missing in AR:');
usedKeys.forEach(key => {
    if (!arKeys.has(key)) console.log(`  ${key}`);
});

console.log('\nMissing in EN:');
usedKeys.forEach(key => {
    if (!enKeys.has(key)) console.log(`  ${key}`);
});
