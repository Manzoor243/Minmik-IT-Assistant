// ============================================================
//  MinMik IT AI Assistant — app.js
//  Stable Production Version
// ============================================================

const SYSTEM_PROMPT = `You are MinMik AI, an expert IT Support Engineer working for minmik.com. You specialize in providing detailed, structured troubleshooting guidance for IT professionals at L1, L2, and L3 support levels.

## YOUR ROLE
You are knowledgeable in Networking, Windows/AD, Linux, macOS, Cloud (M365/Azure), and Security.

## RESPONSE FORMAT
1. Identify issue level: [L1], [L2], or [L3]
2. Quick Summary
3. Numbered troubleshooting steps
4. Escalation guidance
5. Prevention tips`;

// ===== STATE VARIABLES =====
let chatHistory = [];
let isGenerating = false;

// ===== QUICK TOPICS =====
const TOPICS = [
  { icon: "🌐", title: "DNS Resolution Failure", level: "L1–L2", prompt: "Users cannot resolve DNS. How do I troubleshoot DNS resolution failures on Windows?" },
  { icon: "🔒", title: "User Locked Out of AD", level: "L1", prompt: "A user is locked out of their Active Directory account. Walk me through the unlock process." },
  { icon: "📡", title: "VPN Not Connecting", level: "L2", prompt: "User cannot connect to the corporate VPN after a Windows update. Provide troubleshooting." },
  { icon: "💻", title: "Blue Screen of Death", level: "L2–L3", prompt: "A Windows workstation is getting a BSOD. How do I diagnose it using Event Viewer?" }
];

// ===== SEND MESSAGE FUNCTION =====
async function sendMessage(text = null) {
  const userInput = document.getElementById('userInput');
  const message = text || userInput.value.trim();
  
  if (!message || isGenerating) return;

  isGenerating = true;
  renderMessage('user', escapeHTMLBasic(message));
  if (userInput) userInput.value = '';

  const typingId = showTyping();
  
  try {
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: SYSTEM_PROMPT,
        messages: [...chatHistory, { role: 'user', content: message }]
      })
    });

    if (!response.ok) throw new Error('API connection failed');

    const data = await response.json();
    const aiResponse = data.content[0].text;

    // Update History
    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'assistant', content: aiResponse });
    
    removeTyping(typingId);
    renderMessage('ai', parseMarkdown(aiResponse));

  } catch (error) {
    console.error('Error:', error);
    removeTyping(typingId);
    renderMessage('ai', `<span style="color: var(--red)">Error: ${error.message}</span>`);
  } finally {
    isGenerating = false;
  }
}

// ===== UI HELPERS (Terminal & Topics) =====
function initTerminal() {
  const container = document.getElementById('heroTerminal');
  if (!container) return;
  const lines = [
    { type: 'ok', text: '[OK] L1-L3 Modules Loaded' },
    { type: 'ok', text: '[OK] Connecting to Claude AI...' },
    { type: 'warn', text: '[!] System Ready for Queries.' }
  ];
  lines.forEach((line, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 't-line';
      div.innerHTML = `<span class="t-${line.type}">${line.text}</span>`;
      container.appendChild(div);
    }, i * 200);
  });
}

function initTopics() {
  const grid = document.getElementById('topicsGrid');
  if (!grid) return;
  TOPICS.forEach(topic => {
    const card = document.createElement('div');
    card.className = 'topic-card';
    card.innerHTML = `<div class="topic-icon">${topic.icon}</div><div><div class="topic-title">${topic.title}</div><div class="topic-level">${topic.level}</div></div>`;
    card.addEventListener('click', () => sendMessage(topic.prompt));
    grid.appendChild(card);
  });
}

function initChat() {
  renderMessage('ai', parseMarkdown("### 👋 Welcome to MinMik IT Assistant\nHow can I help you troubleshoot today?"));
}

// ===== CORE UI RENDERING =====
function renderMessage(role, htmlContent) {
  const messages = document.getElementById('chatMessages');
  if (!messages) return;
  const wrapper = document.createElement('div');
  wrapper.className = `msg ${role === 'ai' ? 'ai' : 'user'}`;
  wrapper.innerHTML = `<div class="msg-bubble">${htmlContent}</div>`;
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const id = 'typing-' + Date.now();
  renderMessage('ai', `<div id="${id}" class="typing-indicator"><span>.</span><span>.</span><span>.</span></div>`);
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.closest('.msg').remove();
}

function parseMarkdown(text) {
  let html = escapeHTMLBasic(text);
  html = html.replace(/### (.+)/g, '<h3>$1</h3>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function escapeHTMLBasic(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

document.addEventListener('DOMContentLoaded', () => {
  initTerminal();
  initTopics();
  initChat();
});
