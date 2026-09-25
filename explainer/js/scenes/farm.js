// Scenes set in the shared Great Nicobar farm: opening, the idea, the ecosystem,
// data, AI and the ending.
import { h, s, clamp, lerp, E, pr, stage, camPath, Label, motes, hash } from '../core.js';
import { FarmWorld, PAL, f } from '../world.js';
import { Person, POSES, HarvestBot, Drone, Rover, Bot } from '../rigs.js';
import { icon, drawIcon } from '../../../video/js/art.js';

// ───────── the five workers of today's farm ─────────
function Workers(world) {
  const P = {
    plant: Person({ outfit: 'farmerB', ...OUT('farmerB') }),
    weed: Person(OUT('farmerA')),
    spray: Person(OUT('farmerC')),
    pick: Person(OUT('farmerD')),
    carry: Person(OUT('farmerE')),
  };
  world.layers.field.append(P.plant.el, P.weed.el, P.spray.el);
  world.layers.trellis.append(P.pick.el);
  world.layers.path.append(P.carry.el);
  const mist = s('g');
  world.layers.field.append(mist);
  const mistDots = Array.from({ length: 26 }, () => { const e = s('circle', { r: 2.2, fill: '#ffffff' }); mist.append(e); return e; });
  const seedlings = s('g');
  world.layers.field.append(seedlings);
  seedlings.innerHTML = Array.from({ length: 7 }, (_, k) => `<g class="sd" transform="translate(${300 + k * 26} 806) scale(0.8)"><path d="M0 0 L0 -12" stroke="#3f8a47" stroke-width="3"/><ellipse cx="-5" cy="-13" rx="6" ry="3.5" fill="#58a957" transform="rotate(-30 -5 -13)"/><ellipse cx="5" cy="-15" rx="6" ry="3.5" fill="#4b9a4f" transform="rotate(30 5 -15)"/></g>`).join('');
  const sds = [...seedlings.querySelectorAll('.sd')];
  const anchors = { plant: [385, 812], weed: [640, 800], spray: [835, 792], pick: [1140, 896], carry: [0, 942] };
  function update(t, o = 1, fade = null) {
    const fo = (k) => (fade ? fade(k) : 1) * o;
    P.plant.pose(POSES.crouch(385, 812, t, { sc: 0.6, prop: 'seedling', o: fo('plant'), dir: -1 }));
    sds.forEach((e, k) => (e.style.opacity = t > 1 + k * 1.3 ? fo('plant') : 0));
    P.weed.pose(POSES.hoe(640, 800, t, { sc: 0.64, o: fo('weed') }));
    const sp = P.spray.pose(POSES.spray(835, 792, t, { sc: 0.62, o: fo('spray') }));
    const nz = [835 + (sp.hand[0] + 64) * 0.62, 792 + (sp.hand[1] + 27) * 0.62];
    mistDots.forEach((e, i) => {
      const ph = (t * 1.6 + i / mistDots.length) % 1;
      e.setAttribute('cx', f(nz[0] + ph * 40 + Math.sin(i * 7.1) * ph * 26));
      e.setAttribute('cy', f(nz[1] + ph * 30 + Math.cos(i * 3.3) * ph * 14));
      e.style.opacity = ((1 - ph) * 0.8 * fo('spray')).toFixed(3);
    });
    const reach = (Math.sin(t * 1.4) + 1) / 2;
    P.pick.pose({ x: 1140, y: 896, sc: 0.84, bend: -4, legs: [-4, 0, 6, 0], arms: [150 + reach * 12, -10, 160 - reach * 20, -8], tilt: -14, o: fo('pick'), dir: 1, prop: reach > 0.6 ? 'picked' : null });
    const cx = -120 + ((t * 70) % 1100);
    P.carry.pose(POSES.carry(cx, 942, t * 5.2, { sc: 0.92, o: fo('carry') }));
    anchors.carry = [cx, 942];
  }
  return { P, update, anchors };
}
const OUT = (k) => ({ ...{
  farmerA: { top: '#e9e2cf', topShade: '#cfc6b0', bottom: '#5c6b4a', bottomShade: '#4d5a3d', hat: 'straw', hair: 'short', skin: '#7a4a2e' },
  farmerB: { top: '#c65a4a', topShade: '#a84a3c', bottom: '#2f6f63', bottomShade: '#285f55', dress: 'saree', drape: '#2f6f63', hair: 'bun', hat: 'none', skin: '#8f5a3a' },
  farmerC: { top: '#5b86a8', topShade: '#4c7390', bottom: '#e8e2d2', bottomShade: '#d0c9b7', dress: 'lungi', hat: 'scarfM', hatCol: '#e8e2d2', hair: 'short', skin: '#6f4128' },
  farmerD: { top: '#e3b24a', topShade: '#c99a38', bottom: '#8a3f5a', bottomShade: '#733449', dress: 'saree', drape: '#8a3f5a', hair: 'bun', hat: 'scarf', hatCol: '#8a3f5a', skin: '#8a5638' },
  farmerE: { top: '#7d9a5a', topShade: '#6a844b', bottom: '#3d3a36', bottomShade: '#33302c', hat: 'straw', hair: 'short', skin: '#7d4b30' },
  team1: { top: '#5f8fa0', topShade: '#4e7a8a', bottom: '#2f3b48', bottomShade: '#27313c', hat: 'none', hair: 'bun', skin: '#8f5a3a', dress: 'trousers' },
  team2: { top: '#e9e2cf', topShade: '#cfc6b0', bottom: '#3d4a5a', bottomShade: '#333e4c', hat: 'none', hair: 'short', skin: '#6f4128' },
}[k] });

