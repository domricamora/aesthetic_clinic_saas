<#
    Deploys the current commit to the live clinic site.

    Run it from the project root:

        pwsh -File scripts/deploy.ps1

    Why this is a script and not a habit: the build bakes the APP_URL into
    every link the frontend emits, because the bundler regenerates the
    Wayfinder route files from it. The local APP_URL is

        http://localhost/aesthetic/public

    and the live one is

        https://patrice.deskpulse.click

    A plain `npm run build` therefore produces a bundle whose every nav link
    points at /aesthetic/public/... and the whole site 404s on click, while
    typing a URL by hand still works. That is the exact failure this script
    exists to prevent.

    The host has no node and no composer, so the frontend is built here and
    uploaded, and migrations run over there.
#>
[CmdletBinding()]
param(
    [string]$Host_ = 'htrjymuo@ck.deskpulse.click',
    [int]$Port = 9022,
    [string]$Remote = '~/public_html/patrice.deskpulse.click',
    [string]$AppUrl = 'https://patrice.deskpulse.click',
    # OpenSSH refuses a key that anyone but you can read. If yours trips that
    # on Windows, point at a copy with clean permissions.
    [string]$IdentityFile = ''
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$Ssh = @('-F', 'none', '-p', $Port)
if ($IdentityFile) { $Ssh += @('-i', $IdentityFile) }

function Invoke-Remote([string]$Command) {
    & ssh @Ssh $Host_ $Command
    if ($LASTEXITCODE -ne 0) { throw "remote command failed: $Command" }
}

Write-Host 'Checking the tree is clean and the suite passes...'
if (git status --porcelain) { throw 'Uncommitted changes. Commit before deploying.' }
php artisan test

Write-Host "Building the frontend for $AppUrl ..."
$previous = $env:APP_URL
$env:APP_URL = $AppUrl
try {
    npm run build
} finally {
    $env:APP_URL = $previous
}

# The bundler regenerates these from APP_URL; a leftover local path here is
# the bug this script exists to catch.
$stale = Get-ChildItem public\build\assets\*.js |
    Select-String -Pattern '/aesthetic/public' -List
if ($stale) {
    throw "The build still contains /aesthetic/public in $($stale.Count) file(s)."
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Write-Host "Backing up the live site and database..."
Invoke-Remote "cd $(Split-Path $Remote -Parent) && tar czf ~/backups/site-$stamp.tar.gz $(Split-Path $Remote -Leaf) 2>/dev/null"
Invoke-Remote "cd $Remote && DB=`$(grep -E '^DB_' .env | sed 's/^export //') && eval `"`$DB`" && mysqldump --single-transaction --quick -h `"`${DB_HOST:-localhost}`" -u `"`$DB_USERNAME`" -p`"`$DB_PASSWORD`" `"`$DB_DATABASE`" > ~/backups/db-$stamp.sql 2>/dev/null"

Write-Host 'Uploading source...'
git archive --format=tar HEAD | & ssh @Ssh $Host_ "cd $Remote && tar xf -"

Write-Host 'Uploading the built frontend...'
tar cf - -C public build | & ssh @Ssh $Host_ "cd $Remote/public && rm -rf build && tar xf -"

Write-Host 'Migrating and clearing caches...'
Invoke-Remote "cd $Remote && php artisan migrate --force"
Invoke-Remote "cd $Remote && php artisan config:clear && php artisan cache:clear && php artisan view:clear"
Invoke-Remote "cd $Remote && mkdir -p public/media/photos/staff public/media/photos/products && chmod 775 public/media/photos/staff public/media/photos/products"

Write-Host 'Verifying...'
foreach ($path in @('/', '/about', '/journal', '/book')) {
    $code = & ssh @Ssh $Host_ "curl -s -o /dev/null -w '%{http_code}' $AppUrl$path"
    if ($code -ne '200') { throw "$path returned $code" }
    Write-Host "  $path -> $code"
}

# Put the local links back so the development site still works.
php artisan wayfinder:generate --with-form | Out-Null
Write-Host "Deployed. Backups: ~/backups/site-$stamp.tar.gz and db-$stamp.sql"
