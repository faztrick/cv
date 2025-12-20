# Call Center Infrastructure Report — US HQ + Dubai Operations

**Technical plan + budget view for US-based company with centralized Dubai operations.**
Last updated: **2025-12-19**

<div dir="rtl" style="text-align: right; margin-top: 10px;">
<strong>خطة تقنية + ميزانية (الشركة في أمريكا + مركز الاتصال في دبي).</strong><br/>
آخر تحديث: <strong>2025-12-19</strong>
</div>

---

## Executive Summary & Visual Model

**The Concept:** A split-operation model. The **US** entity holds the brand, customers, and phone numbers. The **Dubai** entity holds the workforce (agents).

<div style="margin: 24px 0;">
<svg viewBox="0 0 800 160" width="100%" height="auto">
  <style>
    .sBox { fill: #f8f9fa; stroke: #0d6efd; stroke-width: 2; rx: 8; }
    .sText { fill: #212529; font: 600 15px ui-sans-serif, system-ui; text-anchor: middle; }
    .sSub { fill: #6c757d; font: 13px ui-sans-serif, system-ui; text-anchor: middle; }
    .sArrow { stroke: #212529; stroke-width: 2; marker-end: url(#sArr); }
  </style>
  <defs>
    <marker id="sArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#212529" />
    </marker>
  </defs>
  <!-- US Node -->
  <rect class="sBox" x="20" y="30" width="200" height="100" />
  <text class="sText" x="120" y="75">US HQ</text>
  <text class="sSub" x="120" y="98">Customers + Numbers</text>
  <!-- Cloud Node -->
  <rect class="sBox" x="300" y="30" width="200" height="100" style="stroke-dasharray: 4,4" />
  <text class="sText" x="400" y="75">Cloud Routing</text>
  <text class="sSub" x="400" y="98">PBX / CCaaS</text>
  <!-- Dubai Node -->
  <rect class="sBox" x="580" y="30" width="200" height="100" />
  <text class="sText" x="680" y="75">Dubai Ops</text>
  <text class="sSub" x="680" y="98">Agents + Supervisors</text>
  <!-- Arrows -->
  <line class="sArrow" x1="220" y1="80" x2="300" y2="80" />
  <line class="sArrow" x1="500" y1="80" x2="580" y2="80" />
</svg>
</div>

### Key Metrics

| Metric | Value | Note |
| :--- | :--- | :--- |
| **Total Agents (Dubai)** | 10 | Centralized Ops |
| **Target Channels** | 6 | Concurrent Calls |
| **Bandwidth** | ~0.6 Mbps | Voice Traffic |

<div dir="rtl" style="text-align: right; margin-top: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
<h3 style="margin: 0 0 8px;">ملخص سريع (عربي)</h3>
<p style="margin: 0 0 8px;">
  <strong>النموذج:</strong> المقر الرئيسي والعملاء في أمريكا، بينما فريق العمل والعمليات في دبي.
</p>
<ul style="margin: 0 18px 0 0;">
  <li><strong>العدد:</strong> 10 موظفين (دبي).</li>
  <li><strong>السعة:</strong> 6 قنوات اتصال متزامنة.</li>
</ul>
</div>

<div style="page-break-before: always;"></div>

## Cost Comparison (Estimates)

| Option | CAPEX | OPEX / month |
| :--- | :--- | :--- |
| **Hybrid** (US HQ PBX + Dubai Agents) | $75k | $3.5k |
| **Cloud Model** (US Routing → Dubai Ops) | $15k | $2.6k |

> **Tip:** For most deployments, the biggest levers are **seat tier**, **minutes**, and **recording retention**.

## Options Comparison

| Option | Best for | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Cloud-only CCaaS** | Fastest rollout, simplest ops | • Easy scaling + vendor HA<br>• Ideal for Centralized Dubai Ops<br>• Strong analytics modules | • Vendor dependency<br>• OPEX driven by seats/minutes |
| **Hybrid: US PBX** | Legacy/compliance needs | • More control of routing<br>• Reuse existing PBX investment | • WAN-sensitive RTP<br>• More ops/patching<br>• Must plan reroute to cloud |
| **Your App** | Leads/tasks/notifications | • Screen-pop + click-to-dial<br>• Auto logs + SLA tasks<br>• RBAC + audit trail | • Needs solid integration<br>• Not a replacement for CCaaS |

## Dubai Physical Device Setup (10 Agents)

Since the US office has no agents, the **Dubai site** is the operational hub.

### 10-Agent Starter Kit

| Category | Item | Notes |
| :--- | :--- | :--- |
| **Endpoints** | 10 × USB noise-cancelling headsets | Plus 1–2 spares; essential |
| | 10 × Workstations (16GB RAM) | Dual monitors recommended |
| **Network** | 1 × Business Firewall + QoS | Must support VPN + prioritization |
| | 1 × Managed PoE Switch | Separate Voice/Data VLANs |
| | 10 × Wired Ethernet drops | **No Wi-Fi for voice** |
| **Power** | 1 × UPS for Network Rack | Keeps firewall/switch up |

### Connectivity & Resilience

* **Primary:** Business Fiber (dedicated or high-speed broadband).
* **Secondary:** Different carrier or medium (e.g., 5G/LTE backup).
* **SD-WAN (Recommended):** To bond links and smooth out jitter/packet loss.

<div style="page-break-before: always;"></div>

## Internal Staff App Architecture

If you want **your own app for staff**, build it as a thin workflow layer that connects PBX/CCaaS events to lead management.

<div style="margin: 20px 0;">
<svg viewBox="0 0 980 320" width="100%" height="auto">
  <defs>
    <marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#0dcaf0" />
    </marker>
    <style>
      .b { fill: #fff; stroke: #dee2e6; stroke-width: 1.2; rx: 18; ry: 18; }
      .t { fill: #212529; font: 600 14px ui-sans-serif, system-ui; }
      .s { fill: #6c757d; font: 12px ui-sans-serif, system-ui; }
      .l { stroke: #0d6efd; stroke-width: 2.4; fill: none; marker-end: url(#a2); }
    </style>
  </defs>
  <rect class="b" x="20" y="54" width="240" height="92" />
  <text class="t" x="40" y="88">Cloud PBX / CCaaS</text>
  <text class="s" x="40" y="112">call events, recordings, queues</text>
  <text class="s" x="40" y="134">webhooks/APIs</text>
  <rect class="b" x="300" y="36" width="300" height="128" />
  <text class="t" x="320" y="74">Internal Staff App</text>
  <text class="s" x="320" y="98">lead pipeline, tasks, SLA timers</text>
  <text class="s" x="320" y="120">audit trail, RBAC, exports</text>
  <text class="s" x="320" y="142">reporting API</text>
  <rect class="b" x="640" y="36" width="320" height="128" />
  <text class="t" x="660" y="74">Lead Store / CRM</text>
  <text class="s" x="660" y="98">leads, contacts, pipeline</text>
  <text class="s" x="660" y="120">notes, dispositions</text>
  <text class="s" x="660" y="142">integrations</text>
  <rect class="b" x="300" y="204" width="300" height="92" />
  <text class="t" x="320" y="238">Notifications</text>
  <text class="s" x="320" y="262">in-app + email + mobile push</text>
  <text class="s" x="320" y="284">(policy + country rules)</text>
  <rect class="b" x="640" y="204" width="320" height="92" />
  <text class="t" x="660" y="238">Dashboards</text>
  <text class="s" x="660" y="262">manager + owner reporting</text>
  <text class="s" x="660" y="284">drill-down + exports</text>
  <path class="l" d="M 260 100 L 300 100" />
  <path class="l" d="M 600 100 L 640 100" />
  <path class="l" d="M 450 164 L 450 204" />
  <path class="l" d="M 600 250 L 640 250" />
</svg>
</div>

### Integration Blueprint

| Capability | How | Notes |
| :--- | :--- | :--- |
| **Call events** | Webhooks → API | Process async, idempotent |
| **Screen-pop** | URL template | Lookup by E.164 phone |
| **Click-to-dial** | App calls API | Enforce permissions |
| **Recordings** | Signed links | RBAC + audit log |

<div style="page-break-before: always;"></div>

## Detailed Technical Flow (Reference)

This view shows how calls traverse from the US carrier to Dubai agents.

<div style="margin: 20px 0;">
<svg viewBox="0 0 980 320" width="100%" height="auto">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#adb5bd" />
    </marker>
    <marker id="arrowAccent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#0dcaf0" />
    </marker>
    <style>
      .box { fill: #fff; stroke: #dee2e6; stroke-width: 1.2; rx: 18; ry: 18; }
      .label { fill: #212529; font: 600 14px ui-sans-serif, system-ui; }
      .small { fill: #6c757d; font: 12px ui-sans-serif, system-ui; }
      .line { stroke: #dee2e6; stroke-width: 2; fill: none; marker-end: url(#arrow); }
      .lineAccent { stroke: #0d6efd; stroke-width: 2.4; fill: none; marker-end: url(#arrowAccent); }
      .dashed { stroke-dasharray: 7 6; opacity: 0.9; }
    </style>
  </defs>
  <rect class="box" x="20" y="58" width="220" height="92" />
  <text class="label" x="40" y="92">US Numbers</text>
  <text class="small" x="40" y="116">Toll-free + Local DIDs</text>
  <text class="small" x="40" y="138">(US carrier)</text>
  <rect class="box" x="280" y="40" width="260" height="128" />
  <text class="label" x="300" y="78">Carrier Routing</text>
  <text class="small" x="300" y="102">SIP trunk / TF routing</text>
  <text class="small" x="300" y="124">time-of-day + failover</text>
  <text class="small" x="300" y="146">fraud controls</text>
  <rect class="box" x="580" y="40" width="260" height="128" />
  <text class="label" x="600" y="78">Cloud PBX / CCaaS</text>
  <text class="small" x="600" y="102">IVR + queues</text>
  <text class="small" x="600" y="124">recording + analytics</text>
  <text class="small" x="600" y="146">CRM/CTI integration</text>
  <rect class="box" x="760" y="204" width="200" height="92" />
  <text class="label" x="780" y="238">Dubai Agents</text>
  <text class="small" x="780" y="262">softphone + wired LAN</text>
  <text class="small" x="780" y="284">dual ISP (+ optional 5G)</text>
  <path class="lineAccent" d="M 240 104 L 280 104" />
  <path class="lineAccent" d="M 540 104 L 580 104" />
  <path class="lineAccent" d="M 840 168 L 860 204" />
  <path class="line dashed" d="M 410 168 C 410 220, 650 220, 760 220" />
  <text class="small" x="440" y="236">Provider-side reroute</text>
  <text class="small" x="440" y="254">if cloud POP/region impaired</text>
</svg>
</div>

## Implementation Timeline

<div style="margin: 20px 0;">
<svg viewBox="0 0 980 320" width="100%" height="auto">
  <defs>
    <style>
      .axis { stroke: #dee2e6; stroke-width: 1; }
      .t { fill: #212529; font: 600 12px ui-sans-serif, system-ui; }
      .s { fill: #6c757d; font: 12px ui-sans-serif, system-ui; }
      .bar { stroke: #dee2e6; stroke-width: 1; rx: 12; ry: 12; }
    </style>
  </defs>
  <line class="axis" x1="220" y1="54" x2="940" y2="54" />
  <line class="axis" x1="220" y1="280" x2="940" y2="280" />
  <g>
    <line class="axis" x1="220" y1="54" x2="220" y2="280" />
    <text class="s" x="212" y="42">W1</text>
    <line class="axis" x1="340" y1="54" x2="340" y2="280" />
    <text class="s" x="332" y="42">W2</text>
    <line class="axis" x1="460" y1="54" x2="460" y2="280" />
    <text class="s" x="452" y="42">W3</text>
    <line class="axis" x1="580" y1="54" x2="580" y2="280" />
    <text class="s" x="572" y="42">W4</text>
    <line class="axis" x1="700" y1="54" x2="700" y2="280" />
    <text class="s" x="692" y="42">W5</text>
    <line class="axis" x1="820" y1="54" x2="820" y2="280" />
    <text class="s" x="812" y="42">W6</text>
    <line class="axis" x1="940" y1="54" x2="940" y2="280" />
  </g>
  <text class="t" x="20" y="92">1) Connectivity + LAN</text>
  <text class="t" x="20" y="134">2) Numbers + SIP</text>
  <text class="t" x="20" y="176">3) Cloud PBX config</text>
  <text class="t" x="20" y="218">4) CRM/CTI + reporting</text>
  <text class="t" x="20" y="260">5) Recording + HA drills</text>
  <rect class="bar" x="220" y="72" width="240" height="26" fill="#e0f7fa" />
  <rect class="bar" x="220" y="114" width="240" height="26" fill="#fff3cd" />
  <rect class="bar" x="340" y="156" width="240" height="26" fill="#e0f7fa" />
  <rect class="bar" x="460" y="198" width="240" height="26" fill="#d1e7dd" />
  <rect class="bar" x="580" y="240" width="240" height="26" fill="#d1e7dd" />
</svg>
</div>

## Resilience / DR Matrix

| Scenario | Impact | Auto Mitigation | Target RTO |
| :--- | :--- | :--- | :--- |
| **Dubai ISP down** | Medium | SD-WAN fails over to secondary/5G | 1–5 min |
| **Dubai office unavailable** | High | Agents log in remotely (policy) | 30–120 min |
| **Cloud PBX region impaired** | High | Provider-side reroute | 15–60 min |
| **US toll-free issue** | High | Secondary carrier / alternate DID | 30–180 min |