const birdsSvg = () => {
  const g = s('g');
  const bs = Array.from({ length: 5 }, (_, i) => { const e = s('path', { stroke: '#5a4636', 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }); g.append(e); return e; });
  return {
    el: g,
    run(t, x0, y0, vx = 60) {
      bs.forEach((e, i) => {
        const x = x0 + t * vx + (i % 3) * 36 + i * 18, y = y0 + Math.sin(i * 2.1) * 26 + Math.sin(t * 1.3 + i) * 4;
        const w = 8 + Math.sin(t * 9 + i * 1.7) * 5;
        e.setAttribute('d', `M${f(x)} ${f(y)} q8 ${f(-w)} 16 0 q8 ${f(-w)} 16 0`);
      });
    },
  };
};

// ───────────────────────── 1. opening: today's farm ─────────────────────────
export const open = {
  build(el, cue) {
    const st = stage(el);
    const world = FarmWorld({ id: 'open', sky: 'dawn', width: 2700, sunX: 2250, sunY: 470 });
    st.cam.append(world.el);
    const birds = birdsSvg();
    world.layers.sky.append(birds.el);
    const W = Workers(world);
    const labels = {
      plant: Label('Planting'), weed: Label('Weeding'), spray: Label('Spraying'), pick: Label('Picking'), carry: Label('Carrying'),
    };
    Object.values(labels).forEach((l) => st.ui.append(l.el));
    const o2 = cue.line('o2');
    const times = { plant: cue.word('o2', 'Planting'), weed: cue.word('o2', 'weeding'), spray: cue.word('o2', 'spraying'), pick: cue.word('o2', 'picking'), carry: cue.word('o2', 'carrying') };
    return { st, world, birds, W, labels, times, o1: cue.line('o1'), o2 };
  },
  update(t, c, cue) {
    const { world } = c;
    const sunY = lerp(560, 360, E.outCubic(clamp(t / 9)));
    world.sun.firstElementChild.setAttribute('cy', f(sunY));
    world.glowGrad.setAttribute('cy', f(sunY));
    world.clouds.setAttribute('transform', `translate(${f(t * 6)} 0)`);
    c.birds.run(t, 1500, 250, 55);
    const [x, y, z] = camPath([[0, 1960, 455, 1.3], [2.6, 1900, 470, 1.18], [c.o1.start + 3.2, 1010, 555, 1.0], [cue.dur + 1, 930, 560, 1.03]], t);
    c.st.camera.set(x, y, z);
    c.W.update(t + 20);
    const A = c.W.anchors;
    const pos = { plant: [385, 700], weed: [640, 680], spray: [835, 675], pick: [1150, 640], carry: [A.carry[0] + 10, 740] };
    for (const k in c.labels) c.labels[k].at(c.st.camera.toScreen(pos[k]), t, c.times[k], cue.dur - 0.2);
  },
};

