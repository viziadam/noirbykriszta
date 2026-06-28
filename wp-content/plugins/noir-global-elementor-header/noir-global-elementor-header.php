<?php
/**
 * Plugin Name: Noir Global Elementor Header
 * Description: A kezdőoldal valódi Elementor header szekcióját emeli át globális header sablonba, majd minden oldalon ezt rendereli.
 * Version: 2.1.0
 * Author: ChatGPT
 */

if (!defined('ABSPATH')) exit;

final class Noir_Global_Elementor_Header {
    const VERSION = '2.1.0';
    const OPT_ENABLED = 'noir_global_header_enabled';
    const OPT_TEMPLATE_ID = 'noir_global_header_template_id';
    const OPT_FRONT_PAGE_ID = 'noir_global_header_front_page_id';
    const OPT_REMOVED_INDEX = 'noir_global_header_removed_index';
    const FRONT_BACKUP_META = '_noir_global_header_frontpage_elementor_backup';
    const FRONT_REMOVED_META = '_noir_global_header_removed_from_frontpage';

    public static function init() {
        add_action('admin_menu', [__CLASS__, 'admin_menu']);
        add_action('wp_enqueue_scripts', [__CLASS__, 'assets'], 1);
        add_action('wp_body_open', [__CLASS__, 'render_header'], 1);
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

        $notice = '';
        $error = '';

        if (isset($_POST['noir_header_auto'])) {
            check_admin_referer('noir_header_action');
            $result = self::install_best_candidate(true);
            if ($result['ok']) $notice = $result['message']; else $error = $result['message'];
        }

        if (isset($_POST['noir_header_pick'])) {
            check_admin_referer('noir_header_action');
            $index = isset($_POST['candidate_index']) ? (int)$_POST['candidate_index'] : -1;
            $result = self::install_candidate($index, true);
            if ($result['ok']) $notice = $result['message']; else $error = $result['message'];
        }

        if (isset($_POST['noir_header_restore'])) {
            check_admin_referer('noir_header_action');
            $result = self::restore_front_page();
            if ($result['ok']) $notice = $result['message']; else $error = $result['message'];
        }

        if (isset($_POST['noir_header_enable'])) {
            check_admin_referer('noir_header_action');
            update_option(self::OPT_ENABLED, '1');
            $notice = 'Globális Elementor header bekapcsolva.';
        }

        if (isset($_POST['noir_header_disable'])) {
            check_admin_referer('noir_header_action');
            update_option(self::OPT_ENABLED, '0');
            $notice = 'Globális Elementor header kikapcsolva.';
        }

        $front_id = self::front_page_id();
        $template_id = (int)get_option(self::OPT_TEMPLATE_ID, 0);
        $enabled = get_option(self::OPT_ENABLED, '0') === '1';
        $candidates = self::header_candidates();

        echo '<div class="wrap">';
        echo '<h1>Noir Header</h1>';
        if ($notice) echo '<div class="notice notice-success is-dismissible"><p>' . esc_html($notice) . '</p></div>';
        if ($error) echo '<div class="notice notice-error is-dismissible"><p>' . esc_html($error) . '</p></div>';

        echo '<p><strong>Ez nem másolat:</strong> ez a kezelő a kezdőoldal Elementor JSON adatából veszi ki a valódi header szekciót, Elementor sablonként menti, és minden oldalon azt rendereli.</p>';
        echo '<table class="widefat striped" style="max-width:900px"><tbody>';
        echo '<tr><th>Állapot</th><td>' . ($enabled ? '<strong style="color:green">bekapcsolva</strong>' : '<strong style="color:#b32d2e">kikapcsolva</strong>') . '</td></tr>';
        echo '<tr><th>Kezdőoldal ID</th><td>' . (int)$front_id . '</td></tr>';
        echo '<tr><th>Globális Elementor header template ID</th><td>' . ($template_id ? (int)$template_id : 'nincs') . '</td></tr>';
        echo '</tbody></table>';

        if (!class_exists('Elementor\\Plugin')) {
            echo '<div class="notice notice-error"><p>Az Elementor nem aktív, ezért nem tudok Elementor sablont kinyerni.</p></div>';
            echo '</div>';
            return;
        }

        echo '<h2>1. Automatikus átemelés</h2>';
        echo '<p>Ez megkeresi a kezdőoldalon azt a felső Elementor szekciót, amelyben a navigációs elemek vannak, abból globális Elementor header sablont készít, majd a kezdőoldali beégetett példányt mentés után eltávolítja.</p>';
        echo '<form method="post">';
        wp_nonce_field('noir_header_action');
        echo '<p><button class="button button-primary button-hero" name="noir_header_auto" type="submit">Eredeti kezdőoldali header átemelése globális headerbe</button></p>';
        echo '</form>';

        echo '<h2>2. Kézi választás, ha több jelölt van</h2>';
        if (!$candidates) {
            echo '<p>Nem találtam Elementor szekció-jelöltet a kezdőoldal adatában. Ez azt jelenti, hogy a header nem a GitHub fájlokban, hanem más Elementor/DB helyen van, vagy a kezdőoldal nincs Elementorral mentve.</p>';
        } else {
            echo '<table class="widefat striped" style="max-width:1100px"><thead><tr><th>Index</th><th>Pontszám</th><th>Tartalomrészlet</th><th>Művelet</th></tr></thead><tbody>';
            foreach ($candidates as $candidate) {
                echo '<tr>';
                echo '<td>' . (int)$candidate['index'] . '</td>';
                echo '<td>' . (int)$candidate['score'] . '</td>';
                echo '<td><code>' . esc_html($candidate['snippet']) . '</code></td>';
                echo '<td><form method="post">';
                wp_nonce_field('noir_header_action');
                echo '<input type="hidden" name="candidate_index" value="' . (int)$candidate['index'] . '">';
                echo '<button class="button" name="noir_header_pick" type="submit">Ezt emeld át globális headernek</button>';
                echo '</form></td>';
                echo '</tr>';
            }
            echo '</tbody></table>';
        }

        echo '<h2>3. Ki- és bekapcsolás</h2>';
        echo '<form method="post" style="display:inline-block;margin-right:10px">';
        wp_nonce_field('noir_header_action');
        echo '<button class="button" name="noir_header_enable" type="submit">Bekapcsolás</button>';
        echo '</form>';
        echo '<form method="post" style="display:inline-block">';
        wp_nonce_field('noir_header_action');
        echo '<button class="button" name="noir_header_disable" type="submit">Kikapcsolás</button>';
        echo '</form>';

        echo '<h2>4. Visszaállítás</h2>';
        echo '<p>Ha rossz szekciót választottál, ezzel visszarakható a kezdőoldal eredeti Elementor adata.</p>';
        echo '<form method="post">';
        wp_nonce_field('noir_header_action');
        echo '<p><button class="button button-secondary" name="noir_header_restore" type="submit">Kezdőoldal eredeti Elementor adatának visszaállítása</button></p>';
        echo '</form>';

        echo '</div>';
    }

