/**
 * Professional Email Templates for Job Applications
 * Muhammed Fasil PV - Dubai Job Search
 */

const { profile } = require('./job-search-agent');

// Template 1: General Application Email
const generalApplicationEmail = (companyName, position, jobUrl) => `
Subject: Application for ${position} - Muhammed Fasil PV

Dear Hiring Manager,

I am writing to express my strong interest in the ${position} role at ${companyName}. With over 13 years of experience in software engineering, specializing in AI-driven automation, IoT ecosystems, and enterprise system architecture, I am confident in my ability to contribute significantly to your team.

Currently based in Dubai, I am working as a Software Engineer at Idol Technology LLC, where I architect intelligent retail systems integrating AI vision, IoT automation, and hybrid cloud infrastructures. My expertise spans:

• AI & Machine Learning: OpenAI, LangChain, YOLO vision systems, TensorFlow
• Full-Stack Development: Flutter (MVVM), Node.js, Python, .NET (WPF)
• IoT & Edge Systems: ESP32, Raspberry Pi, MQTT brokers, embedded systems
• DevOps & Cloud: Docker, GitHub Actions, AWS, Azure, GCP
• Network Engineering: MikroTik RouterOS, WireGuard VPN, secure mesh networks

Key achievements include:
✓ Architected IdolMEA ERP integrating POS, QMS, and AI-powered theft detection
✓ Designed WireGuard VPN mesh network for secure multi-branch communication
✓ Built AI self-checkout kiosks with real-time vision detection and edge computing
✓ Developed hybrid offline-first sync engines for enterprise continuity

I am particularly drawn to ${companyName} because of your innovative approach and commitment to technological excellence. I believe my experience in building scalable, AI-driven systems aligns perfectly with your requirements.

I would welcome the opportunity to discuss how my skills and experience can contribute to your team's success. My resume is attached for your review, and I am available for an interview at your convenience.

Thank you for considering my application.

Best regards,
Muhammed Fasil PV
+971 555923545
faztrick@gmail.com
https://faztrick.com
LinkedIn: linkedin.com/in/faztrick
`.trim();

// Template 2: Referral/Connection Email
const referralEmail = (contactName, companyName, position) => `
Subject: Introduction & Interest in ${position} at ${companyName}

Dear ${contactName},

I hope this message finds you well. I noticed the opening for ${position} at ${companyName} and wanted to reach out as I believe my background aligns well with the role.

I'm Muhammed Fasil, a Software Engineer with 13+ years of experience specializing in:
• AI/ML integration (OpenAI, LangChain, YOLO, TensorFlow)
• Enterprise system architecture (ERP, POS, QMS)
• IoT & edge computing solutions
• Full-stack development (Flutter, Node.js, Python, .NET)

Currently at Idol Technology LLC in Dubai, I've architected AI-driven retail systems that combine computer vision, IoT automation, and secure VPN mesh networks. Notable projects include:
- AI self-checkout kiosks with real-time theft detection
- Multi-branch ERP with hybrid cloud-local sync
- WireGuard-based secure network infrastructure across 8+ nodes

I'm excited about ${companyName}'s work and would appreciate any insights you could share about the team and role. If appropriate, I'd be grateful for an introduction to the hiring manager.

I've attached my resume and would be happy to discuss further at your convenience.

Thank you for your time and consideration.

Best regards,
Muhammed Fasil PV
+971 555923545 | faztrick@gmail.com
https://faztrick.com
`.trim();

// Template 3: Follow-up Email
const followUpEmail = (companyName, position, daysSinceApplication) => `
Subject: Following Up - ${position} Application

Dear Hiring Team,

I hope this email finds you well. I submitted my application for the ${position} role at ${companyName} ${daysSinceApplication} days ago and wanted to follow up on its status.

I remain very interested in this opportunity and believe my experience in AI-driven systems, IoT architecture, and enterprise software development would be a strong fit for your team.

Key highlights of my experience:
• 13+ years in software engineering with AI/ML and IoT expertise
• Currently architecting retail automation systems at Idol Technology LLC, Dubai
• Proven track record with Flutter, Node.js, Python, and cloud infrastructure
• Experience building production-grade AI vision systems and edge computing solutions

I would welcome the opportunity to discuss how I can contribute to ${companyName}'s success. Please let me know if you need any additional information or if there's a convenient time for a conversation.

Thank you for your consideration.

Best regards,
Muhammed Fasil PV
+971 555923545
faztrick@gmail.com
`.trim();

