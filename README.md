# 帳號模組資料庫結構
![alt text](./media/READMEIMG/image.png)
# 登入流程圖
![alt text](./media/READMEIMG/image2.png)

# 說明
## 測試頁面為 http://{{hostname}}/app/login
### 路徑參考 app.router.js - /:action
### 包含 svg 驗證碼生成
### 帳密驗證、狀態回饋 由 pg.controller.js - acc_login_verify 從資料庫進行內部驗證