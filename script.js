const API_BASE = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {    // =============================================
    // PARTICLE SYSTEM — Optimized (max 30 particles)
    // =============================================
    const canvas = document.getElementById('particle-canvas');
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isMobile = window.innerWidth <= 768 || isTouchDevice;
    if (canvas && !isMobile) {
        const ctx = canvas.getContext('2d', { alpha: true });
        let particles = [];
        let mouse = { x: -9999, y: -9999 };
        let animFrame;
        let frameCount = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 200);
        }, { passive: true });

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 1.5 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
                this.baseOpacity = Math.random() * 0.4 + 0.1;
                this.opacity = this.baseOpacity;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < 14400) { // 120^2
                    const dist = Math.sqrt(distSq);
                    this.opacity = Math.min(1, this.baseOpacity + (1 - dist / 120) * 0.5);
                } else {
                    this.opacity += (this.baseOpacity - this.opacity) * 0.04;
                }
                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
            }
            draw(isLight) {
                const color = isLight
                    ? `rgba(139,109,46,${this.opacity})`
                    : `rgba(212,168,67,${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            }
        }

        // Max 30 particles
        const count = Math.min(30, Math.floor((canvas.width * canvas.height) / 25000));
        for (let i = 0; i < count; i++) particles.push(new Particle());

        const drawConnections = (isLight) => {
            // Only draw connections every other frame
            if (frameCount % 2 !== 0) return;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < 6400) { // 80px^2
                        const alpha = (1 - Math.sqrt(distSq) / 80) * 0.12;
                        ctx.strokeStyle = isLight
                            ? `rgba(139,109,46,${alpha})`
                            : `rgba(212,168,67,${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            frameCount++;
            const isLight = document.body.classList.contains('light-theme');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(isLight); });
            drawConnections(isLight);
            animFrame = requestAnimationFrame(animate);
        };
        animate();

        document.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        }, { passive: true });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) cancelAnimationFrame(animFrame);
            else animate();
        });
    }

    // =============================================
    // CURSOR GLOW — GPU-accelerated via transform
    // =============================================
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow && window.innerWidth > 768 && !isTouchDevice) {
        let glowX = 0, glowY = 0, targetX = 0, targetY = 0;
        document.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        }, { passive: true });
        const updateGlow = () => {
            glowX += (targetX - glowX) * 0.08;
            glowY += (targetY - glowY) * 0.08;
            // Use transform instead of left/top — no layout thrash
            cursorGlow.style.transform = `translate(calc(${glowX}px - 50%), calc(${glowY}px - 50%))`;
            requestAnimationFrame(updateGlow);
        };
        // Override CSS to use transform origin instead
        cursorGlow.style.left = '0';
        cursorGlow.style.top = '0';
        updateGlow();
    }    // =============================================
    // SMOOTH SCROLL
    // =============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                // Close mobile menu if open
                const navLinks = document.getElementById('nav-links');
                const hamburger = document.getElementById('hamburger');
                if (navLinks) navLinks.classList.remove('open');
                if (hamburger) hamburger.classList.remove('active');
                removeOverlay();
            }
        });
    });

    // =============================================
    // NAVBAR SCROLL EFFECT
    // =============================================
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });

    // =============================================
    // HAMBURGER MENU
    // =============================================
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    let overlay = null;

    const createOverlay = () => {
        overlay = document.createElement('div');
        overlay.classList.add('nav-overlay', 'active');
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger.classList.remove('active');
            removeOverlay();
        });
    };

    const removeOverlay = () => {
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => { if (overlay) { overlay.remove(); overlay = null; } }, 300);
        }
    };

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('open');
            if (navLinks.classList.contains('open')) {
                createOverlay();
            } else {
                removeOverlay();
            }
        });
    }

    // =============================================
    // THEME TOGGLER — Bouncy Toggle in navbar
    // =============================================
    const currentTheme = localStorage.getItem('theme');
    const isInitiallyLight = currentTheme === 'light';
    if (isInitiallyLight) document.body.classList.add('light-theme');

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        // Wire it up as a BouncyToggle after BouncyToggle factory is defined
        // (factory is defined later in this DOMContentLoaded — we call it inline here)
        function makeThemeToggle() {
            // Dark = checked, Light = unchecked
            const isDark = !document.body.classList.contains('light-theme');
            if (isDark) {
                themeToggleBtn.classList.add('checked');
                themeToggleBtn.setAttribute('aria-checked', 'true');
            } else {
                themeToggleBtn.classList.remove('checked');
                themeToggleBtn.setAttribute('aria-checked', 'false');
            }

            themeToggleBtn.addEventListener('mousedown', () => themeToggleBtn.classList.add('pressed'));
            themeToggleBtn.addEventListener('mouseup', () => themeToggleBtn.classList.remove('pressed'));
            themeToggleBtn.addEventListener('mouseleave', () => themeToggleBtn.classList.remove('pressed'));

            themeToggleBtn.addEventListener('click', () => {
                const nowDark = themeToggleBtn.getAttribute('aria-checked') === 'true';
                // Toggle to opposite
                if (nowDark) {
                    // Switch to light
                    document.body.classList.add('light-theme');
                    localStorage.setItem('theme', 'light');
                    themeToggleBtn.classList.remove('checked');
                    themeToggleBtn.setAttribute('aria-checked', 'false');
                } else {
                    // Switch to dark
                    document.body.classList.remove('light-theme');
                    localStorage.setItem('theme', 'dark');
                    themeToggleBtn.classList.add('checked');
                    themeToggleBtn.setAttribute('aria-checked', 'true');
                }
                // Ripple
                const ripple = themeToggleBtn.querySelector('.bouncy-toggle-ripple');
                if (ripple) {
                    themeToggleBtn.classList.remove('rippling');
                    void themeToggleBtn.offsetWidth;
                    themeToggleBtn.classList.add('rippling');
                    setTimeout(() => themeToggleBtn.classList.remove('rippling'), 650);
                }
            });
        }
        makeThemeToggle();
    }

    // =============================================
    // TYPED TEXT ANIMATION
    // =============================================
    const typedEl = document.getElementById('typed-text');
    if (typedEl) {
        const phrases = [
            'B.Tech CSE (AI) Student',
            'Aspiring Full Stack Developer',
            'Creative Problem Solver',
            'Freelance Web Developer'
        ];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 80;

        const typeLoop = () => {
            const currentPhrase = phrases[phraseIndex];

            if (isDeleting) {
                typedEl.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 40;
            } else {
                typedEl.textContent = currentPhrase.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 80;
            }

            if (!isDeleting && charIndex === currentPhrase.length) {
                typeSpeed = 2000; // Pause at end
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                typeSpeed = 400; // Pause before next phrase
            }

            setTimeout(typeLoop, typeSpeed);
        };
        setTimeout(typeLoop, 800);
    }



    // =============================================
    // INTERSECTION OBSERVER — Element Animations
    // =============================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show-anim');
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.card, .section-header, .hero-content > *');
    animatedElements.forEach((el, index) => {
        el.classList.add('hidden-anim');
        if (el.parentElement && el.parentElement.classList.contains('hero-content')) {
            el.style.transitionDelay = `${index * 0.15}s`;
        }
        observer.observe(el);
    });

    // =============================================
    // SECTION REVEAL — Whole sections animate in
    // =============================================
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                sectionObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: "0px 0px -80px 0px" });

    document.querySelectorAll('.reveal-section').forEach(section => {
        sectionObserver.observe(section);
    });

    // =============================================
    // MAGNETIC HOVER EFFECT
    // =============================================
    const magneticElements = document.querySelectorAll('.magnetic');
    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0, 0)';
            el.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            setTimeout(() => { el.style.transition = ''; }, 400);
        });
    });

    // =============================================
    // INTERACTIVE SKILLS SYSTEM
    // =============================================
    const skillBtns = document.querySelectorAll('.skill-btn');
    const skillIcon = document.getElementById('skill-popup-icon');
    const skillName = document.getElementById('skill-popup-name');

    skillBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            skillBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const iconClass = btn.getAttribute('data-icon');
            const name = btn.getAttribute('data-name');
            const color = btn.getAttribute('data-color') || '#00f0ff';

            // Reset + apply pixel animation
            skillIcon.className = '';
            void skillIcon.offsetWidth;

            skillIcon.className = `${iconClass} pixel-anim`;
            skillIcon.style.color = color;
            skillIcon.style.filter = `drop-shadow(0 0 30px ${color})`;

            skillName.textContent = name;
            skillName.style.color = color;

            skillName.classList.remove('pixel-anim');
            void skillName.offsetWidth;
            skillName.classList.add('pixel-anim');
        });
    });

    // =============================================
    // HERO PARALLAX ON MOUSE MOVE
    // =============================================
    const heroContent = document.querySelector('.hero-content');
    if (heroContent && window.innerWidth > 768 && !isTouchDevice) {
        document.addEventListener('mousemove', (e) => {
            const xOffset = (e.clientX / window.innerWidth - 0.5) * 12;
            const yOffset = (e.clientY / window.innerHeight - 0.5) * 6;
            heroContent.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        }, { passive: true });
    }

    // =============================================
    // BOUNCY TOGGLE — Reusable factory
    // =============================================
    function BouncyToggle(btnEl, onChange) {
        let checked = btnEl.classList.contains('checked');

        function triggerRipple() {
            const ripple = btnEl.querySelector('.bouncy-toggle-ripple');
            if (!ripple) return;
            btnEl.classList.remove('rippling');
            void btnEl.offsetWidth; // reflow
            btnEl.classList.add('rippling');
            setTimeout(() => btnEl.classList.remove('rippling'), 650);
        }

        btnEl.addEventListener('mousedown', () => btnEl.classList.add('pressed'));
        btnEl.addEventListener('mouseup', () => btnEl.classList.remove('pressed'));
        btnEl.addEventListener('mouseleave', () => btnEl.classList.remove('pressed'));

        btnEl.addEventListener('click', () => {
            checked = !checked;
            btnEl.classList.toggle('checked', checked);
            btnEl.setAttribute('aria-checked', String(checked));
            triggerRipple();
            if (typeof onChange === 'function') onChange(checked);
        });

        return {
            setChecked(val) {
                checked = val;
                btnEl.classList.toggle('checked', checked);
                btnEl.setAttribute('aria-checked', String(checked));
            },
            isChecked() { return checked; }
        };
    }

    // =============================================
    // ADMIN PANEL SYSTEM
    // =============================================

    const panelBtn = document.getElementById('admin-panel-btn');
    const panelOverlay = document.getElementById('admin-panel-overlay');
    const panelClose = document.getElementById('admin-panel-close');
    const loginSection = document.getElementById('admin-login-section');
    const controlsSection = document.getElementById('admin-controls');
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('admin-login-error');
    const adminPanelSubtitle = document.getElementById('admin-panel-subtitle');
    const adminBtnIcon = document.getElementById('admin-btn-icon');
    const logoutBtn = document.getElementById('admin-logout-btn');

    let adminLoggedIn = false;

    function openPanel() {
        panelOverlay.classList.add('open');
        panelBtn.classList.add('panel-open');
        // Focus first input if on login page
        if (!adminLoggedIn) {
            setTimeout(() => {
                const inp = document.getElementById('admin-id-input');
                if (inp) inp.focus();
            }, 350);
        }
    }

    function closePanel() {
        panelOverlay.classList.remove('open');
        panelBtn.classList.remove('panel-open');
    }

    panelBtn.addEventListener('click', openPanel);
    panelClose.addEventListener('click', closePanel);

    // Close on overlay background click
    panelOverlay.addEventListener('click', (e) => {
        if (e.target === panelOverlay) closePanel();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panelOverlay.classList.contains('open')) closePanel();
    });

    // --- Login form submit ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('admin-id-input').value.trim();
        const pass = document.getElementById('admin-pass-input').value;

        try {
            const res = await fetch(API_BASE + '/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: id, password: pass })
            });
            const data = await res.json();

            if (res.ok && data.token) {
                adminLoggedIn = true;
                localStorage.setItem('adminToken', data.token);
                loginSection.style.display = 'none';
                controlsSection.classList.add('visible');
                adminPanelSubtitle.textContent = 'Welcome back, Dhruv!';
                adminBtnIcon.className = 'fas fa-unlock';
                loginError.textContent = '';
            } else {
                loginError.textContent = '✗ ' + (data.error || 'Incorrect ID or Password');
                document.getElementById('admin-id-input').focus();
                setTimeout(() => { loginError.textContent = ''; }, 3000);
            }
        } catch (err) {
            loginError.textContent = '✗ Server Connection Error';
            setTimeout(() => { loginError.textContent = ''; }, 3000);
        }
    });

    // --- Logout ---
    logoutBtn.addEventListener('click', () => {
        adminLoggedIn = false;
        localStorage.removeItem('adminToken');
        // Deactivate edit mode if active
        if (editModeToggle.isChecked()) {
            editModeToggle.setChecked(false);
            deactivateEditMode();
        }
        loginSection.style.display = '';
        controlsSection.classList.remove('visible');
        adminPanelSubtitle.textContent = 'Sign in to manage your portfolio';
        adminBtnIcon.className = 'fas fa-lock';
        document.getElementById('admin-id-input').value = '';
        document.getElementById('admin-pass-input').value = '';
        closePanel();
    });


    // =============================================
    // BOUNCY TOGGLE — EDIT MODE
    // =============================================
    const editmodeBouncyBtn = document.getElementById('editmode-bouncy-toggle');

    function activateEditMode() {
        document.body.classList.add('admin-mode');
        document.querySelectorAll('.editable').forEach(el => {
            el.setAttribute('contenteditable', 'true');
            el.addEventListener('click', preventDefaultInAdmin);
        });
    }

    function deactivateEditMode() {
        document.body.classList.remove('admin-mode');
        const currentData = JSON.parse(localStorage.getItem('portfolioContent') || '{}');
        document.querySelectorAll('.editable').forEach(el => {
            el.setAttribute('contenteditable', 'false');
            el.removeEventListener('click', preventDefaultInAdmin);
            const key = el.getAttribute('data-key');
            if (key) currentData[key] = el.innerHTML;
        });
        localStorage.setItem('portfolioContent', JSON.stringify(currentData));
    }

    function preventDefaultInAdmin(e) {
        if (e.target.tagName === 'A') e.preventDefault();
    }

    // Load saved content on page load
    const savedData = JSON.parse(localStorage.getItem('portfolioContent') || '{}');
    document.querySelectorAll('.editable').forEach(el => {
        const key = el.getAttribute('data-key');
        if (savedData[key]) el.innerHTML = savedData[key];
    });

    const editModeToggle = BouncyToggle(editmodeBouncyBtn, (isOn) => {
        if (isOn) activateEditMode();
        else deactivateEditMode();
    });

    // =============================================
    // BOUNCY TOGGLE — ADMIN PLAN
    // =============================================
    const planBouncyBtn = document.getElementById('plan-bouncy-toggle');
    const planBadge = document.getElementById('admin-plan-badge');
    const savedPlan = localStorage.getItem('adminPlan') || 'basic';

    const planToggle = BouncyToggle(planBouncyBtn, (isPremium) => {
        planBadge.textContent = isPremium ? 'Premium' : 'Basic';
        planBadge.classList.toggle('premium', isPremium);
        localStorage.setItem('adminPlan', isPremium ? 'premium' : 'basic');
    });

    if (savedPlan === 'premium') {
        planToggle.setChecked(true);
        planBadge.textContent = 'Premium';
        planBadge.classList.add('premium');
    }

    // =============================================
    // BGM — Public Floating Player (FAB)
    // =============================================
    const bgmPlayer = document.getElementById('bgm-player');
    const bgmFab = document.getElementById('bgm-fab');
    const bgmBouncyBtn = document.getElementById('bgm-bouncy-toggle');
    const bgmAudio = document.getElementById('bgm-audio');
    const bgmVolumeSlider = document.getElementById('bgm-volume');

    // FAB click = open / close the tray
    bgmFab.addEventListener('click', (e) => {
        e.stopPropagation();
        bgmPlayer.classList.toggle('tray-open');
    });

    // Close tray when clicking outside
    document.addEventListener('click', (e) => {
        if (bgmPlayer && !bgmPlayer.contains(e.target)) {
            bgmPlayer.classList.remove('tray-open');
        }
    });

    const bgmToggle = BouncyToggle(bgmBouncyBtn, (isOn) => {
        if (isOn) {
            bgmAudio.volume = bgmVolumeSlider ? bgmVolumeSlider.value / 100 : 0.5;
            bgmAudio.play().catch(() => {
                bgmToggle.setChecked(false);
                bgmPlayer.classList.remove('playing');
            });
            bgmPlayer.classList.add('playing');
        } else {
            bgmAudio.pause();
            bgmPlayer.classList.remove('playing');
        }
    });

    if (bgmVolumeSlider) {
        bgmVolumeSlider.addEventListener('input', () => {
            bgmAudio.volume = bgmVolumeSlider.value / 100;
        });
    }

}); // END DOMContentLoaded

