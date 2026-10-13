export const money = (value:number) => `ETB ${new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)}`;

export const friendlyDate = (value:string) => new Intl.DateTimeFormat("en-ET",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));

export const formatDisplayName = (name?: string): string => {
  if (!name) return "Owner";
  if (name.includes("@")) {
    const prefix = name.split("@")[0];
    const words = prefix.replace(/[._0-9]/g, " ").trim().split(/\s+/);
    if (words.length > 0 && words[0]) {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }
    return prefix;
  }
  return name;
};

export const initials = (name:string) => {
  const clean = formatDisplayName(name);
  const parts = clean.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};
