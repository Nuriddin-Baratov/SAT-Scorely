#!/usr/bin/env bash
# SAT Pro Android ilovasini (APK) yig'ish. Ishga tushirish: bash android/build.sh
# Kerak: JDK 17 va Android SDK (platform 34, build-tools 34.0.0).
# Joylashuvi ANDROID_TOOLS bilan o'zgartiriladi (standart: ~/.android-build-tools).
set -euo pipefail

cd "$(dirname "$0")"
TOOLS="${ANDROID_TOOLS:-$HOME/.android-build-tools}"
BT="$TOOLS/sdk/build-tools/34.0.0"
ANDROID_JAR="$TOOLS/sdk/platforms/android-34/android.jar"
export JAVA_HOME="$TOOLS/jdk"
export PATH="$JAVA_HOME/bin:$PATH"

# Har bir yangi versiyada oshiring (telefon yangilanishni faqat kattaroq raqam bilan qabul qiladi)
VERSION_CODE=1
VERSION_NAME="1.0"

KEYSTORE=keystore/satpro-release.jks
PROPS=keystore/keystore.properties

rm -rf build && mkdir -p build/res build/gen build/classes build/dex dist

# 1. Resurslar (+ saytdagi ikonka)
cp -r res/. build/res/
mkdir -p build/res/mipmap-xxxhdpi
cp ../public/icon-192.png build/res/mipmap-xxxhdpi/ic_launcher.png
"$BT/aapt2" compile --dir build/res -o build/res.zip
"$BT/aapt2" link -o build/base.apk -I "$ANDROID_JAR" --manifest AndroidManifest.xml \
  --java build/gen --min-sdk-version 21 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" build/res.zip

# 2. Java kodi → DEX
javac -encoding UTF-8 -nowarn -Xlint:-options -source 1.8 -target 1.8 -bootclasspath "$ANDROID_JAR" -d build/classes \
  $(find src build/gen -name '*.java')
"$BT/d8.bat" --release --min-api 21 --lib "$ANDROID_JAR" --output build/dex $(find build/classes -name '*.class')

# 3. APK ga qo'shish, tekislash
cp build/base.apk build/unsigned.apk
(cd build/dex && "$BT/aapt" add ../unsigned.apk classes.dex >/dev/null)
"$BT/zipalign" -p -f 4 build/unsigned.apk build/aligned.apk

# 4. Imzo kaliti (bir marta yaratiladi — YO'QOTMANG: yangilanishlar faqat shu kalit bilan o'rnatiladi)
if [ ! -f "$KEYSTORE" ]; then
  mkdir -p keystore
  PASS=$(od -An -tx1 -N16 /dev/urandom | tr -d ' \n')
  keytool -genkeypair -keystore "$KEYSTORE" -alias satpro -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$PASS" -keypass "$PASS" -dname "CN=SAT Pro, O=SAT Pro, C=UZ" >/dev/null 2>&1
  printf 'storePassword=%s\nkeyAlias=satpro\n' "$PASS" > "$PROPS"
  echo "Yangi imzo kaliti yaratildi: android/$KEYSTORE (zaxira nusxasini saqlang!)"
fi
PASS=$(grep '^storePassword=' "$PROPS" | cut -d= -f2)

"$BT/apksigner.bat" sign --ks "$KEYSTORE" --ks-key-alias satpro --ks-pass "pass:$PASS" --key-pass "pass:$PASS" \
  --out dist/SAT-Pro.apk build/aligned.apk
"$BT/apksigner.bat" verify dist/SAT-Pro.apk

echo "Tayyor: android/dist/SAT-Pro.apk ($(du -h dist/SAT-Pro.apk | cut -f1))"
