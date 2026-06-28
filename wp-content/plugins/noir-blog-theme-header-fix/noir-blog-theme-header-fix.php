<?php
/**
 * Plugin Name: Noir Blog Theme Header Fix
 * Description: A /blog/ útvonalon az új tudástár tartalmát jeleníti meg. A fejlécet a Noir Global Elementor Header kezeli.
 * Version: 1.2.0
 * Author: ChatGPT
 */

if (!defined('ABSPATH')) exit;

final class Noir_Blog_Theme_Header_Fix {
    public static function init() {
        add_action('plugins_loaded', [__CLASS__, 'disable_old_handlers'], 100);
        add_action('template_redirect', [__CLASS__, 'render_blog_route'], 0);
    }

    public static function disable_old_handlers() {
        if (!class_exists('Noir_Blog_System')) return;
        remove_action('template_redirect', ['Noir_Blog_System', 'force_blog_endpoint'], 0);
        remove_filter('the_content', ['Noir_Blog_System', 'render_managed_content'], 999);
        remove_filter('body_class', ['Noir_Blog_System', 'body_class']);
    }

    public static function render_blog_route() {
        if (is_admin() || !self::is_blog_route()) return;
        status_header(200);
        nocache_headers();
        get_header();
        echo '<main id="primary" class="site-main noir-blog-page-shell">';
        echo self::blog_markup();
        echo '</main>';
        get_footer();
        exit;
    }

    private static function is_blog_route() {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
        $home_path = parse_url(home_url('/'), PHP_URL_PATH);
        $home_path = $home_path ? rtrim($home_path, '/') : '';
        $normalized = '/' . trim(substr($path, strlen($home_path)), '/');
        return $normalized === '/blog';
    }

    private static function blog_markup() {
        $list = do_shortcode('[noir_blog_list limit="30"]');
        return '<section class="noir-blog-hero"><div class="noir-blog-hero-overlay"><p class="noir-kicker">NOIR TUDÁSTÁR</p><h1>Magabiztos döntések a szép tekintethez</h1><p>Érthető, szakmai útmutatók. Valódi kérdésekre adott válaszok, felesleges ígéretek nélkül.</p><div class="noir-hero-actions"><a href="' . esc_url(home_url('/szolgaltatasok/')) . '">Szolgáltatások</a><a href="' . esc_url(home_url('/idopontfoglalas/')) . '">Időpontfoglalás</a></div></div></section>' . $list;
    }
}

Noir_Blog_Theme_Header_Fix::init();
