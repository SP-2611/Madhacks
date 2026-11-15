const clues = [
  ['sender', 'The sender uses tail-recovery.help, an unofficial domain. Daisy’s display name does not prove who sent the message.'],
  ['deadline', '“Before midnight” pressures Bucky to act quickly instead of checking the story with someone he trusts.'],
  ['link', 'uw-tail-recovery.com imitates a university service but is not an official uw.edu address.'],
  ['credentials', 'A real support team should never ask for a NetID password or a photo of a student ID by email.'],
  ['giftcards', 'Gift card codes are a common scam payment request. A “refundable deposit” does not make it safe.']
];
let locked = false;
const $ = id => document.getElementById(id);

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
    : `You spotted ${count} of ${clues.length} suspicious details. The scam slipped into Bucky’s inbox.`;
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
