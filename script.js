/*
  Valentine
  - Mobile: NON impossible
  - Desktop: NON reste à côté de OUI (même .cta), puis fuit en "translate" smooth à l'approche
  - OUI => formulaire
  - WhatsApp wa.me + text= encodé
*/

(() => {
  document.body.classList.add('js-enabled');

  const PHONE = '33744276500';

  const screenQuestion = document.getElementById('screen-question');
  const ctaEl = document.querySelector('.cta');

  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const noWrap = document.querySelector('.no-wrap');

  const attemptsEl = document.getElementById('attempts');
  const messageEl = document.getElementById('message');

  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  const noteInput = document.getElementById('note');
  const waLink = document.getElementById('waLink');
  const copyBtn = document.getElementById('copyBtn');
  const formStatus = document.getElementById('formStatus');

  const isDesktopLike = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let noAttempts = 0;
  let lastNoHandledAt = 0;

  // Pour calculer une fuite "dans la card" sans casser le layout
  let originRect = null;

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

  function rectsOverlap(a, b, pad = 0) {
    return !(
        a.right < (b.left - pad) ||
        a.left > (b.right + pad) ||
        a.bottom < (b.top - pad) ||
        a.top > (b.bottom + pad)
    );
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

  function recalcOrigin() {
    // Origin = position initiale du NON (dans son emplacement à côté de OUI)
    noBtn.style.transform = 'translate3d(0,0,0)';
    originRect = noBtn.getBoundingClientRect();
  }

  function pickTarget(avoidX, avoidY) {
    const areaRect = screenQuestion.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();
    const ctaRect = ctaEl.getBoundingClientRect();

    const padding = 10;

    // Bornes dans la card (on évite le header : minY = top de la zone CTA)
    const minX = areaRect.left + padding;
    const maxX = areaRect.right - btnRect.width - padding;

    const minY = Math.max(areaRect.top + padding, ctaRect.top);
    const maxY = areaRect.bottom - btnRect.height - padding;

    const MIN_CURSOR_DIST = 170;

    for (let i = 0; i < 26; i++) {
      const x = clamp(minX + Math.random() * (maxX - minX), minX, maxX);
      const y = clamp(minY + Math.random() * (maxY - minY), minY, maxY);

      const candidate = {
        left: x,
        top: y,
        right: x + btnRect.width,
        bottom: y + btnRect.height,
      };

      const notOnYes = !rectsOverlap(candidate, yesRect, 16);

      const cx = x + btnRect.width / 2;
      const cy = y + btnRect.height / 2;
      const farFromCursor =
          (typeof avoidX === 'number' && typeof avoidY === 'number')
              ? (Math.hypot(avoidX - cx, avoidY - cy) > MIN_CURSOR_DIST)
              : true;

      if (notOnYes && farFromCursor) return { x, y };
    }

    // Fallback
    return { x: minX, y: minY };
  }

  function moveNoSmooth(avoidX, avoidY) {
    if (!originRect) recalcOrigin();

    const { x, y } = pickTarget(avoidX, avoidY);

    // On déplace avec transform par rapport à la position d'origine
    const dx = x - originRect.left;
    const dy = y - originRect.top;

    noBtn.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  }

  function enableDesktopNoEscape() {
    noBtn.classList.add('can-escape');
    recalcOrigin();

    const THRESHOLD = 120;

    screenQuestion.addEventListener('mousemove', (e) => {
      const r = noBtn.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      if (Math.hypot(e.clientX - cx, e.clientY - cy) < THRESHOLD) {
        moveNoSmooth(e.clientX, e.clientY);
      }
    });

    // Si le curseur arrive quand même dessus
    noBtn.addEventListener('mouseenter', (e) => {
      moveNoSmooth(e.clientX, e.clientY);
    });

    // Si un clic/pointerdown arrive, on compte et on fuit
    noBtn.addEventListener('pointerdown', (e) => {
      if (!guard(e)) return;
      onNoAttempt();
      moveNoSmooth(e.clientX, e.clientY);
    });

    noBtn.addEventListener('click', (e) => {
      if (!guard(e)) return;
      onNoAttempt();
      moveNoSmooth(e.clientX, e.clientY);
    });

    window.addEventListener('resize', () => {
      recalcOrigin();
      // Optionnel : on remet à 0 pour éviter un NON “hors place” après resize
      noBtn.style.transform = 'translate3d(0,0,0)';
    });
  }

  function enableMobileNoImpossible() {
    noBtn.classList.add('is-disabled');
    noBtn.style.pointerEvents = 'none';

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

  copyBtn.addEventListener('click', async () => {
    if (!dateInput.value) {
      formStatus.textContent = 'Choisis une date avant de copier.';
      dateInput.focus();
      return;
    }

    const text = buildWhatsAppMessage();

    try {
      await navigator.clipboard.writeText(text);
      formStatus.textContent = 'Message copié ✅';
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', 'true');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      formStatus.textContent = 'Message copié ✅';
    }
  });

  if (isDesktopLike) enableDesktopNoEscape();
  else enableMobileNoImpossible();
})();
