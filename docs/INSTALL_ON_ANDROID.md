# How to Install CodeVerse on Android Device

## Option 1: Build APK (Easiest - Recommended)

AAB files cannot be installed directly. Build an APK instead:

```bash
# Build APK for direct installation
eas build --platform android --profile preview
```

This will:
- Build an APK file (not AAB)
- Can be installed directly on Android devices
- Uses production environment variables
- Perfect for testing before Play Store release

After build completes:
1. Download the APK from the Expo dashboard or link provided
2. Transfer to your Android device
3. Enable "Install from Unknown Sources" in Android settings
4. Tap the APK file to install

## Option 2: Convert AAB to APK (Advanced)

If you already have the AAB file, convert it to APK:

### Prerequisites
- Download [bundletool](https://github.com/google/bundletool/releases)
- Java JDK installed

### Steps

1. **Download bundletool:**
   ```bash
   # Download bundletool.jar from GitHub releases
   ```

2. **Convert AAB to APK:**
   ```bash
   java -jar bundletool.jar build-apks \
     --bundle=your-app.aab \
     --output=your-app.apks \
     --mode=universal
   ```

3. **Extract APK:**
   ```bash
   # The .apks file is a zip, extract it
   unzip your-app.apks
   # Find universal.apk inside
   ```

4. **Install on device:**
   - Transfer `universal.apk` to your Android device
   - Enable "Install from Unknown Sources"
   - Tap to install

## Option 3: Use EAS Internal Distribution

For easier testing with multiple devices:

```bash
# Build with internal distribution
eas build --platform android --profile preview --non-interactive
```

Then share the download link with testers - they can install directly from the link.

## Quick Install Steps (APK)

1. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```

2. **Download APK** from Expo dashboard or terminal link

3. **On Android device:**
   - Open Settings → Security
   - Enable "Unknown Sources" or "Install Unknown Apps"
   - Transfer APK to device (USB, email, cloud storage)
   - Open file manager → Tap APK → Install

4. **Launch app** - You'll see the dark splash screen immediately!

## Troubleshooting

### "App not installed" error
- Check Android version compatibility
- Ensure "Unknown Sources" is enabled
- Try uninstalling any previous version first

### Can't find APK
- Check Expo dashboard → Builds → Download
- Or use the link provided in terminal after build

## Notes

- **AAB files** are for Play Store only (can't install directly)
- **APK files** can be installed directly on devices
- **Preview profile** builds APK with production settings
- **Production profile** builds AAB for Play Store submission
