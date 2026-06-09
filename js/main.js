/* ============================================
   Jonathan & Vivien — Wedding RSVP
   Interactions & motion
   ============================================ */

(function () {
  'use strict';

  /* ---------- Letter reveal ---------- */
  // Wraps each character of [data-letters] in a <span class="letter">
  // with a staggered animation-delay variable.
  function setupLetterReveal() {
    var nodes = document.querySelectorAll('[data-letters]');
    nodes.forEach(function (node) {
      var text = node.textContent;
      node.textContent = '';
      node.classList.add('reveal-letters');
      var idx = 0;
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (ch === ' ') {
          node.appendChild(document.createTextNode(' '));
          continue;
        }
        var span = document.createElement('span');
        span.className = 'letter';
        span.style.setProperty('--i', idx);
        span.textContent = ch;
        node.appendChild(span);
        idx++;
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  function setupScrollReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- RSVP form interactions ---------- */
  function setupRsvpForm() {
    var form = document.querySelector('[data-rsvp-form]');
    if (!form) return;

    // Attendance choice — declines collapse the rest of the form via CSS
    var attendanceRadios = form.querySelectorAll('input[name="attendance"]');
    function syncAttendance() {
      var attending = form.querySelector('input[name="attendance"]:checked');
      if (!attending) return;
      form.setAttribute('data-attendance', attending.value);
    }
    attendanceRadios.forEach(function (r) {
      r.addEventListener('change', syncAttendance);
    });
    syncAttendance();

    // Additional attendees counter
    var counter = form.querySelector('[data-counter]');
    if (counter) {
      var valueEl = counter.querySelector('.counter-value');
      var hiddenInput = counter.querySelector('input[type="hidden"]');
      var minus = counter.querySelector('[data-counter-decrement]');
      var plus = counter.querySelector('[data-counter-increment]');
      var max = parseInt(counter.dataset.max || '4', 10);
      var min = parseInt(counter.dataset.min || '0', 10);

      var conditionalGuests = form.querySelector('[data-conditional="guest-names"]');
      var guestLabel = form.querySelector('[data-guest-label]');
      var guestHint = form.querySelector('[data-guest-hint]');
      var guestTextarea = form.querySelector('#guest-names');

      var WORDS = ['', 'One', 'Two', 'Three', 'Four'];

      function setVal(v) {
        v = Math.max(min, Math.min(max, v));
        valueEl.textContent = v;
        if (hiddenInput) hiddenInput.value = v;
        minus.disabled = v <= min;
        plus.disabled = v >= max;

        if (conditionalGuests) {
          if (v >= 1) {
            conditionalGuests.classList.add('is-open');
          } else {
            conditionalGuests.classList.remove('is-open');
          }
        }

        // Adaptive label + hint
        if (guestLabel && guestHint) {
          if (v <= 1) {
            guestLabel.textContent = 'Name of Your Guest';
            guestHint.textContent = 'One name, please.';
            if (guestTextarea) {
              guestTextarea.rows = 2;
              guestTextarea.setAttribute('placeholder', 'Their full name');
            }
          } else {
            guestLabel.textContent = 'Names of Your Guests';
            guestHint.textContent = WORDS[v] + ' names — one per line.';
            if (guestTextarea) {
              guestTextarea.rows = Math.max(3, v);
              guestTextarea.setAttribute('placeholder', 'One full name per line');
            }
          }
        }
      }
      minus.addEventListener('click', function () {
        setVal(parseInt(valueEl.textContent, 10) - 1);
      });
      plus.addEventListener('click', function () {
        setVal(parseInt(valueEl.textContent, 10) + 1);
      });
      setVal(parseInt(valueEl.textContent, 10) || 0);
    }

    // ---------- Validation ----------
    var statusEl = form.querySelector('[data-form-status]');

    function setFieldError(fieldName, message) {
      var wrap = form.querySelector('[data-field="' + fieldName + '"]');
      var msgEl = form.querySelector('[data-error-for="' + fieldName + '"]');
      if (wrap) wrap.classList.add('has-error');
      if (msgEl) msgEl.textContent = message;
    }
    function clearFieldError(fieldName) {
      var wrap = form.querySelector('[data-field="' + fieldName + '"]');
      var msgEl = form.querySelector('[data-error-for="' + fieldName + '"]');
      if (wrap) wrap.classList.remove('has-error');
      if (msgEl) msgEl.textContent = '';
    }
    function clearAllErrors() {
      form.querySelectorAll('[data-field]').forEach(function (el) {
        el.classList.remove('has-error');
      });
      form.querySelectorAll('[data-error-for]').forEach(function (el) {
        el.textContent = '';
      });
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'form-status';
      }
    }

    function validate() {
      clearAllErrors();
      var errors = [];

      // Full name — required, min 2 chars
      var name = (form.querySelector('[name="full_name"]').value || '').trim();
      if (name.length < 2) {
        errors.push({field: 'full_name', msg: 'Please tell us your full name.'});
      }

      var attending = form.querySelector('input[name="attendance"]:checked');
      if (!attending) {
        errors.push({field: 'attendance', msg: 'Will you join us?'});
      }

      // If declining, no further validation needed
      if (attending && attending.value === 'no') {
        return errors;
      }

      // Phone — WhatsApp-reachable: country code + 7–14 digits
      var phoneRaw = (form.querySelector('[name="phone"]').value || '').trim();
      var phoneClean = phoneRaw.replace(/[\s\-()]/g, '');
      var phoneOK = /^\+?[1-9]\d{7,14}$/.test(phoneClean);
      if (!phoneOK) {
        errors.push({field: 'phone', msg: 'Looks off — please include your country code, e.g. +60 12 345 6789.'});
      }

      // Guest names — required if additional attendees >= 1, line count must match
      var count = parseInt(form.querySelector('[name="additional_attendees"]').value, 10) || 0;
      if (count >= 1) {
        var guestRaw = (form.querySelector('[name="guest_names"]').value || '').trim();
        var lines = guestRaw.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
        if (lines.length < 1) {
          errors.push({
            field: 'guest_names',
            msg: count === 1
              ? "Please share your guest's full name."
              : 'Please share the ' + count + " guests' names (one per line)."
          });
        } else if (lines.length < count) {
          errors.push({
            field: 'guest_names',
            msg: 'We have ' + lines.length + ' of ' + count + ' names — one per line, please.'
          });
        }
      }

      return errors;
    }

    // Clear a field's error as soon as the guest starts fixing it
    form.querySelectorAll('input, textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        var wrap = input.closest('[data-field]');
        if (wrap) {
          var name = wrap.getAttribute('data-field');
          if (form.querySelector('[data-error-for="' + name + '"]').textContent) {
            clearFieldError(name);
          }
        }
      });
    });

    // ---------- Submission ----------
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');

      var errs = validate();
      if (errs.length) {
        errs.forEach(function (er) { setFieldError(er.field, er.msg); });
        if (statusEl) {
          statusEl.textContent = 'A couple of details still need a look.';
          statusEl.className = 'form-status is-error';
        }
        var first = form.querySelector('.has-error');
        if (first) {
          first.scrollIntoView({behavior: 'smooth', block: 'center'});
        }
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending…';
      }
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'form-status is-info';
      }

      var endpoint = form.getAttribute('action') || '';
      var hasFormspree = endpoint
        && endpoint.indexOf('formspree.io/f/') !== -1
        && endpoint.indexOf('REPLACE_WITH_YOUR_FORMSPREE_ID') === -1;

      if (!hasFormspree) {
        // No live endpoint yet — preview mode: skip the network round-trip.
        setTimeout(function () { window.location.href = 'thank-you.html'; }, 500);
        return;
      }

      var data = new FormData(form);
      fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: {'Accept': 'application/json'}
      })
        .then(function (res) {
          if (res.ok) {
            window.location.href = 'thank-you.html';
            return;
          }
          return res.json().then(function (body) {
            throw new Error((body && body.error) || 'Submission failed');
          });
        })
        .catch(function (err) {
          if (btn) { btn.disabled = false; btn.textContent = 'Send RSVP'; }
          if (statusEl) {
            statusEl.textContent = "Hmm, that didn't go through. Please try again, or message us directly.";
            statusEl.className = 'form-status is-error';
          }
          console.warn('RSVP submission error:', err);
        });
    });
  }

  /* ---------- Confetti burst ---------- */
  // Generates ~24 confetti pieces inside [data-confetti] with randomised
  // direction, rotation and colour. Pure CSS animation handles the motion.
  function setupConfetti() {
    var host = document.querySelector('[data-confetti]');
    if (!host) return;
    var colours = ['#9CAA8A', '#6B7A5C', '#B8965E', '#D4B888', '#F4ECE0', '#FAF7F2'];
    var pieces = 28;
    // Deterministic-ish pseudo-random so we don't import Math.random heavily
    function rand(seed) {
      var x = Math.sin(seed * 9301 + 49297) * 233280;
      return x - Math.floor(x);
    }
    for (var i = 0; i < pieces; i++) {
      var angle = (i / pieces) * Math.PI * 2 + rand(i) * 0.4;
      var distance = 180 + rand(i + 7) * 180;
      var x = Math.cos(angle) * distance;
      var y = Math.sin(angle) * distance * 0.85;
      var rot = (rand(i + 11) - 0.5) * 1080;
      var colour = colours[i % colours.length];
      var width = 6 + Math.floor(rand(i + 3) * 6);
      var height = 10 + Math.floor(rand(i + 5) * 10);
      var delay = Math.floor(rand(i + 13) * 600);
      var piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.setProperty('--x', x.toFixed(1) + 'px');
      piece.style.setProperty('--y', y.toFixed(1) + 'px');
      piece.style.setProperty('--r', rot.toFixed(0) + 'deg');
      piece.style.setProperty('--d', delay + 'ms');
      piece.style.background = colour;
      piece.style.width = width + 'px';
      piece.style.height = height + 'px';
      host.appendChild(piece);
    }
  }

  /* ---------- Couple photo (tap-to-kiss for touch + keyboard) ---------- */
  function setupCouplePhoto() {
    var photo = document.querySelector('[data-couple-photo]');
    if (!photo) return;
    function toggle() { photo.classList.toggle('is-kissing'); }
    photo.addEventListener('click', toggle);
    photo.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle();
      }
    });
  }

  /* ---------- Boot ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    setupLetterReveal();
    setupScrollReveal();
    setupRsvpForm();
    setupConfetti();
    setupCouplePhoto();
  }
})();
