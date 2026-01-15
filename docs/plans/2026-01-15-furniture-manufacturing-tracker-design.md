# Furniture Manufacturing WIP Tracker - System Design

**Date:** 2026-01-15
**Project:** Work-in-Progress tracking system for furniture manufacturing business
**Stakeholder:** Business owner (centralized control), production workers (low tech comfort)

## Executive Summary

A Progressive Web App for tracking furniture manufacturing orders through production stations using barcode scanning. Tracks work-in-progress location, time per station, material inventory consumption, and production costs. Designed for low-tech workers with simple scan workflows, while providing comprehensive analytics for business management.

## Business Requirements

### Core Needs
- Track 20-50 concurrent orders through 3 production stations (expandable later)
- Barcode scanning at each station (camera or handheld scanner)
- Real-time inventory management with material consumption tracking
- Time tracking per station with labor cost calculation
- Material cost tracking per order
- Reports accessible remotely via email/OneDrive
- Low-tech friendly interface for workers
- Comprehensive admin dashboard for business owner

### Success Criteria
- Workers can check orders in/out with 2 scans (station + order)
- Business owner can see real-time floor status and costs
- Automatic inventory updates as orders progress
- Daily/weekly reports delivered to email
- System runs reliably on local network

## System Architecture

### Technology Stack
- **Frontend:** Next.js 14 (React) - Progressive Web App
- **Backend:** Next.js API routes (Node.js)
- **Database:** PostgreSQL with Prisma ORM
- **Barcode Scanning:** QuaggaJS (camera) + native USB scanner support
- **Styling:** Tailwind CSS for responsive design
- **Reports:** Nodemailer for email, OneDrive API for cloud sync

### Deployment Architecture
- Local server runs Next.js application (port 3000)
- PostgreSQL database on same server
- Workers access via `http://192.168.x.x:3000` on local network
- Scheduled jobs push reports to email/OneDrive
- Runs on local network only (not internet-exposed)

### Device Support
- Admin dashboard: Desktop/laptop browser
- Worker stations: Any device with browser (phones, tablets, handheld scanners)
- Barcode input: Camera scanning OR USB/Bluetooth scanner (keyboard emulation)

## Data Model

### Core Entities

#### Orders
- Order ID (unique, barcode-enabled)
- Customer name
- Furniture style/template reference
- Custom specifications (text)
- Status (Not Started, In Progress, Completed)
- Created date, completed date
- Estimated material cost (sum of planned materials)
- Actual material cost (sum of used materials)
- Total labor cost (sum of station time costs)
- Total cost (material + labor)

#### Stations
- Station ID (unique, barcode-enabled)
- Station name (e.g., "Cutting", "Assembly", "Finishing")
- Description
- Labor rate per hour (for cost calculation)
- Active/Inactive status
- Sort order

#### Material Templates
- Template ID
- Template name (e.g., "Sofa Model A")
- Description
- List of materials with standard quantities
- Can be copied and customized per order

#### Materials Inventory
- Material ID
- Name (e.g., "Italian Leather - Brown", "Oak Plywood 4x8")
- Type/Category (leather, fabric, wood, hardware)
- Unit of measure (sheets, yards, pieces)
- Current quantity
- Unit cost
- Reorder threshold (for low stock alerts)
- Active/Inactive status

#### Order Materials
- Links Order to Materials
- Planned quantity (from template or manual entry)
- Actual quantity used
- Unit cost (locked at order creation time)
- Material cost = Actual quantity × Unit cost

#### Station Logs (Time Tracking)
- Order ID + Station ID
- Check-in timestamp
- Check-out timestamp (null if currently at station)
- Duration in hours (calculated)
- Labor cost = Duration × Station labor rate
- Auto-generated when workers scan

### Relationships
- Orders → Order Materials → Materials Inventory (tracks what each order needs)
- Orders → Station Logs → Stations (tracks movement through production)
- Material Templates → Materials (templates reference inventory)

### Cost Calculation Logic
- Material costs locked when order created (protects from price changes)
- Labor costs accumulate as order moves through stations
- Real-time total cost = Actual material cost + Sum of labor costs
- Final cost available when order marked complete

## User Interfaces

### Worker Station Interface (Ultra-Simple)

**Step 1: Scan Station**
- Large "SCAN STATION" button fills screen
- Worker scans station barcode
- Screen shows station name in large text

