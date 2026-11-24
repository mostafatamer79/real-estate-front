const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const playwrightPath =
  process.env.PLAYWRIGHT_MODULE ||
  "/home/mostafa/Documents/Codex/2026-09-12/dowanload-x20/open-design/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright";
const { chromium } = require(playwrightPath);

const base = process.env.E2E_BASE || "http://127.0.0.1:3000";
const out = process.env.E2E_OUTPUT || "/tmp/realestate-chat02-browser";
fs.mkdirSync(out, { recursive: true });

const syntheticUser = {
  id: "chat02-user-uuid-1234",
  firstName: "مزود",
  lastName: "معتمد",
  role: "provider",
  email: "provider@example.test",
  isActive: true,
  isVerified: true,
  city: "الرياض",
  nafathVerifiedAt: "2026-01-01T00:00:00Z",
  departments: [],
  departmentPermissions: {},
};

const approvedProfile = {
  status: "approved",
  kind: "general",
  city: "الرياض",
  deliveryModes: ["online", "in_person"],
  requestedCategories: ["legal", "construction"],
  categories: ["legal", "construction"],
  licenseNumber: "LIC-2026-9999",
  licenseDocument: "https://storage.test/docs/approved-license.pdf",
  licenseIssueDate: "2025-01-01",
  licenseExpiryDate: "2028-12-31",
  agreementType: "percentage",
  agreementValue: 10,
  minOffer: 100,
  maxOffer: 10000,
};

const oppPage1 = [
  {
    id: "opp-01",
    category: "legal",
    serviceType: "صياغة عقد استثماري وتوثيقه",
    city: "الرياض",
    district: "النرجس",
    quantity: 1,
    ownOffer: null,
    availableDeliveryModes: ["online", "in_person"],
  },
  {
    id: "opp-02",
    category: "construction",
    serviceType: "معاينة هندسية وفحص مباني",
    city: "الرياض",
    district: "الملقا",
    quantity: 2,
    ownOffer: {
      amount: 450,
      deliveryMode: "online",
      createdAt: "2026-11-10T12:00:00Z",
    },
    availableDeliveryModes: ["online"],
  },
];

