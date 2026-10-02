import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Check, Copy, Layers3, Menu, MousePointer2, Play, Sparkles, WandSparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const templates = [
  { title: "Aether House", category: "Architecture", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80", prompt: "Create a cinematic architecture portfolio with editorial grids, quiet transitions, and coastal minimalism." },
  { title: "SØLV Editorial", category: "Fashion", image: "https://images.unsplash.com/photo-1509631179647-0c1158f43007?w=1200&q=80", prompt: "Design a monochrome fashion portfolio with silver editorial imagery, bold cropping, and electric-blue motion accents." },
  { title: "Nocturne Estates", category: "Real Estate", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", prompt: "Build a luxury real-estate showcase with immersive property imagery, glass controls, and cinematic transitions." },
  { title: "Liquid Intelligence", category: "Creative Agency", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80", prompt: "Create a futuristic creative agency site with liquid chrome visuals, modular grids, and reactive cyan light." },
];

const reveal = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: .75, ease: [0.16, 1, 0.3, 1] as const } } };

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} transition={{ delay }}>{children}</motion.div>;
}

function MagneticButton({ children, variant = "default", className = "", onClick }: { children: ReactNode; variant?: "default" | "outline"; className?: string; onClick?: () => void }) {
  const x = useMotionValue(0); const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 250, damping: 20 }); const springY = useSpring(y, { stiffness: 250, damping: 20 });
  const move = (event: MouseEvent<HTMLDivElement>) => { const r = event.currentTarget.getBoundingClientRect(); x.set((event.clientX-r.left-r.width/2)*.18); y.set((event.clientY-r.top-r.height/2)*.18); };
  return <motion.div style={{ x: springX, y: springY }} onMouseMove={move} onMouseLeave={()=>{x.set(0);y.set(0)}} whileTap={{ scale: .94 }} className="inline-flex">
    <Button variant={variant as any} size="lg" className={`studio-button ${className}`} onClick={onClick}>{children}</Button>
  </motion.div>;
}

function TiltCard({ item, index }: { item: typeof templates[number]; index: number }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 }); const [copied, setCopied] = useState(false);
  const move = (event: MouseEvent<HTMLElement>) => { const r=event.currentTarget.getBoundingClientRect(); setTilt({ x: -((event.clientY-r.top)/r.height-.5)*10, y: ((event.clientX-r.left)/r.width-.5)*12 }); };
  const copy = async () => { await navigator.clipboard.writeText(item.prompt); setCopied(true); window.setTimeout(()=>setCopied(false), 1600); };
  return <motion.article className="template-card" onMouseMove={move} onMouseLeave={()=>setTilt({x:0,y:0})} style={{ rotateX: tilt.x, rotateY: tilt.y, transformPerspective: 1000 }} variants={reveal} initial="hidden" whileInView="show" viewport={{ once:true, margin:"-60px" }} transition={{ delay:index*.08 }}>
    <div className="template-visual"><img src={item.image} alt={`${item.title} website template`} loading="lazy" width={1200} height={900}/><div className="template-shine"/><Button className="copy-button" onClick={copy}>{copied?<Check/>:<Copy/>}{copied?"Copied":"Copy prompt"}</Button></div>
    <div className="template-meta"><div><p>{item.category}</p><h3>{item.title}</h3></div><ArrowRight/></div>
  </motion.article>;
}

