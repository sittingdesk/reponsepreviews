const overlay     = document.getElementById('modal-overlay');
const modal       = document.getElementById('modal');
const pageLanding = document.getElementById('page-landing');
const pageResults = document.getElementById('page-results');
const steps       = ['step-process', 'step-loading', 'step-preview'];

// ── Score state ──
const SCORE_INITIAL  = { overall: 74, resolution: 72, match: 68, knowledge: 90 };
const SCORE_IMPROVED = { overall: 81, resolution: 77, match: 75, knowledge: 96 };
let learningsApplied = false;
// Map UI iteration to internal suffix: iteration 1 → suffix 2, iteration 2 → suffix 3
const _iterParam = new URLSearchParams(window.location.search).get('iteration') || '1';
const _uiIteration = parseInt(_iterParam, 10);
let activeInboxIteration = _uiIteration === 2 ? 3 : 2;

// ══════════════════════════════════
//   INBOX FOLDER SIDEBAR
// ══════════════════════════════════
const ifsCollapsedState = { views: true }; // Views starts collapsed
let ifsSettingsMode = false;
const ifsHiddenItems = new Set();
let ifsActiveNavItem = document.getElementById('ifs-nav-assigned-me');

function inboxFolderToggle(key) {
  const body = document.getElementById('ifs-' + key + '-body');
  const caret = document.getElementById('ifs-' + key + '-caret');
  if (!body) return;
  ifsCollapsedState[key] = !ifsCollapsedState[key];
  body.classList.toggle('closed', ifsCollapsedState[key]);
  if (caret) caret.classList.toggle('closed', ifsCollapsedState[key]);
}

function inboxFolderToggleSettings() {
  ifsSettingsMode = !ifsSettingsMode;
  const sidebar = document.getElementById('inbox-folder-sidebar');
  sidebar.classList.toggle('ifs-settings-active', ifsSettingsMode);
  document.getElementById('ifs-settings-btn').classList.toggle('active', ifsSettingsMode);
}

function inboxFolderToggleItem(key, checked) {
  document.querySelectorAll('[data-ifs-item="' + key + '"]')
    .forEach(function(el) { el.classList.toggle('ifs-item-hidden', !checked); });
  var body = document.getElementById('ifs-' + key + '-body');
  if (body) body.classList.toggle('ifs-item-hidden', !checked);
  if (!checked) ifsHiddenItems.add(key); else ifsHiddenItems.delete(key);
}

function inboxFolderSelectNav(element, key) {
  if (ifsActiveNavItem) ifsActiveNavItem.classList.remove('active');
  element.classList.add('active');
  ifsActiveNavItem = element;
}

function showStep(id) {
  steps.forEach(s => { document.getElementById(s).hidden = (s !== id); });
  modal.classList.toggle('wide', id === 'step-preview');
}

function openModal() {
  learningsApplied = false;
  resetModal();
  showStep('step-process');
  overlay.hidden = false;
}

function closeModal() {
  overlay.hidden = true;
  modal.classList.remove('wide');
}

function resetModal() {
  // Reset apply button
  const applyBtn = document.getElementById('btn-apply');
  applyBtn.textContent = 'Apply — +7 pts projected';
  applyBtn.classList.remove('applied');
  applyBtn.disabled = false;

  // Reset learning items
  document.querySelectorAll('#learning-list li').forEach(li => li.classList.remove('applied'));

  // Reset connect buttons
  document.querySelectorAll('.btn-connect').forEach(btn => {
    btn.textContent = 'Connect';
    btn.classList.remove('connected');
  });

  // Reset score display to initial values
  setModalScore(SCORE_INITIAL);
}

// ── Score helpers ──
function setModalScore({ overall, resolution, match, knowledge }) {
  document.getElementById('modal-score').textContent = overall;
  document.getElementById('sub-resolution').textContent = resolution;
  document.getElementById('sub-match').textContent = match;
  document.getElementById('sub-knowledge').textContent = knowledge;
  setBar('sub-resolution', resolution);
  setBar('sub-match', match);
  setBar('sub-knowledge', knowledge);
}

function setBar(subId, value) {
  const fill = document.getElementById(subId)
    .closest('.breakdown-row')
    .querySelector('.breakdown-fill');
  if (fill) fill.style.width = value + '%';
}

function animateCounter(el, from, to, duration) {
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = Math.round(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Open modal ──
const btnStart = document.getElementById('btn-start');
if (btnStart) btnStart.addEventListener('click', openModal);
document.getElementById('btn-new').addEventListener('click', openModal);

// ── Step 1: Cancel ──
document.getElementById('btn-cancel').addEventListener('click', closeModal);

// ── Step 1: Submit → loading → preview ──
document.getElementById('btn-submit').addEventListener('click', () => {
  showStep('step-loading');
  const messages = ['Analyzing messages…', 'Comparing AI vs human responses…', 'Identifying improvement opportunities…'];
  let i = 0;
  const loadingText = document.getElementById('loading-text');
  loadingText.textContent = messages[0];
  const interval = setInterval(() => {
    i++;
    if (i < messages.length) loadingText.textContent = messages[i];
  }, 700);
  setTimeout(() => {
    clearInterval(interval);
    showStep('step-preview');
  }, 2200);
});

// ── Step 3: Apply learnings ──
document.getElementById('btn-apply').addEventListener('click', function () {
  if (this.classList.contains('applied')) return;
  this.textContent = 'Applying…';
  this.disabled = true;

  // Check off items one by one
  const items = [...document.querySelectorAll('#learning-list li')];
  items.forEach((li, i) => setTimeout(() => li.classList.add('applied'), i * 450));

  // After all checked off, animate scores
  const delay = items.length * 450 + 100;
  setTimeout(() => {
    animateCounter(document.getElementById('modal-score'),   SCORE_INITIAL.overall,    SCORE_IMPROVED.overall,    900);
    animateCounter(document.getElementById('sub-resolution'), SCORE_INITIAL.resolution, SCORE_IMPROVED.resolution, 900);
    animateCounter(document.getElementById('sub-match'),      SCORE_INITIAL.match,      SCORE_IMPROVED.match,      900);
    animateCounter(document.getElementById('sub-knowledge'),  SCORE_INITIAL.knowledge,  SCORE_IMPROVED.knowledge,  900);
    // Animate bars with a slight delay so counter starts first
    setTimeout(() => {
      setBar('sub-resolution', SCORE_IMPROVED.resolution);
      setBar('sub-match',      SCORE_IMPROVED.match);
      setBar('sub-knowledge',  SCORE_IMPROVED.knowledge);
    }, 150);
  }, delay);

  // Mark button as done after animation completes
  setTimeout(() => {
    this.textContent = 'Learnings applied ✓';
    this.classList.add('applied');
    learningsApplied = true;
  }, delay + 950);
});

// ── Tool connect buttons ──
document.querySelectorAll('.btn-connect').forEach(btn => {
  btn.addEventListener('click', function () {
    this.textContent = 'Connected ✓';
    this.classList.add('connected');
  });
});

// ── Step 3: Close / Confirm ──
document.getElementById('btn-close').addEventListener('click', closeModal);

document.getElementById('btn-confirm').addEventListener('click', () => {
  const score = learningsApplied ? SCORE_IMPROVED : SCORE_INITIAL;
  closeModal();
  pageLanding.hidden = true;
  pageResults.hidden = false;

  // Push score values to dashboard
  document.getElementById('dash-score').textContent      = score.overall;
  document.getElementById('dash-resolution').textContent = score.resolution;
  document.getElementById('dash-match').textContent      = score.match;
  document.getElementById('dash-knowledge').textContent  = score.knowledge;
});

// ── Close on overlay background click ──
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

// ── Channel multi-select ──
const channelSelect   = document.getElementById('channel-select');
const channelInput    = document.getElementById('channel-input');
const channelDropdown = document.getElementById('channel-dropdown');
const placeholder     = document.getElementById('channel-placeholder');
const selected        = new Set();

channelInput.addEventListener('click', () => {
  const isOpen = !channelDropdown.hidden;
  channelDropdown.hidden = isOpen;
  channelInput.classList.toggle('open', !isOpen);
});

channelDropdown.querySelectorAll('.dropdown-option').forEach(option => {
  option.addEventListener('click', e => {
    e.stopPropagation();
    const val   = option.dataset.value;
    const label = option.textContent.trim();
    if (selected.has(val)) return;

    selected.add(val);
    option.classList.add('selected');

    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.dataset.val = val;
    pill.innerHTML = `${label} <button aria-label="Remove">×</button>`;
    pill.querySelector('button').addEventListener('click', e => {
      e.stopPropagation();
      selected.delete(val);
      pill.remove();
      option.classList.remove('selected');
      placeholder.style.display = selected.size ? 'none' : '';
    });
    channelInput.insertBefore(pill, placeholder);
    placeholder.style.display = 'none';
  });
});

document.addEventListener('click', e => {
  if (!channelSelect.contains(e.target)) {
    channelDropdown.hidden = true;
    channelInput.classList.remove('open');
  }
});

// ── Lookback toggle ──
document.getElementById('lookback-toggle').querySelectorAll('.seg-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.getElementById('lookback-toggle').querySelectorAll('.seg-btn')
      .forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('date-range').hidden = (this.dataset.val !== 'custom');
  });
});

// ── Topic row → sidebar panel ──
const topicPanel      = document.getElementById('topic-panel');
const topicPanelTitle = document.getElementById('topic-panel-title');
const topicPanelClose = document.getElementById('topic-panel-close');

document.querySelectorAll('.topic-row').forEach(row => {
  row.addEventListener('click', function () {
    document.querySelectorAll('.topic-row').forEach(r => r.classList.remove('topic-row--active'));
    this.classList.add('topic-row--active');
    topicPanelTitle.textContent = this.dataset.topic;
    topicPanel.classList.add('open');
  });
});

topicPanelClose.addEventListener('click', () => {
  topicPanel.classList.remove('open');
  document.querySelectorAll('.topic-row').forEach(r => r.classList.remove('topic-row--active'));
});

// ── Methodology info modal ──
document.getElementById('btn-methodology').addEventListener('click', () => {
  document.getElementById('minfo-overlay').hidden = false;
});
document.getElementById('minfo-close').addEventListener('click', () => {
  document.getElementById('minfo-overlay').hidden = true;
});
document.getElementById('minfo-overlay').addEventListener('click', e => {
  if (e.target.id === 'minfo-overlay') document.getElementById('minfo-overlay').hidden = true;
});

// ── Chat preview ──
const chatOverlay  = document.getElementById('chat-preview-overlay');
const chatMessages = document.getElementById('chat-preview-messages');
const chatInput    = document.getElementById('chat-preview-input');
const chatSend     = document.getElementById('chat-preview-send');

const agentReplies = [
  "I'd be happy to help with that! Could you share a bit more detail so I can point you in the right direction?",
  "Thanks for reaching out. Let me look into that for you — this is something we can definitely resolve.",
  "Great question. Based on your account history, here's what I'd recommend: check your settings under Profile → Billing and make sure your payment method is up to date.",
  "I understand how frustrating that can be. Our team is aware of this issue and a fix is being rolled out in the next 24 hours. You'll receive a confirmation by email.",
  "You're all set! Is there anything else I can help you with today?"
];
let replyIndex = 0;

function addMessage(text, role) {
  const div = document.createElement('div');
  div.className = `chat-msg chat-msg--${role}`;
  const p = document.createElement('p');
  p.textContent = text;
  div.appendChild(p);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function addTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg--agent chat-msg--typing';
  div.innerHTML = '<p><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></p>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  addMessage(text, 'user');
  chatInput.disabled = true;
  chatSend.disabled = true;

  const typing = addTypingIndicator();
  setTimeout(() => {
    typing.remove();
    const reply = agentReplies[replyIndex % agentReplies.length];
    replyIndex++;
    addMessage(reply, 'agent');
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.focus();
  }, 1200 + Math.random() * 600);
}

document.querySelector('.btn-preview').addEventListener('click', () => {
  chatOverlay.hidden = false;
  chatInput.focus();
});

document.getElementById('chat-preview-close').addEventListener('click', () => {
  chatOverlay.hidden = true;
  // Reset conversation
  chatMessages.innerHTML = '<div class="chat-msg chat-msg--agent"><p>Hi there! 👋 How can I help you today?</p></div>';
  replyIndex = 0;
});

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

// ══════════════════════════════════
//   MOCK DATA — CONVERSATIONS
// ══════════════════════════════════
const CONVERSATIONS = [
  {
    id: 'conv-1',
    customer: { name: 'Maria Santos', initials: 'MS', color: '#6c63ff' },
    subject: 'Is breakfast included in my stay?',
    channel: 'Chat',
    lastActivity: '9:42 AM',
    unread: true,
    preview: 'Hi! I just booked a room for next weekend and wanted to know if breakfast is included...',
    messages: [
      { id: 'msg-1-1', role: 'customer', text: 'Hi! I just booked a room for next weekend and wanted to know if breakfast is included in my stay?', time: '9:40 AM' },
      { id: 'msg-1-2', role: 'ai-draft', text: 'Hello Maria! Thank you for your booking. Yes, breakfast is complimentary for all our guests and is served daily from 7:00 AM to 10:30 AM in the main dining hall. Enjoy your stay!', time: '9:40 AM' },
      { id: 'msg-1-3', role: 'agent', text: 'Hi Maria! Thanks for reaching out. Actually, breakfast is not included in the standard room rate — it\'s available as an add-on for €18 per person per day. I can add it to your reservation if you\'d like! The buffet runs from 7 to 10:30 AM.', time: '9:45 AM' },
    ],
    actions: [
      { id: 'act-1-1', text: 'Label \'breakfast-inquiry\' added by AI Agent', time: '9:40 AM' }
    ],
    // Mapping for feedback → improvement
    improvementMapping: {
      type: 'Knowledge',
      topic: 'Hotel Policies',
      group: 'Breakfast',
      item: 'Clarify that breakfast is not included in the standard room rate',
      detail: {
        context: 'Guest asked whether breakfast is included in their weekend booking.',
        aiResponse: 'Yes, breakfast is complimentary for all our guests and is served daily from 7:00 AM to 10:30 AM in the main dining hall.',
        humanFeedback: 'Incorrect information — breakfast is NOT included in the standard room rate. It costs €18 per person per day as an add-on.',
        proposed: 'Update knowledge base to correctly state that breakfast is an add-on, not complimentary. Include pricing information.',
        promptDiff: [
          { type: 'remove', text: 'Breakfast is complimentary for all hotel guests.' },
          { type: 'add', text: 'Breakfast is available as an add-on for €18 per person per day.' },
          { type: 'add', text: 'It is NOT included in the standard room rate.' },
          { type: 'add', text: 'Offer to add breakfast to the guest\'s reservation when they inquire.' },
          { type: 'context', text: 'Breakfast is served daily from 7:00 AM to 10:30 AM in the main dining hall.' },
        ]
      }
    }
  },
  {
    id: 'conv-2',
    customer: { name: 'James Porter', initials: 'JP', color: '#e74c3c' },
    subject: 'Re: Reservation confirmation #8847',
    channel: 'Email',
    lastActivity: '8:15 AM',
    unread: true,
    preview: 'Dear Hotel Team, I am writing to confirm my upcoming reservation...',
    messages: [
      { id: 'msg-2-1', role: 'customer', text: 'Dear Hotel Team,\n\nI am writing to confirm my upcoming reservation #8847 for March 22–25. I would also like to request a late checkout on the 25th if possible, as my flight departs at 8 PM.\n\nPlease let me know if this can be arranged.\n\nBest regards,\nJames Porter', time: '8:10 AM' },
      { id: 'msg-2-2', role: 'ai-draft', text: 'Dear Mr. Porter,\n\nThank you for reaching out regarding your upcoming stay. I can confirm that reservation #8847 is active and fully confirmed for March 22–25.\n\nRegarding your late checkout request on March 25th: late checkouts are subject to availability on the day and are typically confirmed the evening before departure. Should occupancy allow, we can extend your checkout to 2:00 PM at no additional charge, or until 6:00 PM for a supplementary fee of €45. I have added a note to your booking to flag this request for the front desk team, who will reach out to you directly on the evening of March 24th.\n\nIf you have any other special requests ahead of your arrival — such as room preferences, dietary requirements, or transportation arrangements — please don\'t hesitate to let us know and we will do our best to accommodate.\n\nWarm regards,\nGuest Services Team', time: '8:10 AM' },
      { id: 'msg-2-3', role: 'agent', text: 'Dear James,\n\nThank you for reaching out! Your reservation #8847 is all set for March 22–25. Great news — I\'ve gone ahead and noted a late checkout request on your booking. We\'ll do our best to accommodate this given your evening flight.\n\nLooking forward to welcoming you!\n\nWarm regards,\nSarah — Front Desk Team', time: '8:22 AM' },
    ],
    actions: [],
    pendingActions: [
      { id: 'pa-jp-1', type: 'label', label: 'Reservation Query' },
      { id: 'pa-jp-2', type: 'assign-user', user: { name: 'Sarah', initials: 'S', color: '#249888' } }
    ],
    improvementMapping: {
      type: 'Behavior',
      topic: 'Greeting Style',
      group: 'Opening message',
      item: 'Use warm, hospitality-appropriate tone instead of formal corporate language',
      detail: {
        context: 'Guest sent a formal email confirming reservation and requesting late checkout.',
        aiResponse: 'Your inquiry has been processed. Reservation #8847 is confirmed for March 22–25. Regarding your late checkout request, this will be subject to availability.',
        humanFeedback: 'Wrong tone — response sounds like an automated corporate system, not a welcoming hotel. Should use warm, friendly hospitality language and proactively try to help with the late checkout.',
        proposed: 'Update behavior to use conversational, warm hospitality tone. Avoid phrases like "your inquiry has been processed" or "subject to availability" without context.',
        promptDiff: [
          { type: 'remove', text: 'Respond professionally and concisely to guest inquiries.' },
          { type: 'add', text: 'Respond with warm, friendly hospitality language.' },
          { type: 'add', text: 'Address guests by their first name when appropriate.' },
          { type: 'add', text: 'Avoid corporate phrases like "your inquiry has been processed" or "subject to availability" without additional context.' },
          { type: 'add', text: 'Show enthusiasm about the guest\'s upcoming stay.' },
          { type: 'add', text: 'When a guest requests something, proactively try to fulfill it rather than giving a non-committal response.' },
        ]
      }
    }
  },
  {
    id: 'conv-3',
    customer: { name: 'Aisha Okafor', initials: 'AO', color: '#2ecc71' },
    subject: 'Noisy room complaint',
    channel: 'Chat',
    lastActivity: 'Yesterday',
    unread: false,
    preview: 'The room next to mine has been incredibly loud all night...',
    messages: [
      { id: 'msg-3-1', role: 'customer', text: 'The room next to mine has been incredibly loud all night. I\'ve barely slept. This is room 412. Can someone please do something about this?', time: '11:32 PM' },
      { id: 'msg-3-2', role: 'ai-draft', text: 'Dear Aisha,\n\nWe sincerely apologise for the disturbance you are experiencing tonight. A noisy environment is completely unacceptable and we take this matter very seriously.\n\nI have escalated your complaint directly to our night manager, who is dispatching a member of our guest services team to address the situation immediately. You should expect someone to knock on your door within the next 10 minutes.\n\nIn the meantime, we would like to offer you the following options:\n• Remain in your current room while we resolve the noise issue next door\n• Move to an equivalent room on a quieter floor at no additional cost\n• A complimentary room upgrade, subject to current availability\n\nPlease let us know which option you would prefer and we will arrange everything for you straight away. We deeply apologise for the disruption to your stay and appreciate your patience.\n\nSincerely,\nNight Guest Relations', time: '11:32 PM' },
      { id: 'msg-3-3', role: 'agent', text: 'I\'m really sorry about this, Aisha. That\'s completely unacceptable. I\'ve contacted our night manager to address the noise from the neighboring room immediately. I\'ve also put a note to offer you a room change or a complimentary night if you prefer. Someone will knock on your door within 10 minutes.', time: '11:38 PM' },
    ],
    actions: [
      { id: 'act-3-1', text: 'Assigned to Billing Team by AI Agent', time: '11:33 PM' },
      { id: 'act-3-2', text: 'Label \'complaint\' added by AI Agent', time: '11:33 PM' },
    ],
    pendingActions: [
      { id: 'pa-ao-1', type: 'escalate' },
      { id: 'pa-ao-2', type: 'label', label: 'Complaint' }
    ],
    improvementMapping: {
      type: 'Actions',
      topic: 'Conversation Routing',
      group: 'Team assignment',
      item: 'Route noise complaints to Guest Relations, not Billing',
      detail: {
        context: 'Guest complained about loud noise from the neighboring room late at night and requested help.',
        aiResponse: 'The AI assigned the conversation to the Billing Team.',
        humanFeedback: 'Wrong team assigned — noise complaints should go to Guest Relations or the Night Manager, not Billing. This is a guest experience issue, not a financial one.',
        proposed: 'Update routing rules so that complaints about noise, room conditions, and guest experience are routed to Guest Relations team.',
        promptDiff: [
          { type: 'context', text: 'When routing conversations to teams:' },
          { type: 'remove', text: 'Route complaints to the Billing Team for resolution tracking.' },
          { type: 'add', text: 'Route noise complaints, room condition issues, and guest experience problems to Guest Relations.' },
          { type: 'add', text: 'Route billing disputes, payment issues, and invoice questions to Billing.' },
          { type: 'add', text: 'For after-hours complaints, also flag for Night Manager attention.' },
        ]
      }
    }
  },
  {
    id: 'conv-4',
    customer: { name: 'Thomas Müller', initials: 'TM', color: '#f39c12' },
    subject: 'Re: Extending my reservation',
    channel: 'Email',
    lastActivity: 'Yesterday',
    unread: false,
    preview: 'Hello, I would like to extend my current stay by two additional nights...',
    messages: [
      { id: 'msg-4-1', role: 'customer', text: 'Hello,\n\nI would like to extend my current stay by two additional nights (through March 20). My current reservation is #9923.\n\nPlease confirm availability and any rate changes.\n\nThank you,\nThomas Müller', time: '2:15 PM' },
      { id: 'msg-4-2', role: 'ai-draft', text: 'Dear Mr. Müller,\n\nThank you for reaching out about extending your stay. We would be delighted to have you with us through March 20.\n\nI have checked availability and I am pleased to confirm that we can accommodate the two-night extension at your current rate of €145 per night, giving a total of €290 for the additional nights. Your current room will be held for the extended period, so no room change will be necessary.\n\nA few things worth noting for your extended stay:\n• Late checkout on March 20 may be available depending on occupancy — we recommend confirming this with the front desk on March 19th\n• Should you wish to upgrade for the extended nights, we currently have Deluxe rooms at €175/night and Junior Suites at €220/night, both including spa access\n• Your existing breakfast arrangement carries over automatically to the extended dates\n\nTo confirm the extension, please reply to this message or call reception at extension 0. We require confirmation by 6:00 PM today to guarantee availability at the current rate.\n\nKind regards,\nFront Desk Team', time: '2:15 PM' },
      { id: 'msg-4-3', role: 'agent', text: 'Hi Thomas,\n\nGreat news — I\'ve checked availability and I can extend your reservation #9923 through March 20 at the same rate of €145/night. Your current Deluxe room is available for those dates too, so no room change needed.\n\nShall I go ahead and confirm the extension?\n\nBest,\nSarah', time: '2:28 PM' },
    ],
    actions: [
      { id: 'act-4-1', text: 'Label \'reservation-change\' added by AI Agent', time: '2:16 PM' },
    ],
    pendingActions: [
      { id: 'pa-tm-1', type: 'assign-team', team: 'Hospitality' },
      { id: 'pa-tm-2', type: 'comment', text: 'Guest wants 2-night extension — check room availability first.' }
    ],
    improvementMapping: {
      type: 'Behavior',
      topic: 'Conversation Flow',
      group: 'Clarification questions',
      item: 'Don\'t ask unnecessary questions when the guest\'s intent is clear',
      detail: {
        context: 'Guest emailed requesting to extend their existing reservation by two nights. Reservation number was provided.',
        aiResponse: 'The AI asked about preferred room type instead of checking availability for the extension. The guest already has a room — asking about room type preferences is irrelevant.',
        humanFeedback: 'Asked question too early / unnecessary question — the guest clearly wants to extend their CURRENT stay in their CURRENT room. The AI should check availability for the extension, not ask about room preferences.',
        proposed: 'When a guest requests to extend their stay, first check the existing reservation details and availability. Don\'t ask clarifying questions when the intent is obvious.',
        promptDiff: [
          { type: 'context', text: 'When handling reservation extension requests:' },
          { type: 'remove', text: 'Ask the guest to clarify their preferences before processing changes.' },
          { type: 'add', text: 'Look up the existing reservation details first.' },
          { type: 'add', text: 'Check availability for the requested dates in the same room type.' },
          { type: 'add', text: 'Present the guest with availability and rate information directly.' },
          { type: 'add', text: 'Only ask clarifying questions when the request is genuinely ambiguous.' },
        ]
      }
    }
  },
  {
    id: 'conv-5',
    customer: { name: 'Yuki Tanaka', initials: 'YT', color: '#9b59b6' },
    subject: 'Broken door lock — room 307',
    channel: 'Chat',
    lastActivity: 'Mon',
    unread: false,
    preview: 'My door lock isn\'t working properly. The keycard doesn\'t seem to...',
    messages: [
      { id: 'msg-5-1', role: 'customer', text: 'My door lock isn\'t working properly. The keycard doesn\'t seem to engage the lock mechanism at all. I can push the door open without the card. Room 307.', time: '10:15 PM' },
      { id: 'msg-5-2', role: 'ai-draft', text: 'I\'m sorry to hear about the issue with your door lock, Yuki. Sometimes keycard readers need to be reset. Could you try removing the keycard, waiting 5 seconds, and then reinserting it slowly? If that doesn\'t work, our front desk can reprogram your card during regular hours (8 AM – 10 PM).', time: '10:15 PM' },
      { id: 'msg-5-3', role: 'agent', text: 'Yuki, this is a safety concern — I\'m sending our maintenance team to your room right now. A non-functioning lock means your room is not secure. Please stay inside and we\'ll have someone there within 5 minutes. If you feel unsafe at any point, please come to the front desk immediately.', time: '10:18 PM' },
    ],
    actions: [
      { id: 'act-5-1', text: 'Label \'maintenance\' added by AI Agent', time: '10:16 PM' },
    ],
    improvementMapping: {
      type: 'Actions',
      topic: 'Conversation Routing',
      group: 'Escalation handling',
      item: 'Immediately escalate safety concerns like broken locks to Maintenance',
      detail: {
        context: 'Guest reported that their room door lock is not working and the door can be pushed open without a keycard. This is a safety/security concern.',
        aiResponse: 'The AI suggested troubleshooting steps (remove and reinsert keycard) and mentioned the front desk can help during regular hours. It did NOT escalate the issue or treat it as urgent.',
        humanFeedback: 'Should have escalated — a broken door lock is a safety concern. The AI should immediately escalate to Maintenance and treat this as urgent, not suggest self-service troubleshooting.',
        proposed: 'Safety-related issues (broken locks, fire hazards, medical emergencies) must be immediately escalated. Never suggest self-service troubleshooting for safety concerns.',
        promptDiff: [
          { type: 'context', text: 'When handling guest safety concerns:' },
          { type: 'remove', text: 'Suggest troubleshooting steps for door lock issues.' },
          { type: 'add', text: 'IMMEDIATELY escalate safety concerns to the Maintenance or Security team.' },
          { type: 'add', text: 'Safety concerns include: broken locks, non-functional safes, fire safety issues, water damage, and medical emergencies.' },
          { type: 'add', text: 'Never suggest self-service troubleshooting for safety issues.' },
          { type: 'add', text: 'Reassure the guest and provide immediate alternative safety measures.' },
          { type: 'add', text: 'Flag the conversation as URGENT priority.' },
        ]
      }
    }
  }
];

