/*
  Valentine (WhatsApp only)
  - Mobile (tactile): "NON" impossible (zone tap => message, pas de NON)
  - Desktop (souris): "NON" fuit à l'approche du curseur
  - "OUI" affiche le formulaire
  - Envoi via WhatsApp wa.me + text= (URL-encodé)
*/

(() => {
  document.body.classList.add('js-enabled');

  // Ton numéro WhatsApp en format wa.me: international, sans +, sans espaces, sans 0 initial
  const PHONE = '33744276500';

  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const noWrap = document.querySelector('.no-wrap');
  const attemptsEl = document.getElementById('attempts');
  const messageEl = document.getElementById('message');

  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  const noteInput = document.getElementById('note');
  const waLink = document.getElementById('waLink');
  const formStatus = document.getElementById('formStatus');

  // Desktop-like = hover possible + pointeur précis (souris/trackpad)
  const isDesktopLike = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let noAttempts = 0;
  let lastNoHandledAt = 0;

  const noMessages = [
    "Non ? Vraiment ?",
    "Tu es sûre ?",
    "Dernière chance…",
    "Je… je préfère que tu cliques OUI 😌",
    "Tentative enregistrée (et ignorée).",
    "Le bouton NON refuse de collaborer.",
    "Plot twist : NON n’existe pas.",
  ];

  function setMessage(text) {
    messageEl.textContent = text;
  }

  function updateAttempts() {
    attemptsEl.querySelector('strong').textContent = String(noAttempts);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function moveNoButton() {
    const wrapRect = noWrap.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();

    const padding = 6;
    const maxX = Math.max(padding, wrapRect.width - btnRect.width - padding);
    const maxY = Math.max(padding, wrapRect.height - btnRect.height - padding);

    const x = Math.random() * maxX;
    const y = Math.random() * maxY;

    noBtn.style.left = `${clamp(x, padding, maxX)}px`;
    noBtn.style.top = `${clamp(y, padding, maxY)}px`;
  }

  function onNoAttempt(customMessage) {
    noAttempts += 1;
    updateAttempts();
    const msg = customMessage ?? noMessages[Math.min(noAttempts - 1, noMessages.length - 1)];
    setMessage(msg);
  }

  // Anti double déclenchement (pointerdown + click)
  function guard(e) {
    const now = Date.now();
    if (now - lastNoHandledAt < 220) return false;
    lastNoHandledAt = now;
    e.preventDefault();
    e.stopPropagation();
    return true;
  }

  function enableDesktopNoEscape() {
    // pour pouvoir bouger, on le fait rétrécir
    noBtn.classList.add('is-escaping');

    // Fuite “impossible à approcher”
    noWrap.addEventListener('mousemove', () => moveNoButton());
    noBtn.addEventListener('mouseenter', () => moveNoButton());

    // Si malgré tout un event “clic” arrive, on refuse et on bouge
    noBtn.addEventListener('pointerdown', (e) => {
      if (!guard(e)) return;
      onNoAttempt();
      moveNoButton();
    });

    noBtn.addEventListener('click', (e) => {
      if (!guard(e)) return;
      onNoAttempt();
      moveNoButton();
    });

    moveNoButton();
  }

  function enableMobileNoImpossible() {
    // Visuellement inactif
    noBtn.classList.add('is-disabled');

    // Le bouton lui-même ne doit jamais recevoir de tap
    noBtn.style.pointerEvents = 'none';

    // Toute tentative dans la zone NON => gag
    noWrap.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onNoAttempt("Sur téléphone, le NON est en maintenance 😌");
    });
  }

  function showForm() {
    document.body.classList.add('show-form');
    setMessage("YESSSS 💘");

    setTimeout(() => {
      dateInput.focus({ preventScroll: false });
      document.getElementById('screen-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    updateSendState();
  }

  yesBtn.addEventListener('click', showForm);

  function formatDateFR(yyyyMmDd) {
    if (!yyyyMmDd) return '';
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function buildWhatsAppMessage() {
    const date = dateInput.value;
    const time = timeInput.value;
    const note = noteInput.value.trim();

    const lines = [];
    lines.push("Coucou 😄");
    lines.push("J’ai dit OUI pour être ta valentine 💘");
    lines.push("");

    if (date) lines.push(`Date : ${formatDateFR(date)} (${date})`);
    if (time) lines.push(`Heure : ${time}`);
    if (note) {
      lines.push("");
      lines.push(`Message : ${note}`);
    }

    return lines.join("\n");
  }

  function updateWhatsAppLink() {
    const text = buildWhatsAppMessage();
    waLink.setAttribute('href', `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`);
  }

  function updateSendState() {
    const ok = Boolean(dateInput.value);
    waLink.classList.toggle('is-disabled', !ok);
    waLink.setAttribute('aria-disabled', String(!ok));

    if (!ok) waLink.setAttribute('href', '#');
    else updateWhatsAppLink();
  }

  [dateInput, timeInput, noteInput].forEach((el) => {
    el.addEventListener('input', () => {
      updateSendState();
      formStatus.textContent = '';
    });
  });

  waLink.addEventListener('click', (e) => {
    if (waLink.getAttribute('aria-disabled') === 'true' || !dateInput.value) {
      e.preventDefault();
      formStatus.textContent = 'Choisis une date avant d’envoyer.';
      dateInput.focus();
      return;
    }
    updateWhatsAppLink();
  });

  // Choix du mode selon terminal
  if (isDesktopLike) enableDesktopNoEscape();
  else enableMobileNoImpossible();
})();
