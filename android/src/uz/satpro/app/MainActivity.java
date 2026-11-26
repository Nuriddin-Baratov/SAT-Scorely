package uz.satpro.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Locale;

/**
 * SAT Pro — internetdagi saytni (Vercel) to'liq ekranda ochadigan ilova.
 * Kompyuter yoki lokal Wi-Fi shart emas: istalgan internet (mobil yoki Wi-Fi) yetarli.
 */
public class MainActivity extends Activity {
    static final String HOST = "sat-scorely.vercel.app";
    static final String HOME = "https://" + HOST + "/";
    static final int REQ_FILE = 1;
    static final int REQ_SAVE = 2;
    /** Mikrofon ruxsati: nutqni tanish uchun / sahifadagi ovoz yozish uchun */
    static final int REQ_MIC_LISTEN = 3;
    static final int REQ_MIC_WEB = 4;

    WebView web;
    ValueCallback<Uri[]> fileCallback;
    byte[] pendingSave;
    String failedUrl;
    boolean showingOffline;

    // Ovoz: WebView'da speechSynthesis va SpeechRecognition yo'q — tizim xizmatlari ishlatiladi
    TextToSpeech tts;
    boolean ttsReady;
    SpeechRecognizer recognizer;
    String listenId;
    String pendingListenId;
    PermissionRequest pendingWebPermission;

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
        // Status bar va pastki panel rangi — sahifa mavzusi (yorug'/qorong'i) bo'yicha
        "function bars(){try{var c=getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();" +
        "if(c)SATProApp.setBars(c);}catch(e){}}" +
        "bars();setTimeout(bars,300);" +
        "new MutationObserver(bars).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-theme','style']});" +
        "try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',bars);}catch(e){}" +
        "})();";

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        int bg = getResources().getColor(R.color.bg);
        applyBars(bg);
        web = new WebView(this);
        web.setBackgroundColor(bg);
        // Ilova hissi: chetdagi "rezina" effekti va aylantirish chiziqlari yo'q
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        // Barmoq bilan kattalashtirish o'chiq; telefondagi katta shrift sozlamasi sahifani buzmasin
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setDomStorageEnabled(true); // progress brauzer xotirasida (localStorage) saqlanadi
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setUserAgentString(s.getUserAgentString() + " SATProApp/1.0");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        web.addJavascriptInterface(new Bridge(), "SATProApp");
        initTts();
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());

        if (state != null && web.restoreState(state) != null) return;
        web.loadUrl(startUrl(getIntent()));
    }

    /** Status bar va navigatsiya paneli: fon rangi + ikonkalar (yorug' fonda qorong'i) */
    void applyBars(int color) {
        Window w = getWindow();
        w.setStatusBarColor(color);
        w.setNavigationBarColor(color);
        if (Build.VERSION.SDK_INT >= 23) {
            double lum = (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color)) / 255;
            int flags = w.getDecorView().getSystemUiVisibility();
            int light = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26) light |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            flags = lum > 0.6 ? (flags | light) : (flags & ~light);
            w.getDecorView().setSystemUiVisibility(flags);
        }
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
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        if (recognizer != null) recognizer.destroy();
        super.onDestroy();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (tts != null) tts.stop();
        if (recognizer != null) recognizer.cancel();
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
            "<style>:root{color-scheme:light dark}" +
            "body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#fff;" +
            "color:#14141c;font-family:sans-serif;text-align:center;padding:24px;box-sizing:border-box}" +
            "h1{font-size:22px;margin:0 0 8px}p{color:#6b6b78;margin:0 0 24px;line-height:1.5}" +
            "button{background:#5b4cf5;color:#fff;border:0;border-radius:999px;padding:14px 28px;font-size:16px;font-weight:600}" +
            "@media (prefers-color-scheme:dark){body{background:#101018;color:#ececf3}p{color:#9a9aab}button{background:#7a6bff}}</style>" +
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

        /** Sahifa mikrofon so'rasa (Speaking: ovoz yozish) — faqat o'z saytimizga, faqat audio */
        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(new Runnable() {
                public void run() {
                    boolean own = request.getOrigin() != null && HOST.equals(request.getOrigin().getHost());
                    boolean audio = false;
                    for (String r : request.getResources()) if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) audio = true;
                    if (!own || !audio) {
                        request.deny();
                        return;
                    }
                    if (hasMic()) {
                        request.grant(new String[] { PermissionRequest.RESOURCE_AUDIO_CAPTURE });
                        return;
                    }
                    if (pendingWebPermission != null) pendingWebPermission.deny();
                    pendingWebPermission = request;
                    requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, REQ_MIC_WEB);
                }
            });
        }
    }

    // ---------------- Ovoz (TTS va nutqni tanish) ----------------

    /** Sahifaga natija: window.__satproSpeech(id, tur, matn) */
    void speechEvent(final String id, final String type, final String payload) {
        if (id == null) return;
        final String js = "window.__satproSpeech&&window.__satproSpeech(" + JSONObject.quote(id) + "," + JSONObject.quote(type) + ","
            + JSONObject.quote(payload == null ? "" : payload) + ")";
        runOnUiThread(new Runnable() {
            public void run() {
                web.evaluateJavascript(js, null);
            }
        });
    }

    void initTts() {
        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            public void onInit(int status) {
                if (status != TextToSpeech.SUCCESS) return;
                int lang = tts.setLanguage(Locale.US);
                ttsReady = lang != TextToSpeech.LANG_MISSING_DATA && lang != TextToSpeech.LANG_NOT_SUPPORTED;
                if (!ttsReady) ttsReady = tts.setLanguage(Locale.ENGLISH) >= TextToSpeech.LANG_AVAILABLE;
            }
        });
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            public void onStart(String id) {}
            public void onDone(String id) { speechEvent(id, "end", ""); }
            @SuppressWarnings("deprecation")
            public void onError(String id) { speechEvent(id, "error", "tts"); }
            @Override
            public void onStop(String id, boolean interrupted) { speechEvent(id, "end", ""); }
        });
    }

    boolean hasMic() {
        return Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    void startListening(final String id) {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            speechEvent(id, "error", "unsupported");
            return;
        }
        if (recognizer == null) recognizer = SpeechRecognizer.createSpeechRecognizer(this);
        else recognizer.cancel();
        listenId = id;
        recognizer.setRecognitionListener(new RecognitionListener() {
            String best(Bundle b) {
                ArrayList<String> list = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                return list == null || list.isEmpty() ? "" : list.get(0);
            }
            public void onReadyForSpeech(Bundle params) {}
            public void onBeginningOfSpeech() {}
            public void onRmsChanged(float rms) {}
            public void onBufferReceived(byte[] buffer) {}
            public void onEndOfSpeech() {}
            public void onEvent(int type, Bundle params) {}
            public void onPartialResults(Bundle partial) {
                String text = best(partial);
                if (!text.isEmpty() && id.equals(listenId)) speechEvent(id, "partial", text);
            }
            public void onResults(Bundle results) {
                if (!id.equals(listenId)) return;
                listenId = null;
                speechEvent(id, "result", best(results));
            }
            public void onError(int error) {
                if (!id.equals(listenId)) return;
                listenId = null;
                String code = error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS ? "permission"
                    : error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT ? "no-speech"
                    : error == SpeechRecognizer.ERROR_NETWORK || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT ? "network" : "error";
                speechEvent(id, "error", code);
            }
        });
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
        recognizer.startListening(intent);
    }

    @Override
    public void onRequestPermissionsResult(int request, String[] permissions, int[] results) {
        boolean granted = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
        if (request == REQ_MIC_LISTEN) {
            String id = pendingListenId;
            pendingListenId = null;
            if (granted) startListening(id);
            else speechEvent(id, "error", "permission");
        } else if (request == REQ_MIC_WEB && pendingWebPermission != null) {
            if (granted) pendingWebPermission.grant(new String[] { PermissionRequest.RESOURCE_AUDIO_CAPTURE });
            else pendingWebPermission.deny();
            pendingWebPermission = null;
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
        public void setBars(final String css) {
            runOnUiThread(new Runnable() {
                public void run() {
                    try {
                        String hex = css.trim();
                        if (hex.length() == 4 && hex.startsWith("#")) { // #abc → #aabbcc
                            hex = "#" + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2) + hex.charAt(3) + hex.charAt(3);
                        }
                        applyBars(Color.parseColor(hex));
                    } catch (Exception ignored) {
                        // rang hex bo'lmasa — joriy rang qoladi
                    }
                }
            });
        }

        @JavascriptInterface
        public void speak(final String id, final String text, final float rate) {
            if (!ttsReady) {
                speechEvent(id, "error", "tts");
                return;
            }
            tts.setSpeechRate(Math.max(0.5f, Math.min(2f, rate)));
            if (tts.speak(text, TextToSpeech.QUEUE_FLUSH, new Bundle(), id) != TextToSpeech.SUCCESS) speechEvent(id, "error", "tts");
        }

        @JavascriptInterface
        public void stopSpeak() {
            if (tts != null) tts.stop();
        }

        @JavascriptInterface
        public void listen(final String id, final String lang) {
            runOnUiThread(new Runnable() {
                public void run() {
                    if (hasMic()) {
                        startListening(id);
                        return;
                    }
                    pendingListenId = id;
                    requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, REQ_MIC_LISTEN);
                }
            });
        }

        @JavascriptInterface
        public void stopListen() {
            runOnUiThread(new Runnable() {
                public void run() {
                    if (recognizer != null) recognizer.stopListening();
                }
            });
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
