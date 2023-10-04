var c = new CVSS("cvssboard", {
    onchange: function() {
        window.location.hash = c.get().vector;
        c.vector.setAttribute('href', '#' + c.get().vector)
    }
});
if (window.location.hash.substring(1).length > 0) {
    c.set(decodeURIComponent(window.location.hash.substring(1)));
}