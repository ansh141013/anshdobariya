import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import { ArrowUpRight, ArrowRight, Github, Linkedin, Mail, Move3D, Menu, X } from 'lucide-react';
import { KineticTypographyLoader } from '@/components/ui/loading-animation';
import { NotchedProjectCard } from '@/components/ui/notched-project-card';
import { renderSkillIcon } from './components/SkillIcons';
import { HeroScene } from './components/robot/HeroScene';
import './styles.css';

const ROLES = [
  'Robotics Engineer',
  'Automation & Controls Engineer',
  'ROS & Autonomous Systems Engineer',
  'Mechanical CAD & Design Engineer',
];

const projects = [
  {
    number: '01',
    category: 'ROBOTICS / AUTONOMOUS SYSTEMS',
    title: 'Emergency Medical Delivery Robot',
    description: 'Autonomous hospital AGV designed to transport critical medicines and sterile supplies with LiDAR SLAM, dynamic path re-planning, and secure cargo bay integration.',
    image: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=85',
    badge: 'Robofest 2025',
    tags: ['ROS 2', 'SLAM Navigation', 'Obstacle Avoidance', 'Healthcare'],
    href: '#contact',
    accent: '#FF6A00',
    accentForeground: '#FFFFFF',
  },
  {
    number: '02',
    category: 'ROBOTICS / MANIPULATION / CAD',
    title: '6 DOF Robotic Arm Simulation',
    description: 'Six-axis robotic arm simulation focusing on inverse kinematics, real-time trajectory optimization, and teleoperation for precision pick-and-place tasks.',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=85',
    badge: 'Simulation 2024',
    tags: ['MoveIt', 'Inverse Kinematics', 'Fusion 360 CAD', 'Motion Control'],
    href: '#contact',
    accent: '#FF6A00',
    accentForeground: '#FFFFFF',
  },
  {
    number: '03',
    category: 'SOFTWARE / AUTOMATION',
    title: 'TableTap Automation Platform',
    description: 'Contactless QR ordering and real-time operations orchestrator connecting dining tables, smart IoT kitchen sensors, and staff fulfillment workflows.',
    image: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1200&q=85',
    badge: 'Full Stack 2023',
    tags: ['Full Stack', 'IoT System', 'Realtime Web', 'Automation'],
    href: '#contact',
    accent: '#FF6A00',
    accentForeground: '#FFFFFF',
  },
];

const skillCategories = [
  {
    category: 'ROBOTICS',
    skills: [
      { code: 'ROS', name: 'ROS' },
      { code: 'ROB', name: 'Robotics' },
      { code: 'MC', name: 'Motion Control' },
      { code: 'MAN', name: 'Robot Manipulation' },
      { code: 'SEN', name: 'Sensors' },
      { code: 'ACT', name: 'Actuators' },
    ],
  },
  {
    category: 'PROGRAMMING',
    skills: [
      { code: 'PY', name: 'Python' },
      { code: 'C', name: 'C' },
      { code: 'C++', name: 'C++' },
      { code: 'JS', name: 'JavaScript' },
      { code: 'TS', name: 'TypeScript' },
    ],
  },
  {
    category: 'DESIGN & CAD',
    skills: [
      { code: 'F360', name: 'Fusion 360' },
      { code: 'CAD', name: 'CAD' },
      { code: 'MECH', name: 'Mechanical Design' },
      { code: '3D', name: '3D Modeling' },
    ],
  },
  {
    category: 'AI / VISION',
    skills: [
      { code: 'CV', name: 'Computer Vision' },
      { code: 'ML', name: 'Machine Learning' },
      { code: 'AI', name: 'AI Systems' },
    ],
  },
  {
    category: 'EMBEDDED',
    skills: [
      { code: 'ESP', name: 'ESP32' },
      { code: 'RPI', name: 'Raspberry Pi' },
      { code: 'MCU', name: 'Microcontrollers' },
      { code: 'DRV', name: 'Motor Drivers' },
    ],
  },
  {
    category: 'SOFTWARE',
    skills: [
      { code: 'RCT', name: 'React' },
      { code: 'NXT', name: 'Next.js' },
      { code: 'FBS', name: 'Firebase' },
      { code: 'WEB', name: 'Web Dev' },
    ],
  },
];

