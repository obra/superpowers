# Build VIN Mapping System

Internal VIN ↔ ESKA vehicle mapping application for Arabian Shield operations.

## Target stack
- Frontend: React + TypeScript + Vite
- Routing: React Router
- Data fetching: TanStack Query
- Forms: React Hook Form + Zod
- Styling: Tailwind CSS
- Backend: Node.js + TypeScript (NestJS or layered Express)
- Database: Oracle
- Vehicle provider: adapter pattern with MockVehicleDataProvider for development

## Core modules
1. Login
2. Dashboard
3. Vehicle Verification
4. VIN Master Sheet (read-only)
5. Mapping Management
6. Unmapped Vehicles
7. Reports
8. Audit Trail
9. User Management

## Roles
- ADMIN: full access
- MAPPING_MANAGER: verification, master sheet, add/edit/deactivate mappings, reports
- VIEWER: dashboard, verification, master sheet, reports

## Statuses
- MAPPED
- UNMAPPED
- INACTIVE
- ERROR

## Core flow
VIN input → External Vehicle API → resolve VIN make/model → query VIN_MASTER_SHEET → return MAPPED / UNMAPPED / INACTIVE.

## Business rules
- VIN_MASTER_SHEET is read-only.
- VIN make/model master data is maintained in VIN_MAKE and VIN_MODEL.
- Mapping data is maintained in VIN_ESKA_MAPPING.
- No duplicate active mapping for VIN_MAKE_ID + VIN_MODEL_ID.
- Deactivation uses soft delete via STATUS = INACTIVE.
- All mapping changes require audit logging.
- Vehicle verification reads from VIN_MASTER_SHEET.
- Unmapped VIN_MODEL rows must still appear in VIN_MASTER_SHEET.

## UI / design workflow
This project should use the design and frontend resources vendored in the parent repository:
- design-taste-frontend
- Impeccable
- designlang
- React Bits
- GSAP Skills
- transitions.dev
- Playwright CLI

See `AGENTS.md` for the required workflow and usage rules.
