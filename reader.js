  class SpeedReader {
    constructor() {
      this.words = [];
      this.currentIndex = 0;
      this.wpm = 350;
      this.isPlaying = false;
      this.intervalId = null;
      this.wordElements = [];
      this.playerExpanded = false;

      this.initElements();
      this.initEventListeners();
      this.loadTheme();
      this.initPlayerDrag();
    }

    initElements() {
      this.bookPage = document.getElementById('bookPage');
      this.bookContainer = document.getElementById('bookContainer');
      this.playPauseBtn = document.getElementById('playPause');
      this.restartBtn = document.getElementById('restart');
      this.wpmInput = document.getElementById('wpmInput');
      this.increaseWpmBtn = document.getElementById('increaseWpm');
      this.decreaseWpmBtn = document.getElementById('decreaseWpm');
      this.bookSelect = document.getElementById('bookSelect');
      this.progressBar = document.getElementById('progressBar');
      this.stats = document.getElementById('stats');
      this.wordCount = document.getElementById('wordCount');
      this.timeRemaining = document.getElementById('timeRemaining');
      this.themeToggle = document.getElementById('themeToggle');
      this.themeIcon = document.getElementById('themeIcon');
      this.fileUpload = document.getElementById('fileUpload');

      // music player
      this.musicPlayer = document.getElementById('musicPlayer');
      this.playerMini = document.getElementById('playerMini');
      this.playerContent = document.getElementById('playerContent');
      this.playerHeader = document.getElementById('playerHeader');
      this.closePlayer = document.getElementById('closePlayer');
      this.stopMusicExpanded = document.getElementById('stopMusicExpanded');
      this.openAppleMusic = document.getElementById('openAppleMusic');
      this.appleMusicFrame = document.getElementById('appleMusicFrame');
      this.appleSrc = this.appleMusicFrame.getAttribute('data-src') || this.appleMusicFrame.src;
      this.musicStopped = false;
    }

    initEventListeners() {
      this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
      this.restartBtn.addEventListener('click', () => this.restart());
      this.wpmInput.addEventListener('change', (e) => this.setWpm(parseInt(e.target.value, 10)));
      this.increaseWpmBtn.addEventListener('click', () => this.adjustWpm(50));
      this.decreaseWpmBtn.addEventListener('click', () => this.adjustWpm(-50));
      this.bookSelect.addEventListener('change', (e) => this.loadBook(e.target.value));
      this.fileUpload.addEventListener('change', (e) => this.loadUploadedFile(e.target.files[0]));
      document.getElementById('uploadButton').addEventListener('click', () => this.fileUpload.click());
      this.themeToggle.addEventListener('click', () => this.toggleTheme());

      // music interactions
      this.playerMini.addEventListener('click', () => this.expandPlayer());

      // Close (×) now just collapses, doesn't stop music
      this.closePlayer.addEventListener('click', () => this.collapsePlayer());

      this.stopMusicExpanded.addEventListener('click', () => this.stopAndCollapse());
      this.openAppleMusic.addEventListener('click', () => this.stopAndCollapse());

      // keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (document.body.dataset.page !== 'speed' || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.target.closest('dialog[open]')) return;
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
          e.preventDefault();
          this.togglePlayPause();
        } else if (e.code === 'ArrowUp') {
          e.preventDefault();
          this.adjustWpm(50);
        } else if (e.code === 'ArrowDown') {
          e.preventDefault();
          this.adjustWpm(-50);
        } else if (e.code === 'KeyR') {
          e.preventDefault();
          this.restart();
        } else if (e.code === 'Escape') {
          // ESC collapses but DOES NOT stop music
          this.collapsePlayer();
        }
      });
    }

    loadTheme() {
      const savedTheme = localStorage.getItem('speedReaderTheme') || 'dark';
      if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        this.updateThemeIcon(true);
      } else {
        this.updateThemeIcon(false);
      }
    }

    toggleTheme() {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      this.updateThemeIcon(isLight);
      localStorage.setItem('speedReaderTheme', isLight ? 'light' : 'dark');
    }

    updateThemeIcon(isLight) {
      if (isLight) {
        // Moon for light mode
        this.themeIcon.textContent = '☾';
      } else {
        // Sun for dark mode
        this.themeIcon.textContent = '☀︎';
      }
    }

    /* =========================
       MUSIC PLAYER BEHAVIOR
       ========================= */

    expandPlayer() {
      // If user previously stopped music, restore embed so they can play again
      if (this.musicStopped) {
        this.restoreMusicEmbed();
      }
      this.musicPlayer.classList.remove('collapsed');
      this.musicPlayer.classList.add('expanded');
      this.playerExpanded = true;
    }

    collapsePlayer() {
      // collapsing should NOT stop music
      this.musicPlayer.classList.remove('expanded');
      this.musicPlayer.classList.add('collapsed');
      this.playerExpanded = false;
    }

    stopMusic() {
      // We cannot directly control Apple Music iframe playback cross-origin,
      // but clearing the iframe src will stop audio.
      this.appleMusicFrame.src = 'about:blank';
      this.musicStopped = true;
    }

    restoreMusicEmbed() {
      // restore the embed so user can play again
      this.appleMusicFrame.src = this.appleSrc;
      this.musicStopped = false;
    }

    stopAndCollapse() {
      this.stopMusic();
      this.collapsePlayer();
    }

    initPlayerDrag() {
      // swipe down on expanded header to collapse (does NOT stop music)
      let startY = 0;
      let dragging = false;

      const onDown = (e) => {
        if (!this.playerExpanded) return;
        if (e.target.closest('button, a')) return;
        dragging = true;
        startY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
      };

      const onMove = (e) => {
        if (!dragging || !this.playerExpanded) return;
        const y = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
        const delta = y - startY;

        // small visual feedback
        if (delta > 0) {
          this.playerContent.style.transform = `translateY(${Math.min(delta, 120)}px)`;
        }

        // collapse threshold
        if (delta > 90) {
          this.playerContent.style.transform = '';
          dragging = false;
          this.collapsePlayer();
        }
      };

      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        this.playerContent.style.transform = '';
      };

      // pointer + touch
      this.playerHeader.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);

      this.playerHeader.addEventListener('touchstart', onDown, { passive: true });
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('touchend', onUp);
    }

    /* =========================
       BOOK / READER
       ========================= */

    async loadUploadedFile(file) {
      if (!file) return;

      this.pause();
      this.stats.style.display = 'none';
      this.progressBar.style.width = '0%';
      this.bookPage.innerHTML = '<div class="welcome"><p>Reading your file...</p></div>';

      try {
        const fileName = file.name || 'Uploaded file';
        const isPdf = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
        const isTxt = file.type === 'text/plain' || fileName.toLowerCase().endsWith('.txt');

        if (isTxt) {
          const text = await file.text();

          if (!text.trim()) {
            throw new Error('No readable text found in this txt file.');
          }

          const title = fileName.replace(/\.txt$/i, '');
          this.bookSelect.value = '';
          this.loadText(`# ${title}\n\n${text}`);
          return;
        }

        if (!isPdf) {
          throw new Error('Unsupported file type.');
        }

        if (!window.pdfjsLib) {
          throw new Error('pdf reader library is not available.');
        }

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (pageText) pages.push(pageText);
        }

        const text = pages.join('\n\n');

        if (!text.trim()) {
          throw new Error('No readable text found in this pdf.');
        }

        const title = fileName.replace(/\.pdf$/i, '');
        this.bookSelect.value = '';
        this.loadText(`# ${title}\n\n${text}`);
      } catch (error) {
        console.error('Error loading file:', error);
        this.bookPage.innerHTML = `
          <div class="welcome">
            <h2 style="color: var(--text-primary); margin-bottom: 12px;">Could not read that file</h2>
            <p>Try a pdf with selectable text or a plain .txt file. Scanned image pdfs need text recognition before they can work here.</p>
          </div>
        `;
      } finally {
        this.fileUpload.value = '';
      }
    }

    escapeHtml(value) {
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    renderWords(text, startIndex) {
      let html = '';
      let nextIndex = startIndex;

      text.split(/\s+/).forEach(word => {
        if (!word) return;
        this.words.push(word);
        html += `<span class="word" data-index="${nextIndex}">${this.escapeHtml(word)}</span> `;
        nextIndex++;
      });

      return { html, nextIndex };
    }

    loadText(text) {
      const sections = text.split('\n');

      let html = '';
      let wordIndex = 0;
      this.words = [];
      this.wordElements = [];
      let inTextContent = false;

      sections.forEach((section) => {
        section = section.trim();
        if (!section) return;
        if (/^[=\-*_~#\s]{3,}$/.test(section)) return;

        if (section.startsWith('# ')) {
          if (inTextContent) html += '</div>';
          const heading = this.escapeHtml(section.substring(2));
          html += `<div class="chapter-title">${heading}</div><div class="text-content">`;
          inTextContent = true;
          return;
        }

        if (section.startsWith('## ')) {
          const heading = section.substring(3);
          html += `<div style="font-size:24px;font-weight:600;color:var(--text-secondary);margin:30px 0 20px;">`;
          const rendered = this.renderWords(heading, wordIndex);
          html += rendered.html;
          wordIndex = rendered.nextIndex;
          html += `</div>`;
          return;
        }

        if (section.startsWith('### ')) {
          const heading = section.substring(4);
          html += `<div style="font-size:20px;font-weight:600;color:var(--text-tertiary);margin:25px 0 15px;">`;
          const rendered = this.renderWords(heading, wordIndex);
          html += rendered.html;
          wordIndex = rendered.nextIndex;
          html += `</div>`;
          return;
        }

        if (section.startsWith('**') && section.endsWith('**')) {
          const heading = section.substring(2, section.length - 2);
          html += `<div style="font-size:22px;font-weight:600;color:var(--text-secondary);margin:25px 0 15px;">`;
          const rendered = this.renderWords(heading, wordIndex);
          html += rendered.html;
          wordIndex = rendered.nextIndex;
          html += `</div>`;
          return;
        }

        if (section === '---') {
          html += `<div style="height:40px;"></div>`;
          return;
        }

        if (!inTextContent) {
          html += `<div class="text-content">`;
          inTextContent = true;
        }

        html += `<p style="margin-bottom:20px;">`;
        const rendered = this.renderWords(section, wordIndex);
        html += rendered.html;
        wordIndex = rendered.nextIndex;
        html += `</p>`;
      });

      if (inTextContent) html += `</div>`;

      this.bookPage.innerHTML = html;
      this.wordElements = Array.from(this.bookPage.querySelectorAll('.word'));

      this.currentIndex = 0;
      this.updateDisplay();
      this.updateStats();
      this.stats.style.display = 'flex';
      this.bookContainer.scrollTop = 0;
    }

    updateDisplay() {
      if (this.wordElements.length === 0) return;

      this.wordElements.forEach((el, index) => {
        el.classList.remove('current', 'past');

        if (index === this.currentIndex) {
          el.classList.add('current');

          const rect = el.getBoundingClientRect();
          const containerRect = this.bookContainer.getBoundingClientRect();

          if (rect.bottom > containerRect.bottom - 120) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (rect.top < containerRect.top + 120) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (index < this.currentIndex) {
          el.classList.add('past');
        }
      });

      const progress = ((this.currentIndex + 1) / this.words.length) * 100;
      this.progressBar.style.width = `${progress}%`;

      this.updateStats();
    }

    updateStats() {
      if (this.words.length === 0) return;

      const wordsRemaining = this.words.length - this.currentIndex;
      const minutesRemaining = wordsRemaining / this.wpm;
      const seconds = Math.round(minutesRemaining * 60);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;

      this.wordCount.textContent = `${this.currentIndex + 1} / ${this.words.length} words`;
      this.timeRemaining.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')} remaining`;
    }

    play() {
      if (this.words.length === 0) {
        alert('Please select a book first!');
        return;
      }

      if (this.currentIndex >= this.words.length) {
        this.restart();
      }

      this.isPlaying = true;
      this.playPauseBtn.textContent = 'Pause';

      const interval = 60000 / this.wpm;

      this.intervalId = setInterval(() => {
        this.currentIndex++;

        if (this.currentIndex >= this.words.length) {
          this.pause();
          this.bookPage.innerHTML += `
            <div class="welcome" style="margin-top: 60px;">
              <h2 style="color: var(--text-primary); margin-bottom: 12px;">Finished!</h2>
              <p>You just read ${this.words.length} words at ${this.wpm} words/min.</p>
            </div>
          `;
          return;
        }

        this.updateDisplay();
      }, interval);
    }

    pause() {
      this.isPlaying = false;
      this.playPauseBtn.textContent = 'Play';
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }

    togglePlayPause() {
      if (this.isPlaying) this.pause();
      else this.play();
    }

    restart() {
      this.pause();
      this.currentIndex = 0;
      this.updateDisplay();
      this.bookContainer.scrollTop = 0;
    }

    setWpm(wpm) {
      if (Number.isNaN(wpm)) return;
      if (wpm < 50) wpm = 50;
      if (wpm > 1000) wpm = 1000;

      this.wpm = wpm;
      this.wpmInput.value = wpm;

      if (this.isPlaying) {
        this.pause();
        this.play();
      }
    }

    adjustWpm(delta) {
      this.setWpm(this.wpm + delta);
    }
  }

  const reader = new SpeedReader();

  /* ---- Scroll: chunk the loaded text into one-idea screens (Latch "reading now") ---- */
  (function () {
    const feedView = document.getElementById('feedView');
    const list = document.getElementById('feedList');
    const fill = document.getElementById('feedBarFill');
    const bookSelect = document.getElementById('bookSelect');
    const libraryDialog = document.getElementById('libraryDialog');
    const libraryList = document.getElementById('libraryList');
    const filterBtn = document.getElementById('savedFilter');
    const feedBookName = document.getElementById('feedBookName');
    const researchDialog = document.getElementById('researchDialog');
    const researchQuote = document.getElementById('researchQuote');
    const dlg = document.getElementById('savedDialog');
    const grid = document.getElementById('savedGrid');
    // Everything is kept in this browser's localStorage. Nothing is sent anywhere.
    const store = {
      get(k, d) { try { return JSON.parse(localStorage.getItem('readable:' + k)) ?? d; } catch (e) { return d; } },
      set(k, v) { try { localStorage.setItem('readable:' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
    };
    const items = () => store.get('savedItems', []);
    let chunks = [], slug = '', title = '';

    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const paintCount = () => { filterBtn.textContent = '☆ Saved · ' + items().length; };
    paintCount();

    // Skip the title page, acknowledgements, preface: begin at the Introduction (or Chapter 1) when the book has one.
    function fromChapterOne(text) {
      // Works on plain-text lines and on PDF pages (one long line per page).
      const start = /^\s*(introduction\b|chapter\s+(1|one|i)\b)/i;
      let off = 0;
      for (const block of text.split('\n')) {
        if (start.test(block)) {
          // A table of contents lists the next chapter right after: skip those entries.
          const isContents = /\n\s*chapter\s+(2|two|ii)\b/i.test(text.slice(off + 12, off + 350))
            || /chapter\s+(2|two|ii)\b/i.test(text.slice(off + 12, off + 160));
          if (!isContents) return off ? text.slice(off) : text;
        }
        off += block.length + 1;
      }
      return text;
    }

    function chunkify(text) {
      const out = []; let chapter = '';
      let buf = '';
      const flush = () => { if (buf.trim().length > 20) out.push({ text: buf.trim(), chapter }); buf = ''; };
      text.split('\n').forEach((raw) => {
        const line = raw.trim();
        if (!line) return;
        if (/^[=\-*_~#\s]{3,}$/.test(line)) return;
        const h = line.match(/^#{1,3}\s+(.*)/);
        if (h) { flush(); chapter = h[1]; return; }
        if (line.length <= 70 && !/[.!?,;:”"]$/.test(line) && line === line.toUpperCase() && /[A-Z]/.test(line)) { flush(); chapter = line.replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase()); return; }
        line.split(/(?<=[.!?…”"])\s+/).forEach((sentence) => {
          if (buf && (buf + ' ' + sentence).length > 420) flush();
          buf += (buf ? ' ' : '') + sentence;
          if (buf.length >= 200) flush();
        });
        flush();
      });
      return out;
    }

    const setH = () => feedView.style.setProperty('--fh', feedView.clientHeight + 'px');
    window.addEventListener('resize', setH);
    function render() {
      setH();
      if (!chunks.length) {
        feedBookName.textContent = 'Add a book to begin';
        list.innerHTML = '<div class="feed-empty">'
          + '<div class="welcome-hero feed-hero"><img class="hero-dark" src="https://mariangasinu.com/wp-content/uploads/2026/09/readable-dark-scaled.png" alt="Readable artwork: gold glasses showing one word at a time" width="1600" height="992" decoding="async" />'
          + '<img class="hero-light" src="https://mariangasinu.com/wp-content/uploads/2026/09/readable-light-scaled.png" alt="" width="1600" height="992" decoding="async" /></div>'
          + '<div class="feed-empty-copy"><span class="feed-eyebrow">Read your way</span><h2>One thought at a time.</h2>'
          + '<p>Turn your own book into a scroll you can actually stay with. Save the parts that matter and research an idea whenever curiosity strikes.</p>'
          + '<div class="feed-empty-actions"><button type="button" data-empty-upload>Add a book</button><button type="button" data-empty-library>Your books</button></div>'
          + '<p class="feed-empty__note">Your place, saved passages, and uploads stay in this browser.</p></div></div>';
        fill.style.width = '0';
        return;
      }
      feedBookName.textContent = title;
      const saved = new Set(items().filter((x) => x.slug === slug).map((x) => x.i));
      list.innerHTML = chunks.map((c, i) => `
        <article class="feed-slide" data-i="${i}">
          <div class="feed-meta"><b>${esc(title)}</b>${c.chapter ? '<span>· ' + esc(c.chapter) + '</span>' : ''}<span>· ${i + 1} of ${chunks.length}</span></div>
          <p class="feed-text">${esc(c.text)}</p>
          <div class="feed-acts">
            <button type="button" data-act="saved" class="${saved.has(i) ? 'on' : ''}" aria-pressed="${saved.has(i)}">${saved.has(i) ? '★ Saved' : '☆ Save'}</button>
            <button type="button" data-act="research">⌕ Research</button>
            <button type="button" data-act="book">▤ Book</button>
          </div>
        </article>`).join('');
      const at = Math.min(store.get('pos:' + slug, 0), chunks.length - 1);
      feedView.scrollTop = 0;
      const target = list.children[at];
      if (target && at > 0) feedView.scrollTop = target.offsetTop - 3;
      paint();
    }

    function current() {
      const y = feedView.scrollTop + feedView.clientHeight * 0.4;
      const slides = list.children; let lo = 0, hi = slides.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (slides[mid].offsetTop <= y) lo = mid; else hi = mid - 1; }
      return lo;
    }
    function paint() {
      if (!chunks.length) return;
      fill.style.width = ((current() + 1) / chunks.length * 100) + '%';
    }
    let t;
    feedView.addEventListener('scroll', () => {
      paint(); clearTimeout(t);
      t = setTimeout(() => { if (chunks.length) store.set('pos:' + slug, current()); }, 250);
    }, { passive: true });
    addEventListener('pagehide', () => {
      if (document.body.dataset.page === 'feed' && chunks.length) store.set('pos:' + slug, current());
    });

    function setBtn(b, on) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.textContent = on ? '★ Saved' : '☆ Save'; }

    const openLibrary = () => { renderLibrary(); libraryDialog.showModal(); };
    list.addEventListener('click', (e) => {
      if (e.target.closest('[data-empty-library], [data-act="book"]')) openLibrary();
      if (e.target.closest('[data-empty-upload]')) reader.fileUpload.click();
      const research = e.target.closest('[data-act="research"]');
      if (research) {
        const passage = chunks[Number(research.closest('.feed-slide').dataset.i)];
        const query = title + ' ' + passage.text.slice(0, 120);
        document.getElementById('researchSource').textContent = title + (passage.chapter ? ' · ' + passage.chapter : '');
        researchQuote.textContent = passage.text;
        document.getElementById('researchWeb').href = 'https://www.google.com/search?q=' + encodeURIComponent(query);
        document.getElementById('researchWiki').href = 'https://en.wikipedia.org/w/index.php?search=' + encodeURIComponent(passage.text.slice(0, 90));
        researchDialog.showModal();
      }
    });
    document.getElementById('feedBookButton').addEventListener('click', openLibrary);
    document.getElementById('researchClose').addEventListener('click', () => researchDialog.close());
    researchDialog.addEventListener('click', (e) => { if (e.target === researchDialog) researchDialog.close(); });
    document.getElementById('researchCopy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(researchQuote.textContent + '\n— ' + document.getElementById('researchSource').textContent);
        document.getElementById('researchCopy').textContent = 'Copied';
        setTimeout(() => { document.getElementById('researchCopy').textContent = 'Copy passage'; }, 1800);
      } catch (e) { document.getElementById('researchCopy').textContent = 'Copy unavailable'; }
    });

    // Save / unsave one passage
    list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act="saved"]'); if (!b) return;
      const i = +b.closest('.feed-slide').dataset.i, id = slug + ':' + i;
      let all = items();
      if (all.some((x) => x.id === id)) { all = all.filter((x) => x.id !== id); setBtn(b, false); }
      else {
        all.unshift({ id, slug, title, chapter: chunks[i].chapter, i, n: chunks.length, text: chunks[i].text, at: Date.now() });
        setBtn(b, true);
      }
      store.set('savedItems', all); paintCount();
    });

    // Saved cards
    function renderSaved() {
      const all = items();
      document.getElementById('savedCount').textContent = all.length ? ' · ' + all.length : '';
      grid.innerHTML = all.length ? all.map((x) => `
        <article class="saved-card" data-id="${esc(x.id)}">
          <div class="feed-meta"><b>${esc(x.title)}</b>${x.chapter ? '<span>· ' + esc(x.chapter) + '</span>' : ''}<span>· ${x.i + 1} of ${x.n}</span></div>
          <p>${esc(x.text)}</p>
          <button type="button" class="saved-expand" aria-expanded="false">Read more</button>
          <button type="button" data-remove="${esc(x.id)}">Remove</button>
        </article>`).join('')
        : '<div class="saved-empty"><h3>Nothing saved yet</h3><p>Tap Save on any passage while you scroll and it will show up here, on this device.</p></div>';
    }
    filterBtn.addEventListener('click', () => { renderSaved(); dlg.showModal(); });
    document.getElementById('savedClose').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    grid.addEventListener('click', (e) => {
      const expand = e.target.closest('button.saved-expand');
      if (expand) {
        const expanded = expand.closest('.saved-card').classList.toggle('expanded');
        expand.setAttribute('aria-expanded', String(expanded));
        expand.textContent = expanded ? 'Show less' : 'Read more';
        return;
      }
      const r = e.target.closest('button[data-remove]'); if (!r) return;
      const id = r.dataset.remove, gone = items().find((x) => x.id === id);
      store.set('savedItems', items().filter((x) => x.id !== id));
      if (gone && gone.slug === slug) { const b = list.querySelector('.feed-slide[data-i="' + gone.i + '"] [data-act="saved"]'); if (b) setBtn(b, false); }
      paintCount(); renderSaved();
    });

    // ---- Your uploads: kept in this browser (IndexedDB) so they stay in the picker ----
    const db = (() => {
      let conn;
      const open = () => conn || (conn = new Promise((res, rej) => {
        const r = indexedDB.open('readable', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('books', { keyPath: 'id' });
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      }));
      const tx = (mode, fn) => open().then((d) => new Promise((res, rej) => {
        const transaction = d.transaction('books', mode);
        const q = fn(transaction.objectStore('books'));
        transaction.oncomplete = () => res(q.result);
        transaction.onerror = () => rej(transaction.error);
        transaction.onabort = () => rej(transaction.error || new Error('Book storage was interrupted.'));
      }));
      return { put: (b) => tx('readwrite', (o) => o.put(b)), get: (id) => tx('readonly', (o) => o.get(id)), all: () => tx('readonly', (o) => o.getAll()), del: (id) => tx('readwrite', (o) => o.delete(id)) };
    })();
    let group;
    let uploadedBooks = [];
    function clearCurrentBook() {
      bookSelect.value = '';
      store.set('currentBookId', '');
      slug = ''; title = ''; chunks = [];
      reader.pause(); reader.words = []; reader.wordElements = [];
      reader.bookPage.innerHTML = '<div class="welcome"><h2>Add a book</h2><p>Upload a pdf or txt file to start reading.</p></div>';
      reader.stats.style.display = 'none';
      reader.progressBar.style.width = '0';
      render();
    }
    function renderLibrary() {
      libraryList.innerHTML = (bookSelect.value ? '<button type="button" class="library-close-current" data-close-book>Close current book</button>' : '')
        + '<button type="button" class="library-add" data-library-upload>Add a book from this device</button>'
        + '<h3 class="library-section">Your books</h3>'
        + (uploadedBooks.length ? uploadedBooks.map((b) => `<div class="library-row">
            <button type="button" class="library-open" data-open="${esc(b.id)}">${esc(b.title)}</button>
            <button type="button" class="library-remove" data-delete="${esc(b.id)}" aria-label="Remove ${esc(b.title)} from your library" title="Remove book">×</button>
          </div>`).join('')
        : '<div class="library-empty">No books added yet. Your uploads stay in this browser.</div>');
    }
    function addOption(b) {
      uploadedBooks = [b, ...uploadedBooks.filter((x) => x.id !== b.id)].sort((x, y) => y.at - x.at);
      if (!group) { group = document.createElement('optgroup'); group.label = 'Your uploads'; bookSelect.appendChild(group); }
      if (![...group.children].some((o) => o.value === b.id)) { const o = document.createElement('option'); o.value = b.id; o.textContent = b.title; group.appendChild(o); }
      renderLibrary();
    }
    renderLibrary();
    try {
      db.all().then((all) => {
        all.sort((x, y) => y.at - x.at).forEach(addOption);
        const currentId = store.get('currentBookId', '');
        if (currentId.startsWith('up:') && [...bookSelect.options].some((option) => option.value === currentId)) {
          bookSelect.value = currentId;
          reader.loadBook(currentId);
        }
      }).catch(() => {});
    } catch (e) {}

    document.getElementById('libraryButton').addEventListener('click', openLibrary);
    document.getElementById('libraryClose').addEventListener('click', () => libraryDialog.close());
    libraryDialog.addEventListener('click', (e) => { if (e.target === libraryDialog) libraryDialog.close(); });
    libraryList.addEventListener('click', async (e) => {
      if (e.target.closest('[data-close-book]')) { clearCurrentBook(); libraryDialog.close(); return; }
      if (e.target.closest('[data-library-upload]')) { reader.fileUpload.click(); return; }
      const open = e.target.closest('[data-open]');
      if (open) {
        bookSelect.value = open.dataset.open;
        libraryDialog.close();
        await reader.loadBook(open.dataset.open);
        return;
      }
      const remove = e.target.closest('[data-delete]');
      if (!remove) return;
      const id = remove.dataset.delete;
      const book = uploadedBooks.find((b) => b.id === id);
      if (!book || !window.confirm(`Remove “${book.title}” from this browser? Saved passages will stay in Saved.`)) return;
      try {
        const wasCurrent = bookSelect.value === id;
        await db.del(id);
        const removedSlug = id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        try {
          localStorage.removeItem('readable:wpos:' + removedSlug);
          localStorage.removeItem('readable:pos:' + removedSlug);
        } catch (e) {}
        if (store.get('currentBookId', '') === id) store.set('currentBookId', '');
        uploadedBooks = uploadedBooks.filter((b) => b.id !== id);
        [...group.children].find((o) => o.value === id)?.remove();
        if (wasCurrent) clearCurrentBook();
        renderLibrary();
      } catch (error) { window.alert('Could not remove that book. Please try again.'); }
    });

    let uploading = false;
    const origUpload = reader.loadUploadedFile.bind(reader);
    reader.loadUploadedFile = async function (file) { uploading = true; try { await origUpload(file); } finally { uploading = false; } };
    reader.loadBook = async function (id) {
      if (!id || !id.startsWith('up:')) return;
      this.pause();
      this.bookPage.innerHTML = '<div class="welcome"><p>Loading book...</p></div>';
      try { const b = await db.get(id); if (!b) throw new Error('missing'); this.loadText(b.text); }
      catch (e) { this.bookPage.innerHTML = '<div class="welcome"><h2 style="color:var(--text-primary);margin-bottom:12px">Could not open this upload</h2><p>Try uploading the file again.</p></div>'; }
    };

    // ---- Resume: remember the exact place in both modes ----
    let lastSaved = -1;
    setInterval(() => {
      if (!slug || !reader.words.length || reader.currentIndex === lastSaved) return;
      lastSaved = reader.currentIndex; store.set('wpos:' + slug, lastSaved);
    }, 1500);
    addEventListener('pagehide', () => { if (slug && reader.words.length) store.set('wpos:' + slug, reader.currentIndex); });

    // Follow whatever the speed reader loads (book, upload, or PDF).
    const origLoadText = reader.loadText.bind(reader);
    reader.loadText = function (raw) {
      const first0 = raw.match(/^#\s+(.*)$/m);
      if (uploading) {
        const t = (first0 ? first0[1] : 'Your file').trim();
        const id = 'up:' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + raw.length;
        const rec = { id, title: t, text: raw, at: Date.now() };
        db.put(rec).catch(() => window.alert('This book opened, but could not be saved in this browser. You may need to upload it again later.'));
        addOption(rec); bookSelect.value = id;
        store.set('currentBookId', id);
        if (libraryDialog.open) libraryDialog.close();
      }
      const text = fromChapterOne(raw);
      origLoadText(text);
      const opt = bookSelect.selectedOptions[0];
      title = (opt && opt.value ? opt.textContent : (first0 ? first0[1] : 'Your file')).trim();
      slug = (bookSelect.value || title).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (bookSelect.value) store.set('currentBookId', bookSelect.value);
      chunks = chunkify(text);
      const at = store.get('wpos:' + slug, 0);
      lastSaved = at;
      if (at > 0 && at < reader.words.length) { reader.currentIndex = at; reader.updateDisplay(); }
      if (document.body.classList.contains('mode-feed')) render(); else list.innerHTML = '';
    };

    if (document.body.dataset.page === 'feed') render();
    if (store.get('currentBookId', '') && !store.get('currentBookId', '').startsWith('up:')) store.set('currentBookId', '');
    document.addEventListener('keydown', (e) => {
      if (document.body.dataset.page !== 'feed' || dlg.open || libraryDialog.open || researchDialog.open || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      const slides = list.children; if (!slides.length) return;
      const i = current();
      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); slides[Math.min(i + 1, slides.length - 1)].scrollIntoView({ behavior: 'smooth' }); }
      if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); slides[Math.max(i - 1, 0)].scrollIntoView({ behavior: 'smooth' }); }
    });
  })();