// ───────────────────────── 2. the idea ─────────────────────────
const JOBS = [['seed', 'plant'], ['weed', 'weed'], ['spray', 'spray'], ['gripper', 'pick'], ['cart', 'carry']];
export const idea = {
  build(el, cue) {
    const st = stage(el);
    const world = FarmWorld({ id: 'idea', sky: 'day' });
    st.cam.append(world.el);
    const W = Workers(world);
    // supervisor + small team
    const sup = Person(OUT_SUP);
    const team = [Person(OUT('team1')), Person(OUT('team2'))];
    world.layers.path.append(sup.el, ...team.map((p) => p.el));
    // machines
    const bot = HarvestBot(), drone = Drone(), rover = Rover(), weeder = Bot('weeder');
    world.layers.trellis.append(bot.el);
    world.layers.sky.append(drone.el);
    world.layers.field.append(rover.el, weeder.el);
    const sprayG = s('g', { opacity: 0 });
    sprayG.innerHTML = `<path d="M-70 40 L70 40 L190 300 L-190 300 Z" fill="url(#spray)" opacity="0.8"/>`;
    world.layers.sky.insertBefore(sprayG, drone.el);
    // particles for dissolving workers
    const dust = s('g');
    world.layers.fx.append(dust);
    const dustEls = Array.from({ length: 90 }, () => { const e = s('rect', { width: 6, height: 6, rx: 1.5, fill: '#c8ff4d' }); dust.append(e); return e; });
    // job icons around the supervisor
    const ring = h('div', { class: 'layer' });
    const icons = JOBS.map(([ic]) => {
      const ico = icon(ic, 46, '#1f2b25', 1.8);
      const b = h('div', { style: { position: 'absolute', width: '84px', height: '84px', borderRadius: '50%', background: 'rgba(255,252,244,0.95)', boxShadow: '0 8px 24px rgba(60,40,20,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, ico);
      b._ico = ico; ring.append(b); return b;
    });
    const strike = h('div', { style: { position: 'absolute', height: '8px', borderRadius: '4px', background: '#e8543e', transformOrigin: '0 50%' } });
    ring.append(strike);
    // title
    const title = h('div', { style: { position: 'absolute', left: 0, right: 0, top: '120px', textAlign: 'center' } },
      h('div', { class: 'mono', style: { fontSize: '22px', color: '#fffaf0', textShadow: '0 2px 12px rgba(60,30,10,0.4)', marginBottom: '14px' } }, 'The Farmers of Great Nicobar'),
      h('div', { class: 'title', style: { fontSize: '150px' } }, h('span', { class: 'serif', style: { fontWeight: 400, marginRight: '18px' } }, 'The'), 'One-Man Farm'));
    const teamLabel = Label('A small team supervises');
    const machLabel = Label('Machines do the work');
    st.ui.append(ring, title, teamLabel.el, machLabel.el);
    const L = { i1: cue.line('i1'), i2: cue.line('i2'), i3: cue.line('i3') };
    const T = {
      person: cue.word('i2', 'one person'), job: cue.word('i2', 'every job'), dis: cue.word('i2', 'largely'),
      team: cue.word('i3', 'small team'), mach: cue.word('i3', 'Machines'),
    };
    return { st, world, W, sup, team, bot, drone, rover, weeder, sprayG, dustEls, icons, strike, title, teamLabel, machLabel, L, T };
  },
  update(t, c, cue) {
    const { world, T } = c;
    c.st.camera.set(...camPath([[0, 930, 560, 1.03], [cue.dur, 960, 545, 1.0]], t));
    world.clouds.setAttribute('transform', `translate(${f(t * 6)} 0)`);
    // workers fade out as labour "disappears"
    const order = ['carry', 'plant', 'weed', 'spray', 'pick'];
    const fade = (k) => 1 - pr(t, T.dis + order.indexOf(k) * 0.35, 0.7, E.inCubic);
    c.W.update(t + 36, 1, fade);
    // dissolve dust rising from workers
    const A = { plant: [385, 780], weed: [640, 760], spray: [835, 750], pick: [1140, 830], carry: [c.W.anchors.carry[0], 880] };
    c.dustEls.forEach((e, i) => {
      const k = order[i % 5];
      const t0 = T.dis + order.indexOf(k) * 0.35;
      const ph = (t - t0 - (i / 90) * 0.4) / 1.6;
      if (ph < 0 || ph > 1) { e.style.opacity = 0; return; }
      const [ax, ay] = A[k];
      e.setAttribute('x', f(ax + Math.sin(i * 12.9) * 30 + Math.sin(ph * 6 + i) * 10));
      e.setAttribute('y', f(ay - Math.abs(Math.cos(i * 4.1)) * 70 - ph * 160));
      e.style.opacity = ((1 - ph) * 0.9).toFixed(3);
    });
    // supervisor walks in, then team joins
    const walkIn = pr(t, 0.2, T.person - 0.4, E.inOutQuad);
    const sx = lerp(-80, 430, walkIn);
    c.sup.pose(walkIn < 1 ? POSES.walk(sx, 944, t * 6, { sc: 0.95 }) : POSES.stand(430, 944, { sc: 0.95, arms: [4, 12, -2, 14] }));
    if (t > T.team - 0.2) c.sup.pose(POSES.tablet(430, 944, t, { sc: 0.95 }));
    c.team.forEach((p, i) => {
      const st0 = T.team - 1.2 + i * 0.3;
      const k = pr(t, st0, 1.2, E.outQuad);
      const tx = [215, 665][i];
      const x = lerp(i ? 820 : -120, tx, k);
      p.pose(k < 1 ? POSES.walk(x, 952 - i * 6, t * 6 + i, { sc: 0.9, dir: i ? -1 : 1, o: clamp((t - st0) * 3) }) : POSES.tablet(tx, 952 - i * 6, t + i, { sc: 0.9, dir: i ? -1 : 1 }));
    });
    // job icons circle the supervisor, then get struck through
    const hc = c.st.camera.toScreen([430, 944 - 330]);
    c.icons.forEach((b, i) => {
      const a = (-160 + i * 35) * Math.PI / 180;
      const p = pr(t, T.person + i * 0.12, 0.45, E.outBack);
      const out = pr(t, T.dis - 0.3, 0.5, E.inCubic);
      const r = 175 + out * 60;
      b.style.left = (hc[0] + Math.cos(a) * r - 42).toFixed(1) + 'px';
      b.style.top = (hc[1] + 40 + Math.sin(a) * r * 0.9 - 42).toFixed(1) + 'px';
      b.style.transform = `scale(${(p * (1 - out * 0.4)).toFixed(3)})`;
      b.style.opacity = (Math.min(1, (t - T.person - i * 0.12) * 5) * (1 - out)).toFixed(3);
      drawIcon(b._ico, pr(t, T.person + i * 0.12, 0.6));
    });
    const sw = pr(t, T.job, 0.4, E.inOutCubic) * (1 - pr(t, T.dis - 0.3, 0.5));
    Object.assign(c.strike.style, { left: (hc[0] - 230) + 'px', top: (hc[1] - 90) + 'px', width: '460px', transform: `rotate(18deg) scaleX(${sw.toFixed(3)})`, opacity: sw > 0 ? 1 : 0 });
    // title
    const tp = pr(t, c.L.i1.start + 0.9, 0.9, E.outCubic), tq = pr(t, c.L.i2.start + 0.6, 0.6, E.inCubic);
    c.title.style.opacity = (tp * (1 - tq)).toFixed(3);
    c.title.style.transform = `translateY(${((1 - tp) * 30 - tq * 20).toFixed(1)}px) scale(${(0.96 + 0.04 * tp).toFixed(3)})`;
    // machines arrive on "Machines"
    const m = (d) => pr(t, T.mach + d, 0.9, E.outBack);
    const mb = m(0);
    c.bot.el.style.display = t > T.mach - 0.3 ? '' : 'none';
    c.bot.pose({ x: lerp(2150, 1040, E.outCubic(clamp((t - T.mach + 0.3) / 1.2))), y: 884, target: [1180 + Math.sin(t * 1.5) * 12, 640], open: 0.6, roll: -t * 200, crate: 1 });
    const md = pr(t, T.mach + 0.15, 1.3, E.outCubic);
    c.drone.el.style.display = md > 0 ? '' : 'none';
    c.drone.pose({ x: lerp(2100, 960, md), y: lerp(120, 292, md) + Math.sin(t * 2) * 6, tilt: (1 - md) * -12, t });
    c.sprayG.setAttribute('transform', `translate(960 ${f(292 + Math.sin(t * 2) * 6)})`);
    c.sprayG.style.opacity = pr(t, T.mach + 1.3, 0.6) * 0.9;
    const mr = pr(t, T.mach + 0.3, 1.2, E.outCubic);
    c.rover.el.style.display = mr > 0 ? '' : 'none';
    c.rover.pose({ x: lerp(-200, 660, mr), y: 700, sc: 0.46, roll: t * 300 });
    const mw = pr(t, T.mach + 0.45, 1.2, E.outCubic);
    c.weeder.el.style.display = mw > 0 ? '' : 'none';
    c.weeder.pose({ x: lerp(-200, 300, mw) + (mw >= 1 ? Math.sin(t) * 20 : 0), y: 790, sc: 0.5, roll: t * 300, t });
    c.teamLabel.at(c.st.camera.toScreen([430, 560]), t, T.team, cue.dur - 0.3);
    c.machLabel.at(c.st.camera.toScreen([1180, 560]), t, T.mach + 0.6, cue.dur - 0.3);
    void mb;
  },
};
const OUT_SUP = { top: '#dc9e30', topShade: '#c4861f', bottom: '#34495e', bottomShade: '#2c3b4c', hat: 'cap', hatCol: '#2f6f63', hair: 'short', skin: '#8a5638' };

// ───────── the machine fleet working the farm ─────────
function Fleet(world, { drone = true } = {}) {
  const F = {
    bot: HarvestBot(), rover: Rover(), weeder: Bot('weeder'), pruner: Bot('pruner'), trainer: Bot('trainer'),
    inspector: Bot('inspector'), cart: Bot('cart'), drone: drone ? Drone() : null,
  };
  world.layers.field.append(F.inspector.el, F.weeder.el, F.rover.el);
  world.layers.trellis.append(F.pruner.el, F.trainer.el, F.bot.el);
  world.layers.path.append(F.cart.el);
  if (F.drone) world.layers.sky.append(F.drone.el);
  const pos = {};
  function update(t, o = {}) {
    const vis = (k) => (o.show ? o.show(k) : 1);
    const wx = 330 + ((t * 26) % 420);
    F.weeder.pose({ x: wx, y: 792, sc: 0.5, roll: t * 280, t, o: vis('weeder') }); pos.weeder = [wx, 792];
    F.inspector.pose({ x: 760 + Math.sin(t * 0.4) * 60, y: 752, sc: 0.46, roll: t * 80, t, o: vis('inspector') }); pos.inspector = [760 + Math.sin(t * 0.4) * 60, 752];
    F.rover.pose({ x: 560 + Math.sin(t * 0.3) * 120, y: 712, sc: 0.4, roll: t * 120 }); F.rover.el.style.opacity = vis('rover'); pos.rover = [560 + Math.sin(t * 0.3) * 120, 712];
    F.pruner.pose({ x: 975, y: 888, sc: 0.6, t, o: vis('pruner') }); pos.pruner = [975, 888];
    F.trainer.pose({ x: 1590, y: 888, sc: 0.6, t, o: vis('trainer') }); pos.trainer = [1590, 888];
    const reach = (Math.sin(t * 0.9) + 1) / 2;
    const k = F.bot.pose({ x: 1270, y: 884, target: [1365 + reach * 60, 640 + reach * 30], open: 0.4 + reach * 0.4, crate: 2, roll: 0 }); pos.bot = [1270, 884];
    F.bot.el.style.opacity = vis('bot');
    const cx = -150 + ((t * 80) % 2300);
    F.cart.pose({ x: cx, y: 962, sc: 0.8, roll: t * 400, o: vis('cart') }); pos.cart = [cx, 962];
    if (F.drone) {
      const dxp = 700 + Math.sin(t * 0.35) * 380;
      F.drone.pose({ x: dxp, y: 250 + Math.sin(t * 1.7) * 10, t, tilt: Math.cos(t * 0.35) * 4 }); pos.drone = [dxp, 250];
      F.drone.el.style.opacity = vis('drone');
    }
    pos.lens = k.lens;
    return pos;
  }
  return { F, update, pos };
}

// ───────────────────────── 3. ecosystem of specialised machines ─────────────────────────
export const eco = {
  build(el, cue) {
    const st = stage(el);
    const world = FarmWorld({ id: 'eco', sky: 'noon', sunX: 1500, sunY: 180 });
    st.cam.append(world.el);
    const fleet = Fleet(world);
    const net = s('g', { opacity: 0 });
    world.layers.fx.append(net);
    const links = Array.from({ length: 7 }, () => { const e = s('line', { stroke: '#c8ff4d', 'stroke-width': 3, 'stroke-dasharray': '8 10' }); net.append(e); return e; });
    const hub = s('g', {});
    hub.innerHTML = `<circle r="40" fill="url(#softGlow)"/><circle r="16" fill="#c8ff4d"/>`;
    net.append(hub);
    const L = {
      weeder: Label('Weeding'), pruner: Label('Pruning'), trainer: Label('Training vines'), inspector: Label('Inspecting plants'), cart: Label('Moving produce'),
    };
    Object.values(L).forEach((l) => st.ui.append(l.el));
    const eco = Label('An ecosystem of specialised machines', { cls: 'big' });
    st.ui.append(eco.el);
    const T = {
      weeder: cue.word('e1', 'Weeding'), pruner: cue.word('e1', 'pruning'), trainer: cue.word('e1', 'training'), inspector: cue.word('e1', 'inspecting'),
      cart: cue.word('e1', 'moving'), eco: cue.word('e1', 'ecosystem'),
    };
    return { st, world, fleet, net, links, hub, L, eco, T };
  },
  update(t, c, cue) {
    const { T } = c;
    c.st.camera.set(...camPath([[-1, 960, 560, 1.06], [cue.dur, 960, 540, 1.0]], t));
    c.world.clouds.setAttribute('transform', `translate(${f(t * 6)} 0)`);
    const order = ['weeder', 'pruner', 'trainer', 'inspector', 'cart'];
    const pos = c.fleet.update(t + 5, { show: (k) => (order.includes(k) ? pr(t, T[k] - 0.4, 0.5) : 1) });
    const cam = c.st.camera;
    const lab = { weeder: [pos.weeder[0], 740], pruner: [975, 720], trainer: [1590, 690], inspector: [pos.inspector[0], 620], cart: [pos.cart[0], 870] };
    for (const k of order) c.L[k].at(cam.toScreen(lab[k]), t, T[k], T.eco - 0.2);
    // network links at "ecosystem"
    const hubP = [960, 470];
    c.hub.setAttribute('transform', `translate(${hubP[0]} ${hubP[1]})`);
    const pts = [pos.weeder, pos.inspector, pos.rover, [1000, 780], [1560, 780], [1250, 760], pos.drone];
    c.links.forEach((ln, i) => {
      const p = pts[i];
      ln.setAttribute('x1', hubP[0]); ln.setAttribute('y1', hubP[1]); ln.setAttribute('x2', f(p[0])); ln.setAttribute('y2', f(p[1] - 40));
      ln.setAttribute('stroke-dashoffset', f(-t * 40));
    });
    c.net.style.opacity = pr(t, T.eco, 0.8);
    c.eco.at([960, 330], t, T.eco + 0.2, cue.dur);
  },
};

// memory "rings": grows by a ring per season
function MemoryDisc() {
  const g = s('g', { class: 'memory' });
  g.innerHTML = `<circle class="glow" r="170" fill="url(#softGlow)"/><circle class="core" r="92" fill="rgba(28,40,34,0.82)" stroke="#c8ff4d" stroke-width="3"/>`;
  const rings = Array.from({ length: 7 }, (_, k) => { const e = s('circle', { r: 20 + k * 11, fill: 'none', stroke: '#c8ff4d', 'stroke-width': 2.5 }); g.append(e); return e; });
  const label = s('text', { y: 8, 'text-anchor': 'middle', fill: '#fffaf0', 'font-family': 'Inter Tight', 'font-weight': 800, 'font-size': 34 });
  g.append(label);
  return {
    el: g,
    set({ x, y, sc = 1, rings: n = 0, text = '', glow = 0.6 }) {
      g.setAttribute('transform', `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
      rings.forEach((r, k) => (r.style.opacity = clamp(n - k).toFixed(3)));
      g.querySelector('.glow').style.opacity = glow;
      label.textContent = text;
    },
  };
}

// ───────────────────────── 4. data → memory ─────────────────────────
export const data = {
  build(el, cue) {
    const st = stage(el);
    const world = FarmWorld({ id: 'data', sky: 'day' });
    st.cam.append(world.el);
    const fleet = Fleet(world);
    const disc = MemoryDisc();
    world.layers.sky.append(disc.el);
    const streams = ['bot', 'drone', 'rover', 'inspector', 'drip', 'mast'].map((_, i) => { const m = motes(9, i + 1); world.layers.fx.append(m.el); return m; });
    // rain + season tint
    const rain = s('g', {});
    world.layers.fx.append(rain);
    const drops = Array.from({ length: 140 }, () => { const e = s('line', { stroke: 'rgba(220,235,255,0.7)', 'stroke-width': 2 }); rain.append(e); return e; });
    const tint = h('div', { class: 'layer', style: { background: '#3d4a5c', mixBlendMode: 'multiply', opacity: 0 } });
    const gold = h('div', { class: 'layer', style: { background: '#ffb040', mixBlendMode: 'soft-light', opacity: 0 } });
    st.ui.append(tint, gold);
    const measure = s('g', { opacity: 0 });
    measure.innerHTML = `<path d="M1470 640 h-18 M1470 744 h-18 M1461 640 V744" stroke="#fffaf0" stroke-width="3"/>`;
    world.layers.fx.append(measure);
    const pins = s('g', { opacity: 0 });
    pins.innerHTML = [[1040, 650], [1180, 700], [1480, 660], [1600, 640]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M0 0 C-12 -16 -12 -30 0 -34 C12 -30 12 -16 0 0 Z" fill="#e8543e"/><circle cy="-22" r="5" fill="#fff"/></g>`).join('');
    world.layers.fx.append(pins);
    const L = { data: Label('Every machine collects data'), fruit: Label('22 cm · ripe'), pest: Label('Pest map', { cls: 'pest' }), water: Label('Water logged'), mem: Label('Farm memory', { cls: 'big' }) };
    Object.values(L).forEach((l) => st.ui.append(l.el));
    const link = h('div', { class: 'card', style: { left: '560px', top: '64px', width: '800px', padding: '18px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, fontSize: '26px' } },
      h('span', {}, 'What was done'), h('span', { style: { flex: 1, height: '4px', margin: '0 22px', background: 'repeating-linear-gradient(90deg,#9fd400 0 12px,transparent 12px 22px)' } }), h('span', {}, 'What happened'));
    st.ui.append(link);
    const season = h('div', { class: 'mono', style: { position: 'absolute', right: '70px', top: '70px', fontSize: '22px', color: '#fffaf0', textShadow: '0 2px 10px rgba(0,0,0,0.4)' } });
    st.ui.append(season);
    const T = {
      data: cue.word('d1', 'collects data'), fruit: cue.word('d1', 'harvester'), pest: cue.word('d1', 'sprayer'), water: cue.word('d1', 'irrigation'),
      seasons: cue.line('d2').start, link: cue.word('d2', 'linking'),
    };
    return { st, world, fleet, disc, streams, drops, tint, gold, measure, pins, L, link, season, T };
  },
  update(t, c, cue) {
    const { T, world } = c;
    c.st.camera.set(...camPath([[-1, 960, 540, 1.0], [T.seasons, 960, 500, 0.98], [cue.dur, 960, 500, 0.96]], t));
    world.clouds.setAttribute('transform', `translate(${f(t * 8)} 0)`);
    const pos = c.fleet.update(t + 11);
    const discP = [960, 190];
    // seasons: monsoon → sun → harvest, repeating, each adds a ring
    const sp = Math.max(0, t - T.seasons);
    const SL = 1.5;
    const phase = (sp / SL) % 3, seasonN = Math.floor(sp / SL);
    const rainy = t > T.seasons ? clamp(1 - Math.abs(phase - 0.5) * 2.2) : 0;
    const harvestP = t > T.seasons ? clamp(1 - Math.abs(phase - 2.4) * 2.2) : 0;
    c.tint.style.opacity = (rainy * 0.35).toFixed(3);
    c.gold.style.opacity = (harvestP * 0.5).toFixed(3);
    c.drops.forEach((e, i) => {
      const x = (i * 137.5) % 1920 + ((t * 120) % 60), y = ((t * 900 + i * 71) % 1100) - 50;
      e.setAttribute('x1', f(x)); e.setAttribute('y1', f(y)); e.setAttribute('x2', f(x - 8)); e.setAttribute('y2', f(y + 26));
      e.style.opacity = rainy;
    });
    c.season.textContent = t > T.seasons ? `Season ${String(seasonN + 1).padStart(2, '0')} · ${['Monsoon', 'Dry', 'Harvest'][Math.floor(phase)]}` : '';
    c.season.style.opacity = pr(t, T.seasons, 0.4);
    const rings = pr(t, T.data, 1.2) * 1 + (t > T.seasons ? Math.min(6, sp / SL) : 0);
    c.disc.set({ x: discP[0], y: discP[1] + Math.sin(t) * 4, sc: 0.5 + 0.5 * pr(t, T.data - 0.2, 1, E.outBack), rings, glow: 0.4 + 0.3 * Math.sin(t * 2) ** 2 });
    c.disc.el.style.opacity = pr(t, T.data - 0.3, 0.6);
    // data streams from each source into the memory
    const src = [pos.lens, [pos.drone[0], pos.drone[1] + 20], [pos.rover[0], pos.rover[1] - 50], [pos.inspector[0], pos.inspector[1] - 110], [1290, 866], [1560, 380]];
    const on = [T.fruit, T.pest, T.pest, T.data, T.water, T.data];
    c.streams.forEach((m, i) => m.run(t, src[i], { on: pr(t, Math.min(on[i], T.data + 0.4 * i), 0.6), speed: 90, height: 400, target: discP }));
    c.measure.style.opacity = pr(t, T.fruit + 0.3, 0.4) * (1 - pr(t, T.pest + 0.5, 0.4));
    c.pins.style.opacity = pr(t, T.pest + 0.2, 0.4) * (1 - pr(t, T.seasons, 0.5));
    const cam = c.st.camera;
    c.L.data.at(cam.toScreen([960, 330]), t, T.data, T.fruit - 0.1);
    c.L.fruit.at(cam.toScreen([1470, 630]), t, T.fruit + 0.3, T.pest + 0.4);
    c.L.pest.at(cam.toScreen([1180, 600]), t, T.pest + 0.3, T.water + 0.4);
    c.L.water.at(cam.toScreen([1290, 840]), t, T.water + 0.4, T.seasons);
    c.L.mem.at(cam.toScreen([960, 330]), t, T.seasons + 0.6, cue.dur);
    const lp = pr(t, T.link, 0.6, E.outBack);
    c.link.style.opacity = clamp((t - T.link) * 4).toFixed(3);
    c.link.style.transform = `translateY(${f((1 - lp) * -30)}px)`;
  },
};

// ───────────────────────── 5. AI coordinates ─────────────────────────
export const ai = {
  build(el, cue) {
    const st = stage(el);
    const world = FarmWorld({ id: 'ai', sky: 'day' });
    st.cam.append(world.el);
    const fleet = Fleet(world);
    const sup = Person(OUT_SUP);
    world.layers.path.append(sup.el);
    const disc = MemoryDisc();
    world.layers.sky.append(disc.el);
    const net = s('g', {});
    world.layers.fx.append(net);
    const targets = [[380, 760], [760, 700], [1250, 760], [1560, 760], [560, 680], [700, 250], [430, 700], [1560, 400]];
    const links = targets.map(() => { const e = s('path', { stroke: '#c8ff4d', 'stroke-width': 2.5, fill: 'none', 'stroke-dasharray': '7 9' }); net.append(e); return e; });
    const struggle = s('g', {});
    struggle.innerHTML = `<ellipse cx="300" cy="782" rx="120" ry="26" fill="#f0a020" opacity="0.35"/><ellipse cx="300" cy="782" rx="80" ry="16" fill="#f0a020" opacity="0.35"/>`;
    world.layers.field.append(struggle);
    const L = {
      cuc: Label('Cucumber · trellis A'), okra: Label('Okra'), chilli: Label('Chilli'),
      struggle: Label('Plot B · low moisture', { cls: 'warn' }), harvest: Label('Harvest in 2 days'),
    };
    Object.values(L).forEach((l) => st.ui.append(l.el));
    const tasks = h('div', { class: 'card', style: { left: '70px', top: '70px', width: '430px', padding: '22px 26px' } },
      h('div', { class: 'mono', style: { fontSize: '14px', color: '#6a7a70', marginBottom: '10px' } }, 'Next actions · AI plan'),
      ...['Irrigate plot B', 'Harvest trellis A on Thursday', 'Inspect the chilli rows'].map((x, i) => h('div', { class: 'task', style: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px', fontWeight: 600, margin: '10px 0' } },
        h('b', { style: { width: '28px', height: '28px', borderRadius: '8px', background: '#eef7d8', color: '#46660c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' } }, String(i + 1)), x)));
    st.ui.append(tasks);
    const T = {
      coord: cue.word('a1', 'coordinate'), grow: cue.word('a1', 'what is growing'), strug: cue.word('a1', 'struggling'),
      harv: cue.word('a1', 'when to harvest'), next: cue.word('a1', 'what to do next'),
    };
    return { st, world, fleet, sup, disc, links, targets, struggle, L, tasks, T };
  },
  update(t, c, cue) {
    const { T } = c;
    c.st.camera.set(...camPath([[-1, 960, 500, 0.96], [cue.dur, 960, 520, 1.0]], t));
    c.world.clouds.setAttribute('transform', `translate(${f(t * 8)} 0)`);
    const pos = c.fleet.update(t + 30);
    c.sup.pose(POSES.tablet(160, 950, t, { sc: 0.9 }));
    const d = [960, 190];
    const on = pr(t, T.coord - 0.3, 0.8);
    c.disc.set({ x: d[0], y: d[1] + Math.sin(t) * 4, rings: 7, text: on > 0.5 ? 'AI' : '', glow: 0.5 + 0.5 * on });
    const tg = [pos.weeder, pos.inspector, [1250, 760], [1560, 760], pos.rover, pos.drone, [300, 770], [1560, 400]];
    c.links.forEach((ln, i) => {
      const p = tg[i];
      const k = pr(t, T.coord - 0.2 + i * 0.08, 0.7);
      const ex = lerp(d[0], p[0], k), ey = lerp(d[1], p[1] - 30, k);
      ln.setAttribute('d', `M${d[0]} ${d[1] + 60} Q${f((d[0] + ex) / 2)} ${f(d[1] + 20)} ${f(ex)} ${f(ey)}`);
      ln.setAttribute('stroke-dashoffset', f(-t * 40));
      ln.style.opacity = k > 0 ? 0.9 : 0;
    });
    c.struggle.style.opacity = t > T.strug ? 0.6 + 0.4 * Math.sin(t * 5) : 0;
    const cam = c.st.camera;
    c.L.cuc.at(cam.toScreen([1290, 590]), t, T.grow, cue.dur);
    c.L.okra.at(cam.toScreen([640, 650]), t, T.grow + 0.2, cue.dur);
    c.L.chilli.at(cam.toScreen([1760, 640]), t, T.grow + 0.4, cue.dur);
    c.L.struggle.at(cam.toScreen([300, 740]), t, T.strug, cue.dur);
    c.L.harvest.at(cam.toScreen([1440, 700]), t, T.harv, cue.dur);
    const tp = pr(t, T.next, 0.6, E.outBack);
    c.tasks.style.opacity = clamp((t - T.next) * 4).toFixed(3);
    c.tasks.style.transform = `translateX(${f((1 - tp) * -40)}px)`;
    [...c.tasks.querySelectorAll('.task')].forEach((e, i) => (e.style.opacity = pr(t, T.next + 0.25 + i * 0.25, 0.3).toFixed(3)));
  },
};

// ───────────────────────── 6. the end ─────────────────────────
export const end = {
  build(el, cue) {
    const st = stage(el);
    const world = FarmWorld({ id: 'end', sky: 'sunset', sunX: 1330, sunY: 430 });
    st.cam.append(world.el);
    const fleet = Fleet(world);
    const sup = Person(OUT_SUP);
    world.layers.path.append(sup.el);
    const disc = MemoryDisc();
    world.layers.sky.append(disc.el);
    const m = motes(14, 3);
    world.layers.fx.append(m.el);
    const birds = birdsSvg();
    world.layers.sky.append(birds.el);
    const L = { mach: Label('Machines do the work'), sens: Label('Sensors observe'), data: Label('Data remembers'), ai: Label('AI coordinates') };
    Object.values(L).forEach((l) => st.ui.append(l.el));
    const title = h('div', { style: { position: 'absolute', left: 0, right: 0, top: '96px', textAlign: 'center' } },
      h('div', { class: 'mono', style: { fontSize: '22px', color: '#fffaf0', textShadow: '0 2px 12px rgba(60,30,10,0.5)', marginBottom: '16px' } }, 'The Farmers of Great Nicobar'),
      h('div', { class: 'title', style: { fontSize: '160px' } }, h('span', { class: 'serif', style: { fontWeight: 400, marginRight: '20px' } }, 'The'), 'One-Man Farm'),
      h('div', { class: 'serif', style: { fontSize: '54px', color: '#fffaf0', marginTop: '18px', textShadow: '0 2px 16px rgba(60,30,10,0.5)' } }, 'A farm that keeps learning.'));
    st.ui.append(title);
    const T = {
      mach: cue.word('n1', 'Machines'), sens: cue.word('n1', 'Sensors'), data: cue.word('n1', 'Data'), ai: cue.word('n1', 'AI'),
      title: cue.word('n2', 'One-Man'), learn: cue.word('n2', 'keeps learning'),
    };
    return { st, world, fleet, sup, disc, m, birds, L, title, T };
  },
  update(t, c, cue) {
    const { T } = c;
    c.st.camera.set(...camPath([[-1, 960, 560, 1.06], [T.title, 960, 545, 1.0], [cue.dur, 960, 520, 0.95]], t));
    c.world.clouds.setAttribute('transform', `translate(${f(t * 6)} 0)`);
    c.birds.run(t, 200, 230, 70);
    const pos = c.fleet.update(t + 50);
    c.sup.pose(POSES.tablet(430, 944, t, { sc: 0.95 }));
    const d = [1560, 250];
    c.disc.set({ x: d[0], y: d[1] + Math.sin(t) * 4, sc: 0.55 * pr(t, T.ai - 0.2, 0.8, E.outBack), rings: 7, text: 'AI', glow: 0.8 });
    c.disc.el.style.opacity = pr(t, T.ai - 0.2, 0.5) * (1 - pr(t, T.title - 0.3, 0.6));
    c.m.run(t, [pos.bot[0] + 60, pos.bot[1] - 170], { on: pr(t, T.data, 0.5) * (1 - pr(t, T.title, 0.6)), speed: 80, height: 300, target: d });
    const cam = c.st.camera;
    const out = T.title - 0.4;
    c.L.mach.at(cam.toScreen([1250, 600]), t, T.mach, out);
    c.L.sens.at(cam.toScreen([1560, 350]), t, T.sens, out);
    c.L.data.at(cam.toScreen([1400, 440]), t, T.data, out);
    c.L.ai.at(cam.toScreen([1560, 160]), t, T.ai, out);
    const tp = pr(t, T.title - 0.2, 1.2, E.outCubic);
    c.title.style.opacity = tp.toFixed(3);
    c.title.style.transform = `translateY(${f((1 - tp) * 30)}px)`;
    c.title.lastElementChild.style.opacity = pr(t, T.learn, 0.8).toFixed(3);
  },
};
