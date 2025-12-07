// Main Application
class NexusDevApp {
    constructor() {
        this.state = {
            darkMode: localStorage.getItem('darkMode') === 'true',
            chatOpen: false,
            isAdmin: false,
            currentAdminSection: 'dashboard',
            editingId: null,
            developers: [],
            projects: [],
            blogPosts: [],
            settings: {},
            messages: [],
            chatMessages: [],
            skillsChart: null
        };

        this.init();
    }

    async init() {
        // Set current year
        document.getElementById('current-year').textContent = new Date().getFullYear();
        
        // Apply dark mode if enabled
        if (this.state.darkMode) {
            document.body.classList.add('dark-theme');
            document.querySelector('#theme-toggle i').className = 'fas fa-sun';
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load data
        await this.loadData();
        
        // Initialize UI
        this.initUI();
        
        // Check admin session
        this.checkAdminSession();
    }

    async loadData() {
        this.showLoading();
        
        try {
            // Try to load from Supabase first
            if (window.supabaseClient) {
                await this.loadFromSupabase();
            } else {
                // Fallback to localStorage
                this.loadFromLocalStorage();
            }
            
            // Update UI with loaded data
            this.updateUI();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadFromLocalStorage();
            this.updateUI();
            this.showNotification('Using local storage mode', 'warning');
        } finally {
            this.hideLoading();
        }
    }

    async loadFromSupabase() {
        try {
            // Load developers
            const { data: developers, error: devError } = await supabaseClient
                .from('developers')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (devError) throw devError;
            this.state.developers = developers || [];
            
            // Load projects
            const { data: projects, error: projError } = await supabaseClient
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (projError) throw projError;
            this.state.projects = projects || [];
            
            // Load blog posts
            const { data: blogPosts, error: blogError } = await supabaseClient
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (blogError) throw blogError;
            this.state.blogPosts = blogPosts || [];
            
            // Load settings
            const { data: settings, error: settingsError } = await supabaseClient
                .from('settings')
                .select('*')
                .single();
            
            if (settingsError && settingsError.code !== 'PGRST116') {
                // PGRST116 means no rows returned, which is okay for new setup
                throw settingsError;
            }
            this.state.settings = settings || CONFIG.defaults;
            
            // Load messages
            const { data: messages, error: msgError } = await supabaseClient
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (msgError) throw msgError;
            this.state.messages = messages || [];
            
        } catch (error) {
            console.error('Supabase loading error:', error);
            throw error;
        }
    }

    loadFromLocalStorage() {
        this.state.developers = JSON.parse(localStorage.getItem('nexusdev_developers')) || [];
        this.state.projects = JSON.parse(localStorage.getItem('nexusdev_projects')) || [];
        this.state.blogPosts = JSON.parse(localStorage.getItem('nexusdev_blog')) || [];
        this.state.settings = JSON.parse(localStorage.getItem('nexusdev_settings')) || CONFIG.defaults;
        this.state.messages = JSON.parse(localStorage.getItem('nexusdev_messages')) || [];
    }

    async saveToSupabase(table, data) {
        if (!window.supabaseClient) {
            return this.saveToLocalStorage(table, data);
        }

        try {
            const { error } = await supabaseClient
                .from(table)
                .upsert(data);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error(`Error saving to ${table}:`, error);
            // Fallback to localStorage
            return this.saveToLocalStorage(table, data);
        }
    }

    saveToLocalStorage(table, data) {
        switch(table) {
            case 'developers':
                localStorage.setItem('nexusdev_developers', JSON.stringify(data));
                this.state.developers = data;
                break;
            case 'projects':
                localStorage.setItem('nexusdev_projects', JSON.stringify(data));
                this.state.projects = data;
                break;
            case 'blog_posts':
                localStorage.setItem('nexusdev_blog', JSON.stringify(data));
                this.state.blogPosts = data;
                break;
            case 'settings':
                localStorage.setItem('nexusdev_settings', JSON.stringify(data));
                this.state.settings = data;
                break;
            case 'messages':
                localStorage.setItem('nexusdev_messages', JSON.stringify(data));
                this.state.messages = data;
                break;
        }
        return true;
    }

    updateUI() {
        // Apply settings
        this.applySettings();
        
        // Render data
        this.renderDevelopers();
        this.renderProjects();
        this.renderBlogPosts();
        this.updateStats();
        
        // Initialize skills chart
        this.initSkillsChart();
    }

    applySettings() {
        // Apply running text
        const runningText = this.state.settings.runningText || CONFIG.defaults.runningText;
        document.getElementById('running-text').textContent = runningText;
        
        // Apply site title
        const siteTitle = this.state.settings.siteTitle || CONFIG.defaults.siteTitle;
        document.title = siteTitle;
        
        // Apply contact info
        const contactEmail = this.state.settings.contactEmail || CONFIG.defaults.contactEmail;
        const contactPhone = this.state.settings.contactPhone || CONFIG.defaults.contactPhone;
        
        document.getElementById('contact-email-display').textContent = contactEmail;
        document.getElementById('contact-phone-display').textContent = contactPhone;
        document.getElementById('footer-email').textContent = contactEmail;
        document.getElementById('footer-phone').textContent = contactPhone;
        
        // Apply dark mode if enabled in settings
        if (this.state.settings.darkMode && !this.state.darkMode) {
            this.toggleDarkMode();
        }
        
        // Show/hide chat based on settings
        const chatEnabled = this.state.settings.chatEnabled !== false;
        document.getElementById('chat-toggle').classList.toggle('hidden', !chatEnabled);
    }

    renderDevelopers() {
        const container = document.getElementById('developers-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.state.developers.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; padding: var(--space-2xl);">
                    <i class="fas fa-users fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                    <h3>No Developers Yet</h3>
                    <p>Check back soon to meet our team!</p>
                </div>
            `;
            return;
        }
        
        this.state.developers.forEach(dev => {
            const skillsHTML = (dev.skills || []).map(skill => 
                `<span class="skill-tag">${skill}</span>`
            ).join('');
            
            const developerHTML = `
                <div class="developer-card animate__animated animate__fadeInUp">
                    <div class="developer-header">
                        <img src="${dev.image}" alt="${dev.name}" class="developer-image" onerror="this.src='https://via.placeholder.com/400x300/1a365d/ffffff?text=Developer'">
                        <div class="developer-overlay">
                            <h3 class="developer-name">${dev.name}</h3>
                            <p class="developer-role">${dev.role}</p>
                        </div>
                    </div>
                    <div class="developer-content">
                        <div class="developer-skills">
                            ${skillsHTML}
                        </div>
                        <p class="developer-bio">${dev.bio}</p>
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            ${dev.email ? `<a href="mailto:${dev.email}" class="btn btn-sm btn-outline">
                                <i class="fas fa-envelope"></i> Contact
                            </a>` : ''}
                            ${dev.github ? `<a href="https://github.com/${dev.github}" target="_blank" class="btn btn-sm btn-secondary">
                                <i class="fab fa-github"></i> GitHub
                            </a>` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', developerHTML);
        });
    }

    renderProjects(filter = 'all') {
        const container = document.getElementById('projects-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        const filteredProjects = filter === 'all' 
            ? this.state.projects 
            : this.state.projects.filter(project => project.type === filter);
        
        if (filteredProjects.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; padding: var(--space-2xl);">
                    <i class="fas fa-project-diagram fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                    <h3>No Projects Found</h3>
                    <p>No projects match your filter. Try a different category!</p>
                </div>
            `;
            return;
        }
        
        filteredProjects.forEach((project, index) => {
            const techHTML = (project.tech || []).map(tech => 
                `<span class="tech-tag">${tech}</span>`
            ).join('');
            
            const projectHTML = `
                <div class="project-card animate__animated animate__fadeInUp" style="animation-delay: ${index * 100}ms">
                    <img src="${project.image}" alt="${project.title}" class="project-image" onerror="this.src='https://via.placeholder.com/400x300/1a365d/ffffff?text=Project'">
                    <div class="project-content">
                        <h3 class="project-title">${project.title}</h3>
                        <p class="project-description">${project.description}</p>
                        <div class="project-tech">
                            ${techHTML}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                            <span class="project-category">${
                                project.type === 'web' ? 'Web Development' : 
                                project.type === 'mobile' ? 'Mobile App' : 
                                'UI/UX Design'
                            }</span>
                            <button class="btn btn-sm btn-primary" onclick="app.viewProjectDetails(${project.id})">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', projectHTML);
        });
    }

    renderBlogPosts() {
        const container = document.getElementById('blog-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.state.blogPosts.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; padding: var(--space-2xl);">
                    <i class="fas fa-newspaper fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                    <h3>No Blog Posts Yet</h3>
                    <p>Check back soon for our latest insights!</p>
                </div>
            `;
            return;
        }
        
        this.state.blogPosts.forEach((post, index) => {
            const blogHTML = `
                <div class="blog-card animate__animated animate__fadeInUp" style="animation-delay: ${index * 100}ms">
                    <img src="${post.image}" alt="${post.title}" class="blog-image" onerror="this.src='https://via.placeholder.com/400x300/1a365d/ffffff?text=Blog'">
                    <div class="blog-content">
                        <span class="blog-category">${post.category}</span>
                        <h3 class="blog-title">${post.title}</h3>
                        <p class="blog-excerpt">${post.excerpt}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                            <span><i class="far fa-user"></i> ${post.author}</span>
                            <button class="btn btn-sm btn-outline" onclick="app.viewBlogPost(${post.id})">
                                Read Article
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', blogHTML);
        });
    }

