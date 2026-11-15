const clues = [
  ['sender', 'The sender domain is not an official UW address.'],
  ['deadline', 'Urgency pressures Bucky to act without checking.'],
  ['link', 'The recovery site is not an official uw.edu domain.'],
  ['credentials', 'Never send a password or student ID by email.'],
  ['giftcards', 'Gift card codes are a common scam payment method.']
];
let locked = false;
const $ = id => document.getElementById(id);
const emailWindow = $('emailWindow');
const initialHint = '<b>HOW TO PLAY</b><br>1. Click the Badger Mail icon.<br>2. Find suspicious details in Daisy’s email.<br>3. Click <strong>REPORT PHISHING</strong>.';
const openHint = '<b>FIND THE PHISH</b><br>Click all 5 suspicious parts.<br>Then click <strong>REPORT PHISHING</strong>.';

function openMail() {
  if (locked) return;
  emailWindow.classList.remove('mail-closed');
  emailWindow.setAttribute('aria-hidden', 'false');
  $('mailIcon').classList.add('mail-icon-hidden');
  $('buckyHint').innerHTML = openHint;
  $('sceneLabel').innerHTML = '<span class="blip"></span> DAISY BADGER — NEW MESSAGE';
}

function closeMail() {
  emailWindow.classList.add('mail-closed');
  emailWindow.setAttribute('aria-hidden', 'true');
  $('mailIcon').classList.remove('mail-icon-hidden');
  $('buckyHint').innerHTML = initialHint;
  $('sceneLabel').innerHTML = '<span class="blip"></span> NEW MAIL! CLICK THE FLASHING BADGER MAIL ICON';
}

$('mailIcon').addEventListener('click', openMail);
$('closeMailBtn').addEventListener('click', closeMail);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !emailWindow.classList.contains('mail-closed')) closeMail();
});

$('senderAddress').innerHTML = '&lt;<span class="clue" data-clue="sender">daisy@tail-recovery.help</span>&gt;';
$('emailBody').innerHTML = [
  '<p>Hey Bucky!</p>',
  '<p>I saw your note on the Badger Board about losing your tail. My aunt works with the UW Tail Recovery Team, and she can get it back!</p>',
  '<p>You have to act <span class="clue" data-clue="deadline">before midnight</span> — your recovery request expires tonight.</p>',
  '<p>Start here: <span class="clue email-link" data-clue="link">uw-tail-recovery.com/restore</span></p>',
  '<p>To confirm it’s really you, send your <span class="clue" data-clue="credentials">NetID password and a photo of your student ID</span>.</p>',
  '<p>A $25 refundable deposit is required. Pay with <span class="clue" data-clue="giftcards">gift cards and send the codes here</span>.</p>',
  '<p>We’ll get your tail back in no time!<br>Daisy 🦡</p>'
].join('');

function updateCounter() {
  const found = document.querySelectorAll('.clue.selected').length;
  $('clueCounter').textContent = `CLUES FOUND: ${found} / ${clues.length}`;
}

document.addEventListener('click', event => {
  const clue = event.target.closest('.clue');
  if (clue && !locked) {
    clue.classList.toggle('selected');
    updateCounter();
  }
});

function submitFindings() {
  if (locked) return;
  locked = true;
  const selected = new Set([...document.querySelectorAll('.clue.selected')].map(el => el.dataset.clue));
  const allFound = clues.every(([id]) => selected.has(id));
  const missed = clues.filter(([id]) => !selected.has(id));
  const count = selected.size;
  $('resultIcon').textContent = allFound ? '★' : '⚠';
  $('resultPanel').classList.toggle('fail', !allFound);
  $('resultKicker').textContent = allFound ? 'SCAM STOPPED' : 'INBOX INFECTED';
  $('resultTitle').textContent = allFound ? 'You saved Bucky’s tail!' : 'The scam got through!';
  $('resultText').textContent = allFound
    ? 'You caught every red flag before Bucky could reply. His tail and his account are safe.'
    : `You found ${count} of ${clues.length} clues. Daisy’s email was a scam.`;
  $('lessonBox').innerHTML = allFound
    ? '<div><b>Quest clear!</b> Check the sender, slow down around urgent deadlines, and never share passwords or pay with gift cards.</div>'
    : missed.map(([, explanation]) => `<div><b>Missed clue:</b> ${explanation}</div>`).join('');
  $('againBtn').textContent = '↻ PLAY AGAIN';
  $('resultOverlay').classList.remove('hidden');
  document.querySelectorAll('.clue').forEach(el => {
    el.classList.remove('selected');
    if (clues.some(([id]) => id === el.dataset.clue)) el.classList.add('correct');
  });

  if (!allFound) {
    missed.forEach(([id]) => document.querySelectorAll(`.clue[data-clue="${id}"]`).forEach(el => el.classList.add('missed')));
    $('virusOverlay').classList.remove('hidden');
    window.setTimeout(() => $('virusOverlay').classList.add('hidden'), 1500);
  }
}

$('reportBtn').addEventListener('click', submitFindings);
$('againBtn').addEventListener('click', () => window.location.reload());
$('burrowBtn').addEventListener('click', () => { window.location.href = '../Burrow/index.html'; });

const introScreen = $('introScreen');
const sendStatus = $('sendStatus');
const sendButton = $('sendMassEmail');
window.setTimeout(() => {
  sendStatus.textContent = 'SENDING TO 193 BADGERS…';
  sendButton.disabled = false;
  sendButton.classList.add('send-ready');
}, 1700);
window.setTimeout(() => sendButton.click(), 2900);
sendButton.addEventListener('click', () => {
  if (sendButton.dataset.sent) return;
  sendButton.dataset.sent = 'true';
  sendButton.disabled = true;
  sendButton.textContent = '✓ SENT!';
  sendStatus.textContent = 'MESSAGE SENT TO THE WHOLE CAMPUS!';
  $('introContinue').classList.remove('hidden');
  $('introContinue').focus();
});
$('introContinue').addEventListener('click', () => {
  introScreen.classList.add('intro-dismissed');
  introScreen.setAttribute('aria-hidden', 'true');
  $('mailIcon').focus();
});
