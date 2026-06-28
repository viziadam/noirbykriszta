<?php
/**
 * Plugin Name: Noir Blog System
 * Description: Az új SEO Blog tudástárat a régi /blog/ oldal helyére építi be a dev környezetben, saját egységes blog headerrel/footerrel és adminból frissíthető tartalommal.
 * Version: 1.2.0
 * Author: ChatGPT
 */

if (!defined('ABSPATH')) exit;

final class Noir_Blog_System {
    const VERSION = '1.2.0';
    const META = '_noir_blog_system';
    const OPTION = 'noir_blog_system_last_install';
    const BACKUP_META = '_noir_blog_old_backup_id';

    public static function init() {
        add_action('wp_enqueue_scripts', [__CLASS__, 'assets']);
        add_action('admin_menu', [__CLASS__, 'admin']);
        add_shortcode('noir_blog_list', [__CLASS__, 'blog_list']);
        add_shortcode('noir_blog_cta', [__CLASS__, 'cta_shortcode']);
        add_filter('body_class', [__CLASS__, 'body_class']);
        add_filter('the_content', [__CLASS__, 'render_managed_content'], 999);
        add_filter('the_content', [__CLASS__, 'related_block'], 1000);
        add_action('wp_head', [__CLASS__, 'schema']);
    }

    public static function activate() {
        self::install(true);
        flush_rewrite_rules();
    }

    public static function assets() {
        wp_enqueue_style('noir-blog-system', plugin_dir_url(__FILE__) . 'assets/noir-blog.css', [], self::VERSION);
    }

    public static function admin() {
        add_menu_page('Noir Blog', 'Noir Blog', 'manage_options', 'noir-blog-system', [__CLASS__, 'admin_page'], 'dashicons-welcome-write-blog', 28);
    }

    public static function admin_page() {
        if (!current_user_can('manage_options')) return;
        $notice = '';
        if (isset($_POST['noir_blog_install'])) {
            check_admin_referer('noir_blog_install');
            $result = self::install(true);
            $notice = 'Új blog beépítve a /blog/ oldalra: ' . (int)$result['pages'] . ' oldal, ' . (int)$result['posts'] . ' cikk, ' . (int)$result['categories'] . ' kategória. Régi blog mentése: ' . esc_html($result['backup']);
        }

        echo '<div class="wrap">';
        echo '<h1>Noir Blog System</h1>';
        if ($notice) echo '<div class="notice notice-success is-dismissible"><p>' . esc_html($notice) . '</p></div>';
        echo '<p>Ez a verzió a régi <code>/blog/</code> oldalt cseréli le az új SEO Blog tudástárra a dev környezetben. A régi blogoldal tartalmáról vázlat mentést készít, majd az új tudástárat teszi a Blog menüpont mögé.</p>';
        echo '<p><strong>Megjelenés:</strong> az új blog nem képpel indul, hanem egységes, szöveges, elegáns tudástárként jelenik meg. Saját blog header/footer blokkot kap, hogy ne a csúnya alap WordPress/Hello fejléc látszódjon.</p>';
        echo '<form method="post">';
        wp_nonce_field('noir_blog_install');
        echo '<p><button class="button button-primary button-hero" name="noir_blog_install" type="submit">Új blog beépítése a /blog/ helyére</button></p>';
        echo '</form>';
        echo '<h2>Létrejövő/használt URL-ek</h2>';
        echo '<ul><li><code>/blog/</code> – új Blog tudástár</li><li><code>/blog-regi-mentes/</code> – régi blog vázlat mentése</li><li><code>/muszempilla-epites-utmutato/</code>, <code>/szempilla-lifting-utmutato/</code>, <code>/szemoldok-styling-laminalas-utmutato/</code> – SEO pillar oldalak</li></ul>';
        echo '<h2>Shortcode-ok</h2>';
        echo '<pre>[noir_blog_list limit="30"]</pre>';
        echo '<pre>[noir_blog_list category="Műszempilla" limit="9"]</pre>';
        echo '<pre>[noir_blog_cta]</pre>';
        echo '<p>Utolsó frissítés: ' . esc_html(get_option(self::OPTION, 'még nem futott')) . '</p>';
        echo '</div>';
    }

    public static function install($force = false) {
        $out = ['categories' => 0, 'pages' => 0, 'posts' => 0, 'backup' => 'nincs'];

        foreach (self::categories() as $cat) {
            if (!term_exists($cat, 'category')) {
                $created = wp_insert_term($cat, 'category', ['slug' => sanitize_title($cat)]);
                if (!is_wp_error($created)) $out['categories']++;
            }
        }

        $backup_id = self::replace_blog_page();
        $out['backup'] = $backup_id ? 'blog-regi-mentes' : 'nem volt szükséges';
        $out['pages']++;

        foreach (self::pillar_pages() as $page) {
            $out['pages'] += self::upsert('page', $page['title'], $page['slug'], $page['content'], $page['excerpt'], '', '', true, 'publish');
        }

        foreach (self::topics() as $topic) {
            $out['posts'] += self::upsert('post', $topic['title'], $topic['slug'], self::article_html($topic), $topic['excerpt'], $topic['category'], self::seo_description($topic), true, 'publish');
        }

        self::retire_old_helper_pages();
        update_option(self::OPTION, current_time('mysql'));
        return $out;
    }

