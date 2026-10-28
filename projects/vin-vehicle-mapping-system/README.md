# VIN Vehicle Mapping System

Internal VIN-to-ESKA vehicle mapping application.

## Version
V1 baseline / implementation workspace.

## Architecture
- Frontend: React + TypeScript + Vite
- Backend: Node.js + TypeScript
- Database: Oracle
- Integration: Vehicle API adapter (`getVehicleByVIN`), with mock provider for development

## Core data model
- `VIN_MAKE`
- `VIN_MODEL`
- `VIN_ESKA_MAPPING`
- `VIN_MASTER_SHEET` (read-only view)

All VIN tables use `STATUS` with `ACTIVE` / `INACTIVE`. Inactive records remain available for audit/history but must not be used for active mapping or ESKA pricing.

## Workflow
1. Maintain VIN make/model master data.
2. Employee or manager submits a mapping change.
3. Manager approves or rejects the change.
4. Approved mapping becomes active.
5. All changes retain audit information and old/new values.
6. Vehicle verification resolves VIN data and checks the active mapping.

## Roles
- `IT_ADMIN`: full access.
- `MANAGER`: add mapping changes and approve/reject requests.
- `EMPLOYEE`: submit additions/changes; no approval permission.

## Key rules
- `VIN_MASTER_SHEET` is read-only and must never be updated directly.
- VIN model belongs to an existing active VIN make.
- ESKA make/model values must not be duplicated.
- Prevent duplicate active mapping for `(VIN_MAKE_ID, VIN_MODEL_ID)`.
- Every add/edit mapping request requires manager approval.
- Audit all changes, including actor, old/new values, request timestamp, approval timestamp and approver.
- Inactive make/model/mapping records cannot be used by verification/pricing.

## Planned modules
Dashboard, Vehicle Verification, VIN Master Sheet, Mapping Management, Approval Queue, Unmapped Vehicles, Reports, Audit Trail, User Management.

## API baseline
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/vehicle/verify/:vin`
- `GET /api/vin-master`
- `GET /api/mappings`
- `POST /api/mappings`
- `PUT /api/mappings/:id`
- `PATCH /api/mappings/:id/status`
- `GET /api/mappings/check`
- `GET /api/mappings/unmapped`
- `GET /api/vin/makes`
- `GET /api/vin/makes/:id/models`
- `GET /api/eska/makes`
- `GET /api/eska/makes/:id/models`
- `GET /api/approvals`
- `POST /api/approvals/:id/approve`
- `POST /api/approvals/:id/reject`
- `GET /api/dashboard/summary`
- `GET /api/audit`
- `GET /api/reports/mapping-coverage`

Implementation is developed on `feature/vin-vehicle-mapping-system` before merging to `main`.