// =============================================
// CURSOR TRAIL — Spring-physics colorful lines
// =============================================
(function () {
    if (window.innerWidth <= 768 || 'ontouchstart' in window) return;
    const trailCanvas = document.getElementById('trail-canvas');
    if (!trailCanvas) return;

    const ctx = trailCanvas.getContext('2d');
    ctx.running = true;
    ctx.frame = 1;

    let pos = { x: 0, y: 0 };
    let lines = [];

    const E = { friction: 0.5, trails: 25, size: 30, dampening: 0.025, tension: 0.99 };

    function Oscillator(opts) {
        this.phase = opts.phase || 0;
        this.offset = opts.offset || 0;
        this.frequency = opts.frequency || 0.001;
        this.amplitude = opts.amplitude || 1;
    }
    Oscillator.prototype.update = function () {
        this.phase += this.frequency;
        return this.offset + Math.sin(this.phase) * this.amplitude;
    };

    function Node() { this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; }

    function TrailLine(springVal) {
        this.spring = springVal + 0.1 * Math.random() - 0.05;
        this.friction = E.friction + 0.01 * Math.random() - 0.005;
        this.nodes = [];
        for (let i = 0; i < E.size; i++) {
            const n = new Node();
            n.x = pos.x; n.y = pos.y;
            this.nodes.push(n);
        }
    }
    TrailLine.prototype.update = function () {
        let spring = this.spring;
        let node = this.nodes[0];
        node.vx += (pos.x - node.x) * spring;
        node.vy += (pos.y - node.y) * spring;
        for (let i = 0, len = this.nodes.length; i < len; i++) {
            node = this.nodes[i];
            if (i > 0) {
                const prev = this.nodes[i - 1];
                node.vx += (prev.x - node.x) * spring;
                node.vy += (prev.y - node.y) * spring;
                node.vx += prev.vx * E.dampening;
                node.vy += prev.vy * E.dampening;
            }
            node.vx *= this.friction;
            node.vy *= this.friction;
            node.x += node.vx;
            node.y += node.vy;
            spring *= E.tension;
        }
    };
    TrailLine.prototype.draw = function () {
        let x = this.nodes[0].x, y = this.nodes[0].y;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 1, len = this.nodes.length - 2; i < len; i++) {
            const a = this.nodes[i];
            const b = this.nodes[i + 1];
            x = 0.5 * (a.x + b.x);
            y = 0.5 * (a.y + b.y);
            ctx.quadraticCurveTo(a.x, a.y, x, y);
        }
        const a = this.nodes[this.nodes.length - 2];
        const b = this.nodes[this.nodes.length - 1];
        ctx.quadraticCurveTo(a.x, a.y, b.x, b.y);
        ctx.stroke();
        ctx.closePath();
    };

    const hueOsc = new Oscillator({
        phase: Math.random() * 2 * Math.PI,
        amplitude: 85,
        frequency: 0.0015,
        offset: 40,
    });

    function initLines() {
        lines = [];
        for (let i = 0; i < E.trails; i++) {
            lines.push(new TrailLine(0.45 + (i / E.trails) * 0.025));
        }
    }

    function resizeTrail() {
        trailCanvas.width = window.innerWidth;
        trailCanvas.height = window.innerHeight;
    }
    resizeTrail();
    window.addEventListener('resize', resizeTrail, { passive: true });

    let trailStarted = false;
    let rafId;

    function renderTrail() {
        if (!ctx.running) return;
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `hsla(${Math.round(hueOsc.update())}, 90%, 60%, 0.03)`;
        ctx.lineWidth = 8;
        lines.forEach(line => { line.update(); line.draw(); });
        ctx.frame++;
        rafId = requestAnimationFrame(renderTrail);
    }

    function startTrail(e) {
        pos.x = e.touches ? e.touches[0].pageX : e.clientX;
        pos.y = e.touches ? e.touches[0].pageY : e.clientY;
        if (!trailStarted) {
            trailStarted = true;
            initLines();
            renderTrail();
        }
    }

    function moveTrail(e) {
        pos.x = e.touches ? e.touches[0].pageX : e.clientX;
        pos.y = e.touches ? e.touches[0].pageY : e.clientY;
    }

    document.addEventListener('mousemove', startTrail, { once: true });
    document.addEventListener('touchstart', startTrail, { once: true, passive: true });
    document.addEventListener('mousemove', moveTrail, { passive: true });
    document.addEventListener('touchmove', moveTrail, { passive: true });

    document.addEventListener('visibilitychange', () => {
        ctx.running = !document.hidden;
        if (!document.hidden && trailStarted) { cancelAnimationFrame(rafId); renderTrail(); }
    });
    window.addEventListener('focus', () => { ctx.running = true; if (trailStarted) { cancelAnimationFrame(rafId); renderTrail(); } });
    window.addEventListener('blur', () => { ctx.running = false; });
})();