    private static function replace_blog_page() {
        $blog = get_page_by_path('blog', OBJECT, 'page');
        $backup_id = 0;

        if ($blog && get_post_meta($blog->ID, self::META, true) !== '1') {
            $existing_backup = get_page_by_path('blog-regi-mentes', OBJECT, 'page');
            if (!$existing_backup) {
                $backup_id = wp_insert_post([
                    'post_title' => 'Régi blog mentés',
                    'post_name' => 'blog-regi-mentes',
                    'post_content' => $blog->post_content,
                    'post_excerpt' => $blog->post_excerpt,
                    'post_status' => 'draft',
                    'post_type' => 'page',
                    'comment_status' => 'closed',
                    'ping_status' => 'closed',
                ], true);

                if (!is_wp_error($backup_id) && $backup_id) {
                    foreach (get_post_meta($blog->ID) as $key => $values) {
                        foreach ((array)$values as $value) {
                            add_post_meta($backup_id, $key, maybe_unserialize($value));
                        }
                    }
                }
            } else {
                $backup_id = (int)$existing_backup->ID;
            }
        }

        $data = [
            'post_title' => 'Blog',
            'post_name' => 'blog',
            'post_content' => self::blog_page_content(false),
            'post_excerpt' => 'Szempilla és szemöldök útmutatók egy helyen.',
            'post_status' => 'publish',
            'post_type' => 'page',
            'comment_status' => 'closed',
            'ping_status' => 'closed',
        ];

        if ($blog) {
            $data['ID'] = $blog->ID;
            $id = wp_update_post($data, true);
        } else {
            $id = wp_insert_post($data, true);
        }

        if (!is_wp_error($id) && $id) {
            update_post_meta($id, self::META, '1');
            update_post_meta($id, self::BACKUP_META, $backup_id);
            delete_post_meta($id, '_elementor_data');
            delete_post_meta($id, '_elementor_edit_mode');
            delete_post_meta($id, '_elementor_template_type');
            update_post_meta($id, '_wp_page_template', 'default');
        }

        return $backup_id;
    }

    private static function retire_old_helper_pages() {
        foreach (['blog-tudastar', 'blogok'] as $slug) {
            $page = get_page_by_path($slug, OBJECT, 'page');
            if ($page && get_post_meta($page->ID, self::META, true) === '1') {
                wp_update_post(['ID' => $page->ID, 'post_status' => 'draft']);
            }
        }
    }

    private static function upsert($type, $title, $slug, $content, $excerpt, $category, $meta_desc, $force, $status = 'publish') {
        $slug = sanitize_title($slug);
        $existing = get_page_by_path($slug, OBJECT, $type);
        $managed = $existing ? get_post_meta($existing->ID, self::META, true) === '1' : false;

        if ($existing && !$managed) return 0;
        if ($existing && !$force) return 0;

        $post = [
            'post_title' => wp_strip_all_tags($title),
            'post_name' => $slug,
            'post_content' => $content,
            'post_excerpt' => wp_strip_all_tags($excerpt),
            'post_status' => $status,
            'post_type' => $type,
            'comment_status' => 'closed',
            'ping_status' => 'closed',
        ];

        if ($type === 'post') $post['post_category'] = [self::category_id($category)];

        if ($existing) {
            $post['ID'] = $existing->ID;
            $id = wp_update_post($post, true);
        } else {
            $id = wp_insert_post($post, true);
        }

        if (is_wp_error($id) || !$id) return 0;

        update_post_meta($id, self::META, '1');

        if ($type === 'post') {
            update_post_meta($id, '_yoast_wpseo_title', $title);
            update_post_meta($id, '_yoast_wpseo_metadesc', $meta_desc);
            update_post_meta($id, 'rank_math_title', $title);
            update_post_meta($id, 'rank_math_description', $meta_desc);
            update_post_meta($id, '_aioseo_title', $title);
            update_post_meta($id, '_aioseo_description', $meta_desc);
        }

        return 1;
    }

    public static function body_class($classes) {
        if (is_page('blog')) $classes[] = 'noir-blog-takeover';
        if (is_singular('post') && get_post_meta(get_the_ID(), self::META, true) === '1') $classes[] = 'noir-blog-takeover';
        return $classes;
    }

    public static function render_managed_content($content) {
        if (!in_the_loop() || !is_main_query()) return $content;

        if (is_page('blog')) {
            return self::site_header_html('Blog') . self::blog_page_content(true) . self::site_footer_html();
        }

        if (is_singular('post') && get_post_meta(get_the_ID(), self::META, true) === '1') {
            return self::site_header_html('Blog') . $content . self::site_footer_html();
        }

        return $content;
    }

    private static function category_id($name) {
        $term = term_exists($name, 'category');
        if (!$term) $term = wp_insert_term($name, 'category', ['slug' => sanitize_title($name)]);
        if (is_wp_error($term)) return (int)get_option('default_category');
        return is_array($term) ? (int)$term['term_id'] : (int)$term;
    }

