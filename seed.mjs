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
    department: "CS",
    gpa: 3.8,
    track: "Artificial Intelligence",
    bio: "Building real-time sign language translation apps. Passionate about Deep Learning and Computer Vision.",
    linkedin_url: "https://linkedin.com/in/sarahchen",
    whatsapp_number: "+1234567890",
    is_available: true,
    team_status: "LOOKING",
    looking_for_role: "Machine Learning Engineer",
    skills: ["Python", "TensorFlow", "PyTorch", "Scikit-Learn"],
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Omar Youssef",
    password: "password123",
    department: "SE",
    gpa: 3.5,
    track: "Web Development",
    bio: "Passionate frontend developer crafting beautiful user interfaces. Loving Next.js, React, and TailwindCSS.",
    linkedin_url: "https://linkedin.com/in/omaryoussef",
    whatsapp_number: "+201029384756",
    is_available: true,
    team_status: "LOOKING",
    looking_for_role: "Frontend Developer, UI/UX Designer",
    skills: ["React", "Next.js", "TailwindCSS", "Figma", "JavaScript"],
    avatar_url: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Fatma Ahmed",
    password: "password123",
    department: "CS",
    gpa: 3.9,
    track: "Data Science",
    bio: "Leader of Team DataSight. We are building a predictive maintenance SaaS dashboard for smart cities. Seeking strong backend and UI developers to partner with.",
    linkedin_url: "https://linkedin.com/in/fatmaahmed",
    whatsapp_number: "+201122334455",
    is_available: true,
    team_status: "LOOKING_FOR_MORE",
    looking_for_role: "Backend Developer, UI/UX Designer",
    skills: ["Python", "Pandas", "NumPy", "SQL", "Tableau", "Statistics"],
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Youssef Ibrahim",
    password: "password123",
    department: "IS",
    gpa: 3.2,
    track: "Cybersecurity",
    bio: "Ethical hacker and security researcher. I do penetration testing and network securing. Looking to join a graduation project as a security expert.",
    linkedin_url: "https://linkedin.com/in/youssefibrahim",
    whatsapp_number: "+201555667788",
    is_available: true,
    team_status: "LOOKING",
    looking_for_role: "Cybersecurity Specialist",
    skills: ["Wireshark", "Linux", "Metasploit", "Python", "Network Security"],
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Lina Mahmoud",
    password: "password123",
    department: "IT",
    gpa: 3.6,
    track: "Mobile App Development",
    bio: "Leader of Team MedLink. Creating a cross-platform telemedicine application connecting students with campus clinics.",
    linkedin_url: "https://linkedin.com/in/linamahmoud",
    whatsapp_number: "+201288990011",
    is_available: true,
    team_status: "LOOKING_FOR_MORE",
    looking_for_role: "UI/UX Designer, Backend Developer, Flutter Developer",
    skills: ["Flutter", "Dart", "Firebase", "REST APIs", "Mobile App Development"],
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Karim Hassan",
    password: "password123",
    department: "SE",
    gpa: 3.1,
    track: "Embedded Systems",
    bio: "Hardware specialist. Finalizing the smart greenhouse automated team project.",
    linkedin_url: "https://linkedin.com/in/karimhassan",
    whatsapp_number: "+201099887766",
    is_available: false,
    team_status: "COMPLETE",
    looking_for_role: "Embedded Systems Engineer",
    skills: ["C++", "C", "Arduino", "Raspberry Pi", "RTOS"],
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Nour Ali",
    password: "password123",
    department: "MM",
    gpa: 3.7,
    track: "UI/UX Design",
    bio: "Obsessed with creating human-centric experiences. I design beautiful wireframes and interactive user journeys.",
    linkedin_url: "https://linkedin.com/in/nourali",
    whatsapp_number: "+201123458900",
    is_available: true,
    team_status: "LOOKING",
    looking_for_role: "UI/UX Designer",
    skills: ["Figma", "Adobe XD", "Wireframing", "Prototyping", "User Research", "Interaction Design"],
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Ahmed Kamal",
    password: "password123",
    department: "AI",
    gpa: 3.4,
    track: "Natural Language Processing",
    bio: "Working with Large Language Models. Building conversational bots and semantic search engines.",
    linkedin_url: "https://linkedin.com/in/ahmedkamal",
    whatsapp_number: "+201233445566",
    is_available: true,
    team_status: "LOOKING",
    looking_for_role: "AI Engineer, Full Stack Developer",
    skills: ["Python", "LangChain", "Transformers", "OpenAI API", "Hugging Face"],
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Mariam Selim",
    password: "password123",
    department: "CS",
    gpa: 3.85,
    track: "Cloud Computing",
    bio: "Leader of Team CloudScale. Creating a serverless automated deployment platform for educational labs.",
    linkedin_url: "https://linkedin.com/in/mariamselim",
    whatsapp_number: "+201044332211",
    is_available: true,
    team_status: "LOOKING_FOR_MORE",
    looking_for_role: "DevOps Engineer, Backend Developer",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    full_name: "Ziad Badr",
    password: "password123",
    department: "MM (National)",
    gpa: 3.0,
    track: "Game Development",
    bio: "Independent game creator. Building an educational 3D physics puzzle game for kids using Unity and C#.",
    linkedin_url: "https://linkedin.com/in/ziadbadr",
    whatsapp_number: "+201509080706",
    is_available: true,
    team_status: "LOOKING",
    looking_for_role: "Game Developer, C# Developer",
    skills: ["Unity", "C#", "Blender", "Game Design", "Shaders"],
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
  }
];

