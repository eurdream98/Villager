param(
  [int]$Port = 3000
)

function Stop-PortListeners {
  param([int]$TargetPort)

  $killed = @()

  # netstat (IPv4/IPv6 LISTENING)
  $pattern = ":$TargetPort\s"
  netstat -ano | Select-String $pattern | ForEach-Object {
    $line = $_.Line.Trim()
    if ($line -match 'LISTENING\s+(\d+)\s*$') {
      $killed += [int]$Matches[1]
    }
  }

  # Get-NetTCPConnection 보조
  Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { $killed += $_.OwningProcess }

  $killed | Sort-Object -Unique | ForEach-Object {
    $proc = Get-Process -Id $_ -ErrorAction SilentlyContinue
    if ($proc) {
      Write-Host "Port $TargetPort -> $($proc.ProcessName) (PID $_) 종료"
      Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Host "Port $Port 정리 중..."
Stop-PortListeners -TargetPort $Port
Start-Sleep -Seconds 1
Stop-PortListeners -TargetPort $Port
