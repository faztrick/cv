# Comprehensive Call Center Technical Infrastructure Report (US Office + Dubai Agents)

Last updated: 2025-12-19

## One-page summary (clean + compact)

### Current baseline

- **Staff/agents:** 10 (US: 0, Dubai: 10)
- **Recommended operating model:** US numbers (toll-free + local DIDs) → **cloud PBX/CCaaS** → Dubai agents
- **If you must keep a US PBX:** use **US SBC in DMZ** + encrypted remote registration; keep **carrier reroute to cloud standby**

### Key sizing (10 agents)

Assumptions: concurrency factor $f=0.35$, headroom $h=1.30$.

- Expected concurrent calls: $\lceil 10\times 0.35\rceil=4$
- Planned channels with headroom: $\lceil 4\times 1.30\rceil=6$
- Bandwidth rule-of-thumb: $6\times 100\text{ kbps}\approx 0.6\text{ Mbps}$ (QoS/jitter matter more than raw Mbps)

### What your “own app” should do (simple)

- **Leads + tasks + SLA timers** (single workflow UI)
- **Screen-pop** on inbound calls
- **Click-to-dial** on outbound calls (API-driven)
- **Auto call log + wrap-up + follow-up task**
- **Recording link** (signed/expiring) + **audit logging**
- **Manager/owner dashboards** (telephony KPIs + funnel KPIs)

### Costs: what actually drives budget

Biggest levers (in order):

1. **CCaaS seat tier** (recording, analytics, WFM/QA)
1. **Minutes** (toll-free + international)
1. **Recording retention** (storage + compliance)
1. (If hybrid) **US PBX/SBC support** + lifecycle refresh

### Fast rollout checklist (for 10 agents)

1. Choose CCaaS vendor + provision US numbers (and Dubai local numbers if required).
1. Dubai network readiness: wired LAN, QoS, **dual ISP**, and voice headset standardization.
1. Configure IVR, queues, overflow rules, and provider-side reroute.
1. Integrate your app: webhooks/events → lead lookup → screen-pop + auto logging.
1. Test failover: Dubai ISP failover + reroute drill + restore tests.

### Quick comparison (pros/cons)

| Option | Best when | Pros | Cons |
| --- | --- | --- | --- |
| **Cloud-only CCaaS** (US numbers → CCaaS → Dubai) | You want the simplest and fastest production setup | Fast rollout, easy scaling, provider HA, easiest for 10 agents | Vendor dependency, minutes/recording retention can raise OPEX |
| **Hybrid: US physical PBX + SBC** (used from UAE) | You must keep US-hosted call control (legacy/compliance) | More control, can integrate with existing PBX/trunks, predictable internal routing | WAN-sensitive media (latency/jitter), more ops/patching, must design failover to cloud |
| **Own app as workflow layer** (recommended) | You want custom lead workflow + reporting without telephony complexity | Screen-pop, click-to-dial, auto logs, strong audit/RBAC; avoids RTP handling | Still needs solid integration (events/idempotency), not a replacement for CCaaS |
| **Own app as full phone (WebRTC/SDK)** | You need fully custom agent UI/telephony experience | Maximum UI control | Highest complexity (real-time media, testing, compliance), higher risk/time |

## Scope (technical only)

This document describes a **two-region call center** setup with:

- **US presence (numbers + routing edge)**: US toll-free and US local numbers, with routing to Dubai. The US site may still host PBX/servers if required, but **agents/staff can be 0 in the US**.
- **Dubai operations**: agents in Dubai, cloud PBX/contact center components, and a Dubai-local connectivity + backup plan.
- **Lead management + reporting**: CRM/lead funnel integration and unified KPIs across both regions.

This is intentionally technical and implementation-oriented (suitable for an interview task).

## High-level requirements (from your notes)

1. US presence must support **US toll-free** and **US local numbers**.
2. Must support **cloud PBX** (PBX/CCaaS) + numbers as needed.
3. Agents operate in **Dubai** (US Agents = **0**).
4. If required, the US office can still have **PBX + server setup** (for survivability/legacy/compliance), but it is not strictly necessary when there are no US agents.
5. Dubai needs **server setup, backups, and software stack**.
6. Unified **lead management** and reporting across both locations.

## If there is no staff in the US (recommended model)

If **US agents = 0**, the simplest and most common design is:

- Keep **US numbers** (toll-free + local DIDs) with a US carrier.
- Host call control in **cloud PBX/CCaaS**.
- Route inbound US calls directly to **Dubai queues/agents** (with time-of-day and overflow rules).
- Keep a small US footprint only if needed for:
  - survivable local calling (rare if there are no US agents),
  - network/security edge, or
  - legacy integrations.

## Target architecture (reference design)

### Logical architecture

#### Inbound

- US callers dial:
  - US toll-free (e.g., 1-800) and/or US local DIDs
- UAE callers dial:
  - UAE local DID(s) / UAE toll-free variant (country rules apply)

#### Routing

