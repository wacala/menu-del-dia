#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  BACKUP SCRIPT — Menú del Día
#  Triple respaldo: GitHub + disco externo + backup local
# ============================================================

PROJECT_DIR="/Users/walter/Trabajos/menu-del-dia"
BACKUP_DISK="${BACKUP_DISK:-}"              # ej: /Volumes/BackupDisk
BACKUP_NAME="menu-del-dia"
TIMESTAMP=$(date "+%Y-%m-%d_%H-%M-%S")

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()  { echo -e "${GREEN}✓${NC} $1"; }
warn(){ echo -e "${YELLOW}⚠${NC} $1"; }
err() { echo -e "${RED}✗${NC} $1"; }

# ── 1. Limpiar salida ──────────────────────────────────────
echo ""
echo "  📦 BACKUP — Menú del Día"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "  ─────────────────────────"
echo ""

cd "$PROJECT_DIR" || { err "No se encuentra $PROJECT_DIR"; exit 1; }

# ── 2. Git: commit cambios pendientes ──────────────────────
if [[ -n $(git status --porcelain) ]]; then
  git add -A
  git commit -m "backup: snapshot automático $TIMESTAMP" || warn "Commit omitido (sin cambios)"
  ok "Commit local"
else
  ok "Working tree limpio"
fi

# ── 3. Git: push a GitHub ──────────────────────────────────
if git push 2>&1 | grep -q "Everything up-to-date\|main -> main"; then
  ok "Push a GitHub"
else
  warn "Push a GitHub — verifica conexión SSH"
fi

# ── 4. Backup local comprimido ─────────────────────────────
LOCAL_BACKUP="$PROJECT_DIR/../backups/$BACKUP_NAME-$TIMESTAMP.tar.gz"
mkdir -p "$(dirname "$LOCAL_BACKUP")"
tar --exclude='node_modules' \
    --exclude='.expo' \
    --exclude='dist' \
    --exclude='.DS_Store' \
    -czf "$LOCAL_BACKUP" \
    -C "$PROJECT_DIR/.." "$(basename "$PROJECT_DIR")"
ok "Backup local: $(basename "$LOCAL_BACKUP") ($(du -h "$LOCAL_BACKUP" | cut -f1))"

# ── 5. Copia a disco externo ───────────────────────────────
if [[ -n "$BACKUP_DISK" ]] && [[ -d "$BACKUP_DISK" ]]; then
  DEST="$BACKUP_DISK/$BACKUP_NAME"
  mkdir -p "$DEST"
  cp "$LOCAL_BACKUP" "$DEST/"
  ok "Copia a disco externo: $DEST"

  # Limpiar backups viejos (conservar últimos 30)
  find "$DEST" -name "$BACKUP_NAME-*.tar.gz" -mtime +30 -delete 2>/dev/null || true
  ok "Limpieza de backups > 30 días"
else
  warn "Disco externo no detectado — omite copia"
fi

# ── 6. Limpiar backups locales viejos (> 90 días) ──────────
BACKUP_DIR=$(dirname "$LOCAL_BACKUP")
find "$BACKUP_DIR" -name "$BACKUP_NAME-*.tar.gz" -mtime +90 -delete 2>/dev/null || true

# ── 7. Resumen ─────────────────────────────────────────────
echo ""
echo "  ─────────────────────────"
echo "  ✅ Backup completo"
echo "     Local : $BACKUP_DIR"
[[ -n "$BACKUP_DISK" ]] && echo "     Disco : $BACKUP_DISK/$BACKUP_NAME"
echo "     GitHub: origin/main"
echo ""
