import {createAgencyProvider} from './agency.js';
export {parseDetail,normalize,media} from './agency.js';
export const {feed,cancel,loadCruises}=createAgencyProvider({id:2,key:'costa',name:'Costa Cruises',label:'Costa'});
