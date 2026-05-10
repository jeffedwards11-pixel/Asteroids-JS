(function () {
  const modal     = document.getElementById('modal-feedback');
  const nameEl    = document.getElementById('feedback-name');
  const msgEl     = document.getElementById('feedback-message');
  const statusEl  = document.getElementById('feedback-status');
  const submitBtn = document.getElementById('feedback-submit');
  const cancelBtn = document.getElementById('feedback-cancel');

  function open(prefillName) {
    nameEl.value          = prefillName || '';
    msgEl.value           = '';
    statusEl.textContent  = '';
    submitBtn.textContent = 'SUBMIT';
    submitBtn.disabled    = false;
    modal.style.display   = 'flex';
  }

  function close() {
    modal.style.display = 'none';
  }

  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  submitBtn.addEventListener('click', async () => {
    const message = msgEl.value.trim();
    if (!message) return;

    submitBtn.textContent = 'SENDING…';
    submitBtn.disabled    = true;

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify({ name: nameEl.value.trim() || 'Anonymous', message }),
      });
      if (!res.ok) throw new Error('submit failed');
      statusEl.textContent = 'Thanks for the feedback!';
      setTimeout(close, 2000);
    } catch {
      submitBtn.textContent = 'ERROR — TRY AGAIN';
      submitBtn.disabled    = false;
    }
  });

  document.getElementById('btn-feedback-start').addEventListener('click', () => open(''));
  document.getElementById('btn-feedback-gameover').addEventListener('click', () =>
    open(document.getElementById('name-input').value.trim())
  );
})();