export function MotionMagicPage() {
  const [menu, setMenu] = useState(false); const heroRef=useRef<HTMLElement>(null); const { scrollYProgress }=useScroll({ target:heroRef, offset:["start start","end start"] });
  const orbY=useTransform(scrollYProgress,[0,1],[0,180]); const sceneY=useTransform(scrollYProgress,[0,1],[0,100]);
  return <main className="studio-page">
    <div className="noise" aria-hidden="true"/>
    <header className="studio-nav-wrap"><nav className="studio-nav" aria-label="Main navigation"><a className="studio-logo" href="#top"><span><WandSparkles/></span>Motion Magic</a><div className="desktop-links"><a href="#templates">Templates</a><a href="#sections">Sections</a><a href="#backgrounds">Backgrounds</a><a href="#pricing">Pricing</a></div><Button variant="ghost" size="icon" className="menu-trigger" onClick={()=>setMenu(!menu)} aria-label="Toggle navigation">{menu?<X/>:<Menu/>}</Button><MagneticButton className="nav-cta">Start creating <ArrowRight/></MagneticButton></nav>{menu&&<motion.div className="mobile-links" initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}><a href="#templates" onClick={()=>setMenu(false)}>Templates</a><a href="#sections" onClick={()=>setMenu(false)}>Sections</a><a href="#backgrounds" onClick={()=>setMenu(false)}>Backgrounds</a><a href="#pricing" onClick={()=>setMenu(false)}>Pricing</a></motion.div>}</header>
    <section id="top" ref={heroRef} className="studio-hero">
      <motion.div className="ambient ambient-one" style={{y:orbY}}/><motion.div className="ambient ambient-two" style={{y:sceneY}}/>
      <motion.div className="hero-orbit" style={{y:sceneY}} aria-hidden="true"><span/><span/><div><Sparkles/></div></motion.div>
      <div className="hero-content"><motion.div className="hero-kicker" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.15}}><span/> AI-powered motion design <em>v2.0</em></motion.div>
        <motion.h1 initial="hidden" animate="show" variants={{show:{transition:{staggerChildren:.1}}}}>{"One Prompt.,Zero Coding.,Stunning Motionsites.".split(",").map((line,i)=><motion.span key={line} variants={reveal} className={i===2?"gradient-text":""}>{line}</motion.span>)}</motion.h1>
        <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.65,duration:.7}}>Turn a single idea into a world-class, animated website. Crafted by AI, polished by motion, and ready to publish in minutes.</motion.p>
        <motion.div className="hero-actions" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.8}}><MagneticButton className="primary-glow">Get lifetime access <ArrowRight/></MagneticButton><MagneticButton variant="outline"><Play/> Watch the film</MagneticButton></motion.div>
        <motion.div className="trusted" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.05}}><div className="avatar-stack"><span>AK</span><span>NE</span><span>JL</span></div><p><strong>4,000+ creators</strong><br/>building beyond static</p></motion.div>
      </div><div className="scroll-cue"><MousePointer2/><span>SCROLL TO EXPLORE</span></div>
    </section>
    <section id="templates" className="studio-section templates-section"><Reveal className="section-intro"><p className="section-kicker"><Layers3/> Curated starting points</p><h2>Designed to move.<br/><span>Built to convert.</span></h2><p>Launch with a premium foundation, then make every detail unmistakably yours.</p></Reveal><div className="template-grid">{templates.map((item,i)=><TiltCard key={item.title} item={item} index={i}/>)}</div></section>
    <section id="sections" className="studio-section feature-band"><Reveal className="feature-copy"><p className="section-kicker"><Sparkles/> Built for imagination</p><h2>Motion that feels<br/>naturally intelligent.</h2><p>Every interaction responds with intention—from spring-driven buttons to fluid section reveals and spatial depth.</p></Reveal><Reveal className="motion-console"><div className="console-top"><span/><span/><span/><p>motion.timeline</p></div><div className="timeline-code"><span><i>01</i> reveal.text <b>spring</b></span><span><i>02</i> parallax.depth <b>42px</b></span><span><i>03</i> hover.card <b>magnetic</b></span></div><motion.div className="console-cursor" animate={{x:[0,160,60,220],y:[0,40,100,130]}} transition={{duration:7,repeat:Infinity,ease:"easeInOut"}}><MousePointer2/></motion.div></Reveal></section>
    <section id="backgrounds" className="studio-section background-showcase"><Reveal><p className="section-kicker">Infinite atmosphere</p><h2>Depth is in the details.</h2></Reveal><div className="background-cards"><Reveal className="bg-card bg-cyan"><span>01</span><h3>Radiant field</h3></Reveal><Reveal className="bg-card bg-chrome" delay={.1}><span>02</span><h3>Liquid space</h3></Reveal><Reveal className="bg-card bg-grid" delay={.2}><span>03</span><h3>Digital horizon</h3></Reveal></div></section>
    <section id="pricing" className="studio-cta"><Reveal><p className="section-kicker">One idea away</p><h2>Your best website<br/>hasn't been built yet.</h2><p>Join the next generation of creators shaping the web through motion.</p><MagneticButton className="primary-glow">Get lifetime access <ArrowRight/></MagneticButton></Reveal></section>
    <footer><a className="studio-logo" href="#top"><span><WandSparkles/></span>Motion Magic</a><p>Make the web move.</p><span>© 2026 Motion Magic Studio</span></footer>
  </main>;
}
