import { ModelViewer } from './model-viewer.js';

document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    (function() {
      var themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', function() {
          document.body.classList.toggle('dark-mode');
          if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('jorobean-theme', 'dark');
          } else {
            localStorage.setItem('jorobean-theme', 'light');
          }
          var sun = themeToggle.querySelector('.fa-sun');
          var moon = themeToggle.querySelector('.fa-moon');
          if (document.body.classList.contains('dark-mode')) {
            sun.style.display = 'inline-block';
            moon.style.display = 'none';
          } else {
            sun.style.display = 'none';
            moon.style.display = 'inline-block';
          }
        });
        // On load, set theme from storage
        var storedTheme = localStorage.getItem('jorobean-theme');
        if (storedTheme === 'dark') {
          document.body.classList.add('dark-mode');
        }
        var sun = themeToggle.querySelector('.fa-sun');
        var moon = themeToggle.querySelector('.fa-moon');
        if (document.body.classList.contains('dark-mode')) {
          sun.style.display = 'inline-block';
          moon.style.display = 'none';
        } else {
          sun.style.display = 'none';
          moon.style.display = 'inline-block';
        }
      }
    })();
    
    // 3D Model Viewer setup
    const modelViewer = document.getElementById('model-viewer');
    const heroImage = document.querySelector('.hero-image');
    let viewer = null;
    let isModelLoaded = false;
    let isLoadingModel = false;
    
    async function initializeViewer() {
        if (!viewer && !isLoadingModel) {
            console.log('Initializing 3D viewer...');
            isLoadingModel = true;
            modelViewer.classList.add('loading');
            
            try {
                // Create the viewer first
                viewer = new ModelViewer('model-viewer');
                console.log('Viewer created, loading model...');
                
                // Check file existence before loading
                try {
                    const response = await fetch('shoe.glb', { method: 'HEAD' });
                    if (!response.ok) {
                        throw new Error(`Model file not found: ${response.status}`);
                    }
                    console.log('Model file exists, proceeding with load');
                } catch (fileError) {
                    console.error('File check failed:', fileError);
                    throw new Error('Could not access model file. Check the filename is correct.');
                }
                
                // Then load the model
                await viewer.loadModel('shoe.glb');
                console.log('Model loaded successfully!');
                isModelLoaded = true;
                
                // Force instant show
                showModel();
            } catch (error) {
                console.error('Failed to load 3D model:', error);
                // Show error message
                const spinner = modelViewer.querySelector('.loading-spinner');
                if (spinner) {
                    spinner.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>Error loading model: ${error.message}</span>`;
                }
            } finally {
                isLoadingModel = false;
                modelViewer.classList.remove('loading');
            }
        }
    }
    
    function showModel() {
        console.log('Showing model...');
        if (!isModelLoaded && !isLoadingModel) {
            initializeViewer();
        }
        
        if (isModelLoaded) {
            modelViewer.classList.add('active');
        }
    }
    
    function hideModel() {
        console.log('Hiding model...');
        modelViewer.classList.remove('active');
    }
    
    // Show model and hide hero image on click
    if (heroImage && modelViewer) {
      heroImage.addEventListener('click', function() {
        heroImage.style.display = 'none';
        modelViewer.style.display = 'block';
        // Wait for DOM to update so model-viewer has real size
        requestAnimationFrame(() => {
          if (!isModelLoaded && !isLoadingModel) {
            initializeViewer();
          } else {
            showModel();
          }
        });
      });
    }

    // Ensure model is hidden by default and hero image is shown
    if (modelViewer) modelViewer.style.display = 'none';
    if (heroImage) heroImage.style.display = 'block';

    // Remove the close (X) button from the 3D model viewer if it exists
    const closeBtn = document.querySelector('.close-model-btn');
    if (closeBtn) closeBtn.remove();

    // Add touch instructions
    const touchInstructions = document.createElement('div');
    touchInstructions.className = 'touch-instructions';
    touchInstructions.innerHTML = 'Rotate: Drag with one finger';
    modelViewer.appendChild(touchInstructions);
    
    // Make touch instructions fade out after 3 seconds
    setTimeout(() => {
        touchInstructions.classList.add('fade-out');
    }, 3000);
    
    // Prevent scrolling when interacting with model
    modelViewer.addEventListener('touchmove', function(e) {
        if (modelViewer.classList.contains('active')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Set initial theme based on system preference
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-mode');
    }
    
    // About popup functionality (works on all pages with .about-btn)
    const aboutPopup = document.getElementById('about-popup');
    const aboutCloseBtn = document.querySelector('.about-popup-close');
    document.querySelectorAll('.about-btn').forEach(aboutBtn => {
        aboutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (aboutPopup) {
                aboutPopup.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            }
        });
    });
    
    // Close popup when close button is clicked
    if (aboutCloseBtn) {
        aboutCloseBtn.addEventListener('click', function() {
            aboutPopup.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable scrolling
        });
    }
    
    // Close popup when clicking outside the content
    if (aboutPopup) {
        aboutPopup.addEventListener('click', function(e) {
            if (e.target === aboutPopup) {
                aboutPopup.classList.remove('active');
                document.body.style.overflow = ''; // Re-enable scrolling
            }
        });
    }
    
    // Close popup with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && aboutPopup.classList.contains('active')) {
            aboutPopup.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    });
    
    // About FAB and Bottom Sheet Modal
    var aboutSheet = document.getElementById('about-bottom-sheet');
    var aboutNavLink = document.querySelector('.about-link');
    var aboutNavIcon = document.querySelector('.about-icon');
    var aboutSheetClose = document.getElementById('about-bottom-sheet-close');

    if (aboutNavLink && aboutSheet) {
      aboutNavLink.addEventListener('click', function(e) {
        e.preventDefault();
        aboutSheet.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    }
    if (aboutNavIcon && aboutSheet) {
      aboutNavIcon.addEventListener('click', function(e) {
        e.preventDefault();
        aboutSheet.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    }
    if (aboutSheetClose && aboutSheet) {
      aboutSheetClose.addEventListener('click', function() {
        aboutSheet.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
    if (aboutSheet) {
      aboutSheet.addEventListener('click', function(e) {
        if (e.target === aboutSheet) {
          aboutSheet.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }
    
    // Auto update year in footer
    const yearSpan = document.getElementById('year');
    const currentYear = new Date().getFullYear();
    yearSpan.textContent = currentYear;
    
    // Pre-order button and scroll down arrow smooth scroll
    const preOrderBtn = document.querySelector('.pre-order-btn');
    const scrollDown = document.querySelector('.scroll-down');
    
    if (preOrderBtn) {
        preOrderBtn.addEventListener('click', function() {
            const preOrderSection = document.querySelector('.pre-order');
            if (preOrderSection) {
                preOrderSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                // If on a different page, redirect to index.html#pre-order
                window.location.href = 'index.html#pre-order';
            }
        });
    }
    
    if (scrollDown) {
        scrollDown.addEventListener('click', function() {
            const featuresSection = document.querySelector('.features');
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Form submission with visual feedback
    const preOrderForm = document.getElementById('pre-order-form');
    
    if (preOrderForm) {
        preOrderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            
            if (name && email) {
                const submitBtn = this.querySelector('.submit-btn');
                submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
                
                // Simulate API call
                setTimeout(() => {
                    // Hide the form
                    this.style.opacity = '0';
                    setTimeout(() => {
                        this.style.display = 'none';
                        
                        // Show success message
                        const successMessage = document.createElement('div');
                        successMessage.className = 'success-message';
                        successMessage.innerHTML = `<i class="fas fa-check-circle"></i> Thank you, ${name}! Your pre-order has been received. We'll contact you at ${email} with further details.`;
                        this.parentNode.appendChild(successMessage);
                        
                        // Fade in the message
                        setTimeout(() => {
                            successMessage.style.opacity = '1';
                        }, 10);
                    }, 300);
                }, 1500);
            }
        });
    }
    
    // Animate elements on scroll
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    function checkAnimateElements() {
        const triggerPoint = window.innerHeight * 0.85;
        
        animateElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < triggerPoint) {
                element.classList.add('animate');
            }
        });
    }
    
    // Initial check
    checkAnimateElements();
    
    // Check on scroll
    window.addEventListener('scroll', checkAnimateElements);
    
    // Preload the model when page loads
    window.addEventListener('load', function() {
        // Small timeout to ensure page is rendered first
        setTimeout(initializeViewer, 1000);
    });
    
    // --- Shoe Color Picker ---
    const colorPicker = document.querySelector('.color-picker');
    const colorBtnOrder = ['grey', 'black', 'coffee', 'green', 'blue', 'orange', 'red'];
    const colorHexMap = {
      'grey': '#555555',
      'black': '#151515',
      'coffee': '#3a2414',
      'green': '#14341b',
      'blue': '#0066ff',
      'orange': '#ff4d00',
      'red': '#8a1010'
    };

    function moveColorSliderToActive() {
        const slider = colorPicker.querySelector('.color-slider');
        const activeBtn = colorPicker.querySelector('.color-btn.active');
        if (!slider || !activeBtn) return;

        // Get button position relative to color-picker
        const pickerRect = colorPicker.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        
        // Calculate left offset (center slider on button)
        const left = btnRect.left - pickerRect.left;
        // Use button width for slider width (for pill stretch)
        const width = btnRect.width;

        // Animate with a stretch if moving far
        const prevLeft = parseFloat(slider.style.left) || 0;
        const distance = Math.abs(left - prevLeft);
        if (distance > width * 1.5) {
            slider.style.transition = 'none';
            slider.style.transform = 'translateY(-50%) scaleX(1.7)';
            setTimeout(() => {
                slider.style.transition = '';
                slider.style.left = left + 'px';
                slider.style.width = width + 'px';
                slider.style.background = window.getComputedStyle(activeBtn).backgroundColor;
                slider.style.transform = 'translateY(-50%) scaleX(1)';
            }, 18);
        } else {
            slider.style.left = left + 'px';
            slider.style.width = width + 'px';
            slider.style.background = window.getComputedStyle(activeBtn).backgroundColor;
            slider.style.transform = 'translateY(-50%) scaleX(1)';
        }
    }

    function setActiveColorBtn(color) {
        if (!colorPicker) return;
        colorPicker.querySelectorAll('.color-btn').forEach(btn => {
            if (btn.getAttribute('data-color') === color) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        moveColorSliderToActive();
    }

    if (colorPicker) {
        colorPicker.addEventListener('click', function(e) {
            if (e.target.classList.contains('color-btn')) {
                const color = e.target.getAttribute('data-color');
                if (viewer && typeof viewer.setShoeColor === 'function') {
                    viewer.setShoeColor(color);
                }
                setActiveColorBtn(color);
                // --- Show 3D model automatically if a color is selected ---
                if (modelViewer && modelViewer.style.display !== 'block') {
                    heroImage.style.display = 'none';
                    modelViewer.style.display = 'block';
                    showModel();
                }
            }
        });
        // Set initial highlight
        setActiveColorBtn('grey');
    }
    // Set default color on model load (always grey, no random)
    function setDefaultColorOnLoad() {
        if (viewer && typeof viewer.setShoeColor === 'function') {
            viewer.setShoeColor('grey');
            setActiveColorBtn('grey');
        }
    }
    // Hook into model load success
    const origInitializeViewer = initializeViewer;
    initializeViewer = async function() {
        await origInitializeViewer();
        setDefaultColorOnLoad();
    }

    window.addEventListener('resize', moveColorSliderToActive);

    // --- Option 2: CSS Gooey/Blur Slider ---
    const gooeySlider = document.createElement('div');
    gooeySlider.className = 'gooey-slider';
    document.querySelector('.color-picker').prepend(gooeySlider);

    let lastGooeyIdx = 0;
    function updateGooeySlider(color) {
      const idx = colorBtnOrder.indexOf(color);
      const btns = document.querySelectorAll('.color-btn');
      const btn = btns[idx];
      if (!btn) return;
      const pickerRect = btn.parentElement.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const left = btnRect.left - pickerRect.left;
      gooeySlider.style.background = colorHexMap[color] || '#8a5c3b';
      document.documentElement.style.setProperty('--pill-color', colorHexMap[color] || '#8a5c3b');

      gooeySlider.style.left = left + 'px';
      gooeySlider.style.width = btnRect.width + 'px';
      gooeySlider.classList.remove('stretch');
      gooeySlider.style.animation = 'none';
      // Force reflow to restart animation
      void gooeySlider.offsetWidth;
      gooeySlider.style.animation = 'gooey-bounce 0.35s cubic-bezier(.45,1.8,.55,1) both';

      lastGooeyIdx = idx;
    }

    // Animate gooey slider on color change
    if (colorPicker) {
      colorPicker.addEventListener('click', function(e) {
        if (e.target.classList.contains('color-btn')) {
          const color = e.target.getAttribute('data-color');
          updateGooeySlider(color);
        }
      });
      // Set initial gooey position
      updateGooeySlider('grey');
    }

    // On resize, keep gooey slider in sync
    window.addEventListener('resize', function() {
      const active = document.querySelector('.color-btn.active');
      if (active) updateGooeySlider(active.getAttribute('data-color'));
    });
}); 