// ══════════════════════════════════
//   MOCK DATA — CONVERSATIONS V2 (Iteration 2)
// ══════════════════════════════════
const CONVERSATIONS_V2 = [
  {
    id: 'v2-conv-1',
    customer: { name: 'Maria Santos', initials: 'MS', color: '#BEA6FF' },
    subject: 'Is breakfast included in my stay?',
    channel: 'Chat',
    lastActivity: '9:42 AM',
    unread: true,
    preview: 'Hi! I just booked a room for next weekend and wanted to know if breakfast is included...',
    useCase: 'Reply',
    messages: [
      { id: 'v2-m1-1', role: 'customer', text: 'Hi! I just booked a room for next weekend and wanted to know if breakfast is included in my stay?', time: '9:40 AM' },
      { id: 'v2-m1-draft', role: 'ai-draft', text: 'Hello Maria! Thank you for your booking. Yes, breakfast is complimentary for all our guests and is served daily from 7:00 AM to 10:30 AM in our restaurant on the ground floor. We offer a full buffet with both hot and cold options.\n\nIs there anything else I can help you with regarding your upcoming stay?', time: '9:42 AM' }
    ],
    _draftReadyForPreload: true,
    // Follow-up messages for the reply cycle (step 6+7)
    _followUps: [
      { customer: { text: 'That sounds great, thank you! One more thing — is there parking available at the hotel? We\'re driving in from Amsterdam.', time: '9:45 AM' },
        draft: { text: 'Of course! We have an on-site parking garage available for our guests at €15 per night. I\'d recommend reserving a spot in advance as it can fill up during weekends. Would you like me to reserve a parking space for your stay?\n\nLooking forward to welcoming you!', time: '9:46 AM' } }
    ],
    actions: [],
    pendingActions: [],
    improvementMapping: {}
  },
  {
    id: 'v2-conv-2',
    customer: { name: 'James Porter', initials: 'JP', color: '#BEA6FF' },
    subject: 'Re: Reservation confirmation #8847',
    channel: 'Email',
    lastActivity: '8:15 AM',
    unread: true,
    preview: 'Dear Hotel Team, I am writing to confirm my upcoming reservation...',
    useCase: 'Handover',
    messages: [
      { id: 'v2-m2-1', role: 'customer', text: 'Dear Hotel Team,\n\nI am writing to confirm my upcoming reservation. I have some specific requirements regarding accessibility that I need to discuss urgently.', time: '8:15 AM' }
    ],
    _draftReadyForPreload: true,
    _initialReply: {
      text: "Dear James,\n\nThank you for reaching out about your upcoming stay. I'd be happy to help with your accessibility requirements. Could you share the specific arrangements you need — for example wheelchair access, visual or hearing support, or dietary considerations? I'll make sure everything is confirmed and our team is fully prepared for your arrival.",
      time: '8:17 AM'
    },
    _escalation: {
      followUp: { id: 'v2-m2-2', text: "I've been waiting for a response for days now. This is completely unacceptable — my check-in is in two days and I still have no confirmation about the accessibility arrangements. I need a response immediately.", time: '8:22 AM' }
    },
    actions: [],
    pendingActions: [],
    improvementMapping: {}
  },
  {
    id: 'v2-conv-3',
    customer: { name: 'Thomas Müller', initials: 'TM', color: '#BEA6FF' },
    subject: 'Re: Extending my reservation',
    channel: 'Email',
    lastActivity: 'Yesterday',
    unread: false,
    preview: 'Hello, I would like to extend my current stay by two additional nights...',
    useCase: 'Escalation — To user',
    messages: [
      { id: 'v2-m3-1', role: 'customer', text: 'Hello, I would like to extend my current stay by two additional nights. Could you check availability?', time: 'Yesterday' }
    ],
    _draftReadyForPreload: true,
    _initialReply: {
      text: "Hi Thomas,\n\nThanks for getting in touch! I'd be glad to check availability for extending your stay by two additional nights. Could you confirm your booking reference and the exact dates you'd like added? I'll come back with availability and pricing as soon as I hear from you.",
      time: 'Yesterday'
    },
    _salesEscalation: {
      bigMsg: {
        text: "Actually — I should mention, we're now considering booking the entire hotel wing for a corporate retreat. We'd need accommodation for 40 people across 5 nights. This is a priority for us and we need to move quickly. Can you help us put this together?",
        time: '9:02 AM'
      },
      aiReply1: {
        text: "Dear Thomas,\n\nThank you for reaching out — a corporate retreat for 40 guests sounds like a wonderful event and we'd love to host you.\n\nTo make sure we put together the perfect proposal, could you share:\n• Preferred dates or a date range?\n• Any catering requirements (meals, dietary needs)?\n• Do you need meeting rooms or AV equipment?\n\nI'll have everything ready as soon as I hear back from you.",
        time: '9:03 AM'
      },
      detailsMsg: {
        text: "We're looking at June 9–14. We'll need full board for all 40 guests, two conference rooms with AV, and ideally a private dining setup for the closing dinner. Budget is flexible — this needs to be premium.",
        time: '9:07 AM'
      },
      aiReply2: {
        text: "Dear Thomas,\n\nPerfect — June 9–14 with full board, two conference rooms, AV, and a private dining experience for 40 guests. I have all the details.\n\nGiven the scale and premium requirements of this booking, I'd like to connect you directly with Federico, our Head of Sales. He specialises in corporate events and will be able to put together a tailored proposal for you personally.\n\nYou'll hear from him shortly.",
        time: '9:08 AM'
      }
    },
    actions: [],
    pendingActions: [],
    improvementMapping: {}
  },
  {
    id: 'v2-conv-4',
    customer: { name: 'Aisha Okafor', initials: 'AO', color: '#BEA6FF' },
    subject: 'Job application enquiry',
    channel: 'Chat',
    lastActivity: 'Yesterday',
    unread: true,
    preview: 'Hi, I am interested in applying for a position at your hotel...',
    useCase: 'Assign to team',
    messages: [
      { id: 'v2-m4-1', role: 'customer', text: "Hi there! I'm very interested in applying for a position at your hotel. I have experience in hospitality and guest relations. Could you let me know how I can submit my application or who I should speak with?", time: 'Yesterday' }
    ],
    _draftReadyForPreload: true,
    _teamEscalation: {
      greeting: {
        text: "Hi Aisha,\n\nThank you for reaching out — it's great to hear you're interested in joining our team!\n\nI'll connect you with the right people right away. Our People team handles all applications and will be happy to guide you through the process.\n\nStay tuned!",
        time: 'Yesterday'
      }
    },
    actions: [],
    pendingActions: [],
    improvementMapping: {}
  },
  {
    id: 'v2-conv-5',
    customer: { name: 'Yuki Tanaka', initials: 'YT', color: '#BEA6FF' },
    subject: 'Broken door lock — room 307',
    channel: 'Chat',
    lastActivity: 'Mon',
    unread: false,
    preview: "My door lock isn't working properly. The keycard doesn't seem to...",
    useCase: 'Close conversation',
    messages: [
      { id: 'v2-m5-1', role: 'customer', text: "My door lock isn't working properly. The keycard doesn't seem to register when I tap it.", time: 'Mon' }
    ],
    _draftReadyForPreload: true,
    _closeData: {
      agentReply: {
        text: "Hi Yuki,\n\nSo sorry about that! I've flagged this to our maintenance team right away — they'll be with you within the next 30 minutes to sort the lock.\n\nLet me know if there's anything else I can do in the meantime!",
        time: 'Mon'
      },
      customerBye: {
        id: 'v2-m5-2',
        role: 'customer',
        text: "That was super quick! All fixed now — thank you so much! Have a great day! 😊",
        time: 'Mon'
      }
    },
    actions: [],
    pendingActions: [],
    improvementMapping: {}
  },
  {
    id: 'v2-conv-6',
    customer: { name: 'Sophie Chen', initials: 'SC', color: '#BEA6FF' },
    subject: 'Special dietary requirements for event',
    channel: 'Email',
    lastActivity: 'Mon',
    unread: false,
    preview: 'Hi, we have a corporate event next Friday and several attendees have dietary restrictions...',
    useCase: 'Add label(s)',
    messages: [
      { id: 'v2-m6-1', role: 'customer', text: "Hi, we have a corporate event next Friday and several attendees have dietary restrictions. Could you coordinate with your kitchen team? We're on a tight schedule and really can't afford any mix-ups.", time: 'Mon' }
    ],
    _draftReadyForPreload: true,
    _labelData: {
      agentReply: {
        text: "Hi Sophie,\n\nOf course — I'll make sure our kitchen team is fully briefed before Friday. Could you share the full list of dietary requirements so we can prepare everything properly?\n\nWe'll make sure there are no mix-ups!",
        time: 'Mon'
      },
      customerUpgrade: {
        id: 'v2-m6-2',
        role: 'customer',
        text: "Thank you! Also — we'd love to upgrade the room block to the executive suites if possible, and add a premium welcome drinks package for guests on arrival. Can you check availability?",
        time: 'Mon'
      },
      upgradeReply: {
        text: "Hi Sophie,\n\nGreat news — executive suites are available for your dates! I'll get those reserved right away and add the premium welcome drinks package to your booking.\n\nI'll send over the updated confirmation shortly!",
        time: 'Mon'
      },
      labels: ['Upsell opportunity', 'Event booking']
    },
    actions: [],
    pendingActions: [],
    improvementMapping: {}
  },
  {
    id: 'v2-conv-7',
    customer: { name: 'Barry Calders', initials: 'BC', color: '#BEA6FF' },
    subject: 'Incorrect charge on invoice #2847',
    channel: 'Chat',
    lastActivity: 'Now',
    unread: true,
    preview: "Hi, I've been looking at my latest invoice and something doesn't add up...",
    useCase: 'Internal comment',
    messages: [
      { id: 'v2-m7-1', role: 'customer',
        text: "Hi, I've been looking at my latest invoice and something doesn't add up. I think I was charged twice in April but I'm not sure which line item is wrong. Invoice number is #2847. Can someone take a look?",
        time: 'Now' }
    ],
    _draftReadyForPreload: true,
    _barryData: {
      agentReply: {
        text: "Hi Barry,\n\nThanks for flagging this! To look into invoice #2847 properly, could you let us know:\n• The exact amount you believe was charged incorrectly?\n• The date the charge appeared?\n• Which payment method was used?\n\nWe'll get this sorted for you as quickly as possible.",
        time: 'Now'
      },
      internalNote: [
        '• Barry reports a duplicate charge on invoice #2847 (April)',
        '• Disputed amount and payment method not yet specified',
        '• Agent has requested: exact amount, charge date, payment method',
        '• Likely billing error — recommend review by Finance team'
      ]
    },
    actions: [],
    pendingActions: [],
    improvementMapping: {}
  }
];

// ══════════════════════════════════
//   MOCK DATA — IMPROVEMENTS (pre-seeded)
// ══════════════════════════════════
const feedbackLog = []; // Raw feedback entries: { id, type, feedback, from, date, iteration, suggestion, processed }
let feedbackSort = { key: 'date', dir: 'desc' };

function classifyFeedback(type, text) {
  const t = (type || '').toLowerCase();
  const s = (text || '').toLowerCase();

  // Tone of voice
  if (/formal|informal|tone|voice|friendly|warm|cold|robotic|empathetic|casual|stiff|harsh|rude/.test(s)) {
    return { page: 'Behavior', pageId: 'page-behavior', pageTab: 'behavior', field: 'Tone of voice', fieldIndex: 2, confidence: 'high' };
  }
  // Handover / escalation
  if (/escalat|handover|transfer|human agent|urgent|angry|frustrated|pass (it|this|the)/.test(s) || t.includes('escalation unnecessary') || t.includes('should have escalated')) {
    return { page: 'Behavior', pageId: 'page-behavior', pageTab: 'behavior', field: 'Set handover criteria', fieldIndex: 3, confidence: 'high' };
  }
  // Assignment / routing
  if (/assign|wrong team|wrong person|route|routing|overload/.test(s) || t.includes('wrong team') || t.includes('wrong person')) {
    return { page: 'Behavior', pageId: 'page-behavior', pageTab: 'behavior', field: 'Set handover criteria', fieldIndex: 3, confidence: 'medium' };
  }
  // Label actions
  if (/label|tag|categoris|categori/.test(s) || t.includes('wrong label') || t.includes('label not applicable')) {
    return { page: 'Behavior', pageId: 'page-behavior', pageTab: 'behavior', field: 'Additional instructions', fieldIndex: 5, confidence: 'medium' };
  }
  // Job description
  if (/role|purpose|job|supposed to|meant to|should be doing/.test(s)) {
    return { page: 'Behavior', pageId: 'page-behavior', pageTab: 'behavior', field: 'Job description', fieldIndex: 0, confidence: 'high' };
  }
  // Knowledge / information
  if (/incorrect|wrong info|doesn.t know|knowledge|missing info|no information|didn.t know/.test(s) || t.includes('knowledge') || t.includes('incorrect info')) {
    return { page: 'Knowledge Base', pageId: 'page-knowledge', pageTab: null, field: 'Knowledge articles', fieldIndex: -1, confidence: 'high' };
  }
  // Scenarios
  if (/scenario|workflow|process|steps|procedure/.test(s)) {
    return { page: 'Scenarios', pageId: 'page-scenarios', pageTab: 'scenarios', field: 'Scenario instructions', fieldIndex: -1, confidence: 'medium' };
  }
  // Default
  return { page: 'Behavior', pageId: 'page-behavior', pageTab: 'behavior', field: 'Additional instructions', fieldIndex: 5, confidence: s.length > 0 ? 'medium' : 'low' };
}

function generateSuggestedDiff(field, feedbackText) {
  const DIFFS = {
    'Tone of voice': [
      { type: 'context', text: 'Always respond professionally and clearly.' },
      { type: 'remove', text: 'Use formal, business-like language at all times.' },
      { type: 'add',    text: 'Acknowledge the customer\'s emotion before providing information.' },
      { type: 'add',    text: 'Use a warm, empathetic tone — especially when customers express frustration.' },
    ],
    'Set handover criteria': [
      { type: 'context', text: 'Hand over to a human agent when:' },
      { type: 'context', text: '— Customer explicitly requests a human' },
      { type: 'add',    text: '— Customer expresses strong frustration or anger (2+ messages)' },
      { type: 'add',    text: '— Issue cannot be resolved within 3 AI responses' },
    ],
    'Job description': [
      { type: 'context', text: 'You are a customer support agent for...' },
      { type: 'remove', text: 'Answer questions about products and services.' },
      { type: 'add',    text: 'Proactively help customers resolve issues, not just answer questions.' },
      { type: 'add',    text: 'Show empathy and ownership over the customer\'s problem.' },
    ],
    'Additional instructions': [
      { type: 'context', text: '(Additional instructions)' },
      { type: 'add',    text: '— ' + (feedbackText ? feedbackText.slice(0, 80) : 'Review and update based on feedback') },
    ],
    'Knowledge articles': [
      { type: 'add', text: 'Add a knowledge article covering: ' + (feedbackText ? feedbackText.slice(0, 80) : 'the reported gap') },
    ],
    'Scenario instructions': [
      { type: 'add', text: 'Update scenario to handle: ' + (feedbackText ? feedbackText.slice(0, 80) : 'the reported case') },
    ],
  };
  return DIFFS[field] || DIFFS['Additional instructions'];
}

function openFeedbackDrawer(fbId) {
  const fb = feedbackLog.find(f => f.id === fbId);
  if (!fb) return;
  window._drawerFbId = fbId;

  const sug = fb.suggestion || classifyFeedback(fb.type, fb.feedback);

  // Populate
  document.getElementById('drawer-feedback-text').textContent = fb.feedback || '—';
  document.getElementById('drawer-destination').textContent = sug.page + ' → ' + sug.field;

  const conf = sug.confidence || 'low';
  const confEl = document.getElementById('drawer-confidence');
  confEl.className = 'feedback-drawer-confidence confidence-dot--' + conf;
  confEl.textContent = '● ' + conf.charAt(0).toUpperCase() + conf.slice(1) + ' confidence';

  // Diff
  const diff = generateSuggestedDiff(sug.field, fb.feedback);
  const diffEl = document.getElementById('drawer-diff');
  diffEl.innerHTML = diff.map(line =>
    `<div class="improve-prompt-line improve-prompt-line--${line.type}">${line.type === 'add' ? '+ ' : line.type === 'remove' ? '− ' : '  '}${line.text}</div>`
  ).join('');

  // Reset override
  document.getElementById('drawer-override').hidden = true;
  document.getElementById('drawer-change-btn').textContent = 'Change destination ↓';

  // Show drawer
  document.getElementById('feedback-process-drawer').hidden = false;
}

function closeFeedbackDrawer() {
  document.getElementById('feedback-process-drawer').hidden = true;
  window._drawerFbId = null;
}

function applyFeedbackFix() {
  const fbId = window._drawerFbId;
  const fb = feedbackLog.find(f => f.id === fbId);
  if (!fb) return;

  const sug = fb.suggestion || classifyFeedback(fb.type, fb.feedback);

  // Mark as processed
  fb.processed = true;
  closeFeedbackDrawer();
  renderFeedbackTable();

  // Navigate to agent settings
  document.querySelector('.si-btn[data-page="agent"]')?.click();

  setTimeout(() => {
    // Switch to correct sub-page tab
    if (sug.pageTab) {
      const tabBtn = document.querySelector(`.tabs-bar button[data-tab-target="page-${sug.pageTab}"], .tabs-bar .tab[data-tab-target="page-${sug.pageTab}"]`);
      if (tabBtn) tabBtn.click();
    }

    setTimeout(() => {
      // Expand the target section if it's a behavior field
      if (sug.pageId === 'page-behavior' && sug.fieldIndex >= 0) {
        const sections = document.querySelectorAll('#page-behavior .behavior-section');
        const targetSection = sections[sug.fieldIndex];
        if (targetSection) {
          // Expand if collapsed
          if (targetSection.classList.contains('behavior-section--collapsed')) {
            const header = targetSection.querySelector('.behavior-section-header');
            header?.click();
          }
          // Scroll into view
          setTimeout(() => {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight
            targetSection.style.outline = '2px solid var(--leaf-500)';
            targetSection.style.borderRadius = '8px';
            setTimeout(() => { targetSection.style.outline = ''; targetSection.style.borderRadius = ''; }, 3000);
          }, 150);
        }
      }

      // Show banner
      showFeedbackApplyBanner(fb);
    }, 200);
  }, 300);
}

function showFeedbackApplyBanner(fb) {
  let banner = document.getElementById('feedback-apply-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'feedback-apply-banner';
    banner.className = 'feedback-apply-banner';
    const mainContent = document.querySelector('.content-area') || document.querySelector('.main');
    if (mainContent) mainContent.prepend(banner);
  }
  banner.innerHTML = `
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:14px;height:14px;flex-shrink:0"><path d="M2 4h12v8H2zM5 8h6"/></svg>
    Reviewing feedback from <strong>${fb.from}</strong> — edit the highlighted field and save when ready.
    <button onclick="document.getElementById('feedback-apply-banner').remove()" style="margin-left:auto;background:none;border:none;cursor:pointer;color:inherit;font-size:16px;line-height:1;">×</button>
  `;
  banner.hidden = false;
  // Auto-dismiss after 10s
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 10000);
}

