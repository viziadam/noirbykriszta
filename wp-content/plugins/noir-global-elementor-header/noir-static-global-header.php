<?php
/**
 * Plugin Name: Noir Static Global Header
 * Description: Stabil, központi Noir header és footer minden oldalra. Nem módosít Elementor adatbázis-tartalmat.
 * Version: 1.1.0
 * Author: ChatGPT
 */

if (!defined('ABSPATH')) exit;

final class Noir_Static_Global_Header {
    const OPT_ENABLED = 'noir_static_global_header_enabled';
    const OPT_LOGO_URL = 'noir_static_global_header_logo_url';
    const OPT_MENU = 'noir_static_global_header_menu';

    public static function init() {
        add_action('plugins_loaded', [__CLASS__, 'neutralize_old_header_plugin'], 99);
        add_action('admin_menu', [__CLASS__, 'admin_menu']);
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

    public static function admin_menu() {
        add_menu_page('Noir Header', 'Noir Header', 'manage_options', 'noir-static-global-header', [__CLASS__, 'admin_page'], 'dashicons-layout', 27);
    }

    public static function admin_page() {
        if (!current_user_can('manage_options')) return;
        $notice = '';
        $error = '';
        if (isset($_POST['noir_static_header_save'])) {
            check_admin_referer('noir_static_header_save');
            update_option(self::OPT_ENABLED, isset($_POST['enabled']) ? '1' : '0');
            update_option(self::OPT_LOGO_URL, esc_url_raw($_POST['logo_url'] ?? ''));
            $menu = json_decode(wp_unslash($_POST['menu_json'] ?? ''), true);
            if (is_array($menu)) {
                update_option(self::OPT_MENU, wp_json_encode($menu, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
                $notice = 'Globális header mentve.';
            } else {
                $error = 'A menü JSON hibás, ezért nem mentettem.';
            }
        }
        $enabled = get_option(self::OPT_ENABLED, '1') === '1';
        $logo_url = self::logo_url();
        $menu_json = get_option(self::OPT_MENU, wp_json_encode(self::default_menu(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        echo '<div class="wrap"><h1>Noir Header</h1>';
        if ($notice) echo '<div class="notice notice-success is-dismissible"><p>' . esc_html($notice) . '</p></div>';
        if ($error) echo '<div class="notice notice-error is-dismissible"><p>' . esc_html($error) . '</p></div>';
        echo '<p>Ez az egyetlen globális header/footer modul. Új oldalnál automatikusan megjelenik.</p>';
        echo '<form method="post">';
        wp_nonce_field('noir_static_header_save');
        echo '<table class="form-table"><tbody>';
        echo '<tr><th>Bekapcsolva</th><td><label><input type="checkbox" name="enabled" value="1" ' . checked($enabled, true, false) . '> Globális header és footer használata</label></td></tr>';
        echo '<tr><th>Logó URL</th><td><input type="url" class="regular-text" name="logo_url" value="' . esc_attr($logo_url) . '"><p class="description">Üresen hagyva a WordPress egyedi logót használja.</p></td></tr>';
        echo '<tr><th>Menü JSON</th><td><textarea class="large-text code" rows="8" name="menu_json">' . esc_textarea($menu_json) . '</textarea></td></tr>';
        echo '</tbody></table>';
        echo '<p><button class="button button-primary button-hero" name="noir_static_header_save" type="submit">Mentés</button></p>';
        echo '</form></div>';
    }

    public static function assets() {
        wp_enqueue_style('noir-static-global-header', plugin_dir_url(__FILE__) . 'assets/noir-static-global-header.css', [], '1.1.0');
    }

    private static function logo_url() {
        $stored = get_option(self::OPT_LOGO_URL, '');
        if ($stored) return $stored;
        $custom_logo_id = get_theme_mod('custom_logo');
        if ($custom_logo_id) {
            $src = wp_get_attachment_image_url($custom_logo_id, 'full');
            if ($src) return $src;
        }
        return '';
    }

    private static function default_menu() {
        return [
            ['label' => 'Kezdőlap', 'url' => '/'],
            ['label' => 'Szolgáltatások', 'url' => '/szolgaltatasok/'],
            ['label' => 'Munkáim', 'url' => '/munkaim/'],
            ['label' => 'Blog', 'url' => '/blog/'],
            ['label' => 'Kapcsolat', 'url' => '/kapcsolat/']
        ];
    }

    private static function menu() {
        $menu = json_decode(get_option(self::OPT_MENU, ''), true);
        return is_array($menu) ? $menu : self::default_menu();
    }

    private static function enabled() {
        if (is_admin()) return false;
        if (get_option(self::OPT_ENABLED, '1') !== '1') return false;
        if (wp_doing_ajax()) return false;
        return true;
    }

    public static function header() {
        if (!self::enabled()) return;
        $logo = self::logo_url();
        echo '<header class="noir-static-header" role="banner"><div class="noir-static-header-inner">';
        echo '<a class="noir-static-logo" href="' . esc_url(home_url('/')) . '">';
        if ($logo) echo '<img src="' . esc_url($logo) . '" alt="Noir by Kriszta">'; else echo '<span>Noir by Kriszta</span>';
        echo '</a><nav class="noir-static-nav" aria-label="Fő navigáció">';
        foreach (self::menu() as $item) {
            $label = sanitize_text_field($item['label'] ?? '');
            $url = esc_url_raw($item['url'] ?? '#');
            if ($label) echo '<a href="' . esc_url(home_url($url)) . '">' . esc_html($label) . '</a>';
        }
        echo '</nav><a class="noir-static-booking" href="' . esc_url(home_url('/idopontfoglalas/')) . '">Időpontfoglalás</a></div></header>';
    }

    public static function footer() {
        if (!self::enabled()) return;
        echo '<footer class="noir-static-footer"><div class="noir-static-footer-inner"><strong>Noir by Kriszta</strong><span>Szempilla és szemöldök szolgáltatások</span></div></footer>';
    }

    public static function body_class($classes) {
        if (self::enabled()) $classes[] = 'noir-static-header-enabled';
        return $classes;
    }
}

Noir_Static_Global_Header::init();