// Template 4: LinkedIn InMail / Recruiter Outreach
const recruiterOutreach = (recruiterName, position) => `
Subject: Experienced Software Engineer | AI & IoT Specialist | Dubai-based

Hi ${recruiterName},

I came across the ${position} opportunity and wanted to reach out directly. As a Dubai-based Software Engineer with 13+ years of experience, I specialize in building intelligent, scalable systems at the intersection of AI, IoT, and enterprise software.

Quick snapshot:
✓ Currently: Software Engineer at Idol Technology LLC, Dubai
✓ Expertise: Flutter (MVVM), Node.js, AI/ML, IoT, Python, .NET
✓ Projects: AI retail systems, self-checkout kiosks, VPN mesh networks
✓ Stack: OpenAI, LangChain, YOLO, Docker, MikroTik, ESP32, AWS/Azure

I've built end-to-end solutions including:
- AI-powered self-checkout with computer vision
- Multi-branch ERP with hybrid sync engines
- Secure WireGuard VPN networks
- WhatsApp/Telegram automation bots

I'm open to discussing roles in AI engineering, software architecture, IoT solutions, or technical leadership. Happy to share my portfolio and dive deeper into how I can add value.

Available for a call this week if you'd like to connect.

Best,
Fasil
+971 555923545 | faztrick@gmail.com
Portfolio: faztrick.com
`.trim();

// Template 5: Direct CEO/CTO Outreach
const executiveOutreach = (executiveName, title, companyName) => `
Subject: Building AI-Driven Systems in Dubai - Exploring Opportunities

Dear ${executiveName},

I hope this message finds you well. I'm reaching out as a software engineer passionate about building intelligent, scalable systems, and I've been following ${companyName}'s impressive work in the industry.

With 13+ years of experience architecting AI-driven enterprise solutions, I specialize in:
• AI/ML Systems: LangChain, OpenAI, YOLO vision, edge computing
• IoT Architecture: ESP32, MQTT, embedded systems, retail automation
• Full-Stack Engineering: Flutter, Node.js, Python, .NET, microservices
• Infrastructure: Docker, WireGuard VPN, MikroTik, cloud platforms

At Idol Technology LLC, I've built production systems that bridge AI, IoT, and enterprise software - including self-checkout kiosks with computer vision, multi-branch VPN mesh networks, and hybrid ERP platforms serving retail operations.

I'm particularly interested in ${companyName}'s approach to [specific technology/product], and I believe my experience in building production-ready, AI-driven systems could align with your technical goals.

If you're open to it, I'd love to explore how my expertise might contribute to your team's vision. I've attached my resume and portfolio for reference.

Thank you for your time and consideration.

Best regards,
Muhammed Fasil PV
Software Engineer | AI & IoT Systems Engineer
+971 555923545 | faztrick@gmail.com
https://faztrick.com | linkedin.com/in/faztrick
`.trim();

// Template 6: Thank You Email (Post-Interview)
const thankYouEmail = (interviewerName, companyName, position, specificTopic) => `
Subject: Thank You - ${position} Interview

Dear ${interviewerName},

Thank you for taking the time to meet with me today to discuss the ${position} role at ${companyName}. I truly enjoyed our conversation, particularly our discussion about ${specificTopic}.

Our discussion reinforced my enthusiasm for this opportunity. The challenges you described around [specific challenge mentioned] align perfectly with my experience in building AI-driven systems and IoT infrastructure. I'm excited about the possibility of contributing to ${companyName}'s innovative work.

I believe my experience with:
• AI/ML integration and edge computing
• Scalable microservices architecture
• IoT system design and automation
• Cross-functional team leadership

...would enable me to make immediate contributions to your team's goals.

Please don't hesitate to reach out if you need any additional information or references. I look forward to hearing about the next steps in the process.

Thank you again for your time and consideration.

Best regards,
Muhammed Fasil PV
+971 555923545
faztrick@gmail.com
`.trim();

// Email Generator Function
function generateEmail(type, params) {
  switch(type) {
    case 'general':
      return generalApplicationEmail(params.company, params.position, params.jobUrl);
    case 'referral':
      return referralEmail(params.contactName, params.company, params.position);
    case 'followup':
      return followUpEmail(params.company, params.position, params.days);
    case 'recruiter':
      return recruiterOutreach(params.recruiterName, params.position);
    case 'executive':
      return executiveOutreach(params.executiveName, params.title, params.company);
    case 'thankyou':
      return thankYouEmail(params.interviewerName, params.company, params.position, params.topic);
    default:
      return "Invalid email type";
  }
}

// Example Usage
console.log("=== Email Template Generator Ready ===\n");
console.log("Available Templates:");
console.log("1. general - General job application");
console.log("2. referral - Referral/Connection request");
console.log("3. followup - Application follow-up");
console.log("4. recruiter - LinkedIn recruiter outreach");
console.log("5. executive - Direct CEO/CTO outreach");
console.log("6. thankyou - Post-interview thank you\n");

// Example: Generate a general application email
const exampleEmail = generateEmail('general', {
  company: 'Careem',
  position: 'Senior Software Engineer - AI',
  jobUrl: 'https://careers.careem.com/job/123'
});

console.log("Example Email:\n");
console.log(exampleEmail);

module.exports = {
  generateEmail,
  templates: {
    generalApplicationEmail,
    referralEmail,
    followUpEmail,
    recruiterOutreach,
    executiveOutreach,
    thankYouEmail
  }
};
