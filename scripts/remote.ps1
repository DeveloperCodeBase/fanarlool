[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('status','bootstrap','fetch','install','build','test','validate','deploy','nginx','edge','platform','backup','rollback','logs','health','version','admin','recover-admin','backup-drill','train')][string]$Action,
    [string]$Sha,
    [string]$SshHost = 'my-vps'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if ($SshHost -notmatch '^[a-zA-Z0-9_.@-]+$') { throw 'Invalid SSH host' }
if ($Action -notin @('status','bootstrap','logs','health','version')) {
    if ($Sha -notmatch '^[0-9a-f]{40}$') { throw 'Supply the exact pushed 40-character SHA with -Sha' }
}
if ($Sha -and $Sha -notmatch '^[0-9a-f]{40}$') { throw 'Invalid SHA' }
$scriptText = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'vps.sh')).Replace("`r`n", "`n")
if ($Action -notin @('status','bootstrap')) {
    $runnerSha = if ($Sha) { $Sha } else { (& git -C $projectRoot rev-parse HEAD).Trim() }
    $committed = & git -C $projectRoot show "${runnerSha}:scripts/vps.sh"
    if ($LASTEXITCODE -ne 0) { throw 'Remote runner must exist in the selected Git commit' }
    $scriptText = ($committed -join "`n") + "`n"
}
$encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($scriptText))
$targetSha = if ($Sha) { $Sha } else { '-' }
if ($Action -in @('admin','recover-admin')) {
    $taskUsername = Read-Host 'Administrator username (latin, 3-64 characters; existing account for recovery)'
    $taskDisplayName = if ($Action -eq 'admin') { Read-Host 'Administrator display name' } else { '' }
    $taskSecret = Read-Host 'Temporary password (12-128 characters)' -AsSecureString
    $taskPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSecret)
    try {
        $taskPayload = @{username=$taskUsername;name=$taskDisplayName;password=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskPointer)} | ConvertTo-Json -Compress
        # bash -c leaves SSH stdin available for the private JSON payload; never put the password in argv.
        $command = "bash -c `"`$(printf '%s' '$encoded' | base64 -d)`" -- '$Action' '$targetSha'"
        $OutputEncoding = [Text.UTF8Encoding]::new($false)
        $taskPayload | & ssh -o BatchMode=yes -o ConnectTimeout=15 $SshHost $command
        if ($LASTEXITCODE -ne 0) { throw 'Initial administrator provisioning failed' }
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskPointer)
        $taskPayload = $null; $taskSecret.Dispose()
    }
    return
}
$command = "printf '%s' '$encoded' | base64 -d | bash -s -- '$Action' '$targetSha'"
& ssh -o BatchMode=yes -o ConnectTimeout=15 $SshHost $command
if ($LASTEXITCODE -ne 0) { throw "FanarLool remote $Action failed (exit $LASTEXITCODE)" }
