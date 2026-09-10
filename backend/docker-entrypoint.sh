#!/bin/sh
set -e

echo "→ Várakozás az adatbázisra és migrációk futtatása..."
tries=0
until npx prisma migrate deploy; do
  tries=$((tries + 1))
  if [ "$tries" -ge 20 ]; then
    echo "✗ Az adatbázis 40 mp után sem elérhető — kilépés." >&2
    exit 1
  fi
  echo "  ... az adatbázis még nem áll készen, újrapróba ${tries}/20"
  sleep 2
done
echo "✓ Migrációk kész"

echo "→ Alapadatok feltöltése (idempotens — meglévő adatot nem ír felül)..."
node prisma/seed.js || echo "⚠ A seed hibázott, de az API elindul."

echo "→ API indítása..."
exec node src/index.js