- Primary: route callers to their region’s queues
- Overflow: time-of-day and capacity-based overflow to the other region
- Failover: provider-side reroute if a site/edge becomes unreachable

#### Core components

- Telephony/Contact center:
  - US: On-prem PBX (or SBC + PBX) integrated to SIP trunks
  - Dubai: Cloud PBX/contact-center instance + local SBC/edge controls
- CRM + Lead management:
  - Cloud CRM (recommended) with CTI integration for call screen-pop and auto logging
- Recording + QA:
  - Central policy-driven storage (encryption, retention, access control)
- Observability:
  - Network monitoring + VoIP quality metrics (latency/jitter/packet loss)

### Physical deployment

#### US Office (physical)

- ISP links: Primary fiber + secondary ISP (different carrier)
- Edge: Firewall + optional SD-WAN appliance
- LAN: PoE switches + voice/data VLANs
- Telephony rack: PBX, SBC, recording/caching (optional)
- Compute: virtualization host(s) or small server cluster (AD/IdP connectors, file/print, local cache)
- Power: UPS (rack) + generator/building backup where possible

#### Dubai (agents + minimal on-prem footprint)

- ISP links: Primary business fiber + secondary ISP + optional 4G/5G backup
- Edge: Firewall/SD-WAN + VPN to cloud/US as required
- Minimal local compute:
  - optional local cache/print/services
  - optional local recording cache (if bandwidth/compliance demands)
- Primary contact center services: cloud-hosted (PBX, IVR, routing, analytics)

## US office PBX + server setup

### PBX model options

Choose one of these patterns (listed from most “classic PBX” to most “cloud-first”):

1. **On-prem PBX + SIP trunks** (US office owns call control)
   - Pros: local control, can continue internal calling during WAN outages
   - Cons: patching/ops burden, HA requires design

2. **SBC + Cloud PBX (hybrid)** (cloud runs call control; US keeps SBC for survivability)
   - Pros: fewer PBX servers to manage, easier scaling
   - Cons: dependency on internet unless survivability features are used

3. **Full cloud PBX/contact center** (US office has only network + endpoints)
   - Pros: fastest scaling, simplest footprint
   - Cons: pure SaaS dependency; may be less acceptable if strict on-prem requirements exist

Hybrid deployments are common during transitions and when you want a mix of control and cloud scalability.

### Using a physical US office PBX from UAE/Dubai (remote agents)

If you host the **PBX physically in the US** but your **agents are in Dubai**, the design goal is:

- agents in UAE can register and place/receive calls reliably,
- the PBX is not exposed directly to the public internet,
- you can survive packet loss/jitter and provide a sensible failover path.

#### Recommended topology

- **US office**
  - PBX (call control)
  - **SBC in DMZ** (terminates remote registrations and SIP trunk)
  - dual ISPs (where possible)
- **Dubai**
  - agent softphones or desk phones
  - dual ISP + QoS/SD‑WAN

Remote agents should connect to the **SBC**, not directly to the PBX.

#### Remote connectivity patterns (choose one)

1. **VPN to US + SIP over VPN (most controlled)**

   - Agent endpoints connect to a VPN concentrator/firewall.
   - SIP signaling and RTP media traverse the VPN tunnel to the US SBC/PBX.

   Pros: simpler firewall story, better control, easier to lock down.

   Cons: all voice media hairpins US↔UAE (latency sensitive).

1. **SIP-TLS + SRTP to US SBC over internet (no full VPN)**

   - Agent endpoints register to the US SBC using SIP over TLS.
   - Media uses SRTP.

   Pros: avoids “full tunnel” overhead, simpler for remote work.

   Cons: requires careful IP restrictions/rate limits and strong endpoint security.

In practice, many enterprises do **VPN for supervisors/admins** and **SIP‑TLS/SRTP** for managed agent devices, depending on compliance and device posture.

#### Media path reality (important)

With a US-hosted PBX and UAE agents, RTP often traverses the WAN:

- UAE endpoint ↔ US SBC/PBX ↔ PSTN/SIP trunk

This can work, but you must engineer for:

- round-trip latency, jitter, and packet loss
- stable NAT traversal and firewall pinholes

If the CCaaS vendor supports it, prefer architectures where **media can anchor closer to agents** (regional media relays/POPs), while still keeping US numbers/routing.

#### Voice engineering checklist (UAE agents using US PBX)

- QoS and traffic prioritization (voice ahead of bulk traffic)
- Use wired ethernet for agents; avoid Wi‑Fi unless voice-grade
- Use a codec strategy that minimizes transcoding
  - G.711 is common for PSTN quality but uses more bandwidth
  - Opus can be resilient but may introduce transcoding depending on trunks
- Enable jitter buffers and configure DSCP markings end-to-end (where supported)

#### Security checklist

- Do not expose PBX SIP registration directly to the internet
- Terminate remote registrations on SBC with:
  - ACLs/allowlists (where practical)
  - rate limiting
  - anti-fraud rules (international dialing restrictions, time-of-day rules)
