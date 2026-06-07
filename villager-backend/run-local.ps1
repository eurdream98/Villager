# Villager 백엔드 로컬 실행
# 프론트(npm start)와 같은 터미널에 HOST=localhost, PORT=3000 이 있으면
# HOST/PORT(CRA) 환경 변수가 남아 있으면 충돌할 수 있어 전용 터미널에서 실행하세요.
# server.address: 127.0.0.1 은 Windows 에서 "Bad address: listen" 을 유발할 수 있음(application-local.yml 에서 제거됨).

Remove-Item Env:HOST -ErrorAction SilentlyContinue
Remove-Item Env:PORT -ErrorAction SilentlyContinue
Remove-Item Env:SERVER_PORT -ErrorAction SilentlyContinue
Remove-Item Env:SERVER_ADDRESS -ErrorAction SilentlyContinue
Remove-Item Env:HTTP_PROXY, Env:HTTPS_PROXY, Env:ALL_PROXY, Env:http_proxy, Env:https_proxy -ErrorAction SilentlyContinue

Set-Location $PSScriptRoot

$portLine = netstat -ano | Select-String ":8080\s+.*LISTENING"
if ($portLine) {
  $pidOnPort = ($portLine -split "\s+")[-1]
  Write-Host "포트 8080 사용 중 (PID $pidOnPort). 기존 백엔드를 쓰거나 종료 후 다시 실행하세요:" -ForegroundColor Yellow
  Write-Host "  Stop-Process -Id $pidOnPort -Force"
  exit 1
}

Write-Host "Starting villager-backend on http://127.0.0.1:8080 ..."
# preferIPv6Addresses=true 는 Windows 에서 Tomcat "Bad address: listen" 을 유발할 수 있음
$jvmArgs = "-Dserver.port=8080 -Dserver.address=0.0.0.0 -Djava.net.useSystemProxies=false -DsocksProxyHost= -DsocksProxyPort= -Dhttp.proxyHost= -Dhttps.proxyHost= -Dhttp.nonProxyHosts=*"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local" "-Dspring-boot.run.jvmArguments=$jvmArgs"
