export function getTime (t) {
    var date = new Date(0);
    date.setSeconds(t);
    return date.toISOString().substr(11, 8);
}