    public static function blog_list($atts) {
        $atts = shortcode_atts(['category' => '', 'limit' => 12], $atts, 'noir_blog_list');
        $args = [
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => max(1, min(60, (int)$atts['limit'])),
            'meta_key' => self::META,
            'meta_value' => '1',
            'orderby' => 'date',
            'order' => 'DESC',
        ];

        if ($atts['category']) {
            $term = get_term_by('name', $atts['category'], 'category');
            if (!$term) $term = get_term_by('slug', sanitize_title($atts['category']), 'category');
            if ($term) $args['cat'] = (int)$term->term_id;
        }

        $q = new WP_Query($args);

        ob_start();
        echo '<section class="noir-blog-list-wrap">';
        echo '<div class="noir-blog-list-head"><p class="noir-kicker">LEGFRISSEBB ÚTMUTATÓK</p><h2>Amit a vendégek a leggyakrabban kérdeznek</h2><p>A cikkek segítenek felkészülni, összehasonlítani a lehetőségeket és kiválasztani a következő lépést.</p></div>';

        if ($q->have_posts()) {
            echo '<div class="noir-blog-grid">';
            while ($q->have_posts()) {
                $q->the_post();
                echo '<article class="noir-blog-card">';
                echo '<div class="noir-card-top"><span class="noir-category-pill">' . esc_html(self::first_cat(get_the_ID())) . '</span><span class="noir-reading-time">' . esc_html(self::reading_time(get_the_content())) . ' perc olvasás</span></div>';
                echo '<h3><a href="' . esc_url(get_permalink()) . '">' . esc_html(get_the_title()) . '</a></h3>';
                echo '<p>' . esc_html(get_the_excerpt()) . '</p>';
                echo '<a class="noir-card-link" href="' . esc_url(get_permalink()) . '">Elolvasom</a>';
                echo '</article>';
            }
            echo '</div>';
            wp_reset_postdata();
        } else {
            echo '<div class="noir-content-card"><p>Még nincsenek telepített cikkek. WordPress adminban nyisd meg: Noir Blog → Új blog beépítése a /blog/ helyére.</p></div>';
        }

        echo '</section>';
        return ob_get_clean();
    }

    public static function cta_shortcode() { return self::cta_html(); }

    public static function related_block($content) {
        if (!is_singular('post') || !in_the_loop() || !is_main_query()) return $content;
        if (get_post_meta(get_the_ID(), self::META, true) !== '1') return $content;

        $cats = wp_get_post_categories(get_the_ID());
        if (!$cats) return $content;

        $q = new WP_Query([
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => 3,
            'post__not_in' => [get_the_ID()],
            'category__in' => $cats,
            'meta_key' => self::META,
            'meta_value' => '1',
        ]);

        if (!$q->have_posts()) return $content;

        ob_start();
        echo '<section class="noir-related-posts"><p class="noir-kicker">KAPCSOLÓDÓ CIKKEK</p><h2>Érdemes még elolvasni</h2><div class="noir-related-grid">';
        while ($q->have_posts()) {
            $q->the_post();
            echo '<a class="noir-related-card" href="' . esc_url(get_permalink()) . '"><span>' . esc_html(self::first_cat(get_the_ID())) . '</span><strong>' . esc_html(get_the_title()) . '</strong></a>';
        }
        echo '</div></section>';
        wp_reset_postdata();

        return $content . ob_get_clean();
    }