- Encrypt signaling (SIP-TLS) and media (SRTP)
- Log and alert on:
  - repeated failed registrations
  - burst outbound calls
  - unusual destinations and spend

#### Failover model (what happens if US site is down?)

Because all agents depend on the US PBX in this model, you need an explicit fallback:

- **Primary:** US PBX + US trunks (normal operations)
- **Secondary:** cloud PBX/CCaaS (warm standby) where US numbers can reroute
- **Tertiary:** alternate US carrier DID/IVR message + digital channels

Provider-side reroute should be preconfigured so that if the US PBX/SBC is unreachable, calls can land in a cloud queue that Dubai agents can still access.

### US telephony building blocks

- **SIP trunking** for US PSTN connectivity (toll-free + DIDs)
- **Session Border Controller (SBC)** or SBC features in edge equipment:
  - topology hiding, NAT traversal, SIP normalization
  - call admission control
  - SIP security (fraud prevention, rate limiting)

### US numbering: toll-free vs local DIDs

- Use **US toll-free** for US customers (marketing/support).
- Use **US local DIDs** for:
  - local presence per state/city
  - departmental direct lines
  - backup routes

Important behavior: **standard toll-free numbers are typically not reachable internationally by default**, so for “international reach” you normally use a mix of local numbers, country-specific toll-free arrangements, or call-back/digital channels.

### US server roles (minimum viable)

**Recommended minimum server roles for the US office** (all can be VMs on a small hypervisor cluster):

- Identity/Device:
  - Directory services connector (or local AD if required)
  - Endpoint management tooling (MDM/patch compliance)
- Telephony adjacent:
  - PBX (if on-prem)
  - Call recording (if stored locally) + secure upload to cloud storage
  - Local time/NTP, syslog aggregator (optional)
- Ops:
  - Monitoring collector (SNMP/agent-based)
  - Config backups (network + PBX)

### US network design (voice-first)

- Separate **Voice VLAN** and **Data VLAN**
- QoS marking and prioritization for:
  - SIP signaling
  - RTP media
- PoE switching for desk phones (if used)
- Wi‑Fi for softphones only if engineered for voice (prefer wired)

## Cloud PBX + cloud server setup

### Cloud PBX / CCaaS capabilities checklist

- Multi-site queues and skills-based routing
- IVR with time-of-day routing
- Ring groups + overflow rules
- Call recording + encryption + retention
- Supervisor tools: live listen/whisper/barge (as allowed)
- APIs/webhooks for CRM/CTI and reporting

### Cloud servers (core SaaS/PaaS components)

**Recommended cloud components** (provider-agnostic):

- CRM/Lead management (SaaS)
- CTI connector / integration service (vendor app or small middleware)
- Data warehouse or analytics store (optional but useful at scale)
- Object storage for recordings (policy-based)
- IAM/SSO + MFA enforcement
- SIEM/log storage for security events

### Cloud server cost (planning-grade)

In a modern call center where **PBX/CCaaS + CRM are SaaS**, “cloud server cost” usually means:

- CTI middleware / integration services (webhooks, CRM sync, event processing)
- small reporting DB (if not entirely handled by the SaaS)
- object storage for recordings/exports
- logs/monitoring and (optionally) analytics/warehouse workloads

Typical monthly ranges (USD) for a 50–150 agent environment:

| Component | Typical range (USD/month) | Notes |
| --- | ---: | --- |
| Integration service (1–2 small app services) | $50 – $600 | Containers/App Service/VM; scale by traffic |
| Managed database (Postgres/MySQL) | $80 – $500 | HA + storage/IOPS increase cost |
| Object storage (recordings/exports) | $50 – $800 | Driven by retention + volume |
| Monitoring + logs | $50 – $400 | Log ingestion can grow quickly |
| Data egress | $0 – $1,500+ | Highly workload-dependent |

**Rule of thumb:** for SaaS-heavy deployments, cloud infra servers are often **$300 – $3,000/month**. The bigger cost lever is almost always **CCaaS seats + minutes + retention**.

### Cloud PBX / CCaaS companies and pricing (planning view)

Treat the pricing below as **typical market ranges** (vendors change packaging frequently).

| Category | Company examples | Typical pricing model | Typical range |
| --- | --- | --- | ---: |
| Cloud PBX (UCaaS voice) | RingCentral, Zoom Phone, 8x8, Vonage, Dialpad | per user/month | ~$15 – $35/user/month |
| Cloud contact center (CCaaS) | Genesys Cloud CX, NICE CXone, Five9, Talkdesk | per agent/month (tiered) | ~$50 – $200/agent/month |
| Usage-based cloud contact center | Amazon Connect | per-minute/per-contact + add-ons | varies (usage driven) |
| Programmable contact center (API-first) | Twilio Flex | hybrid (seat/usage) | varies (seat + usage) |

Cost drivers to mention (interview-friendly):

- recording retention, analytics, QA/WFM modules
- supervisor features (listen/whisper/barge), speech analytics
- outbound dialing / campaigns
- international PSTN minutes and toll-free minutes