const improvements = [
  {
    id: 'imp-seed-1',
    type: 'Knowledge',
    topic: 'Hotel Policies',
    group: 'Check-in/Check-out',
    title: 'Clarify early check-in policy and fees',
    count: 5,
    status: 'open',
    detail: {
      context: 'Multiple guests asked about early check-in options.',
      aiResponse: 'Early check-in is available upon request.',
      humanFeedback: 'Missing information — AI doesn\'t mention the €30 early check-in fee or that it\'s subject to availability.',
      proposed: 'Add early check-in pricing and availability conditions to knowledge base.',
      promptDiff: [
        { type: 'remove', text: 'Early check-in is available upon request.' },
        { type: 'add', text: 'Early check-in (before 2 PM) is available for €30, subject to room availability.' },
        { type: 'add', text: 'Guaranteed early check-in from 11 AM can be pre-booked for €50.' },
      ]
    }
  },
  {
    id: 'imp-seed-2',
    type: 'Behavior',
    topic: 'Greeting Style',
    group: 'Opening message',
    title: 'Greet guests by name when responding',
    count: 8,
    status: 'open',
    detail: {
      context: 'Agents noticed AI responses often start without addressing the guest by name.',
      aiResponse: 'Thank you for contacting us. How can I help?',
      humanFeedback: 'Wrong tone — should greet the guest by name for a personal touch.',
      proposed: 'Always address guests by their first name in the opening of a response.',
      promptDiff: [
        { type: 'remove', text: 'Begin responses with a generic greeting.' },
        { type: 'add', text: 'Always greet guests by their first name (e.g., "Hi Maria!" or "Dear James,").' },
        { type: 'add', text: 'Match the formality level to the channel: casual for chat, warm-formal for email.' },
      ]
    }
  },
  {
    id: 'imp-seed-3',
    type: 'Actions',
    topic: 'Conversation Routing',
    group: 'Team assignment',
    title: 'Route spa and wellness inquiries to Concierge',
    count: 3,
    status: 'open',
    detail: {
      context: 'Guests asking about spa services were routed to general support.',
      aiResponse: 'Assigned to General Support.',
      humanFeedback: 'Wrong team — spa and wellness inquiries should go to the Concierge team who manages bookings.',
      proposed: 'Route spa, wellness, and activity booking inquiries to the Concierge team.',
      promptDiff: [
        { type: 'context', text: 'When routing spa and wellness inquiries:' },
        { type: 'remove', text: 'Route to General Support queue.' },
        { type: 'add', text: 'Route spa, wellness, restaurant, and activity inquiries to the Concierge team.' },
      ]
    }
  },
  // ── Additional Knowledge improvements ──
  {
    id: 'imp-seed-4',
    type: 'Knowledge',
    topic: 'Hotel Policies',
    group: 'Pet policy',
    title: 'Clarify pet-friendly rooms and fees',
    count: 4,
    status: 'open',
    detail: {
      context: 'Guests frequently ask whether they can bring pets to the hotel.',
      aiResponse: 'Yes, pets are welcome at our hotel!',
      humanFeedback: 'Missing information — AI doesn\'t mention the €25/night pet surcharge, weight limit (under 15kg), or that only specific room types allow pets.',
      proposed: 'Add pet policy details including fees, restrictions, and designated pet-friendly rooms.',
      promptDiff: [
        { type: 'remove', text: 'Pets are welcome at the hotel.' },
        { type: 'add', text: 'Pets under 15kg are welcome in designated pet-friendly rooms for a €25/night surcharge.' },
        { type: 'add', text: 'Pet-friendly rooms must be requested at booking. Not all room types are eligible.' },
        { type: 'add', text: 'A pet deposit of €100 is required at check-in (refundable).' },
      ]
    }
  },
  {
    id: 'imp-seed-5',
    type: 'Knowledge',
    topic: 'Hotel Policies',
    group: 'Parking',
    title: 'Include parking rates and valet option in responses',
    count: 6,
    status: 'open',
    detail: {
      context: 'Multiple guests asked about parking before arrival.',
      aiResponse: 'We have parking available at the hotel.',
      humanFeedback: 'Missing information — AI should mention self-park (€15/day) vs valet (€30/day) pricing and that reservation is recommended.',
      proposed: 'Include parking pricing, options, and reservation recommendation.',
      promptDiff: [
        { type: 'remove', text: 'Parking is available at the hotel.' },
        { type: 'add', text: 'Self-parking is available for €15/day. Valet parking is €30/day.' },
        { type: 'add', text: 'Parking reservations are recommended during peak season (June–September).' },
        { type: 'context', text: 'The parking garage entrance is on the east side of the building.' },
      ]
    }
  },
  {
    id: 'imp-seed-6',
    type: 'Knowledge',
    topic: 'Hotel Amenities',
    group: 'Pool & Gym',
    title: 'Specify pool hours and gym access requirements',
    count: 3,
    status: 'open',
    detail: {
      context: 'Guests asked about pool and gym hours during their stay.',
      aiResponse: 'Our pool and gym are available for all guests.',
      humanFeedback: 'Missing information — pool is seasonal (May–Oct, 7AM–9PM), gym requires room key card, and towels are available poolside.',
      proposed: 'Add specific hours, seasonal availability, and access requirements.',
      promptDiff: [
        { type: 'remove', text: 'Pool and gym are available for all guests.' },
        { type: 'add', text: 'Pool: open May–October, 7:00 AM – 9:00 PM. Towels provided poolside.' },
        { type: 'add', text: 'Gym: 24/7 access with room key card. Located on Level -1.' },
      ]
    }
  },
  {
    id: 'imp-seed-7',
    type: 'Knowledge',
    topic: 'Hotel Amenities',
    group: 'Wi-Fi',
    title: 'Mention premium Wi-Fi upgrade option',
    count: 2,
    status: 'open',
    detail: {
      context: 'Business travelers asked about internet speed for video calls.',
      aiResponse: 'Complimentary Wi-Fi is available throughout the hotel.',
      humanFeedback: 'Missing information — standard Wi-Fi is free but slow. Premium Wi-Fi (100 Mbps) is available for €10/day, important for business guests.',
      proposed: 'Distinguish between standard and premium Wi-Fi tiers.',
      promptDiff: [
        { type: 'context', text: 'Complimentary Wi-Fi is available throughout the hotel.' },
        { type: 'add', text: 'For video conferencing or large downloads, recommend Premium Wi-Fi (100 Mbps) for €10/day.' },
        { type: 'add', text: 'Premium Wi-Fi can be activated at the front desk or through the in-room TV.' },
      ]
    }
  },
  // ── Additional Behavior improvements ──
  {
    id: 'imp-seed-8',
    type: 'Behavior',
    topic: 'Response Length',
    group: 'Email replies',
    title: 'Keep email responses concise — under 150 words',
    count: 7,
    status: 'open',
    detail: {
      context: 'Agents noticed AI email replies tend to be overly verbose and repetitive.',
      aiResponse: 'A 300+ word email repeating the guest\'s question back and adding unnecessary pleasantries.',
      humanFeedback: 'Wrong tone — emails are too long. Guests want quick answers, not essays. Aim for under 150 words.',
      proposed: 'Set maximum response length for emails and prioritize directness.',
      promptDiff: [
        { type: 'remove', text: 'Write detailed, thorough email responses that address all possible angles.' },
        { type: 'add', text: 'Keep email responses under 150 words. Be warm but direct.' },
        { type: 'add', text: 'Lead with the answer, then add context. Don\'t repeat the guest\'s question back.' },
      ]
    }
  },
  {
    id: 'imp-seed-9',
    type: 'Behavior',
    topic: 'Empathy',
    group: 'Complaint handling',
    title: 'Acknowledge frustration before offering solutions',
    count: 9,
    status: 'open',
    detail: {
      context: 'Guests filing complaints receive immediate solution proposals without empathy.',
      aiResponse: 'I can offer you a room change. Would you like me to process that?',
      humanFeedback: 'Wrong tone — jumping straight to solutions feels dismissive. Acknowledge the guest\'s frustration first.',
      proposed: 'Always lead with empathy and acknowledgement when handling complaints.',
      promptDiff: [
        { type: 'remove', text: 'When a guest reports a problem, immediately offer available solutions.' },
        { type: 'add', text: 'When a guest reports a problem, first acknowledge their frustration with genuine empathy.' },
        { type: 'add', text: 'Example: "I\'m really sorry about this experience — that\'s not the standard we aim for."' },
        { type: 'add', text: 'Then offer solutions after the acknowledgement.' },
      ]
    }
  },
  {
    id: 'imp-seed-10',
    type: 'Behavior',
    topic: 'Follow-up',
    group: 'Upselling',
    title: 'Suggest add-ons only after addressing the guest\'s question',
    count: 4,
    status: 'open',
    detail: {
      context: 'AI sometimes suggests upgrades or add-ons before answering what the guest actually asked.',
      aiResponse: 'Would you like to upgrade to our Executive Suite? By the way, regarding your question...',
      humanFeedback: 'Conversation flow issue — answer the guest\'s question first. Upselling before helping feels pushy.',
      proposed: 'Only suggest add-ons or upgrades after fully addressing the guest\'s original inquiry.',
      promptDiff: [
        { type: 'remove', text: 'Proactively suggest upgrades and add-ons when relevant.' },
        { type: 'add', text: 'First fully answer the guest\'s question. Only then, if contextually appropriate, suggest a relevant add-on.' },
        { type: 'add', text: 'Never lead with an upsell. The guest\'s need comes first.' },
      ]
    }
  },
  // ── Additional Actions improvements ──
  {
    id: 'imp-seed-11',
    type: 'Actions',
    topic: 'Conversation Routing',
    group: 'Priority',
    title: 'Mark VIP and loyalty members as high priority',
    count: 6,
    status: 'open',
    detail: {
      context: 'VIP and loyalty program members are treated the same as regular guests in the queue.',
      aiResponse: 'Assigned to General Support queue with normal priority.',
      humanFeedback: 'Action missing — VIP and loyalty members should be flagged as high priority for faster response times.',
      proposed: 'Auto-detect loyalty/VIP status and set conversation priority accordingly.',
      promptDiff: [
        { type: 'context', text: 'When assigning conversation priority:' },
        { type: 'add', text: 'If guest is a loyalty program member or VIP, set priority to HIGH.' },
        { type: 'add', text: 'Check reservation data for loyalty tier: Gold, Platinum, Diamond.' },
      ]
    }
  },
  {
    id: 'imp-seed-12',
    type: 'Actions',
    topic: 'Tagging',
    group: 'Label accuracy',
    title: 'Use specific labels instead of generic ones',
    count: 5,
    status: 'open',
    detail: {
      context: 'AI applies generic labels like "request" or "inquiry" that provide no useful categorization.',
      aiResponse: 'Label "request" added.',
      humanFeedback: 'Wrong label — use specific labels like "late-checkout", "room-upgrade", "breakfast-inquiry" for better reporting.',
      proposed: 'Use descriptive, specific labels that match the actual topic of the conversation.',
      promptDiff: [
        { type: 'remove', text: 'Apply the label "request" for general guest inquiries.' },
        { type: 'add', text: 'Apply specific labels matching the conversation topic: "late-checkout", "room-upgrade", "breakfast-inquiry", "complaint", "booking-change".' },
        { type: 'add', text: 'Never use generic labels like "request" or "inquiry".' },
      ]
    }
  },
  {
    id: 'imp-seed-13',
    type: 'Actions',
    topic: 'Escalation Handling',
    group: 'Complaint severity',
    title: 'Escalate conversations with 3+ back-and-forth messages',
    count: 3,
    status: 'open',
    detail: {
      context: 'Some guest complaints go through many exchanges without resolution or escalation.',
      aiResponse: 'Continued responding to a frustrated guest for 5 messages without escalating.',
      humanFeedback: 'Should have escalated — if a complaint has 3+ exchanges, it likely needs human attention.',
      proposed: 'Auto-escalate unresolved complaints after 3 back-and-forth messages.',
      promptDiff: [
        { type: 'context', text: 'Escalation rules for complaint conversations:' },
        { type: 'add', text: 'If a complaint conversation reaches 3+ back-and-forth messages without resolution, escalate to a senior agent.' },
        { type: 'add', text: 'Add internal note summarizing the issue and attempted resolutions before escalating.' },
      ]
    }
  },
  // ── Additional items for richer groups ──
  {
    id: 'imp-seed-14',
    type: 'Knowledge',
    topic: 'Hotel Policies',
    group: 'Check-in/Check-out',
    title: 'Explain late checkout options and pricing',
    count: 7,
    status: 'open',
    detail: {
      context: 'Guests frequently request late checkout but AI doesn\'t mention fees or availability.',
      aiResponse: 'Late checkout can be arranged at the front desk.',
      humanFeedback: 'Missing information — AI should mention late checkout is €20 until 2 PM or €40 until 4 PM, subject to availability.',
      proposed: 'Add late checkout pricing tiers and booking instructions.',
      promptDiff: [
        { type: 'remove', text: 'Late checkout can be arranged at the front desk.' },
        { type: 'add', text: 'Late checkout until 2 PM: €20. Late checkout until 4 PM: €40. Subject to availability.' },
        { type: 'add', text: 'Guests can request late checkout via the app or at the front desk the evening before.' },
      ]
    }
  },
  {
    id: 'imp-seed-15',
    type: 'Knowledge',
    topic: 'Hotel Policies',
    group: 'Check-in/Check-out',
    title: 'Include luggage storage info for early arrivals',
    count: 4,
    status: 'open',
    detail: {
      context: 'Guests arriving before check-in time ask where to leave bags.',
      aiResponse: 'Check-in starts at 3 PM.',
      humanFeedback: 'Missing information — AI should mention complimentary luggage storage at the bell desk for early arrivals.',
      proposed: 'Include luggage storage details in early arrival responses.',
      promptDiff: [
        { type: 'context', text: 'Check-in starts at 3 PM.' },
        { type: 'add', text: 'Complimentary luggage storage is available at the bell desk if you arrive before check-in.' },
        { type: 'add', text: 'You can also use our self-service lockers in the lobby (free for same-day guests).' },
      ]
    }
  },
  {
    id: 'imp-seed-16',
    type: 'Knowledge',
    topic: 'Hotel Policies',
    group: 'Pet policy',
    title: 'Mention nearby dog-walking parks',
    count: 3,
    status: 'open',
    detail: {
      context: 'Pet owners ask about where to walk their dogs near the hotel.',
      aiResponse: 'We are a pet-friendly hotel.',
      humanFeedback: 'Missing information — guests with dogs want to know about nearby parks. Vondelpark is 5 min walk, Sarphatipark is 10 min.',
      proposed: 'Add nearby dog-friendly park information to pet policy responses.',
      promptDiff: [
        { type: 'context', text: 'When guests ask about pet-friendly activities nearby:' },
        { type: 'add', text: 'Vondelpark (5 min walk) and Sarphatipark (10 min) both allow dogs on leash.' },
        { type: 'add', text: 'The concierge can provide a pet-friendly area map at check-in.' },
      ]
    }
  },
  {
    id: 'imp-seed-17',
    type: 'Knowledge',
    topic: 'Hotel Policies',
    group: 'Parking',
    title: 'Clarify electric vehicle charging availability',
    count: 5,
    status: 'open',
    detail: {
      context: 'Increasing number of guests ask about EV charging stations.',
      aiResponse: 'We have parking available at the hotel.',
      humanFeedback: 'Missing information — AI doesn\'t mention the 4 EV charging stations (Type 2, 22kW) in the garage, first-come-first-served.',
      proposed: 'Add EV charging station details to parking information.',
      promptDiff: [
        { type: 'context', text: 'Parking information for guests:' },
        { type: 'add', text: '4 EV charging stations available (Type 2 connector, 22kW) on parking level -1.' },
        { type: 'add', text: 'EV charging is complimentary for hotel guests. Stations are first-come, first-served.' },
      ]
    }
  },
  {
    id: 'imp-seed-18',
    type: 'Knowledge',
    topic: 'Hotel Amenities',
    group: 'Pool & Gym',
    title: 'Include children\'s pool rules and supervision requirements',
    count: 4,
    status: 'open',
    detail: {
      context: 'Families ask about pool safety and rules for children.',
      aiResponse: 'Our pool is available for all guests.',
      humanFeedback: 'Missing information — children under 12 must be supervised by an adult. Separate children\'s splash area available.',
      proposed: 'Add children\'s pool rules and family-friendly details.',
      promptDiff: [
        { type: 'context', text: 'Pool information for families:' },
        { type: 'add', text: 'Children under 12 must be accompanied by an adult at the pool at all times.' },
        { type: 'add', text: 'A separate children\'s splash area is available (heated, max depth 40cm).' },
      ]
    }
  },
  {
    id: 'imp-seed-19',
    type: 'Knowledge',
    topic: 'Hotel Amenities',
    group: 'Pool & Gym',
    title: 'Mention spa access included with gym membership',
    count: 2,
    status: 'open',
    detail: {
      context: 'Guests using the gym are unaware that sauna and steam room are included.',
      aiResponse: 'The gym is available 24/7 with your room key.',
      humanFeedback: 'Missing information — sauna and steam room on Level -1 are included with gym access. No extra charge.',
      proposed: 'Mention spa facilities when discussing gym access.',
      promptDiff: [
        { type: 'context', text: 'Gym: 24/7 access with room key card. Located on Level -1.' },
        { type: 'add', text: 'Sauna and steam room are included with gym access (open 7 AM – 10 PM).' },
        { type: 'add', text: 'Fresh towels and water are provided in the spa area.' },
      ]
    }
  },
  {
    id: 'imp-seed-20',
    type: 'Knowledge',
    topic: 'Hotel Amenities',
    group: 'Wi-Fi',
    title: 'Explain login steps for connecting multiple devices',
    count: 3,
    status: 'open',
    detail: {
      context: 'Business travelers struggle connecting laptops, phones, and tablets simultaneously.',
      aiResponse: 'Wi-Fi login details are provided at check-in.',
      humanFeedback: 'Missing information — each room allows up to 5 devices. Use surname + room number to authenticate on each device.',
      proposed: 'Add multi-device connection instructions to Wi-Fi responses.',
      promptDiff: [
        { type: 'context', text: 'Wi-Fi connection instructions:' },
        { type: 'add', text: 'Each room supports up to 5 simultaneous devices.' },
        { type: 'add', text: 'Log in with your surname and room number on each device. Contact reception if you need to reset your session.' },
      ]
    }
  },
  {
    id: 'imp-seed-21',
    type: 'Behavior',
    topic: 'Greeting Style',
    group: 'Opening message',
    title: 'Use guest\'s language preference when available',
    count: 6,
    status: 'open',
    detail: {
      context: 'International guests who write in their native language receive English-only responses.',
      aiResponse: 'Thank you for contacting us. How can I help?',
      humanFeedback: 'Wrong tone — if a guest writes in German or French, respond in their language. We support EN, DE, FR, NL, ES.',
      proposed: 'Detect and match the guest\'s language when it\'s a supported language.',
      promptDiff: [
        { type: 'context', text: 'When greeting a guest:' },
        { type: 'add', text: 'If the guest writes in a supported language (EN, DE, FR, NL, ES), respond in that language.' },
        { type: 'add', text: 'If unsure about the language, default to English but ask if they\'d prefer another language.' },
      ]
    }
  },
  {
    id: 'imp-seed-22',
    type: 'Behavior',
    topic: 'Response Length',
    group: 'Email replies',
    title: 'Avoid repeating information already shared in earlier messages',
    count: 5,
    status: 'open',
    detail: {
      context: 'In follow-up emails, AI repeats check-in times, hotel address, and other info already communicated.',
      aiResponse: 'A follow-up email that re-states the full hotel address, check-in time, and breakfast hours already sent 2 messages ago.',
      humanFeedback: 'Wrong tone — don\'t repeat information from earlier in the conversation thread. Reference it briefly if needed.',
      proposed: 'Check conversation history before including previously shared details.',
      promptDiff: [
        { type: 'remove', text: 'Include all relevant hotel information in every response for completeness.' },
        { type: 'add', text: 'Check if information was already shared earlier in the thread. If so, reference it briefly ("as mentioned") rather than repeating in full.' },
      ]
    }
  },
  {
    id: 'imp-seed-23',
    type: 'Behavior',
    topic: 'Empathy',
    group: 'Complaint handling',
    title: 'Offer a gesture of goodwill for major inconveniences',
    count: 6,
    status: 'open',
    detail: {
      context: 'Guests with significant complaints (broken AC, noise all night) only receive an apology.',
      aiResponse: 'I\'m sorry to hear about the noise. I\'ll notify our maintenance team.',
      humanFeedback: 'Missing action — for major inconveniences, offer a goodwill gesture like a complimentary drink, late checkout, or room credit.',
      proposed: 'Include goodwill gesture options when handling significant complaints.',
      promptDiff: [
        { type: 'context', text: 'When handling major complaints (room issues, noise, broken facilities):' },
        { type: 'add', text: 'After acknowledging the issue, offer a goodwill gesture: complimentary drink, room credit (€25), or free late checkout.' },
        { type: 'add', text: 'Escalate to duty manager if the guest requests compensation beyond standard goodwill gestures.' },
      ]
    }
  },
  {
    id: 'imp-seed-29',
    type: 'Behavior',
    topic: 'Empathy',
    group: 'Complaint handling',
    title: 'Avoid blaming third parties when apologizing',
    count: 4,
    status: 'open',
    detail: {
      context: 'AI deflects responsibility by blaming suppliers, contractors, or other departments.',
      aiResponse: 'I\'m sorry — the cleaning company didn\'t service your room properly today.',
      humanFeedback: 'Wrong tone — never blame third parties. The guest doesn\'t care whose fault it is. Take ownership on behalf of the hotel.',
      proposed: 'Always take ownership when apologizing, regardless of the root cause.',
      promptDiff: [
        { type: 'remove', text: 'Explain what caused the issue so the guest understands.' },
        { type: 'add', text: 'Never blame third parties, suppliers, or other departments. Take full ownership on behalf of the hotel.' },
        { type: 'add', text: 'Example: "I\'m sorry your room wasn\'t up to standard — let me fix this for you right away."' },
      ]
    }
  },
  {
    id: 'imp-seed-30',
    type: 'Behavior',
    topic: 'Empathy',
    group: 'Complaint handling',
    title: 'Use the guest\'s own words when summarizing their issue',
    count: 3,
    status: 'open',
    detail: {
      context: 'AI paraphrases complaints in generic terms, making guests feel unheard.',
      aiResponse: 'I understand you had an issue with your room.',
      humanFeedback: 'Wrong tone — mirror the guest\'s language. If they said "the shower was ice cold", say that, not "an issue with your room".',
      proposed: 'Reflect the guest\'s specific language when acknowledging complaints.',
      promptDiff: [
        { type: 'remove', text: 'Summarize the guest\'s complaint in general terms.' },
        { type: 'add', text: 'Use the guest\'s own words when acknowledging their complaint to show you listened.' },
        { type: 'add', text: 'Example: Guest says "shower was ice cold" → respond with "I\'m sorry the shower was ice cold" not "sorry about the water issue".' },
      ]
    }
  },
  {
    id: 'imp-seed-31',
    type: 'Behavior',
    topic: 'Empathy',
    group: 'Complaint handling',
    title: 'Don\'t minimize complaints with phrases like "I understand but..."',
    count: 8,
    status: 'open',
    detail: {
      context: 'AI uses dismissive transition phrases that undermine the apology.',
      aiResponse: 'I understand your frustration, but our policy states that...',
      humanFeedback: 'Wrong tone — "I understand but" invalidates the acknowledgement. Use "and" instead of "but" after empathy statements.',
      proposed: 'Ban dismissive conjunctions after empathy statements.',
      promptDiff: [
        { type: 'remove', text: 'Acknowledge the issue and explain the policy.' },
        { type: 'add', text: 'Never follow empathy with "but", "however", or "unfortunately". Use "and" or start a new sentence.' },
        { type: 'add', text: 'Example: "I\'m sorry about the wait. Here\'s what I can do for you..." instead of "I\'m sorry but our policy..."' },
      ]
    }
  },
  {
    id: 'imp-seed-24',
    type: 'Behavior',
    topic: 'Follow-up',
    group: 'Upselling',
    title: 'Follow up on unresolved questions after 24 hours',
    count: 3,
    status: 'open',
    detail: {
      context: 'Some guest questions are left without a final answer when info isn\'t immediately available.',
      aiResponse: 'I\'ll check with the team and get back to you.',
      humanFeedback: 'Action missing — AI promises to follow up but never does. Set a reminder to follow up within 24 hours.',
      proposed: 'Create automatic follow-up reminders for pending questions.',
      promptDiff: [
        { type: 'context', text: 'When you can\'t answer a question immediately:' },
        { type: 'add', text: 'Set a 24-hour follow-up reminder in the conversation.' },
        { type: 'add', text: 'If no update is available after 24h, proactively message the guest with a status update.' },
      ]
    }
  },
  {
    id: 'imp-seed-25',
    type: 'Actions',
    topic: 'Conversation Routing',
    group: 'Team assignment',
    title: 'Route billing disputes to Finance team',
    count: 4,
    status: 'open',
    detail: {
      context: 'Guests disputing charges on their bill are routed to General Support who can\'t process refunds.',
      aiResponse: 'Assigned to General Support.',
      humanFeedback: 'Wrong team — billing disputes and refund requests must go to the Finance team who have system access to adjust charges.',
      proposed: 'Route billing and payment-related disputes to the Finance team.',
      promptDiff: [
        { type: 'context', text: 'When routing billing and payment conversations:' },
        { type: 'remove', text: 'Route to General Support queue.' },
        { type: 'add', text: 'Route billing disputes, charge corrections, and refund requests to the Finance team.' },
      ]
    }
  },
  {
    id: 'imp-seed-26',
    type: 'Actions',
    topic: 'Conversation Routing',
    group: 'Priority',
    title: 'Flag conversations with negative sentiment as urgent',
    count: 7,
    status: 'open',
    detail: {
      context: 'Angry or upset guests sit in the normal queue despite clear negative sentiment.',
      aiResponse: 'Assigned to queue with normal priority.',
      humanFeedback: 'Action missing — conversations with strong negative sentiment (anger, disappointment) should be flagged urgent for faster handling.',
      proposed: 'Auto-detect negative sentiment and increase priority.',
      promptDiff: [
        { type: 'context', text: 'When assigning conversation priority:' },
        { type: 'add', text: 'If the guest expresses anger, frustration, or strong disappointment, flag as URGENT priority.' },
        { type: 'add', text: 'Combine with sentiment tags: "sentiment-negative", "sentiment-angry" for reporting.' },
      ]
    }
  },
  {
    id: 'imp-seed-27',
    type: 'Actions',
    topic: 'Tagging',
    group: 'Label accuracy',
    title: 'Auto-tag language of conversation for reporting',
    count: 3,
    status: 'open',
    detail: {
      context: 'Conversations are not tagged by language, making it hard to report on multilingual support needs.',
      aiResponse: 'No language tag applied.',
      humanFeedback: 'Action missing — every conversation should be auto-tagged with the detected language (e.g., "lang-de", "lang-fr") for analytics.',
      proposed: 'Auto-detect and tag conversation language.',
      promptDiff: [
        { type: 'context', text: 'When processing any new conversation:' },
        { type: 'add', text: 'Auto-detect the guest\'s language and apply a language tag (e.g., "lang-en", "lang-de", "lang-nl").' },
        { type: 'add', text: 'Update the tag if the guest switches language mid-conversation.' },
      ]
    }
  },
  {
    id: 'imp-seed-28',
    type: 'Actions',
    topic: 'Escalation Handling',
    group: 'Complaint severity',
    title: 'Notify duty manager for safety-related complaints',
    count: 2,
    status: 'open',
    detail: {
      context: 'Safety-related complaints (broken lock, fire alarm issue, slip hazard) are handled like normal complaints.',
      aiResponse: 'I\'m sorry about the broken door lock. I\'ll notify maintenance.',
      humanFeedback: 'Should have escalated — safety issues must immediately notify the duty manager, not just maintenance.',
      proposed: 'Escalate safety-related complaints directly to the duty manager.',
      promptDiff: [
        { type: 'context', text: 'Escalation rules for safety-related complaints:' },
        { type: 'add', text: 'If the complaint involves safety (broken locks, fire equipment, slip hazards, health risks), immediately escalate to the duty manager.' },
        { type: 'add', text: 'Apply "safety-critical" tag and set priority to URGENT.' },
      ]
    }
  },
];

// Track which conversations have had feedback submitted
const feedbackSubmitted = new Set();

// ══════════════════════════════════
// ══════════════════════════════════
//   ITERATION SWITCHER
// ══════════════════════════════════
const iterSelect = document.getElementById('iteration-select');
if (iterSelect) {
  const params = new URLSearchParams(window.location.search);
  const currentIter = params.get('iteration') || '1';
  iterSelect.value = currentIter;

  iterSelect.addEventListener('change', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('iteration', iterSelect.value);
    window.location.href = url.toString();
  });
}

// ══════════════════════════════════
//   VIEW SWITCHING
// ══════════════════════════════════
const mainEl = document.querySelector('.main');
const snEl = document.querySelector('.sn');
const pageImprove = document.getElementById('page-improve');
const inboxSwitcher = document.getElementById('inbox-switcher');
function showView(viewName) {
  const ifsSidebar = document.getElementById('inbox-folder-sidebar');
  const inboxPage2 = document.getElementById('page-inbox-2');
  const inboxPage3 = document.getElementById('page-inbox-3');
  const activeInboxPage = activeInboxIteration === 3 ? inboxPage3 : inboxPage2;
  if (viewName === 'inbox') {
    mainEl.hidden = true;
    snEl.style.display = 'none';
    if (ifsSidebar) ifsSidebar.style.display = '';
    // Hide all inbox pages, show only the active one
    if (inboxPage2) inboxPage2.hidden = true;
    if (inboxPage3) inboxPage3.hidden = true;
    if (activeInboxPage) activeInboxPage.hidden = false;
    inboxSwitcher.hidden = false;
  } else {
    mainEl.hidden = false;
    snEl.style.display = '';
    if (ifsSidebar) ifsSidebar.style.display = 'none';
    if (inboxPage2) inboxPage2.hidden = true;
    if (inboxPage3) inboxPage3.hidden = true;
    inboxSwitcher.hidden = true;
  }
  // Update icon sidebar active state
  document.querySelectorAll('.si-btn[data-page]').forEach(btn => {
    btn.classList.toggle('si-btn--active', btn.dataset.page === viewName);
  });
}

// Reset prototype button — reload and stay on inbox
document.getElementById('inbox-reset-btn').addEventListener('click', () => {
  const url = new URL(window.location.href);
  url.hash = `inbox-${activeInboxIteration}`;
  window.location.href = url.toString();
  window.location.reload();
});

// On page load, check hash or query param to restore state
(function restoreFromHash() {
  const params = new URLSearchParams(window.location.search);
  const qpInbox = params.get('inbox');
  const qpConv  = params.get('autoconv');
  const hashMatch = window.location.hash.match(/^#inbox-(\d)(?::([^&]+))?/);
  const hashConv = hashMatch && hashMatch[2];
  if (qpInbox || hashMatch) {
    showView('inbox');
    // Don't clear the hash if Figma capture params are present — the capture script needs them
    if (hashMatch && !window.location.hash.includes('figmacapture')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    const convId = qpConv || hashConv;
    if (convId) {
      setTimeout(() => {
        const item = document.querySelector(`[data-conv="${convId}"]`);
        if (item) item.click();
      }, 300);
    }
  } else {
    showView('agent');
  }
})();

function showSubPage(pageId) {
  ['page-tab-placeholder', 'page-results', 'page-improve', 'page-behavior', 'page-scenarios', 'page-configuration', 'page-capabilities'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = (id !== pageId);
  });
  if (pageId === 'page-improve') renderImprovePage();
  if (pageId === 'page-scenarios') renderScenariosPage();
}

// Wire up icon sidebar
document.querySelectorAll('.si-btn[data-page]').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.page));
});

// Wire up tabs in tabs-bar
document.querySelectorAll('.tab[data-tab-target]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tabs-bar .tab').forEach(t => t.classList.remove('tab--active'));
    tab.classList.add('tab--active');
    const target = tab.dataset.tabTarget;
    if (target === 'page-improve') {
      showSubPage('page-improve');
    } else if (target === 'page-behavior') {
      showSubPage('page-behavior');
    } else if (target === 'page-scenarios') {
      showSubPage('page-scenarios');
    } else if (target === 'page-configuration') {
      showSubPage('page-configuration');
    } else if (target === 'page-capabilities') {
      showSubPage('page-capabilities');
    } else {
      showSubPage('page-tab-placeholder');
    }
  });
});

// Show Improve tab by default on load
showSubPage('page-improve');

// ── BEHAVIOR PAGE — Accordion toggles ──
document.querySelectorAll('.behavior-section-header').forEach(header => {
  // Skip static config sections (no accordion behavior)
  if (header.closest('.config-section-static')) return;
  header.addEventListener('click', (e) => {
    // Don't toggle accordion when clicking a toggle switch
    if (e.target.closest('.config-toggle')) return;
    header.closest('.behavior-section').classList.toggle('behavior-section--collapsed');
  });
});

// ── CONFIGURATION — Toggle switches ──
document.querySelectorAll('.config-toggle').forEach(toggle => {
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle.classList.toggle('config-toggle--on');
    // Show/hide associated sub-section
    const subId = toggle.dataset.sub;
    if (subId) {
      const sub = document.getElementById(subId);
      if (sub) sub.hidden = !toggle.classList.contains('config-toggle--on');
    }
  });
});

// ══════════════════════════════════
//   SCENARIOS PAGE
// ══════════════════════════════════
const SCENARIOS = [
  { id: 1, title: 'New scenarre gerg erg erio 2 wr wef', description: 'Empty scenario...', status: 'Active', instructions: '' },
  { id: 2, title: 'New scenario 3', description: 'egetgeg er', status: 'Active', instructions: 'egetgeg er' },
  { id: 3, title: 'New scenario 4', description: 'erg reg erg erg e', status: 'Active', instructions: 'erg reg erg erg e' },
  { id: 4, title: 'New scenario 5', description: 'erg erg erg erg erg erg erg e', status: 'Active', instructions: 'erg erg erg erg erg erg erg e' },
  { id: 5, title: 'New scenario 6', description: 'erg erg erg eg erg erg er', status: 'Active', instructions: 'erg erg erg eg erg erg er' },
  { id: 6, title: 'New scenario 7', description: 'erg erg erg erg er g', status: 'Active', instructions: 'erg erg erg erg er g' },
  { id: 7, title: 'New scenario 8', description: 'weth wgw etg et', status: 'Active', instructions: 'weth wgw etg et' },
];

