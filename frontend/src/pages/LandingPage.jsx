import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiFileText, FiMic, FiVideo, FiZap, FiCheck, FiHeadphones, FiGitBranch, FiFilm } from 'react-icons/fi';
import StarBorder from '../components/ui/star-border';
import { GlowCard } from '../components/ui/spotlight-card';
import ComplexityButton from '../components/common/ComplexityButton';
// ThemeToggle removed from this page per request

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.15, delay }}
    tabIndex={0}
    className="relative h-full"
  >
    {/* Make the GlowCard stretch to fill the grid cell so all cards are equal height */}
    <GlowCard className="card h-full p-6 bg-white/95 text-gray-900 rounded-xl shadow-sm group hover:shadow-xl hover:-translate-y-1 transform transition-all duration-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
      <div className="flex flex-col h-full">
        <div className="w-12 h-12 bg-neutral-900 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200 group-hover:bg-neutral-800 flex-shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-white/80 text-sm leading-relaxed">{description}</p>
        </div>

        {/* keep any footer actions spaced to the bottom if present */}
        <div className="mt-4" />
      </div>
    </GlowCard>
  </motion.div>
);

const LandingPage = () => {
  // --- DigitalSerenity-style interactive background state/effects ---
  const [mouseGradientStyle, setMouseGradientStyle] = useState({ left: '0px', top: '0px', opacity: 0 });
  const [ripples, setRipples] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const floatingElementsRef = useRef([]);
  // Dropdown state for Get Started
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseGradientStyle({ left: `${e.clientX}px`, top: `${e.clientY}px`, opacity: 1 });
    };
    const handleMouseLeave = () => setMouseGradientStyle(prev => ({ ...prev, opacity: 0 }));
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 1000);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll('.floating-element-animate');
    floatingElementsRef.current = Array.from(elements);
    const handleScroll = () => {
      if (!scrolled) {
        setScrolled(true);
        floatingElementsRef.current.forEach((el, index) => {
          setTimeout(() => {
            if (el) { el.style.animationPlayState = 'running'; el.style.opacity = ''; }
          }, (parseFloat(el.style.animationDelay || '0') * 1000) + index * 100);
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // close dropdown on outside click or escape
  useEffect(() => {
    const onDocClick = (e) => {
      if (menuOpen) {
        if (menuRef.current && !menuRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
          setMenuOpen(false);
        }
      }
    };

    const onEsc = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen]);

  // compute menu position when opening and close on resize/scroll
  useEffect(() => {
    if (!menuOpen) return undefined;

    const computePos = () => {
      const btn = buttonRef.current;
      const menuWidth = 224; // w-56
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const left = Math.max(8, rect.left + (rect.width / 2) - (menuWidth / 2));
        const top = rect.bottom + 8; // 8px gap
        setMenuPos({ left, top });
      }
    };

    computePos();
    const onResize = () => setMenuOpen(false);
    const onScroll = () => setMenuOpen(false);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [menuOpen]);

  const pageStyles = `
    #mouse-gradient-react { position: fixed; pointer-events: none; border-radius: 9999px; background-image: radial-gradient(circle, rgba(156, 163, 175, 0.06), rgba(107, 114, 128, 0.06), transparent 70%); transform: translate(-50%, -50%); will-change: left, top, opacity; transition: left 70ms linear, top 70ms linear, opacity 300ms ease-out; z-index:0; mix-blend-mode: overlay }
  @keyframes word-appear { 0% { opacity: 0; transform: translateY(30px) scale(0.8); filter: blur(10px); } 50% { opacity: 0.8; transform: translateY(10px) scale(0.95); filter: blur(2px); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
  @keyframes line-draw { 0% { width: 0%; opacity: 0; } 50% { opacity: 0.6 } 100% { width: 100%; opacity: 1; } }
    @keyframes grid-draw { 0% { stroke-dashoffset: 1000; opacity: 0; } 50% { opacity: 0.3; } 100% { stroke-dashoffset: 0; opacity: 0.15; } }
    @keyframes pulse-glow { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.1); } }
    .word-animate { display:inline-block; opacity:0; margin:0 0.1em; transition: color 0.3s ease, transform 0.3s ease }
  /* hide grid lines/dots (requested) */
  .grid-line { display: none; }
  .detail-dot { display: none; }
    .corner-element-animate { position:absolute; width:40px; height:40px; border:1px solid rgba(203,213,225,0.2); opacity:0; animation: word-appear 1s ease-out forwards }
    .floating-element-animate { position:absolute; width:2px; height:2px; background:#cbd5e1; border-radius:50%; opacity:0; animation: float 4s ease-in-out infinite; animation-play-state: paused }
    @keyframes float { 0%,100% { transform: translateY(0) translateX(0); opacity:0.2 } 25% { transform: translateY(-10px) translateX(5px); opacity:0.6 } 50% { transform: translateY(-5px) translateX(-3px); opacity:0.4 } 75% { transform: translateY(-15px) translateX(7px); opacity:0.8 } }
    .ripple-effect { position: fixed; width:4px; height:4px; background: rgba(203,213,225,0.6); border-radius:50%; transform: translate(-50%,-50%); pointer-events:none; animation: pulse-glow 1s ease-out forwards; z-index:9999 }
  /* underline used under hero heading: lowered and with a subtle bluish glow */
  .hero-underline { display:block; height:2px; width:0%; background: linear-gradient(to right, transparent, rgba(96,165,250,0.95), transparent); border-radius:2px; box-shadow: 0 6px 18px rgba(96,165,250,0.12); margin-top:0.6rem; will-change: width, opacity; opacity:0 }
  `;

  // Animate the word fragments when the component mounts
  useEffect(() => {
    const wordElements = document.querySelectorAll('.word-animate');
    wordElements.forEach(word => {
      const delay = parseInt(word.getAttribute('data-delay')) || 0;
      setTimeout(() => {
        if (word) word.style.animation = 'word-appear 1.2s cubic-bezier(.2,.8,.2,1) forwards';
      }, delay);
    });
    // animate the underline if present
    const underline = document.querySelector('.hero-underline');
    if (underline) {
      const uDelay = parseInt(underline.getAttribute('data-delay')) || 0;
      setTimeout(() => {
        underline.style.animation = 'line-draw 1s ease-out forwards';
      }, uDelay);
    }
  }, []);

  const features = [
    {
      icon: FiFileText,
      title: 'Paper Upload',
      description: 'Upload research papers via arXiv links or direct LaTeX files. Our system automatically extracts content and figures.'
    },
    {
      icon: FiZap,
      title: 'AI Script Generation',
      description: 'Generate engaging presentation scripts using advanced AI models like Gemini and GPT for educational content.'
    },
    {
      icon: FiMic,
      title: 'Voice Synthesis',
      description: 'Convert scripts to natural-sounding audio narration with support for multiple languages including Hindi.'
    },
    {
      icon: FiVideo,
      title: 'Video Production',
      description: 'Automatically create professional presentation videos combining slides, narration, and visual elements.'
    },
    {
      icon: FiFilm,
      title: 'Visual Storytelling',
      description: 'Transform research into cinematic narrative videos with AI-generated imagery and engaging storytelling.'
    },
    {
      icon: FiHeadphones,
      title: 'Podcast Generation',
      description: 'Transform research papers into engaging podcast episodes with natural conversations and explanations.'
    },
    {
      icon: FiGitBranch,
      title: 'Mind Map Creation',
      description: 'Generate visual mind maps from arXiv papers to quickly understand research structure and key concepts.'
    }
  ];

  const benefits = [
    'Upload papers from arXiv or LaTeX sources',
    'AI-powered script generation',
    'Multi-language voice synthesis',
    'Professional video output',
    'Customizable slides and content',
    'Export in multiple formats'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white font-primary overflow-hidden relative">
      {/* Header */}
      <header>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SA</span>
              </div>
              <h1 className="text-xl font-semibold text-white">
                Saral AI
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <StarBorder as={Link} to="/visual-storytelling" className="inline-block">
                <div className="text-sm font-medium text-white flex items-center gap-1">
                  <FiFilm className="w-4 h-4" />
                  <span>Visual Story</span>
                </div>
              </StarBorder>
              <StarBorder as={Link} to="/podcast" className="inline-block">
                <div className="text-sm font-medium text-white">Podcast</div>
              </StarBorder>
              <StarBorder as={Link} to="/mindmap" className="inline-block">
                <div className="text-sm font-medium text-white">Mind Map</div>
              </StarBorder>
              <StarBorder as={Link} to="/about" className="inline-block">
                <div className="text-sm font-medium text-white">About</div>
              </StarBorder>

              <Link to="/podcast" className="inline-block bg-white text-black rounded-[14px] px-3 py-2 text-sm font-medium shadow-sm hover:shadow-md transition">
                Podcast
              </Link>
              <ComplexityButton />
        </div>
      </div>
    </div>
  </header>

      {/* Hero Section */}
  <div className="w-full bg-transparent border-b border-neutral-800 text-white py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
    <svg
      className="inline w-5 h-5 mr-1 text-gray-500 dark:text-gray-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4m0 4h.01"
      />
    </svg>
    For the best experience, please use{" "}
    <span className="font-semibold text-white">Google Chrome</span> browser.
  </div>

      {/* Hero Section - DigitalSerenity style visuals but keep existing CTA/buttons */}
      <section className="relative">
        <style>{pageStyles}</style>
  <div className="min-h-[60vh] bg-transparent text-slate-100 font-primary overflow-hidden relative">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <pattern id="gridReactDarkResponsive" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(100, 116, 139, 0.06)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridReactDarkResponsive)" />
            <line x1="0" y1="20%" x2="100%" y2="20%" className="grid-line" style={{ animationDelay: '0.5s' }} />
            <line x1="0" y1="80%" x2="100%" y2="80%" className="grid-line" style={{ animationDelay: '1s' }} />
            <line x1="20%" y1="0" x2="20%" y2="100%" className="grid-line" style={{ animationDelay: '1.5s' }} />
            <line x1="80%" y1="0" x2="80%" y2="100%" className="grid-line" style={{ animationDelay: '2s' }} />
            <circle cx="20%" cy="20%" r="2" className="detail-dot" style={{ animationDelay: '3s' }} />
            <circle cx="80%" cy="20%" r="2" className="detail-dot" style={{ animationDelay: '3.2s' }} />
            <circle cx="20%" cy="80%" r="2" className="detail-dot" style={{ animationDelay: '3.4s' }} />
            <circle cx="80%" cy="80%" r="2" className="detail-dot" style={{ animationDelay: '3.6s' }} />
          </svg>

          <div className="corner-element-animate top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 hidden sm:block" style={{ animationDelay: '4s' }}>
            <div className="absolute top-0 left-0 w-2 h-2 bg-slate-300 opacity-30 rounded-full"></div>
          </div>
          <div className="corner-element-animate top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 hidden sm:block" style={{ animationDelay: '4.2s' }}>
            <div className="absolute top-0 right-0 w-2 h-2 bg-slate-300 opacity-30 rounded-full"></div>
          </div>

          <div className="floating-element-animate hidden sm:block" style={{ top: '25%', left: '15%', animationDelay: '0.5s' }}></div>
          <div className="floating-element-animate hidden sm:block" style={{ top: '60%', left: '85%', animationDelay: '1s' }}></div>
          <div className="floating-element-animate hidden sm:block" style={{ top: '40%', left: '10%', animationDelay: '1.5s' }}></div>
          <div className="floating-element-animate hidden sm:block" style={{ top: '75%', left: '90%', animationDelay: '2s' }}></div>

          <div className="relative z-10 min-h-[48vh] flex flex-col justify-center items-center px-6 py-16 sm:px-8 sm:py-20 md:px-16 md:py-24">
            <div className="text-center mb-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight leading-tight tracking-tight text-white mb-4">
                <span className="word-animate" data-delay="900">Turn Academic Papers Into</span>
                <span className="word-animate" data-delay="1150">Engaging Video Presentations</span>
              </h1>
              <div className="w-full flex justify-center">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-30 hero-underline" style={{ width: '0%' }} data-delay="1250" />
              </div>
              <p className="text-lg sm:text-xl md:text-2xl text-white opacity-90 max-w-3xl mx-auto mt-4">
                <span className="word-animate" data-delay="1500">Seamlessly transform your research papers into professional video presentations using AI-generated scripts, customizable slides, and natural voice narration.</span>
              </p>
            </div>

            <div className="text-center max-w-4xl mx-auto relative">
              <div className="mt-6 flex items-center justify-center gap-3">
                {/* Get Started with dropdown */}
                <div className="relative inline-block">
                  <button
                    ref={buttonRef}
                    onClick={() => setMenuOpen(prev => !prev)}
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                    className="w-56 h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-800/80 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-700/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <span className='text-xl'>Get Started</span>
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                

                  {menuOpen && (
                    <div
                      ref={menuRef}
                      style={{ position: 'fixed', left: `${menuPos.left}px`, top: `${menuPos.top}px` }}
                      className="w-56 bg-neutral-900 text-white rounded-lg shadow-2xl z-50 ring-1 ring-white/10 overflow-hidden"
                    >
                      {/* caret */}
                      <div style={{ position: 'absolute', right: '16px', top: '-8px', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid rgba(15,23,42,1)' }} />
                      <nav className="flex flex-col" aria-label="Get started menu">
                        <Link to="/api-setup" onClick={() => setMenuOpen(false)} className="block px-4 py-3 hover:bg-white/5">Video</Link>
                        <Link to="/mindmap" onClick={() => setMenuOpen(false)} className="block px-4 py-3 hover:bg-white/5">Mind Map</Link>
                        <Link to="/podcast" onClick={() => setMenuOpen(false)} className="block px-4 py-3 hover:bg-white/5">Podcast</Link>
                      </nav>
                    </div>
                  )}
                </div>

                <a href="/sample" className="w-40 h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-800/80 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-700/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                  <div className="text-xl">Learn more</div>
                </a>
              </div>
            </div>
          </div>

          <div 
            id="mouse-gradient-react"
            className="w-60 h-60 blur-xl sm:w-80 sm:h-80 sm:blur-2xl md:w-96 md:h-96 md:blur-3xl"
            style={{
              left: mouseGradientStyle.left,
              top: mouseGradientStyle.top,
              opacity: mouseGradientStyle.opacity,
            }}
          ></div>

          {ripples.map(ripple => (
            <div
              key={ripple.id}
              className="ripple-effect"
              style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }}
            ></div>
          ))}
        </div>
      </section>



      {/* Features Section */}
  <section className="py-24 bg-transparent">
    <div className="max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="text-center mb-16"
      >
                <h2 className="text-3xl font-semibold text-white mb-4">
                  How It Works
                </h2>
                <p className="text-white max-w-2xl mx-auto">
                  Our streamlined workflow transforms your research papers into professional presentation videos in just a few steps.
                </p>
      </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            delay={index * 0.05}
            />
            ))}
      </div>
    </div>
  </section>

      {/* Benefits Section */}
  <section className="py-24 bg-transparent">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
                  <h2 className="text-3xl font-semibold text-white mb-6">
                    Democratize Research Access
                  </h2>
                  <p className="text-white mb-8 leading-relaxed">
                    Make complex research accessible to wider audiences through engaging video presentations. Our AI-powered platform handles the technical complexity while you focus on your content.
                  </p>
          
          <div className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <motion.div
                        key={benefit}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: index * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <FiCheck className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-white opacity-90">
                          {benefit}
                        </span>
                      </motion.div>
                      ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.1 }}
          className="relative"
          >
            <GlowCard className="card p-8 bg-white/95 text-white rounded-xl shadow-sm hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FiVideo className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Ready to Get Started?</h3>
                <p className="text-white/80 mb-6">Join researchers worldwide who are making their work more accessible through video presentations.</p>
                <StarBorder as={Link} to="/api-setup" className="w-full inline-block">
                  <div className="flex items-center justify-center gap-2">Create Your First Video <FiArrowRight className="w-4 h-4 ml-2" /></div>
                </StarBorder>
              </div>
            </GlowCard>
        </motion.div>
    </div>
  </div>
</section>

  {/* Footer */}
<footer className="py-12">
  <div className="max-w-7xl mx-auto px-6 text-center">
      <div className="flex items-center justify-center gap-3 mb-4">
      <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">SA</span>
      </div>
      <span className="text-lg font-semibold text-white">
        Saral AI
      </span>
    </div>
    <p className="text-white opacity-80 mb-6">
      Making research accessible through AI-powered video generation
    </p>
    <div className="flex justify-center gap-6">
      <StarBorder as={Link} to="/about" className="inline-block">
        <div className="text-sm font-medium text-white">About</div>
      </StarBorder>
      <StarBorder as={'a'} href="mailto:democratise.research@gmail.com" className="inline-block">
        <div className="text-sm font-medium text-white">Contact</div>
      </StarBorder>
  </div>
</div>
</footer>
</div>
);
};

export default LandingPage;
