// ============================================================
//  MinMik IT AI Assistant — app.js
//  Powered by Anthropic Claude API
// ============================================================

const SYSTEM_PROMPT = `You are MinMik AI, an expert IT Support Engineer working for minmik.com. You specialize in providing detailed, structured troubleshooting guidance for IT professionals at L1, L2, and L3 support levels.

## YOUR ROLE
You are knowledgeable in:
- **Networking**: TCP/IP, DNS, DHCP, VPN, firewalls, routing, switching, Wi-Fi, VLANs
- **Windows**: Active Directory, Group Policy, Registry, Event Viewer, PowerShell, SCCM, Intune
- **Linux/Unix**: Ubuntu, RHEL, CentOS, Debian, systemd, bash scripting, kernel issues
- **macOS**: Preferences, profiles, MDM (Jamf), Time Machine, Recovery
- **Cloud**: Azure AD, AWS, Microsoft 365, Exchange Online, Teams, SharePoint
- **Hardware**: Servers, workstations, printers, storage, RAID
- **Security**: Antivirus, endpoint protection, certificates, MFA, SIEM alerts
- **Virtualization**: VMware, Hyper-V, VirtualBox
- **Databases**: SQL Server, MySQL, basic DBA support
- **Applications**: Office 365, SAP, common LOB applications

## RESPONSE FORMAT
Always structure your responses clearly using this approach:

1. **Identify the issue level** at the top: [L1 - Basic], [L2 - Intermediate], or [L3 - Advanced/Escalation]
2. **Quick Summary**: 1-2 sentences describing the likely root cause
3. **Numbered troubleshooting steps** — be specific and actionable, include exact commands, registry paths, PowerShell scripts, or CLI commands where applicable
4. **Escalation guidance**: Tell the engineer when to escalate to next tier
5. **Prevention tips**: Brief note on how to prevent recurrence

## FORMATTING RULES
- Use **bold** for important terms, commands, or file paths
- Use \`code formatting\` for commands, registry keys, file paths
- Use numbered lists for sequential steps
- Start sections with ### for headers
- Be precise and professional — your audience are trained IT engineers, not end users
- Include actual commands (PowerShell, CMD, bash, etc.) whenever helpful
- For Windows commands, specify if they need admin/elevated privileges

## TONE
- Professional and technical
- Direct and efficient — engineers want solutions, not fluff
- Include caveats for risky operations (e.g., registry edits, disk operations)
- Always note if a step requires downtime or production impact`;

// ===== QUICK TOPICS =====
const TOPICS = [
  { icon: "🌐", title: "DNS Resolution Failure", level: "L1–L2", prompt: "Users cannot resolve DNS. How do I troubleshoot DNS resolution failures on Windows and check DNS server health?" },
  { icon: "🔒", title: "User Locked Out of AD", level: "L1", prompt: "A user is locked out of their Active Directory account. Walk me through the full troubleshooting and unlock process." },
  { icon: "📡", title: "VPN Not Connecting", level: "L2", prompt: "User cannot connect to the corporate VPN after a Windows update. Provide step-by-step troubleshooting." },
  { icon: "💻", title: "Blue Screen of Death", level: "L2–L3", prompt: "A Windows workstation is getting a BSOD (Blue Screen of Death). How do I diagnose and resolve it using minidumps and Event Viewer?" },
  { icon: "📧", title: "Email Not Sending", level: "L1–L2", prompt: "Users in Microsoft 365 / Exchange Online are unable to send or receive email. Walk me through the troubleshooting steps." },
  { icon: "🖨️", title: "Printer Offline", level: "L1", prompt: "A network printer shows as Offline. What are the step-by-step troubleshooting steps to get it back online?" },
  { icon: "☁️", title: "Azure AD Sync Issues", level: "L2–L3", prompt: "Azure AD Connect is not syncing users from on-prem Active Directory. How do I diagnose and fix the sync errors?" },
  { icon: "🚨", title: "High CPU / Memory", level: "L2", prompt: "A Windows server is showing high CPU and memory usage. Walk me through diagnosing the root cause and resolving it." },
  { icon: "🛡️", title: "Malware Infection", level: "L2–L3", prompt: "A workstation has a suspected malware infection. What is the proper incident response and remediation procedure?" },
  { icon: "💾", title: "Disk Space Critical", level: "L1–L2", prompt: "A Windows server or workstation is critically low on disk space. How do I identify large files and safely free up space?" },
  { icon: "🔌", title: "Network Port Not Working", level: "L2", prompt: "A physical network port or switch port is not passing traffic. Walk me through switch-level and workstation-level diagnostics." },
  { icon: "⚙️", title: "Service Won't Start", level: "L2", prompt: "A critical Windows service fails to start. How do I diagnose the error from Event Viewer and get it running?" },
];

