# Chạy ở root project
npx newman run .\api-tests\postman\lastmile-smoke.postman_collection.json -e .\api-tests\postman\local.postman_environment.json
npx newman run .\api-tests\postman\lastmile-full.postman_collection.json -e .\api-tests\postman\local.postman_environment.json --folder "00 Setup - Login tokens"
npx newman run .\api-tests\postman\lastmile-full.postman_collection.json -e .\api-tests\postman\local.postman_environment.json