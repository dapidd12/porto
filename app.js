// Main Application - SpaceTeam | Dev
class SpaceTeamApp {
    constructor() {
        try {
            // Fix: Proper dark mode initialization
            const savedDarkMode = localStorage.getItem('darkMode');
            const defaultDarkMode = true; // Default to dark mode
            
            this.state = {
                darkMode: savedDarkMode !== null ? savedDarkMode === 'true' : defaultDarkMode,
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
                messageIdCounter: 1,
                resizeHandler: null
            };

            // Bind methods to maintain context
            this.init = this.init.bind(this);
            this.toggleDarkMode = this.toggleDarkMode.bind(this);
            this.toggleMobileMenu = this.toggleMobileMenu.bind(this);
            this.handleContactSubmit = this.handleContactSubmit.bind(this);
            this.handleAdminLogin = this.handleAdminLogin.bind(this);
            this.toggleChat = this.toggleChat.bind(this);
            this.sendChatMessage = this.sendChatMessage.bind(this);
            this.showAdminSection = this.showAdminSection.bind(this);
            this.switchAdminTab = this.switchAdminTab.bind(this);
            this.handleDeveloperFormSubmit = this.handleDeveloperFormSubmit.bind(this);
            this.handleProjectFormSubmit = this.handleProjectFormSubmit.bind(this);
            this.handleBlogFormSubmit = this.handleBlogFormSubmit.bind(this);
            this.handleSettingsFormSubmit = this.handleSettingsFormSubmit.bind(this);
            
            this.init();
        } catch (error) {
            console.error('App constructor error:', error);
            throw error;
        }
    }

    async init() {
        try {
            // Set current year
            const yearElement = document.getElementById('current-year');
            if (yearElement) {
                yearElement.textContent = new Date().getFullYear();
            }
            
            // Apply dark mode if enabled
            if (this.state.darkMode) {
                document.body.classList.add('dark-theme');
                const themeIcon = document.querySelector('#theme-toggle i');
                if (themeIcon) {
                    themeIcon.className = 'fas fa-sun';
                }
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
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showNotification('Error initializing application', 'error');
        }
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
            this.state.developerIdCounter = this.state.developers.length > 0 
                ? Math.max(...this.state.developers.map(d => d.id || 0), 0) + 1 
                : 1;
            
            // Load projects
            const { data: projects, error: projError } = await supabaseClient
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (projError) throw projError;
            this.state.projects = projects || [];
            this.state.projectIdCounter = this.state.projects.length > 0
                ? Math.max(...this.state.projects.map(p => p.id || 0), 0) + 1
                : 1;
            
            // Load blog posts
            const { data: blogPosts, error: blogError } = await supabaseClient
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (blogError) throw blogError;
            this.state.blogPosts = blogPosts || [];
            this.state.blogIdCounter = this.state.blogPosts.length > 0
                ? Math.max(...this.state.blogPosts.map(b => b.id || 0), 0) + 1
                : 1;
            
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
            
            this.state.settings = settingsData || { ...CONFIG.defaults, ...JSON.parse(localStorage.getItem('spaceteam_settings') || '{}') };
            
            // Load messages
            const { data: messages, error: msgError } = await supabaseClient
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (msgError) throw msgError;
            this.state.messages = messages || [];
            this.state.messageIdCounter = this.state.messages.length > 0
                ? Math.max(...this.state.messages.map(m => m.id || 0), 0) + 1
                : 1;
            
        } catch (error) {
            console.error('Supabase loading error:', error);
            throw error;
        }
    }

    loadFromLocalStorage() {
        this.state.developers = JSON.parse(localStorage.getItem('spaceteam_developers')) || [];
        this.state.projects = JSON.parse(localStorage.getItem('spaceteam_projects')) || [];
        this.state.blogPosts = JSON.parse(localStorage.getItem('spaceteam_blog')) || [];
        this.state.settings = JSON.parse(localStorage.getItem('spaceteam_settings')) || { ...CONFIG.defaults };
        this.state.messages = JSON.parse(localStorage.getItem('spaceteam_messages')) || [];
        
        // Update ID counters safely
        this.state.developerIdCounter = this.state.developers.length > 0
            ? Math.max(...this.state.developers.map(d => d.id || 0), 0) + 1
            : 1;
        this.state.projectIdCounter = this.state.projects.length > 0
            ? Math.max(...this.state.projects.map(p => p.id || 0), 0) + 1
            : 1;
        this.state.blogIdCounter = this.state.blogPosts.length > 0
            ? Math.max(...this.state.blogPosts.map(b => b.id || 0), 0) + 1
            : 1;
        this.state.messageIdCounter = this.state.messages.length > 0
            ? Math.max(...this.state.messages.map(m => m.id || 0), 0) + 1
            : 1;
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
                        localStorage.setItem('spaceteam_developers', JSON.stringify(data));
                        this.state.developers = data;
                    } else {
                        let developers = [...this.state.developers];
                        const index = developers.findIndex(d => d.id === data.id);
                        if (index >= 0) {
                            developers[index] = data;
                        } else {
                            developers.push(data);
                        }
                        localStorage.setItem('spaceteam_developers', JSON.stringify(developers));
                        this.state.developers = developers;
                    }
                    break;
                    
                case 'projects':
                    if (Array.isArray(data)) {
                        localStorage.setItem('spaceteam_projects', JSON.stringify(data));
                        this.state.projects = data;
                    } else {
                        let projects = [...this.state.projects];
                        const index = projects.findIndex(p => p.id === data.id);
                        if (index >= 0) {
                            projects[index] = data;
                        } else {
                            projects.push(data);
                        }
                        localStorage.setItem('spaceteam_projects', JSON.stringify(projects));
                        this.state.projects = projects;
                    }
                    break;
                    
                case 'blog_posts':
                    if (Array.isArray(data)) {
                        localStorage.setItem('spaceteam_blog', JSON.stringify(data));
                        this.state.blogPosts = data;
                    } else {
                        let blogPosts = [...this.state.blogPosts];
                        const index = blogPosts.findIndex(b => b.id === data.id);
                        if (index >= 0) {
                            blogPosts[index] = data;
                        } else {
                            blogPosts.push(data);
                        }
                        localStorage.setItem('spaceteam_blog', JSON.stringify(blogPosts));
                        this.state.blogPosts = blogPosts;
                    }
                    break;
                    
                case 'settings':
                    const mergedSettings = { ...this.state.settings, ...data };
                    localStorage.setItem('spaceteam_settings', JSON.stringify(mergedSettings));
                    this.state.settings = mergedSettings;
                    break;
                    
