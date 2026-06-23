$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

& .\scripts\with-pnpm.ps1 install
& .\scripts\with-pnpm.ps1 approve-builds --all

if (!(Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
}

& .\scripts\with-pnpm.ps1 db:generate
& .\scripts\with-pnpm.ps1 db:push