    updateStats() {
        document.getElementById('projects-count').textContent = this.state.projects.length;
        document.getElementById('stats-projects').textContent = this.state.projects.length;
        document.getElementById('stats-clients').textContent = Math.floor(this.state.projects.length * 2.5);
        document.getElementById('stats-articles').textContent = this.state.blogPosts.length;
    }

    initSkillsChart() {
        const ctx = document.getElementById('skillsChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.state.skillsChart) {
            this.state.skillsChart.destroy();
        }
        
        // Aggregate skills from all developers
        const skillCounts = {};
        this.state.developers.forEach(dev => {
            (dev.skills || []).forEach(skill => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });
        
        const labels = Object.keys(skillCounts).slice(0, 8);
        const data = labels.map(label => skillCounts[label] * 10 + 30); // Scale for visualization
        
        if (labels.length === 0) {
            ctx.parentElement.innerHTML = `
                <div class="text-center" style="padding: var(--space-2xl);">
                    <i class="fas fa-chart-bar fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                    <h3>Skills Data Unavailable</h3>
                    <p>Add developers with skills to see the visualization</p>
                </div>
            `;
            return;
        }
        
        this.state.skillsChart = new Chart(ctx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Skill Proficiency',
                    data: data,
                    backgroundColor: 'rgba(26, 54, 93, 0.2)',
                    borderColor: 'rgba(26, 54, 93, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(212, 175, 55, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(212, 175, 55, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        pointLabels: {
                            font: {
                                size: 12
                            },
                            color: 'var(--dark)'
                        },
                        ticks: {
                            backdropColor: 'transparent',
                            color: 'var(--dark-gray)',
                            stepSize: 20
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }

    initUI() {
        // Initialize navigation active state
        this.updateActiveNavOnScroll();
        
        // Initialize project filtering
        this.setupProjectFiltering();
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleDarkMode());
        
        // Mobile menu
        document.getElementById('mobile-menu-btn').addEventListener('click', () => this.toggleMobileMenu());
        
        // Navigation scroll
        document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e, link));
        });
        
        // Contact form
        document.getElementById('contact-form').addEventListener('submit', (e) => this.handleContactSubmit(e));
        
        // Admin login
        document.getElementById('admin-login-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginModal();
        });
        
        document.getElementById('close-login').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleAdminLogin(e));
        
        // Chat widget
        document.getElementById('chat-toggle').addEventListener('click', () => this.toggleChat());
        document.getElementById('close-chat').addEventListener('click', () => this.toggleChat());
        document.getElementById('send-chat').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // Scroll effect for navbar
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideLoginModal();
            }
        });
    }

    toggleDarkMode() {
        this.state.darkMode = !this.state.darkMode;
        document.body.classList.toggle('dark-theme', this.state.darkMode);
        localStorage.setItem('darkMode', this.state.darkMode);
        
        const icon = document.querySelector('#theme-toggle i');
        icon.className = this.state.darkMode ? 'fas fa-sun' : 'fas fa-moon';
        
        // Update chart colors if it exists
        if (this.state.skillsChart) {
            const isDark = document.body.classList.contains('dark-theme');
            this.state.skillsChart.options.scales.r.angleLines.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            this.state.skillsChart.options.scales.r.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            this.state.skillsChart.update();
        }
    }

    toggleMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.toggle('active');
    }

    handleNavClick(e, link) {
        const href = link.getAttribute('href');
        if (!href.startsWith('#')) return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            // Close mobile menu
            document.querySelector('.nav-links').classList.remove('active');
            
            // Scroll to target
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
            
            // Update active nav
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
        }
    }

    setupProjectFiltering() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderProjects(btn.dataset.filter);
            });
        });
    }

    async handleContactSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            subject: document.getElementById('contact-subject').value,
            message: document.getElementById('contact-message').value,
            created_at: new Date().toISOString(),
            read: false
        };
        
        try {
            // Save to Supabase or localStorage
            const saved = await this.saveToSupabase('messages', [...this.state.messages, formData]);
            
            if (saved) {
                this.state.messages.push(formData);
                this.showNotification('Message sent successfully! We will contact you soon.', 'success');
                e.target.reset();
            } else {
                this.showNotification('Failed to save message. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error saving message:', error);
            this.showNotification('Error sending message. Please try again.', 'error');
        }
    }

    handleScroll() {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        this.updateActiveNavOnScroll();
    }

    updateActiveNavOnScroll() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    toggleChat() {
        this.state.chatOpen = !this.state.chatOpen;
        document.getElementById('chat-widget').classList.toggle('hidden', !this.state.chatOpen);
        
        if (this.state.chatOpen) {
            document.getElementById('chat-input').focus();
        }
    }

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        const chatBody = document.getElementById('chat-body');
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user';
        userMsg.textContent = message;
        chatBody.appendChild(userMsg);
        
        // Clear input
        input.value = '';
        
        // Add loading indicator
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'chat-message bot';
        loadingMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';
        chatBody.appendChild(loadingMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
        
        try {
            // Get AI response (simulated for now)
            const response = await this.getAIResponse(message);
            
            // Remove loading indicator
            loadingMsg.remove();
            
            // Add bot response
            const botMsg = document.createElement('div');
            botMsg.className = 'chat-message bot';
            botMsg.textContent = response;
            chatBody.appendChild(botMsg);
        } catch (error) {
            console.error('Chat error:', error);
            loadingMsg.remove();
            
            const errorMsg = document.createElement('div');
            errorMsg.className = 'chat-message bot';
            errorMsg.textContent = "I apologize, but I'm having trouble connecting right now. Please email us at " + (this.state.settings.contactEmail || CONFIG.defaults.contactEmail) + " for assistance.";
            chatBody.appendChild(errorMsg);
        }
        
        // Scroll to bottom
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    async getAIResponse(message) {
        // Check if Gemini API key is available
        if (CONFIG.geminiApiKey && CONFIG.geminiApiKey !== '') {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.geminiApiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `${CONFIG.aiSystemPrompt}\n\nUser: ${message}\n\nAssistant:`
                            }]
                        }]
                    })
                });

                if (!response.ok) {
                    throw new Error('API request failed');
                }

                const data = await response.json();
                return data.candidates[0].content.parts[0].text;
            } catch (error) {
                console.error('Gemini API error:', error);
                // Fall through to default response
            }
        }
        
        // Default responses if no API key or API fails
        const responses = [
            "Thanks for your message! Our team specializes in custom web and mobile development. We'd be happy to discuss your project requirements.",
            "Great question! We offer consultation services to help plan your project. Would you like to schedule a call?",
            "Based on your query, I recommend checking our portfolio section for similar projects we've completed.",
            "We create digital experiences that combine innovation, functionality, and exceptional design. How can we help bring your vision to life?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    showLoginModal() {
        document.getElementById('login-modal').classList.remove('hidden');
    }

    hideLoginModal() {
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('login-form').reset();
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            let authSuccess = false;
            
            // Try Supabase authentication first
            if (window.supabaseClient) {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (!error && data.user) {
                    authSuccess = true;
                    this.state.isAdmin = true;
                    localStorage.setItem('nexusdev_admin_token', data.session.access_token);
                }
            }
            
            // Fallback to local authentication
            if (!authSuccess && email === CONFIG.adminEmail && password === CONFIG.adminPassword) {
                authSuccess = true;
                this.state.isAdmin = true;
                localStorage.setItem('nexusdev_admin', 'true');
            }
            
            if (authSuccess) {
                this.hideLoginModal();
                this.showAdminPanel();
                this.showNotification('Admin login successful!', 'success');
            } else {
                this.showNotification('Invalid email or password', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }

    checkAdminSession() {
        const isAdminLoggedIn = localStorage.getItem('nexusdev_admin') === 'true' || 
                               localStorage.getItem('nexusdev_admin_token');
        
        if (isAdminLoggedIn) {
            this.state.isAdmin = true;
            this.showAdminPanel();
        }
    }

    showAdminPanel() {
        document.getElementById('main-content').classList.add('hidden');
        document.getElementById('footer').classList.add('hidden');
        document.querySelector('.running-text-container').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        
        this.loadAdminDashboard();
        this.setupAdminEventListeners();
    }

    hideAdminPanel() {
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('footer').classList.remove('hidden');
        document.querySelector('.running-text-container').classList.remove('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
        
        this.state.isAdmin = false;
        localStorage.removeItem('nexusdev_admin');
        localStorage.removeItem('nexusdev_admin_token');
        
        if (window.supabaseClient) {
            supabaseClient.auth.signOut();
        }
    }

    loadAdminDashboard() {
        const sectionsContainer = document.getElementById('admin-sections');
        
        const dashboardHTML = `
            <div class="admin-section">
                <h2>Dashboard Overview</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${this.state.developers.length}</div>
                        <div class="stat-label">Active Developers</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.state.projects.length}</div>
                        <div class="stat-label">Total Projects</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.state.blogPosts.length}</div>
                        <div class="stat-label">Blog Posts</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.state.messages.length}</div>
                        <div class="stat-label">Messages</div>
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <h3>Quick Actions</h3>
                    <div style="display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="app.showAdminSection('developers')">
                            <i class="fas fa-user-plus"></i> Add Developer
                        </button>
                        <button class="btn btn-secondary" onclick="app.showAdminSection('projects')">
                            <i class="fas fa-plus-circle"></i> Add Project
                        </button>
                        <button class="btn btn-outline" onclick="app.showAdminSection('blog')">
                            <i class="fas fa-edit"></i> Write Blog Post
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        sectionsContainer.innerHTML = dashboardHTML;
        this.state.currentAdminSection = 'dashboard';
    }

    showAdminSection(section) {
        this.state.currentAdminSection = section;
        
        const sectionsContainer = document.getElementById('admin-sections');
        let sectionHTML = '';
        
        switch(section) {
            case 'developers':
                sectionHTML = this.getDevelopersManagementHTML();
                break;
            case 'projects':
                sectionHTML = this.getProjectsManagementHTML();
                break;
            case 'blog':
                sectionHTML = this.getBlogManagementHTML();
                break;
            case 'settings':
                sectionHTML = this.getSettingsManagementHTML();
                break;
            default:
                this.loadAdminDashboard();
                return;
        }
        
        sectionsContainer.innerHTML = sectionHTML;
        this.setupAdminSectionEventListeners(section);
        
        // Update active nav
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === section) {
                btn.classList.add('active');
            }
        });
    }

    getDevelopersManagementHTML() {
        const developersListHTML = this.state.developers.map(dev => `
            <div class="admin-list-item">
                <div>
                    <h4 style="margin: 0;">${dev.name}</h4>
                    <p style="margin: 5px 0; color: var(--gray);">${dev.role}</p>
                    <small>${(dev.skills || []).slice(0, 3).join(', ')}</small>
                </div>
                <div class="admin-list-actions">
                    <button class="btn btn-sm" onclick="app.editDeveloper(${dev.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteDeveloper(${dev.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        return `
            <div class="admin-section">
                <div class="tab-nav">
                    <button class="tab-btn active" data-tab="developers-list">All Developers (${this.state.developers.length})</button>
                    <button class="tab-btn" data-tab="add-developer">${this.state.editingId ? 'Edit Developer' : 'Add New Developer'}</button>
                </div>
                
                <div id="developers-list" class="tab-content active">
                    <h3>Manage Developers</h3>
                    ${this.state.developers.length > 0 ? `
                        <div class="admin-list">
                            ${developersListHTML}
                        </div>
                    ` : `
                        <div class="text-center" style="padding: var(--space-2xl);">
                            <i class="fas fa-users fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                            <h3>No Developers Yet</h3>
                            <p>Add your first developer to get started!</p>
                        </div>
                    `}
                </div>
                
                <div id="add-developer" class="tab-content">
                    <h3>${this.state.editingId ? 'Edit Developer' : 'Add New Developer'}</h3>
                    <form id="admin-developer-form">
                        <input type="hidden" id="admin-developer-id" value="${this.state.editingId || ''}">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Full Name *</label>
                                <input type="text" class="form-control" id="admin-dev-name" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Role/Position *</label>
                                <input type="text" class="form-control" id="admin-dev-role" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Profile Image URL *</label>
                                <input type="text" class="form-control" id="admin-dev-image" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email Address</label>
                                <input type="email" class="form-control" id="admin-dev-email">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">GitHub Username</label>
                                <input type="text" class="form-control" id="admin-dev-github">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Skills (comma separated) *</label>
                                <input type="text" class="form-control" id="admin-dev-skills" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Bio/Description *</label>
                            <textarea class="form-control" id="admin-dev-bio" rows="4" required></textarea>
                        </div>
                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> ${this.state.editingId ? 'Update Developer' : 'Save Developer'}
                            </button>
                            <button type="button" class="btn btn-outline" onclick="app.resetDeveloperForm()">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // Similar methods for projects, blog, and settings management...
    // Due to character limits, I'll provide the structure and key methods

    async saveDeveloper(data) {
        try {
            const saved = await this.saveToSupabase('developers', data);
            if (saved) {
                this.showNotification('Developer saved successfully!', 'success');
                this.state.editingId = null;
                await this.loadData(); // Reload data
                this.showAdminSection('developers');
            }
        } catch (error) {
            console.error('Error saving developer:', error);
            this.showNotification('Error saving developer', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    // Public methods for onclick handlers
    viewProjectDetails(id) {
        const project = this.state.projects.find(p => p.id === id);
        if (project) {
            alert(`Project Details:\n\nTitle: ${project.title}\nType: ${project.type}\nDescription: ${project.description}\nTechnologies: ${project.tech?.join(', ') || 'Not specified'}`);
        }
    }

    viewBlogPost(id) {
        const post = this.state.blogPosts.find(p => p.id === id);
        if (post) {
            alert(`Blog Post:\n\nTitle: ${post.title}\nAuthor: ${post.author}\nCategory: ${post.category}\n\n${post.content || post.excerpt}`);
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NexusDevApp();
    window.app = app; // Make app available globally for onclick handlers
});