                case 'messages':
                    if (Array.isArray(data)) {
                        localStorage.setItem('spaceteam_messages', JSON.stringify(data));
                        this.state.messages = data;
                    } else {
                        let messages = [...this.state.messages];
                        messages.unshift(data);
                        if (messages.length > 100) messages = messages.slice(0, 100);
                        localStorage.setItem('spaceteam_messages', JSON.stringify(messages));
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
        const runningTextElement = document.getElementById('running-text');
        if (runningTextElement) {
            runningTextElement.textContent = runningText;
        }
        
        // Apply site title
        const siteTitle = this.state.settings.siteTitle || CONFIG.defaults.siteTitle;
        document.title = siteTitle;
        
        // Apply contact info
        const contactEmail = this.state.settings.contactEmail || CONFIG.defaults.contactEmail;
        const contactPhone = this.state.settings.contactPhone || CONFIG.defaults.contactPhone;
        
        const emailDisplay = document.getElementById('contact-email-display');
        const phoneDisplay = document.getElementById('contact-phone-display');
        const footerEmail = document.getElementById('footer-email');
        const footerPhone = document.getElementById('footer-phone');
        
        if (emailDisplay) emailDisplay.textContent = contactEmail;
        if (phoneDisplay) phoneDisplay.textContent = contactPhone;
        if (footerEmail) footerEmail.textContent = contactEmail;
        if (footerPhone) footerPhone.textContent = contactPhone;
        
        // Apply dark mode from settings
        if (this.state.settings.darkMode !== undefined && this.state.settings.darkMode !== this.state.darkMode) {
            this.toggleDarkMode();
        }
        
        // Show/hide chat based on settings
        const chatEnabled = this.state.settings.chatEnabled !== false;
        const chatToggle = document.getElementById('chat-toggle');
        if (chatToggle) {
            chatToggle.classList.toggle('hidden', !chatEnabled);
        }
    }