const engineeringFocusList = [
  {
    number: '01',
    title: 'ROBOTICS',
    description: 'Mechanical systems, robot manipulation and system integration.',
  },
  {
    number: '02',
    title: 'AUTOMATION',
    description: 'Control systems, sensors, actuators and automated workflows.',
  },
  {
    number: '03',
    title: 'ROS & AUTONOMOUS SYSTEMS',
    description: 'Robot software, perception, navigation and system-level integration.',
  },
  {
    number: '04',
    title: 'MECHANICAL DESIGN',
    description: 'CAD, mechanisms, assemblies and design for physical systems.',
  },
];

const whatIBuildStatements = [
  {
    number: '01',
    title: 'INTELLIGENT MACHINES.',
    description: 'Physical systems that sense, process and respond.',
  },
  {
    number: '02',
    title: 'AUTOMATED SYSTEMS.',
    description: 'Engineering workflows designed to reduce repetitive work.',
  },
  {
    number: '03',
    title: 'ROBOTIC MOTION.',
    description: 'Manipulation, motion planning and control.',
  },
  {
    number: '04',
    title: 'REAL-WORLD SOFTWARE.',
    description: 'Software that connects hardware, users and systems.',
  },
];

function TypewriterRole() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState(ROLES[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const currentRole = ROLES[roleIndex];

    if (!isDeleting) {
      if (displayedText.length < currentRole.length) {
        timer = setTimeout(() => {
          setDisplayedText(currentRole.slice(0, displayedText.length + 1));
        }, 55);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 1500);
      }
    } else {
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentRole.slice(0, displayedText.length - 1));
        }, 32);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setRoleIndex((prev) => (prev + 1) % ROLES.length);
        }, 280);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [displayedText, isDeleting, roleIndex]);

  return (
    <div className="hero-role" aria-label={`Current Role: ${ROLES[roleIndex]}`}>
      <span className="hero-role-text" aria-hidden="true">
        <span>{displayedText}</span>
        <span className="typewriter-underscore">_</span>
      </span>
      <span className="sr-only" aria-live="polite">
        {!isDeleting && displayedText === ROLES[roleIndex] ? ROLES[roleIndex] : ''}
      </span>
    </div>
  );
}