function renderScenariosPage() {
  const container = document.getElementById('scenarios-list');
  container.innerHTML = SCENARIOS.map(s => `
    <div class="scenario-card" data-scenario-id="${s.id}">
      <div class="scenario-card-content">
        <div class="scenario-card-title">${s.title}</div>
        <div class="scenario-card-desc">${s.description}</div>
      </div>
      <div class="scenario-card-actions">
        <span class="scenario-badge-active">${s.status}</span>
        <button class="scenario-menu-btn">
          <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="3" r="1.25"/><circle cx="8" cy="8" r="1.25"/><circle cx="8" cy="13" r="1.25"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  // Wire up card clicks to open detail
  container.querySelectorAll('.scenario-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.scenario-menu-btn')) return;
      openScenario(Number(card.dataset.scenarioId));
    });
  });
}

function updateScenarioCounter() {
  const textarea = document.getElementById('scenario-detail-textarea');
  const counter = document.getElementById('scenario-detail-counter');
  const len = textarea.value.length;
  counter.textContent = len.toLocaleString() + ' / 5,000';
}

function openScenario(id) {
  const scenario = SCENARIOS.find(s => s.id === id);
  if (!scenario) return;

  document.querySelector('.scenarios-header').hidden = true;
  document.getElementById('scenarios-list').hidden = true;
  const detail = document.getElementById('scenario-detail');
  detail.hidden = false;

  document.getElementById('scenario-detail-title').textContent = scenario.title;
  document.getElementById('scenario-detail-badge').textContent = scenario.status;
  const textarea = document.getElementById('scenario-detail-textarea');
  textarea.value = scenario.instructions;
  updateScenarioCounter();

  // Store current scenario id for saving
  detail.dataset.scenarioId = id;
}

function closeScenario() {
  // Save instructions back to data
  const detail = document.getElementById('scenario-detail');
  const id = Number(detail.dataset.scenarioId);
  const scenario = SCENARIOS.find(s => s.id === id);
  if (scenario) {
    scenario.instructions = document.getElementById('scenario-detail-textarea').value;
  }

  detail.hidden = true;
  document.querySelector('.scenarios-header').hidden = false;
  document.getElementById('scenarios-list').hidden = false;
}

// Wire up back button and counter
document.getElementById('scenario-back-btn').addEventListener('click', closeScenario);
document.getElementById('scenario-detail-textarea').addEventListener('input', updateScenarioCounter);

// ══════════════════════════════════
//   INBOX — CONVERSATION LIST
// ══════════════════════════════════
const CHANNEL_ICONS = {
  Chat: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><path d="M2 3h12v8H4l-2 2V3z"/></svg>',
  Email: '<svg viewBox="0 0 11 9" fill="none" style="width:11px;height:9px"><rect x="0.5" y="0.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.1"/><path d="M0.5 2.5l5 3 5-3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>',
  WhatsApp: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><path d="M8 1.5a6.5 6.5 0 00-5.6 9.8L1.5 14.5l3.2-.9A6.5 6.5 0 108 1.5z"/></svg>',
};

const CHANNEL_ICON_STYLES = {
  Chat: 'background: rgba(77, 82, 86, 0.12); color: var(--grey-600);',
  Email: 'background: color-mix(in srgb, var(--error-500) 18%, transparent); color: var(--error-500);',
  WhatsApp: 'background: rgba(32, 182, 85, 0.16); color: #20b655;',
};

const CHANNEL_LABELS = {
  Chat: 'Chat',
  Email: 'Email channel',
  WhatsApp: 'WhatsApp',
};

function renderConversationList(iterNum) {
  const suffix = iterNum || 1;
  const container = document.getElementById(`inbox-items-${suffix}`);
  const convData = suffix === 3 ? CONVERSATIONS_V2 : CONVERSATIONS;

  container.innerHTML = convData.map(conv => `
    <div class="inbox-conv-item ${conv.unread ? 'inbox-conv-item--unread' : ''}" data-conv="${conv.id}">
      <div class="inbox-conv-card">
        <div class="inbox-conv-header">
          <div class="inbox-conv-channel-icon" style="${CHANNEL_ICON_STYLES[conv.channel] || ''}">${CHANNEL_ICONS[conv.channel] || ''}</div>
          <span class="inbox-conv-name">${conv.customer.name}</span>${conv.useCase ? `<span class="inbox-conv-usecase">${conv.useCase}</span>` : ''}
          <span class="inbox-conv-count">${conv.messages.length}</span>
          <div class="inbox-conv-assignee" style="background:var(--leaf-500);overflow:hidden;padding:0;"><img src="daan.png" alt="Daan" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
        </div>
        <div class="inbox-conv-body">
          <div class="inbox-conv-subject">${conv.subject}</div>
          <div class="inbox-conv-preview">${conv.preview}</div>
          <div class="inbox-conv-meta">
            <span class="inbox-conv-channel-label">${CHANNEL_LABELS[conv.channel] || conv.channel}</span>
            <span class="inbox-conv-time">${conv.lastActivity}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.inbox-conv-item').forEach(item => {
    item.addEventListener('click', () => {
      container.querySelectorAll('.inbox-conv-item').forEach(i => i.classList.remove('inbox-conv-item--active'));
      item.classList.add('inbox-conv-item--active');
      item.classList.remove('inbox-conv-item--unread');
      renderThread(item.dataset.conv, suffix);
    });
  });
}

// ══════════════════════════════════
//   INBOX — THREAD RENDERING
// ══════════════════════════════════
let activeConvId = null;
let activeMsgId = null;

function sendAiDraftAsBubble(text, mode, convId, iterNum) {
  const suffix = iterNum || 1;
  // mode: 'approved' or 'edited'
  const label = mode === 'edited'
    ? 'Message from AI-licia, approved and edited by Daan'
    : 'Message from AI-licia, approved by Daan';

  const container = document.getElementById(`inbox-thread-messages-${suffix}`);
  const draftSlot = document.getElementById(`inbox-ai-draft-slot-${suffix}`);
  const composer = document.getElementById(`inbox-composer-${suffix}`);

  // Animate draft slot fading out
  draftSlot.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  draftSlot.style.opacity = '0';
  draftSlot.style.transform = 'translateY(8px)';

  setTimeout(() => {
    // Persist sent message to conversation data
    const conv = CONVERSATIONS.find(c => c.id === convId);
    if (conv) {
      conv._draftSent = true;
      conv._draftSentMode = mode;
      if (!conv.sentMessages) conv.sentMessages = [];
      conv.sentMessages.push({ text, mode, time: 'Just now' });
    }

    // Hide draft slot, show composer
    draftSlot.hidden = true;
    draftSlot.innerHTML = '';
    draftSlot.style.opacity = '';
    draftSlot.style.transform = '';
    draftSlot.style.transition = '';
    document.getElementById(`composer-textarea-${suffix}`).value = '';

    if (suffix === 2) {
      // Inbox 2: hide draft panel, show edit state with empty textarea
      const draftPanel = document.getElementById('composer-v2-draft-2');
      const editPanel = document.getElementById('composer-v2-edit-state-2');
      const feedbackStrip = editPanel?.querySelector('.composer-v2-feedback-strip');
      if (draftPanel) draftPanel.hidden = true;
      if (editPanel) editPanel.hidden = false;
      if (feedbackStrip) feedbackStrip.hidden = true;
      composer.hidden = false;
      window._aiEditMode = null;
    } else {
      composer.hidden = false;
    }

    const hasFeedback = feedbackSubmitted.has(convId);

    // Append sent bubble to messages
    const bubble = document.createElement('div');
    bubble.className = 'inbox-msg inbox-msg--agent inbox-msg--ai-sent';
    bubble.style.opacity = '0';
    bubble.style.transform = 'translateY(10px)';
    bubble.innerHTML = `
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--agent">${text.replace(/\n/g, '<br>')}
          <div class="inbox-msg-avatar inbox-msg-avatar--agent">S</div>
        </div>
      </div>
      <div class="inbox-msg-footer inbox-msg-footer--agent">
        <span class="inbox-msg-name">Daan</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">Just now</span>
        <a href="#" class="inbox-msg-translate"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M2 4h6M5 2v2M3 4c.8 2 2.5 3.5 4 4.5M7 4c-.8 2-2.5 3.5-4 4.5"/><path d="M9 13l2.5-6 2.5 6M10 11.5h3"/></svg> Translate</a>
        <a href="#" class="inbox-msg-approval-feedback" data-conv-id="${convId}">Give AI feedback</a>
      </div>`;
    // Insert bubble before composer so composer stays at the bottom
    if (suffix === 2 && container.contains(composer)) {
      container.insertBefore(bubble, composer);
    } else {
      container.appendChild(bubble);
    }

    // Bind feedback link on the sent bubble
    bubble.querySelector('.inbox-msg-approval-feedback')?.addEventListener('click', (e) => {
      e.preventDefault();
      openFeedbackModal(convId, 'message');
    });

    // Animate bubble appearing
    requestAnimationFrame(() => {
      bubble.style.transition = 'all 0.3s ease';
      bubble.style.opacity = '1';
      bubble.style.transform = 'translateY(0)';
    });

    // Scroll to the new bubble
    container.scrollTop = container.scrollHeight;

    // Clear edit mode
    window._aiEditMode = null;
  }, 300);
}

function renderThread(convId, iterNum) {
  const suffix = iterNum || 1;
  activeConvId = convId;
  window._aiEditMode = null;
  const convData = suffix === 3 ? CONVERSATIONS_V2 : CONVERSATIONS;
  const conv = convData.find(c => c.id === convId);
  if (!conv) return;

  // Header
  document.getElementById(`inbox-thread-header-${suffix}`).innerHTML = `
    <div class="inbox-thread-header-left">
      <div class="inbox-thread-subject">${conv.subject}</div>
      <div class="inbox-thread-meta">${conv.channel} &middot; ${conv.customer.name}</div>
    </div>
  `;

  // Messages — AI draft goes to the bottom slot, not in thread
  const container = document.getElementById(`inbox-thread-messages-${suffix}`);
  const draftSlot = document.getElementById(`inbox-ai-draft-slot-${suffix}`);
  const composer = document.getElementById(`inbox-composer-${suffix}`);
  const parts = [];
  let aiDraftMsg = null;

  conv.messages.forEach((msg) => {
    if (msg.role === 'customer') {
      parts.push(renderCustomerMsg(conv.customer, msg));
    } else if (msg.role === 'ai-draft') {
      aiDraftMsg = msg;
      // Action logs still go in the messages area
      if (conv.actions) {
        conv.actions.forEach(act => {
          parts.push(renderActionLog(act, convId));
        });
      }
    }
  });

  // Detach composer before wiping container so it is never destroyed by innerHTML
  if (composer && container.contains(composer)) container.removeChild(composer);

  container.innerHTML = parts.join('');
  container.appendChild(composer);

  // Populate composer fields (used by both draft slot and composer)
  document.getElementById(`composer-to-${suffix}`).textContent = `${conv.customer.name} (${conv.customer.name.toLowerCase().replace(/\s/g, '.')}@email.com)`;
  document.getElementById(`composer-subject-${suffix}`).textContent = conv.subject;
  // For inbox-2, preserve textarea if feedback was just submitted (user may be editing)
  const hasFeedbackAlready = suffix === 2 && feedbackSubmitted.has(convId);
  if (!hasFeedbackAlready) {
    document.getElementById(`composer-textarea-${suffix}`).value = '';
  }

  if (aiDraftMsg) {
    // ── AI Draft panel with Approve & Send / Edit ──
    let v2AiDraftMsg = null;

    // Render customer messages + action logs
    const v2Parts = [];
    conv.messages.forEach((msg) => {
      if (msg.role === 'customer') {
        v2Parts.push(renderCustomerMsg(conv.customer, msg));
      } else if (msg.role === 'ai-draft') {
        v2AiDraftMsg = msg;
        if (conv.actions && (!conv.pendingActions || conv.pendingActions.length === 0)) {
          conv.actions.forEach(act => {
            v2Parts.push(renderActionLog(act, convId));
          });
        }
      }
    });

    // Render persisted sent messages
    if (conv.sentMessages) {
      conv.sentMessages.forEach(sent => {
        const sentLabel = sent.mode === 'edited'
          ? 'Message from AI-licia, approved and edited by Daan'
          : 'Message from AI-licia, approved by Daan';
        v2Parts.push(`
          <div class="inbox-msg inbox-msg--agent inbox-msg--ai-sent">
            <div class="inbox-msg-card">
              <div class="inbox-msg-bubble inbox-msg-bubble--agent">${sent.text.replace(/\n/g, '<br>')}
                <div class="inbox-msg-avatar inbox-msg-avatar--agent"><img src="daan.png" alt="Daan" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
              </div>
            </div>
            <div class="inbox-msg-footer inbox-msg-footer--agent">
              <span class="inbox-msg-name">Daan</span>
              <span class="inbox-msg-sep">-</span>
              <span class="inbox-msg-time">${sent.time}</span>
              <a href="#" class="inbox-msg-approval-feedback" data-conv-id="${convId}">Give AI feedback</a>
            </div>
          </div>`);
      });
    }

    container.innerHTML = v2Parts.join('');

    // Append pending action cards
    if (conv.pendingActions && conv.pendingActions.length > 0) {
      const pContainer = document.createElement('div');
      pContainer.className = 'inbox-pending-container';
      pContainer.id = `inbox-pending-${convId}`;
      conv.pendingActions.forEach(act => {
        pContainer.insertAdjacentHTML('beforeend', renderPendingAction(act, convId));
      });
      container.appendChild(pContainer);
      // Wire approve / stop buttons
      pContainer.querySelectorAll('.inbox-pa-row').forEach(row => {
        const actionId = row.dataset.actionId;
        row.querySelector('.inbox-pa-approve-btn').addEventListener('click', () => approvePendingAction(actionId, convId));
        row.querySelector('.inbox-pa-dismiss-btn').addEventListener('click', () => stopPendingAction(actionId, convId, row));
      });
    }

    // Re-append composer inside thread container
    container.appendChild(composer);

    // Wire feedback links on re-rendered sent bubbles
    container.querySelectorAll('.inbox-msg-approval-feedback').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openFeedbackModal(link.dataset.convId, 'message');
      });
    });

    // Update To: field
    document.getElementById(`composer-to-${suffix}`).textContent =
      `${conv.customer.name} (${conv.customer.name.toLowerCase().replace(/\s/g, '.')}@email.com)`;

    draftSlot.hidden = true;
    draftSlot.innerHTML = '';
    composer.hidden = false;

    const draftPanel       = document.getElementById('composer-v2-draft-2');
    const editPanel        = document.getElementById('composer-v2-edit-state-2');
    const draftBody        = document.getElementById('composer-v2-draft-body-2');
    const feedbackTrigger  = document.getElementById('composer-v2-feedback-trigger-2');
    const feedbackStrip    = editPanel?.querySelector('.composer-v2-feedback-strip');

    // Reset state on every conversation load

    const hasFeedback = feedbackSubmitted.has(convId);

    if (conv._draftSent) {
      // Draft was already sent — hide draft panel, composer stays visible
      if (draftPanel) draftPanel.hidden = true;
    } else if (hasFeedback) {
      // Post-feedback: stay in edit mode, hide feedback trigger button
      if (draftPanel) draftPanel.hidden = true;
      if (editPanel)  editPanel.hidden  = false;
      if (feedbackStrip) feedbackStrip.hidden = false;
      if (feedbackTrigger) feedbackTrigger.hidden = true;
      const hintEl = editPanel?.querySelector('.composer-v2-feedback-hint');
      if (hintEl) { const t = hintEl.querySelector('.composer-v2-feedback-hint-text'); if (t) t.textContent = 'Thanks for your feedback. AI-Licia will learn from your edits.'; }
      const ta = document.getElementById('composer-textarea-2');
      if (ta && v2AiDraftMsg) ta.value = v2AiDraftMsg.text;
    } else {
      // Default: show draft panel with Approve & Send / Edit, composer always visible below
      if (draftPanel) { draftPanel.hidden = false; draftPanel.style.opacity = '1'; }
      if (draftBody && v2AiDraftMsg) {
        draftBody.innerHTML = v2AiDraftMsg.text.replace(/\n/g, '<br>');
      }
    }

    // Wire Use reply — paste draft into composer for editing
    const approveBtn = document.getElementById('composer-v2-approve-2');
    if (approveBtn) {
      const freshBtn = approveBtn.cloneNode(true);
      approveBtn.parentNode.replaceChild(freshBtn, approveBtn);
      freshBtn.addEventListener('click', () => {
        if (draftPanel) { draftPanel.style.opacity = '0'; setTimeout(() => { draftPanel.hidden = true; }, 150); }
        if (editPanel)  editPanel.hidden = false;
        const ta = document.getElementById('composer-textarea-2');
        if (ta && v2AiDraftMsg) {
          const fullText = v2AiDraftMsg.text;
          const existing = ta.value;
          const prefix = existing ? existing + '\n\n' : '';
          ta.value = prefix;
          ta.focus();
          let i = 0;
          const interval = setInterval(() => {
            if (i < fullText.length) {
              ta.value += fullText[i++];
            } else {
              clearInterval(interval);
              if (!existing) {
                ta.setSelectionRange(0, 0);
                ta.scrollTop = 0;
              }
            }
          }, 6);
        }
        window._aiEditMode = { convId, msgId: v2AiDraftMsg?.id, iterNum: suffix };
      });
    }

    // Wire expand/collapse toggle on the draft body
    const expandBtn = draftPanel?.querySelector('.composer-v2-draft-expand');
    if (expandBtn) {
      const freshExpand = expandBtn.cloneNode(true);
      expandBtn.parentNode.replaceChild(freshExpand, expandBtn);
      freshExpand.addEventListener('click', () => {
        const isExpanded = draftPanel.classList.toggle('composer-v2-draft--expanded');
        freshExpand.title = isExpanded ? 'Collapse' : 'Expand';
        freshExpand.querySelector('svg').innerHTML = isExpanded
          ? '<path d="M14 6h-4V2M2 10h4v4"/>'
          : '<path d="M10 2h4v4M6 14H2v-4"/>';
      });
    }

    // Wire Ignore — trigger feedback modal
    const editBtn = document.getElementById('composer-v2-edit-btn-2');
    if (editBtn) {
      const freshEdit = editBtn.cloneNode(true);
      editBtn.parentNode.replaceChild(freshEdit, editBtn);
      freshEdit.addEventListener('click', () => {
        if (draftPanel) { draftPanel.style.opacity = '0'; setTimeout(() => { draftPanel.hidden = true; }, 150); }
        if (editPanel) editPanel.hidden = false;
        openFeedbackModal(convId, 'message');
        feedbackOverlay.dataset.source = 'ignore';
      });
    }

    // Wire feedback trigger
    if (feedbackTrigger) {
      const freshFb = feedbackTrigger.cloneNode(true);
      feedbackTrigger.parentNode.replaceChild(freshFb, feedbackTrigger);
      freshFb.addEventListener('click', () => openFeedbackModal(convId, 'message'));
    }

    // Wire feedback strip close button
    const feedbackClose = document.getElementById('composer-v2-feedback-close-2');
    if (feedbackClose) {
      const freshClose = feedbackClose.cloneNode(true);
      feedbackClose.parentNode.replaceChild(freshClose, feedbackClose);
      freshClose.addEventListener('click', () => { if (feedbackStrip) feedbackStrip.hidden = true; });
    }

  } else {
    // No AI draft — show normal composer
    draftSlot.hidden = true;
    draftSlot.innerHTML = '';
    composer.hidden = false;
  }

  // Composer Send button — handle edit mode
  const sendBtn = document.getElementById(`composer-send-btn-${suffix}`);
  const newSendBtn = sendBtn.cloneNode(true);
  sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
  newSendBtn.addEventListener('click', () => {
    if (window._aiEditMode) {
      const textarea = document.getElementById(`composer-textarea-${window._aiEditMode.iterNum}`);
      const editedText = textarea.value.trim();
      if (editedText) {
        sendAiDraftAsBubble(editedText, 'edited', window._aiEditMode.convId, window._aiEditMode.iterNum);
      }
    } else if (suffix === 3) {
      const textarea = document.getElementById(`composer-textarea-${suffix}`);
      const text = textarea?.value.trim();
      if (!text) return;

      const msgContainer = document.getElementById(`inbox-thread-messages-${suffix}`);
      const composerEl = document.getElementById(`inbox-composer-${suffix}`);

      // Create agent bubble and insert before composer
      const bubble = document.createElement('div');
      bubble.className = 'inbox-msg inbox-msg--agent inbox-msg--ai-sent';
      bubble.style.opacity = '0';
      bubble.style.transform = 'translateY(10px)';
      bubble.innerHTML = `
        <div class="inbox-msg-card">
          <div class="inbox-msg-bubble inbox-msg-bubble--agent">${text.replace(/\n/g, '<br>')}
            <div class="inbox-msg-avatar inbox-msg-avatar--agent">
              <img src="daan.png" alt="Daan" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
            </div>
          </div>
        </div>
        <div class="inbox-msg-footer inbox-msg-footer--agent">
          <span class="inbox-msg-name">Daan</span>
          <span class="inbox-msg-sep">-</span>
          <span class="inbox-msg-time">Just now</span>
        </div>`;
      msgContainer.insertBefore(bubble, composerEl);
      requestAnimationFrame(() => {
        bubble.style.transition = 'opacity 0.3s, transform 0.3s';
        bubble.style.opacity = '1';
        bubble.style.transform = 'translateY(0)';
      });

      // Clear textarea
      textarea.value = '';

      // If the draft panel is visible, morph it to waiting state
      const draftPanel = document.getElementById(`composer-v2-draft-${suffix}`);
      const draftBody = document.getElementById(`composer-v2-draft-body-${suffix}`);
      if (draftPanel && draftBody && !draftPanel.hidden) {
        const hdr = draftPanel.querySelector('.composer-v2-draft-header-right');
        // Buttons slide out
        if (hdr && hdr.style.visibility !== 'hidden') {
          hdr.style.transition = 'opacity 0.18s cubic-bezier(0.4,0,0.2,1), transform 0.22s cubic-bezier(0.16,1,0.3,1)';
          hdr.style.opacity = '0';
          hdr.style.transform = 'translateX(6px)';
          setTimeout(() => { hdr.style.visibility = 'hidden'; hdr.style.transform = ''; }, 180);
        }
        // Body collapses
        draftBody.classList.remove('composer-v2-draft-body--open');
        setTimeout(() => { draftBody.innerHTML = ''; }, 380);
        // Label morphs
        const dots = draftPanel.querySelector('.composer-v2-header-dots');
        if (dots) { dots.style.opacity = '0'; setTimeout(() => dots.remove(), 150); }
        const labelEl = draftPanel.querySelector('.composer-v2-draft-label');
        if (labelEl) {
          labelEl.style.opacity = '0';
          setTimeout(() => { labelEl.textContent = 'on standby'; labelEl.style.opacity = '1'; }, 150);
        }
      }

      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
  });


  // V2 flows
  if (suffix === 3 && convId === 'v2-conv-1') {
    runV2ReplyFlow(convId, suffix);
  } else if (suffix === 3 && convId === 'v2-conv-2') {
    runV2EscalationFlow(convId, suffix);
  } else if (suffix === 3 && convId === 'v2-conv-3') {
    runV2FedericoFlow(convId, suffix);
  } else if (suffix === 3 && convId === 'v2-conv-4') {
    runV2PeopleTeamFlow(convId, suffix);
  } else if (suffix === 3 && convId === 'v2-conv-5') {
    runV2CloseFlow(convId, suffix);
  } else if (suffix === 3 && convId === 'v2-conv-6') {
    runV2LabelFlow(convId, suffix);
  } else if (suffix === 3 && convId === 'v2-conv-7') {
    runV2BarryFlow(convId, suffix);
  }

  // Defer scroll until after layout so offsetTop values are correct
  requestAnimationFrame(() => {
    const pContainer = container.querySelector('.inbox-pending-container');
    if (pContainer) {
      container.scrollTop = Math.max(0, pContainer.offsetTop - container.offsetTop - 20);
    } else {
      container.scrollTop = container.scrollHeight;
    }
  });
}

// ══════════════════════════════════
//   V2 SHARED ANIMATION HELPERS
// ══════════════════════════════════
function v2PanelEnter(panel) {
  // No-op when panel is already visible — prevents flicker when the panel
  // lives continuously on screen in a minimised/standby state.
  const alreadyVisible = !panel.hidden && panel.style.opacity !== '0';
  if (alreadyVisible) return;
  panel.style.opacity = '0';
  panel.style.transform = 'translateY(10px)';
  panel.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
  }));
}
// Instead of hiding the panel, morph it into the "on standby" resting state.
// The AI-licia indicator must always remain visible in a conversation.
function v2PanelExit(panel, cb) {
  const body = panel.querySelector('.composer-v2-draft-body');
  const hdr  = panel.querySelector('.composer-v2-draft-header-right');
  if (body) body.classList.remove('composer-v2-draft-body--open');
  if (hdr && hdr.style.visibility !== 'hidden') v2ButtonsExit(hdr);
  v2SetLabel(panel, 'on standby', false);
  panel.hidden = false;
  panel.style.opacity = '1';
  panel.style.transform = '';
  setTimeout(() => {
    if (body) body.innerHTML = '';
    if (cb) cb();
  }, 400);
}
// Truly hide the panel — used when the conversation is handed over to a
// specific human (e.g. Federico). AI-licia steps aside entirely.
function v2PanelHide(panel, cb) {
  panel.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
  panel.style.opacity = '0';
  panel.style.transform = 'translateY(6px)';
  setTimeout(() => {
    panel.hidden = true;
    panel.style.transform = '';
    panel.style.transition = '';
    if (cb) cb();
  }, 220);
}
function v2BodyOpen(body, html) {
  body.innerHTML = html;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    body.classList.add('composer-v2-draft-body--open');
  }));
}
function v2BodyClose(body, cb) {
  body.classList.remove('composer-v2-draft-body--open');
  setTimeout(() => { body.innerHTML = ''; if (cb) cb(); }, 380);
}
function v2SetLabel(panel, newText, showDots) {
  const labelEl = panel.querySelector('.composer-v2-draft-label');
  const existingDots = panel.querySelector('.composer-v2-header-dots');
  if (existingDots) { existingDots.style.opacity = '0'; setTimeout(() => existingDots.remove(), 150); }
  if (!labelEl) return;
  labelEl.style.opacity = '0';
  setTimeout(() => {
    labelEl.textContent = newText;
    labelEl.style.opacity = '1';
    if (showDots) {
      const dots = document.createElement('span');
      dots.className = 'composer-v2-header-dots';
      dots.innerHTML = '<span></span><span></span><span></span>';
      dots.style.opacity = '0';
      labelEl.insertAdjacentElement('afterend', dots);
      requestAnimationFrame(() => { dots.style.opacity = '1'; });
    }
  }, 150);
}
function v2ButtonsEnter(hdr) {
  hdr.style.opacity = '0';
  hdr.style.transform = 'translateX(10px)';
  hdr.style.visibility = 'visible';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    hdr.style.opacity = '1';
    hdr.style.transform = 'translateX(0)';
  }));
}
function v2ButtonsExit(hdr, cb) {
  hdr.style.opacity = '0';
  hdr.style.transform = 'translateX(6px)';
  setTimeout(() => { hdr.style.visibility = 'hidden'; hdr.style.transform = ''; if (cb) cb(); }, 180);
}
function v2PanelRest(panel) {
  const body = panel.querySelector('.composer-v2-draft-body');
  const hdr  = panel.querySelector('.composer-v2-draft-header-right');
  if (body) {
    body.classList.remove('composer-v2-draft-body--open');
    setTimeout(() => { body.innerHTML = ''; }, 380);
  }
  if (hdr && hdr.style.visibility !== 'hidden') v2ButtonsExit(hdr);
  v2SetLabel(panel, 'on standby', false);
  panel.hidden = false;
  panel.style.opacity = '1';
  panel.style.transform = '';
}

// Shows panel instantly in "response preview" state — no animation delay
function v2ShowPreloaded(panel, body, html) {
  panel.hidden = false;
  panel.style.opacity = '1';
  panel.style.transform = '';
  panel.style.transition = '';
  const labelEl = panel.querySelector('.composer-v2-draft-label');
  if (labelEl) labelEl.textContent = 'response preview';
  panel.querySelector('.composer-v2-header-dots')?.remove();
  if (html && body) {
    body.innerHTML = html;
    body.classList.add('composer-v2-draft-body--open');
  }
}