    renderDevelopers() {
        const container = document.getElementById('developers-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.state.developers.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; padding: var(--space-2xl);">
                    <div style="width: 80px; height: 80px; background: rgba(100, 255, 218, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                        <i class="fas fa-user-astronaut fa-2x" style="color: var(--secondary);"></i>
                    </div>
                    <h3 style="color: var(--secondary);">Mission Crew Assembling</h3>
                    <p style="color: var(--gray); max-width: 400px; margin: 0 auto;">Our elite space engineers are preparing for mission. Stand by for crew manifest!</p>
                    ${this.state.isAdmin ? `
                        <button class="btn btn-primary" onclick="window.showAdminSection('developers')" style="margin-top: var(--space-md);">
                            <i class="fas fa-user-astronaut"></i> Assign First Crew Member
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
            
            // Space-themed default image
            const defaultImage = 'https://images.unsplash.com/photo-1534796636910-9c1825470300?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
            
            const developerHTML = `
                <div class="developer-card animate__animated animate__fadeInUp" style="animation-delay: ${index * 100}ms">
                    <div class="developer-header">
                        <img src="${dev.image || defaultImage}" 
                             alt="${dev.name}" 
                             class="developer-image"
                             onerror="this.onerror=null; this.src='${defaultImage}'">
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
                                <i class="fas fa-satellite"></i> Contact
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
                    <div style="width: 80px; height: 80px; background: rgba(100, 255, 218, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                        <i class="fas fa-satellite fa-2x" style="color: var(--secondary);"></i>
                    </div>
                    <h3 style="color: var(--secondary);">Mission Log Empty</h3>
                    <p style="color: var(--gray); max-width: 400px; margin: 0 auto;">
                        ${filter === 'all' ? 'No missions completed yet. Preparing for launch!' : `No ${filter} missions found. Adjust mission parameters!`}
                    </p>
                    ${this.state.isAdmin ? `
                        <button class="btn btn-primary" onclick="window.showAdminSection('projects')" style="margin-top: var(--space-md);">
                            <i class="fas fa-rocket"></i> Log First Mission
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
                'web': 'Web Systems',
                'mobile': 'Mobile App',
                'design': 'UI/UX Design'
            };
            
            // Space-themed default image
            const defaultImage = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
            
            const projectHTML = `
                <div class="project-card animate__animated animate__fadeInUp" style="animation-delay: ${index * 100}ms">
                    <img src="${project.image || defaultImage}" 
                         alt="${project.title}" 
                         class="project-image"
                         onerror="this.onerror=null; this.src='${defaultImage}'">
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
                                    <i class="fas fa-external-link-alt"></i> Launch
                                </a>
                            ` : `
                                <button class="btn btn-sm btn-primary" onclick="window.viewProjectDetails(${project.id})">
                                    <i class="fas fa-eye"></i> Mission Details
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
                    <div style="width: 80px; height: 80px; background: rgba(100, 255, 218, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                        <i class="fas fa-newspaper fa-2x" style="color: var(--secondary);"></i>
                    </div>
                    <h3 style="color: var(--secondary);">Mission Briefings Pending</h3>
                    <p style="color: var(--gray); max-width: 400px; margin: 0 auto;">Stand by for mission briefings and tech discoveries!</p>
                    ${this.state.isAdmin ? `
                        <button class="btn btn-primary" onclick="window.showAdminSection('blog')" style="margin-top: var(--space-md);">
                            <i class="fas fa-edit"></i> Create First Briefing
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        this.state.blogPosts.forEach((post, index) => {
            // Space-themed default image
            const defaultImage = 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
            
            const excerpt = post.excerpt || (post.content ? post.content.substring(0, 150) + '...' : 'Briefing details classified.');
            
            const blogHTML = `
                <div class="blog-card animate__animated animate__fadeInUp" style="animation-delay: ${index * 100}ms">
                    <img src="${post.image || defaultImage}" 
                         alt="${post.title}" 
                         class="blog-image"
                         onerror="this.onerror=null; this.src='${defaultImage}'">
                    <div class="blog-content">
                        <span class="blog-category">${post.category || 'Mission Briefing'}</span>
                        <h3 class="blog-title">${post.title}</h3>
                        <p class="blog-excerpt">${excerpt}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                            <span><i class="fas fa-user-astronaut"></i> ${post.author || 'Mission Control'}</span>
                            <button class="btn btn-sm btn-outline" onclick="window.viewBlogPost(${post.id})">
                                Read Briefing
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', blogHTML);
        });
    }

    updateStats() {
        const projectsCount = document.getElementById('projects-count');
        const statsProjects = document.getElementById('stats-projects');
        const statsClients = document.getElementById('stats-clients');
        const statsArticles = document.getElementById('stats-articles');
        
        if (projectsCount) projectsCount.textContent = this.state.projects.length;
        if (statsProjects) statsProjects.textContent = this.state.projects.length;
        if (statsClients) statsClients.textContent = Math.floor(this.state.projects.length * 2.5);
        if (statsArticles) statsArticles.textContent = this.state.blogPosts.length;
    }

    initSkillsChart() {
        const ctx = document.getElementById('skillsChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.state.skillsChart) {
            this.state.skillsChart.destroy();
            this.state.skillsChart = null;
            
            // Remove resize listener
            if (this.state.resizeHandler) {
                window.removeEventListener('resize', this.state.resizeHandler);
                this.state.resizeHandler = null;
            }
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
                    <div style="width: 80px; height: 80px; background: rgba(100, 255, 218, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                        <i class="fas fa-chart-network fa-2x" style="color: var(--secondary);"></i>
                    </div>
                    <h3 style="color: var(--secondary);">Tech Galaxy Map Unavailable</h3>
                    <p style="color: var(--gray);">Assign crew members with skills to map the tech galaxy</p>
                    ${this.state.isAdmin ? `
                        <button class="btn btn-primary" onclick="window.showAdminSection('developers')" style="margin-top: var(--space-md);">
                            <i class="fas fa-user-astronaut"></i> Assign Crew Members
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        const isDark = document.body.classList.contains('dark-theme');
        // Fix: Better color contrast for both modes
        const gridColor = isDark ? 'rgba(100, 255, 218, 0.15)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#e6f1ff' : '#333333';
        const tickColor = isDark ? '#8892b0' : '#666666';
        
        try {
            this.state.skillsChart = new Chart(ctx.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Skill Proficiency',
                        data: data,
                        backgroundColor: 'rgba(100, 255, 218, 0.2)',
                        borderColor: 'rgba(100, 255, 218, 0.8)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(100, 255, 218, 1)',
                        pointBorderColor: isDark ? '#0a192f' : '#ffffff',
                        pointHoverBackgroundColor: isDark ? '#0a192f' : '#ffffff',
                        pointHoverBorderColor: 'rgba(100, 255, 218, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: window.innerWidth < 768 ? 1 : 2,
                    scales: {
                        r: {
                            angleLines: {
                                color: gridColor,
                                lineWidth: 1
                            },
                            grid: {
                                color: gridColor,
                                circular: true
                            },
                            pointLabels: {
                                font: {
                                    size: window.innerWidth < 768 ? 10 : 12,
                                    family: "'SF Mono', 'Fira Code', monospace"
                                },
                                color: textColor,
                                padding: 15
                            },
                            ticks: {
                                backdropColor: 'transparent',
                                color: tickColor,
                                stepSize: 20,
                                font: {
                                    size: 10
                                }
                            },
                            suggestedMin: 0,
                            suggestedMax: 100,
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: textColor,
                                font: {
                                    family: "'SF Mono', 'Fira Code', monospace",
                                    size: 12
                                },
                                padding: 20
                            }
                        },
                        tooltip: {
                            backgroundColor: isDark ? 'rgba(10, 25, 47, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                            titleColor: textColor,
                            bodyColor: textColor,
                            borderColor: 'rgba(100, 255, 218, 0.5)',
                            borderWidth: 1
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
            
            // Handle window resize
            this.state.resizeHandler = () => {
                if (this.state.skillsChart) {
                    this.state.skillsChart.resize();
                }
            };
            
            // Remove existing listener and add new one
            window.removeEventListener('resize', this.state.resizeHandler);
            window.addEventListener('resize', this.state.resizeHandler);
            
        } catch (error) {
            console.error('Error creating skills chart:', error);
            ctx.parentElement.innerHTML = `
                <div class="text-center" style="padding: var(--space-xl);">
                    <p style="color: var(--danger);">Unable to load skills visualization</p>
                </div>
            `;
        }
    }

    initUI() {
        // Initialize navigation active state
        this.updateActiveNavOnScroll();
        
        // Initialize project filtering
        this.setupProjectFiltering();
        
        // Mark sections as visible with delay
        setTimeout(() => {
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('visible');
            });
        }, 100);
    }

    setupEventListeners() {
        try {
            // Theme toggle
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', this.toggleDarkMode);
            }
            
            // Mobile menu
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', this.toggleMobileMenu);
            }
            
            // Navigation scroll
            document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => this.handleNavClick(e, link));
            });
            
            // Contact form
            const contactForm = document.getElementById('contact-form');
            if (contactForm) {
                contactForm.addEventListener('submit', this.handleContactSubmit);
            }
            
            // Admin login
            const adminLoginBtn = document.getElementById('admin-login-btn');
            if (adminLoginBtn) {
                adminLoginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showLoginModal();
                });
            }
            
            const closeLogin = document.getElementById('close-login');
            if (closeLogin) {
                closeLogin.addEventListener('click', () => this.hideLoginModal());
            }
            
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', this.handleAdminLogin);
            }
            
            // Chat widget
            const chatToggle = document.getElementById('chat-toggle');
            if (chatToggle) {
                chatToggle.addEventListener('click', this.toggleChat);
            }
            
            const closeChat = document.getElementById('close-chat');
            if (closeChat) {
                closeChat.addEventListener('click', this.toggleChat);
            }
            
            const sendChat = document.getElementById('send-chat');
            if (sendChat) {
                sendChat.addEventListener('click', this.sendChatMessage);
            }
            
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.sendChatMessage();
                });
            }
            
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
            
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    setupScrollAnimations() {
        const sections = document.querySelectorAll('.section');
        if (sections.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        sections.forEach(section => observer.observe(section));
    }

    setupScrollProgress() {
        const progressBar = document.getElementById('scroll-progress');
        if (!progressBar) return;
        
        const scrollHandler = () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = windowHeight > 0 ? (window.scrollY / windowHeight) * 100 : 0;
            progressBar.style.width = Math.min(scrolled, 100) + '%';
        };
        
        window.addEventListener('scroll', scrollHandler);
        // Initial call
        scrollHandler();
    }

    toggleDarkMode() {
        this.state.darkMode = !this.state.darkMode;
        document.body.classList.toggle('dark-theme', this.state.darkMode);
        localStorage.setItem('darkMode', this.state.darkMode);
        
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            icon.className = this.state.darkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // Update chart colors with delay to ensure DOM is ready
        setTimeout(() => {
            if (this.state.skillsChart) {
                this.initSkillsChart(); // Re-initialize for proper color update
            }
        }, 50);
    }

    toggleMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        const menuBtn = document.getElementById('mobile-menu-btn');
        
        if (!navLinks || !menuBtn) return;
        
        const isExpanded = navLinks.classList.toggle('active');
        
        // Update icon
        const icon = menuBtn.querySelector('i');
        if (icon) {
            icon.className = isExpanded ? 'fas fa-times' : 'fas fa-bars';
        }
        
        // Update accessibility
        menuBtn.setAttribute('aria-expanded', isExpanded);
    }

    handleNavClick(e, link) {
        const href = link.getAttribute('href');
        if (!href.startsWith('#')) return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            // Close mobile menu
            const navLinks = document.querySelector('.nav-links');
            const menuBtn = document.getElementById('mobile-menu-btn');
            if (navLinks && menuBtn) {
                navLinks.classList.remove('active');
                const icon = menuBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
                menuBtn.setAttribute('aria-expanded', 'false');
            }
            
            // Scroll to target
            const offset = 80; // Navbar height
            const targetPosition = target.offsetTop - offset;
            
            window.scrollTo({
                top: targetPosition,
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
        
        const name = document.getElementById('contact-name')?.value.trim() || '';
        const email = document.getElementById('contact-email')?.value.trim() || '';
        const subject = document.getElementById('contact-subject')?.value.trim() || '';
        const message = document.getElementById('contact-message')?.value.trim() || '';
        
        // Validation
        let isValid = true;
        
        if (!name) {
            this.showFormError('name-error', 'Astronaut name is required');
            isValid = false;
        }
        
        if (!email) {
            this.showFormError('email-error', 'Transmission address is required');
            isValid = false;
        } else if (!this.validateEmail(email)) {
            this.showFormError('email-error', 'Please enter a valid transmission address');
            isValid = false;
        }
        
        if (!subject) {
            this.showFormError('subject-error', 'Mission type is required');
            isValid = false;
        }
        
        if (!message) {
            this.showFormError('message-error', 'Mission briefing is required');
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
        if (!submitBtn) return;
        
        const originalText = submitBtn.innerHTML;
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            // Save message
            const saved = await this.saveToSupabase('messages', formData);
            
            if (saved) {
                this.state.messages.unshift(formData);
                this.showNotification('Transmission sent successfully! Mission control will respond soon.', 'success');
                e.target.reset();
            } else {
                this.showNotification('Failed to save transmission. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error saving message:', error);
            this.showNotification('Error sending transmission. Please try again.', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
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
        if (!navbar) return;
        
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
        
        if (sections.length === 0 || navLinks.length === 0) return;
        
        let current = '';
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
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
        const chatWidget = document.getElementById('chat-widget');
        if (chatWidget) {
            chatWidget.classList.toggle('hidden', !this.state.chatOpen);
        }
        
        if (this.state.chatOpen) {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                setTimeout(() => chatInput.focus(), 100);
            }
        }
    }

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Add user message
        const chatBody = document.getElementById('chat-body');
        if (!chatBody) return;
        
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user';
        userMsg.textContent = message;
        chatBody.appendChild(userMsg);
        
        // Clear input
        input.value = '';
        
        // Add loading indicator
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'chat-message bot';
        loadingMsg.innerHTML = '<i class="fas fa-satellite fa-spin"></i> Processing transmission...';
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
            errorMsg.textContent = "Transmission disrupted. Please contact mission control at " + (this.state.settings.contactEmail || CONFIG.defaults.contactEmail) + " for assistance.";
            chatBody.appendChild(errorMsg);
        }
        
        // Scroll to bottom
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    async getAIResponse(message) {
        // Check if Gemini API key is available
        if (CONFIG.geminiApiKey && CONFIG.geminiApiKey !== '' && CONFIG.geminiApiKey !== 'AIzaSyBNFp4JFNfx2bd37V0SgFueK4vEEKIZHsk') {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.geminiApiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `${CONFIG.aiSystemPrompt}\n\nAstronaut: ${message}\n\nSpaceTeam AI:`
                            }]
                        }]
                    })
                });

                if (!response.ok) {
                    throw new Error('API request failed');
                }

                const data = await response.json();
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    return data.candidates[0].content.parts[0].text;
                }
            } catch (error) {
                console.error('Gemini API error:', error);
                // Fall through to default response
            }
        }
        
        // Default responses if no API key or API fails
        const responses = [
            "Transmission received! SpaceTeam specializes in cutting-edge web and mobile development. Ready to discuss your mission parameters.",
            "Excellent inquiry! We offer mission briefings to plan your project. Would you like to schedule a transmission with mission control?",
            "Based on your transmission, I recommend checking our mission log for similar operations we've completed.",
            "We build digital solutions that push technological boundaries. How can we assist with your mission objectives?",
            "For mission estimates, we typically require mission parameters. Would you like to share more details about your operation?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    showLoginModal() {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.remove('hidden');
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                setTimeout(() => usernameInput.focus(), 100);
            }
        }
    }

    hideLoginModal() {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.add('hidden');
        }
        
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
        
        this.clearFormErrors();
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        this.clearFormErrors();
        
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (!usernameInput || !passwordInput) return;
        
        const email = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validation
        if (!email) {
            this.showFormError('login-email-error', 'Access code is required');
            return;
        }
        
        if (!password) {
            this.showFormError('login-password-error', 'Security key is required');
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('login-submit-btn');
        if (!submitBtn) return;
        
        const originalText = submitBtn.innerHTML;
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
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
                        localStorage.setItem('spaceteam_admin_token', data.session.access_token);
                    }
                } catch (supabaseError) {
                    console.warn('Supabase auth failed:', supabaseError);
                }
            }
            
            // Fallback to local authentication
            if (!authSuccess && email === CONFIG.adminEmail && password === CONFIG.adminPassword) {
                authSuccess = true;
                this.state.isAdmin = true;
                localStorage.setItem('spaceteam_admin', 'true');
            }
            
            if (authSuccess) {
                this.hideLoginModal();
                this.showAdminPanel();
                this.showNotification('Mission control access granted!', 'success');
            } else {
                this.showNotification('Invalid access code or security key', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Access denied. Please try again.', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    checkAdminSession() {
        const isAdminLoggedIn = localStorage.getItem('spaceteam_admin') === 'true' || 
                               localStorage.getItem('spaceteam_admin_token');
        
        if (isAdminLoggedIn) {
            this.state.isAdmin = true;
            this.showAdminPanel();
        }
    }

    showAdminPanel() {
        const mainContent = document.getElementById('main-content');
        const footer = document.getElementById('footer');
        const runningText = document.querySelector('.running-text-container');
        const adminPanel = document.getElementById('admin-panel');
        
        if (mainContent) mainContent.classList.add('hidden');
        if (footer) footer.classList.add('hidden');
        if (runningText) runningText.classList.add('hidden');
        if (adminPanel) adminPanel.classList.remove('hidden');
        
        this.loadAdminDashboard();
        this.setupAdminEventListeners();
    }

    hideAdminPanel() {
        const mainContent = document.getElementById('main-content');
        const footer = document.getElementById('footer');
        const runningText = document.querySelector('.running-text-container');
        const adminPanel = document.getElementById('admin-panel');
        
        if (mainContent) mainContent.classList.remove('hidden');
        if (footer) footer.classList.remove('hidden');
        if (runningText) runningText.classList.remove('hidden');
        if (adminPanel) adminPanel.classList.add('hidden');
        
        this.state.isAdmin = false;
        localStorage.removeItem('spaceteam_admin');
        localStorage.removeItem('spaceteam_admin_token');
        
        if (window.supabaseClient) {
            supabaseClient.auth.signOut().catch(console.error);
        }
        
        this.showNotification('Logged out from mission control', 'success');
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
        const adminLogout = document.getElementById('admin-logout');
        if (adminLogout) {
            adminLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideAdminPanel();
            });
        }
    }

    loadAdminDashboard() {
        const sectionsContainer = document.getElementById('admin-sections');
        if (!sectionsContainer) return;
        
        const unreadMessages = this.state.messages.filter(msg => !msg.read).length;
        const recentMessages = this.state.messages.slice(0, 5);
        
        const dashboardHTML = `
            <div class="admin-section">
                <h2>Mission Control Dashboard</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${this.state.developers.length}</div>
                        <div class="stat-label">Active Crew</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.state.projects.length}</div>
                        <div class="stat-label">Active Missions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.state.blogPosts.length}</div>
                        <div class="stat-label">Mission Briefings</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.state.messages.length}</div>
                        <div class="stat-label">Transmissions</div>
                        ${unreadMessages > 0 ? `<span style="position: absolute; top: 10px; right: 10px; background: var(--danger); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">${unreadMessages}</span>` : ''}
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <div class="form-row">
                        <div>
                            <h3>Mission Controls</h3>
                            <div style="display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                                <button class="btn btn-primary" onclick="window.showAdminSection('developers')">
                                    <i class="fas fa-user-astronaut"></i> Manage Crew
                                </button>
                                <button class="btn btn-secondary" onclick="window.showAdminSection('projects')">
                                    <i class="fas fa-rocket"></i> Manage Missions
                                </button>
                                <button class="btn btn-outline" onclick="window.showAdminSection('blog')">
                                    <i class="fas fa-edit"></i> Manage Briefings
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <h3>Recent Transmissions</h3>
                            ${recentMessages.length > 0 ? `
                                <div style="margin-top: 15px; max-height: 200px; overflow-y: auto;">
                                    ${recentMessages.map(msg => `
                                        <div style="padding: 10px; background: rgba(100, 255, 218, 0.05); border-radius: var(--radius); margin-bottom: 10px; border: 1px solid rgba(100, 255, 218, 0.1); ${!msg.read ? 'border-left: 3px solid var(--secondary);' : ''}">
                                            <div style="display: flex; justify-content: space-between;">
                                                <strong style="color: var(--dark);">${msg.name}</strong>
                                                <small style="color: var(--gray);">${new Date(msg.created_at).toLocaleDateString()}</small>
                                            </div>
                                            <div style="font-size: 0.875rem; color: var(--gray);">${msg.subject}</div>
                                        </div>
                                    `).join('')}
                                </div>
                                ${unreadMessages > 0 ? `
                                    <button class="btn btn-sm btn-primary" onclick="window.showAdminSection('messages')" style="margin-top: 10px;">
                                        <i class="fas fa-satellite"></i> View All Transmissions (${unreadMessages} unread)
                                    </button>
                                ` : ''}
                            ` : `
                                <p style="color: var(--gray); margin-top: 10px;">No transmissions yet</p>
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
        if (!sectionsContainer) return;
        
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
                // Remove existing listeners and add new one
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                newForm.addEventListener('submit', this.handleDeveloperFormSubmit);
            }
        } else if (section === 'projects') {
            const form = document.getElementById('admin-project-form');
            if (form) {
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                newForm.addEventListener('submit', this.handleProjectFormSubmit);
            }
        } else if (section === 'blog') {
            const form = document.getElementById('admin-blog-form');
            if (form) {
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                newForm.addEventListener('submit', this.handleBlogFormSubmit);
            }
        } else if (section === 'settings') {
            const form = document.getElementById('admin-settings-form');
            if (form) {
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                newForm.addEventListener('submit', this.handleSettingsFormSubmit);
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
                    <h4 style="margin: 0; color: var(--dark);">${dev.name}</h4>
                    <p style="margin: 5px 0; color: var(--gray);">${dev.role}</p>
                    <small style="color: var(--gray);">${Array.isArray(dev.skills) ? dev.skills.slice(0, 3).join(', ') : dev.skills || ''}</small>
                </div>
                <div class="admin-list-actions">
                    <button class="btn btn-sm" onclick="window.editDeveloper(${dev.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteDeveloper(${dev.id})">
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
                    <button class="tab-btn active" data-tab="developers-list">Mission Crew (${this.state.developers.length})</button>
                    <button class="tab-btn" data-tab="add-developer">${this.state.editingId ? 'Edit Crew Member' : 'Assign New Crew'}</button>
                </div>
                
                <div id="developers-list" class="tab-content active">
                    <h3>Manage Mission Crew</h3>
                    ${this.state.developers.length > 0 ? `
                        <div class="admin-list">
                            ${developersListHTML}
                        </div>
                    ` : `
                        <div class="text-center" style="padding: var(--space-2xl);">
                            <i class="fas fa-user-astronaut fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                            <h3 style="color: var(--dark);">No Crew Assigned</h3>
                            <p style="color: var(--gray);">Assign your first crew member to begin operations!</p>
                            <button class="btn btn-primary" onclick="window.switchAdminTab('add-developer')" style="margin-top: var(--space-md);">
                                <i class="fas fa-user-astronaut"></i> Assign First Crew
                            </button>
                        </div>
                    `}
                </div>
                
                <div id="add-developer" class="tab-content">
                    <h3>${this.state.editingId ? 'Edit Crew Member' : 'Assign New Crew Member'}</h3>
                    <form id="admin-developer-form">
                        <input type="hidden" id="admin-developer-id" value="${developerToEdit?.id || ''}">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Astronaut Name *</label>
                                <input type="text" class="form-control" id="admin-dev-name" value="${developerToEdit?.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Mission Role *</label>
                                <input type="text" class="form-control" id="admin-dev-role" value="${developerToEdit?.role || ''}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Profile Image URL *</label>
                                <input type="text" class="form-control" id="admin-dev-image" value="${developerToEdit?.image || 'https://images.unsplash.com/photo-1534796636910-9c1825470300?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}" required>
                                <small style="color: var(--gray);">Use Unsplash or similar service for space-themed images</small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Transmission Address</label>
                                <input type="email" class="form-control" id="admin-dev-email" value="${developerToEdit?.email || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">GitHub Callsign</label>
                                <input type="text" class="form-control" id="admin-dev-github" value="${developerToEdit?.github || ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Specializations (comma separated) *</label>
                                <input type="text" class="form-control" id="admin-dev-skills" value="${Array.isArray(developerToEdit?.skills) ? developerToEdit.skills.join(', ') : developerToEdit?.skills || ''}" required>
                                <small style="color: var(--gray);">Example: React, Node.js, Python, AWS, Space-Tech</small>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mission Bio *</label>
                            <textarea class="form-control" id="admin-dev-bio" rows="4" required>${developerToEdit?.bio || ''}</textarea>
                        </div>
                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> ${this.state.editingId ? 'Update Crew Member' : 'Assign to Mission'}
                            </button>
                            <button type="button" class="btn btn-outline" onclick="window.resetDeveloperForm()">
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
                    <h4 style="margin: 0; color: var(--dark);">${project.title}</h4>
                    <p style="margin: 5px 0; color: var(--gray);">
                        ${project.type === 'web' ? 'Web Systems' : 
                          project.type === 'mobile' ? 'Mobile App' : 
                          'UI/UX Design'}
                    </p>
                    <small style="color: var(--gray);">${Array.isArray(project.tech) ? project.tech.slice(0, 3).join(', ') : project.tech || ''}</small>
                </div>
                <div class="admin-list-actions">
                    <button class="btn btn-sm" onclick="window.editProject(${project.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteProject(${project.id})">
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
                    <button class="tab-btn active" data-tab="projects-list">Mission Log (${this.state.projects.length})</button>
                    <button class="tab-btn" data-tab="add-project">${this.state.editingId ? 'Edit Mission' : 'Log New Mission'}</button>
                </div>
                
                <div id="projects-list" class="tab-content active">
                    <h3>Manage Mission Log</h3>
                    ${this.state.projects.length > 0 ? `
                        <div class="admin-list">
                            ${projectsListHTML}
                        </div>
                    ` : `
                        <div class="text-center" style="padding: var(--space-2xl);">
                            <i class="fas fa-rocket fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                            <h3 style="color: var(--dark);">No Missions Logged</h3>
                            <p style="color: var(--gray);">Log your first mission to showcase operations!</p>
                            <button class="btn btn-primary" onclick="window.switchAdminTab('add-project')" style="margin-top: var(--space-md);">
                                <i class="fas fa-rocket"></i> Log First Mission
                            </button>
                        </div>
                    `}
                </div>
                
                <div id="add-project" class="tab-content">
                    <h3>${this.state.editingId ? 'Edit Mission' : 'Log New Mission'}</h3>
                    <form id="admin-project-form">
                        <input type="hidden" id="admin-project-id" value="${projectToEdit?.id || ''}">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Mission Name *</label>
                                <input type="text" class="form-control" id="admin-project-title" value="${projectToEdit?.title || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Mission Type *</label>
                                <select class="form-control" id="admin-project-type" required>
                                    <option value="web" ${projectToEdit?.type === 'web' ? 'selected' : ''}>Web Systems</option>
                                    <option value="mobile" ${projectToEdit?.type === 'mobile' ? 'selected' : ''}>Mobile App</option>
                                    <option value="design" ${projectToEdit?.type === 'design' ? 'selected' : ''}>UI/UX Design</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Mission Image URL *</label>
                                <input type="text" class="form-control" id="admin-project-image" value="${projectToEdit?.image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Mission Link (Optional)</label>
                                <input type="url" class="form-control" id="admin-project-link" value="${projectToEdit?.link || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Technologies Used *</label>
                            <input type="text" class="form-control" id="admin-project-tech" value="${Array.isArray(projectToEdit?.tech) ? projectToEdit.tech.join(', ') : projectToEdit?.tech || ''}" required>
                            <small style="color: var(--gray);">Example: React, Node.js, MongoDB, AWS, Space-Tech</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mission Report *</label>
                            <textarea class="form-control" id="admin-project-description" rows="4" required>${projectToEdit?.description || ''}</textarea>
                        </div>
                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> ${this.state.editingId ? 'Update Mission' : 'Log Mission'}
                            </button>
                            <button type="button" class="btn btn-outline" onclick="window.resetProjectForm()">
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
                    <h4 style="margin: 0; color: var(--dark);">${post.title}</h4>
                    <p style="margin: 5px 0; color: var(--gray);">
                        ${post.category || 'Mission Briefing'} • By ${post.author || 'Mission Control'}
                    </p>
                    <small style="color: var(--gray);">${new Date(post.created_at).toLocaleDateString()}</small>
                </div>
                <div class="admin-list-actions">
                    <button class="btn btn-sm" onclick="window.editBlogPost(${post.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteBlogPost(${post.id})">
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
                    <button class="tab-btn active" data-tab="blog-list">Mission Briefings (${this.state.blogPosts.length})</button>
                    <button class="tab-btn" data-tab="add-blog">${this.state.editingId ? 'Edit Briefing' : 'Create Briefing'}</button>
                </div>
                
                <div id="blog-list" class="tab-content active">
                    <h3>Manage Mission Briefings</h3>
                    ${this.state.blogPosts.length > 0 ? `
                        <div class="admin-list">
                            ${blogListHTML}
                        </div>
                    ` : `
                        <div class="text-center" style="padding: var(--space-2xl);">
                            <i class="fas fa-newspaper fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                            <h3 style="color: var(--dark);">No Briefings Available</h3>
                            <p style="color: var(--gray);">Create your first mission briefing!</p>
                            <button class="btn btn-primary" onclick="window.switchAdminTab('add-blog')" style="margin-top: var(--space-md);">
                                <i class="fas fa-edit"></i> Create First Briefing
                            </button>
                        </div>
                    `}
                </div>
                
                <div id="add-blog" class="tab-content">
                    <h3>${this.state.editingId ? 'Edit Mission Briefing' : 'Create Mission Briefing'}</h3>
                    <form id="admin-blog-form">
                        <input type="hidden" id="admin-blog-id" value="${postToEdit?.id || ''}">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Briefing Title *</label>
                                <input type="text" class="form-control" id="admin-blog-title" value="${postToEdit?.title || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Briefing Type *</label>
                                <input type="text" class="form-control" id="admin-blog-category" value="${postToEdit?.category || 'Mission Briefing'}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Author Callsign *</label>
                                <input type="text" class="form-control" id="admin-blog-author" value="${postToEdit?.author || 'Mission Control'}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Featured Image URL *</label>
                                <input type="text" class="form-control" id="admin-blog-image" value="${postToEdit?.image || 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Briefing Summary *</label>
                            <textarea class="form-control" id="admin-blog-excerpt" rows="3" required>${postToEdit?.excerpt || ''}</textarea>
                            <small style="color: var(--gray);">Brief summary of the briefing (150-200 characters)</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Full Briefing *</label>
                            <textarea class="form-control" id="admin-blog-content" rows="8" required>${postToEdit?.content || ''}</textarea>
                            <small style="color: var(--gray);">Complete mission briefing content</small>
                        </div>
                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> ${this.state.editingId ? 'Update Briefing' : 'Publish Briefing'}
                            </button>
                            <button type="button" class="btn btn-outline" onclick="window.resetBlogForm()">
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
            <div class="admin-list-item" style="${!msg.read ? 'border-left: 3px solid var(--secondary);' : ''}">
                <div>
                    <h4 style="margin: 0; color: var(--dark);">${msg.name} <small style="color: var(--gray);">(${msg.email})</small></h4>
                    <p style="margin: 5px 0; color: var(--secondary); font-weight: 600;">${msg.subject}</p>
                    <p style="margin: 5px 0; color: var(--dark);">${msg.message.substring(0, 100)}${msg.message.length > 100 ? '...' : ''}</p>
                    <small style="color: var(--gray);">${new Date(msg.created_at).toLocaleString()}</small>
                </div>
                <div class="admin-list-actions">
                    <button class="btn btn-sm" onclick="window.viewMessage(${msg.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteMessage(${msg.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        return `
            <div class="admin-section">
                <h2>Transmissions (${this.state.messages.length})</h2>
                <p style="color: var(--gray);">Manage all mission transmissions and inquiries.</p>
                
                ${this.state.messages.length > 0 ? `
                    <div class="admin-list">
                        ${messagesListHTML}
                    </div>
                ` : `
                    <div class="text-center" style="padding: var(--space-2xl);">
                        <i class="fas fa-satellite fa-3x" style="color: var(--gray); margin-bottom: var(--space-md);"></i>
                        <h3 style="color: var(--dark);">No Transmissions Yet</h3>
                        <p style="color: var(--gray);">All mission control transmissions will appear here.</p>
                    </div>
                `}
            </div>
        `;
    }

    getSettingsManagementHTML() {
        return `
            <div class="admin-section">
                <h2>Mission Control Systems</h2>
                <p style="color: var(--gray);">Configure mission control systems and preferences.</p>
                
                <form id="admin-settings-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Mission Name *</label>
                            <input type="text" class="form-control" id="admin-settings-title" value="${this.state.settings.siteTitle || CONFIG.defaults.siteTitle}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Transmission Address *</label>
                            <input type="email" class="form-control" id="admin-settings-email" value="${this.state.settings.contactEmail || CONFIG.defaults.contactEmail}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Transmission Frequency *</label>
                            <input type="text" class="form-control" id="admin-settings-phone" value="${this.state.settings.contactPhone || CONFIG.defaults.contactPhone}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mission Status Text *</label>
                            <input type="text" class="form-control" id="admin-settings-running-text" value="${this.state.settings.runningText || CONFIG.defaults.runningText}" required>
                            <small style="color: var(--gray);">Text that runs at the top of mission control</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <div class="form-check" style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" class="form-control" id="admin-settings-chat-enabled" ${this.state.settings.chatEnabled !== false ? 'checked' : ''} style="width: auto;">
                                <label class="form-label" style="margin: 0; color: var(--dark);">Enable AI Assistant</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="form-check" style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" class="form-control" id="admin-settings-dark-mode" ${this.state.settings.darkMode ? 'checked' : ''} style="width: auto;">
                                <label class="form-label" style="margin: 0; color: var(--dark);">Enable Dark Mode by Default</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Gemini API Key (Optional)</label>
                        <input type="password" class="form-control" id="admin-settings-gemini-key" value="${CONFIG.geminiApiKey || ''}">
                        <small style="color: var(--gray);">
                            Enter your Google Gemini API key to enable AI assistant. 
                            <a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: var(--secondary);">Get API key</a>
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Cloud Systems Configuration</label>
                        <div style="background: rgba(100, 255, 218, 0.05); padding: var(--space-md); border-radius: var(--radius); border: 1px solid rgba(100, 255, 218, 0.1);">
                            <p style="margin-bottom: var(--space-sm); color: var(--dark);">
                                <strong>System Status:</strong> 
                                ${window.supabaseClient && CONFIG.supabaseUrl !== 'https://your-project.supabase.co' 
                                    ? '<span style="color: var(--success);">Cloud Systems Active</span>' 
                                    : '<span style="color: var(--warning);">Using Local Storage</span>'}
                            </p>
                            <p style="font-size: 0.875rem; color: var(--gray);">
                                To enable cloud systems, update the <code style="color: var(--secondary); background: rgba(100, 255, 218, 0.1); padding: 2px 5px; border-radius: 3px;">supabaseUrl</code> and <code style="color: var(--secondary); background: rgba(100, 255, 218, 0.1); padding: 2px 5px; border-radius: 3px;">supabaseKey</code> 
                                in the <code style="color: var(--secondary); background: rgba(100, 255, 218, 0.1); padding: 2px 5px; border-radius: 3px;">config.js</code> file with your cloud credentials.
                            </p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 15px; margin-top: 30px; flex-wrap: wrap;">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Save Systems
                        </button>
                        <button type="button" class="btn btn-outline" onclick="window.exportData()">
                            <i class="fas fa-download"></i> Backup Data
                        </button>
                        <button type="button" class="btn btn-danger" onclick="window.resetData()">
                            <i class="fas fa-trash"></i> System Reset
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    async handleDeveloperFormSubmit(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('admin-dev-name');
        const roleInput = document.getElementById('admin-dev-role');
        const imageInput = document.getElementById('admin-dev-image');
        const skillsInput = document.getElementById('admin-dev-skills');
        const bioInput = document.getElementById('admin-dev-bio');
        
        if (!nameInput || !roleInput || !imageInput || !skillsInput || !bioInput) {
            this.showNotification('Form fields missing', 'error');
            return;
        }
        
        const developerData = {
            id: this.state.editingId || this.state.developerIdCounter++,
            name: nameInput.value.trim(),
            role: roleInput.value.trim(),
            image: imageInput.value.trim(),
            email: document.getElementById('admin-dev-email')?.value.trim() || '',
            github: document.getElementById('admin-dev-github')?.value.trim() || '',
            skills: skillsInput.value.split(',').map(s => s.trim()).filter(s => s),
            bio: bioInput.value.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }
        
        try {
            const saved = await this.saveToSupabase('developers', developerData);
            
            if (saved) {
                this.showNotification(`Crew member ${this.state.editingId ? 'updated' : 'assigned'} successfully!`, 'success');
                this.state.editingId = null;
                await this.loadData();
                this.showAdminSection('developers');
            } else {
                this.showNotification('Error saving crew member', 'error');
            }
        } catch (error) {
            console.error('Error saving crew member:', error);
            this.showNotification('Error saving crew member', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    async handleProjectFormSubmit(e) {
        e.preventDefault();
        
        const titleInput = document.getElementById('admin-project-title');
        const typeInput = document.getElementById('admin-project-type');
        const imageInput = document.getElementById('admin-project-image');
        const techInput = document.getElementById('admin-project-tech');
        const descriptionInput = document.getElementById('admin-project-description');
        
        if (!titleInput || !typeInput || !imageInput || !techInput || !descriptionInput) {
            this.showNotification('Form fields missing', 'error');
            return;
        }
        
        const projectData = {
            id: this.state.editingId || this.state.projectIdCounter++,
            title: titleInput.value.trim(),
            type: typeInput.value,
            image: imageInput.value.trim(),
            link: document.getElementById('admin-project-link')?.value.trim() || '',
            tech: techInput.value.split(',').map(t => t.trim()).filter(t => t),
            description: descriptionInput.value.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }
        
        try {
            const saved = await this.saveToSupabase('projects', projectData);
            
            if (saved) {
                this.showNotification(`Mission ${this.state.editingId ? 'updated' : 'logged'} successfully!`, 'success');
                this.state.editingId = null;
                await this.loadData();
                this.showAdminSection('projects');
            } else {
                this.showNotification('Error saving mission', 'error');
            }
        } catch (error) {
            console.error('Error saving mission:', error);
            this.showNotification('Error saving mission', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    async handleBlogFormSubmit(e) {
        e.preventDefault();
        
        const titleInput = document.getElementById('admin-blog-title');
        const categoryInput = document.getElementById('admin-blog-category');
        const authorInput = document.getElementById('admin-blog-author');
        const imageInput = document.getElementById('admin-blog-image');
        const excerptInput = document.getElementById('admin-blog-excerpt');
        const contentInput = document.getElementById('admin-blog-content');
        
        if (!titleInput || !categoryInput || !authorInput || !imageInput || !excerptInput || !contentInput) {
            this.showNotification('Form fields missing', 'error');
            return;
        }
        
        const blogData = {
            id: this.state.editingId || this.state.blogIdCounter++,
            title: titleInput.value.trim(),
            category: categoryInput.value.trim(),
            author: authorInput.value.trim(),
            image: imageInput.value.trim(),
            excerpt: excerptInput.value.trim(),
            content: contentInput.value.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }
        
        try {
            const saved = await this.saveToSupabase('blog_posts', blogData);
            
            if (saved) {
                this.showNotification(`Mission briefing ${this.state.editingId ? 'updated' : 'published'} successfully!`, 'success');
                this.state.editingId = null;
                await this.loadData();
                this.showAdminSection('blog');
            } else {
                this.showNotification('Error saving briefing', 'error');
            }
        } catch (error) {
            console.error('Error saving briefing:', error);
            this.showNotification('Error saving briefing', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    async handleSettingsFormSubmit(e) {
        e.preventDefault();
        
        const titleInput = document.getElementById('admin-settings-title');
        const emailInput = document.getElementById('admin-settings-email');
        const phoneInput = document.getElementById('admin-settings-phone');
        const runningTextInput = document.getElementById('admin-settings-running-text');
        const chatEnabledInput = document.getElementById('admin-settings-chat-enabled');
        const darkModeInput = document.getElementById('admin-settings-dark-mode');
        const geminiKeyInput = document.getElementById('admin-settings-gemini-key');
        
        if (!titleInput || !emailInput || !phoneInput || !runningTextInput || !chatEnabledInput || !darkModeInput) {
            this.showNotification('Form fields missing', 'error');
            return;
        }
        
        const settingsData = {
            siteTitle: titleInput.value.trim(),
            contactEmail: emailInput.value.trim(),
            contactPhone: phoneInput.value.trim(),
            runningText: runningTextInput.value.trim(),
            chatEnabled: chatEnabledInput.checked,
            darkMode: darkModeInput.checked
        };
        
        // Update Gemini API key in config
        if (geminiKeyInput && geminiKeyInput.value.trim()) {
            CONFIG.geminiApiKey = geminiKeyInput.value.trim();
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }
        
        try {
            const saved = await this.saveToSupabase('settings', settingsData);
            
            if (saved) {
                this.showNotification('Systems updated successfully!', 'success');
                await this.loadData();
                this.showAdminSection('settings');
            } else {
                this.showNotification('Error saving systems', 'error');
            }
        } catch (error) {
            console.error('Error saving systems:', error);
            this.showNotification('Error saving systems', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
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
        if (!confirm('Are you sure you want to remove this crew member from the mission?')) return;
        
        try {
            const updatedDevelopers = this.state.developers.filter(d => d.id !== id);
            const saved = await this.saveToSupabase('developers', updatedDevelopers);
            
            if (saved) {
                this.showNotification('Crew member removed successfully!', 'success');
                await this.loadData();
                this.showAdminSection('developers');
            } else {
                this.showNotification('Error removing crew member', 'error');
            }
        } catch (error) {
            console.error('Error removing crew member:', error);
            this.showNotification('Error removing crew member', 'error');
        }
    }

    async deleteProject(id) {
        if (!confirm('Are you sure you want to delete this mission from the log?')) return;
        
        try {
            const updatedProjects = this.state.projects.filter(p => p.id !== id);
            const saved = await this.saveToSupabase('projects', updatedProjects);
            
            if (saved) {
                this.showNotification('Mission deleted from log!', 'success');
                await this.loadData();
                this.showAdminSection('projects');
            } else {
                this.showNotification('Error deleting mission', 'error');
            }
        } catch (error) {
            console.error('Error deleting mission:', error);
            this.showNotification('Error deleting mission', 'error');
        }
    }

    async deleteBlogPost(id) {
        if (!confirm('Are you sure you want to delete this mission briefing?')) return;
        
        try {
            const updatedBlogPosts = this.state.blogPosts.filter(p => p.id !== id);
            const saved = await this.saveToSupabase('blog_posts', updatedBlogPosts);
            
            if (saved) {
                this.showNotification('Mission briefing deleted!', 'success');
                await this.loadData();
                this.showAdminSection('blog');
            } else {
                this.showNotification('Error deleting briefing', 'error');
            }
        } catch (error) {
            console.error('Error deleting briefing:', error);
            this.showNotification('Error deleting briefing', 'error');
        }
    }

    async deleteMessage(id) {
        if (!confirm('Are you sure you want to delete this transmission?')) return;
        
        try {
            const updatedMessages = this.state.messages.filter(m => m.id !== id);
            const saved = await this.saveToSupabase('messages', updatedMessages);
            
            if (saved) {
                this.showNotification('Transmission deleted!', 'success');
                await this.loadData();
                this.showAdminSection('messages');
            } else {
                this.showNotification('Error deleting transmission', 'error');
            }
        } catch (error) {
            console.error('Error deleting transmission:', error);
            this.showNotification('Error deleting transmission', 'error');
        }
    }

    // View methods
    viewMessage(id) {
        const message = this.state.messages.find(m => m.id === id);
        if (message) {
            // Mark as read
            message.read = true;
            this.saveToSupabase('messages', message).catch(console.error);
            
            alert(`Transmission Details:\n\nFrom: ${message.name} (${message.email})\nMission Type: ${message.subject}\nTransmission Time: ${new Date(message.created_at).toLocaleString()}\n\nTransmission:\n${message.message}`);
        }
    }

    viewProjectDetails(id) {
        const project = this.state.projects.find(p => p.id === id);
        if (project) {
            const typeMap = {
                'web': 'Web Systems',
                'mobile': 'Mobile App',
                'design': 'UI/UX Design'
            };
            
            alert(`Mission Details:\n\nMission Name: ${project.title}\nMission Type: ${typeMap[project.type] || project.type}\nMission Report: ${project.description}\nTechnologies: ${Array.isArray(project.tech) ? project.tech.join(', ') : project.tech || 'Not specified'}\n${project.link ? `Mission Link: ${project.link}` : ''}`);
        }
    }

    viewBlogPost(id) {
        const post = this.state.blogPosts.find(p => p.id === id);
        if (post) {
            alert(`Mission Briefing:\n\nTitle: ${post.title}\nAuthor: ${post.author}\nBriefing Type: ${post.category}\nTransmission Date: ${new Date(post.created_at).toLocaleDateString()}\n\n${post.content || post.excerpt}`);
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
        
        const exportFileDefaultName = `spaceteam-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        this.showNotification('Mission data backed up successfully!', 'success');
    }

    resetData() {
        if (!confirm('WARNING: This will delete ALL mission data including crew, missions, briefings, and transmissions. This action cannot be undone. Are you sure?')) {
            return;
        }
        
        if (!confirm('Are you absolutely sure? All mission data will be permanently deleted.')) {
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
        localStorage.removeItem('spaceteam_developers');
        localStorage.removeItem('spaceteam_projects');
        localStorage.removeItem('spaceteam_blog');
        localStorage.removeItem('spaceteam_messages');
        localStorage.removeItem('spaceteam_settings');
        
        // Note about Supabase data
        console.log('Note: To clear cloud data, you need to manually delete records from your Supabase tables.');
        
        this.showNotification('All mission data has been reset!', 'success');
        this.updateUI();
        
        if (this.state.isAdmin) {
            this.loadAdminDashboard();
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
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
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode === container) {
                    container.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new SpaceTeamApp();
        window.app = app;
        
        // Expose methods for inline onclick handlers
        window.showAdminSection = (section) => app.showAdminSection(section);
        window.viewProjectDetails = (id) => app.viewProjectDetails(id);
        window.viewBlogPost = (id) => app.viewBlogPost(id);
        window.switchAdminTab = (tabId) => app.switchAdminTab(tabId);
        window.resetDeveloperForm = () => app.resetDeveloperForm();
        window.resetProjectForm = () => app.resetProjectForm();
        window.resetBlogForm = () => app.resetBlogForm();
        window.editDeveloper = (id) => app.editDeveloper(id);
        window.editProject = (id) => app.editProject(id);
        window.editBlogPost = (id) => app.editBlogPost(id);
        window.deleteDeveloper = (id) => app.deleteDeveloper(id);
        window.deleteProject = (id) => app.deleteProject(id);
        window.deleteBlogPost = (id) => app.deleteBlogPost(id);
        window.deleteMessage = (id) => app.deleteMessage(id);
        window.viewMessage = (id) => app.viewMessage(id);
        window.exportData = () => app.exportData();
        window.resetData = () => app.resetData();
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #e53e3e; color: white; padding: 1rem; text-align: center; z-index: 9999;';
        errorDiv.textContent = 'Failed to load application. Please refresh the page.';
        document.body.appendChild(errorDiv);
    }
});