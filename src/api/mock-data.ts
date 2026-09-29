import type { Customer, Invoice, Job, Technician } from "@/types";

const at = (days: number, hour: number) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d.toISOString(); };
const customerRows: Array<[string, string, string, string, string, string]> = [
  ["c1","Abel Tesfaye","+251 911 204 550","abel@sunrise.et","Bole Atlas, Addis Ababa","Prefers morning visits"],
  ["c2","Selamawit Bekele","+251 922 611 320","selam@bluebird.et","CMC, Addis Ababa","Gate code 205"],
  ["c3","Yonas Hotel","+251 911 876 430","facilities@yonashotel.et","Kazanchis, Addis Ababa","Commercial account"],
  ["c4","Mimi Grocery","+251 933 105 440","mimi@grocery.et","Sar Bet, Addis Ababa","Call before arrival"],
  ["c5","Noah Apartments","+251 944 892 013","manager@noah.et","Ayat, Addis Ababa","12-unit property"],
  ["c6","Bethlehem School","+251 911 662 381","admin@bethlehem.edu.et","Old Airport, Addis Ababa","Visitor pass required"],
  ["c7","Kaleb Restaurant","+251 922 900 176","hello@kalebrestaurant.et","Megenagna, Addis Ababa","Service entrance at rear"],
  ["c8","Liya Worku","+251 933 511 402","liya@example.com","Lebu, Addis Ababa",""],
];
export const customers: Customer[] = customerRows.map(([id,name,phone,email,address,notes],i)=>({id,name,phone,email,address,notes,created_at:at(-60+i*4,9)}));
export const technicians: Technician[] = [
  {id:"t1",name:"Dawit Alemu",phone:"+251 911 220 101",email:"dawit@fieldflow.et",specialty:"HVAC",status:"available"},
  {id:"t2",name:"Hana Girma",phone:"+251 922 310 411",email:"hana@fieldflow.et",specialty:"Plumbing",status:"on_job"},
  {id:"t3",name:"Samuel Kebede",phone:"+251 933 901 122",email:"samuel@fieldflow.et",specialty:"Electrical",status:"available"},
  {id:"t4",name:"Meron Tadesse",phone:"+251 944 431 238",email:"meron@fieldflow.et",specialty:"HVAC",status:"off_duty"},
  {id:"t5",name:"Nahom Fekadu",phone:"+251 911 881 655",email:"nahom@fieldflow.et",specialty:"Plumbing",status:"available"},
];
const rawJobs: Array<[string,string,string,string,string,number,number,string,string]> = [
 ["AC not cooling","c1","t1","HVAC","in_progress",0,9,"urgent","Diagnosing compressor"],
 ["Leaking kitchen sink","c2","t2","Plumbing","scheduled",0,11,"normal",""],
 ["Panel safety inspection","c3","t3","Electrical","scheduled",0,14,"normal",""],
 ["Boiler maintenance","c6","t1","HVAC","scheduled",1,9,"low",""],
 ["Blocked drain","c4","t5","Plumbing","scheduled",1,13,"urgent",""],
 ["Lighting retrofit","c3","t3","Electrical","completed",-1,10,"normal","Replaced 12 fixtures"],
 ["Split unit installation","c5","t4","HVAC","completed",-2,8,"normal","Pressure tested"],
 ["Water pressure check","c8","t2","Plumbing","completed",-3,15,"low","Adjusted regulator"],
 ["Socket replacement","c1","t3","Electrical","completed",-4,11,"normal",""],
 ["Freezer service","c7","t1","HVAC","completed",-5,9,"urgent","Replaced capacitor"],
 ["Bathroom refit","c5","t5","Plumbing","scheduled",2,8,"normal",""],
 ["Generator wiring","c6","t3","Electrical","scheduled",2,13,"urgent",""],
 ["Duct cleaning","c2","t4","HVAC","cancelled",-2,14,"low","Customer rescheduled"],
 ["Pump replacement","c4","t2","Plumbing","scheduled",3,10,"normal",""],
 ["Thermostat upgrade","c8","t1","HVAC","scheduled",4,15,"normal",""],
];
export const jobs: Job[] = rawJobs.map((j,i)=>({id:`J-${1048-i}`,title:j[0],customer_id:j[1],technician_id:j[2],service_type:j[3] as Job["service_type"],status:j[4] as Job["status"],scheduled_at:at(j[5],j[6]),priority:j[7] as Job["priority"],technician_notes:j[8],description:`Service request for ${j[0].toLowerCase()}.`,address:customers.find(c=>c.id===j[1])?.address ?? "Addis Ababa",photos:[],completed_at:j[4]==="completed"?at(j[5],j[6]+2):null}));
export const invoices: Invoice[] = [
 ["INV-0248","J-1043","c3",18500,"paid",-1],["INV-0247","J-1042","c5",32750,"sent",-2],["INV-0246","J-1041","c8",4200,"paid",-3],["INV-0245","J-1040","c1",6800,"overdue",-8],["INV-0244","J-1039","c7",12500,"draft",-5],
].map(([id,job_id,customer_id,total,status,day])=>({id:String(id),job_id:String(job_id),customer_id:String(customer_id),line_items:[{description:"Labour and materials",qty:1,unit_price:Number(total)/1.15}],subtotal:Number(total)/1.15,tax:Number(total)-Number(total)/1.15,total:Number(total),currency:"ETB",status:status as Invoice["status"],payment_method:"Chapa",chapa_tx_ref:`FF-${id}`,issued_at:at(Number(day),10),paid_at:status==="paid"?at(Number(day)+1,14):null}));