// Replace animation — runs when a new customer message arrives while preloaded
// draft is showing. Buttons exit → body closes → "composing a reply ●●●".
// cb fires at ~1200ms so caller can advance to the next state.
function v2ReplaceDraft(panel, body, cb) {
  const hdr = panel.querySelector('.composer-v2-draft-header-right');
  if (hdr && hdr.style.visibility !== 'hidden') v2ButtonsExit(hdr);
  setTimeout(() => v2BodyClose(body), 180);
  setTimeout(() => v2SetLabel(panel, 'composing a reply', true), 600);
  setTimeout(() => { if (cb) cb(); }, 1200);
}

// ── Dismiss banner (shown instead of silently hiding panel on minus click) ──
function showDismissBanner({ panel, suffix, msgContainer, composer }) {
  // Fade + hide panel (reversible — innerHTML stays intact for Undo)
  panel.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  panel.style.opacity = '0';
  panel.style.transform = 'translateY(6px)';
  setTimeout(() => {
    panel.hidden = true;
    panel.style.transform = '';
    panel.style.transition = '';
  }, 220);

  // Remove any stale banner for this suffix
  document.getElementById(`v2-dismiss-banner-${suffix}`)?.remove();

  const banner = document.createElement('div');
  banner.id = `v2-dismiss-banner-${suffix}`;
  banner.className = 'inbox-v2-dismiss-banner';
  banner.style.cssText = 'opacity:0;transform:translateY(6px)';
  banner.innerHTML = `
    <div class="inbox-v2-dismiss-banner-left">
      <span class="inbox-v2-dismiss-icon">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M4 8h8"/>
        </svg>
      </span>
      <span class="inbox-v2-dismiss-msg"><strong>Draft ignored.</strong> We'll note this didn't work for you.</span>
    </div>
    <div class="inbox-v2-dismiss-banner-right">
      <span class="inbox-v2-dismiss-countdown" id="v2-dismiss-cd-${suffix}">undo in 8s</span>
      <button class="inbox-v2-dismiss-undo" id="v2-dismiss-undo-${suffix}">Undo</button>
    </div>`;

  msgContainer.insertBefore(banner, composer);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    banner.style.transition = 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)';
    banner.style.opacity = '1';
    banner.style.transform = 'translateY(0)';
  }));

  // Countdown — ticks every second, auto-dismisses at 0
  let remaining = 8;
  const interval = setInterval(() => {
    remaining--;
    const cdEl = document.getElementById(`v2-dismiss-cd-${suffix}`);
    if (cdEl) cdEl.textContent = remaining > 0 ? `undo in ${remaining}s` : '';
    if (remaining <= 0) {
      clearInterval(interval);
      banner.style.transition = 'opacity 0.3s ease';
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 320);
    }
  }, 1000);

  // Undo — restore panel without rebuilding
  document.getElementById(`v2-dismiss-undo-${suffix}`)?.addEventListener('click', () => {
    clearInterval(interval);
    banner.style.transition = 'opacity 0.18s ease';
    banner.style.opacity = '0';
    setTimeout(() => {
      banner.remove();
      panel.hidden = false;
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(6px)';
      panel.style.transition = 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      }));
      setTimeout(() => { panel.style.opacity = ''; panel.style.transform = ''; panel.style.transition = ''; }, 240);
    }, 200);
  }, { once: true });
}

// ── Sent feedback banner (green = perfect, purple = edited) ──

// ══════════════════════════════════
//   V2 REPLY FLOW (Maria Santos)
// ══════════════════════════════════
function runV2ReplyFlow(convId, suffix) {
  const convData = suffix === 3 ? CONVERSATIONS_V2 : CONVERSATIONS;
  const conv = convData.find(c => c.id === convId);
  if (!conv || suffix !== 3) return;

  const draftPanel = document.getElementById(`composer-v2-draft-${suffix}`);
  const draftBody = document.getElementById(`composer-v2-draft-body-${suffix}`);
  const composer = document.getElementById(`inbox-composer-${suffix}`);
  const container = document.getElementById(`inbox-thread-messages-${suffix}`);
  const v2AiDraftMsg = conv.messages.find(m => m.role === 'ai-draft');
  if (!draftPanel || !v2AiDraftMsg) return;

  // Clear any previous timers
  if (window._v2ReplyTimers)      window._v2ReplyTimers.forEach(t => clearTimeout(t));
  window._v2ReplyTimers = [];
  if (window._v2EscTimers)        window._v2EscTimers.forEach(clearTimeout);
  window._v2EscTimers = [];
  if (window._v2FedericoTimers)   window._v2FedericoTimers.forEach(clearTimeout);
  if (window._v2PeopleTeamTimers) window._v2PeopleTeamTimers.forEach(clearTimeout);
  if (window._v2CloseTimers)      window._v2CloseTimers.forEach(clearTimeout);
  if (window._v2LabelTimers)      window._v2LabelTimers.forEach(clearTimeout);
  if (window._v2BarryTimers)      window._v2BarryTimers.forEach(clearTimeout);

  // Track follow-up index
  if (!conv._followUpIndex) conv._followUpIndex = 0;

  // Bind module-level helpers to this flow's panel/body
  const transitionLabel = (t, d) => v2SetLabel(draftPanel, t, d);
  const panelEnter  = ()       => v2PanelEnter(draftPanel);
  const panelExit   = (cb)     => v2PanelExit(draftPanel, cb);
  const bodyOpen    = (html)   => v2BodyOpen(draftBody, html);
  const bodyClose   = (cb)     => v2BodyClose(draftBody, cb);
  const buttonsEnter = (hdr)   => v2ButtonsEnter(hdr);
  const buttonsExit  = (hdr, cb) => v2ButtonsExit(hdr, cb);

  // ── Main flow ────────────────────────────────────────────────────────

  // Button setup — shared between preloaded path and animated path
  function wireReplyButtons(draftText) {
    const headerRight = draftPanel.querySelector('.composer-v2-draft-header-right');
    if (!headerRight) return;
    headerRight.innerHTML = `
      <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
      </button>
      <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
        Send
        <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
      </button>
      <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
      </button>`;
    v2ButtonsEnter(headerRight);
    window._v2CopiedFlag = false;

    document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
      window._v2CopiedFlag = true;
      navigator.clipboard.writeText(draftText);
      const btn = e.currentTarget;
      btn.querySelector('.copy-tooltip')?.remove();
      const tip = document.createElement('span');
      tip.className = 'copy-tooltip';
      tip.textContent = 'Copied';
      btn.appendChild(tip);
      requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
      setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
    });

    document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', () => {
      showDismissBanner({ panel: draftPanel, suffix, msgContainer: container, composer });
    });

    document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', () => {
      const _wasCopied = !!window._v2CopiedFlag;
      window._v2CopiedFlag = false;
      const msgContainer = document.getElementById(`inbox-thread-messages-${suffix}`);
      const bubble = document.createElement('div');
      bubble.className = 'inbox-msg inbox-msg--agent inbox-msg--ai-sent';
      bubble.style.opacity = '0';
      bubble.style.transform = 'translateY(10px)';
      bubble.innerHTML = `
        <div class="inbox-msg-card">
          <div class="inbox-msg-bubble inbox-msg-bubble--agent">${draftText.replace(/\n/g, '<br>')}
            <div class="inbox-msg-avatar inbox-msg-avatar--agent"><img src="daan.png" alt="Daan" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
          </div>
        </div>
        <div class="inbox-msg-footer inbox-msg-footer--agent">
          <span class="inbox-msg-name">Daan</span>
          <span class="inbox-msg-sep">-</span>
          <span class="inbox-msg-time">Just now</span>
        </div>`;
      msgContainer.insertBefore(bubble, composer);
      requestAnimationFrame(() => {
        bubble.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
        bubble.style.opacity = '1';
        bubble.style.transform = 'translateY(0)';
      });
      buttonsExit(headerRight, () => {
        bodyClose();
        transitionLabel(_wasCopied ? 'your edits logged as feedback' : 'message sent', false);
      });
      setTimeout(() => transitionLabel('on standby', false), 4000);
      msgContainer.scrollTop = msgContainer.scrollHeight;

      const followUp = conv._followUps && conv._followUps[conv._followUpIndex];
      if (followUp) {
        conv._followUpIndex++;
        const t3 = setTimeout(() => {
          const custBubble = document.createElement('div');
          custBubble.className = 'inbox-msg inbox-msg--customer';
          custBubble.style.opacity = '0';
          custBubble.style.transform = 'translateY(10px)';
          custBubble.innerHTML = `
            <div class="inbox-msg-card">
              <div class="inbox-msg-bubble inbox-msg-bubble--customer">${followUp.customer.text.replace(/\n/g, '<br>')}
                <div class="inbox-msg-avatar inbox-msg-avatar--customer">${conv.customer.initials}</div>
              </div>
            </div>
            <div class="inbox-msg-footer">
              <span class="inbox-msg-name">${conv.customer.name}</span>
              <span class="inbox-msg-sep">-</span>
              <span class="inbox-msg-time">${followUp.customer.time}</span>
            </div>`;
          msgContainer.insertBefore(custBubble, composer);
          requestAnimationFrame(() => {
            custBubble.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
            custBubble.style.opacity = '1';
            custBubble.style.transform = 'translateY(0)';
          });
          msgContainer.scrollTop = msgContainer.scrollHeight;
          panelExit(() => startTypingToDraftFlow(followUp.draft.text, 0));
        }, 10000);
        window._v2ReplyTimers.push(t3);
      }
    });
  }

  function startTypingToDraftFlow(draftText, delayStart) {
    delayStart = delayStart || 0;

    // Preloaded path — show draft instantly on first open
    if (conv._draftReadyForPreload) {
      conv._draftReadyForPreload = false;
      if (composer) composer.hidden = false;
      v2ShowPreloaded(draftPanel, draftBody, draftText.replace(/\n/g, '<br>'));
      wireReplyButtons(draftText);
      return;
    }

    // Step 1: Keep panel visible (in standby), clear previous draft content
    draftBody.classList.remove('composer-v2-draft-body--open');
    draftBody.innerHTML = '';
    const hdr0 = draftPanel.querySelector('.composer-v2-draft-header-right');
    if (hdr0) { hdr0.style.visibility = 'hidden'; hdr0.style.opacity = '1'; hdr0.style.transform = ''; }
    if (composer) composer.hidden = false;
    draftPanel.hidden = false;
    draftPanel.style.opacity = '1';
    draftPanel.style.transform = '';

    // Step 2: Panel slides in — "composing a reply ●●●"
    const t1 = setTimeout(() => {
      panelEnter();
      transitionLabel('composing a reply', true);
      draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 1000 + delayStart);
    window._v2ReplyTimers.push(t1);

    // Step 3: Label morphs to "response preview", body expands, buttons slide in
    const t2 = setTimeout(() => {
      transitionLabel('response preview', false);

      setTimeout(() => {
        bodyOpen(draftText.replace(/\n/g, '<br>'));
        draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => wireReplyButtons(draftText), 80);
      }, 180);
    }, 3000 + delayStart);
    window._v2ReplyTimers.push(t2);
  }

  // Kick off the flow
  startTypingToDraftFlow(v2AiDraftMsg.text, 0);
}

// ══════════════════════════════════
//   V2 ESCALATION FLOW (James Porter)
// ══════════════════════════════════
function runV2EscalationFlow(convId, suffix) {
  const conv = CONVERSATIONS_V2.find(c => c.id === convId);
  if (!conv || suffix !== 3) return;

  const draftPanel   = document.getElementById(`composer-v2-draft-${suffix}`);
  const draftBody    = document.getElementById(`composer-v2-draft-body-${suffix}`);
  const composer     = document.getElementById(`inbox-composer-${suffix}`);
  const msgContainer = document.getElementById(`inbox-thread-messages-${suffix}`);
  const secondMsg = conv._escalation?.followUp;
  if (!draftPanel || !secondMsg) return;

  if (window._v2EscTimers)        window._v2EscTimers.forEach(clearTimeout);
  window._v2EscTimers = [];
  if (window._v2ReplyTimers)      window._v2ReplyTimers.forEach(clearTimeout);
  window._v2ReplyTimers = [];
  if (window._v2FedericoTimers)   window._v2FedericoTimers.forEach(clearTimeout);
  if (window._v2PeopleTeamTimers) window._v2PeopleTeamTimers.forEach(clearTimeout);
  if (window._v2CloseTimers)      window._v2CloseTimers.forEach(clearTimeout);
  if (window._v2LabelTimers)      window._v2LabelTimers.forEach(clearTimeout);
  if (window._v2BarryTimers)      window._v2BarryTimers.forEach(clearTimeout);

  // Reset panel state — keep visible in standby (AI-licia presence persists)
  draftPanel.hidden = false;
  draftPanel.style.opacity = '1';
  draftPanel.style.transform = '';
  draftBody.classList.remove('composer-v2-draft-body--open');
  draftBody.innerHTML = '';
  const hdr0 = draftPanel.querySelector('.composer-v2-draft-header-right');
  if (hdr0) { hdr0.style.visibility = 'hidden'; hdr0.style.opacity = '1'; hdr0.style.transform = ''; }
  if (composer) composer.hidden = false;

  // Helper: slide in James's frustration bubble
  function insertFrustrationBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'inbox-msg inbox-msg--customer';
    bubble.style.opacity = '0';
    bubble.style.transform = 'translateY(10px)';
    bubble.innerHTML = `
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--customer">${secondMsg.text.replace(/\n/g, '<br>')}
          <div class="inbox-msg-avatar inbox-msg-avatar--customer" style="background:${conv.customer.color}">${conv.customer.initials}</div>
        </div>
      </div>
      <div class="inbox-msg-footer">
        <span class="inbox-msg-name">${conv.customer.name}</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${secondMsg.time}</span>
      </div>`;
    msgContainer.insertBefore(bubble, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bubble.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      bubble.style.opacity = '1';
      bubble.style.transform = 'translateY(0)';
    }));
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  // Preloaded path — show polite initial reply instantly, then play the
  // existing handover sequence at its original timings
  if (conv._draftReadyForPreload && conv._initialReply) {
    conv._draftReadyForPreload = false;
    const initialText = conv._initialReply.text;
    v2ShowPreloaded(draftPanel, draftBody, initialText.replace(/\n/g, '<br>'));

    const _sentRef = { sent: false };
    const hdrP = draftPanel.querySelector('.composer-v2-draft-header-right');
    if (hdrP) {
      hdrP.innerHTML = `
        <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
        </button>
        <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
          Send
          <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
        </button>
        <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
        </button>`;
      v2ButtonsEnter(hdrP);
      window._v2CopiedFlag = false;

      document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
        window._v2CopiedFlag = true;
        navigator.clipboard.writeText(initialText);
        const btn = e.currentTarget;
        btn.querySelector('.copy-tooltip')?.remove();
        const tip = document.createElement('span'); tip.className = 'copy-tooltip'; tip.textContent = 'Copied';
        btn.appendChild(tip);
        requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
        setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
      });

      document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', () => {
        showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer });
      });

      // Send — if user sends before t=1.5s frustration, cancel handover flow
      document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', () => {
        if (_sentRef.sent) return;
        _sentRef.sent = true;
        const _wasCopied = !!window._v2CopiedFlag;
        window._v2CopiedFlag = false;
        // Cancel all scheduled handover events
        if (window._v2EscTimers) window._v2EscTimers.forEach(clearTimeout);
        window._v2EscTimers = [];
        // Insert agent bubble
        const bubble = document.createElement('div');
        bubble.className = 'inbox-msg inbox-msg--agent inbox-msg--ai-sent';
        bubble.style.opacity = '0'; bubble.style.transform = 'translateY(10px)';
        bubble.innerHTML = `
          <div class="inbox-msg-card">
            <div class="inbox-msg-bubble inbox-msg-bubble--agent">${initialText.replace(/\n/g, '<br>')}
              <div class="inbox-msg-avatar inbox-msg-avatar--agent"><img src="daan.png" alt="Daan" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
            </div>
          </div>
          <div class="inbox-msg-footer inbox-msg-footer--agent">
            <span class="inbox-msg-name">Daan</span>
            <span class="inbox-msg-sep">-</span>
            <span class="inbox-msg-time">Just now</span>
          </div>`;
        msgContainer.insertBefore(bubble, composer);
        requestAnimationFrame(() => {
          bubble.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
          bubble.style.opacity = '1'; bubble.style.transform = 'translateY(0)';
        });
        v2ButtonsExit(hdrP, () => {
          v2BodyClose(draftBody);
          v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
        });
        setTimeout(() => v2SetLabel(draftPanel, 'on standby', false), 4000);
        msgContainer.scrollTop = msgContainer.scrollHeight;
      });
    }

    // t=1.5s: James's frustration message slides in
    const pet1 = setTimeout(() => { if (_sentRef.sent) return; insertFrustrationBubble(); }, 1500);
    // t=2.5s: draft replaces → buttons exit, body close, "composing a reply ●●●"
    const pet2 = setTimeout(() => {
      if (_sentRef.sent) return;
      v2ReplaceDraft(draftPanel, draftBody, null);
    }, 2500);
    // t=5s: label morphs to "proposed handover"
    const pet3 = setTimeout(() => {
      if (_sentRef.sent) return;
      v2SetLabel(draftPanel, 'proposed handover', false);
    }, 5000);
    // t=7s: panel exits → handover card + handoff strip
    const pet4 = setTimeout(() => {
      if (_sentRef.sent) return;
      showEscalationCard();
    }, 7000);
    window._v2EscTimers.push(pet1, pet2, pet3, pet4);
    return;
  }

  // t=1.5s: James's second message (frustration) slides in
  const t1 = setTimeout(() => {
    const bubble = document.createElement('div');
    bubble.className = 'inbox-msg inbox-msg--customer';
    bubble.style.opacity = '0';
    bubble.style.transform = 'translateY(10px)';
    bubble.innerHTML = `
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--customer">${secondMsg.text.replace(/\n/g, '<br>')}
          <div class="inbox-msg-avatar inbox-msg-avatar--customer" style="background:${conv.customer.color}">${conv.customer.initials}</div>
        </div>
      </div>
      <div class="inbox-msg-footer">
        <span class="inbox-msg-name">${conv.customer.name}</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${secondMsg.time}</span>
      </div>`;
    msgContainer.insertBefore(bubble, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bubble.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      bubble.style.opacity = '1';
      bubble.style.transform = 'translateY(0)';
    }));
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }, 1500);
  window._v2EscTimers.push(t1);

  // Helper: show escalation card (no approve/dismiss) then handoff strip below
  function showEscalationCard() {
    v2PanelExit(draftPanel, () => {
      // Insert escalation card — hide the approve/dismiss buttons, it's informational only
      const pContainer = document.createElement('div');
      pContainer.className = 'inbox-pending-container';
      pContainer.id = `inbox-pending-${convId}`;
      pContainer.style.opacity = '0';
      pContainer.style.transform = 'translateY(10px)';
      pContainer.insertAdjacentHTML('beforeend',
        renderPendingAction({ id: 'v2-esc-1', type: 'handover-v2' }, convId));
      // Hide the ✓ / ✗ buttons — card is purely informational
      const btnGroup = pContainer.querySelector('.inbox-pa-btn-group');
      if (btnGroup) btnGroup.hidden = true;
      msgContainer.insertBefore(pContainer, composer);

      // Spring escalation card in
      requestAnimationFrame(() => requestAnimationFrame(() => {
        pContainer.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
        pContainer.style.opacity = '1';
        pContainer.style.transform = 'translateY(0)';
      }));

      // ~350ms later: handoff strip slides in below (both remain visible)
      setTimeout(() => {
        const handoffContainer = document.createElement('div');
        handoffContainer.className = 'inbox-pending-container';
        handoffContainer.style.opacity = '0';
        handoffContainer.style.transform = 'translateY(10px)';
        handoffContainer.innerHTML = `
          <div class="inbox-pa-row inbox-pa-row--info">
            <div class="inbox-pa-default">
              <div class="inbox-pa-icon-wrap">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5" r="2.5"/><path d="M3 13.5a5 5 0 0110 0"/></svg>
              </div>
              <span class="inbox-pa-desc-bold">You can take over now</span>
              <span class="inbox-pa-desc-dim">· AI-licia has stepped aside</span>
            </div>
          </div>`;
        msgContainer.insertBefore(handoffContainer, composer);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          handoffContainer.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
          handoffContainer.style.opacity = '1';
          handoffContainer.style.transform = 'translateY(0)';
        }));
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }, 350);

      msgContainer.scrollTop = msgContainer.scrollHeight;
    });
  }

  // t=2.5s: purple container springs in — "composing a reply ●●●"
  const t2 = setTimeout(() => {
    v2PanelEnter(draftPanel);
    v2SetLabel(draftPanel, 'composing a reply', true);
    draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 2500);
  window._v2EscTimers.push(t2);

  // t=5s: AI pivots — label morphs to "proposed handover" (no dots, no body)
  const t3 = setTimeout(() => {
    v2SetLabel(draftPanel, 'proposed handover', false);
  }, 5000);
  window._v2EscTimers.push(t3);

  // t=7s: panel exits → escalation card slides in
  const t4 = setTimeout(() => {
    showEscalationCard();
  }, 7000);
  window._v2EscTimers.push(t4);
}

function runV2FedericoFlow(convId, suffix) {
  const conv = CONVERSATIONS_V2.find(c => c.id === convId);
  if (!conv || suffix !== 3) return;

  const draftPanel   = document.getElementById(`composer-v2-draft-${suffix}`);
  const draftBody    = document.getElementById(`composer-v2-draft-body-${suffix}`);
  const composer     = document.getElementById(`inbox-composer-${suffix}`);
  const msgContainer = document.getElementById(`inbox-thread-messages-${suffix}`);
  const esc = conv._salesEscalation;
  if (!draftPanel || !esc) return;

  // Cross-clear all v2 timer arrays
  if (window._v2EscTimers)        window._v2EscTimers.forEach(clearTimeout);
  if (window._v2ReplyTimers)      window._v2ReplyTimers.forEach(clearTimeout);
  if (window._v2FedericoTimers)   window._v2FedericoTimers.forEach(clearTimeout);
  if (window._v2PeopleTeamTimers) window._v2PeopleTeamTimers.forEach(clearTimeout);
  if (window._v2CloseTimers)      window._v2CloseTimers.forEach(clearTimeout);
  if (window._v2LabelTimers)      window._v2LabelTimers.forEach(clearTimeout);
  if (window._v2BarryTimers)      window._v2BarryTimers.forEach(clearTimeout);
  window._v2FedericoTimers = [];

  // Reset panel — keep visible in standby (AI-licia presence persists)
  draftPanel.hidden = false; draftPanel.style.opacity = '1'; draftPanel.style.transform = '';
  draftBody.classList.remove('composer-v2-draft-body--open'); draftBody.innerHTML = '';
  const hdr0 = draftPanel.querySelector('.composer-v2-draft-header-right');
  if (hdr0) { hdr0.style.visibility = 'hidden'; hdr0.style.opacity = '1'; hdr0.style.transform = ''; }
  if (composer) composer.hidden = false;

  // ── Helpers ──
  function insertAgentBubble(text, time) {
    const el = document.createElement('div');
    el.className = 'inbox-msg inbox-msg--agent inbox-msg--ai-sent';
    el.style.cssText = 'opacity:0;transform:translateY(10px)';
    el.innerHTML = `
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--agent">${text.replace(/\n/g, '<br>')}
          <div class="inbox-msg-avatar inbox-msg-avatar--agent"><img src="daan.png" alt="Daan" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
        </div>
      </div>
      <div class="inbox-msg-footer">
        <span class="inbox-msg-name">Daan</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${time}</span>
      </div>`;
    msgContainer.insertBefore(el, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }));
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function insertCustomerBubble(msgData) {
    const el = document.createElement('div');
    el.className = 'inbox-msg inbox-msg--customer';
    el.style.cssText = 'opacity:0;transform:translateY(10px)';
    el.innerHTML = `
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--customer">${msgData.text.replace(/\n/g, '<br>')}
          <div class="inbox-msg-avatar inbox-msg-avatar--customer" style="background:${conv.customer.color}">${conv.customer.initials}</div>
        </div>
      </div>
      <div class="inbox-msg-footer">
        <span class="inbox-msg-name">${conv.customer.name}</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${msgData.time}</span>
      </div>`;
    msgContainer.insertBefore(el, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }));
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function buildButtons(hdr, draftText, onSend, onDismiss) {
    hdr.innerHTML = `
      <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
      </button>
      <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
        Send
        <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
      </button>
      <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
      </button>`;
    setTimeout(() => v2ButtonsEnter(hdr), 80);
    // Reset copy flag when fresh preview appears
    window._v2CopiedFlag = false;
    // Copy
    document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
      window._v2CopiedFlag = true;
      navigator.clipboard.writeText(draftText);
      const btn = e.currentTarget;
      btn.querySelector('.copy-tooltip')?.remove();
      const tip = document.createElement('span');
      tip.className = 'copy-tooltip'; tip.textContent = 'Copied';
      btn.appendChild(tip);
      requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
      setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
    });
    document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', onSend, { once: true });
    document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', onDismiss, { once: true });
  }

  // Preloaded path — show initial reply instantly, then play existing
  // bigMsg + round-1-draft sequence at original timings
  if (conv._draftReadyForPreload && conv._initialReply) {
    conv._draftReadyForPreload = false;
    const initialText = conv._initialReply.text;
    v2ShowPreloaded(draftPanel, draftBody, initialText.replace(/\n/g, '<br>'));

    const _preRef = { sent: false };
    const hdrP = draftPanel.querySelector('.composer-v2-draft-header-right');
    if (hdrP) {
      buildButtons(hdrP, initialText,
        // Send preloaded — cancel Federico flow and go to on standby
        () => {
          if (_preRef.sent) return;
          _preRef.sent = true;
          if (window._v2FedericoTimers) window._v2FedericoTimers.forEach(clearTimeout);
          window._v2FedericoTimers = [];
          const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
          insertAgentBubble(initialText, conv._initialReply.time);
          v2ButtonsExit(hdrP, () => {
            v2BodyClose(draftBody);
            v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
          });
          setTimeout(() => v2SetLabel(draftPanel, 'on standby', false), 4000);
          msgContainer.scrollTop = msgContainer.scrollHeight;
        },
        () => { showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer }); }
      );
    }

    // t=1.5s: bigMsg arrives
    const pft1 = setTimeout(() => { if (_preRef.sent) return; insertCustomerBubble(esc.bigMsg); }, 1500);
    // t=2.5s: draft replaces → buttons exit, body close, "composing a reply ●●●"
    const pft2 = setTimeout(() => { if (_preRef.sent) return; v2ReplaceDraft(draftPanel, draftBody, null); }, 2500);
    // t=4.5s: response preview + aiReply1 + buttons
    const pft3 = setTimeout(() => {
      if (_preRef.sent) return;
      v2SetLabel(draftPanel, 'response preview', false);
      setTimeout(() => {
        v2BodyOpen(draftBody, esc.aiReply1.text.replace(/\n/g, '<br>'));
        draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const hdr = draftPanel.querySelector('.composer-v2-draft-header-right');
        if (hdr) {
          buildButtons(hdr, esc.aiReply1.text,
            () => {
              const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
              insertAgentBubble(esc.aiReply1.text, esc.aiReply1.time);
              v2ButtonsExit(hdr, () => {
                v2BodyClose(draftBody);
                v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
              });
              setTimeout(() => startRound2(), 4000);
            },
            () => { showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer }); }
          );
        }
      }, 180);
    }, 4500);
    window._v2FedericoTimers.push(pft1, pft2, pft3);
    return;
  }

  // ── ROUND 1 ──
  const t1 = setTimeout(() => { insertCustomerBubble(esc.bigMsg); }, 1500);
  window._v2FedericoTimers.push(t1);

  const t2 = setTimeout(() => {
    v2PanelEnter(draftPanel);
    v2SetLabel(draftPanel, 'composing a reply', true);
    draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 2500);
  window._v2FedericoTimers.push(t2);

  const t3 = setTimeout(() => {
    v2SetLabel(draftPanel, 'response preview', false);
    setTimeout(() => {
      v2BodyOpen(draftBody, esc.aiReply1.text.replace(/\n/g, '<br>'));
      draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const hdr = draftPanel.querySelector('.composer-v2-draft-header-right');
      if (hdr) {
        buildButtons(hdr, esc.aiReply1.text,
          // Send
          () => {
            const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
            insertAgentBubble(esc.aiReply1.text, esc.aiReply1.time);
            v2ButtonsExit(hdr, () => {
              v2BodyClose(draftBody);
              v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
            });
            setTimeout(() => startRound2(), 4000);
          },
          // Dismiss
          () => { showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer }); }
        );
      }
    }, 180);
  }, 4500);
  window._v2FedericoTimers.push(t3);

  // ── ROUND 2 ── (triggered by Send in Round 1)
  function startRound2() {
    const r2t1 = setTimeout(() => { insertCustomerBubble(esc.detailsMsg); }, 1500);

    const r2t2 = setTimeout(() => {
      v2PanelEnter(draftPanel);
      v2SetLabel(draftPanel, 'composing a reply', true);
      draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 2500);

    const r2t3 = setTimeout(() => {
      v2SetLabel(draftPanel, 'proposed escalation', false);
    }, 4500);

    const r2t4 = setTimeout(() => {
      v2SetLabel(draftPanel, 'response preview', false);
      setTimeout(() => {
        v2BodyOpen(draftBody, esc.aiReply2.text.replace(/\n/g, '<br>'));
        draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const hdr2 = draftPanel.querySelector('.composer-v2-draft-header-right');
        if (hdr2) {
          buildButtons(hdr2, esc.aiReply2.text,
            // Send
            () => {
              const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
              insertAgentBubble(esc.aiReply2.text, esc.aiReply2.time);
              v2ButtonsExit(hdr2, () => {
                v2BodyClose(draftBody);
                v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
              });
              setTimeout(() => {
                v2PanelHide(draftPanel, () => showFedericoCard());
              }, 4200);
              msgContainer.scrollTop = msgContainer.scrollHeight;
            },
            // Dismiss
            () => { showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer }); }
          );
        }
      }, 180);
    }, 6000);

    window._v2FedericoTimers.push(r2t1, r2t2, r2t3, r2t4);
  }

  // ── ACTION CARD ──
  function showFedericoCard() {
    const pContainer = document.createElement('div');
    pContainer.className = 'inbox-pending-container';
    pContainer.id = `inbox-pending-${convId}`;
    pContainer.style.cssText = 'opacity:0;transform:translateY(10px)';
    pContainer.insertAdjacentHTML('beforeend',
      renderPendingAction({ id: 'v2-fed-1', type: 'assign-federico' }, convId));
    msgContainer.insertBefore(pContainer, composer);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      pContainer.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      pContainer.style.opacity = '1'; pContainer.style.transform = 'translateY(0)';
    }));

    const row = pContainer.querySelector('.inbox-pa-row');
    if (row) {
      // Approve → fade card → plain gray "Assigned to Federico at 20-04-2026, 10:16"
      row.querySelector('.inbox-pa-approve-btn')?.addEventListener('click', () => {
        pContainer.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
        pContainer.style.opacity = '0'; pContainer.style.transform = 'translateY(-4px)';
        setTimeout(() => {
          const confirm = document.createElement('div');
          confirm.className = 'inbox-pending-container';
          confirm.innerHTML = `<div class="inbox-v2-assigned-confirm">Assigned to Federico at 20-04-2026, 10:16</div>`;
          confirm.style.cssText = 'opacity:0;transform:translateY(6px)';
          pContainer.parentNode.replaceChild(confirm, pContainer);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            confirm.style.transition = 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)';
            confirm.style.opacity = '1'; confirm.style.transform = 'translateY(0)';
          }));
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }, 220);
      });

      // Dismiss → silent fade out
      row.querySelector('.inbox-pa-dismiss-btn')?.addEventListener('click', () => {
        pContainer.style.transition = 'opacity 0.22s ease';
        pContainer.style.opacity = '0';
        setTimeout(() => pContainer.remove(), 220);
      });
    }

    msgContainer.scrollTop = msgContainer.scrollHeight;
  }
}

