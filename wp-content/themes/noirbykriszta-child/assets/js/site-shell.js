window.addEventListener('DOMContentLoaded', function () {
  var labels = ['Kezdőlap', 'Szolgáltatások', 'Munkáim', 'Blog', 'Kapcsolat'];
  var realHeader = document.querySelector('.noir-site-header');
  if (!realHeader) return;

  var candidates = Array.prototype.slice.call(document.querySelectorAll('header, section, .elementor-section, .e-con, .elementor-container'));
  candidates.forEach(function (el) {
    if (el.closest('.noir-site-header')) return;
    var text = (el.textContent || '').replace(/\s+/g, ' ');
    var score = labels.filter(function (label) { return text.indexOf(label) !== -1; }).length;
    var hasBooking = text.indexOf('Időpontfoglalás') !== -1;
    var rect = el.getBoundingClientRect();
    if (score >= 4 && hasBooking && rect.top < 260) {
      el.setAttribute('data-noir-duplicate-header-hidden', 'true');
      el.style.display = 'none';
    }
  });
});
