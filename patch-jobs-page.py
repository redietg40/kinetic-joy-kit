import os

with open("src/features/jobs/jobs-page.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Replace the single line with useState/useEffect
old_line = 'const session = getSession(); const isTech = session?.role?.toLowerCase() === "technician";'
new_line = 'import { useEffect } from "react";\nconst [session, setSession] = useState(getSession()); useEffect(() => { setSession(getSession()); }, []); const isTech = session?.role?.toLowerCase() === "technician";'
text = text.replace(old_line, new_line)

with open("src/features/jobs/jobs-page.tsx", "w", encoding="utf-8") as f:
    f.write(text)
