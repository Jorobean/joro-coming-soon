import { ModelViewer } from './model-viewer.js';

document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 3D Model Viewer setup
    const heroImage = document.querySelector('.hero-image');
    const modelViewer = document.getElementById('model-viewer');
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
            heroImage.classList.add('hidden');
            modelViewer.classList.add('active');
        }
    }
    
    function hideModel() {
        console.log('Hiding model...');
        heroImage.classList.remove('hidden');
        modelViewer.classList.remove('active');
    }
    
    // Initialize 3D model when image is clicked
    if (heroImage) {
        heroImage.addEventListener('click', showModel);
    }
    
    // Add close button for 3D model
    if (modelViewer) {
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-model-btn';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.addEventListener('click', hideModel);
        
        // Check if we're on a mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Mobile-specific adjustments
            const mobileCloseButton = document.createElement('button');
            mobileCloseButton.className = 'close-model-btn mobile';
            mobileCloseButton.innerHTML = '<i class="fas fa-times"></i> Close';
            mobileCloseButton.addEventListener('click', hideModel);
            modelViewer.appendChild(mobileCloseButton);
            
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
        } else {
            // Desktop version gets a simple X close button
            modelViewer.appendChild(closeButton);
        }
    }
    
    // Set initial theme based on system preference
    if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-mode');
    }
    
    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
    });
    
    // About popup functionality
    const aboutPopup = document.getElementById('about-popup');
    const aboutCloseBtn = document.querySelector('.about-popup-close');
    const aboutLinks = document.querySelectorAll('a[href="about.html"], .nav-icon[href="about.html"]');
    
    // Open popup when About is clicked
    aboutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            aboutPopup.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
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
}); 