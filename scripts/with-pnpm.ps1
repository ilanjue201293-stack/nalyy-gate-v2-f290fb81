param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $PnpmArgs
)

$runtimeRoot = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies"
$runtimeNode = Join-Path $runtimeRoot "node\bin"
$runtimePnpm = Join-Path $runtimeRoot "bin\pnpm.cmd"

if (Test-Path $runtimeNode) {
  $env:Path = "$runtimeNode;$env:Path"
}

if (Test-Path $runtimePnpm) {
  & $runtimePnpm @PnpmArgs
  exit $LASTEXITCODE
}

$pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
if ($pnpmCommand) {
  & $pnpmCommand.Source @PnpmArgs
  exit $LASTEXITCODE
}

Write-Error "pnpm introuvable. Installe Node.js puis active pnpm avec: corepack enable"
exit 1
