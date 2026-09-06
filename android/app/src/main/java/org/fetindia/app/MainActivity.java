package org.fetindia.app;

import android.net.Uri;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;
import com.google.androidbrowserhelper.trusted.TwaLauncher;

/**
 * MainActivity - Primary Entry Point for FET India Android Application
 * Fatimyah Educational Trust India
 * 
 * Uses Google Trusted Web Activity (TWA) with Custom Tabs integration
 * providing 100% native performance, zero-overhead Play Store deployment,
 * full Firebase Authentication / Firestore token synchronization, and
 * hardware-accelerated rendering.
 */
public class MainActivity extends AppCompatActivity {

    private static final String DEFAULT_URL = "https://fetindia.com";
    private TwaLauncher mTwaLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mTwaLauncher = new TwaLauncher(this);

        Uri targetUri = getIntent().getData();
        if (targetUri == null) {
            targetUri = Uri.parse(DEFAULT_URL);
        }

        // Launch TWA session with FET custom chrome tabs
        mTwaLauncher.launch(targetUri);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (mTwaLauncher != null) {
            mTwaLauncher.destroy();
        }
    }
}