**Step 2: Scan Orders (Multiple)**
- Worker scans order barcodes repeatedly
- Each scan automatically:
  - If order not at this station → CHECK IN (start timer)
  - If order at different station → AUTO CHECK OUT from old station, CHECK IN to new station
  - If order already at this station → CHECK OUT (stop timer)
- Shows simple confirmation message
- Returns to scan screen automatically

**Display:**
```
🏭 CUTTING STATION          [Change Station]

Orders at this station:
• Order #1234
• Order #1456
• Order #1789

[SCAN ORDER BARCODE]
```

**Worker Visibility:**
- Station name
- List of order numbers at current station
- Check in/out confirmations
- **NO time, NO cost, NO analytics shown to workers**

### Admin Dashboard (Full-Featured)

**Tab 1: Live Floor View**
- Visual board with station columns
- Order cards showing current location
- Color-coded by time at station:
  - Green: < 4 hours
  - Yellow: 4-8 hours
  - Red: > 8 hours (stuck/blocked)
- Click order for full details
- Real-time updates

**Tab 2: Orders Management**
- Create new orders
- Assign customer, style, materials
- View/edit order details
- See cost breakdown (materials + labor)
- Print/display order barcode
- Filter by status (active/completed)

**Tab 3: Inventory Management**
- List all materials with current quantities
- Add/remove stock
- Edit material details (name, cost, reorder threshold)
- Low stock alerts highlighted
- Material usage history

**Tab 4: Reports & Analytics**
- Time analytics (avg per station, bottlenecks)
- Cost reports (labor vs material breakdown)
- Order profitability (if sale price tracked)
- Material consumption trends
- Export to Excel/CSV
- Schedule email reports

**Tab 5: Settings**
- Manage stations (add/edit/deactivate)
- Material templates (create/edit furniture styles)
- Labor rates per station
- Email/OneDrive configuration
- Barcode printing
- Backup/restore

## Workflows

### Order Creation Flow
1. Admin creates new order (customer name, furniture style)
2. Select material template OR manually add materials
3. System generates unique barcode for order
4. Order appears as "Not Started" on floor view
5. Print/display barcode for workers
6. Workers scan to move through production

### Production Flow
1. Worker scans station barcode (once)
2. Worker scans order barcode → Order checked IN, timer starts
3. Worker completes work
4. Worker scans order barcode again → Order checked OUT, timer stops, cost calculated
5. Worker at next station scans order → Auto checks out from previous station if forgotten
6. Admin monitors progress on dashboard
7. Order marked complete when exits final station

### Inventory Management Flow
1. Admin adds materials to inventory (receiving stock)
2. Materials assigned to orders via templates or manual entry
3. As orders are created, "planned" quantities recorded
4. Admin can adjust "actual" quantities used (for variance tracking)
5. Low stock alerts trigger when below threshold
6. Reports show consumption patterns

## Error Handling

### Barcode Scanning Issues
- **Failed scan (3 attempts):** Manual entry option appears
- **Invalid barcode:** Red error message, prompt to retry
- **Damaged barcode:** Manual entry with admin notification

### Workflow Issues
- **Order scanned twice at same station:** Interprets as checkout
- **Order skips station:** Allowed (flexibility), flagged in admin dashboard
- **Order stuck at station:** Color-coded alert after configurable time threshold
- **Simultaneous scans:** Database transaction handling, last scan wins

### Technical Issues
- **Network down:** PWA queues scans locally, syncs when network returns
- **Server down:** Graceful error message, retry logic
- **Database conflict:** Transaction rollback, user notified to retry

