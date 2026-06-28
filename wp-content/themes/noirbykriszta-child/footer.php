<?php
if (!defined('ABSPATH')) exit;
get_template_part('template-parts/site-footer');
wp_footer();
?>
<script>
window.addEventListener('DOMContentLoaded', function () {
  var labels = ['Kezdőlap','Szolgáltatások','Munkáim','Blog','Kapcsolat'];
  document.querySelectorAll('header,section,.elementor-section,.e-con').forEach(function (el) {
    if (el.closest('.noir-site-header')) return;
    var text = (el.textContent || '').replace(/\s+/g, ' ');
    var score = labels.filter(function (label) { return text.indexOf(label) > -1; }).length;
    if (score >= 4 && text.indexOf('Időpontfoglalás') > -1 && el.getBoundingClientRect().top < 260) {
      el.style.display = 'none';
    }
  });
});
</script>
<?php echo '</body></html>'; ?>
