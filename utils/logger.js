// Status logging functions
const statusLog = document.getElementById('status-log');

export function logStatus(message, isError = false) {
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    if (isError) {
        p.classList.add('error');
        console.error(message);
    } else {
        console.log(message);
    }
    
    statusLog.appendChild(p);
    statusLog.scrollTop = statusLog.scrollHeight;
}