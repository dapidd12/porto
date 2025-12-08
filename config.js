// Configuration for SpaceTeam | Dev - ENHANCED VERSION
const CONFIG = {
    // Supabase Configuration - UPDATE WITH YOUR CREDENTIALS
    supabaseUrl: 'https://ktvfoxucvcggekbhabix.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0dmZveHVjdmNnZ2VrYmhhYml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMzExOTAsImV4cCI6MjA4MDcwNzE5MH0.-LMeM5FjepOfE69aieZ8g9vyN5bmDK25ZeHj4Ij9fmg',
    
    // Admin credentials - CHANGE THESE IN PRODUCTION!
    adminEmail: 'mission@spaceteam.dev',
    adminPassword: 'SpaceTeam2024!',
    
    // Gemini AI Configuration - SET YOUR API KEY IN PRODUCTION
    geminiApiKey: '', // Empty or fill with your API key
    
    // AI System Prompt
    aiSystemPrompt: "You are the SpaceTeam AI assistant. Provide helpful responses about web development, projects, and services. Keep responses professional and space-themed.",
    
    // Default language
    defaultLanguage: 'id', // 'id' for Indonesian, 'en' for English
    
    // Application defaults
    defaults: {
        siteTitle: {
            en: 'SpaceTeam | Dev - Digital Space Explorers',
            id: 'SpaceTeam | Dev - Penjelajah Digital Antariksa'
        },
        contactEmail: 'mission@spaceteam.dev',
        contactPhone: '+62 821-3830-5820',
        runningText: {
            en: '🚀 SpaceTeam | Dev • 💻 Full-Stack Development • 🎨 UI/UX Design • 📱 Mobile Applications • 🌌 Cutting-edge Technology • 🔧 Cloud Systems • 🤖 AI Integration',
            id: '🚀 SpaceTeam | Dev • 💻 Pengembangan Full-Stack • 🎨 Desain UI/UX • 📱 Aplikasi Mobile • 🌌 Teknologi Terkini • 🔧 Sistem Cloud • 🤖 Integrasi AI'
        },
        chatEnabled: true,
        darkMode: true
    },
    
    // Language translations
    translations: {
        en: {
            // Navigation
            navHome: 'Home',
            navTeam: 'Team',
            navProjects: 'Projects',
            navBlog: 'Blog',
            navContact: 'Contact',
            navAdmin: 'Admin',
            
            // Hero Section
            heroTitle: 'Launching Digital',
            heroTitleHighlight: 'Innovations Beyond Limits',
            heroSubtitle: 'We are SpaceTeam | Dev, a crew of elite developers exploring the frontiers of technology. We build scalable, futuristic solutions that propel businesses into the digital cosmos.',
            btnExploreProjects: 'Explore Projects',
            btnMissionControl: 'Mission Control',
            
            // Stats
            statMissions: 'Successful Missions',
            statSatisfaction: 'Client Satisfaction',
            statExperience: 'Light Years Experience',
            statControl: 'Mission Control',
            
            // Developers Section
            sectionTeam: 'Mission Crew',
            sectionTeamSubtitle: 'Meet our elite team of space engineers, each specialized in different tech galaxies.',
            sectionSkills: 'Tech Galaxy Map',
            sectionSkillsSubtitle: 'Our expertise spans across multiple technology constellations',
            
            // Projects Section
            sectionProjects: 'Mission Log',
            sectionProjectsSubtitle: 'Explore our portfolio of successful missions across the digital universe',
            filterAll: 'All Missions',
            filterWeb: 'Web Systems',
            filterMobile: 'Mobile Apps',
            filterDesign: 'UI/UX Design',
            btnViewDetails: 'Mission Details',
            btnLaunch: 'Launch',
            btnReadMore: 'Read More',
            
            // Website Projects
            sectionWebsites: 'Website Projects',
            sectionWebsitesSubtitle: 'Our deployed websites and web applications',
            websiteStatusLive: '🚀 Live',
            websiteStatusMaintenance: '🚧 Maintenance',
            websiteStatusDev: '👨‍💻 Development',
            btnVisitSite: 'Visit Site',
            
            // Blog Section
            sectionBlog: 'Mission Briefings',
            sectionBlogSubtitle: 'Latest updates and discoveries from our tech expeditions',
            
            // Contact Section
            sectionContact: 'Mission Control',
            sectionContactSubtitle: 'Ready to launch your next project? Connect with mission control.',
            contactTransmit: 'Transmit Signal',
            contactFrequency: 'Transmission Frequency',
            contactStation: 'Ground Station',
            responseTime: 'Response within 24 light-minutes',
            available: 'Available for transmissions',
            orbitalMeetings: 'Orbital meetings available',
            
            // Form Labels
            formName: 'Astronaut Name *',
            formEmail: 'Transmission Address *',
            formSubject: 'Mission Type *',
            formMessage: 'Mission Briefing *',
            formAccessCode: 'Access Code *',
            formSecurityKey: 'Security Key *',
            btnLaunchTransmission: 'Launch Transmission',
            btnAccessControl: 'Access Control',
            
            // Stats Section
            statCompleted: 'Missions Completed',
            statCosmonauts: 'Satisfied Cosmonauts',
            statLogs: 'Mission Logs',
            
            // Footer
            footerDescription: 'We explore the digital universe, building solutions that reach beyond the stars. Our mission is to propel businesses into the future with cutting-edge technology.',
            footerFlightPath: 'Flight Path',
            footerServices: 'Services',
            footerGroundControl: 'Ground Control',
            footerCommandCenter: 'Command Center',
            footerMissionCrew: 'Mission Crew',
            footerMissionLog: 'Mission Log',
            footerBriefings: 'Briefings',
            footerControlRoom: 'Control Room',
            footerWebDev: 'Web Development',
            footerMobileApps: 'Mobile Apps',
            footerUIDesign: 'UI/UX Design',
            footerCloud: 'Cloud Systems',
            footerAI: 'AI Integration',
            footerCopyright: 'All systems operational.',
            
            // Chat
            chatGreeting: 'Greetings, astronaut! I\'m your SpaceTeam AI assistant. How can I assist with your mission today? You can ask about our services, mission logs, or request a briefing.',
            chatPlaceholder: 'Type your transmission...',
            chatSend: 'Transmit',
            
            // Admin Panel
            adminDashboard: 'Mission Control Dashboard',
            adminActiveCrew: 'Active Crew',
            adminActiveMissions: 'Active Missions',
            adminMissionBriefings: 'Mission Briefings',
            adminTransmissions: 'Transmissions',
            adminManageCrew: 'Manage Crew',
            adminManageMissions: 'Manage Missions',
            adminManageWebsites: 'Manage Websites',
            adminManageBriefings: 'Manage Briefings',
            adminRecentTransmissions: 'Recent Transmissions',
            
            // Login Modal
            loginTitle: 'Mission Control Access',
            
            // Empty States
            emptyCrew: 'Mission Crew Assembling',
            emptyCrewText: 'Our elite space engineers are preparing for mission. Stand by for crew manifest!',
            emptyProjects: 'Mission Log Empty',
            emptyProjectsText: 'No missions completed yet. Preparing for launch!',
            emptyProjectsWeb: 'No web projects found',
            emptyProjectsMobile: 'No mobile projects found',
            emptyProjectsDesign: 'No design projects found',
            emptyBlog: 'Mission Briefings Pending',
            emptyBlogText: 'Stand by for mission briefings and tech discoveries!',
            emptyWebsites: 'No Websites Deployed',
            emptyWebsitesText: 'No website projects have been deployed yet.',
            
            // Notifications
            notificationSuccess: 'Success',
            notificationError: 'Error',
            notificationWarning: 'Warning',
            notificationInfo: 'Info',
            
            // Admin Actions
            edit: 'Edit',
            delete: 'Delete',
            save: 'Save',
            cancel: 'Cancel',
            preview: 'Preview',
            update: 'Update'
        },
        
        id: {
            // Navigation
            navHome: 'Beranda',
            navTeam: 'Tim',
            navProjects: 'Proyek',
            navBlog: 'Blog',
            navContact: 'Kontak',
            navAdmin: 'Admin',
            
            // Hero Section
            heroTitle: 'Meluncurkan Inovasi',
            heroTitleHighlight: 'Digital Melampaui Batas',
            heroSubtitle: 'Kami adalah SpaceTeam | Dev, kru pengembang elit yang menjelajahi batas teknologi. Kami membangun solusi futuristik yang dapat diskalakan untuk mendorong bisnis ke dalam kosmos digital.',
            btnExploreProjects: 'Jelajahi Proyek',
            btnMissionControl: 'Kontrol Misi',
            
            // Stats
            statMissions: 'Misi Sukses',
            statSatisfaction: 'Kepuasan Klien',
            statExperience: 'Pengalaman Tahun Cahaya',
            statControl: 'Kontrol Misi',
            
            // Developers Section
            sectionTeam: 'Kru Misi',
            sectionTeamSubtitle: 'Temukan tim elit insinyur antariksa kami, masing-masing ahli di galaksi teknologi yang berbeda.',
            sectionSkills: 'Peta Galaksi Teknologi',
            sectionSkillsSubtitle: 'Keahlian kami mencakup berbagai konstelasi teknologi',
            
            // Projects Section
            sectionProjects: 'Log Misi',
            sectionProjectsSubtitle: 'Jelajahi portofolio misi sukses kami di seluruh alam semesta digital',
            filterAll: 'Semua Misi',
            filterWeb: 'Sistem Web',
            filterMobile: 'Aplikasi Mobile',
            filterDesign: 'Desain UI/UX',
            btnViewDetails: 'Detail Misi',
            btnLaunch: 'Luncurkan',
            btnReadMore: 'Baca Selengkapnya',
            
            // Website Projects
            sectionWebsites: 'Proyek Website',
            sectionWebsitesSubtitle: 'Website dan aplikasi web yang telah kami luncurkan',
            websiteStatusLive: '🚀 Live',
            websiteStatusMaintenance: '🚧 Maintenance',
            websiteStatusDev: '👨‍💻 Development',
            btnVisitSite: 'Kunjungi Situs',
            
            // Blog Section
            sectionBlog: 'Pengarahan Misi',
            sectionBlogSubtitle: 'Update dan penemuan terbaru dari ekspedisi teknologi kami',
            
            // Contact Section
            sectionContact: 'Kontrol Misi',
            sectionContactSubtitle: 'Siap meluncurkan proyek Anda berikutnya? Hubungi kontrol misi.',
            contactTransmit: 'Kirim Sinyal',
            contactFrequency: 'Frekuensi Transmisi',
            contactStation: 'Stasiun Darat',
            responseTime: 'Respon dalam 24 menit cahaya',
            available: 'Tersedia untuk transmisi',
            orbitalMeetings: 'Rapat orbital tersedia',
            
            // Form Labels
            formName: 'Nama Astronot *',
            formEmail: 'Alamat Transmisi *',
            formSubject: 'Tipe Misi *',
            formMessage: 'Pengantar Misi *',
            formAccessCode: 'Kode Akses *',
            formSecurityKey: 'Kunci Keamanan *',
            btnLaunchTransmission: 'Luncurkan Transmisi',
            btnAccessControl: 'Akses Kontrol',
            
            // Stats Section
            statCompleted: 'Misi Selesai',
            statCosmonauts: 'Kosmonaut Puas',
            statLogs: 'Log Misi',
            
            // Footer
            footerDescription: 'Kami menjelajahi alam semesta digital, membangun solusi yang melampaui bintang. Misi kami adalah mendorong bisnis ke masa depan dengan teknologi terkini.',
            footerFlightPath: 'Jalur Penerbangan',
            footerServices: 'Layanan',
            footerGroundControl: 'Kontrol Darat',
            footerCommandCenter: 'Pusat Komando',
            footerMissionCrew: 'Kru Misi',
            footerMissionLog: 'Log Misi',
            footerBriefings: 'Pengarahan',
            footerControlRoom: 'Ruang Kontrol',
            footerWebDev: 'Pengembangan Web',
            footerMobileApps: 'Aplikasi Mobile',
            footerUIDesign: 'Desain UI/UX',
            footerCloud: 'Sistem Cloud',
            footerAI: 'Integrasi AI',
            footerCopyright: 'Semua sistem beroperasi.',
            
            // Chat
            chatGreeting: 'Salam, astronot! Saya adalah asisten AI SpaceTeam Anda. Bagaimana saya bisa membantu misi Anda hari ini? Anda dapat bertanya tentang layanan kami, log misi, atau meminta pengarahan.',
            chatPlaceholder: 'Ketik transmisi Anda...',
            chatSend: 'Kirim',
            
            // Admin Panel
            adminDashboard: 'Dashboard Kontrol Misi',
            adminActiveCrew: 'Kru Aktif',
            adminActiveMissions: 'Misi Aktif',
            adminMissionBriefings: 'Pengarahan Misi',
            adminTransmissions: 'Transmisi',
            adminManageCrew: 'Kelola Kru',
            adminManageMissions: 'Kelola Misi',
            adminManageWebsites: 'Kelola Website',
            adminManageBriefings: 'Kelola Pengarahan',
            adminRecentTransmissions: 'Transmisi Terbaru',
            
            // Login Modal
            loginTitle: 'Akses Kontrol Misi',
            
            // Empty States
            emptyCrew: 'Kru Misi Berkumpul',
            emptyCrewText: 'Insinyur antariksa elit kami sedang bersiap untuk misi. Tunggu manifes kru!',
            emptyProjects: 'Log Misi Kosong',
            emptyProjectsText: 'Belum ada misi yang diselesaikan. Bersiap untuk peluncuran!',
            emptyProjectsWeb: 'Tidak ada proyek web',
            emptyProjectsMobile: 'Tidak ada proyek mobile',
            emptyProjectsDesign: 'Tidak ada proyek desain',
            emptyBlog: 'Pengarahan Misi Tertunda',
            emptyBlogText: 'Tunggu pengarahan misi dan penemuan teknologi!',
            emptyWebsites: 'Belum Ada Website',
            emptyWebsitesText: 'Belum ada proyek website yang diluncurkan.',
            
            // Notifications
            notificationSuccess: 'Sukses',
            notificationError: 'Error',
            notificationWarning: 'Peringatan',
            notificationInfo: 'Info',
            
            // Admin Actions
            edit: 'Edit',
            delete: 'Hapus',
            save: 'Simpan',
            cancel: 'Batal',
            preview: 'Pratinjau',
            update: 'Perbarui'
        }
    }
};

