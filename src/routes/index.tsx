import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  Mail,
  Cloud,
  Store,
  Settings as SettingsIcon,
  Camera,
  Music2,
  Compass,
  Wallet,
  Calendar,
  Sun,
  Wifi,
  BatteryFull,
  Signal,
  Lock,
  Search,
  Send,
  ChevronLeft,
  Download,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JagX OS — A new kind of mobile experience" },
      {
        name: "description",
        content:
          "JagX OS is a next-generation mobile & PC operating system with JagX Message, JagMail, JagCloud, and the JagStore — reimagined for humans.",
      },
      { property: "og:title", content: "JagX OS — A new kind of mobile experience" },
      {
        property: "og:description",
        content:
          "Meet JagX OS: JagX Message, JagMail, JagCloud and the JagStore, in one fluid new operating system.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/jagx-og.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "JagX OS" },
      {
        name: "twitter:description",
        content: "A new kind of mobile & PC operating system.",
      },
      { name: "twitter:image", content: "/jagx-og.jpg" },
    ],
  }),
  component: JagXOS,
});

// ---------- Types ----------
type AppId =
  | "message"
  | "mail"
  | "cloud"
  | "store"
  | "settings"
  | "camera"
  | "music"
  | "compass"
  | "wallet"
  | "calendar"
  | "weather";

interface AppDef {
  id: AppId;
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

const APPS: AppDef[] = [
  { id: "message", name: "JagX Message", Icon: MessageCircle, gradient: "from-fuchsia-500 to-violet-600" },
  { id: "mail", name: "JagMail", Icon: Mail, gradient: "from-cyan-400 to-sky-600" },
  { id: "cloud", name: "JagCloud", Icon: Cloud, gradient: "from-indigo-400 to-violet-500" },
  { id: "store", name: "JagStore", Icon: Store, gradient: "from-pink-500 to-rose-500" },
  { id: "camera", name: "Lens", Icon: Camera, gradient: "from-zinc-500 to-zinc-800" },
  { id: "music", name: "Pulse", Icon: Music2, gradient: "from-emerald-400 to-teal-600" },
  { id: "compass", name: "Compass", Icon: Compass, gradient: "from-amber-400 to-orange-600" },
  { id: "wallet", name: "Wallet", Icon: Wallet, gradient: "from-lime-400 to-green-600" },
  { id: "calendar", name: "Days", Icon: Calendar, gradient: "from-rose-400 to-red-600" },
  { id: "weather", name: "Skies", Icon: Sun, gradient: "from-yellow-400 to-amber-600" },
  { id: "settings", name: "Settings", Icon: SettingsIcon, gradient: "from-slate-400 to-slate-700" },
];

// ---------- Root ----------
// This component IS the operating system now — it renders edge-to-edge over the
// real device screen (no browser chrome, no marketing page around it). When this
// app is installed as the Android launcher, this is exactly what the user sees
// every time they press Home.
function JagXOS() {
  const [booted, setBooted] = useState(false);
  const [locked, setLocked] = useState(true);
  const [openApp, setOpenApp] = useState<AppId | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1100);
    return () => clearTimeout(t);
  }, []);

  // Android hardware/gesture back button: navigate *within* JagX OS instead of
  // backing out of the app. There's nowhere to "exit" to once this is the
  // launcher, so from the home screen the back button simply does nothing.
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("backButton", () => {
          if (openApp) {
            setOpenApp(null);
          } else if (!locked) {
            setLocked(true);
          }
          // else: already at the lock screen / home screen — nothing to go back to.
        }),
      )
      .then((handle) => {
        if (cancelled) handle.remove();
        else cleanup = () => handle.remove();
      })
      .catch(() => {
        // Not running inside the native Android shell (e.g. plain web preview) —
        // Capacitor isn't installed/available, so just ignore the back button.
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [openApp, locked]);

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-background font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,oklch(0.3_0.08_290/0.6),transparent_60%)]" />
      <StatusBar />
      <div
        className="absolute inset-0"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 2rem)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        {!booted ? (
          <BootScreen />
        ) : locked ? (
          <LockScreen onUnlock={() => setLocked(false)} />
        ) : openApp ? (
          <AppView appId={openApp} onBack={() => setOpenApp(null)} />
        ) : (
          <HomeScreen onOpen={setOpenApp} />
        )}
      </div>
      <HomeIndicator onTap={() => setOpenApp(null)} />
    </div>
  );
}

