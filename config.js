// Configuration for the application
const CONFIG = {
    // Supabase Configuration
    supabaseUrl: 'https://your-project.supabase.co', // Replace with your Supabase URL
    supabaseKey: 'your-anon-key', // Replace with your Supabase anon key
    
    // Admin credentials (in production, use Supabase Auth)
    adminEmail: 'admin@nexusdev.com',
    adminPassword: 'Admin123!',
    
    // Gemini AI Configuration
    geminiApiKey: '', // Set your Gemini API key here
    
    // Application defaults
    defaults: {
        siteTitle: 'NexusDev | Professional Developer Portfolio',
        contactEmail: 'hello@nexusdev.com',
        contactPhone: '+62 812 3456 7890',
        runningText: '🚀 Professional Developer Team • 💻 Full-Stack Development • 🎨 UI/UX Design • 📱 Mobile Applications • 🔧 Cutting-edge Technology'
    },
    
    // Chat AI System Prompt
    aiSystemPrompt: `You are NexusDev AI Assistant, a professional AI assistant for NexusDev, a premium software development agency. Your role is to:
1. Provide information about NexusDev's services (web development, mobile apps, UI/UX design)
2. Answer questions about their portfolio and team
3. Help potential clients understand development processes
4. Collect contact information for consultations
5. Be professional, friendly, and helpful
6. Keep responses concise and relevant
7. Redirect complex technical questions to human experts
8. Always maintain NexusDev's professional brand image

About NexusDev:
- Team of expert developers specializing in modern web technologies
- Services: Custom web development, mobile apps, UI/UX design, consulting
- Technologies: React, Node.js, Python, AWS, React Native, Flutter
- Experience: 5+ years, 50+ successful projects
- Location: Jakarta, Indonesia (serving clients worldwide)

Always end with asking if they need anything else or would like to schedule a consultation.`
};

// Initialize Supabase client
let supabaseClient = null;
if (CONFIG.supabaseUrl && CONFIG.supabaseKey && 
    CONFIG.supabaseUrl !== 'https://your-project.supabase.co' && 
    CONFIG.supabaseKey !== 'your-anon-key') {
    supabaseClient = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
}

// Export configuration
window.CONFIG = CONFIG;
window.supabaseClient = supabaseClient;