## Dubai agents: workstation + voice setup

### Agent endpoints

- Preferred: **softphone** (desktop app or browser-based) + wired ethernet
- Headset: **USB noise-cancelling** call-center grade
- Workstation baseline:
  - 16 GB RAM
  - modern CPU
  - dual monitors (productivity)

### 10-agent Dubai starter kit (practical)

For a 10-agent rollout, you can keep the Dubai office build simple and still professional.

- **Endpoints**
  - 10 × USB noise-cancelling headsets (plus 1–2 spares)
  - 10 × wired ethernet drops (avoid Wi‑Fi for primary voice)
  - optional: 10 × softphone-certified webcams (if video is used)
- **Network**
  - 1 × business firewall (VPN capable) + QoS
  - 1 × managed PoE switch (even if you use softphones, PoE helps if you add desk phones later)
  - VLANs: Voice/Data separation (or at minimum, QoS rules by app/DSCP)
  - 2 × internet links (primary + backup)
  - optional: SD‑WAN appliance/service for fast failover and better jitter handling
- **Power**
  - 1 × UPS for network rack (keeps firewall/switch up during short power events)
- **Operational basics**
  - call recording policy (retention + access rules)
  - quarterly failover drill: ISP failover + provider reroute

### Dubai voice connectivity

- Primary business fiber
- Secondary ISP link (different carrier/medium)
- Optional: **4G/5G failover** for continuity
- SD-WAN (recommended) to:
  - prioritize voice traffic
  - bond links / provide fast failover
  - reduce jitter/packet loss impact

## Dubai server setup, backup, and software stack

Dubai can be “thin” on servers if you use cloud PBX + cloud CRM. Still, a professional setup typically includes:

### Dubai local services (optional but commonly needed)

- Local print/file services (if required)
- Local caching for large downloads/updates
- Local recording cache (only if bandwidth constraints or policy demands)

### Backup strategy

Backups should be **3-2-1**:

- 3 copies of critical data
- 2 different media
- 1 offsite/immutable

What to back up:

- Network device configs (firewalls, switches, SD-WAN)
- PBX/SBC configuration exports
- Call routing/IVR configs (if self-managed)
- Any local servers/VMs

What *not* to rely on:

- “SaaS = no backup needed” (you still need export/retention plans)

### DR/failover scenarios (practical)

- Dubai ISP outage → fail to secondary ISP, then to 4G/5G (voice-only prioritization)
- Dubai office unavailable → agents can log into cloud PBX from an alternate site (policy permitting)
- US PBX outage → provider-side reroute to cloud/Dubai queues

## Lead management + CRM integration (end-to-end)

### Lead intake channels

- Web forms → CRM lead creation
- Inbound calls → screen-pop + match/create lead
- Outbound campaigns → predictive/preview dialer (optional) + disposition codes

### CTI/CRM minimum feature set

- Click-to-dial from CRM
- Auto call logging (duration, direction, agent, queue)
- Recording link attached to lead/contact
- Wrap-up/disposition codes mapped to CRM fields

### Reporting (combined US + Dubai)

Core KPIs:

- Inbound: ASA (average speed of answer), abandon rate, service level
- Agent: occupancy, AHT, ACW, adherence (if WFM used)
- Sales: lead-to-contact rate, contact-to-appointment, appointment-to-sale
- Quality: QA score distributions, repeat contact rate

## Internal staff app (lead management + notifications + security + reporting)

If you want **your own app** (instead of relying only on SaaS CRM screens), build it as a thin workflow layer that connects:

- cloud PBX/CCaaS (calls, queues, recordings)
- CRM / lead store (leads, customers, pipeline)
- notifications (mobile + email + in-app)
- reporting dashboards (manager + owner)

### Roles and permissions (minimum)

- **Agent**: view assigned leads, call history, notes, tasks, follow-ups
- **Team lead / Supervisor**: monitor queues, coach, approve callbacks, reassign leads
- **Manager**: performance dashboards, campaign outcomes, pipeline health, exports
- **Owner/Admin**: global visibility, configuration, security/audit, retention policies

Use strict **RBAC** (role-based access control) with row-level rules (e.g., agent can only access assigned/owned leads).

### Core app modules

1. **Lead pipeline**

- stages: New → Contacted → Qualified → Appointment → Won/Lost
- mandatory fields per stage (to keep data clean)

1. **Tasks & follow-ups**

- next action date/time, priority, SLA timers
- auto-create follow-up task after missed call / abandoned call (optional)

1. **Call-linked timeline**

- call logs (in/out), duration, disposition, queue
- recording link (permissioned)
- notes + tags + attachments

1. **Notifications**

- in-app: new lead assigned, SLA breach risk, callback due now
- push notifications (mobile): urgent callbacks / hot leads
- email: daily summary, missed SLA alerts
- optional WhatsApp/SMS (policy + country rules)

### Notification rules (examples)