    public static function schema() {
        if (!is_singular('post')) return;
        if (get_post_meta(get_the_ID(), self::META, true) !== '1') return;

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'BlogPosting',
            'headline' => get_the_title(),
            'description' => get_the_excerpt(),
            'mainEntityOfPage' => get_permalink(),
            'author' => ['@type' => 'Organization', 'name' => 'Noir by Kriszta'],
            'publisher' => ['@type' => 'Organization', 'name' => 'Noir by Kriszta'],
            'datePublished' => get_the_date('c'),
            'dateModified' => get_the_modified_date('c'),
        ];
        echo "\n<script type=\"application/ld+json\">" . wp_json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "</script>\n";
    }

    private static function site_header_html($active = 'Blog') {
        $logo = get_custom_logo();
        if (!$logo) $logo = '<a class="noir-site-logo-text" href="' . esc_url(home_url('/')) . '">Noir by Kriszta</a>';
        $items = [
            'Kezdőlap' => '/',
            'Szolgáltatások' => '/szolgaltatasok/',
            'Munkáim' => '/munkaim/',
            'Blog' => '/blog/',
            'Kapcsolat' => '/kapcsolat/',
        ];
        $html = '<header class="noir-site-header"><div class="noir-site-header-inner"><div class="noir-site-logo">' . $logo . '</div><nav class="noir-site-nav">';
        foreach ($items as $label => $url) {
            $class = ($label === $active) ? ' class="is-active"' : '';
            $html .= '<a' . $class . ' href="' . esc_url(home_url($url)) . '">' . esc_html($label) . '</a>';
        }
        $html .= '</nav><a class="noir-site-booking" href="' . esc_url(home_url('/idopontfoglalas/')) . '">Időpontfoglalás</a></div></header>';
        return $html;
    }

    private static function site_footer_html() {
        return '<footer class="noir-site-footer"><div><strong>Noir by Kriszta</strong><p>Szempilla és szemöldök szolgáltatások – természetes, igényes hatásra hangolva.</p></div><nav><a href="' . esc_url(home_url('/szolgaltatasok/')) . '">Szolgáltatások</a><a href="' . esc_url(home_url('/munkaim/')) . '">Munkáim</a><a href="' . esc_url(home_url('/kapcsolat/')) . '">Kapcsolat</a><a href="' . esc_url(home_url('/idopontfoglalas/')) . '">Időpontfoglalás</a></nav></footer>';
    }

    private static function blog_page_content($with_shortcode = true) {
        $list = $with_shortcode ? do_shortcode('[noir_blog_list limit="30"]') : '[noir_blog_list limit="30"]';
        return '<section class="noir-blog-hero"><div class="noir-blog-hero-overlay"><p class="noir-kicker">NOIR TUDÁSTÁR</p><h1>Magabiztos döntések a szép tekintethez</h1><p>Érthető, szakmai útmutatók. Valódi kérdésekre adott válaszok, felesleges ígéretek nélkül.</p><div class="noir-hero-actions"><a href="' . esc_url(home_url('/szolgaltatasok/')) . '">Szolgáltatások</a><a href="' . esc_url(home_url('/idopontfoglalas/')) . '">Időpontfoglalás</a></div></div></section>' . $list;
    }

    private static function article_html($t) {
        $html = '<article class="noir-article-body">';
        $html .= '<p class="noir-kicker">' . esc_html($t['category']) . '</p>';
        $html .= '<p class="noir-lead">' . esc_html(self::lead_for($t)) . '</p>';
        $html .= '<div class="noir-content-card noir-summary-box"><strong>Röviden:</strong> ' . esc_html($t['excerpt']) . '</div>';
        foreach (self::sections_for($t) as $section) {
            $html .= '<section class="noir-article-section"><h2>' . esc_html($section[0]) . '</h2><p>' . esc_html($section[1]) . '</p></section>';
        }
        $html .= '<section class="noir-faq-block"><h2>Gyakori kérdések</h2>';
        foreach (self::faq_for($t) as $faq) {
            $html .= '<details><summary>' . esc_html($faq[0]) . '</summary><p>' . esc_html($faq[1]) . '</p></details>';
        }
        $html .= '</section>' . self::cta_html() . '</article>';
        return $html;
    }

    private static function lead_for($t) {
        $focus = $t['focus'];
        if ($t['intent'] === 'price') return "A {$focus} nem csak árlista kérdése. A végösszeg mögött munkaidő, alapanyag, higiénia, személyre szabott tervezés és szakmai tapasztalat áll.";
        if ($t['intent'] === 'care') return "A {$focus} tartóssága nagyban függ az otthoni ápolástól. A jól elkészített kezelés is gyorsabban veszíthet a szépségéből, ha rossz szokások terhelik.";
        if ($t['intent'] === 'safety') return "A {$focus} esetén fontos az óvatosság, mert a szem környéke érzékeny terület. A cél a tájékozódás, nem az otthoni diagnózis.";
        if ($t['intent'] === 'local') return "Budapesten sok szempilla- és szemöldök szolgáltató közül lehet választani, ezért a {$focus} esetén nem csak az ár vagy egy fotó számít.";
        return "A {$focus} témája gyakran felmerül foglalás előtt, mert a vendégek szeretnének szép, tartós és kényelmes eredményt, de közben nem akarnak túlzó vagy idegen hatást.";
    }

    private static function sections_for($t) {
        $focus = $t['focus'];
        if ($t['intent'] === 'price') return [
            ['Mitől függ az ár?', "A {$focus} árát nem egyetlen tényező határozza meg. Számít a választott technika, a munkaidő, az alapanyag minősége, az előkészítés, a konzultáció és a személyre szabott tervezés."],
            ['Miért nem érdemes csak ár alapján dönteni?', 'Az olcsóbb ajánlat nem feltétlenül rossz, de mindig érdemes megnézni, mit tartalmaz. A higiénia, a portfólió, az időtartam és a kommunikáció legalább olyan fontos, mint maga az ár.'],
            ['Hogyan hasonlíts ajánlatokat?', 'Nézd meg, van-e átlátható árlista, mit tartalmaz az új szett vagy kezelés, hogyan működik a töltés vagy kontroll, és milyen feltételek vonatkoznak késésre, lemondásra vagy no-show esetekre.'],
            ['Összefoglalás', "A jó ár-érték arány nem a legolcsóbb megoldást jelenti, hanem azt, hogy a {$focus} biztonságos, esztétikus, kényelmes és fenntartható eredményt ad."]
        ];
        if ($t['intent'] === 'care') return [
            ['Miért fontos az ápolás?', "A {$focus} utáni ápolás meghatározza, mennyire marad rendezett és tartós az eredmény. Az erős dörzsölés, olajos termékek vagy nem megfelelő tisztítás gyorsíthatja a kopást vagy hullást."],
            ['Az első 24–48 óra', 'Az első időszakban különösen fontos a kíméletes bánásmód. Kerüld a felesleges érintést, a gőzt és minden olyan terméket, amely gyengítheti a tartósságot.'],
            ['Mindennapi rutin', 'A tisztítás legyen gyengéd, de rendszeres. Smink, por, faggyú és krémmaradványok ronthatják az eredményt, ezért a megfelelő tisztítás a cél.'],
            ['Mikor kérj segítséget?', 'Ha szúrást, csípést, erős pirosságot, duzzanatot vagy fájdalmat tapasztalsz, ne várj hetekig. Ilyenkor kérj szakmai tanácsot, szükség esetén pedig fordulj orvoshoz.']
        ];
        if ($t['intent'] === 'safety') return [
            ['Mikor kell óvatosnak lenni?', "A {$focus} esetén aktív szemirritáció, gyulladás, friss műtét, erős könnyezés vagy ismert érzékenység mellett nem érdemes kockáztatni. Ilyenkor előbb a panasz okát kell tisztázni."],
            ['Allergia vagy irritáció?', 'Az irritáció gyakran átmeneti kellemetlenség, az allergia viszont erősebb és tartósabb reakció is lehet. Pontos megállapítást kozmetikai blogból nem lehet tenni, ezért komoly tünetnél orvosi tanács javasolt.'],
            ['Mit tehetsz megelőzésként?', 'Jelezd előre a korábbi érzékenységet, kérj konzultációt, és ne titkold el, ha volt már kellemetlen tapasztalatod ragasztóval, festékkel vagy kozmetikai anyaggal.'],
            ['Mikor ne foglalj időpontot?', 'Ha a szemed fáj, váladékozik, gyulladt vagy erősen piros, a kezelés nem prioritás. Ilyenkor az egészségi állapot rendezése az első lépés.']
        ];
        if ($t['intent'] === 'local') return [
            ['Hogyan válassz Budapesten?', 'Ne csak a közelséget és az árat nézd. Fontos a portfólió, a vélemények minősége, az időpontfoglalás átláthatósága, a higiénia és az, hogy a stylist tud-e személyre szabott javaslatot adni.'],
            ['Milyen jelek biztatóak?', 'Jó jel, ha a szolgáltató világosan kommunikál az árakról, a lemondási feltételekről, az ápolásról és arról is, kinek nem ajánlott egy kezelés.'],
            ['Foglalás előtt', 'Gondold át, milyen hatást szeretnél, és ments el néhány inspirációt. Emellett készülj arra is, hogy a szakember nem minden kért formát javasol, ha az nem illik a saját pilláidhoz vagy szemformádhoz.'],
            ['Összefoglalás', 'Budapesten a jó választás nem a legtöbb hirdetésről szól, hanem arról, hogy a szolgáltatás szakmailag, esztétikailag és kommunikációban is illeszkedik hozzád.']
        ];
        return [
            ['Mi ez pontosan?', "A {$focus} lényege, hogy az eredmény ne sablonos legyen, hanem a szemformához, saját pilla vagy szemöldök állapotához és a kívánt hatáshoz igazodjon."],
            ['Kinek ajánlott?', 'Azoknak, akik rendezettebb, nőiesebb és ápoltabb megjelenést szeretnének a mindennapokban. Különösen hasznos lehet, ha kevesebb sminkkel is frissebb tekintetet szeretnél.'],
            ['Kinek nem biztos, hogy ideális?', 'Aktív irritáció, gyulladás, sérült bőr vagy kellemetlen panasz esetén érdemes várni. A kezelés akkor ad jó élményt, ha a szemkörnyék nyugodt és a választott technika illeszkedik az adottságokhoz.'],
            ['Mire figyelj előtte?', 'Érkezz tiszta szemkörnyékkel, erős smink és olajos krém nélkül. Mondd el, ha érzékeny vagy, volt korábbi allergiás reakciód, vagy bizonytalan vagy a kívánt hatásban.'],
            ['Összefoglalás', "A {$focus} akkor működik igazán jól, ha nem trend alapján választasz, hanem a saját adottságaidhoz és életmódodhoz igazítva."]
        ];
    }

    private static function faq_for($t) {
        if ($t['intent'] === 'safety') return [
            ['Komoly tünetnél elég várni?', 'Nem. Erős fájdalom, duzzanat, váladékozás vagy romló panasz esetén szakmai vagy orvosi segítség javasolt.'],
            ['Lehet érzékeny szemmel szolgáltatást kérni?', 'Lehet, de csak óvatosan, előzetes konzultációval és a panaszok pontos átbeszélésével.'],
            ['A blog helyettesíti az orvosi tanácsot?', 'Nem. A cikk tájékoztatásra szolgál, egészségügyi panasz esetén orvoshoz kell fordulni.']
        ];
        return [
            ['Mennyi ideig tart az eredmény?', 'Egyéni adottságtól, életmódtól és ápolástól függ. A saját szálak természetes cserélődése mindenkinél befolyásolja a tartósságot.'],
            ['Kell előtte konzultáció?', 'Első alkalommal igen, mert a forma, hossz, ív, szín és intenzitás személyre szabva ad szép eredményt.'],
            ['Mit tegyek, ha bizonytalan vagyok?', 'Válassz természetesebb irányt, és kérj szakmai javaslatot. A hatás később fokozható, de a túl erős első választás könnyen idegen lehet.']
        ];
    }

    private static function cta_html() {
        return '<section class="noir-cta-block"><p class="noir-kicker">FOGLALÁS</p><h2>Nem tudod, melyik szolgáltatás lenne ideális?</h2><p>Ha természetes, igényes hatást szeretnél, érdemes személyre szabottan választani műszempilla, szempilla lifting vagy szemöldök styling között.</p><div class="noir-cta-actions"><a class="noir-button noir-button-primary" href="' . esc_url(home_url('/idopontfoglalas/')) . '">Időpontot foglalok</a><a class="noir-button noir-button-secondary" href="' . esc_url(home_url('/szolgaltatasok/')) . '">Megnézem a szolgáltatásokat</a><a class="noir-button noir-button-secondary" href="' . esc_url(home_url('/munkaim/')) . '">Megnézem a munkáim</a></div></section>';
    }

    private static function first_cat($post_id) {
        $terms = get_the_category($post_id);
        return (!empty($terms) && !is_wp_error($terms)) ? $terms[0]->name : 'Blog';
    }

    private static function reading_time($content) {
        $words = str_word_count(wp_strip_all_tags($content));
        return max(2, (int)ceil($words / 180));
    }

    private static function seo_description($t) {
        $text = $t['excerpt'] . ' Gyakorlati útmutató foglalás előtt, túlzó ígéretek nélkül.';
        return function_exists('mb_substr') ? mb_substr($text, 0, 155) : substr($text, 0, 155);
    }

    private static function categories() {
        return ['Árak és döntési útmutatók', 'Műszempilla', 'Szempilla lifting', 'Szemöldök styling', 'Ápolási tippek', 'Gyakori kérdések', 'Esküvő és alkalmak'];
    }

    private static function pillar_pages() {
        return [
            ['title'=>'Műszempilla építés teljes útmutató','slug'=>'muszempilla-epites-utmutato','excerpt'=>'Átfogó útmutató műszempilla építéshez.','content'=>self::site_header_html('Blog') . '<section class="noir-page-intro"><p class="noir-kicker">MŰSZEMPILLA ÚTMUTATÓ</p><h1>Műszempilla építés teljes útmutató</h1><p>A műszempilla építés akkor ad igazán szép eredményt, ha a szett nem sablon alapján készül, hanem a szemformához, saját pillákhoz és életmódhoz igazodik.</p></section><div class="noir-content-card"><h2>Milyen technikák léteznek?</h2><p>Az 1D természetesebb, a 2D és 3D dúsabb, a volume pedig látványosabb hatást adhat. A jó választás nem a legnagyobb D számról szól, hanem az arcoddal harmonikus eredményről.</p></div>[noir_blog_list category="Műszempilla" limit="9"]' . self::site_footer_html()],
            ['title'=>'Szempilla lifting teljes útmutató','slug'=>'szempilla-lifting-utmutato','excerpt'=>'Átfogó útmutató szempilla liftinghez.','content'=>self::site_header_html('Blog') . '<section class="noir-page-intro"><p class="noir-kicker">SZEMPILLA LIFTING</p><h1>Szempilla lifting teljes útmutató</h1><p>A szempilla lifting a saját pillák ívét emeli meg, ezért természetes, ápolt hatást adhat műszálak nélkül.</p></section><div class="noir-content-card"><h2>Kinek ajánlott?</h2><p>A lifting akkor működik szépen, ha van elegendő saját pilla, amelyet meg lehet emelni. Egyenes, lefelé álló pilláknál látványos változást adhat.</p></div>[noir_blog_list category="Szempilla lifting" limit="9"]' . self::site_footer_html()],
            ['title'=>'Szemöldök styling és laminálás útmutató','slug'=>'szemoldok-styling-laminalas-utmutato','excerpt'=>'Szemöldök laminálás, formázás és festés érthetően.','content'=>self::site_header_html('Blog') . '<section class="noir-page-intro"><p class="noir-kicker">SZEMÖLDÖK STYLING</p><h1>Szemöldök styling és laminálás útmutató</h1><p>A szemöldök formája erősen meghatározza az arc karakterét. A jó styling nem trendet másol, hanem az arcodhoz és szőrszálaidhoz igazodik.</p></section><div class="noir-content-card"><h2>Mitől lesz szép a szemöldök?</h2><p>A forma, a szín, a sűrűség és a természetes növekedési irány együtt adja az eredményt.</p></div>[noir_blog_list category="Szemöldök styling" limit="9"]' . self::site_footer_html()],
        ];
    }

    private static function topics() {
        return [
            ['title'=>'Szempilla lifting vagy műszempilla: melyik való neked?','slug'=>'szempilla-lifting-vagy-muszempilla','category'=>'Árak és döntési útmutatók','intent'=>'decision','focus'=>'szempilla lifting vagy műszempilla választás','excerpt'=>'Összehasonlítjuk a liftinget és a műszempillát hatás, tartósság, ápolás és döntési szempontok alapján.'],
            ['title'=>'1D, 2D, 3D műszempilla: mi a különbség?','slug'=>'1d-2d-3d-muszempilla-kulonbseg','category'=>'Műszempilla','intent'=>'decision','focus'=>'1D, 2D és 3D műszempilla különbsége','excerpt'=>'Érthető útmutató az 1D, 2D és 3D technikák közötti különbségekről.'],
            ['title'=>'Természetes hatású műszempilla: kinek ajánlott?','slug'=>'termeszetes-hatasu-muszempilla-kinek-ajanlott','category'=>'Műszempilla','intent'=>'decision','focus'=>'természetes hatású műszempilla','excerpt'=>'A természetes műszempilla célja nem a túlzás, hanem az arc karakteréhez illő kiemelés.'],
            ['title'=>'Műszempilla árak: mitől függ az ár?','slug'=>'muszempilla-arak-mitol-fugg-az-ar','category'=>'Árak és döntési útmutatók','intent'=>'price','focus'=>'műszempilla árak','excerpt'=>'Megmutatjuk, milyen tényezők állnak a műszempilla árak mögött.'],
            ['title'=>'Milyen műszempilla illik a szemformádhoz?','slug'=>'milyen-muszempilla-illik-a-szemformadhoz','category'=>'Műszempilla','intent'=>'decision','focus'=>'szemformához illő műszempilla','excerpt'=>'Szemforma, ív, hossz és hatás alapján segítünk eligazodni.'],
            ['title'=>'Műszempilla esküvő előtt: mikor érdemes időpontot foglalni?','slug'=>'muszempilla-eskuvo-elott-mikor-foglalj','category'=>'Esküvő és alkalmak','intent'=>'occasion','focus'=>'esküvő előtti műszempilla','excerpt'=>'Mikor legyen próbaszett, mikor legyen végleges időpont, és mire figyelj a nagy nap előtt.'],
            ['title'=>'Szempilla lifting árak: mit tartalmaz a kezelés?','slug'=>'szempilla-lifting-arak-mit-tartalmaz','category'=>'Árak és döntési útmutatók','intent'=>'price','focus'=>'szempilla lifting árak','excerpt'=>'Érthetően összefoglaljuk, mit tartalmazhat egy szempilla lifting kezelés ára.'],
            ['title'=>'Tönkreteszi a műszempilla a saját pillákat?','slug'=>'tonkreteszi-a-muszempilla-a-sajat-pillakat','category'=>'Gyakori kérdések','intent'=>'safety','focus'=>'műszempilla hatása a saját pillákra','excerpt'=>'Tisztázzuk, mikor kímélhető a saját pilla, és milyen hibákat kell elkerülni.'],
            ['title'=>'Műszempilla allergia vagy irritáció: mire figyelj?','slug'=>'muszempilla-allergia-vagy-irritacio','category'=>'Gyakori kérdések','intent'=>'safety','focus'=>'műszempilla allergia vagy irritáció','excerpt'=>'Mi lehet átmeneti irritáció, mikor kell óvatosnak lenni, és mikor kérj segítséget.'],
            ['title'=>'Mit tegyél, ha csíp vagy kellemetlen a szempillád?','slug'=>'mit-tegyel-ha-csip-vagy-kellemetlen-a-szempillad','category'=>'Gyakori kérdések','intent'=>'safety','focus'=>'csípő vagy kellemetlen szempilla','excerpt'=>'Gyakorlati tanácsok kellemetlenség esetére, egészségügyi ígéretek nélkül.'],
            ['title'=>'Miért hullik gyorsan a műszempilla?','slug'=>'miert-hullik-gyorsan-a-muszempilla','category'=>'Ápolási tippek','intent'=>'care','focus'=>'gyorsan hulló műszempilla','excerpt'=>'A gyors hullás leggyakoribb okai: pillaéletciklus, ápolás, olajos termékek és életmód.'],
            ['title'=>'Fáj a műszempilla építés?','slug'=>'faj-a-muszempilla-epites','category'=>'Gyakori kérdések','intent'=>'safety','focus'=>'műszempilla építés kényelme','excerpt'=>'Mit érezhetsz kezelés közben, és mi az, ami már nem normális kellemetlenség.'],
            ['title'=>'Lehet műszempillát viselni érzékeny szemmel?','slug'=>'muszempilla-erzekeny-szemmel','category'=>'Gyakori kérdések','intent'=>'safety','focus'=>'műszempilla érzékeny szemmel','excerpt'=>'Érzékeny szem esetén a konzultáció, óvatosság és panaszok figyelése különösen fontos.'],
            ['title'=>'Kontaktlencsével lehet műszempillát viselni?','slug'=>'kontaktlencsevel-lehet-muszempillat-viselni','category'=>'Gyakori kérdések','intent'=>'safety','focus'=>'kontaktlencse és műszempilla','excerpt'=>'Mire figyelj kontaktlencsével kezelés előtt, közben és után.'],
            ['title'=>'Műszempilla ápolása otthon: teljes útmutató','slug'=>'muszempilla-apolasa-otthon','category'=>'Ápolási tippek','intent'=>'care','focus'=>'műszempilla otthoni ápolása','excerpt'=>'Otthoni ápolási szabályok, amelyek segíthetnek szebben megtartani az eredményt.'],
            ['title'=>'Mit nem szabad műszempilla építés után?','slug'=>'mit-nem-szabad-muszempilla-epites-utan','category'=>'Ápolási tippek','intent'=>'care','focus'=>'műszempilla építés utáni tiltások','excerpt'=>'Az első napok legfontosabb szabályai friss műszempilla után.'],
            ['title'=>'Hogyan moss arcot műszempillával?','slug'=>'hogyan-moss-arcot-muszempillaval','category'=>'Ápolási tippek','intent'=>'care','focus'=>'arcmosás műszempillával','excerpt'=>'Gyengéd tisztítási rutin műszempillával, erős dörzsölés nélkül.'],
            ['title'=>'Lehet szempillaspirált használni műszempillára?','slug'=>'lehet-szempillaspiralt-hasznalni-muszempillara','category'=>'Ápolási tippek','intent'=>'care','focus'=>'szempillaspirál műszempillára','excerpt'=>'Mikor nem ajánlott spirált használni, és miért ronthatja a tartósságot.'],
            ['title'=>'Hogyan aludj műszempillával?','slug'=>'hogyan-aludj-muszempillaval','category'=>'Ápolási tippek','intent'=>'care','focus'=>'alvás műszempillával','excerpt'=>'Alvási szokások, amelyek befolyásolhatják a műszempilla tartósságát.'],
            ['title'=>'Műszempilla nyaralás előtt: strand, naptej, víz','slug'=>'muszempilla-nyaralas-elott-strand-naptej-viz','category'=>'Esküvő és alkalmak','intent'=>'care','focus'=>'műszempilla nyaralás előtt','excerpt'=>'Strand, víz, naptej és utazás: mire figyelj nyaralás előtt.'],
            ['title'=>'Mikor kell műszempilla töltésre menni?','slug'=>'mikor-kell-muszempilla-toltesre-menni','category'=>'Ápolási tippek','intent'=>'care','focus'=>'műszempilla töltés időzítése','excerpt'=>'Mikor időszerű a töltés, és mitől függ, hogy mennyi marad fent.'],
            ['title'=>'Szemöldök laminálás: kinek ajánlott?','slug'=>'szemoldok-laminalas-kinek-ajanlott','category'=>'Szemöldök styling','intent'=>'decision','focus'=>'szemöldök laminálás','excerpt'=>'Kinek ad szép eredményt a szemöldök laminálás, és mikor érdemes más megoldást választani.'],
            ['title'=>'Szemöldök laminálás vagy festés: mi a különbség?','slug'=>'szemoldok-laminalas-vagy-festes','category'=>'Szemöldök styling','intent'=>'decision','focus'=>'szemöldök laminálás vagy festés','excerpt'=>'Forma, irány, szín és teltség: így különbözik a laminálás és a festés.'],
            ['title'=>'Henna szemöldök: meddig tart és kinek jó?','slug'=>'henna-szemoldok-meddig-tart','category'=>'Szemöldök styling','intent'=>'decision','focus'=>'henna szemöldök','excerpt'=>'A henna szemöldök hatása, tartóssága és választási szempontjai.'],
            ['title'=>'Milyen szemöldökforma illik az arcodhoz?','slug'=>'milyen-szemoldokforma-illik-az-arcodhoz','category'=>'Szemöldök styling','intent'=>'decision','focus'=>'arcformához illő szemöldökforma','excerpt'=>'Nem minden trend illik mindenkinek: így gondolkodj szemöldökformáról.'],
            ['title'=>'Szemöldök styling árak: mitől függ az ár?','slug'=>'szemoldok-styling-arak','category'=>'Árak és döntési útmutatók','intent'=>'price','focus'=>'szemöldök styling árak','excerpt'=>'Mit tartalmazhat a szemöldök styling ára, és hogyan hasonlíts szolgáltatásokat.'],
            ['title'=>'Szempilla stylist Budapesten: hogyan válassz jó szakembert?','slug'=>'szempilla-stylist-budapest-hogyan-valassz','category'=>'Árak és döntési útmutatók','intent'=>'local','focus'=>'szempilla stylist választás Budapesten','excerpt'=>'Budapesti választási szempontok: portfólió, árak, higiénia, foglalás és kommunikáció.'],
            ['title'=>'Műszempilla építés Budapesten: mire figyelj időpontfoglalás előtt?','slug'=>'muszempilla-epites-budapest-idopontfoglalas','category'=>'Műszempilla','intent'=>'local','focus'=>'műszempilla építés Budapesten','excerpt'=>'Mit nézz meg foglalás előtt, ha Budapesten keresel műszempilla szolgáltatást.'],
            ['title'=>'Szempilla lifting Budapesten: természetes hatás tartósan','slug'=>'szempilla-lifting-budapest-termeszetes-hatas','category'=>'Szempilla lifting','intent'=>'local','focus'=>'szempilla lifting Budapesten','excerpt'=>'Természetes hatású lifting Budapesten: kinek ajánlott és mire figyelj.'],
            ['title'=>'Esküvői szempilla Budapesten: mikor foglalj időpontot?','slug'=>'eskuvoi-szempilla-budapest-mikor-foglalj','category'=>'Esküvő és alkalmak','intent'=>'local','focus'=>'esküvői szempilla Budapesten','excerpt'=>'Esküvő előtti időzítés, próba és végleges alkalmi szett tervezése.'],
        ];
    }
}

register_activation_hook(__FILE__, ['Noir_Blog_System', 'activate']);
Noir_Blog_System::init();
