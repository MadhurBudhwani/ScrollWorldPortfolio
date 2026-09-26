/* Trace: physically route a request, with honest local consequences.
   A deterministic illustration; never a live model, SQL connection or tool call. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const host = $('trace'), board = $('traceBoard'), cast = $('traceCast');
  const renderer = new TraceRenderer(host);
  const actor = new PoseActor(cast, { ground: .89, charHeight: .19 });
  const speech = new WorldEngine.Bubble($('traceSpeech'));
  const log = [], selected = new Set(), connected = new Set();
  let epoch = 0, sceneAbort = new AbortController(), stage = '', active = true, dialogue = false;
  let hold = null, dragging = null, zones = [], lastTime = 0, frame = 0;
  const question = 'Which sites had the most open incidents last month?';
  const workplace = 'Prepare the Northgate release follow-up.';
  const period = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
  const listen = (node, name, fn, opts = {}) => node.addEventListener(name, fn, { ...opts, signal: sceneAbort.signal });
  const say = text => { $('feedback').textContent = text; };
  const record = (heading, text) => { log.push({ heading, text }); $('traceCount').textContent = String(log.length); };
  const button = (text, cls, fn) => { const b = el('button', cls, text); b.type = 'button'; if (fn) listen(b, 'click', fn); return b; };
  const art = (name, cls = '') => { const im = el('img', cls); im.alt = ''; im.draggable = false; TraceRenderer.asset('./assets/worlds/icon-' + name + '.webp', 320).then(url => { if (url) im.src = url; }); return im; };

  /* One floor line for the whole scene, and the board stops above his head rather than
     landing on top of him. He is a narrator standing beside the working surface, so the
     room he needs is subtracted first and whatever is left is the board. */
  function layout() {
    const r = host.getBoundingClientRect(), b = $('brief').getBoundingClientRect(), d = $('dock').getBoundingClientRect();
    const top = b.bottom - r.top + 12;
    const floor = d.top - r.top - 10;
    const person = Math.round(Math.min(148, Math.max(96, (floor - top) * .34), r.width * .38));
    const room = floor - top - person - 10;
    board.style.top = top + 'px'; board.style.height = Math.max(180, room) + 'px';
    host.classList.toggle('compact-trace', room < 330);
    actor.ground = floor / Math.max(1, r.height);
    actor.charHeight = person / Math.max(1, r.height);
    actor.place(r.width * .8);
  }
  new ResizeObserver(layout).observe($('brief'));
  new ResizeObserver(layout).observe(host);
  function enter(key, background, chapter, title, intro) {
    epoch++; sceneAbort.abort(); sceneAbort = new AbortController();
    endDrag(); hold = null; zones = [];
    speech.clear(); actor.stop(); dialogue = false;
    board.inert = false; board.replaceChildren(); board.className = 'trace-scene scene-enter scene-' + key;
    stage = key; host.dataset.stage = key; renderer.set(background);
    $('chapter').textContent = chapter; $('title').textContent = title; $('intro').textContent = intro;
    say(''); actor.set('talk-01'); requestAnimationFrame(layout);
    return epoch;
  }
  async function guide(text, tag, next, cta = 'Try it') {
    const ticket = epoch;
    dialogue = true; board.inert = true;
    actor.stop(); actor.set('talk-02');
    // Point the tail at where he actually is, not at a fixed fraction of the width.
    const acknowledged = await speech.say(text, tag, { anchor: () => ({ x: actor.x.x, headY: actor.headY }), cta });
    if (ticket !== epoch || !acknowledged) return;
    dialogue = false; board.inert = false; actor.set('talk-01');
    if (next) next(); else board.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
  }
  function plaque(kicker, text) { const p = el('div', 'trace-plaque'); p.append(el('small', '', kicker), el('strong', '', text)); return p; }

  /* Track the finger directly. A released packet eases back to its original position;
     measured origins and capture cleanup also handle rotation and cancelled pointers. */
  function packet(text, cls = '') {
    const p = button('', 'trace-packet ' + cls);
    p.append(art('analyze'), el('strong', '', text), el('span', '', 'Drag me · or tap a destination'));
    p.setAttribute('aria-label', text + '. Drag to a destination, or use its named button.');
    listen(p, 'pointerdown', e => {
      if (e.button !== 0 || dialogue || !active) return;
      e.preventDefault();
      dragging = { node: p, id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, lastZone: null };
      p.setPointerCapture(e.pointerId); p.classList.add('is-dragging');
    });
    listen(p, 'pointermove', e => {
      if (!dragging || dragging.node !== p || dragging.id !== e.pointerId) return;
      const dx = e.clientX - dragging.sx, dy = e.clientY - dragging.sy;
      dragging.moved ||= Math.hypot(dx, dy) > 7;
      p.style.transform = `translate(${dx}px,${dy}px) scale(1.04)`;
      const z = hit(e.clientX, e.clientY);
      zones.forEach(v => v.node.classList.toggle('drag-over', v === z));
      if (z?.pickup && dragging.lastZone !== z) { z.run(); dragging.lastZone = z; }
      if (!z) dragging.lastZone = null;
    });
    listen(p, 'pointerup', e => {
      if (!dragging || dragging.id !== e.pointerId) return;
      const z = dragging.moved ? hit(e.clientX, e.clientY) : null;
      endDrag();
      if (z && !z.pickup) z.run();
      else if (!z) say('Choose a named destination. You can drag there or tap it.');
    });
    listen(p, 'pointercancel', endDrag);
    listen(p, 'lostpointercapture', () => { if (dragging?.node === p) endDrag(); });
    listen(p, 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zones[0]?.node.focus(); say('Use Tab to choose a destination, then Enter.'); } });
    return p;
  }
  function endDrag() {
    if (!dragging) return;
    const { node, id } = dragging; dragging = null;
    node.classList.remove('is-dragging'); node.style.transform = '';
    if (node.hasPointerCapture(id)) node.releasePointerCapture(id);
    zones.forEach(z => z.node.classList.remove('drag-over'));
  }
  function hit(x, y) { return zones.find(z => { if (z.node.disabled) return false; const r = z.node.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }); }
  function destination(title, sub, image, run, { pickup = false, cls = '' } = {}) {
    const b = button('', 'trace-destination ' + cls, () => { if (!dialogue) run(); });
    if (image) b.append(art(image));
    b.append(el('strong', '', title), el('span', '', sub));
    zones.push({ node: b, run, pickup }); return b;
  }
  function holdControl(parent, title, sub, fn) {
    const b = button('', 'trace-hold');
    b.append(el('strong', '', title), el('span', '', sub));
    const done = () => { if (b.disabled || dialogue) return; hold = null; b.disabled = true; b.style.setProperty('--held', '100%'); fn(); };
    listen(b, 'pointerdown', e => { if (e.button !== 0 || b.disabled || dialogue) return; e.preventDefault(); b.setPointerCapture(e.pointerId); hold = { node: b, elapsed: 0, done }; });
    const cancel = () => { if (hold?.node === b) { hold = null; b.style.setProperty('--held', '0%'); } };
    listen(b, 'pointerup', cancel); listen(b, 'pointercancel', cancel); listen(b, 'lostpointercapture', cancel);
    listen(b, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) done(); } });
    parent.append(b, button('Use tap instead', 'trace-tap-alternative', done)); return b;
  }

  function arrival() {
    enter('arrival', 'arrival', '01 / A REQUEST ARRIVES', 'Useful AI starts here.', 'Carry one question through a system I built.');
    const intake = destination('Attach my identity', 'So every later step knows who is asking.', 'act', () => {
      record('Identity', 'Attached the fictional identity Priya, a North company manager. No sign-in or account access occurred.');
      guide('I carry your identity with the request. That is how the answer stays within your access.', 'ENTRA ID · REQUEST CONTEXT', fork, 'Choose a project');
    }, { cls: 'trace-intake' });
    board.append(intake, packet('Your question'));
    guide('Move the question into the gate. I will show you what each part of the system adds.', 'DRAG TO GUIDE · TAP ALSO WORKS');
  }
  function fork() {
    enter('fork', 'fork', '02 / PICK A PURPOSE', 'An answer. Or an action.', 'These two assistants do different jobs.');
    const choices = el('div', 'trace-gates');
    choices.append(destination('Analyse safety data', 'Safety Chat Agent · question → SQL → answer', 'analyze', () => {
      selected.clear(); record('Intent', 'Chose Safety Chat Agent to answer a question from governed data.'); schema();
    }), destination('Get work done', 'Galaxy Assistant · context → review → action', 'act', () => {
      connected.clear(); record('Intent', 'Chose Galaxy Assistant to prepare a workplace follow-up.'); tools();
    }, { cls: 'galaxy' }));
    board.append(choices, packet('Choose my route'));
    say('Drag into either gate, or tap the project you want.');
  }
  const SHARDS = [
    { id: 'incidents', title: 'Incident reports', sub: 'Dates, site and status ID', weight: 180 },
    { id: 'sites', title: 'Site names', sub: 'Which location a report belongs to', weight: 95 },
    { id: 'status', title: 'Status meanings', sub: 'Which status ID means “open”', weight: 65 },
    { id: 'extras', title: 'Other tables', sub: 'People, inventory and unrelated notes', weight: 960 },
  ];
  function schema() {
    enter('schema', 'analyze', '03 / COLLECT THE RIGHT CONTEXT', 'Give the question its clues.', question);
    const field = el('div', 'trace-shards'), meter = el('div', 'trace-meter');
    meter.setAttribute('role', 'status');
    const update = () => {
      field.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(selected.has(SHARDS[i].id))));
      const n = SHARDS.filter(s => selected.has(s.id)).reduce((sum, s) => sum + s.weight, 0);
      meter.style.setProperty('--load', Math.min(100, n / 1300 * 100) + '%');
      meter.classList.toggle('heavy', selected.has('extras'));
      meter.replaceChildren(el('strong', '', selected.has('extras') ? 'Heavy prompt · more cost and waiting' : n ? 'Focused prompt · only selected context' : 'Empty prompt'), el('span', '', `${selected.size} selected · illustrative load, not a measured bill`));
    };
    SHARDS.forEach(s => {
      const choose = () => { if (selected.has(s.id)) { if (!dragging) selected.delete(s.id); } else selected.add(s.id); update(); };
      field.append(destination(s.title, s.sub, null, choose, { pickup: true, cls: 'trace-shard' }));
    });
    const forge = destination('Build the query', 'Drop here when you have enough clues.', 'data', () => {
      const missing = SHARDS.slice(0, 3).filter(s => !selected.has(s.id));
      if (missing.length) {
        record('Incomplete schema', 'Generation blocked: missing ' + missing.map(s => s.title).join(', ') + '.');
        say('Missing: ' + missing.map(s => s.title).join(', ') + '. Collect these before the query can work.');
        forge.classList.remove('needs-context'); void forge.offsetWidth; forge.classList.add('needs-context'); return;
      }
      record('Schema retrieval', 'Selected ' + SHARDS.filter(s => selected.has(s.id)).map(s => s.title).join(', ') + '. ' + (selected.has('extras') ? 'Extra tables increased illustrative prompt load without improving this answer.' : 'The three required schema fragments were enough.'));
      guide(selected.has('extras') ? 'This has the right clues, plus unrelated tables. The answer will be the same, but the prompt has more to process.' : 'You gave me the three clues this question needs. That keeps the prompt focused before I draft any SQL.', 'SCHEMA RAG · PROMPT ASSEMBLY', correction, 'Inspect the first draft');
    }, { cls: 'trace-forge' });
    board.append(field, meter, forge, packet('Collect my clues')); update();
    guide('Reports, site names and status meanings answer this question. Collect less—or add extra tables—and watch the trade-off.', 'SCHEMA RETRIEVAL · CONTEXT BUDGET');
  }
  function correction() {
    enter('correction', 'analyze', '04 / CHECK THE FIRST DRAFT', 'A confident answer can be wrong.', 'Pull out the bad comparison. Then hold to repair it.');
    const query = plaque('QUERY CHECK / ONE FAULT', 'The database stores status as a number.');
    const code = el('code', 'trace-query', 'WHERE StatusId = '), fault = packet('“Open”', 'trace-fault');
    fault.querySelector('span').textContent = 'Wrong type · drag this out'; fault.querySelector('img').remove();
    query.append(code, fault, el('p', '', 'Comparing that number with “Open” can fail conversion. Nothing has run.'));
    const bin = destination('Remove the fault', 'Move the pink comparison here.', null, () => {
      if (stage !== 'correction') return;
      record('Validation', 'Caught a numeric StatusId compared with the text Open. Query execution remained blocked.');
      fault.remove(); bin.remove(); zones = [];
      code.textContent = 'WHERE StatusId = [needs a valid ID]';
      query.querySelector('p').textContent = 'The correction gets the missing schema fact. It still has to pass validation.';
      const controls = el('div', 'trace-repair'); board.append(controls);
      holdControl(controls, 'Hold to repair', 'Feed the schema fact back · 1 second', () => {
        record('Correction', 'Replaced the invalid comparison with a lookup in IncidentStatus, then revalidated the local sample.');
        code.textContent = "WHERE StatusId = (SELECT Id FROM IncidentStatus WHERE Code = 'OPEN')";
        query.classList.add('validated');
        guide('I corrected the comparison and checked it again. A draft only moves on when it passes the gate.', 'VALIDATE → CORRECT → REVALIDATE', execution, 'Run with my permissions');
      });
      say('Fault removed. Hold to repair, or use the tap alternative.');
    }, { cls: 'trace-bin' });
    board.append(query, bin);
    guide('The model wrote text where a number belongs. I check that before trusting the query.', 'SQL VALIDATION · BOUNDED CORRECTION');
  }
  const ROWS = [
    { name: 'Northgate Depot', company: 'North', n: 14 }, { name: 'Harbour Yard', company: 'North', n: 9 },
    { name: 'Kiln Street', company: 'North', n: 6 }, { name: 'Ferry Lane', company: 'North', n: 3 },
    { name: 'South sample site A', company: 'South', n: 17 }, { name: 'South sample site B', company: 'South', n: 11 },
  ];
  function execution() {
    enter('execution', 'analyze', '05 / ENFORCE ACCESS', 'Your answer. Your access.', 'Priya can read North company data. Other companies stay private.');
    const rows = el('div', 'trace-rows');
    ROWS.forEach(r => { const line = el('div', 'trace-row'); line.dataset.company = r.company; line.append(el('span', '', r.company === 'North' ? r.name : 'Another company · private'), el('b', '', r.company === 'North' ? String(r.n) : 'Locked')); rows.append(line); });
    const gate = destination('Run through my access filter', 'North company only · checked at the database', 'act', () => {
      gate.disabled = true;
      rows.querySelectorAll('[data-company="South"]').forEach(n => { n.classList.add('redacted'); n.replaceChildren(el('span', '', 'Withheld by the database'), el('b', '', '×')); });
      rows.querySelectorAll('[data-company="North"]').forEach(n => n.classList.add('returned'));
      record('Scoped execution', 'Applied the fictional North company scope before returning results. Four sites returned; two other-company sites stayed private. Period: ' + period + '.');
      guide('Four sites belong to your company. The other two stay in the database. Asking AI never gives you extra access.', 'SESSION CONTEXT · ROW-LEVEL SECURITY', result, 'Read the answer');
    }, { cls: 'trace-filter' });
    board.append(rows, gate, packet('My checked query'));
    say('The counts are sample data for ' + period + '.');
  }
  function result() {
    enter('result', 'answer', '06 / AN ANSWER WITH EVIDENCE', 'Northgate needs attention.', '14 open incidents · the highest count in your company.');
    const chart = plaque('FICTIONAL DATA / ' + period.toUpperCase(), 'Open incidents by site');
    ROWS.filter(r => r.company === 'North').forEach(r => {
      const line = el('div', 'trace-chart-row'); line.append(el('span', '', r.name));
      const bar = el('i'); bar.style.setProperty('--bar', r.n / 14 * 100 + '%'); line.append(bar, el('b', '', String(r.n))); chart.append(line);
    });
    chart.append(button('Inspect how we got here', 'trace-inline-action', openLog), button('Explore Galaxy Assistant', 'trace-inline-action', () => { connected.clear(); tools(); }));
    board.append(chart);
    record('Answer', 'Returned the four permitted sites as a chart using fictional counts for the previous calendar month.');
    guide('You chose the context, caught the fault and kept access intact. Now the result has a path you can inspect.', 'NL-TO-SQL · VISUALISATION · TELEMETRY', null, 'Explore the result');
  }
  const TOOLS = [
    { id: 'teams', name: 'Teams', what: 'Team discussion', note: 'Alex asks for the Northgate release checklist.', via: 'Microsoft Graph' },
    { id: 'outlook', name: 'Outlook', what: 'Email context', note: 'A review email asks for sign-off before release.', via: 'Microsoft Graph' },
    { id: 'calendar', name: 'Calendar', what: 'Meeting context', note: 'Release review is booked for Tuesday at 10:00.', via: 'Microsoft Graph' },
    { id: 'devops', name: 'DevOps', what: 'Work items', note: 'Work item DEMO-42 is waiting for QA approval.', via: 'Azure DevOps connector' },
  ];
  function tools() {
    enter('tools', 'galaxy', '03 / CONNECT THE CONTEXT', 'Bring the right tools together.', workplace);
    const grid = el('div', 'trace-tool-grid');
    TOOLS.forEach(t => {
      const b = destination(t.name, t.what, t.id, () => {
        if (connected.has(t.id)) { if (!dragging) connected.delete(t.id); } else connected.add(t.id);
        grid.querySelectorAll('button').forEach((n, i) => n.setAttribute('aria-pressed', String(connected.has(TOOLS[i].id))));
        say(connected.size ? 'Connected: ' + TOOLS.filter(t => connected.has(t.id)).map(t => t.name).join(', ') + '. Only those sources enter the preview.' : 'Choose at least one context source.');
      }, { pickup: true }); b.setAttribute('aria-pressed', String(connected.has(t.id))); grid.append(b);
    });
    board.append(grid, destination('Prepare a follow-up', 'Drop here to review the exact draft.', 'act', () => {
      if (!connected.size) { say('Connect at least one source before preparing the follow-up.'); return; }
      record('Context', 'Read fictional context from ' + TOOLS.filter(t => connected.has(t.id)).map(t => `${t.name} (${t.via})`).join(', ') + '.'); preview();
    }, { cls: 'trace-forge' }), packet('Connect my sources'));
    guide('Connect the tools this task needs. Teams, mail and calendar use Graph; DevOps has its own connector.', 'DELEGATED GRAPH ACCESS · DEVOPS TOOLS');
  }
  function preview() {
    enter('preview', 'galaxy', '04 / YOU APPROVE THE ACTION', 'A draft before an action.', 'Review every source. Nothing leaves this page.');
    const box = plaque('LOCAL PREVIEW / FOLLOW-UP EMAIL', 'To: Alex · fictional release owner');
    const lab = el('label', 'trace-subject'); lab.append(el('span', '', 'Subject'));
    const input = el('input'); input.type = 'text'; input.maxLength = 100; input.value = 'Northgate release follow-up'; lab.append(input); box.append(lab);
    const sourceList = TOOLS.filter(t => connected.has(t.id)), pages = el('div', 'trace-source-preview');
    const selectLab = el('label', 'trace-subject'); selectLab.append(el('span', '', 'Read the draft, source by source'));
    const select = el('select');
    sourceList.forEach((t, i) => { const op = el('option', '', t.name + ' · part ' + (i + 1) + ' of ' + sourceList.length); op.value = t.id; select.append(op); });
    selectLab.append(select); pages.append(selectLab);
    const paragraph = el('p', 'trace-source-text', sourceList[0].note); pages.append(paragraph);
    listen(select, 'change', () => { paragraph.textContent = sourceList.find(t => t.id === select.value).note; });
    box.append(pages, el('p', 'trace-preview-note', 'Includes all ' + sourceList.length + ' selected source' + (sourceList.length > 1 ? 's' : '') + '. No unselected sources or attachments.'));
    const controls = el('div', 'trace-approval');
    holdControl(controls, 'Hold to approve this draft', 'Record a simulated send · 1 second', () => {
      const subject = input.value.trim() || 'Northgate release follow-up';
      record('Approved local action', 'Approved a simulated follow-up to Alex. Subject: ' + subject + '. Body: ' + sourceList.map(t => `[${t.name}] ${t.note}`).join(' ') + '. No network request or real message sent.'); receipt(false);
    });
    controls.append(button('Discard draft', 'trace-discard', () => { record('Discarded', 'Discarded the proposed follow-up. No action or message sent.'); receipt(true); }));
    board.append(box, controls);
    guide('This draft uses only the sources you connected. Read it, edit the subject, and decide whether it should go ahead.', 'TOOL PREVIEW · EXPLICIT APPROVAL', null, 'Review the draft');
  }
  function receipt(discarded) {
    enter('receipt', 'answer', '05 / THE ACTION IS ACCOUNTABLE', discarded ? 'Your choice. No action.' : 'Approved, and recorded.', discarded ? 'You discarded the draft.' : 'The simulated follow-up is now in your trace.');
    const card = plaque(discarded ? 'DRAFT DISCARDED' : 'LOCAL SIMULATION COMPLETE', 'No real message was sent.');
    card.append(el('p', '', discarded ? 'The assistant proposed the action. You kept control.' : 'The trace keeps the exact subject, selected sources and body you approved.'), button('Open the action record', 'trace-inline-action', openLog), button('Explore Safety Chat Agent', 'trace-inline-action', () => { selected.clear(); schema(); }));
    board.append(card);
    guide(discarded ? 'The useful part is your choice. A proposed action can stop here.' : 'That is the difference between answering and acting: context, a clear preview, your approval, and a record.', 'TOOL ORCHESTRATION · ACTION TRACE', null, 'Inspect the record');
  }

  /* Real implementation ideas sit a layer deeper. No invented production timings,
     universal guarantees or model calls are implied by these local interactions. */
  const TOPICS = [
    ['How a question chooses its route', 'Intent and orchestration', 'I separate requests for analysis from requests that need workplace tools.', 'Each route gets the context and checks its job needs.', 'Safety Chat Agent: intent → schema / KPI retrieval → SQL. Galaxy: intent → tool planning → scoped context → action. This demo lets you choose the route.'],
    ['Why retrieve schema instead of sending it all', 'Schema RAG', 'I retrieve relevant tables, columns and relationships for the question.', 'Missing schema can break a query. Unrelated schema uses more prompt space without helping the answer.', 'Retrieval → prompt assembly → generation. The meter is an illustrative context budget; it is not measured tokens, latency or pricing.'],
    ['Where business definitions come from', 'KPI catalogue', 'A business measure needs a shared definition, not a fresh guess each time.', 'Definitions keep “open incidents” and other measures consistent with the business.', 'The analysis pipeline can retrieve KPI definitions alongside schema. This fictional example fixes one status definition and the previous calendar month.'],
    ['Why generated SQL is checked', 'Validation and bounded correction', 'I validate the draft, return the specific fault for correction, and check again before execution.', 'A first draft is not an answer. A failed correction should remain blocked.', 'Schema and SQL checks → bounded corrective pass → revalidation. The local fault uses a numeric StatusId incorrectly compared with text.'],
    ['Why AI does not get extra data access', 'RLS-aware execution', 'The SQL runs with the caller’s database context, so the database applies that caller’s row permissions.', 'The answer stays within the user’s authorised company and site scope.', 'Connection session context → SQL security predicates → permitted rows only. This sample uses a North/South company filter; it does not connect to SQL.'],
    ['How repeat questions can avoid repeat work', 'Semantic cache', 'A question with equivalent meaning may reuse a compatible earlier result.', 'Reuse can reduce model work when identity, permissions, data freshness and the question still match.', 'Semantic lookup is part of the pipeline. Cache compatibility and invalidation matter; this demo does not perform embedding search or claim production savings.'],
    ['How Teams, email and meetings connect', 'Microsoft Graph', 'Galaxy brings workplace context together through tools with appropriate access.', 'A follow-up can be grounded in the messages and meetings relevant to the request.', 'Entra ID and delegated Graph access for Teams, Outlook and Calendar. Azure DevOps uses its own connector/API; it is not a Graph service.'],
    ['Why preview an action', 'Tool orchestration and approval', 'I make the proposed destination and content clear before an action is approved.', 'You can change or discard the draft before the system acts.', 'Tool selection → context → proposal → explicit approval → action receipt. All sends here are simulated locally.'],
    ['Why keep a trace', 'Telemetry and visualisation', 'I keep useful checkpoints from the request path and turn results into something readable.', 'Inspect retrieval, validation and execution outcomes instead of accepting an unexplained number.', 'A trace describes observable system steps, not private model reasoning. This local log records your choices only.'],
  ];
  function buildTopics() {
    const select = $('topic');
    TOPICS.forEach(([title], i) => { const o = el('option', '', title); o.value = String(i); select.append(o); });
    const show = () => { const t = TOPICS[Number(select.value) || 0]; ['detailHeading', 'detailText', 'detailBenefit', 'detailTech'].forEach((id, i) => $(id).textContent = t[i + 1]); };
    select.onchange = show; show();
  }
  function openLog() {
    const select = $('logSelect'); select.replaceChildren();
    log.forEach((entry, i) => { const option = el('option', '', (i + 1) + ' · ' + entry.heading); option.value = String(i); select.append(option); });
    select.disabled = !log.length;
    const show = () => { const entry = log[Number(select.value) || 0]; $('logHeading').textContent = entry?.heading || 'Your journey starts with a question.'; $('logText').textContent = entry?.text || 'Route the question and your decisions will appear here.'; };
    select.value = String(Math.max(0, log.length - 1)); select.onchange = show; show(); $('traceLog').showModal();
  }
  $('explain').onclick = () => $('details').showModal(); $('journal').onclick = openLog;
  $('menuButton').onclick = () => { endDrag(); hold = null; $('options').showModal(); };
  $('restart').onclick = () => { $('options').close(); log.length = 0; $('traceCount').textContent = '0'; selected.clear(); connected.clear(); fork(); };
  const setGentle = on => { host.classList.toggle('gentle', on); renderer.gentle = on; $('motion').setAttribute('aria-pressed', String(on)); };
  $('motion').onclick = () => setGentle(!renderer.gentle); setGentle(renderer.gentle);
  document.querySelectorAll('dialog').forEach(d => { d.querySelector('.close').onclick = () => d.close(); d.addEventListener('close', () => { hold = null; }); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { endDrag(); hold = null; } lastTime = 0; });
  addEventListener('resize', () => { endDrag(); hold = null; layout(); });
  host.addEventListener('pointermove', e => { if (dragging || e.pointerType === 'touch') return; const r = host.getBoundingClientRect(); renderer.target = { x: (e.clientX - r.left) / r.width * 2 - 1, y: (e.clientY - r.top) / r.height * 2 - 1 }; });
  host.addEventListener('pointerleave', () => { renderer.target = { x: 0, y: 0 }; });
  function tick(t) {
    if (!active) return;
    const dt = Math.min(.035, lastTime ? (t - lastTime) / 1000 : 0); lastTime = t;
    if (!document.hidden && !document.querySelector('dialog[open]')) {
      actor.update(dt, host.clientWidth, host.clientHeight); speech.tick(dt);
      if (hold && !dialogue) { hold.elapsed += dt; hold.node.style.setProperty('--held', Math.min(100, hold.elapsed * 100) + '%'); if (hold.elapsed >= 1) hold.done(); }
    }
    frame = requestAnimationFrame(tick);
  }
  addEventListener('pagehide', () => { active = false; cancelAnimationFrame(frame); endDrag(); hold = null; });
  addEventListener('pageshow', e => { if (e.persisted) { active = true; lastTime = 0; frame = requestAnimationFrame(tick); } });
  buildTopics(); arrival(); frame = requestAnimationFrame(tick);
})();
