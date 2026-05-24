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
      <section className="space-y-5 bg-ash-white border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]">
        <h2 className="text-3xl font-display uppercase tracking-wider text-abyssal-ink border-b-2 border-abyssal-ink pb-3">
          Creator Style & Tags
        </h2>

        {/* Selected Skill Chips Display */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pb-2">
            {skills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-[90px] bg-pure-white border-2 border-abyssal-ink px-4 py-1.5 text-xs font-bold text-abyssal-ink shadow-[2px_2px_0px_0px_rgba(7,6,7,1)]"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-abyssal-ink/60 hover:text-digital-orange ml-1 text-sm font-bold focus:outline-none cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Search Combobox input */}
        <div className="relative flex flex-col gap-1.5 w-full font-semibold">
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
                placeholder="Search style assets or skills (e.g. Figma, Generative AI, Tailwind CSS)..."
                className="w-full rounded-xl border-2 border-abyssal-ink bg-pure-white px-4 py-3 text-sm text-abyssal-ink placeholder-ash-gray/60 focus:outline-none focus:ring-1 focus:ring-cyber-violet transition-all"
                autoComplete="off"
              />
              
              {isOpen && filteredSuggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border-2 border-abyssal-ink bg-pure-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                  {filteredSuggestions.map((option, index) => (
                    <li
                      key={option}
                      onMouseDown={() => addSkill(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "relative cursor-pointer select-none px-4 py-2.5 transition-colors text-abyssal-ink font-semibold",
                        highlightedIndex === index
                          ? "bg-digital-orange text-pure-white font-bold"
                          : "hover:bg-basalt-canvas/40"
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
              className="rounded-xl border-2 border-abyssal-ink bg-digital-orange text-pure-white px-5 text-sm font-bold hover:bg-abyssal-ink transition-colors focus:outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none"
            >
              Add
            </button>
          </div>
          {errorMsg && <p className="text-red-500 text-xs mt-1">{errorMsg}</p>}
        </div>
        
        {/* Dynamic Sugessted Skill Chips */}
        {visibleSuggestions.length > 0 && (
          <div className="pt-4 border-t-2 border-abyssal-ink">
            <p className="text-[10px] text-abyssal-ink mb-3.5 uppercase tracking-wider font-bold">Suggested for {draft.track || "your profile"}</p>
            <div className="flex flex-wrap gap-2">
              {visibleSuggestions.slice(0, 15).map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addSkill(skill)}
                  className="inline-flex items-center rounded-[90px] border-2 border-abyssal-ink bg-pure-white px-3.5 py-1.5 text-[11px] font-bold text-abyssal-ink hover:bg-basalt-canvas/40 hover:text-digital-orange hover:border-digital-orange transition-colors focus:outline-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
 
      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onBack} className="gm-btn gm-btn-secondary shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none">
          Back
        </Button>
        <Button type="submit" className="gm-btn gm-btn-primary shadow-[3px_3px_0px_0px_rgba(7,6,7,1)] active:translate-y-[1px] active:shadow-none font-bold">
          Continue to Collaboration
        </Button>
      </div>
    </form>
  )
}
