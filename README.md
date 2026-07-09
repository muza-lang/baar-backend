# Baar Ha I Dhaafin — Backend API

Kani waa backend dhab ah (server) oo isticmaala Node.js, Express, iyo database SQLite. Wuxuu maamulaa:
- Diiwaan-gelinta/Login-ka macaamiisha (password-yadu waa la "hash" gareeyay — lama arki karo)
- Login-ka Admin-ka
- Menu-ga (ku dar/wax-ka-beddel/tirtir cunto)
- Shaqaalaha (staff)
- Dalabyada (orders) + la-socodka xaaladda

## 🚀 Sida loo deploy-gareeyo Render.com (BILAASH AH) — tallaabo tallaabo

### Tallaabada 1: GitHub
1. Haddaadan lahayn account GitHub, samee mid bilaash ah: https://github.com/signup
2. Samee repository cusub (New Repository), magaca u dhig tusaale ahaan `baar-ha-i-dhaafin-backend`
3. Soo geli (upload) dhammaan file-yada ku jira folder-kan (`server.js`, `package.json`, `.env.example`, iyo README-kan) — waxaad isticmaali kartaa "uploading an existing file" GitHub website-kiisa.

### Tallaabada 2: Render.com
1. Tag https://render.com oo samee account bilaash ah (waxaad ku gali kartaa GitHub account-kaaga)
2. Marka aad gasho dashboard-ka, riix **"New +"** → **"Web Service"**
3. Xulo repository-ga aad kaloo soo shubtay (`baar-ha-i-dhaafin-backend`)
4. Buuxi settings-ka:
   - **Name**: baar-ha-i-dhaafin-api (ama wax kastoo aad doorato)
   - **Region**: dooro mid kuu dhow (Frankfurt ama Singapore ayaa Soomaaliya u dhow)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
5. Ka hooseeya "Environment Variables" riix **"Add Environment Variable"**:
   - Key: `JWT_SECRET`  Value: geli qoraal random ah oo dheer (tusaale: `x9K2mP8qR5tY7wZ1bN4vC6dF3gH0jL`)
6. Riix **"Create Web Service"**
7. Sug 2-5 daqiiqo — Render wuu deploy-gareyn doonaa. Marka uu dhammaado, waxaad heli doontaa URL sida:
   `https://baar-ha-i-dhaafin-api.onrender.com`
8. Tag URL-kaas browser-ka — waa inuu ku soo bandhigo: `{"status":"Baar Ha I Dhaafin API is running ✅"}`

### Tallaabada 3: **MUHIIM AH** — beddel password-ka Admin-ka
Marka uu server-ku shaqeeyo markii ugu horeysay, wuxuu si otomaatig ah u sameeyaa admin default ah:
- Username: `admin`
- Password: `admin123`

**Isla markiiba** u isticmaal endpoint-kan si aad u beddesho password-ka (waxaad u baahan tahay tool sida Postman, ama i sheeg oo waan kuu sameyn karaa qeyb frontend ah oo kuu oggolaanaysa inaad ka beddesho gudaha Admin Dashboard-ka).

## ⚠️ Xasuusin (Free Tier Limitations)
- Render free tier-ku wuxuu "seexdaa" haddii aan cid isticmaalin 15 daqiiqo — codsigii ugu horeeyay ka dib seexashada wuxuu qaadan karaa 30-50 ilbiriqsi inuu toos u kaco. Tani waa caadi.
- Database-ka (SQLite file) ku yaal disk-ka Render free tier — haddii aad **redeploy** gareyso ama update-gareyso code-ka, xogtu way iska tirmi kartaa (disk-ku wuu dib-u-dhisaa). Haddii aad rabto in xogtu joogto ahaato, waxaad u baahan tahay "Persistent Disk" (lacag leh) ama database sida PostgreSQL (Render wuxuu bixiyaa mid bilaash ah oo ku dhow — waan kaa caawin karaa haddii aad rabto).

## Talaabada Xigta
Marka aad heshid URL-ka Render (`https://xxxx.onrender.com`), ii soo dir — waxaan kaa caawin doonaa inaan website-kaaga (frontend-ka) ku xidho backend-kan, si dhammaan xogtu (macaamiisha, dalabyada, menu-ga) ay ugu kaydsanaadaan meel dhab ah oo aan la asturi karin, halkii ay ku jiri jireen browser-ka kaliya.
