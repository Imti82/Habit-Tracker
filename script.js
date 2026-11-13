const BENCHMARK = 67, KEY = 'learning-tracker-daily-v1';
const TASKS = [
  { id: 1, title: 'Plan 1: 2-hour deep work block (morning, one dedicated spot)', time: 'Morning' },
  { id: 2, title: 'Plan 2: Phone away + no social media during focus time', time: 'All day' },
  { id: 3, title: 'Plan 3: Shutdown ritual – review to-dos, plan tomorrow, say "All done, Alhamdulillah"', time: 'Evening' }
];
const dateKey = d => d.toLocaleDateString('en-CA');
const todayKey = dateKey(new Date());
const nice = k => new Date(k + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

let data = { days: {} };
try { data = JSON.parse(localStorage.getItem(KEY)) || data; } catch (e) {}
const blank = () => ({ tasks: TASKS.map(t => ({ id: t.id, done: false, progress: 0 })), note: '' });
if (!data.days[todayKey]) data.days[todayKey] = blank();
const day = () => data.days[todayKey];
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };
const pct = k => { const d = data.days[k]; return d ? Math.round(d.tasks.filter(t => t.done).length / 3 * 100) : 0; };

document.getElementById('today').textContent = nice(todayKey);

function render() {
  const wrap = document.getElementById('tasks');
  wrap.innerHTML = '';
  TASKS.forEach(meta => {
    const t = day().tasks.find(x => x.id === meta.id);
    const row = document.createElement('div');
    row.className = 'flex items-start gap-3 p-4 rounded-xl border ' + (t.done ? 'bg-green-50 border-green-200' : 'bg-white border-stone-200');
    row.innerHTML = `
      <button data-id="${t.id}" class="check-btn mt-0.5 w-9 h-9 shrink-0 rounded-full border-2 flex items-center justify-center text-lg font-bold
        ${t.done ? 'bg-green-500 border-green-500 text-white' : 'border-stone-300 text-transparent hover:border-teal-500'}" aria-label="Toggle complete">✓</button>
      <div class="flex-1 min-w-0">
        <p class="font-medium ${t.done ? 'line-through text-stone-400' : ''}">${meta.title}</p>
        <p class="text-xs text-stone-500 mt-0.5">📅 ${todayKey} · ${meta.time}</p>
        <div class="flex items-center gap-3 mt-2">
          <input type="range" min="0" max="100" step="5" value="${t.progress}" data-id="${t.id}" class="slider flex-1 accent-teal-700" ${t.done ? 'disabled' : ''}>
          <span class="text-sm w-10 text-right text-stone-600">${t.progress}%</span>
        </div>
      </div>`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('.check-btn').forEach(b => b.onclick = () => {
    const t = day().tasks.find(x => x.id == b.dataset.id);
    t.done = !t.done; t.progress = t.done ? 100 : 0;
    save(); render();
  });
  wrap.querySelectorAll('.slider').forEach(s => s.oninput = () => {
    const t = day().tasks.find(x => x.id == s.dataset.id);
    t.progress = +s.value; s.nextElementSibling.textContent = t.progress + '%';
    save(); stats();
  });
  stats();
}

function msg(el, value, label) {
  const diff = value - BENCHMARK, gap = 100 - value;
  let text, cls;
  if (value >= 100) { text = `🏆 ${label} target reached!`; cls = 'text-green-700'; }
  else if (diff >= 0) { text = `✅ Above benchmark by ${diff}% — ${gap}% left to reach the target.`; cls = 'text-green-700'; }
  else { text = `⚠️ ${Math.abs(diff)}% below benchmark, ${gap}% from the target. You can do it!`; cls = 'text-orange-700'; }
  el.textContent = text; el.className = 'mt-2 text-sm font-medium ' + cls;
}

function stats() {
  const d = day(), done = d.tasks.filter(t => t.done).length;
  const completion = Math.round(done / 3 * 100);
  const average = Math.round(d.tasks.reduce((s, t) => s + t.progress, 0) / 3);

  // last 7 days
  const keys = [...Array(7)].map((_, i) => { const x = new Date(); x.setDate(x.getDate() - (6 - i)); return dateKey(x); });
  const weekAvg = Math.round(keys.reduce((s, k) => s + pct(k), 0) / 7);

  // streak: consecutive full days ending today (or yesterday if today isn't finished)
  let streak = 0, cur = new Date();
  if (pct(dateKey(cur)) < 100) cur.setDate(cur.getDate() - 1);
  while (pct(dateKey(cur)) === 100) { streak++; cur.setDate(cur.getDate() - 1); }

  document.getElementById('completion').textContent = completion;
  document.getElementById('doneCount').textContent = done;
  document.getElementById('average').textContent = average;
  document.getElementById('streak').textContent = streak;
  document.getElementById('bar').style.width = completion + '%';
  document.getElementById('weekAvg').textContent = weekAvg;
  document.getElementById('weekBar').style.width = weekAvg + '%';
  document.getElementById('success').classList.toggle('hidden', done !== 3);
  msg(document.getElementById('benchText'), completion, 'Daily');
  msg(document.getElementById('weekText'), weekAvg, 'Weekly');

  document.getElementById('history').innerHTML = keys.map(k => {
    const p = pct(k), full = p === 100, isToday = k === todayKey;
    const label = new Date(k + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' });
    return `<div class="rounded-lg py-2 border ${isToday ? 'border-teal-600' : 'border-stone-200'} ${full ? 'bg-green-100' : 'bg-stone-50'}">
      <div class="text-xs text-stone-500">${label}</div>
      <div class="text-lg font-bold ${full ? 'text-green-600' : 'text-stone-600'}">${full ? '✓' : p + '%'}</div></div>`;
  }).join('');
}

const note = document.getElementById('note');
note.value = day().note || '';
note.oninput = () => { day().note = note.value; save(); };
document.getElementById('reset').onclick = () => { data.days[todayKey] = blank(); note.value = ''; save(); render(); };
save(); render();
