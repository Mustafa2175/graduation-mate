'use client'

import { useState, useMemo } from 'react'
import Button from '@/components/ui/Button'
import { StepProps } from './types'
import { cn } from '@/lib/utils'

const TRACK_TO_SKILLS_MAP: Record<string, string[]> = {
  "Data Science": [
    "Python", "Pandas", "NumPy", "Matplotlib", "Seaborn",
    "Scikit-learn", "SQL", "Statistics", "Data Visualization",
    "Data Cleaning", "Feature Engineering", "Jupyter Notebook",
    "TensorFlow", "PyTorch", "Machine Learning"
  ],
  "Data Analysis": [
    "Excel", "SQL", "Power BI", "Tableau", "Python",
    "Pandas", "Data Visualization", "Statistics", "Reporting",
    "Business Intelligence"
  ],
  "Data Engineering": [
    "Python", "SQL", "Apache Spark", "Hadoop", "Airflow",
    "Kafka", "dbt", "Snowflake", "ETL", "Data Warehousing",
    "Docker", "Cloud Computing"
  ],
  "Artificial Intelligence": [
    "Python", "Machine Learning", "Deep Learning", "TensorFlow",
    "PyTorch", "NLP", "Computer Vision", "Reinforcement Learning",
    "MLOps", "Mathematics", "Linear Algebra", "Probability"
  ],
  "Backend Development": [
    "Node.js", "Express.js", "Django", "FastAPI", "Spring Boot",
    "PostgreSQL", "MySQL", "MongoDB", "REST APIs", "GraphQL",
    "Docker", "Authentication", "Redis"
  ],
  "Frontend Development": [
    "HTML", "CSS", "JavaScript", "TypeScript", "React",
    "Next.js", "Vue.js", "Angular", "Tailwind CSS", "Redux",
    "Responsive Design"
  ],
  "Full Stack Development": [
    "React", "Next.js", "Node.js", "Express.js", "PostgreSQL",
    "REST APIs", "Docker", "Authentication", "Git", "Deployment"
  ],
  "Mobile App Development": [
    "Flutter", "Dart", "Kotlin", "Swift", "React Native",
    "Firebase", "REST APIs", "State Management"
  ],
  "Cybersecurity": [
    "Linux", "Networking", "Python", "Wireshark", "Nmap",
    "Burp Suite", "Metasploit", "OWASP", "Penetration Testing",
    "SIEM", "Incident Response"
  ],
  "DevOps": [
    "Docker", "Kubernetes", "Linux", "Bash", "CI/CD",
    "GitHub Actions", "Terraform", "AWS", "Monitoring", "Ansible"
  ],
  "Cloud Computing": [
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes",
    "Terraform", "Networking", "Security"
  ],
  "Game Development": [
    "Unity", "Unreal Engine", "Godot", "C#", "C++",
    "Game Physics", "Shader Programming"
  ],
  "UI/UX Design": [
    "Figma", "Wireframing", "Prototyping", "User Research",
    "Design Systems", "Accessibility"
  ],
  "Machine Learning": [
    "Python", "Scikit-learn", "TensorFlow", "PyTorch",
    "Pandas", "NumPy", "Statistics", "Feature Engineering"
  ]
}

const DEFAULT_SUGGESTED_SKILLS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js",
  "SQL", "Git", "Docker", "REST APIs", "Figma",
  "AWS", "Machine Learning", "HTML", "CSS"
]