// =============================================
// GLOWING CARD BORDER — Mouse angle tracking
// =============================================
(function () {
    if (window.innerWidth <= 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) return;
    const cards = document.querySelectorAll('.card');
    const proximity = 80;

    cards.forEach(card => {
        let currentAngle = 0;
        let rafId;

        const handleMove = (e) => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                const isNear =
                    mouseX > rect.left - proximity &&
                    mouseX < rect.right + proximity &&
                    mouseY > rect.top - proximity &&
                    mouseY < rect.bottom + proximity;

                if (!isNear) {
                    card.style.setProperty('--active', '0');
                    return;
                }
                card.style.setProperty('--active', '1');

                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                let targetAngle = (180 * Math.atan2(mouseY - cy, mouseX - cx)) / Math.PI + 90;
                const diff = ((targetAngle - currentAngle + 180) % 360) - 180;
                currentAngle += diff * 0.15;

                card.style.setProperty('--start', String(currentAngle));
            });
        };

        const handleLeave = () => {
            card.style.setProperty('--active', '0');
        };

        document.addEventListener('pointermove', handleMove, { passive: true });
        card.addEventListener('mouseleave', handleLeave);
    });
})();

// =============================================
// CONTACT FORM HANDLER
// =============================================
(function () {
    const contactForm = document.getElementById('contact-form');
    const contactStatus = document.getElementById('contact-status');
    const submitBtn = document.getElementById('contact-submit');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const message = document.getElementById('contact-message').value;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin" style="margin-left:8px;"></i>';
            contactStatus.className = 'form-status';
            contactStatus.textContent = '';

            try {
                const res = await fetch(API_BASE + '/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });
                const data = await res.json();

                if (res.ok) {
                    contactStatus.textContent = 'Message sent successfully!';
                    contactStatus.classList.add('success');
                    contactForm.reset();
                } else {
                    contactStatus.textContent = data.error || 'Failed to send message.';
                    contactStatus.classList.add('error');
                }
            } catch (err) {
                contactStatus.textContent = 'Network error. Could not connect to server.';
                contactStatus.classList.add('error');
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Send Message</span> <i class="fas fa-paper-plane" style="margin-left:8px;"></i>';
            setTimeout(() => { contactStatus.textContent = ''; contactStatus.className = 'form-status'; }, 5000);
        });
    }
})();



