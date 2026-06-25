document.addEventListener('DOMContentLoaded', () => {

    // --- Guest Name ---
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('to');
    if (guestName) {
        const guestEl = document.getElementById('guestName');
        if(guestEl) guestEl.innerText = decodeURIComponent(guestName);
    }

    // --- Lock Scroll Initially ---
    if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    document.body.classList.add('locked');

    // --- Lenis Smooth Scroll ---
    const lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
    });
    lenis.stop(); // Lock scroll completely until button is clicked

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Integrate Lenis with GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000) });
    gsap.ticker.lagSmoothing(0, 0);

    // --- Audio Control (YouTube iframe) ---
    const bgMusic = document.getElementById('youtube-audio')?.contentWindow;
    const musicBtn = document.getElementById('musicBtn');
    let isPlaying = false;

    function playMusic() {
        if(bgMusic) bgMusic.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        isPlaying = true;
        if(musicBtn) musicBtn.innerText = "AUDIO [ON]";
    }

    function toggleMusic() {
        if (isPlaying) {
            if(bgMusic) bgMusic.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            if(musicBtn) musicBtn.innerText = "AUDIO [OFF]";
        } else {
            playMusic();
        }
        isPlaying = !isPlaying;
    }
    if(musicBtn) musicBtn.addEventListener('click', toggleMusic);

    // --- Open Invitation (The Gate) ---
    const btnOpen = document.getElementById('btnOpen');
    if(btnOpen) {
        btnOpen.addEventListener('click', () => {
            playMusic();
            
            // Slide Cover Up (A24 minimalist style)
            gsap.to('#cover', { 
                y: "-100%", 
                duration: 1.5, 
                ease: "power4.inOut",
                onComplete: () => {
                    document.body.classList.remove('locked');
                    lenis.start();
                    document.getElementById('cover').style.display = 'none';
                }
            });
        });
    }

    // --- Page Load Animation ---
    gsap.from('.gate-img', {
        scale: 1.2,
        duration: 3,
        ease: "power3.out"
    });
    gsap.from('.massive-title', {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out",
        delay: 0.5
    });
    gsap.from('.gate-top, .gate-center', {
        opacity: 0,
        duration: 2,
        ease: "power2.out",
        delay: 1
    });

    // --- Scroll Animations ---
    
    // 1. Standard Fade/Slide Up
    const revealElements = document.querySelectorAll('.reveal-up');
    revealElements.forEach(el => {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
            },
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out"
        });
    });

    // 2. Parallax Images (A24 Style)
    const parallaxImages = document.querySelectorAll('.parallax-img');
    parallaxImages.forEach(img => {
        gsap.to(img, {
            scrollTrigger: {
                trigger: img.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            },
            y: "-15%", 
            ease: "none"
        });
    });

    // 3. (Marquee handled seamlessly in CSS)

    // --- Custom Select Logic ---
    const customSelect = document.getElementById('customSelect');
    const attendanceInput = document.getElementById('attendance');
    
    if (customSelect) {
        const trigger = customSelect.querySelector('.custom-select-trigger');
        const options = customSelect.querySelectorAll('.custom-option');
        
        trigger.addEventListener('click', () => {
            customSelect.classList.toggle('open');
        });
        
        options.forEach(option => {
            option.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const text = this.innerText;
                
                trigger.innerText = text;
                trigger.style.color = '#f0f0f0';
                attendanceInput.value = value;
                
                customSelect.classList.remove('open');
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!customSelect.contains(e.target)) {
                customSelect.classList.remove('open');
            }
        });
    }

    // --- RSVP Form ---
    const rsvpForm = document.getElementById('rsvpForm');
    if(rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = rsvpForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            // Get form values
            const name = document.getElementById('name').value;
            const attendance = document.getElementById('attendance').value;
            const message = document.getElementById('message').value;
            
            if(!attendance) {
                alert("Silakan pilih status kehadiran terlebih dahulu.");
                return;
            }

            btn.innerText = '전송 중... (SENDING...)';
            btn.style.opacity = '0.5';
            
            setTimeout(() => {
                btn.innerText = '제출 완료 (RESPONSE SECURED)';
                btn.style.backgroundColor = '#fff';
                btn.style.color = '#000';
                btn.style.opacity = '1';
                
                // Create response element
                const responseList = document.getElementById('responseList');
                const responseItem = document.createElement('div');
                responseItem.className = 'response-item';
                
                const statusText = attendance === 'Hadir' ? 'Hadir' : 'Tidak Hadir';
                
                responseItem.innerHTML = `
                    <div class="response-header">
                        <div class="response-name">${name.replace(/</g, "&lt;")}</div>
                        <div class="response-status">${statusText}</div>
                    </div>
                    <div class="response-message">${message.replace(/</g, "&lt;").replace(/\n/g, '<br>')}</div>
                `;
                
                // Prepend to list
                responseList.prepend(responseItem);
                
                rsvpForm.reset();
                const selectTrigger = document.querySelector('.custom-select-trigger');
                if (selectTrigger) {
                    selectTrigger.innerText = "참석하시겠습니까? (Will you attend?)"; // reset custom select text
                    selectTrigger.style.color = "";
                }
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = '';
                    btn.style.color = '';
                }, 3000);
            }, 1000);
        });
    }
});