function runV2PeopleTeamFlow(convId, suffix) {
  const conv = CONVERSATIONS_V2.find(c => c.id === convId);
  if (!conv || suffix !== 3) return;

  const draftPanel   = document.getElementById(`composer-v2-draft-${suffix}`);
  const draftBody    = document.getElementById(`composer-v2-draft-body-${suffix}`);
  const composer     = document.getElementById(`inbox-composer-${suffix}`);
  const msgContainer = document.getElementById(`inbox-thread-messages-${suffix}`);
  const te = conv._teamEscalation;
  if (!draftPanel || !te) return;

  // Cross-clear all v2 timers
  [window._v2EscTimers, window._v2ReplyTimers,
   window._v2FedericoTimers, window._v2PeopleTeamTimers, window._v2CloseTimers, window._v2LabelTimers, window._v2BarryTimers]
    .forEach(arr => arr?.forEach(clearTimeout));
  window._v2PeopleTeamTimers = [];

  // Reset panel — keep visible in standby (AI-licia presence persists)
  draftPanel.hidden = false; draftPanel.style.opacity = '1'; draftPanel.style.transform = '';
  draftBody.classList.remove('composer-v2-draft-body--open'); draftBody.innerHTML = '';
  const hdr0 = draftPanel.querySelector('.composer-v2-draft-header-right');
  if (hdr0) { hdr0.style.visibility = 'hidden'; hdr0.style.opacity = '1'; hdr0.style.transform = ''; }
  if (composer) composer.hidden = false;

  let agentBubbleEl = null; // stored ref for avatar swap on approve

  // Preloaded path — show draft immediately on first open
  if (conv._draftReadyForPreload) {
    conv._draftReadyForPreload = false;
    v2ShowPreloaded(draftPanel, draftBody, te.greeting.text.replace(/\n/g, '<br>'));
    const hdrP = draftPanel.querySelector('.composer-v2-draft-header-right');
    if (hdrP) {
      hdrP.innerHTML = `
        <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
        </button>
        <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
          Send
          <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
        </button>
        <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
        </button>`;
      v2ButtonsEnter(hdrP);
      window._v2CopiedFlag = false;
      document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
        window._v2CopiedFlag = true;
        navigator.clipboard.writeText(te.greeting.text);
        const btn = e.currentTarget;
        btn.querySelector('.copy-tooltip')?.remove();
        const tip = document.createElement('span'); tip.className = 'copy-tooltip'; tip.textContent = 'Copied';
        btn.appendChild(tip);
        requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
        setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
      });
      document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', () => {
        const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
        agentBubbleEl = insertAgentBubble(te.greeting.text, te.greeting.time);
        v2ButtonsExit(hdrP, () => {
          v2BodyClose(draftBody);
          v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
        });
        setTimeout(() => { v2PanelExit(draftPanel, () => showPeopleTeamCard()); }, 4200);
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }, { once: true });
      document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', () => {
        showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer });
      }, { once: true });
    }
    return;
  }

  // t=1.5s: panel enters — "composing a reply ●●●"
  const t1 = setTimeout(() => {
    v2PanelEnter(draftPanel);
    v2SetLabel(draftPanel, 'composing a reply', true);
    draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 1500);
  window._v2PeopleTeamTimers.push(t1);

  // t=3.5s: "response preview" + greeting draft + buttons
  const t2 = setTimeout(() => {
    v2SetLabel(draftPanel, 'response preview', false);
    setTimeout(() => {
      v2BodyOpen(draftBody, te.greeting.text.replace(/\n/g, '<br>'));
      draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const hdr = draftPanel.querySelector('.composer-v2-draft-header-right');
      if (hdr) {
        hdr.innerHTML = `
          <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
          </button>
          <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
            Send
            <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
          </button>
          <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
          </button>`;
        setTimeout(() => v2ButtonsEnter(hdr), 80);
        window._v2CopiedFlag = false;

        // Copy
        document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
          window._v2CopiedFlag = true;
          navigator.clipboard.writeText(te.greeting.text);
          const btn = e.currentTarget;
          btn.querySelector('.copy-tooltip')?.remove();
          const tip = document.createElement('span');
          tip.className = 'copy-tooltip'; tip.textContent = 'Copied';
          btn.appendChild(tip);
          requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
          setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
        });

        // Send (once)
        document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', () => {
          const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
          // Insert agent bubble; store ref for avatar swap
          agentBubbleEl = insertAgentBubble(te.greeting.text, te.greeting.time);
          // Exit buttons + close body
          v2ButtonsExit(hdr, () => {
            v2BodyClose(draftBody);
            v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
          });
          // Panel exits → action card (after 4s feedback label)
          setTimeout(() => {
            v2PanelExit(draftPanel, () => showPeopleTeamCard());
          }, 4200);
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }, { once: true });

        // Dismiss
        document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', () => {
          showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer });
        }, { once: true });
      }
    }, 180);
  }, 3500);
  window._v2PeopleTeamTimers.push(t2);

  // ── Helper: insert agent bubble; returns the element ──
  function insertAgentBubble(text, time) {
    const el = document.createElement('div');
    el.className = 'inbox-msg inbox-msg--agent inbox-msg--ai-sent';
    el.style.cssText = 'opacity:0;transform:translateY(10px)';
    el.innerHTML = `
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--agent">${text.replace(/\n/g, '<br>')}
          <div class="inbox-msg-avatar inbox-msg-avatar--agent inbox-msg-avatar--swappable">
            <img src="daan.png" alt="Daan" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
          </div>
        </div>
      </div>
      <div class="inbox-msg-footer">
        <span class="inbox-msg-name inbox-msg-name--swappable">Daan</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${time}</span>
      </div>`;
    msgContainer.insertBefore(el, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }));
    msgContainer.scrollTop = msgContainer.scrollHeight;
    return el;
  }

  // ── ACTION CARD ──
  function showPeopleTeamCard() {
    const pContainer = document.createElement('div');
    pContainer.className = 'inbox-pending-container';
    pContainer.id = `inbox-pending-${convId}`;
    pContainer.style.cssText = 'opacity:0;transform:translateY(10px)';
    pContainer.insertAdjacentHTML('beforeend',
      renderPendingAction({ id: 'v2-pt-1', type: 'assign-people-team' }, convId));
    msgContainer.insertBefore(pContainer, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      pContainer.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      pContainer.style.opacity = '1'; pContainer.style.transform = 'translateY(0)';
    }));

    const row = pContainer.querySelector('.inbox-pa-row');
    if (row) {
      // Approve → confirmation text + avatar swap
      row.querySelector('.inbox-pa-approve-btn')?.addEventListener('click', () => {
        pContainer.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
        pContainer.style.opacity = '0'; pContainer.style.transform = 'translateY(-4px)';
        setTimeout(() => {
          // Gray confirmation text
          const confirm = document.createElement('div');
          confirm.className = 'inbox-pending-container';
          confirm.innerHTML = `<div class="inbox-v2-assigned-confirm">Assigned to People team</div>`;
          confirm.style.cssText = 'opacity:0;transform:translateY(6px)';
          pContainer.parentNode.replaceChild(confirm, pContainer);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            confirm.style.transition = 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)';
            confirm.style.opacity = '1'; confirm.style.transform = 'translateY(0)';
          }));

          // Swap conversation list assignee → Users.svg on gray + tooltip
          // (Agent bubble stays as Daan — message was sent by Daan)
          const listAssignee = document.querySelector('[data-conv="v2-conv-4"] .inbox-conv-assignee');
          if (listAssignee) {
            listAssignee.style.transition = 'opacity 0.2s ease';
            listAssignee.style.opacity = '0';
            setTimeout(() => {
              listAssignee.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.75 7a3.25 3.25 0 1 1 6.5 0 3.25 3.25 0 0 1-6.5 0zM8 2.25a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5zm6 0a.75.75 0 0 0 0 1.5 3.25 3.25 0 0 1 0 6.5.75.75 0 0 0 0 1.5 4.75 4.75 0 1 0 0-9.5zm-8 13.5A3.25 3.25 0 0 0 2.75 19c0 .69.56 1.25 1.25 1.25h8c.69 0 1.25-.56 1.25-1.25A3.25 3.25 0 0 0 10 15.75H6zM1.25 19A4.75 4.75 0 0 1 6 14.25h4A4.75 4.75 0 0 1 14.75 19 2.75 2.75 0 0 1 12 21.75H4A2.75 2.75 0 0 1 1.25 19zM16 14.25a.75.75 0 0 0 0 1.5h2A3.25 3.25 0 0 1 21.25 19c0 .69-.56 1.25-1.25 1.25h-4a.75.75 0 0 0 0 1.5h4A2.75 2.75 0 0 0 22.75 19 4.75 4.75 0 0 0 18 14.25h-2z" fill="currentColor"/></svg>`;
              listAssignee.classList.add('inbox-conv-assignee--team');
              listAssignee.setAttribute('data-tooltip', 'People team');
              listAssignee.style.opacity = '1';
            }, 200);
          }
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }, 220);
      });

      // Dismiss → silent fade
      row.querySelector('.inbox-pa-dismiss-btn')?.addEventListener('click', () => {
        pContainer.style.transition = 'opacity 0.22s ease';
        pContainer.style.opacity = '0';
        setTimeout(() => pContainer.remove(), 220);
      });
    }

    msgContainer.scrollTop = msgContainer.scrollHeight;
  }
}

function runV2CloseFlow(convId, suffix) {
  const conv = CONVERSATIONS_V2.find(c => c.id === convId);
  if (!conv || suffix !== 3) return;

  const draftPanel   = document.getElementById(`composer-v2-draft-${suffix}`);
  const draftBody    = document.getElementById(`composer-v2-draft-body-${suffix}`);
  const composer     = document.getElementById(`inbox-composer-${suffix}`);
  const msgContainer = document.getElementById(`inbox-thread-messages-${suffix}`);
  const cd = conv._closeData;
  if (!draftPanel || !cd) return;

  // Cross-clear all v2 timers
  [window._v2EscTimers, window._v2ReplyTimers,
   window._v2FedericoTimers, window._v2PeopleTeamTimers, window._v2CloseTimers, window._v2LabelTimers, window._v2BarryTimers]
    .forEach(arr => arr?.forEach(clearTimeout));
  window._v2CloseTimers = [];

  // Reset panel — keep visible in standby (AI-licia presence persists)
  draftPanel.hidden = false; draftPanel.style.opacity = '1'; draftPanel.style.transform = '';
  draftBody.classList.remove('composer-v2-draft-body--open'); draftBody.innerHTML = '';
  const hdr0 = draftPanel.querySelector('.composer-v2-draft-header-right');
  if (hdr0) { hdr0.style.visibility = 'hidden'; hdr0.style.opacity = '1'; hdr0.style.transform = ''; }
  if (composer) composer.hidden = false;

  // Preloaded path — show draft immediately on first open
  if (conv._draftReadyForPreload) {
    conv._draftReadyForPreload = false;
    v2ShowPreloaded(draftPanel, draftBody, cd.agentReply.text.replace(/\n/g, '<br>'));
    const hdrP = draftPanel.querySelector('.composer-v2-draft-header-right');
    if (hdrP) {
      hdrP.innerHTML = `
        <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
        </button>
        <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
          Send
          <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
        </button>
        <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
        </button>`;
      v2ButtonsEnter(hdrP);
      window._v2CopiedFlag = false;
      document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
        window._v2CopiedFlag = true;
        navigator.clipboard.writeText(cd.agentReply.text);
        const btn = e.currentTarget;
        btn.querySelector('.copy-tooltip')?.remove();
        const tip = document.createElement('span'); tip.className = 'copy-tooltip'; tip.textContent = 'Copied';
        btn.appendChild(tip);
        requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
        setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
      });
      document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', () => {
        const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
        insertAgentBubble(cd.agentReply.text, cd.agentReply.time);
        v2ButtonsExit(hdrP, () => {
          v2BodyClose(draftBody);
          v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
        });
        setTimeout(() => v2PanelExit(draftPanel, startPhase2), 4200);
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }, { once: true });
      document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', () => {
        showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer });
      }, { once: true });
    }
    return;
  }

  // t=1.5s: panel enters — "composing a reply ●●●"
  const t1 = setTimeout(() => {
    v2PanelEnter(draftPanel);
    v2SetLabel(draftPanel, 'composing a reply', true);
    draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 1500);
  window._v2CloseTimers.push(t1);

  // t=3.5s: "response preview" + reply draft + buttons
  const t2 = setTimeout(() => {
    v2SetLabel(draftPanel, 'response preview', false);
    setTimeout(() => {
      v2BodyOpen(draftBody, cd.agentReply.text.replace(/\n/g, '<br>'));
      draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const hdr = draftPanel.querySelector('.composer-v2-draft-header-right');
      if (hdr) {
        hdr.innerHTML = `
          <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
          </button>
          <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
            Send
            <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
          </button>
          <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
          </button>`;
        setTimeout(() => v2ButtonsEnter(hdr), 80);
        window._v2CopiedFlag = false;

        // Copy
        document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
          window._v2CopiedFlag = true;
          navigator.clipboard.writeText(cd.agentReply.text);
          const btn = e.currentTarget;
          btn.querySelector('.copy-tooltip')?.remove();
          const tip = document.createElement('span');
          tip.className = 'copy-tooltip'; tip.textContent = 'Copied';
          btn.appendChild(tip);
          requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
          setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
        });

        // Send (once) — insert Daan bubble then start Phase 2
        document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', () => {
          const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
          insertAgentBubble(cd.agentReply.text, cd.agentReply.time);
          v2ButtonsExit(hdr, () => {
            v2BodyClose(draftBody);
            v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
          });
          setTimeout(() => v2PanelExit(draftPanel, startPhase2), 4200);
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }, { once: true });

        // Dismiss
        document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', () => {
          showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer });
        }, { once: true });
      }
    }, 180);
  }, 3500);
  window._v2CloseTimers.push(t2);

  // ── Phase 2: triggered after Send ──
  function startPhase2() {
    // ~600ms: Yuki's goodbye slides in
    const r2t1 = setTimeout(() => {
      insertCustomerBubble(cd.customerBye.text, cd.customerBye.time);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 600);

    // ~2.4s: panel re-enters — "composing a reply ●●●"
    const r2t2 = setTimeout(() => {
      v2PanelEnter(draftPanel);
      v2SetLabel(draftPanel, 'composing a reply', true);
      draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 2400);

    // ~3.6s: label crossfades to "proposed close"
    const r2t3 = setTimeout(() => {
      v2SetLabel(draftPanel, 'proposed close', false);
    }, 3600);

    // ~5.1s: panel exits → action card
    const r2t4 = setTimeout(() => {
      v2PanelExit(draftPanel, () => showCloseCard());
    }, 5100);

    window._v2CloseTimers.push(r2t1, r2t2, r2t3, r2t4);
  }

  // ── Helper: insert agent bubble ──
  function insertAgentBubble(text, time) {
    const el = document.createElement('div');
    el.className = 'inbox-msg inbox-msg--agent inbox-msg--ai-sent';
    el.style.cssText = 'opacity:0;transform:translateY(10px)';
    el.innerHTML = `
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--agent">${text.replace(/\n/g, '<br>')}
          <div class="inbox-msg-avatar inbox-msg-avatar--agent">
            <img src="daan.png" alt="Daan" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
          </div>
        </div>
      </div>
      <div class="inbox-msg-footer">
        <span class="inbox-msg-name">Daan</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${time}</span>
      </div>`;
    msgContainer.insertBefore(el, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }));
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  // ── Helper: insert customer bubble ──
  function insertCustomerBubble(text, time) {
    const el = document.createElement('div');
    el.className = 'inbox-msg inbox-msg--customer';
    el.style.cssText = 'opacity:0;transform:translateY(10px)';
    el.innerHTML = `
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--customer">${text.replace(/\n/g, '<br>')}
          <div class="inbox-msg-avatar inbox-msg-avatar--customer" style="background:${conv.customer.color}">${conv.customer.initials}</div>
        </div>
      </div>
      <div class="inbox-msg-footer">
        <span class="inbox-msg-name">${conv.customer.name}</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${time}</span>
      </div>`;
    msgContainer.insertBefore(el, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }));
  }

  // ── ACTION CARD ──
  function showCloseCard() {
    const pContainer = document.createElement('div');
    pContainer.className = 'inbox-pending-container';
    pContainer.id = `inbox-pending-${convId}`;
    pContainer.style.cssText = 'opacity:0;transform:translateY(10px)';
    pContainer.insertAdjacentHTML('beforeend',
      renderPendingAction({ id: 'v2-cl-1', type: 'close-conversation' }, convId));
    msgContainer.insertBefore(pContainer, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      pContainer.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      pContainer.style.opacity = '1'; pContainer.style.transform = 'translateY(0)';
    }));

    const row = pContainer.querySelector('.inbox-pa-row');
    if (row) {
      // Approve → grey confirmation text → closed composer state
      row.querySelector('.inbox-pa-approve-btn')?.addEventListener('click', () => {
        pContainer.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
        pContainer.style.opacity = '0'; pContainer.style.transform = 'translateY(-4px)';
        setTimeout(() => {
          const confirm = document.createElement('div');
          confirm.className = 'inbox-pending-container';
          confirm.innerHTML = `<div class="inbox-v2-assigned-confirm">Daan closed the conversation</div>`;
          confirm.style.cssText = 'opacity:0;transform:translateY(6px)';
          pContainer.parentNode.replaceChild(confirm, pContainer);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            confirm.style.transition = 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)';
            confirm.style.opacity = '1'; confirm.style.transform = 'translateY(0)';
          }));
          msgContainer.scrollTop = msgContainer.scrollHeight;
          // Morph composer to closed state after confirm animates in
          setTimeout(() => showComposerClosed(), 570);
        }, 220);
      });

      // Dismiss → silent fade
      row.querySelector('.inbox-pa-dismiss-btn')?.addEventListener('click', () => {
        pContainer.style.transition = 'opacity 0.22s ease';
        pContainer.style.opacity = '0';
        setTimeout(() => pContainer.remove(), 220);
      });
    }

    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  // ── Closed composer state ──
  function showComposerClosed() {
    const inner = composer.querySelector('.composer-v2-inner');
    const fields = composer.querySelector('.composer-fields');
    const editState = document.getElementById(`composer-v2-edit-state-${suffix}`);
    if (!inner) return;

    // Fade out fields + edit state
    [fields, editState].forEach(el => {
      if (!el) return;
      el.style.transition = 'opacity 0.2s ease';
      el.style.opacity = '0';
      setTimeout(() => { el.hidden = true; el.style.opacity = ''; el.style.transition = ''; }, 200);
    });

    // Build closed state
    const closed = document.createElement('div');
    closed.className = 'composer-v2-closed';
    closed.style.opacity = '0';
    closed.innerHTML = `
      <button class="composer-v2-closed-btn composer-v2-closed-btn--assign">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path d="M2 17c0-3 2.5-5 6-5h4c3.5 0 6 2 6 5"/>
        </svg>
        Assign
      </button>
      <button class="composer-v2-closed-btn composer-v2-closed-btn--reopen" id="composer-v2-reopen-${suffix}">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 10a6 6 0 1010.5-4M4 6v4h4"/>
        </svg>
        Reopen conversation
      </button>`;

    setTimeout(() => {
      inner.appendChild(closed);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        closed.style.transition = 'opacity 0.22s ease';
        closed.style.opacity = '1';
      }));
      document.getElementById(`composer-v2-reopen-${suffix}`)?.addEventListener('click', () => {
        reopenConversation(closed, fields, editState);
      }, { once: true });
    }, 220);
  }

  // ── Reopen conversation ──
  function reopenConversation(closed, fields, editState) {
    // Fade out closed state
    closed.style.transition = 'opacity 0.18s ease';
    closed.style.opacity = '0';
    setTimeout(() => {
      closed.remove();
      // Restore fields + edit state
      [fields, editState].forEach(el => {
        if (!el) return;
        el.hidden = false;
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.22s ease';
        requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '1'; }));
        setTimeout(() => { el.style.opacity = ''; el.style.transition = ''; }, 240);
      });
      // AI-licia panel springs back in — resting state
      const lbl = draftPanel.querySelector('.composer-v2-draft-label');
      if (lbl) lbl.textContent = 'on standby';
      draftPanel.querySelector('.composer-v2-header-dots')?.remove();
      const hdrReopen = draftPanel.querySelector('.composer-v2-draft-header-right');
      if (hdrReopen) { hdrReopen.style.visibility = 'hidden'; }
      v2PanelEnter(draftPanel);
      // "Conversation reopened" confirmation line in thread
      const line = document.createElement('div');
      line.className = 'inbox-pending-container';
      line.innerHTML = '<div class="inbox-v2-assigned-confirm">Conversation reopened — assigned to Daan</div>';
      line.style.cssText = 'opacity:0;transform:translateY(6px)';
      msgContainer.insertBefore(line, composer);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        line.style.transition = 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)';
        line.style.opacity = '1'; line.style.transform = 'translateY(0)';
      }));
      // Fade out after 3s
      setTimeout(() => {
        line.style.transition = 'opacity 0.3s ease';
        line.style.opacity = '0';
        setTimeout(() => line.remove(), 300);
      }, 3000);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 200);
  }
}