// =============================================
// SIMPLE PROJECT GRID — Replaces radial gallery
// =============================================
(async function () {
    var DEFAULT_PROJECTS = [
        { id: 1, title: 'Portfolio Site', cat: 'Web Dev', img: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=400&q=80', url: '' },
        { id: 2, title: 'Nebula UI', cat: 'Design', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', url: '' },
        { id: 3, title: 'Oceanic', cat: 'Nature', img: 'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?auto=format&fit=crop&w=400&q=80', url: '' },
        { id: 4, title: 'Neon App', cat: 'Tech', img: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&q=80', url: '' },
        { id: 5, title: 'Desert Walk', cat: 'Travel', img: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&w=400&q=80', url: '' },
        { id: 6, title: 'Decay Study', cat: 'Photo', img: 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&w=400&q=80', url: '' },
    ];

    var gridEl = document.getElementById('projects-grid');
    if (!gridEl) return;

    async function loadProjects() {
        try {
            const res = await fetch(API_BASE + '/api/projects');
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) return data;
            }
        } catch (e) { }
        return DEFAULT_PROJECTS.map(function (p) { return Object.assign({}, p); });
    }

    async function saveProjects(projects) {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(API_BASE + '/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? 'Bearer ' + token : ''
                },
                body: JSON.stringify(projects)
            });
        } catch (e) { }
    }

    var PROJECTS = await loadProjects();

    // Merge defaults
    (async function mergeDefaults() {
        var existingIds = {};
        PROJECTS.forEach(function (p) { existingIds[p.id] = true; });
        var added = false;
        DEFAULT_PROJECTS.forEach(function (dp) {
            if (!existingIds[dp.id]) {
                PROJECTS.push(Object.assign({}, dp));
                added = true;
            }
        });
        if (added) {
            await saveProjects(PROJECTS);
        }
    })();

    function buildGrid() {
        gridEl.innerHTML = '';
        PROJECTS.forEach(function (p) {
            var hasUrl = p.url && p.url.trim() !== '';
            var tag = hasUrl ? 'a' : 'div';
            var card = document.createElement(tag);
            card.className = 'project-card';
            if (hasUrl) {
                card.href = p.url;
                card.target = '_blank';
                card.rel = 'noopener noreferrer';
            }
            card.innerHTML =
                '<div class="project-card-img"><img src="' + (p.img || '') + '" alt="' + p.title + '" loading="lazy" decoding="async"></div>' +
                '<div class="project-card-body">' +
                '<span class="project-card-badge">' + (p.cat || '') + '</span>' +
                '<h3 class="project-card-title">' + p.title + '</h3>' +
                (hasUrl ? '<span class="project-card-link-icon">&#8599;</span>' : '') +
                '</div>';
            gridEl.appendChild(card);
        });
    }

    buildGrid();

    // Expose rebuild for admin
    window._radialRebuild = async function () {
        PROJECTS = await loadProjects();
        buildGrid();
    };
})();

