import { useEffect, useRef, useState, Fragment } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { BookOpen, ArrowRight, Sun, Moon, ClipboardPaste, Sparkles, PencilLine } from "lucide-react";
import { useUser } from "../utils/UserContext";

gsap.registerPlugin(ScrollTrigger);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEMO = [
    { t: "Leo loved visiting his grandfather's garden every summer.", hard: false },
    { t: "Although the summer sun beat down relentlessly on the quiet backyard, Leo diligently carried the heavy blue watering can back and forth.", hard: true },
    { t: "The shade felt cool and comfortable.", hard: false },
    { t: "While gazing across the neatly arranged rows of vegetables, his grandfather began to recount a captivating tale.", hard: true },
    { t: "Exhausted after hours of manual labor under the midday heat, the two gardeners finally sought refuge.", hard: true },
    { t: "Had Leo not paid such close attention to the intricate details, he would have missed the subtle hint.", hard: true },
    { t: "Not until the golden evening light started to fade did they decide it was time to head inside.", hard: true },
];
const DEMO_WORDS = [
    { w: "relentlessly", s: 4 }, { w: "diligently", s: 4 }, { w: "captivating", s: 4 },
    { w: "gardeners", s: 3 }, { w: "intricate", s: 3 },
];

function Words({ text, cls, mask = false }: { text: string; cls: string; mask?: boolean }) {
    return (
        <>
            {text.split(" ").map((w, i) => (
                <Fragment key={i}>
                    <span className={cls}>{mask ? <span>{w}</span> : w}</span>{" "}
                </Fragment>
            ))}
        </>
    );
}

