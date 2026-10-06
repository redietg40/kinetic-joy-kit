import os
with open("src/features/jobs/jobs-page.tsx", "r", encoding="utf-8") as f:
    text = f.read()
text = text.replace('const isTech = session?.role === "Technician";', 'const isTech = session?.role?.toLowerCase() === "technician";')
with open("src/features/jobs/jobs-page.tsx", "w", encoding="utf-8") as f:
    f.write(text)