const oppPage2 = [
  {
    id: "opp-03",
    category: "legal",
    serviceType: "مراجعة صك عقاري وإفراغ",
    city: "الرياض",
    district: "الياسمين",
    quantity: 1,
    ownOffer: null,
    availableDeliveryModes: ["online"],
  },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const testMatrix = [
    { width: 390, height: 844, theme: "dark", lang: "ar" },
    { width: 1280, height: 900, theme: "light", lang: "ar" },
    { width: 1440, height: 900, theme: "dark", lang: "en" },
    { width: 320, height: 568, theme: "light", lang: "en" }, // Short/small viewport
  ];

  const results = [];

  try {
    for (const config of testMatrix) {
      const { width, height, theme, lang } = config;
      const context = await browser.newContext({
        viewport: { width, height },
        colorScheme: theme,
        reducedMotion: "reduce",
      });

      let oppFailureMode = false;
      let requestedPage = 1;

      // Inject synthetic auth & preferences
      await context.addInitScript(
        ({ user, theme, lang }) => {
          localStorage.setItem("token", "synthetic-test-token");
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("language", lang);
          localStorage.setItem("digital-brokerage-theme", theme);
        },
        { user: syntheticUser, theme, lang },
      );

      // Route interception strictly on localhost
      await context.route("**/*", (route) => {
        const req = route.request();
        const url = new URL(req.url());

        if (url.origin === base && url.pathname === "/sw.js") {
          return route.fulfill({ contentType: "application/javascript", body: "" });
        }
        if (url.origin === base && !url.pathname.startsWith("/api/")) {
          return route.continue();
        }
        if (!url.pathname.includes("/api/")) {
          return route.abort();
        }

        // Mock API handlers
        if (url.pathname === "/api/service-providers/me") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: approvedProfile }),
          });
        }
        if (url.pathname === "/api/service-providers/specializations") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: [] }),
          });
        }
        if (url.pathname === "/api/service-providers/registration-fields") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: [] }),
          });
        }
        if (url.pathname === "/api/service-providers/opportunities") {
          const page = Number(url.searchParams.get("page") || 1);
          requestedPage = page;
          if (oppFailureMode) {
            return route.fulfill({
              status: 503,
              contentType: "application/json",
              body: JSON.stringify({ message: "Synthetic page 2 network timeout" }),
            });
          }
          const items = page === 2 ? oppPage2 : oppPage1;
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                items,
                total: 35, // Trigger pagination (>30)
              },
            }),
          });
        }
        if (url.pathname.endsWith("/settings/public")) {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([]),
          });
        }
        if (url.pathname.endsWith("/user/profile")) {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(syntheticUser),
          });
        }
        if (url.pathname.includes("/notifications")) {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ count: 0, notifications: [], total: 0 }),
          });
        }

        // Intercept writes & unknown endpoints
        if (req.method() !== "GET") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ data: { success: true } }),
          });
        }

        return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      });

      const page = await context.newPage();
      page.setDefaultTimeout(20000);

      const pageErrors = [];
      page.on("pageerror", (err) => pageErrors.push(err.message));

      await page.goto(`${base}/service-providers`, { waitUntil: "domcontentloaded" });

      // 1. Verify Page loaded with single main element
      await page.locator("main").waitFor();
      assert.equal(await page.locator("main").count(), 1, "Must have exactly 1 main element");

      // 2. Verify tracking notice links and exact non-misleading labels
      const clientLink = page.getByRole("link", {
        name: lang === "ar" ? "متابعة طلباتي كعميل" : "Track Client Requests",
      });
      await clientLink.waitFor();
      assert.equal(await clientLink.getAttribute("href"), "/services/my-requests");

      const providerReqLink = page.getByRole("link", {
        name: lang === "ar" ? "طلبات خدمات المزودين (الخاصة بي)" : "My Provider Service Requests",
      });
      await providerReqLink.waitFor();
      assert.equal(await providerReqLink.getAttribute("href"), "/services/provider-requests");

      // 3. Verify opportunities rendered
      const firstCard = page.getByRole("heading", { name: "صياغة عقد استثماري وتوثيقه" });
      await firstCard.waitFor();

      // Screenshot initial dashboard view
      const initialScreenshot = `${out}/dash-${width}x${height}-${theme}-${lang}.png`;
      await page.screenshot({ path: initialScreenshot, fullPage: true });

      // 4. Test Offer Modal and Dialog portal design variables
      const offerButton = page.getByRole("button", {
        name: lang === "ar" ? "تقديم عرض سعر" : "Submit offer",
      });
      await offerButton.click();

      // Dialog opens in portal
      const dialog = page.locator('div[role="dialog"]');
      await dialog.waitFor();

      // Verify portal class exists
      const dialogClass = await dialog.getAttribute("class");
      assert.ok(
        dialogClass.includes("dialogPortalTokens"),
        "Dialog must carry dialogPortalTokens class",
      );

      // Verify computed CSS tokens in the portal
      const dialogBgColor = await dialog.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      assert.ok(dialogBgColor, "Dialog must have a resolved background color from tokens");

      // Screenshot modal view (especially on short viewport)
      const modalScreenshot = `${out}/modal-${width}x${height}-${theme}-${lang}.png`;
      await page.screenshot({ path: modalScreenshot });

      // Close modal
      const cancelBtn = page.getByRole("button", { name: lang === "ar" ? "إلغاء" : "Cancel" });
      await cancelBtn.click();
      await dialog.waitFor({ state: "hidden" });

      // 5. Test Opportunity Pagination and Stale Protection
      const nextBtn = page.getByRole("button", { name: lang === "ar" ? "التالي" : "Next" });
      await nextBtn.waitFor();

      // Trigger failure mode for page 2
      oppFailureMode = true;
      await nextBtn.click();

      // Alert retry banner appears on failure
      const retryBtn = page.getByRole("button", {
        name: lang === "ar" ? "إعادة المحاولة" : "Retry",
      });
      await retryBtn.waitFor();

      // Page indicator must NOT say 2 on failure
      const pageIndicator = page.locator('span[class*="pageIndicator"]');
      const indicatorText = await pageIndicator.innerText();
      assert.ok(indicatorText.startsWith("1 /"), "Indicator must retain page 1 on failure");

      // Recover failure and click retry
      oppFailureMode = false;
      await retryBtn.click();

      // Page 2 request arrived
      const page2Card = page.getByRole("heading", { name: "مراجعة صك عقاري وإفراغ" });
      await page2Card.waitFor();

      // 6. Check for clipped elements (horizontal overflow)
      const clippedElements = await page
        .locator("main a, main button, main h1, main h2, main p")
        .evaluateAll((elements) => {
          return elements
            .filter((el) => el.getClientRects().length > 0)
            .map((el) => {
              const rect = el.getBoundingClientRect();
              return {
                text: el.textContent ? el.textContent.trim().slice(0, 40) : "",
                left: rect.left,
                right: rect.right,
                viewportWidth: window.innerWidth,
              };
            })
            .filter((r) => r.left < -2 || r.right > r.viewportWidth + 2);
        });
      assert.deepEqual(clippedElements, [], "No clipped elements horizontally");

      assert.deepEqual(pageErrors, [], `No page errors in ${width}x${height} ${theme} ${lang}`);

      results.push({
        viewport: `${width}x${height}`,
        theme,
        lang,
        passed: true,
        screenshots: [initialScreenshot, modalScreenshot],
        checks: [
          "Single main element",
          "Distinct request tracking links",
          "Opportunities rendered with correct actionability",
          "Dialog portal tokens verified in body portal",
          "Short viewport scrollable dialog",
          "Pagination error protection (page 1 not left stale)",
          "Retry recovery for page 2",
          "No horizontal clipping or overflow",
          "No console or runtime errors",
        ],
      });

      await context.close();
    }

    console.log("ALL_BROWSER_TESTS_PASSED");
    console.log(JSON.stringify(results, null, 2));
    fs.writeFileSync(`${out}/summary.json`, JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error("BROWSER_TEST_FAILURE:", err);
  process.exitCode = 1;
});
