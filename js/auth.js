// Authentication Module for Time Capsule

// Auth state management
let currentUser = null;

// DOM Elements
let authContainer;
let loginForm;
let signupForm;
let authTabs;
let userProfile;
let authButtons;

// Initialize auth functionality
function initAuth() {
    // Create auth elements if they don't exist
    if (!document.getElementById('authContainer')) {
        createAuthUI();
    }
    
    // Cache DOM elements
    authContainer = document.getElementById('authContainer');
    loginForm = document.getElementById('loginForm');
    signupForm = document.getElementById('signupForm');
    authTabs = document.querySelectorAll('.auth-tab');
    userProfile = document.getElementById('userProfile');
    authButtons = document.getElementById('authButtons');
    
    // Add event listeners
    document.getElementById('loginButton').addEventListener('click', () => showAuthModal('login'));
    document.getElementById('signupButton').addEventListener('click', () => showAuthModal('signup'));
    document.getElementById('authClose').addEventListener('click', hideAuthModal);
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
    
    // Initialize dropdown toggle
    const dropdownToggle = document.getElementById('dropdownToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    dropdownToggle.addEventListener('click', () => {
        dropdownMenu.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.user-dropdown') && dropdownMenu.classList.contains('active')) {
            dropdownMenu.classList.remove('active');
        }
    });
    
    // Add password toggle functionality
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '🔒';
        });
    });
    
    // Check if user is already logged in
    checkAuthState();
}

// Create auth UI components
function createAuthUI() {
    const authHTML = `
        <div id="authContainer" class="auth-container">
            <div class="auth-modal">
                <button id="authClose" class="auth-close">×</button>
                <div class="auth-header">
                    <h2>Welcome Back</h2>
                </div>
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Login</button>
                    <button class="auth-tab" data-tab="signup">Sign Up</button>
                </div>
                
                <!-- Login Form -->
                <form id="loginForm" class="auth-form active">
                    <div class="form-group">
                        <label class="form-label" for="loginEmail">Email</label>
                        <input type="email" id="loginEmail" class="form-input" required placeholder="your.email@example.com">
                    </div>
                    <div class="form-group" style="position: relative;">
                        <label class="form-label" for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" class="form-input" required placeholder="Enter your password">
                        <button type="button" class="password-toggle">👁️</button>
                    </div>
                    <div id="loginError" class="auth-error"></div>
                    <button type="submit" class="form-button">
                        <span class="loading-spinner"></span>
                        <span class="button-text">Login</span>
                    </button>
                    <div class="auth-footer">
                        <p>Don't have an account? <a href="#" class="auth-link" onclick="switchTab('signup'); return false;">Sign up</a></p>
                    </div>
                </form>
                
                <!-- Signup Form -->
                <form id="signupForm" class="auth-form">
                    <div class="form-group">
                        <label class="form-label" for="signupEmail">Email</label>
                        <input type="email" id="signupEmail" class="form-input" required placeholder="your.email@example.com">
                    </div>
                    <div class="form-group" style="position: relative;">
                        <label class="form-label" for="signupPassword">Password</label>
                        <input type="password" id="signupPassword" class="form-input" required placeholder="Create a secure password">
                        <button type="button" class="password-toggle">👁️</button>
                    </div>
                    <div class="form-group" style="position: relative;">
                        <label class="form-label" for="confirmPassword">Confirm Password</label>
                        <input type="password" id="confirmPassword" class="form-input" required placeholder="Confirm your password">
                        <button type="button" class="password-toggle">👁️</button>
                    </div>
                    <div id="signupError" class="auth-error"></div>
                    <button type="submit" class="form-button">
                        <span class="loading-spinner"></span>
                        <span class="button-text">Create Account</span>
                    </button>
                    <div class="auth-footer">
                        <p>Already have an account? <a href="#" class="auth-link" onclick="switchTab('login'); return false;">Login</a></p>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Auth buttons (login/signup) -->
        <div id="authButtons" class="auth-buttons">
            <button id="loginButton" class="auth-button">Login</button>
            <button id="signupButton" class="auth-button">Sign Up</button>
        </div>
        
        <!-- User profile when logged in -->
        <div id="userProfile" class="user-profile">
            <div id="userAvatar" class="user-avatar">U</div>
            <div class="user-dropdown">
                <button id="dropdownToggle" class="dropdown-toggle">▼</button>
                <div id="dropdownMenu" class="dropdown-menu">
                    <a href="#" class="dropdown-item">Profile</a>
                    <a href="#" class="dropdown-item">My Capsules</a>
                    <a href="#" class="dropdown-item">Settings</a>
                    <a href="#" id="logoutButton" class="dropdown-item">Logout</a>
                </div>
            </div>
        </div>
    `;
    
    // Create container for auth components
    const authDiv = document.createElement('div');
    authDiv.innerHTML = authHTML;
    document.body.appendChild(authDiv);
}

// Show auth modal
function showAuthModal(tab = 'login') {
    authContainer.classList.add('active');
    switchTab(tab);
    
    // Create star particles animation for the modal
    createAuthStars();
}

// Hide auth modal
function hideAuthModal() {
    authContainer.classList.remove('active');
    clearFormErrors();
}

