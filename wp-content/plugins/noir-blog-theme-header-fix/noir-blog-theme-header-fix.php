<?php
/**
 * Plugin Name: Noir Blog Theme Header Fix
 * Description: A Noir Blog System kiegészítője: a /blog/ oldalt és az új blogcikkeket egységes, moduláris Noir site shellben rendereli, nem a Hello Elementor fallback headerrel.
 * Version: 1.1.0
 * Author: ChatGPT
 */

if (!defined('ABSPATH')) exit;

final class Noir_Blog_Theme_Header_Fix {
    const VERSION = '1.1.0';
    const BLOG_META = '_noir_blog_system';

    public static function init() {
        add_action('plugins_loaded', [__CLASS__, 'disable_generated_and_fallback_rendering'], 100);
        add_action('template_redirect', [__CLASS__, 'render_with_noir_shell'], 0);
        add_shortcode('noir_site_header', [__CLASS__, 'header_shortcode']);
        add_shortcode('noir_site_footer', [__CLASS__, 'footer_shortcode']);
    }

    public static function disable_generated_and_fallback_rendering() {
        if (!class_exists('Noir_Blog_System')) return;

        remove_action('template_redirect', ['Noir_Blog_System', 'force_blog_endpoint'], 0);
        remove_filter('the_content', ['Noir_Blog_System', 'render_managed_content'], 999);
        remove_filter('body_class', ['Noir_Blog_System', 'body_class']);
    }

    public static function render_with_noir_shell() {
        if (is_admin()) return;

        if (self::is_blog_path()) {
            self::render_document('Blog tudástár | Noir by Kriszta', self::blog_content(), 'Blog');
        }

        if (is_singular('post') && get_post_meta(get_queried_object_id(), self::BLOG_META, true) === '1') {
            $post_id = get_queried_object_id();
            $title = get_the_title($post_id) . ' | Noir by Kriszta';
            $content = self::post_content($post_id);
            self::render_document($title, $content, 'Blog');
        }
    }

    private static function render_document($title, $content, $active = 'Blog') {
        status_header(200);
        nocache_headers();
        ?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?php echo esc_html($title); ?></title>
<?php wp_head(); ?>
</head>
<body <?php body_class('noir-site-shell'); ?>>
<?php wp_body_open(); ?>
<?php echo self::site_header_html($active); ?>
<main id="primary" class="site-main noir-blog-page-shell">
<?php echo $content; ?>
</main>
<?php echo self::site_footer_html(); ?>
<?php wp_footer(); ?>
</body>
</html><?php
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

    private static function post_content($post_id) {
        $raw = get_post_field('post_content', $post_id);
        $content = do_shortcode($raw);
        $content = self::post_title_hero($post_id) . $content . self::related_posts_html($post_id);
        return $content;
    }

    private static function post_title_hero($post_id) {
        return '<section class="noir-page-intro noir-post-title-intro"><p class="noir-kicker">' . esc_html(self::first_category($post_id)) . '</p><h1>' . esc_html(get_the_title($post_id)) . '</h1><p>' . esc_html(get_the_excerpt($post_id)) . '</p></section>';
    }

    private static function related_posts_html($post_id) {
        $cats = wp_get_post_categories($post_id);
        if (!$cats) return '';

        $q = new WP_Query([
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => 3,
            'post__not_in' => [$post_id],
            'category__in' => $cats,
            'meta_key' => self::BLOG_META,
            'meta_value' => '1',
        ]);

        if (!$q->have_posts()) return '';

        ob_start();
        echo '<section class="noir-related-posts"><p class="noir-kicker">KAPCSOLÓDÓ CIKKEK</p><h2>Érdemes még elolvasni</h2><div class="noir-related-grid">';
        while ($q->have_posts()) {
            $q->the_post();
            echo '<a class="noir-related-card" href="' . esc_url(get_permalink()) . '"><span>' . esc_html(self::first_category(get_the_ID())) . '</span><strong>' . esc_html(get_the_title()) . '</strong></a>';
        }
        echo '</div></section>';
        wp_reset_postdata();

        return ob_get_clean();
    }

    private static function first_category($post_id) {
        $terms = get_the_category($post_id);
        return (!empty($terms) && !is_wp_error($terms)) ? $terms[0]->name : 'Blog';
    }

    private static function site_header_html($active = 'Blog') {
        $logo = self::logo_html();
        $items = [
            'Kezdőlap' => '/',
            'Szolgáltatások' => '/szolgaltatasok/',
            'Munkáim' => '/munkaim/',
            'Blog' => '/blog/',
            'Kapcsolat' => '/kapcsolat/',
        ];

        $html = '<header class="noir-site-header" role="banner"><div class="noir-site-header-inner"><div class="noir-site-logo">' . $logo . '</div><nav class="noir-site-nav" aria-label="Fő navigáció">';
        foreach ($items as $label => $url) {
            $class = ($label === $active) ? ' class="is-active"' : '';
            $html .= '<a' . $class . ' href="' . esc_url(home_url($url)) . '">' . esc_html($label) . '</a>';
        }
        $html .= '</nav><a class="noir-site-booking" href="' . esc_url(home_url('/idopontfoglalas/')) . '">Időpontfoglalás</a></div></header>';
        return $html;
    }

    private static function logo_html() {
        $custom_logo_id = get_theme_mod('custom_logo');
        if ($custom_logo_id) {
            $src = wp_get_attachment_image_url($custom_logo_id, 'full');
            if ($src) {
                return '<a href="' . esc_url(home_url('/')) . '"><img src="' . esc_url($src) . '" alt="Noir by Kriszta" loading="eager"></a>';
            }
        }

        return '<a class="noir-site-logo-text" href="' . esc_url(home_url('/')) . '">Noir by Kriszta</a>';
    }

    private static function site_footer_html() {
        return '<footer class="noir-site-footer"><div><strong>Noir by Kriszta</strong><p>Szempilla és szemöldök szolgáltatások – természetes, igényes hatásra hangolva.</p></div><nav aria-label="Lábléc navigáció"><a href="' . esc_url(home_url('/szolgaltatasok/')) . '">Szolgáltatások</a><a href="' . esc_url(home_url('/munkaim/')) . '">Munkáim</a><a href="' . esc_url(home_url('/kapcsolat/')) . '">Kapcsolat</a><a href="' . esc_url(home_url('/idopontfoglalas/')) . '">Időpontfoglalás</a></nav></footer>';
    }

    public static function header_shortcode($atts) {
        $atts = shortcode_atts(['active' => 'Blog'], $atts, 'noir_site_header');
        return self::site_header_html($atts['active']);
    }

    public static function footer_shortcode() {
        return self::site_footer_html();
    }
}

Noir_Blog_Theme_Header_Fix::init();