// ===== TERMINAL ANIMATION =====
const TERMINAL_LINES = [
  { type: 'prompt', text: '$ minmik-ai --init' },
  { type: 'out', text: 'Loading IT knowledge base...' },
  { type: 'ok', text: '[OK] L1 Support module loaded (4,231 articles)' },
  { type: 'ok', text: '[OK] L2 Support module loaded (2,847 articles)' },
  { type: 'ok', text: '[OK] L3 Support module loaded (1,903 articles)' },
  { type: 'out', text: 'Connecting to Claude AI engine...' },
  { type: 'ok', text: '[OK] AI engine ready' },
  { type: 'prompt', text: '$ minmik-ai --check-coverage' },
  { type: 'ok', text: '[✓] Networking & Infrastructure' },
  { type: 'ok', text: '[✓] Windows / Active Directory' },
  { type: 'ok', text: '[✓] Linux / macOS' },
  { type: 'ok', text: '[✓] Cloud (Azure / AWS / M365)' },
  { type: 'ok', text: '[✓] Security & Compliance' },
  { type: 'warn', text: '[!] Ready for queries. Type your issue below.' },
];

function initTerminal() {
  const container = document.getElementById('heroTerminal');
  if (!container) return;
  TERMINAL_LINES.forEach((line, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 't-line';
      div.style.animationDelay = '0ms';
      if (line.type === 'prompt') {
        div.innerHTML = `<span class="t-prompt">➜</span> <span class="t-cmd">${line.text.replace('$ ', '')}</span>`;
      } else if (line.type === 'ok') {
        div.innerHTML = `<span class="t-ok">${line.text}</span>`;
      } else if (line.type === 'warn') {
        div.innerHTML = `<span class="t-warn">${line.text}</span>`;
      } else {
        div.innerHTML = `<span class="t-out">${line.text}</span>`;
      }
      container.appendChild(div);
      if (i === TERMINAL_LINES.length - 1) {
        setTimeout(() => {
          const cursor = document.createElement('span');
          cursor.className = 't-cursor';
          container.appendChild(cursor);
        }, 300);
      }
    }, i * 180);
  });
}

