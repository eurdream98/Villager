# Villager 백엔드 로컬 실행
# 프론트(npm start)와 같은 터미널에 HOST=localhost, PORT=3000 이 있으면
# HOST/PORT(CRA) 환경 변수가 남아 있으면 충돌할 수 있어 전용 터미널에서 실행하세요.
# server.address: 127.0.0.1 은 Windows 에서 "Bad address: listen" 을 유발할 수 있음(application-local.yml 에서 제거됨).

Remove-Item Env:HOST -ErrorAction SilentlyContinue
Remove-Item Env:PORT -ErrorAction SilentlyContinue
Remove-Item Env:SERVER_PORT -ErrorAction SilentlyContinue
Remove-Item Env:SERVER_ADDRESS -ErrorAction SilentlyContinue

Set-Location $PSScriptRoot
Write-Host "Starting villager-backend on http://127.0.0.1:8080 ..."
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