- New lead assigned → notify agent immediately
- No contact within 15 minutes (business hours) → escalate to supervisor
- Appointment scheduled → notify manager + owner daily digest
- Lead idle > 48 hours → reminder + escalate

### Data security (practical controls)

#### Identity & access

- SSO + MFA for all staff
- Device posture where possible (managed devices for supervisors/admins)

#### Data protection

- Encrypt data at rest (DB + object storage) and in transit (TLS)
- Signed/expiring URLs for recordings and exports
- Field-level controls for sensitive data (PII masking for non-admin roles)

#### Audit & monitoring

- Immutable audit log: lead views, edits, exports, recording access
- Alert on unusual exports, repeated failed logins, suspicious recording access

#### Retention & backups

- Define retention: leads, call logs, recordings, exports
- Regular backups with restore testing (RPO/RTO defined)

### Reporting for managers and owners ("total report")

Minimum dashboards:

- **Operational**: service level, ASA, abandon rate, queue depth, staffing/occupancy
- **Sales funnel**: lead-to-contact, contact-to-appointment, appointment-to-sale, win rate
- **Agent performance**: AHT, ACW, wrap-up codes, adherence (if WFM), QA scores
- **Campaign**: source ROI, cost per lead, conversion by source, time-to-contact
- **Executive summary** (owner): revenue impact (if available), pipeline value, top issues, risk alerts

Delivery:

- live dashboard (web)
- scheduled daily/weekly PDF/email summaries
- drill-down from summary → agent → lead → call recording (permissioned)

### Cloud PBX/CCaaS ↔ internal app integration (practical blueprint)

This section explains how to integrate a **cloud PBX/CCaaS** platform with **your own application** so that calls automatically create/update leads, tasks, notifications, and manager/owner reporting.

#### Integration patterns (choose one)

1. **Vendor-native CRM/CTI connector**

   - Use the CCaaS vendor’s marketplace app (fastest time-to-value).
   - Good when your “own app” is lightweight and you mainly need screen-pop + call logging.

1. **Middleware (recommended for “own app” + flexibility)**

   - You run a small integration service that receives **webhooks/events** from the CCaaS and calls your app/CRM APIs.
   - Provides vendor abstraction, better reliability control, and a single place for normalization.

1. **Embedded agent desktop / softphone (deepest integration)**

   - Your app becomes the agent UI (or embeds the vendor softphone in an iframe/widget).
   - Best when you want custom workflows (lead scripts, checklists, in-app QA, bespoke routing triggers).

In most interview/real-world designs, a hybrid is used:

- Vendor agent UI for calls + your app for leads/tasks, plus a middleware for events and reporting.

#### What data must flow between CCaaS and your app

Inbound/outbound call lifecycle:

- **Call start** (ringing/answered) → screen-pop + open lead/contact
- **Call end** → auto log call, set disposition, schedule follow-up if needed
- **Recording ready** → attach recording metadata + signed access link
- **Agent state** (available/busy/after-call work) → productivity KPIs
- **Queue metrics** (ASA, abandon rate, service level) → operational dashboards

Minimum event types to support (names vary by vendor):

- `call.started`, `call.answered`, `call.ended`
- `recording.available`
- `agent.status.changed`
- `queue.metric.updated` (or periodic polling if webhooks are limited)

#### Identity mapping (make this boring and correct)

You need a stable mapping table between:

- CCaaS user ID / agent ID
- Your internal app user ID
- (Optional) CRM user ID

Rules:

- All actions are attributed to the internal app user (for audit).
- If an event arrives with an unknown agent ID, route it to a quarantine queue for admin review.

#### Event ingestion and reliability

Treat CCaaS events as an integration stream:

- Verify signatures (if provided) and enforce IP allow-listing where possible.
- Persist every event into an **append-only event log** table/collection.
- Ensure **idempotency** using provider `eventId` (or a synthetic hash of callId + timestamp + type).
- Acknowledge the webhook quickly (e.g., 200 OK) and process asynchronously.
- Retries: handle duplicate deliveries safely.

Recommended internal components:

- `webhook-receiver` (HTTP endpoint)
- `event-processor` (queue/worker)
- `integration-db` (events + mappings + call logs)

#### Data model (minimal tables/collections)

- `CallSession`:
  - `callId`, `direction`, `from`, `to`, `queueId`, `agentId`, `startedAt`, `answeredAt`, `endedAt`, `wrapUpCode`, `leadId`
- `Recording`:
  - `recordingId`, `callId`, `storageUri`, `duration`, `availableAt`, `accessPolicy`
- `Lead` / `Contact`:
  - `phoneNormalized`, `source`, `stage`, `ownerId`, `slaDueAt`
- `AuditLog`:
  - actor, action, resource, timestamp, metadata

#### Screen-pop and click-to-dial

Two common approaches:

- **Agent UI remains CCaaS**: your app is opened via a URL template (screen-pop) using caller number lookup.
- **Agent UI is your app**: integrate a dialer widget/SDK and drive outbound calls via CCaaS APIs.

