plugins {
  id("com.android.application")
  id("kotlin-android")
  id("kotlin-android-extensions")
  id("kotlin-kapt")
  id("com.google.gms.google-services")
  id("com.google.firebase.crashlytics")
  id("dagger.hilt.android.plugin")
  id("androidx.navigation.safeargs.kotlin")
  id("com.ncorti.ktfmt.gradle") version "0.5.0"
  id("com.github.ben-manes.versions") version "0.38.0"
}

android {
  compileSdkVersion(30)
  defaultConfig {
    applicationId = "com.microsoft.research.karya"
    minSdkVersion(21)
    targetSdkVersion(30)
    multiDexEnabled = true
    versionCode = 25
    versionName = "1"
    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    vectorDrawables.useSupportLibrary = true
  }
  buildTypes {
    named("release") {
      isMinifyEnabled = false
      setProguardFiles(
        listOf(
          getDefaultProguardFile("proguard-android-optimize.txt"),
          "proguard-rules.pro"
        )
      )
    }
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
  }
  kotlinOptions {
    jvmTarget = "1.8"
  }
  lintOptions {
    isAbortOnError = false
  }
  androidExtensions {
    isExperimental = true
  }
  buildFeatures {
    dataBinding = true
    viewBinding = true
  }
  packagingOptions {
    exclude("META-INF/DEPENDENCIES")
    exclude("META-INF/LICENSE")
    exclude("META-INF/LICENSE.txt")
    exclude("META-INF/license.txt")
    exclude("META-INF/NOTICE")
    exclude("META-INF/NOTICE.txt")
    exclude("META-INF/notice.txt")
    exclude("META-INF/ASL2.0")
    exclude("META-INF/*.kotlin_module")
  }
  flavorDimensions("size", "study")
  productFlavors {
    create ("mit") {
      dimension = "study"
      applicationIdSuffix = "mit2022"
    }
    create ("default") {
      dimension = "study"
    }
    create("large") {
      dimension = "size"
      applicationIdSuffix = "large"
    }
    create("standard") {
      dimension = "size"
    }
  }
}

ktfmt {
  googleStyle()

  maxWidth.set(120)
  removeUnusedImports.set(true)
}

tasks.register<com.ncorti.ktfmt.gradle.tasks.KtfmtFormatTask>("ktfmtPrecommit") {
  source = project.fileTree(rootDir)
  include("**/*.kt")
}

dependencyLocking {
  lockAllConfigurations()
}

dependencies {

  implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.jar"))))

  implementation(Dependencies.AndroidX.appcompat)
  implementation(Dependencies.AndroidX.constraintLayout)
  implementation(Dependencies.AndroidX.datastorePrefs)
  implementation(Dependencies.AndroidX.fragmentKtx)
  implementation(Dependencies.AndroidX.legacy_support)
  implementation(Dependencies.AndroidX.multidex)
  implementation(Dependencies.AndroidX.work_runtime)
  implementation(Dependencies.AndroidX.work_multiprocess)

  implementation(Dependencies.AndroidX.Lifecycle.common)
  implementation(Dependencies.AndroidX.Lifecycle.extensions)
  implementation(Dependencies.AndroidX.Lifecycle.livedataKtx)
  implementation(Dependencies.AndroidX.Lifecycle.runtimeKtx)
  implementation(Dependencies.AndroidX.Lifecycle.saved_state)
  implementation(Dependencies.AndroidX.Lifecycle.viewModelKtx)

  implementation(Dependencies.AndroidX.Navigation.fragmentKtx)
  implementation(Dependencies.AndroidX.Navigation.uiKtx)

  implementation(Dependencies.AndroidX.Room.roomKtx)
  implementation(Dependencies.AndroidX.Room.roomRuntime)

  implementation(Dependencies.AndroidX.Navigation.fragmentKtx)
  implementation(Dependencies.AndroidX.Navigation.uiKtx)

  kapt(Dependencies.AndroidX.Room.roomCompiler)

  implementation(Dependencies.Google.gson)
  implementation(Dependencies.Google.material)

  implementation(platform(Dependencies.Google.Firebase.bom))
  implementation(Dependencies.Google.Firebase.crashlytics)
  implementation(Dependencies.Google.Firebase.analytics)

  implementation(Dependencies.AndroidX.Hilt.dagger)
  implementation(Dependencies.AndroidX.Hilt.hiltNavigationFragment)

  kapt(Dependencies.AndroidX.Hilt.daggerCompiler)
  kapt(Dependencies.AndroidX.Hilt.daggerHiltCompiler)

  implementation(Dependencies.Kotlin.Coroutines.core)
  implementation(Dependencies.Kotlin.Coroutines.coroutines)

  implementation(Dependencies.ThirdParty.circleImageView)
  implementation(Dependencies.ThirdParty.glide)
  implementation(Dependencies.ThirdParty.okhttp)
  implementation(Dependencies.ThirdParty.loggingInterceptor)
  implementation(Dependencies.ThirdParty.stateProgressBar)

  implementation(Dependencies.ThirdParty.Retrofit.retrofit)
  implementation(Dependencies.ThirdParty.Retrofit.gsonConverter)

  debugImplementation(Dependencies.ThirdParty.debugDB)

  implementation("com.mcxiaoke.volley:library:1.0.19")
  implementation("com.nex3z:flow-layout:1.3.4-beta01")

  // Scaled dp and sp implemenations
  implementation("com.intuit.ssp:ssp-android:1.0.6")
  implementation("com.intuit.sdp:sdp-android:1.0.6")

  // Zoomable image
  implementation("com.jsibbold:zoomage:1.3.1")

  // Themed button toggle group
  implementation("nl.bryanderidder:themed-toggle-button-group:1.3.4")

  // Camera view
  implementation("com.otaliastudios:cameraview:2.7.2")

  // Android rating bar
  implementation("me.zhanghai.android.materialratingbar:library:1.3.1")

  // Video data collection
  "largeImplementation" ("com.github.HamidrezaAmz:MagicalExoPlayer:2.0.6")
  "largeImplementation" ("com.google.android.gms:play-services-mlkit-face-detection:16.2.0")
  "largeImplementation" ("com.google.mlkit:face-detection:16.1.2")
  "largeImplementation" ("com.github.fishwjy:VideoCompressor:master-SNAPSHOT")

}
