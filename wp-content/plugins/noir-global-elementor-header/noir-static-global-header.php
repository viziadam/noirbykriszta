<?php
/**
 * Plugin Name: Noir Static Global Header
 * Description: Stabil, központi Noir header és footer minden oldalra. Nem módosít Elementor adatbázis-tartalmat.
 * Version: 1.0.0
 * Author: ChatGPT
 */

if (!defined('ABSPATH')) exit;

final class Noir_Static_Global_Header {
    public static function init() {
        add_action('plugins_loaded', [__CLASS__, 'neutralize_old_header_plugin'], 99);
        add_action('wp_enqueue_scripts', [__CLASS__, 'assets'], 1);
        add_action('wp_body_open', [__CLASS__, 'header'], 1);
        add_action('wp_footer', [__CLASS__, 'footer'], 1);
        add_filter('body_class', [__CLASS__, 'body_class']);
    }

    public static function neutralize_old_header_plugin() {
        if (!class_exists('Noir_Global_Elementor_Header')) return;
        remove_action('wp_body_open', ['Noir_Global_Elementor_Header', 'render_global_header'], 1);
        remove_action('wp_body_open', ['Noir_Global_Elementor_Header', 'render_header'], 1);
        remove_action('wp_footer', ['Noir_Global_Elementor_Header', 'render_footer'], 1);
        remove_filter('body_class', ['Noir_Global_Elementor_Header', 'body_class']);
    }

    public static function assets() {
        wp_enqueue_style('noir-static-global-header', plugin_dir_url(__FILE__) . 'assets/noir-static-global-header.css', [], '1.0.0');
    }

    private static function logo_url() {
        $custom_logo_id = get_theme_mod('custom_logo');
        if ($custom_logo_id) {
            $src = wp_get_attachment_image_url($custom_logo_id, 'full');
            if ($src) return $src;
        }
        return '';
    }

    private static function menu() {
        return [
            ['Kezdőlap', '/'],
            ['Szolgáltatások', '/szolgaltatasok/'],
            ['Munkáim', '/munkaim/'],
            ['Blog', '/blog/'],
            ['Kapcsolat', '/kapcsolat/'],
        ];
    }

    public static function header() {
        if (is_admin()) return;
        $logo = self::logo_url();
        echo '<header class="noir-static-header" role="banner"><div class="noir-static-header-inner">';
        echo '<a class="noir-static-logo" href="' . esc_url(home_url('/')) . '">';
        if ($logo) echo '<img src="' . esc_url($logo) . '" alt="Noir by Kriszta">';
        else echo '<span>Noir by Kriszta</span>';
        echo '</a>';
        echo '<nav class="noir-static-nav" aria-label="Fő navigáció">';
        foreach (self::menu() as $item) {
            echo '<a href="' . esc_url(home_url($item[1])) . '">' . esc_html($item[0]) . '</a>';
        }
        echo '</nav>';
        echo '<a class="noir-static-booking" href="' . esc_url(home_url('/idopontfoglalas/')) . '">Időpontfoglalás</a>';
        echo '</div></header>';
    }

    public static function footer() {
        if (is_admin()) return;
        echo '<footer class="noir-static-footer"><div class="noir-static-footer-inner"><strong>Noir by Kriszta</strong><span>Szempilla és szemöldök szolgáltatások</span></div></footer>';
    }

    public static function body_class($classes) {
        if (!is_admin()) $classes[] = 'noir-static-header-enabled';
        return $classes;
    }
}

Noir_Static_Global_Header::init();