Either way, normalize numbers (E.164) and store:

- raw dialed number
- normalized number
- matched lead/contact ID

#### Recording access (security-critical)

- Never expose raw storage URLs.
- Use signed, short-lived URLs or a proxy download endpoint.
- Enforce RBAC:
  - agent can access recordings for their own calls (optional)
  - supervisors/managers can access recordings within their team scope
  - owner/admin global scope
- Log every recording access into `AuditLog`.

#### Reporting integration (single source of truth)

Define which system is authoritative for each metric:

- Queue/telephony metrics (ASA, abandon, SLA): CCaaS is authoritative.
- Business funnel metrics (lead stage, revenue): your app/CRM is authoritative.

Join them by:

- `callId` (preferred, if available everywhere)
- otherwise `(phoneNormalized, timeWindow, agentId)` matching.

### Own app call setup & working (how staff actually use it)

This section describes how **your own staff app** can “do calls” in practice, while keeping telephony control in the **PBX/CCaaS** (recommended).

#### Call setup modes (choose what your vendor supports)

1. **Embedded vendor softphone (recommended for fastest delivery)**

- Your app embeds the vendor agent widget/desktop (or deep-links into it).
- Your app still owns leads/tasks/notes, while the vendor UI owns call controls.

1. **Click-to-dial via API (app triggers vendor to call)**

- Agent clicks “Call” in your app.
- Your app calls the CCaaS API to place an outbound call.
- Agent answers in softphone/deskphone; then the customer is connected.

  This “two-leg call” approach avoids your app handling RTP media.

1. **Full custom WebRTC/SDK inside your app (advanced)**

- Your app becomes the full agent phone.
- Only do this if you must (more testing, compliance, and real-time complexity).

**Best practice:** keep your app as the workflow/UI layer and let the CCaaS/PBX handle real-time media.

#### Day-to-day working flow (agent)

1. Agent signs in (SSO + MFA).
1. App shows:

- assigned leads
- callbacks due now
- SLA timers

1. Agent sets status:

- Available / Break / After-call work (synced to CCaaS where possible).

1. For any call, the app automatically builds a **call-linked timeline**:

- call start/end
- wrap-up code
- notes
- follow-up task
- recording link (once available)

#### Inbound call flow (screen-pop + auto logging)

1. Customer calls US number (toll-free/DID).
1. CCaaS routes to Dubai queue/agent.
1. CCaaS emits event: `call.started` / `call.answered`.
1. Integration service:

- normalizes caller number (E.164)
- finds lead/contact (or creates a new lead if missing)
- sends a “screen-pop” URL payload to open the lead in your app

1. Agent speaks with customer.
1. Call ends → event: `call.ended`.
1. App writes:

- disposition/wrap-up
- next action (callback date/time)
- notes

1. Recording ready → event: `recording.available`.
1. App attaches the recording metadata and generates a signed, time-limited access link.

#### Outbound call flow (click-to-dial)

1. Agent opens a lead → clicks “Call”.
1. App requests CCaaS to place call (API):

- `callFrom = agentExtension` (or agent DID)
- `callTo = customerNumber`
- `metadata = leadId, campaignId`

1. CCaaS calls the agent first (softphone/deskphone) → agent answers.
1. CCaaS then calls the customer and bridges.
1. Events stream back (`call.*`) → app logs the call and updates the lead stage.

#### What makes this “production-ready”

- **Idempotent processing:** if the CCaaS retries events, the app does not double-create logs/tasks.
- **Fallback rules:** if screen-pop fails, the agent can search by phone/name.
- **Access controls:** recordings and exports use signed URLs; all access is audited.
- **Resilience:** if CRM/app is down, calls continue; events are queued and backfilled later.
- **Compliance:** retention policies + consent prompts (as required) for recording.

## Capacity planning example (for charts)

These are example numbers you can tune during the interview.

### Assumptions

- US agents: $N_{US} = 0$ (no US agents)
- Dubai agents: $N_{DXB} = 10$
- Peak concurrency factor (fraction of agents simultaneously on calls): $f = 0.35$
- Headroom factor: $h = 1.30$

### Compute expected concurrent calls

$$C = \lceil N \times f \rceil$$

- $C_{US} = \lceil 0 \times 0.35 \rceil = 0$
- $C_{DXB} = \lceil 10 \times 0.35 \rceil = 4$
- Total peak concurrent calls: $C_{TOT} = 4$

### Provision trunk channels with headroom

$$T = \lceil C_{TOT} \times h \rceil = \lceil 4 \times 1.30 \rceil = 6$$

**Result:** plan roughly **6 SIP channels** total (split by region/provider strategy).

### Bandwidth rule of thumb (VoIP)

Approximate per call (bidirectional, including overhead) is often planned around ~100 kbps.

- Peak voice bandwidth ≈ $6 \times 100\text{ kbps} = 0.6\text{ Mbps}$

This is small compared to typical business links; the real goal is controlling **jitter/latency/packet loss** and ensuring QoS.