### Inventory Issues
- **Negative inventory:** Allowed (doesn't block production), alerts admin
- **Material not found:** Error message, option to add new material

## Reporting & Analytics

### Real-Time Dashboard
- Visual board showing orders at each station
- Color-coded by dwell time
- Click for order details
- Manual drag-drop corrections if needed

### Time Analytics
- Average time per station
- Bottleneck identification
- Order completion throughput
- Efficiency trends over time
- Peak production hours/days

### Cost Analytics
- Labor cost by station
- Material cost by order/style
- Total production cost trends
- Order profitability (if sale price tracked)
- Budget vs. actual tracking

### Inventory Reports
- Current stock levels with alerts
- Material consumption by style
- Usage trends over time
- Waste tracking (planned vs. actual variance)
- Dead stock identification

### Export Options
- PDF reports for printing
- Excel/CSV export
- Scheduled email reports (daily/weekly summaries)
- OneDrive sync for remote access

## Deployment & Operations

### Initial Setup
1. Install Node.js 18+ and PostgreSQL 15+ on local server
2. Clone repository and install dependencies
3. Create `.env` file with credentials (see security section)
4. Run database migrations
5. Start application (port 3000)
6. Access admin dashboard at `http://192.168.x.x:3000/admin`

### Initial Data Configuration
1. Create stations with barcodes (print and laminate)
2. Add initial material inventory
3. Create furniture style templates
4. Configure labor rates per station
5. Set up email/OneDrive credentials
6. Configure alert thresholds

### Barcode System
- Format: Code 128 (widely supported)
- Station barcodes: Printed once, posted at workstations
- Order barcodes: Auto-generated, printed per order
- Barcode generation library: bwip-js

### Access URLs
- Admin: `http://192.168.x.x:3000/admin` (password protected)
- Workers: `http://192.168.x.x:3000/station` (no login required)
- Can be installed as PWA on mobile devices

### Backup Strategy
1. **Automated local backups:** Daily PostgreSQL dumps, 30-day retention
2. **Cloud backup:** Daily export to OneDrive (encrypted)
3. **Historical archive:** Monthly export of completed orders to CSV
4. **Restore process:** Documented in deployment guide

### Data Retention
- Active orders: Retained indefinitely
- Completed orders: 2 years in active database
- Station logs: Full history (needed for cost analysis)
- Inventory transactions: Full audit trail

## Security

### Credential Management
All sensitive data in `.env` file (NEVER committed to git):
```
DATABASE_URL=postgresql://...
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=business@example.com
EMAIL_PASSWORD=secret_app_password
ONEDRIVE_CLIENT_ID=...
ONEDRIVE_CLIENT_SECRET=...
ONEDRIVE_REFRESH_TOKEN=...
ADMIN_PASSWORD_HASH=bcrypt_hashed_password
SESSION_SECRET=random_secret_key
```

### Security Measures
- `.env` in `.gitignore` (never committed)
- `.env.example` provided as template (no real values)
- Credentials only on server-side (never sent to browser)
- Encrypted OneDrive tokens
- Admin password hashed with bcrypt
- Session cookies for admin authentication
- Local network only (no internet exposure)
- Database backups encrypted

### Setup Documentation
- Instructions for creating `.env` file
- OneDrive API credential generation guide
- Email app password setup (Gmail/Outlook)
- Password hashing instructions

## Future Enhancements (Out of Scope for V1)

- Worker identification (scan worker badge for accountability)
- More granular stations (expand from 3 to 10+)
- Photo capture at quality checkpoints
- Customer portal for order tracking
- Mobile push notifications for alerts
- Advanced scheduling/capacity planning
- Integration with accounting software
- Multi-location support

## Technical Decisions & Trade-offs

### Why Next.js over separate frontend/backend?
- Single codebase easier to maintain
- Server-side rendering for fast initial load
- API routes avoid CORS complexity
- Built-in optimization for production

### Why PostgreSQL over MySQL?
- Better handling of concurrent transactions
- More robust JSON support (for future flexibility)
- Superior performance for analytics queries

### Why PWA over native mobile app?
- Single codebase for all devices
- No app store deployment
- Works on handheld scanners with browsers
- Offline capabilities without native complexity

### Why local hosting over cloud?
- No internet dependency (reliable for manufacturing floor)
- Lower latency
- Data privacy
- One-time cost vs. recurring subscription

### Why simple worker interface over feature-rich?
- Low tech comfort level of workers
- Reduces training time
- Minimizes errors
- Faster scanning workflow

## Success Metrics

### Technical Metrics
- Scan-to-display latency < 500ms
- System uptime > 99% during production hours
- Support 50+ concurrent orders without slowdown
- Offline queue sync < 5 seconds when network returns

### Business Metrics
- Time tracking accuracy (no missing check-in/out)
- Inventory accuracy (variance < 5%)
- Report generation time < 30 seconds
- Worker training time < 15 minutes
- Admin onboarding time < 1 hour

## Conclusion

This system provides a balance of simplicity for workers and comprehensive visibility for management. The Progressive Web App approach ensures it works on any device, while local hosting guarantees reliability in a manufacturing environment. The auto-checkout feature and simple scanning workflow minimize training needs, while detailed analytics and cost tracking give the business owner complete operational visibility.