function StatusBar() {
  const [time, setTime] = useState(() => formatTime(new Date()));
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));

  useEffect(() => {
    const i = setInterval(() => setTime(formatTime(new Date())), 1000);
    return () => clearInterval(i);
  }, []);

  // Real battery level, when the browser/WebView exposes it.
  useEffect(() => {
    let battery: any;
    let update: (() => void) | undefined;
    let cancelled = false;
    const nav = navigator as any;
    if (!nav.getBattery) return;
    nav.getBattery().then((b: any) => {
      if (cancelled) return;
      battery = b;
      update = () => setBattery({ level: b.level, charging: b.charging });
      update();
      b.addEventListener("levelchange", update);
      b.addEventListener("chargingchange", update);
    });
    return () => {
      cancelled = true;
      if (battery && update) {
        battery.removeEventListener("levelchange", update);
        battery.removeEventListener("chargingchange", update);
      }
    };
  }, []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const batteryPct = battery ? Math.round(battery.level * 100) : null;

  return (
    <div
      className="absolute top-0 inset-x-0 h-8 z-30 flex items-center justify-between px-6 text-[11px] font-medium"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <span>{time}</span>
      <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-24 h-5 rounded-full bg-black/80 border border-white/5" />
      <div className="flex items-center gap-1.5 text-foreground/90">
        <Signal className={`w-3 h-3 ${online ? "" : "opacity-30"}`} />
        <Wifi className={`w-3 h-3 ${online ? "" : "opacity-30"}`} />
        <div className="flex items-center gap-1">
          {batteryPct !== null && <span className="text-[10px] tabular-nums">{batteryPct}%</span>}
          <BatteryFull className={`w-3.5 h-3.5 ${battery?.charging ? "text-emerald-400" : ""}`} />
        </div>
      </div>
    </div>
  );
}

function HomeIndicator({ onTap }: { onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      aria-label="Home"
      className="absolute bottom-0 inset-x-0 h-8 flex items-end justify-center pb-1.5 z-30"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.375rem)" }}
    >
      <div className="w-28 h-1 rounded-full bg-white/60" />
    </button>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ---------- Boot ----------
function BootScreen() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-[var(--jag-violet)]/40 blur-2xl" />
          <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--jag-violet)] to-[var(--jag-cyan)] grid place-items-center shadow-2xl">
            <span className="font-display font-bold text-background text-xl">Jx</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground tracking-widest">JAGX OS</span>
      </div>
    </div>
  );
}

// ---------- Lock ----------
function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const now = new Date();
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 pt-6 pb-14">
      <div className="text-center mt-6">
        <div className="text-[13px] text-foreground/80">
          {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <div className="font-display text-7xl font-light tracking-tight mt-1">
          {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>

      <div className="w-full space-y-2">
        <NotificationCard app="JagX Message" title="Aria" body="see you at 8 — bring the vibes ✨" />
        <NotificationCard app="JagMail" title="Weekly Digest" body="3 new signals from your network" />
      </div>

      <button
        onClick={onUnlock}
        className="group flex flex-col items-center gap-2 text-foreground/80"
      >
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-white/20 animate-[jag-pulse-ring_1.8s_ease-out_infinite]" />
          <span className="relative grid place-items-center w-12 h-12 rounded-full glass-strong">
            <Lock className="w-4 h-4" />
          </span>
        </div>
        <span className="text-[11px] tracking-widest text-muted-foreground">TAP TO UNLOCK</span>
      </button>
    </div>
  );
}

function NotificationCard({ app, title, body }: { app: string; title: string; body: string }) {
  return (
    <div className="glass rounded-2xl px-3.5 py-2.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
        <span>{app}</span>
        <span>now</span>
      </div>
      <div className="mt-0.5 text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground line-clamp-1">{body}</div>
    </div>
  );
}

