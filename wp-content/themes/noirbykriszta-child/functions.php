<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('hello-elementor-style', get_template_directory_uri() . '/style.css', [], null);
    wp_enqueue_style('noir-child-site-shell', get_stylesheet_directory_uri() . '/assets/css/site-shell.css', ['hello-elementor-style'], '1.0.0');
}, 20);

function noir_child_site_menu_items() {
    return [
        ['label' => 'Kezdőlap', 'url' => home_url('/')],
        ['label' => 'Szolgáltatások', 'url' => home_url('/szolgaltatasok/')],
        ['label' => 'Munkáim', 'url' => home_url('/munkaim/')],
        ['label' => 'Blog', 'url' => home_url('/blog/')],
        ['label' => 'Kapcsolat', 'url' => home_url('/kapcsolat/')],
    ];
}

function noir_child_logo_url() {
    $custom_logo_id = get_theme_mod('custom_logo');
    if (!$custom_logo_id) {
        return '';
    }
    $src = wp_get_attachment_image_url($custom_logo_id, 'full');
    return $src ? $src : '';
}
