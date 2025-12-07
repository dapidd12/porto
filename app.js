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
            skillsChart: null,
            projectIdCounter: 1,
            developerIdCounter: 1,
            blogIdCounter: 1,
            messageIdCounter: 1
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
        
        // Setup animations
        this.setupScrollAnimations();
        this.setupScrollProgress();
    }

    async loadData() {
        this.showLoading();
        
        // Add minimum loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        try {
            // Try to load from Supabase first
            if (window.supabaseClient && CONFIG.supabaseUrl !== 'https://your-project.supabase.co') {
                await this.loadFromSupabase();
            } else {
                // Fallback to localStorage
                this.loadFromLocalStorage();
                this.showNotification('Using local storage mode. Set up Supabase for cloud storage.', 'warning');
            }
            
            // Update UI with loaded data
            this.updateUI();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadFromLocalStorage();
            this.updateUI();
            this.showNotification('Failed to load cloud data. Using local storage.', 'warning');
        } finally {
            // Add slight delay to prevent flicker
            setTimeout(() => this.hideLoading(), 300);
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
            this.state.developerIdCounter = Math.max(...this.state.developers.map(d => d.id || 0), 0) + 1;
            
            // Load projects
            const { data: projects, error: projError } = await supabaseClient
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (projError) throw projError;
            this.state.projects = projects || [];
            this.state.projectIdCounter = Math.max(...this.state.projects.map(p => p.id || 0), 0) + 1;
            
            // Load blog posts
            const { data: blogPosts, error: blogError } = await supabaseClient
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (blogError) throw blogError;
            this.state.blogPosts = blogPosts || [];
            this.state.blogIdCounter = Math.max(...this.state.blogPosts.map(b => b.id || 0), 0) + 1;
            
            // Load settings
            let settingsData = null;
            try {
                const { data: settings, error: settingsError } = await supabaseClient
                    .from('settings')
                    .select('*')
                    .single();
                
                if (!settingsError) {
                    settingsData = settings;
                }
            } catch (e) {
                // Settings table might not exist
                console.log('Settings table not found, using defaults');
            }
            
            this.state.settings = settingsData || { ...CONFIG.defaults, ...JSON.parse(localStorage.getItem('nexusdev_settings') || '{}') };
            
            // Load messages
            const { data: messages, error: msgError } = await supabaseClient
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (msgError) throw msgError;
            this.state.messages = messages || [];
            this.state.messageIdCounter = Math.max(...this.state.messages.map(m => m.id || 0), 0) + 1;
            
        } catch (error) {
            console.error('Supabase loading error:', error);
            throw error;
        }
    }

    loadFromLocalStorage() {
        this.state.developers = JSON.parse(localStorage.getItem('nexusdev_developers')) || [];
        this.state.projects = JSON.parse(localStorage.getItem('nexusdev_projects')) || [];
        this.state.blogPosts = JSON.parse(localStorage.getItem('nexusdev_blog')) || [];
        this.state.settings = JSON.parse(localStorage.getItem('nexusdev_settings')) || { ...CONFIG.defaults };
        this.state.messages = JSON.parse(localStorage.getItem('nexusdev_messages')) || [];
        
        // Update ID counters
        this.state.developerIdCounter = Math.max(...this.state.developers.map(d => d.id || 0), 0) + 1;
        this.state.projectIdCounter = Math.max(...this.state.projects.map(p => p.id || 0), 0) + 1;
        this.state.blogIdCounter = Math.max(...this.state.blogPosts.map(b => b.id || 0), 0) + 1;
        this.state.messageIdCounter = Math.max(...this.state.messages.map(m => m.id || 0), 0) + 1;
    }

    async saveToSupabase(table, data) {
        if (!window.supabaseClient || CONFIG.supabaseUrl === 'https://your-project.supabase.co') {
            return this.saveToLocalStorage(table, data);
        }

        try {
            let result;
            
            if (Array.isArray(data)) {
                // For bulk updates (used for initial sync)
                if (data.length === 0) return true;
                
                const { error } = await supabaseClient
                    .from(table)
                    .upsert(data, { onConflict: 'id' });
                
                if (error) throw error;
                result = true;
            } else {
                // Single record
                const { error } = await supabaseClient
                    .from(table)
                    .upsert([data], { onConflict: 'id' });
                
                if (error) throw error;
                result = true;
            }
            
            return result;
        } catch (error) {
            console.error(`Error saving to ${table}:`, error);
            // Fallback to localStorage
            return this.saveToLocalStorage(table, data);
        }
    }

    saveToLocalStorage(table, data) {
        try {
            switch(table) {
                case 'developers':
                    if (Array.isArray(data)) {
                        localStorage.setItem('nexusdev_developers', JSON.stringify(data));
                        this.state.developers = data;
                    } else {
                        let developers = [...this.state.developers];
                        const index = developers.findIndex(d => d.id === data.id);
                        if (index >= 0) {
                            developers[index] = data;
                        } else {
                            developers.push(data);
                        }
                        localStorage.setItem('nexusdev_developers', JSON.stringify(developers));
                        this.state.developers = developers;
                    }
                    break;
                    
                case 'projects':
                    if (Array.isArray(data)) {
                        localStorage.setItem('nexusdev_projects', JSON.stringify(data));
                        this.state.projects = data;
                    } else {
                        let projects = [...this.state.projects];
                        const index = projects.findIndex(p => p.id === data.id);
                        if (index >= 0) {
                            projects[index] = data;
                        } else {
                            projects.push(data);
                        }
                        localStorage.setItem('nexusdev_projects', JSON.stringify(projects));
                        this.state.projects = projects;
                    }
                    break;
                    
                case 'blog_posts':
                    if (Array.isArray(data)) {
                        localStorage.setItem('nexusdev_blog', JSON.stringify(data));
                        this.state.blogPosts = data;
                    } else {
                        let blogPosts = [...this.state.blogPosts];
                        const index = blogPosts.findIndex(b => b.id === data.id);
                        if (index >= 0) {
                            blogPosts[index] = data;
                        } else {
                            blogPosts.push(data);
                        }
                        localStorage.setItem('nexusdev_blog', JSON.stringify(blogPosts));
                        this.state.blogPosts = blogPosts;
                    }
                    break;
                    
                case 'settings':
                    const mergedSettings = { ...this.state.settings, ...data };
                    localStorage.setItem('nexusdev_settings', JSON.stringify(mergedSettings));
                    this.state.settings = mergedSettings;
                    break;
                    
                case 'messages':
                    if (Array.isArray(data)) {
                        localStorage.setItem('nexusdev_messages', JSON.stringify(data));
                        this.state.messages = data;
                    } else {
                        let messages = [...this.state.messages];
                        messages.unshift(data);
                        if (messages.length > 100) messages = messages.slice(0, 100);
                        localStorage.setItem('nexusdev_messages', JSON.stringify(messages));
                        this.state.messages = messages;
                    }
                    break;
            }
            return true;
        } catch (error) {
            console.error(`Error saving to localStorage for ${table}:`, error);
            return false;
        }
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
                    <div style="width: 80px; height: 80px; background: var(--light-gray); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                        <i class="fas fa-users fa-2x" style="color: var(--gray);"></i>
                    </div>
                    <h3 style="color: var(--primary);">No Developers Yet</h3>
                    <p style="color: var(--gray); max-width: 400px; margin: 0 auto;">Our expert team profiles are being prepared. Check back soon!</p>
                    ${this.state.isAdmin ? `
                        <button class="btn btn-primary" onclick="app.showAdminSection('developers')" style="margin-top: var(--space-md);">
                            <i class="fas fa-user-plus"></i> Add First Developer
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        this.state.developers.forEach((dev, index) => {
            const skills = Array.isArray(dev.skills) ? dev.skills : 
                          typeof dev.skills === 'string' ? dev.skills.split(',').map(s => s.trim()) : [];
            
            const skillsHTML = skills.map(skill => 
                `<span class="skill-tag">${skill}</span>`
            ).join('');
            
            const developerHTML = `
                <div class="developer-card animate__animated animate__fadeInUp" style="animation-delay: ${index * 100}ms">
                    <div class="developer-header">
                        <img src="${dev.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}" 
                             alt="${dev.name}" 
                             class="developer-image"
                             onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
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
                    <div style="width: 80px; height: 80px; background: var(--light-gray); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                        <i class="fas fa-project-diagram fa-2x" style="color: var(--gray);"></i>
                    </div>
                    <h3 style="color: var(--primary);">No Projects Found</h3>
                    <p style="color: var(--gray); max-width: 400px; margin: 0 auto;">
                        ${filter === 'all' ? 'No projects available yet. Check back soon!' : `No ${filter} projects found. Try a different category!`}
                    </p>
                    ${this.state.isAdmin ? `
                        <button class="btn btn-primary" onclick="app.showAdminSection('projects')" style="margin-top: var(--space-md);">
                            <i class="fas fa-plus-circle"></i> Add First Project
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        filteredProjects.forEach((project, index) => {
            const tech = Array.isArray(project.tech) ? project.tech : 
                        typeof project.tech === 'string' ? project.tech.split(',').map(t => t.trim()) : [];
            
            const techHTML = tech.map(tech => 
                `<span class="tech-tag">${tech}</span>`
            ).join('');
            
            const typeMap = {
                'web': 'Web Development',
                'mobile': 'Mobile App',
                'design': 'UI/UX Design'
            };
            
            const projectHTML = `
                <div class="project-card animate__animated animate__fadeInUp" style="animation-delay: ${index * 100}ms">
                    <img src="${project.image || 'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}" 
                         alt="${project.title}" 
                         class="project-image"
                         onerror="this.src='https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
                    <div class="project-content">
                        <h3 class="project-title">${project.title}</h3>
                        <p class="project-description">${project.description}</p>
                        <div class="project-tech">
                            ${techHTML}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                            <span class="project-category">${typeMap[project.type] || project.type}</span>
                            ${project.link ? `
                                <a href="${project.link}" target="_blank" class="btn btn-sm btn-primary">
                                    <i class="fas fa-external-link-alt"></i> View Live
                                </a>
                            ` : `
                                <button class="btn btn-sm btn-primary" onclick="app.viewProjectDetails(${project.id})">
                                    <i class="fas fa-eye"></i> View Details
                                </button>
                            `}
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
                    <div style="width: 80px; height: 80px; background: var(--light-gray); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                        <i class="fas fa-newspaper fa-2x" style="color: var(--gray);"></i>
                    </div>
                    <h3 style="color: var(--primary);">No Blog Posts Yet</h3>
                    <p style="color: var(--gray); max-width: 400px; margin: 0 auto;">Check back soon for our latest insights and industry updates!</p>
                    ${this.state.isAdmin ? `
                        <button class="btn btn-primary" onclick="app.showAdminSection('blog')" style="margin-top: var(--space-md);">
                            <i class="fas fa-edit"></i> Write First Post
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        this.state.blogPosts.forEach((post, index) => {
            const blogHTML = `
                <div class="blog-card animate__animated animate__fadeInUp" style="animation-delay: ${index * 100}ms">
                    <img src="${post.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}" 
                         alt="${post.title}" 
                         class="blog-image"
                         onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
                    <div class="blog-content">
                        <span class="blog-category">${post.category || 'General'}</span>
                        <h3 class="blog-title">${post.title}</h3>
                        <p class="blog-excerpt">${post.excerpt || post.content?.substring(0, 150) + '...' || 'No excerpt available.'}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                            <span><i class="far fa-user"></i> ${post.author || 'Admin'}</span>
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
            const skills = Array.isArray(dev.skills) ? dev.skills : 
                          typeof dev.skills === 'string' ? dev.skills.split(',').map(s => s.trim()) : [];
            
            skills.forEach(skill => {
                if (skill.trim()) {
                    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
                }
            });
        });
        
        const labels = Object.keys(skillCounts).slice(0, 8);
        const data = labels.map(label => {
            const count = skillCounts[label];
            // Scale: 1 developer = 30, 2 = 50, 3+ = 70-100
            return Math.min(30 + (count * 20), 100);
        });
        
        if (labels.length === 0) {
            ctx.parentElement.innerHTML = `
                <div class="text-center" style="padding: var(--space-2xl);">
                    <div style="width: 80px; height: 80px; background: var(--light-gray); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                        <i class="fas fa-chart-bar fa-2x" style="color: var(--gray);"></i>
                    </div>
                    <h3 style="color: var(--primary);">Skills Data Unavailable</h3>
                    <p style="color: var(--gray);">Add developers with skills to see the visualization</p>
                    ${this.state.isAdmin ? `
                        <button class="btn btn-primary" onclick="app.showAdminSection('developers')" style="margin-top: var(--space-md);">
                            <i class="fas fa-user-plus"></i> Add Developers
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        const isDark = document.body.classList.contains('dark-theme');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#f7fafc' : '#1a202c';
        
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
                maintainAspectRatio: true,
                aspectRatio: window.innerWidth < 768 ? 1 : 2,
                scales: {
                    r: {
                        angleLines: {
                            color: gridColor
                        },
                        grid: {
                            color: gridColor
                        },
                        pointLabels: {
                            font: {
                                size: window.innerWidth < 768 ? 10 : 12
                            },
                            color: textColor
                        },
                        ticks: {
                            backdropColor: 'transparent',
                            color: isDark ? '#a0aec0' : '#4a5568',
                            stepSize: 20
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    }
                }
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.state.skillsChart) {
                this.state.skillsChart.resize();
            }
        });
    }

    initUI() {
        // Initialize navigation active state
        this.updateActiveNavOnScroll();
        
        // Initialize project filtering
        this.setupProjectFiltering();
        
        // Mark sections as visible
        setTimeout(() => {
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('visible');
            });
        }, 100);
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
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideLoginModal();
            }
        });
    }

    setupScrollAnimations() {
        const sections = document.querySelectorAll('.section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        
        sections.forEach(section => observer.observe(section));
    }

    setupScrollProgress() {
        const progressBar = document.getElementById('scroll-progress');
        if (!progressBar) return;
        
        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            progressBar.style.width = scrolled + '%';
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
            const isDark = this.state.darkMode;
            const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            const textColor = isDark ? '#f7fafc' : '#1a202c';
            
            this.state.skillsChart.options.scales.r.angleLines.color = gridColor;
            this.state.skillsChart.options.scales.r.grid.color = gridColor;
            this.state.skillsChart.options.scales.r.pointLabels.color = textColor;
            this.state.skillsChart.options.scales.r.ticks.color = isDark ? '#a0aec0' : '#4a5568';
            this.state.skillsChart.options.plugins.legend.labels.color = textColor;
            
            this.state.skillsChart.update();
        }
    }

    toggleMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.toggle('active');
        
        // Toggle icon
        const icon = document.querySelector('#mobile-menu-btn i');
        icon.className = navLinks.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
    }

    handleNavClick(e, link) {
        const href = link.getAttribute('href');
        if (!href.startsWith('#')) return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            // Close mobile menu
            document.querySelector('.nav-links').classList.remove('active');
            document.querySelector('#mobile-menu-btn i').className = 'fas fa-bars';
            
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
        
        // Reset errors
        this.clearFormErrors();
        
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const subject = document.getElementById('contact-subject').value.trim();
        const message = document.getElementById('contact-message').value.trim();
        
        // Validation
        let isValid = true;
        
        if (!name) {
            this.showFormError('name-error', 'Name is required');
            isValid = false;
        }
        
        if (!email) {
            this.showFormError('email-error', 'Email is required');
            isValid = false;
        } else if (!this.validateEmail(email)) {
            this.showFormError('email-error', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!subject) {
            this.showFormError('subject-error', 'Subject is required');
            isValid = false;
        }
        
        if (!message) {
            this.showFormError('message-error', 'Message is required');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Create message data
        const formData = {
            id: this.state.messageIdCounter++,
            name: name,
            email: email,
            subject: subject,
            message: message,
            created_at: new Date().toISOString(),
            read: false
        };
        
        // Show loading state
        const submitBtn = document.getElementById('contact-submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.classList.add('loading');
        
        try {
            // Save message
            const saved = await this.saveToSupabase('messages', formData);
            
            if (saved) {
                this.state.messages.unshift(formData);
                this.showNotification('Message sent successfully! We will contact you soon.', 'success');
                e.target.reset();
            } else {
                this.showNotification('Failed to save message. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error saving message:', error);
            this.showNotification('Error sending message. Please try again.', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = originalText;
        }
    }

    clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('visible');
            error.textContent = '';
        });
        document.querySelectorAll('.form-control').forEach(input => {
            input.classList.remove('invalid');
        });
    }

    showFormError(id, message) {
        const errorElement = document.getElementById(id);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('visible');
            
            // Mark corresponding input as invalid
            const inputId = id.replace('-error', '');
            const input = document.getElementById(inputId);
            if (input) {
                input.classList.add('invalid');
            }
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
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
            // Get AI response
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
            "We create digital experiences that combine innovation, functionality, and exceptional design. How can we help bring your vision to life?",
            "For detailed project estimates, we typically need to understand your specific requirements. Would you like to share more details about your project?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    showLoginModal() {
        document.getElementById('login-modal').classList.remove('hidden');
        document.getElementById('username').focus();
    }

    hideLoginModal() {
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('login-form').reset();
        this.clearFormErrors();
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        this.clearFormErrors();
        
        const email = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // Validation
        if (!email) {
            this.showFormError('login-email-error', 'Email is required');
            return;
        }
        
        if (!password) {
            this.showFormError('login-password-error', 'Password is required');
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('login-submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.classList.add('loading');
        
        try {
            let authSuccess = false;
            
            // Try Supabase authentication first
            if (window.supabaseClient && CONFIG.supabaseUrl !== 'https://your-project.supabase.co') {
                try {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    if (!error && data.user) {
                        authSuccess = true;
                        this.state.isAdmin = true;
                        localStorage.setItem('nexusdev_admin_token', data.session.access_token);
                    }
                } catch (supabaseError) {
                    console.warn('Supabase auth failed:', supabaseError);
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
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = originalText;
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
        
        this.showNotification('Logged out successfully', 'success');
    }

    setupAdminEventListeners() {
        // Admin navigation
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.dataset.section;
                this.showAdminSection(section);
            });
        });
        
        // Admin logout
        document.getElementById('admin-logout').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideAdminPanel();
        });
    }

    loadAdminDashboard() {
        const sectionsContainer = document.getElementById('admin-sections');
        
        const unreadMessages = this.state.messages.filter(msg => !msg.read).length;
        const recentMessages = this.state.messages.slice(0, 5);
        
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
                        ${unreadMessages > 0 ? `<span style="position: absolute; top: 10px; right: 10px; background: var(--danger); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">${unreadMessages}</span>` : ''}
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <div class="form-row">
                        <div>
                            <h3>Quick Actions</h3>
                            <div style="display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                                <button class="btn btn-primary" onclick="app.showAdminSection('developers')">
                                    <i class="fas fa-user-plus"></i> Manage Developers
                                </button>
                                <button class="btn btn-secondary" onclick="app.showAdminSection('projects')">
                                    <i class="fas fa-plus-circle"></i> Manage Projects
                                </button>
                                <button class="btn btn-outline" onclick="app.showAdminSection('blog')">
                                    <i class="fas fa-edit"></i> Manage Blog
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <h3>Recent Messages</h3>
                            ${recentMessages.length > 0 ? `
                                <div style="margin-top: 15px; max-height: 200px; overflow-y: auto;">
                                    ${recentMessages.map(msg => `
                                        <div style="padding: 10px; background: var(--light-gray); border-radius: var(--radius); margin-bottom: 10px; ${!msg.read ? 'border-left: 3px solid var(--primary);' : ''}">
                                            <div style="display: flex; justify-content: space-between;">
                                                <strong>${msg.name}</strong>
                                                <small>${new Date(msg.created_at).toLocaleDateString()}</small>
                                            </div>
                                            <div style="font-size: 0.875rem; color: var(--gray);">${msg.subject}</div>
                                        </div>
                                    `).join('')}
                                </div>
                                ${unreadMessages > 0 ? `
                                    <button class="btn btn-sm btn-primary" onclick="app.showAdminSection('messages')" style="margin-top: 10px;">
                                        <i class="fas fa-envelope"></i> View All Messages (${unreadMessages} unread)
                                    </button>
                                ` : ''}
                            ` : `
                                <p style="color: var(--gray); margin-top: 10px;">No messages yet</p>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        sectionsContainer.innerHTML = dashboardHTML;
        this.state.currentAdminSection = 'dashboard';
        
        // Update active nav
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === 'dashboard') {
                btn.classList.add('active');
            }
        });
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
            case 'messages':
                sectionHTML = this.getMessagesManagementHTML();
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

    setupAdminSectionEventListeners(section) {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchAdminTab(tabId);
            });
        });
        
        // Form submissions
        if (section === 'developers') {
            const form = document.getElementById('admin-developer-form');
            if (form) {
                form.addEventListener('submit', (e) => this.handleDeveloperFormSubmit(e));
            }
        } else if (section === 'projects') {
            const form = document.getElementById('admin-project-form');
            if (form) {
                form.addEventListener('submit', (e) => this.handleProjectFormSubmit(e));
            }
        } else if (section === 'blog') {
            const form = document.getElementById('admin-blog-form');
            if (form) {
                form.addEventListener('submit', (e) => this.handleBlogFormSubmit(e));
            }
        } else if (section === 'settings') {
            const form = document.getElementById('admin-settings-form');
            if (form) {
                form.addEventListener('submit', (e) => this.handleSettingsFormSubmit(e));
            }
        }
    }

    switchAdminTab(tabId) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Activate corresponding tab button
        const tabBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (tabBtn) {
            tabBtn.classList.add('active');
        }
    }

    getDevelopersManagementHTML() {
        const developersListHTML = this.state.developers.map(dev => `
            <div class="admin-list-item">
                <div>
                    <h4 style="margin: 0;">${dev.name}</h4>
                    <p style="margin: 5px 0; color: var(--gray);">${dev.role}</p>
                    <small>${Array.isArray(dev.skills) ? dev.skills.slice(0, 3).join(', ') : dev.skills || ''}</small>
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
        
        const developerToEdit = this.state.editingId ? 
            this.state.developers.find(d => d.id === this.state.editingId) : null;
        
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
                            <button class="btn btn-primary" onclick="app.switchAdminTab('add-developer')" style="margin-top: var(--space-md);">
                                <i class="fas fa-user-plus"></i> Add First Developer
                            </button>
                        </div>
                    `}
                </div>
                
                <div id="add-developer" class="tab-content">
                    <h3>${this.state.editingId ? 'Edit Developer' : 'Add New Developer'}</h3>
                    <form id="admin-developer-form">
                        <input type="hidden" id="admin-developer-id" value="${developerToEdit?.id || ''}">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Full Name *</label>
                                <input type="text" class="form-control" id="admin-dev-name" value="${developerToEdit?.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Role/Position *</label>
                                <input type="text" class="form-control" id="admin-dev-role" value="${developerToEdit?.role || ''}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Profile Image URL *</label>
                                <input type="text" class="form-control" id="admin-dev-image" value="${developerToEdit?.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}" required>
                                <small style="color: var(--gray);">Use Unsplash or similar service for free high-quality images</small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email Address</label>
                                <input type="email" class="form-control" id="admin-dev-email" value="${developerToEdit?.email || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">GitHub Username</label>
                                <input type="text" class="form-control" id="admin-dev-github" value="${developerToEdit?.github || ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Skills (comma separated) *</label>
                                <input type="text" class="form-control" id="admin-dev-skills" value="${Array.isArray(developerToEdit?.skills) ? developerToEdit.skills.join(', ') : developerToEdit?.skills || ''}" required>
                                <small style="color: var(--gray);">Example: React, Node.js, Python, AWS</small>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Bio/Description *</label>
                            <textarea class="form-control" id="admin-dev-bio" rows="4" required>${developerToEdit?.bio || ''}</textarea>
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

    getProjectsManagementHTML() {
        const projectsListHTML = this.state.projects.map(project => `
            <div class="admin-list-item">
                <div>
                    <h4 style="margin: 0;">${project.title}</h4>
                    <p style="margin: 5px 0; color: var(--gray);">
                        ${project.type === 'web' ? 'Web Development' : 
                          project.type === 'mobile' ? 'Mobile App' : 
                          'UI/UX Design'}
                    </p>
                    <small>${Array.isArray(project.tech) ? project.tech.slice(0, 3).join(', ') : project.tech || ''}</small>
                </div>
                <div class="admin-list-actions">
                    <button class="btn btn-sm" onclick="app.editProject(${project.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteProject(${project.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        const projectToEdit = this.state.editingId ? 
            this.state.projects.find(p => p.id === this.state.editingId) : null;
        
        return `
            <div class="admin-section">
                <div class="tab-nav">
                    <button class="tab-btn active" data-tab="projects-list">All Projects (${this.state.projects.length})</button>
                    <button class="tab-btn" data-tab="add-project">${this.state.editingId ? 'Edit Project' : 'Add New Project'}</button>
                </div>
                
                <div id="projects-list" class="tab-content active">
                    <h3>Manage Projects</h3>
                    ${this.state.projects.length > 0 ? `
                        <div class="admin-list">
                            ${projectsListHTML}
                        </div>
                    ` : `
                        <div class="text-center" style="padding: var(--space-2xl);">
                            <i class="fas fa-project-diagram fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                            <h3>No Projects Yet</h3>
                            <p>Add your first project to showcase your work!</p>
                            <button class="btn btn-primary" onclick="app.switchAdminTab('add-project')" style="margin-top: var(--space-md);">
                                <i class="fas fa-plus-circle"></i> Add First Project
                            </button>
                        </div>
                    `}
                </div>
                
                <div id="add-project" class="tab-content">
                    <h3>${this.state.editingId ? 'Edit Project' : 'Add New Project'}</h3>
                    <form id="admin-project-form">
                        <input type="hidden" id="admin-project-id" value="${projectToEdit?.id || ''}">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Project Title *</label>
                                <input type="text" class="form-control" id="admin-project-title" value="${projectToEdit?.title || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Project Type *</label>
                                <select class="form-control" id="admin-project-type" required>
                                    <option value="web" ${projectToEdit?.type === 'web' ? 'selected' : ''}>Web Development</option>
                                    <option value="mobile" ${projectToEdit?.type === 'mobile' ? 'selected' : ''}>Mobile App</option>
                                    <option value="design" ${projectToEdit?.type === 'design' ? 'selected' : ''}>UI/UX Design</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Project Image URL *</label>
                                <input type="text" class="form-control" id="admin-project-image" value="${projectToEdit?.image || 'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Project Link (Optional)</label>
                                <input type="url" class="form-control" id="admin-project-link" value="${projectToEdit?.link || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Technologies (comma separated) *</label>
                            <input type="text" class="form-control" id="admin-project-tech" value="${Array.isArray(projectToEdit?.tech) ? projectToEdit.tech.join(', ') : projectToEdit?.tech || ''}" required>
                            <small style="color: var(--gray);">Example: React, Node.js, MongoDB, AWS</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Project Description *</label>
                            <textarea class="form-control" id="admin-project-description" rows="4" required>${projectToEdit?.description || ''}</textarea>
                        </div>
                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> ${this.state.editingId ? 'Update Project' : 'Save Project'}
                            </button>
                            <button type="button" class="btn btn-outline" onclick="app.resetProjectForm()">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    getBlogManagementHTML() {
        const blogListHTML = this.state.blogPosts.map(post => `
            <div class="admin-list-item">
                <div>
                    <h4 style="margin: 0;">${post.title}</h4>
                    <p style="margin: 5px 0; color: var(--gray);">
                        ${post.category || 'General'} • By ${post.author || 'Admin'}
                    </p>
                    <small>${new Date(post.created_at).toLocaleDateString()}</small>
                </div>
                <div class="admin-list-actions">
                    <button class="btn btn-sm" onclick="app.editBlogPost(${post.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteBlogPost(${post.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        const postToEdit = this.state.editingId ? 
            this.state.blogPosts.find(p => p.id === this.state.editingId) : null;
        
        return `
            <div class="admin-section">
                <div class="tab-nav">
                    <button class="tab-btn active" data-tab="blog-list">All Posts (${this.state.blogPosts.length})</button>
                    <button class="tab-btn" data-tab="add-blog">${this.state.editingId ? 'Edit Post' : 'Write New Post'}</button>
                </div>
                
                <div id="blog-list" class="tab-content active">
                    <h3>Manage Blog Posts</h3>
                    ${this.state.blogPosts.length > 0 ? `
                        <div class="admin-list">
                            ${blogListHTML}
                        </div>
                    ` : `
                        <div class="text-center" style="padding: var(--space-2xl);">
                            <i class="fas fa-newspaper fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                            <h3>No Blog Posts Yet</h3>
                            <p>Write your first blog post to share insights!</p>
                            <button class="btn btn-primary" onclick="app.switchAdminTab('add-blog')" style="margin-top: var(--space-md);">
                                <i class="fas fa-edit"></i> Write First Post
                            </button>
                        </div>
                    `}
                </div>
                
                <div id="add-blog" class="tab-content">
                    <h3>${this.state.editingId ? 'Edit Blog Post' : 'Write New Blog Post'}</h3>
                    <form id="admin-blog-form">
                        <input type="hidden" id="admin-blog-id" value="${postToEdit?.id || ''}">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Post Title *</label>
                                <input type="text" class="form-control" id="admin-blog-title" value="${postToEdit?.title || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Category *</label>
                                <input type="text" class="form-control" id="admin-blog-category" value="${postToEdit?.category || 'General'}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Author Name *</label>
                                <input type="text" class="form-control" id="admin-blog-author" value="${postToEdit?.author || 'Admin'}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Featured Image URL *</label>
                                <input type="text" class="form-control" id="admin-blog-image" value="${postToEdit?.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Excerpt/Summary *</label>
                            <textarea class="form-control" id="admin-blog-excerpt" rows="3" required>${postToEdit?.excerpt || ''}</textarea>
                            <small style="color: var(--gray);">Brief summary of the post (150-200 characters)</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Post Content *</label>
                            <textarea class="form-control" id="admin-blog-content" rows="8" required>${postToEdit?.content || ''}</textarea>
                            <small style="color: var(--gray);">Full blog post content</small>
                        </div>
                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> ${this.state.editingId ? 'Update Post' : 'Publish Post'}
                            </button>
                            <button type="button" class="btn btn-outline" onclick="app.resetBlogForm()">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    getMessagesManagementHTML() {
        const messagesListHTML = this.state.messages.map(msg => `
            <div class="admin-list-item" style="${!msg.read ? 'border-left: 3px solid var(--primary);' : ''}">
                <div>
                    <h4 style="margin: 0;">${msg.name} <small style="color: var(--gray);">(${msg.email})</small></h4>
                    <p style="margin: 5px 0; color: var(--primary); font-weight: 600;">${msg.subject}</p>
                    <p style="margin: 5px 0;">${msg.message.substring(0, 100)}${msg.message.length > 100 ? '...' : ''}</p>
                    <small style="color: var(--gray);">${new Date(msg.created_at).toLocaleString()}</small>
                </div>
                <div class="admin-list-actions">
                    <button class="btn btn-sm" onclick="app.viewMessage(${msg.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteMessage(${msg.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        return `
            <div class="admin-section">
                <h2>Messages (${this.state.messages.length})</h2>
                <p>Manage all contact form submissions and inquiries.</p>
                
                ${this.state.messages.length > 0 ? `
                    <div class="admin-list">
                        ${messagesListHTML}
                    </div>
                ` : `
                    <div class="text-center" style="padding: var(--space-2xl);">
                        <i class="fas fa-envelope fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                        <h3>No Messages Yet</h3>
                        <p>All contact form submissions will appear here.</p>
                    </div>
                `}
            </div>
        `;
    }

    getSettingsManagementHTML() {
        return `
            <div class="admin-section">
                <h2>Website Settings</h2>
                <p>Configure your website settings and preferences.</p>
                
                <form id="admin-settings-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Site Title *</label>
                            <input type="text" class="form-control" id="admin-settings-title" value="${this.state.settings.siteTitle || CONFIG.defaults.siteTitle}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Contact Email *</label>
                            <input type="email" class="form-control" id="admin-settings-email" value="${this.state.settings.contactEmail || CONFIG.defaults.contactEmail}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Contact Phone *</label>
                            <input type="text" class="form-control" id="admin-settings-phone" value="${this.state.settings.contactPhone || CONFIG.defaults.contactPhone}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Running Text *</label>
                            <input type="text" class="form-control" id="admin-settings-running-text" value="${this.state.settings.runningText || CONFIG.defaults.runningText}" required>
                            <small style="color: var(--gray);">Text that runs at the top of the page</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <div class="form-check" style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" class="form-control" id="admin-settings-chat-enabled" ${this.state.settings.chatEnabled !== false ? 'checked' : ''} style="width: auto;">
                                <label class="form-label" style="margin: 0;">Enable Chat Widget</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-check" style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" class="form-control" id="admin-settings-dark-mode" ${this.state.settings.darkMode ? 'checked' : ''} style="width: auto;">
                                <label class="form-label" style="margin: 0;">Enable Dark Mode by Default</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Gemini API Key (Optional)</label>
                        <input type="password" class="form-control" id="admin-settings-gemini-key" value="${CONFIG.geminiApiKey || ''}">
                        <small style="color: var(--gray);">
                            Enter your Google Gemini API key to enable AI chat features. 
                            <a href="https://makersuite.google.com/app/apikey" target="_blank">Get API key</a>
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Supabase Configuration</label>
                        <div style="background: var(--light-gray); padding: var(--space-md); border-radius: var(--radius);">
                            <p style="margin-bottom: var(--space-sm);">
                                <strong>Status:</strong> 
                                ${window.supabaseClient && CONFIG.supabaseUrl !== 'https://your-project.supabase.co' 
                                    ? '<span style="color: var(--success);">Connected</span>' 
                                    : '<span style="color: var(--warning);">Using Local Storage</span>'}
                            </p>
                            <p style="font-size: 0.875rem; color: var(--gray);">
                                To enable cloud storage, update the <code>supabaseUrl</code> and <code>supabaseKey</code> 
                                in the <code>config.js</code> file with your Supabase project credentials.
                            </p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 15px; margin-top: 30px;">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Save Settings
                        </button>
                        <button type="button" class="btn btn-outline" onclick="app.exportData()">
                            <i class="fas fa-download"></i> Export Data
                        </button>
                        <button type="button" class="btn btn-danger" onclick="app.resetData()">
                            <i class="fas fa-trash"></i> Reset All Data
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    async handleDeveloperFormSubmit(e) {
        e.preventDefault();
        
        const developerData = {
            id: this.state.editingId || this.state.developerIdCounter++,
            name: document.getElementById('admin-dev-name').value.trim(),
            role: document.getElementById('admin-dev-role').value.trim(),
            image: document.getElementById('admin-dev-image').value.trim(),
            email: document.getElementById('admin-dev-email').value.trim(),
            github: document.getElementById('admin-dev-github').value.trim(),
            skills: document.getElementById('admin-dev-skills').value.split(',').map(s => s.trim()).filter(s => s),
            bio: document.getElementById('admin-dev-bio').value.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        try {
            const saved = await this.saveToSupabase('developers', developerData);
            
            if (saved) {
                this.showNotification(`Developer ${this.state.editingId ? 'updated' : 'added'} successfully!`, 'success');
                this.state.editingId = null;
                await this.loadData();
                this.showAdminSection('developers');
            }
        } catch (error) {
            console.error('Error saving developer:', error);
            this.showNotification('Error saving developer', 'error');
        }
    }

    async handleProjectFormSubmit(e) {
        e.preventDefault();
        
        const projectData = {
            id: this.state.editingId || this.state.projectIdCounter++,
            title: document.getElementById('admin-project-title').value.trim(),
            type: document.getElementById('admin-project-type').value,
            image: document.getElementById('admin-project-image').value.trim(),
            link: document.getElementById('admin-project-link').value.trim(),
            tech: document.getElementById('admin-project-tech').value.split(',').map(t => t.trim()).filter(t => t),
            description: document.getElementById('admin-project-description').value.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        try {
            const saved = await this.saveToSupabase('projects', projectData);
            
            if (saved) {
                this.showNotification(`Project ${this.state.editingId ? 'updated' : 'added'} successfully!`, 'success');
                this.state.editingId = null;
                await this.loadData();
                this.showAdminSection('projects');
            }
        } catch (error) {
            console.error('Error saving project:', error);
            this.showNotification('Error saving project', 'error');
        }
    }

    async handleBlogFormSubmit(e) {
        e.preventDefault();
        
        const blogData = {
            id: this.state.editingId || this.state.blogIdCounter++,
            title: document.getElementById('admin-blog-title').value.trim(),
            category: document.getElementById('admin-blog-category').value.trim(),
            author: document.getElementById('admin-blog-author').value.trim(),
            image: document.getElementById('admin-blog-image').value.trim(),
            excerpt: document.getElementById('admin-blog-excerpt').value.trim(),
            content: document.getElementById('admin-blog-content').value.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        try {
            const saved = await this.saveToSupabase('blog_posts', blogData);
            
            if (saved) {
                this.showNotification(`Blog post ${this.state.editingId ? 'updated' : 'published'} successfully!`, 'success');
                this.state.editingId = null;
                await this.loadData();
                this.showAdminSection('blog');
            }
        } catch (error) {
            console.error('Error saving blog post:', error);
            this.showNotification('Error saving blog post', 'error');
        }
    }

    async handleSettingsFormSubmit(e) {
        e.preventDefault();
        
        const settingsData = {
            siteTitle: document.getElementById('admin-settings-title').value.trim(),
            contactEmail: document.getElementById('admin-settings-email').value.trim(),
            contactPhone: document.getElementById('admin-settings-phone').value.trim(),
            runningText: document.getElementById('admin-settings-running-text').value.trim(),
            chatEnabled: document.getElementById('admin-settings-chat-enabled').checked,
            darkMode: document.getElementById('admin-settings-dark-mode').checked
        };
        
        // Update Gemini API key in config
        const geminiKey = document.getElementById('admin-settings-gemini-key').value.trim();
        if (geminiKey) {
            CONFIG.geminiApiKey = geminiKey;
        }
        
        try {
            const saved = await this.saveToSupabase('settings', settingsData);
            
            if (saved) {
                this.showNotification('Settings saved successfully!', 'success');
                await this.loadData();
                this.showAdminSection('settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings', 'error');
        }
    }

    // Edit methods
    editDeveloper(id) {
        this.state.editingId = id;
        this.showAdminSection('developers');
        this.switchAdminTab('add-developer');
    }

    editProject(id) {
        this.state.editingId = id;
        this.showAdminSection('projects');
        this.switchAdminTab('add-project');
    }

    editBlogPost(id) {
        this.state.editingId = id;
        this.showAdminSection('blog');
        this.switchAdminTab('add-blog');
    }

    // Delete methods
    async deleteDeveloper(id) {
        if (!confirm('Are you sure you want to delete this developer?')) return;
        
        try {
            const updatedDevelopers = this.state.developers.filter(d => d.id !== id);
            const saved = await this.saveToSupabase('developers', updatedDevelopers);
            
            if (saved) {
                this.showNotification('Developer deleted successfully!', 'success');
                await this.loadData();
                this.showAdminSection('developers');
            }
        } catch (error) {
            console.error('Error deleting developer:', error);
            this.showNotification('Error deleting developer', 'error');
        }
    }

    async deleteProject(id) {
        if (!confirm('Are you sure you want to delete this project?')) return;
        
        try {
            const updatedProjects = this.state.projects.filter(p => p.id !== id);
            const saved = await this.saveToSupabase('projects', updatedProjects);
            
            if (saved) {
                this.showNotification('Project deleted successfully!', 'success');
                await this.loadData();
                this.showAdminSection('projects');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            this.showNotification('Error deleting project', 'error');
        }
    }

    async deleteBlogPost(id) {
        if (!confirm('Are you sure you want to delete this blog post?')) return;
        
        try {
            const updatedBlogPosts = this.state.blogPosts.filter(p => p.id !== id);
            const saved = await this.saveToSupabase('blog_posts', updatedBlogPosts);
            
            if (saved) {
                this.showNotification('Blog post deleted successfully!', 'success');
                await this.loadData();
                this.showAdminSection('blog');
            }
        } catch (error) {
            console.error('Error deleting blog post:', error);
            this.showNotification('Error deleting blog post', 'error');
        }
    }

    async deleteMessage(id) {
        if (!confirm('Are you sure you want to delete this message?')) return;
        
        try {
            const updatedMessages = this.state.messages.filter(m => m.id !== id);
            const saved = await this.saveToSupabase('messages', updatedMessages);
            
            if (saved) {
                this.showNotification('Message deleted successfully!', 'success');
                await this.loadData();
                this.showAdminSection('messages');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showNotification('Error deleting message', 'error');
        }
    }

    // View methods
    viewMessage(id) {
        const message = this.state.messages.find(m => m.id === id);
        if (message) {
            // Mark as read
            message.read = true;
            this.saveToSupabase('messages', message);
            
            alert(`Message Details:\n\nFrom: ${message.name} (${message.email})\nSubject: ${message.subject}\nDate: ${new Date(message.created_at).toLocaleString()}\n\nMessage:\n${message.message}`);
        }
    }

    viewProjectDetails(id) {
        const project = this.state.projects.find(p => p.id === id);
        if (project) {
            const typeMap = {
                'web': 'Web Development',
                'mobile': 'Mobile App',
                'design': 'UI/UX Design'
            };
            
            alert(`Project Details:\n\nTitle: ${project.title}\nType: ${typeMap[project.type] || project.type}\nDescription: ${project.description}\nTechnologies: ${Array.isArray(project.tech) ? project.tech.join(', ') : project.tech || 'Not specified'}\n${project.link ? `Live Link: ${project.link}` : ''}`);
        }
    }

    viewBlogPost(id) {
        const post = this.state.blogPosts.find(p => p.id === id);
        if (post) {
            alert(`Blog Post:\n\nTitle: ${post.title}\nAuthor: ${post.author}\nCategory: ${post.category}\nDate: ${new Date(post.created_at).toLocaleDateString()}\n\n${post.content || post.excerpt}`);
        }
    }

    // Reset methods
    resetDeveloperForm() {
        this.state.editingId = null;
        this.showAdminSection('developers');
    }

    resetProjectForm() {
        this.state.editingId = null;
        this.showAdminSection('projects');
    }

    resetBlogForm() {
        this.state.editingId = null;
        this.showAdminSection('blog');
    }

    // Export and reset data
    exportData() {
        const data = {
            developers: this.state.developers,
            projects: this.state.projects,
            blogPosts: this.state.blogPosts,
            messages: this.state.messages,
            settings: this.state.settings,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `nexusdev-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('Data exported successfully!', 'success');
    }

    resetData() {
        if (!confirm('WARNING: This will delete ALL data including developers, projects, blog posts, and messages. This action cannot be undone. Are you sure?')) {
            return;
        }
        
        if (!confirm('Are you absolutely sure? All data will be permanently deleted.')) {
            return;
        }
        
        // Reset all data
        this.state.developers = [];
        this.state.projects = [];
        this.state.blogPosts = [];
        this.state.messages = [];
        this.state.settings = { ...CONFIG.defaults };
        
        // Reset counters
        this.state.developerIdCounter = 1;
        this.state.projectIdCounter = 1;
        this.state.blogIdCounter = 1;
        this.state.messageIdCounter = 1;
        
        // Clear localStorage
        localStorage.removeItem('nexusdev_developers');
        localStorage.removeItem('nexusdev_projects');
        localStorage.removeItem('nexusdev_blog');
        localStorage.removeItem('nexusdev_messages');
        localStorage.removeItem('nexusdev_settings');
        
        // Clear Supabase data if connected
        if (window.supabaseClient) {
            // Note: This would require additional Supabase permissions
            console.log('Note: To clear Supabase data, you need to manually delete records from your Supabase tables.');
        }
        
        this.showNotification('All data has been reset!', 'success');
        this.updateUI();
        
        if (this.state.isAdmin) {
            this.loadAdminDashboard();
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NexusDevApp();
    window.app = app;
});