export const flightWindowMessage='Ces dates sont trop éloignées pour rechercher les tarifs. Google Flights couvre environ 11 mois à l’avance ; revenez plus près du départ.';
export function flightWindow(now=new Date()){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const limit=new Date(today+'T12:00:00Z');limit.setUTCDate(limit.getUTCDate()+330);
  return {today,limit:limit.toISOString().slice(0,10)};
}