function runV2LabelFlow(convId, suffix) {
  const conv = CONVERSATIONS_V2.find(c => c.id === convId);
  if (!conv || suffix !== 3) return;

  const draftPanel   = document.getElementById(`composer-v2-draft-${suffix}`);
  const draftBody    = document.getElementById(`composer-v2-draft-body-${suffix}`);
  const composer     = document.getElementById(`inbox-composer-${suffix}`);
  const msgContainer = document.getElementById(`inbox-thread-messages-${suffix}`);
  const ld = conv._labelData;
  if (!draftPanel || !ld) return;

  // Cross-clear all v2 timers
  [window._v2EscTimers, window._v2ReplyTimers,
   window._v2FedericoTimers, window._v2PeopleTeamTimers, window._v2CloseTimers, window._v2LabelTimers, window._v2BarryTimers]
    .forEach(arr => arr?.forEach(clearTimeout));
  window._v2LabelTimers = [];

  // Reset panel — keep visible in standby (AI-licia presence persists)
  draftPanel.hidden = false; draftPanel.style.opacity = '1'; draftPanel.style.transform = '';
  draftBody.classList.remove('composer-v2-draft-body--open'); draftBody.innerHTML = '';
  const hdr0 = draftPanel.querySelector('.composer-v2-draft-header-right');
  if (hdr0) { hdr0.style.visibility = 'hidden'; hdr0.style.opacity = '1'; hdr0.style.transform = ''; }
  if (composer) composer.hidden = false;

  // Preloaded path — show draft immediately on first open
  if (conv._draftReadyForPreload) {
    conv._draftReadyForPreload = false;
    v2ShowPreloaded(draftPanel, draftBody, ld.agentReply.text.replace(/\n/g, '<br>'));
    const hdrP = draftPanel.querySelector('.composer-v2-draft-header-right');
    if (hdrP) {
      hdrP.innerHTML = `
        <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
        </button>
        <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
          Send
          <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
        </button>
        <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
        </button>`;
      v2ButtonsEnter(hdrP);
      window._v2CopiedFlag = false;
      document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
        window._v2CopiedFlag = true;
        navigator.clipboard.writeText(ld.agentReply.text);
        const btn = e.currentTarget;
        btn.querySelector('.copy-tooltip')?.remove();
        const tip = document.createElement('span'); tip.className = 'copy-tooltip'; tip.textContent = 'Copied';
        btn.appendChild(tip);
        requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
        setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
      });
      document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', () => {
        const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
        insertAgentBubble(ld.agentReply.text, ld.agentReply.time);
        v2ButtonsExit(hdrP, () => {
          v2BodyClose(draftBody);
          v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
        });
        setTimeout(() => startPhase2(), 4200);
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }, { once: true });
      document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', () => {
        showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer });
      }, { once: true });
    }
    return;
  }

  // t=1.5s: panel enters — "composing a reply ●●●"
  const t1 = setTimeout(() => {
    v2PanelEnter(draftPanel);
    v2SetLabel(draftPanel, 'composing a reply', true);
    draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 1500);
  window._v2LabelTimers.push(t1);

  // t=3.5s: "response preview" + reply draft + buttons
  const t2 = setTimeout(() => {
    v2SetLabel(draftPanel, 'response preview', false);
    setTimeout(() => {
      v2BodyOpen(draftBody, ld.agentReply.text.replace(/\n/g, '<br>'));
      draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const hdr = draftPanel.querySelector('.composer-v2-draft-header-right');
      if (hdr) {
        hdr.innerHTML = `
          <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
          </button>
          <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
            Send
            <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
          </button>
          <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
          </button>`;
        setTimeout(() => v2ButtonsEnter(hdr), 80);
        window._v2CopiedFlag = false;

        // Copy
        document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
          window._v2CopiedFlag = true;
          navigator.clipboard.writeText(ld.agentReply.text);
          const btn = e.currentTarget;
          btn.querySelector('.copy-tooltip')?.remove();
          const tip = document.createElement('span');
          tip.className = 'copy-tooltip'; tip.textContent = 'Copied';
          btn.appendChild(tip);
          requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
          setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
        });

        // Send (once) — insert Daan bubble then start Phase 2
        document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', () => {
          const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
          insertAgentBubble(ld.agentReply.text, ld.agentReply.time);
          v2ButtonsExit(hdr, () => {
            v2BodyClose(draftBody);
            v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
          });
          // Keep panel visible — start phase 2 after 4s feedback label
          setTimeout(() => startPhase2(), 4200);
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }, { once: true });

        // Dismiss
        document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', () => {
          showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer });
        }, { once: true });
      }
    }, 180);
  }, 3500);
  window._v2LabelTimers.push(t2);

  // ── Phase 2: triggered after Send ──
  function startPhase2() {
    // ~600ms: Sophie's upgrade message slides in
    const r2t1 = setTimeout(() => {
      insertCustomerBubble(ld.customerUpgrade.text, ld.customerUpgrade.time || 'Mon');
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 600);

    // ~2.4s: panel "composing a reply ●●●" (entrance only if hidden — stays visible after phase 1 send)
    const r2t2 = setTimeout(() => {
      if (draftPanel.hidden) v2PanelEnter(draftPanel);
      v2SetLabel(draftPanel, 'composing a reply', true);
      draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 2400);

    // ~3.6s: "response preview" + upgrade reply draft + buttons
    const r2t3 = setTimeout(() => {
      v2SetLabel(draftPanel, 'response preview', false);
      setTimeout(() => {
        v2BodyOpen(draftBody, ld.upgradeReply.text.replace(/\n/g, '<br>'));
        draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const hdr2 = draftPanel.querySelector('.composer-v2-draft-header-right');
        if (hdr2) {
          hdr2.style.visibility = 'visible';
          hdr2.innerHTML = `
            <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
            </button>
            <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
              Send
              <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
            </button>
            <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
            </button>`;
          setTimeout(() => v2ButtonsEnter(hdr2), 80);
          window._v2CopiedFlag = false;

          // Copy
          document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
            window._v2CopiedFlag = true;
            navigator.clipboard.writeText(ld.upgradeReply.text);
            const btn = e.currentTarget;
            btn.querySelector('.copy-tooltip')?.remove();
            const tip = document.createElement('span');
            tip.className = 'copy-tooltip'; tip.textContent = 'Copied';
            btn.appendChild(tip);
            requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
            setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
          });

          // Send (once) — insert Daan bubble + panel exits; label cards stay
          document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', () => {
            const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
            insertAgentBubble(ld.upgradeReply.text, ld.upgradeReply.time);
            v2ButtonsExit(hdr2, () => {
              v2BodyClose(draftBody);
              v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
            });
            // Keep panel visible — morph to 'on standby' after 4s feedback label
            setTimeout(() => v2SetLabel(draftPanel, 'on standby', false), 4200);
            msgContainer.scrollTop = msgContainer.scrollHeight;
          }, { once: true });

          // Dismiss
          document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', () => {
            showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer });
          }, { once: true });
        }
      }, 180);
    }, 3600);

    // ~4.2s: panel pulses + stacked label cards emanate from it
    const r2t4 = setTimeout(() => {
      // ① Panel pulse — briefly brightens border to signal origin
      draftPanel.classList.add('composer-v2-draft--pulse');
      draftPanel.addEventListener('animationend', () => draftPanel.classList.remove('composer-v2-draft--pulse'), { once: true });
      // ② Cards appear 80ms later so pulse leads slightly
      setTimeout(() => showLabelStack(), 80);
    }, 4200);

    window._v2LabelTimers.push(r2t1, r2t2, r2t3, r2t4);
  }

  // ── Helper: insert agent bubble ──
  function insertAgentBubble(text, time) {
    const el = document.createElement('div');
    el.className = 'inbox-msg inbox-msg--agent inbox-msg--ai-sent';
    el.style.cssText = 'opacity:0;transform:translateY(10px)';
    el.innerHTML = `
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--agent">${text.replace(/\n/g, '<br>')}
          <div class="inbox-msg-avatar inbox-msg-avatar--agent">
            <img src="daan.png" alt="Daan" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
          </div>
        </div>
      </div>
      <div class="inbox-msg-footer">
        <span class="inbox-msg-name">Daan</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${time}</span>
      </div>`;
    msgContainer.insertBefore(el, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }));
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  // ── Helper: insert customer bubble ──
  function insertCustomerBubble(text, time) {
    const el = document.createElement('div');
    el.className = 'inbox-msg inbox-msg--customer';
    el.style.cssText = 'opacity:0;transform:translateY(10px)';
    el.innerHTML = `
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--customer">${text.replace(/\n/g, '<br>')}
          <div class="inbox-msg-avatar inbox-msg-avatar--customer" style="background:${conv.customer.color}">${conv.customer.initials}</div>
        </div>
      </div>
      <div class="inbox-msg-footer">
        <span class="inbox-msg-name">${conv.customer.name}</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${time}</span>
      </div>`;
    msgContainer.insertBefore(el, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }));
  }

  // ── STACKED LABEL CARDS ──
  function showLabelStack() {
    const wrapper = document.createElement('div');
    wrapper.className = 'inbox-pending-stack';
    // ② Start from lower — closer to where the panel lives — so cards rise from it
    wrapper.style.cssText = 'opacity:0;transform:translateY(36px)';

    // Card 1 (front — active)
    const c1 = document.createElement('div');
    c1.className = 'inbox-pending-container inbox-pending-stack__front';
    c1.insertAdjacentHTML('beforeend',
      renderPendingAction({ id: 'v2-lb-1', type: 'label-v2', label: ld.labels[0] }, convId));

    // Card 2 (back — peeking)
    const c2 = document.createElement('div');
    c2.className = 'inbox-pending-container inbox-pending-stack__back';
    c2.insertAdjacentHTML('beforeend',
      renderPendingAction({ id: 'v2-lb-2', type: 'label-v2', label: ld.labels[1] }, convId));

    wrapper.appendChild(c1);
    wrapper.appendChild(c2);
    msgContainer.insertBefore(wrapper, composer);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      // Longer spring for the extra travel distance
      wrapper.style.transition = 'opacity 0.42s cubic-bezier(0.16,1,0.3,1), transform 0.42s cubic-bezier(0.16,1,0.3,1)';
      wrapper.style.opacity = '1'; wrapper.style.transform = 'translateY(0)';

      // ③ Purple ring bloom on the front pill — fades out as card settles
      const pill = c1.querySelector('.inbox-pa-default');
      if (pill) {
        pill.classList.add('inbox-pa-default--bloom');
        pill.addEventListener('animationend', () => pill.classList.remove('inbox-pa-default--bloom'), { once: true });
      }
    }));

    // Wire Card 1
    wireCard(c1, ld.labels[0], () => {
      // Promote Card 2 to front
      c2.classList.remove('inbox-pending-stack__back');
      c2.classList.add('inbox-pending-stack__front');
      wireCard(c2, ld.labels[1], null);
    });

    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function wireCard(container, labelText, onComplete) {
    const row = container.querySelector('.inbox-pa-row');
    if (!row) return;

    // Approve → gray confirmation + chip in conv list + promote next card
    row.querySelector('.inbox-pa-approve-btn')?.addEventListener('click', () => {
      container.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
      container.style.opacity = '0'; container.style.transform = 'translateY(-4px)';
      setTimeout(() => {
        const confirm = document.createElement('div');
        confirm.className = 'inbox-pending-container';
        confirm.innerHTML = `<div class="inbox-v2-assigned-confirm">Label: ${labelText} added by Daan</div>`;
        confirm.style.cssText = 'opacity:0;transform:translateY(6px)';
        container.parentNode.replaceChild(confirm, container);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          confirm.style.transition = 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)';
          confirm.style.opacity = '1'; confirm.style.transform = 'translateY(0)';
        }));
        addLabelToList(labelText);
        if (onComplete) onComplete();
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }, 220);
    });

    // Dismiss → silent fade, promote next
    row.querySelector('.inbox-pa-dismiss-btn')?.addEventListener('click', () => {
      container.style.transition = 'opacity 0.22s ease';
      container.style.opacity = '0';
      setTimeout(() => {
        container.remove();
        if (onComplete) onComplete();
      }, 220);
    });
  }

  // ── Add label chip to conversation list ──
  function addLabelToList(labelText) {
    const convBody = document.querySelector('[data-conv="v2-conv-6"] .inbox-conv-body');
    if (!convBody) return;
    let labelsEl = convBody.querySelector('.inbox-conv-labels');
    if (!labelsEl) {
      labelsEl = document.createElement('div');
      labelsEl.className = 'inbox-conv-labels';
      const meta = convBody.querySelector('.inbox-conv-meta');
      convBody.insertBefore(labelsEl, meta);
    }
    const chip = document.createElement('span');
    chip.className = 'inbox-conv-label-chip';
    chip.textContent = labelText;
    chip.style.cssText = 'opacity:0;transform:scale(0.85)';
    labelsEl.appendChild(chip);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      chip.style.transition = 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1)';
      chip.style.opacity = '1'; chip.style.transform = 'scale(1)';
    }));
  }
}

// ══════════════════════════════════
//   V2 BARRY FLOW (Barry Calders — Internal comment + escalation)
// ══════════════════════════════════
function runV2BarryFlow(convId, suffix) {
  const conv = CONVERSATIONS_V2.find(c => c.id === convId);
  if (!conv || suffix !== 3) return;

  const draftPanel   = document.getElementById(`composer-v2-draft-${suffix}`);
  const draftBody    = document.getElementById(`composer-v2-draft-body-${suffix}`);
  const composer     = document.getElementById(`inbox-composer-${suffix}`);
  const msgContainer = document.getElementById(`inbox-thread-messages-${suffix}`);
  const bd = conv._barryData;
  if (!draftPanel || !bd) return;

  // Cross-clear all v2 timers
  [window._v2EscTimers, window._v2ReplyTimers,
   window._v2FedericoTimers, window._v2PeopleTeamTimers, window._v2CloseTimers, window._v2LabelTimers, window._v2BarryTimers]
    .forEach(arr => arr?.forEach(clearTimeout));
  window._v2BarryTimers = [];

  // Reset panel (keep visible in resting state)
  draftPanel.hidden = false; draftPanel.style.opacity = '1'; draftPanel.style.transform = '';
  const labelEl0 = draftPanel.querySelector('.composer-v2-draft-label');
  if (labelEl0) labelEl0.textContent = 'on standby';
  draftPanel.querySelector('.composer-v2-header-dots')?.remove();
  draftBody.classList.remove('composer-v2-draft-body--open'); draftBody.innerHTML = '';
  const hdr0 = draftPanel.querySelector('.composer-v2-draft-header-right');
  if (hdr0) { hdr0.style.visibility = 'hidden'; hdr0.style.opacity = '1'; hdr0.style.transform = ''; }
  if (composer) composer.hidden = false;

  // ── Helper: insert Daan agent bubble ──
  function insertAgentBubble(text, time) {
    const el = document.createElement('div');
    el.className = 'inbox-msg inbox-msg--agent inbox-msg--ai-sent';
    el.style.cssText = 'opacity:0;transform:translateY(10px)';
    el.innerHTML = `
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--agent">${text.replace(/\n/g, '<br>')}
          <div class="inbox-msg-avatar inbox-msg-avatar--agent">
            <img src="daan.png" alt="Daan" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
          </div>
        </div>
      </div>
      <div class="inbox-msg-footer inbox-msg-footer--agent">
        <span class="inbox-msg-name">Daan</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${time}</span>
      </div>`;
    msgContainer.insertBefore(el, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }));
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  // ── Helper: auto-insert internal note (no approval) ──
  function insertInternalNote() {
    const note = document.createElement('div');
    note.className = 'inbox-internal-note';
    note.style.cssText = 'opacity:0;transform:translateY(10px)';
    note.innerHTML = `
      <div class="inbox-internal-note-header">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="12" height="12" rx="2"/>
          <path d="M5 6h6M5 9h4"/>
        </svg>
        Internal note
      </div>
      <div class="inbox-internal-note-body">
        <strong>Summary</strong><br>
        ${bd.internalNote.join('<br>')}
      </div>
      <div class="inbox-internal-note-footer">
        AI-licia
        <span class="inbox-msg-sep">·</span>
        just now
      </div>`;
    msgContainer.insertBefore(note, composer);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      note.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      note.style.opacity = '1'; note.style.transform = 'translateY(0)';
    }));
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  // ── Helper: escalation card + handoff strip ──
  function showBarryEscalationCard() {
    const pContainer = document.createElement('div');
    pContainer.className = 'inbox-pending-container';
    pContainer.id = `inbox-pending-${convId}`;
    pContainer.style.cssText = 'opacity:0;transform:translateY(20px)';
    pContainer.insertAdjacentHTML('beforeend',
      renderPendingAction({ id: 'v2-esc-barry', type: 'escalate-v2' }, convId));
    // Informational only — hide approve/dismiss
    const btnGroup = pContainer.querySelector('.inbox-pa-btn-group');
    if (btnGroup) btnGroup.hidden = true;
    msgContainer.insertBefore(pContainer, composer);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      pContainer.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
      pContainer.style.opacity = '1'; pContainer.style.transform = 'translateY(0)';
    }));

    // ~350ms later: handoff strip slides in
    setTimeout(() => {
      const handoffContainer = document.createElement('div');
      handoffContainer.className = 'inbox-pending-container';
      handoffContainer.style.cssText = 'opacity:0;transform:translateY(10px)';
      handoffContainer.innerHTML = `
        <div class="inbox-pa-row inbox-pa-row--info">
          <div class="inbox-pa-default">
            <div class="inbox-pa-icon-wrap">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5" r="2.5"/><path d="M3 13.5a5 5 0 0110 0"/></svg>
            </div>
            <span class="inbox-pa-desc-bold">You can take over now</span>
            <span class="inbox-pa-desc-dim">· AI-licia has stepped aside</span>
          </div>
        </div>`;
      msgContainer.insertBefore(handoffContainer, composer);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        handoffContainer.style.transition = 'opacity 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.28s cubic-bezier(0.16,1,0.3,1)';
        handoffContainer.style.opacity = '1'; handoffContainer.style.transform = 'translateY(0)';
      }));
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 350);

    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  // Preloaded path — show draft immediately on first open
  if (conv._draftReadyForPreload) {
    conv._draftReadyForPreload = false;
    v2ShowPreloaded(draftPanel, draftBody, bd.agentReply.text.replace(/\n/g, '<br>'));
    const hdrP = draftPanel.querySelector('.composer-v2-draft-header-right');
    if (hdrP) {
      hdrP.innerHTML = `
        <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
        </button>
        <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
          Send
          <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
        </button>
        <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
        </button>`;
      v2ButtonsEnter(hdrP);
      window._v2CopiedFlag = false;
      document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
        window._v2CopiedFlag = true;
        navigator.clipboard.writeText(bd.agentReply.text);
        const btn = e.currentTarget;
        btn.querySelector('.copy-tooltip')?.remove();
        const tip = document.createElement('span'); tip.className = 'copy-tooltip'; tip.textContent = 'Copied';
        btn.appendChild(tip);
        requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
        setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
      });
      document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', () => {
        const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
        insertAgentBubble(bd.agentReply.text, bd.agentReply.time);
        v2ButtonsExit(hdrP, () => {
          v2BodyClose(draftBody);
          v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
        });
        msgContainer.scrollTop = msgContainer.scrollHeight;
        const st1 = setTimeout(() => { insertInternalNote(); }, 800);
        const st2 = setTimeout(() => {
          v2PanelEnter(draftPanel);
          v2SetLabel(draftPanel, 'composing a reply', true);
          draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 4300);
        const st3 = setTimeout(() => { v2SetLabel(draftPanel, 'proposed escalation', false); }, 5900);
        const st4 = setTimeout(() => { v2PanelExit(draftPanel, () => showBarryEscalationCard()); }, 7900);
        window._v2BarryTimers.push(st1, st2, st3, st4);
      }, { once: true });
      document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', () => {
        showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer });
      }, { once: true });
    }
    return;
  }

  // ── t=1.5s: panel springs in — "composing a reply ●●●" ──
  const t1 = setTimeout(() => {
    v2PanelEnter(draftPanel);
    v2SetLabel(draftPanel, 'composing a reply', true);
    draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 1500);
  window._v2BarryTimers.push(t1);

  // ── t=3.5s: "response preview" + reply draft + buttons ──
  const t2 = setTimeout(() => {
    v2SetLabel(draftPanel, 'response preview', false);
    setTimeout(() => {
      v2BodyOpen(draftBody, bd.agentReply.text.replace(/\n/g, '<br>'));
      draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const hdr = draftPanel.querySelector('.composer-v2-draft-header-right');
      if (hdr) {
        hdr.innerHTML = `
          <button class="composer-v2-btn--copy" id="composer-v2-copy-${suffix}" title="Copy">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M5 11H4a1.5 1.5 0 01-1.5-1.5v-6A1.5 1.5 0 014 2h6A1.5 1.5 0 0111.5 4V5"/></svg>
          </button>
          <button class="composer-v2-btn--approve" id="composer-v2-send-${suffix}">
            Send
            <span class="composer-v2-btn-badge">⌘<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M13 5v4H3M6 6l-3 3 3 3"/></svg></span>
          </button>
          <button class="composer-v2-btn--dismiss" id="composer-v2-dismiss-${suffix}" title="Minimise">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h8"/></svg>
          </button>`;
        setTimeout(() => v2ButtonsEnter(hdr), 80);
        window._v2CopiedFlag = false;

        // Copy
        document.getElementById(`composer-v2-copy-${suffix}`)?.addEventListener('click', (e) => {
          window._v2CopiedFlag = true;
          navigator.clipboard.writeText(bd.agentReply.text);
          const btn = e.currentTarget;
          btn.querySelector('.copy-tooltip')?.remove();
          const tip = document.createElement('span');
          tip.className = 'copy-tooltip'; tip.textContent = 'Copied';
          btn.appendChild(tip);
          requestAnimationFrame(() => tip.classList.add('copy-tooltip--visible'));
          setTimeout(() => { tip.classList.remove('copy-tooltip--visible'); setTimeout(() => tip.remove(), 200); }, 1500);
        });

        // Send (once)
        document.getElementById(`composer-v2-send-${suffix}`)?.addEventListener('click', () => {
          const _wasCopied = !!window._v2CopiedFlag; window._v2CopiedFlag = false;
          insertAgentBubble(bd.agentReply.text, bd.agentReply.time);
          v2ButtonsExit(hdr, () => {
            v2BodyClose(draftBody);
            v2SetLabel(draftPanel, _wasCopied ? 'your edits logged as feedback' : 'message sent', false);
          });
          msgContainer.scrollTop = msgContainer.scrollHeight;

          // t+800ms: internal note auto-inserts
          const st1 = setTimeout(() => {
            insertInternalNote();
          }, 800);

          // t+4300ms: panel re-enters — "composing a reply ●●●" (after 4s feedback label)
          const st2 = setTimeout(() => {
            v2PanelEnter(draftPanel);
            v2SetLabel(draftPanel, 'composing a reply', true);
            draftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 4300);

          // t+5900ms: label → "proposed escalation"
          const st3 = setTimeout(() => {
            v2SetLabel(draftPanel, 'proposed escalation', false);
          }, 5900);

          // t+7900ms: panel exits → escalation card + handoff strip
          const st4 = setTimeout(() => {
            v2PanelExit(draftPanel, () => showBarryEscalationCard());
          }, 7900);

          window._v2BarryTimers.push(st1, st2, st3, st4);
        }, { once: true });

        // Dismiss
        document.getElementById(`composer-v2-dismiss-${suffix}`)?.addEventListener('click', () => {
          showDismissBanner({ panel: draftPanel, suffix, msgContainer, composer });
        }, { once: true });
      }
    }, 180);
  }, 3500);
  window._v2BarryTimers.push(t2);
}

function renderCustomerMsg(customer, msg) {
  const text = msg.text.replace(/\n/g, '<br>');
  return `
    <div class="inbox-msg inbox-msg--customer">
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble">${text}
          <div class="inbox-msg-avatar" style="background:${customer.color}">${customer.initials}</div>
        </div>
      </div>
      <div class="inbox-msg-footer">
        <span class="inbox-msg-name">${customer.name}</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${msg.time}</span>
        <a href="#" class="inbox-msg-translate"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M2 4h6M5 2v2M3 4c.8 2 2.5 3.5 4 4.5M7 4c-.8 2-2.5 3.5-4 4.5"/><path d="M9 13l2.5-6 2.5 6M10 11.5h3"/></svg> Translate</a>
      </div>
    </div>`;
}

function renderAiDraftMsg(msg, convId) {
  const text = msg.text.replace(/\n/g, '<br>');
  const hasFeedback = feedbackSubmitted.has(convId);
  return `
    <div class="inbox-ai-card" data-msg-id="${msg.id}" data-conv-id="${convId}">
      <div class="inbox-ai-card-header">
        <div class="inbox-ai-card-header-left">
          <div class="inbox-ai-card-icon">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="6" width="14" height="9" rx="2"/><circle cx="8" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="11" r="1" fill="currentColor" stroke="none"/><path d="M10 6V4m-3 0h6"/></svg>
          </div>
          <span class="inbox-ai-card-title">AI Draft by AI-licia</span>
        </div>
        <button class="inbox-ai-card-collapse" title="Collapse">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 6l4 4 4-4"/></svg>
        </button>
      </div>
      <div class="inbox-ai-card-body">${text}</div>
      <div class="inbox-ai-card-actions">
        <button class="inbox-ai-card-btn inbox-ai-card-btn--feedback" data-msg-id="${msg.id}" ${hasFeedback ? 'disabled style="opacity:0.5"' : ''}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:14px;height:14px"><path d="M8 2v4l2.5 1.5M14 8A6 6 0 112 8a6 6 0 0112 0z"/></svg>
          ${hasFeedback ? 'Feedback sent' : 'Give feedback'}
        </button>
        <button class="inbox-ai-card-btn inbox-ai-card-btn--edit" data-msg-id="${msg.id}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:14px;height:14px"><path d="M11.5 2.5a1.4 1.4 0 012 2L5 13l-3 1 1-3 8.5-8.5z"/></svg>
          Approve &amp; edit
        </button>
        <button class="inbox-ai-card-btn inbox-ai-card-btn--approve" data-msg-id="${msg.id}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:14px;height:14px"><path d="M3 8l3.5 3.5L13 5"/></svg>
          Approve &amp; send
        </button>
      </div>
    </div>`;
}

function renderAgentMsg(msg) {
  const text = msg.text.replace(/\n/g, '<br>');
  return `
    <div class="inbox-msg inbox-msg--agent">
      <div class="inbox-msg-card">
        <div class="inbox-msg-bubble inbox-msg-bubble--agent">${text}
          <div class="inbox-msg-avatar inbox-msg-avatar--agent">S</div>
        </div>
      </div>
      <div class="inbox-msg-footer inbox-msg-footer--agent">
        <span class="inbox-msg-name">You</span>
        <span class="inbox-msg-sep">-</span>
        <span class="inbox-msg-time">${msg.time}</span>
        <a href="#" class="inbox-msg-translate"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M2 4h6M5 2v2M3 4c.8 2 2.5 3.5 4 4.5M7 4c-.8 2-2.5 3.5-4 4.5"/><path d="M9 13l2.5-6 2.5 6M10 11.5h3"/></svg> Translate</a>
      </div>
    </div>`;
}

function renderActionLog(act, convId) {
  const hasFeedback = feedbackSubmitted.has(convId);
  return `<div class="inbox-action-log"><span class="inbox-action-log-text">${act.text}</span></div>`;
}

// ══════════════════════════════════
//   PENDING ACTION CARDS
// ══════════════════════════════════
const PENDING_ACTION_CONFIG = {
  label: {
    title:    act => `Label: "${act.label}"`,
    dimText:  ()  => `AI Agent wants to add label:`,
    boldText: act => act.label,
    chips: ['Wrong label', 'Not applicable', 'Already exists', 'Other']
  },
  'label-v2': {
    title:    act => `Label: "${act.label}"`,
    dimText:  ()  => 'AI-licia would',
    boldText: act => `add label: ${act.label}`,
    chips: ['Wrong label', 'Not applicable', 'Already exists', 'Other']
  },
  'assign-user': {
    title:    act => `Assign to: ${act.user.name}`,
    dimText:  ()  => `AI Agent wants to assign:`,
    boldText: act => act.user.name,
    chips: ['Wrong user', 'Should assign to user', 'Assignment not needed', 'Other']
  },
  'assign-team': {
    title:    act => `Assign to team: ${act.team}`,
    dimText:  ()  => `AI Agent wants to assign to team:`,
    boldText: act => act.team,
    chips: ['Wrong team', 'AI can handle', 'Re-route', 'Other']
  },
  escalate: {
    title:    () => 'Escalate to human agent',
    dimText:  () => `AI Agent wants to:`,
    boldText: () => `escalate conversation`,
    chips: ['Not urgent', 'AI can handle', 'Wrong team', 'Other']
  },
  'escalate-v2': {
    title:    () => 'Escalated to human agent',
    dimText:  () => 'AI-licia would have',
    boldText: () => 'escalated this to human',
    chips: ['Not urgent', 'AI can handle', 'Wrong team', 'Other']
  },
  'handover-v2': {
    title:    () => 'Handed over to human agent',
    dimText:  () => 'AI-licia would have',
    boldText: () => 'handed this over to human',
    chips: ['Not urgent', 'AI can handle', 'Wrong team', 'Other']
  },
  'assign-federico': {
    title:    () => 'Assign to Federico',
    dimText:  () => 'AI-licia would',
    boldText: () => 'assign this to Federico',
    chips: ['Wrong person', 'I can handle', 'Wrong team', 'Other']
  },
  'assign-people-team': {
    title:    () => 'Assign to People team',
    dimText:  () => 'AI-licia would',
    boldText: () => 'assign this to People team',
    chips: ['Wrong team', 'I can handle', 'Not needed', 'Other']
  },
  'close-conversation': {
    title:    () => 'Close conversation',
    dimText:  () => 'AI-licia would',
    boldText: () => 'close this conversation',
    chips: ['Not resolved', 'Follow-up needed', 'Customer not satisfied', 'Other']
  },
  comment: {
    title:    () => 'Add internal comment',
    dimText:  () => `AI Agent wants to add:`,
    boldText: () => `internal comment`,
    chips: ['Not relevant', 'Wrong info', 'Too early', 'Other']
  }
};

function approvePendingAction(actionId, convId) {
  const card = document.querySelector(`[data-action-id="${actionId}"]`);
  if (!card) return;
  const conv = CONVERSATIONS.find(c => c.id === convId);
  const act = conv?.pendingActions?.find(a => a.id === actionId);
  if (!act) return;
  const pillText = {
    label:         `Label '${act.label}' added by AI Agent`,
    'assign-user': `Assigned to ${act.user?.name} by AI Agent`,
    'assign-team': `Assigned to ${act.team} team by AI Agent`,
    escalate:      'Escalated by AI Agent',
    comment:       'Internal comment added by AI Agent'
  }[act.type] || 'Action completed by AI Agent';

  // Persist: move from pendingActions to actions
  conv.pendingActions = conv.pendingActions.filter(a => a.id !== actionId);
  if (!conv.actions) conv.actions = [];
  conv.actions.push({ id: act.id, text: pillText, time: 'Just now' });

  card.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
  card.style.opacity = '0';
  card.style.transform = 'translateY(-4px)';
  setTimeout(() => {
    const pill = document.createElement('div');
    pill.className = 'inbox-action-log';
    pill.innerHTML = `<span class="inbox-action-log-text">${pillText}</span>`;
    card.parentNode.replaceChild(pill, card);
  }, 220);
}

function stopPendingAction(actionId, convId, row) {
  if (!row) row = document.querySelector(`[data-action-id="${actionId}"]`);
  if (!row) return;

  const defaultPanel = row.querySelector('.inbox-pa-default');
  const feedback = row.querySelector('.inbox-pa-feedback');
  const commentPanel = row.querySelector('.inbox-pa-comment');
  const commentInput = commentPanel.querySelector('.inbox-pa-comment-input');
  const selectedChipLabel = commentPanel.querySelector('.inbox-pa-selected-chip');

  // A → B
  defaultPanel.hidden = true;
  feedback.removeAttribute('hidden');

  // Back in B → A
  feedback.querySelector('.inbox-pa-back-btn').addEventListener('click', () => {
    feedback.hidden = true;
    defaultPanel.removeAttribute('hidden');
  });

  // Chip in B → C
  feedback.querySelectorAll('.inbox-pa-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      feedback.hidden = true;
      commentPanel.dataset.selectedChip = chip.dataset.chip;
      selectedChipLabel.textContent = chip.dataset.chip;
      commentPanel.removeAttribute('hidden');
      commentInput.focus();
    });
  });

  // Back in C → B
  commentPanel.querySelector('.inbox-pa-undo-btn').addEventListener('click', () => {
    commentPanel.hidden = true;
    feedback.removeAttribute('hidden');
  });

  // Send in C → submit
  commentPanel.querySelector('.inbox-pa-send-btn').addEventListener('click', () => {
    submitPendingFeedback(actionId, convId, row);
  });
}

