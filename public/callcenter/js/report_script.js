(function () {
  // Theme + language toggles (persisted) + shared helpers
  const root = document.documentElement;
  const themeBtn = document.getElementById("themeBtn");
  const langBtn = document.getElementById("langBtn");

  const I18N = {
    en: {
      brandTitle: "Call Center Report",
      navSummary: "Summary",
      navCompare: "Compare",
      navCosts: "Costs",
      navProviders: "Providers",
      navDubaiSetup: "Dubai Setup",
      navApp: "Own App",
      navHybrid: "Hybrid PBX",
      navSizing: "Sizing",
      navDr: "DR",
      navDeployment: "Deployment",

      // Section Headers
      secSummary: "Executive Summary",
      secSummaryDesc: "This report explores the infrastructure for a US-HQ call center with Dubai operations.",
      lblArchitecture: "Architecture",
      lblPrimaryRegion: "Primary Region",
      lblAgentLocation: "Agent Location",
      lblCompliance: "Compliance",
      secProviders: "Provider Landscape (2025)",
      secProvidersDesc: "Comparison of top Cloud PBX and CCaaS providers.",
      lblCategory: "Category",
      lblCommonProviders: "Company examples",
      secCloudServer: "Cloud server cost (planning-grade)",
      lblItem: "Component",
      lblNotes: "Notes",
      secDubaiSetup: "Dubai physical device setup (10 agents)",
      secApp: "Internal staff app (leads + notifications + security + reporting)",
      lblPrimaryUsers: "Primary users",
      lblManagement: "Management",
      secNotificationRules: "Notification rules (examples)",
      secSecurityBaseline: "Security baseline for your app",
      secReports: "Reports for managers and owner (\"total report\")",
      secIntegrationBlueprint: "Cloud PBX / CCaaS integration blueprint",
      secCallSetup: "Own app call setup & working",
      secHybrid: "Detailed Technical Flow (Reference)",
      secHybridPbx: "Hybrid: US physical PBX used from Dubai",
      secHybridPbxDesc: "If you still deploy a physical PBX in the US, Dubai agents can register remotely via a US SBC. The key engineering topic is the media path (RTP) and WAN quality.",
      lblSecurity: "Security",
      lblQuality: "Quality",
      lblDr: "DR",
      txtSecurity: "remote registration terminates on SBC (not PBX)",
      txtQuality: "RTP is WAN-sensitive; engineer jitter/packet-loss and QoS",
      txtDr: "preconfigure carrier reroute to cloud standby queues",
      secCapacitySplit: "Capacity split & headroom",
      secCapacitySplitDesc: "Visualizes the same sizing logic used in the Markdown: concurrency factor + headroom to reach a trunk/channel target.",
      lblConcurrencyFactor: "Concurrency factor",
      lblHeadroomFactor: "Headroom factor",
      lblCurrent: "Current:",
      lblPlannedChannels: "Planned channels",
      secCostSensitivity: "Cost sensitivity (quick)",
      secCostSensitivityDesc: "Adjust seats to see an estimated OPEX/month band for cloud contact center. This is a planning calculator (not a quote).",
      lblSeatCount: "Seat count",
      lblSeatPrice: "Per-seat / month (USD)",
      lblInfraPreset: "Cloud server overhead",
      optLean: "Lean (SaaS-heavy) — $400/mo",
      optStandard: "Standard (middleware + logs) — $1,500/mo",
      optAdvanced: "Advanced (BI/warehouse + SIEM) — $5,000/mo",
      lblModel: "Model",
      lblEstOpex: "Est. OPEX / month",
      lblCloudOnly: "Cloud-only",
      lblNoUs: "No US Agents (Dubai Ops)",
      secOpexComposition: "OPEX composition",
      secTimeline: "Implementation timeline (example)",
      secTimelineDesc: "A practical rollout sequence for a US-HQ-only model (with Dubai agents). Adjust durations based on compliance onboarding, number porting, and CRM integration complexity.",
      noteTimeline: "Note: number porting + carrier onboarding can extend the schedule.",
      secDrMatrix: "Resilience / DR matrix (visual)",
      secDrMatrixDesc: "A quick, interview-friendly view of common failure modes and what the system does. “Auto” means no human action is required to keep calls flowing.",
      lblScenario: "Scenario",
      lblCustomerImpact: "Customer impact",
      lblAutoMitigation: "Auto mitigation",
      lblTargetRto: "Target RTO",
      rowDubaiIsp: "Dubai primary ISP down",
      rowDubaiOffice: "Dubai office unavailable (power/building)",
      rowCloudRegion: "Cloud PBX/CCaaS region impaired",
      rowUsCarrier: "US toll-free carrier issue",
      rowCrmOutage: "CRM outage",
      rowVoipQuality: "VoIP quality degradation (jitter/packet loss)",
      secDeployment: "Deployment & Access",
      secDeploymentDesc: "This report and the associated infrastructure dashboard are hosted on Microsoft Azure.",
      lblCloudProvider: "Cloud Provider",
      lblLiveUrl: "Live URL",

      // Table Headers
      lblTypicalModel: "Typical model",
      lblTypicalRange: "Typical range",
      lblAudience: "Audience",
      lblKeyDashboards: "Key dashboards",
      lblDelivery: "Delivery",
      lblCapability: "Capability",
      lblHow: "How",
      lblMode: "Mode",
      lblHowItWorks: "How it works",
      lblBestFor: "Best for",
      secCloudProvidersDesc: "These are common vendors you can shortlist. Final pricing depends on feature tier (recording, analytics, WFM/QA), minutes, and retention.",
      footCloudProviders: "Tip: For budgeting, seats usually dominate; cloud infra servers are typically smaller unless you build custom middleware/BI.",
      secCloudServerDesc: "“Cloud server cost” here means integration services + databases + storage + monitoring around the SaaS stack.",
      footCloudServer: "Rule of thumb: SaaS-heavy deployments often land around $300–$3,000/month for cloud infra servers.",
      secDubaiSetupDesc: "Since the US office has no agents, the Dubai site is the operational hub. This setup ensures voice quality and reliability.",
      headStarterKit: "10-agent starter kit",
      headConnectivity: "Connectivity & Resilience",
      secAppDesc: "If you want your own app for staff, build it as a thin workflow layer that connects PBX/CCaaS events to lead management, notifications, and dashboards.",
      secIntegrationBlueprintDesc: "This is the practical integration layer between your cloud PBX/CCaaS and your own app. The goal is: screen-pop, auto call logging, recording links, SLA tasks, and unified reporting.",
      footIntegration: "Operational note: keep webhooks fast (200 OK) and process asynchronously. Always log events + recording access for audit and compliance.",
      secCallSetupDesc: "Your app should stay a workflow layer (leads/tasks/notes) while the PBX/CCaaS stays the real-time telephony engine. This keeps delivery fast and reliable.",
      secHybridDesc: "This is the \"under the hood\" view of the cloud routing model. It shows how calls traverse from the US carrier to Dubai agents.",
      footHybrid: "Key point: Since call center operations are in Dubai, a US PBX is not required for agents, only for HQ office needs. Keep the US carrier + routing policies and let Dubai be the operational site.",
      footCostSensitivity: "Baseline includes placeholder fixed costs (numbers + storage). Add minutes, WFM/QA/analytics, and Dubai local SIP if required.",
      footDrMatrix: "If you want this matrix to be “production grade”, add: monitoring signals (MOS/jitter), alert thresholds, owner/runbook links, and evidence of quarterly failover drills.",
      footCompanion: "File companion:",
    },
    ar: {
      // Arabic UI labels, keep key technical terms in English
      brandTitle: "تقرير مركز الاتصال",
      navSummary: "ملخص",
      navCompare: "مقارنة",
      navCosts: "التكلفة",
      navProviders: "المزوّدون",
      navDubaiSetup: "تجهيزات دبي",
      navApp: "تطبيقكم (App)",
      navHybrid: "Hybrid PBX",
      navSizing: "التحجيم (Sizing)",
      navDr: "التعافي من الكوارث (DR)",
      navDeployment: "النشر (Deployment)",

      // Section Headers
      secSummary: "الملخص التنفيذي والنموذج المرئي",
      secCosts: "مقارنة التكلفة (نقاط متوسطة)",
      secCompare: "مقارنة الخيارات (الإيجابيات / السلبيات)",
      secProviders: "موفرو الأرقام المجانية والافتراضية",
      secCloudProviders: "موفرو Cloud PBX / CCaaS + الأسعار",
      secCloudServer: "تكلفة الخادم السحابي (تقديرية)",
      secDubaiSetup: "إعداد الأجهزة المادية في دبي (10 وكلاء)",
      secApp: "تطبيق الموظفين الداخلي",
      secHybrid: "التدفق الفني التفصيلي (مرجع)",
      secHybridPbx: "هجين: مقسم فرعي فعلي في الولايات المتحدة يُستخدم من دبي",
      secHybridPbxDesc: "إذا كنت لا تزال تنشر بدالة فعلية في الولايات المتحدة، يمكن لوكلاء دبي التسجيل عن بعد عبر SBC أمريكي. الموضوع الهندسي الرئيسي هو مسار الوسائط (RTP) وجودة الشبكة الواسعة.",
      lblSecurity: "الأمان",
      lblQuality: "الجودة",
      lblDr: "التعافي من الكوارث",
      txtSecurity: "التسجيل عن بعد ينتهي عند SBC (وليس البدالة)",
      txtQuality: "RTP حساس للشبكة الواسعة؛ هندسة التقطيع/فقدان الحزم وجودة الخدمة",
      txtDr: "تكوين إعادة توجيه الناقل مسبقًا إلى قوائم انتظار سحابية احتياطية",
      secCapacitySplit: "تقسيم السعة والهامش",
      secCapacitySplitDesc: "يوضح نفس منطق التحجيم المستخدم في Markdown: عامل التزامن + الهامش للوصول إلى هدف القنوات/الخطوط.",
      lblConcurrencyFactor: "عامل التزامن",
      lblHeadroomFactor: "عامل الهامش",
      lblCurrent: "الحالي:",
      lblPlannedChannels: "القنوات المخططة",
      secCostSensitivity: "حساسية التكلفة (سريع)",
      secCostSensitivityDesc: "اضبط المقاعد لرؤية نطاق تقديري للنفقات التشغيلية/شهر لمركز الاتصال السحابي. هذه حاسبة تخطيط (وليست عرض سعر).",
      lblSeatCount: "عدد المقاعد",
      lblSeatPrice: "لكل مقعد / شهر (دولار)",
      lblInfraPreset: "تكاليف الخادم السحابي العامة",
      optLean: "خفيف (يعتمد على SaaS) — 400 دولار/شهر",
      optStandard: "قياسي (برمجيات وسيطة + سجلات) — 1,500 دولار/شهر",
      optAdvanced: "متقدم (ذكاء أعمال/مستودع بيانات + SIEM) — 5,000 دولار/شهر",
      lblModel: "النموذج",
      lblEstOpex: "تقدير النفقات التشغيلية / شهر",
      lblCloudOnly: "سحابي فقط",
      lblNoUs: "لا وكلاء في أمريكا (عمليات دبي)",
      secOpexComposition: "تكوين النفقات التشغيلية",
      secTimeline: "الجدول الزمني للتنفيذ (مثال)",
      secTimelineDesc: "تسلسل عملي للإطلاق لنموذج المقر الرئيسي في الولايات المتحدة فقط (مع وكلاء دبي). اضبط المدد بناءً على الامتثال، ونقل الأرقام، وتعقيد تكامل CRM.",
      noteTimeline: "ملاحظة: يمكن أن يؤدي نقل الأرقام + إجراءات الناقل إلى تمديد الجدول الزمني.",
      secDrMatrix: "مصفوفة المرونة / التعافي من الكوارث (مرئي)",
      secDrMatrixDesc: "عرض سريع ومناسب للمقابلات لأوضاع الفشل الشائعة وما يفعله النظام. 'تلقائي' يعني عدم الحاجة إلى تدخل بشري لاستمرار تدفق المكالمات.",
      lblScenario: "السيناريو",
      lblCustomerImpact: "تأثير العميل",
      lblAutoMitigation: "التخفيف التلقائي",
      lblTargetRto: "وقت التعافي المستهدف (RTO)",
      rowDubaiIsp: "توقف مزود الخدمة الأساسي في دبي",
      rowDubaiOffice: "مكتب دبي غير متاح (طاقة/مبنى)",
      rowCloudRegion: "تأثر منطقة Cloud PBX/CCaaS",
      rowUsCarrier: "مشكلة في الناقل المجاني الأمريكي",
      rowCrmOutage: "انقطاع CRM",
      rowVoipQuality: "تدهور جودة VoIP (تقطيع/فقدان حزم)",
      secDeployment: "النشر والوصول",
      secDeploymentDesc: "تتم استضافة هذا التقرير ولوحة معلومات البنية التحتية المرتبطة به على Microsoft Azure.",
      lblCloudProvider: "مزود السحابة",
      lblLiveUrl: "الرابط المباشر",

      // Table Headers
      lblTypicalModel: "النموذج المعتاد",
      lblTypicalRange: "النطاق المعتاد",
      lblAudience: "الجمهور",
      lblKeyDashboards: "لوحات المعلومات الرئيسية",
      lblDelivery: "التسليم",
      lblCapability: "القدرة",
      lblHow: "الكيفية",
      lblMode: "الوضع",
      lblHowItWorks: "كيف يعمل",
      lblBestFor: "الأفضل لـ",

      // Common Labels
      lblConcept: "المفهوم:",
      lblTotalAgents: "إجمالي الوكلاء (دبي)",
      lblTargetChannels: "القنوات المستهدفة",
      lblBandwidth: "النطاق الترددي",
      lblOption: "الخيار",
      lblCapex: "النفقات الرأسمالية (CAPEX)",
      lblOpex: "النفقات التشغيلية / شهر",
      lblBestFor: "الأفضل لـ",
      lblPros: "الإيجابيات",
      lblCons: "السلبيات",
      lblCategory: "الفئة",
      lblItem: "العنصر",
      lblNotes: "ملاحظات",
      lblRegion: "المنطقة",
      lblCommonProviders: "المزودون الشائعون",
      lblPricingNotes: "ملاحظات التسعير",
      lblCloudProvider: "مزود السحابة",
      lblLiveUrl: "الرابط المباشر",
      lblPrimaryUsers: "المستخدمون الأساسيون",
      lblManagement: "الإدارة",
      lblScenario: "السيناريو",
      lblImpact: "تأثير العميل",
      lblMitigation: "التخفيف التلقائي",
      lblRto: "وقت التعافي المستهدف (RTO)",
      secCloudProvidersDesc: "هؤلاء هم البائعون الشائعون الذين يمكنك وضعهم في القائمة المختصرة. يعتمد السعر النهائي على مستوى الميزات (التسجيل، التحليلات، إدارة القوى العاملة/ضمان الجودة)، والدقائق، والاحتفاظ بالبيانات.",
      footCloudProviders: "نصيحة: بالنسبة للميزانية، عادة ما تهيمن المقاعد؛ عادة ما تكون خوادم البنية التحتية السحابية أصغر ما لم تقم ببناء برمجيات وسيطة/ذكاء أعمال مخصص.",
      secCloudServerDesc: "تعني \"تكلفة الخادم السحابي\" هنا خدمات التكامل + قواعد البيانات + التخزين + المراقبة حول مجموعة SaaS.",
      footCloudServer: "قاعدة عامة: غالبًا ما تصل عمليات النشر الكثيفة لـ SaaS إلى حوالي 300-3000 دولار شهريًا لخوادم البنية التحتية السحابية.",
      secDubaiSetupDesc: "نظرًا لعدم وجود وكلاء في مكتب الولايات المتحدة، فإن موقع دبي هو المركز التشغيلي. يضمن هذا الإعداد جودة الصوت والموثوقية.",
      headStarterKit: "مجموعة أدوات البدء لـ 10 وكلاء",
      headConnectivity: "الاتصال والمرونة",
      secAppDesc: "إذا كنت تريد تطبيقك الخاص للموظفين، فقم ببنائه كطبقة سير عمل رقيقة تربط أحداث PBX/CCaaS بإدارة العملاء المحتملين والإشعارات ولوحات المعلومات.",
      secIntegrationBlueprintDesc: "هذه هي طبقة التكامل العملية بين Cloud PBX/CCaaS وتطبيقك الخاص. الهدف هو: ظهور الشاشة، وتسجيل المكالمات التلقائي، وروابط التسجيل، ومهام اتفاقية مستوى الخدمة، وإعداد التقارير الموحدة.",
      footIntegration: "ملاحظة تشغيلية: حافظ على سرعة الويب هوك (200 OK) وقم بالمعالجة بشكل غير متزامن. قم دائمًا بتسجيل الأحداث + الوصول إلى التسجيل للتدقيق والامتثال.",
      secCallSetupDesc: "يجب أن يظل تطبيقك طبقة سير عمل (عملاء محتملين/مهام/ملاحظات) بينما يظل PBX/CCaaS محرك الاتصالات الهاتفية في الوقت الفعلي. هذا يحافظ على سرعة التسليم والموثوقية.",
      secHybridDesc: "هذا هو العرض \"تحت الغطاء\" لنموذج التوجيه السحابي. يوضح كيف تنتقل المكالمات من الناقل الأمريكي إلى وكلاء دبي.",
      footHybrid: "نقطة رئيسية: نظرًا لأن عمليات مركز الاتصال تتم في دبي، فإن بدالة الولايات المتحدة ليست مطلوبة للوكلاء، فقط لاحتياجات مكتب المقر الرئيسي. احتفظ بالناقل الأمريكي + سياسات التوجيه واجعل دبي الموقع التشغيلي.",
      footCostSensitivity: "يتضمن خط الأساس تكاليف ثابتة نائبة (أرقام + تخزين). أضف الدقائق، وإدارة القوى العاملة/ضمان الجودة/التحليلات، و SIP المحلي في دبي إذا لزم الأمر.",
      footDrMatrix: "إذا كنت تريد أن تكون هذه المصفوفة \"بدرجة الإنتاج\"، فأضف: إشارات المراقبة (MOS/jitter)، وعتبات التنبيه، وروابط المالك/دليل التشغيل، ودليل على تدريبات تجاوز الفشل ربع السنوية.",
      footCompanion: "ملف مصاحب:",
    },
  };

  function cssVar(name, fallback) {
    const v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  }

  function resolveSystemTheme() {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyThemeMode(mode) {
    const resolved = mode === "auto" ? resolveSystemTheme() : mode;
    root.setAttribute("data-theme", resolved);
    root.setAttribute("data-theme-mode", mode);
    if (themeBtn) {
      // Update icon or text
      const icon = mode === "light" ? "☀️" : mode === "dark" ? "🌙" : "🌓";
      themeBtn.innerHTML = `<span style="font-size:16px">${icon}</span> ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    }
  }

  function applyLang(lang) {
    root.setAttribute("data-lang", lang);
    const dict = I18N[lang] || I18N.en;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key && dict[key]) el.textContent = dict[key];
    });
    if (langBtn) {
      langBtn.textContent = lang === "ar" ? "AR" : "EN";
    }
  }

  // restore preferences - Default to LIGHT if not set
  const savedThemeMode =
    localStorage.getItem("cc_report_theme_mode") ||
    "light"; // Changed default to light
  const savedLang =
    localStorage.getItem("cc_report_lang") ||
    root.getAttribute("data-lang") ||
    "en";

  applyThemeMode(savedThemeMode);
  applyLang(savedLang);

  // react to OS theme changes when in auto
  if (window.matchMedia) {
    const mm = window.matchMedia("(prefers-color-scheme: dark)");
    if (mm && mm.addEventListener) {
      mm.addEventListener("change", () => {
        if (root.getAttribute("data-theme-mode") === "auto") {
          applyThemeMode("auto");
          window.__ccRedrawAllCharts && window.__ccRedrawAllCharts();
        }
      });
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme-mode") || "auto";
      const next =
        current === "auto" ? "light" : current === "light" ? "dark" : "auto";
      localStorage.setItem("cc_report_theme_mode", next);
      applyThemeMode(next);
      window.__ccRedrawAllCharts && window.__ccRedrawAllCharts();
    });
  }

  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const current = root.getAttribute("data-lang") || "en";
      const next = current === "en" ? "ar" : "en";
      localStorage.setItem("cc_report_lang", next);
      applyLang(next);
    });
  }

  // expose helper
  window.__ccCssVar = cssVar;
})();

(function () {
  // Mermaid diagrams (modernized SVG -> Mermaid)
  function ensureMermaidSource(el) {
    if (!el) return;
    if (!el.dataset.src) {
      // Store the original Mermaid source for theme re-rendering.
      el.dataset.src = el.textContent || "";
      return;
    }

    // Restore source (Mermaid replaces the element with SVG after first render)
    el.textContent = el.dataset.src;
    el.removeAttribute("data-processed");
  }

  function initMermaid() {
    const mermaid = window.mermaid;
    if (!mermaid) return;

    const cssVar = window.__ccCssVar || ((_, fb) => fb);
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";

    // Use theme=base so we can align with our CSS variables.
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "base",
      themeVariables: {
        fontFamily: "ui-sans-serif, system-ui",
        background: "transparent",

        primaryColor: cssVar("--panel", isDark ? "rgba(16, 26, 51, 0.92)" : "#ffffff"),
        primaryBorderColor: cssVar("--border", isDark ? "rgba(232, 238, 252, 0.12)" : "#dee2e6"),
        primaryTextColor: cssVar("--text", isDark ? "#e8eefc" : "#212529"),

        secondaryColor: cssVar("--panel2", isDark ? "rgba(15, 23, 48, 0.70)" : "#f1f3f5"),
        secondaryBorderColor: cssVar("--border", isDark ? "rgba(232, 238, 252, 0.12)" : "#dee2e6"),
        secondaryTextColor: cssVar("--text", isDark ? "#e8eefc" : "#212529"),

        lineColor: cssVar("--border", isDark ? "rgba(232, 238, 252, 0.22)" : "#dee2e6"),
        textColor: cssVar("--text", isDark ? "#e8eefc" : "#212529"),
        tertiaryColor: cssVar("--bg", isDark ? "#0b1220" : "#f8f9fa"),
        noteBkgColor: cssVar("--bg", isDark ? "#0b1220" : "#f8f9fa"),
        noteTextColor: cssVar("--muted", isDark ? "rgba(232, 238, 252, 0.74)" : "#6c757d"),
      },
      flowchart: { curve: "basis" },
      sequence: { actorMargin: 24, showSequenceNumbers: false },
    });

    const els = Array.from(document.querySelectorAll(".mermaid"));
    els.forEach(ensureMermaidSource);

    // Render diagrams
    try {
      if (typeof mermaid.run === "function") {
        mermaid.run({ querySelector: ".mermaid" });
      } else if (typeof mermaid.init === "function") {
        // Fallback for older builds
        mermaid.init(undefined, els);
      }
    } catch (e) {
      // Keep report usable even if Mermaid fails.
      // eslint-disable-next-line no-console
      console.warn("Mermaid render failed", e);
    }
  }

  // Expose for theme toggles
  window.__ccRedrawMermaid = initMermaid;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMermaid);
  } else {
    initMermaid();
  }
})();

(function () {
  // Minimal canvas chart: CAPEX vs OPEX
  const data = {
    labels: ["Hybrid", "Cloud-only", "No US Agents"],
    capex: [75000, 15000, 15000],
    opexMonthly: [3500, 2600, 2500],
  };

  const canvas = document.getElementById("costChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function setupHiDpi() {
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.round(rect.width || 900));
    const cssHeight = Math.max(1, Math.round(rect.height || 240));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    return { w: cssWidth, h: cssHeight };
  }

  function roundRect(c, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    c.moveTo(x + radius, y);
    c.arcTo(x + w, y, x + w, y + h, radius);
    c.arcTo(x + w, y + h, x, y + h, radius);
    c.arcTo(x, y + h, x, y, radius);
    c.arcTo(x, y, x + w, y, radius);
    c.closePath();
  }

  function fmtMoney(n) {
    if (n >= 1000) return "$" + Math.round(n / 1000) + "k";
    return "$" + n;
  }

  function draw() {
    const { w, h } = setupHiDpi();
    ctx.clearRect(0, 0, w, h);

    // styling
    const cssVar = window.__ccCssVar || ((_, fb) => fb);
    const grid = cssVar("--chartGrid", "rgba(0,0,0,0.1)");
    const text = cssVar("--chartText", "#333");
    const muted = cssVar("--chartMuted", "#666");
    const capexColor = cssVar("--chartA", "#0d6efd");
    const opexColor = cssVar("--chartB", "#198754");

    const padL = 54;
    const padR = 18;
    const padT = 18;
    const padB = 38;

    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Two scales: CAPEX (top) and OPEX (bottom) are very different magnitudes.
    // We'll normalize each to its own max and draw grouped bars on same plot.
    const maxCapex = Math.max(...data.capex);
    const maxOpex = Math.max(...data.opexMonthly);

    // axes + light grid
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, h - padB);
    ctx.lineTo(w - padR, h - padB);
    ctx.stroke();

    // title
    ctx.fillStyle = text;
    ctx.font = "700 12px ui-sans-serif, system-ui";
    ctx.fillText("CAPEX vs OPEX/month (normalized)", padL, 14);

    // legend
    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.fillStyle = capexColor;
    ctx.fillRect(w - 182, 6, 10, 10);
    ctx.fillStyle = muted;
    ctx.fillText("CAPEX", w - 168, 15);
    ctx.fillStyle = opexColor;
    ctx.fillRect(w - 112, 6, 10, 10);
    ctx.fillStyle = muted;
    ctx.fillText("OPEX/mo", w - 98, 15);

    const n = data.labels.length;
    const slot = plotW / n;
    const barW = Math.min(48, slot * 0.28);
    const gap = Math.min(14, slot * 0.10);

    for (let i = 0; i < n; i++) {
      const x0 = padL + i * slot + (slot - (barW * 2 + gap)) / 2;

      const capexH = plotH * (data.capex[i] / maxCapex);
      const opexH = plotH * (data.opexMonthly[i] / maxOpex);

      // CAPEX bar (rounded)
      ctx.fillStyle = capexColor;
      roundRect(ctx, x0, h - padB - capexH, barW, capexH, 10);
      ctx.fill();

      // OPEX bar (rounded)
      ctx.fillStyle = opexColor;
      roundRect(ctx, x0 + barW + gap, h - padB - opexH, barW, opexH, 10);
      ctx.fill();

      // labels
      ctx.fillStyle = muted;
      ctx.font = "600 12px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(data.labels[i], padL + i * slot + slot / 2, h - 12);

      // value annotations
      ctx.fillStyle = text;
      ctx.font = "600 12px ui-sans-serif, system-ui";
      ctx.textAlign = "left";
      ctx.fillText(
        fmtMoney(data.capex[i]),
        x0 - 2,
        h - padB - capexH - 6
      );
      ctx.fillText(
        fmtMoney(data.opexMonthly[i]),
        x0 + barW + gap - 2,
        h - padB - opexH - 6
      );
    }

    // scale notes
    ctx.fillStyle = muted;
    ctx.font = "11px ui-sans-serif, system-ui";
    ctx.fillText(
      "Note: bars are normalized per-metric for visual comparison.",
      padL,
      h - padB + 18
    );
  }

  draw();

  // More reliable than window resize (handles layout/sidebar changes too)
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
  } else {
    window.addEventListener("resize", draw);
  }

  window.__ccRedrawCostChart = draw;
})();

(function () {
  // Capacity split chart: agents -> concurrent calls -> channels with headroom
  const model = {
    usAgents: 0,
    dxbAgents: 10,
    concurrency: 0.35,
    headroom: 1.3,
    plannedChannels: 6,
  };

  const canvas = document.getElementById("capacityChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function setupHiDpi() {
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.round(rect.width || 900));
    const cssHeight = Math.max(1, Math.round(rect.height || 360));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    return { w: cssWidth, h: cssHeight };
  }

  function roundRect(c, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    c.moveTo(x + radius, y);
    c.arcTo(x + w, y, x + w, y + h, radius);
    c.arcTo(x + w, y + h, x, y + h, radius);
    c.arcTo(x, y + h, x, y, radius);
    c.arcTo(x, y, x + w, y, radius);
    c.closePath();
  }

  const concurrencyFactor = document.getElementById("concurrencyFactor");
  const headroomFactor = document.getElementById("headroomFactor");
  const concurrencyLabel = document.getElementById("concurrencyLabel");
  const headroomLabel = document.getElementById("headroomLabel");
  const kpiConcurrency = document.getElementById("kpiConcurrency");
  const kpiHeadroom = document.getElementById("kpiHeadroom");
  const kpiChannels = document.getElementById("kpiChannels");

  function draw() {
    const { w, h } = setupHiDpi();
    ctx.clearRect(0, 0, w, h);

    const cssVar = window.__ccCssVar || ((_, fb) => fb);
    const grid = cssVar("--chartGrid", "rgba(0,0,0,0.1)");
    const text = cssVar("--chartText", "#333");
    const muted = cssVar("--chartMuted", "#666");
    const a = cssVar("--chartA", "#0d6efd");
    const b = cssVar("--chartB", "#198754");
    const c = cssVar("--chartC", "#ffc107");

    const padL = 58;
    const padR = 18;
    const padT = 20;
    const padB = 42;

    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const concurrent =
      Math.ceil(model.dxbAgents * model.concurrency) +
      Math.ceil(model.usAgents * model.concurrency);
    const required = Math.ceil(concurrent * model.headroom);
    model.plannedChannels = required;

    // update KPI text
    if (kpiConcurrency) kpiConcurrency.textContent = model.concurrency.toFixed(2);
    if (kpiHeadroom) kpiHeadroom.textContent = model.headroom.toFixed(2);
    if (kpiChannels) kpiChannels.textContent = String(required);

    // axis + grid
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, h - padB);
    ctx.lineTo(w - padR, h - padB);
    ctx.stroke();

    // title
    ctx.fillStyle = text;
    ctx.font = "700 12px ui-sans-serif, system-ui";
    ctx.fillText("Sizing steps (Dubai-led operations)", padL, 14);

    const steps = [
      { label: "Agents", value: model.usAgents + model.dxbAgents, color: a },
      { label: "Concurrent calls", value: concurrent, color: b },
      { label: "Channels w/ headroom", value: required, color: c },
    ];

    const maxV = Math.max(...steps.map((s) => s.value), model.plannedChannels);
    const barW = Math.min(86, plotW / 5.5);
    const gap = Math.min(28, (plotW - barW * steps.length) / (steps.length + 1));

    steps.forEach((s, i) => {
      const x = padL + gap + i * (barW + gap);
      const bh = plotH * (s.value / maxV);
      ctx.fillStyle = s.color;
      roundRect(ctx, x, h - padB - bh, barW, bh, 12);
      ctx.fill();
      ctx.fillStyle = muted;
      ctx.font = "12px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(s.label, x + barW / 2, h - 12);
      ctx.fillStyle = text;
      ctx.font = "600 12px ui-sans-serif, system-ui";
      ctx.textAlign = "left";
      ctx.fillText(String(s.value), x + 8, h - padB - bh - 10);
    });

    // planned line
    const yPlanned = h - padB - plotH * (model.plannedChannels / maxV);
    ctx.strokeStyle = (window.__ccCssVar && window.__ccCssVar("--chartStroke", "#ccc")) || "#ccc";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(padL, yPlanned);
    ctx.lineTo(w - padR, yPlanned);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = muted;
    ctx.font = "11px ui-sans-serif, system-ui";
    ctx.fillText("Planned channels: " + model.plannedChannels, padL + 6, yPlanned - 6);
  }

  function syncAndRedraw() {
    model.concurrency = Number(concurrencyFactor.value);
    model.headroom = Number(headroomFactor.value);
    concurrencyLabel.textContent = model.concurrency.toFixed(2);
    headroomLabel.textContent = model.headroom.toFixed(2);
    draw();
  }

  if (concurrencyFactor) concurrencyFactor.addEventListener("input", syncAndRedraw);
  if (headroomFactor) headroomFactor.addEventListener("input", syncAndRedraw);

  syncAndRedraw();

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => syncAndRedraw());
    ro.observe(canvas);
  } else {
    window.addEventListener("resize", syncAndRedraw);
  }

  window.__ccRedrawCapacityChart = draw;
})();

(function () {
  // Cost sensitivity widget
  const seatCount = document.getElementById("seatCount");
  const seatCountLabel = document.getElementById("seatCountLabel");
  const seatPrice = document.getElementById("seatPrice");
  const infraPreset = document.getElementById("infraPreset");
  const estCloud = document.getElementById("estCloud");
  const estNoUs = document.getElementById("estNoUs");
  const breakdownChart = document.getElementById("breakdownChart");
  if (!breakdownChart) return;
  const bctx = breakdownChart.getContext("2d");

  // Planning placeholders. Adjust for your real numbers/minutes/retention.
  const fixedNumbers = 120; // toll-free + a handful of DIDs (rental only)

  function setupHiDpi(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.round(rect.width || 900));
    const cssHeight = Math.max(1, Math.round(rect.height || 280));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    return { w: cssWidth, h: cssHeight };
  }

  function drawBreakdown(parts) {
    const { w, h } = setupHiDpi(breakdownChart, bctx);
    bctx.clearRect(0, 0, w, h);

    const cssVar = window.__ccCssVar || ((_, fb) => fb);
    const grid = cssVar("--chartGrid", "rgba(0,0,0,0.1)");
    const text = cssVar("--chartText", "#333");
    const muted = cssVar("--chartMuted", "#666");
    const cSeats = cssVar("--chartA", "#0d6efd");
    const cFixed = cssVar("--chartC", "#ffc107");
    const cInfra = cssVar("--chartB", "#198754");

    const padL = 54;
    const padR = 16;
    const padT = 18;
    const padB = 34;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const total = parts.seats + parts.fixed + parts.infra;
    const maxV = Math.max(total, 1);

    // axes
    bctx.strokeStyle = grid;
    bctx.lineWidth = 1;
    bctx.beginPath();
    bctx.moveTo(padL, padT);
    bctx.lineTo(padL, h - padB);
    bctx.lineTo(w - padR, h - padB);
    bctx.stroke();

    // title
    bctx.fillStyle = text;
    bctx.font = "600 12px ui-sans-serif, system-ui";
    bctx.fillText("Monthly OPEX breakdown (estimated)", padL, 14);

    // stacked bar
    const barX = padL + 10;
    const barY = padT + 26;
    const barH = Math.min(44, plotH - 40);
    const barW = plotW - 20;

    const wSeats = barW * (parts.seats / maxV);
    const wFixed = barW * (parts.fixed / maxV);
    const wInfra = barW * (parts.infra / maxV);

    bctx.fillStyle = cSeats;
    bctx.fillRect(barX, barY, wSeats, barH);
    bctx.fillStyle = cFixed;
    bctx.fillRect(barX + wSeats, barY, wFixed, barH);
    bctx.fillStyle = cInfra;
    bctx.fillRect(barX + wSeats + wFixed, barY, wInfra, barH);

    // legend
    const legendY = barY + barH + 20;
    bctx.font = "12px ui-sans-serif, system-ui";
    bctx.fillStyle = cSeats;
    bctx.fillRect(barX, legendY - 10, 10, 10);
    bctx.fillStyle = muted;
    bctx.fillText("Seats", barX + 14, legendY);

    bctx.fillStyle = cFixed;
    bctx.fillRect(barX + 90, legendY - 10, 10, 10);
    bctx.fillStyle = muted;
    bctx.fillText("Numbers (fixed)", barX + 104, legendY);

    bctx.fillStyle = cInfra;
    bctx.fillRect(barX + 230, legendY - 10, 10, 10);
    bctx.fillStyle = muted;
    bctx.fillText("Infra overhead", barX + 244, legendY);

    // value labels
    function fmt(n) {
      return "$" + Math.round(n).toLocaleString();
    }
    bctx.fillStyle = text;
    bctx.font = "600 12px ui-sans-serif, system-ui";
    bctx.fillText("Total: " + fmt(total), barX, legendY + 22);
    bctx.fillStyle = muted;
    bctx.font = "12px ui-sans-serif, system-ui";
    bctx.fillText(
      "Seats: " + fmt(parts.seats) + " • Numbers: " + fmt(parts.fixed) + " • Infra: " + fmt(parts.infra),
      barX,
      legendY + 40
    );
  }

  function fmt(n) {
    return "$" + Math.round(n).toLocaleString();
  }

  function recalc() {
    const seats = Number(seatCount.value);
    const perSeat = Number(seatPrice.value);
    const infra = Number(infraPreset.value);
    seatCountLabel.textContent = String(seats);

    const seatsCost = seats * perSeat;
    const base = seatsCost + fixedNumbers + infra;

    // For this report, No-US-Agents is essentially the same SaaS footprint.
    // We show it separately because ops are centered in Dubai.
    estCloud.textContent = fmt(base);
    estNoUs.textContent = fmt(base);

    drawBreakdown({ seats: seatsCost, fixed: fixedNumbers, infra });
  }

  if (seatCount) seatCount.addEventListener("input", recalc);
  if (seatPrice) seatPrice.addEventListener("input", recalc);
  if (infraPreset) infraPreset.addEventListener("change", recalc);
  recalc();

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => recalc());
    ro.observe(breakdownChart);
  } else {
    window.addEventListener("resize", recalc);
  }

  window.__ccRedrawOpexChart = recalc;
})();

// Global redraw hook (used by theme toggle)
window.__ccRedrawAllCharts = function () {
  try {
    window.__ccRedrawCostChart && window.__ccRedrawCostChart();
  } catch (_) {}
  try {
    window.__ccRedrawCapacityChart && window.__ccRedrawCapacityChart();
  } catch (_) {}
  try {
    window.__ccRedrawOpexChart && window.__ccRedrawOpexChart();
  } catch (_) {}
  try {
    window.__ccRedrawMermaid && window.__ccRedrawMermaid();
  } catch (_) {}
};