export function Landing() {
    const { saveProfile, theme, toggleTheme } = useUser();
    const root = useRef<HTMLDivElement>(null);
    const lenisRef = useRef<Lenis | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });
        lenisRef.current = lenis;
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        const ctx = gsap.context(() => {
            gsap.to(".lp-progress", {
                scaleX: 1, ease: "none",
                scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
            });

            const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
            intro
                .from(".lp-hero-title .lp-w > span", { yPercent: 115, duration: 1.3, stagger: 0.09 })
                .from(".lp-hero-sub", { y: 24, opacity: 0, duration: 1 }, "-=0.8")
                .from(".lp-hero-actions", { y: 24, opacity: 0, duration: 1 }, "-=0.8")
                .from(".lp-float", { y: 80, opacity: 0, duration: 1.4, stagger: 0.15 }, "-=1");

            gsap.utils.toArray<HTMLElement>("[data-depth]").forEach((el) => {
                const d = parseFloat(el.dataset.depth || "0.2");
                gsap.to(el, {
                    y: -d * 260, ease: "none",
                    scrollTrigger: {
                        trigger: el.closest("section"), start: "top bottom", end: "bottom top", scrub: true,
                    },
                });
            });

            gsap.fromTo(".lp-sw", { opacity: 0.12 }, {
                opacity: 1, stagger: 0.12, ease: "none",
                scrollTrigger: { trigger: ".lp-statement", start: "top 70%", end: "bottom 65%", scrub: true },
            });

            const circle = root.current!.querySelector<SVGCircleElement>(".lp-ring-bar")!;
            const num = root.current!.querySelector<HTMLElement>(".lp-score-num")!;
            const C = 2 * Math.PI * 54;
            circle.style.strokeDasharray = `0 ${C}`;
            const proxy = { v: 0 };

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".lp-demo", start: "top top", end: "+=2800",
                    scrub: 0.8, pin: true, anticipatePin: 1,
                },
            });
            tl.from(".lp-demo-head", { y: 30, opacity: 0, duration: 0.6 }, 0);
            gsap.utils.toArray<HTMLElement>(".lp-s[data-hard]").forEach((el, i) => {
                tl.to(el, { className: "+=lp-on", duration: 0.4 }, 0.8 + i);
            });
            tl.to(proxy, {
                v: 62, duration: 2, ease: "none",
                onUpdate() {
                    circle.style.strokeDasharray = `${(proxy.v / 100) * C} ${C}`;
                    num.textContent = String(Math.round(proxy.v));
                },
            }, 6)
                .to(".lp-dw", { className: "+=lp-on", duration: 0.4, stagger: 0.35 }, 7.5)
                .to({}, { duration: 1 });

            gsap.set(".lp-step", { opacity: 0 });
            ScrollTrigger.batch(".lp-step", {
                start: "top 85%",
                onEnter: (els) =>
                    gsap.fromTo(els, { y: 70, opacity: 0 }, {
                        y: 0, opacity: 1, duration: 1, stagger: 0.18, ease: "power3.out",
                    }),
            });

            gsap.from(".lp-cta-card", {
                y: 90, opacity: 0, duration: 1.2, ease: "power3.out",
                scrollTrigger: { trigger: ".lp-final", start: "top 65%" },
            });
        }, root);

        return () => {
            ctx.revert();
            gsap.ticker.remove(tick);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    const goToForm = () => {
        if (lenisRef.current) lenisRef.current.scrollTo("#lp-start", { duration: 2.4 });
        else document.getElementById("lp-start")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return setError("Please enter your name.");
        if (!EMAIL_RE.test(email.trim())) return setError("Please enter an email like you@example.com.");
        saveProfile({ name: name.trim(), email: email.trim() });
    };

    let rank = 0;

    return (
        <div className="lp" ref={root}>
            <div className="lp-progress" />

            <nav className="lp-nav">
                <div className="cc-brand">
                    <BookOpen size={22} strokeWidth={1.6} />
                    <span className="cc-name">ChapterCheck</span>
                    <span className="cc-beta">Beta</span>
                </div>
                <div className="lp-nav-right">
                    <button type="button" className="cc-icon-btn" onClick={toggleTheme}
                        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
                        {theme === "dark" ? <Sun size={17} strokeWidth={1.6} /> : <Moon size={17} strokeWidth={1.6} />}
                    </button>
                    <button type="button" className="lp-nav-cta" onClick={goToForm}>Try now</button>
                </div>
            </nav>

            {/* HERO */}
            <section className="lp-hero">
                <div className="lp-orb lp-orb-1" data-depth="0.5" />
                <div className="lp-orb lp-orb-2" data-depth="0.9" />
                <div className="lp-hero-inner">
                    <p className="lp-eyebrow">Free readability tool for authors</p>
                    <h1 className="lp-hero-title"><Words text="Read Better. Write Smarter." cls="lp-w" mask /></h1>
                    <p className="lp-hero-sub">
                        Paste a chapter. See its readability score and the five hardest sentences,
                        highlighted right where they live.
                    </p>
                    <div className="lp-hero-actions">
                        <button type="button" className="lp-btn" onClick={goToForm}>Try now <ArrowRight size={16} /></button>
                        <span className="lp-hint">No sign-up. No verification.</span>
                    </div>
                </div>

                <div className="lp-hero-visual">
                    <div className="cc-card lp-float lp-mock" data-depth="0.15">
                        <p>
                            Leo loved visiting his grandfather's garden.{" "}
                            <mark className="cc-hl"><span className="cc-marker">1</span>Although the summer sun beat down relentlessly on the quiet backyard…</mark>
                        </p>
                    </div>
                    <div className="cc-card lp-float lp-chip lp-chip-score" data-depth="0.4">
                        <small>Readability</small><strong>62<span> / 100</span></strong>
                    </div>
                    <div className="cc-card lp-float lp-chip lp-chip-word" data-depth="0.7">
                        <span className="cc-dot" /> <strong>relentlessly</strong> <em className="cc-pos">· 4 syl.</em>
                    </div>
                </div>
                <div className="lp-scroll-cue"><span /></div>
            </section>

            {/* STATEMENT */}
            <section className="lp-statement">
                <h2><Words text="Great chapters feel effortless to read. Finding what slows readers down shouldn't be hard." cls="lp-sw" /></h2>
            </section>

            {/* PINNED DEMO */}
            <section className="lp-demo">
                <div className="lp-demo-head">
                    <p className="lp-eyebrow">See it work</p>
                    <h2>Scroll. Watch your chapter get read.</h2>
                </div>
                <div className="lp-demo-grid">
                    <div className="cc-card lp-demo-passage">
                        <div className="cc-card-head">
                            <div className="cc-card-title">Chapter Content</div>
                        </div>
                        <p>
                            {DEMO.map((s, i) => {
                                const r = s.hard ? ++rank : 0;
                                return (
                                    <Fragment key={i}>
                                        <span className="lp-s" {...(s.hard ? { "data-hard": "1" } : {})}>
                                            {s.hard && <span className="lp-m">{r}</span>}
                                            {s.t}
                                        </span>{" "}
                                    </Fragment>
                                );
                            })}
                        </p>
                    </div>

                    <div className="lp-demo-side">
                        <div className="cc-card lp-demo-score">
                            <h3>Readability Score</h3>
                            <div className="lp-demo-score-row">
                                <div className="cc-score"><span className="lp-score-num">0</span><span> / 100</span></div>
                                <svg width="120" height="120" viewBox="0 0 120 120">
                                    <circle className="lp-ring-track" cx="60" cy="60" r="54" strokeWidth="9" fill="none" />
                                    <circle className="lp-ring-bar" cx="60" cy="60" r="54" strokeWidth="9" fill="none"
                                        strokeLinecap="round" transform="rotate(-90 60 60)" />
                                </svg>
                            </div>
                            <span className="cc-badge cc-badge-amber">Standard</span>
                        </div>
                        <div className="cc-card lp-demo-words">
                            <h3>Difficult Words</h3>
                            <ul className="cc-list">
                                {DEMO_WORDS.map((d) => (
                                    <li key={d.w} className="cc-row lp-dw">
                                        <span className="cc-dot" />
                                        <div className="cc-row-body">
                                            <p className="cc-row-title"><strong>{d.w}</strong><em className="cc-pos"> · {d.s} syl.</em></p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="lp-steps">
                <p className="lp-eyebrow">How it works</p>
                <h2>Three steps. Zero setup.</h2>
                <div className="lp-steps-grid">
                    {[
                        { Icon: ClipboardPaste, t: "Paste or upload", d: "Drop in your chapter, upload a .txt or .docx, or dictate it with your voice." },
                        { Icon: Sparkles, t: "Analyse", d: "Get a Flesch Reading Ease score, the five hardest sentences and tricky vocabulary." },
                        { Icon: PencilLine, t: "Refine", d: "Tap any word for its definition, jump to any hard sentence, then re-analyse." },
                    ].map(({ Icon, t, d }, i) => (
                        <div key={t} className="cc-card lp-step">
                            <span className="lp-step-n">0{i + 1}</span>
                            <Icon size={24} strokeWidth={1.5} />
                            <h3>{t}</h3>
                            <p>{d}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="lp-final" id="lp-start">
                <div className="lp-orb lp-orb-3" data-depth="0.4" />
                <h2>Ready to read your chapter the way your readers will?</h2>
                <div className="cc-card cc-landing-card lp-cta-card">
                    <form onSubmit={handleSubmit} className="cc-landing-form" noValidate>
                        <label>
                            <span>Name</span>
                            <input type="text" value={name} placeholder="Your name" autoComplete="name" maxLength={60}
                                onChange={(e) => { setName(e.target.value); setError(""); }} />
                        </label>
                        <label>
                            <span>Email</span>
                            <input type="email" value={email} placeholder="you@example.com" autoComplete="email" maxLength={100}
                                onChange={(e) => { setEmail(e.target.value); setError(""); }} />
                        </label>
                        {error && <p className="cc-error-inline">{error}</p>}
                        <button type="submit" className="cc-landing-btn">Try now <ArrowRight size={16} /></button>
                    </form>
                    <p className="cc-landing-note">No sign-up or verification. Your details stay on this device.</p>
                </div>
                <footer className="lp-footer">ChapterCheck · Read Better. Write Smarter.</footer>
            </section>
        </div>
    );
}