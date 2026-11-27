#!/bin/bash
# NerdMarTech class setup — macOS
# Usage:  curl -fsSL https://nerdmartech.com/setup/mac.sh | bash
# Safe to run again: anything already installed is skipped.
# DRY_RUN=1 prints what would run without changing the machine.

main() {
set -u
LOG="$HOME/nerdmartech-setup.log"
: > "$LOG"
DRY="${DRY_RUN:-}"

say()  { printf '\n\033[1;38;5;209m▶ %s\033[0m\n' "$*"; echo "== $*" >> "$LOG"; }
info() { printf '  %s\n' "$*"; echo "   $*" >> "$LOG"; }
run()  {
  echo "\$ $*" >> "$LOG"
  if [ -n "$DRY" ]; then printf '  [dry-run] %s\n' "$*"; return 0; fi
  "$@" >> "$LOG" 2>&1 < /dev/null
}
has()  { command -v "$1" >/dev/null 2>&1; }

printf '\n\033[1m NerdMarTech · ติดตั้งเครื่องสำหรับคอร์ส (Mac)\033[0m\n'
printf ' ใช้เวลาประมาณ 10–30 นาที ขึ้นกับความเร็วเน็ต · ห้ามปิดหน้าต่างนี้\n'
printf ' บันทึกการติดตั้งอยู่ที่ %s\n' "$LOG"
echo "macOS $(sw_vers -productVersion) $(uname -m)" >> "$LOG"

# ---------- 1. admin password (once) ----------
say "1/8 ขอรหัสผ่านเครื่อง Mac (รหัสที่ใช้ปลดล็อกเครื่อง พิมพ์แล้วจะไม่เห็นตัวอักษร เป็นเรื่องปกติ)"
if [ -z "$DRY" ]; then
  if ! sudo -v < /dev/tty; then
    info "❌ รหัสผ่านไม่ถูก หรือบัญชีนี้ไม่ใช่ผู้ดูแลเครื่อง (admin) — ติดต่อผู้สอน"
    exit 1
  fi
  # keep sudo alive while the script runs
  ( while true; do sudo -n true; sleep 50; kill -0 "$$" 2>/dev/null || exit; done ) 2>/dev/null &
fi

# ---------- 2. Homebrew (also installs Apple's Command Line Tools = git) ----------
say "2/8 Homebrew (ตัวช่วยติดตั้งโปรแกรม) + Git"
BREW=""
for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$b" ] && BREW="$b" && break; done
if [ -z "$BREW" ]; then
  info "กำลังติดตั้ง Homebrew … (นานสุดในขั้นนี้ อาจ 5–15 นาที)"
  if [ -z "$DRY" ]; then
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" >> "$LOG" 2>&1 < /dev/null
  else
    info "[dry-run] install Homebrew"
  fi
  for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$b" ] && BREW="$b" && break; done
else
  info "มีอยู่แล้ว ข้าม"
fi
if [ -n "$BREW" ]; then
  eval "$("$BREW" shellenv)"
  export HOMEBREW_NO_AUTO_UPDATE=1 HOMEBREW_NO_INSTALL_CLEANUP=1 HOMEBREW_NO_ENV_HINTS=1
fi
brew_pkg() { # brew_pkg <command> <formula>
  if has "$1"; then info "$2 มีอยู่แล้ว ข้าม"; else info "กำลังติดตั้ง $2 …"; run brew install "$2"; fi
}
cask_app() { # cask_app <App name in /Applications> <cask>
  if [ -d "/Applications/$1.app" ] || [ -d "$HOME/Applications/$1.app" ]; then info "$1 มีอยู่แล้ว ข้าม"
  else info "กำลังติดตั้ง $1 …"; run brew install --cask "$2"; fi
}
[ -n "$BREW" ] && brew_pkg git git

# ---------- 3. Node.js ----------
say "3/8 Node.js (ไฟฟ้าในไซต์งาน — ให้เว็บรันได้)"
if has node && [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -ge 20 ]; then
  info "Node $(node -v) มีอยู่แล้ว ข้าม"
elif [ -n "$BREW" ]; then
  run brew install node
fi

# ---------- 4. Apps: VS Code + Claude Desktop ----------
say "4/8 VS Code + แอป Claude Desktop"
if [ -n "$BREW" ]; then
  cask_app "Visual Studio Code" visual-studio-code
  cask_app "Claude" claude
fi

# ---------- 5. Command-line tools ----------
say "5/8 เครื่องมือ: GitHub CLI · Vercel CLI · FFmpeg (ตัดต่อวิดีโอ)"
if [ -n "$BREW" ]; then
  brew_pkg gh gh
  brew_pkg ffmpeg ffmpeg
fi
if has vercel; then info "Vercel CLI มีอยู่แล้ว ข้าม"
elif has npm; then info "กำลังติดตั้ง Vercel CLI …"; run npm install -g vercel; fi

# ---------- 6. Claude Code ----------
say "6/8 Claude Code"
export PATH="$HOME/.local/bin:$PATH"
if has claude; then info "Claude Code มีอยู่แล้ว ข้าม"
else
  info "กำลังติดตั้ง Claude Code …"
  if [ -z "$DRY" ]; then curl -fsSL https://claude.ai/install.sh | bash >> "$LOG" 2>&1 < /dev/null
  else info "[dry-run] curl -fsSL https://claude.ai/install.sh | bash"; fi
fi

# ---------- 7. PATH fix (so every new Terminal / VS Code finds the tools) ----------
say "7/8 ตั้งค่า PATH (ป้ายบอกที่เก็บเครื่องมือ)"
VSBIN="/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
[ -d "$VSBIN" ] || VSBIN="$HOME/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
MARK="# >>> nerdmartech setup >>>"
BLOCK="$MARK
[ -x /opt/homebrew/bin/brew ] && eval \"\$(/opt/homebrew/bin/brew shellenv)\"
[ -x /usr/local/bin/brew ] && eval \"\$(/usr/local/bin/brew shellenv)\"
export PATH=\"\$HOME/.local/bin:\$PATH:$VSBIN\"
# <<< nerdmartech setup <<<"
for rc in "$HOME/.zprofile" "$HOME/.zshrc" "$HOME/.bash_profile"; do
  if [ -f "$rc" ] && grep -qF "$MARK" "$rc"; then info "$(basename "$rc") ตั้งไว้แล้ว ข้าม"
  elif [ -n "$DRY" ]; then info "[dry-run] add PATH block to $rc"
  else printf '\n%s\n' "$BLOCK" >> "$rc"; info "เพิ่มใน $(basename "$rc") แล้ว"; fi
done
export PATH="$PATH:$VSBIN"

# ---------- 8. VS Code extension · Class Kit · MCP ----------
say "8/8 ส่วนขยาย Claude Code ใน VS Code · Class Kit · MCP (Vercel · Supabase · Meta ads)"
if has code; then
  if code --list-extensions 2>/dev/null | grep -qi '^anthropic.claude-code$'; then info "ส่วนขยาย Claude Code มีอยู่แล้ว ข้าม"
  else run code --install-extension anthropic.claude-code --force; fi
fi
if has claude; then
  if claude plugin marketplace list 2>/dev/null < /dev/null | grep -qi nerdmartech; then info "ร้าน plugin nerdmartech มีอยู่แล้ว ข้าม"
  else run claude plugin marketplace add kwamkid/nerdmartech-claude-plugins; fi
  if claude plugin list 2>/dev/null < /dev/null | grep -qi class-kit; then info "Class Kit มีอยู่แล้ว ข้าม"
  else run claude plugin install class-kit@nerdmartech; fi
  add_mcp() { # add_mcp <name> <url>
    if claude mcp get "$1" >/dev/null 2>&1 < /dev/null; then info "MCP $1 มีอยู่แล้ว ข้าม"
    else run claude mcp add --transport http "$1" "$2" --scope user; fi
  }
  add_mcp vercel   https://mcp.vercel.com
  add_mcp supabase https://mcp.supabase.com/mcp
  add_mcp meta-ads https://mcp.facebook.com/ads
fi

# ---------- result ----------
printf '\n\033[1m ผลการติดตั้ง\033[0m\n'
FAIL=0
chk() { # chk <label> <test command...>
  local label="$1"; shift
  if "$@" >/dev/null 2>&1 < /dev/null; then printf '  ✅ %s\n' "$label"; echo "OK  $label" >> "$LOG"
  else printf '  ❌ %s\n' "$label"; echo "BAD $label" >> "$LOG"; FAIL=$((FAIL+1)); fi
}
chk "Git"                 git --version
chk "Node.js"             node -v
chk "VS Code (คำสั่ง code)" code -v
chk "Claude Desktop"      test -d "/Applications/Claude.app" -o -d "$HOME/Applications/Claude.app"
chk "GitHub CLI"          gh --version
chk "Vercel CLI"          vercel --version
chk "FFmpeg"              ffmpeg -version
chk "Claude Code"         claude --version
chk "ส่วนขยาย Claude Code" sh -c "code --list-extensions | grep -qi anthropic.claude-code"
chk "Class Kit"           sh -c "claude plugin list | grep -qi class-kit"
chk "MCP Vercel · Supabase · Meta ads" sh -c "claude mcp get vercel && claude mcp get supabase && claude mcp get meta-ads"

echo
if [ "$FAIL" -eq 0 ]; then
  printf '\033[1;32m ✅ ครบทุกข้อ\033[0m\n'
  printf ' ขั้นต่อไป: ปิด VS Code ให้หมด (Cmd+Q) แล้วเปิดใหม่ → ล็อกอิน Claude ในแถบ Claude Code\n'
  printf ' แคปหน้าจอนี้ส่งในกลุ่ม LINE ได้เลยครับ\n\n'
else
  printf '\033[1;31m ❌ ยังไม่ครบ %s ข้อ\033[0m — รันคำสั่งเดิมอีกรอบก่อน (ตัวที่ลงแล้วจะข้ามให้)\n' "$FAIL"
  printf ' ถ้ายังไม่ผ่าน ส่งไฟล์ %s + แคปหน้าจอนี้ในกลุ่ม LINE\n\n' "$LOG"
fi
}

main "$@"