function Nav({ activeSection }: { activeSection: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { label: 'Home', href: '#home', id: 'home' },
    { label: 'About', href: '#about', id: 'about' },
    { label: 'Education', href: '#education', id: 'education' },
    { label: 'Projects', href: '#projects', id: 'projects' },
    { label: 'Skills', href: '#skills', id: 'skills' },
    { label: 'Experience', href: '#experience', id: 'experience' },
    { label: 'Focus', href: '#focus', id: 'focus' },
    { label: 'Contact', href: '#contact', id: 'contact' },
  ];

  return (
    <div className="nav-wrapper">
      <header className="nav container">
        <a className="brand" href="#home" aria-label="Ansh Dobariya home">
          <span className="brand-mark">
            <img src="/logo.png" alt="Ansh Dobariya logo" className="brand-logo-img" />
          </span>
          <span className="brand-copy">
            <strong>ANSH DOBARIYA</strong>
            <small>ROBOTICS ENGINEER</small>
          </span>
        </a>
        <nav className="nav-links desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={activeSection === item.id ? 'active' : ''}
              aria-current={activeSection === item.id ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {mobileMenuOpen && (
        <nav className="mobile-nav-drawer" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={activeSection === item.id ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}

function Reveal({ children, className='' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' });
        obs.disconnect();
      }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

function App() {
  const [picked, setPicked] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('ansh_portfolio_seen');
    } catch {
      return true;
    }
  });
  const [isExiting, setIsExiting] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | number | null>(null);

  const loaderWords = useMemo(
    () => ["INITIALIZING", "CALIBRATING", "ROBOTICS CORE", "ANSH DOBARIYA"],
    []
  );

  const handleFinishLoading = () => {
    setIsExiting(true);
    try {
      sessionStorage.setItem('ansh_portfolio_seen', '1');
    } catch {}
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  };

  useEffect(() => {
    (window as any).replayLoader = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsExiting(false);
      setIsLoading(true);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveSection(visible.target.id);
    }, { threshold: [0.12, 0.35, 0.6] });
    document.querySelectorAll('section[id]').forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    gsap.utils.toArray<HTMLElement>('.line-draw').forEach((el, i) => {
      gsap.fromTo(el, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.6, delay: i * 0.03, ease: 'power2.out' });
    });
  }, []);

  return <>
    {isLoading && (
      <div
        className={`website-loader-screen ${isExiting ? 'exit' : ''}`}
        role="dialog"
        aria-label="Website loading screen"
      >
        <div className="loader-brand-logo">
          <img src="/logo.png" alt="Ansh Dobariya Logo" />
        </div>
        <KineticTypographyLoader
          words={loaderWords}
          theme="light"
          textColor="text-[#0A0A0A]"
          subtitle="ANSH DOBARIYA // ROBOTICS & AUTOMATION"
          maxCycles={1}
          onComplete={handleFinishLoading}
        />
        <button
          className="skip-loader-btn"
          onClick={handleFinishLoading}
          aria-label="Skip website intro"
        >
          <span>ENTER PORTFOLIO</span>
          <ArrowUpRight size={14} />
        </button>
      </div>
    )}

    <div className={`website-main-content ${isLoading && !isExiting ? 'is-loading' : 'is-ready'}`}>
      <Nav activeSection={activeSection} />

      <main>
        {/* ─── 01. HERO ─── */}
        <section id="home" className="hero container section-anchor">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="orange-dot" aria-hidden="true"></span>
              ROBOTICS &nbsp;|&nbsp; AI &nbsp;|&nbsp; AUTOMATION
            </div>
            <div className="hero-title-group">
              <span className="hero-salutation">Hi, I'm</span>
              <h1 className="hero-name">Ansh Dobariya</h1>
              <TypewriterRole />
            </div>
            <p className="hero-lead">
              I design, build and automate real-world systems using robotics, AI, embedded systems and engineering to create a smarter and safer tomorrow.
            </p>
            <div className="hero-signal">
              <span className="line-draw"></span>
              <div>
                <span>BUILD</span>
                <span>AUTOMATE</span>
                <span>SOLVE</span>
                <span>CREATE IMPACT</span>
              </div>
            </div>
          </div>
          <div className="hero-visual-wrap">
            <HeroScene picked={picked} setPicked={setPicked} />
            <div className="hero-side-note">IDEAS<br />INTO<br />REALITY<span aria-hidden="true"></span></div>
            <div className="hero-scroll" aria-hidden="true"><Move3D size={14}/><span>SCROLL</span><i></i></div>
          </div>
        </section>

        {/* ─── 02. ABOUT / ENGINEERING PROFILE ─── */}
        <section id="about" className="section container section-anchor">
          <div className="section-head">
            <Reveal>
              <div className="eyebrow"><span className="orange-dot" aria-hidden="true"></span>ABOUT ME</div>
              <h2>Robotics Engineer<br />&amp; Problem Solver</h2>
            </Reveal>
            <Reveal className="head-note">
              A structured engineering profile combining multidisciplinary hardware, software, and autonomous system design.
            </Reveal>
          </div>

          <div className="resume-profile-grid">
            <Reveal className="profile-left-col">
              <div className="editorial-bio">
                <p className="lead-text">
                  I’m Ansh Dobariya, a robotics-focused engineering student interested in designing, building and programming intelligent machines.
                </p>
                <p>
                  My work combines robotics, embedded systems, automation, computer vision, mechanical design and software to turn engineering concepts into working systems.
                </p>
                <p>
                  I enjoy working across the complete development process, from CAD and electronics to control, programming, testing and system integration.
                </p>
              </div>

              {/* Profile Information Metadata */}
              <div className="profile-meta-grid">
                <div className="meta-card">
                  <span className="meta-label">ROLE</span>
                  <strong className="meta-value">Robotics Engineer</strong>
                </div>
                <div className="meta-card">
                  <span className="meta-label">EDUCATION</span>
                  <strong className="meta-value">B.Tech</strong>
                </div>
                <div className="meta-card">
                  <span className="meta-label">SPECIALIZATION</span>
                  <strong className="meta-value">Robotics / Automation / AI</strong>
                </div>
                <div className="meta-card">
                  <span className="meta-label">INTERESTS</span>
                  <strong className="meta-value">Robotics • Autonomous Systems • Embedded Systems</strong>
                </div>
                <div className="meta-card">
                  <span className="meta-label">STATUS</span>
                  <strong className="meta-value">Student / Engineering</strong>
                </div>
              </div>

              {/* Engineering Focus Rows */}
              <div className="engineering-focus-block">
                <div className="sub-section-title">
                  <span className="orange-dot" aria-hidden="true"></span>
                  <span>ENGINEERING FOCUS</span>
                </div>
                <div className="focus-rows">
                  {engineeringFocusList.map((f) => (
                    <div key={f.number} className="focus-row">
                      <span className="focus-num">{f.number}</span>
                      <div className="focus-info">
                        <strong>{f.title}</strong>
                        <p>{f.description}</p>
                      </div>
                      <ArrowRight size={15} className="focus-arrow" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Right Column: Visual + Technical Breakdown */}
            <div className="profile-right-col">
              <Reveal className="about-visual">
                <img
                  src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=85"
                  alt="Ansh Dobariya robotics engineering workspace"
                  loading="lazy"
                />
                <div className="about-overlay-copy">SAME<br />CURIOSITY.<br />BIGGER<br />POSSIBILITIES.</div>
                <div className="about-signature">AUTOMATE<br />INNOVATE<br />SOLVE<br />REPEAT</div>
              </Reveal>

              {/* Technical Profile Breakdown */}
              <Reveal className="technical-profile-box">
                <div className="sub-section-title">
                  <span className="orange-dot" aria-hidden="true"></span>
                  <span>TECHNICAL PROFILE</span>
                </div>
                <div className="tech-profile-grid">
                  <div className="tech-profile-category">
                    <span className="cat-title">ROBOTICS</span>
                    <ul>
                      <li>Robot manipulation</li>
                      <li>Sensors</li>
                      <li>Actuators</li>
                      <li>Motion systems</li>
                      <li>System integration</li>
                    </ul>
                  </div>
                  <div className="tech-profile-category">
                    <span className="cat-title">PROGRAMMING</span>
                    <ul>
                      <li>Python</li>
                      <li>C</li>
                      <li>C++</li>
                      <li>JavaScript / TypeScript</li>
                    </ul>
                  </div>
                  <div className="tech-profile-category">
                    <span className="cat-title">EMBEDDED</span>
                    <ul>
                      <li>ESP32</li>
                      <li>Raspberry Pi</li>
                      <li>Microcontrollers</li>
                      <li>Motor control</li>
                    </ul>
                  </div>
                  <div className="tech-profile-category">
                    <span className="cat-title">VISION / AI</span>
                    <ul>
                      <li>Computer vision</li>
                      <li>AI systems</li>
                      <li>Image processing</li>
                    </ul>
                  </div>
                  <div className="tech-profile-category">
                    <span className="cat-title">MECHANICAL</span>
                    <ul>
                      <li>Fusion 360</li>
                      <li>CAD</li>
                      <li>Mechanical assemblies</li>
                      <li>Design</li>
                    </ul>
                  </div>
                  <div className="tech-profile-category">
                    <span className="cat-title">SOFTWARE</span>
                    <ul>
                      <li>React</li>
                      <li>Next.js</li>
                      <li>Firebase</li>
                      <li>Web technologies</li>
                    </ul>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Achievement Snapshot Horizontal Strip */}
          <Reveal className="achievement-strip">
            <div className="achievement-item">
              <strong>05+</strong>
              <span>PROJECTS</span>
            </div>
            <div className="achievement-item">
              <strong>06</strong>
              <span>ROBOTIC DOF</span>
            </div>
            <div className="achievement-item">
              <strong>15+</strong>
              <span>TECHNOLOGIES</span>
            </div>
            <div className="achievement-item">
              <strong>∞</strong>
              <span>CURIOSITY</span>
            </div>
          </Reveal>
        </section>

        {/* ─── 03. EDUCATION & DEVELOPMENT ─── */}
        <section id="education" className="section education-section container section-anchor">
          <div className="section-head">
            <Reveal>
              <div className="eyebrow"><span className="orange-dot" aria-hidden="true"></span>EDUCATION &amp; DEVELOPMENT</div>
              <h2>Building the foundation<br />behind the systems.</h2>
            </Reveal>
            <Reveal className="head-note">
              Rigorous engineering training combined with applied robotics exploration, kinematics modeling, and control architecture.
            </Reveal>
          </div>

          <div className="education-timeline-wrap">
            <Reveal className="education-timeline-card">
              <div className="timeline-date-col">
                <span className="period-badge">202X — PRESENT</span>
              </div>
              <div className="timeline-content-col">
                <div className="degree-title">B.Tech in Engineering</div>
                <div className="institution-title">L.D. College of Engineering</div>
                <p className="degree-desc">
                  Engineering education with a focus on technical development, robotics, control systems, and applied engineering problem solving.
                </p>
              </div>
            </Reveal>

            <Reveal className="learning-areas-strip">
              <span className="learning-areas-label">CORE LEARNING AREAS:</span>
              <div className="learning-tags">
                <span>Robotics</span>
                <span>Embedded Systems</span>
                <span>Mechanical Design</span>
                <span>Programming</span>
                <span>Computer Vision</span>
                <span>Automation</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ─── 04. FEATURED PROJECTS ─── */}
        <section id="projects" className="section container section-anchor">
          <div className="section-head">
            <Reveal>
              <div className="eyebrow"><span className="orange-dot" aria-hidden="true"></span>FEATURED PROJECTS</div>
              <h2>Ideas in Action</h2>
            </Reveal>
            <Reveal className="head-note">
              A showcase of my work in robotics, automation and AI. Each project represents a step towards real-world impact.
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((p) => (
              <Reveal key={p.title} className="flex flex-col h-full">
                <NotchedProjectCard
                  href={p.href}
                  title={p.title}
                  description={p.description}
                  image={p.image}
                  imageAlt={p.title}
                  badge={p.badge}
                  tags={p.tags}
                  accent={p.accent}
                  accentForeground={p.accentForeground}
                  surface="var(--bg, #FFFFFF)"
                  monochrome
                  className="h-full"
                />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ─── 05. TECHNICAL SKILLS ─── */}
        <section id="skills" className="section skills-section section-anchor">
          <div className="container">
            <div className="section-head">
              <Reveal>
                <div className="eyebrow"><span className="orange-dot" aria-hidden="true"></span>SKILLS &amp; TOOLS</div>
                <h2>Technologies I Work With</h2>
              </Reveal>
              <Reveal className="head-note">
                Organized technical capabilities across robotics kinematics, embedded firmware, high-level control, and mechanical CAD.
              </Reveal>
            </div>

            <div className="skills-categorized-grid">
              {skillCategories.map((group) => (
                <Reveal key={group.category} className="skill-group-card">
                  <span className="skill-group-tag">{group.category}</span>
                  <div className="skill-group-items">
                    {group.skills.map((s) => (
                      <div key={s.name} className="skill-item">
                        <div className="skill-icon" aria-label={s.name}>
                          {renderSkillIcon(s.name)}
                        </div>
                        <span>{s.name}</span>
                      </div>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 06. EXPERIENCE & ACHIEVEMENTS ─── */}
        <section id="experience" className="section experience-section section-anchor">
          <div className="experience-grid">
            <div className="experience-art">
              <img src="https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1400&q=85" alt="Industrial robotics engineering visual" loading="lazy" />
              <div className="art-label">PRECISION<br />INTELLIGENCE<br />AUTOMATION<span aria-hidden="true"></span></div>
              <h3>Engineering<br />a Smarter<br />Future.</h3>
            </div>
            <Reveal className="journey">
              <div className="eyebrow"><span className="orange-dot" aria-hidden="true"></span>EXPERIENCE &amp; ACHIEVEMENTS</div>
              <h2>My Journey</h2>
              <div className="timeline">
                {[
                  ['2025','ROBOFEST GUJARAT 6.0','Emergency Medical Delivery Robot'],
                  ['2024','HACKATHON','Second Position'],
                  ['2023','PROJECT DEVELOPMENT','TableTap, ContentFlow, CloudHash Pro and other projects'],
                  ['2022','LEARNING','Programming, robotics and AI foundations'],
                ].map(([year,title,desc]) => (
                  <div className="timeline-row" key={year}>
                    <div className="year">{year}</div>
                    <div className="dot"></div>
                    <div>
                      <strong>{title}</strong>
                      <span>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ─── 07. ENGINEERING FOCUS ("WHAT I BUILD") ─── */}
        <section id="focus" className="section what-i-build-section section-anchor">
          <div className="container">
            <div className="section-head">
              <Reveal>
                <div className="eyebrow"><span className="orange-dot" aria-hidden="true"></span>ENGINEERING PILLARS</div>
                <h2>WHAT I BUILD</h2>
              </Reveal>
              <Reveal className="head-note">
                Four foundational engineering pillars guiding physical robot development, autonomous control, and mission-critical workflows.
              </Reveal>
            </div>

            <div className="what-i-build-grid">
              {whatIBuildStatements.map((item) => (
                <Reveal key={item.number} className="build-pillar-item">
                  <div className="pillar-num">{item.number}</div>
                  <h3 className="pillar-title">{item.title}</h3>
                  <p className="pillar-desc">{item.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 08. CONTACT ─── */}
        <section id="contact" className="section contact-section container section-anchor">
          <div className="contact-grid">
            <Reveal>
              <div className="eyebrow"><span className="orange-dot" aria-hidden="true"></span>LET'S CONNECT</div>
              <h2>Let's Build<br />Something Great.</h2>
              <p className="body-copy">
                I’m interested in robotics projects, engineering collaborations, internships and opportunities to build real-world systems.
              </p>
              <div className="contact-links">
                <a href="#" aria-label="LinkedIn profile of Ansh Dobariya"><Linkedin size={19}/><span>LINKEDIN</span></a>
                <a href="#" aria-label="GitHub profile of Ansh Dobariya"><Github size={19}/><span>GITHUB</span></a>
                <a href="mailto:your@email.com" aria-label="Email Ansh Dobariya"><Mail size={19}/><span>EMAIL</span></a>
              </div>
            </Reveal>
            <Reveal className="contact-visual">
              <img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=85" alt="Robotic end-effector gripper" loading="lazy" />
              <div className="contact-corner"><span aria-hidden="true"></span>BUILT WITH PASSION<br />FOR A MORE AUTOMATED TOMORROW.</div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ─── 09. FOOTER ─── */}
      <footer className="footer container">
        <div className="footer-brand">
          <span className="brand-mark">
            <span className="brand-monogram">AD</span>
          </span>
          <div className="brand-copy">
            <strong>ANSH DOBARIYA</strong>
            <small>ROBOTICS ENGINEER</small>
          </div>
        </div>
        <p className="footer-center">
          BUILDING INTELLIGENT SYSTEMS<br />FOR REAL-WORLD IMPACT.
        </p>
        <p className="footer-right">
          &copy; {new Date().getFullYear()} ANSH DOBARIYA
        </p>
      </footer>
    </div>
  </>;
}

declare global { interface Window { __picked: boolean } }

const splash = document.getElementById('pre-splash');
if (splash) splash.remove();

createRoot(document.getElementById('root')!).render(<App />);