// ===== QUICK TOPICS GRID =====
function initTopics() {
  const grid = document.getElementById('topicsGrid');
  if (!grid) return;
  TOPICS.forEach(topic => {
    const card = document.createElement('div');
    card.className = 'topic-card';
    card.innerHTML = `
      <div class="topic-icon">${topic.icon}</div>
      <div>
        <div class="topic-title">${topic.title}</div>
        <div class="topic-level">${topic.level}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      document.getElementById('chat-section').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        const input = document.getElementById('userInput');
        input.value = topic.prompt;
        autoResize(input);
        input.focus();
      }, 600);
    });
    grid.appendChild(card);
  });
}

// ===== CHAT STATE =====
let conversationHistory = [];
let isLoading = false;

// ===== WELCOME MESSAGE =====
function initChat() {
  const welcomeMsg = {
    role: 'assistant',
    content: `### 👋 Welcome to MinMik IT Assistant

I'm your AI-powered IT support engineer, covering **L1 to L3** troubleshooting across all major platforms and technologies.

I can help you with:
- 🔍 **Step-by-step diagnostics** with exact commands and scripts
- 🏷️ **Issue triage** — identify if it's L1, L2, or L3
- ⚡ **Escalation guidance** — know when and how to escalate
- 🛡️ **Security incidents** — malware, breaches, policy violations
- ☁️ **Cloud issues** — Azure, AWS, Microsoft 365

**How to get the best results:** Describe your issue with as much detail as possible — OS version, error messages, what changed recently, and what you've already tried.

What IT issue can I help you troubleshoot today?`
  };
  renderMessage('ai', parseMarkdown(welcomeMsg.content));
}

// ===== SEND MESSAGE =====
async function sendMessage() {
  const input = document.getElementById('userInput');
  const userText = input.value.trim();
  if (!userText || isLoading) return;

  input.value = '';
  autoResize(input);
  input.style.height = 'auto';

  renderMessage('user', escapeHTML(userText));
  conversationHistory.push({ role: 'user', content: userText });

  setLoading(true);
  const typingId = showTyping();

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: conversationHistory
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.content?.find(b => b.type === 'text')?.text || 'No response received.';

    removeTyping(typingId);
    conversationHistory.push({ role: 'assistant', content: aiText });
    renderMessage('ai', parseMarkdown(aiText));

  } catch (err) {
    removeTyping(typingId);
    renderMessage('ai', `<span style="color:var(--red)">⚠ Error: ${escapeHTML(err.message)}</span><br><br>
      Please check:<br>
      • Your Anthropic API key is configured correctly<br>
      • You have network access to api.anthropic.com<br>
      • Your API key has sufficient credits<br><br>
      <strong>Setup instructions:</strong> Open <code>app.js</code> and ensure your API key is passed through the fetch headers, or configure a proxy server.`);
  } finally {
    setLoading(false);
  }
}

// ===== RENDERING HELPERS =====
function renderMessage(role, htmlContent) {
  const messages = document.getElementById('chatMessages');
  const wrapper = document.createElement('div');
  wrapper.className = `msg ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.innerHTML = role === 'ai'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = htmlContent;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const messages = document.getElementById('chatMessages');
  const id = 'typing-' + Date.now();
  const wrapper = document.createElement('div');
  wrapper.className = 'msg ai';
  wrapper.id = id;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function setLoading(state) {
  isLoading = state;
  const btn = document.getElementById('sendBtn');
  const input = document.getElementById('userInput');
  btn.disabled = state;
  input.disabled = state;
}

function clearChat() {
  conversationHistory = [];
  document.getElementById('chatMessages').innerHTML = '';
  initChat();
}

// ===== MARKDOWN PARSER =====
// Lightweight markdown → HTML for AI responses
function parseMarkdown(text) {
  let html = escapeHTMLBasic(text);

  // Code blocks
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Level badges
  html = html.replace(/\[L1[^\]]*\]/g, '<span class="level-tag l1">L1</span>');
  html = html.replace(/\[L2[^\]]*\]/g, '<span class="level-tag l2">L2</span>');
  html = html.replace(/\[L3[^\]]*\]/g, '<span class="level-tag l3">L3</span>');

  // Numbered lists
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li><span class="step-badge">$1</span>$2</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, match => {
    if (!match.startsWith('<ul>') && !match.startsWith('<ol>')) return `<ol>${match}</ol>`;
    return match;
  });
  // Flatten consecutive ol tags
  html = html.replace(/<\/ol>\s*<ol>/g, '');

  // Bullet lists
  html = html.replace(/^[•\-] (.+)$/gm, '<li>$1</li>');
  // Wrap orphan li in ul
  html = html.replace(/(<li>(?!.*step-badge)[\s\S]*?<\/li>)/g, match => {
    return `<ul>${match}</ul>`;
  });
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Single newlines inside paragraphs
  html = html.replace(/(?<!>)\n(?!<)/g, '<br>');

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>\s*(<h[23]>)/g, '$1');
  html = html.replace(/(<\/h[23]>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<[ou]l>)/g, '$1');
  html = html.replace(/(<\/[ou]l>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<hr>)\s*<\/p>/g, '$1');

  return html;
}

function escapeHTMLBasic(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== INPUT HELPERS =====
function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initTerminal();
  initTopics();
  initChat();
});