const ALL_SKILLS = Array.from(new Set([
  // Programming Languages
  "Python", "Java", "C++", "C", "C#", "JavaScript", "TypeScript", "Go", "Rust", "Kotlin", "Swift", "Dart", "PHP", "Ruby", "Scala", "R", "MATLAB", "Julia", "HTML", "CSS", "SQL", "NoSQL", "Bash", "Shell", "PowerShell", "Perl", "Haskell", "Assembly",
  // Frameworks and Libraries
  "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express.js", "Django", "Flask", "FastAPI", "Spring Boot", "Laravel", "TensorFlow", "PyTorch", "Scikit-learn", "Svelte", "Ember.js", "Backbone.js", "jQuery", "Redux", "MobX", "Bootstrap", "Tailwind CSS", "Material UI", "Chakra UI", "Semantic UI", "Hibernate", "Entity Framework", "Keras", "Pandas", "NumPy", "Matplotlib", "Seaborn", "OpenCV", "NLTK", "Spacy", "Hugging Face",
  // Databases
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "SQL Server", "Cassandra", "DynamoDB", "Snowflake", "MariaDB", "Firebase Realtime Database", "Firestore", "Supabase", "GraphQL", "Prisma", "Sequelize", "Mongoose", "Elasticsearch", "Neo4j", "InfluxDB",
  // Cloud Platforms
  "AWS", "Azure", "Google Cloud", "Firebase", "Supabase", "DigitalOcean", "Heroku", "Vercel", "Netlify", "Cloudflare",
  // DevOps Tools
  "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Travis CI", "Prometheus", "Grafana", "ELK Stack", "Splunk", "Nginx", "Apache", "Vagrant", "Puppet", "Chef",
  // Data Tools
  "Pandas", "NumPy", "Matplotlib", "Seaborn", "Power BI", "Tableau", "Excel", "Apache Spark", "Hadoop", "Airflow", "Kafka", "dbt", "Qlik", "SAS", "SPSS", "Alteryx",
  // Cybersecurity Tools
  "Wireshark", "Nmap", "Burp Suite", "Metasploit", "Nessus", "Splunk", "Snort", "Aircrack-ng", "John the Ripper", "Hydra", "OWASP ZAP", "Hashcat", "Maltego",
  // Design Tools
  "Figma", "Adobe XD", "Photoshop", "Illustrator", "Sketch", "InVision", "Framer", "CorelDraw", "Canva",
  // Mobile Development
  "Flutter", "React Native", "Kotlin", "Swift", "Jetpack Compose", "Xamarin", "Ionic", "Cordova", "CocoaPods", "Android Studio", "Xcode",
  // AI/ML Skills
  "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Reinforcement Learning", "MLOps", "AIOps", "Generative AI", "Large Language Models", "Transformers", "Neural Networks", "Feature Engineering", "Data Cleaning", "Statistics", "Probability", "Linear Algebra", "Calculus",
  // Soft Skills
  "Leadership", "Communication", "Problem Solving", "Teamwork", "Presentation Skills", "Time Management", "Critical Thinking", "Conflict Resolution", "Negotiation", "Adaptability", "Public Speaking",
  // Project Management
  "Agile", "Scrum", "Kanban", "Jira", "Product Management", "Technical Project Management", "Trello", "Asana", "Confluence",
  // Other Technical Skills
  "REST APIs", "GraphQL", "Microservices", "CI/CD", "Unit Testing", "TDD", "System Design", "Distributed Systems", "Web Sockets", "OAuth", "JWT", "gRPC", "SOAP", "Linux", "Unix", "Windows Server", "Embedded Systems", "Internet of Things (IoT)", "Arduino", "Raspberry Pi", "Unity", "Unreal Engine", "Godot", "Game Physics", "Shader Programming", "Robotics", "ROS", "PLC", "Automation Engineering", "Digital Forensics", "Incident Response", "Network Security", "Information Security", "Cryptography", "Ethical Hacking", "Penetration Testing"
]))

