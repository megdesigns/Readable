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
    const savedTabs = document.getElementById('savedTabs');
    const selectionBar = document.getElementById('selectionBar');
    const noteDialog = document.getElementById('noteDialog');
    const noteText = document.getElementById('noteText');
    const dlg = document.getElementById('savedDialog');
    const grid = document.getElementById('savedGrid');
    // Everything is kept in this browser's localStorage. Nothing is sent anywhere.
    const store = {
      get(k, d) { try { return JSON.parse(localStorage.getItem('readable:' + k)) ?? d; } catch (e) { return d; } },
      set(k, v) { try { localStorage.setItem('readable:' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
    };
    const items = () => store.get('savedItems', []);
    const liked = () => store.get('likedItems', []);
    const highlights = () => store.get('highlights', []);
    const notes = () => store.get('readerNotes', []);
    let chunks = [], slug = '', title = '';
    let savedTab = 'saved';
    let activeSelection = null;
    let noteContext = null;
    let editingNoteId = null;

    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const icon = (name) => `<svg class="action-icon" aria-hidden="true"><use href="#r-${name}"></use></svg>`;
    const countAll = () => items().length + liked().length + highlights().length + notes().length;
    const paintCount = () => { filterBtn.innerHTML = `${icon('bookmark')}Saved · ${countAll()}`; };
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

    const passageId = (i) => slug + ':' + i;
    const passageItem = (i) => ({ id: passageId(i), slug, title, chapter: chunks[i].chapter, i, n: chunks.length, text: chunks[i].text, at: Date.now() });
    function highlightedHTML(i) {
      const source = chunks[i].text;
      const ranges = highlights().filter((x) => x.slug === slug && x.i === i)
        .sort((a, b) => a.start - b.start);
      let html = '', offset = 0;
      for (const range of ranges) {
        const start = Math.max(offset, range.start);
        const end = Math.min(source.length, range.end);
        if (end <= start) continue;
        html += esc(source.slice(offset, start)) + '<mark>' + esc(source.slice(start, end)) + '</mark>';
        offset = end;
      }
      return html + esc(source.slice(offset));
    }
    function paintSlide(i) {
      const slide = list.querySelector(`.feed-slide[data-i="${i}"]`);
      if (!slide || !chunks[i]) return;
      slide.querySelector('.feed-text').innerHTML = highlightedHTML(i);
      const id = passageId(i);
      for (const [kind, records] of [['like', liked()], ['saved', items()]]) {
        const button = slide.querySelector(`[data-act="${kind}"]`);
        const on = records.some((x) => x.id === id);
        button.classList.toggle('on', on);
        button.setAttribute('aria-pressed', String(on));
        button.setAttribute('aria-label', (kind === 'like' ? (on ? 'Unlike' : 'Like') : (on ? 'Remove saved passage' : 'Save passage')));
      }
      slide.querySelector('[data-act="note"]').classList.toggle('on', notes().some((x) => x.slug === slug && x.i === i));
    }

    const setH = () => feedView.style.setProperty('--fh', feedView.clientHeight + 'px');
    window.addEventListener('resize', setH);
    function render() {
      clearSelection();
      setH();
      if (!chunks.length) {
        feedBookName.textContent = 'Add a book to begin';
        list.innerHTML = '<div class="feed-empty">'
          + '<div class="welcome-hero feed-hero"><img class="hero-dark" src="https://mariangasinu.com/wp-content/uploads/2026/09/readable-dark-scaled.png" alt="Readable artwork: gold glasses showing one word at a time" width="1600" height="992" decoding="async" />'
          + '<img class="hero-light" src="https://mariangasinu.com/wp-content/uploads/2026/09/readable-light-scaled.png" alt="" width="1600" height="992" decoding="async" /></div>'
          + '<div class="feed-empty-copy"><span class="feed-eyebrow">Read your way</span><h2>One thought at a time.</h2>'
          + '<p>Turn your own book into a scroll you can actually stay with. Like, save, highlight, and make notes as you read.</p>'
          + '<div class="feed-empty-actions"><button type="button" data-empty-upload>Add a book</button><button type="button" data-empty-library>Your books</button></div>'
          + '<p class="feed-empty__note">Your place, saved passages, and uploads stay in this browser.</p></div></div>';
        fill.style.width = '0';
        return;
      }
      feedBookName.textContent = title;
      const saved = new Set(items().filter((x) => x.slug === slug).map((x) => x.i));
      const hearts = new Set(liked().filter((x) => x.slug === slug).map((x) => x.i));
      const noted = new Set(notes().filter((x) => x.slug === slug).map((x) => x.i));
      list.innerHTML = chunks.map((c, i) => `
        <article class="feed-slide" data-i="${i}">
          <div class="feed-meta"><b>${esc(title)}</b>${c.chapter ? '<span>· ' + esc(c.chapter) + '</span>' : ''}<span>· ${i + 1} of ${chunks.length}</span></div>
          <div class="feed-reading">
            <p class="feed-text">${highlightedHTML(i)}</p>
            <div class="feed-acts" aria-label="Passage actions">
              <button type="button" data-act="like" class="${hearts.has(i) ? 'on' : ''}" aria-label="${hearts.has(i) ? 'Unlike' : 'Like'}" aria-pressed="${hearts.has(i)}">${icon('heart')}<span>Like</span></button>
              <button type="button" data-act="saved" class="${saved.has(i) ? 'on' : ''}" aria-label="${saved.has(i) ? 'Remove saved passage' : 'Save passage'}" aria-pressed="${saved.has(i)}">${icon('bookmark')}<span>Save</span></button>
              <button type="button" data-act="note" class="${noted.has(i) ? 'on' : ''}">${icon('note')}<span>Note</span></button>
              <button type="button" data-act="restart">${icon('restart')}<span>Restart</span></button>
            </div>
          </div>
          <p class="feed-tip">Select words to highlight or note them.</p>
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

    const openLibrary = () => { renderLibrary(); libraryDialog.showModal(); };
    list.addEventListener('click', (e) => {
      if (e.target.closest('[data-empty-library]')) openLibrary();
      if (e.target.closest('[data-empty-upload]')) reader.fileUpload.click();
    });

    function togglePassage(kind, i) {
      const key = kind === 'like' ? 'likedItems' : 'savedItems';
      const all = kind === 'like' ? liked() : items();
      const id = passageId(i);
      store.set(key, all.some((x) => x.id === id)
        ? all.filter((x) => x.id !== id)
        : [passageItem(i), ...all]);
      paintSlide(i);
      paintCount();
    }
    function openNote(context, existing = null) {
      clearSelection();
      noteContext = context;
      editingNoteId = existing?.id || null;
      document.getElementById('noteTitle').textContent = existing ? 'Edit note' : 'Note on this passage';
      document.getElementById('noteSource').textContent = context.title + (context.chapter ? ' · ' + context.chapter : '');
      document.getElementById('noteQuote').textContent = context.quote || context.text;
      noteText.value = existing?.note || '';
      noteDialog.showModal();
      noteText.focus();
    }
    document.getElementById('noteForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const body = noteText.value.trim();
      if (!body || !noteContext) return;
      const entry = { ...noteContext, id: editingNoteId || `note:${Date.now()}:${Math.random().toString(36).slice(2)}`, note: body, at: Date.now() };
      store.set('readerNotes', [entry, ...notes().filter((x) => x.id !== editingNoteId)]);
      noteDialog.close();
      if (entry.slug === slug) paintSlide(entry.i);
      paintCount();
      if (dlg.open) renderSaved();
      noteContext = null;
      editingNoteId = null;
    });
    document.getElementById('noteClose').addEventListener('click', () => noteDialog.close());
    noteDialog.addEventListener('click', (e) => { if (e.target === noteDialog) noteDialog.close(); });

    list.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-act]');
      if (!button || !button.closest('.feed-slide')) return;
      const action = button.dataset.act;
      const i = Number(button.closest('.feed-slide').dataset.i);
      if (action === 'like' || action === 'saved') togglePassage(action, i);
      if (action === 'note') openNote({ ...passageItem(i), quote: chunks[i].text });
      if (action === 'restart') {
        store.set('pos:' + slug, 0);
        feedView.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    function readSelection() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return null;
      const range = selection.getRangeAt(0);
      const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
      const passage = startElement?.closest('.feed-text');
      if (!passage || !passage.contains(range.endContainer)) return null;
      const slide = passage.closest('.feed-slide');
      const i = Number(slide?.dataset.i);
      if (!Number.isInteger(i) || !chunks[i]) return null;
      const before = document.createRange();
      before.selectNodeContents(passage);
      before.setEnd(range.startContainer, range.startOffset);
      const start = before.toString().length;
      const end = start + range.toString().length;
      if (end - start < 2) return null;
      return { slug, i, start, end, text: chunks[i].text.slice(start, end) };
    }
    function captureSelection() {
      const selected = readSelection();
      if (!selected) return;
      activeSelection = selected;
      selectionBar.hidden = false;
    }
    document.addEventListener('selectionchange', () => setTimeout(captureSelection, 0));
    list.addEventListener('mouseup', () => setTimeout(captureSelection, 0));
    list.addEventListener('touchend', () => setTimeout(captureSelection, 20));
    function clearSelection() {
      activeSelection = null;
      selectionBar.hidden = true;
      window.getSelection()?.removeAllRanges();
    }
    selectionBar.addEventListener('mousedown', (e) => e.preventDefault());
    selectionBar.addEventListener('click', (e) => {
      const button = e.target.closest('[data-selection-action]');
      if (!button || !activeSelection || activeSelection.slug !== slug) return;
      const { i, start, end, text } = activeSelection;
      if (button.dataset.selectionAction === 'note') {
        openNote({ ...passageItem(i), quote: text });
      } else {
        const all = highlights();
        const overlap = all.filter((x) => x.slug === slug && x.i === i && x.end >= start && x.start <= end);
        const first = Math.min(start, ...overlap.map((x) => x.start));
        const last = Math.max(end, ...overlap.map((x) => x.end));
        const entry = { ...passageItem(i), id: overlap[0]?.id || `highlight:${Date.now()}:${Math.random().toString(36).slice(2)}`,
          start: first, end: last, excerpt: chunks[i].text.slice(first, last), at: Date.now() };
        store.set('highlights', [entry, ...all.filter((x) => !overlap.includes(x))]);
        paintSlide(i);
        paintCount();
      }
      clearSelection();
    });

    const categories = [
      ['liked', 'Liked', liked], ['highlights', 'Highlights', highlights],
      ['saved', 'Saved', items], ['notes', 'Notes', notes]
    ];
    function renderSaved() {
      document.getElementById('savedCount').textContent = countAll() ? ` · ${countAll()} kept` : '';
      savedTabs.innerHTML = categories.map(([key, label, read]) => `
        <button type="button" role="tab" id="saved-tab-${key}" data-tab="${key}" aria-selected="${savedTab === key}">${label} <span>${read().length}</span></button>`).join('');
      grid.setAttribute('aria-labelledby', 'saved-tab-' + savedTab);
      const all = (categories.find(([key]) => key === savedTab)?.[2]() || []).slice().sort((a, b) => (b.at || 0) - (a.at || 0));
      grid.innerHTML = all.length ? all.map((x) => `
        <article class="saved-card" data-id="${esc(x.id)}">
          <div class="feed-meta"><b>${esc(x.title)}</b>${x.chapter ? '<span>· ' + esc(x.chapter) + '</span>' : ''}<span>· ${x.i + 1} of ${x.n}</span></div>
          <p class="saved-quote">${esc(savedTab === 'highlights' ? x.excerpt : savedTab === 'notes' ? (x.quote || x.text) : x.text)}</p>
          ${savedTab === 'notes' ? `<p class="saved-note-text">${esc(x.note)}</p>` : ''}
          <div class="saved-card-actions"><button type="button" data-open="${esc(x.id)}">Read passage</button>${savedTab === 'notes' ? `<button type="button" data-edit="${esc(x.id)}">Edit note</button>` : ''}<button type="button" data-remove="${esc(x.id)}">Remove</button></div>
        </article>`).join('')
        : `<div class="saved-empty"><h3>No ${savedTab} yet</h3><p>Keep something from a passage while you read and it will appear here on this device.</p></div>`;
    }
    filterBtn.addEventListener('click', () => { renderSaved(); dlg.showModal(); });
    document.getElementById('savedClose').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    savedTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      savedTab = tab.dataset.tab;
      renderSaved();
    });
    grid.addEventListener('click', async (e) => {
      const card = e.target.closest('.saved-card');
      if (!card) return;
      const source = categories.find(([key]) => key === savedTab);
      const record = source[2]().find((x) => x.id === card.dataset.id);
      if (!record) return;
      if (e.target.closest('[data-edit]')) { openNote(record, record); return; }
      if (e.target.closest('[data-open]')) {
        if (record.slug === slug) {
          dlg.close();
          list.querySelector(`.feed-slide[data-i="${record.i}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        const uploaded = uploadedBooks.find((book) => book.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === record.slug);
        if (uploaded) {
          store.set('pos:' + record.slug, record.i);
          bookSelect.value = uploaded.id;
          await reader.loadBook(uploaded.id);
          dlg.close();
        } else {
          window.alert('This book is no longer on this device. Add it again to read the passage.');
        }
        return;
      }
      if (!e.target.closest('[data-remove]')) return;
      const key = { liked: 'likedItems', highlights: 'highlights', saved: 'savedItems', notes: 'readerNotes' }[savedTab];
      store.set(key, source[2]().filter((x) => x.id !== record.id));
      if (record.slug === slug) paintSlide(record.i);
      paintCount();
      renderSaved();
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
      if (document.body.dataset.page !== 'feed' || dlg.open || libraryDialog.open || noteDialog.open || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      const slides = list.children; if (!slides.length) return;
      const i = current();
      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); slides[Math.min(i + 1, slides.length - 1)].scrollIntoView({ behavior: 'smooth' }); }
      if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); slides[Math.max(i - 1, 0)].scrollIntoView({ behavior: 'smooth' }); }
    });
  })();
