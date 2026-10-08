# Özel Ders Asistanım — Tanıtım Sitesi

Özel ders öğretmenleri, öğrenciler ve veliler için geliştirilen **Özel Ders Asistanım** platformunun Türkçe/İngilizce tanıtım sitesi.

**Şirket:** Özel Ders Asistanım Eğitim ve Öğretim Limited Şirketi · VKN 5928417366 · Kuruluş 13.06.2026

## Yapı

```
index.html          Ana sayfa (Türkçe içerik HTML'de, İngilizce assets/js/i18n.js'te)
gizlilik.html       Gizlilik / KVKK aydınlatma metni (TR + EN)
assets/css/style.css  Tasarım sistemi (açık/koyu tema, responsive)
assets/js/i18n.js   İngilizce metinler
assets/js/main.js   Dil değiştirme, mobil menü, sekmeler, iletişim e-postası
assets/img/logo.svg Logo / favicon
```

Derleme adımı yoktur; saf HTML/CSS/JS. Dil `?lang=en` / `?lang=tr` ile veya sağ üstteki TR/EN düğmesiyle değişir.

## Yerelde çalıştırma

```bash
python3 -m http.server 8080
```

## Güncelleme notları

- **İletişim e-postası:** `assets/js/main.js` içindeki `CONTACT_EMAIL` değişkeni.
- **Yeni metin:** HTML'e Türkçe metni `data-i18n="anahtar"` ile ekleyin, aynı anahtarın İngilizcesini `assets/js/i18n.js`'e yazın.
- **Alan adı:** https://ozeldersasistanim.com — `CNAME` dosyası ve Cloudflare DNS (GitHub Pages A kayıtları) ile bağlı.

## Canlı demo (veli raporu)

`demo.html` → `https://api.ozeldersasistanim.com/report` (Cloudflare Worker, `worker/`).
Worker, Claude API'yi (`claude-opus-5-5`) çağırır ve raporu akış (SSE) olarak döndürür. API anahtarı yalnızca Worker secret'ında durur.

```bash
cd worker
npm install
npx wrangler login                          # bir kez
npx wrangler secret put ANTHROPIC_API_KEY   # anahtarı yalnızca bu komuta yapıştırın
npx wrangler deploy
```

Yerel test: `worker/.dev.vars` içine `ANTHROPIC_API_KEY=...` yazıp `npx wrangler dev --port 8787`; site `localhost:8080` üzerinden açıldığında otomatik olarak yerel Worker'ı kullanır.
