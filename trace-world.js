/* Trace — follow one request through Madhur's two GenAI projects.
   Nothing advances on its own: every station waits for a decision.
   All records are fictional samples; no live account, model or database is called. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const host = $('trace');
  const renderer = new TraceRenderer(host);

  const QUESTION = 'Which sites had the most open incidents last month?';

  /* Icons ship as white-carded art; cut them out once and reuse the transparent version. */
  const ICONS = {};
  function icon(name, into) {
    const src = './assets/worlds/icon-' + name + '.webp';
    const apply = url => { if (url) { into.src = url; into.hidden = false; } else into.remove(); };
    if (ICONS[name]) { ICONS[name].then(apply); return; }
    ICONS[name] = TraceRenderer.cutout(src);
    ICONS[name].then(apply);
  }
  let station = 'arrival', branch = null, schema = [], tools = [], busy = false;
  const log = [];

  /* ---------- chrome ---------- */
  function brief(chapter, title, intro, showRequest) {
    $('chapter').textContent = chapter; $('title').textContent = title; $('intro').textContent = intro;
    const box = $('request'); box.hidden = !showRequest;
    if (showRequest) box.querySelector('p').textContent = QUESTION;
  }
  function say(text) { $('feedback').textContent = text; }
  function label(text) { $('stationLabel').textContent = text; }
  function actions(list) {
    const bar = $('actions'); bar.replaceChildren();
    for (const [text, fn, kind] of list) {
      const b = el('button', kind === 'secondary' ? 'secondary' : '', text);
      b.type = 'button'; b.onclick = fn; bar.append(b);
    }
  }
  function artifact(node) {
    const slot = $('artifact'); slot.replaceChildren();
    if (node) { node.classList.add('artifact-in'); slot.append(node); }
    requestAnimationFrame(place);
  }
  // Keep the arena between the brief and the dock, like the other worlds.
  function place() {
    const root = host.getBoundingClientRect(), b = $('brief').getBoundingClientRect(), d = $('dock').getBoundingClientRect();
    const arena = $('arena'), top = b.bottom - root.top + 12, bottom = d.top - root.top - 10;
    arena.style.top = top + 'px'; arena.style.height = Math.max(90, bottom - top) + 'px';
    $('stationLabel').style.top = '0px';
  }
  new ResizeObserver(place).observe($('brief'));
  new ResizeObserver(place).observe($('dock'));

  function record(heading, text) { log.push({ heading, text }); $('traceCount').textContent = String(log.length); }

  function travel(text, then) {
    if (busy) return; busy = true;
    const t = $('travel'); t.querySelector('span').textContent = text;
    t.classList.remove('flying'); void t.offsetWidth; t.classList.add('flying');
    setTimeout(() => { busy = false; t.classList.remove('flying'); then(); }, host.classList.contains('gentle') ? 60 : 620);
  }

  const glass = (miniLabel, strongText, bodyText) => {
    const g = el('div', 'glass');
    if (miniLabel) g.append(el('span', 'mini-label', miniLabel));
    if (strongText) g.append(el('strong', '', strongText));
    if (bodyText) g.append(el('p', '', bodyText));
    return g;
  };

  /* ---------- stations ---------- */
  function goArrival() {
    station = 'arrival'; branch = null; schema = []; tools = [];
    renderer.set('arrival');
    brief('00 / INTAKE', 'A question enters the system.', 'One request, followed end to end. You decide what happens at every gate.', true);
    label('INTAKE GATE · IDENTITY CHECKED');
    artifact(glass('WHO IS ASKING', 'Signed in with Entra ID',
      'The request carries your identity from here on. Nothing downstream runs without it — that is what makes the answer safe to return.'));
    say('Your question is ready to enter the system.');
    actions([['Send it in →', () => travel('AUTHENTICATING', () => { record('Intake', 'The request entered with an Entra ID identity attached.'); goFork(); })]]);
  }

  function goFork() {
    station = 'fork'; renderer.set('fork');
    brief('01 / INTENT', 'What should the system do?', 'The same question can be answered two ways. Intent detection picks the lane — here, you pick it.', true);
    label('INTENT FORK · CHOOSE A PROJECT');
    const grid = el('div', 'choice-grid');
    const make = (cls, tag, name, desc, art, fn) => {
      const b = el('button', 'portal' + (cls ? ' ' + cls : '')); b.type = 'button';
      const im = el('img'); im.alt = ''; im.hidden = true; b.append(im); icon(art, im);
      b.append(el('small', '', tag), el('strong', '', name), el('span', '', desc));
      b.onclick = fn; return b;
    };
    grid.append(
      make('', 'SAFETY CHAT AGENT', 'Analyse the data', 'Turn the question into governed SQL and a chart.', 'analyze',
        () => travel('ROUTING → NL-TO-SQL', () => { branch = 'analyze'; record('Intent', 'Routed to Safety Chat Agent — the question needs data, not an action.'); goSchema(); })),
      make('galaxy', 'GALAXY ASSISTANT', 'Do the work', 'Gather context from the workplace and act on it.', 'act',
        () => travel('ROUTING → WORKPLACE', () => { branch = 'galaxy'; record('Intent', 'Routed to Galaxy Assistant — the request needs an action across tools.'); goTools(); }))
    );
    artifact(grid);
    say('Two projects, two different jobs. Pick a lane.');
    actions([]);
  }

  /* ----- branch A: Safety Chat Agent ----- */
  const TABLES = [
    ['Incidents', 'Reports, status and dates'],
    ['Sites', 'Location and company scope'],
    ['Users', 'Who reported and approved'],
    ['Retrieve everything', 'Send the whole schema to the model'],
  ];
  function goSchema() {
    station = 'schema'; renderer.set('analyze');
    brief('02 / SCHEMA RAG', 'Give the model only what it needs.', 'The model cannot see your database. It sees the slice of schema we retrieve for it.', false);
    label('SCHEMA RETRIEVAL');
    const grid = el('div', 'schema-grid');
    TABLES.forEach(([name, desc], i) => {
      const b = el('button'); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.append(document.createTextNode(name), el('span', '', desc));
      b.onclick = () => {
        if (i === TABLES.length - 1) { schema = ['everything']; }
        else { schema = schema.filter(s => s !== 'everything'); schema.includes(name) ? schema.splice(schema.indexOf(name), 1) : schema.push(name); }
        [...grid.children].forEach((c, k) => c.setAttribute('aria-pressed', String(
          k === TABLES.length - 1 ? schema[0] === 'everything' : schema.includes(TABLES[k][0]))));
        say(schema[0] === 'everything'
          ? 'Everything retrieved. It works, but a bigger prompt costs more and invites mistakes.'
          : schema.length ? 'Retrieved: ' + schema.join(', ') + '.' : 'Nothing retrieved yet.');
        actions(schema.length ? [['Generate the SQL →', () => travel('GENERATING', () => {
          record('Schema RAG', schema[0] === 'everything' ? 'Sent the whole schema.' : 'Retrieved only: ' + schema.join(', ') + '.');
          goGenerate();
        })]] : []);
      };
      grid.append(b);
    });
    artifact(grid);
    say('Choose what the model is allowed to see.');
    actions([]);
  }

  function code(lines) {
    const p = el('p', 'code');
    for (const [text, kind] of lines) { const s = kind ? el('span', kind, text) : document.createTextNode(text); p.append(s); }
    return p;
  }
  function goGenerate() {
    station = 'generate'; renderer.set('analyze');
    brief('03 / GENERATION', 'The model writes SQL.', 'A first draft, not a trusted answer. Nothing runs until it has been checked.', false);
    label('DRAFT QUERY');
    const g = glass('MODEL OUTPUT · DRAFT', 'A first attempt');
    g.append(code([
      ['SELECT s.Name, COUNT(*) AS OpenCount\nFROM Incidents i\nJOIN Sites s ON s.Id = i.SiteId\nWHERE i.Status = ', null],
      ["'Open'", null], ['\n  AND i.CreatedOn >= DATEADD(month, -1, GETDATE())\nGROUP BY s.Name', null],
    ]));
    artifact(g);
    say('Draft written. Now it gets checked.');
    actions([['Validate it →', () => travel('VALIDATING', () => { record('Generation', 'The model drafted a grouped COUNT query.'); goValidate(); })]]);
  }

  function goValidate() {
    station = 'validate'; renderer.set('analyze');
    brief('04 / VALIDATION', 'Check before you trust.', 'A validator inspects the draft against the real schema and the business rules.', false);
    label('VALIDATION · FAULT FOUND');
    const g = glass('VALIDATOR', 'One problem found');
    g.append(code([
      ['WHERE i.Status = ', null], ["'Open'", 'fault'],
      ['\n-- Status is stored as a lookup id, not text.\n-- This query would return zero rows.', null],
    ]));
    g.append(el('p', 'evidence', 'This is the loop that stops a confident, wrong answer from reaching you.'));
    artifact(g);
    say('The draft would have silently returned nothing.');
    actions([['Run the correction loop →', () => travel('CORRECTING', () => { record('Validation', 'Caught a wrong Status comparison — the query would have returned zero rows.'); goCorrected(); })]]);
  }

  function goCorrected() {
    station = 'corrected'; renderer.set('analyze');
    brief('05 / CORRECTION', 'Send it back once, fixed.', 'The fault is fed back with the schema fact it got wrong. One pass is usually enough.', false);
    label('CORRECTED QUERY');
    const g = glass('AFTER CORRECTION', 'Now it matches the schema');
    g.append(code([
      ['WHERE i.StatusId = ', null], ['(SELECT Id FROM IncidentStatus WHERE Code = \'OPEN\')', 'fixed'],
    ]));
    artifact(g);
    say('Corrected against the real schema.');
    actions([['Execute with my permissions →', () => travel('EXECUTING · RLS ON', () => { record('Correction', 'One corrective pass fixed the comparison.'); goExecute(); })]]);
  }

  function goExecute() {
    station = 'execute'; renderer.set('analyze');
    brief('06 / EXECUTION', 'It runs as you, not as an admin.', 'The query executes inside your session context, so row-level security still applies to the model’s SQL.', false);
    label('ROW-LEVEL SECURITY APPLIED');
    const g = glass('EXECUTION', 'Two sites were filtered out');
    g.append(el('p', '', 'Your identity is stamped into the database session, and the security policy filters rows before they are returned. The model never widens your access.'));
    g.append(el('p', 'evidence denied', 'Excluded: 2 sites outside your company scope.'));
    artifact(g);
    say('The answer can only contain rows you were already allowed to see.');
    actions([['See the answer →', () => travel('RETURNING', () => { record('Execution', 'Ran under row-level security — 2 out-of-scope sites were filtered out.'); goResult(); })]]);
  }

  const RESULT = [['Northgate Depot', 14], ['Harbour Yard', 9], ['Kiln Street', 6], ['Ferry Lane', 3]];
  function goResult() {
    station = 'result'; renderer.set('answer');
    brief('07 / ANSWER', 'A number you can defend.', 'Every step that produced this is on the record — no hidden “thinking”.', false);
    label('RESULT · LAST 30 DAYS');
    const g = glass('OPEN INCIDENTS BY SITE', 'Northgate Depot leads with 14');
    const max = RESULT[0][1];
    for (const [name, n] of RESULT) {
      const row = el('div', 'bar-row');
      row.append(el('span', '', name));
      const track = el('div', 'bar-track'), fill = el('div', 'bar-fill');
      fill.style.setProperty('--bar', Math.round(n / max * 100) + '%'); track.append(fill);
      row.append(track, el('b', '', String(n)));
      g.append(row);
    }
    g.append(el('p', 'receipt-note', 'Sample data for this walkthrough.'));
    artifact(g);
    say('Answered — and you can see exactly how it got here.');
    record('Answer', 'Returned 4 sites with open-incident counts, filtered to your scope.');
    actions([['Open your trace', () => $('traceLog').showModal()], ['Try the other project', goFork, 'secondary']]);
  }

  /* ----- branch B: Galaxy Assistant ----- */
  const TOOLS = [
    ['teams', 'Teams', 'Channel messages'],
    ['outlook', 'Outlook', 'Mail threads'],
    ['calendar', 'Calendar', 'Meetings and slots'],
    ['devops', 'DevOps', 'Work items and PRs'],
  ];
  function goTools() {
    station = 'tools'; renderer.set('galaxy');
    brief('02 / CONTEXT', 'Pull the context in.', 'Microsoft Graph gives the assistant read access to the workplace — with your permissions, not its own.', false);
    label('CHOOSE WHERE TO LOOK');
    const grid = el('div', 'tools');
    TOOLS.forEach(([key, name, desc]) => {
      const b = el('button', 'tool'); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      const img = el('img'); img.alt = ''; img.hidden = true; icon(key, img);
      const wrap = el('div'); wrap.append(el('b', '', name), el('span', '', desc));
      b.append(img, wrap);
      b.onclick = () => {
        tools.includes(key) ? tools.splice(tools.indexOf(key), 1) : tools.push(key);
        b.setAttribute('aria-pressed', String(tools.includes(key)));
        say(tools.length ? 'Reading from: ' + tools.map(k => TOOLS.find(t => t[0] === k)[1]).join(', ') + '.' : 'Nothing selected yet.');
        actions(tools.length ? [['Gather the context →', () => travel('READING VIA GRAPH', () => {
          record('Context', 'Gathered from ' + tools.map(k => TOOLS.find(t => t[0] === k)[1]).join(', ') + '.');
          goGather();
        })]] : []);
      };
      grid.append(b);
    });
    artifact(grid);
    say('Pick the sources. Fewer sources, tighter answer.');
    actions([]);
  }

  function goGather() {
    station = 'gather'; renderer.set('galaxy');
    brief('03 / SUMMARY', 'Turn noise into something short.', 'The assistant summarises only what it was allowed to read.', false);
    label('WHAT IT FOUND');
    const g = glass('SUMMARY', 'Three things need a decision');
    for (const [k, v] of [['Open incidents raised this week', '14'], ['Waiting on approval', '5'], ['Overdue actions', '2']]) {
      const f = el('div', 'fact'); f.append(el('span', '', k), el('b', '', v)); g.append(f);
    }
    g.append(el('p', 'quote', '“Northgate still has two overdue actions from last week.” — Teams, #safety-ops'));
    artifact(g);
    say('Summarised from the sources you chose.');
    actions([['Draft a follow-up →', () => travel('DRAFTING', () => { record('Summary', 'Summarised the gathered context into three decisions.'); goDraft(); })]]);
  }

  function goDraft() {
    station = 'draft'; renderer.set('galaxy');
    brief('04 / ACTION', 'Now do something with it.', 'Reading is easy. The useful part is the action at the end — still yours to approve.', false);
    label('DRAFT · YOU APPROVE IT');
    const box = el('div', 'glass');
    box.append(el('span', 'mini-label', 'FOLLOW-UP'));
    const draft = el('div', 'draft');
    const lab = el('label', 'selection'); lab.append(el('span', '', 'Subject'));
    const input = el('input'); input.type = 'text'; input.value = 'Northgate — 2 overdue actions'; lab.append(input);
    draft.append(lab);
    draft.append(el('p', 'draft-summary', 'Sends to the safety owners listed on those actions, with the summary above attached as a PDF.'));
    box.append(draft);
    artifact(box);
    say('Nothing is sent until you approve it.');
    actions([['Approve and send →', () => travel('SENDING', () => {
      record('Action', 'Approved a follow-up: “' + (input.value || 'Northgate — 2 overdue actions') + '”.'); goReceipt();
    })], ['Discard', () => { record('Action', 'Discarded the draft without sending.'); goReceipt(true); }, 'secondary']]);
  }

  function goReceipt(discarded) {
    station = 'receipt'; renderer.set('answer');
    brief('05 / DONE', discarded ? 'Nothing was sent.' : 'The follow-up is out.', 'Every step you took is on the record.', false);
    label(discarded ? 'DISCARDED' : 'SENT · RECORDED');
    const g = el('div', 'glass');
    g.append(el('span', 'status-tag', discarded ? 'NO ACTION TAKEN' : 'ACTION RECORDED'));
    g.append(el('strong', 'receipt-title', discarded ? 'Draft discarded' : 'Follow-up sent'));
    g.append(el('p', '', discarded
      ? 'The assistant proposed it; you declined. That is the point — it never acts on its own.'
      : 'Recorded with who approved it, when, and what it was based on.'));
    g.append(el('p', 'receipt-note', 'Sample only — no message left this page.'));
    artifact(g);
    say(discarded ? 'Declined, and logged as declined.' : 'Sent, and logged.');
    actions([['Open your trace', () => $('traceLog').showModal()], ['Try the other project', goFork, 'secondary']]);
  }

  /* ---------- explain + trace log ---------- */
  const TOPICS = [
    ['Why retrieve schema instead of sending it all', 'Schema RAG',
      'The model gets the slice of schema the question needs, not the whole database.',
      'Smaller prompts are cheaper, faster and far less likely to invent a column that does not exist.',
      'Intent detection → schema retrieval → prompt assembly.'],
    ['Why generated SQL is never trusted', 'Validation and correction',
      'Every generated query is checked against the real schema and business rules before anything runs.',
      'A wrong query that returns zero rows looks just like a real answer. The loop stops that.',
      'Validation → single corrective pass → re-validate → execute.'],
    ['Why the model cannot widen your access', 'RLS-aware execution',
      'The query runs inside your session context, so the database filters rows before returning them.',
      'Security does not depend on the model behaving. It is enforced underneath it.',
      'Session context stamped per connection; security policies filter every row.'],
    ['Why repeated questions get cheaper', 'Semantic cache',
      'Questions that mean the same thing reuse the earlier result instead of calling the model again.',
      'Less spend, faster replies, and identical answers to identical questions.',
      'Semantic similarity over prior questions, with the result cached against it.'],
    ['How the assistant reaches Teams and Outlook', 'Microsoft Graph',
      'Galaxy Assistant reads the workplace through Graph, using the signed-in user’s own permissions.',
      'It can only ever see what you could already see yourself.',
      'Entra ID sign-in → delegated Graph access → scoped reads.'],
  ];
  function buildTopics() {
    const sel = $('topic'); sel.replaceChildren();
    TOPICS.forEach(([q], i) => { const o = el('option', '', q); o.value = String(i); sel.append(o); });
    const show = () => { const t = TOPICS[Number(sel.value) || 0];
      $('detailHeading').textContent = t[1]; $('detailText').textContent = t[2]; $('detailBenefit').textContent = t[3]; $('detailTech').textContent = t[4]; };
    sel.onchange = show; show();
  }
  function openLog() {
    const sel = $('logSelect'); sel.replaceChildren();
    if (!log.length) { $('logHeading').textContent = 'Nothing yet'; $('logText').textContent = 'Move the request forward and each decision will appear here.'; }
    log.forEach((s, i) => { const o = el('option', '', (i + 1) + ' · ' + s.heading); o.value = String(i); sel.append(o); });
    const show = () => { const s = log[Number(sel.value) || 0]; if (!s) return;
      $('logHeading').textContent = s.heading; $('logText').textContent = s.text; };
    sel.onchange = show; if (log.length) show();
    $('traceLog').showModal();
  }

  /* ---------- wiring ---------- */
  $('explain').onclick = () => $('details').showModal();
  $('journal').onclick = openLog;
  $('menuButton').onclick = () => $('options').showModal();
  $('restart').onclick = () => { $('options').close(); log.length = 0; $('traceCount').textContent = '0'; goArrival(); };
  $('motion').onclick = e => { const on = host.classList.toggle('gentle'); e.currentTarget.setAttribute('aria-pressed', String(on)); renderer.gentle = on; };
  for (const d of document.querySelectorAll('dialog')) d.querySelector('.close').onclick = () => d.close();

  host.addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect();
    renderer.target = { x: (e.clientX - r.left) / r.width * 2 - 1, y: (e.clientY - r.top) / r.height * 2 - 1 };
  });
  host.addEventListener('pointerleave', () => { renderer.target = { x: 0, y: 0 }; });
  if (window.DeviceOrientationEvent) addEventListener('deviceorientation', e => {
    if (e.gamma == null) return;
    renderer.target = { x: Math.max(-1, Math.min(1, e.gamma / 32)), y: Math.max(-1, Math.min(1, (e.beta - 32) / 40)) };
  });

  buildTopics();
  renderer.ready.then(() => { $('loading').style.opacity = '0'; setTimeout(() => $('loading').remove(), 500); });
  goArrival();
})();