## Security baseline

- SSO + MFA for CRM and contact center portals
- Least privilege roles (agent vs supervisor vs admin)
- Encrypt recordings at rest; signed URLs for access; rotate keys
- SBC security policies to mitigate toll fraud
- Endpoint hardening:
  - disk encryption
  - USB policy (optional)
  - patch management

## Implementation phases (fast but realistic)

1. **Connectivity + LAN readiness** (both sites)
   - VLANs, QoS, PoE, primary+secondary ISP
2. **Core telephony enablement**
   - SIP trunks, numbers, IVR, queues, routing
3. **CRM/CTI integration**
   - screen-pop, call logging, dispositions
4. **Recording + retention + analytics**
5. **HA/DR drills**
   - ISP failover, site failover, reroute validation

## Cost comparison: US physical PBX + servers vs cloud-only

These are **planning-grade estimates** (not vendor quotes). Real costs vary by:

- seat count, concurrent call requirements, required features (WFM/QA/analytics), recording retention,
- support SLAs,
- whether you buy hardware outright or lease,
- implementation partner rates and timeline.

### Assumptions used for example sizing

- Total agents: 10 (US 0, Dubai 10)
- Peak concurrent calls target: ~6 SIP channels (from capacity example above)
- Two ISPs per site (primary + secondary)
- Call recording enabled
- Cloud CRM used (CTI integration enabled)

If your interview scenario uses a different seat count, the tables below still work (cost scales roughly by seat and by required concurrency).

### Option A — US physical PBX + US servers (hybrid)

#### Option A — What this means

- US office hosts PBX (and optionally recording/cache) on-prem.
- Dubai uses cloud PBX/contact center components and/or ties into US PBX via SIP/VPN.

#### One-time (CAPEX) typical ranges

| Item | Typical range (USD) | Notes |
| --- | ---: | --- |
| PBX appliance/server (redundant or single) | $6,000 – $25,000 | Depends on vendor/HA |
| SBC (hardware or licensed) | $2,000 – $12,000 | Security + SIP normalization |
| Virtualization host(s) / small server(s) | $5,000 – $20,000 | AD/monitoring/caching/recording (optional) |
| Network core (firewall + PoE switching) | $6,000 – $30,000 | Port density drives cost |
| Rack + cabling + patch panels | $1,000 – $6,000 | Depends on build quality |
| UPS for rack (runtime 15–30 min) | $1,500 – $8,000 | Add SNMP card if needed |
| Implementation/pro services | $10,000 – $60,000 | Design, install, testing, cutover |

**Example CAPEX envelope:** **$31,500 – $161,000**

#### Monthly recurring (OPEX) typical ranges

| Item | Typical range (USD/month) | Notes |
| --- | ---: | --- |
| SIP trunk channels (US) | $500 – $2,500 | Depends on channel count and plan |
| US toll-free number | $5 – $30 | Number rental |
| Toll-free usage | $200 – $2,500 | Depends on minutes |
| US local DIDs | $50 – $600 | Depends on quantity |
| PBX/SBC support & licensing | $300 – $3,000 | Vendor support, feature licenses |
| Recording storage (cloud/object storage) | $50 – $800 | Depends on retention + volume |
| Monitoring/management tools | $0 – $500 | Optional |

**Example OPEX envelope:** **$1,105 – $9,930/month** (not including ISP circuits)

#### Option A Pros / Cons (cost-related)

- Pros:
  - can be cheaper per seat at high scale once CAPEX is amortized
  - more direct control of routing/recording storage location
- Cons:
  - higher upfront CAPEX
  - ongoing maintenance and lifecycle refresh (3–5 years typical)

### Option B — Cloud-only PBX/contact center (no US PBX server)

#### Option B — What this means

- No PBX hosted in the US office.
- US office is “network + endpoints”; all call control/queues/IVR in cloud.
- Use SIP provider(s) and/or cloud carrier services for US toll-free + local numbers.

#### Option B one-time (CAPEX) typical ranges

| Item | Typical range (USD) | Notes |
| --- | ---: | --- |
| Network edge + PoE switching | $4,000 – $25,000 | Still required |
| Headsets (if not already owned) | $60 – $250 per agent | Call-center grade |
| Implementation/pro services | $5,000 – $40,000 | Config, IVR, queues, migrations |

**Example CAPEX envelope:** **$9,000 – $65,000** (plus endpoints)

#### Option B monthly recurring (OPEX) typical ranges

| Item | Typical range (USD/month) | Notes |
| --- | ---: | --- |
| CCaaS / cloud PBX seats | $25 – $150 per user | Feature tier drives this |
| US toll-free number | $5 – $30 | Number rental |
| Toll-free usage | $200 – $2,500 | Depends on minutes |
| US local DIDs | $50 – $600 | Depends on quantity |
| Call recording storage/retention | often included or $50 – $800 | Depends on vendor |
| Add-ons: WFM/QA/analytics | $5 – $60 per user | Only if needed |

