<?php
/**
 * Plugin Name: Noir Global Elementor Header
 * Description: A kezdőoldalon lévő Elementor headerből központi, globális headert készít, majd minden oldalon és bejegyzésen ezt rendereli. A WordPress/Hello fallback headert elrejti.
 * Version: 1.0.0
 * Author: ChatGPT
 */

if (!defined('ABSPATH')) exit;

final class Noir_Global_Elementor_Header {
    const VERSION = '1.0.0';
    const OPT_ENABLED = 'noir_global_header_enabled';
    const OPT_TEMPLATE_ID = 'noir_global_header_template_id';
    const OPT_FRONT_PAGE_ID = 'noir_global_header_front_page_id';
    const FRONT_BACKUP_META = '_noir_global_header_frontpage_elementor_backup';
    const FRONT_REMOVED_META = '_noir_global_header_removed_from_frontpage';

    public static function init() {
        add_action('admin_menu', [__CLASS__, 'admin_menu']);
        add_action('wp_enqueue_scripts', [__CLASS__, 'assets'], 2);
        add_action('wp_body_open', [__CLASS__, 'render_global_header'], 1);
        add_filter('body_class', [__CLASS__, 'body_class']);
        add_shortcode('noir_global_header', [__CLASS__, 'shortcode']);
    }

    public static function assets() {
        wp_enqueue_style('noir-global-elementor-header', plugin_dir_url(__FILE__) . 'assets/noir-global-header.css', [], self::VERSION);
    }

    public static function admin_menu() {
        add_menu_page('Noir Header', 'Noir Header', 'manage_options', 'noir-global-elementor-header', [__CLASS__, 'admin_page'], 'dashicons-layout', 27);
    }

    public static function admin_page() {
        if (!current_user_can('manage_options')) return;

        $message = '';
        $error = '';

        if (isset($_POST['noir_header_build'])) {
            check_admin_referer('noir_header_build');
            $result = self::build_from_front_page(true);
            if ($result['ok']) {
                $message = $result['message'];
            } else {
                $error = $result['message'];
            }
        }

        if (isset($_POST['noir_header_restore'])) {
            check_admin_referer('noir_header_restore');
            $result = self::restore_front_page_header();
            if ($result['ok']) {
                $message = $result['message'];
            } else {
                $error = $result['message'];
            }
        }

        if (isset($_POST['noir_header_disable'])) {
            check_admin_referer('noir_header_disable');
            update_option(self::OPT_ENABLED, '0');
            $message = 'A globális Noir header kikapcsolva.';
        }

        if (isset($_POST['noir_header_enable'])) {
            check_admin_referer('noir_header_enable');
            update_option(self::OPT_ENABLED, '1');
            $message = 'A globális Noir header bekapcsolva.';
        }

        $template_id = (int)get_option(self::OPT_TEMPLATE_ID);
        $enabled = get_option(self::OPT_ENABLED, '0') === '1';
        $front_id = self::front_page_id();

        echo '<div class="wrap">';
        echo '<h1>Noir Global Elementor Header</h1>';
        if ($message) echo '<div class="notice notice-success is-dismissible"><p>' . esc_html($message) . '</p></div>';
        if ($error) echo '<div class="notice notice-error is-dismissible"><p>' . esc_html($error) . '</p></div>';

        echo '<p>Ez a modul a kezdőoldal Elementor tartalmából kinyeri a felső navigációs/header szekciót, elmenti külön Elementor sablonként, majd minden oldalon és bejegyzésen ezt rendereli.</p>';
        echo '<p><strong>Profi működés:</strong> egyetlen központi header van. Új oldalaknál nem kell kézzel másolni a fejlécet.</p>';

        echo '<table class="widefat striped" style="max-width:900px"><tbody>';
        echo '<tr><th>Állapot</th><td>' . ($enabled ? '<strong style="color:green">Bekapcsolva</strong>' : '<strong style="color:#b32d2e">Kikapcsolva</strong>') . '</td></tr>';
        echo '<tr><th>Front page ID</th><td>' . (int)$front_id . '</td></tr>';
        echo '<tr><th>Header template ID</th><td>' . ($template_id ? (int)$template_id : 'még nincs létrehozva') . '</td></tr>';
        echo '</tbody></table>';

        echo '<h2>1. Globális header létrehozása</h2>';
        echo '<p>Ez a művelet mentést készít a kezdőoldal eredeti Elementor adatáról, kiveszi belőle a header szekciót, majd külön globális Elementor sablonként kezeli.</p>';
        echo '<form method="post">';
        wp_nonce_field('noir_header_build');
        echo '<p><button class="button button-primary button-hero" name="noir_header_build" type="submit">Kezdőoldali header globálissá tétele</button></p>';
        echo '</form>';

        echo '<h2>2. Ki-/bekapcsolás</h2>';
        echo '<form method="post" style="display:inline-block;margin-right:10px">';
        wp_nonce_field('noir_header_enable');
        echo '<button class="button" name="noir_header_enable" type="submit">Globális header bekapcsolása</button>';
        echo '</form>';
        echo '<form method="post" style="display:inline-block">';
        wp_nonce_field('noir_header_disable');
        echo '<button class="button" name="noir_header_disable" type="submit">Globális header kikapcsolása</button>';
        echo '</form>';

        echo '<h2>3. Biztonsági visszaállítás</h2>';
        echo '<p>Ha a kezdőoldalon valami nem jó, ezzel visszaállítható az eredeti Elementor adat.</p>';
        echo '<form method="post">';
        wp_nonce_field('noir_header_restore');
        echo '<p><button class="button button-secondary" name="noir_header_restore" type="submit">Kezdőoldali header visszaállítása mentésből</button></p>';
        echo '</form>';

        echo '<h2>Shortcode</h2>';
        echo '<pre>[noir_global_header]</pre>';
        echo '</div>';
    }