async function seed() {
  console.log("----------------------------------------");
  console.log("🔄 Resetting database tables...");
  console.log("----------------------------------------");
  
  // Clear tables in reverse dependency order
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('swipes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log("✅ Tables cleared successfully!");
  console.log("\n----------------------------------------");
  console.log("🌱 Seeding final mockup profiles...");
  console.log("----------------------------------------");
  
  const insertedProfiles = {};
  
  for (const profile of mockProfiles) {
    const { data, error } = await supabase.from('profiles').insert(profile).select();
    if (error) {
      if (error.message.includes('team_size_needed')) {
        // Fallback if team_size_needed column doesn't exist on remote db yet
        const { team_size_needed, ...fallback } = profile;
        const { data: fbData, error: fbErr } = await supabase.from('profiles').insert(fallback).select();
        if (fbErr) {
          console.error(`❌ Error inserting ${profile.full_name} (fallback):`, fbErr.message);
        } else {
          insertedProfiles[profile.full_name] = fbData ? fbData[0] : null;
          console.log(`✅ Seeded ${profile.full_name} (Fallback without team_size_needed)`);
        }
      } else {
        console.error(`❌ Error inserting ${profile.full_name}:`, error.message);
      }
    } else {
      insertedProfiles[profile.full_name] = data ? data[0] : null;
      console.log(`✅ Seeded ${profile.full_name}`);
    }
  }

  console.log("\n----------------------------------------");
  console.log("👥 Seeding teams & member associations...");
  console.log("----------------------------------------");

  // Helper to associate profile with a team
  const associateWithTeam = async (profileName, teamId) => {
    const profile = insertedProfiles[profileName];
    if (!profile) return;
    
    // Update profile
    await supabase.from('profiles').update({ team_id: teamId }).eq('id', profile.id);
    
    // Insert into team_members
    await supabase.from('team_members').insert({ team_id: teamId, profile_id: profile.id });
    
    console.log(`🔗 Associated ${profileName} with Team`);
  };

  // 1. Team DataSight
  const { data: team1 } = await supabase
    .from('teams')
    .insert({ name: 'DataSight' })
    .select();
  if (team1 && team1[0]) {
    console.log(`🏢 Created Team: DataSight`);
    await associateWithTeam('Fatma Ahmed', team1[0].id);
    await associateWithTeam('Sarah Chen', team1[0].id);
  }

  // 2. Team MedLink
  const { data: team2 } = await supabase
    .from('teams')
    .insert({ name: 'MedLink' })
    .select();
  if (team2 && team2[0]) {
    console.log(`🏢 Created Team: MedLink`);
    await associateWithTeam('Lina Mahmoud', team2[0].id);
    await associateWithTeam('Youssef Ibrahim', team2[0].id);
  }

  // 3. Team CloudScale
  const { data: team3 } = await supabase
    .from('teams')
    .insert({ name: 'CloudScale' })
    .select();
  if (team3 && team3[0]) {
    console.log(`🏢 Created Team: CloudScale`);
    await associateWithTeam('Mariam Selim', team3[0].id);
    await associateWithTeam('Omar Youssef', team3[0].id);
  }

  console.log("\n----------------------------------------");
  console.log("🎉 Seeding finished successfully!");
  console.log("----------------------------------------");
}

seed();