// =============================================
// LAZY LOADING — IntersectionObserver for images
// =============================================
(function () {
    // Convert any img with data-src to lazy-loaded
    var lazyImgs = document.querySelectorAll('img[data-src]');
    if (!lazyImgs.length) return;

    if ('IntersectionObserver' in window) {
        var imgObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var img = entry.target;
                    img.src = img.getAttribute('data-src');
                    img.removeAttribute('data-src');
                    img.classList.add('lazy-loaded');
                    imgObserver.unobserve(img);
                }
            });
        }, { rootMargin: '200px 0px' });

        lazyImgs.forEach(function (img) { imgObserver.observe(img); });
    } else {
        // Fallback: load all immediately
        lazyImgs.forEach(function (img) {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
    }
})();


// =============================================
// ADMIN — PROJECT MANAGER
// =============================================
(async function () {
    var projList = document.getElementById('admin-proj-list');
    var addBtn = document.getElementById('admin-add-proj-btn');
    var editModal = document.getElementById('proj-edit-modal');
    var editBack = document.getElementById('proj-edit-back');
    var editTitle = document.getElementById('proj-edit-modal-title');
    var titleInput = document.getElementById('proj-title-input');
    var catInput = document.getElementById('proj-cat-input');
    var urlInput = document.getElementById('proj-url-input');
    var imgFile = document.getElementById('proj-img-file');
    var imgPreview = document.getElementById('proj-img-preview');
    var imgUploadArea = document.getElementById('proj-img-upload-area');
    var saveBtn = document.getElementById('proj-save-btn');

    if (!projList || !addBtn || !editModal) return;

    // ── Load / save ──
    async function loadProjects() {
        try {
            const res = await fetch(API_BASE + '/api/projects');
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) return data;
            }
        } catch (e) { }
        return [];
    }

    async function saveProjects(projects) {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(API_BASE + '/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? 'Bearer ' + token : ''
                },
                body: JSON.stringify(projects)
            });
        } catch (e) { }
    }

    var editingId = null;  // null = new project
    var pendingImg = null; // base64 data URL for pending upload

    // ── Render list ──
    async function renderList() {
        var projects = await loadProjects();
        projList.innerHTML = '';
        if (projects.length === 0) {
            projList.innerHTML = '<p style="font-size:0.75rem;color:var(--text-secondary);text-align:center;padding:0.5rem">No projects yet</p>';
            return;
        }
        projects.forEach(function (p) {
            var item = document.createElement('div');
            item.className = 'admin-proj-item';

            var thumb;
            if (p.img) {
                thumb = document.createElement('img');
                thumb.className = 'admin-proj-thumb';
                thumb.src = p.img;
                thumb.alt = p.title;
            } else {
                thumb = document.createElement('div');
                thumb.className = 'admin-proj-thumb placeholder';
                thumb.innerHTML = '<i class="fas fa-image"></i>';
            }

            var info = document.createElement('div');
            info.className = 'admin-proj-info';
            info.innerHTML =
                '<div class="admin-proj-name">' + (p.title || 'Untitled') + '</div>' +
                '<div class="admin-proj-meta">' + (p.cat || '') + (p.url ? ' · 🔗' : '') + '</div>';

            var editBtn = document.createElement('button');
            editBtn.className = 'admin-proj-edit-btn';
            editBtn.innerHTML = '<i class="fas fa-pen"></i>';
            editBtn.title = 'Edit';
            editBtn.addEventListener('click', function () { openEdit(p.id); });

            var delBtn = document.createElement('button');
            delBtn.className = 'admin-proj-del-btn';
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.title = 'Delete';
            delBtn.addEventListener('click', function () { deleteProject(p.id); });

            item.appendChild(thumb);
            item.appendChild(info);
            item.appendChild(editBtn);
            item.appendChild(delBtn);
            projList.appendChild(item);
        });
    }

    // ── Open edit modal ──
    async function openEdit(id) {
        var projects = await loadProjects();
        var p = id ? projects.find(function (x) { return x.id === id; }) : null;

        editingId = id || null;
        pendingImg = null;
        imgPreview.classList.remove('visible');
        imgPreview.src = '';

        if (p) {
            editTitle.textContent = 'Edit Project';
            titleInput.value = p.title || '';
            catInput.value = p.cat || '';
            urlInput.value = p.url || '';
            if (p.img) {
                imgPreview.src = p.img;
                imgPreview.classList.add('visible');
            }
        } else {
            editTitle.textContent = 'Add Project';
            titleInput.value = '';
            catInput.value = '';
            urlInput.value = '';
        }

        editModal.classList.add('open');
    }

    function closeEdit() {
        editModal.classList.remove('open');
        pendingImg = null;
        if (imgFile) imgFile.value = '';
    }

    // ── Delete ──
    async function deleteProject(id) {
        var projects = await loadProjects();
        projects = projects.filter(function (p) { return p.id !== id; });
        await saveProjects(projects);
        await renderList();
        if (typeof window._radialRebuild === 'function') window._radialRebuild();
    }

    // ── Save ──
    saveBtn.addEventListener('click', async function () {
        var projects = await loadProjects();
        var title = titleInput.value.trim();
        var cat = catInput.value.trim();
        var url = urlInput.value.trim();

        if (!title) {
            titleInput.focus();
            titleInput.style.borderColor = '#ef4444';
            setTimeout(function () { titleInput.style.borderColor = ''; }, 1500);
            return;
        }

        if (editingId) {
            // Update existing
            projects = projects.map(function (p) {
                if (p.id === editingId) {
                    return {
                        id: p.id,
                        title: title,
                        cat: cat,
                        img: pendingImg || p.img || '',
                        url: url
                    };
                }
                return p;
            });
        } else {
            // Add new
            var newId = Date.now();
            projects.push({ id: newId, title: title, cat: cat, img: pendingImg || '', url: url });
        }

        await saveProjects(projects);
        await renderList();
        closeEdit();
        if (typeof window._radialRebuild === 'function') window._radialRebuild();
    });

    // ── Image file input ──
    imgFile.addEventListener('change', function () {
        var file = imgFile.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            pendingImg = e.target.result;
            imgPreview.src = pendingImg;
            imgPreview.classList.add('visible');
        };
        reader.readAsDataURL(file);
    });

    // Drag-over styling
    imgUploadArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        imgUploadArea.classList.add('drag-over');
    });
    imgUploadArea.addEventListener('dragleave', function () {
        imgUploadArea.classList.remove('drag-over');
    });
    imgUploadArea.addEventListener('drop', function (e) {
        e.preventDefault();
        imgUploadArea.classList.remove('drag-over');
        var file = e.dataTransfer && e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            var reader = new FileReader();
            reader.onload = function (ev) {
                pendingImg = ev.target.result;
                imgPreview.src = pendingImg;
                imgPreview.classList.add('visible');
            };
            reader.readAsDataURL(file);
        }
    });

    // ── Listeners ──
    addBtn.addEventListener('click', function () { openEdit(null); });
    editBack.addEventListener('click', closeEdit);

    // Init
    renderList();

    // Re-render when admin panel opens (picks up changes)
    var adminPanelBtn = document.getElementById('admin-panel-btn');
    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', function () {
            setTimeout(renderList, 100);
        });
    }
})();