// ---------- Home ----------
function HomeScreen({ onOpen }: { onOpen: (id: AppId) => void }) {
  const primary = APPS.filter((a) => ["message", "mail", "cloud", "store"].includes(a.id));
  const rest = APPS.filter((a) => !primary.includes(a));

  return (
    <div className="relative w-full h-full flex flex-col px-5 pt-2 pb-16 overflow-hidden">
      {/* Widget */}
      <WeatherWidget />

      <SearchPill />

      {/* Featured — the "Circle" — JagX's signature UI */}
      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 px-1">
          Your Circle
        </div>
        <div className="grid grid-cols-4 gap-3">
          {primary.map((a) => (
            <AppTile key={a.id} app={a} onOpen={() => onOpen(a.id)} big />
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 px-1">
          Everything else
        </div>
        <div className="grid grid-cols-4 gap-3">
          {rest.map((a) => (
            <AppTile key={a.id} app={a} onOpen={() => onOpen(a.id)} />
          ))}
        </div>
      </div>

      {/* Dock */}
      <div className="mt-auto">
        <div className="glass-strong rounded-3xl px-3 py-2.5 flex items-center justify-around">
          <DockButton app={APPS.find((a) => a.id === "message")!} onOpen={() => onOpen("message")} />
          <DockButton app={APPS.find((a) => a.id === "mail")!} onOpen={() => onOpen("mail")} />
          <DockButton app={APPS.find((a) => a.id === "cloud")!} onOpen={() => onOpen("cloud")} />
          <DockButton app={APPS.find((a) => a.id === "store")!} onOpen={() => onOpen("store")} />
        </div>
      </div>
    </div>
  );
}

function WeatherWidget() {
  return (
    <div className="glass rounded-3xl p-4 flex items-center justify-between">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Today</div>
        <div className="font-display text-2xl font-semibold mt-0.5">Good morning</div>
        <div className="text-xs text-muted-foreground mt-0.5">72° · Clear · 3 events</div>
      </div>
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 shadow-lg shadow-orange-500/40 grid place-items-center">
        <Sun className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}

function SearchPill() {
  return (
    <div className="mt-3 glass rounded-full px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground">
      <Search className="w-4 h-4" />
      <span>Ask JagX anything…</span>
    </div>
  );
}

function AppTile({
  app,
  onOpen,
  big,
}: {
  app: AppDef;
  onOpen: () => void;
  big?: boolean;
}) {
  const { Icon } = app;
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col items-center gap-1.5 focus:outline-none"
    >
      <span
        className={`relative ${big ? "w-14 h-14 rounded-2xl" : "w-12 h-12 rounded-2xl"} bg-gradient-to-br ${app.gradient} grid place-items-center shadow-lg shadow-black/40 transition-transform group-active:scale-90 group-hover:-translate-y-0.5`}
      >
        <Icon className={`${big ? "w-6 h-6" : "w-5 h-5"} text-white drop-shadow`} />
      </span>
      <span className="text-[10.5px] text-foreground/90 leading-tight">{app.name}</span>
    </button>
  );
}

function DockButton({ app, onOpen }: { app: AppDef; onOpen: () => void }) {
  const { Icon } = app;
  return (
    <button
      onClick={onOpen}
      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${app.gradient} grid place-items-center shadow-lg`}
    >
      <Icon className="w-5 h-5 text-white" />
    </button>
  );
}

// ---------- App View ----------
function AppView({ appId, onBack }: { appId: AppId; onBack: () => void }) {
  const app = APPS.find((a) => a.id === appId)!;
  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="px-5 pt-2 pb-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full glass-strong grid place-items-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-sm font-medium">{app.name}</div>
        <div className="w-9 h-9" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-16">
        {appId === "message" && <MessageApp />}
        {appId === "mail" && <MailApp />}
        {appId === "cloud" && <CloudApp />}
        {appId === "store" && <StoreApp />}
        {appId === "settings" && <GenericApp title="Settings" body="System preferences, JagCloud account, wallpaper, and privacy." />}
        {appId === "camera" && <GenericApp title="Lens" body="Point-and-shoot, film modes, and instant JagCloud sync." />}
        {appId === "music" && <GenericApp title="Pulse" body="Your library, curated stations, and lossless streams." />}
        {appId === "compass" && <GenericApp title="Compass" body="Maps reimagined — routes that learn your rhythm." />}
        {appId === "wallet" && <GenericApp title="Wallet" body="Cards, tickets, and JagPay in one place." />}
        {appId === "calendar" && <GenericApp title="Days" body="A calendar built around focus, not meetings." />}
        {appId === "weather" && <GenericApp title="Skies" body="Weather that feels human, not corporate." />}
      </div>
    </div>
  );
}

// ---------- Message ----------
interface Msg {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

function MessageApp() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "1", from: "them", text: "hey! welcome to JagX Message ✨", time: "9:41" },
    { id: "2", from: "them", text: "no phone number needed — just your JagCloud ID.", time: "9:41" },
    { id: "3", from: "me", text: "wait it's end-to-end?", time: "9:42" },
    { id: "4", from: "them", text: "always. and it works cross-device.", time: "9:42" },
  ]);
  const [draft, setDraft] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = () => {
    if (!draft.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "me", text: draft.trim(), time: now }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          from: "them",
          text: "got it — this thread is live in your JagCloud.",
          time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        },
      ]);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="glass rounded-2xl p-3 flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 grid place-items-center font-display font-semibold">A</div>
        <div>
          <div className="text-sm font-medium">Aria · JagX</div>
          <div className="text-[11px] text-muted-foreground">active now</div>
        </div>
      </div>
      <div ref={scrollerRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${
              m.from === "me"
                ? "ml-auto bg-gradient-to-br from-[var(--jag-violet)] to-[var(--jag-cyan)] text-background rounded-br-md"
                : "glass rounded-bl-md"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 glass rounded-full pl-4 pr-1.5 py-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message on JagX"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        <button
          onClick={send}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--jag-violet)] to-[var(--jag-cyan)] grid place-items-center"
        >
          <Send className="w-4 h-4 text-background" />
        </button>
      </div>
    </div>
  );
}

// ---------- Mail (JagMail — "not email") ----------
function MailApp() {
  const threads = [
    { from: "JagCloud", subject: "Your week in signals", preview: "You saved 12 things, shared 3, met 1 new person.", time: "8:12" },
    { from: "Nova Studios", subject: "New drop: Field notes 07", preview: "A quiet issue about slowness, made in JagMail.", time: "yesterday" },
    { from: "Kai", subject: "🎧", preview: "made this for you — press play when it's late.", time: "Mon" },
    { from: "The Loop", subject: "3 threads you're being missed in", preview: "Design chat · Weekend plans · Book club", time: "Sun" },
  ];
  return (
    <div>
      <div className="mb-3">
        <div className="font-display text-2xl font-semibold">Signals</div>
        <div className="text-xs text-muted-foreground">
          JagMail isn't email — it's the things that matter, delivered slow.
        </div>
      </div>
      <div className="space-y-2">
        {threads.map((t, i) => (
          <div key={i} className="glass rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{t.from}</div>
              <div className="text-[10px] text-muted-foreground">{t.time}</div>
            </div>
            <div className="text-sm mt-0.5">{t.subject}</div>
            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.preview}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Cloud ----------
function CloudApp() {
  const used = 42;
  return (
    <div>
      <div className="glass-strong rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--jag-violet)] to-[var(--jag-cyan)] grid place-items-center">
            <Cloud className="w-6 h-6 text-background" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">JagCloud ID</div>
            <div className="text-sm font-medium">you@jagx</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">Storage</div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--jag-violet)] to-[var(--jag-cyan)]"
              style={{ width: `${used}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">
            {used} GB of 200 GB used
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { label: "Messages", value: "sync" },
          { label: "Photos", value: "sync" },
          { label: "Wallet", value: "sync" },
          { label: "Signals", value: "sync" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-3">
            <div className="text-sm font-medium">{s.label}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">● in sync</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Store ----------
function StoreApp() {
  const apps = useMemo(
    () => [
      { name: "Loop", tag: "Social · new", by: "JagX", rating: 4.9 },
      { name: "Field", tag: "Journal", by: "Nova", rating: 4.8 },
      { name: "Kite", tag: "Music maker", by: "Studio K", rating: 4.7 },
      { name: "Beam", tag: "Focus timer", by: "Ora", rating: 4.9 },
      { name: "Cove", tag: "Reading", by: "Slow Press", rating: 4.6 },
    ],
    [],
  );
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  return (
    <div>
      <div className="mb-3">
        <div className="font-display text-2xl font-semibold">JagStore</div>
        <div className="text-xs text-muted-foreground">Human-made apps, quietly reviewed.</div>
      </div>
      <div className="glass-strong rounded-3xl p-4 mb-3 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 grid place-items-center">
          <Star className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">App of the week</div>
          <div className="text-xs text-muted-foreground">Beam · a slower kind of focus timer</div>
        </div>
        <button className="text-xs px-3 py-1.5 rounded-full bg-white text-background font-medium">Get</button>
      </div>
      <div className="space-y-2">
        {apps.map((a) => {
          const on = installed.has(a.name);
          return (
            <div key={a.name} className="glass rounded-2xl p-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--jag-violet)] to-[var(--jag-cyan)]" />
              <div className="flex-1">
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-[11px] text-muted-foreground">{a.tag} · {a.by} · ★ {a.rating}</div>
              </div>
              <button
                onClick={() =>
                  setInstalled((s) => {
                    const n = new Set(s);
                    if (on) n.delete(a.name);
                    else n.add(a.name);
                    return n;
                  })
                }
                className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
                  on ? "glass" : "bg-white text-background"
                }`}
              >
                {on ? "Open" : (<><Download className="w-3 h-3" /> Get</>)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GenericApp({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass-strong rounded-3xl p-5">
      <div className="font-display text-2xl font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{body}</div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square glass rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
