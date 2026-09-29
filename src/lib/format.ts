export const money = (value:number) => `ETB ${new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)}`;
export const friendlyDate = (value:string) => new Intl.DateTimeFormat("en-ET",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));
export const initials = (name:string) => name.split(" ").map(part=>part[0]).join("").slice(0,2).toUpperCase();