    private static function install_best_candidate($remove_from_front_page) {
        $candidates = self::header_candidates();
        if (!$candidates) return ['ok' => false, 'message' => 'Nem találtam megfelelő header jelöltet a kezdőoldal Elementor adatában.'];
        return self::install_candidate((int)$candidates[0]['index'], $remove_from_front_page);
    }

    private static function install_candidate($index, $remove_from_front_page) {
        if (!class_exists('Elementor\\Plugin')) return ['ok' => false, 'message' => 'Az Elementor nem aktív.'];

        $front_id = self::front_page_id();
        if (!$front_id) return ['ok' => false, 'message' => 'Nem található kezdőoldal.'];

        $raw = get_post_meta($front_id, '_elementor_data', true);
        if (!$raw) return ['ok' => false, 'message' => 'A kezdőoldalon nincs _elementor_data.'];

        $data = json_decode($raw, true);
        if (!is_array($data) || !isset($data[$index])) return ['ok' => false, 'message' => 'A választott Elementor szekció nem található.'];

        $template_id = self::upsert_header_template([$data[$index]]);
        if (!$template_id) return ['ok' => false, 'message' => 'Nem sikerült létrehozni az Elementor header sablont.'];

        if ($remove_from_front_page && get_post_meta($front_id, self::FRONT_REMOVED_META, true) !== '1') {
            update_post_meta($front_id, self::FRONT_BACKUP_META, wp_slash($raw));
            $new_data = $data;
            unset($new_data[$index]);
            $new_data = array_values($new_data);
            update_post_meta($front_id, '_elementor_data', wp_slash(wp_json_encode($new_data)));
            update_post_meta($front_id, self::FRONT_REMOVED_META, '1');
            update_option(self::OPT_REMOVED_INDEX, $index);
        }

        update_option(self::OPT_TEMPLATE_ID, $template_id);
        update_option(self::OPT_FRONT_PAGE_ID, $front_id);
        update_option(self::OPT_ENABLED, '1');
        self::clear_elementor_cache();

        return ['ok' => true, 'message' => 'A kezdőoldali Elementor header globális sablon lett. Template ID: ' . (int)$template_id];
    }