    private static function build_from_front_page($remove_from_front_page = true) {
        if (!class_exists('Elementor\\Plugin')) {
            return ['ok' => false, 'message' => 'Az Elementor nem aktív, ezért nem lehet Elementor headert létrehozni.'];
        }

        $front_id = self::front_page_id();
        if (!$front_id) {
            return ['ok' => false, 'message' => 'Nem található kezdőoldal. Állítsd be: Beállítások → Olvasás → Kezdőlap.'];
        }

        $raw = get_post_meta($front_id, '_elementor_data', true);
        if (!$raw) {
            return ['ok' => false, 'message' => 'A kezdőoldal nem Elementor adattal épül, vagy nincs _elementor_data mezője.'];
        }

        $data = json_decode($raw, true);
        if (!is_array($data)) {
            return ['ok' => false, 'message' => 'A kezdőoldal Elementor JSON adata nem olvasható.'];
        }

        $candidate = self::find_header_candidate($data);
        if (!$candidate) {
            return ['ok' => false, 'message' => 'Nem sikerült egyértelmű header szekciót találni a kezdőoldalon. Ellenőrizd, hogy a menüpontok a kezdőoldal első Elementor szekciójában vannak-e.'];
        }

        $template_id = self::upsert_elementor_template([$candidate['element']]);
        if (!$template_id) {
            return ['ok' => false, 'message' => 'Nem sikerült létrehozni a globális Elementor header sablont.'];
        }

        if ($remove_from_front_page && empty(get_post_meta($front_id, self::FRONT_REMOVED_META, true))) {
            if (!get_post_meta($front_id, self::FRONT_BACKUP_META, true)) {
                update_post_meta($front_id, self::FRONT_BACKUP_META, wp_slash($raw));
            }

            $new_data = $data;
            unset($new_data[$candidate['index']]);
            $new_data = array_values($new_data);
            update_post_meta($front_id, '_elementor_data', wp_slash(wp_json_encode($new_data)));
            update_post_meta($front_id, self::FRONT_REMOVED_META, '1');
        }

        update_option(self::OPT_TEMPLATE_ID, $template_id);
        update_option(self::OPT_FRONT_PAGE_ID, $front_id);
        update_option(self::OPT_ENABLED, '1');
        self::clear_elementor_cache();

        return ['ok' => true, 'message' => 'A kezdőoldali header globális Elementor sablon lett. Template ID: ' . (int)$template_id . '. A kezdőoldal eredeti adata mentésre került.'];
    }

    private static function restore_front_page_header() {
        $front_id = (int)get_option(self::OPT_FRONT_PAGE_ID);
        if (!$front_id) $front_id = self::front_page_id();
        if (!$front_id) return ['ok' => false, 'message' => 'Nem található kezdőoldal.'];

        $backup = get_post_meta($front_id, self::FRONT_BACKUP_META, true);
        if (!$backup) return ['ok' => false, 'message' => 'Nincs mentett kezdőoldali Elementor adat.'];

        update_post_meta($front_id, '_elementor_data', wp_slash($backup));
        delete_post_meta($front_id, self::FRONT_REMOVED_META);
        update_option(self::OPT_ENABLED, '0');
        self::clear_elementor_cache();

        return ['ok' => true, 'message' => 'A kezdőoldal eredeti Elementor adata visszaállítva, a globális header kikapcsolva.'];
    }

