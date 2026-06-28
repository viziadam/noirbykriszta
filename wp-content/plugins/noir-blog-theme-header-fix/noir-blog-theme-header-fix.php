<?php
/**
 * Plugin Name: Noir Blog Theme Header Fix
 * Description: A Noir Blog System kiegészítője: a /blog/ oldalon és az új blogcikkeken a meglévő weboldal header/footer marad használatban, nem a generált plugin header.
 * Version: 1.0.0
 * Author: ChatGPT
 */

if (!defined('ABSPATH')) exit;

final class Noir_Blog_Theme_Header_Fix {
    public static function init() {
        add_action('plugins_loaded', [__CLASS__, 'disable_generated_header_footer'], 100);
        add_action('template_redirect', [__CLASS__, 'render_blog_with_theme_shell'], 0);
        add_filter('body_class', [__CLASS__, 'body_class']);
    }

    public static function disable_generated_header_footer() {
        if (!class_exists('Noir_Blog_System')) return;

        remove_action('template_redirect', ['Noir_Blog_System', 'force_blog_endpoint'], 0);
        remove_filter('the_content', ['Noir_Blog_System', 'render_managed_content'], 999);
    }

    public static function render_blog_with_theme_shell() {
        if (is_admin() || !self::is_blog_path()) return;

        status_header(200);
        nocache_headers();

        get_header();
        echo '<main id="primary" class="site-main noir-blog-page-shell">';
        echo self::blog_content();
        echo '</main>';
        get_footer();
        exit;
    }

    private static function is_blog_path() {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
        $home_path = parse_url(home_url('/'), PHP_URL_PATH);
        $home_path = $home_path ? rtrim($home_path, '/') : '';
        $normalized = '/' . trim(substr($path, strlen($home_path)), '/');
        return $normalized === '/blog';
    }

    private static function blog_content() {
        $list = do_shortcode('[noir_blog_list limit="30"]');

        return '<section class="noir-blog-hero"><div class="noir-blog-hero-overlay"><p class="noir-kicker">NOIR TUDÁSTÁR</p><h1>Magabiztos döntések a szép tekintethez</h1><p>Érthető, szakmai útmutatók. Valódi kérdésekre adott válaszok, felesleges ígéretek nélkül.</p><div class="noir-hero-actions"><a href="' . esc_url(home_url('/szolgaltatasok/')) . '">Szolgáltatások</a><a href="' . esc_url(home_url('/idopontfoglalas/')) . '">Időpontfoglalás</a></div></div></section>' . $list;
    }

    public static function body_class($classes) {
        if (self::is_blog_path()) $classes[] = 'noir-blog-page';
        return $classes;
    }
}

Noir_Blog_Theme_Header_Fix::init();