**Example OPEX envelope (10 users):** **$250 – $1,500/month** (+ usage/add-ons)

#### Option B Pros / Cons (cost-related)

- Pros:
  - lowest upfront cost, fastest to deploy
  - scaling seats is usually a license change
- Cons:
  - can become expensive at scale depending on per-seat pricing
  - vendor lock-in risk; export/retention policies must be designed

### Quick decision guide

- If **US Agents = 0**, choose **cloud-only** in almost all cases: fastest rollout, simplest operations, easy scaling, and you’re comfortable with SaaS dependency.
- Choose **US physical PBX + servers** mainly if you have legacy/on-prem constraints, existing PBX investments, or a hard requirement for a US-hosted call-control component.

### Chart dataset (used by the HTML report)

The HTML report uses these midpoint examples for a simple comparison:

- Option A (Hybrid): CAPEX $75k, OPEX $3.5k/month
- Option B (Cloud-only): CAPEX $15k, OPEX $2.6k/month
- No US Agents: CAPEX $15k, OPEX $2.5k/month

## Toll-free + virtual number providers and pricing (planning view)

You asked specifically for **toll-free numbers** and **virtual numbers** (local DIDs) with providers and pricing.

Because telecom pricing changes frequently and depends on your exact use-case, treat the figures below as **reasonable ranges** to use in an interview / initial budget.

### Definitions (quick)

- **Toll-free number**: caller is not charged (or charged less) *within the number’s home country*, while the business pays.
- **Virtual number / DID (Direct Inward Dial)**: local geographic number that can ring anywhere (PBX/softphone) via SIP.

### US providers (toll-free + DIDs)

Common choices (availability depends on compliance/onboarding and your desired features):

- **Twilio** (numbers + SIP + APIs)
- **Telnyx** (numbers + SIP)
- **Bandwidth** (numbers + SIP; often via partners)
- **Vonage** (voice + CCaaS options)
- **Flowroute / other SIP carriers**

#### Typical US price ranges (budgetary)

| Item | Typical range | Notes |
| --- | ---: | --- |
| US toll-free number rental | $5 – $30 / month | per number |
| US local DID rental | $1 – $10 / month | per number; volume discounts common |
| Usage (voice minutes) | varies by plan | inbound/outbound rates and bundles vary |

**Practical guidance:** for call centers, the decisive cost is usually **minutes + seats + recording retention**, not the number rental.

### UAE/Dubai providers (numbers + SIP)

**Important:** UAE voice termination and SIP services are typically regulated and must be purchased through licensed local operators.

Common operator choices:

- **du** (Business SIP trunk, business voice)
- **Etisalat by e&** (business voice/SIP offerings)

#### Example Dubai pricing signal (du)

du publishes business SIP trunk bundles (example list pricing on their site):

- 10 channels: **AED 1,120/month** (+VAT) and **AED 1,000 one-time activation**
- 20 channels: **AED 1,650/month** (+VAT) and **AED 1,000 one-time activation**
- 30 channels: **AED 3,180/month** (+VAT) and **AED 1,000 one-time activation**

Source: <https://www.du.ae/siptrunk>

Use this in your plan as an “anchor” price point for Dubai local SIP connectivity, then adjust based on your required channels and contract terms.

### Global/International reach: what usually works best

- A **US toll-free** number is typically intended for callers **inside the US**.
- If you need customers in multiple countries to reach you easily, common patterns are:
  - country-specific toll-free arrangements, OR
  - **local DIDs** in each target country with global routing, OR
  - call-back flows / digital channels.

Reference discussion: <https://didlogic.com/blog/are-toll-free-numbers-free-to-call-internationally/>

### What to include in your interview “pricing slide”

If you want a clean, defensible budget line, use:

- **Numbers (monthly):**
  - US toll-free: $10–$30/mo
  - US DIDs: $2–$8/mo each (x count)
- **Carrier/SIP:** based on required channels + expected minutes
- **Cloud PBX/CCaaS seats:** $25–$150/user/mo depending on tier
- **Dubai SIP trunk (example):** du channel bundle + activation

## References (non-exhaustive)

- Toll-free international reach constraints and alternatives (local DIDs, ITFNs, callbacks):
  - <https://didlogic.com/blog/are-toll-free-numbers-free-to-call-internationally/>
- Cloud vs on‑prem vs hybrid contact center deployment models:
  - <https://www.enghouseinteractive.com/blog/contact-center-deployment-cloud-vs-on-prem-vs-hybrid/>
- SD‑WAN concepts for VoIP (prioritization, bonding, jitter handling):
  - <https://broadvoice.com/blog/sd-wan-meet-voips-new-bf/>
- Wireless/cellular failover concept for voice continuity:
  - <https://www.simplicityvoip.net/products/wireless-backup>
- UPS vs rectifiers overview (telecom power continuity concepts):
  - <https://blog.outdoortelecomcabinet.com/telecom-battery-backup-systems-ups-vs-rectifiers-guide/>
