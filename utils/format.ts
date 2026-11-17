export function formatNaira(value:string|null){
  if(value===null)return 'Not set';
  const [whole,fraction='']=value.split('.');
  return `₦${whole!.replace(/\B(?=(\d{3})+(?!\d))/g,',')}.${fraction.padEnd(2,'0')}`;
}
export function formatReceiptDate(value:string){
  const date=new Date(`${value.slice(0,10)}T12:00:00Z`);
  return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Lagos'}).format(date);
}