    private static function restore_front_page() {
        $front_id = (int)get_option(self::OPT_FRONT_PAGE_ID, 0);
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

    private static function header_candidates() {
        $front_id = self::front_page_id();
        if (!$front_id) return [];
        $raw = get_post_meta($front_id, '_elementor_data', true);
        if (!$raw) return [];
        $data = json_decode($raw, true);
        if (!is_array($data)) return [];

        $out = [];
        foreach ($data as $index => $element) {
            if (!is_array($element)) continue;
            $score = self::score_element($element);
            $snippet = self::element_snippet($element);
            if ($score >= 4 || $index < 5) {
                $out[] = ['index' => $index, 'score' => $score, 'snippet' => $snippet];
            }
        }
        usort($out, function ($a, $b) {
            if ($a['score'] === $b['score']) return $a['index'] <=> $b['index'];
            return $b['score'] <=> $a['score'];
        });
        return array_slice($out, 0, 12);
    }

    private static function score_element($element) {
        $text = mb_strtolower(self::element_snippet($element, 20000));
        $score = 0;
        foreach (['kezdőlap','kezdolap','szolgáltatások','szolgaltatasok','munkáim','munkaim','blog','kapcsolat','időpontfoglalás','idopontfoglalas'] as $needle) {
            if (mb_strpos($text, $needle) !== false) $score += 3;
        }
        foreach (['nav-menu','menu','button','image','logo','site-logo'] as $needle) {
            if (mb_strpos($text, $needle) !== false) $score += 1;
        }
        foreach (['műszempilla építés','muszempilla epites','szépség mindenek felett','szepseg mindenek felett'] as $hero) {
            if (mb_strpos($text, $hero) !== false) $score -= 8;
        }
        return $score;
    }

    private static function element_snippet($element, $limit = 260) {
        $json = wp_json_encode($element, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $json = preg_replace('/\s+/', ' ', (string)$json);
        if (function_exists('mb_substr')) return mb_substr($json, 0, $limit);
        return substr($json, 0, $limit);
    }

    private static function upsert_header_template(array $elementor_data) {
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
        update_post_meta($id, '_wp_page_template', 'elementor_canvas');
        return (int)$id;
    }

    private static function front_page_id() {
        $front_id = (int)get_option('page_on_front');
        if ($front_id) return $front_id;
        foreach (['kezdooldal','kezdolap','kezdőlap'] as $slug) {
            $page = get_page_by_path($slug, OBJECT, 'page');
            if ($page) return (int)$page->ID;
        }
        $page = get_page_by_title('Kezdőlap');
        return $page ? (int)$page->ID : 0;
    }

    public static function render_header() {
        if (!self::enabled_for_request()) return;
        $template_id = (int)get_option(self::OPT_TEMPLATE_ID, 0);
        if (!$template_id || !class_exists('Elementor\\Plugin')) return;

        echo '<div id="noir-global-elementor-header" class="noir-global-elementor-header" role="banner">';
        echo \Elementor\Plugin::instance()->frontend->get_builder_content_for_display($template_id, true);
        echo '</div>';
    }

    private static function enabled_for_request() {
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
        if (self::enabled_for_request()) $classes[] = 'noir-global-header-enabled';
        return $classes;
    }

    public static function shortcode() {
        ob_start();
        self::render_header();
        return ob_get_clean();
    }

    private static function clear_elementor_cache() {
        if (!class_exists('Elementor\\Plugin')) return;
        try { \Elementor\Plugin::instance()->files_manager->clear_cache(); } catch (Throwable $e) {}
    }
}

function noir_global_header_is_active() {
    return class_exists('Noir_Global_Elementor_Header') && get_option(Noir_Global_Elementor_Header::OPT_ENABLED, '0') === '1' && (int)get_option(Noir_Global_Elementor_Header::OPT_TEMPLATE_ID, 0) > 0;
}

Noir_Global_Elementor_Header::init();