// Initialize Supabase client with enhanced error handling
let supabaseClient = null;
try {
    if (CONFIG.supabaseUrl && CONFIG.supabaseKey && 
        CONFIG.supabaseUrl !== 'https://your-project.supabase.co' && 
        CONFIG.supabaseKey !== 'your-anon-key') {
        supabaseClient = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'x-application-name': 'SpaceTeam-Dev'
                }
            }
        });
        console.log('✅ Supabase client initialized successfully');
    } else {
        console.warn('⚠️ Supabase credentials not configured. Using localStorage mode.');
    }
} catch (error) {
    console.error('❌ Supabase client initialization failed:', error);
}

// Export configuration
window.CONFIG = CONFIG;
window.supabaseClient = supabaseClient;

// Add global error handler
window.addEventListener('error', function(e) {
    console.error('🔴 Global error caught:', e.error);
    // You can add error reporting here (e.g., to Sentry, LogRocket)
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('🔴 Unhandled promise rejection:', e.reason);
    // You can add error reporting here
});

// Add performance monitoring
if (window.performance) {
    window.addEventListener('load', function() {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`📊 Page loaded in ${pageLoadTime}ms`);
    });
}

// Add service worker registration (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('⚡ ServiceWorker registered:', registration.scope);
        }).catch(function(error) {
            console.log('❌ ServiceWorker registration failed:', error);
        });
    });
}