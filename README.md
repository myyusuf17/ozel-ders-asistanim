# Özel Ders Asistanım — Tanıtım Sitesi

Özel ders öğretmenleri, öğrenciler ve veliler için geliştirilen **Özel Ders Asistanım** platformunun Türkçe/İngilizce tanıtım sitesi.

**Şirket:** Özel Ders Asistanım Eğitim ve Öğretim Limited Şirketi · VKN 592841736 · Kuruluş 13.06.2026

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