// Switch between login and signup tabs
function switchTab(tab) {
    // Update tab state
    authTabs.forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    // Update form visibility
    loginForm.classList.toggle('active', tab === 'login');
    signupForm.classList.toggle('active', tab === 'signup');
    
    // Update header text
    const authHeader = document.querySelector('.auth-header h2');
    authHeader.textContent = tab === 'login' ? 'Welcome Back' : 'Create Account';
    
    clearFormErrors();
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    // Get form data
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Validate form
    if (!email || !password) {
        showFormError('login', 'Please fill in all fields');
        return;
    }
    
    // Show loading state
    const submitButton = loginForm.querySelector('.form-button');
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    
    try {
        // Call your authentication API here
        // For demo purposes, we'll simulate a successful login after a delay
        await simulateAuth(email, password);
        
        // Update UI for logged-in user
        currentUser = { email, displayName: email.split('@')[0] };
        updateUserUI();
        hideAuthModal();
        
        // Store auth state
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Show success message
        createCelestialToast('Login successful! Welcome back.');
        
    } catch (error) {
        showFormError('login', error.message);
    } finally {
        // Hide loading state
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
    }
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();
    
    // Get form data
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate form
    if (!email || !password || !confirmPassword) {
        showFormError('signup', 'Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showFormError('signup', 'Passwords do not match');
        return;
    }
    
    // Show loading state
    const submitButton = signupForm.querySelector('.form-button');
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    
    try {
        // Call your authentication API here
        // For demo purposes, we'll simulate a successful signup after a delay
        await simulateAuth(email, password, true);
        
        // Update UI for logged-in user
        currentUser = { email, displayName: email.split('@')[0] };
        updateUserUI();
        hideAuthModal();
        
        // Store auth state
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Show success message
        createCelestialToast('Account created successfully! Welcome to Time Capsule.');
        
    } catch (error) {
        showFormError('signup', error.message);
    } finally {
        // Hide loading state
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
    }
}

// Handle logout
function handleLogout() {
    // Clear user data
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    // Update UI
    updateUserUI();
    
    // Show message
    createCelestialToast('You have been logged out successfully.');
}

// Show form error messages
function showFormError(formType, message) {
    const errorElement = document.getElementById(`${formType}Error`);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Clear form errors
function clearFormErrors() {
    const errorElements = document.querySelectorAll('.auth-error');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

// Simulate authentication API call
function simulateAuth(email, password, isSignup = false) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate validation and errors
            if (!email.includes('@')) {
                reject(new Error('Please enter a valid email address'));
                return;
            }
            
            if (password.length < 6) {
                reject(new Error('Password must be at least 6 characters'));
                return;
            }
            
            // Demo: Simulate existing user for signup
            if (isSignup && email === 'test@example.com') {
                reject(new Error('This email is already registered'));
                return;
            }
            
            // Demo: Simulate wrong password for login
            if (!isSignup && email === 'test@example.com' && password !== 'password123') {
                reject(new Error('Invalid email or password'));
                return;
            }
            
            resolve({ email });
        }, 1500); // Simulate network delay
    });
}

// Check if user is already logged in
function checkAuthState() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUserUI();
        } catch (error) {
            console.error('Error parsing auth state:', error);
            localStorage.removeItem('currentUser');
        }
    }
}

// Update UI based on authentication state
function updateUserUI() {
    if (currentUser) {
        // User is logged in
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        
        // Update user avatar
        const userAvatar = document.getElementById('userAvatar');
        userAvatar.textContent = currentUser.displayName.charAt(0).toUpperCase();
        
    } else {
        // User is logged out
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
    }
}

// Create animated stars for the auth modal background
function createAuthStars() {
    const authModal = document.querySelector('.auth-modal');
    
    // Remove any existing stars
    const existingStars = authModal.querySelectorAll('.auth-star');
    existingStars.forEach(star => star.remove());
    
    // Create new stars
    for (let i = 0; i < 30; i++) {
        const star = document.createElement('div');
        star.className = 'auth-star';
        star.style.position = 'absolute';
        star.style.width = `${Math.random() * 2 + 1}px`;
        star.style.height = star.style.width;
        star.style.background = '#d8b2ff';
        star.style.borderRadius = '50%';
        star.style.opacity = `${Math.random() * 0.7 + 0.3}`;
        
        // Random position around the modal
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        const offset = 50; // Distance from modal edge
        
        switch (side) {
            case 0: // Top
                star.style.top = `-${Math.random() * offset}px`;
                star.style.left = `${Math.random() * 100}%`;
                break;
            case 1: // Right
                star.style.top = `${Math.random() * 100}%`;
                star.style.right = `-${Math.random() * offset}px`;
                break;
            case 2: // Bottom
                star.style.bottom = `-${Math.random() * offset}px`;
                star.style.left = `${Math.random() * 100}%`;
                break;
            case 3: // Left
                star.style.top = `${Math.random() * 100}%`;
                star.style.left = `-${Math.random() * offset}px`;
                break;
        }
        
        // Add twinkling animation
        star.style.animation = `twinkle ${2 + Math.random() * 3}s infinite alternate ${Math.random() * 2}s ease-in-out`;
        
        authModal.appendChild(star);
    }
}

// Create celestial toast notification
function createCelestialToast(message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('celestialToastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'celestialToastContainer';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.left = '50%';
        toastContainer.style.transform = 'translateX(-50%)';
        toastContainer.style.zIndex = '3000';
        toastContainer.style.display = 'flex';
        toastContainer.style.flexDirection = 'column';
        toastContainer.style.alignItems = 'center';
        toastContainer.style.gap = '10px';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'celestial-toast';
    toast.style.padding = '0.8rem 1.5rem';
    toast.style.background = 'rgba(26, 11, 46, 0.8)';
    toast.style.color = '#d8b2ff';
    toast.style.borderRadius = '30px';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.boxShadow = '0 5px 15px rgba(155, 89, 182, 0.3)';
    toast.style.border = '1px solid #b19cd9';
    toast.style.transition = 'all 0.5s ease';
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    
    // Add message
    toast.textContent = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        toast.style.transform = 'translateY(-20px)';
        toast.style.opacity = '0';
        
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 500);
    }, 4000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);
