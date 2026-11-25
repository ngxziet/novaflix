package io.github.ngxziet.novaflix;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.window.OnBackInvokedDispatcher;

import java.util.Arrays;

public final class MainActivity extends Activity {
    private static final int PICK_SUBTITLE = 1;

    private FrameLayout root;
    private WebView webView;
    private View errorPanel;
    private Uri home;
    private Uri retryUrl;
    private View fullscreenView;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle savedState) {
        super.onCreate(savedState);
        setContentView(R.layout.activity_main);
        root = findViewById(R.id.root);
        webView = findViewById(R.id.web_view);
        errorPanel = findViewById(R.id.load_error_panel);
        home = Uri.parse(getString(R.string.home_url));
        retryUrl = home;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((view, windowInsets) -> {
                int types = WindowInsets.Type.displayCutout();
                if (fullscreenView == null) {
                    types |= WindowInsets.Type.systemBars() | WindowInsets.Type.ime();
                }
                Insets insets = windowInsets.getInsets(types);
                view.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                return WindowInsets.CONSUMED;
            });
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::navigateBack);
        }

        configureWebView();
        findViewById(R.id.retry).setOnClickListener(view -> webView.loadUrl(retryUrl.toString()));
        if (savedState == null || webView.restoreState(savedState) == null) {
            webView.loadUrl(home.toString());
        }
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        webView.setBackgroundColor(getColor(R.color.background));
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (!request.isForMainFrame() || isNovaFlixUrl(url)) return false;

                if (request.hasGesture() && "https".equalsIgnoreCase(url.getScheme())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, url));
                    } catch (ActivityNotFoundException ignored) {
                        // Leave the current page visible when there is no external browser.
                    }
                }
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                Uri page = Uri.parse(url);
                if (isNovaFlixUrl(page)) retryUrl = page;
                errorPanel.setVisibility(View.GONE);
                view.setVisibility(View.VISIBLE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                showLoadError(request);
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (response.getStatusCode() >= 500) showLoadError(request);
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullscreenView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                fullscreenView = view;
                fullscreenCallback = callback;
                view.setBackgroundColor(Color.BLACK);
                webView.setVisibility(View.INVISIBLE);
                root.addView(view, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                setFullscreenBars(true);
            }

            @Override
            public void onHideCustomView() {
                hideFullscreen();
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), PICK_SUBTITLE);
                } catch (ActivityNotFoundException ignored) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                }
                return true;
            }
        });
    }

    private boolean isNovaFlixUrl(Uri url) {
        return "https".equalsIgnoreCase(url.getScheme())
                && home.getHost().equalsIgnoreCase(url.getHost())
                && (url.getPort() == -1 || url.getPort() == 443)
                && url.getUserInfo() == null;
    }

    private void showLoadError(WebResourceRequest request) {
        if (!request.isForMainFrame() || !isNovaFlixUrl(request.getUrl())) return;
        retryUrl = request.getUrl();
        hideFullscreen();
        webView.setVisibility(View.INVISIBLE);
        errorPanel.setVisibility(View.VISIBLE);
    }

    private void hideFullscreen() {
        if (fullscreenView == null) return;
        root.removeView(fullscreenView);
        fullscreenView = null;
        WebChromeClient.CustomViewCallback callback = fullscreenCallback;
        fullscreenCallback = null;
        webView.setVisibility(View.VISIBLE);
        setFullscreenBars(false);
        callback.onCustomViewHidden();
    }

    private void setFullscreenBars(boolean fullscreen) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                if (fullscreen) {
                    controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                    controller.hide(WindowInsets.Type.systemBars());
                } else {
                    controller.show(WindowInsets.Type.systemBars());
                }
            }
            root.requestApplyInsets();
        } else {
            getWindow().getDecorView().setSystemUiVisibility(fullscreen
                    ? View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    : 0);
        }
    }

    @Override
    public void onBackPressed() {
        navigateBack();
    }

    private void navigateBack() {
        if (fullscreenView != null) hideFullscreen();
        else if (webView.canGoBack()) webView.goBack();
        else finish();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PICK_SUBTITLE || fileCallback == null) return;

        Uri[] selected = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        Uri[] files = selected == null ? null : Arrays.stream(selected)
                .filter(uri -> uri != null && "content".equals(uri.getScheme()))
                .toArray(Uri[]::new);
        fileCallback.onReceiveValue(files != null && files.length > 0 ? files : null);
        fileCallback = null;
    }

    @Override
    protected void onStart() {
        super.onStart();
        webView.resumeTimers();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        webView.onPause();
        super.onPause();
    }

    @Override
    protected void onStop() {
        webView.pauseTimers();
        super.onStop();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        hideFullscreen();
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        root.removeView(webView);
        webView.destroy();
        super.onDestroy();
    }
}
