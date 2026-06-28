<?php
if (!defined('ABSPATH')) exit;
$logo_url = noir_child_logo_url();
$items = noir_child_site_menu_items();
?>
<header class="noir-site-header"><div class="noir-site-header__inner"><a class="noir-site-header__logo" href="<?php echo esc_url(home_url('/')); ?>"><?php if ($logo_url) { ?><img src="<?php echo esc_url($logo_url); ?>" alt="Noir by Kriszta"><?php } else { ?>Noir by Kriszta<?php } ?></a><nav class="noir-site-header__nav"><?php foreach ($items as $item) { ?><a href="<?php echo esc_url($item['url']); ?>"><?php echo esc_html($item['label']); ?></a><?php } ?></nav><a class="noir-site-header__booking" href="<?php echo esc_url(home_url('/idopontfoglalas/')); ?>">Időpontfoglalás</a></div></header>