function submitPendingFeedback(actionId, convId, row) {
  if (!row) row = document.querySelector(`[data-action-id="${actionId}"]`);
  if (!row) return;
  const conv = CONVERSATIONS.find(c => c.id === convId);
  const act = conv?.pendingActions?.find(a => a.id === actionId);
  if (!act) return;
  // Persist: remove stopped action from pendingActions
  conv.pendingActions = conv.pendingActions.filter(a => a.id !== actionId);
  const cfg = PENDING_ACTION_CONFIG[act.type];

  const commentPanel = row.querySelector('.inbox-pa-comment');
  const chipText = commentPanel?.dataset.selectedChip || '';
  const commentText = commentPanel?.querySelector('.inbox-pa-comment-input')?.value.trim() || '';
  const feedbackType = chipText || 'Other';

  if (chipText) {
    feedbackLog.push({
      id: 'fb-' + Date.now(),
      type: feedbackType,
      feedback: `Stopped pending action: ${cfg.title(act)}${commentText ? '. ' + commentText : ''}`,
      from: 'Human agent',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      convId,
      iteration: 2,
      suggestion: classifyFeedback(feedbackType, cfg.title(act)),
      processed: false
    });
  }

  // Show thanks pill, then fade the whole row out
  row.querySelectorAll('.inbox-pa-default, .inbox-pa-feedback, .inbox-pa-comment').forEach(el => { el.hidden = true; });
  const thanks = document.createElement('div');
  thanks.className = 'inbox-pa-thanks';
  thanks.textContent = 'Thanks for the feedback';
  row.appendChild(thanks);

  setTimeout(() => {
    row.style.transition = 'opacity 0.3s ease, max-height 0.3s ease';
    row.style.opacity = '0';
    row.style.maxHeight = '0';
    row.style.overflow = 'hidden';
    setTimeout(() => row.remove(), 320);
  }, 2200);
}

function renderPendingAction(act, convId) {
  const cfg = PENDING_ACTION_CONFIG[act.type];
  if (!cfg) return '';
  const chips = cfg.chips.map(c =>
    `<button class="inbox-pa-chip" data-chip="${c}">${c}</button>`
  ).join('');
  const arrowLeftIcon = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4L6 8l4 4M6 8h8"/></svg>`;
  const sendIcon = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 1.5L7 9M14.5 1.5L10 14l-3-5-5-3 12.5-4.5z"/></svg>`;
  return `
    <div class="inbox-pa-row" data-action-id="${act.id}" data-conv-id="${convId}" data-action-type="${act.type}">

      <!-- Panel A: notification pill -->
      <div class="inbox-pa-default">
        <div class="inbox-pa-icon-wrap">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
            <circle cx="6" cy="5" r="2.5"/>
            <path d="M1.5 12.5a4.5 4.5 0 018 0"/>
            <path d="M11 8h4M13 6l2 2-2 2" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="inbox-pa-desc-dim">${cfg.dimText(act)}</span>
        <span class="inbox-pa-desc-bold">${cfg.boldText(act)}</span>
        <div class="inbox-pa-btn-group">
          <button class="inbox-pa-approve-btn" title="Approve">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l3 3L13 5"/></svg>
          </button>
          <button class="inbox-pa-dismiss-btn" title="Stop">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        </div>
      </div>

      <!-- Panel B: reason chips -->
      <div class="inbox-pa-feedback" hidden>
        <button class="inbox-pa-back-btn" title="Back">${arrowLeftIcon}</button>
        ${chips}
      </div>

      <!-- Panel C: comment card -->
      <div class="inbox-pa-comment" hidden>
        <div class="inbox-pa-comment-inner">
          <textarea class="inbox-pa-comment-input" placeholder="Share internal feedback..." rows="3"></textarea>
          <div class="inbox-pa-comment-toolbar">
            <div class="inbox-pa-comment-toolbar-left">
              <button class="inbox-pa-undo-btn" title="Back">${arrowLeftIcon}</button>
              <span class="inbox-pa-selected-chip"></span>
            </div>
            <button class="inbox-pa-send-btn" title="Send">${sendIcon}</button>
          </div>
        </div>
      </div>

    </div>`;
}

// ══════════════════════════════════
//   FEEDBACK MODAL
// ══════════════════════════════════
const feedbackOverlay = document.getElementById('feedback-overlay');

const FEEDBACK_OPTIONS = {
  message: {
    label: 'What went wrong with the message?',
    options: [
      { value: 'incorrect-info', text: 'Incorrect information' },
      { value: 'missing-info', text: 'Missing information' },
      { value: 'wrong-tone', text: 'Wrong tone' },
      { value: 'premature-question', text: 'Asked question too early' },
      { value: 'flow-issue', text: 'Conversation flow issue' },
      { value: 'missing-suggestion', text: 'Missing suggestion' },
    ]
  },
  action: {
    label: 'What went wrong with the action?',
    options: [
      { value: 'wrong-label',            text: 'Wrong label' },
      { value: 'label-not-applicable',   text: 'Label not applicable' },
      { value: 'wrong-person',           text: 'Wrong person assigned' },
      { value: 'wrong-team',             text: 'Wrong team assigned' },
      { value: 'unnecessary-escalation', text: 'Escalation unnecessary' },
      { value: 'should-escalate',        text: 'Should have escalated' },
      { value: 'comment-not-relevant',   text: 'Comment not relevant' },
      { value: 'action-missing',         text: 'Action missing' },
    ]
  }
};

function openFeedbackModal(convId, triggerType) {
  feedbackOverlay.hidden = false;
  feedbackOverlay.dataset.convId = convId;
  const config = FEEDBACK_OPTIONS[triggerType] || FEEDBACK_OPTIONS.message;
  const label = document.getElementById('feedback-problem-label');
  label.textContent = config.label;
  const wrapper = document.getElementById('feedback-problem-select');
  const valueEl = wrapper.querySelector('.custom-select-value');
  const optionsList = wrapper.querySelector('.custom-select-options');
  valueEl.textContent = 'Select problem type...';
  valueEl.dataset.value = '';
  wrapper.classList.remove('open');
  optionsList.hidden = true;
  optionsList.innerHTML = config.options.map(o =>
    `<li data-value="${o.value}">${o.text}</li>`
  ).join('');
  document.getElementById('feedback-note').value = '';
}

// Custom select interaction
(function() {
  const wrapper = document.getElementById('feedback-problem-select');
  const trigger = wrapper.querySelector('.custom-select-trigger');
  const optionsList = wrapper.querySelector('.custom-select-options');
  const valueEl = wrapper.querySelector('.custom-select-value');

  trigger.addEventListener('click', () => {
    const isOpen = !optionsList.hidden;
    optionsList.hidden = isOpen;
    wrapper.classList.toggle('open', !isOpen);
  });

  optionsList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    valueEl.textContent = li.textContent;
    valueEl.dataset.value = li.dataset.value;
    optionsList.querySelectorAll('li').forEach(l => l.classList.remove('selected'));
    li.classList.add('selected');
    optionsList.hidden = true;
    wrapper.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      optionsList.hidden = true;
      wrapper.classList.remove('open');
    }
  });
})();

function closeFeedbackModal() {
  const source = feedbackOverlay.dataset.source;
  feedbackOverlay.dataset.source = '';
  feedbackOverlay.hidden = true;
  if (source === 'ignore') {
    const ta = document.getElementById('composer-textarea-2');
    if (ta) ta.focus();
  }
}

document.getElementById('feedback-close').addEventListener('click', closeFeedbackModal);
feedbackOverlay.addEventListener('click', e => { if (e.target === feedbackOverlay) closeFeedbackModal(); });

document.getElementById('btn-submit-feedback').addEventListener('click', function () {
  const convId = feedbackOverlay.dataset.convId;
  const problem = document.querySelector('#feedback-problem-select .custom-select-value').dataset.value;
  const note = document.getElementById('feedback-note').value;

  if (!problem) {
    const trigger = document.querySelector('#feedback-problem-select .custom-select-trigger');
    trigger.style.borderColor = 'var(--error-500)';
    setTimeout(() => { trigger.style.borderColor = ''; }, 1500);
    return;
  }

  // Find the conversation and create/update improvement
  const conv = CONVERSATIONS.find(c => c.id === convId);
  if (conv && conv.improvementMapping) {
    addImprovement(conv.improvementMapping, note);
  }

  // Log raw feedback entry for the Feedback tab
  const selectedType = document.querySelector('.custom-select-trigger')?.textContent?.trim() || 'General';
  feedbackLog.push({
    id: 'fb-' + Date.now(),
    type: selectedType,
    feedback: note,
    from: 'Daan',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    convId: convId,
    iteration: activeInboxIteration,
    suggestion: classifyFeedback(selectedType, note),
    processed: false
  });

  // Mark as submitted
  feedbackSubmitted.add(convId);

  // Visual confirmation
  this.textContent = 'Submitted!';
  this.style.background = 'var(--success-500)';
  setTimeout(() => {
    this.textContent = 'Submit feedback';
    this.style.background = '';
    closeFeedbackModal();
    // Inbox-2 preserves dynamic bubbles — no re-render needed
  }, 800);
});

// ══════════════════════════════════
//   IMPROVEMENT PIPELINE
// ══════════════════════════════════
function addImprovement(mapping, agentNote) {
  // Check if similar improvement already exists
  const existing = improvements.find(imp =>
    imp.type === mapping.type &&
    imp.topic === mapping.topic &&
    imp.group === mapping.group &&
    imp.title === mapping.item
  );

  if (existing) {
    existing.count++;
    if (agentNote) {
      existing.detail.humanFeedback += '\n\nAdditional note: ' + agentNote;
    }
  } else {
    improvements.push({
      id: 'imp-' + Date.now(),
      type: mapping.type,
      topic: mapping.topic,
      group: mapping.group,
      title: mapping.item,
      count: 1,
      status: 'open',
      detail: { ...mapping.detail }
    });
  }
}

// ══════════════════════════════════
//   IMPROVE PAGE
// ══════════════════════════════════
function renderImprovePage() {
  const activeTab = document.querySelector('.improve-tab--active')?.dataset.tab || 'open';
  const openItems = improvements.filter(i => i.status === 'open');
  const resolvedItems = improvements.filter(i => i.status === 'resolved' || i.status === 'dismissed');

  // Hide all tab containers first
  document.getElementById('improve-list').hidden = true;
  document.getElementById('improve-list-resolved').hidden = true;
  document.getElementById('improve-empty-resolved').hidden = true;
  document.getElementById('improve-feedback-tab').hidden = true;

  if (activeTab === 'open') {
    document.getElementById('improve-list').hidden = false;
    renderImproveList('improve-list', openItems);
  } else if (activeTab === 'resolved') {
    document.getElementById('improve-list-resolved').hidden = false;
    renderImproveList('improve-list-resolved', resolvedItems);
    document.getElementById('improve-empty-resolved').hidden = resolvedItems.length > 0;
  } else if (activeTab === 'feedback') {
    document.getElementById('improve-feedback-tab').hidden = false;
    renderFeedbackTable();
  }
}

function renderFeedbackTable() {
  const tbody = document.getElementById('feedback-table-body');
  const empty = document.getElementById('feedback-empty');
  const countEl = document.querySelector('.feedback-table-count');
  const deleteBtn = document.getElementById('feedback-delete-btn');
  const selectAll = document.getElementById('feedback-select-all');

  // Update version label
  const versionLabel = document.getElementById('feedback-version-label');
  if (versionLabel) versionLabel.textContent = 'Showing feedback for Agent V' + activeInboxIteration;

  // Filter by active iteration
  const filtered = feedbackLog.filter(fb => fb.iteration === activeInboxIteration);

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    countEl.textContent = '0 items';
    deleteBtn.disabled = true;
    if (selectAll) selectAll.checked = false;
    return;
  }

  empty.hidden = true;
  countEl.textContent = filtered.length + ' item' + (filtered.length !== 1 ? 's' : '');

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let valA = a[feedbackSort.key] || '';
    let valB = b[feedbackSort.key] || '';
    if (feedbackSort.key === 'date') {
      valA = new Date(valA); valB = new Date(valB);
    }
    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
    return feedbackSort.dir === 'asc' ? cmp : -cmp;
  });

  tbody.innerHTML = sorted.map(fb => {
    const processedClass = fb.processed ? 'feedback-row--processed' : '';
    return `
      <tr data-fb-id="${fb.id}" class="${processedClass}">
        <td><input type="checkbox" class="feedback-row-check" ${fb.processed ? 'disabled' : ''}></td>
        <td><span class="feedback-type-badge">${fb.type}</span></td>
        <td class="feedback-text-cell">${fb.feedback || '—'}</td>
        <td>${fb.from}</td>
        <td>${fb.date}</td>
        <td>${fb.convId ? `<a href="#" class="feedback-ticket-link" data-conv-id="${fb.convId}">View ticket →</a>` : '—'}</td>
        <td><button class="feedback-fix-btn" data-fb-id="${fb.id}" ${fb.processed ? 'disabled' : ''} title="Process feedback">→</button></td>
      </tr>
    `;
  }).join('');

  // Bind fix buttons
  tbody.querySelectorAll('.feedback-fix-btn').forEach(btn => {
    btn.addEventListener('click', () => openFeedbackDrawer(btn.dataset.fbId));
  });

  // Bind ticket links
  tbody.querySelectorAll('.feedback-ticket-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const cid = link.dataset.convId;
      document.querySelector('.si-btn[data-page="inbox"]')?.click();
      setTimeout(() => {
        const item = document.querySelector(`.inbox-conv-item[data-conv="${cid}"]`);
        if (item) item.click();
      }, 150);
    });
  });

  // Bind row checkboxes
  updateFeedbackDeleteState();
  tbody.querySelectorAll('.feedback-row-check').forEach(cb => {
    cb.addEventListener('change', updateFeedbackDeleteState);
  });
}

function updateFeedbackDeleteState() {
  const checks = document.querySelectorAll('.feedback-row-check:checked');
  const deleteBtn = document.getElementById('feedback-delete-btn');
  deleteBtn.disabled = checks.length === 0;
}

function renderImproveList(containerId, items) {
  const container = document.getElementById(containerId);
  const types = ['Knowledge', 'Behavior', 'Actions'];
  const typeLabels = {
    Knowledge: 'Knowledge-gap escalations',
    Behavior: 'Behaviour',
    Actions: 'Actions',
  };

  let html = '';

  types.forEach(type => {
    const typeItems = items.filter(i => i.type === type);
    if (typeItems.length === 0) return;

    // Group by topic then by group
    const topics = {};
    typeItems.forEach(item => {
      if (!topics[item.topic]) topics[item.topic] = {};
      if (!topics[item.topic][item.group]) topics[item.topic][item.group] = [];
      topics[item.topic][item.group].push(item);
    });

    html += `<div class="improve-type">
      <div class="improve-type-heading">${typeLabels[type]}</div>`;

    Object.entries(topics).forEach(([topicName, groups]) => {
      const topicCount = Object.values(groups).reduce((s, g) => s + g.length, 0);
      html += `<div class="improve-topic-card">
        <div class="improve-topic-row">
          <span class="improve-topic-name">${topicName}</span>
          <span class="improve-topic-badge">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-6"/></svg>
            ${topicCount} Improvement${topicCount !== 1 ? 's' : ''}
          </span>
          <button class="improve-topic-toggle" aria-label="Toggle">
            <svg class="improve-toggle-plus" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>
            <svg class="improve-toggle-minus" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 8h10"/></svg>
          </button>
        </div>
        <div class="improve-topic-body">`;

      Object.entries(groups).forEach(([groupName, groupItems]) => {
        html += `<div class="improve-group-label">${groupName}</div>`;
        groupItems.forEach(item => {
          html += `<div class="improve-item" data-imp-id="${item.id}">
            <span class="improve-item-title">${item.title}</span>
            <svg class="improve-item-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4"/></svg>
          </div>`;
        });
      });

      html += `</div></div>`;
    });

    html += `</div>`;
  });

  if (items.length === 0) {
    html = '<div class="improve-empty"><p>No improvements in this tab.</p></div>';
  }

  container.innerHTML = html;

  // Bind topic card collapse toggles
  container.querySelectorAll('.improve-topic-card').forEach(card => {
    const toggle = card.querySelector('.improve-topic-toggle');
    const row = card.querySelector('.improve-topic-row');
    // Start collapsed by default
    card.classList.add('improve-topic-card--collapsed');

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      card.classList.toggle('improve-topic-card--collapsed');
    });
    row.addEventListener('click', () => {
      card.classList.toggle('improve-topic-card--collapsed');
    });
  });

  // Bind item clicks
  container.querySelectorAll('.improve-item').forEach(item => {
    item.addEventListener('click', () => openImproveDetail(item.dataset.impId));
  });
}

// Improve tabs
document.querySelectorAll('.improve-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.improve-tab').forEach(t => t.classList.remove('improve-tab--active'));
    tab.classList.add('improve-tab--active');
    renderImprovePage();
  });
});

// ══════════════════════════════════
//   IMPROVE DETAIL SIDEBAR
// ══════════════════════════════════
let activeImprovementId = null;

function extractFeedbackType(feedback) {
  // Use the same categories as the inbox feedback select field
  const allOptions = [
    ...FEEDBACK_OPTIONS.message.options,
    ...FEEDBACK_OPTIONS.action.options,
  ];
  const lower = feedback.toLowerCase();
  // Match against select option texts
  for (const opt of allOptions) {
    if (lower.startsWith(opt.text.toLowerCase())) return opt.text;
  }
  // Fallback: check for keywords from the select options
  for (const opt of allOptions) {
    const keywords = opt.text.toLowerCase().split(' ');
    if (keywords.some(kw => kw.length > 3 && lower.includes(kw))) return opt.text;
  }
  return 'Feedback';
}

function openImproveDetail(impId) {
  activeImprovementId = impId;
  const imp = improvements.find(i => i.id === impId);
  if (!imp) return;

  document.getElementById('improve-detail-title').textContent = 'Review improvement';
  document.getElementById('detail-context').textContent = imp.detail.context;
  document.getElementById('detail-ai-response').textContent = imp.detail.aiResponse;

  // Feedback with type badge
  const feedbackType = extractFeedbackType(imp.detail.humanFeedback);
  document.getElementById('detail-feedback-badge').textContent = feedbackType;
  // Remove the prefix from feedback text if it matches
  let feedbackText = imp.detail.humanFeedback;
  const dashIdx = feedbackText.indexOf('—');
  if (dashIdx > 0 && dashIdx < 30) feedbackText = feedbackText.substring(dashIdx + 1).trim();
  document.getElementById('detail-feedback').textContent = '"' + feedbackText + '"';

  // Where section (removed from modal, guarded for safety)
  const whereEl = document.getElementById('detail-where');
  if (whereEl) whereEl.textContent = 'Scenario: ' + imp.detail.context.split('.')[0].toLowerCase();

  // Render prompt diff (removed from modal, guarded for safety)
  const diffContainer = document.getElementById('detail-prompt-change');
  if (diffContainer) {
    diffContainer.innerHTML = imp.detail.promptDiff.map(line => {
      const prefix = line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  ';
      return `<div class="improve-prompt-line improve-prompt-line--${line.type}">${prefix}${line.text}</div>`;
    }).join('');
  }

  // Update action buttons based on status
  const approveBtn = document.getElementById('btn-approve-improvement');
  const dismissBtn = document.getElementById('btn-dismiss-improvement');
  if (imp.status === 'resolved' || imp.status === 'dismissed') {
    approveBtn.textContent = imp.status === 'resolved' ? 'Already applied' : 'Dismissed';
    approveBtn.disabled = true;
    approveBtn.style.opacity = '0.5';
    dismissBtn.disabled = true;
    dismissBtn.style.opacity = '0.5';
  } else {
    approveBtn.textContent = 'Approve & Apply';
    approveBtn.disabled = false;
    approveBtn.style.opacity = '';
    dismissBtn.disabled = false;
    dismissBtn.style.opacity = '';
  }

  document.getElementById('improve-detail-overlay').hidden = false;
}

function closeImproveDetail() {
  document.getElementById('improve-detail-overlay').hidden = true;
  activeImprovementId = null;
}

document.getElementById('improve-detail-close').addEventListener('click', closeImproveDetail);
document.getElementById('improve-detail-backdrop').addEventListener('click', closeImproveDetail);
document.getElementById('btn-dismiss-improvement').addEventListener('click', function () {
  if (!activeImprovementId) return;
  const imp = improvements.find(i => i.id === activeImprovementId);
  if (!imp || imp.status !== 'open') return;

  imp.status = 'dismissed';
  this.textContent = 'Dismissed';
  this.style.opacity = '0.5';
  setTimeout(() => {
    this.textContent = 'Dismiss';
    this.style.opacity = '';
    closeImproveDetail();
    renderImprovePage();
  }, 600);
});

document.getElementById('btn-approve-improvement').addEventListener('click', function () {
  if (!activeImprovementId) return;
  const imp = improvements.find(i => i.id === activeImprovementId);
  if (!imp || imp.status === 'resolved') return;

  imp.status = 'resolved';
  this.textContent = 'Applied!';
  this.style.background = 'var(--success-500)';
  setTimeout(() => {
    this.textContent = 'Approve & Apply';
    this.style.background = '';
    closeImproveDetail();
    renderImprovePage();
  }, 800);
});

document.getElementById('btn-edit-prompt')?.addEventListener('click', function () {
  const lines = document.querySelectorAll('#detail-prompt-change .improve-prompt-line');
  lines.forEach(line => {
    line.contentEditable = 'true';
    line.style.outline = '1px dashed var(--grey-400)';
    line.style.cursor = 'text';
  });
  this.textContent = 'Editing...';
  this.disabled = true;
});

// Feedback table: sorting
document.querySelectorAll('.feedback-th-sortable').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (feedbackSort.key === key) {
      feedbackSort.dir = feedbackSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      feedbackSort.key = key;
      feedbackSort.dir = 'asc';
    }
    renderFeedbackTable();
  });
});

// Feedback table: select all
document.getElementById('feedback-select-all')?.addEventListener('change', function() {
  document.querySelectorAll('.feedback-row-check').forEach(cb => { cb.checked = this.checked; });
  updateFeedbackDeleteState();
});

// Feedback table: delete selected
document.getElementById('feedback-delete-btn')?.addEventListener('click', () => {
  const checked = document.querySelectorAll('.feedback-row-check:checked');
  const idsToRemove = new Set();
  checked.forEach(cb => {
    const row = cb.closest('tr');
    if (row) idsToRemove.add(row.dataset.fbId);
  });
  for (let i = feedbackLog.length - 1; i >= 0; i--) {
    if (idsToRemove.has(feedbackLog[i].id)) feedbackLog.splice(i, 1);
  }
  document.getElementById('feedback-select-all').checked = false;
  renderFeedbackTable();
});

// ══════════════════════════════════
//   FEEDBACK DRAWER EVENT BINDINGS
// ══════════════════════════════════
document.getElementById('drawer-close-btn')?.addEventListener('click', closeFeedbackDrawer);
document.querySelector('#feedback-process-drawer .feedback-drawer-backdrop')?.addEventListener('click', closeFeedbackDrawer);

document.getElementById('drawer-change-btn')?.addEventListener('click', () => {
  const override = document.getElementById('drawer-override');
  const btn = document.getElementById('drawer-change-btn');
  override.hidden = !override.hidden;
  btn.textContent = override.hidden ? 'Change destination ↓' : 'Change destination ↑';
});

document.getElementById('drawer-apply-btn')?.addEventListener('click', applyFeedbackFix);

// ══════════════════════════════════
//   INIT
// ══════════════════════════════════
renderConversationList(activeInboxIteration);

// Apply iteration-specific labels
if (_uiIteration === 2) {
  const agentNameEl = document.querySelector('.agent-name');
  if (agentNameEl) agentNameEl.textContent = 'Customer Support Agent V2';
}
