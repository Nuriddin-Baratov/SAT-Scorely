package uz.satpro.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.util.Base64;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.OutputStream;

/**
 * SAT Pro — internetdagi saytni (Vercel) to'liq ekranda ochadigan ilova.
 * Kompyuter yoki lokal Wi-Fi shart emas: istalgan internet (mobil yoki Wi-Fi) yetarli.
 */
public class MainActivity extends Activity {
    static final String HOST = "sat-scorely.vercel.app";
    static final String HOME = "https://" + HOST + "/";
    static final int REQ_FILE = 1;
    static final int REQ_SAVE = 2;

    WebView web;
    ValueCallback<Uri[]> fileCallback;
    byte[] pendingSave;
    String failedUrl;
    boolean showingOffline;

    /** Sahifaga qo'shiladigan yordamchi: fayl saqlash, chop etish va nusxa olish ilova orqali ishlaydi */
    static final String HELPERS =
        "(function(){if(window.__satpro)return;window.__satpro=1;" +
        "var blobs={};var oc=URL.createObjectURL;" +
        "URL.createObjectURL=function(b){var u=oc.apply(URL,arguments);if(b instanceof Blob)blobs[u]=b;return u;};" +
        "function save(b,name){var r=new FileReader();r.onload=function(){var s=String(r.result);" +
        "SATProApp.saveFile(s.substring(s.indexOf(',')+1),name||'download',b.type||'application/octet-stream');};r.readAsDataURL(b);}" +
        "function grab(a){var h=a.href||'';if(!a.hasAttribute('download'))return false;" +
        "var name=a.getAttribute('download')||'download';" +
        "if(blobs[h]){save(blobs[h],name);return true;}" +
        "if(h.indexOf('data:')===0||h.indexOf('blob:')===0){fetch(h).then(function(x){return x.blob();}).then(function(b){save(b,name);});return true;}" +
        "return false;}" +
        "var ck=HTMLAnchorElement.prototype.click;" +
        "HTMLAnchorElement.prototype.click=function(){if(grab(this))return;return ck.apply(this,arguments);};" +
        "document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[download]');" +
        "if(a&&grab(a))e.preventDefault();},true);" +
        "window.print=function(){SATProApp.print(document.title||'SAT Pro');};" +
        "try{if(navigator.clipboard){navigator.clipboard.writeText=function(t){SATProApp.copy(String(t));return Promise.resolve();};}}catch(e){}" +
        "})();";

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(0xFF0B0F1A);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true); // progress brauzer xotirasida (localStorage) saqlanadi
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setUserAgentString(s.getUserAgentString() + " SATProApp/1.0");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        web.addJavascriptInterface(new Bridge(), "SATProApp");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());

        if (state != null && web.restoreState(state) != null) return;
        web.loadUrl(startUrl(getIntent()));
    }

    String startUrl(Intent intent) {
        Uri data = intent != null ? intent.getData() : null;
        if (data != null && HOST.equals(data.getHost())) return data.toString();
        return HOME;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent.getData() != null) web.loadUrl(startUrl(intent));
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush(); // kirish sessiyasi saqlanib qolsin
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    public void onBackPressed() {
        if (showingOffline) {
            finish();
        } else if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    boolean isOwn(Uri uri) {
        String scheme = uri.getScheme();
        return ("https".equals(scheme) || "http".equals(scheme)) && HOST.equals(uri.getHost());
    }

    /** Begona havolalar (Telegram, pochta, boshqa saytlar) — tegishli ilovada yoki brauzerda */
    boolean openExternal(String url) {
        try {
            Intent intent = url.startsWith("intent:")
                ? Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                : new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "Havolani ochib bo'lmadi", Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    void showOffline(String url) {
        failedUrl = url;
        showingOffline = true;
        String html = "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
            "<style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0f1a;" +
            "color:#e8ecf5;font-family:sans-serif;text-align:center;padding:24px;box-sizing:border-box}" +
            "h1{font-size:22px;margin:0 0 8px}p{color:#9aa3b8;margin:0 0 24px;line-height:1.5}" +
            "button{background:#f1cf8b;color:#0b0f1a;border:0;border-radius:999px;padding:14px 28px;font-size:16px;font-weight:600}</style>" +
            "</head><body><div><h1>Internet yo'q</h1>" +
            "<p>Internetga ulaning (Wi-Fi yoki mobil internet) va qayta urining.<br>Нет подключения к интернету.</p>" +
            "<button onclick='SATProApp.retry()'>Qayta urinish</button></div></body></html>";
        web.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
    }

    class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return route(request.getUrl());
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return route(Uri.parse(url));
        }

        boolean route(Uri uri) {
            if (isOwn(uri)) return false;
            String scheme = uri.getScheme();
            if ("about".equals(scheme) || "data".equals(scheme) || "blob".equals(scheme)) return false;
            return openExternal(uri.toString());
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            if (url != null && url.startsWith("http")) showingOffline = false;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            if (url != null && url.startsWith("http")) view.evaluateJavascript(HELPERS, null);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) showOffline(request.getUrl().toString());
        }

        @SuppressWarnings("deprecation")
        @Override
        public void onReceivedError(WebView view, int code, String description, String url) {
            if (android.os.Build.VERSION.SDK_INT < 23) showOffline(url);
        }
    }

    class Chrome extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            Intent intent = params.createIntent();
            intent.setType("*/*"); // ba'zi telefonlarda .json turi tanilmaydi
            try {
                startActivityForResult(intent, REQ_FILE);
            } catch (ActivityNotFoundException e) {
                fileCallback = null;
                return false;
            }
            return true;
        }
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == REQ_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            fileCallback = null;
        } else if (request == REQ_SAVE) {
            byte[] bytes = pendingSave;
            pendingSave = null;
            if (result != RESULT_OK || data == null || data.getData() == null || bytes == null) return;
            try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                out.write(bytes);
                Toast.makeText(this, "Saqlandi", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Saqlab bo'lmadi", Toast.LENGTH_SHORT).show();
            }
        }
    }

    /** Sahifadagi JavaScript chaqiradigan funksiyalar (`window.SATProApp`) */
    class Bridge {
        @JavascriptInterface
        public void saveFile(final String base64, final String name, final String mime) {
            runOnUiThread(new Runnable() {
                public void run() {
                    pendingSave = Base64.decode(base64, Base64.DEFAULT);
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(mime);
                    intent.putExtra(Intent.EXTRA_TITLE, name);
                    try {
                        startActivityForResult(intent, REQ_SAVE);
                    } catch (ActivityNotFoundException e) {
                        pendingSave = null;
                        Toast.makeText(MainActivity.this, "Saqlab bo'lmadi", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void print(final String title) {
            runOnUiThread(new Runnable() {
                public void run() {
                    PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (pm == null) return;
                    pm.print(title, web.createPrintDocumentAdapter(title), new PrintAttributes.Builder().build());
                }
            });
        }

        @JavascriptInterface
        public void copy(String text) {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("SAT Pro", text));
        }

        @JavascriptInterface
        public void retry() {
            runOnUiThread(new Runnable() {
                public void run() {
                    web.loadUrl(failedUrl != null ? failedUrl : HOME);
                }
            });
        }
    }
}
