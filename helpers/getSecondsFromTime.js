export function getSecondsFromTime (timeString) {
    const timeParts = timeString.split(":");
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    const seconds = parseInt(timeParts[2]);
    
    return hours * 3600 + minutes * 60 + seconds;
};