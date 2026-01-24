
■ローカルで編集したファイルを WEB にプッシュする
cd ~/Desktop/TradeBase/LIFF_Seller
ls -la
tree -la
git add .
git commit -m "0125 0717"
git push origin main

■WEBで編集したファイルをローカルにプルする
cd ~/Desktop/TradeBase/LIFF_Seller
git pull origin main
ls -la
tree -la

デプロイの進捗
https://github.com/takase-hiroyuki/TradebaseSeller/actions

結果
https://takase-hiroyuki.github.io/TradebaseSeller/public/


