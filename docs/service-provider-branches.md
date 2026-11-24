# Service categories and provider grants

The request workspace (`/services/my-requests`) and approved provider dashboard
(`/service-providers`) offer category → legal branch (where applicable) → service
navigation. Changing a parent clears its child selection. The shared catalog defines
ordering and custom categories; services keep their original values when renamed.

Providers can browse every category. Labels distinguish approved, partly approved,
and browse-only categories. The opportunities API and offer endpoint enforce grants;
selecting a category never grants permission to submit an offer.

Administrators can open **Manage services: rename or delete a service** from the
request browser, or the corresponding link in the provider review tree. This opens
`/admin/services?panel=pricing&type=<category-or-branch>` directly in the catalog
editor. Rename with **إعادة تسمية الخدمة وتعديل التفاصيل**, apply, then save all
changes. Deletion also requires saving. Deletion removes the service from new
catalog choices; historical requests and invoices remain intact.

## API behavior

- `GET /service-providers/opportunities?category=legal_contracts&service=<canonical-name>&page=1`
  intersects the optional filters with existing grants before pagination. A root
  `legal` grant covers all legal branches; a branch grant covers that branch only.
- `GET /service-requests?scope=catalog` includes legal and marketing services in the
  service workspace. Default request-center behavior stays the same. Staff and
  customer ownership restrictions still apply.

No schema migration is required. Changes are local until a separate release.

## Verification

- Frontend: `node --test tests/service-navigation.test.cjs tests/service-category-removal.test.cjs`
- Backend: `npm test -- --runInBand src/provider/provider-opportunities.spec.ts src/provider/provider-policy.spec.ts src/service/service-request.service.spec.ts`
- TypeScript checks and the backend build.
- Browser/API checks use the disposable PostgreSQL fixture in
  `real-estate-back/scripts/provider-browser-server.cjs`; never use production data.