export default function StepSkills({ draft, onNext, onBack }: StepProps) {
  const [skills, setSkills] = useState<string[]>(draft.skills || [])
  const [skillInput, setSkillInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [errorMsg, setErrorMsg] = useState('')

  // Determine Dynamic Suggestions based on chosen track
  const trackSuggestedSkills = useMemo(() => {
    const track = draft.track || ""
    return TRACK_TO_SKILLS_MAP[track] || DEFAULT_SUGGESTED_SKILLS
  }, [draft.track])

  // Get Dynamic Search Match Results with custom Relevance Ranking
  const filteredSuggestions = useMemo(() => {
    const query = skillInput.trim().toLowerCase()
    if (!query) return []

    const unselected = ALL_SKILLS.filter(s => !skills.includes(s))
    const matches = unselected.filter(s => s.toLowerCase().includes(query))

    return matches.sort((a, b) => {
      const aLower = a.toLowerCase()
      const bLower = b.toLowerCase()

      // 1. Exact match priority
      if (aLower === query) return -1
      if (bLower === query) return 1

      // 2. Starts with query priority
      const aStarts = aLower.startsWith(query)
      const bStarts = bLower.startsWith(query)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1

      // Default alphabetical sorting
      return a.localeCompare(b)
    }).slice(0, 8)
  }, [skillInput, skills])

  const addSkill = (skill: string) => {
    const cleanSkill = skill.trim()
    if (cleanSkill && !skills.includes(cleanSkill)) {
      setSkills([...skills, cleanSkill])
      setErrorMsg('')
    }
    setSkillInput('')
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setHighlightedIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (isOpen) {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0))
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        addSkill(filteredSuggestions[highlightedIndex])
      } else if (skillInput.trim()) {
        addSkill(skillInput)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (skills.length === 0) {
      setErrorMsg('At least one skill is required to proceed.')
      return
    }
    onNext({ skills })
  }

  const visibleSuggestions = trackSuggestedSkills.filter(s => !skills.includes(s))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-5 light-glass rounded-3xl p-6 border border-black/5 shadow-sm">
        <h2 style={{ fontFamily: "'Instrument Serif', serif" }} className="text-3xl font-normal text-black/90 tracking-wide border-b border-black/5 pb-2">
          Skills
        </h2>

        {/* Selected Skill Chips Display */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {skills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/5 border border-black/5 px-3.5 py-1 text-xs font-medium text-black"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-black/40 hover:text-black ml-1 text-sm font-bold focus:outline-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Search Combobox input */}
        <div className="relative flex flex-col gap-1.5 w-full">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="skill-search"
                type="text"
                value={skillInput}
                onChange={e => {
                  setSkillInput(e.target.value)
                  setIsOpen(true)
                  setHighlightedIndex(0)
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => {
                  setTimeout(() => setIsOpen(false), 200)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search or type a custom skill (e.g. PyTorch)..."
                className="w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black placeholder-black/30 focus:outline-none focus:ring-1 focus:ring-black transition-all"
                autoComplete="off"
              />
              
              {isOpen && filteredSuggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-black/5 bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                  {filteredSuggestions.map((option, index) => (
                    <li
                      key={option}
                      onMouseDown={() => addSkill(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "relative cursor-pointer select-none px-4 py-2.5 transition-colors text-black",
                        highlightedIndex === index
                          ? "bg-violet-600 text-white font-semibold"
                          : "hover:bg-neutral-50"
                      )}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => addSkill(skillInput)}
              className="rounded-xl bg-black text-white px-5 text-sm font-semibold hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              Add
            </button>
          </div>
          {errorMsg && <p className="text-red-500 text-xs mt-1">{errorMsg}</p>}
        </div>
        
        {/* Dynamic Sugessted Skill Chips */}
        {visibleSuggestions.length > 0 && (
          <div className="pt-2 border-t border-black/5">
            <p className="text-[10px] text-black/40 mb-2.5 uppercase tracking-wider font-semibold">Suggested for {draft.track || "your profile"}</p>
            <div className="flex flex-wrap gap-1.5">
              {visibleSuggestions.slice(0, 15).map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addSkill(skill)}
                  className="inline-flex items-center rounded-full border border-black/10 bg-black/[0.02] px-3.5 py-1.5 text-[11px] font-medium text-black/70 hover:bg-black/5 hover:text-black transition-colors focus:outline-none"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Continue to Team Preferences
        </Button>
      </div>
    </form>
  )
}
