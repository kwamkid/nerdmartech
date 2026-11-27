# NerdMarTech class setup - Windows 10/11
# Usage (PowerShell):  irm https://nerdmartech.com/setup/win.ps1 | iex
# Safe to run again: anything already installed is skipped.
# Output is ASCII on purpose: Windows PowerShell 5.1 may garble Thai from irm | iex.
# $env:DRY_RUN = "1" before running = print what would run without changing the machine.

& {
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$Log = Join-Path $env:USERPROFILE 'nerdmartech-setup.log'
Set-Content -Path $Log -Value "NerdMarTech setup $(Get-Date -Format s)  $([Environment]::OSVersion.VersionString)" -Encoding UTF8
$Dry = [bool]$env:DRY_RUN

function Say($t)  { Write-Host ""; Write-Host ">> $t" -ForegroundColor Yellow; Add-Content $Log "== $t" }
function Info($t) { Write-Host "   $t"; Add-Content $Log "   $t" }
function Has($c)  { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Run($exe, [string[]]$a) {
  Add-Content $Log "`$ $exe $($a -join ' ')"
  if ($Dry) { Info "[dry-run] $exe $($a -join ' ')"; return }
  & $exe @a *>> $Log
}
function Refresh-Path {
  $m = [Environment]::GetEnvironmentVariable('Path','Machine')
  $u = [Environment]::GetEnvironmentVariable('Path','User')
  $env:Path = "$m;$u"
}
function Add-UserPath($dir) {
  if (-not (Test-Path $dir)) { return }
  $u = [Environment]::GetEnvironmentVariable('Path','User'); if (-not $u) { $u = '' }
  if (($u -split ';') -contains $dir) { Info "PATH already has $dir"; return }
  if ($Dry) { Info "[dry-run] add to PATH: $dir"; return }
  [Environment]::SetEnvironmentVariable('Path', ($u.TrimEnd(';') + ';' + $dir).TrimStart(';'), 'User')
  Info "Added to PATH: $dir"
}
function Winget($id, $name, $cmd) {
  if ($cmd -and (Has $cmd)) { Info "$name already installed - skip"; return }
  $listed = winget list --id $id -e --accept-source-agreements 2>$null | Select-String -SimpleMatch $id
  if ($listed) { Info "$name already installed - skip"; return }
  Info "Installing $name ..."
  Run 'winget' @('install','--id',$id,'-e','--silent','--accept-source-agreements','--accept-package-agreements')
  Refresh-Path
}

Write-Host ""
Write-Host " NerdMarTech - class setup (Windows)" -ForegroundColor Cyan
Write-Host " Takes about 10-30 minutes. Do not close this window."
Write-Host " If Windows asks 'Do you want to allow this app to make changes?' click YES."
Write-Host " Log file: $Log"

# ---------- 1. winget ----------
Say "1/8 Check winget (Windows app installer)"
if (-not (Has 'winget')) {
  Info "winget not found. Open Microsoft Store, install/update 'App Installer', then run this again:"
  Info "https://apps.microsoft.com/detail/9NBLGGH4NNS1"
  Start-Process "ms-windows-store://pdp/?ProductId=9NBLGGH4NNS1"
  return
}
Info "OK"

# ---------- 2. PowerShell script policy (npm / vercel need it) ----------
Say "2/8 Allow PowerShell scripts for this user"
if ((Get-ExecutionPolicy -Scope CurrentUser) -in @('RemoteSigned','Unrestricted','Bypass')) { Info "already set - skip" }
elseif ($Dry) { Info "[dry-run] Set-ExecutionPolicy RemoteSigned -Scope CurrentUser" }
else { Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; Info "set to RemoteSigned" }

# ---------- 3. Git + Node ----------
Say "3/8 Git + Node.js"
Winget 'Git.Git' 'Git' 'git'
$nodeOk = $false
if (Has 'node') { try { $nodeOk = ([int]((node -v).TrimStart('v').Split('.')[0]) -ge 20) } catch {} }
if ($nodeOk) { Info "Node $(node -v) already installed - skip" } else { Winget 'OpenJS.NodeJS.LTS' 'Node.js LTS' $null }

# ---------- 4. Apps ----------
Say "4/8 VS Code + Claude Desktop"
Winget 'Microsoft.VisualStudioCode' 'VS Code' 'code'
$claudeApp = (Test-Path "$env:LOCALAPPDATA\AnthropicClaude") -or (Test-Path "$env:LOCALAPPDATA\Programs\Claude")
if ($claudeApp) { Info "Claude Desktop already installed - skip" } else { Winget 'Anthropic.Claude' 'Claude Desktop' $null }

# ---------- 5. Tools ----------
Say "5/8 GitHub CLI + FFmpeg + Vercel CLI"
Winget 'GitHub.cli' 'GitHub CLI' 'gh'
Winget 'Gyan.FFmpeg' 'FFmpeg' 'ffmpeg'
Refresh-Path
if (Has 'vercel') { Info "Vercel CLI already installed - skip" }
elseif (Has 'npm') { Info "Installing Vercel CLI ..."; Run 'npm.cmd' @('install','-g','vercel') }
else { Info "npm not found yet - Vercel CLI skipped (run this script again)" }

# ---------- 6. Claude Code ----------
Say "6/8 Claude Code"
$env:Path = "$env:USERPROFILE\.local\bin;$env:Path"
if (Has 'claude') { Info "Claude Code already installed - skip" }
elseif ($Dry) { Info "[dry-run] irm https://claude.ai/install.ps1 | iex" }
else {
  Info "Installing Claude Code ..."
  try { Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression *>> $Log } catch { Add-Content $Log $_ }
}

# ---------- 7. PATH fix ----------
Say "7/8 Fix PATH (so new windows and VS Code find every tool)"
Add-UserPath "$env:USERPROFILE\.local\bin"
Add-UserPath "$env:APPDATA\npm"
Add-UserPath "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin"
Add-UserPath "$env:LOCALAPPDATA\Microsoft\WinGet\Links"
# Claude Code on Windows needs Git Bash
$bash = @("$env:ProgramFiles\Git\bin\bash.exe", "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($bash -and -not $env:CLAUDE_CODE_GIT_BASH_PATH) {
  if ($Dry) { Info "[dry-run] CLAUDE_CODE_GIT_BASH_PATH=$bash" }
  else { [Environment]::SetEnvironmentVariable('CLAUDE_CODE_GIT_BASH_PATH', $bash, 'User'); Info "Git Bash: $bash" }
}
Refresh-Path
$env:Path = "$env:USERPROFILE\.local\bin;$env:Path"

# ---------- 8. VS Code extension, Class Kit, MCP ----------
Say "8/8 Claude Code extension + Class Kit + MCP (Vercel, Supabase, Meta ads)"
if (Has 'code') {
  if ((code --list-extensions 2>$null) -match '^anthropic\.claude-code$') { Info "Claude Code extension already installed - skip" }
  else { Run 'code.cmd' @('--install-extension','anthropic.claude-code','--force') }
}
if (Has 'claude') {
  if ((claude plugin marketplace list 2>$null | Out-String) -match 'nerdmartech') { Info "nerdmartech plugins already added - skip" }
  else { Run 'claude' @('plugin','marketplace','add','kwamkid/nerdmartech-claude-plugins') }
  if ((claude plugin list 2>$null | Out-String) -match 'class-kit') { Info "Class Kit already installed - skip" }
  else { Run 'claude' @('plugin','install','class-kit@nerdmartech') }
  foreach ($m in @(@('vercel','https://mcp.vercel.com'), @('supabase','https://mcp.supabase.com/mcp'), @('meta-ads','https://mcp.facebook.com/ads'))) {
    claude mcp get $m[0] *> $null
    if ($LASTEXITCODE -eq 0) { Info "MCP $($m[0]) already added - skip" }
    else { Run 'claude' @('mcp','add','--transport','http',$m[0],$m[1],'--scope','user') }
  }
}

# ---------- result ----------
Write-Host ""
Write-Host " RESULT" -ForegroundColor Cyan
$script:fail = 0
function Chk($label, [scriptblock]$test) {
  $ok = $false; try { $ok = [bool](& $test) } catch {}
  if ($ok) { Write-Host "  [OK] $label" -ForegroundColor Green; Add-Content $Log "OK  $label" }
  else { Write-Host "  [X]  $label" -ForegroundColor Red; Add-Content $Log "BAD $label"; $script:fail++ }
}
Chk 'Git'                    { git --version }
Chk 'Node.js'                { node -v }
Chk 'VS Code (code command)' { code -v }
Chk 'Claude Desktop'         { (Test-Path "$env:LOCALAPPDATA\AnthropicClaude") -or (Test-Path "$env:LOCALAPPDATA\Programs\Claude") -or (winget list --id Anthropic.Claude -e 2>$null | Select-String 'Anthropic.Claude') }
Chk 'GitHub CLI'             { gh --version }
Chk 'Vercel CLI'             { Has 'vercel' }
Chk 'FFmpeg'                 { ffmpeg -version }
Chk 'Claude Code'            { claude --version }
Chk 'Claude Code extension'  { (code --list-extensions 2>$null) -match 'anthropic\.claude-code' }
Chk 'Class Kit'              { (claude plugin list 2>$null | Out-String) -match 'class-kit' }
Chk 'MCP Vercel/Supabase/Meta ads' { $n = 0; foreach ($x in 'vercel','supabase','meta-ads') { claude mcp get $x *> $null; if ($LASTEXITCODE -eq 0) { $n++ } }; $n -eq 3 }

Write-Host ""
if ($script:fail -eq 0) {
  Write-Host " ALL DONE" -ForegroundColor Green
  Write-Host " Next: close VS Code completely, open it again, sign in to Claude in the Claude Code panel."
  Write-Host " Take a screenshot of this window and post it in the LINE group."
} else {
  Write-Host " $($script:fail) item(s) not ready." -ForegroundColor Red
  Write-Host " 1) Close this window, open a NEW PowerShell, run the same command again (installed items are skipped)."
  Write-Host " 2) Still red? Post a screenshot + the file $Log in the LINE group."
}
}
