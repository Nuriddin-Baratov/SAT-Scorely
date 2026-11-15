/**
 * Sahifa chizilishidan oldin `<head>` da ishlaydigan skript — tanlangan mavzuni
 * darhol qo'llaydi (oq/qora “miltillash” bo'lmasligi uchun).
 */
export const themeInitScript = `try{var t=JSON.parse(localStorage.getItem("scorely.theme.v1"));if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