    private static function front_page_id() {
        $front_id = (int)get_option('page_on_front');
        if ($front_id) return $front_id;

        $front = get_page_by_path('kezdooldal', OBJECT, 'page');
        if (!$front) $front = get_page_by_path('kezdolap', OBJECT, 'page');
        if (!$front) $front = get_page_by_title('Kezdőlap');
        return $front ? (int)$front->ID : 0;
    }

    private static function find_header_candidate(array $data) {
        $best = null;
        foreach ($data as $index => $element) {
            $score = self::score_element($element);
            if (!$best || $score > $best['score']) {
                $best = ['index' => $index, 'element' => $element, 'score' => $score];
            }
        }

        if ($best && $best['score'] >= 6) return $best;

        if (!empty($data[0]) && is_array($data[0])) {
            return ['index' => 0, 'element' => $data[0], 'score' => $best ? $best['score'] : 0];
        }

        return null;
    }

    private static function score_element($element) {
        $haystack = mb_strtolower(wp_json_encode($element, JSON_UNESCAPED_UNICODE));
        $score = 0;
        foreach (['kezdőlap', 'kezdolap', 'szolgáltatások', 'szolgaltatasok', 'munkáim', 'munkaim', 'blog', 'kapcsolat', 'időpontfoglalás', 'idopontfoglalas'] as $needle) {
            if (mb_strpos($haystack, $needle) !== false) $score += 2;
        }
        foreach (['nav-menu', 'theme-site-logo', 'image', 'button'] as $needle) {
            if (mb_strpos($haystack, $needle) !== false) $score += 1;
        }
        foreach (['műszempilla építés', 'muszempilla epites', 'szépség mindenek felett', 'szepseg mindenek felett'] as $hero) {
            if (mb_strpos($haystack, $hero) !== false) $score -= 5;
        }
        return $score;
    }

    private static function upsert_elementor_template(array $elementor_data) {
        $existing = get_page_by_path('noir-global-site-header', OBJECT, 'elementor_library');
        $post = [
            'post_title' => 'Noir Global Site Header',
            'post_name' => 'noir-global-site-header',
            'post_type' => 'elementor_library',
            'post_status' => 'publish',
            'post_content' => '',
        ];

        if ($existing) {
            $post['ID'] = $existing->ID;
            $id = wp_update_post($post, true);
        } else {
            $id = wp_insert_post($post, true);
        }

        if (is_wp_error($id) || !$id) return 0;

        update_post_meta($id, '_elementor_edit_mode', 'builder');
        update_post_meta($id, '_elementor_template_type', 'section');
        update_post_meta($id, '_elementor_data', wp_slash(wp_json_encode($elementor_data)));
        update_post_meta($id, '_wp_page_template', 'elementor_header_footer');

        return (int)$id;
    }

    public static function render_global_header() {
        if (!self::is_enabled_for_request()) return;

        $template_id = (int)get_option(self::OPT_TEMPLATE_ID);
        if (!$template_id || !class_exists('Elementor\\Plugin')) return;

        echo '<div id="noir-global-elementor-header" class="noir-global-elementor-header" role="banner">';
        echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($template_id, true);
        echo '</div>';
    }

    private static function is_enabled_for_request() {
        if (is_admin()) return false;
        if (get_option(self::OPT_ENABLED, '0') !== '1') return false;
        if (defined('REST_REQUEST') && REST_REQUEST) return false;
        if (wp_doing_ajax()) return false;
        if (function_exists('is_embed') && is_embed()) return false;

        if (class_exists('Elementor\\Plugin')) {
            try {
                if (\Elementor\Plugin::instance()->editor->is_edit_mode()) return false;
                if (\Elementor\Plugin::instance()->preview->is_preview_mode()) return false;
            } catch (Throwable $e) {}
        }

        return true;
    }

    public static function body_class($classes) {
        if (self::is_enabled_for_request()) $classes[] = 'noir-global-header-enabled';
        return $classes;
    }

    public static function shortcode() {
        ob_start();
        self::render_global_header();
        return ob_get_clean();
    }

    private static function clear_elementor_cache() {
        if (!class_exists('Elementor\\Plugin')) return;
        try {
            \Elementor\Plugin::instance()->files_manager->clear_cache();
        } catch (Throwable $e) {}
    }
}

Noir_Global_Elementor_Header::init();
