import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// ── Read .env.local ──────────────────────────────────────────────────────────
const envFile = fs.readFileSync(".env.local", "utf8");
const envVars = {};
envFile.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2]
      .trim()
      .replace(/^"|"$/g, "")
      .replace(/^'|'$/g, "");
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌  Missing environment variables.\n" +
      "    Make sure .env.local contains both:\n" +
      "      NEXT_PUBLIC_SUPABASE_URL\n" +
      "      SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

// Admin client — bypasses RLS and has access to auth.admin API.
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Seed password (same for every demo account) ──────────────────────────────
const SEED_PASSWORD = "Demo1234!";

// ── Mock profiles ─────────────────────────────────────────────────────────────
// `email` is used for Auth; the rest is written into public.profiles.
// `password` is intentionally absent — the column was dropped in migration 006.
const mockProfiles = [
  {
    email: "sarah.chen@example.edu",
    full_name: "Sarah Chen",
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
    avatar_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    email: "omar.youssef@example.edu",
    full_name: "Omar Youssef",
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
    avatar_url:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    email: "fatma.ahmed@example.edu",
    full_name: "Fatma Ahmed",
    department: "CS",
    gpa: 3.9,
    track: "Data Science",
    bio: "Leader of Team DataSight. We are building a predictive maintenance SaaS dashboard for smart cities. Seeking strong backend and UI developers.",
    linkedin_url: "https://linkedin.com/in/fatmaahmed",
    whatsapp_number: "+201122334455",
    is_available: true,
    team_status: "LOOKING_FOR_MORE",
    looking_for_role: "Backend Developer, UI/UX Designer",
    skills: ["Python", "Pandas", "NumPy", "SQL", "Tableau", "Statistics"],
    avatar_url:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    email: "youssef.ibrahim@example.edu",
    full_name: "Youssef Ibrahim",
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
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    email: "lina.mahmoud@example.edu",
    full_name: "Lina Mahmoud",
    department: "IT",
    gpa: 3.6,
    track: "Mobile App Development",
    bio: "Leader of Team MedLink. Creating a cross-platform telemedicine application connecting students with campus clinics.",
    linkedin_url: "https://linkedin.com/in/linamahmoud",
    whatsapp_number: "+201288990011",
    is_available: true,
    team_status: "LOOKING_FOR_MORE",
    looking_for_role: "UI/UX Designer, Backend Developer, Flutter Developer",
    skills: [
      "Flutter",
      "Dart",
      "Firebase",
      "REST APIs",
      "Mobile App Development",
    ],
    avatar_url:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    email: "karim.hassan@example.edu",
    full_name: "Karim Hassan",
    department: "SE",
    gpa: 3.1,
    track: "Embedded Systems",
    bio: "Hardware specialist. Finalising the smart greenhouse automated team project.",
    linkedin_url: "https://linkedin.com/in/karimhassan",
    whatsapp_number: "+201099887766",
    is_available: false,
    team_status: "COMPLETE",
    looking_for_role: "Embedded Systems Engineer",
    skills: ["C++", "C", "Arduino", "Raspberry Pi", "RTOS"],
    avatar_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    email: "nour.ali@example.edu",
    full_name: "Nour Ali",
    department: "MM",
    gpa: 3.7,
    track: "UI/UX Design",
    bio: "Obsessed with creating human-centric experiences. I design beautiful wireframes and interactive user journeys.",
    linkedin_url: "https://linkedin.com/in/nourali",
    whatsapp_number: "+201123458900",
    is_available: true,
    team_status: "LOOKING",
    looking_for_role: "UI/UX Designer",
    skills: [
      "Figma",
      "Adobe XD",
      "Wireframing",
      "Prototyping",
      "User Research",
      "Interaction Design",
    ],
    avatar_url:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    email: "ahmed.kamal@example.edu",
    full_name: "Ahmed Kamal",
    department: "AI",
    gpa: 3.4,
    track: "Natural Language Processing",
    bio: "Working with Large Language Models. Building conversational bots and semantic search engines.",
    linkedin_url: "https://linkedin.com/in/ahmedkamal",
    whatsapp_number: "+201233445566",
    is_available: true,
    team_status: "LOOKING",
    looking_for_role: "AI Engineer, Full Stack Developer",
    skills: [
      "Python",
      "LangChain",
      "Transformers",
      "OpenAI API",
      "Hugging Face",
    ],
    avatar_url:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    email: "mariam.selim@example.edu",
    full_name: "Mariam Selim",
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
    avatar_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    email: "ziad.badr@example.edu",
    full_name: "Ziad Badr",
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
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Delete every row in a public table via the admin client (bypasses RLS). */
async function clearTable(table) {
  const { error } = await supabase.from(table).delete().not("id", "is", null); // matches every row
  if (error) {
    console.warn(`  ⚠️  Could not clear "${table}": ${error.message}`);
  }
}

// ── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  console.log("════════════════════════════════════════════");
  console.log("  🌱  Graduation Mate — Seed Script");
  console.log("════════════════════════════════════════════\n");

  // ── Step 1: Delete all existing Auth users ──────────────────────────────────
  console.log("🗑️  Removing existing auth users…");
  const {
    data: { users: existingUsers },
    error: listErr,
  } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (listErr) {
    console.error("❌  Failed to list auth users:", listErr.message);
    process.exit(1);
  }

  for (const user of existingUsers) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.warn(
        `  ⚠️  Could not delete user ${user.email}: ${delErr.message}`,
      );
    }
  }
  console.log(`  ✅  Removed ${existingUsers.length} auth user(s).\n`);

  // ── Step 2: Clear public tables (admin client bypasses RLS) ─────────────────
  // Deletion order respects FK constraints (most-dependent tables first).
  console.log("🗑️  Clearing public tables…");
  await clearTable("matches");
  await clearTable("swipes");
  await clearTable("team_members");
  await clearTable("profile_contacts");
  await clearTable("profiles");
  await clearTable("teams");
  console.log("  ✅  Tables cleared.\n");

  // ── Step 3: Create Auth users + seed profiles ───────────────────────────────
  console.log("👤  Creating auth users and profiles…");
  const insertedProfiles = {};

  for (const mock of mockProfiles) {
    const { email, linkedin_url, whatsapp_number, ...profileFields } = mock;

    // createUser fires the on_auth_user_created trigger which inserts a minimal
    // profile row. We then UPDATE that row with the full seed data.
    const { data: authData, error: authErr } =
      await supabase.auth.admin.createUser({
        email,
        password: SEED_PASSWORD,
        email_confirm: true, // skip email verification for the beta
        user_metadata: { full_name: mock.full_name },
      });

    if (authErr) {
      // email_exists or similar — warn and skip rather than crashing.
      console.warn(
        `  ⚠️  Skipping ${mock.full_name} (${email}): ${authErr.message}`,
      );
      continue;
    }

    const userId = authData.user.id;

    // The trigger already inserted a bare profile row; enrich it now.
    const { error: profileErr } = await supabase
      .from("profiles")
      .update(profileFields)
      .eq("id", userId);

    if (profileErr) {
      console.error(
        `  ❌  Failed to update profile for ${mock.full_name}: ${profileErr.message}`,
      );
      continue;
    }

    const { error: contactsErr } = await supabase
      .from("profile_contacts")
      .upsert({
        profile_id: userId,
        linkedin_url: linkedin_url || null,
        whatsapp_number: whatsapp_number || null,
      });

    if (contactsErr) {
      console.error(
        `  ❌  Failed to save contacts for ${mock.full_name}: ${contactsErr.message}`,
      );
    } else {
      insertedProfiles[mock.full_name] = {
        id: userId,
        ...profileFields,
        linkedin_url,
        whatsapp_number,
      };
      console.log(`  ✅  ${mock.full_name}  <${email}>`);
    }
  }

  // ── Step 4: Create teams and associations ───────────────────────────────────
  console.log("\n👥  Creating teams…");

  const associateWithTeam = async (profileName, teamId) => {
    const profile = insertedProfiles[profileName];
    if (!profile) {
      console.warn(
        `  ⚠️  Cannot associate "${profileName}" — profile not found.`,
      );
      return;
    }
    await supabase
      .from("profiles")
      .update({ team_id: teamId })
      .eq("id", profile.id);
    const { error } = await supabase
      .from("team_members")
      .insert({ team_id: teamId, profile_id: profile.id });
    if (error) {
      console.warn(
        `  ⚠️  Could not link ${profileName} to team: ${error.message}`,
      );
    } else {
      console.log(`    🔗  ${profileName}`);
    }
  };

  // Team DataSight
  const { data: team1, error: t1Err } = await supabase
    .from("teams")
    .insert({ name: "DataSight", status: "LOOKING" })
    .select()
    .single();
  if (t1Err) {
    console.error("  ❌  Could not create DataSight:", t1Err.message);
  } else {
    console.log(`\n  🏢  DataSight (${team1.id})`);
    await associateWithTeam("Fatma Ahmed", team1.id);
    await associateWithTeam("Sarah Chen", team1.id);
  }

  // Team MedLink
  const { data: team2, error: t2Err } = await supabase
    .from("teams")
    .insert({ name: "MedLink", status: "LOOKING" })
    .select()
    .single();
  if (t2Err) {
    console.error("  ❌  Could not create MedLink:", t2Err.message);
  } else {
    console.log(`\n  🏢  MedLink (${team2.id})`);
    await associateWithTeam("Lina Mahmoud", team2.id);
    await associateWithTeam("Youssef Ibrahim", team2.id);
  }

  // Team CloudScale
  const { data: team3, error: t3Err } = await supabase
    .from("teams")
    .insert({ name: "CloudScale", status: "LOOKING" })
    .select()
    .single();
  if (t3Err) {
    console.error("  ❌  Could not create CloudScale:", t3Err.message);
  } else {
    console.log(`\n  🏢  CloudScale (${team3.id})`);
    await associateWithTeam("Mariam Selim", team3.id);
    await associateWithTeam("Omar Youssef", team3.id);
  }

  console.log("\n════════════════════════════════════════════");
  console.log("  🎉  Seeding complete!");
  console.log("  🔑  All demo accounts use password: " + SEED_PASSWORD);
  console.log("════════════════════════════════════════════\n");
}

seed().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
