import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mockProfiles = [
  {
    full_name: "Sarah Chen",
    password: "password123",
    department: "Computer Engineering",
    gpa: 3.8,
    track: "AI",
    commitment_level: "HIGH",
    bio: "Passionate about Deep Learning and Computer Vision. Looking for a team to build a real-time sign language translator.",
    linkedin_url: "https://linkedin.com/in/sarahchen",
    whatsapp_number: "+1234567890",
    is_available: true,
    team_status: "LOOKING",
    skills: ["Python", "TensorFlow", "PyTorch", "OpenCV"],
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Omar Youssef",
    password: "password123",
    department: "Computer Science",
    gpa: 3.5,
    track: "WEB_DEV",
    commitment_level: "MEDIUM",
    bio: "Full-stack developer loving Next.js and Tailwind. Prefer building scalable SaaS products.",
    linkedin_url: "https://linkedin.com/in/omaryoussef",
    is_available: true,
    team_status: "LOOKING",
    skills: ["React", "Next.js", "Node.js", "PostgreSQL"],
    avatar_url: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Fatma Ahmed",
    password: "password123",
    department: "Data Science",
    gpa: 3.9,
    track: "DATA_SCIENCE",
    commitment_level: "HIGH",
    bio: "Data enthusiast. I love crunching numbers and building predictive models. Seeking a strong backend dev to partner with.",
    is_available: true,
    team_status: "LOOKING_FOR_MORE",
    looking_for_role: "Backend Developer",
    skills: ["Python", "Pandas", "Scikit-Learn", "SQL"],
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Youssef Ibrahim",
    password: "password123",
    department: "Information Security",
    gpa: 3.2,
    track: "CYBERSECURITY",
    commitment_level: "LOW",
    bio: "Security researcher. I break things so you can fix them. Penetration testing is my jam.",
    is_available: true,
    team_status: "LOOKING",
    skills: ["Kali Linux", "Wireshark", "Network Security", "Python"],
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Lina Mahmoud",
    password: "password123",
    department: "Computer Science",
    gpa: 3.6,
    track: "MOBILE_DEV",
    commitment_level: "HIGH",
    bio: "Flutter developer aiming to build the next big mobile app. Needs a UI/UX designer and a backend person.",
    is_available: true,
    team_status: "LOOKING_FOR_MORE",
    looking_for_role: "UI/UX Designer",
    skills: ["Flutter", "Dart", "Firebase", "REST APIs"],
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Karim Hassan",
    password: "password123",
    department: "Computer Engineering",
    gpa: 2.9,
    track: "OTHER",
    commitment_level: "MEDIUM",
    bio: "Hardware guy trying to survive the software world. I can do embedded systems and C++.",
    is_available: true,
    team_status: "LOOKING",
    skills: ["C++", "C", "Embedded Systems", "Arduino"],
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Nour Ali",
    password: "password123",
    department: "Information Technology",
    gpa: 3.7,
    track: "WEB_DEV",
    commitment_level: "HIGH",
    bio: "Frontend magic. Making pixel-perfect UIs is what I do best. CSS is my superpower.",
    is_available: true,
    team_status: "LOOKING",
    skills: ["HTML", "CSS", "TailwindCSS", "Figma", "React"],
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Ahmed Kamal",
    password: "password123",
    department: "Computer Science",
    gpa: 3.4,
    track: "AI",
    commitment_level: "HIGH",
    bio: "NLP specialist. Currently working with LLMs and LangChain. Let's build a smart chatbot project!",
    is_available: true,
    team_status: "LOOKING",
    skills: ["Python", "Transformers", "LangChain", "OpenAI API"],
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200",
  }
];

async function seed() {
  console.log("Seeding started...");
  
  for (const profile of mockProfiles) {
    const { data, error } = await supabase.from('profiles').insert(profile).select();
    if (error) {
      console.error(`Error inserting ${profile.full_name}:`, error.message);
    } else {
      console.log(`Inserted ${profile.full_name}`);
    }
  }

  console.log("Seeding finished! You can delete this file.");
}

seed();
