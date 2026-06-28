# Noir Blog System

A fejlesztés külön WordPress pluginként került be a `wp-content/plugins/noir-blog-system/` mappába.

## Tartalom

- 30 SEO-orientált blogcikk draft státuszban.
- 4 tudástár/pillar oldal draft státuszban.
- Kategóriák: Műszempilla, Szempilla lifting, Szemöldök styling, Ápolási tippek, Gyakori kérdések, Esküvő és alkalmak, Árak és döntési útmutatók.
- Szöveges, elegáns bloglista képes kezdés nélkül.
- Cikkvégi CTA blokk.
- Kapcsolódó cikkek blokk.
- BlogPosting schema markup.
- Admin menü: Noir Blog.

## Használat

1. Húzd le a `chatgpt/blog-system` branchet.
2. WordPress adminban kapcsold be a Noir Blog System plugint.
3. Nyisd meg az adminban a Noir Blog menüt.
4. Kattints a Blogrendszer telepítése / frissítése gombra.

A cikkek és oldalak draftként jönnek létre, ezért publikálás előtt ellenőrizhetők.

## Shortcode-ok

Minden cikk listázása:

```text
[noir_blog_list limit="30"]
```

Kategória szerinti lista:

```text
[noir_blog_list category="Műszempilla" limit="9"]
```

CTA blokk:

```text
[noir_blog_cta]
```

## Biztonságos működés

A plugin nem írja felül azokat a bejegyzéseket vagy oldalakat, amelyek ugyanazzal a sluggal már léteznek, de nem a plugin hozta létre. A saját tartalmait `_noir_blog_system` meta mezővel jelöli.

A meglévő admin és foglalási rendszer érintetlen marad. A plugin külön admin menüt hoz létre, és a WordPress natív bejegyzés, oldal és kategória rendszerével dolgozik.
