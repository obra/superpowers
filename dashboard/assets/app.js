// SuperpowersDashboard - landing page + skill drill-down.
//
// All data is rendered via DOM APIs (textContent / createElement); no
// innerHTML interpolation with user-supplied strings. This avoids XSS
// when commit_message / error / metric values contain HTML-like text.
//
// All paths are RELATIVE (e.g. fetch('data/manifest.json')) so the
// dashboard works at any GitHub Pages base path without configuration.
(function (global) {
  'use strict';

  // ------------------------------------------------------------------
  // Pure helpers (exported on the public surface for unit tests).
  // ------------------------------------------------------------------

  function parseJsonl(text) {
    if (!text) return [];
    // Strip a leading BOM defensively (the producer writes UTF-8 without
    // a BOM, but a hand-edited file could grow one).
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const out = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        out.push(JSON.parse(trimmed));
      } catch (e) {
        // Skip unparseable lines; surface count in the UI separately.
        console.warn('Skipping unparseable JSONL line:', e.message);
      }
    }
    return out;
  }

  // Find the most negative delta across adjacent successful-score rows
  // in the trailing $window transitions. Error rows / null scores are
  // dropped before windowing so they don't dilute the signal.
  function computeBiggestDrop(rows, windowSize) {
    if (!Array.isArray(rows) || rows.length < 2) return null;
    const win = Math.max(1, windowSize || 10);
    const okRows = rows.filter(function (r) {
      return r && r.status === 'ok' && typeof r.headline_score === 'number';
    });
    if (okRows.length < 2) return null;

    const transitions = [];
    for (let i = 1; i < okRows.length; i++) {
      const prev = okRows[i - 1];
      const curr = okRows[i];
      transitions.push({
        from: prev.headline_score,
        to: curr.headline_score,
        delta: Math.round((curr.headline_score - prev.headline_score) * 100) / 100,
        commit: curr.commit,
        short_sha: curr.short_sha,
        timestamp: curr.timestamp,
        commit_message: curr.commit_message,
      });
    }
    const start = Math.max(0, transitions.length - win);
    const recent = transitions.slice(start);
    let worst = null;
    for (const t of recent) {
      if (t.delta >= 0) continue;
      if (!worst || t.delta < worst.delta) worst = t;
    }
    return worst;
  }

  function buildCommitUrl(repository, sha) {
    if (!repository || !sha) return null;
    // GitHub's commit URL format is universal across forks; using the
    // explicit repository from the manifest avoids the brittleness of
    // inferring it from window.location.
    return 'https://github.com/' + repository + '/commit/' + sha;
  }

  // Accept skill names matching what filesystems and our wrap-eval-output
  // producer emit (lowercase letters, digits, hyphen, underscore). Anything
  // else is rejected to keep `?name=...` from triggering fetches outside
  // the `data/` tree.
  function validateSkillName(name, allowlist) {
    if (!name || typeof name !== 'string') return false;
    if (!/^[A-Za-z0-9_-]+$/.test(name)) return false;
    if (Array.isArray(allowlist) && allowlist.length > 0) {
      return allowlist.indexOf(name) >= 0;
    }
    return true;
  }

  function relativeTime(iso) {
    if (!iso) return '';
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return '';
    const seconds = Math.round((Date.now() - t) / 1000);
    if (seconds < 60) return seconds + 's ago';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return mins + 'm ago';
    const hours = Math.round(mins / 60);
    if (hours < 48) return hours + 'h ago';
    const days = Math.round(hours / 24);
    if (days < 30) return days + 'd ago';
    const months = Math.round(days / 30);
    if (months < 24) return months + 'mo ago';
    const years = Math.round(days / 365);
    return years + 'y ago';
  }

  function formatDelta(delta) {
    if (delta === null || delta === undefined) return '';
    if (delta === 0) return '=';
    const sign = delta > 0 ? '▲ +' : '▼ ';
    return sign + delta.toFixed(2);
  }

  function deltaClass(delta) {
    if (delta === null || delta === undefined) return 'delta-flat';
    if (delta > 0) return 'delta-up';
    if (delta < 0) return 'delta-down';
    return 'delta-flat';
  }

  // Render a sparkline path (path "d" attribute) from numeric points.
  // Returns { path, lastPoint } or null for empty/invalid input. Width and
  // height are arbitrary; the SVG is sized by CSS. Y axis is auto-scaled
  // to the data range with a small pad.
  function buildSparklinePath(values, width, height) {
    if (!Array.isArray(values) || values.length === 0) return null;
    const nums = values.filter(function (v) { return typeof v === 'number'; });
    if (nums.length === 0) return null;
    const minV = Math.min.apply(null, nums);
    const maxV = Math.max.apply(null, nums);
    const range = (maxV - minV) || 1;
    const w = width || 200;
    const h = height || 36;
    const padY = 2;
    const denom = Math.max(1, values.length - 1);
    const points = values.map(function (v, i) {
      const x = (i / denom) * w;
      if (typeof v !== 'number') return { x: x, y: null };
      const y = h - padY - ((v - minV) / range) * (h - 2 * padY);
      return { x: x, y: y };
    });
    // Build path with M/L segments, breaking the line at null points so
    // error rows render as a visible gap (matches the drill-down chart).
    let d = '';
    let inSegment = false;
    for (const p of points) {
      if (p.y === null) { inSegment = false; continue; }
      d += (inSegment ? ' L' : 'M') + p.x.toFixed(2) + ',' + p.y.toFixed(2);
      inSegment = true;
    }
    const lastDefined = [].concat(points).reverse().find(function (p) { return p.y !== null; });
    return { path: d, lastPoint: lastDefined || null };
  }

  // ------------------------------------------------------------------
  // DOM helpers (safe text-only rendering).
  // ------------------------------------------------------------------

  function el(tag, attrs, text) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        const v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'dataset') {
          for (const dk in v) node.dataset[dk] = v[dk];
        } else {
          node.setAttribute(k, v);
        }
      }
    }
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function showError(message, detail) {
    const panel = document.getElementById('error-panel');
    if (!panel) return;
    panel.hidden = false;
    panel.textContent = '';
    const heading = el('strong', null, message + '\n');
    panel.appendChild(heading);
    if (detail) panel.appendChild(document.createTextNode(detail));
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) {
        const err = new Error('HTTP ' + res.status + ' fetching ' + url);
        err.status = res.status;
        err.url = url;
        throw err;
      }
      return res.json();
    });
  }

  function fetchText(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) {
        const err = new Error('HTTP ' + res.status + ' fetching ' + url);
        err.status = res.status;
        err.url = url;
        throw err;
      }
      return res.text();
    });
  }

  // ------------------------------------------------------------------
  // Landing page.
  // ------------------------------------------------------------------

  function renderSparkline(skill) {
    const points = (skill.sparkline || []).map(function (p) {
      return typeof p.headline_score === 'number' ? p.headline_score : null;
    });
    const sparklineData = buildSparklinePath(points, 200, 36);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 36');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'sparkline');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Score sparkline');
    if (sparklineData && sparklineData.path) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', sparklineData.path);
      path.setAttribute('class', 'line');
      svg.appendChild(path);
      if (sparklineData.lastPoint) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', sparklineData.lastPoint.x.toFixed(2));
        dot.setAttribute('cy', sparklineData.lastPoint.y.toFixed(2));
        dot.setAttribute('r', '2.5');
        dot.setAttribute('class', 'last');
        svg.appendChild(dot);
      }
    } else {
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', '4'); txt.setAttribute('y', '20');
      txt.setAttribute('font-size', '10');
      txt.setAttribute('fill', '#8b949e');
      txt.textContent = 'no successful runs yet';
      svg.appendChild(txt);
    }
    return svg;
  }

  function renderCard(skill, manifest) {
    const latest = skill.latest || {};
    const isError = latest.status === 'error';
    const delta = latest.delta_from_previous;
    const isRegression = typeof delta === 'number' && delta <= -10;

    const card = el('a', {
      class: 'card' + (isRegression ? ' regression' : '') + (isError ? ' error-row' : ''),
      href: 'skill.html?name=' + encodeURIComponent(skill.name),
    });

    const heading = el('h2', null, skill.name);
    if (skill.pattern) {
      const tag = el('span', { class: 'pattern-tag' }, 'Pattern ' + skill.pattern);
      heading.appendChild(tag);
    }
    card.appendChild(heading);

    const scoreLine = el('div', { class: 'score-line' });
    if (typeof latest.headline_score === 'number') {
      scoreLine.appendChild(el('span', { class: 'score' }, latest.headline_score.toFixed(1) + '%'));
    } else {
      scoreLine.appendChild(el('span', { class: 'score error' }, isError ? 'ERROR' : '—'));
    }
    if (typeof delta === 'number') {
      scoreLine.appendChild(el('span', { class: deltaClass(delta) }, formatDelta(delta)));
    }
    card.appendChild(scoreLine);

    card.appendChild(renderSparkline(skill));

    const meta = el('div', { class: 'meta' });
    meta.appendChild(el('span', null, relativeTime(latest.timestamp) || 'never'));
    if (latest.short_sha) {
      const code = el('code', null, latest.short_sha);
      meta.appendChild(code);
    }
    card.appendChild(meta);

    return card;
  }

  function renderCallout(manifest) {
    const callout = document.getElementById('callout');
    const drop = manifest.worst_recent_drop;
    if (!drop) {
      callout.hidden = true;
      return;
    }
    callout.hidden = false;
    callout.textContent = '';
    const label = el('strong', null, '⚠ Biggest recent regression: ');
    callout.appendChild(label);
    callout.appendChild(document.createTextNode(
      drop.skill + ' dropped ' + Math.abs(drop.delta).toFixed(2) + ' points on '
    ));
    const url = buildCommitUrl(manifest.repository, drop.commit);
    const sha = el('code', null, drop.short_sha || drop.commit.substring(0, 7));
    if (url) {
      const a = el('a', { href: url, target: '_blank', rel: 'noopener' });
      a.appendChild(sha);
      callout.appendChild(a);
    } else {
      callout.appendChild(sha);
    }
    if (drop.timestamp) {
      callout.appendChild(document.createTextNode(' (' + relativeTime(drop.timestamp) + ')'));
    }
  }

  function initLanding() {
    document.getElementById('how-link').setAttribute(
      'href',
      'https://github.com/obra/superpowers/blob/main/evals/_docs/headline-score-pattern-a.md'
    );
    const grid = document.getElementById('grid');
    const emptyState = document.getElementById('empty-state');
    const generatedSpan = document.getElementById('generated-at');

    fetchJson('data/manifest.json').then(function (manifest) {
      if (manifest.repository) {
        document.getElementById('how-link').setAttribute(
          'href',
          'https://github.com/' + manifest.repository + '/blob/main/evals/_docs/headline-score-pattern-a.md'
        );
      }
      generatedSpan.textContent = manifest.generated_at
        ? 'Updated ' + relativeTime(manifest.generated_at)
        : '';
      const skills = Array.isArray(manifest.skills) ? manifest.skills : [];
      if (skills.length === 0) {
        emptyState.hidden = false;
        return;
      }
      renderCallout(manifest);
      const sorted = skills.slice().sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });
      for (const s of sorted) grid.appendChild(renderCard(s, manifest));
    }).catch(function (err) {
      if (err && err.status === 404) {
        emptyState.hidden = false;
        const note = el('p', null,
          'The skill-eval workflow has not yet published any data to this site.');
        emptyState.appendChild(note);
        return;
      }
      showError('Could not load dashboard data', err.message);
    });
  }

  // ------------------------------------------------------------------
  // Skill drill-down page.
  // ------------------------------------------------------------------

  function setupSkillPage(skill, manifest) {
    document.title = skill + ' · Superpowers';
    document.getElementById('skill-name').textContent = skill;
    const skillEntry = (manifest.skills || []).find(function (s) { return s.name === skill; });
    const metaParts = [];
    if (skillEntry && skillEntry.pattern) metaParts.push('Pattern ' + skillEntry.pattern);
    if (skillEntry && skillEntry.latest && typeof skillEntry.latest.headline_score === 'number') {
      metaParts.push('Latest score ' + skillEntry.latest.headline_score.toFixed(1) + '%');
    }
    if (manifest.repository) metaParts.push('Source: ' + manifest.repository);
    document.getElementById('skill-meta').textContent = metaParts.join(' · ');

    document.getElementById('raw-history').href =
      'data/' + encodeURIComponent(skill) + '/history.jsonl';
    return skillEntry;
  }

  function buildChartData(rows, repository) {
    const labels = [];
    const data = [];
    const meta = [];
    for (const r of rows) {
      labels.push(r.short_sha || r.commit || '');
      data.push(r.status === 'ok' && typeof r.headline_score === 'number'
        ? r.headline_score
        : null);
      meta.push(r);
    }
    return { labels: labels, data: data, meta: meta };
  }

  function renderChart(rows, repository) {
    const canvas = document.getElementById('history-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    const chartData = buildChartData(rows, repository);
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'headline_score',
          data: chartData.data,
          borderColor: '#1f6feb',
          backgroundColor: 'rgba(31,111,235,0.1)',
          spanGaps: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: chartData.meta.map(function (r) {
            return r.status === 'ok' ? '#1f6feb' : '#cf222e';
          }),
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 100, title: { display: true, text: 'Headline score' } },
          x: { title: { display: true, text: 'Commit' } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function (items) {
                if (!items.length) return '';
                const m = chartData.meta[items[0].dataIndex];
                return (m.short_sha || '') + ' · ' + (m.timestamp || '');
              },
              label: function (item) {
                const m = chartData.meta[item.dataIndex];
                const lines = [];
                if (m.status === 'ok') {
                  lines.push('Score: ' + (m.headline_score !== null ? m.headline_score : '—'));
                } else {
                  lines.push('Status: ERROR');
                  if (m.error) lines.push('  ' + String(m.error).substring(0, 160));
                }
                if (m.pattern) lines.push('Pattern: ' + m.pattern);
                if (m.adapter) lines.push('Adapter: ' + m.adapter);
                if (typeof m.trials === 'number') lines.push('Trials: ' + m.trials);
                if (m.commit_message) lines.push('Msg: ' + String(m.commit_message).substring(0, 80));
                if (m.metrics && typeof m.metrics === 'object') {
                  for (const k in m.metrics) {
                    if (Object.prototype.hasOwnProperty.call(m.metrics, k)) {
                      lines.push('  ' + k + ': ' + m.metrics[k]);
                    }
                  }
                }
                return lines;
              },
            }
          }
        },
        onClick: function (_evt, elements) {
          if (!elements || !elements.length) return;
          const m = chartData.meta[elements[0].index];
          const url = buildCommitUrl(repository, m.commit);
          if (url) window.open(url, '_blank', 'noopener');
        },
      },
    });
    return chart;
  }

  // ---- pattern-dispatching detail renderers ----

  const detailRenderers = {
    // Pattern A — catch-in-any on required bugs (see headline-score-pattern-a.md)
    A: function (container, detail, headline) {
      const cases = (detail && detail.cases) || [];
      const summary = el('div', { class: 'metrics-grid' });
      const m = headline && headline.metrics ? headline.metrics : {};
      for (const k of ['tp', 'fn', 'fp_distractor', 'fp_unmatched', 'case_count', 'required_bug_count']) {
        if (k in m) {
          const dl = document.createElement('dl');
          dl.style.margin = '0';
          dl.appendChild(el('dt', null, k));
          dl.appendChild(el('dd', null, String(m[k])));
          summary.appendChild(dl);
        }
      }
      container.appendChild(summary);

      const table = el('table');
      const thead = el('thead');
      const headRow = el('tr');
      for (const h of ['Case', 'Mode', 'Mature', 'Required bugs', 'Caught (any trial)', 'Trials']) {
        headRow.appendChild(el('th', null, h));
      }
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = el('tbody');
      for (const c of cases) {
        const trials = Array.isArray(c.trials) ? c.trials : [];
        const caught = Array.isArray(c.caught_in_any) ? c.caught_in_any.filter(function (b) { return b.caught; }).length : 0;
        const required = Array.isArray(c.caught_in_any) ? c.caught_in_any.length : 0;
        const errorTrials = trials.filter(function (t) { return t.status !== 'ok'; }).length;
        const tr = el('tr', { class: errorTrials > 0 ? 'case-error' : '' });
        tr.appendChild(el('td', null, c.case_id || ''));
        tr.appendChild(el('td', null, c.mode || ''));
        tr.appendChild(el('td', null, c.mature ? 'yes' : 'no'));
        tr.appendChild(el('td', null, String(required)));
        tr.appendChild(el('td', null, caught + '/' + required));
        tr.appendChild(el('td', null, trials.length + (errorTrials ? ' (' + errorTrials + ' err)' : '')));
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      container.appendChild(table);
    },
  };

  // Fallback for patterns whose bespoke renderer hasn't landed yet: pretty-
  // print the detail blob as nested key/value pairs.
  function renderGenericDetail(container, detail) {
    const pre = el('pre');
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.fontSize = '0.85rem';
    pre.style.background = '#f6f8fa';
    pre.style.padding = '0.75rem';
    pre.style.borderRadius = '4px';
    pre.style.maxHeight = '600px';
    pre.style.overflow = 'auto';
    pre.textContent = JSON.stringify(detail, null, 2);
    container.appendChild(pre);
  }

  function renderLatestRunDetail(container, detailRun, headline) {
    container.textContent = '';
    if (!detailRun) {
      container.appendChild(el('p', null, 'No drill-down detail available for the latest run.'));
      return;
    }
    const pattern = detailRun.pattern || (headline && headline.pattern);
    const renderer = pattern && detailRenderers[pattern];
    if (renderer) {
      renderer(container, detailRun.detail, headline);
    } else {
      const note = el('p', null,
        pattern
          ? 'No bespoke renderer for pattern ' + pattern + ' yet; raw detail below.'
          : 'No pattern recorded; raw detail below.');
      container.appendChild(note);
      renderGenericDetail(container, detailRun.detail);
    }
  }

  function renderHistoryTable(rows, repository) {
    const tbody = document.querySelector('#history-table tbody');
    tbody.textContent = '';
    const sorted = rows.slice().reverse();
    let prevOk = null;
    // Pre-compute deltas walking backward so we have stable adjacent-ok deltas.
    const okList = rows.filter(function (r) {
      return r.status === 'ok' && typeof r.headline_score === 'number';
    });
    const deltaByShortSha = {};
    for (let i = 1; i < okList.length; i++) {
      deltaByShortSha[okList[i].short_sha] =
        Math.round((okList[i].headline_score - okList[i - 1].headline_score) * 100) / 100;
    }
    for (const r of sorted) {
      const tr = el('tr', { class: r.status === 'error' ? 'error' : '' });
      tr.appendChild(el('td', null, relativeTime(r.timestamp) || ''));
      const commitTd = el('td');
      const url = buildCommitUrl(repository, r.commit);
      const sha = el('code', null, r.short_sha || '');
      if (url) {
        const a = el('a', { href: url, target: '_blank', rel: 'noopener' });
        a.appendChild(sha);
        commitTd.appendChild(a);
      } else {
        commitTd.appendChild(sha);
      }
      tr.appendChild(commitTd);
      tr.appendChild(el('td', null,
        typeof r.headline_score === 'number' ? r.headline_score.toFixed(2) : '—'));
      const dval = deltaByShortSha[r.short_sha];
      const dtd = el('td', { class: deltaClass(dval) }, formatDelta(dval));
      tr.appendChild(dtd);
      tr.appendChild(el('td', null, r.status || ''));
      tr.appendChild(el('td', null, r.adapter || ''));
      const detailTd = el('td');
      if (r.detail_file) {
        // detail_file is relative to data/<skill>/, e.g. "runs/2025-…-abc.json"
        const a = el('a', {
          href: 'data/' + encodeURIComponent(currentSkill) + '/' + r.detail_file,
          target: '_blank', rel: 'noopener'
        }, 'json');
        detailTd.appendChild(a);
      } else {
        detailTd.textContent = '—';
      }
      tr.appendChild(detailTd);
      tbody.appendChild(tr);
    }
  }

  let currentSkill = null;

  function initSkillPage() {
    const params = new URLSearchParams(window.location.search);
    const requestedSkill = params.get('name');

    fetchJson('data/manifest.json').then(function (manifest) {
      const allowlist = (manifest.skills || []).map(function (s) { return s.name; });
      if (!validateSkillName(requestedSkill, allowlist)) {
        showError('Unknown skill', 'No skill named "' + requestedSkill + '" in manifest.json. ' +
          'Available: ' + allowlist.join(', '));
        return;
      }
      currentSkill = requestedSkill;
      const skillEntry = setupSkillPage(requestedSkill, manifest);
      const repository = manifest.repository;

      const histUrl = 'data/' + encodeURIComponent(requestedSkill) + '/history.jsonl';
      fetchText(histUrl).then(function (text) {
        const rows = parseJsonl(text);
        if (rows.length === 0) {
          showError('Skill has no history yet', histUrl);
          return;
        }
        renderChart(rows, repository);
        renderHistoryTable(rows, repository);

        // Lazy-load the latest ok run detail for the pattern-dispatch table.
        const lastOk = rows.slice().reverse().find(function (r) {
          return r.status === 'ok' && r.detail_file;
        });
        if (!lastOk) {
          const container = document.getElementById('latest-detail');
          container.textContent = '';
          container.appendChild(el('p', null,
            'No successful runs yet. Once the workflow records an ok run, ' +
            'the per-pattern detail will appear here.'));
          document.getElementById('raw-run').href = '#';
          return;
        }
        const runUrl = 'data/' + encodeURIComponent(requestedSkill) + '/' + lastOk.detail_file;
        document.getElementById('raw-run').href = runUrl;
        fetchJson(runUrl).then(function (detailRun) {
          renderLatestRunDetail(document.getElementById('latest-detail'), detailRun, lastOk);
        }).catch(function (err) {
          showError('Failed to load latest run detail', err.message + ' (' + runUrl + ')');
        });
      }).catch(function (err) {
        if (err.status === 404) {
          showError('No history file', histUrl + ' has not been published yet.');
          return;
        }
        showError('Failed to load history', err.message);
      });
    }).catch(function (err) {
      showError('Could not load manifest', err.message);
    });
  }

  // ------------------------------------------------------------------
  // Public surface.
  // ------------------------------------------------------------------

  global.SuperpowersDashboard = {
    // Pure helpers (testable from Node).
    parseJsonl: parseJsonl,
    computeBiggestDrop: computeBiggestDrop,
    buildCommitUrl: buildCommitUrl,
    validateSkillName: validateSkillName,
    buildSparklinePath: buildSparklinePath,
    formatDelta: formatDelta,
    deltaClass: deltaClass,
    relativeTime: relativeTime,
    // Page entrypoints (call from <script> at end of page).
    initLanding: initLanding,
    initSkillPage: initSkillPage,
  };
})(typeof window !== 'undefined' ? window : globalThis);
