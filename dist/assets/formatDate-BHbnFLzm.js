function n(t,r=!1){if(!t)return"N/A";const e=new Date(t);return isNaN(e.getTime())?"N/A":r?e.toLocaleString("en-IN",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):e.toLocaleDateString("en-IN",{year:"numeric",month:"short",day:"numeric"})}export{n as f};
//# sourceMappingURL=formatDate-BHbnFLzm.js.map
